import { Link } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout';

export default function AccountInactivePage() {
  return (
    <AuthLayout
      title="Account Inactive / Suspended"
      subtitle="Access to this MediSync account is currently restricted by administrative policy."
      showHero={false}
      maxWidth="max-w-md"
    >
      <div className="py-4 text-center space-y-5 animate-fade-in">
        <div className="w-16 h-16 bg-slate-100 text-slate-500 rounded-3xl flex items-center justify-center mx-auto border border-slate-200 shadow-sm">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left text-xs text-slate-600 space-y-2">
          <p className="font-bold text-slate-800">Administrative Notice</p>
          <p className="text-[11px] leading-relaxed">
            This account may have been temporarily deactivated due to staff reassignment, departure, or security audit procedures.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <Link
            to="/contact"
            className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-md shadow-blue-500/20 inline-block text-center"
          >
            Contact Hospital Administration
          </Link>
          <Link
            to="/login"
            className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition inline-block text-center"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
