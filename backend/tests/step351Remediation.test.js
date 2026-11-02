import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { api, createUser, loginAs } from './helpers.js';
import { signAccessToken } from '../src/utils/tokens.js';
import Hospital from '../src/modules/hospital/hospital.model.js';
import User from '../src/modules/user/user.model.js';
import Doctor from '../src/modules/doctor/doctor.model.js';
import Patient from '../src/modules/patient/patient.model.js';
import Visit from '../src/modules/visit/visit.model.js';
import Booking from '../src/modules/booking/booking.model.js';
import PatientHospital from '../src/modules/patientHospital/patientHospital.model.js';
import Test from '../src/modules/test/test.model.js';
import AuditLog from '../src/modules/audit/audit.model.js';
import { ROLES } from '../src/modules/auth/auth.constants.js';

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe('Step 3.5.1 Remediation — Authentication, RBAC & Tenant Isolation', () => {
  let hospA, hospB;
  let superAdmin, hospAdminA, hospAdminB, receptionistA;
  let userPatientA, userPatientB, patientA, patientB;
  let userDoctorA, doctorA, unverifiedDocUser, unverifiedDoc;
  let visitA, visitB;

  beforeEach(async () => {
    // 1. Hospitals
    hospA = await Hospital.create({
      name: 'City Care Hospital',
      code: 'CITY-IND',
      email: 'contact@citycare.com',
      contactNumber: '07312554400',
      status: 'active',
    });

    hospB = await Hospital.create({
      name: 'Sunrise Hospital',
      code: 'SUN-MUM',
      email: 'contact@sunrise.com',
      contactNumber: '02226401122',
      status: 'active',
    });

    // 2. Administrators
    superAdmin = await createUser({
      name: 'Platform Super Admin',
      email: 'superadmin@medisync.com',
      role: ROLES.SUPER_ADMIN,
    });

    hospAdminA = await createUser({
      name: 'Admin Hospital A',
      email: 'adminA@citycare.com',
      role: ROLES.HOSPITAL_ADMIN,
      hospitalId: hospA._id,
    });

    hospAdminB = await createUser({
      name: 'Admin Hospital B',
      email: 'adminB@sunrise.com',
      role: ROLES.HOSPITAL_ADMIN,
      hospitalId: hospB._id,
    });

    receptionistA = await createUser({
      name: 'Receptionist A',
      email: 'receptionA@citycare.com',
      role: ROLES.RECEPTIONIST,
      hospitalId: hospA._id,
    });

    // 3. Patients
    userPatientA = await createUser({
      name: 'Patient Alice',
      email: 'alice@test.com',
      role: ROLES.PATIENT,
      hospitalId: hospA._id,
    });
    patientA = await Patient.create({ user: userPatientA._id });

    userPatientB = await createUser({
      name: 'Patient Bob',
      email: 'bob@test.com',
      role: ROLES.PATIENT,
      hospitalId: hospB._id,
    });
    patientB = await Patient.create({ user: userPatientB._id });

    // 4. Doctors
    userDoctorA = await createUser({
      name: 'Dr. Ashok',
      email: 'dr.ashok@citycare.com',
      role: ROLES.DOCTOR,
      hospitalId: hospA._id,
    });
    doctorA = await Doctor.create({
      user: userDoctorA._id,
      name: 'Dr. Ashok',
      email: userDoctorA.email,
      mobile: userDoctorA.mobile,
      specialization: 'Cardiology',
      hospitalId: hospA._id,
      status: 'active',
      verificationStatus: 'verified',
      isApproved: true,
      availability: [{ day: 'Mon', start: '09:00', end: '17:00', slotMinutes: 30 }],
    });

    unverifiedDocUser = await createUser({
      name: 'Dr. Pending',
      email: 'dr.pending@citycare.com',
      role: ROLES.DOCTOR,
      hospitalId: hospA._id,
    });
    unverifiedDoc = await Doctor.create({
      user: unverifiedDocUser._id,
      name: 'Dr. Pending',
      email: unverifiedDocUser.email,
      mobile: unverifiedDocUser.mobile,
      specialization: 'General',
      hospitalId: hospA._id,
      status: 'active',
      verificationStatus: 'pending_verification',
      isApproved: false,
    });

    const userDoctorB = await createUser({
      name: 'Dr. Bhavna',
      email: 'dr.bhavna@sunrise.com',
      role: ROLES.DOCTOR,
      hospitalId: hospB._id,
    });
    const doctorB = await Doctor.create({
      user: userDoctorB._id,
      name: 'Dr. Bhavna',
      email: userDoctorB.email,
      mobile: userDoctorB.mobile,
      specialization: 'Neurology',
      hospitalId: hospB._id,
      status: 'active',
      verificationStatus: 'verified',
      isApproved: true,
      availability: [{ day: 'Mon', start: '09:00', end: '17:00', slotMinutes: 30 }],
    });

    // 5. PatientHospital Affiliations
    await PatientHospital.create({
      patient: patientA._id,
      hospital: hospA._id,
      medicalRecordNumber: 'CITY-0001',
      registeredBy: userPatientA._id,
      status: 'active',
    });

    await PatientHospital.create({
      patient: patientB._id,
      hospital: hospB._id,
      medicalRecordNumber: 'SUN-0001',
      registeredBy: userPatientB._id,
      status: 'active',
    });

    // 6. Bookings
    const bookingA = await Booking.create({
      patient: userPatientA._id,
      doctor: doctorA._id,
      hospital: hospA._id,
      date: new Date(),
      time: '10:00',
      status: 'confirmed',
    });

    const bookingB = await Booking.create({
      patient: userPatientB._id,
      doctor: doctorB._id,
      hospital: hospB._id,
      date: new Date(),
      time: '11:00',
      status: 'confirmed',
    });

    // 7. Visits
    visitA = await Visit.create({
      patient: userPatientA._id,
      mobile: userPatientA.mobile,
      doctor: doctorA._id,
      booking: bookingA._id,
      hospital: hospA._id,
      date: new Date(),
      time: '10:00',
    });

    visitB = await Visit.create({
      patient: userPatientB._id,
      mobile: userPatientB.mobile,
      doctor: doctorB._id,
      booking: bookingB._id,
      hospital: hospB._id,
      date: new Date(),
      time: '11:00',
    });
  });

  afterEach(async () => {
    await Test.deleteMany({});
    await AuditLog.deleteMany({});
    await Visit.deleteMany({});
    await Booking.deleteMany({});
    await PatientHospital.deleteMany({});
    await Doctor.deleteMany({});
    await Patient.deleteMany({});
    await User.deleteMany({});
    await Hospital.deleteMany({});
  });

  // =========================================================================
  // USER MANAGEMENT PRIVILEGE ESCALATION & TENANT BOUNDARY TESTS (1 - 9)
  // =========================================================================

  test('1. Hospital Admin cannot list users from another hospital', async () => {
    const token = await loginAs(hospAdminA);
    const res = await api.get('/api/v1/users').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);

    const userEmails = res.body.data.users.map((u) => u.email);
    expect(userEmails).toContain(userPatientA.email);
    expect(userEmails).not.toContain(userPatientB.email);
    expect(userEmails).not.toContain(hospAdminB.email);
  });

  test("2. Hospital Admin cannot retrieve another hospital's user", async () => {
    const token = await loginAs(hospAdminA);
    const res = await api.get(`/api/v1/users/${userPatientB._id}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/Cannot access users from another hospital/i);
  });

  test("3. Hospital Admin cannot update another hospital's user", async () => {
    const token = await loginAs(hospAdminA);
    const res = await api
      .patch(`/api/v1/users/${userPatientB._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Tampered Name' });
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/Cannot modify users from another hospital/i);
  });

  test("4. Hospital Admin cannot delete another hospital's user", async () => {
    const token = await loginAs(hospAdminA);
    const res = await api.delete(`/api/v1/users/${userPatientB._id}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/Cannot delete users from another hospital/i);
  });

  test('5. Hospital Admin cannot promote themselves to super_admin', async () => {
    const token = await loginAs(hospAdminA);
    const res = await api
      .patch(`/api/v1/users/${hospAdminA._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ role: ROLES.SUPER_ADMIN });
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/cannot promote/i);

    const check = await User.findById(hospAdminA._id);
    expect(check.role).toBe(ROLES.HOSPITAL_ADMIN);
  });

  test('6. Hospital Admin cannot promote another user to super_admin', async () => {
    const token = await loginAs(hospAdminA);
    const res = await api
      .patch(`/api/v1/users/${userPatientA._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ role: ROLES.SUPER_ADMIN });
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/cannot promote/i);

    const check = await User.findById(userPatientA._id);
    expect(check.role).toBe(ROLES.PATIENT);
  });

  test("7. Hospital Admin cannot change a user's hospitalId to another hospital", async () => {
    const token = await loginAs(hospAdminA);
    const res = await api
      .patch(`/api/v1/users/${userPatientA._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ hospitalId: hospB._id });
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/cannot reassign user hospital/i);

    const check = await User.findById(userPatientA._id);
    expect(check.hospitalId.toString()).toBe(hospA._id.toString());
  });

  test('8. Hospital Admin cannot modify or delete a super-admin account', async () => {
    const token = await loginAs(hospAdminA);

    // Modify attempt
    const patchRes = await api
      .patch(`/api/v1/users/${superAdmin._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Hacked Admin' });
    expect(patchRes.status).toBe(403);
    expect(patchRes.body.message).toMatch(/cannot modify a Super Admin/i);

    // Delete attempt
    const deleteRes = await api.delete(`/api/v1/users/${superAdmin._id}`).set('Authorization', `Bearer ${token}`);
    expect(deleteRes.status).toBe(403);
    expect(deleteRes.body.message).toMatch(/cannot delete a Super Admin/i);
  });

  test('9. Super Admin retains permitted platform-wide user-management functionality', async () => {
    const token = await loginAs(superAdmin);

    // Can list all users across hospitals
    const listRes = await api.get('/api/v1/users').set('Authorization', `Bearer ${token}`);
    expect(listRes.status).toBe(200);
    const emails = listRes.body.data.users.map((u) => u.email);
    expect(emails).toContain(userPatientA.email);
    expect(emails).toContain(userPatientB.email);

    // Can update users across hospitals
    const patchRes = await api
      .patch(`/api/v1/users/${userPatientA._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Alice SuperAdmin Updated' });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.name).toBe('Alice SuperAdmin Updated');
  });

  // =========================================================================
  // AUTHENTICATION & SOFT-DELETION TESTS (10 - 13)
  // =========================================================================

  test('10. Active, non-deleted user with valid access token succeeds', async () => {
    const token = signAccessToken(userPatientA._id, userPatientA.role);
    const res = await api.get('/api/v1/users/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(userPatientA.email);
  });

  test('11. Inactive user with an old valid access token is rejected', async () => {
    const inactiveUser = await createUser({ status: 'inactive' });
    const token = signAccessToken(inactiveUser._id, inactiveUser.role);
    const res = await api.get('/api/v1/users/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/Account inactive/i);
  });

  test('12. Soft-deleted user with status: active is rejected', async () => {
    const softDeletedUser = await createUser({
      status: 'active',
      deletedAt: new Date(),
    });
    const token = signAccessToken(softDeletedUser._id, softDeletedUser.role);
    const res = await api.get('/api/v1/users/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/deleted/i);
  });

  test('13. Hard-deleted user with an old valid access token is rejected', async () => {
    const hardDeletedUser = await createUser();
    const token = signAccessToken(hardDeletedUser._id, hardDeletedUser.role);
    await User.findByIdAndDelete(hardDeletedUser._id);

    const res = await api.get('/api/v1/users/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/no longer exists/i);
  });

  // =========================================================================
  // AUDIT LOG TENANT ISOLATION TESTS (14 - 16)
  // =========================================================================

  test("14. Hospital Admin cannot read another hospital's audit records", async () => {
    await AuditLog.create({
      actor: hospAdminA._id,
      actorRole: hospAdminA.role,
      action: 'DOCTOR_CREDENTIALS_APPROVED',
      entity: 'Doctor',
      entityId: doctorA._id.toString(),
      hospitalId: hospA._id,
    });

    await AuditLog.create({
      actor: hospAdminB._id,
      actorRole: hospAdminB.role,
      action: 'DOCTOR_CREDENTIALS_APPROVED',
      entity: 'Doctor',
      entityId: new mongoose.Types.ObjectId().toString(),
      hospitalId: hospB._id,
    });

    const tokenA = await loginAs(hospAdminA);
    const res = await api.get('/api/v1/audit').set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(200);

    const logs = res.body.data.logs;
    expect(logs.length).toBe(1);
    expect(logs[0].hospitalId.toString()).toBe(hospA._id.toString());
  });

  test('15. Hospital Admin can read only permitted records from their own hospital', async () => {
    await AuditLog.create({
      actor: hospAdminA._id,
      actorRole: hospAdminA.role,
      action: 'DOCTOR_CREDENTIALS_SUBMITTED',
      entity: 'Doctor',
      entityId: doctorA._id.toString(),
      hospitalId: hospA._id,
    });

    const tokenA = await loginAs(hospAdminA);
    const res = await api.get('/api/v1/audit').set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(1);
  });

  test('16. Super Admin retains authorized platform-wide audit access', async () => {
    await AuditLog.create({
      actor: hospAdminA._id,
      actorRole: hospAdminA.role,
      action: 'ACTION_A',
      entity: 'Doctor',
      hospitalId: hospA._id,
    });

    await AuditLog.create({
      actor: hospAdminB._id,
      actorRole: hospAdminB.role,
      action: 'ACTION_B',
      entity: 'Doctor',
      hospitalId: hospB._id,
    });

    const tokenSuper = await loginAs(superAdmin);
    const res = await api.get('/api/v1/audit').set('Authorization', `Bearer ${tokenSuper}`);
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(2);
  });

  // =========================================================================
  // LAB TEST CLINICAL PRIVILEGES & READ ISOLATION TESTS (17 - 22)
  // =========================================================================

  test('17. Receptionist cannot create a clinical test request', async () => {
    const token = await loginAs(receptionistA);
    const res = await api
      .post('/api/v1/tests')
      .set('Authorization', `Bearer ${token}`)
      .send({
        visit: visitA._id,
        testName: 'Complete Blood Count',
        testDate: new Date(),
      });
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/permission|authorized doctor/i);
  });

  test('18. Unverified doctor cannot create a clinical test request', async () => {
    const token = await loginAs(unverifiedDocUser);
    const res = await api
      .post('/api/v1/tests')
      .set('Authorization', `Bearer ${token}`)
      .send({
        visit: visitA._id,
        testName: 'Lipid Profile',
        testDate: new Date(),
      });
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/Clinical privileges withheld/i);
  });

  test('19. Verified doctor cannot create a request for an unauthorized hospital encounter', async () => {
    const token = await loginAs(userDoctorA);
    // visitB belongs to Hospital B; Doctor A belongs to Hospital A
    const res = await api
      .post('/api/v1/tests')
      .set('Authorization', `Bearer ${token}`)
      .send({
        visit: visitB._id,
        testName: 'Chest X-Ray',
        testDate: new Date(),
      });
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/Clinical access denied/i);
  });

  test("20. Patient cannot read another patient's test records", async () => {
    // Create test record for Visit A (Patient Alice)
    const testDocA = await Test.create({
      visit: visitA._id,
      testName: 'Alice Blood Test',
      testDate: new Date(),
      createdBy: userDoctorA._id,
    });

    // Create test record for Visit B (Patient Bob)
    await Test.create({
      visit: visitB._id,
      testName: 'Bob Blood Test',
      testDate: new Date(),
      createdBy: userDoctorA._id,
    });

    const tokenAlice = await loginAs(userPatientA);

    // List: Alice only sees her own test
    const listRes = await api.get('/api/v1/tests').set('Authorization', `Bearer ${tokenAlice}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.tests.length).toBe(1);
    expect(listRes.body.data.tests[0].testName).toBe('Alice Blood Test');

    // Query parameter for another visit: 403 Forbidden
    const bobVisitRes = await api
      .get(`/api/v1/tests?visit=${visitB._id}`)
      .set('Authorization', `Bearer ${tokenAlice}`);
    expect(bobVisitRes.status).toBe(403);
  });

  test('21. Doctor cannot read unauthorized clinical test records', async () => {
    // Create test record for Visit B (Hospital B)
    await Test.create({
      visit: visitB._id,
      testName: 'Hospital B Cardiac Test',
      testDate: new Date(),
      createdBy: userDoctorA._id,
    });

    const tokenDoctorA = await loginAs(userDoctorA);
    // Doctor A attempting to access tests for visitB (Hospital B encounter)
    const res = await api
      .get(`/api/v1/tests?visit=${visitB._id}`)
      .set('Authorization', `Bearer ${tokenDoctorA}`);
    expect(res.status).toBe(403);
  });

  test("22. Hospital Admin cannot read another hospital's test records", async () => {
    await Test.create({
      visit: visitA._id,
      testName: 'Hospital A Lab Test',
      testDate: new Date(),
      createdBy: userDoctorA._id,
    });

    await Test.create({
      visit: visitB._id,
      testName: 'Hospital B Lab Test',
      testDate: new Date(),
      createdBy: userDoctorA._id,
    });

    const tokenAdminA = await loginAs(hospAdminA);

    // List: Hospital Admin A only sees tests from Hospital A visits
    const listRes = await api.get('/api/v1/tests').set('Authorization', `Bearer ${tokenAdminA}`);
    expect(listRes.status).toBe(200);
    const testNames = listRes.body.data.tests.map((t) => t.testName);
    expect(testNames).toContain('Hospital A Lab Test');
    expect(testNames).not.toContain('Hospital B Lab Test');

    // Direct visit query for Hospital B visit: 403 Forbidden
    const directRes = await api
      .get(`/api/v1/tests?visit=${visitB._id}`)
      .set('Authorization', `Bearer ${tokenAdminA}`);
    expect(directRes.status).toBe(403);
  });
});
