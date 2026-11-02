import { NavLink, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectAuth } from '../../store/slices/authSlice';

const Navbar = ({ isOpen, setIsOpen, items }) => {
  const { isAuthenticated, role } = useSelector(selectAuth);

  return (
    <>
      {/* Desktop Links View */}
      <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
        {items.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `px-3.5 py-2 rounded-lg font-medium text-sm transition-colors duration-150 ${
                isActive
                  ? 'text-white bg-slate-800/80 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
              }`
            }
          >
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Mobile Drawer Dropdown View */}
      {isOpen && (
        <div className="absolute top-20 left-0 w-full md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-3 pb-6 space-y-1 z-40 shadow-2xl animate-fade-in">
          {items.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => setIsOpen && setIsOpen(false)}
              className={({ isActive }) =>
                `block px-4 py-3 rounded-xl font-medium transition-colors text-sm ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`
              }
            >
              {item.name}
            </NavLink>
          ))}

          {/* Mobile Auth/Dashboard CTA */}
          <div className="pt-3 border-t border-slate-800 mt-2 space-y-2">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                onClick={() => setIsOpen && setIsOpen(false)}
                className="block text-center bg-slate-800 border border-slate-700 text-white font-semibold py-3 rounded-xl text-sm transition"
              >
                Go to {role?.toUpperCase()} Dashboard
              </Link>
            ) : (
              <Link
                to="/login"
                onClick={() => setIsOpen && setIsOpen(false)}
                className="block text-center bg-slate-800 text-slate-200 font-semibold py-3 rounded-xl text-sm transition hover:text-white"
              >
                Sign In to Portal
              </Link>
            )}

            <Link
              to="/doctors"
              onClick={() => setIsOpen && setIsOpen(false)}
              className="block text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-md text-sm transition"
            >
              Book Appointment
            </Link>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
