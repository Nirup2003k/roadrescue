import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { mechanicNav } from '../../components/layout/navConfig';
import { reviewApi } from '../../api/reviews';
import { Card, CardBody } from '../../components/ui/Card';
import StarRating from '../../components/ui/StarRating';
import StatCard from '../../components/ui/StatCard';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import { formatDate } from '../../utils/format';

export default function MechanicReviews() {
  const [reviews, setReviews] = useState(null);
  useEffect(() => { reviewApi.received().then((res) => setReviews(res.data.reviews)).catch(() => setReviews([])); }, []);
  const avg = reviews?.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '—';

  return (
    <DashboardLayout navItems={mechanicNav} title="Reviews">
      {reviews === null ? <Loader label="Loading reviews..." /> : (
        <>
          <div className="grid sm:grid-cols-2 gap-4 mb-6 max-w-md">
            <StatCard icon={Star} label="Average Rating" value={avg} tone="beacon" />
            <StatCard icon={Star} label="Total Reviews" value={reviews.length} tone="white" />
          </div>
          {reviews.length === 0 ? (
            <Card><CardBody><EmptyState icon={Star} title="No reviews yet" description="Customer reviews after completed jobs will appear here." /></CardBody></Card>
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => (
                <Card key={r.id}>
                  <CardBody>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-ink text-sm">{r.customer_name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{r.service_name} · {formatDate(r.created_at)}</p>
                      </div>
                      <StarRating value={r.rating} readOnly size={16} />
                    </div>
                    {r.comment && <p className="text-sm text-slate-600 mt-3">{r.comment}</p>}
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
