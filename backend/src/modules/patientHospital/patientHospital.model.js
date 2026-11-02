import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const patientHospitalSchema = new Schema(
  {
    patient: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true,
    },

    hospital: {
      type: Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true,
      index: true,
    },

    medicalRecordNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 30,
    },

    registeredBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    firstVisitAt: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  { timestamps: true }
);

// A patient should have only one relationship with a particular hospital.
patientHospitalSchema.index(
  { patient: 1, hospital: 1 },
  { unique: true }
);

// MRN must be unique within its hospital.
patientHospitalSchema.index(
  { hospital: 1, medicalRecordNumber: 1 },
  { unique: true }
);

// Efficient hospital patient-directory queries.
patientHospitalSchema.index({ hospital: 1, status: 1 });

export default model('PatientHospital', patientHospitalSchema);
