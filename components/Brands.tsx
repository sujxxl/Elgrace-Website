import React from 'react';
import { motion } from 'framer-motion';

const brands = [
  // Tier 1 - Global / Major Brands
  { name: 'Amazon', tier: 1 },
  { name: 'Hyundai', tier: 1 },
  { name: 'IndiGo', tier: 1 },
  { name: "Marco's Pizza", tier: 1 },
  { name: 'Biotique', tier: 1 },
  { name: 'Boldfit', tier: 1 },
  
  // Tier 2 - Lifestyle / Emerging
  { name: 'Astrotalk', tier: 2 },
  { name: 'NXT', tier: 2 },
  { name: 'The Tivoli', tier: 2 },
  { name: 'Deja Brew', tier: 2 },
  { name: 'Etherael Petal', tier: 2 },
  { name: 'HB Makeovers', tier: 2 },
  { name: 'Dolly Nagpal', tier: 2 },
  { name: 'Shashank Arya', tier: 2 },
];

export const Brands: React.FC = () => {
  return (
    <section className="py-20 bg-zinc-950 border-t border-white/5 relative z-10">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <motion.h3 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-zinc-500 uppercase tracking-[0.2em] text-sm font-bold"
          >
            Trusted By
          </motion.h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-12 md:gap-16 items-center justify-items-center">
          {brands.map((brand, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05, duration: 0.5 }}
              className="w-full flex justify-center group"
            >
              {/* 
                Placeholder Logo 
                Replace `src` with actual logo assets. 
                Using `placehold.co` with custom text to simulate logos.
              */}
              <img 
                src={`https://placehold.co/400x150/09090b/ffffff?text=${encodeURIComponent(brand.name)}&font=montserrat`} 
                alt={`${brand.name} logo`}
                className="w-auto h-6 md:h-12 object-contain opacity-40 group-hover:opacity-100 transition-all duration-500 grayscale group-hover:grayscale-0 filter"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};