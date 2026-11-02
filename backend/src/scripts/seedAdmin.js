import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { env } from '../config/env.js';
import User from '../modules/user/user.model.js';
import { logger } from '../utils/logger.js';

import { ROLES } from '../modules/auth/auth.constants.js';

const run = async () => {
    await connectDB();
    const email = env.seed.email;
    if (!email || !env.seed.password) {
        logger.error('Set SEED_ADMIN_EMAIL, SEED_ADMIN_MOBILE, SEED_ADMIN_PASSWORD');
        process.exit(1);
    }
    const exists = await User.findOne({ email });
    if (exists) {
        logger.info(`Admin already exists: ${email}`);
        await mongoose.disconnect();
        return;
    }
    await User.create({
        name: 'Super Administrator',
        mobile: env.seed.mobile || '9999999999',
        email,
        password: env.seed.password,
        role: ROLES.SUPER_ADMIN,
        status: 'active',
        emailVerified: true,
    });
    logger.info(`Admin seeded: ${email}`);
    await mongoose.disconnect();
};

run().catch((e) => { logger.error(e); process.exit(1); });