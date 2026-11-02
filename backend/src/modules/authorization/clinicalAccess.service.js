import mongoose from 'mongoose';
import { ApiError } from '../../utils/ApiError.js';
import Doctor from '../doctor/doctor.model.js';
import Booking from '../booking/booking.model.js';
import Visit from '../visit/visit.model.js';
import VisitDisease from '../visitDisease/visitDisease.model.js';
import Patient from '../patient/patient.model.js';
import { requirePatientHospitalAccess } from './patientAccess.service.js';
import { ROLES } from '../auth/auth.constants.js';

/**
 * Resolves and validates an authenticated doctor's profile and credentials.
 * Enforces MediSync's clinical authorization policy:
 * 1. Fails closed if Doctor profile does not exist.
 * 2. Fails closed if Doctor profile is soft-deleted (deletedAt != null).
 * 3. Requires doctor profile status to be 'active'.
 * 4. Requires doctor verificationStatus to be 'verified'.
 * 5. Requires doctor isApproved to be true.
 *
 * @param {Object} user - Authenticated user document (req.user)
 * @returns {Promise<Object>} Verified and approved Doctor document
 */
export const requireActiveVerifiedDoctor = async (user) => {
  if (!user || !user._id) {
    throw new ApiError(401, 'Authentication required');
  }

  // Look up doctor profile including soft-deleted to give precise error
  const doctor = await Doctor.findOne({ user: user._id });
  if (!doctor) {
    throw new ApiError(403, 'Doctor profile not found: You must have a registered doctor profile');
  }

  if (doctor.deletedAt != null) {
    throw new ApiError(403, 'Doctor profile not found: Doctor account has been deleted');
  }

  if (doctor.status !== 'active') {
    throw new ApiError(403, 'Doctor account is not active: Access to bookings and clinical records is disabled');
  }

  if (doctor.verificationStatus !== 'verified' || !doctor.isApproved) {
    throw new ApiError(
      403,
      'Clinical privileges withheld: Doctor must be verified and approved by hospital administration to access clinical records'
    );
  }

  // Fail closed: a doctor without a hospital assignment cannot access any
  // operational or clinical resources. This is enforced centrally so every
  // caller of this helper inherits the policy without individual call-site guards.
  if (!doctor.hospitalId) {
    throw new ApiError(
      403,
      'Doctor hospital assignment is missing: An active hospital affiliation is required to access clinical and operational resources'
    );
  }

  return doctor;
};

/**
 * 3.3.8: Validate doctor affiliation and active clinical privilege with a hospital facility
 * @param {Object} params
 * @param {string|mongoose.Types.ObjectId} params.doctorId - Doctor clinical profile ID or Doctor's linked User ID
 * @param {string|mongoose.Types.ObjectId} params.hospitalId - Assigned Hospital facility ID
 * @returns {Promise<Object>} Doctor document
 */
export const validateDoctorHospitalAffiliation = async ({ doctorId, hospitalId }) => {
  if (!doctorId || !mongoose.isValidObjectId(doctorId)) {
    throw new ApiError(400, 'Invalid or missing doctor ID');
  }

  if (!hospitalId || !mongoose.isValidObjectId(hospitalId)) {
    throw new ApiError(400, 'Invalid or missing hospital ID');
  }

  // Doctor ID may be Doctor._id or User._id (when coming from req.user)
  let doctor = await Doctor.findOne({ _id: doctorId, deletedAt: null });
  if (!doctor) {
    doctor = await Doctor.findOne({ user: doctorId, deletedAt: null });
  }

  if (!doctor) {
    throw new ApiError(404, 'Doctor profile not found or inactive');
  }

  // Validate doctor's primary facility matches requested hospital
  const docHospStr = doctor.hospitalId ? String(doctor.hospitalId._id || doctor.hospitalId) : null;
  const targetHospStr = hospitalId ? String(hospitalId._id || hospitalId) : null;
  if (!docHospStr || !targetHospStr || docHospStr !== targetHospStr) {
    throw new ApiError(403, 'Doctor is not affiliated with this hospital facility');
  }

  // Doctor must have passed credential review and hold active approval
  if (doctor.status !== 'active' || doctor.verificationStatus !== 'verified' || !doctor.isApproved) {
    throw new ApiError(
      403,
      'Clinical access withheld: Doctor credentials are not active, verified, and approved'
    );
  }

  return doctor;
};

/**
 * 3.3.9: Verify doctor has a legitimate care relationship with the patient at the hospital
 * @param {Object} params
 * @param {string|mongoose.Types.ObjectId} params.doctorId - Doctor clinical profile ID or User ID
 * @param {string|mongoose.Types.ObjectId} params.patientId - Patient ID or linked User ID
 * @param {string|mongoose.Types.ObjectId} params.hospitalId - Hospital facility ID
 * @returns {Promise<{ doctor: Object, patient: Object, careRelationship: Object }>}
 */
export const requireDoctorPatientAccess = async ({ doctorId, patientId, hospitalId }) => {
  // 1. Verify doctor's affiliation and credentials with this hospital
  const doctor = await validateDoctorHospitalAffiliation({ doctorId, hospitalId });

  // 2. Verify patient belongs to this hospital
  const { patient } = await requirePatientHospitalAccess({ patientId, hospitalId });

  // 3. Resolve possible patient IDs (Patient._id or linked User._id)
  const candidatePatientIds = [patient._id];
  if (patient.user) {
    candidatePatientIds.push(patient.user);
  }

  // 4. Check for an active care relationship (scheduled, confirmed, or completed encounter)
  const [booking, visit] = await Promise.all([
    Booking.findOne({
      doctor: doctor._id,
      patient: { $in: candidatePatientIds },
      status: { $in: ['pending', 'confirmed', 'completed'] },
    }).sort({ date: -1 }),
    Visit.findOne({
      doctor: doctor._id,
      patient: { $in: candidatePatientIds },
    }).sort({ date: -1 }),
  ]);

  if (!booking && !visit) {
    throw new ApiError(
      403,
      'Clinical access denied: No active booking or clinical care relationship exists with this patient'
    );
  }

  return {
    doctor,
    patient,
    careRelationship: visit || booking,
  };
};

/**
 * 3.3.10: Protect clinical records (diagnoses, prescriptions, medical records)
 * Ensures role-based clinical privacy and care relationship boundaries.
 * @param {Object} params
 * @param {string|mongoose.Types.ObjectId} params.visitId - Clinical Visit ID
 * @param {Object} params.user - Authenticated User (req.user)
 * @param {string|mongoose.Types.ObjectId} [params.hospitalId] - Trusted tenant Hospital ID (req.tenant?.hospitalId)
 * @returns {Promise<Object>} Authorized Visit document with populated relations
 */
export const requireClinicalRecordAccess = async ({ visitId, user, hospitalId }) => {
  if (!user) {
    throw new ApiError(401, 'Authentication required');
  }

  if (!visitId || !mongoose.isValidObjectId(visitId)) {
    throw new ApiError(400, 'Invalid or missing visit ID');
  }

  const visit = await Visit.findById(visitId)
    .populate('doctor')
    .populate('booking');

  if (!visit) {
    throw new ApiError(404, 'Clinical encounter not found');
  }

  // 1. Patient access: Must own the record
  if (user.role === ROLES.PATIENT) {
    const visitPatientStr = visit.patient ? String(visit.patient._id || visit.patient) : null;
    const userStr = String(user._id);
    const isDirectUser = visitPatientStr && visitPatientStr === userStr;
    if (!isDirectUser) {
      // Check if linked via Patient profile
      const patient = await Patient.findOne({ user: user._id, deletedAt: null });
      if (!patient || String(patient._id) !== visitPatientStr) {
        throw new ApiError(403, 'Access denied: You can only access your own clinical medical records');
      }
    }
    return visit;
  }

  // 2. Receptionist: Denied access to clinical diagnoses and prescriptions
  if (user.role === ROLES.RECEPTIONIST) {
    throw new ApiError(403, 'Reception staff are not authorized to view clinical diagnoses or prescriptions');
  }

  // 3. Super Admin: No automatic clinical record access
  if (user.role === ROLES.SUPER_ADMIN) {
    throw new ApiError(
      403,
      'Super Admin platform privileges do not grant direct access to private patient clinical records'
    );
  }

  // 4. Hospital Admin: Administrative overview only, no direct clinical diagnosis access
  if (user.role === ROLES.HOSPITAL_ADMIN || user.role === ROLES.ADMIN) {
    throw new ApiError(
      403,
      'Hospital administration access is limited to operational data; clinical medical notes are restricted'
    );
  }

  // 5. Doctor: Must be the treating doctor or have verified hospital care access
  if (user.role === ROLES.DOCTOR) {
    const doctorProfile = await Doctor.findOne({ user: user._id, deletedAt: null });
    if (!doctorProfile) {
      throw new ApiError(403, 'No doctor profile found for this account');
    }

    const activeHospitalId = hospitalId || user.hospitalId || doctorProfile.hospitalId;
    const visitHospitalStr = visit.hospital ? String(visit.hospital._id || visit.hospital) : null;
    const activeHospitalStr = activeHospitalId ? String(activeHospitalId._id || activeHospitalId) : null;

    if (!visitHospitalStr || !activeHospitalStr || visitHospitalStr !== activeHospitalStr) {
      // Check for active cryptographic cross-hospital consent before blocking
      const { hasValidCrossHospitalConsent } = await import('./consent.service.js');
      const hasConsent = await hasValidCrossHospitalConsent({
        patientUserId: visit.patient,
        doctorId: doctorProfile._id,
        hospitalId: visit.hospital,
      });

      if (!hasConsent) {
        throw new ApiError(
          403,
          'Cross-hospital access denied: You cannot access clinical records from a hospital facility you are no longer affiliated with'
        );
      }
    }

    const visitDocStr = visit.doctor ? String(visit.doctor._id || visit.doctor) : null;
    const isTreatingDoctor = visitDocStr && visitDocStr === String(doctorProfile._id);
    if (!isTreatingDoctor) {
      // If consulting cross-doctor, verify hospital affiliation and care relationship
      await requireDoctorPatientAccess({
        doctorId: doctorProfile._id,
        patientId: visit.patient,
        hospitalId: activeHospitalId,
      });
    }

    return visit;
  }

  throw new ApiError(403, 'Not authorized to access clinical records');
};
