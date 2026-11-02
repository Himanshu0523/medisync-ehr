import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { connectDB } from '../config/db.js';
import Hospital from '../modules/hospital/hospital.model.js';
import Doctor from '../modules/doctor/doctor.model.js';
import Patient from '../modules/patient/patient.model.js';
import PatientHospital from '../modules/patientHospital/patientHospital.model.js';
import Booking from '../modules/booking/booking.model.js';
import Visit from '../modules/visit/visit.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MANIFESTS_DIR = path.join(__dirname, 'migration_runs');

const BATCH_SIZE = 100;

/**
 * Ensure manifests directory exists
 */
const ensureManifestsDir = () => {
  if (!fs.existsSync(MANIFESTS_DIR)) {
    fs.mkdirSync(MANIFESTS_DIR, { recursive: true });
  }
};

/**
 * Verified Rollback:
 * Reverts only documents modified by a specific migration run,
 * verifying that the document still contains the exact hospital value applied by that run,
 * and restoring the document's original state (missing vs null vs previous value).
 */
export const runRollback = async (options = {}) => {
  const {
    manifestPath = null,
    shouldCloseConnection = true,
    connect = true,
  } = options;

  if (connect && mongoose.connection.readyState !== 1) {
    await connectDB();
  }

  try {
    ensureManifestsDir();
    let targetManifestPath = manifestPath;

    if (!targetManifestPath) {
      const latestPointer = path.join(MANIFESTS_DIR, 'latest_manifest.json');
      if (fs.existsSync(latestPointer)) {
        const pointer = JSON.parse(fs.readFileSync(latestPointer, 'utf-8'));
        const latest = pointer?.latest;

        if (
          typeof latest !== 'string' ||
          latest !== path.basename(latest) ||
          !latest.startsWith('migration_manifest_run_') ||
          !latest.endsWith('.json')
        ) {
          throw new Error('Invalid migration manifest filename');
        }

        const resolvedManifestPath = path.resolve(MANIFESTS_DIR, latest);
        const resolvedManifestDir = path.resolve(MANIFESTS_DIR);

        if (path.dirname(resolvedManifestPath) !== resolvedManifestDir) {
          throw new Error('Migration manifest path escapes manifest directory');
        }

        targetManifestPath = resolvedManifestPath;
      }
    }

    if (!targetManifestPath || !fs.existsSync(targetManifestPath)) {
      console.log(`[INFO] No migration manifest found at ${targetManifestPath || 'default path'}. Nothing to roll back.`);
      return { revertedBookings: 0, skippedBookings: 0, revertedVisits: 0, skippedVisits: 0 };
    }

    const manifestData = JSON.parse(fs.readFileSync(targetManifestPath, 'utf-8'));
    const { runId, executedAt, integrityChecksum, payload } = manifestData;

    // Verify manifest payload integrity using SHA-256
    const calculatedChecksum = crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
    if (calculatedChecksum !== integrityChecksum) {
      throw new Error(`Migration manifest integrity check failed for run ${runId}! Checksum mismatch.`);
    }

    console.log(`MediSync Migration: Rollback Run [${runId}]`);
    console.log(`Executed At: ${executedAt}`);
    console.log(`Tracked Bookings: ${payload.modifiedBookings?.length || 0}`);
    console.log(`Tracked Visits:   ${payload.modifiedVisits?.length || 0}`);

    let revertedBookings = 0;
    let skippedBookings = 0;

    for (const item of payload.modifiedBookings || []) {
      const targetDoc = await Booking.findById(item.id).lean();
      if (!targetDoc || targetDoc.hospital?.toString() !== item.appliedHospital) {
        skippedBookings++;
        continue;
      }

      if (item.previousState === 'missing') {
        const res = await Booking.updateOne(
          { _id: item.id, hospital: new mongoose.Types.ObjectId(item.appliedHospital) },
          { $unset: { hospital: '' } }
        );
        if (res.modifiedCount > 0) revertedBookings++;
        else skippedBookings++;
      } else if (item.previousState === 'null') {
        const res = await Booking.updateOne(
          { _id: item.id, hospital: new mongoose.Types.ObjectId(item.appliedHospital) },
          { $set: { hospital: null } }
        );
        if (res.modifiedCount > 0) revertedBookings++;
        else skippedBookings++;
      } else if (item.previousState === 'value' && item.previousHospital) {
        const res = await Booking.updateOne(
          { _id: item.id, hospital: new mongoose.Types.ObjectId(item.appliedHospital) },
          { $set: { hospital: new mongoose.Types.ObjectId(item.previousHospital) } }
        );
        if (res.modifiedCount > 0) revertedBookings++;
        else skippedBookings++;
      }
    }

    let revertedVisits = 0;
    let skippedVisits = 0;

    for (const item of payload.modifiedVisits || []) {
      const targetDoc = await Visit.findById(item.id).lean();
      if (!targetDoc || targetDoc.hospital?.toString() !== item.appliedHospital) {
        skippedVisits++;
        continue;
      }

      if (item.previousState === 'missing') {
        const res = await Visit.updateOne(
          { _id: item.id, hospital: new mongoose.Types.ObjectId(item.appliedHospital) },
          { $unset: { hospital: '' } }
        );
        if (res.modifiedCount > 0) revertedVisits++;
        else skippedVisits++;
      } else if (item.previousState === 'null') {
        const res = await Visit.updateOne(
          { _id: item.id, hospital: new mongoose.Types.ObjectId(item.appliedHospital) },
          { $set: { hospital: null } }
        );
        if (res.modifiedCount > 0) revertedVisits++;
        else skippedVisits++;
      } else if (item.previousState === 'value' && item.previousHospital) {
        const res = await Visit.updateOne(
          { _id: item.id, hospital: new mongoose.Types.ObjectId(item.appliedHospital) },
          { $set: { hospital: new mongoose.Types.ObjectId(item.previousHospital) } }
        );
        if (res.modifiedCount > 0) revertedVisits++;
        else skippedVisits++;
      }
    }

    console.log('--- Rollback Summary ---');
    console.log(`Bookings reverted: ${revertedBookings} (Skipped/Changed: ${skippedBookings})`);
    console.log(`Visits reverted:   ${revertedVisits} (Skipped/Changed: ${skippedVisits})`);

    return { revertedBookings, skippedBookings, revertedVisits, skippedVisits };
  } finally {
    if (shouldCloseConnection && mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  }
};

/**
 * Migration Execution:
 * Scans Bookings and Visits, strictly validates all relationships,
 * writes an upfront recovery manifest before applying writes,
 * and performs guarded single-document updates when --apply is specified.
 */
export const runMigration = async (options = {}) => {
  const isApply = options.isApply ?? process.argv.includes('--apply');
  const isRollback = options.isRollback ?? process.argv.includes('--rollback');
  const isDryRun = !isApply && !isRollback;
  const shouldCloseConnection = options.shouldCloseConnection ?? true;
  const connect = options.connect ?? true;

  if (isRollback) {
    return runRollback({ shouldCloseConnection, connect });
  }

  if (connect && mongoose.connection.readyState !== 1) {
    await connectDB();
  }

  try {
    const runId = `run_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    console.log(`MediSync Migration: Populate Hospital References (Step 3.4)`);
    console.log(`Run ID:         ${runId}`);
    console.log(`Execution Mode: ${isDryRun ? 'DRY-RUN (Zero Writes)' : 'APPLY (Guarded Live Updates)'}`);

    // Pre-load reference maps for validation
    const [activeHospitals, doctors, patients, patientHospitals] = await Promise.all([
      Hospital.find({ status: 'active', deletedAt: null }).select('_id name code status').lean(),
      Doctor.find({ deletedAt: null }).select('_id name hospitalId status').lean(),
      Patient.find({ deletedAt: null }).select('_id user').lean(),
      PatientHospital.find({ status: 'active' }).select('patient hospital').lean(),
    ]);

    const activeHospitalSet = new Set(activeHospitals.map((h) => h._id.toString()));
    const doctorMap = new Map(doctors.map((d) => [d._id.toString(), d]));
    const patientByUserMap = new Map(patients.filter((p) => p.user).map((p) => [p.user.toString(), p]));
    const patientHospitalSet = new Set(
      patientHospitals.map((ph) => `${ph.patient.toString()}_${ph.hospital.toString()}`)
    );

    const stats = {
      bookings: {
        total: 0,
        alreadyHasValidHospital: 0,
        invalidExistingHospital: [],
        inconsistentExistingHospital: [],
        migratable: 0,
        updated: 0,
        missingDoctor: [],
        unresolvableDoctorHospital: [],
        missingPatientProfile: [],
        missingPatientHospitalAffiliation: [],
      },
      visits: {
        total: 0,
        alreadyHasValidHospital: 0,
        invalidExistingHospital: [],
        inconsistentExistingHospital: [],
        migratable: 0,
        updated: 0,
        missingBooking: [],
        bookingDivergence: [],
        unresolvableHospital: [],
        missingDoctor: [],
        unresolvableDoctorHospital: [],
        doctorHospitalMismatch: [],
        inconsistentLinkedBooking: [],
      },
    };

    // -----------------------------------------------------------------
    // 1. Process Bookings in Batches
    // -----------------------------------------------------------------
    const bookingCursor = Booking.find({}).cursor({ batchSize: BATCH_SIZE });
    const bookingUpdates = [];

    for await (const booking of bookingCursor) {
      stats.bookings.total++;
      const bId = booking._id.toString();

      // Check existing hospital reference
      if (booking.hospital) {
        const existingHospId = booking.hospital.toString();
        if (!activeHospitalSet.has(existingHospId)) {
          stats.bookings.invalidExistingHospital.push({
            id: bId,
            hospital: existingHospId,
            reason: 'Assigned hospital does not exist or is inactive',
          });
          continue;
        }

        // Full relationship validation for existing hospital
        const doc = booking.doctor ? doctorMap.get(booking.doctor.toString()) : null;
        if (!doc || !doc.hospitalId || doc.hospitalId.toString() !== existingHospId) {
          stats.bookings.inconsistentExistingHospital.push({
            id: bId,
            reason: 'Doctor does not belong to booking hospital',
          });
          continue;
        }

        const pUser = booking.patient ? booking.patient.toString() : null;
        const pProf = pUser ? patientByUserMap.get(pUser) : null;
        if (!pProf) {
          stats.bookings.inconsistentExistingHospital.push({
            id: bId,
            reason: 'Patient profile not found for booking patient user',
          });
          continue;
        }

        const relKey = `${pProf._id.toString()}_${existingHospId}`;
        if (!patientHospitalSet.has(relKey)) {
          stats.bookings.inconsistentExistingHospital.push({
            id: bId,
            reason: 'Patient is not actively affiliated with booking hospital in PatientHospital',
          });
          continue;
        }

        stats.bookings.alreadyHasValidHospital++;
        continue;
      }

      // Hospital is missing/null -> Validate eligibility for migration
      const docId = booking.doctor ? booking.doctor.toString() : null;
      const doctor = docId ? doctorMap.get(docId) : null;

      if (!doctor) {
        stats.bookings.missingDoctor.push(bId);
        continue;
      }

      // Legacy unassigned doctor safeguard: never guess an arbitrary hospital
      const targetHospitalId = doctor.hospitalId ? doctor.hospitalId.toString() : null;
      if (!targetHospitalId || !activeHospitalSet.has(targetHospitalId)) {
        stats.bookings.unresolvableDoctorHospital.push(bId);
        continue;
      }

      // Verify Patient profile exists
      const pUserId = booking.patient ? booking.patient.toString() : null;
      const patientProfile = pUserId ? patientByUserMap.get(pUserId) : null;
      if (!patientProfile) {
        stats.bookings.missingPatientProfile.push(bId);
        continue;
      }

      // Verify active PatientHospital affiliation
      const relationKey = `${patientProfile._id.toString()}_${targetHospitalId}`;
      if (!patientHospitalSet.has(relationKey)) {
        stats.bookings.missingPatientHospitalAffiliation.push(bId);
        continue;
      }

      // All checks passed -> Eligible for migration
      stats.bookings.migratable++;
      bookingUpdates.push({
        id: booking._id,
        previousState: booking.hospital === undefined ? 'missing' : 'null',
        previousHospital: booking.hospital || null,
        appliedHospital: doctor.hospitalId,
      });
    }

    // -----------------------------------------------------------------
    // 2. Process Visits in Batches
    // -----------------------------------------------------------------
    const visitCursor = Visit.find({}).cursor({ batchSize: BATCH_SIZE });
    const visitUpdates = [];

    for await (const visit of visitCursor) {
      stats.visits.total++;
      const vId = visit._id.toString();

      // Check existing hospital reference
      if (visit.hospital) {
        const existingHospId = visit.hospital.toString();
        if (!activeHospitalSet.has(existingHospId)) {
          stats.visits.invalidExistingHospital.push({
            id: vId,
            hospital: existingHospId,
            reason: 'Assigned hospital does not exist or is inactive',
          });
          continue;
        }

        // Doctor validation: Must exist, have hospitalId, and match existing visit hospital
        const doc = visit.doctor ? doctorMap.get(visit.doctor.toString()) : null;
        if (!doc || !doc.hospitalId || doc.hospitalId.toString() !== existingHospId) {
          stats.visits.inconsistentExistingHospital.push({
            id: vId,
            reason: 'Doctor does not exist or does not belong to visit hospital',
          });
          continue;
        }

        // Linked Booking validation: Must exist, have matching hospital, patient, and doctor
        const linkedBooking = visit.booking ? await Booking.findById(visit.booking).lean() : null;
        if (!linkedBooking) {
          stats.visits.inconsistentExistingHospital.push({
            id: vId,
            reason: 'Linked booking not found',
          });
          continue;
        }

        if (!linkedBooking.hospital || linkedBooking.hospital.toString() !== existingHospId) {
          stats.visits.inconsistentExistingHospital.push({
            id: vId,
            reason: 'Linked booking has no hospital or differs from visit hospital',
          });
          continue;
        }

        if (visit.patient?.toString() !== linkedBooking.patient?.toString()) {
          stats.visits.inconsistentExistingHospital.push({
            id: vId,
            reason: 'Visit patient differs from linked booking patient',
          });
          continue;
        }

        if (visit.doctor?.toString() !== linkedBooking.doctor?.toString()) {
          stats.visits.inconsistentExistingHospital.push({
            id: vId,
            reason: 'Visit doctor differs from linked booking doctor',
          });
          continue;
        }

        // Patient profile & active PatientHospital affiliation validation
        const pUser = visit.patient ? visit.patient.toString() : null;
        const pProf = pUser ? patientByUserMap.get(pUser) : null;
        if (!pProf) {
          stats.visits.inconsistentExistingHospital.push({
            id: vId,
            reason: 'Patient profile not found for visit patient user',
          });
          continue;
        }

        const relKey = `${pProf._id.toString()}_${existingHospId}`;
        if (!patientHospitalSet.has(relKey)) {
          stats.visits.inconsistentExistingHospital.push({
            id: vId,
            reason: 'Patient is not actively affiliated with visit hospital in PatientHospital',
          });
          continue;
        }

        stats.visits.alreadyHasValidHospital++;
        continue;
      }

      // Hospital is missing/null -> Validate eligibility for migration
      // Requirement 1: Doctor must exist and have a valid hospitalId
      const doc = visit.doctor ? doctorMap.get(visit.doctor.toString()) : null;
      if (!doc) {
        stats.visits.missingDoctor.push(vId);
        continue;
      }
      if (!doc.hospitalId || !activeHospitalSet.has(doc.hospitalId.toString())) {
        stats.visits.unresolvableDoctorHospital.push(vId);
        continue;
      }

      // Requirement 2: Linked Booking must exist
      const linkedBooking = visit.booking ? await Booking.findById(visit.booking).lean() : null;
      if (!linkedBooking) {
        stats.visits.missingBooking.push(vId);
        continue;
      }

      // Requirement 3: Visit and Booking patient and doctor must match
      if (visit.patient?.toString() !== linkedBooking.patient?.toString() ||
          visit.doctor?.toString() !== linkedBooking.doctor?.toString()) {
        stats.visits.bookingDivergence.push(vId);
        continue;
      }

      // Requirement 4: Visit hospital MUST come exclusively from validated linkedBooking.hospital
      const targetHospitalId = linkedBooking.hospital ? linkedBooking.hospital.toString() : null;
      if (!targetHospitalId || !activeHospitalSet.has(targetHospitalId)) {
        stats.visits.unresolvableHospital.push(vId);
        continue;
      }

      // Requirement 5: Doctor's hospital MUST match the linked booking hospital
      if (doc.hospitalId.toString() !== targetHospitalId) {
        stats.visits.doctorHospitalMismatch.push(vId);
        continue;
      }

      // Requirement 6: Linked Booking itself MUST pass all relationship checks (Doctor, Patient profile, PatientHospital)
      const bDoc = linkedBooking.doctor ? doctorMap.get(linkedBooking.doctor.toString()) : null;
      if (!bDoc || !bDoc.hospitalId || bDoc.hospitalId.toString() !== targetHospitalId) {
        stats.visits.inconsistentLinkedBooking.push(vId);
        continue;
      }

      const pUser = linkedBooking.patient ? linkedBooking.patient.toString() : null;
      const pProf = pUser ? patientByUserMap.get(pUser) : null;
      if (!pProf) {
        stats.visits.inconsistentLinkedBooking.push(vId);
        continue;
      }

      const relKey = `${pProf._id.toString()}_${targetHospitalId}`;
      if (!patientHospitalSet.has(relKey)) {
        stats.visits.inconsistentLinkedBooking.push(vId);
        continue;
      }

      // All checks passed -> Eligible for migration
      stats.visits.migratable++;
      visitUpdates.push({
        id: visit._id,
        previousState: visit.hospital === undefined ? 'missing' : 'null',
        previousHospital: visit.hospital || null,
        appliedHospital: new mongoose.Types.ObjectId(targetHospitalId),
      });
    }

    // -----------------------------------------------------------------
    // 3. Write-Ahead Manifest & Guarded Writes if --apply is set
    // -----------------------------------------------------------------
    const successfulModifiedBookings = [];
    const successfulModifiedVisits = [];

    if (isApply) {
      ensureManifestsDir();
      const manifestFilename = `migration_manifest_${runId}.json`;
      const manifestPath = path.join(MANIFESTS_DIR, manifestFilename);

      // Write-Ahead Migration Log: Persist planned changes BEFORE any database writes
      const initialPayload = {
        status: 'in_progress',
        plannedBookings: bookingUpdates.map((b) => ({
          id: b.id.toString(),
          previousState: b.previousState,
          previousHospital: b.previousHospital ? b.previousHospital.toString() : null,
          appliedHospital: b.appliedHospital.toString(),
        })),
        plannedVisits: visitUpdates.map((v) => ({
          id: v.id.toString(),
          previousState: v.previousState,
          previousHospital: v.previousHospital ? v.previousHospital.toString() : null,
          appliedHospital: v.appliedHospital.toString(),
        })),
        modifiedBookings: [],
        modifiedVisits: [],
      };

      const initialChecksum = crypto.createHash('sha256').update(JSON.stringify(initialPayload)).digest('hex');
      fs.writeFileSync(
        manifestPath,
        JSON.stringify(
          {
            runId,
            executedAt: new Date().toISOString(),
            integrityChecksum: initialChecksum,
            payload: initialPayload,
          },
          null,
          2
        )
      );

      // Update latest manifest pointer
      fs.writeFileSync(
        path.join(MANIFESTS_DIR, 'latest_manifest.json'),
        JSON.stringify({ latest: manifestFilename, runId }, null, 2)
      );
      console.log(`[INFO] Write-Ahead Manifest initialized at: ${manifestPath}`);

      console.log(`Applying guarded updates to database...`);

      for (const bUp of bookingUpdates) {
        const res = await Booking.updateOne(
          {
            _id: bUp.id,
            $or: [{ hospital: null }, { hospital: { $exists: false } }],
          },
          { $set: { hospital: bUp.appliedHospital } }
        );
        if (res.modifiedCount > 0) {
          stats.bookings.updated++;
          successfulModifiedBookings.push({
            id: bUp.id.toString(),
            previousState: bUp.previousState,
            previousHospital: bUp.previousHospital ? bUp.previousHospital.toString() : null,
            appliedHospital: bUp.appliedHospital.toString(),
          });
        }
      }

      for (const vUp of visitUpdates) {
        const res = await Visit.updateOne(
          {
            _id: vUp.id,
            $or: [{ hospital: null }, { hospital: { $exists: false } }],
          },
          { $set: { hospital: vUp.appliedHospital } }
        );
        if (res.modifiedCount > 0) {
          stats.visits.updated++;
          successfulModifiedVisits.push({
            id: vUp.id.toString(),
            previousState: vUp.previousState,
            previousHospital: vUp.previousHospital ? vUp.previousHospital.toString() : null,
            appliedHospital: vUp.appliedHospital.toString(),
          });
        }
      }

      // Finalize manifest with actual successful updates and updated SHA-256 integrity checksum
      const finalPayload = {
        status: 'completed',
        plannedBookings: initialPayload.plannedBookings,
        plannedVisits: initialPayload.plannedVisits,
        modifiedBookings: successfulModifiedBookings,
        modifiedVisits: successfulModifiedVisits,
      };
      const finalChecksum = crypto.createHash('sha256').update(JSON.stringify(finalPayload)).digest('hex');
      const finalManifest = {
        runId,
        executedAt: new Date().toISOString(),
        integrityChecksum: finalChecksum,
        payload: finalPayload,
      };

      fs.writeFileSync(manifestPath, JSON.stringify(finalManifest, null, 2));
      console.log(`[INFO] Migration manifest finalized with integrity checksum: ${manifestPath}`);
    }

    // -----------------------------------------------------------------
    // 4. Output Migration Results (Zero PII / Sensitive Data)
    // -----------------------------------------------------------------
    console.log('--- Migration Summary Report ---');
    console.log(`Mode:                                    ${isDryRun ? 'DRY-RUN' : 'APPLY'}`);
    console.log(`Total Bookings Scanned:                  ${stats.bookings.total}`);
    console.log(`Bookings Already Having Valid Hospital:  ${stats.bookings.alreadyHasValidHospital}`);
    console.log(`Bookings With Invalid Existing Hospital: ${stats.bookings.invalidExistingHospital.length}`);
    console.log(`Bookings With Inconsistent Hospital:     ${stats.bookings.inconsistentExistingHospital.length}`);
    console.log(`Bookings Migratable:                     ${stats.bookings.migratable}`);
    console.log(`Bookings Updated:                        ${stats.bookings.updated}`);
    console.log(`Bookings Missing Doctor:                 ${stats.bookings.missingDoctor.length}`);
    console.log(`Bookings With Unresolvable Hospital:     ${stats.bookings.unresolvableDoctorHospital.length}`);
    console.log(`Bookings Missing Patient Profile:        ${stats.bookings.missingPatientProfile.length}`);
    console.log(`Bookings Missing PatientHospital Rel:    ${stats.bookings.missingPatientHospitalAffiliation.length}`);

    console.log(`\nTotal Visits Scanned:                    ${stats.visits.total}`);
    console.log(`Visits Already Having Valid Hospital:    ${stats.visits.alreadyHasValidHospital}`);
    console.log(`Visits With Invalid Existing Hospital:   ${stats.visits.invalidExistingHospital.length}`);
    console.log(`Visits With Inconsistent Hospital:       ${stats.visits.inconsistentExistingHospital.length}`);
    console.log(`Visits Migratable:                       ${stats.visits.migratable}`);
    console.log(`Visits Updated:                          ${stats.visits.updated}`);
    console.log(`Visits Missing Booking:                  ${stats.visits.missingBooking.length}`);
    console.log(`Visits Diverging From Linked Booking:    ${stats.visits.bookingDivergence.length}`);
    console.log(`Visits With Missing Doctor:              ${stats.visits.missingDoctor.length}`);
    console.log(`Visits With Unresolvable Doctor Hospital:${stats.visits.unresolvableDoctorHospital.length}`);
    console.log(`Visits With Unresolvable Hospital:       ${stats.visits.unresolvableHospital.length}`);
    console.log(`Visits With Doctor Hospital Mismatch:    ${stats.visits.doctorHospitalMismatch.length}`);
    console.log(`Visits Inconsistent Linked Booking:      ${stats.visits.inconsistentLinkedBooking.length}`);

    if (stats.bookings.invalidExistingHospital.length > 0) {
      console.log(`\nQuarantine Log (Bookings invalid existing):`, stats.bookings.invalidExistingHospital);
    }
    if (stats.bookings.inconsistentExistingHospital.length > 0) {
      console.log(`Quarantine Log (Bookings inconsistent existing):`, stats.bookings.inconsistentExistingHospital);
    }
    if (stats.visits.invalidExistingHospital.length > 0) {
      console.log(`Quarantine Log (Visits invalid existing):`, stats.visits.invalidExistingHospital);
    }
    if (stats.visits.inconsistentExistingHospital.length > 0) {
      console.log(`Quarantine Log (Visits inconsistent existing):`, stats.visits.inconsistentExistingHospital);
    }
    if (stats.bookings.unresolvableDoctorHospital.length > 0) {
      console.log(`\nQuarantine Log (Bookings unresolvable doctor hospital): [${stats.bookings.unresolvableDoctorHospital.join(', ')}]`);
    }
    if (stats.visits.unresolvableHospital.length > 0) {
      console.log(`Quarantine Log (Visits unresolvable hospital): [${stats.visits.unresolvableHospital.join(', ')}]`);
    }

    if (isDryRun) {
      console.log('\n[NOTICE] Dry-run completed. Zero database modifications performed.');
      console.log('To apply changes when ready, invoke explicitly with: node src/scripts/migrateHospitalReferences.js --apply');
      console.log('To roll back applied changes if needed: node src/scripts/migrateHospitalReferences.js --rollback');
    } else {
      console.log(`\n[SUCCESS] Live migration completed. ${stats.bookings.updated} bookings and ${stats.visits.updated} visits updated.`);
    }

    console.log('===============================================================\n');

    return { stats, runId };
  } finally {
    if (shouldCloseConnection && mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  }
};

// Auto-run if executed directly via CLI
if (process.argv[1] && process.argv[1].endsWith('migrateHospitalReferences.js')) {
  runMigration().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
}
