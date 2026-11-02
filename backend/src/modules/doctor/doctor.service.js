import Doctor from './doctor.model.js';
import Hospital from '../hospital/hospital.model.js';
import User from '../user/user.model.js';
import AuditLog from '../audit/audit.model.js';
import { ApiError } from '../../utils/ApiError.js';

const INITIAL_SPECIALISTS = [
  {
    name: 'Dr. Sarah Johnson',
    email: 'sarah.doc@medisync.com',
    mobile: '9876543211',
    specialization: 'Internal Medicine',
    qualifications: 'MD, FACP',
    experience: '18+ yrs exp',
    languages: ['English', 'Spanish'],
    hospital: 'MediSync Main Hospital',
    nextAvailable: 'Today, 3:30 PM',
    rating: 4.9,
    reviewCount: 142,
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400&h=400',
    timing: '09:00 - 17:00',
    availability: [
      { day: 'Mon', start: '09:00', end: '17:00', slotMinutes: 30 },
      { day: 'Tue', start: '09:00', end: '17:00', slotMinutes: 30 },
      { day: 'Wed', start: '09:00', end: '17:00', slotMinutes: 30 },
      { day: 'Thu', start: '09:00', end: '17:00', slotMinutes: 30 },
      { day: 'Fri', start: '09:00', end: '17:00', slotMinutes: 30 },
    ],
  },
  {
    name: 'Dr. Michael Chen',
    email: 'michael.chen@medisync.com',
    mobile: '9876543214',
    specialization: 'Cardiology',
    qualifications: 'MD, FACC',
    experience: '15+ yrs exp',
    languages: ['English', 'Mandarin'],
    hospital: 'Cardiovascular Wing',
    nextAvailable: 'Tomorrow, 10:00 AM',
    rating: 4.8,
    reviewCount: 98,
    image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400&h=400',
    timing: '10:00 - 18:00',
    availability: [
      { day: 'Mon', start: '10:00', end: '18:00', slotMinutes: 30 },
      { day: 'Wed', start: '10:00', end: '18:00', slotMinutes: 30 },
      { day: 'Fri', start: '10:00', end: '18:00', slotMinutes: 30 },
    ],
  },
  {
    name: 'Dr. Emily Martinez',
    email: 'emily.martinez@medisync.com',
    mobile: '9876543215',
    specialization: 'Pediatrics',
    qualifications: 'MD, FAAP',
    experience: '12+ yrs exp',
    languages: ['English', 'Spanish', 'Portuguese'],
    hospital: 'Children’s Pavilion',
    nextAvailable: 'Today, 5:15 PM',
    rating: 5.0,
    reviewCount: 210,
    image: 'https://images.unsplash.com/photo-1594824813580-5309623e1e69?auto=format&fit=crop&q=80&w=400&h=400',
    timing: '08:30 - 16:30',
    availability: [
      { day: 'Tue', start: '08:30', end: '16:30', slotMinutes: 30 },
      { day: 'Thu', start: '08:30', end: '16:30', slotMinutes: 30 },
      { day: 'Sat', start: '09:00', end: '13:00', slotMinutes: 30 },
    ],
  },
  {
    name: 'Dr. James Wilson',
    email: 'james.wilson@medisync.com',
    mobile: '9876543216',
    specialization: 'Orthopedic Surgery',
    qualifications: 'MD, FAAOS',
    experience: '20+ yrs exp',
    languages: ['English'],
    hospital: 'Surgical Center',
    nextAvailable: 'Thursday, 11:30 AM',
    rating: 4.7,
    reviewCount: 84,
    image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400&h=400',
    timing: '09:00 - 15:00',
    availability: [
      { day: 'Mon', start: '09:00', end: '15:00', slotMinutes: 45 },
      { day: 'Thu', start: '09:00', end: '15:00', slotMinutes: 45 },
    ],
  },
  {
    name: 'Dr. Lisa Wong',
    email: 'lisa.wong@medisync.com',
    mobile: '9876543217',
    specialization: 'Dermatology',
    qualifications: 'MD, FAAD',
    experience: '11+ yrs exp',
    languages: ['English', 'Cantonese'],
    hospital: 'Outpatient Specialty Clinic',
    nextAvailable: 'Friday, 2:00 PM',
    rating: 4.9,
    reviewCount: 115,
    image: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?auto=format&fit=crop&q=80&w=400&h=400',
    timing: '10:00 - 17:00',
    availability: [
      { day: 'Wed', start: '10:00', end: '17:00', slotMinutes: 30 },
      { day: 'Fri', start: '10:00', end: '17:00', slotMinutes: 30 },
    ],
  },
  {
    name: 'Dr. Robert Davis',
    email: 'robert.davis@medisync.com',
    mobile: '9876543218',
    specialization: 'Neurology',
    qualifications: 'MD, PhD, FAAN',
    experience: '22+ yrs exp',
    languages: ['English', 'German'],
    hospital: 'Neuroscience Center',
    nextAvailable: 'Monday, 1:00 PM',
    rating: 4.8,
    reviewCount: 167,
    image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400&h=400',
    timing: '09:00 - 16:00',
    availability: [
      { day: 'Mon', start: '09:00', end: '16:00', slotMinutes: 45 },
      { day: 'Wed', start: '09:00', end: '16:00', slotMinutes: 45 },
    ],
  },
];

export const createDoctor = async (data, actor = null) => {
  if (!actor) {
    throw new ApiError(401, 'Authentication required');
  }

  const isSuperAdmin = actor.role === 'super_admin';
  const isHospitalAdmin = ['hospital_admin', 'admin'].includes(actor.role);

  if (!isSuperAdmin && !isHospitalAdmin) {
    throw new ApiError(403, 'Unauthorized to create doctor profile');
  }

  let targetHospitalId = null;

  if (isHospitalAdmin) {
    if (!actor.hospitalId) {
      throw new ApiError(403, 'Hospital Admin has no assigned hospital');
    }
    // Reject forged body hospitalId attempting cross-hospital assignment
    if (data.hospitalId && data.hospitalId.toString() !== actor.hospitalId.toString()) {
      throw new ApiError(403, 'Cross-hospital access forbidden: Cannot create a doctor for another hospital');
    }
    targetHospitalId = actor.hospitalId;
  } else if (isSuperAdmin) {
    if (!data.hospitalId) {
      throw new ApiError(400, 'Hospital assignment (hospitalId) is required');
    }
    const hosp = await Hospital.findOne({ _id: data.hospitalId, status: 'active', deletedAt: null });
    if (!hosp) {
      throw new ApiError(400, 'Assigned hospital does not exist or is inactive');
    }
    targetHospitalId = data.hospitalId;
  }

  if (data.user) {
    const linkedUser = await User.findOne({ _id: data.user, deletedAt: null });
    if (!linkedUser) {
      throw new ApiError(404, 'Linked user account not found');
    }
    if (linkedUser.role !== 'doctor') {
      throw new ApiError(400, 'Linked user must have role "doctor"');
    }
    if (isHospitalAdmin && linkedUser.hospitalId && linkedUser.hospitalId.toString() !== targetHospitalId.toString()) {
      throw new ApiError(403, 'Cross-hospital access forbidden: Linked user belongs to another hospital');
    }
  }

  const existing = await Doctor.findOne({ $or: [{ email: data.email }, { mobile: data.mobile }] });
  if (existing) throw new ApiError(409, 'Doctor with this email or mobile already exists');

  const doctorData = {
    ...data,
    hospitalId: targetHospitalId,
  };

  return Doctor.create(doctorData);
};

export const getAllDoctors = async (query = {}, actor = null) => {
  const { page = 1, limit = 50, specialization, search, verificationStatus, status, includeUnpublished } = query;

  // Auto-seed if empty
  const count = await Doctor.countDocuments({ deletedAt: null });
  if (count === 0) {
    try {
      await Doctor.insertMany(INITIAL_SPECIALISTS.map(doc => ({
        ...doc,
        status: 'active',
        isApproved: true,
        isPublished: true,
        verificationStatus: 'verified',
      })));
    } catch {
      // Ignore parallel insert collisions
    }
  }

  const filter = { deletedAt: null };

  const isStaffOrAdmin = actor && ['admin', 'super_admin', 'hospital_admin', 'receptionist', 'doctor'].includes(actor.role);

  if (isStaffOrAdmin && (includeUnpublished === 'true' || verificationStatus || status)) {
    // Admin / staff query: allow viewing unverified, under_review, pending, or rejected doctors
    if (verificationStatus) {
      filter.verificationStatus = verificationStatus;
    }
    if (status) {
      filter.status = status;
    }
    if (includeUnpublished !== 'true' && !verificationStatus) {
      filter.isPublished = { $ne: false };
    }
  } else {
    // Public directory: strictly only active, verified, published doctors
    filter.isPublished = true;
    filter.isApproved = true;
    filter.verificationStatus = 'verified';
    filter.status = 'active';
  }

  // Cross-hospital tenant isolation for hospital staff (receptionist, hospital_admin, doctor)
  if (actor && ['hospital_admin', 'admin', 'receptionist'].includes(actor.role)) {
    if (!actor.hospitalId) {
      throw new ApiError(403, 'Hospital staff account has no assigned hospital');
    }
    // Hard-scope: client-supplied query.hospitalId cannot override staff tenancy
    filter.hospitalId = actor.hospitalId;
  } else if (actor && actor.role === 'doctor') {
    if (includeUnpublished === 'true' && actor.hospitalId) {
      filter.hospitalId = actor.hospitalId;
    } else if (query.hospitalId) {
      filter.hospitalId = query.hospitalId;
    }
  } else if (actor && actor.role === 'super_admin') {
    if (query.hospitalId) {
      filter.hospitalId = query.hospitalId;
    }
  } else if (query.hospitalId) {
    // Public / patient filtering by hospital
    filter.hospitalId = query.hospitalId;
  }

  if (specialization && specialization !== 'All') {
    filter.specialization = new RegExp(`^${specialization}$`, 'i');
  }

  if (search && search.trim()) {
    const s = search.trim();
    filter.$or = [
      { name: { $regex: s, $options: 'i' } },
      { specialization: { $regex: s, $options: 'i' } },
      { languages: { $regex: s, $options: 'i' } },
      { department: { $regex: s, $options: 'i' } },
    ];
  }

  const doctors = await Doctor.find(filter)
    .populate('user', 'name email role status emailVerified')
    .populate('verificationReviewedBy', 'name email role')
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  if (!isStaffOrAdmin) {
    doctors.forEach((d) => {
      d.verificationReviewedBy = undefined;
    });
  }

  const total = await Doctor.countDocuments(filter);

  return { doctors, total, page: Number(page), pages: Math.ceil(total / Number(limit)) };
};

export const getDoctorById = async (id, actor = null) => {
  const doctor = await Doctor.findById(id)
    .populate('user', 'name email role status emailVerified')
    .populate('verificationReviewedBy', 'name email role');
  if (!doctor || doctor.deletedAt) throw new ApiError(404, 'Doctor not found');

  const isPublicAllowed = doctor.isPublished && doctor.isApproved && doctor.verificationStatus === 'verified' && doctor.status === 'active';

  if (!isPublicAllowed) {
    if (!actor) {
      throw new ApiError(404, 'Doctor not found');
    }
    const isSuperAdmin = actor.role === 'super_admin';
    const isSelf = doctor.user && actor._id.toString() === doctor.user.toString();
    const isHospitalStaff = ['hospital_admin', 'admin', 'receptionist', 'doctor'].includes(actor.role);
    const isSameHospital = isHospitalStaff && actor.hospitalId && doctor.hospitalId && actor.hospitalId.toString() === doctor.hospitalId.toString();

    if (!isSuperAdmin && !isSelf && !isSameHospital) {
      throw new ApiError(404, 'Doctor not found');
    }
  }

  if (!actor || !['super_admin', 'hospital_admin', 'admin', 'receptionist'].includes(actor.role)) {
    doctor.verificationReviewedBy = undefined;
  }

  return doctor;
};

export const updateDoctor = async (id, updates, actor = null) => {
  if (!actor) {
    throw new ApiError(401, 'Authentication required');
  }

  const doctor = await Doctor.findOne({ _id: id, deletedAt: null });
  if (!doctor) throw new ApiError(404, 'Doctor not found');

  const isSuperAdmin = actor.role === 'super_admin';
  const isHospitalAdmin = ['hospital_admin', 'admin'].includes(actor.role);
  const isSelf = doctor.user && actor._id.toString() === doctor.user.toString();

  if (!isSuperAdmin && !isHospitalAdmin && !isSelf) {
    throw new ApiError(403, 'Unauthorized to update doctor profile');
  }

  const safeUpdates = { ...updates };

  if (isHospitalAdmin && !isSuperAdmin) {
    if (!actor.hospitalId || !doctor.hospitalId || doctor.hospitalId.toString() !== actor.hospitalId.toString()) {
      throw new ApiError(403, 'Cross-hospital access forbidden: You can only update doctors from your own hospital');
    }

    // Protected fields that Hospital Admin cannot tamper with via generic update
    delete safeUpdates.hospitalId;
    delete safeUpdates.user;
    delete safeUpdates.verificationStatus;
    delete safeUpdates.isApproved;
    delete safeUpdates.isPublished;
    delete safeUpdates.verificationReviewedBy;
    delete safeUpdates.verificationReviewedAt;
    delete safeUpdates.verificationRejectionReason;
    delete safeUpdates.deletedAt;
  } else if (isSuperAdmin) {
    delete safeUpdates.deletedAt;
    if (safeUpdates.hospitalId && safeUpdates.hospitalId.toString() !== doctor.hospitalId?.toString()) {
      const hosp = await Hospital.findOne({ _id: safeUpdates.hospitalId, status: 'active', deletedAt: null });
      if (!hosp) {
        throw new ApiError(400, 'Target hospital does not exist or is inactive');
      }
    }
  } else if (isSelf) {
    const allowedFields = ['qualifications', 'experience', 'languages', 'availability', 'timing', 'image'];
    Object.keys(safeUpdates).forEach((key) => {
      if (!allowedFields.includes(key)) {
        delete safeUpdates[key];
      }
    });
  }

  const updatedDoctor = await Doctor.findByIdAndUpdate(id, safeUpdates, {
    new: true,
    runValidators: true,
  });
  return updatedDoctor;
};

export const submitDoctorCredentials = async (id, credentials, actor) => {
  const doctor = await Doctor.findById(id);
  if (!doctor || doctor.deletedAt) throw new ApiError(404, 'Doctor not found');

  // Verify that the caller is the doctor themselves or an authorized admin
  const isOwner = actor && doctor.user && actor._id.toString() === doctor.user.toString();
  const isAdmin = actor && ['admin', 'super_admin', 'hospital_admin'].includes(actor.role);
  if (!isOwner && !isAdmin) {
    throw new ApiError(403, 'You are not authorized to update credentials for this doctor');
  }

  const before = {
    verificationStatus: doctor.verificationStatus,
    medicalRegistrationNumber: doctor.medicalRegistrationNumber,
    rejectionReason: doctor.verificationRejectionReason,
  };

  if (credentials.medicalRegistrationNumber) doctor.medicalRegistrationNumber = credentials.medicalRegistrationNumber.trim();
  if (credentials.qualifications) doctor.qualifications = credentials.qualifications.trim();
  if (credentials.department) doctor.department = credentials.department.trim();
  if (credentials.experience) doctor.experience = credentials.experience.trim();
  if (credentials.languages) doctor.languages = credentials.languages;

  doctor.verificationStatus = 'under_review';
  await doctor.save();

  await AuditLog.create({
    actor: actor._id,
    actorRole: actor.role,
    action: before.verificationStatus === 'rejected' ? 'DOCTOR_CREDENTIALS_RESUBMITTED' : 'DOCTOR_CREDENTIALS_SUBMITTED',
    entity: 'Doctor',
    entityId: doctor._id.toString(),
    hospitalId: doctor.hospitalId || actor.hospitalId || null,
    before,
    after: {
      verificationStatus: 'under_review',
      medicalRegistrationNumber: doctor.medicalRegistrationNumber,
      department: doctor.department,
    },
  });

  return doctor;
};

export const deleteDoctor = async (id, actor = null) => {
  if (!actor) {
    throw new ApiError(401, 'Authentication required');
  }

  const doctor = await Doctor.findOne({ _id: id, deletedAt: null });
  if (!doctor) throw new ApiError(404, 'Doctor not found');

  const isSuperAdmin = actor.role === 'super_admin';
  const isHospitalAdmin = ['hospital_admin', 'admin'].includes(actor.role);

  if (!isSuperAdmin && !isHospitalAdmin) {
    throw new ApiError(403, 'Unauthorized to delete doctor profile');
  }

  if (isHospitalAdmin && !isSuperAdmin) {
    if (!actor.hospitalId || !doctor.hospitalId || doctor.hospitalId.toString() !== actor.hospitalId.toString()) {
      throw new ApiError(403, 'Cross-hospital access forbidden: You can only delete doctors from your own hospital');
    }
  }

  doctor.deletedAt = new Date();
  doctor.status = 'inactive';
  doctor.isPublished = false;
  await doctor.save();
  return doctor;
};

export const approveDoctor = async (id, actor, meta = {}) => {
  const doctor = await Doctor.findById(id);
  if (!doctor || doctor.deletedAt) throw new ApiError(404, 'Doctor not found');

  if (doctor.status === 'inactive') {
    throw new ApiError(400, 'Cannot approve an inactive or suspended doctor profile');
  }

  // Enforce Hospital-level data isolation
  if (actor.role === 'hospital_admin') {
    if (!actor.hospitalId || (doctor.hospitalId && doctor.hospitalId.toString() !== actor.hospitalId.toString())) {
      throw new ApiError(403, 'Cross-hospital access forbidden: You can only approve doctors for your own hospital');
    }
    if (!doctor.hospitalId) {
      doctor.hospitalId = actor.hospitalId;
    }
  } else if (!['admin', 'super_admin'].includes(actor.role)) {
    throw new ApiError(403, 'Unauthorized to approve doctor credentials');
  }

  const before = {
    verificationStatus: doctor.verificationStatus,
    isApproved: doctor.isApproved,
    isPublished: doctor.isPublished,
  };

  doctor.verificationStatus = 'verified';
  doctor.isApproved = true;
  doctor.isPublished = true;
  doctor.verificationReviewedBy = actor._id;
  doctor.verificationReviewedAt = new Date();
  doctor.verificationRejectionReason = null;
  await doctor.save();

  await AuditLog.create({
    actor: actor._id,
    actorRole: actor.role,
    action: 'DOCTOR_CREDENTIALS_APPROVED',
    entity: 'Doctor',
    entityId: doctor._id.toString(),
    hospitalId: doctor.hospitalId || actor.hospitalId || null,
    before,
    after: {
      verificationStatus: 'verified',
      isApproved: true,
      isPublished: true,
    },
    ip: meta.ip || null,
    userAgent: meta.userAgent || null,
  });

  return doctor;
};

export const rejectDoctor = async (id, reason, actor, meta = {}) => {
  if (!reason || !reason.trim()) {
    throw new ApiError(400, 'Rejection reason is required');
  }

  const doctor = await Doctor.findById(id);
  if (!doctor || doctor.deletedAt) throw new ApiError(404, 'Doctor not found');

  // Enforce Hospital-level data isolation
  if (actor.role === 'hospital_admin') {
    if (!actor.hospitalId || (doctor.hospitalId && doctor.hospitalId.toString() !== actor.hospitalId.toString())) {
      throw new ApiError(403, 'Cross-hospital access forbidden: You can only reject doctors for your own hospital');
    }
  } else if (!['admin', 'super_admin'].includes(actor.role)) {
    throw new ApiError(403, 'Unauthorized to reject doctor credentials');
  }

  const before = {
    verificationStatus: doctor.verificationStatus,
    isApproved: doctor.isApproved,
    isPublished: doctor.isPublished,
  };

  doctor.verificationStatus = 'rejected';
  doctor.isApproved = false;
  doctor.isPublished = false;
  doctor.verificationReviewedBy = actor._id;
  doctor.verificationReviewedAt = new Date();
  doctor.verificationRejectionReason = reason.trim();
  await doctor.save();

  await AuditLog.create({
    actor: actor._id,
    actorRole: actor.role,
    action: 'DOCTOR_CREDENTIALS_REJECTED',
    entity: 'Doctor',
    entityId: doctor._id.toString(),
    hospitalId: doctor.hospitalId || actor.hospitalId || null,
    before,
    after: {
      verificationStatus: 'rejected',
      isApproved: false,
      isPublished: false,
      verificationRejectionReason: reason.trim(),
    },
    ip: meta.ip || null,
    userAgent: meta.userAgent || null,
  });

  return doctor;
};