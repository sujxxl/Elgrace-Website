import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, UserCircle, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { siteConfig, ViewKey } from '../siteConfig';
import type { ThemeVariant } from '../theme/homeSections.ts';

interface NavbarProps {
  onNavigate: (view: ViewKey) => void;
  currentView: ViewKey;
  showProfileHint?: boolean;
  variant?: ThemeVariant;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentView, showProfileHint = false, variant = 'light' }) => {
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

  const isDark = variant === 'dark';

  const handleLinkClick = (e: React.MouseEvent<HTMLElement>, target: string, view: 'home' | 'services' | 'talents' | 'gallery' | 'castings' | 'auth' | 'profile') => {
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

  const baseNavLinks: { name: string; href: string; view: ViewKey }[] = [
    { name: 'Mission', href: '#mission', view: 'home' },
    { name: 'Services', href: '#', view: 'services' },
    { name: 'Talents', href: '#', view: 'talents' },
    { name: 'Gallery', href: '#', view: 'gallery' },
    { name: 'Castings', href: '#', view: 'castings' },
  ];

  // Only include links that are enabled in the global config (1 = on, 0 = off)
  const navLinks = baseNavLinks
    .filter((link) => siteConfig.tabs[link.view] === 1)
    .concat(
      user && siteConfig.tabs.profile === 1
        ? [
            {
              name: user.role === 'admin' ? 'Admin' : 'Profile',
              href: '#',
              view: 'profile' as ViewKey,
            },
          ]
        : []
    );

  const scrolledClasses = isDark
    ? 'bg-zinc-950/85 backdrop-blur-md border-b border-white/10 py-2'
    : 'bg-white/92 backdrop-blur-md border-b border-[#3d211a]/90 py-2';

  const topClasses = 'bg-transparent py-3';

  const linkActive = isDark ? 'text-white font-bold' : 'text-[#111827] font-bold';
  const linkIdle = isDark ? 'text-zinc-300 hover:text-white' : 'text-[#4b5563] hover:text-[#111827]';

  const brandText = isDark ? 'text-white' : 'text-[#111827]';
  const underline = isDark ? 'bg-[#dfcda5]' : 'bg-[#3d211a]';

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled || mobileMenuOpen ? scrolledClasses : topClasses
      }`}
    >
      <div className="container mx-auto px-6 flex justify-between items-center">
        <a 
            href="#" 
            onClick={(e) => handleLinkClick(e, '#', 'home')}
            className={`text-2xl font-bold font-['Syne'] tracking-wider z-50 relative ${brandText}`}
        >
          ELGRACE TALENTS
        </a>

        {/* Desktop Menu */}
        <div className="hidden md:flex gap-8 items-center">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={(e) => handleLinkClick(e, link.view === 'home' ? link.href : '#', link.view)}
              className={`text-sm uppercase tracking-widest transition-colors duration-300 relative group ${
                currentView === link.view && (link.view !== 'home' || link.name === 'Mission') 
                  ? linkActive 
                  : linkIdle
              }`}
            >
              {link.name}
                <span className={`absolute -bottom-1 left-0 h-[1px] ${underline} transition-all duration-300 ${
                  currentView === link.view && (link.view !== 'home' || link.name === 'Mission') 
                  ? 'w-full' 
                  : 'w-0 group-hover:w-full'}`} 
              />
            </a>
          ))}

          {/* Auth controls */}
          <div className="relative flex items-center gap-3">
            {!user && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('auth');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={
                  isDark
                    ? 'flex items-center gap-2 px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition-colors border-2 border-[#dfcda5] hover:bg-white/5 backdrop-blur-md text-white'
                    : 'flex items-center gap-2 px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition-colors border-2 border-[#3d211a] hover:bg-white/5 backdrop-blur-md text-[#111827]'
                }
              >
                <UserCircle className="w-4 h-4" /> Login
              </button>
            )}

            {user && user.role === 'admin' && (
              <div className="flex items-center gap-4">
                <span className="text-xs uppercase tracking-wider text-zinc-400">
                  Hi, {user.name || user.email} ({user.role})
                </span>
                <button
                  onClick={logout}
                  className={
                    isDark
                      ? 'flex items-center gap-2 px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition-colors border-2 border-white/20 hover:bg-white/5 backdrop-blur-md text-white'
                      : 'flex items-center gap-2 px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition-colors border-2 border-[#3d211a] hover:bg-[#3d211a]/10 backdrop-blur-md text-[#111827]'
                  }
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            )}

            {user && user.role !== 'admin' && (
              <div className="flex items-center gap-4 relative">
                {showProfileHint && (
                  <div className="hidden md:flex flex-col items-end absolute -top-10 right-0 pointer-events-none">
                    <div className="bg-[#3d211a] text-[10px] leading-tight text-[#fbf3e4] font-semibold uppercase tracking-widest rounded-full px-3 py-1 shadow-lg">
                      Complete your profile
                    </div>
                    <div className="w-2 h-2 bg-[#3d211a] rotate-45 mt-[-3px] mr-8" />
                  </div>
                )}
                <span className="text-xs uppercase tracking-wider text-zinc-400">
                  Hi, {user.name || user.email}
                </span>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('profile');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                    className={
                      isDark
                        ? 'flex items-center gap-2 px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition-colors border-2 border-white/20 hover:bg-white/5 backdrop-blur-md text-white'
                        : 'flex items-center gap-2 px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition-colors border-2 border-[#3d211a] hover:bg-[#3d211a]/10 backdrop-blur-md text-[#111827]'
                    }
                >
                  <UserCircle className="w-4 h-4" /> Profile
                </button>
                <button
                  onClick={logout}
                  className={
                    isDark
                      ? 'flex items-center gap-2 px-3 py-2 rounded text-xs font-bold uppercase tracking-widest transition-colors border border-white/20 hover:border-white/40 backdrop-blur-md text-zinc-300'
                      : 'flex items-center gap-2 px-3 py-2 rounded text-xs font-bold uppercase tracking-widest transition-colors border border-[#3d211a] hover:border-[#c9a961] backdrop-blur-md text-[#4b5563]'
                  }
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Toggle */}
        <div className="md:hidden z-50">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`p-2 ${isDark ? 'text-white' : 'text-[#111827]'}`}
          >
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
            className={`fixed inset-0 flex flex-col items-center justify-center gap-8 md:hidden overflow-hidden ${
              isDark ? 'bg-zinc-950 text-white' : 'bg-[#fbf3e4] text-[#111827]'
            }`}
          >
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.view === 'home' ? link.href : '#', link.view)}
                className={
                  isDark
                    ? "text-3xl font-['Syne'] font-bold text-white hover:text-zinc-300"
                    : "text-3xl font-['Syne'] font-bold text-[#111827] hover:text-[#3d211a]"
                }
              >
                {link.name}
              </a>
            ))}
            {!user && (
              <div className="flex flex-col items-center gap-4 w-full mt-8">
                <button
                  onClick={() => {
                    onNavigate('auth');
                    setMobileMenuOpen(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={
                    isDark
                      ? 'text-xl text-white font-bold uppercase tracking-widest border-2 border-white/20 px-6 py-3 rounded-full hover:bg-white/5'
                      : 'text-xl text-[#111827] font-bold uppercase tracking-widest border-2 border-[#3d211a] px-6 py-3 rounded-full hover:bg-[#3d211a]/10'
                  }
                >
                  Login
                </button>
              </div>
            )}

            {user && user.role === 'admin' && (
              <div className="flex flex-col items-center gap-4 w-full mt-8">
                <p className="text-zinc-500 uppercase tracking-widest text-sm">Hi, {user.name || user.email}</p>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-xl text-[#3d211a] font-bold uppercase tracking-widest"
                >
                  Logout
                </button>
              </div>
            )}

            {user && user.role !== 'admin' && (
              <div className="flex flex-col items-center gap-4 w-full mt-8">
                <p className="text-zinc-500 uppercase tracking-widest text-sm">Hi, {user.name || user.email}</p>
                {showProfileHint && (
                  <p className="text-xs text-[#3d211a] uppercase tracking-widest">
                    Complete your profile from the dashboard
                  </p>
                )}
                <button
                  onClick={() => {
                    onNavigate('profile');
                    setMobileMenuOpen(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-xl text-[#111827] font-bold uppercase tracking-widest border-2 border-[#3d211a] px-6 py-3 rounded-full hover:bg-[#3d211a]/10"
                >
                  Profile
                </button>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-lg text-[#3d211a] font-bold uppercase tracking-widest"
                >
                  Logout
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};