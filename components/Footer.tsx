import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-black py-12 border-t border-zinc-900">
      <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-center md:text-left">
          <h2 className="text-2xl font-bold font-['Syne'] tracking-wider mb-2">ELGRACE TALENTS</h2>
          <p className="text-zinc-500 text-sm">© {new Date().getFullYear()} All rights reserved.</p>
        </div>
        
        <div className="flex gap-6">
            <a href="#" className="text-zinc-500 hover:text-white transition-colors text-sm">Privacy Policy</a>
            <a href="#" className="text-zinc-500 hover:text-white transition-colors text-sm">Terms of Service</a>
            <a href="#" className="text-zinc-500 hover:text-white transition-colors text-sm">Instagram</a>
        </div>
      </div>
    </footer>
  );
};