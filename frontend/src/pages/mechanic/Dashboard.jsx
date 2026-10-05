import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Inbox, Wrench, CheckCircle2, IndianRupee, ArrowRight, AlertTriangle } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { mechanicNav } from '../../components/layout/navConfig';
import { bookingApi } from '../../api/bookings';
import { mechanicApi } from '../../api/mechanics';
import { userApi } from '../../api/users';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import StatCard from '../../components/ui/StatCard';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import { formatDate, formatCurrency } from '../../utils/format';

const AVAILABILITY_OPTIONS = ['available', 'busy', 'offline'];

export default function MechanicDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [bookings, setBookings] = useState(null);
  const [earnings, setEarnings] = useState(null);
  const [profile, setProfile] = useState(null);
  const [updatingAvailability, setUpdatingAvailability] = useState(false);

  function load() {
    bookingApi.list().then((res) => setBookings(res.data.bookings)).catch(() => setBookings([]));
    mechanicApi.earnings().then((res) => setEarnings(res.data)).catch(() => setEarnings(null));
    userApi.getProfile().then((res) => setProfile(res.data.profile)).catch(() => {});
  }
  useEffect(load, []);

  async function handleAvailabilityChange(status) {
    setUpdatingAvailability(true);
    try {
      await mechanicApi.updateAvailability(status);
      setProfile((p) => ({ ...p, availability_status: status }));
      toast.success(`You're now marked as ${status}.`);
    } catch (err) { toast.error(err.message); } finally { setUpdatingAvailability(false); }
  }

  const loading = bookings === null || earnings === null || profile === null;
  const pendingCount = bookings?.filter((b) => b.status === 'pending').length ?? 0;
  const activeCount = bookings?.filter((b) => ['accepted', 'in_progress'].includes(b.status)).length ?? 0;

  return (
    <DashboardLayout navItems={mechanicNav} title="Dashboard">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-xl text-ink">Welcome back, {user?.name?.split(' ')[0]}</h2>
          <p className="text-slate-500 text-sm mt-1">Here's your current job queue and earnings.</p>
        </div>
        {!loading && (
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1">
            {AVAILABILITY_OPTIONS.map((opt) => (
              <button key={opt} disabled={updatingAvailability} onClick={() => handleAvailabilityChange(opt)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-colors ${profile.availability_status === opt ? 'bg-ink text-white' : 'text-slate-500 hover:bg-slate-100'}`}>{opt}</button>
            ))}
          </div>
        )}
      </div>
      {loading ? <Loader label="Loading your dashboard..." /> : (
        <>
          {profile.approval_status === 'pending' && (
            <div className="flex items-start gap-2.5 rounded-lg bg-beacon-50 border border-beacon-500/30 px-4 py-3 text-sm text-beacon-700 mb-6">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>Your account is pending admin approval. You won't appear in the customer directory until approved, but you can still set up your profile and services.</span>
            </div>
          )}
          <div className="grid sm:grid-cols-4 gap-4 mb-6">
            <StatCard icon={Inbox} label="New Requests" value={pendingCount} tone="beacon" />
            <StatCard icon={Wrench} label="Active Jobs" value={activeCount} tone="route" />
            <StatCard icon={CheckCircle2} label="Completed Jobs" value={earnings.summary.completed_jobs} tone="ink" />
            <StatCard icon={IndianRupee} label="Total Earnings" value={formatCurrency(earnings.summary.total_earnings)} tone="white" />
          </div>
          <Card>
            <CardHeader title="Recent requests" action={<Link to="/mechanic/requests" className="text-sm text-route-600 font-medium hover:underline flex items-center gap-1">View incoming <ArrowRight className="h-3.5 w-3.5" /></Link>} />
            <CardBody>
              {bookings.length === 0 ? <EmptyState icon={Inbox} title="No requests yet" description="Incoming assistance requests will show up here." /> : (
                <div className="divide-y divide-slate-100">
                  {bookings.slice(0, 6).map((b) => (
                    <div key={b.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                      <div>
                        <p className="font-medium text-ink text-sm">{b.service_name} · {b.vehicle_registration}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{formatDate(b.requested_at)} · {b.customer_name}</p>
                      </div>
                      <Badge status={b.status} />
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </>
      )}
    </DashboardLayout>
  );
}
