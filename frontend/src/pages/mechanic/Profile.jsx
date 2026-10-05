import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { mechanicNav } from '../../components/layout/navConfig';
import { userApi } from '../../api/users';
import { mechanicApi } from '../../api/mechanics';
import { serviceApi } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Loader from '../../components/ui/Loader';
import ErrorBanner from '../../components/ui/ErrorBanner';

export default function MechanicProfile() {
  const { refreshUser } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [allServices, setAllServices] = useState([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  const [savingServices, setSavingServices] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState('');

  function load() {
    userApi.getProfile().then((res) => {
      setProfile(res.data.profile);
      setForm({ name: res.data.profile.name, phone: res.data.profile.phone, bio: res.data.profile.bio || '', experienceYears: res.data.profile.experience_years ?? 0, serviceArea: res.data.profile.service_area || '' });
      setSelectedServiceIds(res.data.profile.services.map((s) => s.id));
    });
    serviceApi.list().then((res) => setAllServices(res.data.services));
  }
  useEffect(load, []);

  async function handleSave(e) {
    e.preventDefault(); setError(''); setSaving(true);
    try { await userApi.updateProfile(form); await refreshUser(); toast.success('Profile updated.'); }
    catch (err) { setError(err.message); } finally { setSaving(false); }
  }
  function toggleService(id) { setSelectedServiceIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id])); }
  async function handleSaveServices() {
    setSavingServices(true);
    try { await mechanicApi.updateServices(selectedServiceIds); toast.success('Services offered updated.'); }
    catch (err) { toast.error(err.message); } finally { setSavingServices(false); }
  }
  async function handlePasswordChange(e) {
    e.preventDefault(); setPwError(''); setPwSaving(true);
    try { await userApi.changePassword(pwForm); toast.success('Password updated.'); setPwForm({ currentPassword: '', newPassword: '' }); }
    catch (err) { setPwError(err.message); } finally { setPwSaving(false); }
  }

  return (
    <DashboardLayout navItems={mechanicNav} title="Profile">
      {!form ? <Loader label="Loading profile..." /> : (
        <div className="max-w-xl space-y-5">
          <Card>
            <CardHeader title="Personal details" subtitle={profile.email} action={<Badge status={profile.approval_status} />} />
            <CardBody>
              <form onSubmit={handleSave} className="space-y-4">
                <ErrorBanner message={error} />
                <Input label="Full name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <Input label="Phone" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                <Input label="Service area / city" value={form.serviceArea} onChange={(e) => setForm({ ...form, serviceArea: e.target.value })} />
                <Input label="Years of experience" type="number" min="0" value={form.experienceYears} onChange={(e) => setForm({ ...form, experienceYears: e.target.value })} />
                <Textarea label="Bio" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
                <Button type="submit" loading={saving}>Save Changes</Button>
              </form>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Services you offer" subtitle="Customers can only book you for services selected here." />
            <CardBody>
              <div className="grid sm:grid-cols-2 gap-2">
                {allServices.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-sm p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <input type="checkbox" checked={selectedServiceIds.includes(s.id)} onChange={() => toggleService(s.id)} className="h-4 w-4 rounded border-slate-300 text-route-600 focus:ring-route-500" />
                    {s.name}
                  </label>
                ))}
              </div>
              <Button variant="outline" className="mt-4" onClick={handleSaveServices} loading={savingServices}>Save Services</Button>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Change password" />
            <CardBody>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <ErrorBanner message={pwError} />
                <Input label="Current password" type="password" required value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} />
                <Input label="New password" type="password" required hint="Minimum 6 characters." value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} />
                <Button type="submit" variant="outline" loading={pwSaving}>Update Password</Button>
              </form>
            </CardBody>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
