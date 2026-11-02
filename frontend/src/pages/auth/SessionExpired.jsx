import { Link } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout';

export default function SessionExpiredPage() {
  return (
    <AuthLayout
      title="Session Expired"
      subtitle="For patient data security and HIPAA compliance, your session was ended due to inactivity."
      showHero={false}
      maxWidth="max-w-md"
    >
      <div className="py-4 text-center space-y-5 animate-fade-in">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto border border-blue-100 shadow-sm">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
          Please authenticate with your credentials to resume your clinical consultation and record management.
        </p>

        <div className="pt-2">
          <Link
            to="/login"
            className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-md shadow-blue-500/20 inline-block text-center"
          >
            Sign In Again
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
