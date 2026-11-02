import IORedis from 'ioredis';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

export const redis = env.nodeEnv === 'test'
  ? null
  : new IORedis(env.redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      lazyConnect: false,
    });

if (redis) {
  redis.on('connect', () => logger.info('Redis connected'));
  redis.on('error', (e) => logger.error('Redis error', e));
}