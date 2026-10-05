import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Wrench, Car, User, Phone, FileText } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { customerNav } from '../../components/layout/navConfig';
import { bookingApi } from '../../api/bookings';
import { reviewApi } from '../../api/reviews';
import { useToast } from '../../context/ToastContext';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Loader from '../../components/ui/Loader';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Modal from '../../components/ui/Modal';
import Textarea from '../../components/ui/Textarea';
import StarRating from '../../components/ui/StarRating';
import ErrorBanner from '../../components/ui/ErrorBanner';
import { formatDate, formatCurrency } from '../../utils/format';

const CANCELLABLE = ['pending', 'accepted'];

export default function BookingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [booking, setBooking] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const [reviewOpen, setReviewOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  function load() { bookingApi.get(id).then((res) => setBooking(res.data.booking)).catch(() => setNotFound(true)); }
  useEffect(load, [id]);

  async function handleCancel() {
    setCancelling(true);
    try {
      await bookingApi.cancel(id, cancelReason);
      toast.success('Request cancelled.'); setCancelOpen(false); load();
    } catch (err) { toast.error(err.message); } finally { setCancelling(false); }
  }

  async function handleReview(e) {
    e.preventDefault();
    setReviewError(''); setSubmittingReview(true);
    try {
      await reviewApi.create({ bookingId: id, rating, comment });
      toast.success('Thanks for your feedback!'); setReviewOpen(false); load();
    } catch (err) { setReviewError(err.message); } finally { setSubmittingReview(false); }
  }

  if (notFound) {
    return (
      <DashboardLayout navItems={customerNav} title="Booking Details">
        <p className="text-slate-500">Booking not found. <Link to="/customer/bookings" className="text-route-600 hover:underline">Back to bookings</Link></p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={customerNav} title="Booking Details">
      <button onClick={() => navigate('/customer/bookings')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-ink mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to bookings
      </button>

      {!booking ? <Loader label="Loading booking..." /> : (
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            <Card>
              <CardHeader title={`Request #${booking.id}`} subtitle={`Requested ${formatDate(booking.requested_at)}`} action={<Badge status={booking.status} />} />
              <CardBody className="space-y-4">
                <div className="flex items-start gap-3">
                  <Wrench className="h-4 w-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500">Service</p>
                    <p className="text-sm font-medium text-ink">{booking.service_name} · {formatCurrency(booking.price_snapshot ?? booking.current_service_price)}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Price charged at the time this request was made</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FileText className="h-4 w-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500">Problem Description</p>
                    <p className="text-sm text-ink">{booking.problem_description}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500">Location</p>
                    <p className="text-sm text-ink">{booking.location_address}</p>
                    {booking.distance_km !== null && booking.distance_km !== undefined && (
                      <p className="text-xs text-slate-500 mt-0.5">{booking.distance_km} km from mechanic · estimated arrival was {booking.eta_minutes} min</p>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Car className="h-4 w-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500">Vehicle</p>
                    <p className="text-sm text-ink">{booking.vehicle_brand} {booking.vehicle_model} · {booking.vehicle_registration}</p>
                  </div>
                </div>
                {booking.status === 'cancelled' && booking.cancellation_reason && (
                  <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600"><span className="font-medium text-ink">Cancellation reason: </span>{booking.cancellation_reason}</div>
                )}
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Status timeline" />
              <CardBody><Timeline booking={booking} /></CardBody>
            </Card>
          </div>

          <div className="space-y-5">
            <Card>
              <CardHeader title="Mechanic" />
              <CardBody className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-route-50 flex items-center justify-center"><User className="h-5 w-5 text-route-600" /></div>
                  <div>
                    <p className="font-medium text-ink text-sm">{booking.mechanic_name}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1"><Phone className="h-3 w-3" /> {booking.mechanic_phone}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="space-y-3">
                {CANCELLABLE.includes(booking.status) && <Button variant="danger" className="w-full" onClick={() => setCancelOpen(true)}>Cancel Request</Button>}
                {booking.status === 'completed' && !booking.has_review && <Button variant="beacon" className="w-full" onClick={() => setReviewOpen(true)}>Rate this Mechanic</Button>}
                {booking.status === 'completed' && booking.has_review > 0 && <p className="text-sm text-slate-500 text-center">You've already reviewed this booking.</p>}
                {!CANCELLABLE.includes(booking.status) && booking.status !== 'completed' && <p className="text-sm text-slate-500 text-center">No actions available for this status.</p>}
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      <ConfirmDialog open={cancelOpen} title="Cancel this request?" message="This will notify the mechanic that the request is no longer needed."
        confirmLabel="Yes, cancel" loading={cancelling} onConfirm={handleCancel} onClose={() => setCancelOpen(false)} />

      <Modal open={reviewOpen} onClose={() => setReviewOpen(false)} title="Rate your mechanic"
        footer={<><Button variant="ghost" onClick={() => setReviewOpen(false)} disabled={submittingReview}>Cancel</Button><Button variant="beacon" onClick={handleReview} loading={submittingReview}>Submit Review</Button></>}>
        <form onSubmit={handleReview} className="space-y-4">
          <ErrorBanner message={reviewError} />
          <div>
            <p className="text-sm font-medium text-ink-800 mb-2">How was your experience?</p>
            <StarRating value={rating} onChange={setRating} size={28} />
          </div>
          <Textarea label="Comment" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Optional — share details about the service" />
        </form>
      </Modal>
    </DashboardLayout>
  );
}

const STEPS = [
  { key: 'requested_at', label: 'Request submitted' },
  { key: 'accepted_at', label: 'Accepted by mechanic' },
  { key: 'started_at', label: 'Work in progress' },
  { key: 'completed_at', label: 'Completed' },
];

function Timeline({ booking }) {
  if (booking.status === 'cancelled') return <p className="text-sm text-slate-500">This request was cancelled on {formatDate(booking.cancelled_at)}.</p>;
  if (booking.status === 'rejected') return <p className="text-sm text-slate-500">This request was rejected by the mechanic.</p>;
  return (
    <ol className="space-y-4">
      {STEPS.map((step) => {
        const done = !!booking[step.key];
        return (
          <li key={step.key} className="flex items-start gap-3">
            <div className={`h-2.5 w-2.5 rounded-full mt-1.5 shrink-0 ${done ? 'bg-success-500' : 'bg-slate-200'}`} />
            <div>
              <p className={`text-sm font-medium ${done ? 'text-ink' : 'text-slate-400'}`}>{step.label}</p>
              {done && <p className="text-xs text-slate-500">{formatDate(booking[step.key])}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
