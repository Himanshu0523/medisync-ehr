import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError.js';
import Hospital from '../modules/hospital/hospital.model.js';
import Doctor from '../modules/doctor/doctor.model.js';
import { ROLES } from '../modules/auth/auth.constants.js';

export const HOSPITAL_STAFF_ROLES = [
  ROLES.HOSPITAL_ADMIN,
  ROLES.DOCTOR,
  ROLES.RECEPTIONIST,
  ROLES.ADMIN, // Backward-compatibility alias
];

/**
 * Validates hospital assignment and active status for a staff user.
 * Ensures Doctor.hospitalId and User.hospitalId consistency if role is doctor.
 * Returns frozen tenant context object.
 */
export const buildStaffTenantContext = async (user) => {
  const hospitalId = user.hospitalId;

  if (!hospitalId || !mongoose.isValidObjectId(hospitalId)) {
    throw new ApiError(
      403,
      'No valid hospital assignment found for this staff account'
    );
  }

  const hospital = await Hospital.findOne({
    _id: hospitalId,
    status: 'active',
    deletedAt: null,
  }).select('_id name code status');

  if (!hospital) {
    throw new ApiError(
      403,
      'Assigned hospital is inactive, suspended, or unavailable'
    );
  }

  // Ensure Doctor.hospitalId and User.hospitalId consistency where applicable
  if (user.role === ROLES.DOCTOR) {
    const doctorProfile = await Doctor.findOne({ user: user._id, deletedAt: null }).select('hospitalId');
    if (doctorProfile) {
      if (!doctorProfile.hospitalId) {
        throw new ApiError(
          403,
          'Doctor profile is missing authoritative hospital assignment'
        );
      }
      if (doctorProfile.hospitalId.toString() !== hospital._id.toString()) {
        throw new ApiError(
          403,
          'Doctor profile hospital assignment does not match user account hospital'
        );
      }
    }
  }

  return Object.freeze({
    scope: 'hospital',
    hospitalId: hospital._id,
    hospitalName: hospital.name,
    hospitalCode: hospital.code,
    actorId: user._id,
    role: user.role,
  });
};

/**
 * Resolves trusted tenant context for ANY authenticated user:
 * - Super Admin: scope 'platform', hospitalId null
 * - Patient: scope 'patient', hospitalId null (multi-hospital / global identity)
 * - Hospital Staff (hospital_admin, doctor, receptionist): scope 'hospital', verified hospitalId
 */
export const resolveTenantContext = async (req, res, next) => {
  try {
    if (!req.user) {
      return next();
    }

    if (req.user.role === ROLES.SUPER_ADMIN) {
      req.tenant = Object.freeze({
        scope: 'platform',
        hospitalId: null,
        hospitalName: null,
        hospitalCode: null,
        actorId: req.user._id,
        role: req.user.role,
      });
      return next();
    }

    if (req.user.role === ROLES.PATIENT) {
      req.tenant = Object.freeze({
        scope: 'patient',
        hospitalId: null,
        hospitalName: null,
        hospitalCode: null,
        actorId: req.user._id,
        role: req.user.role,
      });
      return next();
    }

    if (HOSPITAL_STAFF_ROLES.includes(req.user.role)) {
      req.tenant = await buildStaffTenantContext(req.user);
      return next();
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Tenant Scope Middleware
 * Ensures the authenticated staff member belongs to a verified, active hospital facility
 * and binds the trusted hospital scope to `req.tenant`.
 * Rejects Super Admin and Patient accounts with 403 on strictly hospital-scoped routes.
 */
export const requireHospitalScope = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required');
    }

    if (!HOSPITAL_STAFF_ROLES.includes(req.user.role)) {
      throw new ApiError(
        403,
        'This account cannot access hospital-scoped operations'
      );
    }

    if (req.tenant && req.tenant.scope === 'hospital' && req.tenant.hospitalId) {
      return next();
    }

    req.tenant = await buildStaffTenantContext(req.user);
    next();
  } catch (error) {
    next(error);
  }
};

export default requireHospitalScope;
