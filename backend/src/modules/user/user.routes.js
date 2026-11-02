import express from 'express';
import { protect } from '../../middleware/auth.js';
import { resolveTenantContext } from '../../middleware/tenant.middleware.js';
import { restrictTo } from '../../middleware/role.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/apiResponse.js';
import * as service from './user.service.js';

import { ROLES } from '../auth/auth.constants.js';

const router = express.Router();
router.use(protect);
router.use(resolveTenantContext);

router.get('/me', (req, res) => sendResponse(res, 200, req.user));

router.get('/', restrictTo(ROLES.SUPER_ADMIN, ROLES.HOSPITAL_ADMIN, ROLES.ADMIN), catchAsync(async (req, res) => {
    sendResponse(res, 200, await service.getAllUsers(req.query, req.user));
}));

router.get('/:id', catchAsync(async (req, res) => {
    sendResponse(res, 200, await service.getUserById(req.params.id, req.user));
}));

router.patch('/:id', catchAsync(async (req, res) => {
    sendResponse(res, 200, await service.updateUser(req.params.id, req.body, req.user));
}));

router.delete('/:id', restrictTo(ROLES.SUPER_ADMIN, ROLES.HOSPITAL_ADMIN, ROLES.ADMIN), catchAsync(async (req, res) => {
    await service.deleteUser(req.params.id, req.user);
    sendResponse(res, 200, null, 'User deleted');
}));

export default router;