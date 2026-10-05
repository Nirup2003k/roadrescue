import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { customerNav } from '../../components/layout/navConfig';
import { userApi } from '../../api/users';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Loader from '../../components/ui/Loader';
import ErrorBanner from '../../components/ui/ErrorBanner';

export default function CustomerProfile() {
  const { refreshUser } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState('');

  useEffect(() => {
    userApi.getProfile().then((res) => {
      setProfile(res.data.profile);
      setForm({ name: res.data.profile.name, phone: res.data.profile.phone, address: res.data.profile.address || '', city: res.data.profile.city || '' });
    });
  }, []);

  async function handleSave(e) {
    e.preventDefault(); setError(''); setSaving(true);
    try { await userApi.updateProfile(form); await refreshUser(); toast.success('Profile updated.'); }
    catch (err) { setError(err.message); } finally { setSaving(false); }
  }

  async function handlePasswordChange(e) {
    e.preventDefault(); setPwError(''); setPwSaving(true);
    try { await userApi.changePassword(pwForm); toast.success('Password updated.'); setPwForm({ currentPassword: '', newPassword: '' }); }
    catch (err) { setPwError(err.message); } finally { setPwSaving(false); }
  }

  return (
    <DashboardLayout navItems={customerNav} title="Profile">
      {!form ? <Loader label="Loading profile..." /> : (
        <div className="max-w-xl space-y-5">
          <Card>
            <CardHeader title="Personal details" subtitle={profile.email} />
            <CardBody>
              <form onSubmit={handleSave} className="space-y-4">
                <ErrorBanner message={error} />
                <Input label="Full name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <Input label="Phone" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                <Input label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                <Button type="submit" loading={saving}>Save Changes</Button>
              </form>
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
