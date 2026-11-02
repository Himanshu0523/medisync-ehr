import { body } from 'express-validator';

export const createVisitValidation = [
    body('booking').isMongoId().withMessage('Valid booking id required'),
    body('mobile').matches(/^[0-9]{10,15}$/).withMessage('Valid mobile required'),
];