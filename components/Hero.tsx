import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowDown } from 'lucide-react';

export const Hero: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  
  // 3D Scroll Effects
  // Scale text up (zoom in)
  const scale = useTransform(scrollY, [0, 500], [1, 2.5]);
  // Move text up slightly
  const y = useTransform(scrollY, [0, 500], [0, -150]);
  // Fade out as it zooms too close
  const opacity = useTransform(scrollY, [0, 300, 500], [1, 1, 0]);
  
  // Background parallax
  const bgY = useTransform(scrollY, [0, 500], [0, 100]);

  const title = "ELGRACE TALENTS";
  const words = title.split(" ");

  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.04 * i },
    }),
  };

  const child = {
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
    hidden: {
      opacity: 0,
      y: 100,
    },
  };

  return (
    <section ref={containerRef} className="relative h-screen w-full flex items-center justify-center overflow-hidden perspective-1000">
      {/* Background Image with Overlay */}
      <motion.div 
        style={{ y: bgY }}
        className="absolute inset-0 z-0"
      >
        {/* Placeholder background image removed for now */}
        {/**
        <img 
          src="https://picsum.photos/1920/1080?grayscale&blur=2" 
          alt="Background" 
          className="w-full h-full object-cover opacity-30"
        />
        */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent" />
      </motion.div>

      <div className="container mx-auto px-6 relative z-10 text-center">
        <motion.div 
          style={{ scale, y, opacity }}
          className="flex flex-wrap justify-center origin-center"
        >
          <motion.div 
            className="flex flex-wrap justify-center overflow-hidden"
            variants={container}
            initial="hidden"
            animate="visible"
          >
            {words.map((word, index) => (
              <motion.span 
                key={index} 
                className="inline-block mr-4 md:mr-8 last:mr-0 text-[10vw] sm:text-7xl md:text-8xl lg:text-9xl whitespace-nowrap font-['Syne'] font-extrabold tracking-tighter text-white"
                style={{ textShadow: '0 10px 30px rgba(255,255,255,0.1)' }}
              >
                {word.split("").map((letter, idx) => (
                  <motion.span key={idx} variants={child} className="inline-block">
                    {letter}
                  </motion.span>
                ))}
              </motion.span>
            ))}
          </motion.div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="mt-8 text-lg md:text-xl text-zinc-400 font-light tracking-widest uppercase max-w-2xl mx-auto"
        >
          Premier Modeling & Talent Management
        </motion.p>

        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 1 }}
            className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
        >
            <ArrowDown className="animate-bounce text-zinc-500 w-8 h-8" />
        </motion.div>
      </div>
    </section>
  );
};