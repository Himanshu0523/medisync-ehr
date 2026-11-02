import { useState } from 'react';

export default function PasswordInput({
  id,
  name,
  value,
  onChange,
  placeholder = '••••••••',
  required = true,
  minLength = 8,
  autoComplete = 'current-password',
  className = '',
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <input
        id={id || name}
        type={showPassword ? 'text' : 'password'}
        name={name}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm bg-slate-50/50 pr-11 text-slate-800 transition ${className}`}
      />
      <button
        type="button"
        aria-label={showPassword ? 'Hide password' : 'Show password'}
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {showPassword ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          )}
        </svg>
      </button>
    </div>
  );
}
