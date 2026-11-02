import { Router } from 'express';
import { protect, optionalAuth } from '../../middleware/auth.js';
import { restrictTo } from '../../middleware/role.js';
import * as hospitalController from './hospital.controller.js';

const router = Router();

// Platform overview statistics (Super Admin only)
router.get('/stats/platform', protect, restrictTo('super_admin'), hospitalController.getPlatformStats);

// Public / Authenticated hospital list (supports search, city, status filters)
router.get('/', optionalAuth, hospitalController.listHospitals);

// Hospital details
router.get('/:id', optionalAuth, hospitalController.getHospitalById);

// Hospital registration & modification (Super Admin only)
router.post('/', protect, restrictTo('super_admin'), hospitalController.createHospital);
router.patch('/:id', protect, restrictTo('super_admin'), hospitalController.updateHospital);
router.patch('/:id/status', protect, restrictTo('super_admin'), hospitalController.toggleHospitalStatus);

export default router;
