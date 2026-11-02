import express from 'express';
import { protect } from '../../middleware/auth.js';
import { resolveTenantContext } from '../../middleware/tenant.middleware.js';
import { restrictTo } from '../../middleware/role.js';
import * as bookingController from './booking.controller.js';
import { createBookingValidation, updateBookingStatusValidation } from './booking.validation.js';
import { validate } from '../../middleware/validate.js';
import { ROLES } from '../auth/auth.constants.js';

const router = express.Router();

router.use(protect);
router.use(resolveTenantContext);

router.post(
    '/',
    restrictTo(ROLES.PATIENT, ROLES.RECEPTIONIST, ROLES.HOSPITAL_ADMIN, ROLES.ADMIN),
    createBookingValidation,
    validate,
    bookingController.create
);

router.get(
    '/',
    restrictTo(ROLES.PATIENT, ROLES.DOCTOR, ROLES.RECEPTIONIST, ROLES.HOSPITAL_ADMIN, ROLES.ADMIN),
    bookingController.getAll
);

router.patch(
    '/:id/status',
    restrictTo(ROLES.PATIENT, ROLES.RECEPTIONIST, ROLES.DOCTOR, ROLES.HOSPITAL_ADMIN, ROLES.ADMIN),
    updateBookingStatusValidation,
    validate,
    bookingController.updateStatus
);

export default router;