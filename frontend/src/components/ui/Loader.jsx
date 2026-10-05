import React from 'react';
import { Loader2 } from 'lucide-react';
export default function Loader({ label = 'Loading...', full = false }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 text-slate-500 ${full ? 'min-h-[50vh]' : 'py-12'}`}>
      <Loader2 className="h-6 w-6 animate-spin text-route-500" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
