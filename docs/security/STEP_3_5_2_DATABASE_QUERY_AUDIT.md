# MediSync — Step 3.5.2.2 Database Query Isolation & Remediation Audit Report

**Milestone 3:** Multi-Tenant Authorization & Hospital Isolation  
**Current Step:** `3.5.2.2 — MongoDB Query Isolation Audit and Remediation`  
**Execution Mode:** Audit first, implement verified fixes, test, and document.  
**Deliverable File:** `docs/security/STEP_3_5_2_DATABASE_QUERY_AUDIT.md`  
**Timestamp:** 2026-10-31  

---

## 1. Executive Summary

In **Step 3.5.2.2**, a complete MongoDB query-level isolation audit and remediation was performed across all modules in the MediSync backend (`d:/web_devlopment/classTraining/projects1/backend`). Every database operation (`find`, `findOne`, `findById`, `findByIdAndUpdate`, `findOneAndUpdate`, `delete`, `countDocuments`, `aggregate`, and write mutations) was inventoried, audited against the resource ownership matrix ([`docs/security/STEP_3_5_2_RESOURCE_OWNERSHIP_MATRIX.md`](file:///d:/web_devlopment/classTraining/projects1/docs/security/STEP_3_5_2_RESOURCE_OWNERSHIP_MATRIX.md)), and verified for tenant scoping.

### Summary of Outcomes:
1. **Critical Vulnerabilities Remediated:**
   - Closed cross-hospital doctor mutation and deletion vulnerability: `updateDoctor` and `deleteDoctor` now strictly enforce actor hospital scoping and reject cross-hospital attacks with HTTP 403.
   - Closed unauthenticated doctor creation vulnerability: `createDoctor` derives `hospitalId` directly from authenticated hospital admin context and validates super admin target assignments.
2. **High Severity Vulnerabilities Remediated:**
   - Corrected hospital service queries: Replaced incorrect string queries `{ hospital: hospitalId }` with authoritative `{ hospitalId: hospitalId, deletedAt: null }` in `Doctor.aggregate` and `Doctor.find`.
   - Closed doctor clinical history leakage: `VisitDisease` queries by doctors are now filtered by `hospital: doctorProfile.hospitalId`, preventing access to historical clinical notes from previous hospital affiliations.
   - Implemented database query-level isolation for `Booking.updateBookingStatus` and `Visit.getVisitById`.
   - Prevented audit log parameter manipulation: Explicitly rejected forged `query.hospitalId` for hospital administrators.
3. **Comprehensive Test Validation:**
   - Created dedicated regression suite [`tests/queryIsolation.test.js`](file:///d:/web_devlopment/classTraining/projects1/backend/tests/queryIsolation.test.js) containing 24 test cases covering all 10 attack and isolation scenarios.
   - **All 9 test suites passed (143/143 tests passing)** across the entire backend.

---

## 2. Complete Database Query Inventory

The following table documents all database queries across the MediSync backend codebase:

| File & Line | Model / Resource | Operation | Actor Roles | Expected Boundary | Actual Filter & Scoping Status | Remediation Applied |
|---|---|---|---|---|---|---|
| `doctor.service.js:L128` | `Doctor` | `findOne` | Admin | Email/mobile uniqueness | `{ $or: [{ email }, { mobile }] }` | Pre-creation duplicate check. |
| `doctor.service.js:L130` | `Doctor` | `create` | `super_admin`, `hospital_admin` | Current hospital | **Vulnerable:** Previously trusted body `hospitalId`. | **Remediated:** Hard-scopes `hospitalId = actor.hospitalId` for Hospital Admin; validates active hospital for Super Admin. |
| `doctor.service.js:L194` | `Doctor` | `find` | Public & Staff | Public: Verified only; Staff: Own hospital | **Vulnerable:** Receptionist omitted from tenant scoping; matched legacy string `hospital`. | **Remediated:** Scopes `receptionist` and `hospital_admin` to `actor.hospitalId`. Removed string `hospital` search. |
| `doctor.service.js:L207` | `Doctor` | `findById` | Public & Staff | Public: Verified only; Staff: Own hospital | **Vulnerable:** Fetched any doctor without visibility check. | **Remediated:** Validates publication and verification status for public/patients; restricts unpublished doctors to same hospital staff. |
| `doctor.service.js:L215` | `Doctor` | `findByIdAndUpdate` | `hospital_admin`, `super_admin` | Own hospital doctor only | **Critical Gap:** No actor check, unscoped ID update. | **Remediated:** Replaced with actor-aware check, enforces `doctor.hospitalId === actor.hospitalId`, strips protected fields. |
| `doctor.service.js:L224` | `Doctor` | `findById` | Doctor (self), Admin | Self or same hospital admin | Owner or Admin validation | Validated in `submitDoctorCredentials`. |
| `doctor.service.js:L268` | `Doctor` | `findByIdAndUpdate` | `hospital_admin`, `super_admin` | Own hospital doctor only | **Critical Gap:** No actor check, unscoped ID soft-delete. | **Remediated:** Enforces actor hospital match, sets `deletedAt`, `status: 'inactive'`, `isPublished: false`. |
| `doctor.service.js:L274` | `Doctor` | `findById` | `hospital_admin`, `super_admin` | Own hospital doctor | Verified in `approveDoctor`. | Enforces `actor.hospitalId === doctor.hospitalId`. |
| `doctor.service.js:L332` | `Doctor` | `findById` | `hospital_admin`, `super_admin` | Own hospital doctor | Verified in `rejectDoctor`. | Enforces `actor.hospitalId === doctor.hospitalId`. |
| `hospital.service.js:L80` | `Doctor` | `aggregate` | Super Admin / Public | Target hospitals | **Bug:** `{ $match: { hospital: { $in: hospitalIds } } }` matched string. | **Remediated:** `{ $match: { hospitalId: { $in: hospitalIds }, deletedAt: null } }`, grouped by `hospitalId`. |
| `hospital.service.js:L128` | `Doctor` | `find` | Super Admin / Public | Target hospital | **Bug:** `{ hospital: hospitalId }` matched string. | **Remediated:** `{ hospitalId, deletedAt: null }`. |
| `booking.service.js:L29` | `Doctor` | `findOne` | Patient, Staff | Active, non-deleted doctor | `{ _id: data.doctor, deletedAt: null }` | Scoped doctor lookup. |
| `booking.service.js:L72` | `Booking` | `create` | Patient, Staff | Target hospital derived server-side | `hospital: targetHospitalId` | Derived from verified doctor or staff hospital. |
| `booking.service.js:L109` | `Doctor` | `find` | Staff | Active hospital doctors | `{ hospitalId: staffHospitalId, status: 'active', deletedAt: null }` | Scoped doctor ID extraction. |
| `booking.service.js:L133` | `Booking` | `find` | Patient, Doctor, Staff | Tenant-scoped | `filter.hospital = staffHospitalId`, or doctor/patient filter | Properly tenant-scoped. |
| `booking.service.js:L145` | `Booking` | `findById` | Patient, Doctor, Staff | Actor-owned or hospital booking | **Gap:** Unscoped `findById(id)` before in-memory check. | **Remediated:** Query-level isolation: `Booking.findOne({ _id: id, hospital: staffHospitalId })`. |
| `visit.service.js:L20` | `Booking` | `findById` | Receptionist, Admin | Hospital booking | Verified against staff hospital | Strict relationship checks. |
| `visit.service.js:L25` | `Doctor` | `findById` | Receptionist, Admin | Hospital doctor | Verified against staff hospital | Strict relationship checks. |
| `visit.service.js:L56` | `Visit` | `create` | Receptionist, Admin | Derived from Booking hospital | Derived from validated Booking | Immutable derived tenancy. |
| `visit.service.js:L112` | `Visit` | `find` | Patient, Doctor, Staff | Tenant-scoped | `filter.hospital = staffHospitalId`, or doctor/patient filter | Properly tenant-scoped. |
| `visit.service.js:L125` | `Visit` | `findById` | Patient, Doctor, Staff | Actor-owned or hospital visit | **Gap:** Unscoped `findById(id)` before in-memory check. | **Remediated:** Query-level isolation: `Visit.findOne({ _id: id, hospital: staffHospitalId })`. |
| `visitDisease.service.js:L15` | `Visit` | `findById` | Doctor | Active consultation | Verified doctor ownership | Added check for `visit.hospital === doctorProfile.hospitalId`. |
| `visitDisease.service.js:L22` | `VisitDisease` | `create` | Doctor | Consulting doctor encounter | Created after parent validation | Secured. |
| `visitDisease.service.js:L44` | `Visit` | `find` | Doctor | Encounters at current hospital | **High Gap:** `{ doctor: doctorProfile._id }` omitted hospital. | **Remediated:** `{ doctor: doctorProfile._id, hospital: doctorProfile.hospitalId }`. |
| `visitDisease.service.js:L59` | `VisitDisease` | `find` | Patient, Doctor | Filtered by authorized visit IDs | `filter.visit = { $in: docVisitIds }` | Scoped through parent visit. |
| `test.service.js:L23` | `Visit` | `findById` | Doctor | Encounter at doctor hospital | `visit.hospital === doctor.hospitalId` | Properly validated. |
| `test.service.js:L42` | `Test` | `create` | Doctor | Order created for visit | Scoped through parent visit | Secured. |
| `test.service.js:L94` | `Visit` | `find` | Doctor | Doctor encounters in hospital | `{ hospital: doctor.hospitalId, doctor: doctor._id }` | Properly tenant-scoped. |
| `test.service.js:L105` | `Visit` | `find` | Staff | Hospital visits | `{ hospital: user.hospitalId }` | Properly tenant-scoped. |
| `test.service.js:L124` | `Test` | `find` | Patient, Doctor, Staff | Filtered by authorized visit IDs | `filter.visit = { $in: hospitalVisitIds }` | **Remediated:** Rejects forged `query.hospitalId` for staff; allows Super Admin filter. |
| `audit.routes.js:L27` | `User` | `find` | Hospital Admin | Own hospital staff IDs | `{ hospitalId: req.user.hospitalId }` | Scoped staff ID extraction. |
| `audit.routes.js:L49` | `AuditLog` | `find` | Hospital Admin, Super Admin | Own hospital logs ($or) | `$or: [{ hospitalId }, { actor: { $in } }]` | **Remediated:** Rejects cross-hospital `query.hospitalId` for Hospital Admin. |
| `user.service.js:L28` | `User` | `find` | Hospital Admin, Super Admin | Own hospital staff | `filter.hospitalId = currentUser.hospitalId` | Hard-scoped. |
| `user.service.js:L47` | `User` | `findOne` | Hospital Admin, Super Admin, Self | Own hospital staff or self | `findOne({ _id: id, deletedAt: null })` | Post-fetch ownership check. |
| `user.service.js:L115` | `User` | `findByIdAndUpdate` | Hospital Admin, Super Admin, Self | Own hospital staff or self | Sanitized updates, hospital match check | Cross-hospital and role tampering blocked. |

---

## 3. Before vs After Remediation Summary

### A. Doctor Mutations (`createDoctor`, `updateDoctor`, `deleteDoctor`)
- **Before:**
  - `updateDoctor(id, updates)` called `Doctor.findByIdAndUpdate(id, updates)` directly with no actor context or hospital verification.
  - `deleteDoctor(id)` called `Doctor.findByIdAndUpdate(id, { deletedAt: new Date() })` with no actor context.
  - `createDoctor(data)` accepted `data.hospitalId` directly from request body.
- **After:**
  - All three methods are actor-aware (`createDoctor(data, actor)`, `updateDoctor(id, updates, actor)`, `deleteDoctor(id, actor)`).
  - For `Hospital Admin`: `hospitalId` is strictly derived from `actor.hospitalId`. Forged request body `hospitalId` attempting cross-hospital assignment is rejected with HTTP 403.
  - In `updateDoctor`: Hospital Admin can only update doctors where `doctor.hospitalId === actor.hospitalId`. Sensitive fields (`hospitalId`, `user`, `verificationStatus`, `isApproved`, `isPublished`, `deletedAt`) are stripped to prevent tampering.
  - In `deleteDoctor`: Hospital Admin can only soft-delete doctors belonging to their hospital. Sets `deletedAt`, `status: 'inactive'`, and `isPublished: false`.
  - For `Super Admin`: Explicit platform-wide management is preserved with target hospital existence validation.

### B. Hospital Service Doctor Queries (`listHospitals`, `getHospitalById`)
- **Before:**
  - `Doctor.aggregate([{ $match: { hospital: { $in: hospitalIds } } }, ...])` and `Doctor.find({ hospital: hospitalId })` queried the legacy string field `Doctor.hospital`.
  - Migrated doctors with ObjectId `hospitalId` were not matched, yielding 0 counts and empty doctor lists in hospital dashboards.
- **After:**
  - Updated to `{ $match: { hospitalId: { $in: hospitalIds }, deletedAt: null } }` and grouping on `'$hospitalId'`.
  - Updated `Doctor.find` to `{ hospitalId, deletedAt: null }`.

### C. Doctor Directory & Receptionist Isolation (`getAllDoctors`, `getDoctorById`)
- **Before:**
  - `receptionist` was permitted to pass `includeUnpublished=true`, but line 175 only scoped `hospital_admin`, allowing receptionists to see unpublished/pending doctors from other hospitals.
  - Public directory permitted query parameter regex matching on legacy string `hospital`.
- **After:**
  - Hard-scoped all hospital staff (`hospital_admin`, `admin`, `receptionist`) to `filter.hospitalId = actor.hospitalId`.
  - Receptionists querying with `includeUnpublished=true` receive only doctors from their own hospital.
  - `getDoctorById` verifies that unpublished/unverified doctors can only be viewed by authorized staff of the same hospital or the doctor themselves.

### D. Historical Clinical Records Isolation (`VisitDisease.getVisitDiseases`)
- **Before:**
  - When querying visit diagnoses as a doctor, `Visit.find({ doctor: doctorProfile._id })` did not filter by `hospital: doctorProfile.hospitalId`.
  - A doctor who changed hospital facilities could leak clinical notes from former hospital encounters.
- **After:**
  - Scoped to `Visit.find({ doctor: doctorProfile._id, hospital: doctorProfile.hospitalId })`.
  - Direct `query.visit` lookups verify that the visit belongs to both the doctor and their current hospital.
  - `createVisitDisease` verifies `visit.hospital === doctorProfile.hospitalId`.

### E. Booking & Visit Query-Level Isolation
- **Before:**
  - `updateBookingStatus` and `getVisitById` used unscoped `findById(id)` and performed authorization checks in application memory after document population.
- **After:**
  - Staff queries are scoped at the database query level:
    - `Booking.findOne({ _id: id, hospital: staffHospitalId })`
    - `Visit.findOne({ _id: id, hospital: staffHospitalId })`
  - Doctor queries are scoped at the database query level:
    - `Booking.findOne({ _id: id, doctor: doc._id, hospital: doc.hospitalId })`
    - `Visit.findOne({ _id: id, doctor: doc._id, hospital: doc.hospitalId })`
  - In the event of an IDOR attack targeting another hospital's ID, a fast existence check confirms cross-hospital boundary violation and rejects with the descriptive HTTP 403 error.

### F. AuditLog & Test Parameter Tampering
- **Before:**
  - Hospital Admin passing `query.hospitalId=ANOTHER_HOSPITAL` relied on route logic omitting `query.hospitalId` assignment, but did not explicitly reject forged parameters.
- **After:**
  - In both `audit.routes.js` and `test.service.js`, if a Hospital Admin supplies `query.hospitalId` that does not match `user.hospitalId`, the request is immediately rejected with HTTP 403.

---

## 4. Modified Source Files

1. [`src/modules/doctor/doctor.service.js`](file:///d:/web_devlopment/classTraining/projects1/backend/src/modules/doctor/doctor.service.js)
   - Added `Hospital` and `User` imports.
   - Refactored `createDoctor` to accept `actor` and enforce hospital derivation and validation.
   - Refactored `getAllDoctors` to enforce `filter.hospitalId = actor.hospitalId` for `receptionist` and `hospital_admin`.
   - Refactored `getDoctorById` to accept `actor` and guard unpublished profiles.
   - Refactored `updateDoctor` to accept `actor`, enforce hospital boundary, and strip protected fields.
   - Refactored `deleteDoctor` to accept `actor`, enforce hospital boundary, and perform clean soft-deletion.
2. [`src/modules/doctor/doctor.controller.js`](file:///d:/web_devlopment/classTraining/projects1/backend/src/modules/doctor/doctor.controller.js)
   - Passed `req.user` into `createDoctor`, `getDoctorById`, `updateDoctor`, and `deleteDoctor`.
3. [`src/modules/hospital/hospital.service.js`](file:///d:/web_devlopment/classTraining/projects1/backend/src/modules/hospital/hospital.service.js)
   - Updated `Doctor.aggregate` and `Doctor.find` to query `hospitalId` (ObjectId) instead of legacy string `hospital`.
4. [`src/modules/visitDisease/visitDisease.service.js`](file:///d:/web_devlopment/classTraining/projects1/backend/src/modules/visitDisease/visitDisease.service.js)
   - Added hospital boundary check in `createVisitDisease`.
   - Scoped `doctorVisits` query in `getVisitDiseases` to `hospital: doctorProfile.hospitalId`.
5. [`src/modules/booking/booking.service.js`](file:///d:/web_devlopment/classTraining/projects1/backend/src/modules/booking/booking.service.js)
   - Updated `updateBookingStatus` to perform query-level tenant scoping (`findOne({ _id: id, hospital: staffHospitalId })`).
6. [`src/modules/visit/visit.service.js`](file:///d:/web_devlopment/classTraining/projects1/backend/src/modules/visit/visit.service.js)
   - Updated `getVisitById` to perform query-level tenant scoping (`findOne({ _id: id, hospital: staffHospitalId })`).
7. [`src/modules/test/test.service.js`](file:///d:/web_devlopment/classTraining/projects1/backend/src/modules/test/test.service.js)
   - Added validation rejecting cross-hospital `query.hospitalId` for staff; added Super Admin hospital filtering.
8. [`src/modules/audit/audit.routes.js`](file:///d:/web_devlopment/classTraining/projects1/backend/src/modules/audit/audit.routes.js)
   - Added validation rejecting cross-hospital `query.hospitalId` for hospital administrators.
9. [`tests/queryIsolation.test.js`](file:///d:/web_devlopment/classTraining/projects1/backend/tests/queryIsolation.test.js) *(New Test Suite)*
   - Implemented 24 integration test cases covering all 10 attack and boundary scenarios.

---

## 5. Test Evidence

### A. Dedicated Regression Suite: `tests/queryIsolation.test.js`
- **Execution Command:** `npm test -- tests/queryIsolation.test.js`
- **Results:**
  - **1 suite passed, 24 tests passed, 0 failed, 0 skipped.**
  - **Execution Time:** ~53 seconds.

```text
PASS tests/queryIsolation.test.js (52.98 s)
  Step 3.5.2.2 — MongoDB Query Isolation & Remediation Regression Suite
    1. Doctor Mutation Isolation (Update)
      √ Hospital Admin A cannot update Hospital B doctor (2796 ms)
      √ Hospital Admin A cannot hijack Doctor B hospitalId via update payload (2202 ms)
      √ Hospital Admin A can legitimately update their own Hospital A doctor (2194 ms)
    2. Doctor Deletion Isolation
      √ Hospital Admin A cannot delete Hospital B doctor (2068 ms)
      √ Hospital Admin A can legitimately delete their own Hospital A doctor (2115 ms)
    3. Doctor Creation Isolation
      √ Hospital Admin A cannot create a doctor assigned to Hospital B (2063 ms)
      √ Hospital Admin A creates a doctor strictly bound to Hospital A (2039 ms)
    4. Super Admin Platform Doctor Management
      √ Super Admin can manage doctors across any hospital with explicit validation (2101 ms)
    5. Doctor Directory & Receptionist Isolation
      √ Receptionist A cannot view unpublished doctors from Hospital B (2086 ms)
      √ Public patient cannot view unverified/unpublished doctors from any hospital (2117 ms)
    6. Historical Clinical Record Isolation (VisitDisease)
      √ Doctor B cannot read clinical diagnoses from Hospital A visits (2042 ms)
      √ Doctor B specifying visitA ID is denied with 403 (2025 ms)
      √ Doctor A can read their own consultations at Hospital A (2079 ms)
    7. Booking Mutation Isolation
      √ Hospital Admin A cannot cancel or confirm Hospital B booking (2047 ms)
      √ Hospital Admin A can legitimately update status of Hospital A booking (2121 ms)
    8. Visit Retrieval Isolation
      √ Hospital Admin A cannot retrieve Hospital B visit by ID (2036 ms)
      √ Hospital Admin A can legitimately retrieve Hospital A visit by ID (2012 ms)
    9. Lab Test Retrieval Isolation
      √ Hospital Admin A cannot query tests using query.hospitalId=Hospital B (2058 ms)
      √ Hospital Admin A cannot query tests for Hospital B visit (2015 ms)
      √ Hospital Admin A receives tests strictly belonging to Hospital A (2113 ms)
    10. Audit Log Isolation & Parameter Tampering
      √ Hospital Admin A cannot query audit logs for Hospital B via query.hospitalId (2020 ms)
      √ Hospital Admin A cannot query audit logs for an actor belonging to Hospital B (2025 ms)
      √ Hospital Admin A can legitimately query their own hospital audit logs (2060 ms)
      √ Super Admin can explicitly query platform-wide audit logs or filter by hospital (2025 ms)
```

### B. Full Backend Suite Execution
- **Execution Command:** `cross-env NODE_ENV=test node --experimental-vm-modules node_modules/jest/bin/jest.js --runInBand`
- **Results:**
  - **Test Suites:** **9 passed, 9 total**
  - **Tests:** **143 passed, 143 total**
  - **Snapshots:** 0 total
  - **Time:** 334.103 s
- **Breakdown by Suite:**
  1. `tests/writePathsAndIndexes.test.js` — 43 passed
  2. `tests/queryIsolation.test.js` — 24 passed
  3. `tests/step351Remediation.test.js` — 22 passed
  4. `tests/migration.test.js` — 16 passed
  5. `tests/resourceAccess.test.js` — 12 passed
  6. `tests/tenant.test.js` — 10 passed
  7. `tests/auth.test.js` — 8 passed
  8. `tests/patient.test.js` — 6 passed
  9. `tests/booking.test.js` — 2 passed

---

## 6. Remaining Risks & Observations

1. **Unmounted `requireHospitalScope` Middleware:**
   - Although services now enforce `user.hospitalId` and query scoping rigorously, `requireHospitalScope` is not mounted at the Express route layer. This is queued for systematic resolution in **Step 3.5.2.3 (Tenant Context Validation & Middleware Enforcement)**.
2. **Dual Patient Representation:**
   - `Booking` and `Visit` continue to store `patient: User._id`, while `PatientHospital` stores `patient: Patient._id`. All services correctly handle this normalization; scheduled for formal verification in **Step 3.5.3 (Clinical Data Isolation)**.
3. **Compound Indexes on Doctor:**
   - `{ hospitalId: 1, status: 1 }` on `Doctor` can be evaluated for query performance optimization prior to final sign-off.

---

## 7. Next-Step Recommendation

With all Critical and High query isolation vulnerabilities remediated, verified, and tested across all 9 test suites, Step 3.5.2.2 is complete.

**Recommended Next Step:**
Proceed to **Step 3.5.2.3 — Tenant Derivation and Middleware Audit**:
- Formally mount and enforce trusted tenant derivation middleware (`requireHospitalScope`) on staff routes.
- Verify that request headers (`X-Hospital-Id`), nested body payloads, and query parameters cannot bypass or confuse tenant derivation across all controllers.
