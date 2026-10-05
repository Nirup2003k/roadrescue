export function formatCurrency(amount) {
  const n = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}
export function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value.replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
export function formatStatus(status) {
  if (!status) return '';
  return status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
