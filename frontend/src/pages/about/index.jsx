import { Link } from "react-router-dom";

const stats = [
  { label: "Years of Experience", value: "25+" },
  { label: "Board-Certified Doctors", value: "50+" },
  { label: "Patients Treated", value: "100k+" },
  { label: "Patient Satisfaction", value: "98%" },
];

const coreValues = [
  {
    title: "Compassion",
    description:
      "We treat every patient with empathy, kindness, and deep respect, addressing overall wellbeing beyond immediate symptoms.",
    icon: (
      <svg
        className="w-6 h-6 text-emerald-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    ),
  },
  {
    title: "Clinical Excellence",
    description:
      "Continuous advancement in modern diagnostics, evidence-based practices, and rigorous surgical protocols.",
    icon: (
      <svg
        className="w-6 h-6 text-emerald-600"
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
  },
  {
    title: "Integrity & Ethics",
    description:
      "Complete transparency in treatment pathways, patient data privacy (HIPAA compliance), and diagnostic billing.",
    icon: (
      <svg
        className="w-6 h-6 text-emerald-600"
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
  },
  {
    title: "Technology & Sync",
    description:
      "Seamless integration with real-time slot synchronization, digitized medical records, and rapid lab test deliveries.",
    icon: (
      <svg
        className="w-6 h-6 text-emerald-600"
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
  },
];

const leadershipBoard = [
  {
    name: "Dr. Sarah Johnson, MD",
    role: "Chief Medical Officer & Primary Care Director",
    credentials: "Johns Hopkins Medicine Alum • 18+ yrs experience",
    bio: "Pioneered MediSync’s integrated primary care protocols and patient-centric outpatient programs.",
    image:
      "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300&h=300",
  },
  {
    name: "Dr. Marcus Chen, MD, FACC",
    role: "Head of Cardiovascular Medicine",
    credentials: "Stanford Health Care • Lead Cardiac Surgeon",
    bio: "Specialist in minimally invasive catheter procedures and remote cardiac telemetry management.",
    image:
      "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300&h=300",
  },
  {
    name: "Dr. Elena Martinez, MD",
    role: "Chief of Pediatrics",
    credentials: "Boston Children’s Hospital • Pediatric Specialist",
    bio: "Dedicated to community health outreach, developmental screening, and preventative pediatric medicine.",
    image:
      "https://images.unsplash.com/photo-1594824813580-5309623e1e69?auto=format&fit=crop&q=80&w=300&h=300",
  },
];

export default function AboutPage() {
  return (
    <div className="flex flex-col w-full bg-slate-50 text-slate-800">
      {/* 1. Hero Header */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-950 py-20 lg:py-28 text-white">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto">
            Providing Compassionate Care, Driven by Modern Innovation
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-blue-100/90 max-w-2xl mx-auto leading-relaxed">
            For over two decades, MediSync has united board-certified
            specialists, synchronized health records, and empathetic clinical
            staff to provide seamless, patient-first medicine.
          </p>
        </div>
      </section>

      {/* 2. Key Metrics Strip */}
      <section className="relative -mt-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white/95 backdrop-blur-md p-6 sm:p-8 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="text-center p-2 border-r last:border-r-0 border-slate-100"
            >
              <div className="text-3xl sm:text-4xl font-black text-blue-600 tracking-tight">
                {stat.value}
              </div>
              <div className="text-xs sm:text-sm font-medium text-slate-500 mt-1 uppercase tracking-wider">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Mission & Overview */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="text-sm font-bold text-blue-600 uppercase tracking-widest">
              Our Mission
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight">
              A Connected Healthcare Experience Built Around You
            </h2>
            <p className="text-slate-600 leading-relaxed text-base sm:text-lg">
              At MediSync, we believe navigating your health journey should
              never be fragmented or stressful. We have built an ecosystem where
              appointment bookings, physician notes, and laboratory findings
              communicate in real time.
            </p>
            <p className="text-slate-600 leading-relaxed text-base sm:text-lg">
              Whether you are scheduling a routine checkup or undergoing
              specialized cardiology monitoring, our multi-disciplinary teams
              work in lockstep to keep you and your loved ones informed every
              step of the way.
            </p>
            <div className="pt-2 flex flex-wrap gap-4">
              <Link
                to="/doctors"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm"
              >
                Find a Doctor
              </Link>
              <Link
                to="/services"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
              >
                Our Specialties
              </Link>
            </div>
          </div>

          <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200">
            <img
              src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800"
              alt="MediSync Clinic Facility"
              className="w-full h-full object-cover min-h-[380px]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent flex items-end p-8">
              <div className="text-white">
                <p className="font-semibold text-lg">
                  State-of-the-Art Facilities
                </p>
                <p className="text-sm text-slate-200">
                  Designed for patient comfort and low-latency diagnostic
                  procedures.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Core Values Grid */}
      <section className="py-20 bg-slate-100/70 border-y border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-sm font-bold text-blue-600 uppercase tracking-widest">
              Guiding Principles
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-2">
              Our Core Values
            </h2>
            <p className="text-slate-600 mt-4">
              The foundational pillars that guide our clinical staff,
              administration, and technical design every single day.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {coreValues.map((value, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 hover:shadow-md transition"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-5">
                  {value.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {value.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Medical Executive Board */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-bold text-blue-600 uppercase tracking-widest">
            Clinical Leadership
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-2">
            Board of Directors & Specialists
          </h2>
          <p className="text-slate-600 mt-4">
            Our leadership team brings decades of international clinical
            excellence and academic research to guide MediSync.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {leadershipBoard.map((member, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm flex flex-col"
            >
              <div className="h-64 w-full bg-slate-100 overflow-hidden">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-cover object-top hover:scale-105 transition duration-300"
                />
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {member.name}
                  </h3>
                  <p className="text-blue-600 font-medium text-sm mt-0.5">
                    {member.role}
                  </p>
                  <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase mt-1">
                    {member.credentials}
                  </p>
                  <p className="text-slate-600 text-sm mt-4 leading-relaxed">
                    {member.bio}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Call to Action */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to experience seamless healthcare?
          </h2>
          <p className="text-blue-100 max-w-xl mx-auto text-base sm:text-lg">
            Schedule an appointment today. Choose your specialist, pick an open
            slot, and get instant real-time confirmation.
          </p>
          <div className="pt-2">
            <Link
              to="/doctors"
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl font-bold bg-white text-blue-700 hover:bg-blue-50 transition shadow-lg"
            >
              Book an Appointment
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
