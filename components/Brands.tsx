import React from 'react';
import { motion } from 'framer-motion';
import { homeSectionClasses } from '../theme/homeSections.ts';

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
  { name: '+1000 more', tier: 2 }
];

export const Brands: React.FC = () => {
  return (
    <section
      className={`py-12 border-t relative z-10 ${homeSectionClasses.brands.section} ${homeSectionClasses.brands.topBorder}`}
    >
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <motion.h3 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className={`uppercase tracking-[0.2em] text-sm font-bold ${homeSectionClasses.brands.kicker}`}
          >
            Trusted By
          </motion.h3>
          <div className={`w-12 h-px mx-auto mt-4 ${homeSectionClasses.brands.divider}`} />
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
              <div
                className={`px-4 py-3 rounded-xl border transition-colors duration-500 backdrop-blur-sm ${homeSectionClasses.brands.tile} ${homeSectionClasses.brands.tileHover}`}
              >
                {/* Placeholder logo image removed for now; render brand name text instead */}
                {/**
                <img 
                  src={`https://placehold.co/400x150/09090b/ffffff?text=${encodeURIComponent(brand.name)}&font=montserrat`} 
                  alt={`${brand.name} logo`}
                  className="w-auto h-6 md:h-12 object-contain opacity-100 transition-all duration-500 grayscale group-hover:grayscale-0"
                />
                */}
                <div className="min-w-[80px] flex items-center justify-center">
                  <span className={`text-xs md:text-sm font-medium tracking-wide ${homeSectionClasses.brands.brandText}`}>
                    {brand.name}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};