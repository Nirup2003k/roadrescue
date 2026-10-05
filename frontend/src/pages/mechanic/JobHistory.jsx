import React, { useEffect, useState } from 'react';
import { History } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { mechanicNav } from '../../components/layout/navConfig';
import { bookingApi } from '../../api/bookings';
import { Card, CardBody } from '../../components/ui/Card';
import { Table, THead, TRow, TH, TD } from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import { formatCurrency } from '../../utils/format';

const FILTERS = [
  { value: '', label: 'All' }, { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }, { value: 'rejected', label: 'Rejected' },
];

export default function JobHistory() {
  const [bookings, setBookings] = useState(null);
  const [filter, setFilter] = useState('completed');

  useEffect(() => {
    setBookings(null);
    if (filter) {
      bookingApi.list({ status: filter }).then((res) => setBookings(res.data.bookings)).catch(() => setBookings([]));
    } else {
      Promise.all([bookingApi.list({ status: 'completed' }), bookingApi.list({ status: 'cancelled' }), bookingApi.list({ status: 'rejected' })])
        .then(([c, x, r]) => setBookings([...c.data.bookings, ...x.data.bookings, ...r.data.bookings]))
        .catch(() => setBookings([]));
    }
  }, [filter]);

  return (
    <DashboardLayout navItems={mechanicNav} title="Job History">
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {FILTERS.map((f) => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${filter === f.value ? 'bg-ink text-white border-ink' : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'}`}>{f.label}</button>
        ))}
      </div>
      {bookings === null ? <Loader label="Loading job history..." /> : bookings.length === 0 ? (
        <Card><CardBody><EmptyState icon={History} title="No jobs found" description="Jobs matching this filter will show up here." /></CardBody></Card>
      ) : (
        <Card>
          <Table>
            <THead><TRow><TH>Service</TH><TH>Customer</TH><TH>Vehicle</TH><TH>Earnings</TH><TH>Status</TH></TRow></THead>
            <tbody>
              {bookings.map((b) => (
                <TRow key={b.id}>
                  <TD className="font-medium">{b.service_name}</TD>
                  <TD>{b.customer_name}</TD>
                  <TD>{b.vehicle_registration}</TD>
                  <TD>{b.status === 'completed' ? formatCurrency(b.price_snapshot) : '—'}</TD>
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
