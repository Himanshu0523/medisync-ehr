import { body } from 'express-validator';

export const createVisitDiseaseValidation = [
    body('visit').isMongoId().withMessage('Valid visit id required'),
    body('disease').trim().notEmpty().withMessage('Disease required'),
    body('prescription').trim().notEmpty().withMessage('Prescription required'),
];