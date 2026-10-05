import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Clock, Star, MapPin, CheckCircle2 } from 'lucide-react';
import { serviceApi } from '../../api/services';
import { getServiceIcon } from '../../utils/serviceIcons';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

export default function Home() {
  const [services, setServices] = useState([]);
  useEffect(() => { serviceApi.list().then((res) => setServices(res.data.services)).catch(() => {}); }, []);

  return (
    <div>
      <section className="relative overflow-hidden bg-ink">
        <div className="absolute inset-0 opacity-[0.06] bg-[repeating-linear-gradient(90deg,white_0_2px,transparent_2px_48px)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 text-beacon-500 text-xs font-semibold uppercase tracking-wide bg-beacon-500/10 px-3 py-1.5 rounded-full">
              <Clock className="h-3.5 w-3.5" /> Help dispatched in minutes
            </span>
            <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-white mt-5 leading-[1.08]">
              Stuck on the road?<br /><span className="text-beacon-500">Help is one tap away.</span>
            </h1>
            <p className="text-slate-300 text-base sm:text-lg mt-5 max-w-lg">
              RoadRescue connects you with verified local mechanics for flat tyres, dead batteries, towing, and more — request assistance, track the status, and get back on the road.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Link to="/register"><Button variant="beacon" size="lg">Get Roadside Help <ArrowRight className="h-4 w-4" /></Button></Link>
              <Link to="/register"><Button variant="outline" size="lg" className="!bg-transparent !text-white !border-white/30 hover:!bg-white/10">Become a Mechanic</Button></Link>
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-3 mt-10 text-slate-300 text-sm">
              <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-beacon-500" /> Verified mechanics</div>
              <div className="flex items-center gap-2"><Star className="h-4 w-4 text-beacon-500" /> Rated by real customers</div>
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-beacon-500" /> 7 service types covered</div>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-sm">
            <div className="bg-white rounded-2xl shadow-xl p-5 rotate-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Request #RR-2231</p>
                <Badge status="in_progress" />
              </div>
              <div className="lane-divider my-3" />
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Service</span><span className="font-medium text-ink">Battery Jump Start</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Vehicle</span><span className="font-medium text-ink">Maruti Swift · MH02EF9012</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Mechanic</span><span className="font-medium text-ink">Ravi Teja</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Location</span><span className="font-medium text-ink text-right">Andheri East, Mumbai</span></div>
              </div>
              <div className="mt-4 pt-4 border-t border-dashed border-slate-200 flex items-center gap-2 text-success-700 text-sm font-medium">
                <CheckCircle2 className="h-4 w-4" /> Mechanic is on the way
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-2xl bg-beacon-500 -z-10 sm:block hidden" />
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-ink text-center">How RoadRescue works</h2>
        <p className="text-slate-500 text-center mt-2 max-w-lg mx-auto">Three steps between a breakdown and being back on the road.</p>
        <div className="grid sm:grid-cols-3 gap-6 mt-10">
          {[
            { step: '01', title: 'Tell us what happened', desc: 'Pick your vehicle, the service you need, and share where you are.' },
            { step: '02', title: 'Choose a nearby mechanic', desc: 'See available mechanics near you with distance, estimated arrival and ratings.' },
            { step: '03', title: 'Track your request', desc: 'Watch your request move from accepted to in progress to completed.' },
          ].map((s) => (
            <div key={s.step} className="p-6 rounded-xl border border-slate-200 bg-white">
              <span className="font-display text-3xl font-extrabold text-beacon-500">{s.step}</span>
              <h3 className="font-display font-bold text-ink mt-3">{s.title}</h3>
              <p className="text-sm text-slate-500 mt-1.5">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-ink">Services we cover</h2>
              <p className="text-slate-500 mt-2">Every service is handled by a mechanic verified for that skill.</p>
            </div>
            <Link to="/services"><Button variant="outline">View all services</Button></Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            {(services.length ? services : Array.from({ length: 7 })).slice(0, 7).map((s, i) => {
              const Icon = getServiceIcon(s?.name);
              return (
                <div key={s?.id || i} className="bg-white rounded-xl border border-slate-200 p-5">
                  <div className="h-10 w-10 rounded-lg bg-beacon-50 flex items-center justify-center"><Icon className="h-5 w-5 text-beacon-600" /></div>
                  <h3 className="font-semibold text-ink mt-3">{s?.name || 'Loading...'}</h3>
                  {s?.description && <p className="text-sm text-slate-500 mt-1">{s.description}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center">
        <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-ink">Ready when you're stranded.</h2>
        <p className="text-slate-500 mt-2 max-w-lg mx-auto">Create a free account and request assistance in under a minute.</p>
        <div className="flex justify-center gap-3 mt-6"><Link to="/register"><Button variant="beacon" size="lg">Create your account</Button></Link></div>
      </section>
    </div>
  );
}
