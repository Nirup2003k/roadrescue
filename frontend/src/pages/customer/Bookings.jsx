import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, PlusCircle } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { customerNav } from '../../components/layout/navConfig';
import { bookingApi } from '../../api/bookings';
import { Card, CardBody } from '../../components/ui/Card';
import { Table, THead, TRow, TH, TD } from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import { formatDate, formatCurrency } from '../../utils/format';

const FILTERS = [
  { value: '', label: 'All' }, { value: 'pending', label: 'Pending' }, { value: 'accepted', label: 'Accepted' },
  { value: 'in_progress', label: 'In Progress' }, { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }, { value: 'rejected', label: 'Rejected' },
];

export default function CustomerBookings() {
  const [bookings, setBookings] = useState(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    setBookings(null);
    bookingApi.list(filter ? { status: filter } : {}).then((res) => setBookings(res.data.bookings)).catch(() => setBookings([]));
  }, [filter]);

  return (
    <DashboardLayout navItems={customerNav} title="My Bookings">
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {FILTERS.map((f) => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${filter === f.value ? 'bg-ink text-white border-ink' : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'}`}>{f.label}</button>
        ))}
      </div>
      {bookings === null ? <Loader label="Loading bookings..." /> : bookings.length === 0 ? (
        <Card><CardBody><EmptyState icon={ClipboardList} title="No bookings found"
          description={filter ? 'No bookings match this filter.' : "You haven't requested any assistance yet."}
          action={<Link to="/customer/request"><Button variant="beacon"><PlusCircle className="h-4 w-4" /> Request Assistance</Button></Link>} /></CardBody></Card>
      ) : (
        <Card>
          <Table>
            <THead>
              <TRow><TH>Booking</TH><TH>Service</TH><TH>Vehicle</TH><TH>Mechanic</TH><TH>Price</TH><TH>Requested</TH><TH>Status</TH><TH></TH></TRow>
            </THead>
            <tbody>
              {bookings.map((b) => (
                <TRow key={b.id}>
                  <TD>#{b.id}</TD>
                  <TD className="font-medium">{b.service_name}</TD>
                  <TD>{b.vehicle_registration}</TD>
                  <TD>{b.mechanic_name}</TD>
                  <TD>{formatCurrency(b.price_snapshot)}</TD>
                  <TD className="whitespace-nowrap">{formatDate(b.requested_at)}</TD>
                  <TD><Badge status={b.status} /></TD>
                  <TD><Link to={`/customer/bookings/${b.id}`} className="text-route-600 text-sm font-medium hover:underline">View</Link></TD>
                </TRow>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </DashboardLayout>
  );
}
