import React, { useEffect, useState } from 'react';
import { ClipboardList } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { adminNav } from '../../components/layout/navConfig';
import { adminApi } from '../../api/admin';
import { Card, CardBody } from '../../components/ui/Card';
import { Table, THead, TRow, TH, TD } from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import { formatDate, formatCurrency } from '../../utils/format';

const FILTERS = [
  { value: '', label: 'All' }, { value: 'pending', label: 'Pending' }, { value: 'accepted', label: 'Accepted' },
  { value: 'in_progress', label: 'In Progress' }, { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }, { value: 'rejected', label: 'Rejected' },
];

export default function AdminBookings() {
  const [bookings, setBookings] = useState(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    setBookings(null);
    adminApi.bookings(filter ? { status: filter } : {}).then((res) => setBookings(res.data.bookings)).catch(() => setBookings([]));
  }, [filter]);

  return (
    <DashboardLayout navItems={adminNav} title="Bookings">
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {FILTERS.map((f) => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${filter === f.value ? 'bg-ink text-white border-ink' : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'}`}>{f.label}</button>
        ))}
      </div>
      {bookings === null ? <Loader label="Loading bookings..." /> : bookings.length === 0 ? (
        <Card><CardBody><EmptyState icon={ClipboardList} title="No bookings found" /></CardBody></Card>
      ) : (
        <Card>
          <Table>
            <THead><TRow><TH>ID</TH><TH>Service</TH><TH>Customer</TH><TH>Mechanic</TH><TH>Vehicle</TH><TH>Price</TH><TH>Requested</TH><TH>Status</TH></TRow></THead>
            <tbody>
              {bookings.map((b) => (
                <TRow key={b.id}>
                  <TD>#{b.id}</TD>
                  <TD className="font-medium">{b.service_name}</TD>
                  <TD>{b.customer_name}</TD>
                  <TD>{b.mechanic_name}</TD>
                  <TD>{b.vehicle_registration}</TD>
                  <TD>{formatCurrency(b.price_snapshot)}</TD>
                  <TD className="whitespace-nowrap">{formatDate(b.requested_at)}</TD>
                  <TD><Badge status={b.status} /></TD>
                </TRow>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </DashboardLayout>
  );
}
