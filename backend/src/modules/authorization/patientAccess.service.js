import mongoose from 'mongoose';
import { ApiError } from '../../utils/ApiError.js';
import Patient from '../patient/patient.model.js';
import PatientHospital from '../patientHospital/patientHospital.model.js';

/**
 * 3.3.6: Verify patient has an active registration relationship with the specified hospital
 * @param {Object} params
 * @param {string|mongoose.Types.ObjectId} params.patientId - Patient profile ID or linked User ID
 * @param {string|mongoose.Types.ObjectId} params.hospitalId - Hospital facility ID
 * @returns {Promise<{ patient: Object, patientHospital: Object }>}
 */
export const requirePatientHospitalAccess = async ({ patientId, hospitalId }) => {
  if (!patientId || !mongoose.isValidObjectId(patientId)) {
    throw new ApiError(400, 'Invalid or missing patient ID');
  }

  if (!hospitalId || !mongoose.isValidObjectId(hospitalId)) {
    throw new ApiError(400, 'Invalid or missing hospital ID');
  }

  // Support patientId as either Patient._id or linked User._id
  let patient = await Patient.findOne({ _id: patientId, deletedAt: null });
  if (!patient) {
    patient = await Patient.findOne({ user: patientId, deletedAt: null });
  }

  if (!patient) {
    throw new ApiError(404, 'Patient profile not found or inactive');
  }

  const patientHospital = await PatientHospital.findOne({
    patient: patient._id,
    hospital: hospitalId,
    status: 'active',
  });

  if (!patientHospital) {
    throw new ApiError(
      403,
      'Access denied: Patient is not registered or active with this hospital facility'
    );
  }

  return { patient, patientHospital };
};

/**
 * 3.3.7: Verify that the authenticated patient owns the requested patient profile
 * @param {Object} params
 * @param {string|mongoose.Types.ObjectId} params.patientId - Target Patient ID or User ID
 * @param {Object} params.user - Authenticated User object (req.user)
 * @returns {Promise<Object>} Authorized Patient document
 */
export const requirePatientOwnership = async ({ patientId, user }) => {
  if (!user) {
    throw new ApiError(401, 'Authentication required');
  }

  if (!patientId || !mongoose.isValidObjectId(patientId)) {
    throw new ApiError(400, 'Invalid or missing patient ID');
  }

  let patient = await Patient.findOne({ _id: patientId, deletedAt: null });
  if (!patient) {
    patient = await Patient.findOne({ user: patientId, deletedAt: null });
  }

  if (!patient) {
    throw new ApiError(404, 'Patient record not found');
  }

  // Patients can strictly only view/modify their own record
  if (user.role === 'patient') {
    if (!patient.user || patient.user.toString() !== user._id.toString()) {
      throw new ApiError(403, 'Access denied: You can only access your own patient profile');
    }
  }

  return patient;
};
