import mongoose from 'mongoose';
import Hospital from '../hospital/hospital.model.js';
import User from '../user/user.model.js';
import Doctor from '../doctor/doctor.model.js';
import Booking from '../booking/booking.model.js';
import Patient from '../patient/patient.model.js';
import PatientHospital from '../patientHospital/patientHospital.model.js';
import AuditLog from '../audit/audit.model.js';
import { ApiError } from '../../utils/ApiError.js';

/**
 * Returns start and end Date objects for a given date string or today
 */
const getDayDateBounds = (targetDate = new Date()) => {
  const date = new Date(targetDate);
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return { startOfDay, endOfDay };
};

/**
 * Get centralized overview metrics for the hospital admin
 */
export const getHospitalAdminOverview = async (tenant) => {
  const hospitalId = tenant?.hospitalId;
  if (!hospitalId) {
    throw new ApiError(403, 'Hospital tenant context is required');
  }

  const hospital = await Hospital.findOne({ _id: hospitalId, deletedAt: null }).lean();
  if (!hospital) {
    throw new ApiError(404, 'Hospital facility not found or inactive');
  }

  const { startOfDay, endOfDay } = getDayDateBounds();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Parallel aggregate queries strictly filtered by hospitalId
  const [
    totalPatients,
    activePatients,
    inactivePatients,
    newPatientsThisMonth,
    totalDoctors,
    activeDoctors,
    inactiveDoctors,
    pendingDoctors,
    totalReceptionists,
    activeReceptionists,
    todayBookings,
    todayQueueCount,
  ] = await Promise.all([
    PatientHospital.countDocuments({ hospital: hospitalId }),
    PatientHospital.countDocuments({ hospital: hospitalId, status: 'active' }),
    PatientHospital.countDocuments({ hospital: hospitalId, status: 'inactive' }),
    PatientHospital.countDocuments({ hospital: hospitalId, createdAt: { $gte: startOfMonth } }),
    Doctor.countDocuments({ hospitalId, deletedAt: null }),
    Doctor.countDocuments({ hospitalId, status: 'active', deletedAt: null }),
    Doctor.countDocuments({ hospitalId, status: 'inactive', deletedAt: null }),
    Doctor.countDocuments({
      hospitalId,
      deletedAt: null,
      $or: [
        { verificationStatus: { $in: ['pending_verification', 'under_review'] } },
        { isApproved: false },
      ],
    }),
    User.countDocuments({ hospitalId, role: 'receptionist', deletedAt: null }),
    User.countDocuments({ hospitalId, role: 'receptionist', status: 'active', deletedAt: null }),
    Booking.find({
      hospital: hospitalId,
      date: { $gte: startOfDay, $lte: endOfDay },
    }).select('status'),
    Booking.countDocuments({
      hospital: hospitalId,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['confirmed', 'pending'] },
    }),
  ]);

  // Aggregate today's appointments by status
  const appointmentBreakdown = {
    total: todayBookings.length,
    confirmed: 0,
    pending: 0,
    completed: 0,
    cancelled: 0,
  };

  todayBookings.forEach((b) => {
    if (appointmentBreakdown[b.status] !== undefined) {
      appointmentBreakdown[b.status] += 1;
    }
  });

  return {
    hospital: {
      id: hospital._id,
      name: hospital.name,
      code: hospital.code,
      email: hospital.email,
      contactNumber: hospital.contactNumber,
      status: hospital.status,
      address: hospital.address,
      createdAt: hospital.createdAt,
    },
    statistics: {
      patients: {
        total: totalPatients,
        active: activePatients,
        inactive: inactivePatients,
        newThisMonth: newPatientsThisMonth,
      },
      doctors: {
        total: totalDoctors,
        active: activeDoctors,
        inactive: inactiveDoctors,
        pendingVerification: pendingDoctors,
      },
      receptionists: {
        total: totalReceptionists,
        active: activeReceptionists,
      },
      todayAppointments: appointmentBreakdown,
      queue: {
        waitingCount: todayQueueCount,
      },
    },
  };
};

/**
 * Retrieve today's appointments for the hospital
 */
export const getTodayAppointments = async ({
  hospitalId,
  status = null,
  doctorId = null,
  date = null,
  page = 1,
  limit = 20,
}) => {
  if (!hospitalId) {
    throw new ApiError(403, 'Hospital tenant context is required');
  }

  const { startOfDay, endOfDay } = getDayDateBounds(date ? new Date(date) : new Date());

  const filter = {
    hospital: hospitalId,
    date: { $gte: startOfDay, $lte: endOfDay },
  };

  if (status && status !== 'all') {
    filter.status = status;
  }

  if (doctorId && mongoose.isValidObjectId(doctorId)) {
    filter.doctor = doctorId;
  }

  const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
  const total = await Booking.countDocuments(filter);

  const bookings = await Booking.find(filter)
    .sort({ time: 1, createdAt: 1 })
    .skip(skip)
    .limit(parseInt(limit, 10))
    .populate('doctor', 'name specialization image rating department')
    .populate('patient', 'name email mobile')
    .lean();

  // Enhance bookings with MRN if patient profile exists
  const userIds = bookings.map((b) => b.patient?._id).filter(Boolean);
  const patientProfiles = await Patient.find({ user: { $in: userIds } }).select('_id user gender dateOfBirth').lean();
  const patientMap = Object.fromEntries(patientProfiles.map((p) => [p.user.toString(), p]));

  const patientIds = patientProfiles.map((p) => p._id);
  const patientHospitalRels = await PatientHospital.find({
    hospital: hospitalId,
    patient: { $in: patientIds },
  }).select('patient medicalRecordNumber status').lean();

  const mrnMap = Object.fromEntries(
    patientHospitalRels.map((rel) => [rel.patient.toString(), rel.medicalRecordNumber])
  );

  const enrichedBookings = bookings.map((b) => {
    const patientUser = b.patient;
    const patientProfile = patientUser ? patientMap[patientUser._id.toString()] : null;
    const mrn = patientProfile ? mrnMap[patientProfile._id.toString()] || null : null;

    return {
      _id: b._id,
      date: b.date,
      time: b.time,
      status: b.status,
      doctor: b.doctor || null,
      patient: patientUser
        ? {
            _id: patientUser._id,
            name: patientUser.name,
            email: patientUser.email,
            mobile: patientUser.mobile,
            gender: patientProfile?.gender || null,
            mrn,
          }
        : null,
      createdAt: b.createdAt,
    };
  });

  return {
    appointments: enrichedBookings,
    total,
    page: parseInt(page, 10),
    pages: Math.ceil(total / parseInt(limit, 10)),
  };
};

/**
 * Retrieve doctors awaiting verification or approval in this hospital
 */
export const getPendingDoctors = async (hospitalId) => {
  if (!hospitalId) {
    throw new ApiError(403, 'Hospital tenant context is required');
  }

  const doctors = await Doctor.find({
    hospitalId,
    deletedAt: null,
    $or: [
      { verificationStatus: { $in: ['pending_verification', 'under_review'] } },
      { isApproved: false },
    ],
  })
    .sort({ createdAt: -1 })
    .lean();

  return doctors;
};

/**
 * Retrieve today's active patient queue for this hospital
 */
export const getPatientQueue = async ({ hospitalId, doctorId = null }) => {
  if (!hospitalId) {
    throw new ApiError(403, 'Hospital tenant context is required');
  }

  const { startOfDay, endOfDay } = getDayDateBounds();

  const filter = {
    hospital: hospitalId,
    date: { $gte: startOfDay, $lte: endOfDay },
    status: { $in: ['confirmed', 'pending'] },
  };

  if (doctorId && mongoose.isValidObjectId(doctorId)) {
    filter.doctor = doctorId;
  }

  const bookings = await Booking.find(filter)
    .sort({ time: 1, createdAt: 1 })
    .populate('doctor', 'name specialization department')
    .populate('patient', 'name mobile email')
    .lean();

  // Fetch MRNs
  const userIds = bookings.map((b) => b.patient?._id).filter(Boolean);
  const patientProfiles = await Patient.find({ user: { $in: userIds } }).select('_id user').lean();
  const patientMap = Object.fromEntries(patientProfiles.map((p) => [p.user.toString(), p._id.toString()]));

  const patientIds = Object.values(patientMap);
  const patientHospitalRels = await PatientHospital.find({
    hospital: hospitalId,
    patient: { $in: patientIds },
  }).select('patient medicalRecordNumber').lean();

  const mrnMap = Object.fromEntries(
    patientHospitalRels.map((rel) => [rel.patient.toString(), rel.medicalRecordNumber])
  );

  const queue = bookings.map((b, index) => {
    const pId = b.patient ? patientMap[b.patient._id.toString()] : null;
    const mrn = pId ? mrnMap[pId] || 'N/A' : 'N/A';

    return {
      queuePosition: index + 1,
      bookingId: b._id,
      time: b.time,
      status: b.status,
      patient: b.patient
        ? {
            _id: b.patient._id,
            name: b.patient.name,
            mobile: b.patient.mobile,
            mrn,
          }
        : null,
      doctor: b.doctor
        ? {
            _id: b.doctor._id,
            name: b.doctor.name,
            specialization: b.doctor.specialization,
            department: b.doctor.department,
          }
        : null,
    };
  });

  return {
    queue,
    totalWaiting: queue.length,
  };
};

/**
 * Retrieve recent hospital audit activities
 */
export const getRecentHospitalActivity = async (hospitalId, limit = 20) => {
  if (!hospitalId) {
    throw new ApiError(403, 'Hospital tenant context is required');
  }

  const logs = await AuditLog.find({ hospitalId })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit, 10))
    .populate('actor', 'name email role')
    .lean();

  return logs;
};
