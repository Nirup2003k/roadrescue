import React from 'react';
import { Star } from 'lucide-react';
export default function StarRating({ value, onChange, size = 20, readOnly = false }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className="flex items-center gap-1">
      {stars.map((s) => (
        <button key={s} type="button" disabled={readOnly} onClick={() => onChange && onChange(s)} className={readOnly ? 'cursor-default' : 'cursor-pointer'} aria-label={`${s} star`}>
          <Star size={size} className={s <= value ? 'fill-beacon-500 text-beacon-500' : 'fill-transparent text-slate-300'} />
        </button>
      ))}
    </div>
  );
}
