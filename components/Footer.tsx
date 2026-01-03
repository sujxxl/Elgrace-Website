import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="relative bg-black py-12 border-t border-zinc-900 overflow-hidden"
    >
      {/* Subtle animated highlight along the top of the footer */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#dfcda5]/70 to-transparent opacity-60 animate-pulse" />

      <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-center md:text-left">
          <h2 className="text-2xl font-bold font-['Syne'] tracking-wider mb-2">ELGRACE TALENTS</h2>
          <p className="text-zinc-500 text-sm">© {new Date().getFullYear()} All rights reserved.</p>
        </div>
        
        <div className="flex gap-6">
          <a href="#" className="text-zinc-500 hover:text-white transition-colors text-sm border-b border-transparent hover:border-[#dfcda5] pb-0.5">Privacy Policy</a>
          <a href="#" className="text-zinc-500 hover:text-white transition-colors text-sm border-b border-transparent hover:border-[#dfcda5] pb-0.5">Terms of Service</a>
          <Link
            to="/auth"
            className="text-zinc-500 hover:text-white transition-colors text-sm border-b border-transparent hover:border-[#dfcda5] pb-0.5"
          >
            Employee Login
          </Link>
          <a
            href="https://www.instagram.com/elgracetalents/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-500 hover:text-white transition-colors text-sm border-b border-transparent hover:border-[#dfcda5] pb-0.5"
          >
            Instagram
          </a>
          <a
            href="https://www.linkedin.com/company/elgracetalents"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-500 hover:text-white transition-colors text-sm border-b border-transparent hover:border-[#dfcda5] pb-0.5"
          >
            LinkedIn
          </a>
        </div>
      </div>
    </motion.footer>
  );
};