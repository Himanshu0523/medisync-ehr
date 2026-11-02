import { Link } from "react-router-dom";

const highlights = [
  {
    title: "24/7 Emergency Care",
    description:
      "Rapid response trauma care, advanced ambulance dispatch, and round-the-clock emergency physicians.",
    icon: (
      <svg
        className="w-7 h-7 text-red-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
    badge: "Immediate",
  },
  {
    title: "Verified Specialists",
    description:
      "Over 50+ board-certified surgeons, cardiologists, pediatricians, and general practitioners.",
    icon: (
      <svg
        className="w-7 h-7 text-blue-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
    ),
    badge: "Top Tier",
  },
  {
    title: "Digital Sync & Records",
    description:
      "Instant slot booking, automated appointment reminders, and tamper-proof electronic health records.",
    icon: (
      <svg
        className="w-7 h-7 text-emerald-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        />
      </svg>
    ),
    badge: "Real-Time",
  },
];

const featuredServices = [
  {
    title: "Cardiology Center",
    desc: "Comprehensive cardiovascular screening, diagnostics, and recovery plans.",
    link: "/services",
    tag: "Heart Health",
  },
  {
    title: "Pediatric Care",
    desc: "Gentle, preventative health screening and developmental monitoring for children.",
    link: "/services",
    tag: "Child Wellness",
  },
  {
    title: "Orthopedic Surgery",
    desc: "Modern joint reconstruction, sports medicine, and physical therapy alignment.",
    link: "/services",
    tag: "Joints & Bones",
  },
  {
    title: "Neurological Sciences",
    desc: "Dedicated electroencephalograms, migraine care, and specialized stroke management.",
    link: "/services",
    tag: "Neuro Health",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col w-full bg-slate-50 text-slate-800">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 text-white py-24 lg:py-32">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase bg-blue-700/40 text-blue-200 border border-blue-500/30 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              24/7 Digital Health Network
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
              Intelligent Healthcare,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-sky-200 to-emerald-300">
                Synchronized for You
              </span>
            </h1>
            <p className="text-base sm:text-lg text-blue-100/90 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              MediSync bridges clinical expertise with real-time appointment
              scheduling, encrypted medical records, and coordinated specialist
              care.
            </p>
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-4">
              <Link
                to="/doctors"
                className="px-7 py-3.5 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-500 transition shadow-lg shadow-blue-600/30 text-sm sm:text-base"
              >
                Book Appointment
              </Link>
              <Link
                to="/about"
                className="px-7 py-3.5 rounded-xl font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/20 transition backdrop-blur-md text-sm sm:text-base"
              >
                Learn More
              </Link>
            </div>

            {/* Quick Stat Bar */}
            <div className="pt-8 border-t border-blue-800/60 grid grid-cols-3 gap-4 max-w-lg mx-auto lg:mx-0">
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-white">
                  50+
                </p>
                <p className="text-xs text-blue-200 font-medium mt-0.5">
                  Specialists
                </p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-white">
                  100k+
                </p>
                <p className="text-xs text-blue-200 font-medium mt-0.5">
                  Patients Served
                </p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-white">
                  99.8%
                </p>
                <p className="text-xs text-blue-200 font-medium mt-0.5">
                  Satisfaction
                </p>
              </div>
            </div>
          </div>

          {/* Hero Visual Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-slate-900/50 backdrop-blur-sm">
              <img
                src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=700"
                alt="Medical Specialist with Digital Tablet"
                className="w-full h-[420px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex flex-col justify-end p-6">
                <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 text-slate-800 shadow-xl border border-white/60">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                      ✓
                    </div>
                    <div>
                      <p className="font-bold text-sm">
                        Real-Time Doctor Availability
                      </p>
                      <p className="text-xs text-slate-500">
                        Live slot confirmation across all clinics
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Core Highlights Cards */}
      <section className="relative -mt-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {highlights.map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-7 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                    {item.icon}
                  </div>
                  <span className="text-[11px] font-bold tracking-wider uppercase bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                    {item.badge}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Featured Departments */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
              Clinical Excellence
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-1">
              Specialized Medical Care
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-2 max-w-xl">
              Equipped with modern diagnostic technology and multi-disciplinary
              specialty boards.
            </p>
          </div>
          <Link
            to="/services"
            className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 self-start md:self-auto"
          >
            Explore all services &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredServices.map((service, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md mb-4 inline-block">
                  {service.tag}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {service.title}
                </h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-6">
                  {service.desc}
                </p>
              </div>
              <Link
                to={service.link}
                className="text-xs font-bold text-slate-700 hover:text-blue-600 transition flex items-center gap-1 pt-3 border-t border-slate-100"
              >
                Department Details &rarr;
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Action CTA */}
      <section className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black">
            Your Health, Synchronized and Simplified
          </h2>
          <p className="text-blue-100 text-base sm:text-lg max-w-xl mx-auto">
            Book your consultation with our board-certified doctors in less than
            two minutes.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-4">
            <Link
              to="/doctors"
              className="px-8 py-3.5 rounded-xl font-bold bg-white text-blue-700 hover:bg-blue-50 transition shadow-lg text-sm sm:text-base"
            >
              Find a Doctor
            </Link>
            <Link
              to="/contact"
              className="px-8 py-3.5 rounded-xl font-bold bg-blue-900/60 hover:bg-blue-900/80 text-white border border-blue-400/30 transition text-sm sm:text-base"
            >
              Contact Reception
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
