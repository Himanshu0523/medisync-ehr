import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { api, createUser } from './helpers.js';
import { signAccessToken } from '../src/utils/tokens.js';
import Hospital from '../src/modules/hospital/hospital.model.js';
import User from '../src/modules/user/user.model.js';
import Doctor from '../src/modules/doctor/doctor.model.js';
import Patient from '../src/modules/patient/patient.model.js';
import PatientHospital from '../src/modules/patientHospital/patientHospital.model.js';
import Booking from '../src/modules/booking/booking.model.js';
import Visit from '../src/modules/visit/visit.model.js';
import VisitDisease from '../src/modules/visitDisease/visitDisease.model.js';
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

describe('Step 3.5.2.2 — MongoDB Query Isolation & Remediation Regression Suite', () => {
  let hospA, hospB;
  let adminA, adminB, superAdmin, recepA;
  let userDocA, doctorA, userDocB, doctorB;
  let userPatientA, patientA, userPatientB, patientB;
  let tokenAdminA, tokenAdminB, tokenSuperAdmin, tokenRecepA;
  let tokenDocA, tokenDocB, tokenPatientA;
  let bookingA, bookingB, visitA, visitB, testA, testB;

  beforeEach(async () => {
    await Promise.all([
      Hospital.deleteMany({}),
      User.deleteMany({}),
      Doctor.deleteMany({}),
      Patient.deleteMany({}),
      PatientHospital.deleteMany({}),
      Booking.deleteMany({}),
      Visit.deleteMany({}),
      VisitDisease.deleteMany({}),
      Test.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);

    // 1. Setup Hospital A and Hospital B
    hospA = await Hospital.create({
      name: 'Metro General Hospital A',
      code: 'METHOSP-A',
      email: 'contact@metrohosp-a.com',
      contactNumber: '01123456789',
      status: 'active',
    });

    hospB = await Hospital.create({
      name: 'Apex Health Center B',
      code: 'APEXHC-B',
      email: 'contact@apexhc-b.com',
      contactNumber: '02234567890',
      status: 'active',
    });

    // 2. Administrators
    superAdmin = await createUser({
      name: 'Platform Super Admin',
      email: 'superadmin@medisync.com',
      role: ROLES.SUPER_ADMIN,
    });
    tokenSuperAdmin = signAccessToken(superAdmin._id, superAdmin.role);

    adminA = await createUser({
      name: 'Admin Hospital A',
      email: 'admin@hospital-a.com',
      role: ROLES.HOSPITAL_ADMIN,
      hospitalId: hospA._id,
    });
    tokenAdminA = signAccessToken(adminA._id, adminA.role);

    adminB = await createUser({
      name: 'Admin Hospital B',
      email: 'admin@hospital-b.com',
      role: ROLES.HOSPITAL_ADMIN,
      hospitalId: hospB._id,
    });
    tokenAdminB = signAccessToken(adminB._id, adminB.role);

    recepA = await createUser({
      name: 'Receptionist Hospital A',
      email: 'receptionist@hospital-a.com',
      role: ROLES.RECEPTIONIST,
      hospitalId: hospA._id,
    });
    tokenRecepA = signAccessToken(recepA._id, recepA.role);

    // 3. Doctors
    userDocA = await createUser({
      name: 'Dr. Alice Hospital A',
      email: 'alice.doc@hospital-a.com',
      role: ROLES.DOCTOR,
      hospitalId: hospA._id,
    });
    tokenDocA = signAccessToken(userDocA._id, userDocA.role);

    doctorA = await Doctor.create({
      name: 'Dr. Alice Hospital A',
      email: 'alice.doc@hospital-a.com',
      mobile: '9876543211',
      specialization: 'Internal Medicine',
      user: userDocA._id,
      hospitalId: hospA._id,
      status: 'active',
      verificationStatus: 'verified',
      isApproved: true,
      isPublished: true,
      availability: [{ day: 'Mon', start: '09:00', end: '17:00', slotMinutes: 30 }],
    });

    userDocB = await createUser({
      name: 'Dr. Bob Hospital B',
      email: 'bob.doc@hospital-b.com',
      role: ROLES.DOCTOR,
      hospitalId: hospB._id,
    });
    tokenDocB = signAccessToken(userDocB._id, userDocB.role);

    doctorB = await Doctor.create({
      name: 'Dr. Bob Hospital B',
      email: 'bob.doc@hospital-b.com',
      mobile: '9876543222',
      specialization: 'Cardiology',
      user: userDocB._id,
      hospitalId: hospB._id,
      status: 'active',
      verificationStatus: 'verified',
      isApproved: true,
      isPublished: true,
      availability: [{ day: 'Mon', start: '09:00', end: '17:00', slotMinutes: 30 }],
    });

    // 4. Patients
    userPatientA = await createUser({
      name: 'Patient Hospital A',
      email: 'patient.a@gmail.com',
      mobile: '9811122233',
      role: ROLES.PATIENT,
    });
    tokenPatientA = signAccessToken(userPatientA._id, userPatientA.role);
    patientA = await Patient.create({ user: userPatientA._id });
    await PatientHospital.create({
      patient: patientA._id,
      hospital: hospA._id,
      medicalRecordNumber: 'METHOSP-A-000001',
      registeredBy: adminA._id,
      status: 'active',
    });

    userPatientB = await createUser({
      name: 'Patient Hospital B',
      email: 'patient.b@gmail.com',
      mobile: '9844455566',
      role: ROLES.PATIENT,
    });
    patientB = await Patient.create({ user: userPatientB._id });
    await PatientHospital.create({
      patient: patientB._id,
      hospital: hospB._id,
      medicalRecordNumber: 'APEXHC-B-000001',
      registeredBy: adminB._id,
      status: 'active',
    });

    // 5. Bookings & Visits
    const testDate = new Date();
    testDate.setDate(testDate.getDate() + ((1 + 7 - testDate.getDay()) % 7 || 7)); // Next Monday
    testDate.setHours(0, 0, 0, 0);

    bookingA = await Booking.create({
      patient: userPatientA._id,
      doctor: doctorA._id,
      hospital: hospA._id,
      date: testDate,
      time: '10:00',
      status: 'confirmed',
    });

    visitA = await Visit.create({
      patient: userPatientA._id,
      mobile: userPatientA.mobile,
      date: testDate,
      time: '10:00',
      doctor: doctorA._id,
      booking: bookingA._id,
      hospital: hospA._id,
    });

    bookingB = await Booking.create({
      patient: userPatientB._id,
      doctor: doctorB._id,
      hospital: hospB._id,
      date: testDate,
      time: '11:00',
      status: 'confirmed',
    });

    visitB = await Visit.create({
      patient: userPatientB._id,
      mobile: userPatientB.mobile,
      date: testDate,
      time: '11:00',
      doctor: doctorB._id,
      booking: bookingB._id,
      hospital: hospB._id,
    });

    // 6. Test records
    testA = await Test.create({
      visit: visitA._id,
      testName: 'Complete Blood Count (Hospital A)',
      testDate: new Date(),
      createdBy: userDocA._id,
    });

    testB = await Test.create({
      visit: visitB._id,
      testName: 'Lipid Profile (Hospital B)',
      testDate: new Date(),
      createdBy: userDocB._id,
    });

    // 7. Audit records
    await AuditLog.create({
      actor: adminA._id,
      actorRole: ROLES.HOSPITAL_ADMIN,
      action: 'DOCTOR_CREDENTIALS_APPROVED',
      entity: 'Doctor',
      entityId: doctorA._id.toString(),
      hospitalId: hospA._id,
    });

    await AuditLog.create({
      actor: adminB._id,
      actorRole: ROLES.HOSPITAL_ADMIN,
      action: 'DOCTOR_CREDENTIALS_APPROVED',
      entity: 'Doctor',
      entityId: doctorB._id.toString(),
      hospitalId: hospB._id,
    });
  });

  // SCENARIO 1: Doctor Update Boundary
  describe('1. Doctor Mutation Isolation (Update)', () => {
    it('Hospital Admin A cannot update Hospital B doctor', async () => {
      const res = await api.patch(`/api/v1/doctors/${doctorB._id}`)
        .set('Authorization', `Bearer ${tokenAdminA}`)
        .send({ experience: '30+ yrs exp' });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/Cross-hospital access forbidden/i);

      // Verify DB unchanged
      const freshDocB = await Doctor.findById(doctorB._id);
      expect(freshDocB.experience).not.toBe('30+ yrs exp');
    });

    it('Hospital Admin A cannot hijack Doctor B hospitalId via update payload', async () => {
      const res = await api.patch(`/api/v1/doctors/${doctorB._id}`)
        .set('Authorization', `Bearer ${tokenAdminA}`)
        .send({ hospitalId: hospA._id.toString() });

      expect(res.status).toBe(403);
      const freshDocB = await Doctor.findById(doctorB._id);
      expect(freshDocB.hospitalId.toString()).toBe(hospB._id.toString());
    });

    it('Hospital Admin A can legitimately update their own Hospital A doctor', async () => {
      const res = await api.patch(`/api/v1/doctors/${doctorA._id}`)
        .set('Authorization', `Bearer ${tokenAdminA}`)
        .send({ experience: '15+ yrs exp' });

      expect(res.status).toBe(200);
      const freshDocA = await Doctor.findById(doctorA._id);
      expect(freshDocA.experience).toBe('15+ yrs exp');
    });
  });

  // SCENARIO 2: Doctor Deletion Boundary
  describe('2. Doctor Deletion Isolation', () => {
    it('Hospital Admin A cannot delete Hospital B doctor', async () => {
      const res = await api.delete(`/api/v1/doctors/${doctorB._id}`)
        .set('Authorization', `Bearer ${tokenAdminA}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/Cross-hospital access forbidden/i);

      // Verify DB unchanged
      const freshDocB = await Doctor.findById(doctorB._id);
      expect(freshDocB.deletedAt).toBeNull();
      expect(freshDocB.status).toBe('active');
    });

    it('Hospital Admin A can legitimately delete their own Hospital A doctor', async () => {
      const res = await api.delete(`/api/v1/doctors/${doctorA._id}`)
        .set('Authorization', `Bearer ${tokenAdminA}`);

      expect(res.status).toBe(200);
      const freshDocA = await Doctor.findById(doctorA._id);
      expect(freshDocA.deletedAt).toBeInstanceOf(Date);
      expect(freshDocA.status).toBe('inactive');
      expect(freshDocA.isPublished).toBe(false);
    });
  });

  // SCENARIO 3: Doctor Creation Boundary
  describe('3. Doctor Creation Isolation', () => {
    it('Hospital Admin A cannot create a doctor assigned to Hospital B', async () => {
      const res = await api.post('/api/v1/doctors')
        .set('Authorization', `Bearer ${tokenAdminA}`)
        .send({
          name: 'Dr. Cross Hospital Impostor',
          email: 'impostor.doc@hospital-b.com',
          mobile: '9899988877',
          specialization: 'Neurology',
          timing: '09:00 - 17:00',
          hospitalId: hospB._id.toString(), // Attacking Hospital B
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/Cannot create a doctor for another hospital/i);

      // Verify doctor not created in DB
      const notCreated = await Doctor.findOne({ email: 'impostor.doc@hospital-b.com' });
      expect(notCreated).toBeNull();
    });

    it('Hospital Admin A creates a doctor strictly bound to Hospital A', async () => {
      const res = await api.post('/api/v1/doctors')
        .set('Authorization', `Bearer ${tokenAdminA}`)
        .send({
          name: 'Dr. Valid Hospital A Specialist',
          email: 'newspecialist@hospital-a.com',
          mobile: '9899988866',
          specialization: 'Orthopedics',
          timing: '09:00 - 17:00',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.hospitalId.toString()).toBe(hospA._id.toString());
    });
  });

  // SCENARIO 4: Super Admin Platform Authority
  describe('4. Super Admin Platform Doctor Management', () => {
    it('Super Admin can manage doctors across any hospital with explicit validation', async () => {
      // Super Admin creates a doctor for Hospital B
      const createRes = await api.post('/api/v1/doctors')
        .set('Authorization', `Bearer ${tokenSuperAdmin}`)
        .send({
          name: 'Dr. Super Platform Doctor',
          email: 'platform.doc@hospital-b.com',
          mobile: '9899988855',
          specialization: 'Dermatology',
          timing: '10:00 - 18:00',
          hospitalId: hospB._id.toString(),
        });

      expect(createRes.status).toBe(201);
      const newDocId = createRes.body.data._id;

      // Super Admin updates doctor
      const updateRes = await api.patch(`/api/v1/doctors/${newDocId}`)
        .set('Authorization', `Bearer ${tokenSuperAdmin}`)
        .send({ experience: '12+ yrs exp' });
      expect(updateRes.status).toBe(200);

      // Super Admin deletes doctor
      const deleteRes = await api.delete(`/api/v1/doctors/${newDocId}`)
        .set('Authorization', `Bearer ${tokenSuperAdmin}`);
      expect(deleteRes.status).toBe(200);
    });
  });

  // SCENARIO 5: Receptionist Doctor Directory Isolation
  describe('5. Doctor Directory & Receptionist Isolation', () => {
    beforeEach(async () => {
      // Create pending unverified doctor in Hospital B
      await Doctor.create({
        name: 'Dr. Unpublished Secret B',
        email: 'secret.b@hospital-b.com',
        mobile: '9888811111',
        specialization: 'Psychiatry',
        hospitalId: hospB._id,
        status: 'pending',
        verificationStatus: 'pending_verification',
        isApproved: false,
        isPublished: false,
      });

      // Create pending unverified doctor in Hospital A
      await Doctor.create({
        name: 'Dr. Unpublished Pending A',
        email: 'pending.a@hospital-a.com',
        mobile: '9888822222',
        specialization: 'Pediatrics',
        hospitalId: hospA._id,
        status: 'pending',
        verificationStatus: 'pending_verification',
        isApproved: false,
        isPublished: false,
      });
    });

    it('Receptionist A cannot view unpublished doctors from Hospital B', async () => {
      const res = await api.get('/api/v1/doctors?includeUnpublished=true')
        .set('Authorization', `Bearer ${tokenRecepA}`);

      expect(res.status).toBe(200);
      const returnedDocs = res.body.data?.doctors || [];

      // Must NOT contain Hospital B's unpublished doctor
      const hasForeignSecret = returnedDocs.some(d => d.email === 'secret.b@hospital-b.com');
      expect(hasForeignSecret).toBe(false);

      // Must only contain Hospital A doctors
      const allBelongToHospA = returnedDocs.every(d => d.hospitalId.toString() === hospA._id.toString());
      expect(allBelongToHospA).toBe(true);
    });

    it('Public patient cannot view unverified/unpublished doctors from any hospital', async () => {
      const res = await api.get('/api/v1/doctors?includeUnpublished=true');
      expect(res.status).toBe(200);
      const docs = res.body.data?.doctors || [];
      const hasUnpublished = docs.some(d => !d.isPublished || !d.isApproved || d.verificationStatus !== 'verified');
      expect(hasUnpublished).toBe(false);
    });
  });

  // SCENARIO 6: Historical Clinical Record Isolation (VisitDisease)
  describe('6. Historical Clinical Record Isolation (VisitDisease)', () => {
    it('Doctor B cannot read clinical diagnoses from Hospital A visits', async () => {
      // Create diagnosis on Hospital A's visit
      await VisitDisease.create({
        visit: visitA._id,
        disease: 'Type 2 Diabetes Mellitus',
        prescription: 'Metformin 500mg BID',
      });

      // Doctor B attempts to query diagnoses
      const res = await api.get('/api/v1/visit-diseases')
        .set('Authorization', `Bearer ${tokenDocB}`);

      expect(res.status).toBe(200);
      const records = res.body.data?.records || [];
      expect(records.length).toBe(0); // Cannot see Hospital A's diagnoses
    });

    it('Doctor B specifying visitA ID is denied with 403', async () => {
      const res = await api.get(`/api/v1/visit-diseases?visit=${visitA._id}`)
        .set('Authorization', `Bearer ${tokenDocB}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/consulting doctor at your affiliated hospital/i);
    });

    it('Doctor A can read their own consultations at Hospital A', async () => {
      await VisitDisease.create({
        visit: visitA._id,
        disease: 'Hypertension',
        prescription: 'Amlodipine 5mg',
      });

      const res = await api.get(`/api/v1/visit-diseases?visit=${visitA._id}`)
        .set('Authorization', `Bearer ${tokenDocA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.records.length).toBe(1);
      expect(res.body.data.records[0].disease).toBe('Hypertension');
    });
  });

  // SCENARIO 7: Booking Mutation Boundary
  describe('7. Booking Mutation Isolation', () => {
    it('Hospital Admin A cannot cancel or confirm Hospital B booking', async () => {
      const res = await api.patch(`/api/v1/bookings/${bookingB._id}/status`)
        .set('Authorization', `Bearer ${tokenAdminA}`)
        .send({ status: 'cancelled' });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/Cannot modify bookings of another hospital/i);

      // Verify bookingB remains confirmed
      const freshBookingB = await Booking.findById(bookingB._id);
      expect(freshBookingB.status).toBe('confirmed');
    });

    it('Hospital Admin A can legitimately update status of Hospital A booking', async () => {
      const res = await api.patch(`/api/v1/bookings/${bookingA._id}/status`)
        .set('Authorization', `Bearer ${tokenAdminA}`)
        .send({ status: 'completed' });

      expect(res.status).toBe(200);
      const freshBookingA = await Booking.findById(bookingA._id);
      expect(freshBookingA.status).toBe('completed');
    });
  });

  // SCENARIO 8: Visit Retrieval Boundary
  describe('8. Visit Retrieval Isolation', () => {
    it('Hospital Admin A cannot retrieve Hospital B visit by ID', async () => {
      const res = await api.get(`/api/v1/visits/${visitB._id}`)
        .set('Authorization', `Bearer ${tokenAdminA}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/Visit record belongs to another hospital facility/i);
    });

    it('Hospital Admin A can legitimately retrieve Hospital A visit by ID', async () => {
      const res = await api.get(`/api/v1/visits/${visitA._id}`)
        .set('Authorization', `Bearer ${tokenAdminA}`);

      expect(res.status).toBe(200);
      expect(res.body.data._id.toString()).toBe(visitA._id.toString());
    });
  });

  // SCENARIO 9: Clinical Lab Test Retrieval Boundary
  describe('9. Lab Test Retrieval Isolation', () => {
    it('Hospital Admin A cannot query tests using query.hospitalId=Hospital B', async () => {
      const res = await api.get(`/api/v1/tests?hospitalId=${hospB._id}`)
        .set('Authorization', `Bearer ${tokenAdminA}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/Cannot query tests for another hospital/i);
    });

    it('Hospital Admin A cannot query tests for Hospital B visit', async () => {
      const res = await api.get(`/api/v1/tests?visit=${visitB._id}`)
        .set('Authorization', `Bearer ${tokenAdminA}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/Visit does not belong to your hospital/i);
    });

    it('Hospital Admin A receives tests strictly belonging to Hospital A', async () => {
      const res = await api.get('/api/v1/tests')
        .set('Authorization', `Bearer ${tokenAdminA}`);

      expect(res.status).toBe(200);
      const tests = res.body.data?.tests || [];
      expect(tests.length).toBe(1);
      expect(tests[0]._id.toString()).toBe(testA._id.toString());
    });
  });

  // SCENARIO 10: Audit Log Parameter Pollution Boundary
  describe('10. Audit Log Isolation & Parameter Tampering', () => {
    it('Hospital Admin A cannot query audit logs for Hospital B via query.hospitalId', async () => {
      const res = await api.get(`/api/v1/audit?hospitalId=${hospB._id}`)
        .set('Authorization', `Bearer ${tokenAdminA}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/Cannot query audit records for another hospital/i);
    });

    it('Hospital Admin A cannot query audit logs for an actor belonging to Hospital B', async () => {
      const res = await api.get(`/api/v1/audit?actor=${adminB._id}`)
        .set('Authorization', `Bearer ${tokenAdminA}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/Cannot query audit records for users outside your hospital/i);
    });

    it('Hospital Admin A can legitimately query their own hospital audit logs', async () => {
      const res = await api.get('/api/v1/audit')
        .set('Authorization', `Bearer ${tokenAdminA}`);

      expect(res.status).toBe(200);
      const logs = res.body.data?.logs || [];
      expect(logs.length).toBe(1);
      expect(logs[0].hospitalId.toString()).toBe(hospA._id.toString());
    });

    it('Super Admin can explicitly query platform-wide audit logs or filter by hospital', async () => {
      const resAll = await api.get('/api/v1/audit')
        .set('Authorization', `Bearer ${tokenSuperAdmin}`);
      expect(resAll.status).toBe(200);
      expect(resAll.body.data.logs.length).toBe(2);

      const resHospB = await api.get(`/api/v1/audit?hospitalId=${hospB._id}`)
        .set('Authorization', `Bearer ${tokenSuperAdmin}`);
      expect(resHospB.status).toBe(200);
      expect(resHospB.body.data.logs.length).toBe(1);
      expect(resHospB.body.data.logs[0].hospitalId.toString()).toBe(hospB._id.toString());
    });
  });
});
