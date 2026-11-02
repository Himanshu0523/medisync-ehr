import AuditLog from '../modules/audit/audit.model.js';
import { logger } from '../utils/logger.js';


export const audit = (entity, action) => async (req, res, next) => {
    res.on('finish', async () => {
        if (res.statusCode >= 400) return;
        try {
        await AuditLog.create({
            actor: req.user?._id,
            actorRole: req.user?.role,
            action,
            entity,
            entityId: req.auditMeta?.entityId || req.params.id,
            hospitalId: req.auditMeta?.hospitalId || req.user?.hospitalId || null,
            before: req.auditMeta?.before || null,
            after: req.auditMeta?.after || null,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
        });
        } catch (e) {
        logger.error('Audit log failed', e);
        }
    });
    next();
};