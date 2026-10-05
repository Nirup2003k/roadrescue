import React, { useEffect, useState } from 'react';
import { Search, Users } from 'lucide-react';
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
import { formatDate } from '../../utils/format';

export default function AdminCustomers() {
  const toast = useToast();
  const [customers, setCustomers] = useState(null);
  const [search, setSearch] = useState('');
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [processing, setProcessing] = useState(false);

  function load(q = '') { adminApi.customers(q ? { search: q } : {}).then((res) => setCustomers(res.data.customers)).catch(() => setCustomers([])); }
  useEffect(() => load(), []);

  function handleSearchSubmit(e) { e.preventDefault(); load(search); }

  async function handleConfirm() {
    setProcessing(true);
    try {
      if (confirmTarget.action === 'suspend') { await adminApi.suspendCustomer(confirmTarget.customer.id); toast.success('Customer suspended.'); }
      else { await adminApi.activateCustomer(confirmTarget.customer.id); toast.success('Customer activated.'); }
      setConfirmTarget(null); load(search);
    } catch (err) { toast.error(err.message); } finally { setProcessing(false); }
  }

  return (
    <DashboardLayout navItems={adminNav} title="Customers">
      <form onSubmit={handleSearchSubmit} className="flex gap-2 mb-5 max-w-sm">
        <Input placeholder="Search by name or email" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Button type="submit" variant="outline"><Search className="h-4 w-4" /></Button>
      </form>
      {customers === null ? <Loader label="Loading customers..." /> : customers.length === 0 ? (
        <Card><CardBody><EmptyState icon={Users} title="No customers found" /></CardBody></Card>
      ) : (
        <Card>
          <Table>
            <THead><TRow><TH>Name</TH><TH>Email</TH><TH>Phone</TH><TH>City</TH><TH>Bookings</TH><TH>Joined</TH><TH>Status</TH><TH></TH></TRow></THead>
            <tbody>
              {customers.map((c) => (
                <TRow key={c.id}>
                  <TD className="font-medium">{c.name}</TD>
                  <TD>{c.email}</TD>
                  <TD>{c.phone}</TD>
                  <TD>{c.city || '—'}</TD>
                  <TD>{c.booking_count}</TD>
                  <TD className="whitespace-nowrap">{formatDate(c.created_at)}</TD>
                  <TD><Badge status={c.status} /></TD>
                  <TD>
                    {c.status === 'active' ? (
                      <Button size="sm" variant="danger" onClick={() => setConfirmTarget({ customer: c, action: 'suspend' })}>Suspend</Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => setConfirmTarget({ customer: c, action: 'activate' })}>Activate</Button>
                    )}
                  </TD>
                </TRow>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
      <ConfirmDialog open={!!confirmTarget}
        title={confirmTarget?.action === 'suspend' ? 'Suspend this customer?' : 'Activate this customer?'}
        message={confirmTarget?.action === 'suspend' ? `${confirmTarget?.customer.name} will not be able to log in until reactivated.` : `${confirmTarget?.customer.name} will be able to log in again.`}
        confirmLabel={confirmTarget?.action === 'suspend' ? 'Suspend' : 'Activate'}
        variant={confirmTarget?.action === 'suspend' ? 'danger' : 'beacon'}
        loading={processing} onConfirm={handleConfirm} onClose={() => setConfirmTarget(null)} />
    </DashboardLayout>
  );
}
