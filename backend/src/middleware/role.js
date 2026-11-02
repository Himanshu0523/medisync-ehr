import { ApiError } from "../utils/ApiError.js";

export const restrictTo = (...roles) => (req, res, next) => {
    if (!req.user || !req.user.role) {
        return next(new ApiError(401, 'Authentication required'));
    }
    const userRole = req.user.role;
    const isAllowed =
        roles.includes(userRole) ||
        (roles.includes('admin') && ['admin', 'super_admin', 'hospital_admin'].includes(userRole));

    if (!isAllowed) {
        return next(new ApiError(403, 'You do not have permission to perform this action.'));
    }
    next();
};