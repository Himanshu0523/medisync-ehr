import express from 'express';
import { protect } from '../../middleware/auth.js';
import { resolveTenantContext, requireHospitalScope } from '../../middleware/tenant.middleware.js';
import { restrictTo } from '../../middleware/role.js';
import * as visitController from './visit.controller.js';
import { createVisitValidation } from './visit.validation.js';
import { validate } from '../../middleware/validate.js';
import { ROLES } from '../auth/auth.constants.js';

const router = express.Router();

router.use(protect);
router.use(resolveTenantContext);

router.post(
    '/',
    restrictTo(ROLES.RECEPTIONIST, ROLES.HOSPITAL_ADMIN, ROLES.ADMIN),
    requireHospitalScope,
    createVisitValidation,
    validate,
    visitController.create
);

router.get(
    '/',
    restrictTo(ROLES.PATIENT, ROLES.DOCTOR, ROLES.RECEPTIONIST, ROLES.HOSPITAL_ADMIN, ROLES.ADMIN),
    visitController.getAll
);

router.get(
    '/:id',
    restrictTo(ROLES.PATIENT, ROLES.DOCTOR, ROLES.RECEPTIONIST, ROLES.HOSPITAL_ADMIN, ROLES.ADMIN),
    visitController.getOne
);

router.get(
    '/:id/fhir',
    restrictTo(ROLES.PATIENT, ROLES.DOCTOR, ROLES.HOSPITAL_ADMIN, ROLES.ADMIN),
    async (req, res, next) => {
        try {
            const { exportVisitFhir } = await import('./visit.service.js');
            const fhirData = await exportVisitFhir(req.params.id, req.user);
            res.setHeader('Content-Type', 'application/fhir+json');
            res.status(200).json(fhirData);
        } catch (err) {
            next(err);
        }
    }
);

export default router;