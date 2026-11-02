import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { registerUser, clearError, selectAuth } from '../../store/slices/authSlice';
import AuthLayout from '../../components/auth/AuthLayout';
import PasswordInput from '../../components/auth/PasswordInput';
import PasswordStrength from '../../components/auth/PasswordStrength';

export default function RegisterPage() {
  const dispatch = useDispatch();
  const { loading, error } = useSelector(selectAuth);

  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });

  const [validationError, setValidationError] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');

  const handleChange = (e) => {
    if (error) dispatch(clearError());
    setValidationError('');
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData((prev) => ({ ...prev, [e.target.name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.acceptTerms) {
      setValidationError('You must agree to the Terms of Service and Privacy Policy to proceed.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setValidationError('Passwords do not match. Please verify your password entry.');
      return;
    }

    if (formData.password.length < 8) {
      setValidationError('Password must be at least 8 characters long.');
      return;
    }

    if (!/[A-Z]/.test(formData.password)) {
      setValidationError('Password must contain at least one uppercase letter (A-Z).');
      return;
    }

    if (!/[a-z]/.test(formData.password)) {
      setValidationError('Password must contain at least one lowercase letter (a-z).');
      return;
    }

    if (!/[0-9]/.test(formData.password)) {
      setValidationError('Password must contain at least one number (0-9).');
      return;
    }

    const cleanMobile = formData.mobile.replace(/[\s\-()+]/g, '');
    if (!/^[0-9]{10,15}$/.test(cleanMobile)) {
      setValidationError('Mobile number must be between 10 and 15 digits (digits only).');
      return;
    }

    const res = await dispatch(
      registerUser({
        name: formData.name.trim(),
        mobile: cleanMobile,
        email: formData.email.trim(),
        password: formData.password,
      })
    );

    if (!res.error) {
      setRegisteredEmail(formData.email);
    }
  };

  // State: Verification Pending Screen after registration
  if (registeredEmail) {
    return (
      <AuthLayout
        title="Check Your Email"
        subtitle="We've sent an activation link to complete your patient account setup."
        showHero={false}
        maxWidth="max-w-xl"
      >
        <div className="py-6 text-center space-y-5">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto border border-blue-100 shadow-sm">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-800">
              Verification sent to:
            </p>
            <p className="text-base font-bold text-blue-600 font-mono mt-0.5">
              {registeredEmail}
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs text-slate-600 text-left space-y-2">
            <p className="font-bold text-slate-800">What to do next:</p>
            <ol className="list-decimal list-inside space-y-1 text-slate-600">
              <li>Open your email inbox and look for MediSync Account Verification.</li>
              <li>Click the activation link to confirm your email.</li>
              <li>Once verified, sign in to book appointments and view medical records.</li>
            </ol>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Link
              to="/verify-email"
              className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-md shadow-blue-500/20 text-center"
            >
              Enter Verification Token
            </Link>
            <Link
              to="/login"
              className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition text-center"
            >
              Return to Sign In
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create Patient Account"
      subtitle="Register to book specialist appointments, access diagnostic reports, and manage family care."
      showHero={true}
    >
      {/* Validation or API Error Banner */}
      {(error || validationError) && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200/80 text-red-700 text-xs sm:text-sm flex items-start gap-3 animate-fade-in">
          <svg className="w-5 h-5 shrink-0 text-red-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-bold">Registration Alert</p>
            <p className="mt-0.5 text-xs text-red-600">{validationError || error}</p>
          </div>
        </div>
      )}

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="reg-name" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Full Legal Name
          </label>
          <input
            id="reg-name"
            type="text"
            name="name"
            required
            autoComplete="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Sarah Jenkins"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm bg-slate-50/50 text-slate-800 transition"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="reg-mobile" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Mobile Number
            </label>
            <input
              id="reg-mobile"
              type="tel"
              name="mobile"
              required
              autoComplete="tel"
              pattern="[0-9]{10,15}"
              value={formData.mobile}
              onChange={handleChange}
              placeholder="10-digit number"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm bg-slate-50/50 text-slate-800 transition"
            />
          </div>

          <div>
            <label htmlFor="reg-email" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Email Address
            </label>
            <input
              id="reg-email"
              type="email"
              name="email"
              required
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="sarah@example.com"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm bg-slate-50/50 text-slate-800 transition"
            />
          </div>
        </div>

        <div>
          <label htmlFor="reg-password" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Create Password
          </label>
          <PasswordInput
            id="reg-password"
            name="password"
            required
            autoComplete="new-password"
            value={formData.password}
            onChange={handleChange}
            placeholder="At least 8 characters"
          />
          <PasswordStrength password={formData.password} />
        </div>

        <div>
          <label htmlFor="reg-confirm-password" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Confirm Password
          </label>
          <PasswordInput
            id="reg-confirm-password"
            name="confirmPassword"
            required
            autoComplete="new-password"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Re-enter password"
          />
        </div>

        {/* Consent & Terms Checkbox */}
        <div className="pt-1">
          <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600">
            <input
              type="checkbox"
              name="acceptTerms"
              checked={formData.acceptTerms}
              onChange={handleChange}
              className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <span>
              I agree to the{' '}
              <Link to="/about" className="text-blue-600 font-semibold hover:underline">
                Terms of Service
              </Link>{' '}
              and acknowledge the MediSync{' '}
              <Link to="/about" className="text-blue-600 font-semibold hover:underline">
                Patient Privacy Notice
              </Link>
              .
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
              <span>Creating Patient Account...</span>
            </>
          ) : (
            <span>Create Patient Account</span>
          )}
        </button>
      </form>

      {/* Footer Link */}
      <div className="mt-6 text-center text-xs text-slate-500">
        Already registered with MediSync?{' '}
        <Link to="/login" className="font-bold text-blue-600 hover:underline">
          Sign In
        </Link>
      </div>
    </AuthLayout>
  );
}
