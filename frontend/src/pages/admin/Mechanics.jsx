import React, { useEffect, useState } from 'react';
import { Search, ShieldCheck, Star } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { adminNav } from '../../components/layout/navConfig';
import { adminApi } from '../../api/admin';
import { useToast } from '../../context/ToastContext';
import { Card, CardBody } from '../../components/ui/Card';
import { Table, THead, TRow, TH, TD } from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const STATUS_FILTERS = [{ value: '', label: 'All' }, { value: 'pending', label: 'Pending' }, { value: 'approved', label: 'Approved' }, { value: 'suspended', label: 'Suspended' }];

export default function AdminMechanics() {
  const toast = useToast();
  const [mechanics, setMechanics] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [processing, setProcessing] = useState(false);

  function load(q = search, status = statusFilter) {
    const params = {};
    if (q) params.search = q;
    if (status) params.status = status;
    adminApi.mechanics(params).then((res) => setMechanics(res.data.mechanics)).catch(() => setMechanics([]));
  }

  useEffect(() => { load(search, statusFilter); }, [statusFilter]); // eslint-disable-line

  function handleSearchSubmit(e) { e.preventDefault(); load(search, statusFilter); }

  async function handleConfirm() {
    setProcessing(true);
    try {
      const { mechanic, action } = confirmTarget;
      if (action === 'approve') await adminApi.approveMechanic(mechanic.id);
      if (action === 'suspend') await adminApi.suspendMechanic(mechanic.id);
      if (action === 'activate') await adminApi.activateMechanic(mechanic.id);
      toast.success(action === 'approve' ? 'Mechanic approved.' : action === 'suspend' ? 'Mechanic suspended.' : 'Mechanic reactivated.');
      setConfirmTarget(null); load(search, statusFilter);
    } catch (err) { toast.error(err.message); } finally { setProcessing(false); }
  }

  return (
    <DashboardLayout navItems={adminNav} title="Mechanics">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-sm">
          <Input placeholder="Search by name or email" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Button type="submit" variant="outline"><Search className="h-4 w-4" /></Button>
        </form>
        <div className="flex gap-2">
          {STATUS_FILTERS.map((f) => (
            <button key={f.value} onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${statusFilter === f.value ? 'bg-ink text-white border-ink' : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'}`}>{f.label}</button>
          ))}
        </div>
      </div>
      {mechanics === null ? <Loader label="Loading mechanics..." /> : mechanics.length === 0 ? (
        <Card><CardBody><EmptyState icon={ShieldCheck} title="No mechanics found" /></CardBody></Card>
      ) : (
        <Card>
          <Table>
            <THead><TRow><TH>Name</TH><TH>Email</TH><TH>Area</TH><TH>Rating</TH><TH>Jobs</TH><TH>Approval</TH><TH></TH></TRow></THead>
            <tbody>
              {mechanics.map((m) => (
                <TRow key={m.id}>
                  <TD className="font-medium">{m.name}</TD>
                  <TD>{m.email}</TD>
                  <TD>{m.service_area || '—'}</TD>
                  <TD><span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-beacon-500 text-beacon-500" /> {Number(m.avg_rating).toFixed(1)}</span></TD>
                  <TD>{m.booking_count}</TD>
                  <TD><Badge status={m.approval_status} /></TD>
                  <TD>
                    <div className="flex gap-2">
                      {m.approval_status === 'pending' && <Button size="sm" variant="beacon" onClick={() => setConfirmTarget({ mechanic: m, action: 'approve' })}>Approve</Button>}
                      {m.approval_status !== 'suspended' ? (
                        <Button size="sm" variant="danger" onClick={() => setConfirmTarget({ mechanic: m, action: 'suspend' })}>Suspend</Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => setConfirmTarget({ mechanic: m, action: 'activate' })}>Reactivate</Button>
                      )}
                    </div>
                  </TD>
                </TRow>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
      <ConfirmDialog open={!!confirmTarget}
        title={confirmTarget?.action === 'approve' ? 'Approve this mechanic?' : confirmTarget?.action === 'suspend' ? 'Suspend this mechanic?' : 'Reactivate this mechanic?'}
        message={confirmTarget?.action === 'approve' ? `${confirmTarget?.mechanic.name} will become visible to customers.` : confirmTarget?.action === 'suspend' ? `${confirmTarget?.mechanic.name} will not be able to log in or receive requests until reactivated.` : `${confirmTarget?.mechanic.name} will be approved and able to log in again.`}
        confirmLabel={confirmTarget?.action === 'approve' ? 'Approve' : confirmTarget?.action === 'suspend' ? 'Suspend' : 'Reactivate'}
        variant={confirmTarget?.action === 'suspend' ? 'danger' : 'beacon'}
        loading={processing} onConfirm={handleConfirm} onClose={() => setConfirmTarget(null)} />
    </DashboardLayout>
  );
}
