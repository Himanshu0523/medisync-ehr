import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { env } from '../config/env.js';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const devFormat = combine(
    colorize(),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    printf(({ level, message, timestamp, stack }) =>
        `${timestamp} [${level}]: ${stack || message}`)
);

const prodFormat = combine(timestamp(), errors({ stack: true }), json());

const transports = [new winston.transports.Console()];

if (env.nodeEnv === 'production') {
    transports.push(new DailyRotateFile({
        filename: 'logs/app-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
    }));
}

export const logger = winston.createLogger({
    level: env.nodeEnv === 'production' ? 'info' : 'debug',
    format: env.nodeEnv === 'production' ? prodFormat : devFormat,
    transports,
    exitOnError: false,
});