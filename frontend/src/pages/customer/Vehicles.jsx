import React, { useEffect, useState } from 'react';
import { Car, Plus, Pencil, Trash2 } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { customerNav } from '../../components/layout/navConfig';
import { vehicleApi } from '../../api/vehicles';
import { useToast } from '../../context/ToastContext';
import { Card, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import ErrorBanner from '../../components/ui/ErrorBanner';

const VEHICLE_TYPES = ['Car', 'Bike', 'Truck', 'Other'];
const emptyForm = { vehicleType: 'Car', brand: '', model: '', registrationNumber: '' };

export default function CustomerVehicles() {
  const toast = useToast();
  const [vehicles, setVehicles] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  function load() { vehicleApi.list().then((res) => setVehicles(res.data.vehicles)).catch(() => setVehicles([])); }
  useEffect(load, []);

  function openCreate() { setEditing(null); setForm(emptyForm); setError(''); setModalOpen(true); }
  function openEdit(v) {
    setEditing(v);
    setForm({ vehicleType: v.vehicle_type, brand: v.brand, model: v.model, registrationNumber: v.registration_number });
    setError(''); setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setSaving(true);
    try {
      if (editing) { await vehicleApi.update(editing.id, form); toast.success('Vehicle updated.'); }
      else { await vehicleApi.create(form); toast.success('Vehicle added.'); }
      setModalOpen(false); load();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await vehicleApi.remove(deleteTarget.id);
      toast.success('Vehicle deleted.'); setDeleteTarget(null); load();
    } catch (err) { toast.error(err.message); } finally { setDeleting(false); }
  }

  return (
    <DashboardLayout navItems={customerNav} title="My Vehicles">
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-slate-500">Vehicles you can request assistance for.</p>
        <Button variant="beacon" onClick={openCreate}><Plus className="h-4 w-4" /> Add Vehicle</Button>
      </div>
      {vehicles === null ? <Loader label="Loading vehicles..." /> : vehicles.length === 0 ? (
        <Card><CardBody><EmptyState icon={Car} title="No vehicles added yet" description="Add a vehicle so you can request roadside assistance for it."
          action={<Button variant="beacon" onClick={openCreate}><Plus className="h-4 w-4" /> Add Vehicle</Button>} /></CardBody></Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((v) => (
            <Card key={v.id}>
              <CardBody>
                <div className="flex items-start justify-between">
                  <div className="h-10 w-10 rounded-lg bg-route-50 flex items-center justify-center"><Car className="h-5 w-5 text-route-600" /></div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(v)} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500" aria-label="Edit vehicle"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => setDeleteTarget(v)} className="p-1.5 rounded-md hover:bg-danger-50 text-slate-500 hover:text-danger-600" aria-label="Delete vehicle"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
                <h3 className="font-display font-bold text-ink mt-3">{v.brand} {v.model}</h3>
                <p className="text-sm text-slate-500">{v.vehicle_type} · {v.registration_number}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Vehicle' : 'Add Vehicle'}
        footer={<><Button variant="ghost" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</Button><Button onClick={handleSubmit} loading={saving}>{editing ? 'Save Changes' : 'Add Vehicle'}</Button></>}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <ErrorBanner message={error} />
          <Select label="Vehicle Type" required value={form.vehicleType} onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}>
            {VEHICLE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Brand" required value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="Honda" />
            <Input label="Model" required value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="City" />
          </div>
          <Input label="Registration Number" required value={form.registrationNumber} onChange={(e) => setForm({ ...form, registrationNumber: e.target.value.toUpperCase() })} placeholder="KA01AB1234" />
        </form>
      </Modal>
      <ConfirmDialog open={!!deleteTarget} title="Delete vehicle?"
        message={deleteTarget ? `This will permanently remove ${deleteTarget.brand} ${deleteTarget.model} (${deleteTarget.registration_number}). This cannot be undone.` : ''}
        confirmLabel="Delete" loading={deleting} onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} />
    </DashboardLayout>
  );
}
