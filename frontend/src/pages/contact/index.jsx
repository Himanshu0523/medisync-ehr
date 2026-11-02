import { useState } from 'react';

export default function ContactPage() {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: 'General Enquiry',
    message: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormSubmitted(true);
  };

  return (
    <div className="flex flex-col w-full bg-slate-50 text-slate-800 min-h-screen">
      {/* 1. Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-950 py-16 lg:py-24 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase bg-blue-700/50 text-blue-200 border border-blue-500/30 mb-5">
            Get in Touch
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            Contact mediSync
          </h1>
          <p className="mt-4 text-lg text-blue-100/90 max-w-2xl mx-auto">
            Our clinical reception and emergency care team are ready to assist you. Reach out by phone, message, or visit our primary center.
          </p>
        </div>
      </section>

      {/* 2. Contact Information Cards */}
      <section className="relative -mt-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">24/7 Emergency</h3>
              <p className="text-xs text-slate-500 mt-1">Direct ambulance and trauma response</p>
              <a href="tel:5551234567" className="font-extrabold text-red-600 text-base mt-2 inline-block hover:underline">
                (555) 123-4567
              </a>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">General Enquiries</h3>
              <p className="text-xs text-slate-500 mt-1">Clinic appointments & records</p>
              <a href="mailto:care@medisync.com" className="font-semibold text-blue-600 text-sm mt-2 inline-block hover:underline">
                care@medisync.com
              </a>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Main Clinic Location</h3>
              <p className="text-xs text-slate-500 mt-1">742 Evergreen Healthcare Blvd</p>
              <p className="text-xs font-semibold text-slate-700 mt-2">Mon - Sun: 7:00 AM - 9:00 PM</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Message Form & Map */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Form */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-8 sm:p-10 shadow-sm border border-slate-200/80">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Send a Message</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1 mb-6">Patient Inquiry Form</h2>

            {formSubmitted ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-2">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto text-xl font-bold">✓</div>
                <h3 className="font-bold text-emerald-900 text-lg">Thank You for Contacting Us</h3>
                <p className="text-emerald-700 text-sm">
                  Your inquiry has been received. Our clinical coordinator will respond to you within 2-4 business hours.
                </p>
                <button
                  type="button"
                  onClick={() => setFormSubmitted(false)}
                  className="mt-4 px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Your Full Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Jane Doe"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="jane@example.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(555) 000-0000"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50 text-slate-700 font-medium"
                    >
                      <option value="General Enquiry">General Enquiry</option>
                      <option value="Appointment Support">Appointment Support</option>
                      <option value="Cardiology">Cardiology</option>
                      <option value="Pediatrics">Pediatrics</option>
                      <option value="Orthopedics">Orthopedics</option>
                      <option value="Diagnostic Lab">Diagnostic Lab</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Message</label>
                  <textarea
                    rows={4}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="How can our clinical staff assist you today?"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-6 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition shadow-md shadow-blue-500/20 text-sm"
                >
                  Submit Inquiry
                </button>
              </form>
            )}
          </div>

          {/* Quick Info & Schedule */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-xl">Operating Hours</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="font-medium">Monday - Friday</span>
                  <span className="font-bold text-slate-800">7:00 AM - 9:00 PM</span>
                </li>
                <li className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="font-medium">Saturday</span>
                  <span className="font-bold text-slate-800">8:00 AM - 6:00 PM</span>
                </li>
                <li className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="font-medium">Sunday</span>
                  <span className="font-bold text-slate-800">9:00 AM - 4:00 PM</span>
                </li>
                <li className="flex justify-between py-1.5 text-red-600 font-bold">
                  <span>Emergency Care</span>
                  <span>24 Hours / 7 Days</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-3xl p-8 shadow-sm space-y-3">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Rapid Transport</span>
              <h4 className="text-xl font-bold">Ambulance & Trauma Bay</h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                Dedicated emergency driveway access on East Wing 2. Immediate patient intake without delay.
              </p>
              <div className="pt-2">
                <a
                  href="tel:5551234567"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition"
                >
                  Call Ambulance Dispatch
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
