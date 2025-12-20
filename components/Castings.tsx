import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, DollarSign, Calendar, Plus, Check, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { AuthPage } from './AuthPage';
import { Casting, CastingApplication, applyToCasting, listCastingApplicationsForModel, createCasting, listOnlineCastings, getBrandProfileByUserId } from '../services/ProfileService';

export const Castings: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [castings, setCastings] = useState<Casting[]>([]);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);
  const [appliedCastings, setAppliedCastings] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [newCasting, setNewCasting] = useState({
    title: '',
    description: '',
    location: '',
    budget_min: '',
    budget_max: '',
    application_deadline: '',
    shoot_date: '',
    requirements: ''
  });

  useEffect(() => {
    (async () => {
      try {
        const data = await listOnlineCastings();
        setCastings(data);
        // Load already-applied castings for logged-in models
        if (user && user.role === 'model') {
          const apps = await listCastingApplicationsForModel(user.id);
          const appliedIds = apps.map((a) => a.casting_id);
          setAppliedCastings(appliedIds);
        }
      } catch (err) {
        console.error('Failed to load castings', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const handlePostCastingClick = () => {
    if (!user) {
        setIsAuthPromptOpen(true);
    } else if (user.role === 'client') {
        setIsPostModalOpen(true);
    } else {
        alert("Only clients can post castings.");
    }
  };

  const handleApplyClick = async (castingId?: string) => {
    if (!user) {
        setIsAuthPromptOpen(true);
    } else if (user.role === 'model') {
        if (castingId) {
          try {
            await applyToCasting(castingId, user.id);
            setAppliedCastings((prev) => [...prev, castingId]);
            showToast('✅ Application submitted successfully!');
          } catch (err) {
            console.error('Failed to apply to casting', err);
            showToast('Could not submit application. Please try again.', 'error');
          }
        }
    } else {
        alert("Only models can apply for castings.");
    }
  };

  const handlePostCasting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setIsAuthPromptOpen(true);
      return;
    }
    try {
      const brandProfile = await getBrandProfileByUserId(user.id);
      if (!brandProfile) {
        alert('Please complete your brand profile before posting a casting.');
        return;
      }
      const created = await createCasting({
        user_id: user.id,
        brand_profile_id: brandProfile?.id ?? null,
        title: newCasting.title,
        description: newCasting.description || null,
        location: newCasting.location || null,
        budget_min: newCasting.budget_min ? Number(newCasting.budget_min) : null,
        budget_max: newCasting.budget_max ? Number(newCasting.budget_max) : null,
        requirements: newCasting.requirements || null,
        application_deadline: newCasting.application_deadline || null,
        shoot_date: newCasting.shoot_date || null,
      });
      setCastings([created, ...castings]);
      setIsPostModalOpen(false);
      setNewCasting({ title: '', description: '', location: '', budget_min: '', budget_max: '', application_deadline: '', shoot_date: '', requirements: '' });
      showToast('🎬 Casting posted successfully!');
    } catch (err: any) {
      alert(`Failed to post casting: ${err.message ?? err}`);
    }
  };

  const onAuthSuccess = () => {
      setIsAuthPromptOpen(false);
  };

  const formatBudget = (min?: number | null, max?: number | null) => {
    if (!min && !max) return 'Budget TBA';
    if (min && max) return `₹${min.toLocaleString()} - ₹${max.toLocaleString()}`;
    if (min) return `From ₹${min.toLocaleString()}`;
    return `Up to ₹${max?.toLocaleString()}`;
  };

  return (
    <section className="min-h-screen bg-zinc-950 py-12 px-6">
      <div className="container mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 pb-8 border-b border-zinc-800">
          <div>
            <h2 className="text-zinc-500 uppercase tracking-widest text-sm mb-2">Opportunities</h2>
            <h3 className="text-4xl md:text-5xl font-['Syne'] font-bold">Casting Calls</h3>
            {loading && <p className="text-zinc-500 text-sm mt-2">Loading castings...</p>}
          </div>
          
          <button 
            onClick={handlePostCastingClick}
            className="mt-6 md:mt-0 flex items-center gap-2 px-6 py-3 text-white font-bold uppercase tracking-widest transition-colors rounded-2xl bg-gradient-to-br from-zinc-800 via-zinc-700 to-zinc-600 hover:from-zinc-700 hover:to-zinc-500 border-2 border-[#dfcda5] backdrop-blur-md"
          >
            <Plus className="w-4 h-4" /> Post a Casting
          </button>
        </div>

        {/* Casting List */}
        <div className="grid gap-6">
          {!loading && castings.length === 0 && (
            <div className="text-zinc-500 text-sm">No castings posted yet.</div>
          )}
          {castings.map((casting) => (
            <motion.div 
              key={casting.id ?? casting.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-900/50 border border-zinc-800 p-6 md:p-8 rounded-xl hover:border-zinc-600 transition-colors group"
            >
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-bold bg-zinc-800 text-zinc-300 px-2 py-1 rounded uppercase tracking-wider">
                        {casting.brand_profile_id ? 'Brand' : 'Brand'}
                    </span>
                    <span className="text-xs text-zinc-500 uppercase tracking-wider">{casting.application_deadline ?? 'TBD'}</span>
                  </div>
                  <h4 className="text-2xl font-bold text-white mb-3 group-hover:text-zinc-200">
                    {casting.id ? (
                      <Link to={`/castings/${casting.id}`} className="hover:underline">
                        {casting.title}
                      </Link>
                    ) : (
                      casting.title
                    )}
                  </h4>
                  <p className="text-zinc-400 mb-6 max-w-2xl">{casting.description}</p>
                  
                  <div className="flex flex-wrap gap-4 md:gap-8 text-sm text-zinc-300">
                    <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-zinc-500" />
                        {casting.location || 'Location TBA'}
                    </div>
                    <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-zinc-500" />
                        {formatBudget(
                          casting.budget_min !== undefined && casting.budget_min !== null ? Number(casting.budget_min) : undefined,
                          casting.budget_max !== undefined && casting.budget_max !== null ? Number(casting.budget_max) : undefined
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-zinc-500" />
                        {casting.shoot_date
                          ? `Shoot date: ${new Date(casting.shoot_date).toLocaleDateString()}`
                          : 'Shoot date: TBA'}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col justify-center items-end min-w-[150px]">
                    <button 
                        onClick={() => handleApplyClick(casting.id as string)}
                        disabled={appliedCastings.includes((casting.id as string) ?? '')}
                      className={`w-full py-3 font-bold uppercase tracking-widest text-xs transition-colors flex items-center justify-center gap-2 rounded-2xl
                        ${appliedCastings.includes((casting.id as string) ?? '')} 
                          ? 'bg-emerald-900/50 text-emerald-400 cursor-default' 
                          : 'text-white bg-gradient-to-br from-zinc-800 via-zinc-700 to-zinc-600 hover:from-zinc-700 hover:to-zinc-500 border-2 border-[#dfcda5] backdrop-blur-md'
                        }`}
                    >
                        {appliedCastings.includes((casting.id as string) ?? '') ? (
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

      {/* Post Casting Modal (Client Only) */}
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
                    <h3 className="text-2xl font-bold font-['Syne'] mb-6">Create New Casting</h3>
                    <form onSubmit={handlePostCasting} className="space-y-4">
                        <div>
                            <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">Project Title</label>
                            <input 
                                required
                                value={newCasting.title}
                                onChange={(e) => setNewCasting({...newCasting, title: e.target.value})}
                                className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white focus:outline-none focus:border-white/50"
                                placeholder="e.g. Winter Campaign 2024"
                            />
                        </div>
                        <div>
                            <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">Description</label>
                            <textarea 
                                required
                                value={newCasting.description}
                                onChange={(e) => setNewCasting({...newCasting, description: e.target.value})}
                                className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white focus:outline-none focus:border-white/50 h-32"
                                placeholder="Describe the role and project..."
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">Location</label>
                            <input 
                              required
                              value={newCasting.location}
                              onChange={(e) => setNewCasting({...newCasting, location: e.target.value})}
                              className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white focus:outline-none focus:border-white/50"
                              placeholder="City, Country"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">Budget Min</label>
                              <input
                              type="number"
                              value={newCasting.budget_min}
                              onChange={(e) => setNewCasting({...newCasting, budget_min: e.target.value})}
                              className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white focus:outline-none focus:border-white/50"
                              placeholder="30000"
                              />
                            </div>
                            <div>
                              <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">Budget Max</label>
                              <input
                              type="number"
                              value={newCasting.budget_max}
                              onChange={(e) => setNewCasting({...newCasting, budget_max: e.target.value})}
                              className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white focus:outline-none focus:border-white/50"
                              placeholder="50000"
                              />
                            </div>
                          </div>
                        </div>
                        <div>
                            <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">Requirements</label>
                            <input 
                                required
                                value={newCasting.requirements}
                                onChange={(e) => setNewCasting({...newCasting, requirements: e.target.value})}
                                className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white focus:outline-none focus:border-white/50"
                                placeholder="e.g. Female, 20-25, 5'8+"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">Application Deadline</label>
                              <input 
                                  type="date"
                                value={newCasting.application_deadline}
                                onChange={(e) => setNewCasting({...newCasting, application_deadline: e.target.value})}
                                  className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white focus:outline-none focus:border-white/50"
                              />
                          </div>
                          <div>
                              <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">Shoot Date</label>
                              <input 
                                  type="date"
                                value={newCasting.shoot_date}
                                onChange={(e) => setNewCasting({...newCasting, shoot_date: e.target.value})}
                                  className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white focus:outline-none focus:border-white/50"
                              />
                          </div>
                        </div>
                        
                        <div className="pt-4 flex gap-4">
                          <button type="button" onClick={() => setIsPostModalOpen(false)} className="flex-1 py-3 border-2 border-[#dfcda5] hover:bg-white/5 transition-colors uppercase tracking-widest font-bold text-xs rounded-xl backdrop-blur-md">Cancel</button>
                          <button type="submit" className="flex-1 py-3 text-white uppercase tracking-widest font-bold text-xs rounded-2xl bg-gradient-to-br from-zinc-800 via-zinc-700 to-zinc-600 hover:from-zinc-700 hover:to-zinc-500 border-2 border-[#dfcda5] backdrop-blur-md">Post Casting</button>
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