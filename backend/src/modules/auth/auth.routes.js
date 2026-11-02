import express from 'express';
import * as c from './auth.controller.js';
import {
  registerValidation, loginValidation, refreshValidation,
  forgotPasswordValidation, resetPasswordValidation,
  inviteStaffValidation, acceptInvitationValidation,
} from './auth.validation.js';
import { authLimiter, passwordResetLimiter } from '../../middleware/rateLimiter.js';
import { protect } from '../../middleware/auth.js';
import { authorize } from '../../middleware/authorize.js';
import { PERMISSIONS } from './auth.constants.js';
import { validate } from '../../middleware/validate.js';

const router = express.Router();

router.post('/register', authLimiter, registerValidation, validate, c.register);
router.get('/verify-email', c.verifyEmail);
router.post('/resend-verification', authLimiter, c.resendVerification);
router.post('/login', authLimiter, loginValidation, validate, c.login);
router.post('/refresh', refreshValidation, validate, c.refresh);
router.post('/logout', c.logout);
router.post('/logout-all', protect, c.logoutAll);
router.post('/forgot-password', passwordResetLimiter, forgotPasswordValidation, validate, c.forgotPassword);
router.post('/reset-password', passwordResetLimiter, resetPasswordValidation, validate, c.resetPassword);

// Staff invitation and activation routes
router.post('/invite-staff', protect, authorize(PERMISSIONS.STAFF_CREATE), inviteStaffValidation, validate, c.inviteStaff);
router.post('/accept-invitation', authLimiter, acceptInvitationValidation, validate, c.acceptInvitation);

export default router;