import React from 'react';
export function Card({ children, className = '', ...props }) {
  return <div className={`bg-white rounded-xl border border-slate-200 shadow-card ${className}`} {...props}>{children}</div>;
}
export function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-100 ${className}`}>
      <div>
        <h3 className="font-display font-bold text-ink text-base">{title}</h3>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
export function CardBody({ children, className = '' }) {
  return <div className={`px-5 py-4 ${className}`}>{children}</div>;
}
