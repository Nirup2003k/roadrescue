import React from 'react';
export default function StatCard({ icon: Icon, label, value, tone = 'ink' }) {
  const toneStyles = { ink: 'bg-ink text-white', beacon: 'bg-beacon-500 text-ink', route: 'bg-route-500 text-white', white: 'bg-white text-ink border border-slate-200' };
  return (
    <div className={`rounded-xl p-4 shadow-card ${toneStyles[tone]}`}>
      <div className="flex items-center justify-between">
        <p className={`text-xs font-medium uppercase tracking-wide ${tone === 'white' ? 'text-slate-500' : 'opacity-80'}`}>{label}</p>
        {Icon && <Icon className="h-4 w-4 opacity-70" />}
      </div>
      <p className="font-display text-2xl font-extrabold mt-1.5">{value}</p>
    </div>
  );
}
