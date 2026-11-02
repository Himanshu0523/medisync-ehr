import { Queue } from 'bullmq';
import { redis } from '../config/redis.js';
import { env } from '../config/env.js';

export const notificationQueue = redis ? new Queue('notifications', { connection: redis }) : null;
export const reminderQueue = redis ? new Queue('reminders', { connection: redis }) : null;

export const __testNotifications = [];

export const enqueueNotification = async (name, data) => {
    if (env.nodeEnv === 'test') {
        __testNotifications.push({ name, data, timestamp: new Date() });
        return;
    }
    if (!notificationQueue) return;
    return notificationQueue.add(name, data, {
      attempts: 5,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 1000,
      removeOnFail: 5000,
    });
};