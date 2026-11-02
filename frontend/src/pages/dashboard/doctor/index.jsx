import { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '../../../store/slices/authSlice';

export default function DoctorDashboard() {
  const user = useSelector(selectUser);

  const [onDuty, setOnDuty] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const [patients, setPatients] = useState([
    {
      id: 'p-101',
      name: 'Eleanor Vance',
      age: 42,
      gender: 'Female',
      time: '09:00 AM',
      type: 'Follow-up Consultation',
      symptoms: 'Post-operative monitoring, blood pressure check',
      status: 'In Consultation',
      vitals: { bp: '122/80', pulse: '72 bpm', temp: '98.4 F' },
    },
    {
      id: 'p-102',
      name: 'James Wilson',
      age: 58,
      gender: 'Male',
      time: '09:45 AM',
      type: 'Routine Cardiogram Review',
      symptoms: 'Mild chest discomfort during exercise',
      status: 'Waiting in Room 4',
      vitals: { bp: '138/88', pulse: '84 bpm', temp: '98.6 F' },
    },
    {
      id: 'p-103',
      name: 'Amina Patel',
      age: 29,
      gender: 'Female',
      time: '10:30 AM',
      type: 'Telehealth Consultation',
      symptoms: 'Seasonal allergic rhinitis and asthma refill',
      status: 'Scheduled',
      vitals: { bp: '118/76', pulse: '68 bpm', temp: '98.1 F' },
    },
    {
      id: 'p-104',
      name: 'Robert Fox',
      age: 65,
      gender: 'Male',
      time: '11:15 AM',
      type: 'Comprehensive Exam',
      symptoms: 'Annual diabetic check & HbA1c review',
      status: 'Scheduled',
      vitals: { bp: '130/82', pulse: '74 bpm', temp: '98.2 F' },
    },
  ]);

  const handleCompletePatient = (id) => {
    setPatients((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'Completed' } : p))
    );
    setSelectedPatient(null);
  };

  return (
    <div className="flex-1 w-full bg-slate-50 min-h-screen pb-16">
      {/* Top Banner */}
      <section className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs px-3 py-1 rounded-full uppercase tracking-wider font-semibold mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Physician Clinical Desk
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {user?.name || 'Dr. Sarah Johnson, MD'}
            </h1>
            <p className="text-slate-300 text-sm mt-1">
              Internal Medicine & Cardiology • License: <span className="font-mono text-white">#MD-582910</span>
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
            <div className="text-right">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Clinical Status</p>
              <p className={`text-sm font-bold ${onDuty ? 'text-emerald-400' : 'text-amber-400'}`}>
                {onDuty ? 'Accepting Patients' : 'On Clinical Break'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOnDuty(!onDuty)}
              className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                onDuty ? 'bg-emerald-600' : 'bg-slate-600'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  onDuty ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* Metrics Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Today&apos;s Queue</span>
            <span className="text-3xl font-extrabold text-blue-600 mt-1 block">14</span>
            <span className="text-xs text-slate-500 mt-1 inline-block">4 Completed • 10 Remaining</span>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Telehealth Slots</span>
            <span className="text-3xl font-extrabold text-indigo-600 mt-1 block">5 Virtual</span>
            <span className="text-xs text-indigo-600 font-semibold mt-1 inline-block">Next: 10:30 AM</span>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Lab Reviews</span>
            <span className="text-3xl font-extrabold text-amber-600 mt-1 block">3 Pending</span>
            <span className="text-xs text-amber-600 font-semibold mt-1 inline-block">Requires signature</span>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Avg Consultation</span>
            <span className="text-3xl font-extrabold text-emerald-600 mt-1 block">18 min</span>
            <span className="text-xs text-emerald-600 font-semibold mt-1 inline-block">Within target pace</span>
          </div>
        </div>
      </div>

      {/* Main Schedule & Clinical Patient Queue */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Today&apos;s Scheduled Consultations</h2>
              <p className="text-xs text-slate-500 mt-0.5">Real-time sync with receptionist intake and triage vital checks</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Filter by status:</span>
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">All Active (4)</span>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {patients.map((p) => (
              <div key={p.id} className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:bg-slate-50/50 transition">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex flex-col items-center justify-center shrink-0 border border-blue-100 font-mono text-xs font-bold leading-tight">
                    <span>{p.time.split(' ')[0]}</span>
                    <span className="text-[9px] uppercase text-blue-500">{p.time.split(' ')[1]}</span>
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-base">{p.name}</h3>
                      <span className="text-xs text-slate-500">
                        ({p.age} yrs, {p.gender})
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          p.status === 'In Consultation'
                            ? 'bg-blue-100 text-blue-800 animate-pulse'
                            : p.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>

                    <p className="text-xs font-medium text-slate-700 mt-1">{p.type}</p>
                    <p className="text-xs text-slate-500 mt-0.5 max-w-xl">
                      <span className="font-semibold text-slate-600">Chief Complaint:</span> {p.symptoms}
                    </p>

                    {/* Vitals Ribbon */}
                    <div className="flex items-center gap-4 text-xs mt-3 bg-slate-50 p-2 rounded-xl border border-slate-200/60 max-w-md">
                      <span className="text-slate-600">
                        BP: <strong className="text-slate-900">{p.vitals.bp}</strong>
                      </span>
                      <span>•</span>
                      <span className="text-slate-600">
                        Pulse: <strong className="text-slate-900">{p.vitals.pulse}</strong>
                      </span>
                      <span>•</span>
                      <span className="text-slate-600">
                        Temp: <strong className="text-slate-900">{p.vitals.temp}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedPatient(p)}
                    className="py-2.5 px-4 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white text-xs shadow-sm transition"
                  >
                    Clinical Notes & Rx
                  </button>
                  {p.status !== 'Completed' && (
                    <button
                      type="button"
                      onClick={() => handleCompletePatient(p.id)}
                      className="py-2.5 px-4 rounded-xl font-semibold border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs transition"
                    >
                      Mark Complete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal: Clinical Notes & Prescription Drawer */}
        {selectedPatient && (
          <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Clinical Encounter Note — {selectedPatient.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedPatient.type} • Vitals verified
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPatient(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 my-5 text-sm">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Physician Assessment & Observations
                  </label>
                  <textarea
                    rows={3}
                    defaultValue={`Patient presents with ${selectedPatient.symptoms.toLowerCase()}. Vitals are stable. Recommend regular hydration and follow-up lab panel.`}
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Prescribed Medication & Dosage
                  </label>
                  <input
                    type="text"
                    defaultValue="Amoxicillin 500mg BID x 7 days; Paracetamol 650mg PRN"
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedPatient(null)}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleCompletePatient(selectedPatient.id)}
                  className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20"
                >
                  Sign & Sync with Patient Portal
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
