import { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '../../../store/slices/authSlice';

export default function ReceptionistDashboard() {
  const user = useSelector(selectUser);

  const [searchQuery, setSearchQuery] = useState('');
  const [showCheckInModal, setShowCheckInModal] = useState(false);

  const [queue, setQueue] = useState([
    {
      id: 'q-201',
      token: 'T-01',
      patientName: 'Eleanor Vance',
      phone: '(555) 234-5678',
      doctor: 'Dr. Sarah Johnson',
      department: 'Internal Medicine',
      time: '09:00 AM',
      status: 'With Doctor',
      room: 'Room 302',
    },
    {
      id: 'q-202',
      token: 'T-02',
      patientName: 'James Wilson',
      phone: '(555) 876-5432',
      doctor: 'Dr. Marcus Chen',
      department: 'Cardiology',
      time: '09:45 AM',
      status: 'Waiting in Lobby',
      room: 'Room 104',
    },
    {
      id: 'q-203',
      token: 'T-03',
      patientName: 'Amina Patel',
      phone: '(555) 345-6789',
      doctor: 'Dr. Sarah Johnson',
      department: 'Internal Medicine',
      time: '10:30 AM',
      status: 'Checked In',
      room: 'Room 302',
    },
    {
      id: 'q-204',
      token: 'T-04',
      patientName: 'Lucas Gray',
      phone: '(555) 432-1098',
      doctor: 'Dr. Elena Martinez',
      department: 'Pediatrics',
      time: '11:00 AM',
      status: 'Scheduled',
      room: 'Room 205',
    },
  ]);

  const doctorsStatus = [
    { name: 'Dr. Sarah Johnson', specialty: 'Internal Med', room: '302', status: 'In Consultation', color: 'text-blue-600 bg-blue-50' },
    { name: 'Dr. Marcus Chen', specialty: 'Cardiology', room: '104', status: 'Available', color: 'text-emerald-600 bg-emerald-50' },
    { name: 'Dr. Elena Martinez', specialty: 'Pediatrics', room: '205', status: 'On Break', color: 'text-amber-600 bg-amber-50' },
    { name: 'Dr. David Kim', specialty: 'Neurology', room: '410', status: 'In Surgery', color: 'text-purple-600 bg-purple-50' },
  ];

  const handleUpdateStatus = (id, newStatus) => {
    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
  };

  const filteredQueue = queue.filter(
    (item) =>
      item.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.phone.includes(searchQuery) ||
      item.token.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 w-full bg-slate-50 min-h-screen pb-16">
      {/* Top Banner */}
      <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs px-3 py-1 rounded-full uppercase tracking-wider font-semibold mb-3">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              Clinic Front Desk & Reception
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Reception Console
            </h1>
            <p className="text-slate-300 text-sm mt-1">
              Logged in as: <strong className="text-white">{user?.name || 'David Miller'}</strong> • Main Medical Hub Desk 1
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowCheckInModal(true)}
              className="py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-900/30 transition flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Fast Walk-In Registration
            </button>
          </div>
        </div>
      </section>

      {/* Overview Metrics */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Checked In Today</span>
            <span className="text-3xl font-extrabold text-blue-600 mt-1 block">38</span>
            <span className="text-xs text-slate-500 mt-1 inline-block">12 Walk-ins • 26 Scheduled</span>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Lobby Waiting</span>
            <span className="text-3xl font-extrabold text-amber-600 mt-1 block">5 Patients</span>
            <span className="text-xs text-amber-600 font-semibold mt-1 inline-block">Avg wait: 8 min</span>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Doctors On Duty</span>
            <span className="text-3xl font-extrabold text-emerald-600 mt-1 block">6 Active</span>
            <span className="text-xs text-emerald-600 font-semibold mt-1 inline-block">All suites manned</span>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Emergency Trauma</span>
            <span className="text-3xl font-extrabold text-slate-800 mt-1 block">0 Active</span>
            <span className="text-xs text-emerald-600 font-semibold mt-1 inline-block">Normal triage status</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Live Queue & Doctor Board */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Live Patient Queue */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Patient Queue & Check-In</h2>
                <p className="text-xs text-slate-500">Manage patient triage, tokens, and direct room calling</p>
              </div>

              {/* Search input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search name, token or mobile..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64 pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50"
                />
                <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Queue List */}
            <div className="divide-y divide-slate-100">
              {filteredQueue.map((item) => (
                <div key={item.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition">
                  <div className="flex items-start gap-3">
                    <span className="w-12 h-10 rounded-xl bg-slate-900 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      {item.token}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-sm">{item.patientName}</h3>
                        <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                          {item.time}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {item.doctor} • {item.department} • {item.room}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{item.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={item.status}
                      onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg border focus:outline-none ${
                        item.status === 'With Doctor'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : item.status === 'Waiting in Lobby'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : item.status === 'Checked In'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      <option value="Scheduled">Scheduled</option>
                      <option value="Checked In">Checked In</option>
                      <option value="Waiting in Lobby">Waiting in Lobby</option>
                      <option value="With Doctor">With Doctor</option>
                      <option value="Completed">Completed</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(item.id, 'With Doctor')}
                      className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition shadow-sm"
                    >
                      Call
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Doctor Duty Roster */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Doctor Availability Roster</h2>
            <p className="text-xs text-slate-500 mb-4">Live consultation room sensors</p>

            <div className="space-y-3">
              {doctorsStatus.map((doc, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{doc.name}</h4>
                    <p className="text-[11px] text-slate-500">
                      {doc.specialty} • Room {doc.room}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${doc.color}`}>
                    {doc.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Modal: Quick Walk-in Registration */}
      {showCheckInModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Fast Walk-in Check-In</h3>
              <button
                type="button"
                onClick={() => setShowCheckInModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setShowCheckInModal(false);
              }}
              className="space-y-3 my-4 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Patient Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Liam Smith"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Contact Phone</label>
                <input
                  type="tel"
                  required
                  placeholder="10-digit mobile"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Assign Doctor</label>
                <select className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none">
                  <option>Dr. Sarah Johnson (Internal Med)</option>
                  <option>Dr. Marcus Chen (Cardiology)</option>
                  <option>Dr. Elena Martinez (Pediatrics)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCheckInModal(false)}
                  className="py-2 px-4 rounded-xl border border-slate-200 font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Issue Token & Print Slip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
