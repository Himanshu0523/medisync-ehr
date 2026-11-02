import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Hospital from '../src/modules/hospital/hospital.model.js';
import User from '../src/modules/user/user.model.js';
import Doctor from '../src/modules/doctor/doctor.model.js';
import Patient from '../src/modules/patient/patient.model.js';
import PatientHospital from '../src/modules/patientHospital/patientHospital.model.js';
import Booking from '../src/modules/booking/booking.model.js';
import Visit from '../src/modules/visit/visit.model.js';
import { runMigration, runRollback } from '../src/scripts/migrateHospitalReferences.js';
import { ROLES } from '../src/modules/auth/auth.constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MANIFESTS_DIR = path.join(__dirname, '../src/scripts/migration_runs');

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe('Milestone 3 — Migration Safeguards & Rollback (Step 3.4)', () => {
  let hospA, hospB, inactiveHosp;
  let userPatientA, patientA;
  let doctorA, doctorB, legacyDoctor;

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

    inactiveHosp = await Hospital.create({
      name: 'Old Closed Clinic',
      code: 'OLD-CLINIC',
      email: 'old@clinic.com',
      contactNumber: '01123456789',
      status: 'inactive',
    });

    // 2. Patient
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

    await PatientHospital.create({
      patient: patientA._id,
      hospital: hospA._id,
      medicalRecordNumber: 'CITY-0001',
      registeredBy: userPatientA._id,
      status: 'active',
    });

    // 3. Doctors
    doctorA = await Doctor.create({
      name: 'Dr. Ashok',
      email: 'dr.ashok@citycare.com',
      mobile: '9811111111',
      specialization: 'Cardiology',
      hospitalId: hospA._id,
      status: 'active',
      verificationStatus: 'verified',
      isApproved: true,
      availability: [{ day: 'Mon', start: '09:00', end: '17:00', slotMinutes: 30 }],
    });

    doctorB = await Doctor.create({
      name: 'Dr. Bhavna',
      email: 'dr.bhavna@sunrise.com',
      mobile: '9822222222',
      specialization: 'Neurology',
      hospitalId: hospB._id,
      status: 'active',
      verificationStatus: 'verified',
      isApproved: true,
      availability: [{ day: 'Mon', start: '09:00', end: '17:00', slotMinutes: 30 }],
    });

    // Legacy unassigned doctor (no hospitalId)
    legacyDoctor = await Doctor.create({
      name: 'Dr. Legacy Prototype',
      email: 'dr.legacy@prototype.com',
      mobile: '9833333333',
      specialization: 'General',
      availability: [{ day: 'Mon', start: '09:00', end: '17:00', slotMinutes: 30 }],
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

  // 1. Missing Patient profile
  it('does NOT mark Booking migratable if Patient profile is missing', async () => {
    const userWithoutPatient = await User.create({
      name: 'Orphan User',
      email: 'orphan@test.com',
      mobile: '9844444444',
      password: 'Password@123',
      role: ROLES.PATIENT,
      status: 'active',
    });

    const booking = await Booking.create({
      patient: userWithoutPatient._id,
      doctor: doctorA._id,
      date: new Date('2026-11-02'),
      time: '10:00',
      status: 'pending',
    });

    const { stats } = await runMigration({
      isApply: false,
      shouldCloseConnection: false,
      connect: false,
    });

    expect(stats.bookings.missingPatientProfile).toContain(booking._id.toString());
    expect(stats.bookings.migratable).toBe(0);

    const doc = await Booking.findById(booking._id);
    expect(doc.hospital).toBeNull();
  });

  // 2. Missing PatientHospital affiliation
  it('does NOT mark Booking migratable if active PatientHospital affiliation is missing', async () => {
    const unaffiliatedUser = await User.create({
      name: 'Unaffiliated Patient',
      email: 'unaffiliated@test.com',
      mobile: '9855555555',
      password: 'Password@123',
      role: ROLES.PATIENT,
      status: 'active',
    });
    await Patient.create({ user: unaffiliatedUser._id, gender: 'male' });

    const booking = await Booking.create({
      patient: unaffiliatedUser._id,
      doctor: doctorA._id,
      date: new Date('2026-11-02'),
      time: '10:00',
      status: 'pending',
    });

    const { stats } = await runMigration({
      isApply: false,
      shouldCloseConnection: false,
      connect: false,
    });

    expect(stats.bookings.missingPatientHospitalAffiliation).toContain(booking._id.toString());
    expect(stats.bookings.migratable).toBe(0);

    const doc = await Booking.findById(booking._id);
    expect(doc.hospital).toBeNull();
  });

  // 3. Invalid existing Booking hospital
  it('reports invalid existing Booking hospital and preserves existing value without overwriting', async () => {
    const fakeHospitalId = new mongoose.Types.ObjectId();

    const booking = await Booking.create({
      patient: userPatientA._id,
      doctor: doctorA._id,
      hospital: fakeHospitalId,
      date: new Date('2026-11-02'),
      time: '10:00',
      status: 'confirmed',
    });

    const { stats } = await runMigration({
      isApply: false,
      shouldCloseConnection: false,
      connect: false,
    });

    expect(stats.bookings.invalidExistingHospital.length).toBe(1);
    expect(stats.bookings.invalidExistingHospital[0].id).toBe(booking._id.toString());
    expect(stats.bookings.migratable).toBe(0);

    const doc = await Booking.findById(booking._id);
    expect(doc.hospital.toString()).toBe(fakeHospitalId.toString());
  });

  // 4. Doctor/Booking hospital mismatch
  it('reports inconsistency when existing Booking hospital conflicts with Doctor hospitalId', async () => {
    const booking = await Booking.create({
      patient: userPatientA._id,
      doctor: doctorB._id, // Belongs to Hosp B
      hospital: hospA._id, // Conflicting hospital
      date: new Date('2026-11-02'),
      time: '10:00',
      status: 'confirmed',
    });

    const { stats } = await runMigration({
      isApply: false,
      shouldCloseConnection: false,
      connect: false,
    });

    expect(stats.bookings.inconsistentExistingHospital.length).toBe(1);
    expect(stats.bookings.inconsistentExistingHospital[0].id).toBe(booking._id.toString());
    expect(stats.bookings.alreadyHasValidHospital).toBe(0);

    const doc = await Booking.findById(booking._id);
    expect(doc.hospital.toString()).toBe(hospA._id.toString()); // Preserved
  });

  // 5. Visit with missing Booking hospital
  it('does NOT infer Visit hospital from Doctor when linked Booking has no hospital', async () => {
    const bookingWithoutHospital = await Booking.create({
      patient: userPatientA._id,
      doctor: doctorA._id,
      hospital: null,
      date: new Date('2026-11-02'),
      time: '10:00',
      status: 'confirmed',
    });

    const visit = await Visit.create({
      patient: userPatientA._id,
      mobile: '9800000001',
      date: new Date('2026-11-02'),
      time: '10:00',
      doctor: doctorA._id,
      booking: bookingWithoutHospital._id,
      hospital: null,
    });

    const { stats } = await runMigration({
      isApply: false,
      shouldCloseConnection: false,
      connect: false,
    });

    expect(stats.visits.unresolvableHospital).toContain(visit._id.toString());
    expect(stats.visits.migratable).toBe(0);

    const doc = await Visit.findById(visit._id);
    expect(doc.hospital).toBeNull();
  });

  // 6. Visit hospital mismatch
  it('reports inconsistency when existing Visit hospital diverges from linked Booking hospital', async () => {
    const booking = await Booking.create({
      patient: userPatientA._id,
      doctor: doctorA._id,
      hospital: hospA._id,
      date: new Date('2026-11-02'),
      time: '10:00',
      status: 'confirmed',
    });

    const visit = await Visit.create({
      patient: userPatientA._id,
      mobile: '9800000001',
      date: new Date('2026-11-02'),
      time: '10:00',
      doctor: doctorA._id,
      booking: booking._id,
      hospital: hospB._id, // Divergent hospital
    });

    const { stats } = await runMigration({
      isApply: false,
      shouldCloseConnection: false,
      connect: false,
    });

    expect(stats.visits.inconsistentExistingHospital.length).toBe(1);
    expect(stats.visits.inconsistentExistingHospital[0].id).toBe(visit._id.toString());
    expect(stats.visits.alreadyHasValidHospital).toBe(0);

    const doc = await Visit.findById(visit._id);
    expect(doc.hospital.toString()).toBe(hospB._id.toString()); // Preserved
  });

  // 7. Visit migration rejects a missing Doctor
  it('rejects Visit migration when the Visit doctor does not exist', async () => {
    const nonExistentDocId = new mongoose.Types.ObjectId();
    const booking = await Booking.create({
      patient: userPatientA._id,
      doctor: doctorA._id,
      hospital: hospA._id,
      date: new Date('2026-11-02'),
      time: '10:00',
      status: 'confirmed',
    });

    const visit = await Visit.create({
      patient: userPatientA._id,
      mobile: '9800000001',
      date: new Date('2026-11-02'),
      time: '10:00',
      doctor: nonExistentDocId,
      booking: booking._id,
      hospital: null,
    });

    const { stats } = await runMigration({
      isApply: false,
      shouldCloseConnection: false,
      connect: false,
    });

    expect(stats.visits.missingDoctor).toContain(visit._id.toString());
    expect(stats.visits.migratable).toBe(0);
  });

  // 8. Visit migration rejects a Doctor with no hospitalId
  it('rejects Visit migration when the doctor has no hospitalId (legacy prototype doctor)', async () => {
    const booking = await Booking.create({
      patient: userPatientA._id,
      doctor: legacyDoctor._id,
      hospital: hospA._id,
      date: new Date('2026-11-02'),
      time: '10:00',
      status: 'confirmed',
    });

    const visit = await Visit.create({
      patient: userPatientA._id,
      mobile: '9800000001',
      date: new Date('2026-11-02'),
      time: '10:00',
      doctor: legacyDoctor._id,
      booking: booking._id,
      hospital: null,
    });

    const { stats } = await runMigration({
      isApply: false,
      shouldCloseConnection: false,
      connect: false,
    });

    expect(stats.visits.unresolvableDoctorHospital).toContain(visit._id.toString());
    expect(stats.visits.migratable).toBe(0);
  });

  // 9. Visit migration rejects a Booking with invalid PatientHospital affiliation
  it('rejects Visit migration when linked Booking patient has no PatientHospital affiliation', async () => {
    const unaffiliatedUser = await User.create({
      name: 'Patient Dave',
      email: 'dave@test.com',
      mobile: '9877777777',
      password: 'Password@123',
      role: ROLES.PATIENT,
      status: 'active',
    });
    await Patient.create({ user: unaffiliatedUser._id, gender: 'male' });

    // Booking has hospA, but patient is NOT affiliated with hospA
    const booking = await Booking.create({
      patient: unaffiliatedUser._id,
      doctor: doctorA._id,
      hospital: hospA._id,
      date: new Date('2026-11-02'),
      time: '10:00',
      status: 'confirmed',
    });

    const visit = await Visit.create({
      patient: unaffiliatedUser._id,
      mobile: '9877777777',
      date: new Date('2026-11-02'),
      time: '10:00',
      doctor: doctorA._id,
      booking: booking._id,
      hospital: null,
    });

    const { stats } = await runMigration({
      isApply: false,
      shouldCloseConnection: false,
      connect: false,
    });

    expect(stats.visits.inconsistentLinkedBooking).toContain(visit._id.toString());
    expect(stats.visits.migratable).toBe(0);
  });

  // 10. Existing Visit hospital rejected as inconsistent when Doctor belongs to another hospital
  it('reports existing Visit hospital as inconsistent when Doctor belongs to another hospital', async () => {
    const booking = await Booking.create({
      patient: userPatientA._id,
      doctor: doctorB._id, // Doctor B belongs to hosp B
      hospital: hospA._id,
      date: new Date('2026-11-02'),
      time: '10:00',
      status: 'confirmed',
    });

    const visit = await Visit.create({
      patient: userPatientA._id,
      mobile: '9800000001',
      date: new Date('2026-11-02'),
      time: '10:00',
      doctor: doctorB._id,
      booking: booking._id,
      hospital: hospA._id, // Visit claims Hosp A, but Doctor belongs to Hosp B
    });

    const { stats } = await runMigration({
      isApply: false,
      shouldCloseConnection: false,
      connect: false,
    });

    expect(stats.visits.inconsistentExistingHospital.length).toBe(1);
    expect(stats.visits.inconsistentExistingHospital[0].id).toBe(visit._id.toString());
    expect(stats.visits.alreadyHasValidHospital).toBe(0);
  });

  // 11. Partial migration failure leaves a recoverable write-ahead manifest
  it('initializes write-ahead recovery manifest before updates and records executed changes', async () => {
    const b1 = await Booking.create({
      patient: userPatientA._id,
      doctor: doctorA._id,
      date: new Date('2026-11-02'),
      time: '10:00',
      status: 'confirmed',
    });

    const { runId } = await runMigration({
      isApply: true,
      shouldCloseConnection: false,
      connect: false,
    });

    const manifestFile = path.join(MANIFESTS_DIR, `migration_manifest_${runId}.json`);
    expect(fs.existsSync(manifestFile)).toBe(true);

    const manifestContent = JSON.parse(fs.readFileSync(manifestFile, 'utf-8'));
    expect(manifestContent.runId).toBe(runId);
    expect(manifestContent.integrityChecksum).toBeDefined();
    expect(manifestContent.payload.plannedBookings.length).toBe(1);
    expect(manifestContent.payload.modifiedBookings.length).toBe(1);
    expect(manifestContent.payload.status).toBe('completed');
  });

  // 12. Rollback preserving documents modified after migration
  it('reverts applied migration documents but skips documents modified after the migration', async () => {
    const b1 = await Booking.create({
      patient: userPatientA._id,
      doctor: doctorA._id,
      date: new Date('2026-11-02'),
      time: '10:00',
      status: 'confirmed',
    });

    const b2 = await Booking.create({
      patient: userPatientA._id,
      doctor: doctorA._id,
      date: new Date('2026-11-02'),
      time: '10:30',
      status: 'confirmed',
    });

    const { stats } = await runMigration({
      isApply: true,
      shouldCloseConnection: false,
      connect: false,
    });

    expect(stats.bookings.updated).toBe(2);

    let doc1 = await Booking.findById(b1._id);
    let doc2 = await Booking.findById(b2._id);
    expect(doc1.hospital.toString()).toBe(hospA._id.toString());
    expect(doc2.hospital.toString()).toBe(hospA._id.toString());

    // Subsequent external update to b2: hospital changed to hospB by another process
    await Booking.updateOne({ _id: b2._id }, { $set: { hospital: hospB._id } });

    // Execute rollback
    const rollbackResult = await runRollback({
      shouldCloseConnection: false,
      connect: false,
    });

    expect(rollbackResult.revertedBookings).toBe(1);
    expect(rollbackResult.skippedBookings).toBe(1);

    // b1 was reverted to null (its original state)
    doc1 = await Booking.findById(b1._id);
    expect(doc1.hospital).toBeNull();

    // b2 was preserved as hospB (external post-migration update protected!)
    doc2 = await Booking.findById(b2._id);
    expect(doc2.hospital.toString()).toBe(hospB._id.toString());
  });

  // 13. Dry-run performs zero writes
  it('confirms dry-run identifies migratable records but performs zero database writes', async () => {
    const booking = await Booking.create({
      patient: userPatientA._id,
      doctor: doctorA._id,
      date: new Date('2026-11-02'),
      time: '10:00',
      status: 'confirmed',
    });

    const { stats } = await runMigration({
      isApply: false,
      shouldCloseConnection: false,
      connect: false,
    });

    expect(stats.bookings.migratable).toBe(1);
    expect(stats.bookings.updated).toBe(0);

    const doc = await Booking.findById(booking._id);
    expect(doc.hospital).toBeNull();
  });

  // 14. Path traversal protection: rejects ../ traversal attempt in latest_manifest.json pointer
  it('rejects path traversal attempt in latest_manifest.json pointer', async () => {
    fs.mkdirSync(MANIFESTS_DIR, { recursive: true });
    const pointerFile = path.join(MANIFESTS_DIR, 'latest_manifest.json');
    fs.writeFileSync(
      pointerFile,
      JSON.stringify({ latest: '../../outside.json', runId: 'fake' }, null, 2)
    );

    try {
      await expect(
        runRollback({ shouldCloseConnection: false, connect: false })
      ).rejects.toThrow('Invalid migration manifest filename');
    } finally {
      if (fs.existsSync(pointerFile)) {
        fs.unlinkSync(pointerFile);
      }
    }
  });

  // 15. Path traversal protection: rejects absolute path in latest_manifest.json pointer
  it('rejects absolute path in latest_manifest.json pointer', async () => {
    fs.mkdirSync(MANIFESTS_DIR, { recursive: true });
    const pointerFile = path.join(MANIFESTS_DIR, 'latest_manifest.json');
    const absolutePayload = path.resolve('/outside.json');
    fs.writeFileSync(
      pointerFile,
      JSON.stringify({ latest: absolutePayload, runId: 'fake' }, null, 2)
    );

    try {
      await expect(
        runRollback({ shouldCloseConnection: false, connect: false })
      ).rejects.toThrow('Invalid migration manifest filename');
    } finally {
      if (fs.existsSync(pointerFile)) {
        fs.unlinkSync(pointerFile);
      }
    }
  });

  // 16. Valid generated manifest filename is accepted and processed
  it('accepts a valid generated migration_manifest_run_*.json filename in the pointer', async () => {
    const booking = await Booking.create({
      patient: userPatientA._id,
      doctor: doctorA._id,
      date: new Date('2026-11-02'),
      time: '10:00',
      status: 'confirmed',
    });

    const { runId } = await runMigration({
      isApply: true,
      shouldCloseConnection: false,
      connect: false,
    });

    const pointerFile = path.join(MANIFESTS_DIR, 'latest_manifest.json');
    expect(fs.existsSync(pointerFile)).toBe(true);
    const pointer = JSON.parse(fs.readFileSync(pointerFile, 'utf-8'));
    expect(pointer.latest).toBe(`migration_manifest_${runId}.json`);
    expect(pointer.latest.startsWith('migration_manifest_run_')).toBe(true);

    const rollbackResult = await runRollback({
      shouldCloseConnection: false,
      connect: false,
    });

    expect(rollbackResult.revertedBookings).toBeGreaterThanOrEqual(1);

    const reverted = await Booking.findById(booking._id);
    expect(reverted.hospital).toBeNull();

    // Clean up created manifest files for this test
    const manifestFile = path.join(MANIFESTS_DIR, pointer.latest);
    if (fs.existsSync(manifestFile)) fs.unlinkSync(manifestFile);
    if (fs.existsSync(pointerFile)) fs.unlinkSync(pointerFile);
  });
});

