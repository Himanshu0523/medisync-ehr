import { Worker } from 'bullmq';
import { redis } from '../../config/redis.js';
import { reminderQueue, enqueueNotification } from '../queues.js';
import Booking from '../../modules/booking/booking.model.js';
import { logger } from '../../utils/logger.js';

export const scheduleReminderScan = async () => {
    await reminderQueue.add('daily-scan', {}, {
        repeat: { pattern: '0 9 * * *' }, // 9 AM daily
        jobId: 'daily-reminder-scan',
        removeOnComplete: true,
    });
};

export const reminderWorker = new Worker('reminders', async (job) => {
    if (job.name !== 'daily-scan') return;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const next = new Date(tomorrow);
    next.setDate(next.getDate() + 1);

    const bookings = await Booking.find({
        date: { $gte: tomorrow, $lt: next },
        status: 'confirmed',
    }).populate('patient', 'name email mobile').populate('doctor', 'name');

    for (const b of bookings) {
        await enqueueNotification('reminder', {
        name: b.patient.name,
        email: b.patient.email,
        mobile: b.patient.mobile,
        doctorName: b.doctor.name,
        date: b.date.toDateString(),
        time: b.time,
        });
    }
    logger.info(`Queued ${bookings.length} appointment reminders`);
}, { connection: redis });

if (import.meta.url === `file://${process.argv[1]}`) {
    scheduleReminderScan().then(() => logger.info('Reminder worker started'));
}