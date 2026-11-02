import { Link } from 'react-router-dom';

export default function AuthLayout({
  children,
  title,
  subtitle,
  showHero = true,
  maxWidth = 'max-w-5xl',
}) {
  return (
    <div className="min-h-[88vh] flex items-center justify-center px-4 py-8 sm:py-12 bg-slate-50">
      <div className={`${maxWidth} w-full bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden`}>
        <div className={`grid ${showHero ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'} min-h-[580px]`}>
          {/* Form Column */}
          <div className={`${showHero ? 'lg:col-span-7' : 'w-full max-w-md mx-auto'} p-8 sm:p-12 flex flex-col justify-between`}>
            <div>
              {/* MediSync Brand Logo */}
              <div className="mb-6">
                <Link to="/" className="inline-flex items-center space-x-3 group">
                  <div className="relative w-8 h-8 flex items-center justify-center">
                    <div className="absolute w-2 h-8 bg-blue-600 rounded-sm"></div>
                    <div className="absolute w-8 h-2 bg-blue-600 rounded-sm"></div>
                    <div className="absolute w-4 h-4 bg-teal-500 rotate-45 opacity-70"></div>
                  </div>
                  <div className="flex items-center leading-none text-2xl font-bold">
                    <span className="text-slate-900 tracking-wide font-sans">medi</span>
                    <span className="text-blue-600 tracking-wide font-sans">Sync</span>
                  </div>
                </Link>
              </div>

              {/* Header Title & Subtitle */}
              {title && (
                <div className="mb-6">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {title}
                  </h1>
                  {subtitle && (
                    <p className="text-xs sm:text-sm text-slate-500 mt-1.5 font-medium leading-relaxed">
                      {subtitle}
                    </p>
                  )}
                </div>
              )}

              {/* Form Content */}
              {children}
            </div>

            {/* Micro Footer */}
            <div className="mt-8 pt-6 border-t border-slate-100 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
              <span>© {new Date().getFullYear()} MediSync Health Technologies</span>
              <div className="space-x-3">
                <Link to="/about" className="hover:text-slate-600 transition">Privacy</Link>
                <Link to="/about" className="hover:text-slate-600 transition">Terms</Link>
                <Link to="/contact" className="hover:text-slate-600 transition">Support</Link>
              </div>
            </div>
          </div>

          {/* Right Hero Column (Desktop Only) */}
          {showHero && (
            <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-950 text-white p-10 flex-col justify-between relative overflow-hidden">
              {/* Background Glow Orbs */}
              <div className="absolute -top-24 -right-24 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-teal-500/20 rounded-full blur-3xl pointer-events-none"></div>

              {/* Top Tag */}
              <div className="relative z-10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-blue-700/60 text-blue-200 border border-blue-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                  Multi-Hospital Network
                </span>
                <h2 className="text-2xl font-black tracking-tight mt-4 text-white leading-snug">
                  Your healthcare, connected.
                </h2>
                <p className="text-xs text-blue-100/90 mt-2 leading-relaxed">
                  Unified clinical management bringing patients, doctors, receptionists, and hospital administrators together on one secure platform.
                </p>
              </div>

              {/* Feature Highlights */}
              <div className="relative z-10 space-y-4 my-8">
                <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/30 text-teal-300 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">Secure Medical Records</h3>
                    <p className="text-[11px] text-blue-200/80 mt-0.5">Encrypted health information strictly accessible by authorized care teams.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/30 text-teal-300 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">Seamless Appointment Booking</h3>
                    <p className="text-[11px] text-blue-200/80 mt-0.5">Real-time scheduling with board-certified physicians across departments.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/30 text-teal-300 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">Connected Care Teams</h3>
                    <p className="text-[11px] text-blue-200/80 mt-0.5">Real-time coordination between triage, consultation, and billing desks.</p>
                  </div>
                </div>
              </div>

              {/* Bottom Trust Badge */}
              <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-blue-200/70">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  HIPAA & SOC-2 Ready
                </span>
                <span>256-bit AES Encryption</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
