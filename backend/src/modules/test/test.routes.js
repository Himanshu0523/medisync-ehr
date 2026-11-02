import express from 'express';
import { protect } from '../../middleware/auth.js';
import { resolveTenantContext } from '../../middleware/tenant.middleware.js';
import { restrictTo } from '../../middleware/role.js';
import { requireVerifiedDoctor } from '../../middleware/clinicalPrivileges.js';
import { uploadReport } from '../../middleware/upload.js';
import { audit } from '../../middleware/audit.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/apiResponse.js';
import * as service from './test.service.js';
import { createTestValidation } from './test.validation.js';
import { validate } from '../../middleware/validate.js';

import { ROLES } from '../auth/auth.constants.js';

const router = express.Router();
router.use(protect);
router.use(resolveTenantContext);

router.post(
  '/',
  restrictTo(ROLES.DOCTOR),
  requireVerifiedDoctor,
  uploadReport,
  createTestValidation,
  validate,
  audit('test', 'create'),
  catchAsync(async (req, res) => {
    const test = await service.createTest(req.body, req.user, req.file);
    sendResponse(res, 201, test, 'Test created');
  })
);

router.get('/', catchAsync(async (req, res) => {
  sendResponse(res, 200, await service.getTests(req.user, req.query));
}));

router.get('/:id/report', catchAsync(async (req, res) => {
  const reportUrl = await service.getTestReport(req.params.id, req.user);
  const normalizedPath = reportUrl.startsWith('/') ? reportUrl.slice(1) : reportUrl;
  const path = await import('path');
  const fs = await import('fs');
  const filePath = path.default.resolve(process.cwd(), normalizedPath);

  if (!fs.default.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: 'Report file does not exist on disk' });
  }

  res.sendFile(filePath);
}));

export default router;