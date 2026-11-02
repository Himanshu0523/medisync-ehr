import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.port === 465,
    auth: env.smtp.user ? { user: env.smtp.user , pass: env.smtp.pass } : undefined,
});

export const sendEmail = async ({ to , subject , html , text }) => {
    if (env.nodeEnv === 'test') return;
    try {
        await transporter.sendMail({
            from: env.smtp.from ,
            to,
            subject,
            html: html || `<p>${text}</p>`,
            text,
        });
        logger.info(`Email send to ${to}: ${subject}`);
    } catch (err) {
        logger.error('Email failed', err);
        throw err;
    }
};



export const templates = {
    verifyEmail: (name, url) => ({
        subject: 'Verify your MediSync email',
        html: `<p>Hi ${name},</p><p><a href="${url}">Click here</a> to verify your email. Link expires in 24h.</p>`,
    }),
    resetPassword: (name, url) => ({
        subject: 'Reset your MediSync password',
        html: `<p>Hi ${name},</p><p><a href="${url}">Click here</a> to reset your password. Link expires in 30 min.</p>`,
    }),
    bookingConfirmed: (name, doctor, date, time) => ({
        subject: 'Your appointment is confirmed',
        html: `<p>Hi ${name}, your appointment with Dr. ${doctor} is confirmed for ${date} at ${time}.</p>`,
    }),
    bookingCancelled: (name, date, time) => ({
        subject: 'Your appointment has been cancelled',
        html: `<p>Hi ${name}, your appointment on ${date} at ${time} has been cancelled.</p>`,
    }),
    reminder: (name, doctor, date, time) => ({
        subject: 'Reminder: appointment tomorrow',
        html: `<p>Hi ${name}, reminder: you have an appointment with Dr. ${doctor} on ${date} at ${time}.</p>`,
    }),
};