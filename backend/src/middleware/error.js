import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let details = err.details || null;
  let errorCode = err.errorCode || null;

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // Handle MongoDB Duplicate Key (E11000)
  if (err.code === 11000) {
    statusCode = 409;
    const field = err.keyValue ? Object.keys(err.keyValue)[0] : 'field';
    message = `Duplicate value for ${field}`;
    errorCode = 'DUPLICATE_KEY';
  }

  // Handle Mongoose Invalid ObjectId CastError
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid format for resource identifier: ${err.path}`;
    errorCode = 'INVALID_ID';
  }

  // Handle JWT Malformed or Invalid Signature
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
    errorCode = 'INVALID_TOKEN';
  }

  // Handle JWT Expiration
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired';
    errorCode = 'TOKEN_EXPIRED';
  }

  // Log server errors vs client errors
  if (statusCode >= 500) {
    logger.error(`500 Internal Server Error: ${err.message}`, {
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
    });
    // In production, mask unhandled internal server messages
    if (env.nodeEnv === 'production') {
      message = 'Internal server error. Please try again later.';
    }
  } else {
    logger.warn(`${statusCode} ${req.method} ${req.originalUrl} - ${message}`);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errorCode && { code: errorCode }),
    ...(details && { details }),
    ...(env.nodeEnv === 'development' && { stack: err.stack }),
  });
};

export const notFound = (req, res, next) => { // eslint-disable-line no-unused-vars
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    code: 'ROUTE_NOT_FOUND',
  });
};