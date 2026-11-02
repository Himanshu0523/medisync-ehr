import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { selectUserRole } from '../../store/slices/authSlice';

export default function UnauthorizedPage() {
  const role = useSelector(selectUserRole);

  const getDashboardPath = () => {
    switch (role) {
      case 'patient':
        return '/patient/dashboard';
      case 'doctor':
        return '/doctor/dashboard';
      case 'receptionist':
        return '/receptionist/dashboard';
      case 'hospital_admin':
        return '/hospital-admin/dashboard';
      case 'super_admin':
        return '/super-admin/dashboard';
      case 'admin':
        return '/admin/dashboard';
      default:
        return '/';
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/60 border border-slate-100 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-100">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <span className="text-xs font-bold uppercase tracking-widest text-red-600 bg-red-50 px-3 py-1 rounded-full">
          403 Access Restricted
        </span>

        <h1 className="text-2xl font-black text-slate-900 mt-4 mb-2">
          Insufficient Permissions
        </h1>

        <p className="text-sm text-slate-600 leading-relaxed mb-6">
          Your current account role ({role ? <span className="font-bold text-slate-800 uppercase text-xs tracking-wider bg-slate-100 px-2 py-0.5 rounded">{role}</span> : 'Guest'}) does not have permission to access this administrative portal.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to={getDashboardPath()}
            className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition shadow-md shadow-blue-500/20 text-center"
          >
            Go to My Dashboard
          </Link>
          <Link
            to="/"
            className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition text-center"
          >
            Back Home
          </Link>
        </div>
      </div>
    </div>
  );
}
