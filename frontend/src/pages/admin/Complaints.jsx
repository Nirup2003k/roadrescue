import React, { useEffect, useState } from 'react';
import { MessageSquareWarning, CheckCircle2, Clock, XCircle, AlertCircle, FileText, User } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { adminNav } from '../../components/layout/navConfig';
import { adminApi } from '../../api/admin';
import { useToast } from '../../context/ToastContext';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import ErrorBanner from '../../components/ui/ErrorBanner';
import { formatDate } from '../../utils/format';

const TABS = [
  { key: '', label: 'All Complaints' },
  { key: 'pending', label: 'Pending' },
  { key: 'under_review', label: 'Under Review' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'dismissed', label: 'Dismissed' },
];

const STATUS_CONFIG = {
  pending: { label: 'Pending', bg: 'bg-amber-100', text: 'text-amber-800' },
  under_review: { label: 'Under Review', bg: 'bg-blue-100', text: 'text-blue-800' },
  resolved: { label: 'Resolved', bg: 'bg-emerald-100', text: 'text-emerald-800' },
  dismissed: { label: 'Dismissed', bg: 'bg-slate-100', text: 'text-slate-700' },
};

export default function AdminComplaints() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('');
  const [complaints, setComplaints] = useState(null);

  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [status, setStatus] = useState('resolved');
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  function load() {
    setComplaints(null);
    adminApi.complaints(activeTab ? { status: activeTab } : {})
      .then((res) => setComplaints(res.data.complaints))
      .catch(() => setComplaints([]));
  }

  useEffect(load, [activeTab]);

  function openEditModal(c) {
    setSelectedComplaint(c);
    setStatus(c.status);
    setAdminNotes(c.admin_notes || '');
    setError('');
  }

  async function handleUpdate(e) {
    e.preventDefault();
    setError('');
    setUpdating(true);
    try {
      await adminApi.updateComplaintStatus(selectedComplaint.id, { status, adminNotes });
      toast.success('Complaint status updated.');
      setSelectedComplaint(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <DashboardLayout navItems={adminNav} title="Complaints & Disputes">
      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === t.key
                ? 'bg-beacon-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {complaints === null ? (
        <Loader label="Loading complaints..." />
      ) : complaints.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={MessageSquareWarning}
              title="No complaints found"
              description="No user complaints or disputes match the selected status filter."
            />
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {complaints.map((c) => {
            const st = STATUS_CONFIG[c.status] || STATUS_CONFIG.pending;
            return (
              <Card key={c.id}>
                <CardBody className="space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-ink text-base">
                          {c.subject}
                        </span>
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${st.bg} ${st.text}`}>
                          {st.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Complaint #{c.id} · Booking #{c.booking_id} ({c.service_name}) · Reported {formatDate(c.created_at)}
                      </p>
                    </div>

                    <Button variant="outline" size="sm" onClick={() => openEditModal(c)}>
                      Update Status
                    </Button>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm text-ink">
                    <p className="font-medium text-xs text-slate-500 uppercase tracking-wide mb-1">Issue Description</p>
                    <p>{c.description}</p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3 text-xs text-slate-600 border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-slate-400" />
                      <span>
                        <strong>Reporter:</strong> {c.reporter_name} ({c.reporter_role}) · {c.reporter_phone}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-slate-400" />
                      <span>
                        <strong>Parties:</strong> Customer {c.customer_name} / Mechanic {c.mechanic_name}
                      </span>
                    </div>
                  </div>

                  {c.admin_notes && (
                    <div className="bg-beacon-50 border border-beacon-200 rounded-lg p-2.5 text-xs text-beacon-900">
                      <strong>Admin Resolution Note:</strong> {c.admin_notes}
                    </div>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={!!selectedComplaint}
        onClose={() => setSelectedComplaint(null)}
        title={`Update Dispute #${selectedComplaint?.id}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setSelectedComplaint(null)} disabled={updating}>
              Cancel
            </Button>
            <Button variant="beacon" onClick={handleUpdate} loading={updating}>
              Save Changes
            </Button>
          </>
        }
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <ErrorBanner message={error} />
          <Select
            label="Resolution Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="pending">Pending</option>
            <option value="under_review">Under Review</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </Select>

          <Textarea
            label="Admin Resolution Notes"
            placeholder="Explain action taken or resolution details for record"
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
          />
        </form>
      </Modal>
    </DashboardLayout>
  );
}
