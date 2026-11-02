import { Router } from 'express';
import { protect } from '../../middleware/auth.js';
import { requireHospitalScope } from '../../middleware/tenant.middleware.js';
import { restrictTo } from '../../middleware/role.js';
import * as dashboardController from './dashboard.controller.js';

const router = Router();

// Strictly protect and enforce hospital-tenant scope for all Hospital Admin dashboard endpoints
router.use(protect);
router.use(requireHospitalScope);
router.use(restrictTo('hospital_admin', 'admin'));

// Hospital Admin Dashboard Endpoints
router.get('/hospital-admin/overview', dashboardController.getOverview);
router.get('/hospital-admin/today-appointments', dashboardController.getTodayAppointments);
router.get('/hospital-admin/pending-doctors', dashboardController.getPendingDoctors);
router.get('/hospital-admin/patient-queue', dashboardController.getPatientQueue);
router.get('/hospital-admin/recent-activity', dashboardController.getRecentActivity);

export default router;
