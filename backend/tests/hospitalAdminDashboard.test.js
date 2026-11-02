import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import app from '../src/app.js';
import Hospital from '../src/modules/hospital/hospital.model.js';
import User from '../src/modules/user/user.model.js';
import Doctor from '../src/modules/doctor/doctor.model.js';
import Booking from '../src/modules/booking/booking.model.js';
import Patient from '../src/modules/patient/patient.model.js';
import PatientHospital from '../src/modules/patientHospital/patientHospital.model.js';
import AuditLog from '../src/modules/audit/audit.model.js';
import { api, createUser, loginAs } from './helpers.js';

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe('Milestone 4 — Hospital Admin Dashboard & Tenant Isolation', () => {
  let hospitalA;
  let hospitalB;
  let adminA;
  let tokenA;
  let adminB;
  let tokenB;
  let patientUser;
  let patientToken;

  afterEach(async () => {
    await Hospital.deleteMany({});
    await User.deleteMany({});
    await Doctor.deleteMany({});
    await Booking.deleteMany({});
    await Patient.deleteMany({});
    await PatientHospital.deleteMany({});
    await AuditLog.deleteMany({});
  });

  beforeEach(async () => {
    // 1. Setup two distinct hospitals
    hospitalA = await Hospital.create({
      name: 'Apollo Medical Center',
      code: `APOLLO_${Date.now().toString().slice(-6)}`,
      email: `contact_apollo_${Date.now().toString().slice(-6)}@apollo.org`,
      contactNumber: '911123456789',
      status: 'active',
      address: { city: 'New Delhi', state: 'Delhi', country: 'India' },
    });

    hospitalB = await Hospital.create({
      name: 'Fortis Healthcare',
      code: `FORTIS_${Date.now().toString().slice(-6)}`,
      email: `contact_fortis_${Date.now().toString().slice(-6)}@fortis.org`,
      contactNumber: '911298765432',
      status: 'active',
      address: { city: 'Gurugram', state: 'Haryana', country: 'India' },
    });

    // 2. Setup Hospital Admins
    adminA = await createUser({
      role: 'hospital_admin',
      hospitalId: hospitalA._id,
    });
    tokenA = await loginAs(adminA);

    adminB = await createUser({
      role: 'hospital_admin',
      hospitalId: hospitalB._id,
    });
    tokenB = await loginAs(adminB);

    // 3. Setup standard Patient
    patientUser = await createUser({ role: 'patient' });
    patientToken = await loginAs(patientUser);
  });

  describe('Authorization & Security Guard', () => {
    it('rejects unauthenticated requests with 401', async () => {
      const res = await api.get('/api/v1/dashboard/hospital-admin/overview');
      expect(res.status).toBe(401);
    });

    it('rejects patient accounts with 403', async () => {
      const res = await api
        .get('/api/v1/dashboard/hospital-admin/overview')
        .set('Authorization', `Bearer ${patientToken}`);
      expect(res.status).toBe(403);
    });

    it('rejects staff accounts without hospital assignment with 403', async () => {
      const rogueAdmin = await createUser({
        role: 'hospital_admin',
        hospitalId: null,
      });
      const rogueToken = await loginAs(rogueAdmin);

      const res = await api
        .get('/api/v1/dashboard/hospital-admin/overview')
        .set('Authorization', `Bearer ${rogueToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/dashboard/hospital-admin/overview', () => {
    beforeEach(async () => {
      // Seed Hospital A: 2 doctors (1 active, 1 pending)
      const docUserA1 = await createUser({ role: 'doctor', hospitalId: hospitalA._id });
      await Doctor.create({
        name: 'Dr. Sarah Smith',
        email: docUserA1.email,
        mobile: docUserA1.mobile,
        specialization: 'Cardiology',
        hospitalId: hospitalA._id,
        user: docUserA1._id,
        status: 'active',
        verificationStatus: 'verified',
        isApproved: true,
        isPublished: true,
      });

      const docUserA2 = await createUser({ role: 'doctor', hospitalId: hospitalA._id });
      await Doctor.create({
        name: 'Dr. John Doe',
        email: docUserA2.email,
        mobile: docUserA2.mobile,
        specialization: 'Neurology',
        hospitalId: hospitalA._id,
        user: docUserA2._id,
        status: 'pending',
        verificationStatus: 'pending_verification',
        isApproved: false,
        isPublished: false,
      });

      // Seed Hospital B: 1 doctor (active)
      const docUserB = await createUser({ role: 'doctor', hospitalId: hospitalB._id });
      await Doctor.create({
        name: 'Dr. Alice Brown',
        email: docUserB.email,
        mobile: docUserB.mobile,
        specialization: 'Pediatrics',
        hospitalId: hospitalB._id,
        user: docUserB._id,
        status: 'active',
        verificationStatus: 'verified',
        isApproved: true,
        isPublished: true,
      });

      // Seed Receptionists: 2 in Hospital A, 1 in Hospital B
      await createUser({ role: 'receptionist', hospitalId: hospitalA._id, status: 'active' });
      await createUser({ role: 'receptionist', hospitalId: hospitalA._id, status: 'active' });
      await createUser({ role: 'receptionist', hospitalId: hospitalB._id, status: 'active' });

      // Seed Patients: 3 registered to Hospital A (2 active, 1 inactive), 1 in Hospital B
      const p1 = await Patient.create({ user: patientUser._id, gender: 'male', bloodGroup: 'O+' });
      await PatientHospital.create({
        patient: p1._id,
        hospital: hospitalA._id,
        medicalRecordNumber: `MRN-A-001`,
        registeredBy: adminA._id,
        status: 'active',
      });

      const pUser2 = await createUser({ role: 'patient' });
      const p2 = await Patient.create({ user: pUser2._id, gender: 'female', bloodGroup: 'A+' });
      await PatientHospital.create({
        patient: p2._id,
        hospital: hospitalA._id,
        medicalRecordNumber: `MRN-A-002`,
        registeredBy: adminA._id,
        status: 'active',
      });

      const pUser3 = await createUser({ role: 'patient' });
      const p3 = await Patient.create({ user: pUser3._id, gender: 'other', bloodGroup: 'B+' });
      await PatientHospital.create({
        patient: p3._id,
        hospital: hospitalA._id,
        medicalRecordNumber: `MRN-A-003`,
        registeredBy: adminA._id,
        status: 'inactive',
      });

      const pUser4 = await createUser({ role: 'patient' });
      const p4 = await Patient.create({ user: pUser4._id, gender: 'female', bloodGroup: 'AB+' });
      await PatientHospital.create({
        patient: p4._id,
        hospital: hospitalB._id,
        medicalRecordNumber: `MRN-B-001`,
        registeredBy: adminB._id,
        status: 'active',
      });

      // Seed Bookings today for Hospital A (2 confirmed, 1 pending) and Hospital B (1 confirmed)
      const today = new Date();
      const docA = await Doctor.findOne({ hospitalId: hospitalA._id, status: 'active' });
      const docB = await Doctor.findOne({ hospitalId: hospitalB._id, status: 'active' });

      await Booking.create({
        patient: patientUser._id,
        doctor: docA._id,
        hospital: hospitalA._id,
        date: today,
        time: '10:00',
        status: 'confirmed',
      });

      await Booking.create({
        patient: pUser2._id,
        doctor: docA._id,
        hospital: hospitalA._id,
        date: today,
        time: '11:00',
        status: 'pending',
      });

      await Booking.create({
        patient: pUser4._id,
        doctor: docB._id,
        hospital: hospitalB._id,
        date: today,
        time: '14:00',
        status: 'confirmed',
      });
    });

    it('returns exact hospital-scoped KPIs for Hospital Admin A without cross-tenant leakage', async () => {
      const res = await api
        .get('/api/v1/dashboard/hospital-admin/overview')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const data = res.body.data;

      // Hospital Metadata
      expect(data.hospital.id.toString()).toBe(hospitalA._id.toString());
      expect(data.hospital.name).toBe('Apollo Medical Center');

      // Patient Counts (Hospital A: 3 total, 2 active, 1 inactive)
      expect(data.statistics.patients.total).toBe(3);
      expect(data.statistics.patients.active).toBe(2);
      expect(data.statistics.patients.inactive).toBe(1);

      // Doctor Counts (Hospital A: 2 total, 1 active, 1 pending verification)
      expect(data.statistics.doctors.total).toBe(2);
      expect(data.statistics.doctors.active).toBe(1);
      expect(data.statistics.doctors.pendingVerification).toBe(1);

      // Receptionists (Hospital A: 2 total)
      expect(data.statistics.receptionists.total).toBe(2);
      expect(data.statistics.receptionists.active).toBe(2);

      // Today's Appointments (Hospital A: 2 bookings today: 1 confirmed, 1 pending)
      expect(data.statistics.todayAppointments.total).toBe(2);
      expect(data.statistics.todayAppointments.confirmed).toBe(1);
      expect(data.statistics.todayAppointments.pending).toBe(1);

      // Queue (Waiting: confirmed + pending = 2)
      expect(data.statistics.queue.waitingCount).toBe(2);
    });

    it('returns distinct hospital-scoped KPIs for Hospital Admin B', async () => {
      const res = await api
        .get('/api/v1/dashboard/hospital-admin/overview')
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(200);
      const data = res.body.data;

      expect(data.hospital.id.toString()).toBe(hospitalB._id.toString());
      expect(data.statistics.patients.total).toBe(1);
      expect(data.statistics.doctors.total).toBe(1);
      expect(data.statistics.receptionists.total).toBe(1);
      expect(data.statistics.todayAppointments.total).toBe(1);
    });
  });

  describe("GET /api/v1/dashboard/hospital-admin/today-appointments", () => {
    it("returns today's appointments populated with patient and doctor details and MRN", async () => {
      const docUser = await createUser({ role: 'doctor', hospitalId: hospitalA._id });
      const doctor = await Doctor.create({
        name: 'Dr. House',
        email: docUser.email,
        mobile: docUser.mobile,
        specialization: 'Diagnostic Medicine',
        hospitalId: hospitalA._id,
        user: docUser._id,
        status: 'active',
      });

      const patientRecord = await Patient.create({
        user: patientUser._id,
        gender: 'male',
      });
      await PatientHospital.create({
        patient: patientRecord._id,
        hospital: hospitalA._id,
        medicalRecordNumber: 'MRN-HOSP-A-999',
        registeredBy: adminA._id,
      });

      await Booking.create({
        patient: patientUser._id,
        doctor: doctor._id,
        hospital: hospitalA._id,
        date: new Date(),
        time: '09:30',
        status: 'confirmed',
      });

      const res = await api
        .get('/api/v1/dashboard/hospital-admin/today-appointments')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.total).toBe(1);
      const appt = res.body.data.appointments[0];
      expect(appt.doctor.name).toBe('Dr. House');
      expect(appt.patient.name).toBe(patientUser.name);
      expect(appt.patient.mrn).toBe('MRN-HOSP-A-999');
    });
  });

  describe('GET /api/v1/dashboard/hospital-admin/pending-doctors and approval workflow', () => {
    it('lists pending doctors and allows hospital admin to approve/verify them', async () => {
      const docUser = await createUser({ role: 'doctor', hospitalId: hospitalA._id });
      const pendingDoc = await Doctor.create({
        name: 'Dr. Gregory Chase',
        email: docUser.email,
        mobile: docUser.mobile,
        specialization: 'Intensive Care',
        hospitalId: hospitalA._id,
        user: docUser._id,
        status: 'pending',
        verificationStatus: 'pending_verification',
        isApproved: false,
        isPublished: false,
      });

      // 1. Fetch pending list
      const listRes = await api
        .get('/api/v1/dashboard/hospital-admin/pending-doctors')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.data.length).toBe(1);
      expect(listRes.body.data[0]._id.toString()).toBe(pendingDoc._id.toString());

      // 2. Approve doctor
      const approveRes = await api
        .patch(`/api/v1/doctors/${pendingDoc._id}/approve`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(approveRes.status).toBe(200);
      expect(approveRes.body.data.verificationStatus).toBe('verified');
      expect(approveRes.body.data.isApproved).toBe(true);
      expect(approveRes.body.data.isPublished).toBe(true);

      // 3. Verify removed from pending list
      const recheck = await api
        .get('/api/v1/dashboard/hospital-admin/pending-doctors')
        .set('Authorization', `Bearer ${tokenA}`);
      expect(recheck.body.data.length).toBe(0);
    });

    it('blocks hospital admin from approving doctors belonging to a foreign hospital', async () => {
      const docUserB = await createUser({ role: 'doctor', hospitalId: hospitalB._id });
      const pendingDocB = await Doctor.create({
        name: 'Dr. Foreign Hospital',
        email: docUserB.email,
        mobile: docUserB.mobile,
        specialization: 'Oncology',
        hospitalId: hospitalB._id,
        user: docUserB._id,
        status: 'pending',
        verificationStatus: 'pending_verification',
        isApproved: false,
      });

      const res = await api
        .patch(`/api/v1/doctors/${pendingDocB._id}/approve`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/dashboard/hospital-admin/patient-queue', () => {
    it('returns ordered patient queue with localized MRN', async () => {
      const docUser = await createUser({ role: 'doctor', hospitalId: hospitalA._id });
      const doc = await Doctor.create({
        name: 'Dr. Wilson',
        email: docUser.email,
        mobile: docUser.mobile,
        specialization: 'Oncology',
        hospitalId: hospitalA._id,
        user: docUser._id,
        status: 'active',
      });

      const today = new Date();
      await Booking.create({
        patient: patientUser._id,
        doctor: doc._id,
        hospital: hospitalA._id,
        date: today,
        time: '10:00',
        status: 'confirmed',
      });

      const res = await api
        .get('/api/v1/dashboard/hospital-admin/patient-queue')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalWaiting).toBe(1);
      expect(res.body.data.queue[0].queuePosition).toBe(1);
      expect(res.body.data.queue[0].doctor.name).toBe('Dr. Wilson');
    });
  });

  describe('GET /api/v1/dashboard/hospital-admin/recent-activity', () => {
    it('returns hospital audit logs strictly scoped to this facility', async () => {
      // Create audit logs for Hospital A and B
      await AuditLog.create({
        actor: adminA._id,
        actorRole: 'hospital_admin',
        action: 'DOCTOR_CREDENTIALS_APPROVED',
        entity: 'Doctor',
        entityId: 'doc-123',
        hospitalId: hospitalA._id,
      });

      await AuditLog.create({
        actor: adminB._id,
        actorRole: 'hospital_admin',
        action: 'STAFF_INVITED',
        entity: 'User',
        entityId: 'user-456',
        hospitalId: hospitalB._id,
      });

      const res = await api
        .get('/api/v1/dashboard/hospital-admin/recent-activity')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].action).toBe('DOCTOR_CREDENTIALS_APPROVED');
      expect(res.body.data[0].hospitalId.toString()).toBe(hospitalA._id.toString());
    });
  });
});
