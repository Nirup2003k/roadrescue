import React from 'react';
export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      {Icon && <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-3"><Icon className="h-6 w-6 text-slate-400" /></div>}
      <h3 className="font-display font-bold text-ink">{title}</h3>
      {description && <p className="text-sm text-slate-500 mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
