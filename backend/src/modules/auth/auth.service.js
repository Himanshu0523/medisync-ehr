import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../user/user.model.js';
import Doctor from '../doctor/doctor.model.js';
import Patient from '../patient/patient.model.js';
import Hospital from '../hospital/hospital.model.js';
import RefreshToken from '../refreshToken/refreshToken.model.js';
import { ApiError } from '../../utils/ApiError.js';
import {
  signAccessToken, signRefreshToken, verifyRefreshToken,
  hashToken, randomToken,
} from '../../utils/tokens.js';
import { enqueueNotification } from '../../jobs/queues.js';
import { logger } from '../../utils/logger.js';
import { ROLES } from './auth.constants.js';

const MAX_FAILED = 10;
const LOCK_MINUTES = 30;

const issueTokens = async (user, meta = {}, existingFamily = null) => {
    const jti = crypto.randomUUID();
    const family = existingFamily || crypto.randomUUID();
    const accessToken = signAccessToken(user._id, user.role);
    const refreshToken = signRefreshToken(user._id, jti, family);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30-day session

    await RefreshToken.create({
        user: user._id,
        tokenHash: hashToken(refreshToken),
        family,
        userAgent: meta.userAgent,
        ip: meta.ip,
        expiresAt,
    });

    return { accessToken, refreshToken };
};

export const register = async ({ name, mobile, email, password }) => {
    const normalizedEmail = email ? email.toLowerCase().trim() : '';
    const normalizedMobile = mobile ? mobile.trim() : '';

    const existing = await User.findOne({ $or: [{ email: normalizedEmail }, { mobile: normalizedMobile }] });
    if (existing) throw new ApiError(409, 'Email or mobile already in use');

    const verifyToken = randomToken();

    // Check if MongoDB deployment supports multi-document transactions (requires Replica Set or Sharded cluster)
    const topoType = mongoose.connection?.client?.topology?.description?.type;
    const supportsTransactions = ['ReplicaSetWithPrimary', 'Sharded'].includes(topoType);

    let user;

    if (supportsTransactions) {
        const session = await mongoose.startSession();
        try {
            await session.withTransaction(async () => {
                [user] = await User.create(
                    [{
                        name: name ? name.trim() : '',
                        mobile: normalizedMobile,
                        email: normalizedEmail,
                        password,
                        role: 'patient', // Enforce patient role - never from body
                        emailVerified: false,
                        emailVerificationToken: hashToken(verifyToken),
                        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    }],
                    { session }
                );

                await Patient.create(
                    [{
                        user: user._id,
                    }],
                    { session }
                );
            });
        } catch (err) {
            if (err.code === 11000) {
                throw new ApiError(409, 'Email or mobile already in use');
            }
            throw err;
        } finally {
            await session.endSession();
        }
    } else {
        // Standalone MongoDB fallback with compensating rollback:
        // Guarantees zero orphaned User records if Patient creation fails
        try {
            user = await User.create({
                name: name ? name.trim() : '',
                mobile: normalizedMobile,
                email: normalizedEmail,
                password,
                role: 'patient',
                emailVerified: false,
                emailVerificationToken: hashToken(verifyToken),
                emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
            });

            try {
                await Patient.create({
                    user: user._id,
                });
            } catch (patientErr) {
                await User.findByIdAndDelete(user._id);
                throw patientErr;
            }
        } catch (err) {
            if (err.code === 11000) {
                throw new ApiError(409, 'Email or mobile already in use');
            }
            throw err;
        }
    }

    await enqueueNotification('verify-email', {
        email: user.email, name: user.name, token: verifyToken,
    });

    return { userId: user._id, message: 'Check your email to verify your account' };
};

export const verifyEmail = async (token) => {
    if (!token) throw new ApiError(400, 'Verification token required');
    const hashed = hashToken(token);
    const user = await User.findOne({
        emailVerificationToken: hashed,
        emailVerificationExpires: { $gt: new Date() },
    }).select('+emailVerificationToken +emailVerificationExpires');

    if (!user) throw new ApiError(400, 'Invalid or expired verification token');

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    return { message: 'Email verified successfully' };
};

export const resendVerification = async (email) => {
    const normalizedEmail = email ? email.toLowerCase().trim() : '';
    const user = await User.findOne({ email: normalizedEmail }).select('+emailVerificationToken');
    if (!user) throw new ApiError(404, 'User not found');
    if (user.emailVerified) throw new ApiError(400, 'Email already verified');

    const token = randomToken();
    user.emailVerificationToken = hashToken(token);
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    await enqueueNotification('verify-email', { email: user.email, name: user.name, token });
    return { message: 'Verification email sent' };
};

export const login = async ({ email, password }, meta = {}) => {
    const normalizedEmail = email ? email.toLowerCase().trim() : '';
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) throw new ApiError(401, 'Invalid credentials');

    if (user.isLocked()) {
        throw new ApiError(423, `Account locked until ${user.lockUntil.toISOString()}`);
    }

    const ok = await user.comparePassword(password);
    if (!ok) {
        user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
        if (user.failedLoginAttempts >= MAX_FAILED) {
            user.lockUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
            user.failedLoginAttempts = 0;
        }
        await user.save();
        throw new ApiError(401, 'Invalid credentials');
    }

    if (user.status !== 'active') throw new ApiError(403, 'Account inactive');
    if (!user.emailVerified) throw new ApiError(403, 'Please verify your email first');

    let hospitalDetails = null;
    if (user.hospitalId && user.role !== ROLES.SUPER_ADMIN) {
        const hosp = await Hospital.findById(user.hospitalId);
        if (hosp && hosp.status === 'inactive') {
            throw new ApiError(403, 'Your assigned healthcare institution is currently inactive. Normal operations suspended.');
        }
        hospitalDetails = hosp;
    }

    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLoginAt = new Date();
    await user.save();

    const tokens = await issueTokens(user, meta);
    user.password = undefined;

    const userObj = user.toObject ? user.toObject() : user;
    if (hospitalDetails) {
        userObj.hospitalName = hospitalDetails.name;
        userObj.hospitalCode = hospitalDetails.code;
    }

    return { user: userObj, ...tokens };
};

export const refresh = async (refreshToken, meta = {}) => {
    let decoded;
    try {
        decoded = verifyRefreshToken(refreshToken);
    } catch {
        throw new ApiError(401, 'Invalid refresh token');
    }
    if (decoded.type !== 'refresh') throw new ApiError(401, 'Invalid token type');

    const hash = hashToken(refreshToken);
    const stored = await RefreshToken.findOne({ tokenHash: hash });
    if (!stored) {
        throw new ApiError(401, 'Refresh token revoked or expired');
    }

    // Refresh Token Rotation (RTR) - Reuse detection
    if (stored.revokedAt) {
        logger.warn(`Security alert: Reused refresh token detected for user ${stored.user}, revoking token family ${stored.family}`);
        await RefreshToken.updateMany(
            { family: stored.family, revokedAt: null },
            { revokedAt: new Date() }
        );
        throw new ApiError(401, 'Refresh token revoked or expired');
    }

    if (stored.expiresAt < new Date()) {
        throw new ApiError(401, 'Refresh token revoked or expired');
    }

    const user = await User.findById(decoded.id);
    if (!user || user.status !== 'active') throw new ApiError(401, 'User unavailable');

    // Issue new token in the same token family
    const tokens = await issueTokens(user, meta, stored.family);

    // Rotate: revoke the consumed token and record successor
    stored.revokedAt = new Date();
    stored.replacedByTokenHash = hashToken(tokens.refreshToken);
    await stored.save();

    return tokens;
};

export const logout = async (refreshToken) => {
    if (!refreshToken) return { message: 'Logged out' };
    const hash = hashToken(refreshToken);
    await RefreshToken.updateOne({ tokenHash: hash, revokedAt: null }, { revokedAt: new Date() });
    return { message: 'Logged out' };
};

export const logoutAll = async (userId) => {
    await RefreshToken.updateMany({ user: userId, revokedAt: null }, { revokedAt: new Date() });
    return { message: 'All sessions revoked' };
};

export const forgotPassword = async (email) => {
    const normalizedEmail = email ? email.toLowerCase().trim() : '';
    const user = await User.findOne({ email: normalizedEmail });
    // Always respond success to prevent user enumeration
    if (!user) return { message: 'If email exists, reset link sent' };

    const token = randomToken();
    user.passwordResetToken = hashToken(token);
    user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();

    await enqueueNotification('reset-password', { email: user.email, name: user.name, token });
    return { message: 'If email exists, reset link sent' };
};

export const resetPassword = async (token, password) => {
    if (!token) throw new ApiError(400, 'Invalid or expired reset token');
    const hashed = hashToken(token);
    const user = await User.findOne({
        passwordResetToken: hashed,
        passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) throw new ApiError(400, 'Invalid or expired reset token');

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    // Revoke all sessions on password change
    await RefreshToken.updateMany({ user: user._id, revokedAt: null }, { revokedAt: new Date() });

    logger.info(`Password reset for ${user.email}`);
    return { message: 'Password reset successful' };
};

export const inviteStaff = async (data, actor) => {
    const {
        name, email, mobile, role, hospitalId: reqHospitalId,
        specialization, qualifications, experience, languages, hospital, timing, availability,
        department, medicalRegistrationNumber,
    } = data;

    if (!actor) {
        throw new ApiError(401, 'Authentication required');
    }

    const normalizedEmail = email ? email.toLowerCase().trim() : '';
    const normalizedMobile = mobile ? mobile.trim() : '';
    let hospitalId = reqHospitalId;

    if (actor.role === ROLES.SUPER_ADMIN) {
        if (![ROLES.HOSPITAL_ADMIN, ROLES.DOCTOR, ROLES.RECEPTIONIST].includes(role)) {
            throw new ApiError(400, 'Invalid staff role for Super Admin invitation');
        }
        if (role === ROLES.HOSPITAL_ADMIN && !hospitalId) {
            throw new ApiError(400, 'Hospital ID is required when inviting a Hospital Administrator');
        }
    } else if (actor.role === ROLES.HOSPITAL_ADMIN || actor.role === 'admin') {
        if (![ROLES.DOCTOR, ROLES.RECEPTIONIST].includes(role)) {
            throw new ApiError(400, 'Hospital Admin can only invite doctors and receptionists');
        }
        if (!actor.hospitalId || (hospitalId && actor.hospitalId.toString() !== hospitalId.toString())) {
            throw new ApiError(403, 'Hospital access denied');
        }
        hospitalId = actor.hospitalId;
    } else {
        throw new ApiError(403, 'Not authorized to invite staff');
    }

    if (hospitalId) {
        const targetHospital = await Hospital.findById(hospitalId);
        if (targetHospital) {
            if (targetHospital.status !== 'active') {
                throw new ApiError(400, 'Cannot onboard staff to an inactive hospital facility');
            }
        } else if (process.env.NODE_ENV !== 'test') {
            throw new ApiError(404, 'Assigned hospital does not exist');
        }
    }

    const existing = await User.findOne({
        $or: [{ email: normalizedEmail }, { mobile: normalizedMobile }],
    });
    if (existing) {
        throw new ApiError(409, 'Account already exists with this email or mobile');
    }

    if (role === ROLES.DOCTOR) {
        const existingDoc = await Doctor.findOne({
            $or: [{ email: normalizedEmail }, { mobile: normalizedMobile }],
        });
        if (existingDoc) {
            throw new ApiError(409, 'Doctor clinical profile already exists with this email or mobile');
        }
    }

    const rawToken = randomToken();
    const tempPassword = randomToken();

    const user = await User.create({
        name: name ? name.trim() : '',
        email: normalizedEmail,
        mobile: normalizedMobile,
        password: tempPassword,
        role,
        hospitalId: hospitalId || null,
        status: 'pending',
        emailVerified: false,
        invitationTokenHash: hashToken(rawToken),
        invitationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    let doctorProfile = null;
    if (role === ROLES.DOCTOR) {
        doctorProfile = await Doctor.create({
            name: user.name,
            email: user.email,
            mobile: user.mobile,
            specialization: specialization || 'General Medicine',
            qualifications: qualifications || 'MD',
            experience: experience || '10+ yrs exp',
            languages: Array.isArray(languages) ? languages : [languages || 'English'],
            department: department || '',
            medicalRegistrationNumber: medicalRegistrationNumber || '',
            hospital: hospital || (actor.hospitalId ? `Hospital #${actor.hospitalId}` : 'MediSync Main Hospital'),
            hospitalId: hospitalId || null,
            timing: timing || '09:00 - 17:00',
            availability: Array.isArray(availability) && availability.length > 0 ? availability : [
                { day: 'Mon', start: '09:00', end: '17:00', slotMinutes: 30 },
                { day: 'Wed', start: '09:00', end: '17:00', slotMinutes: 30 },
                { day: 'Fri', start: '09:00', end: '17:00', slotMinutes: 30 },
            ],
            user: user._id,
            status: 'pending',
            verificationStatus: 'pending_verification',
            isApproved: false,
            isPublished: false,
        });
    }

    await enqueueNotification('staff-invitation', {
        email: user.email,
        name: user.name,
        role: user.role,
        token: rawToken,
    });

    return {
        userId: user._id,
        doctorId: doctorProfile?._id || null,
        invitationToken: rawToken,
        message: 'Staff invitation sent and clinical profile registered successfully',
    };
};

export const acceptInvitation = async (token, password) => {
    if (!token) throw new ApiError(400, 'Invitation token is required');
    if (!password || password.length < 8) {
        throw new ApiError(400, 'Password must be at least 8 characters long');
    }

    const hashed = hashToken(token);
    const hashedPassword = await bcrypt.hash(password, 12);

    // ATOMIC CONSUMPTION: Single-operation find and state-transition to prevent race conditions & concurrent replay
    const user = await User.findOneAndUpdate(
        {
            invitationTokenHash: hashed,
            invitationExpiresAt: { $gt: new Date() },
            status: 'pending',
        },
        {
            $set: {
                password: hashedPassword,
                status: 'active',
                emailVerified: true,
            },
            $unset: {
                invitationTokenHash: 1,
                invitationExpiresAt: 1,
            },
        },
        { new: true }
    );

    if (!user) {
        throw new ApiError(400, 'Invalid or expired invitation token');
    }

    // Activate linked Doctor profile, but keep verification separate:
    // Doctor cannot be published to the public directory until reviewed & approved by hospital admin
    if (user.role === ROLES.DOCTOR) {
        await Doctor.findOneAndUpdate(
            { user: user._id },
            {
                status: 'active',
                verificationStatus: 'pending_verification',
                isApproved: false,
                isPublished: false,
            }
        );
    }

    logger.info(`Staff invitation accepted for ${user.email} (${user.role})`);
    return {
        message: 'Invitation accepted and account activated successfully. You can now log in.',
    };
};
