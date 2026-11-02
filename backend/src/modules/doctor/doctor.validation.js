import { body } from 'express-validator';

export const createDoctorValidation = [
    body('name').trim().notEmpty(),
    body('email').isEmail(),
    body('mobile').matches(/^[0-9]{10,15}$/),
    body('specialization').trim().notEmpty(),
    body('timing').trim().notEmpty(),
];

export const updateDoctorValidation = [
    body('email').optional().isEmail(),
    body('mobile').optional().matches(/^[0-9]{10,15}$/),
];