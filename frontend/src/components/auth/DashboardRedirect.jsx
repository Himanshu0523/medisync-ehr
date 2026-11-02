import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUserRole } from '../../store/slices/authSlice';

export default function DashboardRedirect() {
  const role = useSelector(selectUserRole);
  const target =
    {
      patient: '/patient/dashboard',
      doctor: '/doctor/dashboard',
      receptionist: '/receptionist/dashboard',
      hospital_admin: '/hospital-admin/dashboard',
      super_admin: '/super-admin/dashboard',
      admin: '/admin/dashboard',
    }[role] || '/login';

  return <Navigate to={target} replace />;
}

