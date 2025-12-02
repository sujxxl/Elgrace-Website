import React from 'react';
import { motion } from 'framer-motion';

export const Mission: React.FC = () => {
  const images = [
    "https://picsum.photos/400/500?grayscale&random=10",
    "https://picsum.photos/400/500?grayscale&random=11",
    "https://picsum.photos/400/500?grayscale&random=12",
    "https://picsum.photos/400/500?grayscale&random=13",
    "https://picsum.photos/400/500?grayscale&random=14",
    "https://picsum.photos/400/500?grayscale&random=15",
  ];

  return (
    <section id="mission" className="py-24 md:py-32 bg-zinc-950 relative overflow-hidden">
      {/* Decorative blurry blob */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-900/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
             <h2 className="text-zinc-500 uppercase tracking-widest text-sm mb-4">Our Mission</h2>
             <h3 className="text-3xl md:text-5xl font-['Syne'] font-bold leading-tight mb-8">
               We strive to exceed expectations and deliver exceptional representation.
             </h3>
             <div className="w-20 h-1 bg-white mb-8" />
             <p className="text-zinc-400 text-lg leading-relaxed mb-8">
               At ELGRACE TALENTS, our mission is to connect exceptional talent with world-class brands. We are a premier modeling firm dedicated to scouting, developing, and managing careers with a focus on longevity and professional excellence.
             </p>
             <div className="flex gap-8">
                <div>
                   <span className="block text-3xl font-bold font-['Syne']">1200+</span>
                   <span className="text-sm text-zinc-500 uppercase tracking-wider">Models</span>
                </div>
                <div>
                   <span className="block text-3xl font-bold font-['Syne']">1000+</span>
                   <span className="text-sm text-zinc-500 uppercase tracking-wider">Brands</span>
                </div>
             </div>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
             {images.map((src, i) => (
                <motion.div
                   key={i}
                   initial={{ opacity: 0, scale: 0.8 }}
                   whileInView={{ opacity: 1, scale: 1 }}
                   viewport={{ once: true }}
                   transition={{ duration: 0.5, delay: i * 0.1 }}
                   className={`rounded-sm overflow-hidden aspect-[3/4] ${i % 2 === 0 ? 'mt-0' : 'mt-4'}`}
                >
                   <img 
                     src={src} 
                     alt={`Mission gallery ${i + 1}`} 
                     className="w-full h-full object-cover hover:scale-110 transition-transform duration-700"
                   />
                </motion.div>
             ))}
          </div>

        </div>
      </div>
    </section>
  );
};