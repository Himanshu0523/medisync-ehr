import express from 'express';
import { protect, optionalAuth } from '../../middleware/auth.js';
import { resolveTenantContext } from '../../middleware/tenant.middleware.js';
import { restrictTo } from '../../middleware/role.js';
import * as doctorController from './doctor.controller.js';
import { createDoctorValidation, updateDoctorValidation } from './doctor.validation.js';
import { validate } from '../../middleware/validate.js';

const router = express.Router();

// Public routes for patient and visitor browsing (with optional auth for staff view)
router.get('/', optionalAuth, doctorController.getAll);
router.get('/:id', doctorController.getOne);

// Protected routes
router.use(protect);
router.use(resolveTenantContext);
router.patch('/:id/credentials', doctorController.submitCredentials);
router.post('/', restrictTo('admin'), createDoctorValidation, validate, doctorController.create);
router.patch('/:id/approve', restrictTo('admin'), doctorController.approve);
router.patch('/:id/reject', restrictTo('admin'), doctorController.reject);
router.patch('/:id', restrictTo('admin'), updateDoctorValidation, validate, doctorController.update);
router.delete('/:id', restrictTo('admin'), doctorController.remove);

export default router;