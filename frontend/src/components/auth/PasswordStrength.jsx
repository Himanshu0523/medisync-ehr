export default function PasswordStrength({ password = '' }) {
  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const criteria = [hasLength, hasUpper, hasLower, hasDigit, hasSpecial];
  const score = criteria.filter(Boolean).length;

  let label = 'Too Weak';
  let color = 'bg-red-500';
  let textColor = 'text-red-600';

  if (score >= 4) {
    label = 'Strong';
    color = 'bg-emerald-500';
    textColor = 'text-emerald-600';
  } else if (score >= 3) {
    label = 'Good';
    color = 'bg-blue-500';
    textColor = 'text-blue-600';
  } else if (score >= 2) {
    label = 'Fair';
    color = 'bg-amber-500';
    textColor = 'text-amber-600';
  }

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2 text-xs">
      <div className="flex items-center justify-between">
        <span className="text-slate-500 font-medium">Password Strength:</span>
        <span className={`font-bold ${textColor}`}>{label}</span>
      </div>

      {/* Progress Bars */}
      <div className="grid grid-cols-4 gap-1.5 h-1.5">
        <div className={`rounded-full transition-all duration-300 ${score >= 1 ? color : 'bg-slate-200'}`} />
        <div className={`rounded-full transition-all duration-300 ${score >= 2 ? color : 'bg-slate-200'}`} />
        <div className={`rounded-full transition-all duration-300 ${score >= 3 ? color : 'bg-slate-200'}`} />
        <div className={`rounded-full transition-all duration-300 ${score >= 4 ? color : 'bg-slate-200'}`} />
      </div>

      {/* Requirement Pills */}
      <div className="flex flex-wrap gap-1.5 pt-1 text-[11px]">
        <span
          className={`px-2 py-0.5 rounded-md font-medium transition ${
            hasLength ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
          }`}
        >
          {hasLength ? '✓' : '•'} 8+ characters
        </span>
        <span
          className={`px-2 py-0.5 rounded-md font-medium transition ${
            hasUpper ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
          }`}
        >
          {hasUpper ? '✓' : '•'} Uppercase
        </span>
        <span
          className={`px-2 py-0.5 rounded-md font-medium transition ${
            hasLower ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
          }`}
        >
          {hasLower ? '✓' : '•'} Lowercase
        </span>
        <span
          className={`px-2 py-0.5 rounded-md font-medium transition ${
            hasDigit ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
          }`}
        >
          {hasDigit ? '✓' : '•'} Number
        </span>
      </div>
    </div>
  );
}
