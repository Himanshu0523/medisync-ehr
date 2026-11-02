import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { errorHandler, notFound } from './middleware/error.js';
import { sanitize } from './middleware/sanitize.js';
import { globalLimiter } from './middleware/rateLimiter.js';
import { logger } from './utils/logger.js';
import { swaggerSpec } from './config/swagger.js';

import authRoutes from './modules/auth/auth.routes.js';
import userRoutes from './modules/user/user.routes.js';
import doctorRoutes from './modules/doctor/doctor.routes.js';
import bookingRoutes from './modules/booking/booking.routes.js';
import visitRoutes from './modules/visit/visit.routes.js';
import visitDiseaseRoutes from './modules/visitDisease/visitDisease.routes.js';
import testRoutes from './modules/test/test.routes.js';
import auditRoutes from './modules/audit/audit.routes.js';
import metricsRoutes from './modules/metrics/metrics.routes.js';
import hospitalRoutes from './modules/hospital/hospital.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(sanitize);
app.use(globalLimiter);

app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev', {
    stream: { write: (msg) => logger.info(msg.trim()) },
}));

// API Documentation (Non-production or protected)
if (env.nodeEnv !== 'production') {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/doctors', doctorRoutes);
app.use('/api/v1/hospitals', hospitalRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/visits', visitRoutes);
app.use('/api/v1/visit-diseases', visitDiseaseRoutes);
app.use('/api/v1/tests', testRoutes);
app.use('/api/v1/audit', auditRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/metrics', metricsRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;