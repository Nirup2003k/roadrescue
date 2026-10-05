import React, { useEffect, useState } from 'react';
import { Inbox, MapPin, Car, FileText, Check, X } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { mechanicNav } from '../../components/layout/navConfig';
import { bookingApi } from '../../api/bookings';
import { useToast } from '../../context/ToastContext';
import { Card, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { formatDate, formatCurrency } from '../../utils/format';

export default function IncomingRequests() {
  const toast = useToast();
  const [bookings, setBookings] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [processing, setProcessing] = useState(false);

  function load() { bookingApi.list({ status: 'pending' }).then((res) => setBookings(res.data.bookings)).catch(() => setBookings([])); }
  useEffect(load, []);

  async function handleConfirm() {
    setProcessing(true);
    try {
      if (confirmAction.type === 'accept') {
        await bookingApi.accept(confirmAction.booking.id);
        toast.success('Request accepted. It has moved to your active jobs.');
      } else {
        await bookingApi.reject(confirmAction.booking.id);
        toast.success('Request rejected.');
      }
      setConfirmAction(null); load();
    } catch (err) { toast.error(err.message); setConfirmAction(null); load(); } finally { setProcessing(false); }
  }

  return (
    <DashboardLayout navItems={mechanicNav} title="Incoming Requests">
      {bookings === null ? <Loader label="Loading incoming requests..." /> : bookings.length === 0 ? (
        <Card><CardBody><EmptyState icon={Inbox} title="No pending requests" description="New assistance requests sent to you will show up here." /></CardBody></Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <Card key={b.id}>
              <CardBody>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-display font-bold text-ink">{b.service_name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Requested {formatDate(b.requested_at)} · {formatCurrency(b.price_snapshot)}</p>
                  </div>
                  <Badge status={b.status} />
                </div>
                <div className="grid sm:grid-cols-2 gap-3 mt-4 text-sm">
                  <div className="flex items-start gap-2"><Car className="h-4 w-4 text-slate-400 mt-0.5" /><span className="text-ink">{b.vehicle_brand} {b.vehicle_model} · {b.vehicle_registration}</span></div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                    <span className="text-ink">{b.location_address}{b.distance_km !== null && b.distance_km !== undefined ? ` (${b.distance_km} km away)` : ''}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2 mt-3 text-sm"><FileText className="h-4 w-4 text-slate-400 mt-0.5" /><span className="text-ink">{b.problem_description}</span></div>
                <p className="text-xs text-slate-500 mt-3">Customer: {b.customer_name} · {b.customer_phone}</p>
                <div className="flex gap-2 mt-4">
                  <Button variant="beacon" onClick={() => setConfirmAction({ type: 'accept', booking: b })}><Check className="h-4 w-4" /> Accept</Button>
                  <Button variant="outline" onClick={() => setConfirmAction({ type: 'reject', booking: b })}><X className="h-4 w-4" /> Reject</Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
      <ConfirmDialog open={!!confirmAction}
        title={confirmAction?.type === 'accept' ? 'Accept this request?' : 'Reject this request?'}
        message={confirmAction?.type === 'accept' ? 'It will move to your active jobs and you will be marked as busy until it is completed.' : 'The customer will be notified that you cannot take this job.'}
        confirmLabel={confirmAction?.type === 'accept' ? 'Accept' : 'Reject'}
        variant={confirmAction?.type === 'accept' ? 'beacon' : 'danger'}
        loading={processing} onConfirm={handleConfirm} onClose={() => setConfirmAction(null)} />
    </DashboardLayout>
  );
}
