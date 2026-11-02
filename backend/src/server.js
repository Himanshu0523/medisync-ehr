import http from 'http';
import * as Sentry from '@sentry/node';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { logger } from './utils/logger.js';
import { initSocket } from './sockets/index.js';
import app from './app.js';

if (env.sentryDsn) {
    Sentry.init({ dsn: env.sentryDsn, environment: env.nodeEnv, tracesSampleRate: 0.1 });
}

const start = async () => {
    await connectDB();
    const server = http.createServer(app);
    initSocket(server);

    server.listen(env.port, () => logger.info(`MediSync API on ${env.port}`));

    const shutdown = async (signal) => {
        logger.info(`${signal} received, shutting down...`);
        server.close(async () => {
        const mongoose = await import('mongoose');
        await mongoose.default.disconnect();
        process.exit(0);
        });
        setTimeout(() => process.exit(1), 10000);
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
};

start().catch((e) => { logger.error(e); process.exit(1); });