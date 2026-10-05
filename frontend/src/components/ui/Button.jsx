import React from 'react';
import { Loader2 } from 'lucide-react';
const variants = {
  primary: 'bg-ink text-white hover:bg-ink-700 focus-visible:ring-ink',
  beacon: 'bg-beacon-500 text-ink hover:bg-beacon-600 focus-visible:ring-beacon-500',
  outline: 'border border-slate-300 text-ink-800 bg-white hover:bg-slate-50',
  ghost: 'text-ink-800 hover:bg-slate-100',
  danger: 'bg-danger-500 text-white hover:bg-danger-700',
  link: 'text-route-600 hover:text-route-700 underline-offset-4 hover:underline p-0 h-auto',
};
const sizes = { sm: 'h-8 px-3 text-sm', md: 'h-10 px-4 text-sm', lg: 'h-12 px-6 text-base' };
export default function Button({ children, variant = 'primary', size = 'md', loading = false, disabled = false, className = '', type = 'button', ...props }) {
  return (
    <button type={type} disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
