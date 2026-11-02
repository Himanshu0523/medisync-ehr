import { Link } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout';

export default function AccountPendingPage() {
  return (
    <AuthLayout
      title="Activation Pending"
      subtitle="Your account has been created and is awaiting email confirmation or hospital admin review."
      showHero={false}
      maxWidth="max-w-md"
    >
      <div className="py-4 text-center space-y-5 animate-fade-in">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto border border-blue-100 shadow-sm">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left text-xs text-slate-700 space-y-2">
          <p className="font-bold text-slate-900">Next Steps to Access Your Account:</p>
          <ul className="space-y-1.5 text-slate-600 list-disc list-inside text-[11px]">
            <li><strong>Patients:</strong> Check your inbox for the MediSync verification link.</li>
            <li><strong>Staff:</strong> Check your invitation email or contact your Hospital Administrator.</li>
          </ul>
        </div>

        <div className="space-y-3 pt-2">
          <Link
            to="/verify-email"
            className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-md shadow-blue-500/20 inline-block text-center"
          >
            Verify Email Address
          </Link>
          <Link
            to="/login"
            className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition inline-block text-center"
          >
            Return to Login
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
