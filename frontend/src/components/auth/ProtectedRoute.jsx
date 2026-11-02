import { useSelector } from 'react-redux';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { selectAuth } from '../../store/slices/authSlice';

export default function ProtectedRoute({ allowedRoles = [] }) {
  const { isAuthenticated, role, loading } = useSelector(selectAuth);
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium text-sm">Verifying authorization...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
