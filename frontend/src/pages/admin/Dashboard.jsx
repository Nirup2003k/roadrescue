import React, { useEffect, useState } from 'react';
import { Users, ShieldCheck, ClipboardList, Star, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { adminNav } from '../../components/layout/navConfig';
import { adminApi } from '../../api/admin';
import StatCard from '../../components/ui/StatCard';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Loader from '../../components/ui/Loader';
import { formatDate } from '../../utils/format';

const STATUS_COLORS = { pending: '#F5A524', accepted: '#2F6FA8', in_progress: '#1E4869', completed: '#2E9E6D', rejected: '#D6483D', cancelled: '#8B93A1' };

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  useEffect(() => { adminApi.stats().then((res) => setStats(res.data)); }, []);
  const chartData = stats?.bookingsByStatus.map((s) => ({ name: s.status.replace('_', ' '), count: s.count, status: s.status }));

  return (
    <DashboardLayout navItems={adminNav} title="Dashboard">
      {!stats ? <Loader label="Loading dashboard stats..." /> : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard icon={Users} label="Customers" value={stats.customerCount} tone="white" />
            <StatCard icon={ShieldCheck} label="Mechanics" value={stats.mechanicCount} tone="white" />
            <StatCard icon={ClipboardList} label="Total Bookings" value={stats.totalBookings} tone="ink" />
            <StatCard icon={Clock} label="Pending Approvals" value={stats.pendingApprovals} tone="beacon" />
          </div>
          <div className="grid lg:grid-cols-3 gap-5 mb-6">
            <Card className="lg:col-span-2">
              <CardHeader title="Bookings by status" />
              <CardBody>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E9EBEF" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#5B6472' }} axisLine={{ stroke: '#D4D8DF' }} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#5B6472' }} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: '#F7F8FA' }} />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {chartData?.map((entry) => <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || '#5B6472'} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Platform quality" />
              <CardBody className="space-y-4">
                <div className="flex items-center justify-between"><span className="text-sm text-slate-500 flex items-center gap-1.5"><Star className="h-4 w-4 text-beacon-500" /> Average rating</span><span className="font-display font-bold text-ink">{stats.avgRating || '—'}</span></div>
                <div className="flex items-center justify-between"><span className="text-sm text-slate-500">Total reviews</span><span className="font-display font-bold text-ink">{stats.totalReviews}</span></div>
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Top rated mechanics</p>
                  <div className="space-y-2">
                    {stats.topMechanics.length === 0 && <p className="text-sm text-slate-400">No reviews yet.</p>}
                    {stats.topMechanics.map((m) => (
                      <div key={m.id} className="flex items-center justify-between text-sm">
                        <span className="text-ink">{m.name}</span>
                        <span className="flex items-center gap-1 text-slate-500"><Star className="h-3.5 w-3.5 fill-beacon-500 text-beacon-500" /> {m.avg_rating} ({m.review_count})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
          <Card>
            <CardHeader title="Recent bookings" />
            <CardBody>
              <div className="divide-y divide-slate-100">
                {stats.recentBookings.map((b) => (
                  <div key={b.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div>
                      <p className="font-medium text-ink text-sm">{b.service_name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{b.customer_name} → {b.mechanic_name} · {formatDate(b.requested_at)}</p>
                    </div>
                    <Badge status={b.status} />
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </>
      )}
    </DashboardLayout>
  );
}
