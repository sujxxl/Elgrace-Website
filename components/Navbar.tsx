import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, UserCircle, LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { siteConfig, ViewKey } from '../siteConfig';

interface NavbarProps {
  onNavigate: (view: ViewKey) => void;
  currentView: ViewKey;
  forceLight?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentView, forceLight = false }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Initialize / sync theme: only allow light theme on the admin (profile) view.
  useEffect(() => {
    if (forceLight) {
      setTheme('light');
      document.documentElement.dataset.theme = 'light';
      return;
    }

    if (currentView !== 'profile') {
      setTheme('dark');
      document.documentElement.dataset.theme = 'dark';
      return;
    }

    const stored = window.localStorage.getItem('elgrace-theme');
    if (stored === 'light' || stored === 'dark') {
      setTheme(stored);
      document.documentElement.dataset.theme = stored;
      return;
    }
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = prefersDark ? 'dark' : 'light';
    setTheme(initial);
    document.documentElement.dataset.theme = initial;
  }, [currentView, forceLight]);

  // Apply theme changes
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('elgrace-theme', theme);
  }, [theme]);

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

  const scrolledClasses =
    theme === 'light'
      ? 'bg-[#fbf3e4]/90 backdrop-blur-md border-b border-[#dfcda5]/80 py-2'
      : 'bg-zinc-950/90 backdrop-blur-md border-b border-white/10 py-2';

  const topClasses = 'bg-transparent py-3';

  const linkActive = theme === 'light' ? 'text-black font-bold' : 'text-white font-bold';
  const linkIdle = theme === 'light' ? 'text-zinc-600 hover:text-black' : 'text-zinc-400 hover:text-white';

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
            className="text-2xl font-bold font-['Syne'] tracking-wider z-50 relative"
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
              <span className={`absolute -bottom-1 left-0 h-[1px] bg-[#dfcda5] transition-all duration-300 ${
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
                className="flex items-center gap-2 px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition-colors border-2 border-[#dfcda5] hover:bg-white/5 backdrop-blur-md text-white"
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
                  className="flex items-center gap-2 px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition-colors border-2 border-[#dfcda5] hover:bg-white/5 backdrop-blur-md"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            )}

            {user && user.role !== 'admin' && (
              <div className="flex items-center gap-4">
                <span className="text-xs uppercase tracking-wider text-zinc-400">
                  Hi, {user.name || user.email}
                </span>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('profile');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition-colors border-2 border-[#dfcda5] hover:bg-white/5 backdrop-blur-md text-white"
                >
                  <UserCircle className="w-4 h-4" /> Profile
                </button>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-3 py-2 rounded text-xs font-bold uppercase tracking-widest transition-colors border border-white/20 hover:border-[#dfcda5] backdrop-blur-md text-zinc-300"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
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
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.view === 'home' ? link.href : '#', link.view)}
                className="text-3xl font-['Syne'] font-bold text-zinc-300 hover:text-white"
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
                  className="text-xl text-white font-bold uppercase tracking-widest border-2 border-[#dfcda5] px-6 py-3 rounded-full"
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
                  className="text-xl text-red-500 font-bold uppercase tracking-widest"
                >
                  Logout
                </button>
              </div>
            )}

            {user && user.role !== 'admin' && (
              <div className="flex flex-col items-center gap-4 w-full mt-8">
                <p className="text-zinc-500 uppercase tracking-widest text-sm">Hi, {user.name || user.email}</p>
                <button
                  onClick={() => {
                    onNavigate('profile');
                    setMobileMenuOpen(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-xl text-white font-bold uppercase tracking-widest border-2 border-[#dfcda5] px-6 py-3 rounded-full"
                >
                  Profile
                </button>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-lg text-red-500 font-bold uppercase tracking-widest"
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