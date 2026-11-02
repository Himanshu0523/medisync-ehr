import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import AuthLayout from '../../components/auth/AuthLayout';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';

  const [tokenInput, setTokenInput] = useState(tokenFromUrl);
  const [status, setStatus] = useState(tokenFromUrl ? 'verifying' : 'idle'); // 'idle' | 'verifying' | 'success' | 'error'
  const [message, setMessage] = useState('');
  const verifiedOnceRef = useRef(false);

  const executeVerification = useCallback(async (tok) => {
    setStatus('verifying');
    setMessage('');
    try {
      const res = await api.get(`/auth/verify-email?token=${encodeURIComponent(tok.trim())}`);
      setStatus('success');
      setMessage(res.data?.message || res.message || 'Email verified successfully! Your account is active.');
    } catch (err) {
      setStatus('error');
      setMessage(err.message || 'Verification token is invalid or has expired.');
    }
  }, []);

  useEffect(() => {
    if (tokenFromUrl && !verifiedOnceRef.current) {
      verifiedOnceRef.current = true;
      executeVerification(tokenFromUrl);
    }
  }, [tokenFromUrl, executeVerification]);


  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    executeVerification(tokenInput);
  };

  return (
    <AuthLayout
      title="Verify Email Address"
      subtitle="Confirm your ownership of this medical communication channel to activate your profile."
      showHero={false}
      maxWidth="max-w-md"
    >
      {status === 'verifying' && (
        <div className="py-8 text-center space-y-4 animate-fade-in">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <h3 className="text-base font-bold text-slate-800">Validating Verification Token...</h3>
          <p className="text-xs text-slate-500">Please wait while we confirm your account records.</p>
        </div>
      )}

      {status === 'success' && (
        <div className="py-6 text-center space-y-5 animate-fade-in">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto border border-emerald-100 shadow-sm">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div>
            <h3 className="text-xl font-bold text-slate-900">Email Verified!</h3>
            <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto leading-relaxed">
              {message}
            </p>
          </div>

          <div className="pt-2">
            <Link
              to="/login"
              className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-md shadow-blue-500/20 inline-block text-center"
            >
              Sign In to MediSync Portal
            </Link>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="py-6 text-center space-y-5 animate-fade-in">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto border border-red-100 shadow-sm">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <div>
            <h3 className="text-xl font-bold text-slate-900">Verification Failed</h3>
            <p className="text-xs text-red-600 mt-1 max-w-sm mx-auto leading-relaxed">
              {message}
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Link
              to="/resend-verification"
              className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-md shadow-blue-500/20 text-center"
            >
              Resend Verification Link
            </Link>
            <Link
              to="/login"
              className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition text-center"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      )}

      {status === 'idle' && (
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div>
            <label htmlFor="verify-token-input" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Verification Code or Token
            </label>
            <input
              id="verify-token-input"
              type="text"
              required
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Paste token from verification email"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm bg-slate-50/50 text-slate-800 font-mono transition"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-4 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white transition shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 text-sm cursor-pointer"
          >
            Verify My Account
          </button>

          <div className="mt-6 text-center text-xs text-slate-500">
            Need a fresh link?{' '}
            <Link to="/resend-verification" className="font-bold text-blue-600 hover:underline">
              Resend Verification Email
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
