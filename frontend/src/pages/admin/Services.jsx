import React, { useEffect, useState } from 'react';
import { Plus, ListChecks, Pencil } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { adminNav } from '../../components/layout/navConfig';
import { serviceApi } from '../../api/services';
import { useToast } from '../../context/ToastContext';
import { getServiceIcon } from '../../utils/serviceIcons';
import { formatCurrency } from '../../utils/format';
import { Card, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import ErrorBanner from '../../components/ui/ErrorBanner';

const emptyForm = { name: '', description: '', basePrice: '' };

export default function AdminServices() {
  const toast = useToast();
  const [services, setServices] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function load() { serviceApi.list(true).then((res) => setServices(res.data.services)).catch(() => setServices([])); }
  useEffect(load, []);

  function openCreate() { setEditing(null); setForm(emptyForm); setError(''); setModalOpen(true); }
  function openEdit(s) { setEditing(s); setForm({ name: s.name, description: s.description || '', basePrice: s.base_price }); setError(''); setModalOpen(true); }

  async function handleSubmit(e) {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      const payload = { ...form, basePrice: Number(form.basePrice) || 0 };
      if (editing) { await serviceApi.update(editing.id, payload); toast.success('Service updated.'); }
      else { await serviceApi.create(payload); toast.success('Service created.'); }
      setModalOpen(false); load();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  }

  async function toggleActive(s) {
    try { await serviceApi.update(s.id, { isActive: !s.is_active }); toast.success(s.is_active ? 'Service deactivated.' : 'Service activated.'); load(); }
    catch (err) { toast.error(err.message); }
  }

  return (
    <DashboardLayout navItems={adminNav} title="Services">
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-slate-500">Manage the service catalog customers can request.</p>
        <Button variant="beacon" onClick={openCreate}><Plus className="h-4 w-4" /> Add Service</Button>
      </div>
      {services === null ? <Loader label="Loading services..." /> : services.length === 0 ? (
        <Card><CardBody><EmptyState icon={ListChecks} title="No services yet" /></CardBody></Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((s) => {
            const Icon = getServiceIcon(s.name);
            return (
              <Card key={s.id}>
                <CardBody>
                  <div className="flex items-start justify-between">
                    <div className="h-10 w-10 rounded-lg bg-beacon-50 flex items-center justify-center"><Icon className="h-5 w-5 text-beacon-600" /></div>
                    <div className="flex items-center gap-2">
                      <Badge status={s.is_active ? 'active' : 'suspended'}>{s.is_active ? 'Active' : 'Inactive'}</Badge>
                      <button onClick={() => openEdit(s)} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500" aria-label="Edit service"><Pencil className="h-4 w-4" /></button>
                    </div>
                  </div>
                  <h3 className="font-display font-bold text-ink mt-3">{s.name}</h3>
                  <p className="text-sm text-slate-500 mt-1">{s.description}</p>
                  <p className="text-sm font-semibold text-ink mt-3">{formatCurrency(s.base_price)}</p>
                  <Button size="sm" variant={s.is_active ? 'outline' : 'beacon'} className="mt-3 w-full" onClick={() => toggleActive(s)}>{s.is_active ? 'Deactivate' : 'Activate'}</Button>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Service' : 'Add Service'}
        footer={<><Button variant="ghost" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</Button><Button onClick={handleSubmit} loading={saving}>{editing ? 'Save Changes' : 'Create Service'}</Button></>}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <ErrorBanner message={error} />
          <Input label="Service name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Input label="Base price (₹)" type="number" min="0" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: e.target.value })} />
        </form>
      </Modal>
    </DashboardLayout>
  );
}
