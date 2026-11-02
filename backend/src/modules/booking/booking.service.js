import Booking from './booking.model.js';
import Doctor from '../doctor/doctor.model.js';
import Patient from '../patient/patient.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { enqueueNotification } from '../../jobs/queues.js';
import { emitToUser } from '../../sockets/index.js';
import { requirePatientHospitalAccess } from '../authorization/patientAccess.service.js';
import { requireActiveVerifiedDoctor } from '../authorization/clinicalAccess.service.js';

const assertDoctorAvailable = (doctor, date, time) => {
  const day = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
  const slot = doctor.availability.find((a) => a.day === day);
  if (!slot) throw new ApiError(400, `Doctor not available on ${day}`);

  const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const t = toMin(time);
  if (t < toMin(slot.start) || t >= toMin(slot.end)) {
    throw new ApiError(400, `Doctor available ${slot.start}-${slot.end} on ${day}`);
  }
  if ((t - toMin(slot.start)) % slot.slotMinutes !== 0) {
    throw new ApiError(400, `Slots are ${slot.slotMinutes}-minute aligned`);
  }
};

export const createBooking = async (data, user, tenant = null) => {
  const patientId = user.role === 'patient' ? user._id : data.patient;
  if (!patientId) throw new ApiError(400, 'Patient required');

  const doctor = await Doctor.findOne({ _id: data.doctor, deletedAt: null });
  if (!doctor) throw new ApiError(404, 'Doctor not found');

  let targetHospitalId = null;

  if (user.role === 'patient') {
    // Patients can only book doctors who are actively affiliated with a hospital
    if (!doctor.hospitalId) {
      throw new ApiError(400, 'Doctor is not assigned to an active hospital facility');
    }
    const patientProfile = await Patient.findOne({ user: user._id, deletedAt: null });
    if (!patientProfile) {
      throw new ApiError(404, 'Patient profile record not found');
    }
    await requirePatientHospitalAccess({ patientId: patientProfile._id, hospitalId: doctor.hospitalId });
    targetHospitalId = doctor.hospitalId;
  } else {
    // Staff booking: Hospital ID comes strictly from trusted tenant context or staff user
    const staffHospitalId = tenant?.hospitalId || user.hospitalId;
    if (!staffHospitalId) {
      throw new ApiError(403, 'Tenant context required: Staff must belong to an active hospital');
    }
    if (!doctor.hospitalId) {
      throw new ApiError(400, 'Doctor is not assigned to a hospital');
    }
    if (doctor.hospitalId.toString() !== staffHospitalId.toString()) {
      throw new ApiError(403, 'Cross-hospital access denied: Cannot book doctors from another hospital');
    }

    let patientProfile = await Patient.findOne({ _id: patientId, deletedAt: null });
    if (!patientProfile) {
      patientProfile = await Patient.findOne({ user: patientId, deletedAt: null });
    }
    if (!patientProfile) {
      throw new ApiError(404, 'Patient profile record not found');
    }
    await requirePatientHospitalAccess({ patientId: patientProfile._id, hospitalId: staffHospitalId });
    targetHospitalId = staffHospitalId;
  }

  assertDoctorAvailable(doctor, data.date, data.time);

  // Distributed Redis TTL lock (SETNX) to prevent double-booking race conditions during concurrency
  const dateStr = new Date(data.date).toISOString().split('T')[0];
  const lockKey = `lock:slot:${data.doctor}:${dateStr}:${data.time}`;
  let lockAcquired = false;

  const { redis } = await import('../../config/redis.js');
  if (redis) {
    try {
      // 5-minute TTL lock (300 seconds)
      const res = await redis.set(lockKey, String(patientId), 'EX', 300, 'NX');
      if (!res) {
        throw new ApiError(409, 'This time slot is currently being reserved by another patient. Please choose another slot.');
      }
      lockAcquired = true;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      // Fallback gracefully if Redis is temporarily unreachable
    }
  }

  try {
    // Client-supplied hospital cannot override trusted targetHospitalId
    const booking = await Booking.create({
      patient: patientId,
      doctor: data.doctor,
      hospital: targetHospitalId,
      date: data.date,
      time: data.time,
      status: user.role === 'patient' ? 'pending' : data.status || 'pending',
    });

    return booking;
  } catch (err) {
    // If creation fails (e.g. Mongo duplicate key or validation error), release Redis lock
    if (redis && lockAcquired) {
      await redis.del(lockKey).catch(() => {});
    }
    if (err.code === 11000) {
      throw new ApiError(409, 'Doctor already has a booking at this date and time.');
    }
    throw err;
  }
};

export const getBookings = async (user, query = {}, tenant = null) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Number(query.limit) || 20);
  const filter = {};

  if (user.role === 'patient') {
    filter.patient = user._id;
  } else if (user.role === 'doctor') {
    const doc = await requireActiveVerifiedDoctor(user);
    // Fail closed: a doctor without a hospital assignment cannot list any bookings
    if (!doc.hospitalId) {
      throw new ApiError(
        403,
        'Doctor hospital assignment is missing: Access to booking listings requires an active hospital affiliation'
      );
    }
    filter.doctor = doc._id;
    filter.hospital = doc.hospitalId;
  } else {
    // Hospital staff: fail closed if no tenant context exists
    const staffHospitalId = tenant?.hospitalId || user.hospitalId;
    if (!staffHospitalId) {
      throw new ApiError(403, 'Tenant context required: Staff must belong to an active hospital');
    }

    const hospitalDocs = await Doctor.find({ hospitalId: staffHospitalId, status: 'active', deletedAt: null }).select('_id');
    const docIds = hospitalDocs.map((d) => d._id);

    if (query.doctor) {
      const docIdStrings = docIds.map((id) => id.toString());
      if (!docIdStrings.includes(query.doctor.toString())) {
        return { bookings: [], total: 0, page, pages: 0 };
      }
      filter.doctor = query.doctor;
      filter.hospital = staffHospitalId;
    } else {
      filter.doctor = { $in: docIds };
      filter.hospital = staffHospitalId;
    }
  }

  if (query.status) filter.status = query.status;
  if (query.date) {
    const d = new Date(query.date); d.setHours(0,0,0,0);
    const e = new Date(d); e.setDate(e.getDate() + 1);
    filter.date = { $gte: d, $lt: e };
  }

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate('patient', 'name mobile email')
      .populate({
        path: 'doctor',
        select: 'name specialization hospitalId',
        match: filter.hospital ? { hospitalId: filter.hospital } : {},
      })
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Booking.countDocuments(filter),
  ]);

  // Per-booking relationship validation:
  // For patients with bookings across multiple hospitals, filter.hospital is absent.
  // Validate each booking's populated doctor against that particular booking's hospital.
  bookings.forEach((b) => {
    if (b.doctor) {
      const docHosp = b.doctor.hospitalId ? String(b.doctor.hospitalId._id || b.doctor.hospitalId) : null;
      const bookingHosp = b.hospital ? String(b.hospital._id || b.hospital) : null;
      if (!docHosp || !bookingHosp || docHosp !== bookingHosp) {
        b.doctor = null;
      }
    }
  });

  return { bookings, total, page, pages: Math.ceil(total / limit) };
};

export const updateBookingStatus = async (id, status, user, tenant = null) => {
  let booking;

  if (user.role === 'patient') {
    booking = await Booking.findOne({ _id: id, patient: user._id })
      .populate('patient', 'name email mobile')
      .populate('doctor', 'name hospitalId');
    if (!booking) {
      const exists = await Booking.findById(id);
      if (exists) throw new ApiError(403, 'Not your booking');
      throw new ApiError(404, 'Booking not found');
    }
    if (booking.doctor) {
      const docHosp = booking.doctor.hospitalId ? String(booking.doctor.hospitalId._id || booking.doctor.hospitalId) : null;
      const bookingHosp = booking.hospital ? String(booking.hospital._id || booking.hospital) : null;
      if (!docHosp || !bookingHosp || docHosp !== bookingHosp) {
        booking.doctor = null;
      }
    }
    if (status !== 'cancelled') throw new ApiError(403, 'Patients can only cancel');
  } else if (user.role === 'doctor') {
    const doc = await requireActiveVerifiedDoctor(user);
    // Fail closed: a doctor without a hospital assignment cannot update any booking
    if (!doc.hospitalId) {
      throw new ApiError(
        403,
        'Doctor hospital assignment is missing: An active hospital affiliation is required to update booking status'
      );
    }
    booking = await Booking.findOne({ _id: id, doctor: doc._id, hospital: doc.hospitalId })
      .populate('patient', 'name email mobile')
      .populate('doctor', 'name hospitalId');
    if (!booking) {
      const exists = await Booking.findById(id);
      if (exists) {
        if (exists.doctor?.toString() !== doc._id.toString()) {
          throw new ApiError(403, 'Cross-doctor access denied: You can only update your own bookings');
        }
        if (!exists.hospital || exists.hospital.toString() !== doc.hospitalId.toString()) {
          throw new ApiError(
            403,
            'Cross-hospital access denied: You cannot modify bookings belonging to a hospital facility you are no longer affiliated with'
          );
        }
      }
      throw new ApiError(404, 'Booking not found');
    }
  } else {
    // Hospital staff tenant validation: Fail closed
    const staffHospitalId = tenant?.hospitalId || user.hospitalId;
    if (!staffHospitalId) {
      throw new ApiError(403, 'Tenant context required: Staff must belong to an active hospital');
    }

    booking = await Booking.findOne({ _id: id, hospital: staffHospitalId })
      .populate('patient', 'name email mobile')
      .populate('doctor', 'name hospitalId');

    if (!booking) {
      const exists = await Booking.findById(id);
      if (exists) {
        throw new ApiError(403, 'Cross-hospital access denied: Cannot modify bookings of another hospital');
      }
      throw new ApiError(404, 'Booking not found');
    }

    // Require doctor hospital to match the staff tenant
    if (!booking.doctor?.hospitalId || booking.doctor.hospitalId.toString() !== staffHospitalId.toString()) {
      throw new ApiError(403, 'Cross-hospital access denied: Doctor is not affiliated with this hospital');
    }
  }

  booking.status = status;
  await booking.save();

  emitToUser(booking.patient._id, 'booking:status', { id: booking._id, status });

  if (status === 'confirmed') {
    await enqueueNotification('booking-confirmed', {
      name: booking.patient.name, email: booking.patient.email, mobile: booking.patient.mobile,
      doctorName: booking.doctor.name,
      date: booking.date.toDateString(), time: booking.time,
    });
  } else if (status === 'cancelled') {
    await enqueueNotification('booking-cancelled', {
      name: booking.patient.name, email: booking.patient.email,
      date: booking.date.toDateString(), time: booking.time,
    });
  }

  return booking;
};