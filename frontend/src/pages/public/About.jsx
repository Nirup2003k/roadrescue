import React from 'react';
import { ShieldCheck, Users, Wrench, Star } from 'lucide-react';

const values = [
  { icon: ShieldCheck, title: 'Verified mechanics', desc: 'Every mechanic is reviewed and approved by our admin team before they can accept jobs.' },
  { icon: Users, title: 'Built for real breakdowns', desc: 'From a flat tyre to a full tow, the workflow matches what actually happens on the road.' },
  { icon: Wrench, title: 'Clear job status', desc: 'Every request moves transparently from pending to accepted, in progress, and completed.' },
  { icon: Star, title: 'Accountability both ways', desc: 'Customers rate completed jobs, so quality mechanics stand out.' },
];

export default function About() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
      <span className="text-beacon-600 text-xs font-semibold uppercase tracking-wide">About RoadRescue</span>
      <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-ink mt-3">A simpler way to handle roadside breakdowns.</h1>
      <p className="text-slate-600 mt-5 leading-relaxed">
        RoadRescue is a roadside assistance and mechanic booking platform built to connect stranded drivers with nearby, verified mechanics. Customers describe the problem, share their location, and see available mechanics sorted by distance with an estimated arrival time. Mechanics get a simple queue of incoming requests they can accept, work through, and complete — with an earnings summary to match.
      </p>
      <p className="text-slate-600 mt-4 leading-relaxed">
        This project intentionally keeps scope tight: no live GPS tracking, no in-app chat, no complex payment processing — just the core loop of requesting help, matching with a nearby mechanic, and tracking the job to completion, done cleanly and reliably.
      </p>
      <div className="grid sm:grid-cols-2 gap-5 mt-10">
        {values.map((v) => (
          <div key={v.title} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="h-10 w-10 rounded-lg bg-route-50 flex items-center justify-center"><v.icon className="h-5 w-5 text-route-600" /></div>
            <h3 className="font-display font-bold text-ink mt-3">{v.title}</h3>
            <p className="text-sm text-slate-500 mt-1.5">{v.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
