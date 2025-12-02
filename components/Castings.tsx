import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, MapPin, DollarSign, Calendar, Plus, Check, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AuthPage } from './AuthPage';

interface Gig {
  id: number;
  title: string;
  description: string;
  location: string;
  budget: string;
  date: string;
  requirements: string;
  clientName: string;
}

const initialGigs: Gig[] = [
  {
    id: 1,
    title: "Summer Fashion Campaign",
    description: "Looking for fresh faces for our upcoming summer collection shoot. Beach vibes, casual wear.",
    location: "Mumbai, India",
    budget: "₹50,000",
    date: "Oct 15, 2023",
    requirements: "Age 18-25, Female, Min 5'7\"",
    clientName: "Zara India"
  },
  {
    id: 2,
    title: "Tech Startup Commercial",
    description: "Corporate video shoot for a new fintech app. Professional attire, speaking role required.",
    location: "Bangalore, India",
    budget: "₹35,000",
    date: "Oct 20, 2023",
    requirements: "Age 25-35, Any Gender, Fluent English",
    clientName: "Cred"
  },
  {
    id: 3,
    title: "Athletic Wear Catalog",
    description: "High energy photoshoot for gym wear. Must be fit and comfortable with movement.",
    location: "New Delhi, India",
    budget: "₹45,000",
    date: "Nov 01, 2023",
    requirements: "Athletic build, 6ft+ for Males",
    clientName: "Boldfit"
  }
];

export const Castings: React.FC = () => {
  const { user } = useAuth();
  const [gigs, setGigs] = useState<Gig[]>(initialGigs);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);
  const [appliedGigs, setAppliedGigs] = useState<number[]>([]);

  // Form State
  const [newGig, setNewGig] = useState({
    title: '',
    description: '',
    location: '',
    budget: '',
    date: '',
    requirements: ''
  });

  const handlePostGigClick = () => {
    if (!user) {
        setIsAuthPromptOpen(true);
    } else if (user.role === 'client') {
        setIsPostModalOpen(true);
    } else {
        alert("Only clients can post gigs.");
    }
  };

  const handleApplyClick = (gigId: number) => {
    if (!user) {
        setIsAuthPromptOpen(true);
    } else if (user.role === 'model') {
        setAppliedGigs([...appliedGigs, gigId]);
    } else {
        alert("Only models can apply for gigs.");
    }
  };

  const handlePostGig = (e: React.FormEvent) => {
    e.preventDefault();
    const gig: Gig = {
      id: gigs.length + 1,
      ...newGig,
      clientName: user?.name || "My Brand"
    };
    setGigs([gig, ...gigs]);
    setIsPostModalOpen(false);
    setNewGig({ title: '', description: '', location: '', budget: '', date: '', requirements: '' });
  };

  const onAuthSuccess = () => {
      setIsAuthPromptOpen(false);
  };

  return (
    <section className="min-h-screen bg-zinc-950 py-12 px-6">
      <div className="container mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 pb-8 border-b border-zinc-800">
          <div>
            <h2 className="text-zinc-500 uppercase tracking-widest text-sm mb-2">Opportunities</h2>
            <h3 className="text-4xl md:text-5xl font-['Syne'] font-bold">Casting Calls</h3>
          </div>
          
          <button 
            onClick={handlePostGigClick}
            className="mt-6 md:mt-0 flex items-center gap-2 px-6 py-3 bg-white text-black font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
          >
            <Plus className="w-4 h-4" /> Post a Gig
          </button>
        </div>

        {/* Gig List */}
        <div className="grid gap-6">
          {gigs.map((gig) => (
            <motion.div 
              key={gig.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-900/50 border border-zinc-800 p-6 md:p-8 rounded-xl hover:border-zinc-600 transition-colors group"
            >
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-bold bg-zinc-800 text-zinc-300 px-2 py-1 rounded uppercase tracking-wider">
                        {gig.clientName}
                    </span>
                    <span className="text-xs text-zinc-500 uppercase tracking-wider">{gig.date}</span>
                  </div>
                  <h4 className="text-2xl font-bold text-white mb-3 group-hover:text-zinc-200">{gig.title}</h4>
                  <p className="text-zinc-400 mb-6 max-w-2xl">{gig.description}</p>
                  
                  <div className="flex flex-wrap gap-4 md:gap-8 text-sm text-zinc-300">
                    <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-zinc-500" />
                        {gig.location}
                    </div>
                    <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-zinc-500" />
                        {gig.budget}
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-zinc-500" />
                        {gig.requirements}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col justify-center items-end min-w-[150px]">
                    <button 
                        onClick={() => handleApplyClick(gig.id)}
                        disabled={appliedGigs.includes(gig.id)}
                        className={`w-full py-3 font-bold uppercase tracking-widest text-xs transition-colors flex items-center justify-center gap-2
                            ${appliedGigs.includes(gig.id) 
                                ? 'bg-emerald-900/50 text-emerald-400 cursor-default' 
                                : 'bg-white text-black hover:bg-zinc-200'
                            }`}
                    >
                        {appliedGigs.includes(gig.id) ? (
                            <><Check className="w-4 h-4" /> Applied</>
                        ) : (
                            'Apply Now'
                        )}
                    </button>
                    {!user && (
                        <p className="text-[10px] text-zinc-500 mt-2 uppercase tracking-wide flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Login Required
                        </p>
                    )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Post Gig Modal (Client Only) */}
      <AnimatePresence>
        {isPostModalOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    onClick={() => setIsPostModalOpen(false)}
                />
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative bg-zinc-900 w-full max-w-2xl p-8 rounded-xl border border-zinc-800 shadow-2xl max-h-[90vh] overflow-y-auto"
                >
                    <h3 className="text-2xl font-bold font-['Syne'] mb-6">Create New Gig</h3>
                    <form onSubmit={handlePostGig} className="space-y-4">
                        <div>
                            <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">Project Title</label>
                            <input 
                                required
                                value={newGig.title}
                                onChange={(e) => setNewGig({...newGig, title: e.target.value})}
                                className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white focus:outline-none focus:border-white/50"
                                placeholder="e.g. Winter Campaign 2024"
                            />
                        </div>
                        <div>
                            <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">Description</label>
                            <textarea 
                                required
                                value={newGig.description}
                                onChange={(e) => setNewGig({...newGig, description: e.target.value})}
                                className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white focus:outline-none focus:border-white/50 h-32"
                                placeholder="Describe the role and project..."
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">Location</label>
                                <input 
                                    required
                                    value={newGig.location}
                                    onChange={(e) => setNewGig({...newGig, location: e.target.value})}
                                    className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white focus:outline-none focus:border-white/50"
                                    placeholder="City, Country"
                                />
                            </div>
                            <div>
                                <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">Budget</label>
                                <input 
                                    required
                                    value={newGig.budget}
                                    onChange={(e) => setNewGig({...newGig, budget: e.target.value})}
                                    className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white focus:outline-none focus:border-white/50"
                                    placeholder="₹XX,XXX"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">Requirements</label>
                            <input 
                                required
                                value={newGig.requirements}
                                onChange={(e) => setNewGig({...newGig, requirements: e.target.value})}
                                className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white focus:outline-none focus:border-white/50"
                                placeholder="e.g. Female, 20-25, 5'8+"
                            />
                        </div>
                        <div>
                            <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">Date</label>
                            <input 
                                type="date"
                                required
                                value={newGig.date}
                                onChange={(e) => setNewGig({...newGig, date: e.target.value})}
                                className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white focus:outline-none focus:border-white/50"
                            />
                        </div>
                        
                        <div className="pt-4 flex gap-4">
                            <button type="button" onClick={() => setIsPostModalOpen(false)} className="flex-1 py-3 border border-zinc-700 hover:bg-zinc-800 transition-colors uppercase tracking-widest font-bold text-xs">Cancel</button>
                            <button type="submit" className="flex-1 py-3 bg-white text-black hover:bg-zinc-200 transition-colors uppercase tracking-widest font-bold text-xs">Post Gig</button>
                        </div>
                    </form>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* Auth Prompt Modal */}
      <AnimatePresence>
        {isAuthPromptOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/90 backdrop-blur-md"
                    onClick={() => setIsAuthPromptOpen(false)}
                />
                <motion.div 
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className="relative bg-zinc-900 w-full max-w-4xl rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
                >
                    <button 
                        onClick={() => setIsAuthPromptOpen(false)}
                        className="absolute top-4 right-4 z-50 p-2 bg-zinc-800 rounded-full text-white hover:bg-zinc-700"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                    
                    {/* Reusing AuthPage but wrapped slightly differently */}
                    <div className="pt-8">
                         <div className="text-center mb-4">
                            <h3 className="text-2xl font-['Syne'] font-bold text-white">Login Required</h3>
                            <p className="text-zinc-400 text-sm">You must be logged in to perform this action.</p>
                         </div>
                         <div className="transform scale-90 origin-top">
                             <AuthPage onLoginSuccess={onAuthSuccess} />
                         </div>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </section>
  );
};