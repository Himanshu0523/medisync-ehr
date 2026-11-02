import User from './user.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { ROLES } from '../auth/auth.constants.js';

export const getAllUsers = async (query = {}, currentUser = null) => {
    if (!currentUser) {
        throw new ApiError(401, 'Authentication required');
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Number(query.limit) || 20);
    const filter = { deletedAt: null };
    if (query.role) filter.role = query.role;
    if (query.status) filter.status = query.status;

    if (currentUser.role === ROLES.SUPER_ADMIN) {
        if (query.hospitalId) filter.hospitalId = query.hospitalId;
    } else if (currentUser.role === ROLES.HOSPITAL_ADMIN || currentUser.role === ROLES.ADMIN) {
        if (!currentUser.hospitalId) {
            throw new ApiError(403, 'Hospital Admin has no assigned hospital');
        }
        filter.hospitalId = currentUser.hospitalId;
    } else {
        throw new ApiError(403, 'Access denied');
    }

    const [users, total] = await Promise.all([
        User.find(filter).select('-password').skip((page - 1) * limit).limit(limit),
        User.countDocuments(filter),
    ]);
    return { users, total, page, pages: Math.ceil(total / limit) };
};

export const getUserById = async (id, currentUser) => {
    if (!currentUser) {
        throw new ApiError(401, 'Authentication required');
    }

    const isSuperAdmin = currentUser.role === ROLES.SUPER_ADMIN;
    const isHospitalAdmin = [ROLES.HOSPITAL_ADMIN, ROLES.ADMIN].includes(currentUser.role);
    const isSelf = currentUser._id.toString() === id.toString();

    if (!isSuperAdmin && !isHospitalAdmin && !isSelf) {
        throw new ApiError(403, 'Access denied');
    }

    const user = await User.findOne({ _id: id, deletedAt: null }).select('-password');
    if (!user) throw new ApiError(404, 'User not found');

    if (isHospitalAdmin && !isSuperAdmin && !isSelf) {
        if (!currentUser.hospitalId || !user.hospitalId || user.hospitalId.toString() !== currentUser.hospitalId.toString()) {
            throw new ApiError(403, 'Access denied: Cannot access users from another hospital');
        }
    }

    return user;
};

export const updateUser = async (id, updates, currentUser) => {
    if (!currentUser) {
        throw new ApiError(401, 'Authentication required');
    }

    const targetUser = await User.findOne({ _id: id, deletedAt: null });
    if (!targetUser) throw new ApiError(404, 'User not found');

    const isSuperAdmin = currentUser.role === ROLES.SUPER_ADMIN;
    const isHospitalAdmin = [ROLES.HOSPITAL_ADMIN, ROLES.ADMIN].includes(currentUser.role);
    const isSelf = currentUser._id.toString() === id.toString();

    if (!isSuperAdmin && !isHospitalAdmin && !isSelf) {
        throw new ApiError(403, 'Forbidden');
    }

    const safeUpdates = { ...updates };
    delete safeUpdates.password;
    delete safeUpdates.deletedAt;

    if (isHospitalAdmin && !isSuperAdmin) {
        if (targetUser.role === ROLES.SUPER_ADMIN) {
            throw new ApiError(403, 'Hospital Admin cannot modify a Super Admin account');
        }

        if (!currentUser.hospitalId || !targetUser.hospitalId || targetUser.hospitalId.toString() !== currentUser.hospitalId.toString()) {
            throw new ApiError(403, 'Access denied: Cannot modify users from another hospital');
        }

        if (safeUpdates.role === ROLES.SUPER_ADMIN) {
            throw new ApiError(403, 'Hospital Admin cannot promote an account to Super Admin');
        }

        if (safeUpdates.role && safeUpdates.role !== targetUser.role) {
            throw new ApiError(403, 'Hospital Admin cannot change user roles');
        }

        if (safeUpdates.hospitalId && safeUpdates.hospitalId.toString() !== targetUser.hospitalId.toString()) {
            throw new ApiError(403, 'Hospital Admin cannot reassign user hospital');
        }

        delete safeUpdates.role;
        delete safeUpdates.hospitalId;
        delete safeUpdates.status;
        delete safeUpdates.emailVerified;
        delete safeUpdates.failedLoginAttempts;
        delete safeUpdates.lockUntil;
    } else if (isSelf && !isSuperAdmin) {
        delete safeUpdates.role;
        delete safeUpdates.hospitalId;
        delete safeUpdates.status;
        delete safeUpdates.emailVerified;
        delete safeUpdates.failedLoginAttempts;
        delete safeUpdates.lockUntil;
    }

    const user = await User.findByIdAndUpdate(id, safeUpdates, { new: true, runValidators: true }).select('-password');
    return user;
};

export const deleteUser = async (id, currentUser) => {
    if (!currentUser) {
        throw new ApiError(401, 'Authentication required');
    }

    const isSuperAdmin = currentUser.role === ROLES.SUPER_ADMIN;
    const isHospitalAdmin = [ROLES.HOSPITAL_ADMIN, ROLES.ADMIN].includes(currentUser.role);

    if (!isSuperAdmin && !isHospitalAdmin) {
        throw new ApiError(403, 'Forbidden');
    }

    const targetUser = await User.findOne({ _id: id, deletedAt: null });
    if (!targetUser) throw new ApiError(404, 'User not found');

    if (isHospitalAdmin && !isSuperAdmin) {
        if (targetUser.role === ROLES.SUPER_ADMIN) {
            throw new ApiError(403, 'Hospital Admin cannot delete a Super Admin account');
        }

        if (!currentUser.hospitalId || !targetUser.hospitalId || targetUser.hospitalId.toString() !== currentUser.hospitalId.toString()) {
            throw new ApiError(403, 'Access denied: Cannot delete users from another hospital');
        }
    }

    targetUser.deletedAt = new Date();
    targetUser.status = 'inactive';
    await targetUser.save();
    return targetUser;
};