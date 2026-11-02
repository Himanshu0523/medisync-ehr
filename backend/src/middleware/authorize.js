import { ApiError } from '../utils/ApiError.js';
import { ROLE_PERMISSIONS } from '../modules/auth/auth.constants.js';

export const authorize = (...requiredPermissions) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new ApiError(401, 'Authentication required'));
        }

        const userPermissions = ROLE_PERMISSIONS[req.user.role] || [];
        const allowed = requiredPermissions.every((permission) =>
            userPermissions.includes(permission)
        );

        if (!allowed) {
            return next(new ApiError(403, 'You do not have permission to perform this action'));
        }

        next();
    };
};
