import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';

export default function SuperAdminCreateHospital() {

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdHospital, setCreatedHospital] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    email: '',
    contactNumber: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
  });

  const handleChange = (e) => {
    setError('');
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateStep1 = () => {
    if (!formData.name.trim()) return 'Hospital name is required.';
    if (!formData.code.trim()) return 'Hospital code is required (e.g., CARE-01).';
    if (!formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email)) {
      return 'A valid primary hospital email is required.';
    }
    const cleanPhone = formData.contactNumber.replace(/[\s\-()+]/g, '');
    if (!/^[0-9]{10,15}$/.test(cleanPhone)) {
      return 'Contact number must be between 10 and 15 digits.';
    }
    return null;
  };

  const validateStep2 = () => {
    if (!formData.city.trim()) return 'City is required.';
    if (!formData.state.trim()) return 'State/Province is required.';
    if (!formData.street.trim()) return 'Street address is required.';
    return null;
  };

  const handleNext = () => {
    setError('');
    if (currentStep === 1) {
      const err = validateStep1();
      if (err) {
        setError(err);
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      const err = validateStep2();
      if (err) {
        setError(err);
        return;
      }
      setCurrentStep(3);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        name: formData.name.trim(),
        code: formData.code.toUpperCase().trim(),
        email: formData.email.toLowerCase().trim(),
        contactNumber: formData.contactNumber.replace(/[\s\-()+]/g, ''),
        address: {
          street: formData.street.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          postalCode: formData.postalCode.trim(),
          country: formData.country.trim() || 'India',
        },
      };

      const res = await api.post('/hospitals', payload);
      setCreatedHospital(res.data);
    } catch (err) {
      setError(err.message || 'Failed to register hospital. Please verify input.');
    } finally {
      setLoading(false);
    }
  };

  if (createdHospital) {
    return (
      <div className="max-w-2xl mx-auto py-8 animate-fade-in">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto border border-emerald-100 shadow-sm">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
              Hospital Tenant Active
            </span>
            <h2 className="text-2xl font-black text-slate-900 mt-3">{createdHospital.name}</h2>
            <p className="text-xs text-slate-500 mt-1 font-mono">
              Hospital Code: <strong>{createdHospital.code}</strong> • ID: {createdHospital._id}
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 text-left text-xs space-y-1.5 border border-slate-100">
            <p className="text-slate-600">
              <strong className="text-slate-800">Location:</strong> {createdHospital.address?.city}, {createdHospital.address?.state} ({createdHospital.address?.country})
            </p>
            <p className="text-slate-600">
              <strong className="text-slate-800">Primary Email:</strong> {createdHospital.email}
            </p>
            <p className="text-slate-600">
              <strong className="text-slate-800">Contact Number:</strong> {createdHospital.contactNumber}
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Link
              to={`/super-admin/hospitals/${createdHospital._id}/invite-admin`}
              className="flex-1 py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-md shadow-blue-500/20 text-center"
            >
              + Invite Hospital Administrator Now
            </Link>
            <Link
              to="/super-admin/hospitals"
              className="py-3.5 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition text-center"
            >
              Back to Directory
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="pb-3 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Register New Hospital Facility
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Step {currentStep} of 3: {currentStep === 1 ? 'Basic Information' : currentStep === 2 ? 'Location & Contact' : 'Review & Confirm'}
          </p>
        </div>
        <Link
          to="/super-admin/hospitals"
          className="text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          Cancel
        </Link>
      </div>

      {/* Multi-Step Indicator */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { step: 1, title: '1. Basic Info' },
          { step: 2, title: '2. Location' },
          { step: 3, title: '3. Review & Create' },
        ].map((s) => (
          <div
            key={s.step}
            className={`h-2 rounded-full transition-colors ${
              currentStep >= s.step ? 'bg-blue-600' : 'bg-slate-200'
            }`}
          />
        ))}
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-2.5">
          <svg className="w-5 h-5 shrink-0 text-red-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1 font-semibold">{error}</div>
        </div>
      )}

      {/* Main Form Body */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
        {currentStep === 1 && (
          <div className="space-y-5 animate-fade-in">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
              Step 1 — Basic Hospital Identity
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Hospital Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. City Care Multispeciality Hospital"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm bg-slate-50/50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Unique Hospital Code *
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="e.g. CARE-IND"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm font-mono uppercase bg-slate-50/50"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Used for MRN prefixes and tenant routing</span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Primary Contact Phone *
                </label>
                <input
                  type="tel"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  placeholder="e.g. 9876543210"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm bg-slate-50/50"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Primary Official Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g. contact@citycarehospital.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm bg-slate-50/50"
                  required
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={handleNext}
                className="py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-md shadow-blue-500/20"
              >
                Proceed to Location &rarr;
              </button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-5 animate-fade-in">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
              Step 2 — Geographic Location & Postal Address
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Street Address *
                </label>
                <input
                  type="text"
                  name="street"
                  value={formData.street}
                  onChange={handleChange}
                  placeholder="e.g. 102 Healthcare Avenue, Scheme 54"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm bg-slate-50/50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="e.g. Indore"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm bg-slate-50/50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  State / Province *
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="e.g. Madhya Pradesh"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm bg-slate-50/50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Postal Code / PIN
                </label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  placeholder="e.g. 452010"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Country
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm bg-slate-50/50"
                />
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="py-3 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
              >
                &larr; Back
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-md shadow-blue-500/20"
              >
                Review & Confirm &rarr;
              </button>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
              Step 3 — Review Hospital Details & Confirm
            </h3>

            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3 text-xs sm:text-sm">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                <span className="text-slate-500">Hospital Name:</span>
                <span className="font-bold text-slate-900">{formData.name}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                <span className="text-slate-500">Hospital Code:</span>
                <span className="font-mono font-bold text-blue-600">{formData.code.toUpperCase()}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                <span className="text-slate-500">Official Email:</span>
                <span className="font-medium text-slate-800">{formData.email}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                <span className="text-slate-500">Contact Number:</span>
                <span className="font-medium text-slate-800">{formData.contactNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Address:</span>
                <span className="font-medium text-slate-800 text-right">
                  {formData.street}, {formData.city}, {formData.state} - {formData.postalCode} ({formData.country})
                </span>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="py-3 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
              >
                &larr; Back
              </button>

              <button
                type="submit"
                disabled={loading}
                className="py-3 px-8 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-md shadow-blue-500/20 disabled:opacity-50"
              >
                {loading ? 'Registering Facility...' : 'Confirm & Register Hospital'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
