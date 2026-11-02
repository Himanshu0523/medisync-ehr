import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import Hospital from '../modules/hospital/hospital.model.js';
import User from '../modules/user/user.model.js';
import Doctor from '../modules/doctor/doctor.model.js';
import Patient from '../modules/patient/patient.model.js';
import PatientHospital from '../modules/patientHospital/patientHospital.model.js';
import Booking from '../modules/booking/booking.model.js';
import Visit from '../modules/visit/visit.model.js';

const inspectDatabase = async () => {
  await connectDB();
  console.log('--- MediSync Pre-Migration Database Inspection (Step 3.4.1) ---');

  // 1. Deployment & Infrastructure Checks
  const topoType = mongoose.connection?.client?.topology?.description?.type;
  const supportsTransactions = ['ReplicaSetWithPrimary', 'Sharded'].includes(topoType);
  const dbName = mongoose.connection.name;

  const [bookingIndexes, visitIndexes] = await Promise.all([
    Booking.collection.indexes().catch(() => []),
    Visit.collection.indexes().catch(() => []),
  ]);

  // 2. Collection Counts
  const [
    totalHospitals,
    totalUsers,
    totalDoctors,
    totalPatients,
    totalPatientHospitals,
    totalBookings,
    totalVisits,
  ] = await Promise.all([
    Hospital.countDocuments(),
    User.countDocuments(),
    Doctor.countDocuments(),
    Patient.countDocuments(),
    PatientHospital.countDocuments(),
    Booking.countDocuments(),
    Visit.countDocuments(),
  ]);

  // 3. Cache Reference Lookups for Efficient Read-only Validation
  const [hospitals, doctors, users, patients, patientHospitals] = await Promise.all([
    Hospital.find({}).lean(),
    Doctor.find({}).lean(),
    User.find({}).select('_id role status').lean(),
    Patient.find({}).select('_id user deletedAt').lean(),
    PatientHospital.find({}).select('_id patient hospital status').lean(),
  ]);

  const hospitalMap = new Map(hospitals.map((h) => [h._id.toString(), h]));
  const doctorMap = new Map(doctors.map((d) => [d._id.toString(), d]));
  const userMap = new Map(users.map((u) => [u._id.toString(), u]));
  const patientByUserMap = new Map(patients.filter((p) => p.user).map((p) => [p.user.toString(), p]));
  const patientMap = new Map(patients.map((p) => [p._id.toString(), p]));

  // Key: `${patientId}_${hospitalId}`
  const patientHospitalSet = new Set(
    patientHospitals
      .filter((ph) => ph.status === 'active')
      .map((ph) => `${ph.patient.toString()}_${ph.hospital.toString()}`)
  );

  // 4. Booking Consistency Inspection
  const bookings = await Booking.find({}).lean();
  const validStatusList = ['pending', 'confirmed', 'cancelled', 'completed'];

  const bookingStats = {
    total: bookings.length,
    valid: 0,
    missingDoctor: [],
    missingHospitalAssignment: [],
    missingPatientUser: [],
    missingPatientProfile: [],
    missingPatientHospitalRelation: [],
    invalidStatus: [],
  };

  for (const b of bookings) {
    const bId = b._id.toString();
    let isConsistent = true;

    // A. Doctor exists?
    const docId = b.doctor ? b.doctor.toString() : null;
    const doc = docId ? doctorMap.get(docId) : null;
    if (!doc) {
      bookingStats.missingDoctor.push(bId);
      isConsistent = false;
    }

    // B. Doctor hospitalId valid?
    const hospId = doc?.hospitalId ? doc.hospitalId.toString() : null;
    if (!hospId || !hospitalMap.has(hospId)) {
      bookingStats.missingHospitalAssignment.push(bId);
      isConsistent = false;
    }

    // C. Patient User exists?
    const pUserId = b.patient ? b.patient.toString() : null;
    const pUser = pUserId ? userMap.get(pUserId) : null;
    if (!pUser) {
      bookingStats.missingPatientUser.push(bId);
      isConsistent = false;
    }

    // D. Patient Profile exists?
    let pat = pUserId ? patientByUserMap.get(pUserId) : null;
    if (!pat && pUserId && patientMap.has(pUserId)) {
      pat = patientMap.get(pUserId);
    }
    if (!pat) {
      bookingStats.missingPatientProfile.push(bId);
      isConsistent = false;
    }

    // E. PatientHospital relation exists?
    if (pat && hospId) {
      const relationKey = `${pat._id.toString()}_${hospId}`;
      if (!patientHospitalSet.has(relationKey)) {
        bookingStats.missingPatientHospitalRelation.push(bId);
        // Note: For pre-migration, this is tracked as a relation gap
      }
    }

    // F. Status valid?
    if (!validStatusList.includes(b.status)) {
      bookingStats.invalidStatus.push(bId);
      isConsistent = false;
    }

    if (isConsistent) {
      bookingStats.valid++;
    }
  }

  // 5. Visit Consistency Inspection
  const visits = await Visit.find({}).lean();
  const bookingMap = new Map(bookings.map((b) => [b._id.toString(), b]));

  const visitStats = {
    total: visits.length,
    valid: 0,
    missingBooking: [],
    missingDoctor: [],
    missingPatientUser: [],
    bookingMismatch: [],
    missingHospitalAssignment: [],
    missingPatientHospitalRelation: [],
  };

  for (const v of visits) {
    const vId = v._id.toString();
    let isConsistent = true;

    // A. Linked booking exists?
    const linkedBId = v.booking ? v.booking.toString() : null;
    const linkedB = linkedBId ? bookingMap.get(linkedBId) : null;
    if (!linkedB) {
      visitStats.missingBooking.push(vId);
      isConsistent = false;
    }

    // B. Doctor exists?
    const docId = v.doctor ? v.doctor.toString() : null;
    const doc = docId ? doctorMap.get(docId) : null;
    if (!doc) {
      visitStats.missingDoctor.push(vId);
      isConsistent = false;
    }

    // C. Patient User exists?
    const pUserId = v.patient ? v.patient.toString() : null;
    const pUser = pUserId ? userMap.get(pUserId) : null;
    if (!pUser) {
      visitStats.missingPatientUser.push(vId);
      isConsistent = false;
    }

    // D. Consistency with linked booking?
    if (linkedB) {
      if (v.patient?.toString() !== linkedB.patient?.toString() ||
          v.doctor?.toString() !== linkedB.doctor?.toString()) {
        visitStats.bookingMismatch.push(vId);
        isConsistent = false;
      }
    }

    // E. Inheritable hospital exists?
    const hospId = doc?.hospitalId ? doc.hospitalId.toString() : null;
    if (!hospId || !hospitalMap.has(hospId)) {
      visitStats.missingHospitalAssignment.push(vId);
      isConsistent = false;
    }

    // F. PatientHospital relation?
    let pat = pUserId ? patientByUserMap.get(pUserId) : null;
    if (pat && hospId) {
      const relationKey = `${pat._id.toString()}_${hospId}`;
      if (!patientHospitalSet.has(relationKey)) {
        visitStats.missingPatientHospitalRelation.push(vId);
      }
    }

    if (isConsistent) {
      visitStats.valid++;
    }
  }

  // 6. Format and Output Findings (Zero PII / Sensitive Info)
  console.log('\n=== PRE-MIGRATION INSPECTION REPORT ===');
  console.log(`Database Name: ${dbName}`);
  console.log(`Topology Type: ${topoType || 'Standalone/Direct'}`);
  console.log(`Multi-Document Transactions Supported: ${supportsTransactions}`);

  console.log('\n--- 1. Collection Counts ---');
  console.log(`Hospitals:        ${totalHospitals}`);
  console.log(`Users:            ${totalUsers}`);
  console.log(`Doctors:          ${totalDoctors}`);
  console.log(`Patients:         ${totalPatients}`);
  console.log(`PatientHospitals: ${totalPatientHospitals}`);
  console.log(`Bookings:         ${totalBookings}`);
  console.log(`Visits:           ${totalVisits}`);

  console.log('\n--- 2. Booking Consistency Summary ---');
  console.log(`Total Bookings:                                ${bookingStats.total}`);
  console.log(`Fully Valid & Migratable:                      ${bookingStats.valid}`);
  console.log(`Missing Doctor:                                ${bookingStats.missingDoctor.length}`);
  console.log(`Missing/Invalid Hospital Assignment in Doctor: ${bookingStats.missingHospitalAssignment.length}`);
  console.log(`Missing Patient User:                          ${bookingStats.missingPatientUser.length}`);
  console.log(`Missing Patient Profile:                       ${bookingStats.missingPatientProfile.length}`);
  console.log(`Missing PatientHospital Affiliation:           ${bookingStats.missingPatientHospitalRelation.length}`);
  console.log(`Invalid Status:                                ${bookingStats.invalidStatus.length}`);

  if (bookingStats.missingDoctor.length > 0) {
    console.log(`Sample Missing Doctor Booking IDs: [${bookingStats.missingDoctor.slice(0, 3).join(', ')}]`);
  }
  if (bookingStats.missingHospitalAssignment.length > 0) {
    console.log(`Sample Missing Hospital Assignment Booking IDs: [${bookingStats.missingHospitalAssignment.slice(0, 3).join(', ')}]`);
  }
  if (bookingStats.missingPatientHospitalRelation.length > 0) {
    console.log(`Sample Missing PatientHospital Relation Booking IDs: [${bookingStats.missingPatientHospitalRelation.slice(0, 3).join(', ')}]`);
  }

  console.log('\n--- 3. Visit Consistency Summary ---');
  console.log(`Total Visits:                                  ${visitStats.total}`);
  console.log(`Fully Valid & Migratable:                      ${visitStats.valid}`);
  console.log(`Missing Booking Link:                          ${visitStats.missingBooking.length}`);
  console.log(`Missing Doctor:                                ${visitStats.missingDoctor.length}`);
  console.log(`Missing Patient User:                          ${visitStats.missingPatientUser.length}`);
  console.log(`Booking Mismatch (Doctor/Patient Divergence):  ${visitStats.bookingMismatch.length}`);
  console.log(`Missing/Invalid Inheritable Hospital:          ${visitStats.missingHospitalAssignment.length}`);
  console.log(`Missing PatientHospital Affiliation:           ${visitStats.missingPatientHospitalRelation.length}`);

  if (visitStats.bookingMismatch.length > 0) {
    console.log(`Sample Booking Mismatch Visit IDs: [${visitStats.bookingMismatch.slice(0, 3).join(', ')}]`);
  }

  console.log('\n--- 4. Existing Indexes ---');
  console.log('Booking Indexes:');
  bookingIndexes.forEach((idx) => console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`));
  console.log('Visit Indexes:');
  visitIndexes.forEach((idx) => console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`));

  console.log('\n=== END OF REPORT ===\n');

  await mongoose.disconnect();
  process.exit(0);
};

inspectDatabase().catch((err) => {
  console.error('Inspection failed:', err);
  process.exit(1);
});
