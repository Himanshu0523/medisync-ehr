import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';


export const sendSms = async ({ to , body }) => {
    if (env.nodeEnv === 'test' || !env.twilio.accountSid) return ;

    try {
        // lazy loaded
        const twilio = (await import('twilio')).default;
        const client = twilio(env.twilio.accountSid , env.twilio.authToken);
        await client.messages.create({
            from: env.twilio.from ,
            to: `+91${to}` ,
            body
        });
        logger.info(`SMS sent to ${to}`);
    } catch (Err){
        logger.error('sms failed', Err);
    }
};