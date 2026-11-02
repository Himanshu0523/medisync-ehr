import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const addressSchema = new Schema(
  {
    street: { type: String, trim: true, maxlength: 200 },
    city: { type: String, trim: true, maxlength: 100 },
    state: { type: String, trim: true, maxlength: 100 },
    postalCode: { type: String, trim: true, maxlength: 15 },
    country: { type: String, trim: true, default: 'India' },
  },
  { _id: false }
);

const hospitalSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Hospital name is required'],
      trim: true,
      maxlength: 150,
    },
    code: {
      type: String,
      required: [true, 'Unique hospital code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      match: [/^[A-Z0-9_-]{2,20}$/, 'Hospital code must be alphanumeric 2-20 characters'],
    },
    email: {
      type: String,
      required: [true, 'Hospital primary email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Valid hospital email required'],
    },
    contactNumber: {
      type: String,
      required: [true, 'Hospital primary contact number is required'],
      trim: true,
      match: [/^[0-9]{10,15}$/, 'Contact number must be 10-15 digits'],
    },
    address: {
      type: addressSchema,
      default: () => ({}),
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

hospitalSchema.index({ name: 1 });
hospitalSchema.index({ status: 1, deletedAt: 1 });

export default model('Hospital', hospitalSchema);
