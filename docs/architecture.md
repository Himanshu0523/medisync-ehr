# Architecture Blueprint & System Topology

## Monorepo Boundaries
- **`backend/`**: Node.js & Express RESTful API server implementing multi-tenant data partitioning, JWT authentication, RBAC, Redis queuing via BullMQ, and MongoDB persistence.
- **`frontend/`**: Vite + React 19 single-page application with Redux Toolkit and Tailwind CSS v4, delivering dedicated role-based portals for SuperAdmins, Hospital Admins, Doctors, Receptionists, and Patients.
- **`docs/`**: Comprehensive system documentation, onboarding runbooks, multi-tenant security architecture, API schemas, and deployment instructions.

---

## Component & Data Flow

```
+------------------------------------------------------------------------+
|                            CLIENT TIER                                 |
|   React 19 SPA (Redux Toolkit, Tailwind CSS v4, Axios Interceptors)    |
|   - Real-time updates via Socket.IO client                             |
+------------------------------------------------------------------------+
                                    |
                                    v  HTTP / HTTPS REST + WSS
+------------------------------------------------------------------------+
|                        API GATEWAY & MIDDLEWARE                        |
|   - Security: Helmet, CORS, Mongo-Sanitize, HPP                        |
|   - Rate Limiter (express-rate-limit)                                  |
|   - Authentication & Token Extraction (JWT Access / Refresh)           |
|   - Multi-Tenant Resolver (resolveTenantContext header/subdomain)      |
|   - Role-Based Access Control (RBAC Guard)                             |
|   - Request Validation (express-validator)                             |
+------------------------------------------------------------------------+
                                    |
                                    v
+------------------------------------------------------------------------+
|                          CONTROLLER TIER                               |
|   Routes: Auth, Hospitals, Users, Doctors, Patients, Appointments,     |
|           Visits, Bills, Analytics, Inventory, Lab Reports             |
+------------------------------------------------------------------------+
                                    |
                                    v
+------------------------------------------------------------------------+
|                           SERVICE LAYER                                |
|   - Domain Logic & Clinical Rules Validation                           |
|   - Cross-Hospital Consent Verification Engine                         |
|   - Concurrency Manager (Slot Reservation & Collision Prevention)      |
|   - Event Dispatcher (BullMQ Job Producer)                             |
+------------------------------------------------------------------------+
                   |                                    |
                   v                                    v
+-----------------------------------+   +--------------------------------+
|         STORAGE TIER              |   |       CACHING & QUEUES         |
|   MongoDB Cluster (Mongoose ODM)  |   |   Redis (ioredis)              |
|   - Multi-tenant query filtering  |   |   - Distributed Slot Locking   |
|   - Compound unique indexing      |   |   - Session & Token Blacklist  |
|   - AWS S3: Medical Lab Reports   |   |   - BullMQ Asynchronous Jobs   |
+-----------------------------------+   +--------------------------------+
                                                        |
                                                        v
                                        +--------------------------------+
                                        |        BACKGROUND WORKERS      |
                                        |   - Notification Worker (Email)|
                                        |   - SMS Alert Dispatcher       |
                                        |   - Reminder Worker (Cron)     |
                                        +--------------------------------+
```

---

## Repository Blueprint

```
.
├── .gitignore                          # Unified multi-tier gitignore
├── README.md                           # Master workspace overview & quickstart
├── TODO.md                             # Future roadmap & strategic edge
├── backend/                            # Express / MongoDB / Redis API Server
│   ├── src/
│   │   ├── config/                     # DB, Redis, Mail, AWS S3 configs
│   │   ├── controllers/                # HTTP request handlers by domain
│   │   ├── jobs/                       # BullMQ queues and background workers
│   │   ├── middlewares/                # Auth, RBAC, Tenant Scoping, Error handlers
│   │   ├── models/                     # Mongoose schemas & indexing rules
│   │   ├── routes/                     # Express route declarations
│   │   ├── services/                   # Business domain services
│   │   ├── utils/                      # Loggers, token helpers, response formatters
│   │   ├── app.js                      # Express application assembly
│   │   └── server.js                   # HTTP/WebSocket server listener
│   ├── tests/                          # Jest test suites (unit & integration)
│   ├── uploads/                        # Local temporary file uploads
│   ├── .env.example                    # Template environment variables
│   ├── Dockerfile                      # Containerization spec for API
│   ├── docker-compose.yml              # Local multi-service composition
│   └── package.json                    # Backend dependencies & runtime scripts
├── frontend/                           # React 19 + Vite + Tailwind Client
│   ├── public/                         # Static assets
│   ├── src/
│   │   ├── assets/                     # SVGs, icons, images
│   │   ├── components/                 # Reusable atomic & composite UI components
│   │   ├── layouts/                    # Role-specific dashboard layouts
│   │   ├── pages/                      # Application route views
│   │   ├── services/                   # Axios API clients & WebSocket connection
│   │   ├── store/                      # Redux Toolkit slices and root store
│   │   ├── App.jsx                     # Root React router tree
│   │   └── main.jsx                    # Application bootstrapping entrypoint
│   ├── .env.example                    # Frontend environment template
│   ├── index.html                      # HTML entrypoint
│   ├── vite.config.js                  # Vite configuration & dev proxy
│   └── package.json                    # Frontend dependencies & build scripts
└── docs/                               # System documentation repository
    ├── README.md                       # Documentation index
    ├── architecture.md                 # System boundaries, data flow & structure
    ├── onboarding.md                   # Developer launch & contribution guide
    ├── backend-structure.md            # Deep-dive backend domain breakdown
    ├── frontend-structure.md           # Deep-dive frontend view & store layout
    ├── implementation-plan.md          # Multi-phase project delivery plan
    ├── dashboard/                      # Role dashboard specifications
    └── security/                       # Security audits, RBAC & compliance models
```
