import React, { useEffect, useState } from 'react';
import { Wrench, MapPin, Car, FileText, Phone, PlayCircle, CheckCircle2 } from 'lucide-react';
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
import { formatDate } from '../../utils/format';

const NEXT_STATUS = { accepted: 'in_progress', in_progress: 'completed' };
const NEXT_LABEL = { accepted: 'Start Job', in_progress: 'Mark Completed' };

export default function ActiveJobs() {
  const toast = useToast();
  const [bookings, setBookings] = useState(null);
  const [confirmBooking, setConfirmBooking] = useState(null);
  const [processing, setProcessing] = useState(false);

  function load() {
    Promise.all([bookingApi.list({ status: 'accepted' }), bookingApi.list({ status: 'in_progress' })])
      .then(([a, b]) => setBookings([...a.data.bookings, ...b.data.bookings]))
      .catch(() => setBookings([]));
  }
  useEffect(load, []);

  async function handleAdvance() {
    setProcessing(true);
    try {
      const next = NEXT_STATUS[confirmBooking.status];
      await bookingApi.advanceStatus(confirmBooking.id, next);
      toast.success(next === 'completed' ? 'Job marked as completed.' : 'Job marked as in progress.');
      setConfirmBooking(null); load();
    } catch (err) { toast.error(err.message); } finally { setProcessing(false); }
  }

  return (
    <DashboardLayout navItems={mechanicNav} title="Active Jobs">
      {bookings === null ? <Loader label="Loading active jobs..." /> : bookings.length === 0 ? (
        <Card><CardBody><EmptyState icon={Wrench} title="No active jobs" description="Jobs you've accepted will appear here until they're completed." /></CardBody></Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <Card key={b.id}>
              <CardBody>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-display font-bold text-ink">{b.service_name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Accepted {formatDate(b.accepted_at)}</p>
                  </div>
                  <Badge status={b.status} />
                </div>
                <div className="grid sm:grid-cols-2 gap-3 mt-4 text-sm">
                  <div className="flex items-start gap-2"><Car className="h-4 w-4 text-slate-400 mt-0.5" /><span className="text-ink">{b.vehicle_brand} {b.vehicle_model} · {b.vehicle_registration}</span></div>
                  <div className="flex items-start gap-2"><MapPin className="h-4 w-4 text-slate-400 mt-0.5" /><span className="text-ink">{b.location_address}</span></div>
                  <div className="flex items-start gap-2"><FileText className="h-4 w-4 text-slate-400 mt-0.5" /><span className="text-ink">{b.problem_description}</span></div>
                  <div className="flex items-start gap-2"><Phone className="h-4 w-4 text-slate-400 mt-0.5" /><span className="text-ink">{b.customer_name} · {b.customer_phone}</span></div>
                </div>
                <div className="mt-4">
                  <Button variant="beacon" onClick={() => setConfirmBooking(b)}>
                    {b.status === 'accepted' ? <PlayCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                    {NEXT_LABEL[b.status]}
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
      <ConfirmDialog open={!!confirmBooking} title={confirmBooking && NEXT_LABEL[confirmBooking.status]}
        message={confirmBooking?.status === 'accepted' ? 'Mark this job as in progress once you begin working on it.' : 'Mark this job as completed once the work is finished. You will be marked available again and the customer can leave a review.'}
        confirmLabel="Confirm" variant="beacon" loading={processing} onConfirm={handleAdvance} onClose={() => setConfirmBooking(null)} />
    </DashboardLayout>
  );
}
