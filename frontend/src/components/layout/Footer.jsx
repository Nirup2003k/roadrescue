import React from 'react';
import { Link } from 'react-router-dom';
import { LifeBuoy } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-ink text-slate-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 sm:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-2 font-display font-extrabold text-lg text-white">
            <span className="h-8 w-8 rounded-lg bg-beacon-500 flex items-center justify-center"><LifeBuoy className="h-5 w-5 text-ink" strokeWidth={2.5} /></span>
            RoadRescue
          </div>
          <p className="text-sm text-slate-400 mt-3 max-w-xs">Roadside vehicle assistance and verified mechanic booking, whenever you get stuck.</p>
        </div>
        <div>
          <h4 className="text-white text-sm font-semibold mb-3">Platform</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/services" className="hover:text-white">Services</Link></li>
            <li><Link to="/about" className="hover:text-white">About</Link></li>
            <li><Link to="/register" className="hover:text-white">Become a Mechanic</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white text-sm font-semibold mb-3">Account</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/login" className="hover:text-white">Log in</Link></li>
            <li><Link to="/register" className="hover:text-white">Sign up</Link></li>
          </ul>
        </div>
      </div>
      <div className="lane-divider" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 text-xs text-slate-500">
        © {new Date().getFullYear()} RoadRescue. A student full-stack project — not a real dispatch service.
      </div>
    </footer>
  );
}
