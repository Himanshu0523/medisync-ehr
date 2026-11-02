import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { selectUser } from '../../../store/slices/authSlice';
import { api } from '../../../lib/api';

const DEPARTMENTS = [
  'General Medicine',
  'Cardiology & Vascular',
  'Pediatrics & Neonatology',
  'Neurology & Spine',
  'Orthopedics & Joint Replacement',
  'Dermatology & Cosmetology',
  'Obstetrics & Gynecology',
  'Oncology',
  'Ophthalmology',
  'Psychiatry & Behavioral Health',
  'Emergency & Critical Care',
];

const SPECIALIZATIONS = [
  'Internal Medicine',
  'Cardiology',
  'Pediatrics',
  'Dermatology',
  'Neurology',
  'Orthopedic Surgery',
  'General Surgery',
  'Radiology',
  'Anesthesiology',
  'Gynecology',
];

export default function InviteStaffPage() {
  const currentUser = useSelector(selectUser);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: '' }
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'pending' | 'under_review' | 'verified' | 'rejected'

  // Invitation Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    role: 'doctor',
    department: 'General Medicine',
    medicalRegistrationNumber: '',
    specialization: 'Internal Medicine',
    qualifications: 'MD, MBBS',
    experience: '10+ yrs exp',
    languages: 'English, Spanish',
    hospital: currentUser?.hospitalName || 'MediSync Central Hospital',
    timing: '09:00 - 17:00',
  });

  // Recent Staff & Doctors List
  const [staffList, setStaffList] = useState([]);

  // Rejection Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedDoctorForReject, setSelectedDoctorForReject] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);
  const reloadStaff = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      try {
        const [usersRes, docsRes] = await Promise.allSettled([
          api.get('/users?limit=100'),
          api.get('/doctors?includeUnpublished=true&limit=100'),
        ]);

        const rawUsers =
          usersRes.status === 'fulfilled' && usersRes.value.data?.users
            ? usersRes.value.data.users
            : [];

        const rawDoctors =
          docsRes.status === 'fulfilled' && docsRes.value.data?.doctors
            ? docsRes.value.data.doctors
            : [];

        // Combine user and doctor metadata
        const combined = rawDoctors.map((doc) => {
          const matchedUser = rawUsers.find(
            (u) => (doc.user && (doc.user._id === u._id || doc.user === u._id)) || doc.email === u.email
          );

          return {
            _id: doc._id,
            doctorId: doc._id,
            userId: matchedUser?._id,
            name: doc.name,
            email: doc.email,
            mobile: doc.mobile,
            role: 'doctor',
            department: doc.department || 'General Medicine',
            specialization: doc.specialization,
            medicalRegistrationNumber: doc.medicalRegistrationNumber,
            qualifications: doc.qualifications,
            accountStatus: matchedUser?.status || (doc.user ? 'active' : 'pending'),
            verificationStatus: doc.verificationStatus || (doc.isApproved ? 'verified' : 'pending_verification'),
            isApproved: doc.isApproved || false,
            isPublished: doc.isPublished || false,
            rejectionReason: doc.verificationRejectionReason,
            reviewedBy: doc.verificationReviewedBy?.name || 'Hospital Admin',
            reviewedAt: doc.verificationReviewedAt,
            createdAt: doc.createdAt,
          };
        });

        // Also append receptionists and other staff from users
        rawUsers
          .filter((u) => u.role === 'receptionist')
          .forEach((r) => {
            combined.push({
              _id: r._id,
              userId: r._id,
              name: r.name,
              email: r.email,
              mobile: r.mobile,
              role: 'receptionist',
              department: 'Reception & Patient Ingestion',
              specialization: 'Front Desk Administration',
              accountStatus: r.status,
              verificationStatus: 'verified',
              isApproved: true,
              isPublished: false,
              createdAt: r.createdAt,
            });
          });

        if (!ignore) {
          setStaffList(combined);
        }
      } catch {
        // Keep existing list on network issue
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      ignore = true;
    };
  }, [refreshKey]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    const cleanMobile = formData.mobile.replace(/[\s\-()+]/g, '');

    // Validation
    if (!/^[0-9]{10,15}$/.test(cleanMobile)) {
      setFeedback({
        type: 'error',
        message: 'Please provide a valid 10-15 digit mobile phone number.',
      });
      setSubmitting(false);
      return;
    }

    if (formData.role === 'doctor' && !formData.medicalRegistrationNumber.trim()) {
      setFeedback({
        type: 'error',
        message: 'Doctor Medical Council Registration Number is required for clinical verification.',
      });
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.toLowerCase().trim(),
        mobile: cleanMobile,
        role: formData.role,
        ...(formData.role === 'doctor'
          ? {
              department: formData.department,
              medicalRegistrationNumber: formData.medicalRegistrationNumber.trim(),
              specialization: formData.specialization,
              qualifications: formData.qualifications.trim(),
              experience: formData.experience.trim(),
              languages: formData.languages.split(',').map((l) => l.trim()),
              hospital: formData.hospital.trim(),
              timing: formData.timing,
            }
          : {}),
      };

      await api.post('/auth/invite-staff', payload);

      setFeedback({
        type: 'success',
        message: `Official invitation successfully issued to ${formData.name}. Clinical profile and credential verification record initialized.`,
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        mobile: '',
        role: 'doctor',
        department: 'General Medicine',
        medicalRegistrationNumber: '',
        specialization: 'Internal Medicine',
        qualifications: 'MD, MBBS',
        experience: '10+ yrs exp',
        languages: 'English, Spanish',
        hospital: currentUser?.hospitalName || 'MediSync Central Hospital',
        timing: '09:00 - 17:00',
      });

      reloadStaff();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to dispatch staff invitation. Please review input parameters.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (doctor) => {
    try {
      await api.patch(`/doctors/${doctor.doctorId}/approve`);
      setFeedback({
        type: 'success',
        message: `Doctor ${doctor.name} successfully verified! Clinical privileges granted and profile published to the public directory.`,
      });
      reloadStaff();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Authorization failed when verifying doctor credentials.',
      });
    }
  };

  const openRejectModal = (doctor) => {
    setSelectedDoctorForReject(doctor);
    setRejectionReason('');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectionReason.trim()) {
      setFeedback({
        type: 'error',
        message: 'A detailed medical credential rejection reason is mandatory.',
      });
      return;
    }

    setRejecting(true);
    try {
      await api.patch(`/doctors/${selectedDoctorForReject.doctorId}/reject`, {
        reason: rejectionReason.trim(),
      });

      setFeedback({
        type: 'success',
        message: `Doctor ${selectedDoctorForReject.name}'s credentials have been rejected. Reason logged in audit registry.`,
      });

      setRejectModalOpen(false);
      setSelectedDoctorForReject(null);
      reloadStaff();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to record credential rejection.',
      });
    } finally {
      setRejecting(false);
    }
  };

  const filteredStaff = staffList.filter((s) => {
    if (activeFilter === 'pending') return s.verificationStatus === 'pending_verification';
    if (activeFilter === 'under_review') return s.verificationStatus === 'under_review';
    if (activeFilter === 'verified') return s.verificationStatus === 'verified';
    if (activeFilter === 'rejected') return s.verificationStatus === 'rejected';
    return true;
  });

  return (
    <div className="flex-1 w-full bg-slate-50 min-h-screen pb-20">
      {/* Top Banner */}
      <section className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white py-10 px-4 sm:px-6 lg:px-8 border-b border-indigo-950/40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs px-3 py-1 rounded-full uppercase tracking-wider font-semibold mb-3">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
              Clinical Governance & Onboarding
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Staff Invitations & Doctor Verification
            </h1>
            <p className="text-slate-300 text-sm mt-1.5 max-w-2xl">
              Invite medical practitioners and administrative staff to your hospital tenant. Review credentials, license registration numbers, and manage professional publication.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/admin/dashboard"
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition border border-white/10 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Admin Command</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-5 space-y-8">
        {/* Global Alert Notification */}
        {feedback && (
          <div
            className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-start justify-between gap-3 shadow-sm animate-fade-in ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <span className="text-base mt-0.5">
                {feedback.type === 'success' ? '✓' : '⚠️'}
              </span>
              <div>
                <p className="font-bold">
                  {feedback.type === 'success' ? 'Onboarding Successful' : 'Action Blocked'}
                </p>
                <p className="mt-0.5 text-xs opacity-90">{feedback.message}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="font-bold text-xs opacity-60 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Staff Invitation Form (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200/80">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Invite New Staff</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Generate secure single-use activation invitation
                </p>
              </div>
              <span className="px-3 py-1 bg-blue-50 text-blue-700 text-[11px] font-bold rounded-full border border-blue-100">
                Tenant: {currentUser?.hospitalName || 'Main Hospital'}
              </span>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              {/* Role Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Staff Role Assignment *
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, role: 'doctor' }))}
                    className={`py-2 text-xs font-bold rounded-lg transition ${
                      formData.role === 'doctor'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Medical Doctor
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, role: 'receptionist' }))}
                    className={`py-2 text-xs font-bold rounded-lg transition ${
                      formData.role === 'receptionist'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Front Receptionist
                  </button>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder={formData.role === 'doctor' ? 'e.g. Dr. Arthur Conan' : 'e.g. Jane Doe'}
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>

              {/* Email & Mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Official Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="doctor@hospital.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobile Phone *
                  </label>
                  <input
                    type="tel"
                    name="mobile"
                    required
                    placeholder="10-15 digits"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>
              </div>

              {/* Doctor-Specific Credentials Fields */}
              {formData.role === 'doctor' && (
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
                      Medical Credentials
                    </span>
                    <span className="h-px flex-1 bg-indigo-100"></span>
                  </div>

                  {/* Medical Council Registration Number */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Medical Registration / Council Number *
                    </label>
                    <input
                      type="text"
                      name="medicalRegistrationNumber"
                      required
                      placeholder="e.g. MCI-2019-84729"
                      value={formData.medicalRegistrationNumber}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Required for background credential verification before granting clinical write privileges.
                    </p>
                  </div>

                  {/* Department & Specialization */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Clinical Department *
                      </label>
                      <select
                        name="department"
                        value={formData.department}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                      >
                        {DEPARTMENTS.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Specialization *
                      </label>
                      <select
                        name="specialization"
                        value={formData.specialization}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                      >
                        {SPECIALIZATIONS.map((spec) => (
                          <option key={spec} value={spec}>
                            {spec}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Qualifications & Experience */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Qualifications
                      </label>
                      <input
                        type="text"
                        name="qualifications"
                        placeholder="e.g. MBBS, MD, FRCS"
                        value={formData.qualifications}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Experience
                      </label>
                      <input
                        type="text"
                        name="experience"
                        placeholder="e.g. 12+ yrs exp"
                        value={formData.experience}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Consultation Timings */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Consultation Hours & Schedule
                    </label>
                    <input
                      type="text"
                      name="timing"
                      placeholder="e.g. 09:00 - 17:00 (Mon-Fri)"
                      value={formData.timing}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Submit Invitation */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs transition shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      <span>Dispatching Invitation...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span>Send Official Staff Invitation</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Verification & Invitations Registry (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Filter Chips Bar */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'all', label: 'All Staff' },
                  { id: 'pending', label: 'Pending Activation' },
                  { id: 'under_review', label: 'Under Review' },
                  { id: 'verified', label: 'Verified & Published' },
                  { id: 'rejected', label: 'Rejected' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveFilter(tab.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                      activeFilter === tab.id
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={reloadStaff}
                disabled={loading}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold"
              >
                <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh</span>
              </button>
            </div>

            {/* Staff Cards List */}
            <div className="space-y-3.5">
              {filteredStaff.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80">
                  <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">No staff records match filter</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Try changing your status filter or invite a new doctor using the form.
                  </p>
                </div>
              ) : (
                filteredStaff.map((staff) => (
                  <div
                    key={staff._id}
                    className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 hover:border-slate-300 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-100 text-indigo-700 font-extrabold flex items-center justify-center text-sm border border-indigo-200/50 shrink-0">
                          {staff.name.slice(0, 2).toUpperCase()}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-bold text-slate-900">{staff.name}</h3>
                            <span className="text-[11px] font-semibold text-slate-500">
                              ({staff.role})
                            </span>

                            {/* Verification Status Pill */}
                            {staff.verificationStatus === 'verified' && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Verified & Published
                              </span>
                            )}
                            {staff.verificationStatus === 'under_review' && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200 animate-pulse">
                                Under Review
                              </span>
                            )}
                            {staff.verificationStatus === 'pending_verification' && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                Pending Activation
                              </span>
                            )}
                            {staff.verificationStatus === 'rejected' && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                Credentials Rejected
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                            <span>📧 {staff.email}</span>
                            <span>📱 {staff.mobile}</span>
                            {staff.department && (
                              <span className="text-indigo-600 font-medium">
                                🏥 {staff.department}
                              </span>
                            )}
                          </p>

                          {staff.role === 'doctor' && (
                            <div className="mt-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600 space-y-1">
                              <div className="flex items-center justify-between">
                                <span>
                                  <strong>Specialization:</strong> {staff.specialization}
                                </span>
                                <span>
                                  <strong>Degrees:</strong> {staff.qualifications || 'MD'}
                                </span>
                              </div>
                              {staff.medicalRegistrationNumber && (
                                <div className="text-slate-700">
                                  <strong>Council Reg ID:</strong>{' '}
                                  <code className="px-1.5 py-0.5 bg-slate-200/80 rounded text-[10px] font-mono font-semibold">
                                    {staff.medicalRegistrationNumber}
                                  </code>
                                </div>
                              )}
                              {staff.rejectionReason && (
                                <div className="text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-100 text-[10px] mt-1.5">
                                  <strong>Rejection Notice:</strong> {staff.rejectionReason}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Admin Actions */}
                      {staff.role === 'doctor' && (
                        <div className="flex sm:flex-col items-center gap-2 shrink-0 pt-2 sm:pt-0">
                          {staff.verificationStatus !== 'verified' && (
                            <button
                              type="button"
                              onClick={() => handleApprove(staff)}
                              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                              <span>Approve & Publish</span>
                            </button>
                          )}

                          {staff.verificationStatus !== 'rejected' && (
                            <button
                              type="button"
                              onClick={() => openRejectModal(staff)}
                              className="px-3.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition cursor-pointer"
                            >
                              <span>Reject Credentials</span>
                            </button>
                          )}

                          {staff.verificationStatus === 'verified' && (
                            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                              ✓ Clinical Active
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Rejection Reason Modal */}
      {rejectModalOpen && selectedDoctorForReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Reject Medical Credentials
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Doctor: {selectedDoctorForReject.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-base"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3">
              <p className="text-xs text-slate-600">
                Please provide a precise clinical reason for declining this doctor's credentials. This reason will be logged in the immutable audit registry and displayed to the practitioner.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Rejection Rationale *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Medical registration council ID could not be validated with state medical council database."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                ></textarea>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={rejecting || !rejectionReason.trim()}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl transition shadow-md shadow-rose-500/20"
              >
                {rejecting ? 'Recording Rejection...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
