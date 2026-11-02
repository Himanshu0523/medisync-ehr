import Test from './test.model.js';
import Visit from '../visit/visit.model.js';
import VisitDisease from '../visitDisease/visitDisease.model.js';
import Patient from '../patient/patient.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { ROLES } from '../auth/auth.constants.js';
import {
    requireActiveVerifiedDoctor,
    requireClinicalRecordAccess,
} from '../authorization/clinicalAccess.service.js';

export const createTest = async (data, user, file) => {
    if (!user) {
        throw new ApiError(401, 'Authentication required');
    }

    if (user.role !== ROLES.DOCTOR) {
        throw new ApiError(403, 'Clinical test orders can only be created by an authorized doctor');
    }

    const doctor = await requireActiveVerifiedDoctor(user);

    const visit = await Visit.findById(data.visit);
    if (!visit) throw new ApiError(404, 'Visit not found');

    const visitHospitalId = visit.hospital ? visit.hospital.toString() : null;
    if (!visitHospitalId || doctor.hospitalId.toString() !== visitHospitalId) {
        throw new ApiError(403, 'Clinical access denied: Doctor is not affiliated with the visit hospital');
    }

    await requireClinicalRecordAccess({
        visitId: visit._id,
        user,
        hospitalId: doctor.hospitalId,
    });

    if (data.visitDisease) {
        const vd = await VisitDisease.findOne({ _id: data.visitDisease, visit: visit._id });
        if (!vd) throw new ApiError(404, 'VisitDisease not found for this encounter');
    }

    return Test.create({
        ...data,
        reportUrl: file ? `/uploads/reports/${file.filename}` : '',
        createdBy: user._id,
    });
};

export const getTests = async (user, query = {}) => {
    if (!user) {
        throw new ApiError(401, 'Authentication required');
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Number(query.limit) || 20);
    const filter = {};

    if (user.role === ROLES.PATIENT) {
        const patientProfile = await Patient.findOne({ user: user._id, deletedAt: null });
        const patientIds = [user._id];
        if (patientProfile) patientIds.push(patientProfile._id);

        const ownVisits = await Visit.find({ patient: { $in: patientIds } }).select('_id');
        const ownVisitIds = ownVisits.map((v) => v._id);

        if (query.visit) {
            const isOwn = ownVisitIds.some((id) => id.toString() === query.visit.toString());
            if (!isOwn) {
                throw new ApiError(403, 'Access denied: You can only access tests for your own visits');
            }
            filter.visit = query.visit;
        } else {
            filter.visit = { $in: ownVisitIds };
        }
    } else if (user.role === ROLES.DOCTOR) {
        const doctor = await requireActiveVerifiedDoctor(user);

        if (query.visit) {
            const targetVisit = await Visit.findById(query.visit);
            if (!targetVisit) throw new ApiError(404, 'Visit not found');

            const visitHospital = targetVisit.hospital ? targetVisit.hospital.toString() : null;
            if (!visitHospital || visitHospital !== doctor.hospitalId.toString()) {
                throw new ApiError(403, 'Clinical access denied: Doctor is not affiliated with the visit hospital');
            }

            await requireClinicalRecordAccess({
                visitId: query.visit,
                user,
                hospitalId: doctor.hospitalId,
            });
            filter.visit = query.visit;
        } else {
            const accessibleVisits = await Visit.find({
                hospital: doctor.hospitalId,
                doctor: doctor._id,
            }).select('_id');
            filter.visit = { $in: accessibleVisits.map((v) => v._id) };
        }
    } else if ([ROLES.HOSPITAL_ADMIN, ROLES.RECEPTIONIST, ROLES.ADMIN].includes(user.role)) {
        if (!user.hospitalId) {
            throw new ApiError(403, 'Staff account has no assigned hospital');
        }

        if (query.hospitalId && query.hospitalId.toString() !== user.hospitalId.toString()) {
            throw new ApiError(403, 'Cross-hospital access denied: Cannot query tests for another hospital');
        }

        const hospitalVisits = await Visit.find({ hospital: user.hospitalId }).select('_id');
        const hospitalVisitIds = hospitalVisits.map((v) => v._id);

        if (query.visit) {
            const belongsToHospital = hospitalVisitIds.some((id) => id.toString() === query.visit.toString());
            if (!belongsToHospital) {
                throw new ApiError(403, 'Access denied: Visit does not belong to your hospital');
            }
            filter.visit = query.visit;
        } else {
            filter.visit = { $in: hospitalVisitIds };
        }
    } else if (user.role === ROLES.SUPER_ADMIN) {
        if (query.hospitalId) {
            const hospitalVisits = await Visit.find({ hospital: query.hospitalId }).select('_id');
            filter.visit = { $in: hospitalVisits.map((v) => v._id) };
        }
        if (query.visit) filter.visit = query.visit;
    } else {
        throw new ApiError(403, 'Access denied');
    }

    const [tests, total] = await Promise.all([
        Test.find(filter)
            .populate('visit', 'date time patient doctor hospital')
            .populate('visitDisease', 'disease prescription')
            .sort({ testDate: -1 })
            .skip((page - 1) * limit)
            .limit(limit),
        Test.countDocuments(filter),
    ]);
    return { tests, total, page, pages: Math.ceil(total / limit) };
};

export const getTestReport = async (testId, user) => {
    if (!user) {
        throw new ApiError(401, 'Authentication required');
    }

    const test = await Test.findById(testId).populate('visit');
    if (!test || !test.reportUrl) {
        throw new ApiError(404, 'Medical report not found');
    }

    const visit = test.visit;
    if (!visit) {
        throw new ApiError(404, 'Associated consultation visit not found');
    }

    if (user.role === ROLES.PATIENT) {
        const patientProfile = await Patient.findOne({ user: user._id, deletedAt: null });
        const allowedIds = [user._id.toString()];
        if (patientProfile) allowedIds.push(patientProfile._id.toString());

        const visitPatientId = visit.patient ? visit.patient.toString() : '';
        if (!allowedIds.includes(visitPatientId)) {
            throw new ApiError(403, 'Access denied: You can only download your own medical reports');
        }
    } else if (user.role === ROLES.DOCTOR) {
        const doctor = await requireActiveVerifiedDoctor(user);
        const visitHospital = visit.hospital ? visit.hospital.toString() : null;
        if (!visitHospital || visitHospital !== doctor.hospitalId.toString()) {
            throw new ApiError(403, 'Clinical access denied: Doctor is not affiliated with the visit hospital');
        }
        await requireClinicalRecordAccess({
            visitId: visit._id,
            user,
            hospitalId: doctor.hospitalId,
        });
    } else if (user.role === ROLES.SUPER_ADMIN) {
        // Super Admin read audit access
    } else {
        throw new ApiError(403, 'Confidentiality violation: Administrative/receptionist staff cannot access clinical test reports');
    }

    return test.reportUrl;
};