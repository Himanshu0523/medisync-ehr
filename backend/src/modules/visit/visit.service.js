import Visit from './visit.model.js';
import Booking from '../booking/booking.model.js';
import Doctor from '../doctor/doctor.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { ROLES } from '../auth/auth.constants.js';
import { requireActiveVerifiedDoctor } from '../authorization/clinicalAccess.service.js';

export const createVisit = async (data, currentUser, tenant = null) => {
    const allowedRoles = [ROLES.RECEPTIONIST, ROLES.HOSPITAL_ADMIN, ROLES.ADMIN];
    if (!allowedRoles.includes(currentUser.role)) {
        throw new ApiError(403, 'Only reception and hospital administrative staff can create visits');
    }

    // Require valid staff tenant context
    const staffHospitalId = tenant?.hospitalId || currentUser.hospitalId;
    if (!staffHospitalId) {
        throw new ApiError(403, 'Tenant context required: Staff must belong to an active hospital');
    }

    const booking = await Booking.findById(data.booking);
    if (!booking) throw new ApiError(404, 'Booking not found');
    if (booking.status === 'cancelled') throw new ApiError(400, 'Cannot visit a cancelled booking');

    // Doctor must exist and have a valid hospitalId matching staff tenant
    const doctor = await Doctor.findById(booking.doctor);
    if (!doctor || !doctor.hospitalId) {
        throw new ApiError(400, 'Cannot create visit: Consulting doctor has no hospital affiliation');
    }
    if (doctor.hospitalId.toString() !== staffHospitalId.toString()) {
        throw new ApiError(403, 'Cross-hospital access denied: Cannot record visits for bookings of another hospital');
    }

    // Booking must have a valid hospital reference matching the staff tenant
    if (!booking.hospital) {
        throw new ApiError(400, 'Cannot create visit: Linked booking has no assigned hospital reference');
    }
    if (booking.hospital.toString() !== staffHospitalId.toString()) {
        throw new ApiError(403, 'Cross-hospital access denied: Booking belongs to another hospital facility');
    }
    if (doctor.hospitalId.toString() !== booking.hospital.toString()) {
        throw new ApiError(403, 'Cross-hospital access denied: Consulting doctor belongs to another hospital facility');
    }

    // Verify patient and doctor consistency if provided in request data
    if (data.patient && data.patient.toString() !== booking.patient.toString()) {
        throw new ApiError(400, 'Visit patient does not match linked booking patient');
    }
    if (data.doctor && data.doctor.toString() !== booking.doctor.toString()) {
        throw new ApiError(400, 'Visit doctor does not match linked booking doctor');
    }

    const existing = await Visit.findOne({ booking: data.booking });
    if (existing) throw new ApiError(409, 'Visit already recorded for this booking');

    // Derived exclusively from the validated Booking hospital
    const visit = await Visit.create({
        patient: booking.patient,
        mobile: data.mobile,
        date: data.date || booking.date,
        time: data.time || booking.time,
        doctor: booking.doctor,
        booking: data.booking,
        hospital: booking.hospital,
    });

    booking.status = 'completed';
    await booking.save();

    return visit;
};

export const getVisits = async (currentUser, query = {}, tenant = null) => {
    const { page = 1, limit = 20 } = query;
    const filter = {};

    if (currentUser.role === ROLES.PATIENT) {
        filter.patient = currentUser._id;
    } else if (currentUser.role === ROLES.DOCTOR) {
        const doc = await requireActiveVerifiedDoctor(currentUser);
        // Fail closed: a doctor without a hospital assignment cannot list any visits
        if (!doc.hospitalId) {
            throw new ApiError(
                403,
                'Doctor hospital assignment is missing: Access to visit listings requires an active hospital affiliation'
            );
        }
        filter.doctor = doc._id;
        filter.hospital = doc.hospitalId;
    } else {
        // Hospital staff: fail closed if no tenant context exists
        const staffHospitalId = tenant?.hospitalId || currentUser.hospitalId;
        if (!staffHospitalId) {
            throw new ApiError(403, 'Tenant context required: Staff must belong to an active hospital');
        }

        const hospitalDocs = await Doctor.find({ hospitalId: staffHospitalId, status: 'active', deletedAt: null }).select('_id');
        const docIds = hospitalDocs.map((d) => d._id);

        if (query.doctor) {
            const docIdStrings = docIds.map((d) => d.toString());
            if (!docIdStrings.includes(query.doctor.toString())) {
                return { visits: [], total: 0, page: Number(page), pages: 0 };
            }
            filter.doctor = query.doctor;
            filter.hospital = staffHospitalId;
        } else {
            filter.doctor = { $in: docIds };
            filter.hospital = staffHospitalId;
        }
    }

    const staffHospitalId = ['hospital_admin', 'admin', 'receptionist'].includes(currentUser.role)
        ? (tenant?.hospitalId || currentUser.hospitalId)
        : null;

    const visits = await Visit.find(filter)
        .populate('patient', 'name mobile')
        .populate({
            path: 'doctor',
            select: 'name specialization hospitalId',
            match: staffHospitalId ? { hospitalId: staffHospitalId } : {},
        })
        .populate({
            path: 'booking',
            select: 'date time status hospital',
            match: staffHospitalId ? { hospital: staffHospitalId } : {},
        })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .sort({ date: -1 });

    const total = await Visit.countDocuments(filter);

    // Per-visit relationship validation:
    // Ensures populated doctor and booking match each individual visit's hospital
    visits.forEach((v) => {
        const visitHosp = v.hospital ? String(v.hospital._id || v.hospital) : null;
        if (v.doctor) {
            const docHosp = v.doctor.hospitalId ? String(v.doctor.hospitalId._id || v.doctor.hospitalId) : null;
            if (!docHosp || !visitHosp || docHosp !== visitHosp) {
                v.doctor = null;
            }
        }
        if (v.booking) {
            const bookingHosp = v.booking.hospital ? String(v.booking.hospital._id || v.booking.hospital) : null;
            if (!bookingHosp || !visitHosp || bookingHosp !== visitHosp) {
                v.booking = null;
            }
        }
    });

    return { visits, total, page: Number(page), pages: Math.ceil(total / limit) };
};

export const getVisitById = async (id, currentUser, tenant = null) => {
    let visit;

    if (currentUser.role === ROLES.PATIENT) {
        visit = await Visit.findOne({ _id: id, patient: currentUser._id })
            .populate('patient', 'name mobile')
            .populate('doctor', 'name specialization hospitalId')
            .populate('booking');

        if (!visit) {
            const exists = await Visit.findById(id);
            if (exists) {
                throw new ApiError(403, 'Access denied: You can only access your own visit history');
            }
            throw new ApiError(404, 'Visit not found');
        }

        if (visit.doctor) {
            const docHosp = visit.doctor.hospitalId ? String(visit.doctor.hospitalId._id || visit.doctor.hospitalId) : null;
            const visitHosp = visit.hospital ? String(visit.hospital._id || visit.hospital) : null;
            if (!docHosp || !visitHosp || docHosp !== visitHosp) {
                visit.doctor = null;
            }
        }
        if (visit.booking) {
            const bookingHosp = visit.booking.hospital ? String(visit.booking.hospital._id || visit.booking.hospital) : null;
            const visitHosp = visit.hospital ? String(visit.hospital._id || visit.hospital) : null;
            if (!bookingHosp || !visitHosp || bookingHosp !== visitHosp) {
                visit.booking = null;
            }
        }
    } else if (currentUser.role === ROLES.DOCTOR) {
        const doc = await requireActiveVerifiedDoctor(currentUser);
        // Fail closed: a doctor without a hospital assignment cannot retrieve any visit
        if (!doc.hospitalId) {
            throw new ApiError(
                403,
                'Doctor hospital assignment is missing: An active hospital affiliation is required to retrieve visit records'
            );
        }

        visit = await Visit.findOne({ _id: id, doctor: doc._id, hospital: doc.hospitalId })
            .populate('patient', 'name mobile')
            .populate('doctor', 'name specialization hospitalId')
            .populate('booking');

        if (!visit) {
            const exists = await Visit.findById(id);
            if (exists) {
                if (!exists.doctor || exists.doctor.toString() !== doc._id.toString()) {
                    throw new ApiError(403, 'Access denied: You can only view visits where you are the consulting doctor');
                }
                if (!exists.hospital || exists.hospital.toString() !== doc.hospitalId.toString()) {
                    throw new ApiError(
                        403,
                        'Cross-hospital access denied: You cannot access clinical visit records from a hospital facility you are no longer affiliated with'
                    );
                }
            }
            throw new ApiError(404, 'Visit not found');
        }

        if (visit.doctor) {
            const docHosp = visit.doctor.hospitalId ? String(visit.doctor.hospitalId._id || visit.doctor.hospitalId) : null;
            const visitHosp = visit.hospital ? String(visit.hospital._id || visit.hospital) : null;
            if (!docHosp || !visitHosp || docHosp !== visitHosp) {
                visit.doctor = null;
            }
        }
        if (visit.booking) {
            const bookingHosp = visit.booking.hospital ? String(visit.booking.hospital._id || visit.booking.hospital) : null;
            const visitHosp = visit.hospital ? String(visit.hospital._id || visit.hospital) : null;
            if (!bookingHosp || !visitHosp || bookingHosp !== visitHosp) {
                visit.booking = null;
            }
        }
    } else {
        // Staff tenant boundary check: fail closed
        const staffHospitalId = tenant?.hospitalId || currentUser.hospitalId;
        if (!staffHospitalId) {
            throw new ApiError(403, 'Tenant context required: Staff must belong to an active hospital');
        }

        visit = await Visit.findOne({ _id: id, hospital: staffHospitalId })
            .populate('patient', 'name mobile')
            .populate({
                path: 'doctor',
                select: 'name specialization hospitalId',
                match: { hospitalId: staffHospitalId },
            })
            .populate({
                path: 'booking',
                select: 'date time status hospital',
                match: { hospital: staffHospitalId },
            });

        if (!visit) {
            const exists = await Visit.findById(id);
            if (exists) {
                throw new ApiError(403, 'Access denied: Visit record belongs to another hospital facility');
            }
            throw new ApiError(404, 'Visit not found');
        }

        const staffHospStr = staffHospitalId.toString();
        const docHospStr = visit.doctor?.hospitalId ? String(visit.doctor.hospitalId._id || visit.doctor.hospitalId) : null;
        if (!docHospStr || docHospStr !== staffHospStr) {
            throw new ApiError(403, 'Access denied: Consulting doctor does not belong to this hospital facility');
        }

        const bookingHospStr = visit.booking?.hospital ? String(visit.booking.hospital._id || visit.booking.hospital) : null;
        if (visit.booking && bookingHospStr && bookingHospStr !== staffHospStr) {
            throw new ApiError(403, 'Access denied: Linked booking belongs to another hospital facility');
        }
    }

    return visit;
};

export const exportVisitFhir = async (id, currentUser) => {
    const visit = await getVisitById(id, currentUser);
    if (!visit) throw new ApiError(404, 'Visit not found');

    const VisitDisease = (await import('../visitDisease/visitDisease.model.js')).default;
    const Test = (await import('../test/test.model.js')).default;

    const [diseases, tests] = await Promise.all([
        VisitDisease.find({ visit: visit._id }),
        Test.find({ visit: visit._id }),
    ]);

    // Construct valid HL7 FHIR R4 Bundle resource
    const fhirBundle = {
        resourceType: 'Bundle',
        id: `medisync-encounter-${visit._id}`,
        type: 'document',
        timestamp: new Date().toISOString(),
        entry: [
            {
                resource: {
                    resourceType: 'Encounter',
                    id: String(visit._id),
                    status: 'finished',
                    class: {
                        system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
                        code: 'AMB',
                        display: 'ambulatory',
                    },
                    subject: {
                        reference: `Patient/${visit.patient?._id || visit.patient}`,
                        display: visit.patient?.name || 'Patient',
                    },
                    participant: [
                        {
                            individual: {
                                reference: `Practitioner/${visit.doctor?._id || visit.doctor}`,
                                display: visit.doctor?.name || 'Doctor',
                            },
                        },
                    ],
                    period: {
                        start: visit.date ? new Date(visit.date).toISOString() : new Date().toISOString(),
                    },
                    serviceProvider: {
                        reference: `Organization/${visit.hospital?._id || visit.hospital}`,
                    },
                },
            },
            ...diseases.map((d) => ({
                resource: {
                    resourceType: 'Condition',
                    id: String(d._id),
                    clinicalStatus: {
                        coding: [
                            {
                                system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
                                code: 'active',
                            },
                        ],
                    },
                    code: {
                        text: d.disease || 'Unspecified Condition',
                    },
                    subject: {
                        reference: `Patient/${visit.patient?._id || visit.patient}`,
                    },
                    encounter: {
                        reference: `Encounter/${visit._id}`,
                    },
                    note: d.prescription ? [{ text: `Prescription: ${d.prescription}` }] : [],
                },
            })),
            ...tests.map((t) => ({
                resource: {
                    resourceType: 'DiagnosticReport',
                    id: String(t._id),
                    status: 'final',
                    code: {
                        text: t.testName || 'Diagnostic Test',
                    },
                    subject: {
                        reference: `Patient/${visit.patient?._id || visit.patient}`,
                    },
                    encounter: {
                        reference: `Encounter/${visit._id}`,
                    },
                    effectiveDateTime: t.testDate ? new Date(t.testDate).toISOString() : undefined,
                    conclusion: t.result || undefined,
                },
            })),
        ],
    };

    return fhirBundle;
};