import express from 'express';
import client from 'prom-client';
import { protect } from '../../middleware/auth.js';
import { restrictTo } from '../../middleware/role.js';
import { ROLES } from '../auth/auth.constants.js';

client.collectDefaultMetrics();

const router = express.Router();

router.get('/', protect, restrictTo(ROLES.SUPER_ADMIN), async (req, res) => {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
});

export default router;