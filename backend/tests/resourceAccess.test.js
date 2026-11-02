import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Hospital from '../src/modules/hospital/hospital.model.js';
import User from '../src/modules/user/user.model.js';
import Doctor from '../src/modules/doctor/doctor.model.js';
import Patient from '../src/modules/patient/patient.model.js';
import PatientHospital from '../src/modules/patientHospital/patientHospital.model.js';
import Booking from '../src/modules/booking/booking.model.js';
import Visit from '../src/modules/visit/visit.model.js';
import VisitDisease from '../src/modules/visitDisease/visitDisease.model.js';
import {
  requirePatientHospitalAccess,
  requirePatientOwnership,
} from '../src/modules/authorization/patientAccess.service.js';
import {
  validateDoctorHospitalAffiliation,
  requireDoctorPatientAccess,
  requireClinicalRecordAccess,
} from '../src/modules/authorization/clinicalAccess.service.js';
import * as bookingService from '../src/modules/booking/booking.service.js';
import * as visitService from '../src/modules/visit/visit.service.js';
import * as vdService from '../src/modules/visitDisease/visitDisease.service.js';
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

describe('Milestone 3 — Resource-Level Authorization & Multi-Tenant Isolation', () => {
  let hospA, hospB;
  let userPatientA, userPatientB;
  let patientA, patientB;
  let doctorA, doctorB;
  let adminA, receptionistA;

  beforeEach(async () => {
    // 1. Create two separate hospital facilities
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

    // 2. Create Users and Global Patients
    userPatientA = await User.create({
      name: 'Patient Alice',
      email: 'alice@test.com',
      mobile: '9800000001',
      password: 'Password@123',
      role: ROLES.PATIENT,
      status: 'active',
      emailVerified: true,
    });
    patientA = await Patient.create({ user: userPatientA._id, gender: 'female' });

    userPatientB = await User.create({
      name: 'Patient Bob',
      email: 'bob@test.com',
      mobile: '9800000002',
      password: 'Password@123',
      role: ROLES.PATIENT,
      status: 'active',
      emailVerified: true,
    });
    patientB = await Patient.create({ user: userPatientB._id, gender: 'male' });

    // Link Patient A to Hospital A only
    await PatientHospital.create({
      patient: patientA._id,
      hospital: hospA._id,
      medicalRecordNumber: 'CITY-0001',
      registeredBy: userPatientA._id,
      status: 'active',
    });

    // Link Patient B to Hospital B only
    await PatientHospital.create({
      patient: patientB._id,
      hospital: hospB._id,
      medicalRecordNumber: 'SUN-0001',
      registeredBy: userPatientB._id,
      status: 'active',
    });

    // 3. Create Doctor in Hospital A (verified and approved)
    const userDocA = await User.create({
      name: 'Dr. Ashok',
      email: 'ashok@citycare.com',
      mobile: '9800000003',
      password: 'Password@123',
      role: ROLES.DOCTOR,
      hospitalId: hospA._id,
      status: 'active',
      emailVerified: true,
    });
    doctorA = await Doctor.create({
      name: 'Dr. Ashok',
      email: 'ashok@citycare.com',
      mobile: '9800000003',
      specialization: 'Cardiology',
      user: userDocA._id,
      hospitalId: hospA._id,
      status: 'active',
      verificationStatus: 'verified',
      isApproved: true,
      availability: [{ day: 'Mon', start: '09:00', end: '17:00', slotMinutes: 30 }],
    });

    // 4. Create Doctor in Hospital B (verified and approved)
    const userDocB = await User.create({
      name: 'Dr. Meera',
      email: 'meera@sunrise.com',
      mobile: '9800000004',
      password: 'Password@123',
      role: ROLES.DOCTOR,
      hospitalId: hospB._id,
      status: 'active',
      emailVerified: true,
    });
    doctorB = await Doctor.create({
      name: 'Dr. Meera',
      email: 'meera@sunrise.com',
      mobile: '9800000004',
      specialization: 'Neurology',
      user: userDocB._id,
      hospitalId: hospB._id,
      status: 'active',
      verificationStatus: 'verified',
      isApproved: true,
      availability: [{ day: 'Mon', start: '09:00', end: '17:00', slotMinutes: 30 }],
    });

    // 5. Create Staff for Hospital A
    adminA = await User.create({
      name: 'Admin CityCare',
      email: 'admin@citycare.com',
      mobile: '9800000005',
      password: 'Password@123',
      role: ROLES.HOSPITAL_ADMIN,
      hospitalId: hospA._id,
      status: 'active',
      emailVerified: true,
    });

    receptionistA = await User.create({
      name: 'Recep CityCare',
      email: 'recep@citycare.com',
      mobile: '9800000006',
      password: 'Password@123',
      role: ROLES.RECEPTIONIST,
      hospitalId: hospA._id,
      status: 'active',
      emailVerified: true,
    });
  });

  afterEach(async () => {
    await Booking.deleteMany({});
    await Visit.deleteMany({});
    await VisitDisease.deleteMany({});
    await PatientHospital.deleteMany({});
    await Patient.deleteMany({});
    await Doctor.deleteMany({});
    await User.deleteMany({});
    await Hospital.deleteMany({});
  });

  // -------------------------------------------------------------
  // 3.3.6 & 3.3.7: Patient Hospital Access & Ownership Tests
  // -------------------------------------------------------------
  describe('Patient-Hospital Affiliation and Ownership', () => {
    it('allows access when patient is registered at the requested hospital', async () => {
      const res = await requirePatientHospitalAccess({
        patientId: patientA._id,
        hospitalId: hospA._id,
      });
      expect(res.patientHospital.medicalRecordNumber).toBe('CITY-0001');
    });

    it('denies access when patient is NOT registered at the requested hospital', async () => {
      await expect(
        requirePatientHospitalAccess({
          patientId: patientA._id,
          hospitalId: hospB._id, // Patient A requested through Hospital B
        })
      ).rejects.toMatchObject({
        statusCode: 403,
        message: expect.stringMatching(/not registered or active with this hospital facility/i),
      });
    });

    it('enforces patient self-ownership (Patient A cannot access Patient B profile)', async () => {
      // Patient A accessing own record: OK
      const self = await requirePatientOwnership({
        patientId: patientA._id,
        user: userPatientA,
      });
      expect(self._id.toString()).toBe(patientA._id.toString());

      // Patient A attempting to access Patient B record: 403 Forbidden
      await expect(
        requirePatientOwnership({
          patientId: patientB._id,
          user: userPatientA,
        })
      ).rejects.toMatchObject({
        statusCode: 403,
        message: expect.stringMatching(/only access your own patient profile/i),
      });
    });
  });

  // -------------------------------------------------------------
  // 3.3.8 & 3.3.9: Doctor Hospital Affiliation & Care Relationships
  // -------------------------------------------------------------
  describe('Doctor Hospital Affiliation and Care Relationship', () => {
    it('verifies doctor belongs to the specified hospital', async () => {
      const doc = await validateDoctorHospitalAffiliation({
        doctorId: doctorA._id,
        hospitalId: hospA._id,
      });
      expect(doc.name).toBe('Dr. Ashok');

      // Attempting to validate Doctor A against Hospital B: 403
      await expect(
        validateDoctorHospitalAffiliation({
          doctorId: doctorA._id,
          hospitalId: hospB._id,
        })
      ).rejects.toMatchObject({
        statusCode: 403,
        message: expect.stringMatching(/not affiliated with this hospital facility/i),
      });
    });

    it('denies clinical access if no booking or care relationship exists', async () => {
      await expect(
        requireDoctorPatientAccess({
          doctorId: doctorA._id,
          patientId: patientA._id,
          hospitalId: hospA._id,
        })
      ).rejects.toMatchObject({
        statusCode: 403,
        message: expect.stringMatching(/no active booking or clinical care relationship exists/i),
      });
    });

    it('grants clinical access when an active booking care relationship exists', async () => {
      // Create a booking connecting Doctor A and Patient A
      await Booking.create({
        patient: userPatientA._id,
        doctor: doctorA._id,
        date: new Date('2026-11-02'),
        time: '10:00',
        status: 'confirmed',
      });

      const access = await requireDoctorPatientAccess({
        doctorId: doctorA._id,
        patientId: patientA._id,
        hospitalId: hospA._id,
      });
      expect(access.careRelationship).toBeDefined();
    });
  });

  // -------------------------------------------------------------
  // 3.3.10: Clinical Record Access Rules
  // -------------------------------------------------------------
  describe('Clinical Record Privacy & Confidentiality', () => {
    let testVisit;

    beforeEach(async () => {
      const booking = await Booking.create({
        patient: userPatientA._id,
        doctor: doctorA._id,
        date: new Date('2026-11-02'),
        time: '10:00',
        status: 'completed',
      });

      testVisit = await Visit.create({
        patient: userPatientA._id,
        mobile: '9800000001',
        date: new Date('2026-11-02'),
        time: '10:00',
        doctor: doctorA._id,
        booking: booking._id,
      });

      await VisitDisease.create({
        visit: testVisit._id,
        disease: 'Hypertension',
        prescription: 'Amlodipine 5mg once daily',
      });
    });

    it('denies clinical record access to receptionists', async () => {
      await expect(
        requireClinicalRecordAccess({
          visitId: testVisit._id,
          user: receptionistA,
          hospitalId: hospA._id,
        })
      ).rejects.toMatchObject({
        statusCode: 403,
        message: expect.stringMatching(/reception staff are not authorized to view clinical diagnoses/i),
      });
    });

    it('denies clinical record access to hospital administrators', async () => {
      await expect(
        requireClinicalRecordAccess({
          visitId: testVisit._id,
          user: adminA,
          hospitalId: hospA._id,
        })
      ).rejects.toMatchObject({
        statusCode: 403,
        message: expect.stringMatching(/clinical medical notes are restricted/i),
      });
    });

    it('denies clinical writes from non-treating doctors or receptionists', async () => {
      await expect(
        vdService.createVisitDisease(
          {
            visit: testVisit._id,
            disease: 'Asthma',
            prescription: 'Salbutamol Inhaler',
          },
          receptionistA // Receptionist trying to add diagnosis
        )
      ).rejects.toMatchObject({
        statusCode: 403,
        message: expect.stringMatching(/only verified doctors can record diagnoses/i),
      });
    });
  });

  // -------------------------------------------------------------
  // 3.3.11 & 3.3.12: Cross-Hospital Booking and Visit Isolation
  // -------------------------------------------------------------
  describe('Cross-Hospital Operational Isolation', () => {
    it('blocks Hospital A receptionist from booking Doctor B (Hospital B)', async () => {
      await expect(
        bookingService.createBooking(
          {
            patient: userPatientA._id,
            doctor: doctorB._id, // Doctor B belongs to Hospital B
            date: new Date('2026-11-02'),
            time: '10:00',
          },
          receptionistA,
          { hospitalId: hospA._id }
        )
      ).rejects.toMatchObject({
        statusCode: 403,
        message: expect.stringMatching(/Cannot book doctors from another hospital/i),
      });
    });

    it('scopes booking listings so Hospital A staff only see Hospital A bookings', async () => {
      // Booking in Hospital A
      await Booking.create({
        patient: userPatientA._id,
        doctor: doctorA._id,
        hospital: hospA._id,
        date: new Date('2026-11-02'),
        time: '10:00',
        status: 'confirmed',
      });

      // Booking in Hospital B
      await Booking.create({
        patient: userPatientB._id,
        doctor: doctorB._id,
        hospital: hospB._id,
        date: new Date('2026-11-02'),
        time: '11:00',
        status: 'confirmed',
      });

      // Hospital A Receptionist queries bookings
      const result = await bookingService.getBookings(
        receptionistA,
        {},
        { hospitalId: hospA._id }
      );

      expect(result.total).toBe(1);
      expect(result.bookings[0].doctor.name).toBe('Dr. Ashok');
    });

    it('blocks Hospital A receptionist from creating visits for Hospital B bookings', async () => {
      const bookingB = await Booking.create({
        patient: userPatientB._id,
        doctor: doctorB._id,
        hospital: hospB._id,
        date: new Date('2026-11-02'),
        time: '11:00',
        status: 'confirmed',
      });

      await expect(
        visitService.createVisit(
          {
            booking: bookingB._id,
            mobile: '9800000002',
          },
          receptionistA,
          { hospitalId: hospA._id }
        )
      ).rejects.toMatchObject({
        statusCode: 403,
        message: expect.stringMatching(/Cannot record visits for bookings of another hospital/i),
      });
    });
  });
});
