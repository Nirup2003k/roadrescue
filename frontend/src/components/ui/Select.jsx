import React from 'react';
import { ChevronDown } from 'lucide-react';
export default function Select({ label, error, hint, className = '', id, required, children, ...props }) {
  const inputId = id || props.name;
  return (
    <div className="w-full">
      {label && <label htmlFor={inputId} className="block text-sm font-medium text-ink-800 mb-1.5">{label} {required && <span className="text-danger-500">*</span>}</label>}
      <div className="relative">
        <select id={inputId}
          className={`w-full h-10 pl-3 pr-9 rounded-lg border bg-white text-sm text-ink appearance-none focus:outline-none focus:ring-2 focus:ring-route-500 focus:border-transparent ${error ? 'border-danger-500' : 'border-slate-300'} ${className}`}
          {...props}>
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
      </div>
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-danger-500">{error}</p>}
    </div>
  );
}
