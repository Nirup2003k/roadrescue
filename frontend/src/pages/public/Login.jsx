import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LifeBuoy } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import ErrorBanner from '../../components/ui/ErrorBanner';

const DASHBOARD_BY_ROLE = { customer: '/customer', mechanic: '/mechanic', admin: '/admin' };

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      const redirectTo = location.state?.from?.pathname || DASHBOARD_BY_ROLE[user.role] || '/';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(email, password) { setForm({ email, password }); }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-slate-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <span className="inline-flex h-10 w-10 rounded-lg bg-beacon-500 items-center justify-center mx-auto"><LifeBuoy className="h-5 w-5 text-ink" strokeWidth={2.5} /></span>
          <h1 className="font-display font-extrabold text-2xl text-ink mt-3">Welcome back</h1>
          <p className="text-sm text-slate-500 mt-1">Log in to manage your requests.</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <ErrorBanner message={error} />
            <Input label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
            <Input label="Password" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
            <Button type="submit" className="w-full" loading={loading}>Log in</Button>
          </form>
          <p className="text-sm text-slate-500 text-center mt-4">
            Don't have an account? <Link to="/register" className="text-route-600 font-medium hover:underline">Sign up</Link>
          </p>
        </div>
        <div className="bg-slate-100 rounded-xl p-4 mt-4 text-xs text-slate-600">
          <p className="font-semibold text-slate-700 mb-2">Demo credentials</p>
          <div className="space-y-1.5">
            <button type="button" onClick={() => fillDemo('rahul.sharma@example.com', 'password123')} className="block hover:underline">Customer — rahul.sharma@example.com / password123</button>
            <button type="button" onClick={() => fillDemo('suresh.kumar@example.com', 'password123')} className="block hover:underline">Mechanic — suresh.kumar@example.com / password123</button>
            <button type="button" onClick={() => fillDemo('admin@roadrescue.com', 'Admin@123')} className="block hover:underline">Admin — admin@roadrescue.com / Admin@123</button>
          </div>
        </div>
      </div>
    </div>
  );
}
