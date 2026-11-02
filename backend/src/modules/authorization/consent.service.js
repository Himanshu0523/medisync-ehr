import crypto from 'crypto';
import ClinicalConsent from './consent.model.js';
import Doctor from '../doctor/doctor.model.js';
import Hospital from '../hospital/hospital.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { hashToken } from '../../utils/tokens.js';

/**
 * Patient grants time-bound, cryptographic consent for a Doctor at Hospital B
 * to inspect clinical encounters originally recorded at Hospital A.
 */
export const grantClinicalConsent = async ({
  patientUser,
  granteeDoctorId,
  sourceHospitalId,
  durationHours = 24,
  purpose = 'Cross-Hospital Medical Consultation',
}) => {
  if (!patientUser || patientUser.role !== 'patient') {
    throw new ApiError(403, 'Only patients can grant clinical consent for their medical records');
  }

  const doctor = await Doctor.findOne({ _id: granteeDoctorId, status: 'active', deletedAt: null });
  if (!doctor || !doctor.hospitalId) {
    throw new ApiError(404, 'Grantee doctor not found or has no active hospital assignment');
  }

  const sourceHosp = await Hospital.findOne({ _id: sourceHospitalId, status: 'active', deletedAt: null });
  if (!sourceHosp) {
    throw new ApiError(404, 'Source hospital facility not found or inactive');
  }

  // Generate high-entropy one-time access token for cryptographic proof
  const rawConsentToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawConsentToken);

  const expiresAt = new Date(Date.now() + Math.max(1, Math.min(72, Number(durationHours))) * 60 * 60 * 1000);

  const consent = await ClinicalConsent.create({
    patient: patientUser._id,
    granteeDoctor: doctor._id,
    sourceHospital: sourceHosp._id,
    targetHospital: doctor.hospitalId,
    tokenHash,
    expiresAt,
    purpose,
  });

  return {
    consentId: consent._id,
    rawConsentToken,
    expiresAt,
    doctor: { id: doctor._id, name: doctor.name },
    sourceHospital: { id: sourceHosp._id, name: sourceHosp.name },
  };
};

/**
 * Validates whether an active cross-hospital consent grant exists.
 */
export const hasValidCrossHospitalConsent = async ({
  patientUserId,
  doctorId,
  hospitalId,
}) => {
  const activeConsent = await ClinicalConsent.findOne({
    patient: patientUserId,
    granteeDoctor: doctorId,
    sourceHospital: hospitalId,
    expiresAt: { $gt: new Date() },
    revokedAt: null,
  });

  return Boolean(activeConsent);
};
