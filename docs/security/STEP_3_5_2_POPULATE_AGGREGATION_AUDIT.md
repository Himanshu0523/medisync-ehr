# MediSync — Step 3.5.2.4: Populate and Aggregation Isolation Audit & Final Verification

**Project:** MediSync  
**Milestone:** 3 — Multi-Tenant Authorization & Hospital Isolation  
**Phase:** Phase 1 — Foundation & Multi-Tenant Security  
**Step:** 3.5.2.4 — Populate and Aggregation Isolation (Final Source-Level Verification)  
**Status:** Remediated, Source-Verified & Regression Tested  
**Date:** October 31, 2026  

---

## 1. Executive Summary

During Step 3.5.2.4, an exhaustive audit, source remediation, and focused verification were conducted across all Mongoose `.populate()` paths, nested reference resolutions, and MongoDB aggregation pipelines (`aggregate()`) in MediSync.

### Core Review Directives & Outcomes:
1. **Per-Booking Doctor Isolation:** In multi-hospital patient booking queries, an optional `filter.hospital` is absent. `booking.service.js` now validates the relationship per individual booking (`String(doctor.hospitalId) === String(booking.hospital)`), safely setting `b.doctor = null` if any mismatched or cross-hospital doctor reference is detected.
2. **Clinical Authorization ObjectId Normalization:** In `clinicalAccess.service.js`, all hospital, doctor, and patient ID comparisons were hardened using normalized string extraction (`String(id._id || id)`), preventing type-coercion bypasses between `ObjectId`, populated document objects, and string representations.
3. **Parent Document Authorization Independence:** Confirmed across `booking.service.js`, `visit.service.js`, `doctor.service.js`, `audit.routes.js`, and `hospital.service.js` that populate `match` constraints returning `null` are **never** treated as authorization for parent documents. Parent documents are authorized strictly by authoritative tenant query boundaries and explicit ownership gates.
4. **Production Aggregation Inventory Clarification:** Documented the exact inventory of production pipelines: there are **exactly two** production `aggregate()` pipelines in the backend (both in `hospital.service.js`), both using tenant-scoped `$match` prior to `$group`. Confirmed that `$lookup`, `$facet`, and `$unwind` pipelines are **test-only regression suites** verifying that future joined pipelines cannot leak tenant data.
5. **Hospital Endpoint Authorization Matrix:** Verified the exact response JSON fields on `GET /api/v1/hospitals/:id` across 5 distinct caller profiles (Public visitor, Patient, Cross-hospital Staff, Own-hospital Staff, Super Admin), confirming zero leakage of `recentPatients` or private administrator details.

---

## 2. Production Aggregation Inventory vs. Test Verification Pipelines

### 2.1 Complete Production Aggregation Inventory
A full AST and pattern search across `backend/src` identified **exactly two** production `aggregate()` calls in the entire backend, located in [`src/modules/hospital/hospital.service.js`](file:///d:/web_devlopment/classTraining/projects1/backend/src/modules/hospital/hospital.service.js):

| # | Pipeline Location | Source Collection | Joined Collection | Operators Used | Tenant Ownership Condition | Authorization Boundary |
|---|---|---|---|---|---|---|
| **P1** | `hospital.service.js:81` (`listHospitals`) | `doctors` | *None* | `$match`, `$group` | `{ hospitalId: { $in: hospitalIds }, deletedAt: null }` | `hospitalIds` is derived directly from the authorized hospital query. For staff callers, `hospitalIds = [staff.hospitalId]`. For public callers, only active published hospitals are included. Soft-deleted doctors are excluded. |
| **P2** | `hospital.service.js:85` (`listHospitals`) | `patienthospitals` | *None* | `$match`, `$group` | `{ hospital: { $in: hospitalIds } }` | Scoped strictly to the same authorized `hospitalIds` array. Cross-hospital patient counts cannot be aggregated. |

### 2.2 Clarification on `$lookup`, `$facet`, and `$unwind`
- **Zero Production Joined Pipelines:** There are currently **no** `$lookup`, `$facet`, `$unwind`, `$graphLookup`, or `$unionWith` pipelines in `backend/src`.
- **Test-Only Verification Scenarios:** The `$lookup`, `$facet`, and `$unwind` aggregation tests in [`tests/populateAggregationIsolation.test.js`](file:///d:/web_devlopment/classTraining/projects1/backend/tests/populateAggregationIsolation.test.js) (Scenarios 8, 10, 11) were constructed intentionally to stress-test MongoDB query behavior, establishing verified isolation patterns (mandatory initial `$match` and pipeline-scoped joined filters) before future feature milestones introduce joined aggregations.
- **Rule for Future Pipelines:** Any future aggregation pipeline using `$lookup` must enforce the tenant constraint on both the source collection (`$match: { hospitalId }`) and within the joined pipeline `pipeline: [{ $match: { $expr: { $eq: ['$hospitalId', '$$targetHosp'] } } }]`.

---

## 3. Source-Level Verification & Vulnerability Remediation

### 3.1 Booking → Doctor Population Isolation
- **File:** [`src/modules/booking/booking.service.js`](file:///d:/web_devlopment/classTraining/projects1/backend/src/modules/booking/booking.service.js)
- **Problem Identified:** In `getBookings`, when queried by a patient without an optional `filter.hospital`, the populate match condition `{ hospitalId: filter.hospital }` evaluated to `{}` (unconstrained). If a booking contained a mismatched or forged doctor ID from another facility, that doctor's details would be populated.
- **Remediation Implemented:**
  1. Maintained the primary populate match for staff queries where `filter.hospital` is set.
  2. Implemented per-booking post-populate validation:
     ```javascript
     if (b.doctor) {
       const doctorHosp = b.doctor.hospitalId?._id || b.doctor.hospitalId;
       if (!doctorHosp || String(doctorHosp) !== String(b.hospital)) {
         b.doctor = null; // Safely omit mismatched doctor reference
       }
     }
     ```
  3. Replicated this validation in `updateBookingStatus` so that patient cancellations or staff updates never reflect a cross-hospital doctor.
- **Verified Behavior:** In Scenario 23 & 24, a patient with bookings at Hospital A and Hospital B sees doctors populated strictly corresponding to each booking's hospital. If a booking in Hospital A holds a doctor belonging to Hospital B, `b.doctor` is safely set to `null`.

### 3.2 Clinical Authorization ObjectId Normalization
- **File:** [`src/modules/authorization/clinicalAccess.service.js`](file:///d:/web_devlopment/classTraining/projects1/backend/src/modules/authorization/clinicalAccess.service.js)
- **Problem Identified:** Direct comparison `visit.hospital === activeHospitalId` fails if one is a Mongoose `ObjectId` and the other is a string, or if one is a populated object `{ _id: ... }`. Additionally, if a doctor profile had a null or unassigned hospital, an inadvertent equality or bypass might occur.
- **Remediation Implemented:**
  ```javascript
  const visitHospitalStr = String(visit.hospital?._id || visit.hospital || '');
  const activeHospitalStr = String(activeHospitalId?._id || activeHospitalId || '');

  if (!visitHospitalStr || !activeHospitalStr || visitHospitalStr !== activeHospitalStr) {
    throw new AppError('Cross-hospital access denied: You cannot access clinical records from a hospital facility you are no longer affiliated with', 403);
  }
  ```
  Normalized doctor and patient ID comparisons similarly.
- **Verified Behavior:** In Scenario 25, tested:
  - Matching ObjectIds (`ObjectId(A) === ObjectId(A)`) -> Granted.
  - Matching string representation (`String(A) === ObjectId(A)`) -> Granted.
  - Mismatching ObjectIds (`ObjectId(A) !== ObjectId(B)`) -> Denied (403).
  - Missing or null doctor hospital assignment -> Denied (403).

### 3.3 Parent Authorization After Populate Match
- **Files Verified:**
  - `src/modules/booking/booking.service.js`
  - `src/modules/visit/visit.service.js`
  - `src/modules/doctor/doctor.service.js`
  - `src/modules/audit/audit.routes.js`
  - `src/modules/hospital/hospital.service.js`
- **Confirmation:**
  1. A missing or null populated reference is **never** treated as proof that access is authorized.
  2. In `visit.service.js`, if a staff member attempts `getVisitById` and the linked booking or doctor belongs to another hospital, the service explicitly rejects the request with `403 Forbidden` (`"Access denied: Linked booking/doctor belongs to another hospital facility"`).
  3. In `booking.service.js`, the parent booking is constrained by the authenticated user's ownership (patient owns `booking.patient`; staff owns `booking.hospital`). A null doctor indicates a severed reference, but cannot grant cross-tenant access.
  4. In `audit.routes.js`, `.populate('actor', 'name email role')` only enriches actor metadata on audit logs that already passed strict tenant filtering (`hospitalId: req.user.hospitalId`).

---

## 4. Hospital Endpoint Response Authorization Matrix

Endpoint: `GET /api/v1/hospitals/:id`

| Field in Document | 1. Public Visitor | 2. Patient | 3. Staff A (Req Hosp B) | 4. Staff A (Req Hosp A) | 5. Super Admin |
|---|---|---|---|---|---|
| `_id`, `name`, `type`, `address`, `city` | Yes | Yes | Yes | Yes | Yes |
| `phone`, `email` (General contact) | Yes | Yes | Yes | Yes | Yes |
| `stats.totalDoctors` | Yes | Yes | Yes | Yes | Yes |
| `administrators` | **Omitted** (`undefined`) | **Omitted** (`undefined`) | **Omitted** (`undefined`) | **Included** (Full admin profiles) | **Included** (Full admin profiles) |
| `recentPatients` (PII, DOB, gender) | **Omitted** (`undefined`) | **Omitted** (`undefined`) | **Omitted** (`undefined`) | **Included** (Recent hospital patients) | **Included** (Recent hospital patients) |

- **Verification:** Verified in integration test Scenario 26.
- **Public/Cross-Staff Behavior:** Callers without authoritative affiliation receive only public marketing/directory metadata. No user emails, phones, or patient names are returned.
- **Super Admin & Own-Staff Behavior:** Super Admin and authorized facility staff receive operational rosters required for hospital management.

---

## 5. Complete Step 3.5.2.4 Test Suite Inventory

File: [`tests/populateAggregationIsolation.test.js`](file:///d:/web_devlopment/classTraining/projects1/backend/tests/populateAggregationIsolation.test.js)  
**Total Tests: 27 | Passed: 27 | Failed: 0**

| # | Test Scenario Description | Purpose & Boundary Tested |
|---|---|---|
| 1 | Hospital A staff cannot populate Hospital B doctor information | Cross-hospital doctor populate sanitization |
| 2 | Hospital A staff cannot retrieve Hospital B visit details through nested population | Nested reference isolation |
| 3 | Hospital A staff cannot retrieve Hospital B tests through a populated Visit | Lab test nested boundary |
| 4 | A doctor cannot retrieve another hospital's VisitDisease history | Clinical diagnosis isolation |
| 5 | A patient can retrieve their own authorized records across multiple hospital affiliations | Global patient identity preservation |
| 6 | A patient cannot retrieve another patient's records through population | Horizontal patient authorization |
| 7 | A populated Booking cannot expose another hospital's Doctor | Booking populate boundary |
| 8 | A `$lookup` aggregation pipeline enforces tenant isolation boundary | Test verification: `$lookup` with tenant `$match` |
| 9 | An aggregation count does not include another hospital's documents | Count isolation |
| 10 | `$facet` branches preserve tenant filtering across parallel aggregation facets | Test verification: `$facet` isolation |
| 11 | `$unwind` does not expose unauthorized joined records | Test verification: `$unwind` boundary |
| 12 | AuditLog population does not leak cross-hospital actor or event information | Audit log actor sanitization |
| 13 | Super Admin retains legitimate platform-wide access | Platform administrative scope |
| 14 | Public doctor directory behavior sanitizes internal administrative reviewer identities | Public reviewer PII protection |
| 15 | Missing or invalid tenant context fails closed on hospital-scoped operations | Fail-closed middleware enforcement |
| 16 | Forged hospital IDs in query or headers cannot alter population scoping | Header/query spoofing defense |
| 17 | Public `GET /api/v1/hospitals/:id` does NOT leak `recentPatients` or administrators | Public endpoint PII sanitization |
| 18 | Hospital A staff `GET /api/v1/hospitals/:hospBId` does NOT leak Hospital B's `recentPatients` | Cross-tenant hospital inspection defense |
| 19 | Super Admin `GET /api/v1/hospitals/:id` retrieves complete management details | Super admin operational access |
| 20 | Hospital A Admin `GET /api/v1/hospitals/:hospAId` retrieves internal management and patient relations | Own-hospital operational access |
| 21 | A doctor cannot access former-hospital visit clinical records through `requireClinicalRecordAccess` | Doctor facility transfer isolation |
| 22 | Doctor profile missing `hospitalId` is rejected with `403 Forbidden` during tenant context build | Missing authoritative assignment defense |
| **23** | **Multi-hospital patient booking list validates doctor hospital per individual booking** | **Issue 1 Verification: Per-booking validation** |
| **24** | **Corrupted booking referencing cross-hospital doctor safely omits mismatched doctor reference (`doctor: null`)** | **Issue 1 & 3 Verification: Mismatched reference nullification** |
| **25** | **Clinical authorization ObjectId normalization robustness across types** | **Issue 2 Verification: String, ObjectId, populated, and null** |
| **26** | **Hospital endpoint response JSON validation across all 5 user profiles** | **Issue 5 Verification: Public, Patient, Staff A/B, Staff A/A, Super Admin** |
| **27** | **Production aggregation pipeline inventory verification (`Doctor.aggregate` and `PatientHospital.aggregate`)** | **Issue 4 Verification: Production vs test aggregation audit** |

---

## 6. Milestone 3 Verification Status & Next Steps

- **Milestone 4 Status:** Strictly quarantined. Zero Milestone 4 code modified.
- **Step 3.5.2.4 Status:** Remediated, source-verified, and passed across all 27 targeted integration tests.
- **Full Backend Suite Status:** 184 tests passed across 11 test suites.
- **Next Step:** Awaiting review and approval before proceeding to **Step 3.5.2.5 — Write-Path and Mutation Isolation**.
