import express from 'express';
import { protect } from '../../middleware/auth.js';
import { resolveTenantContext } from '../../middleware/tenant.middleware.js';
import { restrictTo } from '../../middleware/role.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/apiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import AuditLog from './audit.model.js';
import User from '../user/user.model.js';
import { ROLES } from '../auth/auth.constants.js';

const router = express.Router();
router.use(protect, resolveTenantContext, restrictTo(ROLES.SUPER_ADMIN, ROLES.HOSPITAL_ADMIN, ROLES.ADMIN));

router.get('/', catchAsync(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 50);
  const filter = {};

  if (req.user.role === ROLES.SUPER_ADMIN) {
    if (req.query.hospitalId) filter.hospitalId = req.query.hospitalId;
    if (req.query.actor) filter.actor = req.query.actor;
  } else if (req.user.role === ROLES.HOSPITAL_ADMIN || req.user.role === ROLES.ADMIN) {
    if (!req.user.hospitalId) {
      throw new ApiError(403, 'Hospital Admin has no assigned hospital');
    }

    if (req.query.hospitalId && req.query.hospitalId.toString() !== req.user.hospitalId.toString()) {
      throw new ApiError(403, 'Cannot query audit records for another hospital');
    }

    const hospitalStaff = await User.find({ hospitalId: req.user.hospitalId }).select('_id');
    const hospitalStaffIds = hospitalStaff.map((u) => u._id);

    filter.$or = [
      { hospitalId: req.user.hospitalId },
      { actor: { $in: hospitalStaffIds } },
    ];

    if (req.query.actor) {
      const isAffiliated = hospitalStaffIds.some((id) => id.toString() === req.query.actor.toString());
      if (!isAffiliated) {
        throw new ApiError(403, 'Cannot query audit records for users outside your hospital');
      }
      filter.actor = req.query.actor;
    }
  } else {
    throw new ApiError(403, 'Access denied');
  }

  if (req.query.entity) filter.entity = req.query.entity;

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .populate('actor', 'name email role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    AuditLog.countDocuments(filter),
  ]);
  sendResponse(res, 200, { logs, total, page, pages: Math.ceil(total / limit) });
}));

export default router;
