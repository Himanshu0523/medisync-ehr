import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import Navbar from './navbar';
import { selectAuth, logoutUser } from '../../store/slices/authSlice';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated, role } = useSelector(selectAuth);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Services', path: '/services' },
    { name: 'Doctors', path: '/doctors' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/');
  };

  const getRoleBadgeColor = () => {
    switch (role) {
      case 'doctor':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'receptionist':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'hospital_admin':
      case 'super_admin':
      case 'admin':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      default:
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 font-sans text-sm relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center space-x-3 shrink-0 group">
            <div className="relative w-8 h-8 flex items-center justify-center">
              <div className="absolute w-2 h-8 bg-blue-600 rounded-sm group-hover:bg-blue-500 transition-colors"></div>
              <div className="absolute w-8 h-2 bg-blue-600 rounded-sm group-hover:bg-blue-500 transition-colors"></div>
              <div className="absolute w-4 h-4 bg-emerald-500 rotate-45 opacity-70"></div>
            </div>
            <div>
              <div className="flex items-center leading-none">
                <span className="text-white text-xl font-bold tracking-wide">medi</span>
                <span className="text-blue-500 text-xl font-bold tracking-wide">Sync</span>
              </div>
              <span className="text-slate-400 text-[9px] tracking-[0.15em] uppercase block font-semibold mt-1">
                Healthcare Center
              </span>
            </div>
          </Link>

          {/* Navigation */}
          <Navbar isOpen={isMenuOpen} setIsOpen={setIsMenuOpen} items={navLinks} />

          {/* Right Action / Auth Controls */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                {/* Role-Aware Dashboard Link */}
                <Link
                  to="/dashboard"
                  className="hidden sm:flex items-center gap-2 bg-slate-800 hover:bg-slate-700/80 px-3.5 py-2 rounded-xl border border-slate-700 transition text-xs font-semibold text-white"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>Dashboard</span>
                  <span
                    className={`font-mono text-[9px] uppercase px-1.5 py-0.5 rounded border ${getRoleBadgeColor()}`}
                  >
                    {role}
                  </span>
                </Link>

                {/* User Name Pill */}
                <span className="text-slate-300 text-xs hidden md:inline-block font-medium">
                  {user?.name?.split(' ')[0] || 'User'}
                </span>

                {/* Sign Out Button */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-slate-400 hover:text-white hover:bg-slate-800 px-3 py-2 rounded-xl text-xs font-medium transition"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Link
                  to="/login"
                  className="text-slate-300 hover:text-white px-3.5 py-2 rounded-xl text-xs font-semibold transition hover:bg-slate-800"
                >
                  Sign In
                </Link>
                <Link
                  to="/doctors"
                  className="hidden sm:inline-block bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-blue-500/20 transition text-xs whitespace-nowrap"
                >
                  Book Appointment
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Drawer Trigger */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle Menu"
              className="text-slate-400 hover:text-white p-2 md:hidden focus:outline-none transition-colors"
            >
              <svg className="w-6 h-6 stroke-current fill-none stroke-2" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
