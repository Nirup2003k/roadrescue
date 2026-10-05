import React, { useEffect, useState } from 'react';
import { Star, Trash2 } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { adminNav } from '../../components/layout/navConfig';
import { adminApi } from '../../api/admin';
import { useToast } from '../../context/ToastContext';
import { Card, CardBody } from '../../components/ui/Card';
import StarRating from '../../components/ui/StarRating';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { formatDate } from '../../utils/format';

export default function AdminReviews() {
  const toast = useToast();
  const [reviews, setReviews] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  function load() { adminApi.reviews().then((res) => setReviews(res.data.reviews)).catch(() => setReviews([])); }
  useEffect(load, []);

  async function handleDelete() {
    setDeleting(true);
    try { await adminApi.deleteReview(deleteTarget.id); toast.success('Review removed.'); setDeleteTarget(null); load(); }
    catch (err) { toast.error(err.message); } finally { setDeleting(false); }
  }

  return (
    <DashboardLayout navItems={adminNav} title="Reviews">
      {reviews === null ? <Loader label="Loading reviews..." /> : reviews.length === 0 ? (
        <Card><CardBody><EmptyState icon={Star} title="No reviews yet" /></CardBody></Card>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <Card key={r.id}>
              <CardBody>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-ink text-sm">{r.customer_name} → {r.mechanic_name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{r.service_name} · {formatDate(r.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StarRating value={r.rating} readOnly size={16} />
                    <button onClick={() => setDeleteTarget(r)} className="p-1.5 rounded-md hover:bg-danger-50 text-slate-400 hover:text-danger-600" aria-label="Remove review"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
                {r.comment && <p className="text-sm text-slate-600 mt-3">{r.comment}</p>}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
      <ConfirmDialog open={!!deleteTarget} title="Remove this review?" message="This will permanently delete the review. Use this only for inappropriate or abusive content."
        confirmLabel="Remove" loading={deleting} onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} />
    </DashboardLayout>
  );
}
