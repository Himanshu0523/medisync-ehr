import mongoose from 'mongoose';

const auditSchema = new mongoose.Schema(
    {
        actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        actorRole: String,
        action: { type: String, required: true },
        entity: { type: String, required: true },
        entityId: { type: String },
        hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', index: true },
        before: Object,
        after: Object,
        ip: String,
        userAgent: String,
    },
    { timestamps: true }
);

auditSchema.index({ entity: 1, entityId: 1, createdAt: -1 });
auditSchema.index({ actor: 1, createdAt: -1 });
auditSchema.index({ hospitalId: 1, createdAt: -1 });

export default mongoose.model('AuditLog', auditSchema);