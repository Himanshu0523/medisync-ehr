import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

export const globalLimiter = env.nodeEnv === 'test' ? (req, res, next) => next() : rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

export const authLimiter = env.nodeEnv === 'test' ? (req, res, next) => next() : rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts, please try again later.' },
});

export const passwordResetLimiter = env.nodeEnv === 'test' ? (req, res, next) => next() : rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many password reset requests.' },
});