import { ApiError } from '../utils/ApiError.js';
import { verifyAccessToken } from '../utils/tokens.js';
import User from '../modules/user/user.model.js';

export const protect = async (req, res, next) => {
    try {
        const header = req.headers.authorization;
        if (!header?.startsWith('Bearer ')) throw new ApiError(401, 'Not authenticated');

        const token = header.split(' ')[1];
        const decoded = verifyAccessToken(token);
        if (decoded.type !== 'access') throw new ApiError(401, 'Invalid token type');

        const user = await User.findById(decoded.id).select('-password');
        if (!user) throw new ApiError(401, 'User no longer exists');
        if (user.deletedAt != null) throw new ApiError(401, 'User account has been deleted');
        if (user.status !== 'active') throw new ApiError(403, 'Account inactive');
        if (!user.emailVerified) throw new ApiError(403, 'Please verify your email first');

        req.user = user;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') return next(new ApiError(401, 'Token expired'));
        if (err.name === 'JsonWebTokenError') return next(new ApiError(401, 'Invalid token'));
        next(err);
    }
};


export const protectLoose = async (req, res, next) => {
    try {
        const header = req.headers.authorization;
        if (!header?.startsWith('Bearer ')) throw new ApiError(401, 'Not authenticated');
        const decoded = verifyAccessToken(header.split(' ')[1]);
        const user = await User.findById(decoded.id).select('-password');
        if (!user) throw new ApiError(401, 'User no longer exists');
        if (user.deletedAt != null) throw new ApiError(401, 'User account has been deleted');
        if (user.status !== 'active') throw new ApiError(403, 'Account inactive');
        req.user = user;
        next();
    } catch {
        next(new ApiError(401, 'Invalid token'));
    }
};

export const optionalAuth = async (req, res, next) => {
    try {
        const header = req.headers.authorization;
        if (header?.startsWith('Bearer ')) {
            const token = header.split(' ')[1];
            const decoded = verifyAccessToken(token);
            if (decoded?.id) {
                const user = await User.findById(decoded.id).select('-password');
                if (user && user.deletedAt == null && user.status === 'active') req.user = user;
            }
        }
    } catch {
        // Silently continue for optional auth
    }
    next();
};