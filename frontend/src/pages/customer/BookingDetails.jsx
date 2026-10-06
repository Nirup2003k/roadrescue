import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Wrench, Car, User, Phone, FileText, Radio, Navigation, Clock, CheckCircle, Receipt, Star } from 'lucide-react';
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
import TrackingMap from '../../components/TrackingMap';
import { getSocket } from '../../utils/socket';
import { formatDate, formatCurrency } from '../../utils/format';

const CANCELLABLE = ['pending', 'accepted'];
const TRACKING_STATUSES = ['accepted', 'in_progress'];

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

  // Real-time tracking state
  const [mechanicLocation, setMechanicLocation] = useState(null);
  const [socketStatus, setSocketStatus] = useState('disconnected'); // 'connected' | 'reconnecting' | 'disconnected'

  function load() {
    bookingApi.get(id)
      .then((res) => setBooking(res.data.booking))
      .catch(() => setNotFound(true));
  }

  useEffect(load, [id]);

  // Real-time Socket.IO Tracking & Status Change Effect
  useEffect(() => {
    if (!booking) {
      setSocketStatus('disconnected');
      return;
    }

    const socket = getSocket();
    if (!socket) return;

    setSocketStatus(socket.connected ? 'connected' : 'connecting');

    function onConnect() {
      setSocketStatus('connected');
      socket.emit('join_booking_room', { bookingId: id }, (res) => {
        if (res && !res.success) {
          console.warn('[tracking] Room join failed:', res.message);
        }
      });
    }

    function onDisconnect() {
      setSocketStatus('disconnected');
    }

    function onReconnectAttempt() {
      setSocketStatus('reconnecting');
    }

    function onMechanicLocation(data) {
      if (data && String(data.bookingId) === String(id)) {
        setMechanicLocation(data);
      }
    }

    function onStatusChanged(data) {
      if (data && String(data.bookingId) === String(id)) {
        const statusLabel = data.status.replace('_', ' ').toUpperCase();
        toast.info(`Booking status updated to: ${statusLabel}`);
        setBooking((prev) => (prev ? { ...prev, status: data.status } : prev));
        load();
      }
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.io.on('reconnect_attempt', onReconnectAttempt);
    socket.on('mechanic_location', onMechanicLocation);
    socket.on('booking_status_changed', onStatusChanged);

    // Join room if already connected
    if (socket.connected) {
      onConnect();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.io.off('reconnect_attempt', onReconnectAttempt);
      socket.off('mechanic_location', onMechanicLocation);
      socket.off('booking_status_changed', onStatusChanged);
      socket.emit('leave_booking_room', { bookingId: id });
    };
  }, [id, booking?.id]);

  async function handleCancel() {
    setCancelling(true);
    try {
      await bookingApi.cancel(id, cancelReason);
      toast.success('Request cancelled.');
      setCancelOpen(false);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCancelling(false);
    }
  }

  async function handleReview(e) {
    e.preventDefault();
    setReviewError('');
    setSubmittingReview(true);
    try {
      await reviewApi.create({ bookingId: id, rating, comment });
      toast.success('Thanks for your feedback!');
      setReviewOpen(false);
      load();
    } catch (err) {
      setReviewError(err.message);
    } finally {
      setSubmittingReview(false);
    }
  }

  if (notFound) {
    return (
      <DashboardLayout navItems={customerNav} title="Booking Details">
        <p className="text-slate-500">Booking not found. <Link to="/customer/bookings" className="text-route-600 hover:underline">Back to bookings</Link></p>
      </DashboardLayout>
    );
  }

  const isTrackingActive = booking && TRACKING_STATUSES.includes(booking.status);
  const liveDist = mechanicLocation?.distanceKm ?? booking?.distance_km;
  const liveEta = mechanicLocation?.etaMinutes ?? booking?.eta_minutes;

  return (
    <DashboardLayout navItems={customerNav} title="Booking Details">
      <button onClick={() => navigate('/customer/bookings')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-ink mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to bookings
      </button>

      {!booking ? <Loader label="Loading booking..." /> : (
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            {/* Real-time Tracking Section (Active for accepted / in_progress bookings) */}
            {isTrackingActive && (
              <Card>
                <CardHeader
                  title="Real-Time Mechanic Tracking"
                  subtitle="Live GPS updates from mechanic"
                  action={
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                      style={{
                        backgroundColor: socketStatus === 'connected' ? '#D1FAE5' : socketStatus === 'reconnecting' ? '#FEF3C7' : '#F1F5F9',
                        color: socketStatus === 'connected' ? '#065F46' : socketStatus === 'reconnecting' ? '#92400E' : '#475569',
                      }}>
                      <div className={`h-2 w-2 rounded-full ${socketStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : socketStatus === 'reconnecting' ? 'bg-amber-500' : 'bg-slate-400'}`} />
                      {socketStatus === 'connected' ? '🟢 Live' : socketStatus === 'reconnecting' ? '🟡 Reconnecting...' : '⚪ Offline'}
                    </div>
                  }
                />
                <CardBody className="space-y-4">
                  <TrackingMap
                    customerLat={booking.latitude}
                    customerLng={booking.longitude}
                    mechanicLat={mechanicLocation?.latitude}
                    mechanicLng={mechanicLocation?.longitude}
                    height="320px"
                  />

                  {/* Real-Time Live Metrics Bar */}
                  <div className="grid sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Navigation className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Live Distance</p>
                        <p className="font-bold text-ink">{liveDist !== null && liveDist !== undefined ? `${liveDist} km` : 'Calculating...'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <Clock className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Estimated Arrival</p>
                        <p className="font-bold text-ink">{liveEta !== null && liveEta !== undefined ? `~${liveEta} mins` : 'Estimating...'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                        <Radio className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Last GPS Update</p>
                        <p className="font-semibold text-ink text-xs">
                          {mechanicLocation?.timestamp ? new Date(mechanicLocation.timestamp).toLocaleTimeString() : 'Waiting for GPS...'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}

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
                      <p className="text-xs text-slate-500 mt-0.5">Initial distance: {booking.distance_km} km · ETA was {booking.eta_minutes} min</p>
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

            {/* Completed Service Summary / Invoice */}
            {booking.status === 'completed' && (
              <Card>
                <CardHeader title="Service Summary & Invoice" subtitle={`Invoice #${booking.id}`} action={<Receipt className="h-5 w-5 text-beacon-600" />} />
                <CardBody className="space-y-3 border-t border-slate-100 pt-4">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block">Customer</span>
                      <span className="font-medium text-ink">{booking.customer_name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Vehicle</span>
                      <span className="font-medium text-ink">{booking.vehicle_brand} {booking.vehicle_model} ({booking.vehicle_registration})</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Assigned Mechanic</span>
                      <span className="font-medium text-ink">{booking.mechanic_name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Completed On</span>
                      <span className="font-medium text-ink">{booking.completed_at ? formatDate(booking.completed_at) : 'Completed'}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-ink">{booking.service_name}</p>
                      <p className="text-xs text-slate-500">Service Fee (Snapshotted at Request Time)</p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-extrabold text-beacon-700">{formatCurrency(booking.price_snapshot ?? booking.current_service_price)}</p>
                      <span className="inline-block text-[10px] uppercase tracking-wider font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full mt-0.5">Paid</span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Display Customer Review if submitted */}
            {booking.status === 'completed' && Number(booking.has_review) > 0 && (
              <Card>
                <CardHeader title="Your Rating & Feedback" action={<Star className="h-4 w-4 text-amber-500 fill-amber-500" />} />
                <CardBody className="space-y-2">
                  <div className="flex items-center gap-2">
                    <StarRating value={booking.review_rating ?? 5} readOnly size={18} />
                    <span className="text-xs font-semibold text-slate-700">{booking.review_rating ?? 5} / 5</span>
                  </div>
                  {booking.review_comment && (
                    <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 italic">"{booking.review_comment}"</p>
                  )}
                </CardBody>
              </Card>
            )}

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
                {booking.status === 'completed' && !Number(booking.has_review) && <Button variant="beacon" className="w-full" onClick={() => setReviewOpen(true)}>Rate this Mechanic</Button>}
                {booking.status === 'completed' && Number(booking.has_review) > 0 && <p className="text-sm text-slate-500 text-center">You've reviewed this completed service.</p>}
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
