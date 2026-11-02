# MediSync Documentation Hub

Welcome to the **MediSync** enterprise hospital management and multi-tenant healthcare system documentation repository.

## Documentation Navigation

| Document | Purpose & Scope |
| :--- | :--- |
| **[Architecture & Topology](./architecture.md)** | System boundaries, ASCII request flow, data persistence, and repository blueprint |
| **[Technical Onboarding](./onboarding.md)** | Prerequisites checklist, step-by-step local launch runbook, commit standards, and PR workflows |
| **[Implementation Plan](./implementation-plan.md)** | Step-by-step development phases, milestone roadmap, and progress tracking |
| **[Backend Structure](./backend-structure.md)** | API controllers, data models, multi-tenancy scoping, and service layer architecture |
| **[Frontend Structure](./frontend-structure.md)** | React 19 component hierarchy, Redux Toolkit slices, layout routing, and UI state |
| **[Dashboard Specifications](./dashboard/)** | Detailed workflow specs for SuperAdmin, Hospital Admin, Doctor, Receptionist, and Patient portals |
| **[Security & Compliance](./security/)** | Role-based access control (RBAC), tenant isolation, token lifecycle, and audit policies |

---

## Quick Reference Commands

```bash
# Clone and prepare
git clone <repository-url>
cd <repository-directory>

# Backend launch
cd backend && npm install && npm run seed:admin && npm run dev

# Frontend launch
cd frontend && npm install && npm run dev
```

For detailed setup instructions, troubleshooting, and testing guidelines, refer to **[onboarding.md](./onboarding.md)**.
