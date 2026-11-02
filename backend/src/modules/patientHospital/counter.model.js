import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const counterSchema = new Schema(
  {
    hospital: {
      type: Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true,
      index: true,
    },
    key: {
      type: String,
      required: true,
      default: 'mrn',
    },
    seq: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

counterSchema.index({ hospital: 1, key: 1 }, { unique: true });

export default model('Counter', counterSchema);
