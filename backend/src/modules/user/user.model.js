import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES } from '../auth/auth.constants.js';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    mobile: {
      type: String, required: true, unique: true, trim: true,
      match: [/^[0-9]{10,15}$/, 'Invalid mobile'],
    },
    email: {
      type: String, required: true, unique: true, lowercase: true, trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email'],
    },
    password: { type: String, required: true, select: false, minlength: 8 },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.PATIENT,
      index: true,
    },
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending'],
      default: 'active',
    },

    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },

    invitationTokenHash: { type: String, select: false },
    invitationExpiresAt: { type: Date, select: false },

    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },

    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },

    lastLoginAt: { type: Date },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.index({ deletedAt: 1 });
userSchema.index({ hospitalId: 1, role: 1 });
userSchema.index({ hospitalId: 1, status: 1 });


userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.isLocked = function () {
  return this.lockUntil && this.lockUntil > new Date();
};

export default mongoose.model('User', userSchema);