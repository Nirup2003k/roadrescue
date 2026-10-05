import React from 'react';
const STATUS_STYLES = {
  pending: 'bg-beacon-50 text-beacon-700 ring-1 ring-inset ring-beacon-500/30',
  accepted: 'bg-route-50 text-route-700 ring-1 ring-inset ring-route-500/30',
  in_progress: 'bg-route-100 text-route-700 ring-1 ring-inset ring-route-500/40',
  completed: 'bg-success-50 text-success-700 ring-1 ring-inset ring-success-500/30',
  rejected: 'bg-danger-50 text-danger-700 ring-1 ring-inset ring-danger-500/30',
  cancelled: 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-300',
  active: 'bg-success-50 text-success-700 ring-1 ring-inset ring-success-500/30',
  suspended: 'bg-danger-50 text-danger-700 ring-1 ring-inset ring-danger-500/30',
  approved: 'bg-success-50 text-success-700 ring-1 ring-inset ring-success-500/30',
  available: 'bg-success-50 text-success-700 ring-1 ring-inset ring-success-500/30',
  busy: 'bg-beacon-50 text-beacon-700 ring-1 ring-inset ring-beacon-500/30',
  offline: 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-300',
};
const LABELS = { in_progress: 'In Progress' };
export default function Badge({ status, children, className = '' }) {
  const style = STATUS_STYLES[status] || 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-300';
  const label = children || LABELS[status] || (status ? status.charAt(0).toUpperCase() + status.slice(1) : '');
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${style} ${className}`}>{label}</span>;
}
