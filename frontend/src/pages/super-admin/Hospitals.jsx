import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';

export default function SuperAdminHospitals() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('');
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: '' }
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchHospitals = useCallback(async () => {
    try {
      const query = new URLSearchParams();
      if (statusFilter !== 'all') query.append('status', statusFilter);
      if (searchTerm.trim()) query.append('search', searchTerm.trim());
      if (cityFilter.trim()) query.append('city', cityFilter.trim());

      const res = await api.get(`/hospitals${query.toString() ? `?${query.toString()}` : ''}`);
      if (res.data?.hospitals) {
        setHospitals(res.data.hospitals);
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to fetch hospital records.',
      });
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, cityFilter]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchHospitals();
    }, 250);
    return () => clearTimeout(handler);
  }, [fetchHospitals]);

  const handleToggleStatus = async (hospital) => {
    const nextStatus = hospital.status === 'active' ? 'inactive' : 'active';
    setActionLoadingId(hospital._id);
    setFeedback(null);

    try {
      await api.patch(`/hospitals/${hospital._id}/status`, { status: nextStatus });
      setHospitals((prev) =>
        prev.map((h) => (h._id === hospital._id ? { ...h, status: nextStatus } : h))
      );
      setFeedback({
        type: 'success',
        message: `Hospital '${hospital.name}' status set to ${nextStatus.toUpperCase()}.`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to update hospital status.',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Hospital Management & Network Directory
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage registered institutional tenants, administrators, and operational statuses.
          </p>
        </div>

        <Link
          to="/super-admin/hospitals/new"
          className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-md shadow-blue-500/20 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>Register New Hospital</span>
        </Link>
      </div>

      {/* 2. Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs sm:text-sm flex items-center justify-between animate-fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 text-base leading-none font-bold ml-4"
          >
            &times;
          </button>
        </div>
      )}

      {/* 3. Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search by hospital name, code, or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
          />
          <svg
            className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {['all', 'active', 'inactive'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${
                  statusFilter === st
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* City Filter Input */}
          <input
            type="text"
            placeholder="Filter by city..."
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50 w-32"
          />
        </div>
      </div>

      {/* 4. Hospitals Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Hospital</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Administrator</th>
                <th className="py-3.5 px-4 text-center">Doctors</th>
                <th className="py-3.5 px-4 text-center">Patients</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading hospital directory...
                  </td>
                </tr>
              ) : hospitals.length > 0 ? (
                hospitals.map((hosp) => (
                  <tr key={hosp._id} className="hover:bg-slate-50/70 transition">
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold text-xs uppercase">
                          {hosp.code?.slice(0, 3) || 'HSP'}
                        </div>
                        <div>
                          <Link
                            to={`/super-admin/hospitals/${hosp._id}`}
                            className="font-bold text-slate-900 hover:text-blue-600 transition block"
                          >
                            {hosp.name}
                          </Link>
                          <span className="text-[11px] font-mono text-slate-400">Code: {hosp.code}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-slate-600">
                      <div>
                        <span className="font-medium text-slate-800">{hosp.address?.city || 'Not specified'}</span>
                        <span className="block text-[11px] text-slate-400">{hosp.address?.state || ''}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          hosp.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${hosp.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                        {hosp.status}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      {hosp.administrator ? (
                        <div>
                          <p className="font-semibold text-slate-800">{hosp.administrator.name}</p>
                          <p className="text-[11px] text-slate-400">{hosp.administrator.email}</p>
                        </div>
                      ) : (
                        <Link
                          to={`/super-admin/hospitals/${hosp._id}/invite-admin`}
                          className="text-xs font-semibold text-blue-600 hover:underline"
                        >
                          + Invite Admin
                        </Link>
                      )}
                    </td>

                    <td className="py-4 px-4 text-center font-bold text-slate-700">
                      {hosp.doctorsCount || 0}
                    </td>

                    <td className="py-4 px-4 text-center font-bold text-slate-700">
                      {hosp.patientsCount || 0}
                    </td>

                    <td className="py-4 px-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/super-admin/hospitals/${hosp._id}`}
                          className="py-1 px-2.5 rounded-lg border border-slate-200 hover:border-blue-400 hover:text-blue-600 text-xs font-semibold transition"
                        >
                          View
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(hosp)}
                          disabled={actionLoadingId === hosp._id}
                          className={`py-1 px-2.5 rounded-lg text-xs font-semibold transition ${
                            hosp.status === 'active'
                              ? 'border border-amber-200 text-amber-700 hover:bg-amber-50'
                              : 'border border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          {actionLoadingId === hosp._id
                            ? '...'
                            : hosp.status === 'active'
                            ? 'Deactivate'
                            : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center space-y-2">
                    <p className="text-slate-500 text-xs">No matching hospitals found.</p>
                    <Link
                      to="/super-admin/hospitals/new"
                      className="inline-block text-xs font-bold text-blue-600 hover:underline"
                    >
                      Register a new hospital →
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
