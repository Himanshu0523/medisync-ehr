import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import AuthLayout from '../../components/auth/AuthLayout';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Unable to process password reset request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset Your Password"
      subtitle="Enter your verified MediSync account email and we'll send you secure recovery instructions."
      showHero={false}
      maxWidth="max-w-md"
    >
      {submitted ? (
        <div className="py-4 text-center space-y-5 animate-fade-in">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto border border-blue-100 shadow-sm">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900">Recovery Instructions Dispatched</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              If an active MediSync account is associated with <strong className="text-slate-800">{email}</strong>, a single-use 30-minute password reset link has been dispatched to your inbox.
            </p>
          </div>

          <div className="pt-2">
            <Link
              to="/login"
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-md shadow-blue-500/20 inline-block text-center"
            >
              Return to Sign In
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

          <div>
            <label htmlFor="recovery-email" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Account Email Address
            </label>
            <input
              id="recovery-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@medisync.com"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm bg-slate-50/50 text-slate-800 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white transition shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 text-sm disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Sending Instructions...</span>
              </>
            ) : (
              <span>Send Recovery Link</span>
            )}
          </button>

          <div className="mt-6 text-center text-xs text-slate-500">
            Remember your password?{' '}
            <Link to="/login" className="font-bold text-blue-600 hover:underline">
              Sign In
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
