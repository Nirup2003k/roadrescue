import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LifeBuoy, User, Wrench } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import ErrorBanner from '../../components/ui/ErrorBanner';

const DASHBOARD_BY_ROLE = { customer: '/customer', mechanic: '/mechanic', admin: '/admin' };
const initialForm = { name: '', email: '', password: '', phone: '', role: 'customer', address: '', city: '', serviceArea: '', experienceYears: '', bio: '' };

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState([]);
  const [loading, setLoading] = useState(false);

  function update(key, value) { setForm((f) => ({ ...f, [key]: value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setFieldErrors([]); setLoading(true);
    try {
      const payload = { ...form };
      if (payload.experienceYears) payload.experienceYears = Number(payload.experienceYears);
      const user = await register(payload);
      toast.success('Account created. Welcome to RoadRescue!');
      navigate(DASHBOARD_BY_ROLE[user.role] || '/', { replace: true });
    } catch (err) {
      setError(err.message);
      setFieldErrors(err.errors || []);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-slate-50">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <span className="inline-flex h-10 w-10 rounded-lg bg-beacon-500 items-center justify-center mx-auto"><LifeBuoy className="h-5 w-5 text-ink" strokeWidth={2.5} /></span>
          <h1 className="font-display font-extrabold text-2xl text-ink mt-3">Create your account</h1>
          <p className="text-sm text-slate-500 mt-1">Join as a customer or a mechanic.</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-6">
          <div className="grid grid-cols-2 gap-2 mb-5">
            {[
              { value: 'customer', label: 'Customer', icon: User, desc: 'I need roadside help' },
              { value: 'mechanic', label: 'Mechanic', icon: Wrench, desc: 'I provide roadside help' },
            ].map((opt) => (
              <button key={opt.value} type="button" onClick={() => update('role', opt.value)}
                className={`text-left rounded-lg border-2 p-3 transition-colors ${form.role === opt.value ? 'border-beacon-500 bg-beacon-50' : 'border-slate-200 hover:border-slate-300'}`}>
                <opt.icon className={`h-5 w-5 ${form.role === opt.value ? 'text-beacon-600' : 'text-slate-400'}`} />
                <p className="font-semibold text-sm text-ink mt-1.5">{opt.label}</p>
                <p className="text-xs text-slate-500">{opt.desc}</p>
              </button>
            ))}
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <ErrorBanner message={error} />
            {fieldErrors.length > 0 && <ul className="text-xs text-danger-600 list-disc pl-4 -mt-2">{fieldErrors.map((e, i) => <li key={i}>{e}</li>)}</ul>}
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Full name" required value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Jane Doe" />
              <Input label="Phone" required value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="9876543210" />
            </div>
            <Input label="Email" type="email" required value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="you@example.com" />
            <Input label="Password" type="password" required value={form.password} onChange={(e) => update('password', e.target.value)} placeholder="At least 6 characters" hint="Minimum 6 characters." />
            {form.role === 'customer' ? (
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Address" value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="Optional" />
                <Input label="City" value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="Optional" />
              </div>
            ) : (
              <>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input label="Service area / city" value={form.serviceArea} onChange={(e) => update('serviceArea', e.target.value)} placeholder="e.g. Bengaluru" />
                  <Input label="Years of experience" type="number" min="0" value={form.experienceYears} onChange={(e) => update('experienceYears', e.target.value)} placeholder="Optional" />
                </div>
                <Input label="Short bio" value={form.bio} onChange={(e) => update('bio', e.target.value)} placeholder="Optional — tell customers about your experience" />
                <p className="text-xs text-slate-500 -mt-1">Your mechanic account will need admin approval before you appear to customers.</p>
              </>
            )}
            <Button type="submit" className="w-full" loading={loading}>Create account</Button>
          </form>
          <p className="text-sm text-slate-500 text-center mt-4">Already have an account? <Link to="/login" className="text-route-600 font-medium hover:underline">Log in</Link></p>
        </div>
      </div>
    </div>
  );
}
