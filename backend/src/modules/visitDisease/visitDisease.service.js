import visitDisease from "./visitDisease.model.js";
import Visit from "../visit/visit.model.js";
import { ApiError } from '../../utils/ApiError.js';
import { ROLES } from '../auth/auth.constants.js';
import { requireActiveVerifiedDoctor } from '../authorization/clinicalAccess.service.js';

export const createVisitDisease = async (data, currentUser) => {
    // Only verified treating doctors can record diagnoses and prescriptions
    if (currentUser.role !== ROLES.DOCTOR) {
        throw new ApiError(403, 'Clinical privileges restricted: Only verified doctors can record diagnoses and prescriptions');
    }

    const doctorProfile = await requireActiveVerifiedDoctor(currentUser);

    const visit = await Visit.findById(data.visit);
    if (!visit) throw new ApiError(404, 'Visit not found');

    if (visit.hospital && doctorProfile.hospitalId && visit.hospital.toString() !== doctorProfile.hospitalId.toString()) {
        throw new ApiError(403, 'Cross-hospital clinical access denied: Visit was recorded at another hospital facility');
    }

    if (visit.doctor.toString() !== doctorProfile._id.toString()) {
        throw new ApiError(403, 'Clinical authority violation: Only the consulting doctor for this visit can add diagnosis and prescriptions');
    }

    return visitDisease.create(data);
};

export const getVisitDiseases = async (currentUser, query = {}) => {
    const { page = 1, limit = 20, visit } = query;
    const filter = {};

    if (visit) filter.visit = visit;

    if (currentUser.role === ROLES.PATIENT) {
        // Patient can view only diagnoses/prescriptions from their own visits
        const ownVisits = await Visit.find({ patient: currentUser._id }).select('_id');
        const ownVisitIds = ownVisits.map((v) => v._id);

        if (visit && !ownVisitIds.some((id) => id.toString() === visit.toString())) {
            throw new ApiError(403, 'Access denied: You can only access clinical records from your own consultations');
        }
        filter.visit = { $in: ownVisitIds };
    } else if (currentUser.role === ROLES.DOCTOR) {
        // Doctor can access clinical notes from their authorized consultations at their active hospital
        const doctorProfile = await requireActiveVerifiedDoctor(currentUser);

        const doctorVisits = await Visit.find({
            doctor: doctorProfile._id,
            hospital: doctorProfile.hospitalId,
        }).select('_id');
        const docVisitIds = doctorVisits.map((v) => v._id);

        if (visit && !docVisitIds.some((id) => id.toString() === visit.toString())) {
            throw new ApiError(403, 'Access denied: You can only access clinical records where you are the consulting doctor at your affiliated hospital');
        }
        filter.visit = { $in: docVisitIds };
    } else {
        // Receptionist, Super Admin, and Hospital Admin: clinical notes and prescriptions are restricted
        throw new ApiError(
            403,
            'Clinical record confidentiality: Administrative and front-desk staff are not authorized to view clinical diagnoses or prescriptions'
        );
    }

    const records = await visitDisease.find(filter)
        .populate('visit', 'date time doctor patient')
        .skip((page - 1) * limit)
        .limit(Number(limit));

    const total = await visitDisease.countDocuments(filter);
    return { records, total, page: Number(page), pages: Math.ceil(total / limit) };
};