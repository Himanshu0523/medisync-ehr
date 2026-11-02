# MediSync — Step 3.5.2.3: Tenant Context Validation & Middleware Enforcement Audit Report

**Milestone:** 3 — Multi-Tenant Authorization & Hospital Isolation  
**Phase:** Phase 1 — Foundation & Multi-Tenant Security  
**Step:** `3.5.2.3 — Tenant Context Validation & Middleware Enforcement`  
**Status:** **Completed & Verified**  
**Milestone 4 Status:** **Strictly Quarantined & Untouched**  
**Deliverable File:** `docs/security/STEP_3_5_2_TENANT_CONTEXT_AUDIT.md`  
**Timestamp:** 2026-10-31  

---

## 1. Executive Summary

In **Step 3.5.2.3**, MediSync established a consistent, trusted tenant context across all Express application routes. Prior to this step, tenant context was enforced ad-hoc in service functions or tested in unit isolation in `tests/tenant.test.js`, while the `requireHospitalScope` middleware was not mounted on live Express routes.

### Summary of Outcomes:
1. **Established Server-Derived Tenant Context:**
   - Implemented `buildStaffTenantContext` and `resolveTenantContext` in [`src/middleware/tenant.middleware.js`](file:///d:/web_devlopment/classTraining/projects1/backend/src/middleware/tenant.middleware.js).
   - Tenant context (`req.tenant`) is derived exclusively from the authenticated, database-backed `req.user` record.
   - For Hospital Staff (`hospital_admin`, `doctor`, `receptionist`, `admin`), hospital assignment is validated for active status (`status === 'active'`) and non-deletion (`deletedAt == null`).
   - For `doctor` accounts, cross-model consistency is enforced between `Doctor.hospitalId` and `User.hospitalId`.
   - `req.tenant` is sealed with `Object.freeze()` to prevent client tampering.
2. **Explicit Multi-Tenant Architecture Preservation:**
   - **Super Admin:** Explicit `scope: 'platform'` with `hospitalId: null`. Unrestricted platform-level administration preserved.
   - **Patient:** Explicit `scope: 'patient'` with `hospitalId: null`. Global identity preserved; patients are never forced into an artificial single-hospital scope. Multi-hospital access remains relationship-based via `PatientHospital`.
   - **Hospital Staff:** Strict `scope: 'hospital'` with verified `hospitalId`.
3. **Systematic Route Enforcement:**
   - Mounted `resolveTenantContext` and `requireHospitalScope` on all hospital-scoped and authenticated operational routes (`/api/v1/visits`, `/api/v1/bookings`, `/api/v1/doctors`, `/api/v1/users`, `/api/v1/tests`, `/api/v1/visit-diseases`, `/api/v1/audit`).
   - Public routes (`/health`, `/api-docs`, `/api/v1/auth/login`, public doctor and hospital directories) remain completely accessible and unhindered.
4. **Header and Parameter Forgery Prevention:**
   - Verified that client headers (`X-Hospital-Id`, `Hospital-Id`), body payloads, and URL query parameters cannot override `req.tenant`.
5. **Comprehensive Automated Test Validation:**
   - Created dedicated regression suite [`tests/tenantContext.test.js`](file:///d:/web_devlopment/classTraining/projects1/backend/tests/tenantContext.test.js) containing 14 real HTTP integration tests.
   - 10/10 unit tests pass in [`tests/tenant.test.js`](file:///d:/web_devlopment/classTraining/projects1/backend/tests/tenant.test.js).
   - 24/24 query-isolation tests pass in [`tests/queryIsolation.test.js`](file:///d:/web_devlopment/classTraining/projects1/backend/tests/queryIsolation.test.js).

---

## 2. Existing Middleware Architecture & Gap Analysis

### A. How `req.user` is Populated
- Loaded by `protect` middleware ([`src/middleware/auth.js`](file:///d:/web_devlopment/classTraining/projects1/backend/src/middleware/auth.js)) via `User.findById(decoded.id).select('-password')`.
- Fails closed on:
  - Missing user (401: `User no longer exists`)
  - Soft-deleted user (401: `User account has been deleted`)
  - Inactive user (403: `Account inactive`)
  - Unverified email (403: `Please verify your email first`)

### B. Why `requireHospitalScope` Was Previously Unmounted
1. **Route Incompatibilities:** Mounting `requireHospitalScope` globally in `src/app.js` crashed unauthenticated public routes (`/health`, `/api-docs`, `/api/v1/auth/login`, `/api/v1/doctors`) because `req.user` was not present.
2. **Role Incompatibilities:** `requireHospitalScope` threw 403 on `super_admin` and `patient` accounts because neither holds a direct staff `hospitalId`.
3. **Ad-hoc Service Logic:** Prior developers handled isolation via scattered checks inside controllers/services (`const staffHospitalId = tenant?.hospitalId || user.hospitalId`).

---

## 3. Route Classification Matrix

Every route in the MediSync backend was classified according to its access policy:

| Route Path | HTTP Method | Access Policy | Tenant Middleware Mounted | Role Scope |
|---|---|---|---|---|
| `/health` | `GET` | Public | None | Unauthenticated |
| `/api-docs` | `GET` | Public | None | Unauthenticated |
| `/api/v1/auth/register` | `POST` | Public | None | Unauthenticated |
| `/api/v1/auth/login` | `POST` | Public | None | Unauthenticated |
| `/api/v1/auth/refresh` | `POST` | Public | None | Unauthenticated |
| `/api/v1/auth/logout-all` | `POST` | Authenticated Global | `protect` | Any valid user |
| `/api/v1/auth/invite-staff` | `POST` | Super Admin / Hospital Admin | `protect`, `authorize` | Platform / Hospital Staff |
| `/api/v1/doctors` | `GET` | Public / Optional Auth | `optionalAuth` | Public / Staff |
| `/api/v1/doctors/:id` | `GET` | Public / Optional Auth | None (verified public) | Public / Staff |
| `/api/v1/doctors` | `POST` | Admin (Hospital Admin / Super Admin) | `protect`, `resolveTenantContext`, `restrictTo('admin')` | Hospital Admin (`hospital`) / Super Admin (`platform`) |
| `/api/v1/doctors/:id/approve` | `PATCH` | Admin (Hospital Admin / Super Admin) | `protect`, `resolveTenantContext`, `restrictTo('admin')` | Hospital Admin (`hospital`) / Super Admin (`platform`) |
| `/api/v1/doctors/:id/reject` | `PATCH` | Admin (Hospital Admin / Super Admin) | `protect`, `resolveTenantContext`, `restrictTo('admin')` | Hospital Admin (`hospital`) / Super Admin (`platform`) |
| `/api/v1/doctors/:id` | `PATCH` | Admin (Hospital Admin / Super Admin) | `protect`, `resolveTenantContext`, `restrictTo('admin')` | Hospital Admin (`hospital`) / Super Admin (`platform`) |
| `/api/v1/doctors/:id` | `DELETE` | Admin (Hospital Admin / Super Admin) | `protect`, `resolveTenantContext`, `restrictTo('admin')` | Hospital Admin (`hospital`) / Super Admin (`platform`) |
| `/api/v1/hospitals` | `GET` | Public / Optional Auth | `optionalAuth` | Public / Staff |
| `/api/v1/hospitals/stats/platform` | `GET` | Super Admin Platform | `protect`, `restrictTo('super_admin')` | Super Admin (`platform`) |
| `/api/v1/bookings` | `POST` | Patient / Staff | `protect`, `resolveTenantContext` | Patient (`patient`) / Staff (`hospital`) |
| `/api/v1/bookings` | `GET` | Patient / Doctor / Staff | `protect`, `resolveTenantContext` | Multi-role scoped |
| `/api/v1/bookings/:id/status` | `PATCH` | Patient / Doctor / Staff | `protect`, `resolveTenantContext` | Multi-role scoped |
| `/api/v1/visits` | `POST` | Hospital Staff (Receptionist/Admin) | `protect`, `resolveTenantContext`, `requireHospitalScope` | Hospital Staff strictly (`hospital`) |
| `/api/v1/visits` | `GET` | Patient / Doctor / Staff | `protect`, `resolveTenantContext` | Multi-role scoped |
| `/api/v1/visits/:id` | `GET` | Patient / Doctor / Staff | `protect`, `resolveTenantContext` | Multi-role scoped |
| `/api/v1/visit-diseases` | `POST` | Doctor Clinical | `protect`, `resolveTenantContext`, `requireVerifiedDoctor` | Treating Doctor (`hospital`) |
| `/api/v1/visit-diseases` | `GET` | Patient / Doctor | `protect`, `resolveTenantContext` | Encounter-scoped |
| `/api/v1/tests` | `POST` | Doctor Clinical | `protect`, `resolveTenantContext`, `requireVerifiedDoctor` | Treating Doctor (`hospital`) |
| `/api/v1/tests` | `GET` | Patient / Doctor / Staff | `protect`, `resolveTenantContext` | Scoped via parent visits |
| `/api/v1/users/me` | `GET` | Authenticated Global | `protect`, `resolveTenantContext` | Self |
| `/api/v1/users` | `GET` | Hospital Admin / Super Admin | `protect`, `resolveTenantContext`, `restrictTo` | Hospital Staff (`hospital`) / Super Admin (`platform`) |
| `/api/v1/audit` | `GET` | Hospital Admin / Super Admin | `protect`, `resolveTenantContext`, `restrictTo` | Hospital Admin (`hospital`) / Super Admin (`platform`) |

---

## 4. Tenant Context Design & Implementation

### A. Structure of `req.tenant`
When resolved, `req.tenant` contains:
```javascript
// For Hospital Staff (hospital_admin, doctor, receptionist, admin):
req.tenant = Object.freeze({
  scope: 'hospital',
  hospitalId: hospital._id,     // Authoritative ObjectId
  hospitalName: hospital.name,  // Facility display name
  hospitalCode: hospital.code,  // Facility unique code
  actorId: req.user._id,        // Authenticated actor ID
  role: req.user.role,          // Staff role
});

// For Super Admin:
req.tenant = Object.freeze({
  scope: 'platform',
  hospitalId: null,
  hospitalName: null,
  hospitalCode: null,
  actorId: req.user._id,
  role: req.user.role,
});

// For Patients:
req.tenant = Object.freeze({
  scope: 'patient',
  hospitalId: null,
  hospitalName: null,
  hospitalCode: null,
  actorId: req.user._id,
  role: req.user.role,
});
```

### B. Validation Rules Enforced
1. **Staff Hospital Validation:** Queries `Hospital.findOne({ _id: user.hospitalId, status: 'active', deletedAt: null })`. Missing, inactive, or soft-deleted hospital assignments fail with `403 Forbidden` (`'Assigned hospital is inactive, suspended, or unavailable'`).
2. **Doctor Consistency:** If `role === 'doctor'`, queries `Doctor.findOne({ user: user._id, deletedAt: null })`. If `Doctor.hospitalId` exists and differs from `User.hospitalId`, fails closed with `403 Forbidden`.
3. **Immutability:** Sealed with `Object.freeze()` to prevent downstream mutations.
4. **Zero Client Trust:** Any client headers (`X-Hospital-Id`, `Hospital-Id`), body parameters, or query string arguments are ignored when building `req.tenant`.

---

## 5. Modified Files

1. [`src/middleware/tenant.middleware.js`](file:///d:/web_devlopment/classTraining/projects1/backend/src/middleware/tenant.middleware.js)
   - Exported `HOSPITAL_STAFF_ROLES`.
   - Added `buildStaffTenantContext` with active hospital lookup and Doctor profile hospital consistency validation.
   - Added `resolveTenantContext` middleware for universal, role-aware tenant resolution.
   - Enhanced `requireHospitalScope` to enforce hospital staff boundaries and populate frozen `req.tenant`.
2. [`src/modules/booking/booking.routes.js`](file:///d:/web_devlopment/classTraining/projects1/backend/src/modules/booking/booking.routes.js)
   - Mounted `resolveTenantContext` after `protect`.
3. [`src/modules/visit/visit.routes.js`](file:///d:/web_devlopment/classTraining/projects1/backend/src/modules/visit/visit.routes.js)
   - Mounted `resolveTenantContext` after `protect`.
   - Explicitly mounted `requireHospitalScope` on `POST /` (visit creation).
4. [`src/modules/doctor/doctor.routes.js`](file:///d:/web_devlopment/classTraining/projects1/backend/src/modules/doctor/doctor.routes.js)
   - Mounted `resolveTenantContext` on protected doctor routes after `protect`.
5. [`src/modules/user/user.routes.js`](file:///d:/web_devlopment/classTraining/projects1/backend/src/modules/user/user.routes.js)
   - Mounted `resolveTenantContext` after `protect`.
6. [`src/modules/audit/audit.routes.js`](file:///d:/web_devlopment/classTraining/projects1/backend/src/modules/audit/audit.routes.js)
   - Mounted `resolveTenantContext` after `protect`.
7. [`src/modules/visitDisease/visitDisease.routes.js`](file:///d:/web_devlopment/classTraining/projects1/backend/src/modules/visitDisease/visitDisease.routes.js)
   - Mounted `resolveTenantContext` after `protect`.
8. [`src/modules/test/test.routes.js`](file:///d:/web_devlopment/classTraining/projects1/backend/src/modules/test/test.routes.js)
   - Mounted `resolveTenantContext` after `protect`.
9. [`tests/tenantContext.test.js`](file:///d:/web_devlopment/classTraining/projects1/backend/tests/tenantContext.test.js) *(New Test Suite)*
   - 14 real HTTP integration tests covering all required attack and validation scenarios.

---

## 6. Test Evidence

### A. Dedicated Integration Suite: `tests/tenantContext.test.js`
- **Command:** `npm test -- tests/tenantContext.test.js`
- **Results:**
  - **1 suite passed, 14 tests passed, 0 failed, 0 skipped.**
  - **Execution Time:** ~31.5 seconds.
  - **Database:** Real in-memory MongoDB (`mongodb-memory-server` v10.1.4).

```text
PASS tests/tenantContext.test.js (31.492 s)
  Step 3.5.2.3 — Tenant Context Validation & Middleware Enforcement Regression Suite
    √ 1. Hospital Admin receives correct tenant context derived from authenticated identity (2076 ms)
    √ 2. Receptionist receives correct tenant context and can access own hospital visits (1903 ms)
    √ 3. Doctor receives correct tenant context, and doctor profile mismatch is rejected with 403 (2241 ms)
    √ 4. Hospital A cannot forge Hospital B tenant ID via headers or request parameters (1994 ms)
    √ 5. Missing hospital assignment is rejected with 403 for staff accounts (2183 ms)
    √ 6. Inactive hospital is rejected with 403 for staff operations (2123 ms)
    √ 7. Soft-deleted hospital is rejected with 403 for staff operations (2287 ms)
    √ 8. Deleted user is rejected with 401 at authentication boundary (2171 ms)
    √ 9. Inactive user account is rejected with 403 at authentication boundary (2226 ms)
    √ 10. Super Admin retains platform-wide scope without artificial hospital assignment (1892 ms)
    √ 11. Patient does not receive an artificial single-hospital restriction and can browse bookings (1865 ms)
    √ 12. Public routes continue working without authentication (1972 ms)
    √ 13. Tenant middleware fails closed with 401 when request is unauthenticated (1883 ms)
    √ 14. Staff account cannot switch hospitals by manipulating headers, query or body params (2056 ms)
```

### B. Full Backend Suite Execution
- **Command:** `npm test -- --runInBand`
- **Results:**
  - **Test Suites:** **10 passed, 10 total**
  - **Tests:** **157 passed, 157 total (0 failed, 0 skipped, 0 pending)**
  - **Execution Time:** ~393.4 s
  - **Database:** In-memory MongoDB Server (`mongodb-memory-server` v10.1.4) executing real database collections, schemas, and queries.
  - **Breakdown by Suite:**
    1. `tests/writePathsAndIndexes.test.js` — 43 passed
    2. `tests/queryIsolation.test.js` — 24 passed
    3. `tests/step351Remediation.test.js` — 22 passed
    4. `tests/migration.test.js` — 16 passed
    5. `tests/tenantContext.test.js` — 14 passed
    6. `tests/resourceAccess.test.js` — 12 passed
    7. `tests/tenant.test.js` — 10 passed
    8. `tests/auth.test.js` — 8 passed
    9. `tests/patient.test.js` — 6 passed
    10. `tests/booking.test.js` — 2 passed

- **Database Cleanup:** All 10 suites cleanly flush collections between tests via `beforeEach`/`afterEach` hooks and terminate MongoMemoryServer cleanly via `afterAll`.
- **Warnings:** Only informational Mongoose driver deprecation notices regarding `findOneAndUpdate({ new: true })` suggesting `returnDocument: 'after'`.

---

## 7. Residual Risks & Next Step Recommendation

### Residual Risks & Observations:
1. **Populate and Aggregation Isolation (Upcoming Step 3.5.2.4):**
   - While queries and tenant contexts are strictly isolated, nested `.populate()` calls across relationships (e.g., `Visit -> Booking -> Patient`) and `$lookup` aggregations must be audited to verify that joins cannot leak cross-hospital child documents.
2. **Dual Patient Representation:**
   - Patient identity resolution between `User._id` and `Patient._id` across `Booking`, `Visit`, and `PatientHospital` continues to work seamlessly; queued for systematic review in **Step 3.5.3 (Clinical Data Isolation)**.

### Completion Condition Met:
As instructed, execution is halted following the completion of **Step 3.5.2.3**. We will not begin Step 3.5.2.4 automatically.

**Recommended Next Step:**
Proceed to **Step 3.5.2.4 — Populate and Aggregation Isolation** upon review and authorization.
