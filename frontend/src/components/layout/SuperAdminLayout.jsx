import { NavLink, Link, Outlet } from 'react-router-dom';

export default function SuperAdminLayout() {

  const navItems = [
    { name: 'Platform Overview', path: '/super-admin/dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { name: 'Hospital Directory', path: '/super-admin/hospitals', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { name: 'Register Hospital', path: '/super-admin/hospitals/new', icon: 'M12 4v16m8-8H4' },
    { name: 'Clinical Credentials & Staff', path: '/admin/invite-staff', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
  ];

  return (
    <div className="flex-1 w-full bg-slate-50 min-h-screen flex flex-col">
      {/* Super Admin Top Banner & Sub-Navbar */}
      <section className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs px-3 py-1 rounded-full uppercase tracking-wider font-semibold mb-2">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
                Multi-Hospital Platform Console
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Super Admin Command Center
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
                Centralized oversight for all healthcare institutions, hospital administrators, and network credentials.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/super-admin/hospitals/new"
                className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-900/30 transition flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Hospital</span>
              </Link>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex space-x-1 mt-6 border-t border-slate-800/80 pt-3 overflow-x-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                </svg>
                <span>{item.name}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </section>

      {/* Main Outlet Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </div>
    </div>
  );
}
