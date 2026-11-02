import { body } from 'express-validator';

export const registerValidation = [
    body('name').trim().notEmpty().withMessage('Name required'),
    body('email').isEmail().normalizeEmail(),
    body('mobile').matches(/^[0-9]{10,15}$/).withMessage('Invalid mobile'),
    body('password').isLength({ min: 8 }).withMessage('Min 8 chars')
        .matches(/[A-Z]/).withMessage('Needs uppercase')
        .matches(/[a-z]/).withMessage('Needs lowercase')
        .matches(/[0-9]/).withMessage('Needs digit'),
];

export const loginValidation = [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
];

export const forgotPasswordValidation = [body('email').isEmail().normalizeEmail()];

export const resetPasswordValidation = [
    body('token').isLength({ min: 32 }),
    body('password').isLength({ min: 8 })
        .matches(/[A-Z]/).matches(/[a-z]/).matches(/[0-9]/),
];

export const refreshValidation = [body('refreshToken').isString().notEmpty()];

export const inviteStaffValidation = [
    body('name').trim().notEmpty().withMessage('Name required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('mobile').matches(/^[0-9]{10,15}$/).withMessage('Valid 10-15 digit mobile required'),
    body('role').isIn(['doctor', 'receptionist', 'hospital_admin']).withMessage('Invalid staff role'),
    body('specialization').optional().trim(),
    body('qualifications').optional().trim(),
    body('experience').optional().trim(),
    body('languages').optional(),
    body('department').optional().trim(),
    body('medicalRegistrationNumber').optional().trim(),
    body('hospital').optional().trim(),
    body('timing').optional().trim(),
    body('availability').optional().isArray(),
];

export const acceptInvitationValidation = [
    body('token').isLength({ min: 32 }).withMessage('Valid invitation token required'),
    body('password').isLength({ min: 8 }).withMessage('Min 8 chars')
        .matches(/[A-Z]/).withMessage('Needs uppercase')
        .matches(/[a-z]/).withMessage('Needs lowercase')
        .matches(/[0-9]/).withMessage('Needs digit'),
];