import dotenv from 'dotenv';
dotenv.config();

const VALID_ENVS = ['development', 'production', 'test'];
const nodeEnv = process.env.NODE_ENV || 'development';

if (!VALID_ENVS.includes(nodeEnv)) {
  throw new Error(`Invalid NODE_ENV "${nodeEnv}". Must be one of: ${VALID_ENVS.join(', ')}`);
}

const required = ['MONGODB_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
required.forEach((k) => {
  if (!process.env[k]) {
    throw new Error(`Missing required environment variable: ${k}`);
  }
});

const jwtSecret = process.env.JWT_SECRET;
const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;

// Enforce distinct secrets to prevent cross-token substitution attacks
if (jwtSecret === jwtRefreshSecret) {
  throw new Error('Security Error: JWT_SECRET and JWT_REFRESH_SECRET must be distinct and non-identical.');
}

// Enterprise production constraints
if (nodeEnv === 'production') {
  if (jwtSecret.length < 32 || jwtRefreshSecret.length < 32) {
    throw new Error('Security Error: JWT secrets must be at least 32 characters (256-bit entropy) in production.');
  }

  const bannedPlaceholders = [
    'change-me-access',
    'change-me-refresh-different',
    'secret',
    'jwtsecret',
    'admin',
    'password',
  ];

  if (
    bannedPlaceholders.includes(jwtSecret.toLowerCase()) ||
    bannedPlaceholders.includes(jwtRefreshSecret.toLowerCase())
  ) {
    throw new Error('Security Error: Insecure default JWT secrets detected in production environment.');
  }
}

const port = Number(process.env.PORT) || 5000;
if (isNaN(port) || port < 1 || port > 65535) {
  throw new Error(`Invalid PORT configuration: "${process.env.PORT}". Must be an integer between 1 and 65535.`);
}

export const env = {
  nodeEnv,
  port,
  mongoUri: process.env.MONGODB_URI,
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwtSecret,
  jwtRefreshSecret,
  jwtAccessExpires: process.env.JWT_ACCESS_EXPIRES || '15m',
  jwtRefreshExpires: process.env.JWT_REFRESH_EXPIRES || '30d',
  corsOrigin: process.env.CORS_ORIGIN
    ? (process.env.CORS_ORIGIN.includes(',') ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim()) : process.env.CORS_ORIGIN)
    : '*',
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || 'MediSync <no-reply@medisync.com>',
  },
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    from: process.env.TWILIO_FROM,
  },
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'ap-south-1',
    bucket: process.env.AWS_S3_BUCKET,
  },
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  sentryDsn: process.env.SENTRY_DSN,
  seed: {
    email: process.env.SEED_ADMIN_EMAIL,
    mobile: process.env.SEED_ADMIN_MOBILE,
    password: process.env.SEED_ADMIN_PASSWORD,
  },
};