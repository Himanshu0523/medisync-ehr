import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

const JWT_ISSUER = 'medisync-api';
const JWT_AUDIENCE = 'medisync-client';
const JWT_ALGORITHM = 'HS256';

export const signAccessToken = (userId, role = null) => {
    const payload = { id: userId, type: 'access' };
    if (role) payload.role = role;
    return jwt.sign(payload, env.jwtSecret, {
        expiresIn: env.jwtAccessExpires,
        algorithm: JWT_ALGORITHM,
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
    });
};

export const signRefreshToken = (userId, jti, family = null) => {
    const payload = { id: userId, type: 'refresh', jti };
    if (family) payload.family = family;
    return jwt.sign(payload, env.jwtRefreshSecret, {
        expiresIn: env.jwtRefreshExpires,
        algorithm: JWT_ALGORITHM,
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
    });
};

export const verifyAccessToken = (token) => {
    return jwt.verify(token, env.jwtSecret, {
        algorithms: [JWT_ALGORITHM],
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
    });
};

export const verifyRefreshToken = (token) => {
    return jwt.verify(token, env.jwtRefreshSecret, {
        algorithms: [JWT_ALGORITHM],
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
    });
};

export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

export const randomToken = () => crypto.randomBytes(32).toString('hex');