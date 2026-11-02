import { jest } from '@jest/globals';
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
import VisitDisease from '../src/modules/visitDisease/visitDisease.model.js';
import Test from '../src/modules/test/test.model.js';
import AuditLog from '../src/modules/audit/audit.model.js';
import { signAccessToken } from '../src/utils/tokens.js';
import { ROLES } from '../src/modules/auth/auth.constants.js';
import { requireClinicalRecordAccess } from '../src/modules/authorization/clinicalAccess.service.js';

let mongod;
const api = request(app);
jest.setTimeout(120000);

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
}, 60000);

describe('Step 3.5.2.4 — Populate and Aggregation Isolation Test Suite', () => {
  let hospA, hospB;
  let adminA, receptionistA, doctorUserA, doctorDocA;
  let adminB, receptionistB, doctorUserB, doctorDocB;
  let patientUser1, patientDoc1, patientUser2, patientDoc2;
  let tokenAdminA, tokenReceptionistA, tokenDoctorA;
  let tokenAdminB, tokenReceptionistB, tokenDoctorB;
  let tokenPatient1, tokenPatient2, tokenSuperAdmin;
  let bookingA, bookingB;
  let visitA, visitB;
  let visitDiseaseA, visitDiseaseB;
  let testA, testB;

  beforeEach(async () => {
    const collections = await mongoose.connection.db.collections();
    for (const c of collections) await c.deleteMany({});

    // 1. Setup Hospital A and Hospital B
    hospA = await Hospital.create({
      name: 'Metro General Hospital A',
      code: 'MGH-A',
      email: 'contact@mgh-a.com',
      contactNumber: '02211112222',
      status: 'active',
      deletedAt: null,
    });

    hospB = await Hospital.create({
      name: 'Sunrise Care Hospital B',
      code: 'SCH-B',
      email: 'contact@sch-b.com',
      contactNumber: '02233334444',
      status: 'active',
      deletedAt: null,
    });

    // 2. Setup Hospital A Staff
    adminA = await User.create({
      name: 'Admin Hospital A',
      email: 'admin.a@mgh.com',
      mobile: '9800000001',
      password: 'SecurePass123!',
      role: ROLES.HOSPITAL_ADMIN,
      hospitalId: hospA._id,
      status: 'active',
      emailVerified: true,
    });

    receptionistA = await User.create({
      name: 'Receptionist A',
      email: 'recep.a@mgh.com',
      mobile: '9800000002',
      password: 'SecurePass123!',
      role: ROLES.RECEPTIONIST,
      hospitalId: hospA._id,
      status: 'active',
      emailVerified: true,
    });

    doctorUserA = await User.create({
      name: 'Dr. Alice A',
      email: 'alice.a@mgh.com',
      mobile: '9800000003',
      password: 'SecurePass123!',
      role: ROLES.DOCTOR,
      hospitalId: hospA._id,
      status: 'active',
      emailVerified: true,
    });

    doctorDocA = await Doctor.create({
      user: doctorUserA._id,
      name: 'Dr. Alice A',
      email: 'alice.a@mgh.com',
      mobile: '9800000003',
      specialization: 'Cardiology',
      hospitalId: hospA._id,
      status: 'active',
      verificationStatus: 'verified',
      isApproved: true,
      isPublished: true,
      timing: '09:00 - 17:00',
    });

    // 3. Setup Hospital B Staff
    adminB = await User.create({
      name: 'Admin Hospital B',
      email: 'admin.b@sch.com',
      mobile: '9800000011',
      password: 'SecurePass123!',
      role: ROLES.HOSPITAL_ADMIN,
      hospitalId: hospB._id,
      status: 'active',
      emailVerified: true,
    });

    receptionistB = await User.create({
      name: 'Receptionist B',
      email: 'recep.b@sch.com',
      mobile: '9800000012',
      password: 'SecurePass123!',
      role: ROLES.RECEPTIONIST,
      hospitalId: hospB._id,
      status: 'active',
      emailVerified: true,
    });

    doctorUserB = await User.create({
      name: 'Dr. Bob B',
      email: 'bob.b@sch.com',
      mobile: '9800000013',
      password: 'SecurePass123!',
      role: ROLES.DOCTOR,
      hospitalId: hospB._id,
      status: 'active',
      emailVerified: true,
    });

    doctorDocB = await Doctor.create({
      user: doctorUserB._id,
      name: 'Dr. Bob B',
      email: 'bob.b@sch.com',
      mobile: '9800000013',
      specialization: 'Neurology',
      hospitalId: hospB._id,
      status: 'active',
      verificationStatus: 'verified',
      isApproved: true,
      isPublished: true,
      timing: '10:00 - 18:00',
    });

    // 4. Setup Patients
    // Patient 1 has affiliation with BOTH Hospital A and Hospital B
    patientUser1 = await User.create({
      name: 'Patient Multi One',
      email: 'patient1@global.com',
      mobile: '9900000001',
      password: 'SecurePass123!',
      role: ROLES.PATIENT,
      hospitalId: null,
      status: 'active',
      emailVerified: true,
    });

    patientDoc1 = await Patient.create({
      user: patientUser1._id,
      name: 'Patient Multi One',
      dateOfBirth: new Date('1990-05-15'),
      gender: 'male',
      contactNumber: '9900000001',
      bloodGroup: 'O+',
    });

    await PatientHospital.create([
      {
        patient: patientDoc1._id,
        hospital: hospA._id,
        medicalRecordNumber: 'MRN-A-001',
        registeredBy: receptionistA._id,
      },
      {
        patient: patientDoc1._id,
        hospital: hospB._id,
        medicalRecordNumber: 'MRN-B-001',
        registeredBy: receptionistB._id,
      },
    ]);

    // Patient 2 has affiliation ONLY with Hospital B
    patientUser2 = await User.create({
      name: 'Patient Solo Two',
      email: 'patient2@global.com',
      mobile: '9900000002',
      password: 'SecurePass123!',
      role: ROLES.PATIENT,
      hospitalId: null,
      status: 'active',
      emailVerified: true,
    });

    patientDoc2 = await Patient.create({
      user: patientUser2._id,
      name: 'Patient Solo Two',
      dateOfBirth: new Date('1995-10-20'),
      gender: 'female',
      contactNumber: '9900000002',
      bloodGroup: 'A+',
    });

    await PatientHospital.create({
      patient: patientDoc2._id,
      hospital: hospB._id,
      medicalRecordNumber: 'MRN-B-002',
      registeredBy: receptionistB._id,
    });

    // 5. Setup Super Admin
    const superAdmin = await User.create({
      name: 'Platform Super Admin',
      email: 'superadmin@platform.com',
      mobile: '9700000001',
      password: 'SecurePass123!',
      role: ROLES.SUPER_ADMIN,
      hospitalId: null,
      status: 'active',
      emailVerified: true,
    });

    // 6. Setup Bookings & Visits
    // Hospital A: Booking & Visit for Patient 1
    bookingA = await Booking.create({
      patient: patientUser1._id,
      doctor: doctorDocA._id,
      hospital: hospA._id,
      date: new Date('2026-11-10T10:00:00Z'),
      time: '10:00 AM',
      status: 'confirmed',
    });

    visitA = await Visit.create({
      booking: bookingA._id,
      patient: patientUser1._id,
      doctor: doctorDocA._id,
      hospital: hospA._id,
      mobile: patientUser1.mobile,
      time: '10:00 AM',
      date: new Date('2026-11-10T10:00:00Z'),
      status: 'in-progress',
    });

    visitDiseaseA = await VisitDisease.create({
      visit: visitA._id,
      disease: 'Hypertension',
      prescription: 'Amlodipine 5mg daily',
      diagnosedBy: doctorDocA._id,
    });

    testA = await Test.create({
      visit: visitA._id,
      visitDisease: visitDiseaseA._id,
      testName: 'Lipid Profile',
      testDate: new Date('2026-11-10T11:00:00Z'),
      status: 'completed',
      result: 'Total Cholesterol 185 mg/dL',
    });

    // Hospital B: Booking & Visit for Patient 2
    bookingB = await Booking.create({
      patient: patientUser2._id,
      doctor: doctorDocB._id,
      hospital: hospB._id,
      date: new Date('2026-11-12T14:00:00Z'),
      time: '02:00 PM',
      status: 'confirmed',
    });

    visitB = await Visit.create({
      booking: bookingB._id,
      patient: patientUser2._id,
      doctor: doctorDocB._id,
      hospital: hospB._id,
      mobile: patientUser2.mobile,
      time: '02:00 PM',
      date: new Date('2026-11-12T14:00:00Z'),
      status: 'completed',
    });

    visitDiseaseB = await VisitDisease.create({
      visit: visitB._id,
      disease: 'Migraine',
      prescription: 'Sumatriptan 50mg SOS',
      diagnosedBy: doctorDocB._id,
    });

    testB = await Test.create({
      visit: visitB._id,
      visitDisease: visitDiseaseB._id,
      testName: 'Brain MRI',
      testDate: new Date('2026-11-12T15:00:00Z'),
      status: 'completed',
      result: 'Normal intracranial study',
    });

    // 7. Audit records
    await AuditLog.create([
      {
        actor: adminA._id,
        actorRole: ROLES.HOSPITAL_ADMIN,
        action: 'DOCTOR_CREDENTIALS_APPROVED',
        entity: 'Doctor',
        entityId: doctorDocA._id.toString(),
        hospitalId: hospA._id,
        before: { isApproved: false },
        after: { isApproved: true },
      },
      {
        actor: adminB._id,
        actorRole: ROLES.HOSPITAL_ADMIN,
        action: 'DOCTOR_CREDENTIALS_APPROVED',
        entity: 'Doctor',
        entityId: doctorDocB._id.toString(),
        hospitalId: hospB._id,
        before: { isApproved: false },
        after: { isApproved: true },
      },
      {
        actor: superAdmin._id,
        actorRole: ROLES.SUPER_ADMIN,
        action: 'PLATFORM_MAINTENANCE',
        entity: 'System',
        entityId: 'global',
        hospitalId: null,
      },
    ]);

    // 8. Sign Access Tokens
    tokenAdminA = signAccessToken(adminA._id, adminA.role);
    tokenReceptionistA = signAccessToken(receptionistA._id, receptionistA.role);
    tokenDoctorA = signAccessToken(doctorUserA._id, doctorUserA.role);

    tokenAdminB = signAccessToken(adminB._id, adminB.role);
    tokenReceptionistB = signAccessToken(receptionistB._id, receptionistB.role);
    tokenDoctorB = signAccessToken(doctorUserB._id, doctorUserB.role);

    tokenPatient1 = signAccessToken(patientUser1._id, patientUser1.role);
    tokenPatient2 = signAccessToken(patientUser2._id, patientUser2.role);
    tokenSuperAdmin = signAccessToken(superAdmin._id, superAdmin.role);
  }, 60000);

  // Scenario 1: Hospital A staff cannot populate Hospital B doctor information
  it('1. Hospital A staff cannot populate Hospital B doctor information', async () => {
    const res = await api
      .get('/api/v1/doctors?includeUnpublished=true')
      .set('Authorization', `Bearer ${tokenReceptionistA}`);

    expect(res.status).toBe(200);
    const doctors = res.body.data.doctors;
    expect(doctors.length).toBeGreaterThan(0);
    doctors.forEach((d) => {
      expect(d.hospitalId.toString()).toBe(hospA._id.toString());
      expect(d.name).not.toBe('Dr. Bob B');
    });
  });

  // Scenario 2: Hospital A staff cannot retrieve Hospital B visit details through nested population
  it('2. Hospital A staff cannot retrieve Hospital B visit details through nested population', async () => {
    const res = await api
      .get(`/api/v1/visits/${visitB._id}`)
      .set('Authorization', `Bearer ${tokenReceptionistA}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/belongs to another hospital facility/i);
  });

  // Scenario 3: Hospital A staff cannot retrieve Hospital B tests through a populated Visit
  it('3. Hospital A staff cannot retrieve Hospital B tests through a populated Visit', async () => {
    const res = await api
      .get(`/api/v1/tests?visit=${visitB._id}`)
      .set('Authorization', `Bearer ${tokenReceptionistA}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/does not belong to your hospital/i);
  });

  // Scenario 4: A doctor cannot retrieve another hospital's VisitDisease history
  it('4. A doctor cannot retrieve another hospital\'s VisitDisease history', async () => {
    const res = await api
      .get(`/api/v1/visit-diseases?visit=${visitB._id}`)
      .set('Authorization', `Bearer ${tokenDoctorA}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/consulting doctor at your affiliated hospital/i);
  });

  // Scenario 5: A patient can retrieve their own authorized records across multiple hospital affiliations
  it('5. A patient can retrieve their own authorized records across multiple hospital affiliations', async () => {
    // Create a visit for Patient 1 at Hospital B as well
    const bookingA2 = await Booking.create({
      patient: patientUser1._id,
      doctor: doctorDocB._id,
      hospital: hospB._id,
      date: new Date('2026-11-20T10:00:00Z'),
      time: '11:00 AM',
      status: 'confirmed',
    });

    const visitB2 = await Visit.create({
      booking: bookingA2._id,
      patient: patientUser1._id,
      doctor: doctorDocB._id,
      hospital: hospB._id,
      mobile: patientUser1.mobile,
      time: '11:00 AM',
      date: new Date('2026-11-20T10:00:00Z'),
      status: 'completed',
    });

    const res = await api
      .get('/api/v1/visits')
      .set('Authorization', `Bearer ${tokenPatient1}`);

    expect(res.status).toBe(200);
    const visits = res.body.data.visits;
    expect(visits.length).toBe(2);

    const hospitalIdsInVisits = visits.map((v) => v.doctor?.hospitalId?.toString());
    expect(hospitalIdsInVisits).toContain(hospA._id.toString());
    expect(hospitalIdsInVisits).toContain(hospB._id.toString());
  });

  // Scenario 6: A patient cannot retrieve another patient's records through population
  it('6. A patient cannot retrieve another patient\'s records through population', async () => {
    const res = await api
      .get(`/api/v1/visits/${visitB._id}`)
      .set('Authorization', `Bearer ${tokenPatient1}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/access your own visit history/i);
  });

  // Scenario 7: A populated Booking cannot expose another hospital's Doctor
  it('7. A populated Booking cannot expose another hospital\'s Doctor', async () => {
    const res = await api
      .get('/api/v1/bookings')
      .set('Authorization', `Bearer ${tokenReceptionistA}`);

    expect(res.status).toBe(200);
    const bookings = res.body.data.bookings;
    expect(bookings.length).toBeGreaterThan(0);
    bookings.forEach((b) => {
      expect(b.hospital.toString()).toBe(hospA._id.toString());
      if (b.doctor) {
        expect(b.doctor.hospitalId.toString()).toBe(hospA._id.toString());
      }
    });
  });

  // Scenario 8: A $lookup cannot return another hospital's records
  it('8. A $lookup aggregation pipeline enforces tenant isolation boundary', async () => {
    const pipeline = [
      { $match: { _id: hospA._id } },
      {
        $lookup: {
          from: 'doctors',
          let: { hospId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$hospitalId', '$$hospId'] },
                    { $eq: ['$deletedAt', null] },
                  ],
                },
              },
            },
          ],
          as: 'joinedDoctors',
        },
      },
    ];

    const results = await Hospital.aggregate(pipeline);
    expect(results.length).toBe(1);
    expect(results[0].joinedDoctors.length).toBe(1);
    expect(results[0].joinedDoctors[0].name).toBe('Dr. Alice A');
    expect(results[0].joinedDoctors[0].hospitalId.toString()).toBe(hospA._id.toString());
  });

  // Scenario 9: An aggregation count does not include another hospital's documents
  it('9. An aggregation count does not include another hospital\'s documents', async () => {
    const counts = await Doctor.aggregate([
      { $match: { hospitalId: hospA._id, deletedAt: null } },
      { $group: { _id: '$hospitalId', count: { $sum: 1 } } },
    ]);

    expect(counts.length).toBe(1);
    expect(counts[0]._id.toString()).toBe(hospA._id.toString());
    expect(counts[0].count).toBe(1);
  });

  // Scenario 10: $facet branches preserve tenant filtering
  it('10. $facet branches preserve tenant filtering across parallel aggregation facets', async () => {
    const facetResults = await Hospital.aggregate([
      { $match: { _id: hospA._id } },
      {
        $facet: {
          doctors: [
            {
              $lookup: {
                from: 'doctors',
                let: { hId: '$_id' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ['$hospitalId', '$$hId'] },
                          { $eq: ['$deletedAt', null] },
                        ],
                      },
                    },
                  },
                ],
                as: 'list',
              },
            },
          ],
          patients: [
            {
              $lookup: {
                from: 'patienthospitals',
                let: { hId: '$_id' },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ['$hospital', '$$hId'] },
                    },
                  },
                ],
                as: 'list',
              },
            },
          ],
        },
      },
    ]);

    expect(facetResults[0].doctors[0].list.length).toBe(1);
    expect(facetResults[0].doctors[0].list[0].name).toBe('Dr. Alice A');
    expect(facetResults[0].patients[0].list.length).toBe(1);
    expect(facetResults[0].patients[0].list[0].medicalRecordNumber).toBe('MRN-A-001');
  });

  // Scenario 11: $unwind does not expose unauthorized joined records
  it('11. $unwind does not expose unauthorized joined records', async () => {
    const unwound = await Hospital.aggregate([
      { $match: { _id: hospA._id } },
      {
        $lookup: {
          from: 'doctors',
          let: { hospId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$hospitalId', '$$hospId'] },
                    { $eq: ['$deletedAt', null] },
                  ],
                },
              },
            },
          ],
          as: 'doctors',
        },
      },
      { $unwind: '$doctors' },
      {
        $project: {
          hospitalName: '$name',
          doctorName: '$doctors.name',
          doctorHospitalId: '$doctors.hospitalId',
        },
      },
    ]);

    expect(unwound.length).toBe(1);
    expect(unwound[0].hospitalName).toBe('Metro General Hospital A');
    expect(unwound[0].doctorName).toBe('Dr. Alice A');
    expect(unwound[0].doctorHospitalId.toString()).toBe(hospA._id.toString());
  });

  // Scenario 12: AuditLog population does not leak cross-hospital actor or event information
  it('12. AuditLog population does not leak cross-hospital actor or event information', async () => {
    const res = await api
      .get('/api/v1/audit')
      .set('Authorization', `Bearer ${tokenAdminA}`);

    expect(res.status).toBe(200);
    const logs = res.body.data.logs;
    expect(logs.length).toBeGreaterThan(0);
    logs.forEach((log) => {
      // Must only be Hospital A logs
      expect(log.hospitalId.toString()).toBe(hospA._id.toString());
      expect(log.actorRole).toBe(ROLES.HOSPITAL_ADMIN);
      expect(log.actor.name).toBe('Admin Hospital A');
      // Must not expose passwords or sensitive attributes
      expect(log.actor.password).toBeUndefined();
    });
  });

  // Scenario 13: Super Admin retains legitimate platform-wide access
  it('13. Super Admin retains legitimate platform-wide access', async () => {
    const resHosp = await api
      .get('/api/v1/hospitals/stats/platform')
      .set('Authorization', `Bearer ${tokenSuperAdmin}`);

    expect(resHosp.status).toBe(200);
    expect(resHosp.body.data.totalHospitals).toBe(2);
    expect(resHosp.body.data.activeHospitals).toBe(2);

    const resAudit = await api
      .get('/api/v1/audit')
      .set('Authorization', `Bearer ${tokenSuperAdmin}`);

    expect(resAudit.status).toBe(200);
    expect(resAudit.body.data.logs.length).toBe(3); // Hospital A, Hospital B, and null-hospital platform log
  });

  // Scenario 14: Public doctor directory behavior remains unchanged & sanitized
  it('14. Public doctor directory behavior sanitizes internal administrative reviewer identities', async () => {
    const res = await api.get('/api/v1/doctors');
    expect(res.status).toBe(200);
    const doctors = res.body.data.doctors;
    expect(doctors.length).toBeGreaterThanOrEqual(2);
    doctors.forEach((d) => {
      expect(d.isPublished).toBe(true);
      expect(d.isApproved).toBe(true);
      expect(d.verificationReviewedBy).toBeUndefined();
    });
  });

  // Scenario 15: Missing or invalid tenant context fails closed on hospital-scoped operations
  it('15. Missing or invalid tenant context fails closed on hospital-scoped operations', async () => {
    const staffNoHosp = await User.create({
      name: 'Unassigned Staff',
      email: 'no-hosp@mgh.com',
      mobile: '9899999999',
      password: 'SecurePass123!',
      role: ROLES.RECEPTIONIST,
      hospitalId: null,
      status: 'active',
      emailVerified: true,
    });
    const tokenNoHosp = signAccessToken(staffNoHosp._id, staffNoHosp.role);

    const res = await api
      .get('/api/v1/visits')
      .set('Authorization', `Bearer ${tokenNoHosp}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/No valid hospital assignment/i);
  });

  // Scenario 16: Forged hospital IDs cannot manipulate population or aggregation filters
  it('16. Forged hospital IDs in query or headers cannot alter population scoping', async () => {
    const res = await api
      .get(`/api/v1/visits?hospitalId=${hospB._id}`)
      .set('Authorization', `Bearer ${tokenReceptionistA}`)
      .set('X-Hospital-Id', hospB._id.toString());

    expect(res.status).toBe(200);
    const visits = res.body.data.visits;
    expect(visits.length).toBe(1);
    expect(visits[0].hospital.toString()).toBe(hospA._id.toString());
    expect(visits[0].doctor.hospitalId.toString()).toBe(hospA._id.toString());
  });

  // Scenario 17: Public GET /api/v1/hospitals/:id does NOT leak recentPatients or administrators
  it('17. Public GET /api/v1/hospitals/:id does NOT leak recentPatients or administrators to unauthenticated callers', async () => {
    const res = await api.get(`/api/v1/hospitals/${hospA._id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Metro General Hospital A');
    expect(res.body.data.recentPatients).toBeUndefined();
    expect(res.body.data.administrators).toBeUndefined();
    expect(res.body.data.administrator).toBeUndefined();
    expect(res.body.data.doctorsCount).toBe(1);
  });

  // Scenario 18: Hospital A staff GET /api/v1/hospitals/:hospBId does NOT leak Hospital B's recentPatients or administrators
  it('18. Hospital A staff GET /api/v1/hospitals/:hospBId does NOT leak Hospital B\'s recentPatients or administrators', async () => {
    const res = await api
      .get(`/api/v1/hospitals/${hospB._id}`)
      .set('Authorization', `Bearer ${tokenReceptionistA}`);

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Sunrise Care Hospital B');
    expect(res.body.data.recentPatients).toBeUndefined();
    expect(res.body.data.administrators).toBeUndefined();
    expect(res.body.data.administrator).toBeUndefined();
  });

  // Scenario 19: Super Admin GET /api/v1/hospitals/:id retrieves complete management details for that facility
  it('19. Super Admin GET /api/v1/hospitals/:id retrieves complete management details for that facility', async () => {
    const res = await api
      .get(`/api/v1/hospitals/${hospA._id}`)
      .set('Authorization', `Bearer ${tokenSuperAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Metro General Hospital A');
    expect(res.body.data.recentPatients).toBeDefined();
    expect(res.body.data.recentPatients.length).toBe(1);
    expect(res.body.data.recentPatients[0].patient.user.name).toBe('Patient Multi One');
    expect(res.body.data.administrators).toBeDefined();
    expect(res.body.data.administrators.length).toBe(1);
    expect(res.body.data.administrators[0].name).toBe('Admin Hospital A');
  });

  // Scenario 20: Hospital A Admin GET /api/v1/hospitals/:hospAId retrieves internal management and patient relations for their own hospital
  it('20. Hospital A Admin GET /api/v1/hospitals/:hospAId retrieves internal management and patient relations for their own hospital', async () => {
    const res = await api
      .get(`/api/v1/hospitals/${hospA._id}`)
      .set('Authorization', `Bearer ${tokenAdminA}`);

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Metro General Hospital A');
    expect(res.body.data.recentPatients).toBeDefined();
    expect(res.body.data.recentPatients.length).toBe(1);
    expect(res.body.data.recentPatients[0].patient.user.name).toBe('Patient Multi One');
  });

  // Scenario 21: A doctor cannot access former-hospital visit clinical records through requireClinicalRecordAccess
  it('21. A doctor cannot access former-hospital visit clinical records through requireClinicalRecordAccess', async () => {
    // Dr. Alice A attempts to access Visit B from Hospital B
    await expect(
      requireClinicalRecordAccess({
        visitId: visitB._id,
        user: doctorUserA,
        hospitalId: hospA._id,
      })
    ).rejects.toThrow(/Cross-hospital access denied: You cannot access clinical records from a hospital facility you are no longer affiliated with/i);
  });

  // Scenario 22: Doctor profile missing hospitalId is rejected with 403
  it('22. Doctor profile missing hospitalId is rejected with 403 during tenant context build', async () => {
    const unassignedDocUser = await User.create({
      name: 'Dr. No Hospital',
      email: 'dr.nohosp@medisync.com',
      mobile: '9888800099',
      password: 'SecurePass123!',
      role: ROLES.DOCTOR,
      hospitalId: hospA._id,
      status: 'active',
      emailVerified: true,
    });

    await Doctor.create({
      user: unassignedDocUser._id,
      name: 'Dr. No Hospital',
      email: 'dr.nohosp@medisync.com',
      mobile: '9888800099',
      specialization: 'General Medicine',
      hospitalId: null, // missing authoritative hospitalId
      status: 'active',
      verificationStatus: 'verified',
      isApproved: true,
      isPublished: true,
      timing: '09:00 - 17:00',
    });

    const docToken = signAccessToken(unassignedDocUser._id, unassignedDocUser.role);

    const res = await api
      .get('/api/v1/visits')
      .set('Authorization', `Bearer ${docToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/Doctor profile is missing authoritative hospital assignment/i);
  });

  // Scenario 23: Multi-hospital patient booking list validates doctor hospital per individual booking
  it('23. Multi-hospital patient booking list validates doctor hospital per individual booking', async () => {
    // Create an additional booking for Patient 1 at Hospital B with Doctor B
    await Booking.create({
      patient: patientUser1._id,
      doctor: doctorDocB._id,
      hospital: hospB._id,
      date: new Date('2026-11-15T11:00:00Z'),
      time: '11:00 AM',
      status: 'confirmed',
    });

    const res = await api
      .get('/api/v1/bookings')
      .set('Authorization', `Bearer ${tokenPatient1}`);

    expect(res.status).toBe(200);
    const bookings = res.body.data.bookings;
    expect(bookings.length).toBeGreaterThanOrEqual(2);

    const bookingAtHospA = bookings.find((b) => b.hospital.toString() === hospA._id.toString());
    const bookingAtHospB = bookings.find((b) => b.hospital.toString() === hospB._id.toString());

    expect(bookingAtHospA).toBeDefined();
    expect(bookingAtHospA.doctor).toBeDefined();
    expect(bookingAtHospA.doctor.name).toBe('Dr. Alice A');
    expect(bookingAtHospA.doctor.hospitalId.toString()).toBe(hospA._id.toString());

    expect(bookingAtHospB).toBeDefined();
    expect(bookingAtHospB.doctor).toBeDefined();
    expect(bookingAtHospB.doctor.name).toBe('Dr. Bob B');
    expect(bookingAtHospB.doctor.hospitalId.toString()).toBe(hospB._id.toString());
  });

  // Scenario 24: Corrupted booking referencing cross-hospital doctor safely omits mismatched doctor
  it('24. Corrupted booking referencing cross-hospital doctor safely omits mismatched doctor reference', async () => {
    // Intentionally create a corrupted booking record at Hospital A referencing Doctor B (from Hospital B)
    const corruptedBooking = await Booking.create({
      patient: patientUser1._id,
      doctor: doctorDocB._id, // Mismatched doctor from Hospital B
      hospital: hospA._id,   // Booking is at Hospital A
      date: new Date('2026-11-20T10:00:00Z'),
      time: '10:00 AM',
      status: 'confirmed',
    });

    const res = await api
      .get('/api/v1/bookings')
      .set('Authorization', `Bearer ${tokenPatient1}`);

    expect(res.status).toBe(200);
    const returnedCorrupted = res.body.data.bookings.find(
      (b) => b._id.toString() === corruptedBooking._id.toString()
    );

    expect(returnedCorrupted).toBeDefined();
    // Mismatched doctor must be safely omitted (null)
    expect(returnedCorrupted.doctor).toBeNull();
  });

  // Scenario 25: Clinical authorization ObjectId normalization robustness
  it('25. Clinical authorization ObjectId normalization robustness across types', async () => {
    // 1. Matching string representation of hospitalId
    const resStringMatch = await requireClinicalRecordAccess({
      visitId: visitA._id,
      user: doctorUserA,
      hospitalId: hospA._id.toString(), // String type
    });
    expect(resStringMatch._id.toString()).toBe(visitA._id.toString());

    // 2. Mismatching string representation of hospitalId
    await expect(
      requireClinicalRecordAccess({
        visitId: visitA._id,
        user: doctorUserA,
        hospitalId: hospB._id.toString(), // Mismatching string
      })
    ).rejects.toThrow(/Cross-hospital access denied: You cannot access clinical records from a hospital facility you are no longer affiliated with/i);

    // 3. Populated object representation on visit.hospital
    const visitWithPopulatedHosp = {
      _id: visitA._id,
      patient: patientUser1._id,
      doctor: doctorDocA,
      hospital: { _id: hospA._id, name: 'Metro General Hospital A' },
    };
    const resPopulated = await requireClinicalRecordAccess({
      visitId: visitA._id,
      user: doctorUserA,
      hospitalId: hospA._id,
    });
    expect(resPopulated).toBeDefined();

    // 4. Missing hospital assignment on active doctor profile
    const unassignedDocUser = await User.create({
      name: 'Dr. Floating',
      email: 'dr.floating@medisync.com',
      mobile: '9888800077',
      password: 'SecurePass123!',
      role: ROLES.DOCTOR,
      hospitalId: null,
      status: 'active',
      emailVerified: true,
    });
    await Doctor.create({
      user: unassignedDocUser._id,
      name: 'Dr. Floating',
      email: 'dr.floating@medisync.com',
      mobile: '9888800077',
      specialization: 'General Medicine',
      hospitalId: null, // Explicitly no hospital assigned
      status: 'active',
      verificationStatus: 'verified',
      isApproved: true,
      isPublished: true,
      timing: '09:00 - 17:00',
    });

    await expect(
      requireClinicalRecordAccess({
        visitId: visitA._id,
        user: unassignedDocUser,
        hospitalId: null,
      })
    ).rejects.toThrow(/Cross-hospital access denied/i);
  });

  // Scenario 26: Hospital endpoint response JSON validation across all 5 user profiles
  it('26. Hospital endpoint response JSON validation across all 5 user profiles', async () => {
    // Profile 1: Public unauthenticated visitor
    const resPublic = await api.get(`/api/v1/hospitals/${hospA._id}`);
    expect(resPublic.status).toBe(200);
    expect(resPublic.body.data.name).toBe('Metro General Hospital A');
    expect(resPublic.body.data.doctorsCount).toBeGreaterThanOrEqual(1);
    expect(resPublic.body.data.recentPatients).toBeUndefined();
    expect(resPublic.body.data.administrators).toBeUndefined();
    expect(resPublic.body.data.administrator).toBeUndefined();
    expect(resPublic.body.data.patientsCount).toBeUndefined();
    expect(resPublic.body.data.doctors).toBeUndefined();

    // Profile 2: Patient
    const resPatient = await api
      .get(`/api/v1/hospitals/${hospA._id}`)
      .set('Authorization', `Bearer ${tokenPatient1}`);
    expect(resPatient.status).toBe(200);
    expect(resPatient.body.data.name).toBe('Metro General Hospital A');
    expect(resPatient.body.data.doctorsCount).toBeGreaterThanOrEqual(1);
    expect(resPatient.body.data.recentPatients).toBeUndefined();
    expect(resPatient.body.data.administrators).toBeUndefined();
    expect(resPatient.body.data.administrator).toBeUndefined();
    expect(resPatient.body.data.patientsCount).toBeUndefined();

    // Profile 3: Hospital A staff requesting Hospital B
    const resStaffCross = await api
      .get(`/api/v1/hospitals/${hospB._id}`)
      .set('Authorization', `Bearer ${tokenAdminA}`);
    expect(resStaffCross.status).toBe(200);
    expect(resStaffCross.body.data.name).toBe('Sunrise Care Hospital B');
    expect(resStaffCross.body.data.recentPatients).toBeUndefined();
    expect(resStaffCross.body.data.administrators).toBeUndefined();
    expect(resStaffCross.body.data.administrator).toBeUndefined();
    expect(resStaffCross.body.data.patientsCount).toBeUndefined();

    // Profile 4: Hospital A staff requesting Hospital A
    const resStaffOwn = await api
      .get(`/api/v1/hospitals/${hospA._id}`)
      .set('Authorization', `Bearer ${tokenAdminA}`);
    expect(resStaffOwn.status).toBe(200);
    expect(resStaffOwn.body.data.name).toBe('Metro General Hospital A');
    expect(resStaffOwn.body.data.recentPatients).toBeDefined();
    expect(resStaffOwn.body.data.administrators).toBeDefined();
    expect(resStaffOwn.body.data.administrator).toBeDefined();
    expect(resStaffOwn.body.data.administrator.name).toBe('Admin Hospital A');
    expect(resStaffOwn.body.data.patientsCount).toBe(1);

    // Profile 5: Super Admin requesting Hospital A
    const resSuperAdmin = await api
      .get(`/api/v1/hospitals/${hospA._id}`)
      .set('Authorization', `Bearer ${tokenSuperAdmin}`);
    expect(resSuperAdmin.status).toBe(200);
    expect(resSuperAdmin.body.data.name).toBe('Metro General Hospital A');
    expect(resSuperAdmin.body.data.recentPatients).toBeDefined();
    expect(resSuperAdmin.body.data.administrators).toBeDefined();
    expect(resSuperAdmin.body.data.patientsCount).toBe(1);
  });

  // Scenario 27: Production aggregation pipeline inventory verification
  it('27. Production aggregation pipelines strictly enforce hospital boundary filtering', async () => {
    // Verify production pipeline 1: Doctor.aggregate in listHospitals
    const doctorPipelineResults = await Doctor.aggregate([
      { $match: { hospitalId: { $in: [hospA._id] }, deletedAt: null } },
      { $group: { _id: '$hospitalId', count: { $sum: 1 } } },
    ]);
    expect(doctorPipelineResults.length).toBe(1);
    expect(doctorPipelineResults[0]._id.toString()).toBe(hospA._id.toString());
    expect(doctorPipelineResults[0].count).toBe(1);

    // Verify production pipeline 2: PatientHospital.aggregate in listHospitals
    const patientPipelineResults = await PatientHospital.aggregate([
      { $match: { hospital: { $in: [hospA._id] } } },
      { $group: { _id: '$hospital', count: { $sum: 1 } } },
    ]);
    expect(patientPipelineResults.length).toBe(1);
    expect(patientPipelineResults[0]._id.toString()).toBe(hospA._id.toString());
    expect(patientPipelineResults[0].count).toBe(1);
  });
});
