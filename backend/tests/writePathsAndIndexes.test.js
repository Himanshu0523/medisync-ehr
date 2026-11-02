import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Hospital from '../src/modules/hospital/hospital.model.js';
import User from '../src/modules/user/user.model.js';
import Doctor from '../src/modules/doctor/doctor.model.js';
import Patient from '../src/modules/patient/patient.model.js';
import PatientHospital from '../src/modules/patientHospital/patientHospital.model.js';
import Booking from '../src/modules/booking/booking.model.js';
import Visit from '../src/modules/visit/visit.model.js';
import { jest } from '@jest/globals';
import * as bookingService from '../src/modules/booking/booking.service.js';
import * as visitService from '../src/modules/visit/visit.service.js';
import { ROLES } from '../src/modules/auth/auth.constants.js';

jest.setTimeout(60000);

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe('Step 3.4.4 — Verify Write Paths & Indexes', () => {
  let hospA, hospB;
  let userPatientA, userPatientUnregistered;
  let patientA, patientUnregistered;
  let doctorA, doctorB, legacyDoctor;
  let userDoctorA, userDoctorB, userDoctorNoProfile;
  let receptionistA, receptionistB, staffNoTenant;

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

    // 2. Patients
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

    userPatientUnregistered = await User.create({
      name: 'Patient Dave',
      email: 'dave@test.com',
      mobile: '9800000004',
      password: 'Password@123',
      role: ROLES.PATIENT,
      status: 'active',
      emailVerified: true,
    });
    patientUnregistered = await Patient.create({ user: userPatientUnregistered._id, gender: 'male' });

    // Link Patient A to Hospital A only
    await PatientHospital.create({
      patient: patientA._id,
      hospital: hospA._id,
      medicalRecordNumber: 'CITY-0001',
      registeredBy: userPatientA._id,
      status: 'active',
    });

    // 3. Doctors & User accounts
    userDoctorA = await User.create({
      name: 'Dr. Ashok User',
      email: 'ashok.user@citycare.com',
      mobile: '9811111112',
      password: 'Password@123',
      role: ROLES.DOCTOR,
      status: 'active',
      emailVerified: true,
    });

    doctorA = await Doctor.create({
      name: 'Dr. Ashok',
      email: 'dr.ashok@citycare.com',
      mobile: '9811111111',
      specialization: 'Cardiology',
      user: userDoctorA._id,
      hospitalId: hospA._id,
      status: 'active',
      verificationStatus: 'verified',
      isApproved: true,
      availability: [{ day: 'Mon', start: '09:00', end: '17:00', slotMinutes: 30 }],
    });

    userDoctorB = await User.create({
      name: 'Dr. Bhavna User',
      email: 'bhavna.user@sunrise.com',
      mobile: '9822222223',
      password: 'Password@123',
      role: ROLES.DOCTOR,
      status: 'active',
      emailVerified: true,
    });

    doctorB = await Doctor.create({
      name: 'Dr. Bhavna',
      email: 'dr.bhavna@sunrise.com',
      mobile: '9822222222',
      specialization: 'Neurology',
      user: userDoctorB._id,
      hospitalId: hospB._id,
      status: 'active',
      verificationStatus: 'verified',
      isApproved: true,
      availability: [{ day: 'Mon', start: '09:00', end: '17:00', slotMinutes: 30 }],
    });

    legacyDoctor = await Doctor.create({
      name: 'Dr. Unassigned',
      email: 'unassigned@test.com',
      mobile: '9899999999',
      specialization: 'General',
      availability: [{ day: 'Mon', start: '09:00', end: '17:00', slotMinutes: 30 }],
    });

    userDoctorNoProfile = await User.create({
      name: 'Dr. No Profile',
      email: 'noprofile@test.com',
      mobile: '9833333334',
      password: 'Password@123',
      role: ROLES.DOCTOR,
      status: 'active',
      emailVerified: true,
    });

    // 4. Staff
    receptionistA = await User.create({
      name: 'Receptionist City Care',
      email: 'recep.a@citycare.com',
      mobile: '9833333331',
      password: 'Password@123',
      role: ROLES.RECEPTIONIST,
      hospitalId: hospA._id,
      status: 'active',
      emailVerified: true,
    });

    receptionistB = await User.create({
      name: 'Receptionist Sunrise',
      email: 'recep.b@sunrise.com',
      mobile: '9833333332',
      password: 'Password@123',
      role: ROLES.RECEPTIONIST,
      hospitalId: hospB._id,
      status: 'active',
      emailVerified: true,
    });

    staffNoTenant = await User.create({
      name: 'Staff Without Tenant',
      email: 'notenant@test.com',
      mobile: '9833333339',
      password: 'Password@123',
      role: ROLES.RECEPTIONIST,
      status: 'active',
      emailVerified: true,
    });
  });

  afterEach(async () => {
    await Booking.deleteMany({});
    await Visit.deleteMany({});
    await PatientHospital.deleteMany({});
    await Patient.deleteMany({});
    await Doctor.deleteMany({});
    await User.deleteMany({});
    await Hospital.deleteMany({});
  });

  // 1. Booking Creation Tests
  describe('Booking Creation Write Path', () => {
    it('persists trusted hospital from staff tenant context and ignores client-supplied hospital override', async () => {
      const fakeHospitalId = new mongoose.Types.ObjectId();

      const booking = await bookingService.createBooking(
        {
          patient: userPatientA._id,
          doctor: doctorA._id,
          date: new Date('2026-11-02'),
          time: '10:00',
          hospital: fakeHospitalId,
        },
        receptionistA,
        { hospitalId: hospA._id }
      );

      expect(booking).toBeDefined();
      expect(booking.hospital).toBeDefined();
      expect(booking.hospital.toString()).toBe(hospA._id.toString());
      expect(booking.hospital.toString()).not.toBe(fakeHospitalId.toString());

      const dbBooking = await Booking.findById(booking._id);
      expect(dbBooking.hospital.toString()).toBe(hospA._id.toString());
    });

    it('validates patient affiliation with hospital for patient-created bookings', async () => {
      const booking = await bookingService.createBooking(
        {
          doctor: doctorA._id,
          date: new Date('2026-11-02'),
          time: '10:30',
        },
        userPatientA
      );

      expect(booking.hospital.toString()).toBe(hospA._id.toString());

      await expect(
        bookingService.createBooking(
          {
            doctor: doctorA._id,
            date: new Date('2026-11-02'),
            time: '11:00',
          },
          userPatientUnregistered
        )
      ).rejects.toMatchObject({
        statusCode: 403,
        message: expect.stringMatching(/not registered or active with this hospital facility/i),
      });
    });

    it('rejects staff creating bookings for doctors of another hospital', async () => {
      await expect(
        bookingService.createBooking(
          {
            patient: userPatientA._id,
            doctor: doctorB._id,
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

    it('rejects staff Booking creation for an unassigned Doctor', async () => {
      await expect(
        bookingService.createBooking(
          {
            patient: userPatientA._id,
            doctor: legacyDoctor._id,
            date: new Date('2026-11-02'),
            time: '10:00',
          },
          receptionistA,
          { hospitalId: hospA._id }
        )
      ).rejects.toMatchObject({
        statusCode: 400,
        message: expect.stringMatching(/Doctor is not assigned to a hospital/i),
      });
    });

    it('rejects staff Booking creation when staff lacks tenant context', async () => {
      await expect(
        bookingService.createBooking(
          {
            patient: userPatientA._id,
            doctor: doctorA._id,
            date: new Date('2026-11-02'),
            time: '10:00',
          },
          staffNoTenant,
          null
        )
      ).rejects.toMatchObject({
        statusCode: 403,
        message: expect.stringMatching(/Tenant context required/i),
      });
    });

    it('rejects staff Booking status update when booking hospital is missing or mismatched', async () => {
      const bookingNoHosp = await Booking.create({
        patient: userPatientA._id,
        doctor: doctorA._id,
        hospital: null,
        date: new Date('2026-11-02'),
        time: '10:00',
        status: 'pending',
      });

      // Staff update rejected because booking has no hospital assigned
      await expect(
        bookingService.updateBookingStatus(
          bookingNoHosp._id,
          'confirmed',
          receptionistA,
          { hospitalId: hospA._id }
        )
      ).rejects.toMatchObject({
        statusCode: 403,
        message: expect.stringMatching(/Cannot modify bookings of another hospital/i),
      });

      // Staff update rejected when booking belongs to another hospital
      const bookingHospB = await Booking.create({
        patient: userPatientA._id,
        doctor: doctorB._id,
        hospital: hospB._id,
        date: new Date('2026-11-02'),
        time: '11:00',
        status: 'pending',
      });

      await expect(
        bookingService.updateBookingStatus(
          bookingHospB._id,
          'confirmed',
          receptionistA,
          { hospitalId: hospA._id }
        )
      ).rejects.toMatchObject({
        statusCode: 403,
        message: expect.stringMatching(/Cannot modify bookings of another hospital/i),
      });
    });

    it('rejects staff Booking list operations when staff lacks tenant context', async () => {
      await expect(
        bookingService.getBookings(staffNoTenant, {}, null)
      ).rejects.toMatchObject({
        statusCode: 403,
        message: expect.stringMatching(/Tenant context required/i),
      });
    });
  });

  // -----------------------------------------------------------------
  // 2. Visit Creation Tests
  // -----------------------------------------------------------------
  describe('Visit Creation Write Path', () => {
    let bookingA;

    beforeEach(async () => {
      bookingA = await Booking.create({
        patient: userPatientA._id,
        doctor: doctorA._id,
        hospital: hospA._id,
        date: new Date('2026-11-02'),
        time: '10:00',
        status: 'confirmed',
      });
    });

    it('derives and persists hospital from validated booking', async () => {
      const visit = await visitService.createVisit(
        {
          booking: bookingA._id,
          mobile: '9800000001',
        },
        receptionistA,
        { hospitalId: hospA._id }
      );

      expect(visit).toBeDefined();
      expect(visit.hospital).toBeDefined();
      expect(visit.hospital.toString()).toBe(hospA._id.toString());

      const dbVisit = await Visit.findById(visit._id);
      expect(dbVisit.hospital.toString()).toBe(hospA._id.toString());
    });

    it('rejects visit creation if patient or doctor diverges from linked booking', async () => {
      await expect(
        visitService.createVisit(
          {
            booking: bookingA._id,
            patient: userPatientUnregistered._id,
            mobile: '9800000001',
          },
          receptionistA,
          { hospitalId: hospA._id }
        )
      ).rejects.toMatchObject({
        statusCode: 400,
        message: expect.stringMatching(/Visit patient does not match linked booking patient/i),
      });

      await expect(
        visitService.createVisit(
          {
            booking: bookingA._id,
            doctor: doctorB._id,
            mobile: '9800000001',
          },
          receptionistA,
          { hospitalId: hospA._id }
        )
      ).rejects.toMatchObject({
        statusCode: 400,
        message: expect.stringMatching(/Visit doctor does not match linked booking doctor/i),
      });
    });

    it('rejects cross-hospital visit creation attempts', async () => {
      await expect(
        visitService.createVisit(
          {
            booking: bookingA._id,
            mobile: '9800000001',
          },
          receptionistB,
          { hospitalId: hospB._id }
        )
      ).rejects.toMatchObject({
        statusCode: 403,
        message: expect.stringMatching(/Cannot record visits for bookings of another hospital|Booking belongs to another hospital facility/i),
      });
    });

    it('rejects Visit creation for a Booking with missing hospital', async () => {
      const bookingNoHosp = await Booking.create({
        patient: userPatientA._id,
        doctor: doctorA._id,
        hospital: null,
        date: new Date('2026-11-02'),
        time: '11:00',
        status: 'confirmed',
      });

      await expect(
        visitService.createVisit(
          {
            booking: bookingNoHosp._id,
            mobile: '9800000001',
          },
          receptionistA,
          { hospitalId: hospA._id }
        )
      ).rejects.toMatchObject({
        statusCode: 400,
        message: expect.stringMatching(/Linked booking has no assigned hospital reference/i),
      });
    });

    it('rejects Visit creation when consulting Doctor belongs to a different hospital from Booking hospital', async () => {
      // Tampered booking where doctor is Doctor B (Sunrise), but booking claims Hospital A
      const bookingMismatch = await Booking.create({
        patient: userPatientA._id,
        doctor: doctorB._id,
        hospital: hospA._id,
        date: new Date('2026-11-02'),
        time: '10:00',
        status: 'confirmed',
      });

      await expect(
        visitService.createVisit(
          {
            booking: bookingMismatch._id,
            mobile: '9800000001',
          },
          receptionistA,
          { hospitalId: hospA._id }
        )
      ).rejects.toMatchObject({
        statusCode: 403,
        message: expect.stringMatching(/Consulting doctor belongs to another hospital facility|Cannot record visits for bookings of another hospital/i),
      });
    });

    it('rejects Visit creation when staff lacks tenant context', async () => {
      await expect(
        visitService.createVisit(
          {
            booking: bookingA._id,
            mobile: '9800000001',
          },
          staffNoTenant,
          null
        )
      ).rejects.toMatchObject({
        statusCode: 403,
        message: expect.stringMatching(/Tenant context required/i),
      });
    });

    it('rejects staff Visit list and getOne operations when staff lacks tenant context', async () => {
      await expect(
        visitService.getVisits(staffNoTenant, {}, null)
      ).rejects.toMatchObject({
        statusCode: 403,
        message: expect.stringMatching(/Tenant context required/i),
      });

      const visit = await Visit.create({
        patient: userPatientA._id,
        mobile: '9800000001',
        date: new Date('2026-11-02'),
        time: '10:00',
        doctor: doctorA._id,
        booking: bookingA._id,
        hospital: hospA._id,
      });

      await expect(
        visitService.getVisitById(visit._id, staffNoTenant, null)
      ).rejects.toMatchObject({
        statusCode: 403,
        message: expect.stringMatching(/Tenant context required/i),
      });
    });
  });

  // -----------------------------------------------------------------
  // 3. Schema Indexes Verification
  // -----------------------------------------------------------------
  describe('Schema Indexes Verification', () => {
    it('verifies Booking model contains tenant compound indexes', () => {
      const indexes = Booking.schema.indexes();
      const indexKeys = indexes.map(([key]) => JSON.stringify(key));

      expect(indexKeys).toContain(JSON.stringify({ hospital: 1, date: -1 }));
      expect(indexKeys).toContain(JSON.stringify({ hospital: 1, status: 1 }));
      expect(indexKeys).toContain(JSON.stringify({ doctor: 1, date: 1, time: 1 }));
      expect(indexKeys).toContain(JSON.stringify({ patient: 1, date: -1 }));
    });

    it('verifies Visit model contains tenant compound index and 1-to-1 booking relationship', () => {
      const indexes = Visit.schema.indexes();
      const indexKeys = indexes.map(([key]) => JSON.stringify(key));

      expect(indexKeys).toContain(JSON.stringify({ hospital: 1, date: -1 }));
      expect(indexKeys).toContain(JSON.stringify({ patient: 1, date: -1 }));
      expect(indexKeys).toContain(JSON.stringify({ doctor: 1, date: -1 }));

      const bookingField = Visit.schema.path('booking');
      expect(bookingField.options.unique).toBe(true);
    });
  });

  // 4. Doctor Read Authorization & Ownership (Fail-Closed)
  describe('Doctor Read Authorization & Ownership', () => {
    let visitDocA, visitDocB;
    let userDoctorInactive, doctorInactive;

    beforeEach(async () => {
      userDoctorInactive = await User.create({
        name: 'Dr. Inactive User',
        email: 'inactive.doctor@test.com',
        mobile: '9833333335',
        password: 'Password@123',
        role: ROLES.DOCTOR,
        status: 'active',
        emailVerified: true,
      });

      doctorInactive = await Doctor.create({
        name: 'Dr. Inactive',
        email: 'inactive.doctor@test.com',
        mobile: '9833333336',
        specialization: 'Orthopedics',
        user: userDoctorInactive._id,
        hospitalId: hospA._id,
        status: 'inactive',
        verificationStatus: 'verified',
        isApproved: true,
        availability: [{ day: 'Mon', start: '09:00', end: '17:00', slotMinutes: 30 }],
      });

      const bA = await Booking.create({
        patient: userPatientA._id,
        doctor: doctorA._id,
        hospital: hospA._id,
        date: new Date('2026-11-02'),
        time: '09:00',
        status: 'completed',
      });
      visitDocA = await Visit.create({
        patient: userPatientA._id,
        mobile: '9800000001',
        date: new Date('2026-11-02'),
        time: '09:00',
        doctor: doctorA._id,
        booking: bA._id,
        hospital: hospA._id,
      });

      const bB = await Booking.create({
        patient: userPatientA._id,
        doctor: doctorB._id,
        hospital: hospB._id,
        date: new Date('2026-11-02'),
        time: '14:00',
        status: 'completed',
      });
      visitDocB = await Visit.create({
        patient: userPatientA._id,
        mobile: '9800000001',
        date: new Date('2026-11-02'),
        time: '14:00',
        doctor: doctorB._id,
        booking: bB._id,
        hospital: hospB._id,
      });
    });

    it('rejects Doctor without a Doctor profile from listing bookings', async () => {
      await expect(
        bookingService.getBookings(userDoctorNoProfile, {}, null)
      ).rejects.toMatchObject({
        statusCode: 403,
        message: expect.stringMatching(/Doctor profile not found/i),
      });
    });

    it('rejects Doctor without a Doctor profile from listing visits', async () => {
      await expect(
        visitService.getVisits(userDoctorNoProfile, {}, null)
      ).rejects.toMatchObject({
        statusCode: 403,
        message: expect.stringMatching(/Doctor profile not found/i),
      });
    });

    it('rejects Doctor without a Doctor profile from retrieving a visit by ID', async () => {
      await expect(
        visitService.getVisitById(visitDocA._id, userDoctorNoProfile, null)
      ).rejects.toMatchObject({
        statusCode: 403,
        message: expect.stringMatching(/Doctor profile not found/i),
      });
    });

    it('rejects Doctor A from retrieving Doctor B visit (cross-doctor access denied)', async () => {
      await expect(
        visitService.getVisitById(visitDocB._id, userDoctorA, null)
      ).rejects.toMatchObject({
        statusCode: 403,
        message: expect.stringMatching(/You can only view visits where you are the consulting doctor/i),
      });
    });

    it('allows Doctor A to retrieve their own visit', async () => {
      const visit = await visitService.getVisitById(visitDocA._id, userDoctorA, null);
      expect(visit).toBeDefined();
      expect(visit._id.toString()).toBe(visitDocA._id.toString());
      expect(visit.doctor._id.toString()).toBe(doctorA._id.toString());
    });

    it('scopes booking and visit listings exclusively to the consulting doctor', async () => {
      const bResult = await bookingService.getBookings(userDoctorA, {}, null);
      expect(bResult.total).toBe(1);
      expect(bResult.bookings[0].doctor._id.toString()).toBe(doctorA._id.toString());

      const vResult = await visitService.getVisits(userDoctorA, {}, null);
      expect(vResult.total).toBe(1);
      expect(vResult.visits[0].doctor._id.toString()).toBe(doctorA._id.toString());
    });

    it('rejects an inactive Doctor from listing bookings', async () => {
      await expect(
        bookingService.getBookings(userDoctorInactive, {}, null)
      ).rejects.toMatchObject({
        statusCode: 403,
        message: expect.stringMatching(/Doctor account is not active/i),
      });
    });

    it('rejects an inactive Doctor from listing visits', async () => {
      await expect(
        visitService.getVisits(userDoctorInactive, {}, null)
      ).rejects.toMatchObject({
        statusCode: 403,
        message: expect.stringMatching(/Doctor account is not active/i),
      });
    });

    it('rejects an inactive Doctor from retrieving a visit by ID', async () => {
      const bInactive = await Booking.create({
        patient: userPatientA._id,
        doctor: doctorInactive._id,
        hospital: hospA._id,
        date: new Date('2026-11-02'),
        time: '15:00',
        status: 'completed',
      });
      const visitInactive = await Visit.create({
        patient: userPatientA._id,
        mobile: '9800000001',
        date: new Date('2026-11-02'),
        time: '15:00',
        doctor: doctorInactive._id,
        booking: bInactive._id,
        hospital: hospA._id,
      });

      await expect(
        visitService.getVisitById(visitInactive._id, userDoctorInactive, null)
      ).rejects.toMatchObject({
        statusCode: 403,
        message: expect.stringMatching(/Doctor account is not active/i),
      });
    });

    it('rejects an inactive Doctor from updating booking status', async () => {
      const bInactive = await Booking.create({
        patient: userPatientA._id,
        doctor: doctorInactive._id,
        hospital: hospA._id,
        date: new Date('2026-11-02'),
        time: '16:00',
        status: 'pending',
      });

      await expect(
        bookingService.updateBookingStatus(bInactive._id, 'confirmed', userDoctorInactive, null)
      ).rejects.toMatchObject({
        statusCode: 403,
        message: expect.stringMatching(/Doctor account is not active/i),
      });
    });

    it('prevents Hospital B staff from retrieving null-hospital legacy bookings of a reassigned doctor', async () => {
      const userDocC = await User.create({
        name: 'Dr. Reassigned User',
        email: 'reassigned@citycare.com',
        mobile: '9844444441',
        password: 'Password@123',
        role: ROLES.DOCTOR,
        status: 'active',
        emailVerified: true,
      });
      const doctorC = await Doctor.create({
        name: 'Dr. Reassigned',
        email: 'reassigned@citycare.com',
        mobile: '9844444442',
        specialization: 'Dermatology',
        user: userDocC._id,
        hospitalId: hospA._id,
        status: 'active',
        verificationStatus: 'verified',
        isApproved: true,
        availability: [{ day: 'Mon', start: '09:00', end: '17:00', slotMinutes: 30 }],
      });

      const legacyBooking = await Booking.create({
        patient: userPatientA._id,
        doctor: doctorC._id,
        hospital: null,
        date: new Date('2026-11-02'),
        time: '10:00',
        status: 'confirmed',
      });

      // Doctor C is later reassigned to Hospital B
      doctorC.hospitalId = hospB._id;
      await doctorC.save();

      // Hospital B staff queries bookings: exact hospital match excludes null-hospital records
      const bResult = await bookingService.getBookings(receptionistB, {}, { hospitalId: hospB._id });
      const found = bResult.bookings.find((b) => b._id.toString() === legacyBooking._id.toString());
      expect(found).toBeUndefined();
    });

    it('prevents Hospital B staff from retrieving null-hospital legacy visits of a reassigned doctor', async () => {
      const userDocD = await User.create({
        name: 'Dr. Reassigned Visit User',
        email: 'reassigned.v@citycare.com',
        mobile: '9844444443',
        password: 'Password@123',
        role: ROLES.DOCTOR,
        status: 'active',
        emailVerified: true,
      });
      const doctorD = await Doctor.create({
        name: 'Dr. Reassigned Visit',
        email: 'reassigned.v@citycare.com',
        mobile: '9844444444',
        specialization: 'Pediatrics',
        user: userDocD._id,
        hospitalId: hospA._id,
        status: 'active',
        verificationStatus: 'verified',
        isApproved: true,
        availability: [{ day: 'Mon', start: '09:00', end: '17:00', slotMinutes: 30 }],
      });

      const legacyBookingD = await Booking.create({
        patient: userPatientA._id,
        doctor: doctorD._id,
        hospital: null,
        date: new Date('2026-11-02'),
        time: '11:00',
        status: 'completed',
      });

      const legacyVisit = await Visit.create({
        patient: userPatientA._id,
        mobile: '9800000001',
        date: new Date('2026-11-02'),
        time: '11:00',
        doctor: doctorD._id,
        booking: legacyBookingD._id,
        hospital: null,
      });

      // Doctor D is later reassigned to Hospital B
      doctorD.hospitalId = hospB._id;
      await doctorD.save();

      // Hospital B staff queries visits: exact hospital match excludes null-hospital records
      const vResult = await visitService.getVisits(receptionistB, {}, { hospitalId: hospB._id });
      const found = vResult.visits.find((v) => v._id.toString() === legacyVisit._id.toString());
      expect(found).toBeUndefined();
    });

    // ------------------------------------------------------------------------
    // Step 3.4 Hardening: Doctor Verification, Approval, Deletion & Reassignment
    // ------------------------------------------------------------------------
    describe('Doctor Credential Verification & Reassignment Isolation', () => {
      let userDocUnverified, docUnverified;
      let userDocUnapproved, docUnapproved;
      let userDocDeleted, docDeleted;
      let testBooking, testVisit;

      beforeEach(async () => {
        // Active but unverified doctor (verificationStatus = 'pending_verification')
        userDocUnverified = await User.create({
          name: 'Dr. Unverified User',
          email: 'unverified@citycare.com',
          mobile: '9855555551',
          password: 'Password@123',
          role: ROLES.DOCTOR,
          status: 'active',
          emailVerified: true,
        });
        docUnverified = await Doctor.create({
          name: 'Dr. Unverified',
          email: 'unverified@citycare.com',
          mobile: '9855555552',
          specialization: 'Neurology',
          user: userDocUnverified._id,
          hospitalId: hospA._id,
          status: 'active',
          verificationStatus: 'pending_verification',
          isApproved: false,
          availability: [{ day: 'Mon', start: '09:00', end: '17:00', slotMinutes: 30 }],
        });

        // Active but unapproved doctor (verificationStatus = 'verified', isApproved = false)
        userDocUnapproved = await User.create({
          name: 'Dr. Unapproved User',
          email: 'unapproved@citycare.com',
          mobile: '9855555553',
          password: 'Password@123',
          role: ROLES.DOCTOR,
          status: 'active',
          emailVerified: true,
        });
        docUnapproved = await Doctor.create({
          name: 'Dr. Unapproved',
          email: 'unapproved@citycare.com',
          mobile: '9855555554',
          specialization: 'Cardiology',
          user: userDocUnapproved._id,
          hospitalId: hospA._id,
          status: 'active',
          verificationStatus: 'verified',
          isApproved: false,
          availability: [{ day: 'Mon', start: '09:00', end: '17:00', slotMinutes: 30 }],
        });

        // Soft-deleted doctor profile (deletedAt is set)
        userDocDeleted = await User.create({
          name: 'Dr. Deleted User',
          email: 'deleted.doc@citycare.com',
          mobile: '9855555555',
          password: 'Password@123',
          role: ROLES.DOCTOR,
          status: 'active',
          emailVerified: true,
        });
        docDeleted = await Doctor.create({
          name: 'Dr. Deleted',
          email: 'deleted.doc@citycare.com',
          mobile: '9855555556',
          specialization: 'General',
          user: userDocDeleted._id,
          hospitalId: hospA._id,
          status: 'active',
          verificationStatus: 'verified',
          isApproved: true,
          deletedAt: new Date(),
          availability: [{ day: 'Mon', start: '09:00', end: '17:00', slotMinutes: 30 }],
        });

        // Setup test booking and visit for Doctor A (verified & approved)
        testBooking = await Booking.create({
          patient: userPatientA._id,
          doctor: doctorA._id,
          hospital: hospA._id,
          date: new Date('2026-11-02'),
          time: '12:00',
          status: 'pending',
        });
        testVisit = await Visit.create({
          patient: userPatientA._id,
          mobile: '9800000001',
          date: new Date('2026-11-02'),
          time: '12:00',
          doctor: doctorA._id,
          booking: testBooking._id,
          hospital: hospA._id,
        });
      });

      // 1. Unverified doctor tests
      it('rejects active but unverified doctor from listing bookings', async () => {
        await expect(
          bookingService.getBookings(userDocUnverified, {}, null)
        ).rejects.toMatchObject({
          statusCode: 403,
          message: expect.stringMatching(/must be verified and approved/i),
        });
      });

      it('rejects active but unverified doctor from listing visits', async () => {
        await expect(
          visitService.getVisits(userDocUnverified, {}, null)
        ).rejects.toMatchObject({
          statusCode: 403,
          message: expect.stringMatching(/must be verified and approved/i),
        });
      });

      it('rejects active but unverified doctor from retrieving a visit by ID', async () => {
        await expect(
          visitService.getVisitById(testVisit._id, userDocUnverified, null)
        ).rejects.toMatchObject({
          statusCode: 403,
          message: expect.stringMatching(/must be verified and approved/i),
        });
      });

      it('rejects active but unverified doctor from updating booking status', async () => {
        const b = await Booking.create({
          patient: userPatientA._id,
          doctor: docUnverified._id,
          hospital: hospA._id,
          date: new Date('2026-11-02'),
          time: '13:00',
          status: 'pending',
        });
        await expect(
          bookingService.updateBookingStatus(b._id, 'confirmed', userDocUnverified, null)
        ).rejects.toMatchObject({
          statusCode: 403,
          message: expect.stringMatching(/must be verified and approved/i),
        });
      });

      // 2. Unapproved doctor tests
      it('rejects active but unapproved doctor from listing bookings', async () => {
        await expect(
          bookingService.getBookings(userDocUnapproved, {}, null)
        ).rejects.toMatchObject({
          statusCode: 403,
          message: expect.stringMatching(/must be verified and approved/i),
        });
      });

      it('rejects active but unapproved doctor from listing visits', async () => {
        await expect(
          visitService.getVisits(userDocUnapproved, {}, null)
        ).rejects.toMatchObject({
          statusCode: 403,
          message: expect.stringMatching(/must be verified and approved/i),
        });
      });

      it('rejects active but unapproved doctor from retrieving a visit by ID', async () => {
        await expect(
          visitService.getVisitById(testVisit._id, userDocUnapproved, null)
        ).rejects.toMatchObject({
          statusCode: 403,
          message: expect.stringMatching(/must be verified and approved/i),
        });
      });

      it('rejects active but unapproved doctor from updating booking status', async () => {
        const b = await Booking.create({
          patient: userPatientA._id,
          doctor: docUnapproved._id,
          hospital: hospA._id,
          date: new Date('2026-11-02'),
          time: '13:30',
          status: 'pending',
        });
        await expect(
          bookingService.updateBookingStatus(b._id, 'confirmed', userDocUnapproved, null)
        ).rejects.toMatchObject({
          statusCode: 403,
          message: expect.stringMatching(/must be verified and approved/i),
        });
      });

      // 3. Soft-deleted doctor tests
      it('rejects soft-deleted doctor profile from listing bookings and visits', async () => {
        await expect(
          bookingService.getBookings(userDocDeleted, {}, null)
        ).rejects.toMatchObject({
          statusCode: 403,
          message: expect.stringMatching(/account has been deleted/i),
        });

        await expect(
          visitService.getVisits(userDocDeleted, {}, null)
        ).rejects.toMatchObject({
          statusCode: 403,
          message: expect.stringMatching(/account has been deleted/i),
        });
      });

      // 4. Verified and approved active doctor retains legitimate access
      it('allows verified, approved, active doctor legitimate read and update access', async () => {
        const bResult = await bookingService.getBookings(userDoctorA, {}, null);
        expect(bResult.bookings.length).toBeGreaterThanOrEqual(1);

        const vResult = await visitService.getVisits(userDoctorA, {}, null);
        expect(vResult.visits.length).toBeGreaterThanOrEqual(1);

        const visit = await visitService.getVisitById(testVisit._id, userDoctorA, null);
        expect(visit._id.toString()).toBe(testVisit._id.toString());

        const updated = await bookingService.updateBookingStatus(testBooking._id, 'confirmed', userDoctorA, null);
        expect(updated.status).toBe('confirmed');
      });

      // 5. Doctor with missing hospitalId must be rejected fail-closed
      describe('Verified doctor with no hospitalId is rejected from all operational paths', () => {
        let userDocNoHospital, docNoHospital;
        let bookingForNoHospDoc, visitForNoHospDoc;

        beforeEach(async () => {
          userDocNoHospital = await User.create({
            name: 'Dr. No Hospital User',
            email: 'no.hospital.doc@test.com',
            mobile: '9877777771',
            password: 'Password@123',
            role: ROLES.DOCTOR,
            status: 'active',
            emailVerified: true,
          });
          // Fully verified, approved, active — but no hospitalId
          docNoHospital = await Doctor.create({
            name: 'Dr. No Hospital',
            email: 'no.hospital.doc@test.com',
            mobile: '9877777772',
            specialization: 'General',
            user: userDocNoHospital._id,
            // hospitalId intentionally absent
            status: 'active',
            verificationStatus: 'verified',
            isApproved: true,
            availability: [{ day: 'Mon', start: '09:00', end: '17:00', slotMinutes: 30 }],
          });

          bookingForNoHospDoc = await Booking.create({
            patient: userPatientA._id,
            doctor: docNoHospital._id,
            hospital: hospA._id,
            date: new Date('2026-11-02'),
            time: '08:00',
            status: 'pending',
          });

          visitForNoHospDoc = await Visit.create({
            patient: userPatientA._id,
            mobile: '9800000001',
            date: new Date('2026-11-02'),
            time: '08:00',
            doctor: docNoHospital._id,
            booking: bookingForNoHospDoc._id,
            hospital: hospA._id,
          });
        });

        it('rejects verified doctor with no hospitalId from listing bookings', async () => {
          await expect(
            bookingService.getBookings(userDocNoHospital, {}, null)
          ).rejects.toMatchObject({
            statusCode: 403,
            message: expect.stringMatching(/hospital assignment is missing/i),
          });
        });

        it('rejects verified doctor with no hospitalId from listing visits', async () => {
          await expect(
            visitService.getVisits(userDocNoHospital, {}, null)
          ).rejects.toMatchObject({
            statusCode: 403,
            message: expect.stringMatching(/hospital assignment is missing/i),
          });
        });

        it('rejects verified doctor with no hospitalId from retrieving a visit by ID', async () => {
          await expect(
            visitService.getVisitById(visitForNoHospDoc._id, userDocNoHospital, null)
          ).rejects.toMatchObject({
            statusCode: 403,
            message: expect.stringMatching(/hospital assignment is missing/i),
          });
        });

        it('rejects verified doctor with no hospitalId from updating booking status', async () => {
          await expect(
            bookingService.updateBookingStatus(bookingForNoHospDoc._id, 'confirmed', userDocNoHospital, null)
          ).rejects.toMatchObject({
            statusCode: 403,
            message: expect.stringMatching(/hospital assignment is missing/i),
          });
        });
      });

      // 6. Doctor reassignment policy enforcement
      it('enforces strict facility isolation on a doctor reassigned from Hospital A to Hospital B', async () => {
        // Create Doctor E initially affiliated with Hospital A
        const userDocE = await User.create({
          name: 'Dr. Reassigned Policy User',
          email: 'reassigned.policy@citycare.com',
          mobile: '9866666661',
          password: 'Password@123',
          role: ROLES.DOCTOR,
          status: 'active',
          emailVerified: true,
        });
        const doctorE = await Doctor.create({
          name: 'Dr. Reassigned Policy',
          email: 'reassigned.policy@citycare.com',
          mobile: '9866666662',
          specialization: 'Oncology',
          user: userDocE._id,
          hospitalId: hospA._id,
          status: 'active',
          verificationStatus: 'verified',
          isApproved: true,
          availability: [{ day: 'Mon', start: '09:00', end: '17:00', slotMinutes: 30 }],
        });

        // Booking and Visit at Hospital A
        const bookingHospA = await Booking.create({
          patient: userPatientA._id,
          doctor: doctorE._id,
          hospital: hospA._id,
          date: new Date('2026-11-02'),
          time: '14:00',
          status: 'pending',
        });
        const visitHospA = await Visit.create({
          patient: userPatientA._id,
          mobile: '9800000001',
          date: new Date('2026-11-02'),
          time: '14:00',
          doctor: doctorE._id,
          booking: bookingHospA._id,
          hospital: hospA._id,
        });

        // Doctor E is now reassigned to Hospital B
        doctorE.hospitalId = hospB._id;
        await doctorE.save();

        // Create new booking and visit at Hospital B for Doctor E
        const bookingHospB = await Booking.create({
          patient: userPatientA._id,
          doctor: doctorE._id,
          hospital: hospB._id,
          date: new Date('2026-11-02'),
          time: '14:30',
          status: 'pending',
        });
        const visitHospB = await Visit.create({
          patient: userPatientA._id,
          mobile: '9800000001',
          date: new Date('2026-11-02'),
          time: '14:30',
          doctor: doctorE._id,
          booking: bookingHospB._id,
          hospital: hospB._id,
        });

        // 1. Doctor E listing bookings: only Hospital B bookings are returned
        const bResult = await bookingService.getBookings(userDocE, {}, null);
        const bookingIds = bResult.bookings.map((b) => b._id.toString());
        expect(bookingIds).toContain(bookingHospB._id.toString());
        expect(bookingIds).not.toContain(bookingHospA._id.toString());

        // 2. Doctor E listing visits: only Hospital B visits are returned
        const vResult = await visitService.getVisits(userDocE, {}, null);
        const visitIds = vResult.visits.map((v) => v._id.toString());
        expect(visitIds).toContain(visitHospB._id.toString());
        expect(visitIds).not.toContain(visitHospA._id.toString());

        // 3. Doctor E retrieving visit by ID: Hospital A visit is rejected with 403
        await expect(
          visitService.getVisitById(visitHospA._id, userDocE, null)
        ).rejects.toMatchObject({
          statusCode: 403,
          message: expect.stringMatching(/no longer affiliated with/i),
        });

        // 4. Doctor E retrieving visit by ID: Hospital B visit succeeds
        const fetchedVisitB = await visitService.getVisitById(visitHospB._id, userDocE, null);
        expect(fetchedVisitB._id.toString()).toBe(visitHospB._id.toString());

        // 5. Doctor E updating booking status: Hospital A booking modification is rejected with 403
        await expect(
          bookingService.updateBookingStatus(bookingHospA._id, 'confirmed', userDocE, null)
        ).rejects.toMatchObject({
          statusCode: 403,
          message: expect.stringMatching(/no longer affiliated with/i),
        });

        // 6. Doctor E updating booking status: Hospital B booking modification succeeds
        const updatedB = await bookingService.updateBookingStatus(bookingHospB._id, 'confirmed', userDocE, null);
        expect(updatedB.status).toBe('confirmed');
      });
    });
  });
});
