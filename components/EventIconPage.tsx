import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Users, MapPin, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

export const EventIconPage: React.FC = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const featureBlocks = [
    {
      title: 'On-ground Brand Teams',
      points: [
        'Promoters, hosts, emcees and crowd managers for launches and roadshows',
        'Retail and mall activation teams trained on product talking points',
        'Uniformed brand reps aligned to your tone of voice and guidelines',
      ],
      icon: <Users className="w-5 h-5" />,
    },
    {
      title: 'Experiential & Live Events',
      points: [
        'Conference, concert and festival manpower across FOH and backstage',
        'Registration, welcome desk, green-room and hospitality staffing',
        'Specialised support for meet & greets, red carpets and media lines',
      ],
      icon: <Calendar className="w-5 h-5" />,
    },
    {
      title: 'Pan-India Operations',
      points: [
        'Database-backed deployment across metros and emerging cities',
        'Central coordination with single-point accountability from Elgrace',
        'Local language, culture and venue familiarity built into every team',
      ],
      icon: <MapPin className="w-5 h-5" />,
    },
  ];

  return (
    <section className="min-h-screen bg-black pt-28 pb-20 px-6">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-10 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-500 mb-2">Eventicon by Elgrace</p>
            <h1 className="text-3xl md:text-5xl font-['Syne'] font-bold text-white mb-3">
              Event Manpower & Experiential Teams
            </h1>
            <p className="text-zinc-400 max-w-2xl text-sm md:text-base leading-relaxed">
              Eventicon is the on-ground extension of Elgrace Talents – supplying trained, reliable manpower
              for brand activations, exhibitions, conferences and live experiences. We curate teams who
              understand both hospitality and brand language, so your event feels premium at every touchpoint.
            </p>
          </div>
          <div className="hidden md:flex flex-col items-end gap-3">
            <Link
              to="/services"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-700 text-xs uppercase tracking-[0.2em] text-zinc-300 hover:bg-zinc-900"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Services
            </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1.6fr,1.2fr] gap-8 items-start">
          <div className="space-y-6">
            {featureBlocks.map((block, idx) => (
              <motion.div
                key={block.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-200">
                    {block.icon}
                  </div>
                  <h2 className="text-sm md:text-base font-semibold text-white uppercase tracking-[0.18em]">
                    {block.title}
                  </h2>
                </div>
                <ul className="space-y-2">
                  {block.points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-zinc-300 text-sm leading-relaxed">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 text-white/50 shrink-0" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
            className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden"
          >
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-gradient-to-br from-amber-500/20 via-red-500/10 to-transparent rounded-full blur-[110px]" />
            <div className="relative z-10 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/40 bg-black/40 text-[11px] uppercase tracking-[0.2em] text-amber-200">
                <Users className="w-3 h-3" /> Eventicon Service Snapshot
              </div>
              <p className="text-zinc-300 text-sm leading-relaxed">
                We work as an extension of your agency or brand team – handling sourcing, screening, training
                and on-ground supervision of every crew member. From single-city pop-ups to multi-city tours,
                our processes are built to be fast, compliant and scalable.
              </p>
              <div className="grid grid-cols-2 gap-3 text-xs text-zinc-300">
                <div className="space-y-1">
                  <p className="font-semibold text-white">Use Cases</p>
                  <p>Mall activations & roadshows</p>
                  <p>Conferences & corporate events</p>
                  <p>Celebrity appearances & promotions</p>
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-white">Coverage</p>
                  <p>Pan-India manpower deployment</p>
                  <p>Centralised coordination desk</p>
                  <p>On-ground quality checks</p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex flex-col gap-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
                  Ready to Staff Your Next Event?
                </p>
                <p className="text-sm text-zinc-300">
                  Use the contact form below to share your dates, cities and rough volume. Our team will revert
                  with a curated Eventicon manpower plan and timeline.
                </p>
                <Link
                  to="/services"
                  className="inline-flex items-center justify-center px-5 py-2 rounded-full text-xs font-bold uppercase tracking-[0.2em] bg-gradient-to-r from-amber-500 via-red-500 to-rose-500 text-black hover:from-amber-400 hover:to-rose-400"
                >
                  Back to All Services
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
