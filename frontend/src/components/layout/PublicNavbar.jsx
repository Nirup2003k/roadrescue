import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { LifeBuoy, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';

const links = [{ to: '/', label: 'Home' }, { to: '/services', label: 'Services' }, { to: '/about', label: 'About' }];

export default function PublicNavbar() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const dashboardPath = user ? { customer: '/customer', mechanic: '/mechanic', admin: '/admin' }[user.role] : null;

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display font-extrabold text-lg text-ink">
          <span className="h-8 w-8 rounded-lg bg-beacon-500 flex items-center justify-center"><LifeBuoy className="h-5 w-5 text-ink" strokeWidth={2.5} /></span>
          RoadRescue
        </Link>
        <div className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'} className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'text-ink bg-slate-100' : 'text-slate-600 hover:text-ink hover:bg-slate-50'}`}>{l.label}</NavLink>
          ))}
        </div>
        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <Button onClick={() => navigate(dashboardPath)}>Go to Dashboard</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate('/login')}>Log in</Button>
              <Button variant="beacon" onClick={() => navigate('/register')}>Get Help Now</Button>
            </>
          )}
        </div>
        <button className="md:hidden text-ink" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">{open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}</button>
      </nav>
      {open && (
        <div className="md:hidden border-t border-slate-200 px-4 py-3 flex flex-col gap-1 bg-white">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'} onClick={() => setOpen(false)} className={({ isActive }) => `px-3 py-2.5 rounded-md text-sm font-medium ${isActive ? 'bg-slate-100 text-ink' : 'text-slate-600'}`}>{l.label}</NavLink>
          ))}
          <div className="h-px bg-slate-100 my-2" />
          {user ? (
            <Button onClick={() => { setOpen(false); navigate(dashboardPath); }}>Go to Dashboard</Button>
          ) : (
            <div className="flex flex-col gap-2">
              <Button variant="outline" onClick={() => { setOpen(false); navigate('/login'); }}>Log in</Button>
              <Button variant="beacon" onClick={() => { setOpen(false); navigate('/register'); }}>Get Help Now</Button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
