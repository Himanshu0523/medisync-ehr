import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

export const connectDB = async () => {
    mongoose.set('strictQuery', true);
    const conn = await mongoose.connect(env.mongoUri, {
        autoIndex: env.nodeEnv !== 'production',
        maxPoolSize: 20,
        serverSelectionTimeoutMS: 5000,
    });
    logger.info(`MongoDB connected: ${conn.connection.host}`);
    return conn;
};

mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
mongoose.connection.on('error', (err) => logger.error('MongoDB error', err));