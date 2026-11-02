import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import AuthLayout from '../../components/auth/AuthLayout';
import PasswordInput from '../../components/auth/PasswordInput';
import PasswordStrength from '../../components/auth/PasswordStrength';

export default function AcceptInvitationPage() {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';

  const [token, setToken] = useState(tokenFromUrl);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeClinicalPolicy, setAgreeClinicalPolicy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!agreeClinicalPolicy) {
      setError('You must accept the Clinical Governance and Confidentiality Agreement to activate your staff credentials.');
      return;
    }

    if (!token.trim()) {
      setError('Staff invitation token is required.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify your password entry.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter (A-Z).');
      return;
    }

    if (!/[a-z]/.test(password)) {
      setError('Password must contain at least one lowercase letter (a-z).');
      return;
    }

    if (!/[0-9]/.test(password)) {
      setError('Password must contain at least one number (0-9).');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/auth/accept-invitation', { token: token.trim(), password });
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Invalid, revoked, or expired invitation token. Please contact your Hospital Administrator.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Staff Account Activation"
      subtitle="Complete your clinical staff onboarding to access your assigned hospital workspace."
      showHero={false}
      maxWidth="max-w-md"
    >
      {success ? (
        <div className="py-4 text-center space-y-5 animate-fade-in">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto border border-emerald-100 shadow-sm">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <div>
            <h3 className="text-xl font-bold text-slate-900">Staff Account Activated</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Your staff credentials have been authenticated and your account status is now active. You may now sign in to your role-based portal.
            </p>
          </div>

          <div className="pt-2">
            <Link
              to="/login"
              className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-md shadow-blue-500/20 inline-block text-center"
            >
              Sign In to Staff Portal
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs animate-fade-in">
              {error}
            </div>
          )}

          {/* Invitation Notice Box */}
          <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 text-xs text-blue-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              Official Hospital Invitation
            </p>
            <p className="text-[11px] text-blue-800/80 leading-relaxed">
              Your role and hospital association are predetermined by your hospital administrator and cannot be modified.
            </p>
          </div>

          {!tokenFromUrl && (
            <div>
              <label htmlFor="invitation-token" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Invitation Token
              </label>
              <input
                id="invitation-token"
                type="text"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste token received in invitation email"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm bg-slate-50/50 text-slate-800 font-mono transition"
              />
            </div>
          )}

          <div>
            <label htmlFor="staff-password" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Set Permanent Password
            </label>
            <PasswordInput
              id="staff-password"
              name="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
            />
            <PasswordStrength password={password} />
          </div>

          <div>
            <label htmlFor="staff-confirm-password" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Confirm Password
            </label>
            <PasswordInput
              id="staff-confirm-password"
              name="confirmPassword"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
            />
          </div>

          {/* Compliance Agreement */}
          <div className="pt-1">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600">
              <input
                type="checkbox"
                checked={agreeClinicalPolicy}
                onChange={(e) => setAgreeClinicalPolicy(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span>
                I agree to adhere to all hospital clinical governance policies, HIPAA patient data confidentiality, and system audit monitoring.
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-4 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white transition shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 text-sm disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Activating Account...</span>
              </>
            ) : (
              <span>Accept Invitation & Activate</span>
            )}
          </button>

          <div className="mt-6 text-center text-xs text-slate-500">
            Already activated?{' '}
            <Link to="/login" className="font-semibold text-blue-600 hover:underline">
              Sign In
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
