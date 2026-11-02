import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../lib/api';

export default function SuperAdminHospitalDetails() {
  const { hospitalId } = useParams();

  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusToggling, setStatusToggling] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    let ignore = false;
    async function loadHospital() {
      try {
        const res = await api.get(`/hospitals/${hospitalId}`);
        if (!ignore && res.data) {
          setHospital(res.data);
        }
      } catch (err) {
        if (!ignore) setError(err.message || 'Hospital not found.');
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadHospital();
    return () => { ignore = true; };
  }, [hospitalId]);

  const handleToggleStatus = async () => {
    if (!hospital) return;
    const nextStatus = hospital.status === 'active' ? 'inactive' : 'active';
    setStatusToggling(true);
    setFeedback(null);

    try {
      await api.patch(`/hospitals/${hospital._id}/status`, { status: nextStatus });
      setHospital((prev) => ({ ...prev, status: nextStatus }));
      setFeedback({
        type: 'success',
        message: `Hospital status updated to ${nextStatus.toUpperCase()}.`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to update hospital status.',
      });
    } finally {
      setStatusToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3 animate-fade-in">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-slate-500 font-semibold">Loading institutional profile...</p>
      </div>
    );
  }

  if (error || !hospital) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-4 animate-fade-in">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto border border-red-100">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-slate-900">{error || 'Hospital record not found.'}</h3>
        <Link
          to="/super-admin/hospitals"
          className="inline-block py-2.5 px-4 rounded-xl bg-blue-600 text-white font-bold text-xs"
        >
          &larr; Back to Hospitals Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. Header & Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <Link to="/super-admin/hospitals" className="text-slate-400 hover:text-slate-700 text-xs font-semibold">
              &larr; Hospitals Directory
            </Link>
            <span className="text-slate-300">/</span>
            <span className="font-mono text-xs text-blue-600 font-bold">{hospital.code}</span>
          </div>

          <div className="flex items-center gap-3 mt-1.5">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {hospital.name}
            </h2>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                hospital.status === 'active'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${hospital.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
              {hospital.status}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to={`/super-admin/hospitals/${hospital._id}/invite-admin`}
            className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            <span>Invite Hospital Admin</span>
          </Link>

          <button
            type="button"
            onClick={handleToggleStatus}
            disabled={statusToggling}
            className={`py-2.5 px-4 rounded-xl text-xs font-bold transition border ${
              hospital.status === 'active'
                ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            {statusToggling ? 'Updating...' : hospital.status === 'active' ? 'Deactivate Hospital' : 'Activate Hospital'}
          </button>
        </div>
      </div>

      {/* 2. Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs sm:text-sm flex items-center justify-between animate-fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          <span>{feedback.message}</span>
          <button type="button" onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600 ml-4">
            &times;
          </button>
        </div>
      )}

      {/* 3. Metrics Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hospital Administrators</span>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">
            {hospital.administrators?.length || 0}
          </p>
          <span className="text-xs text-blue-600 font-semibold mt-1 inline-block">Authorized tenant managers</span>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Attending Physicians</span>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">
            {hospital.doctorsCount || 0}
          </p>
          <span className="text-xs text-emerald-600 font-semibold mt-1 inline-block">Registered to this facility</span>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Patients Registered</span>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">
            {hospital.patientsCount || 0}
          </p>
          <span className="text-xs text-amber-600 font-semibold mt-1 inline-block">Facility-specific MRN records</span>
        </div>
      </div>

      {/* 4. Two-Column Layout: Hospital Profile & Assigned Administrator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="font-bold text-base text-slate-900">Institutional Contact & Location</h3>
            <span className="text-xs font-mono text-slate-400">Created: {new Date(hospital.createdAt).toLocaleDateString()}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div>
              <p className="text-slate-400 font-semibold uppercase text-[11px]">Primary Email</p>
              <p className="font-bold text-slate-800 mt-1">{hospital.email}</p>
            </div>

            <div>
              <p className="text-slate-400 font-semibold uppercase text-[11px]">Contact Number</p>
              <p className="font-bold text-slate-800 mt-1">{hospital.contactNumber}</p>
            </div>

            <div className="sm:col-span-2">
              <p className="text-slate-400 font-semibold uppercase text-[11px]">Physical Address</p>
              <p className="font-medium text-slate-800 mt-1">
                {hospital.address?.street ? `${hospital.address.street}, ` : ''}
                {hospital.address?.city || 'City'}, {hospital.address?.state || 'State'} - {hospital.address?.postalCode || 'Postal Code'}
              </p>
              <p className="text-slate-500 text-xs mt-0.5">{hospital.address?.country || 'India'}</p>
            </div>
          </div>
        </div>

        {/* Administrator Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">Hospital Administrator</h3>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">RBAC Role</span>
            </div>

            {hospital.administrators && hospital.administrators.length > 0 ? (
              <div className="space-y-3 text-xs sm:text-sm">
                {hospital.administrators.map((admin) => (
                  <div key={admin._id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <p className="font-bold text-slate-900">{admin.name}</p>
                    <p className="text-slate-600 text-xs">{admin.email}</p>
                    <p className="text-slate-500 text-xs">{admin.mobile}</p>
                    <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                      {admin.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center space-y-2">
                <p className="text-xs text-slate-500">No administrator has been onboarded for this hospital yet.</p>
                <p className="text-[11px] text-slate-400">Invite an administrator so they can manage staff, doctors, and appointments.</p>
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100">
            <Link
              to={`/super-admin/hospitals/${hospital._id}/invite-admin`}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition inline-block text-center shadow-xs"
            >
              + Invite Administrator
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
