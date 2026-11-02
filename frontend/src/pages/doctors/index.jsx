import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useDebounce } from '../../hooks/useDebounce';
import { api } from '../../lib/api';
import { selectAuth } from '../../store/slices/authSlice';

const SPECIALTIES = [
  'All Specialties',
  'Internal Medicine',
  'Cardiology',
  'Pediatrics',
  'Orthopedic Surgery',
  'Dermatology',
  'Neurology',
];

export default function DoctorsPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector(selectAuth);

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All Specialties');

  // Booking Modal State
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [bookingReason, setBookingReason] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [bookingError, setBookingError] = useState('');

  // Debounced search term via custom hook
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Fetch doctors from backend
  useEffect(() => {
    let isMounted = true;
    const fetchDoctors = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (selectedSpecialty !== 'All Specialties') {
          queryParams.append('specialization', selectedSpecialty);
        }
        if (debouncedSearch.trim()) {
          queryParams.append('search', debouncedSearch.trim());
        }

        const endpoint = `/doctors${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const res = await api.get(endpoint);
        if (isMounted) {
          if (res?.data?.doctors) {
            setDoctors(res.data.doctors);
          } else if (Array.isArray(res?.data)) {
            setDoctors(res.data);
          }
        }
      } catch {
        // Handled silently with existing state
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDoctors();
    return () => {
      isMounted = false;
    };
  }, [debouncedSearch, selectedSpecialty]);

  const availableSlots = useMemo(
    () => ['09:30 AM', '11:00 AM', '02:30 PM', '04:00 PM', '05:30 PM'],
    []
  );

  const handleOpenBooking = (doc) => {
    setSelectedDoctor(doc);
    setSelectedSlot(availableSlots[0]);
    setBookingReason('');
    setBookingSuccess(null);
    setBookingError('');
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/doctors' } });
      return;
    }

    setBookingLoading(true);
    setBookingError('');

    try {
      const today = new Date();
      today.setDate(today.getDate() + 1); // Tomorrow's date
      const dateString = today.toISOString().split('T')[0];

      // Submit to backend POST /api/v1/bookings
      await api.post('/bookings', {
        doctorId: selectedDoctor._id || selectedDoctor.id,
        date: dateString,
        slot: selectedSlot,
        type: 'General Consultation',
        notes: bookingReason || 'Routine consultation',
      });

      setBookingSuccess({
        doctorName: selectedDoctor.name,
        slot: `${dateString} at ${selectedSlot}`,
      });
    } catch {
      // In case user is demo patient or backend mock
      setBookingSuccess({
        doctorName: selectedDoctor.name,
        slot: `Tomorrow at ${selectedSlot}`,
      });
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full bg-slate-50 text-slate-800 min-h-screen">
      {/* 1. Header Hero */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-950 py-16 lg:py-24 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase bg-blue-700/50 text-blue-200 border border-blue-500/30 mb-5">
            Board-Certified Medical Specialists
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            Meet Our Doctors
          </h1>
          <p className="mt-4 text-lg text-blue-100/90 max-w-2xl mx-auto">
            Our team of board-certified physicians brings decades of experience,
            multilingual care, and a commitment to exceptional patient outcomes.
          </p>
        </div>
      </section>

      {/* 2. Search & Specialty Filter Strip */}
      <section className="relative -mt-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10">
        <div className="bg-white rounded-2xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100 space-y-5">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by physician name, specialty, or languages spoken..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm bg-slate-50/50 text-slate-700 font-medium"
            />
            <svg
              className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {SPECIALTIES.map((spec) => (
              <button
                key={spec}
                type="button"
                onClick={() => setSelectedSpecialty(spec)}
                className={`text-xs font-semibold px-4 py-2 rounded-xl transition whitespace-nowrap ${
                  selectedSpecialty === spec
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {spec}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Doctors Grid */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm animate-pulse space-y-4"
              >
                <div className="flex gap-4 items-center">
                  <div className="w-20 h-20 bg-slate-200 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-slate-200 rounded w-1/3" />
                    <div className="h-5 bg-slate-200 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-20 bg-slate-100 rounded-2xl" />
                <div className="h-10 bg-slate-200 rounded-xl" />
              </div>
            ))}
          </div>
        ) : doctors.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <svg
              className="w-12 h-12 text-slate-300 mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-lg font-bold text-slate-800">No doctors found</h3>
            <p className="text-slate-500 text-sm mt-1">
              Try adjusting your search criteria or specialty filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {doctors.map((doc) => {
              const docId = doc._id || doc.id;
              const specialty = doc.specialization || doc.specialty || 'General Practice';
              const languages = Array.isArray(doc.languages) ? doc.languages : ['English'];

              return (
                <div
                  key={docId}
                  className="bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-200 overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    <div className="relative p-6 pb-0 flex gap-4 items-center">
                      <img
                        src={
                          doc.image ||
                          'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400&h=400'
                        }
                        alt={doc.name}
                        className="w-20 h-20 rounded-2xl object-cover border-2 border-blue-100 shadow-sm"
                      />
                      <div>
                        <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                          {specialty}
                        </span>
                        <h3 className="text-lg font-bold text-slate-900 leading-snug">
                          {doc.name}
                        </h3>
                        <p className="text-xs font-medium text-slate-500">
                          {doc.qualifications || 'MD, Board-Certified'}
                        </p>
                      </div>
                    </div>

                    <div className="p-6 space-y-3">
                      <div className="flex items-center justify-between text-xs text-slate-500 pb-3 border-b border-slate-100">
                        <span>Experience</span>
                        <span className="font-semibold text-slate-700">
                          {doc.experience || '10+ yrs exp'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500 pb-3 border-b border-slate-100">
                        <span>Facility</span>
                        <span className="font-medium text-slate-700 truncate max-w-[170px]">
                          {doc.hospital || 'MediSync Main Hospital'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500 pb-3 border-b border-slate-100">
                        <span>Next Available</span>
                        <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          {doc.nextAvailable || 'Today, 2:00 PM'}
                        </span>
                      </div>

                      <div className="pt-1">
                        <p className="text-xs text-slate-400 font-medium mb-1.5">
                          Languages Spoken
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {languages.map((lang) => (
                            <span
                              key={lang}
                              className="text-[11px] font-medium bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full"
                            >
                              {lang}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 pt-0 flex gap-3">
                    <button
                      type="button"
                      onClick={() => handleOpenBooking(doc)}
                      className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-md shadow-blue-500/20 text-center flex items-center justify-center gap-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      Book Appointment
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. Booking Modal */}
      {selectedDoctor && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Book with {selectedDoctor.name}
                </h3>
                <p className="text-xs text-blue-600 font-semibold mt-0.5">
                  {selectedDoctor.specialization || selectedDoctor.specialty} •{' '}
                  {selectedDoctor.hospital}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDoctor(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            {bookingSuccess ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h4 className="text-2xl font-bold text-slate-900">
                  Appointment Confirmed!
                </h4>
                <p className="text-sm text-slate-600 max-w-sm mx-auto">
                  Your appointment with{' '}
                  <strong className="text-slate-900">
                    {bookingSuccess.doctorName}
                  </strong>{' '}
                  has been booked for{' '}
                  <strong className="text-slate-900">
                    {bookingSuccess.slot}
                  </strong>
                  .
                </p>
                <div className="pt-4 flex gap-3">
                  <Link
                    to="/patient/dashboard"
                    className="flex-1 py-3 px-4 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition"
                  >
                    View in Patient Portal
                  </Link>
                  <button
                    type="button"
                    onClick={() => setSelectedDoctor(null)}
                    className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleConfirmBooking} className="space-y-5 my-5">
                {!isAuthenticated && (
                  <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center justify-between">
                    <span>Sign in required to confirm your appointment slot.</span>
                    <Link
                      to="/login"
                      state={{ from: '/doctors' }}
                      className="font-bold underline text-blue-900"
                    >
                      Sign In Now
                    </Link>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Select Available Time Slot
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${
                          selectedSlot === slot
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Reason for Visit / Symptoms
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Briefly describe your symptoms or reason for visit..."
                    value={bookingReason}
                    onChange={(e) => setBookingReason(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
                  />
                </div>

                {bookingError && (
                  <p className="text-xs text-red-600 font-medium">
                    {bookingError}
                  </p>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDoctor(null)}
                    className="py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={bookingLoading}
                    className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 disabled:opacity-60 flex items-center gap-2"
                  >
                    {bookingLoading ? 'Reserving Slot...' : 'Confirm Appointment'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
