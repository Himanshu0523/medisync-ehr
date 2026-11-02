import Hospital from './hospital.model.js';
import User from '../user/user.model.js';
import Doctor from '../doctor/doctor.model.js';
import PatientHospital from '../patientHospital/patientHospital.model.js';
import { ApiError } from '../../utils/ApiError.js';

export const createHospital = async (data) => {
  const normalizedCode = data.code ? data.code.toUpperCase().trim() : '';
  const normalizedEmail = data.email ? data.email.toLowerCase().trim() : '';

  const exists = await Hospital.findOne({
    $or: [{ code: normalizedCode }, { email: normalizedEmail }],
  });

  if (exists) {
    if (exists.code === normalizedCode) {
      throw new ApiError(409, `Hospital code '${normalizedCode}' is already registered`);
    }
    throw new ApiError(409, `Hospital email '${normalizedEmail}' is already registered`);
  }

  const hospital = await Hospital.create({
    name: data.name.trim(),
    code: normalizedCode,
    email: normalizedEmail,
    contactNumber: data.contactNumber.trim(),
    address: {
      street: data.address?.street?.trim() || '',
      city: data.address?.city?.trim() || '',
      state: data.address?.state?.trim() || '',
      postalCode: data.address?.postalCode?.trim() || '',
      country: data.address?.country?.trim() || 'India',
    },
    status: data.status || 'active',
  });

  return hospital;
};

export const listHospitals = async ({ search = '', status = '', city = '', page = 1, limit = 50, actor = null }) => {
  const filter = { deletedAt: null };

  if (status && status !== 'all') {
    filter.status = status;
  }

  if (city) {
    filter['address.city'] = { $regex: city, $options: 'i' };
  }

  if (search) {
    const s = search.trim();
    filter.$or = [
      { name: { $regex: s, $options: 'i' } },
      { code: { $regex: s, $options: 'i' } },
      { email: { $regex: s, $options: 'i' } },
      { 'address.city': { $regex: s, $options: 'i' } },
    ];
  }

  const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
  const total = await Hospital.countDocuments(filter);
  const hospitals = await Hospital.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit, 10))
    .lean();

  // Attach hospital admin details and counts
  const hospitalIds = hospitals.map((h) => h._id);
  const isSuperAdmin = actor && actor.role === 'super_admin';

  const [admins, doctorCounts, patientCounts] = await Promise.all([
    User.find({
      hospitalId: { $in: hospitalIds },
      role: { $in: ['hospital_admin', 'admin'] },
      deletedAt: null,
    })
      .select('name email mobile hospitalId status')
      .lean(),
    Doctor.aggregate([
      { $match: { hospitalId: { $in: hospitalIds }, deletedAt: null } },
      { $group: { _id: '$hospitalId', count: { $sum: 1 } } },
    ]),
    PatientHospital.aggregate([
      { $match: { hospital: { $in: hospitalIds } } },
      { $group: { _id: '$hospital', count: { $sum: 1 } } },
    ]),
  ]);

  const docCountMap = Object.fromEntries(doctorCounts.map((d) => [d._id.toString(), d.count]));
  const patCountMap = Object.fromEntries(patientCounts.map((p) => [p._id.toString(), p.count]));
  const adminMap = {};
  admins.forEach((a) => {
    if (a.hospitalId) {
      adminMap[a.hospitalId.toString()] = a;
    }
  });

  const enriched = hospitals.map((h) => {
    const hid = h._id.toString();
    const admin = adminMap[hid];
    let sanitizedAdmin = null;
    if (admin) {
      if (isSuperAdmin) {
        sanitizedAdmin = admin;
      } else {
        sanitizedAdmin = { name: admin.name };
      }
    }
    return {
      ...h,
      administrator: sanitizedAdmin,
      doctorsCount: docCountMap[hid] || 0,
      patientsCount: isSuperAdmin ? (patCountMap[hid] || 0) : undefined,
    };
  });

  return {
    hospitals: enriched,
    total,
    page: parseInt(page, 10),
    pages: Math.ceil(total / parseInt(limit, 10)),
  };
};

export const getHospitalById = async (hospitalId, actor = null) => {
  const hospital = await Hospital.findOne({ _id: hospitalId, deletedAt: null }).lean();
  if (!hospital) {
    throw new ApiError(404, 'Hospital not found');
  }

  const isSuperAdmin = actor && actor.role === 'super_admin';
  const isOwnStaff = actor && ['hospital_admin', 'admin', 'doctor', 'receptionist'].includes(actor.role) &&
    actor.hospitalId && actor.hospitalId.toString() === hospitalId.toString();

  if (isSuperAdmin || isOwnStaff) {
    const [administrators, doctors, patientRelations, patientsCount] = await Promise.all([
      User.find({
        hospitalId,
        role: { $in: ['hospital_admin', 'admin'] },
        deletedAt: null,
      }).select('name email mobile status createdAt'),
      Doctor.find({ hospitalId, deletedAt: null }).select('name specialization email mobile verificationStatus isPublished isApproved'),
      PatientHospital.find({ hospital: hospitalId })
        .populate({
          path: 'patient',
          select: 'gender dateOfBirth bloodGroup user',
          populate: { path: 'user', select: 'name email mobile' },
        })
        .limit(10),
      PatientHospital.countDocuments({ hospital: hospitalId }),
    ]);

    return {
      ...hospital,
      administrators,
      administrator: administrators[0] || null,
      doctorsCount: doctors.length,
      doctors: doctors.slice(0, 10),
      patientsCount,
      recentPatients: patientRelations,
    };
  }

  // Public / external access: strictly only public metadata and published doctor count
  const publishedDoctorsCount = await Doctor.countDocuments({
    hospitalId,
    deletedAt: null,
    isPublished: true,
    isApproved: true,
    verificationStatus: 'verified',
    status: 'active',
  });

  return {
    ...hospital,
    doctorsCount: publishedDoctorsCount,
  };
};

export const updateHospital = async (hospitalId, updateData) => {
  const hospital = await Hospital.findOne({ _id: hospitalId, deletedAt: null });
  if (!hospital) {
    throw new ApiError(404, 'Hospital not found');
  }

  if (updateData.name) hospital.name = updateData.name.trim();
  if (updateData.contactNumber) hospital.contactNumber = updateData.contactNumber.trim();
  if (updateData.email) hospital.email = updateData.email.toLowerCase().trim();
  if (updateData.status) hospital.status = updateData.status;

  if (updateData.address) {
    hospital.address = {
      ...hospital.address.toObject(),
      ...updateData.address,
    };
  }

  await hospital.save();
  return hospital;
};

export const toggleHospitalStatus = async (hospitalId, status) => {
  const hospital = await Hospital.findOne({ _id: hospitalId, deletedAt: null });
  if (!hospital) {
    throw new ApiError(404, 'Hospital not found');
  }

  hospital.status = status || (hospital.status === 'active' ? 'inactive' : 'active');
  await hospital.save();
  return hospital;
};

export const getPlatformStats = async () => {
  const [
    totalHospitals,
    activeHospitals,
    inactiveHospitals,
    totalUsers,
    totalDoctors,
    totalPatients,
    totalReceptionists,
    recentHospitals,
  ] = await Promise.all([
    Hospital.countDocuments({ deletedAt: null }),
    Hospital.countDocuments({ status: 'active', deletedAt: null }),
    Hospital.countDocuments({ status: 'inactive', deletedAt: null }),
    User.countDocuments({ deletedAt: null }),
    User.countDocuments({ role: 'doctor', deletedAt: null }),
    User.countDocuments({ role: 'patient', deletedAt: null }),
    User.countDocuments({ role: 'receptionist', deletedAt: null }),
    Hospital.find({ deletedAt: null }).sort({ createdAt: -1 }).limit(5).lean(),
  ]);

  return {
    totalHospitals,
    activeHospitals,
    inactiveHospitals,
    totalUsers,
    totalDoctors,
    totalPatients,
    totalReceptionists,
    recentHospitals,
  };
};
