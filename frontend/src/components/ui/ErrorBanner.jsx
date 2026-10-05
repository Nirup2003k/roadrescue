import React from 'react';
import { AlertTriangle } from 'lucide-react';
export default function ErrorBanner({ message, className = '' }) {
  if (!message) return null;
  return (
    <div className={`flex items-start gap-2 rounded-lg bg-danger-50 border border-danger-500/30 px-3.5 py-2.5 text-sm text-danger-700 ${className}`}>
      <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
