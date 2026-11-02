import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import app from '../src/app.js';
import Hospital from '../src/modules/hospital/hospital.model.js';
import User from '../src/modules/user/user.model.js';
import Doctor from '../src/modules/doctor/doctor.model.js';
import Patient from '../src/modules/patient/patient.model.js';
import PatientHospital from '../src/modules/patientHospital/patientHospital.model.js';
import Booking from '../src/modules/booking/booking.model.js';
import Visit from '../src/modules/visit/visit.model.js';
import { signAccessToken } from '../src/utils/tokens.js';
import { ROLES } from '../src/modules/auth/auth.constants.js';

let mongod;
const api = request(app);

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
}, 60000);

describe('Step 3.5.2.3 — Tenant Context Validation & Middleware Enforcement Regression Suite', () => {
  let hospA, hospB, inactiveHosp, deletedHosp;
  let adminA, receptionistA, doctorUserA, doctorProfileA;
  let adminB, receptionistB;
  let patientUser;
  let tokenAdminA, tokenReceptionistA, tokenDoctorA;
  let tokenAdminB, tokenReceptionistB;
  let tokenPatient, tokenSuperAdmin;

  beforeEach(async () => {
    const cols = await mongoose.connection.db.collections();
    for (const c of cols) await c.deleteMany({});

    // 1. Create Hospitals
    hospA = await Hospital.create({
      name: 'City Care Multispeciality Hospital',
      code: 'CITY-A',
      email: 'contact@citycare.com',
      contactNumber: '07312554400',
      status: 'active',
      deletedAt: null,
    });

    hospB = await Hospital.create({
      name: 'Sunrise Global Hospital',
      code: 'SUN-B',
      email: 'contact@sunrise.com',
      contactNumber: '02226401122',
      status: 'active',
      deletedAt: null,
    });

    inactiveHosp = await Hospital.create({
      name: 'Inactive Care Clinic',
      code: 'INACT-C',
      email: 'contact@inactive.com',
      contactNumber: '01122334455',
      status: 'inactive',
      deletedAt: null,
    });

    deletedHosp = await Hospital.create({
      name: 'Defunct Medical Center',
      code: 'DEF-D',
      email: 'contact@defunct.com',
      contactNumber: '01199887766',
      status: 'active',
      deletedAt: new Date(),
    });

    // 2. Hospital A Staff
    adminA = await User.create({
      name: 'Admin Hospital A',
      email: 'adminA@hospitalA.com',
      mobile: '9100000001',
      password: 'Password123!',
      role: ROLES.HOSPITAL_ADMIN,
      hospitalId: hospA._id,
      emailVerified: true,
      status: 'active',
      deletedAt: null,
    });

    receptionistA = await User.create({
      name: 'Receptionist A',
      email: 'recA@hospitalA.com',
      mobile: '9100000002',
      password: 'Password123!',
      role: ROLES.RECEPTIONIST,
      hospitalId: hospA._id,
      emailVerified: true,
      status: 'active',
      deletedAt: null,
    });

    doctorUserA = await User.create({
      name: 'Dr. Alice Sharma',
      email: 'alice@hospitalA.com',
      mobile: '9100000003',
      password: 'Password123!',
      role: ROLES.DOCTOR,
      hospitalId: hospA._id,
      emailVerified: true,
      status: 'active',
      deletedAt: null,
    });

    doctorProfileA = await Doctor.create({
      name: 'Dr. Alice Sharma',
      email: 'alice@hospitalA.com',
      mobile: '9100000003',
      specialization: 'Cardiology',
      user: doctorUserA._id,
      hospitalId: hospA._id,
      status: 'active',
      verificationStatus: 'verified',
      isApproved: true,
      isPublished: true,
      deletedAt: null,
    });

    // 3. Hospital B Staff
    adminB = await User.create({
      name: 'Admin Hospital B',
      email: 'adminB@hospitalB.com',
      mobile: '9200000001',
      password: 'Password123!',
      role: ROLES.HOSPITAL_ADMIN,
      hospitalId: hospB._id,
      emailVerified: true,
      status: 'active',
      deletedAt: null,
    });

    receptionistB = await User.create({
      name: 'Receptionist B',
      email: 'recB@hospitalB.com',
      mobile: '9200000002',
      password: 'Password123!',
      role: ROLES.RECEPTIONIST,
      hospitalId: hospB._id,
      emailVerified: true,
      status: 'active',
      deletedAt: null,
    });

    // 4. Global Patient & Super Admin
    patientUser = await User.create({
      name: 'Patient John Doe',
      email: 'patient@example.com',
      mobile: '9300000001',
      password: 'Password123!',
      role: ROLES.PATIENT,
      hospitalId: null,
      emailVerified: true,
      status: 'active',
      deletedAt: null,
    });

    const superAdmin = await User.create({
      name: 'Platform Super Admin',
      email: 'super@medisync.io',
      mobile: '9999999999',
      password: 'Password123!',
      role: ROLES.SUPER_ADMIN,
      hospitalId: null,
      emailVerified: true,
      status: 'active',
      deletedAt: null,
    });

    // Tokens
    tokenAdminA = signAccessToken(adminA._id, adminA.role);
    tokenReceptionistA = signAccessToken(receptionistA._id, receptionistA.role);
    tokenDoctorA = signAccessToken(doctorUserA._id, doctorUserA.role);
    tokenAdminB = signAccessToken(adminB._id, adminB.role);
    tokenReceptionistB = signAccessToken(receptionistB._id, receptionistB.role);
    tokenPatient = signAccessToken(patientUser._id, patientUser.role);
    tokenSuperAdmin = signAccessToken(superAdmin._id, superAdmin.role);
  });

  // 1. Hospital Admin receives correct tenant context
  test('1. Hospital Admin receives correct tenant context derived from authenticated identity', async () => {
    const res = await api
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${tokenAdminA}`);

    expect(res.status).toBe(200);
    // Verified that all returned users belong strictly to Hospital A
    const users = res.body.data.users || [];
    users.forEach((u) => {
      expect(u.hospitalId.toString()).toBe(hospA._id.toString());
    });
  });

  // 2. Receptionist receives correct tenant context
  test('2. Receptionist receives correct tenant context and can access own hospital visits', async () => {
    const res = await api
      .get('/api/v1/visits')
      .set('Authorization', `Bearer ${tokenReceptionistA}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
  });

  // 3. Doctor receives correct tenant context; profile mismatch fails closed
  test('3. Doctor receives correct tenant context, and doctor profile mismatch is rejected with 403', async () => {
    // Legitimate doctor request succeeds
    const res = await api
      .get('/api/v1/visits')
      .set('Authorization', `Bearer ${tokenDoctorA}`);
    expect(res.status).toBe(200);

    // Mismatched profile test: Doctor user account assigned to Hospital A, but Doctor profile assigned to Hospital B
    const rogueDoctorUser = await User.create({
      name: 'Dr. Mismatched',
      email: 'mismatch@example.com',
      mobile: '9400000001',
      password: 'Password123!',
      role: ROLES.DOCTOR,
      hospitalId: hospA._id,
      emailVerified: true,
      status: 'active',
      deletedAt: null,
    });

    await Doctor.create({
      name: 'Dr. Mismatched',
      email: 'mismatch@example.com',
      mobile: '9400000001',
      specialization: 'Neurology',
      user: rogueDoctorUser._id,
      hospitalId: hospB._id, // MISMATCH with User.hospitalId
      status: 'active',
      verificationStatus: 'verified',
      isApproved: true,
      isPublished: true,
      deletedAt: null,
    });

    const rogueToken = signAccessToken(rogueDoctorUser._id, rogueDoctorUser.role);
    const rogueRes = await api
      .get('/api/v1/visits')
      .set('Authorization', `Bearer ${rogueToken}`);

    expect(rogueRes.status).toBe(403);
    expect(rogueRes.body.message).toMatch(/does not match/i);
  });

  // 4. Hospital A cannot forge Hospital B tenant ID via headers/body/query
  test('4. Hospital A cannot forge Hospital B tenant ID via headers or request parameters', async () => {
    // Admin A creates a doctor while attempting to inject Hospital B in headers, query and body
    const res = await api
      .post('/api/v1/doctors')
      .set('Authorization', `Bearer ${tokenAdminA}`)
      .set('X-Hospital-Id', hospB._id.toString())
      .set('Hospital-Id', hospB._id.toString())
      .query({ hospitalId: hospB._id.toString() })
      .send({
        name: 'Dr. Injected Hospital',
        email: 'injected@hospital.com',
        mobile: '9555555555',
        specialization: 'General Medicine',
        timing: '09:00 AM - 05:00 PM',
        hospitalId: hospB._id.toString(), // Attacker tries to create for Hospital B
      });

    // In Step 3.5.2.2/3.5.2.3, this cross-hospital assignment is strictly forbidden
    expect(res.status).toBe(403);
  });

  // 5. Missing hospital assignment is rejected for staff
  test('5. Missing hospital assignment is rejected with 403 for staff accounts', async () => {
    const unassignedAdmin = await User.create({
      name: 'Unassigned Admin',
      email: 'unassigned@example.com',
      mobile: '9600000001',
      password: 'Password123!',
      role: ROLES.HOSPITAL_ADMIN,
      hospitalId: null, // Missing hospitalId
      emailVerified: true,
      status: 'active',
      deletedAt: null,
    });

    const token = signAccessToken(unassignedAdmin._id, unassignedAdmin.role);
    const res = await api
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/No valid hospital assignment found/i);
  });

  // 6. Inactive hospital is rejected
  test('6. Inactive hospital is rejected with 403 for staff operations', async () => {
    const inactiveStaff = await User.create({
      name: 'Inactive Hospital Staff',
      email: 'staff@inactive.com',
      mobile: '9600000002',
      password: 'Password123!',
      role: ROLES.HOSPITAL_ADMIN,
      hospitalId: inactiveHosp._id,
      emailVerified: true,
      status: 'active',
      deletedAt: null,
    });

    const token = signAccessToken(inactiveStaff._id, inactiveStaff.role);
    const res = await api
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/inactive, suspended, or unavailable/i);
  });

  // 7. Soft-deleted hospital is rejected
  test('7. Soft-deleted hospital is rejected with 403 for staff operations', async () => {
    const deletedHospStaff = await User.create({
      name: 'Deleted Hospital Staff',
      email: 'staff@defunct.com',
      mobile: '9600000003',
      password: 'Password123!',
      role: ROLES.HOSPITAL_ADMIN,
      hospitalId: deletedHosp._id,
      emailVerified: true,
      status: 'active',
      deletedAt: null,
    });

    const token = signAccessToken(deletedHospStaff._id, deletedHospStaff.role);
    const res = await api
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/inactive, suspended, or unavailable/i);
  });

  // 8. Deleted user is rejected
  test('8. Deleted user is rejected with 401 at authentication boundary', async () => {
    const deletedUser = await User.create({
      name: 'Deleted User',
      email: 'deleted@example.com',
      mobile: '9600000004',
      password: 'Password123!',
      role: ROLES.HOSPITAL_ADMIN,
      hospitalId: hospA._id,
      emailVerified: true,
      status: 'active',
      deletedAt: new Date(), // Soft-deleted
    });

    const token = signAccessToken(deletedUser._id, deletedUser.role);
    const res = await api
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/deleted/i);
  });

  // 9. Inactive user is rejected
  test('9. Inactive user account is rejected with 403 at authentication boundary', async () => {
    const suspendedUser = await User.create({
      name: 'Suspended User',
      email: 'suspended@example.com',
      mobile: '9600000005',
      password: 'Password123!',
      role: ROLES.HOSPITAL_ADMIN,
      hospitalId: hospA._id,
      emailVerified: true,
      status: 'inactive', // Inactive
      deletedAt: null,
    });

    const token = signAccessToken(suspendedUser._id, suspendedUser.role);
    const res = await api
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/inactive/i);
  });

  // 10. Super Admin retains intended platform-wide access
  test('10. Super Admin retains platform-wide scope without artificial hospital assignment', async () => {
    const resPlatformStats = await api
      .get('/api/v1/hospitals/stats/platform')
      .set('Authorization', `Bearer ${tokenSuperAdmin}`);

    expect(resPlatformStats.status).toBe(200);
    expect(resPlatformStats.body.data).toBeDefined();

    const resAudit = await api
      .get('/api/v1/audit')
      .set('Authorization', `Bearer ${tokenSuperAdmin}`);

    expect(resAudit.status).toBe(200);
    expect(resAudit.body.data.logs).toBeDefined();
  });

  // 11. Patient does not receive an artificial single-hospital restriction
  test('11. Patient does not receive an artificial single-hospital restriction and can browse bookings', async () => {
    const res = await api
      .get('/api/v1/bookings')
      .set('Authorization', `Bearer ${tokenPatient}`);

    expect(res.status).toBe(200);
    expect(res.body.data.bookings).toBeDefined();
  });

  // 12. Public routes continue working without authentication or tenant context
  test('12. Public routes continue working without authentication', async () => {
    const resHealth = await api.get('/health');
    expect(resHealth.status).toBe(200);
    expect(resHealth.body.status).toBe('ok');

    const resDoctors = await api.get('/api/v1/doctors');
    expect(resDoctors.status).toBe(200);
    expect(resDoctors.body.data.doctors).toBeDefined();

    const resHospitals = await api.get('/api/v1/hospitals');
    expect(resHospitals.status).toBe(200);
    expect(resHospitals.body.data.hospitals).toBeDefined();
  });

  // 13. Tenant middleware runs after authentication
  test('13. Tenant middleware fails closed with 401 when request is unauthenticated', async () => {
    const resNoAuth = await api.get('/api/v1/visits');
    expect(resNoAuth.status).toBe(401);
    expect(resNoAuth.body.message).toMatch(/Not authenticated/i);

    const resInvalidToken = await api
      .get('/api/v1/visits')
      .set('Authorization', 'Bearer invalid.token.payload');
    expect(resInvalidToken.status).toBe(401);
    expect(resInvalidToken.body.message).toMatch(/Invalid token/i);
  });

  // 14. A staff account cannot switch hospitals by manipulating headers, body or query parameters
  test('14. Staff account cannot switch hospitals by manipulating headers, query or body params', async () => {
    // Create a visit for Hospital A
    const patientDoc = await Patient.create({
      user: patientUser._id,
      name: 'Patient John',
      mobile: '9300000001',
    });

    const patientHosp = await PatientHospital.create({
      patient: patientDoc._id,
      hospital: hospA._id,
      registeredBy: receptionistA._id,
      medicalRecordNumber: 'MRN-HOSPA-001',
    });

    const booking = await Booking.create({
      patient: patientUser._id,
      doctor: doctorProfileA._id,
      hospital: hospA._id,
      date: new Date(),
      time: '11:00 AM',
      status: 'confirmed',
    });

    // Receptionist A attempts to pass headers/query indicating Hospital B
    const res = await api
      .post('/api/v1/visits')
      .set('Authorization', `Bearer ${tokenReceptionistA}`)
      .set('X-Hospital-Id', hospB._id.toString())
      .set('Hospital-Id', hospB._id.toString())
      .query({ hospitalId: hospB._id.toString() })
      .send({
        booking: booking._id.toString(),
        patient: patientUser._id.toString(),
        mobile: '9300000001',
        doctor: doctorProfileA._id.toString(),
        date: new Date(),
        time: '11:00 AM',
        hospitalId: hospB._id.toString(), // Attacker attempts to switch visit to Hospital B
      });

    expect(res.status).toBe(201);
    // Verified that visit hospital is strictly Hospital A, matching the trusted staff tenant context
    expect(res.body.data.hospital.toString()).toBe(hospA._id.toString());
    expect(res.body.data.hospital.toString()).not.toBe(hospB._id.toString());
  });
});
