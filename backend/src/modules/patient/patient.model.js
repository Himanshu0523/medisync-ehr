import mongoose from 'mongoose';

const { Schema, model } = mongoose;

// Reusable emergency contact
const emergencyContactSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    relationship: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    mobile: {
      type: String,
      trim: true,
      match: [/^[0-9]{10,15}$/, 'Invalid emergency contact number'],
    },
  },
  { _id: false }
);

// Patient allergy information
const allergySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    reaction: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe', 'unknown'],
      default: 'unknown',
    },
  },
  { _id: false }
);

// Main Patient schema
const patientSchema = new Schema(
  {
    // Optional login account
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    dateOfBirth: {
      type: Date,
      validate: {
        validator(value) {
          return !value || value <= new Date();
        },
        message: 'Date of birth cannot be in the future',
      },
    },

    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say'],
    },

    bloodGroup: {
      type: String,
      enum: [
        'A+',
        'A-',
        'B+',
        'B-',
        'AB+',
        'AB-',
        'O+',
        'O-',
        'unknown',
      ],
      default: 'unknown',
    },

    address: {
      street: { type: String, trim: true, maxlength: 200 },
      city: { type: String, trim: true, maxlength: 100 },
      state: { type: String, trim: true, maxlength: 100 },
      postalCode: { type: String, trim: true, maxlength: 15 },
      country: { type: String, trim: true, default: 'India' },
    },

    emergencyContact: {
      type: emergencyContactSchema,
      default: undefined,
    },

    allergies: {
      type: [allergySchema],
      default: [],
    },

    chronicConditions: {
      type: [String],
      default: [],
    },

    medicalHistory: {
      type: [String],
      default: [],
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// One Patient per linked User account.
// Multiple patients without a User account are allowed.
patientSchema.index(
  { user: 1 },
  {
    unique: true,
    partialFilterExpression: {
      user: { $type: 'objectId' },
    },
  }
);

patientSchema.index({ deletedAt: 1 });
patientSchema.index({ dateOfBirth: 1 });

export default model('Patient', patientSchema);
