import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../lib/api';

export default function SuperAdminInviteHospitalAdmin() {
  const { hospitalId } = useParams();

  const [hospital, setHospital] = useState(null);
  const [loadingHospital, setLoadingHospital] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: '', token: '' }

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    designation: 'Hospital Administrator',
  });

  useEffect(() => {
    let ignore = false;
    async function loadHospital() {
      try {
        const res = await api.get(`/hospitals/${hospitalId}`);
        if (!ignore && res.data) {
          setHospital(res.data);
        }
      } catch {
        // Fallback
      } finally {
        if (!ignore) setLoadingHospital(false);
      }
    }

    loadHospital();
    return () => { ignore = true; };
  }, [hospitalId]);

  const handleChange = (e) => {
    setFeedback(null);
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    const cleanMobile = formData.mobile.replace(/[\s\-()+]/g, '');
    if (!/^[0-9]{10,15}$/.test(cleanMobile)) {
      setFeedback({
        type: 'error',
        message: 'Mobile number must be between 10 and 15 digits.',
      });
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.toLowerCase().trim(),
        mobile: cleanMobile,
        role: 'hospital_admin',
        hospitalId: hospitalId,
      };

      const res = await api.post('/auth/invite-staff', payload);
      const generatedToken = res?.data?.invitationToken || res?.invitationToken;

      setFeedback({
        type: 'success',
        message: `Official Hospital Administrator invitation dispatched for ${formData.name}.`,
        token: generatedToken,
      });

      // Clear form
      setFormData({
        name: '',
        email: '',
        mobile: '',
        designation: 'Hospital Administrator',
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to dispatch hospital administrator invitation.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
          <Link to="/super-admin/hospitals" className="hover:text-slate-800">
            Hospitals
          </Link>
          <span>/</span>
          {hospital ? (
            <Link to={`/super-admin/hospitals/${hospital._id}`} className="hover:text-slate-800">
              {hospital.name}
            </Link>
          ) : (
            <span>Facility</span>
          )}
          <span>/</span>
          <span className="text-slate-800 font-bold">Invite Administrator</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Invite Hospital Administrator
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Assign an executive administrator with delegated authority to manage staff, doctors, and departments for this specific facility.
        </p>
      </div>

      {/* Target Hospital Context Card */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 shadow-xs flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-[10px] uppercase tracking-wider text-blue-300 font-bold block">
            Target Institutional Tenant
          </span>
          <h3 className="text-base sm:text-lg font-bold">
            {loadingHospital ? 'Loading hospital context...' : hospital?.name || 'Selected Facility'}
          </h3>
          <p className="text-xs text-slate-300">
            Hospital Code: <span className="font-mono text-emerald-300 font-semibold">{hospital?.code || hospitalId}</span>
          </p>
        </div>

        <span className="px-3 py-1 bg-white/10 text-white rounded-xl text-xs font-semibold border border-white/20">
          Strict Tenant Isolation
        </span>
      </div>

      {/* Feedback Alerts */}
      {feedback && (
        <div
          className={`p-5 rounded-2xl text-xs sm:text-sm space-y-3 animate-fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
              : 'bg-red-50 border border-red-200 text-red-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold">{feedback.message}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-slate-400 hover:text-slate-600 font-bold text-base"
            >
              &times;
            </button>
          </div>

          {feedback.token && (
            <div className="pt-2 border-t border-emerald-200/60 space-y-2">
              <p className="text-[11px] text-emerald-800 font-medium">
                Direct single-use activation URL for testing or manual dispatch:
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/accept-invitation?token=${feedback.token}`}
                  className="flex-1 px-3 py-2 rounded-xl bg-white border border-emerald-300 text-xs font-mono text-slate-700 select-all"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/accept-invitation?token=${feedback.token}`);
                    alert('Activation link copied to clipboard!');
                  }}
                  className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                >
                  Copy Link
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Invite Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-5">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Administrator Full Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. Dr. Rajesh Sharma"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm bg-slate-50/50"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Official Email Address *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g. rajesh.sharma@hospital.com"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm bg-slate-50/50"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Mobile Phone Number *
            </label>
            <input
              type="tel"
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              placeholder="e.g. 9826012345"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm bg-slate-50/50"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Administrative Role / Title
          </label>
          <input
            type="text"
            name="designation"
            value={formData.designation}
            onChange={handleChange}
            placeholder="e.g. Medical Superintendent / Hospital Director"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm bg-slate-50/50"
          />
        </div>

        <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-2xl text-[11px] text-blue-800 leading-relaxed">
          <strong>Security Note:</strong> The user will receive an email invitation to set their password. Once activated, they will have administrative controls restricted strictly to <span className="font-semibold">{hospital?.name || 'this hospital'}</span>.
        </div>

        <div className="pt-2 flex items-center justify-between">
          <Link
            to={`/super-admin/hospitals/${hospitalId}`}
            className="py-3 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={submitting}
            className="py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-md shadow-blue-500/20 disabled:opacity-50"
          >
            {submitting ? 'Dispatching Invitation...' : 'Send Administrator Invitation'}
          </button>
        </div>
      </form>
    </div>
  );
}
