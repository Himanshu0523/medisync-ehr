import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  loginUser,
  clearError,
  selectAuth,
} from '../../store/slices/authSlice';
import AuthLayout from '../../components/auth/AuthLayout';
import PasswordInput from '../../components/auth/PasswordInput';

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, role, loading, error } = useSelector(selectAuth);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // Redirect if already authenticated based on role
  useEffect(() => {
    if (isAuthenticated && role) {
      const from = location.state?.from?.pathname;
      if (from && from !== '/login') {
        navigate(from, { replace: true });
      } else {
        const rolePath = {
          patient: '/patient/dashboard',
          doctor: '/doctor/dashboard',
          receptionist: '/receptionist/dashboard',
          hospital_admin: '/admin/dashboard',
          super_admin: '/admin/dashboard',
          admin: '/admin/dashboard',
        }[role] || '/';
        navigate(rolePath, { replace: true });
      }
    }
  }, [isAuthenticated, role, navigate, location.state]);

  const handleChange = (e) => {
    if (error) dispatch(clearError());
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(loginUser({ email: formData.email, password: formData.password }));
  };

  const isLockedError = error && error.toLowerCase().includes('locked');
  const isUnverifiedError = error && error.toLowerCase().includes('verify your email');

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in with your verified credentials to access your clinical portal."
      showHero={true}
    >
      {/* Error Alert Banner */}
      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200/80 text-red-700 text-xs sm:text-sm flex items-start gap-3 animate-fade-in">
          <svg className="w-5 h-5 shrink-0 text-red-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <p className="font-bold">Authentication Notice</p>
            <p className="mt-0.5 text-xs text-red-600">{error}</p>
            {isUnverifiedError && (
              <div className="mt-2">
                <Link
                  to="/verify-email"
                  className="font-bold underline text-blue-700 hover:text-blue-900 text-xs"
                >
                  Verify your email address now →
                </Link>
              </div>
            )}
            {isLockedError && (
              <div className="mt-2">
                <Link
                  to="/forgot-password"
                  className="font-bold underline text-amber-800 hover:text-amber-950 text-xs"
                >
                  Reset password to unlock account →
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="login-email" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Email Address
          </label>
          <input
            id="login-email"
            type="email"
            name="email"
            required
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="name@medisync.com"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm bg-slate-50/50 text-slate-800 transition"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="login-password" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Password
            </label>
            <Link to="/forgot-password" className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline">
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="login-password"
            name="password"
            required
            autoComplete="current-password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
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
              <span>Verifying credentials...</span>
            </>
          ) : (
            <span>Sign In to mediSync</span>
          )}
        </button>
      </form>

      {/* Registration & Recovery Links */}
      <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <span>
          New patient?{' '}
          <Link to="/register" className="font-bold text-blue-600 hover:underline">
            Create an Account
          </Link>
        </span>
        <Link to="/accept-invitation" className="font-medium text-slate-500 hover:text-slate-800">
          Have a Staff Invitation?
        </Link>
      </div>
    </AuthLayout>
  );
}
