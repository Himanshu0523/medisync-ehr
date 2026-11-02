import { createBrowserRouter } from 'react-router-dom';
import App from '../App.jsx';
import HomePage from '../pages/home';
import AboutPage from '../pages/about';
import ServicesPage from '../pages/services';
import DoctorsPage from '../pages/doctors';
import ContactPage from '../pages/contact';

// Authentication Pages
import LoginPage from '../pages/auth/Login';
import RegisterPage from '../pages/auth/Register';
import ForgotPasswordPage from '../pages/auth/ForgotPassword';
import ResetPasswordPage from '../pages/auth/ResetPassword';
import VerifyEmailPage from '../pages/auth/VerifyEmail';
import ResendVerificationPage from '../pages/auth/ResendVerification';
import AcceptInvitationPage from '../pages/auth/AcceptInvitation';
import AccountLockedPage from '../pages/auth/AccountLocked';
import AccountPendingPage from '../pages/auth/AccountPending';
import AccountInactivePage from '../pages/auth/AccountInactive';
import SessionExpiredPage from '../pages/auth/SessionExpired';
import MfaVerificationPage from '../pages/auth/MfaVerification';
import UnauthorizedPage from '../pages/auth/Unauthorized';

// Auth Guards & Redirectors
import ProtectedRoute from '../components/auth/ProtectedRoute';
import DashboardRedirect from '../components/auth/DashboardRedirect';

// Role Dashboards
import PatientDashboard from '../pages/dashboard/patient';
import DoctorDashboard from '../pages/dashboard/doctor';
import ReceptionistDashboard from '../pages/dashboard/receptionist';
import AdminDashboard from '../pages/dashboard/admin';
import InviteStaffPage from '../pages/dashboard/admin/InviteStaff';

// Super Admin Platform Management
import SuperAdminLayout from '../components/layout/SuperAdminLayout';
import SuperAdminDashboard from '../pages/super-admin/Dashboard';
import SuperAdminHospitals from '../pages/super-admin/Hospitals';
import SuperAdminCreateHospital from '../pages/super-admin/CreateHospital';
import SuperAdminHospitalDetails from '../pages/super-admin/HospitalDetails';
import SuperAdminInviteHospitalAdmin from '../pages/super-admin/InviteHospitalAdmin';

export const routes = [
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'services',
        element: <ServicesPage />,
      },
      {
        path: 'doctors',
        element: <DoctorsPage />,
      },
      {
        path: 'about',
        element: <AboutPage />,
      },
      {
        path: 'contact',
        element: <ContactPage />,
      },

      // Core Authentication Routes
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'register',
        element: <RegisterPage />,
      },
      {
        path: 'forgot-password',
        element: <ForgotPasswordPage />,
      },
      {
        path: 'reset-password',
        element: <ResetPasswordPage />,
      },
      {
        path: 'verify-email',
        element: <VerifyEmailPage />,
      },
      {
        path: 'resend-verification',
        element: <ResendVerificationPage />,
      },
      {
        path: 'accept-invitation',
        element: <AcceptInvitationPage />,
      },

      // Security & Account Status Screens
      {
        path: 'account-locked',
        element: <AccountLockedPage />,
      },
      {
        path: 'account-pending',
        element: <AccountPendingPage />,
      },
      {
        path: 'account-inactive',
        element: <AccountInactivePage />,
      },
      {
        path: 'session-expired',
        element: <SessionExpiredPage />,
      },
      {
        path: 'mfa-verification',
        element: <MfaVerificationPage />,
      },
      {
        path: 'unauthorized',
        element: <UnauthorizedPage />,
      },

      // Protected Generic Dashboard Redirector
      {
        element: <ProtectedRoute allowedRoles={['patient', 'doctor', 'receptionist', 'hospital_admin', 'super_admin', 'admin']} />,
        children: [
          {
            path: 'dashboard',
            element: <DashboardRedirect />,
          },
        ],
      },

      // Protected Patient Portal
      {
        element: <ProtectedRoute allowedRoles={['patient', 'hospital_admin', 'super_admin', 'admin']} />,
        children: [
          {
            path: 'patient/dashboard',
            element: <PatientDashboard />,
          },
        ],
      },

      // Protected Doctor Portal
      {
        element: <ProtectedRoute allowedRoles={['doctor', 'hospital_admin', 'super_admin', 'admin']} />,
        children: [
          {
            path: 'doctor/dashboard',
            element: <DoctorDashboard />,
          },
        ],
      },

      // Protected Receptionist Portal
      {
        element: <ProtectedRoute allowedRoles={['receptionist', 'hospital_admin', 'super_admin', 'admin']} />,
        children: [
          {
            path: 'receptionist/dashboard',
            element: <ReceptionistDashboard />,
          },
        ],
      },

      // Protected Hospital Admin & Super Admin Portals
      // Protected Dedicated Super Admin Platform Management
      {
        element: <ProtectedRoute allowedRoles={['super_admin']} />,
        children: [
          {
            path: 'super-admin',
            element: <SuperAdminLayout />,
            children: [
              {
                index: true,
                element: <SuperAdminDashboard />,
              },
              {
                path: 'dashboard',
                element: <SuperAdminDashboard />,
              },
              {
                path: 'hospitals',
                element: <SuperAdminHospitals />,
              },
              {
                path: 'hospitals/new',
                element: <SuperAdminCreateHospital />,
              },
              {
                path: 'hospitals/:hospitalId',
                element: <SuperAdminHospitalDetails />,
              },
              {
                path: 'hospitals/:hospitalId/invite-admin',
                element: <SuperAdminInviteHospitalAdmin />,
              },
            ],
          },
        ],
      },

      // Protected Hospital Admin & General Admin Portals
      {
        element: <ProtectedRoute allowedRoles={['hospital_admin', 'super_admin', 'admin']} />,
        children: [
          {
            path: 'admin/dashboard',
            element: <AdminDashboard />,
          },
          {
            path: 'admin/invite-staff',
            element: <InviteStaffPage />,
          },
          {
            path: 'hospital-admin/dashboard',
            element: <AdminDashboard />,
          },
          {
            path: 'hospital-admin/invite-staff',
            element: <InviteStaffPage />,
          },
        ],
      },

      {
        path: '*',
        element: <HomePage />,
      },
    ],
  },
];

export const router = createBrowserRouter(routes);

export default router;