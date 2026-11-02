import { Link } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout';

export default function AccountLockedPage() {
  return (
    <AuthLayout
      title="Security Lockout Active"
      subtitle="Your account has been temporarily secured following 10 consecutive failed authentication attempts."
      showHero={false}
      maxWidth="max-w-md"
    >
      <div className="py-4 text-center space-y-5 animate-fade-in">
        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto border border-amber-200/80 shadow-sm">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        <div className="bg-amber-50/70 border border-amber-200/60 rounded-2xl p-4 text-left text-xs text-amber-900 space-y-2">
          <p className="font-bold flex items-center gap-1.5 text-amber-950">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Automated Protection Measure
          </p>
          <p className="text-[11px] text-amber-800 leading-relaxed">
            In compliance with HIPAA healthcare data standards, accounts are automatically locked for 30 minutes to protect medical records against brute-force intrusion attempts.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <Link
            to="/forgot-password"
            className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-md shadow-blue-500/20 inline-block text-center"
          >
            Reset Password to Unlock Immediately
          </Link>
          <Link
            to="/login"
            className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition inline-block text-center"
          >
            Return to Login
          </Link>
        </div>

        <p className="text-[11px] text-slate-400">
          Need immediate medical access? Please contact your hospital helpdesk.
        </p>
      </div>
    </AuthLayout>
  );
}
