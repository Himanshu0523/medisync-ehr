import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import AuthLayout from '../../components/auth/AuthLayout';
import PasswordInput from '../../components/auth/PasswordInput';
import PasswordStrength from '../../components/auth/PasswordStrength';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';

  const [token, setToken] = useState(tokenFromUrl);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token.trim()) {
      setError('Password reset token is required.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/auth/reset-password', { token: token.trim(), password });
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Invalid or expired password reset token. Please request a new link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create New Password"
      subtitle="Your new password must be at least 8 characters with a mix of uppercase, lowercase, and numbers."
      showHero={false}
      maxWidth="max-w-md"
    >
      {success ? (
        <div className="py-4 text-center space-y-5 animate-fade-in">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100 shadow-sm">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900">Password Successfully Changed</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              All active sessions have been safely terminated. You can now sign in with your updated credentials.
            </p>
          </div>

          <div className="pt-2">
            <Link
              to="/login"
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-md shadow-blue-500/20 inline-block text-center"
            >
              Sign In Now
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
              {error}
            </div>
          )}

          {!tokenFromUrl && (
            <div>
              <label htmlFor="reset-token" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Reset Token
              </label>
              <input
                id="reset-token"
                type="text"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste the reset token from your email"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm bg-slate-50/50 text-slate-800 font-mono transition"
              />
            </div>
          )}

          <div>
            <label htmlFor="new-password" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              New Password
            </label>
            <PasswordInput
              id="new-password"
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
            <label htmlFor="confirm-new-password" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Confirm New Password
            </label>
            <PasswordInput
              id="confirm-new-password"
              name="confirmPassword"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-4 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white transition shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 text-sm disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Updating Password...</span>
              </>
            ) : (
              <span>Reset Password</span>
            )}
          </button>

          <div className="mt-6 text-center text-xs text-slate-500">
            <Link to="/login" className="font-semibold text-blue-600 hover:underline">
              Back to Sign In
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
