import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Simple static data for now; replace image URLs with real shoot photos
const featuredShoots = [
  {
    id: 'shoot-1',
    title: 'Shoot 1',
    location: 'Hyderabad',
    label: 'Editorial',
    imageUrl: '',
  },
  {
    id: 'shoot-2',
    title: 'Shoot 2',
    location: 'Mumbai',
    label: 'Campaign',
    imageUrl: '',
  },
  {
    id: 'shoot-3',
    title: 'Shoot 3',
    location: 'Delhi',
    label: 'Runway',
    imageUrl: '',
  },
];

const gridShoots = [
  { id: 'g1', title: 'Shoot 4', label: 'Look', imageUrl: '' },
  { id: 'g2', title: 'Shoot 5', label: 'Look', imageUrl: '' },
  { id: 'g3', title: 'Shoot 6', label: 'Look', imageUrl: '' },
  { id: 'g4', title: 'Shoot 7', label: 'Look', imageUrl: '' },
  { id: 'g5', title: 'Shoot 8', label: 'Look', imageUrl: '' },
  { id: 'g6', title: 'Shoot 9', label: 'Look', imageUrl: '' },
];

const collageShoots = [
  { id: 'c1', title: 'Shoot 10', imageUrl: '' },
  { id: 'c2', title: 'Shoot 11', imageUrl: '' },
  { id: 'c3', title: 'Shoot 12', imageUrl: '' },
  { id: 'c4', title: 'Shoot 13', imageUrl: '' },
  { id: 'c5', title: 'Shoot 14', imageUrl: '' },
];

export const GalleryPage: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = featuredShoots[activeIndex];

  const next = () => setActiveIndex((prev) => (prev + 1) % featuredShoots.length);
  const prev = () => setActiveIndex((prev) => (prev - 1 + featuredShoots.length) % featuredShoots.length);

  return (
    <section className="pt-16 pb-16 bg-zinc-950">
      <div className="container mx-auto px-6 space-y-16">
        {/* Header */}
        <motion.div
          className="max-w-3xl"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500 mb-3">Showcase</p>
          <h1 className="text-4xl md:text-5xl font-['Syne'] font-bold mb-3">Gallery</h1>
          <p className="text-zinc-400 text-sm md:text-base max-w-xl">
            A curated view of editorials, campaigns, runway moments and behind-the-scenes stories from Elgrace shoots.
          </p>
        </motion.div>

        {/* Section 1: Carousel */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm uppercase tracking-[0.3em] text-zinc-500">Featured Shoots</h2>
            <div className="flex gap-2">
              <motion.button
                whileTap={{ scale: 0.9, rotate: -6 }}
                onClick={prev}
                className="w-9 h-9 rounded-full border border-zinc-700 text-zinc-300 flex items-center justify-center text-xs hover:border-white hover:bg-white/5 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9, rotate: 6 }}
                onClick={next}
                className="w-9 h-9 rounded-full border border-zinc-700 text-zinc-300 flex items-center justify-center text-xs hover:border-white hover:bg-white/5 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/60">
            <div className="grid md:grid-cols-[2fr,1fr] gap-0">
              <div className="relative h-[260px] md:h-[420px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active.id}
                    initial={{ opacity: 0, x: 60, scale: 0.92, rotate: 2 }}
                    animate={{ opacity: 1, x: 0, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, x: -60, scale: 0.9, rotate: -2 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="absolute inset-0"
                  >
                    {active.imageUrl ? (
                      <img
                        src={active.imageUrl}
                        alt={active.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-zinc-800 via-zinc-900 to-black flex items-center justify-center">
                        <span className="text-xs uppercase tracking-[0.3em] text-zinc-500">Upload gallery images</span>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="p-6 md:p-10 flex flex-col justify-between border-t md:border-t-0 md:border-l border-zinc-800 bg-zinc-950/60">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-zinc-500 mb-2">{active.label}</p>
                  <h3 className="text-2xl md:text-3xl font-['Syne'] font-bold mb-3">{active.title}</h3>
                  <p className="text-sm text-zinc-400 mb-4">{active.location}</p>
                  <p className="text-xs text-zinc-500">
                    Swap these placeholders with real shoot images and credits to turn this into a live case-study rail.
                  </p>
                </div>
                <div className="flex gap-2 mt-4">
                  {featuredShoots.map((s, idx) => (
                    <button
                      key={s.id}
                      onClick={() => setActiveIndex(idx)}
                      className={`h-1.5 flex-1 rounded-full ${idx === activeIndex ? 'bg-white' : 'bg-zinc-700'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Grid with labels */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm uppercase tracking-[0.3em] text-zinc-500">Projects Grid</h2>
            <p className="text-xs text-zinc-500 max-w-xs text-right">
              Use labels to quickly surface the type of work – fashion, beauty, bridal, editorials.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-4 md:gap-6">
            {gridShoots.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 40, scale: 0.96 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.5, delay: index * 0.06, ease: 'easeOut' }}
                whileHover={{ y: -8, scale: 1.03, rotate: 0.5 }}
                className="group rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900/60 flex flex-col shadow-[0_22px_60px_rgba(0,0,0,0.6)]"
              >
                <div className="relative aspect-[4/5] overflow-hidden">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-zinc-800" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-70" />
                  <span className="absolute left-4 top-4 inline-flex px-3 py-1 rounded-full bg-white text-black text-[10px] font-semibold uppercase tracking-[0.2em]">
                    {item.label}
                  </span>
                </div>
                <div className="p-4 flex-1 flex items-center">
                  <h3 className="text-sm font-['Syne'] font-semibold tracking-wide">{item.title}</h3>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Section 3: Collage grid */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm uppercase tracking-[0.3em] text-zinc-500">Collage</h2>
            <p className="text-xs text-zinc-500 max-w-xs text-right">
              A looser collage-style grid ideal for moodboards, test shoots or BTS snippets.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 auto-rows-[120px] md:auto-rows-[160px]">
            {collageShoots.map((item, idx) => {
              const spanClasses =
                idx === 0
                  ? 'row-span-2 col-span-2'
                  : idx === 3
                  ? 'row-span-2'
                  : '';
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 30, scale: 0.98 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.45, delay: idx * 0.05, ease: 'easeOut' }}
                  whileHover={{ scale: 1.04, rotate: idx % 2 === 0 ? 1 : -1 }}
                  className={`relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70 ${spanClasses}`}
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-zinc-800" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <span className="absolute left-3 bottom-3 text-[10px] uppercase tracking-[0.25em] text-zinc-200">
                    {item.title}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </section>
      </div>
    </section>
  );
};
