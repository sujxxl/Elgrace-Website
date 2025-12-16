import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, UserCircle, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onNavigate: (view: 'home' | 'services' | 'talents' | 'castings' | 'auth' | 'profile') => void;
  currentView: 'home' | 'services' | 'talents' | 'castings' | 'auth' | 'profile';
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentView }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLinkClick = (e: React.MouseEvent<HTMLElement>, target: string, view: 'home' | 'services' | 'talents' | 'castings' | 'auth' | 'profile') => {
    e.preventDefault();
    setMobileMenuOpen(false);
    onNavigate(view);
    
    setTimeout(() => {
      if (view === 'home' && target !== '#') {
        const element = document.querySelector(target);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 100);
  };

  const navLinks = [
    { name: 'Mission', href: '#mission', view: 'home' as const },
    { name: 'Services', href: '#', view: 'services' as const },
    { name: 'Talents', href: '#', view: 'talents' as const },
    { name: 'Castings', href: '#', view: 'castings' as const },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled || mobileMenuOpen ? 'bg-zinc-950/90 backdrop-blur-md border-b border-white/10 py-4' : 'bg-transparent py-6'
      }`}
    >
      <div className="container mx-auto px-6 flex justify-between items-center">
        <a 
            href="#" 
            onClick={(e) => handleLinkClick(e, '#', 'home')}
            className="text-2xl font-bold font-['Syne'] tracking-wider z-50 relative"
        >
          ELGRACE TALENTS
        </a>

        {/* Desktop Menu */}
        <div className="hidden md:flex gap-8 items-center">
          {[...navLinks, ...(user ? [{ name: 'Profile', href: '#', view: 'profile' as const }] : [])].map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={(e) => handleLinkClick(e, link.view === 'home' ? link.href : '#', link.view)}
              className={`text-sm uppercase tracking-widest transition-colors duration-300 relative group ${
                currentView === link.view && (link.view !== 'home' || link.name === 'Mission') 
                  ? 'text-white font-bold' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {link.name}
              <span className={`absolute -bottom-1 left-0 h-[1px] bg-[#dfcda5] transition-all duration-300 ${
                  currentView === link.view && (link.view !== 'home' || link.name === 'Mission') 
                  ? 'w-full' 
                  : 'w-0 group-hover:w-full'}`} 
              />
            </a>
          ))}

          {/* Auth Button */}
          <div className="relative">
            {user ? (
               <div className="flex items-center gap-4">
                  <span className="text-xs uppercase tracking-wider text-zinc-400">
                     Hi, {user.name} ({user.role})
                  </span>
                  <button 
                    onClick={logout}
                    className="flex items-center gap-2 px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition-colors border-2 border-[#dfcda5] hover:bg-white/5 backdrop-blur-md"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
               </div>
            ) : (
                <button 
                    onClick={(e) => handleLinkClick(e, '#', 'auth')}
                    className="px-6 py-2 text-white text-xs font-bold uppercase tracking-widest transition-colors duration-300 flex items-center gap-2 rounded-2xl bg-gradient-to-br from-zinc-800 via-zinc-700 to-zinc-600 hover:from-zinc-700 hover:to-zinc-500 border-2 border-[#dfcda5] backdrop-blur-md"
                >
                    <UserCircle className="w-4 h-4" /> Login
                </button>
            )}
          </div>
        </div>

        {/* Mobile Toggle */}
        <div className="md:hidden z-50">
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-white p-2">
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: '100vh' }}
            exit={{ opacity: 0, height: 0 }}
            className="fixed inset-0 bg-zinc-950 flex flex-col items-center justify-center gap-8 md:hidden overflow-hidden"
          >
            {[...navLinks, ...(user ? [{ name: 'Profile', href: '#', view: 'profile' as const }] : [])].map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.view === 'home' ? link.href : '#', link.view)}
                className="text-3xl font-['Syne'] font-bold text-zinc-300 hover:text-white"
              >
                {link.name}
              </a>
            ))}
             {!user ? (
               <button onClick={(e) => handleLinkClick(e, '#', 'auth')} className="w-3/4 py-4 text-white font-bold uppercase tracking-widest rounded-2xl bg-gradient-to-br from-zinc-800 via-zinc-700 to-zinc-600 hover:from-zinc-700 hover:to-zinc-500 border-2 border-[#dfcda5] backdrop-blur-md">
                Login / Sign Up
               </button>
             ) : (
                 <div className="flex flex-col items-center gap-4 w-full">
                     <p className="text-zinc-500 uppercase tracking-widest text-sm">Hi, {user.name}</p>
                     <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="text-xl text-red-500 font-bold uppercase tracking-widest">Logout</button>
                 </div>
             )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};