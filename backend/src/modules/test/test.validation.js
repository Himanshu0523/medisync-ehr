import { body } from 'express-validator';

export const createTestValidation = [
    body('visit').isMongoId().withMessage('Valid visit id required'),
    body('testName').trim().notEmpty().withMessage('Test name required'),
    body('testDate').isISO8601().toDate().withMessage('Valid test date required'),
    body('visitDisease').optional().isMongoId(),
];