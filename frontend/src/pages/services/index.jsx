import { useState } from "react";
import { Link } from "react-router-dom";

const SERVICES_CATALOG = [
  {
    id: "primary-care",
    title: "Primary Care",
    subtitle: "Comprehensive health services for all ages",
    description:
      "Routine health assessments, preventative immunizations, lifestyle coaching, and chronic disease management designed for lifelong wellness.",
    badge: "Routine & Preventative",
    icon: (
      <svg
        className="w-6 h-6 text-blue-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
        />
      </svg>
    ),
    features: [
      "Annual Physicals",
      "Vaccinations & Boosters",
      "Hypertension & Diabetes Care",
      "Health Screenings",
    ],
  },
  {
    id: "cardiology",
    title: "Cardiology",
    subtitle: "Expert heart and cardiovascular care",
    description:
      "Advanced diagnostics including ECG, echocardiograms, remote telemetry, and interventional cardiovascular treatments.",
    badge: "Specialized Care",
    icon: (
      <svg
        className="w-6 h-6 text-rose-600"
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
    features: [
      "Echocardiography (Echo)",
      "Stress Testing",
      "Holter Monitoring",
      "Post-Op Cardiac Rehab",
    ],
  },
  {
    id: "pediatrics",
    title: "Pediatrics",
    subtitle: "Specialized care for children and adolescents",
    description:
      "Gentle, child-centered clinical care spanning newborn development, childhood immunizations, and urgent pediatric treatments.",
    badge: "Family & Children",
    icon: (
      <svg
        className="w-6 h-6 text-amber-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    features: [
      "Well-Baby Checkups",
      "Developmental Milestones",
      "Childhood Vaccines",
      "Adolescent Medicine",
    ],
  },
  {
    id: "orthopedics",
    title: "Orthopedics",
    subtitle: "Bone, joint, and muscle specialists",
    description:
      "Cutting-edge treatment for sports injuries, joint degradation, fractures, and rehabilitation to restore mobility.",
    badge: "Musculoskeletal",
    icon: (
      <svg
        className="w-6 h-6 text-indigo-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11"
        />
      </svg>
    ),
    features: [
      "Joint Replacement",
      "Sports Medicine",
      "Fracture Care & Casting",
      "Physical Therapy Sync",
    ],
  },
  {
    id: "dermatology",
    title: "Dermatology",
    subtitle: "Skin health and cosmetic treatments",
    description:
      "Expert diagnosis of dermatological conditions, skin cancer screenings, acne therapies, and laser dermatological care.",
    badge: "Skin Health",
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
    features: [
      "Full-Body Mole Mapping",
      "Eczema & Psoriasis",
      "Acne Solutions",
      "Cryotherapy & Biopsies",
    ],
  },
  {
    id: "neurology",
    title: "Neurology",
    subtitle: "Brain and nervous system specialists",
    description:
      "Specialized care for headaches, seizure disorders, neuropathy, neurodegenerative conditions, and stroke recovery support.",
    badge: "Neuroscience",
    icon: (
      <svg
        className="w-6 h-6 text-cyan-600"
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
    features: [
      "EEG Diagnostics",
      "Migraine Management",
      "Epilepsy Monitoring",
      "Cognitive Assessments",
    ],
  },
];

const FAQS = [
  {
    question: "Do I need a prior referral to book a specialist service?",
    answer:
      "Most clinical specialties at MediSync do not require a referral unless specifically mandated by your insurance policy.",
  },
  {
    question: "How quickly are diagnostic test reports updated?",
    answer:
      "Routine blood panels and laboratory tests are synced to your patient portal within 12 to 24 hours of sample collection.",
  },
  {
    question: "Are telehealth appointments supported for these services?",
    answer:
      "Yes, follow-up consultations and routine primary care visits can be conducted directly via our secure video portal.",
  },
];

export default function ServicesPage() {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="flex flex-col w-full bg-slate-50 text-slate-800 min-h-screen">
      {/* 1. Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-950 py-16 lg:py-24 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase bg-blue-700/50 text-blue-200 border border-blue-500/30 mb-5">
            Comprehensive Clinical Care
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            Our Medical Services
          </h1>
          <p className="mt-4 text-lg text-blue-100/90 max-w-2xl mx-auto">
            From routine check-ups to specialized surgical interventions,
            MediSync connects state-of-the-art facilities with experienced
            physicians.
          </p>
        </div>
      </section>

      {/* 2. Service Cards Grid */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
            Medical Departments
          </span>
          <h2 className="text-3xl font-bold text-slate-900 mt-2">
            All Clinical Offerings
          </h2>
          <p className="text-slate-600 text-sm sm:text-base mt-2">
            Explore our specialized departments and connect directly with
            dedicated physicians.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {SERVICES_CATALOG.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-lg transition-all duration-200 p-7 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200/70">
                    {service.icon}
                  </div>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                    {service.badge}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-1">
                  {service.title}
                </h3>
                <p className="text-xs font-semibold text-blue-600 mb-3">
                  {service.subtitle}
                </p>
                <p className="text-slate-600 text-sm leading-relaxed mb-6">
                  {service.description}
                </p>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Key Offerings
                  </p>
                  <ul className="space-y-1.5">
                    {service.features.map((feature, idx) => (
                      <li
                        key={idx}
                        className="flex items-center text-xs text-slate-700"
                      >
                        <svg
                          className="w-4 h-4 text-emerald-500 mr-2 flex-shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2.5"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-8 pt-4 flex gap-3 border-t border-slate-100">
                <Link
                  to={`/doctors?specialty=${encodeURIComponent(service.title)}`}
                  className="flex-1 text-center py-2.5 px-3 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
                >
                  View Doctors
                </Link>
                <Link
                  to={`/portal/patient/booking?service=${service.id}`}
                  className="flex-1 text-center py-2.5 px-3 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-sm"
                >
                  Book Care
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Common Questions (FAQ Accordion) */}
      <section className="py-16 bg-slate-100/70 border-t border-slate-200/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-600 text-sm mt-2">
              Information regarding service booking and clinical coverage.
            </p>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left font-semibold text-slate-900 text-sm sm:text-base hover:bg-slate-50 transition"
                >
                  <span>{faq.question}</span>
                  <svg
                    className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                      openFaq === idx ? "rotate-180 text-blue-600" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-4 pt-1 text-slate-600 text-sm leading-relaxed border-t border-slate-100 bg-slate-50/50">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Action Banner */}
      <section className="bg-blue-600 py-12 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div>
            <span className="text-xs font-semibold tracking-wider uppercase text-blue-200">
              24/7 Clinical Triage
            </span>
            <h3 className="text-2xl font-bold mt-1">
              Need help deciding which service is right?
            </h3>
            <p className="text-sm text-blue-100 mt-1">
              Speak directly with our nursing intake team for quick triage
              assistance.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="tel:5551234567"
              className="inline-flex items-center px-6 py-3 rounded-xl font-bold bg-white text-blue-700 hover:bg-blue-50 transition shadow-md text-sm"
            >
              (555) 123-4567
            </a>
            <Link
              to="/portal/patient/booking"
              className="inline-flex items-center px-6 py-3 rounded-xl font-bold bg-blue-800 text-white hover:bg-blue-900 transition text-sm"
            >
              Book an Appointment
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
