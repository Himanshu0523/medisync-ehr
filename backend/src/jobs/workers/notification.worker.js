import { Worker } from 'bullmq';
import { redis } from '../../config/redis.js';
import { sendEmail, templates } from '../../services/mailer.js';
import { sendSms } from '../../services/sms.js';
import { logger } from '../../utils/logger.js';
import { env } from '../../config/env.js';

export const notificationWorker = new Worker('notifications', async (job) => {
    const { name, data } = job;

    switch (name) {
        case 'verify-email': {
            const t = templates.verifyEmail(data.name, `${env.appUrl}/verify-email?token=${data.token}`);
            await sendEmail({ to: data.email, ...t });
            break;
        }
        case 'reset-password': {
            const t = templates.resetPassword(data.name, `${env.appUrl}/reset-password?token=${data.token}`);
            await sendEmail({ to: data.email, ...t });
            break;
        }
        case 'booking-confirmed': {
            const t = templates.bookingConfirmed(data.name, data.doctorName, data.date, data.time);
            await sendEmail({ to: data.email, ...t });
            if (data.mobile) await sendSms({ to: data.mobile, body: `Appointment confirmed for ${data.date} ${data.time} with Dr. ${data.doctorName}` });
            break;
        }
        case 'booking-cancelled': {
            const t = templates.bookingCancelled(data.name, data.date, data.time);
            await sendEmail({ to: data.email, ...t });
            break;
        }
        case 'reminder': {
            const t = templates.reminder(data.name, data.doctorName, data.date, data.time);
            await sendEmail({ to: data.email, ...t });
            if (data.mobile) await sendSms({ to: data.mobile, body: `Reminder: appointment with Dr. ${data.doctorName} on ${data.date} at ${data.time}` });
            break;
        }
        default:
            logger.warn(`Unknown job: ${name}`);
        }
}, { connection: redis, concurrency: 5 });

notificationWorker.on('failed', (job, err) => {
    logger.error(`Job ${job?.name} failed: ${err.message}`);
});

if (import.meta.url === `file://${process.argv[1]}`) {
    logger.info('Notification worker started');
}