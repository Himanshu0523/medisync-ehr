import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/reports'),
    filename: (req, file, cb) => {
        const safe = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        cb(null, `${Date.now()}-${safe}`);
    },
});

export const uploadReport = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const ok = file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/');
        if (!ok) return cb(new ApiError(400, 'Only PDFs and images allowed'));
        cb(null, true);
    },
}).single('report');