import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LifeBuoy, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ROLE_LABEL = { customer: 'Customer', mechanic: 'Mechanic', admin: 'Admin' };

export default function DashboardLayout({ navItems, children, title }) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  function handleLogout() { logout(); navigate('/'); }

  const SidebarContent = (
    <>
      <div className="flex items-center gap-2 px-5 h-16 shrink-0">
        <span className="h-8 w-8 rounded-lg bg-beacon-500 flex items-center justify-center"><LifeBuoy className="h-5 w-5 text-ink" strokeWidth={2.5} /></span>
        <span className="font-display font-extrabold text-lg text-white">RoadRescue</span>
      </div>
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setMobileOpen(false)}
            className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}>
            <item.icon className="h-[18px] w-[18px]" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-white/10">
        <div className="px-3 py-2 mb-1">
          <p className="text-sm font-medium text-white truncate">{user?.name}</p>
          <p className="text-xs text-slate-400">{ROLE_LABEL[user?.role]}</p>
        </div>
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white">
          <LogOut className="h-4 w-4" /> Log out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-cloud">
      <aside className="hidden lg:flex flex-col w-64 bg-ink shrink-0">{SidebarContent}</aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/60" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex flex-col w-64 h-full bg-ink">{SidebarContent}</aside>
        </div>
      )}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 shrink-0">
          <button className="lg:hidden text-ink" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu className="h-6 w-6" /></button>
          <h1 className="font-display font-bold text-lg text-ink">{title}</h1>
          <div className="w-6 lg:hidden" />
        </header>
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
