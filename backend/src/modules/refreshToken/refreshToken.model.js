import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    family: { type: String, required: true, index: true },
    replacedByTokenHash: { type: String, default: null },
    userAgent: String,
    ip: String,
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Indexes
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
refreshTokenSchema.index({ family: 1, revokedAt: 1 });
refreshTokenSchema.index({ user: 1, revokedAt: 1 });

export default mongoose.model('RefreshToken', refreshTokenSchema);

