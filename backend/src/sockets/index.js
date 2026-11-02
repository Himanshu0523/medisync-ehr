import { Server } from 'socket.io';
import { verifyAccessToken } from '../utils/tokens.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

let io = null;

export const initSocket = (httpServer) => {
    const origin = env.corsOrigin === '*' ? false : env.corsOrigin;
    io = new Server(httpServer, {
        cors: { origin, credentials: true },
    });

    io.use((socket, next) => {
        try {
        const token = socket.handshake.auth?.token;
        const decoded = verifyAccessToken(token);
        socket.userId = decoded.id;
        next();
        } catch {
        next(new Error('Unauthorized'));
        }
    });

    io.on('connection', (socket) => {
        socket.join(`user:${socket.userId}`);
        logger.info(`Socket connected: ${socket.userId}`);
        socket.on('disconnect', () => logger.info(`Socket disconnect: ${socket.userId}`));
    });

    return io;
};

export const emitToUser = (userId, event, data) => {
    if (io) io.to(`user:${userId}`).emit(event, data);
};