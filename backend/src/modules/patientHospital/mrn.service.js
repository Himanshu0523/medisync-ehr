import Counter from './counter.model.js';
import Hospital from '../hospital/hospital.model.js';
import { ApiError } from '../../utils/ApiError.js';

/**
 * Concurrency-safe atomic MRN generation scoped per hospital.
 * Uses atomic $inc with upsert to prevent collision under parallel requests.
 * Format: {HOSPITAL_CODE}-{000001}
 */
export const generateNextMRN = async (hospitalId, explicitCode = null) => {
  let prefix = explicitCode;
  if (!prefix) {
    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) {
      throw new ApiError(404, 'Hospital entity not found for MRN generation');
    }
    prefix = hospital.code;
  }

  const counter = await Counter.findOneAndUpdate(
    { hospital: hospitalId, key: 'mrn' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const paddedSeq = String(counter.seq).padStart(6, '0');
  return `${prefix.toUpperCase()}-${paddedSeq}`;
};
