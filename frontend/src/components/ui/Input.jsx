import React from 'react';
export default function Input({ label, error, hint, className = '', id, required, ...props }) {
  const inputId = id || props.name;
  return (
    <div className="w-full">
      {label && <label htmlFor={inputId} className="block text-sm font-medium text-ink-800 mb-1.5">{label} {required && <span className="text-danger-500">*</span>}</label>}
      <input id={inputId}
        className={`w-full h-10 px-3 rounded-lg border bg-white text-sm text-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-route-500 focus:border-transparent ${error ? 'border-danger-500' : 'border-slate-300'} ${className}`}
        {...props} />
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-danger-500">{error}</p>}
    </div>
  );
}
