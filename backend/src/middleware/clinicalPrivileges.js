import { ApiError } from '../utils/ApiError.js';
import { requireActiveVerifiedDoctor } from '../modules/authorization/clinicalAccess.service.js';

/**
 * Ensures that if an authenticated user has the 'doctor' role,
 * their professional medical credentials have been formally verified
 * and approved by hospital administration before granting clinical privileges.
 */
export const requireVerifiedDoctor = async (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, 'Authentication required'));
  }

  if (req.user.role === 'doctor') {
    try {
      req.doctor = await requireActiveVerifiedDoctor(req.user);
    } catch (err) {
      return next(err);
    }
  }

  next();
};
