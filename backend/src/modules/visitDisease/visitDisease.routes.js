import express from 'express';
import { protect } from '../../middleware/auth.js';
import { resolveTenantContext } from '../../middleware/tenant.middleware.js';
import { restrictTo } from '../../middleware/role.js';
import { requireVerifiedDoctor } from '../../middleware/clinicalPrivileges.js';
import * as vdController from './visitDisease.controller.js';
import { createVisitDiseaseValidation } from './visitDisease.validation.js';
import { validate } from '../../middleware/validate.js';
import { ROLES } from '../auth/auth.constants.js';

const router = express.Router();

router.use(protect);
router.use(resolveTenantContext);

router.post(
    '/',
    restrictTo(ROLES.DOCTOR),
    requireVerifiedDoctor,
    createVisitDiseaseValidation,
    validate,
    vdController.create
);

router.get(
    '/',
    restrictTo(ROLES.PATIENT, ROLES.DOCTOR),
    vdController.getAll
);

export default router;