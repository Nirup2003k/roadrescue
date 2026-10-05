import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getServiceIcon } from '../../utils/serviceIcons';
import { formatCurrency } from '../../utils/format';
import { serviceApi } from '../../api/services';
import Loader from '../../components/ui/Loader';
import Button from '../../components/ui/Button';

export default function Services() {
  const [services, setServices] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { serviceApi.list().then((res) => setServices(res.data.services)).catch((err) => setError(err.message)); }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
      <div className="text-center max-w-xl mx-auto">
        <span className="text-beacon-600 text-xs font-semibold uppercase tracking-wide">Services</span>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-ink mt-3">Roadside assistance for every kind of breakdown</h1>
        <p className="text-slate-500 mt-4">Pick a service when you request help, and we'll match you with a nearby mechanic who offers it.</p>
      </div>
      {!services && !error && <Loader label="Loading services..." />}
      {error && <p className="text-center text-danger-500 mt-8">{error}</p>}
      {services && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
          {services.map((s) => {
            const Icon = getServiceIcon(s.name);
            return (
              <div key={s.id} className="rounded-xl border border-slate-200 bg-white p-6">
                <div className="h-11 w-11 rounded-lg bg-beacon-50 flex items-center justify-center"><Icon className="h-5 w-5 text-beacon-600" /></div>
                <h3 className="font-display font-bold text-ink mt-4">{s.name}</h3>
                <p className="text-sm text-slate-500 mt-1.5">{s.description}</p>
                <p className="text-sm font-semibold text-ink mt-4">Starting at {formatCurrency(s.base_price)}</p>
              </div>
            );
          })}
        </div>
      )}
      <div className="text-center mt-12"><Link to="/register"><Button variant="beacon" size="lg">Request Assistance</Button></Link></div>
    </div>
  );
}
