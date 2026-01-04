import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Users, FileCheck2, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ElgraceTalentsPage: React.FC = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const featureBlocks = [
    {
      title: 'Verified Models, Actors & Celebrity Roster',
      points: [
        'Curated, continuously updated roster across fashion, commercial, film and digital-first talent',
        'Multi-step onboarding with ID checks, portfolio review and reference verification',
        'Shortlists tailored to brand, category, geography and budget – not a generic database dump',
      ],
      icon: <Users className="w-5 h-5" />,
    },
    {
      title: 'Digital Casting & Shortlisting Platform',
      points: [
        'Centralised briefs, options, look tests and notes – all tracked in one place',
        'Share secure shortlists with internal teams and clients for quick feedback and approvals',
        'Real-time status on who is available, pencilled, blocked or confirmed for your dates',
      ],
      icon: <FileCheck2 className="w-5 h-5" />,
    },
    {
      title: 'Usage Rights, Contracts & Compliance Management',
      points: [
        'Standardised contracts that protect both brand and talent across digital, print and OOH',
        'Clear usage windows, geographies and media spelled out to avoid ambiguity later',
        'Compliance on child talent, international shoots and sensitive categories handled by our team',
      ],
      icon: <ShieldCheck className="w-5 h-5" />,
    },
    {
      title: 'End-to-End Supervision from Brief to Shoot',
      points: [
        'Dedicated producer-level point of contact from first brief to final wrap',
        'On-ground coordination for call times, logistics, contracts and payments to talent',
        'Issue management on-set so brand and agency can stay focussed on the creative',
      ],
      icon: <Users className="w-5 h-5" />,
    },
  ];

  return (
    <section className="min-h-screen bg-black pt-16 pb-12 px-6">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-10 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-500 mb-2">Elgrace Talents</p>
            <h1 className="text-3xl md:text-5xl font-['Syne'] font-bold text-white mb-3">
              Talent Sourcing & Management
            </h1>
            <p className="text-zinc-400 max-w-2xl text-sm md:text-base leading-relaxed">
              Elgrace Talents is the core talent division of the group – connecting brands, agencies and
              production houses with models, actors, celebrities and creators who are vetted, briefed and
              professionally managed. We take ownership from first casting note to the final deliverable.
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
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-gradient-to-br from-blue-500/20 via-purple-500/10 to-transparent rounded-full blur-[110px]" />
            <div className="relative z-10 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/40 bg-black/40 text-[11px] uppercase tracking-[0.2em] text-blue-100">
                <Users className="w-3 h-3" /> Elgrace Talents Snapshot
              </div>
              <p className="text-zinc-300 text-sm leading-relaxed">
                Every project is assigned a dedicated Elgrace producer who understands casting, contracts and
                production realities. We work alongside your creative, production and legal teams so that
                talent-related details are locked early and executed cleanly.
              </p>
              <div className="grid grid-cols-2 gap-3 text-xs text-zinc-300">
                <div className="space-y-1">
                  <p className="font-semibold text-white">Use Cases</p>
                  <p>Brand campaigns & lookbooks</p>
                  <p>Films, OTT & digital content</p>
                  <p>Celebrity endorsements & IPs</p>
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-white">What We Handle</p>
                  <p>Talent discovery & negotiation</p>
                  <p>Contracts, PPMs & call sheets</p>
                  <p>On-set supervision & closure</p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex flex-col gap-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
                  Planning a Campaign or Shoot?
                </p>
                <p className="text-sm text-zinc-300">
                  Share a rough brief, timelines and markets through the contact section below. Our team will
                  respond with a curated Elgrace Talents proposal, suggested faces and a clear next-steps plan.
                </p>
                <Link
                  to="/services"
                  className="inline-flex items-center justify-center px-5 py-2 rounded-full text-xs font-bold uppercase tracking-[0.2em] bg-gradient-to-r from-blue-500 via-purple-500 to-fuchsia-500 text-black hover:from-blue-400 hover:to-fuchsia-400"
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
