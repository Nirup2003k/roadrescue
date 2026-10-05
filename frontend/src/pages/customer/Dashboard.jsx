import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Car, ClipboardList, CheckCircle2, PlusCircle, ArrowRight } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { customerNav } from '../../components/layout/navConfig';
import { vehicleApi } from '../../api/vehicles';
import { bookingApi } from '../../api/bookings';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/ui/StatCard';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import { formatDate } from '../../utils/format';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState(null);
  const [bookings, setBookings] = useState(null);

  useEffect(() => {
    vehicleApi.list().then((res) => setVehicles(res.data.vehicles)).catch(() => setVehicles([]));
    bookingApi.list().then((res) => setBookings(res.data.bookings)).catch(() => setBookings([]));
  }, []);

  const loading = vehicles === null || bookings === null;
  const activeCount = bookings?.filter((b) => ['pending', 'accepted', 'in_progress'].includes(b.status)).length ?? 0;
  const completedCount = bookings?.filter((b) => b.status === 'completed').length ?? 0;

  return (
    <DashboardLayout navItems={customerNav} title="Dashboard">
      <div className="mb-6">
        <h2 className="font-display font-extrabold text-xl text-ink">Welcome back, {user?.name?.split(' ')[0]}</h2>
        <p className="text-slate-500 text-sm mt-1">Here's what's happening with your vehicles and requests.</p>
      </div>
      {loading ? <Loader label="Loading your dashboard..." /> : (
        <>
          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            <StatCard icon={Car} label="Vehicles" value={vehicles.length} tone="white" />
            <StatCard icon={ClipboardList} label="Active Requests" value={activeCount} tone="beacon" />
            <StatCard icon={CheckCircle2} label="Completed" value={completedCount} tone="ink" />
          </div>
          <div className="flex flex-wrap gap-3 mb-6">
            <Link to="/customer/request"><Button variant="beacon"><PlusCircle className="h-4 w-4" /> Request Assistance</Button></Link>
            <Link to="/customer/vehicles"><Button variant="outline"><Car className="h-4 w-4" /> Manage Vehicles</Button></Link>
          </div>
          <Card>
            <CardHeader title="Recent requests" action={<Link to="/customer/bookings" className="text-sm text-route-600 font-medium hover:underline flex items-center gap-1">View all <ArrowRight className="h-3.5 w-3.5" /></Link>} />
            <CardBody>
              {bookings.length === 0 ? (
                <EmptyState icon={ClipboardList} title="No requests yet" description="When you request roadside assistance, it will show up here."
                  action={<Link to="/customer/request"><Button variant="beacon" size="sm">Request Assistance</Button></Link>} />
              ) : (
                <div className="divide-y divide-slate-100">
                  {bookings.slice(0, 5).map((b) => (
                    <Link key={b.id} to={`/customer/bookings/${b.id}`} className="flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:bg-slate-50 -mx-2 px-2 rounded-lg">
                      <div>
                        <p className="font-medium text-ink text-sm">{b.service_name} · {b.vehicle_registration}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{formatDate(b.requested_at)} · Mechanic: {b.mechanic_name}</p>
                      </div>
                      <Badge status={b.status} />
                    </Link>
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
