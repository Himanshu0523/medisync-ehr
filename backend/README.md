# MediSync Backend API Engine

The backend tier for MediSync is a multi-tenant Node.js and Express RESTful API server integrated with MongoDB, Redis, and BullMQ for real-time and asynchronous medical operations.

## Technology Stack

- **Runtime**: Node.js `>= 20.0.0` (ES Modules)
- **Framework**: Express.js
- **Database & ODM**: MongoDB & Mongoose 8
- **In-Memory Cache & Locking**: Redis (ioredis)
- **Task Queues**: BullMQ (email notifications, reminder schedules)
- **Authentication**: JWT (Access Token + Refresh Token flow) & bcryptjs
- **API Documentation**: Swagger UI / OpenAPI (`/api-docs`)
- **Testing**: Jest & Supertest

---

## Directory Layout

```
backend/
├── src/
│   ├── config/          # Database, Redis, Mailer, and S3 connections
│   ├── controllers/     # Request orchestration and response mapping
│   ├── jobs/            # Queue setup, schedulers, and worker processes
│   ├── middlewares/     # Auth, RBAC, tenant resolution, rate limiting, error handlers
│   ├── models/          # Multi-tenant Mongoose schemas and compound indexes
│   ├── routes/          # Express route definitions
│   ├── scripts/         # Database migrations and seed utilities
│   ├── services/        # Core business and clinical domain logic
│   ├── utils/           # Loggers (Winston), token helpers, and validators
│   ├── app.js           # Express app instance and middleware pipeline
│   └── server.js        # Server listener and WebSocket initialization
├── tests/               # Unit, integration, and security test suites
├── uploads/             # Temporary local file storage
├── Dockerfile           # Production container specification
├── docker-compose.yml   # Multi-container local development orchestration
└── package.json         # Dependencies and scripts
```

---

## Getting Started

### 1. Environment Setup
```bash
cp .env.example .env
```
Fill in MongoDB connection string, Redis URL, JWT secrets, and admin seed credentials.

### 2. Dependency Installation
```bash
npm install
```

### 3. Database Seeding
```bash
# Seed initial SuperAdmin account
npm run seed:admin

# Seed sample hospitals & tenant admins (optional)
npm run seed:hospitals
```

### 4. Running the Server
```bash
# Development mode with nodemon
npm run dev

# Production execution
npm start
```

### 5. Running Asynchronous Workers
```bash
# Worker 1: Notification dispatcher (Email/SMS)
npm run worker:notifications

# Worker 2: Scheduled appointment reminders
npm run worker:reminders
```

### 6. Running Tests
```bash
# Run Jest test suite
npm test

# Run tests with code coverage report
npm run test:coverage
```

---

## API Documentation
Once the server is running, explore interactive API documentation at:
- **Swagger UI**: `http://localhost:5000/api-docs`
- **Postman**: Import `MediSync.postman_collection.json` and `MediSync.postman_environment.json`.
