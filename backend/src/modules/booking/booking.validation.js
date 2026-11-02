import { body } from 'express-validator';

export const createBookingValidation = [
    body('doctor').isMongoId().withMessage('Valid doctor id required'),
    body('date').isISO8601().toDate().withMessage('Valid date required'),
    body('time').notEmpty().withMessage('Time required'),
];

export const updateBookingStatusValidation = [
    body('status')
        .isIn(['pending', 'confirmed', 'cancelled', 'completed'])
        .withMessage('Invalid status'),
];