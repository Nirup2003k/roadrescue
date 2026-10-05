import React from 'react';
export function Table({ children, className = '' }) {
  return <div className={`overflow-x-auto scrollbar-thin ${className}`}><table className="w-full text-sm text-left border-collapse">{children}</table></div>;
}
export function THead({ children }) {
  return <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">{children}</thead>;
}
export function TRow({ children, className = '' }) {
  return <tr className={`border-b border-slate-100 last:border-0 ${className}`}>{children}</tr>;
}
export function TH({ children, className = '' }) {
  return <th className={`px-4 py-3 font-semibold whitespace-nowrap ${className}`}>{children}</th>;
}
export function TD({ children, className = '' }) {
  return <td className={`px-4 py-3 text-ink-800 align-middle ${className}`}>{children}</td>;
}
