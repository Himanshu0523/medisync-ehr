# MediSync Enterprise Healthcare Monorepo

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/Node.js-%3E%3D20.0.0-green.svg)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/React-19-cyan.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8.svg)](https://tailwindcss.com/)

**MediSync** is an enterprise-grade, multi-tenant hospital management platform and unified Electronic Health Record (EHR) ecosystem. Built with a decoupled architecture, MediSync empowers multi-branch hospitals with global patient identity management, tenant isolation, concurrent slot reservation, and real-time clinical workflows.

---

## Workspace Structure

```
.
├── backend/            # Express, MongoDB (Mongoose), Redis & BullMQ API Engine
├── frontend/           # Vite + React 19 + Redux Toolkit + Tailwind CSS v4 Client
├── docs/               # System Architecture, Onboarding, and Domain Documentation
├── .gitignore          # Root-level multi-layer security & build ignore rules
└── TODO.md             # Competitive advantage roadmap & feature enhancements
```

---

## Key Highlights

- **Decoupled Architecture**: Strict separation between the backend REST API server and the React 19 client frontend.
- **Tenant Isolation**: Server-derived hospital scoping ensures zero data leakage across healthcare tenants.
- **Global Identity with Local Isolation**: Patients maintain a single identity across partner hospitals without duplicate clinical records.
- **Real-time Queueing & Locking**: Redis TTL slot reservation prevents double-booking race conditions during peak clinic hours.
- **Role-Based Portals**: Tailored interfaces for SuperAdmins, Hospital Admins, Doctors, Receptionists, and Patients.

---

## Quick Start Runbook

### Prerequisites
- **Node.js**: `>= 20.0.0`
- **MongoDB**: `>= 6.0` (Local or MongoDB Atlas)
- **Redis**: `>= 7.0` (Local or Docker)

### 1. Backend Setup
```bash
cd backend
cp .env.example .env
npm install
npm run seed:admin      # Seeds default SuperAdmin
npm run dev             # Starts API on http://localhost:5000
```

### 2. Frontend Setup
```bash
cd frontend
cp .env.example .env    # If applicable
npm install
npm run dev             # Starts Client on http://localhost:5173
```

---

## Documentation Links

All architectural blueprints, setup playbooks, and structural references are located in the [`docs/`](./docs/) directory:

- 📐 **[System Architecture & Data Flow](./docs/architecture.md)**
- 🚀 **[Developer Onboarding & Standards](./docs/onboarding.md)**
- 📋 **[Implementation Plan & Milestones](./docs/implementation-plan.md)**
- ⚙️ **[Backend Domain & Model Specifications](./docs/backend-structure.md)**
- 🎨 **[Frontend Component & State Architecture](./docs/frontend-structure.md)**
- 🛡️ **[Security, Auth & Compliance](./docs/security/)**

---

## Branching & Commit Standards

- **Branches**: `feature/<issue-id>-<description>`, `bugfix/<issue-id>-<description>`
- **Commits**: Follow Conventional Commits: `feat(scope): message`, `fix(scope): message`

Refer to [docs/onboarding.md](./docs/onboarding.md) for full contribution guidelines.
