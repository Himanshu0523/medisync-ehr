import mongoose from 'mongoose';

const consentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    granteeDoctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
      index: true,
    },
    sourceHospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true,
    },
    targetHospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true,
    },
    scope: {
      type: [String],
      enum: ['visits', 'prescriptions', 'diagnostic_reports'],
      default: ['visits', 'prescriptions', 'diagnostic_reports'],
    },
    tokenHash: {
      type: String,
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index auto-deletes expired consents
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    purpose: {
      type: String,
      trim: true,
      default: 'Cross-Hospital Medical Consultation',
    },
  },
  { timestamps: true }
);

consentSchema.index({ patient: 1, granteeDoctor: 1, expiresAt: 1, revokedAt: 1 });

export default mongoose.model('ClinicalConsent', consentSchema);
