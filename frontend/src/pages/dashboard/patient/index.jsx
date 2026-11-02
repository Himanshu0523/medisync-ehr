import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { selectUser } from '../../../store/slices/authSlice';

export default function PatientDashboard() {
  const user = useSelector(selectUser);

  const [activeTab, setActiveTab] = useState('appointments');

  const upcomingAppointments = [
    {
      id: 'apt-001',
      doctor: 'Dr. Sarah Johnson, MD',
      specialty: 'Internal Medicine',
      date: 'Tomorrow, Oct 31',
      time: '10:30 AM',
      type: 'Video Consultation',
      status: 'confirmed',
      room: 'Room 302 - Virtual',
    },
    {
      id: 'apt-002',
      doctor: 'Dr. Marcus Chen, MD',
      specialty: 'Cardiology',
      date: 'Nov 05, 2026',
      time: '02:00 PM',
      type: 'In-Person Examination',
      status: 'scheduled',
      room: 'Clinical Suite 4B',
    },
  ];

  const medicalReports = [
    {
      id: 'rep-881',
      title: 'Comprehensive Metabolic Panel (CMP)',
      date: 'Oct 24, 2026',
      orderedBy: 'Dr. Sarah Johnson',
      status: 'Ready',
      fileSize: '1.4 MB',
    },
    {
      id: 'rep-882',
      title: 'Lipid Profile & Glucose Fasting',
      date: 'Oct 24, 2026',
      orderedBy: 'Dr. Sarah Johnson',
      status: 'Ready',
      fileSize: '890 KB',
    },
    {
      id: 'rep-883',
      title: '12-Lead Electrocardiogram (ECG)',
      date: 'Sep 15, 2026',
      orderedBy: 'Dr. Marcus Chen',
      status: 'Archived',
      fileSize: '3.2 MB',
    },
  ];

  return (
    <div className="flex-1 w-full bg-slate-50 min-h-screen pb-16">
      {/* Top Banner */}
      <section className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-700/50 border border-blue-400/30 text-blue-200 text-xs px-3 py-1 rounded-full uppercase tracking-wider font-semibold mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Patient Health Portal
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Hello, {user?.name || 'Patient'}
            </h1>
            <p className="text-blue-100/80 text-sm mt-1">
              MediSync ID: <span className="font-mono text-white">{user?._id?.slice(-8) || 'MS-9021'}</span> • Connected Care Center
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/doctors"
              className="py-3 px-5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-sm shadow-lg shadow-blue-900/30 transition flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Book New Appointment
            </Link>
          </div>
        </div>
      </section>

      {/* Metrics Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Upcoming Visits</span>
            <span className="text-3xl font-extrabold text-blue-600 mt-1 block">2</span>
            <span className="text-xs text-emerald-600 font-semibold mt-1 inline-block">Next: Tomorrow 10:30 AM</span>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Active Prescriptions</span>
            <span className="text-3xl font-extrabold text-indigo-600 mt-1 block">3</span>
            <span className="text-xs text-slate-500 mt-1 inline-block">Refill in 12 days</span>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Lab Reports</span>
            <span className="text-3xl font-extrabold text-emerald-600 mt-1 block">2 New</span>
            <span className="text-xs text-emerald-600 font-semibold mt-1 inline-block">Synced from Lab</span>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Primary Doctor</span>
            <span className="text-lg font-bold text-slate-800 mt-1 block truncate">Dr. S. Johnson</span>
            <span className="text-xs text-slate-500 mt-1 inline-block">Internal Medicine</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 gap-6 mb-6">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`pb-3 font-semibold text-sm transition relative ${
              activeTab === 'appointments'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            My Appointments
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`pb-3 font-semibold text-sm transition relative ${
              activeTab === 'reports'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Diagnostic Reports
          </button>
        </div>

        {/* Tab 1: Appointments */}
        {activeTab === 'appointments' && (
          <div className="space-y-4">
            {upcomingAppointments.map((apt) => (
              <div
                key={apt.id}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900">{apt.doctor}</h3>
                      <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {apt.status}
                      </span>
                    </div>
                    <p className="text-xs text-blue-600 font-semibold mt-0.5">{apt.specialty}</p>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        🗓️ {apt.date} at {apt.time}
                      </span>
                      <span>•</span>
                      <span>📍 {apt.room}</span>
                      <span>•</span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">
                        {apt.type}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="py-2.5 px-4 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white text-xs shadow-sm transition"
                  >
                    Join Virtual Room
                  </button>
                  <button
                    type="button"
                    className="py-2.5 px-4 rounded-xl font-semibold border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs transition"
                  >
                    Reschedule
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Reports */}
        {activeTab === 'reports' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Synchronized Clinical Test Results</h2>
              <p className="text-xs text-slate-500">Encrypted electronic records signed by laboratory directors</p>
            </div>
            <div className="divide-y divide-slate-100">
              {medicalReports.map((rep) => (
                <div key={rep.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">{rep.title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {rep.date} • Ordered by {rep.orderedBy} • {rep.fileSize}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="py-2 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 font-semibold text-xs text-slate-700 flex items-center gap-1.5 self-start sm:self-auto transition"
                  >
                    <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download PDF
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
