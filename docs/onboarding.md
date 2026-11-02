# Technical Onboarding & Local Launch Playbook

## Prerequisite Checklist
Ensure your local host machine has the following minimum requirements installed:
- **Runtime Core**: Node.js `>= 20.0.0` (LTS recommended)
- **Database Engine**: MongoDB `>= 6.0` (local instance or MongoDB Atlas URI)
- **In-Memory Cache**: Redis `>= 7.0` (local server or Docker container)
- **Package Engine**: `npm` `>= 10.0.0` (or `pnpm` / `yarn`)
- **Version System**: Git `>= 2.38`

---

## Local Launch Runbook

### 1. Repository Acquisition
```bash
git clone <repository-url>
cd <repository-directory>
```

### 2. Environment Variable Setup
Duplicate the sample configurations for both services:

```bash
# Backend environment configuration
cp backend/.env.example backend/.env

# Frontend environment configuration (if needed)
cp frontend/.env.example frontend/.env
```

Review and adjust `<database-connection-url>`, `<redis-url>`, `<jwt-secret>`, and ports:
- `backend/.env`:
  - `PORT=5000`
  - `MONGODB_URI=mongodb://localhost:27017/medisync`
  - `REDIS_URL=redis://localhost:6379`
  - `JWT_SECRET=<strong-random-secret>`
  - `CORS_ORIGIN=http://localhost:5173`

---

### 3. Backend Setup & Database Seeding

Open a dedicated terminal window:

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Seed default SuperAdmin account
npm run seed:admin

# Seed sample hospitals and initial hospital admins (optional)
npm run seed:hospitals

# Launch the backend development server
npm run dev
```

*Backend server will start listening on `http://localhost:5000` with Swagger documentation at `http://localhost:5000/api-docs`.*

---

### 4. Background Workers (Optional for Local Async Testing)

If validating email alerts or automated reminders, start the BullMQ worker processes in separate terminals:

```bash
# Terminal 2 - Notification Worker (Email/SMS)
cd backend
npm run worker:notifications

# Terminal 3 - Reminder Worker
cd backend
npm run worker:reminders
```

---

### 5. Frontend Setup & Launch

Open another dedicated terminal window:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```

*Frontend will launch at `http://localhost:5173`.*

---

### 6. Containerized Run (Alternative with Docker)

To run the entire stack with MongoDB and Redis pre-configured:

```bash
cd backend
docker-compose up -d --build
```

---

## Code Consistency Standards

### Branching Strategy
Use explicit, lowercase, hyphen-separated branch names:
- **Features**: `feature/<issue-number>-<short-description>` (e.g., `feature/MED-104-doctor-slot-booking`)
- **Bug Fixes**: `bugfix/<issue-number>-<short-description>` (e.g., `bugfix/MED-208-patient-search-timeout`)
- **Hotfixes**: `hotfix/<issue-number>-<short-description>` (e.g., `hotfix/MED-911-jwt-cookie-samesite`)
- **Chores / Documentation**: `chore/<short-description>` or `docs/<short-description>`

### Semantic Commit Guidelines
Adhere to the Conventional Commits specification: `type(scope): imperative description`
- `feat(appointment): implement distributed Redis slot locking`
- `fix(auth): prevent timing attack during password comparison`
- `refactor(patient): separate global identity from hospital-scoped MRN`
- `docs(onboarding): document Redis BullMQ worker launch steps`
- `test(billing): add test coverage for invoice generation edge cases`

### Pull Request (PR) Review Strategy
1. **Automated CI Validation**:
   - ESLint validation must pass without errors (`npm run lint`).
   - All unit and integration test suites must pass (`npm test`).
2. **Review Quorum**:
   - Minimum 1 Senior Engineer approval required.
   - For changes touching `middlewares/auth.js` or tenant resolution, Security Lead review is mandatory.
3. **Hygiene Rules**:
   - Zero hardcoded credentials or `.env` files committed.
   - Clean git history with squash-and-merge onto the `main` branch.
