import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Instagram, Mail, MapPin, Ruler, Weight, Filter, Search } from 'lucide-react';
import { listOnlineProfiles, createBookingRequest, getBrandProfileByUserId } from '../services/ProfileService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { deriveMedia, fetchMediaRecords } from '../services/mediaService';

type Category = 'All' | 'Male' | 'Female' | 'Kids';

interface Talent {
    id: string;
    name: string;
    category: Category;
    image: string;
    height: string;
    size: string;
    location: string;
    age: number;
    gender: 'Male' | 'Female' | 'Other';
    heightCm: number; // For filtering logic
    instagramHandle?: string;
    portfolioUrl?: string | null;
}

const useScreenSize = () => {
    const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            if (width < 640) setScreenSize('mobile');
            else if (width < 1024) setScreenSize('tablet');
            else setScreenSize('desktop');
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return screenSize;
};

const TalentCard: React.FC<{
    talent: Talent;
    index: number;
    isExpanded: boolean;
    setExpandedId: (id: string | null) => void;
    screenSize: 'mobile' | 'tablet' | 'desktop';
    onBookNow: (talent: Talent) => void;
    onOpenProfile: (id: string) => void;
}> = ({ talent, index, isExpanded, setExpandedId, screenSize, onBookNow, onOpenProfile }) => {
    
    let isRightEdge = false;
    if (screenSize === 'desktop') {
        isRightEdge = (index + 1) % 4 === 0;
    } else if (screenSize === 'tablet') {
        isRightEdge = (index + 1) % 2 === 0;
    }

    const handleMouseEnter = () => {
        if (screenSize !== 'mobile') {
            setExpandedId(talent.id);
        }
    };

    const handleMouseLeave = () => {
        if (screenSize !== 'mobile') {
            setExpandedId(null);
        }
    };

    const handleClick = () => {
        if (screenSize === 'mobile') {
            setExpandedId(isExpanded ? null : talent.id);
        }
    };

    return (
        <div className={`relative aspect-[3/4] ${isExpanded ? 'z-40' : 'z-0'}`}>
            <motion.div
                layout
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onClick={handleClick}
                className={`
                    absolute top-0 h-full bg-zinc-900 border border-zinc-800 overflow-hidden cursor-pointer shadow-xl
                    ${isExpanded ? 'shadow-2xl ring-1 ring-white/20' : 'hover:border-zinc-600'}
                    ${isRightEdge ? 'right-0 origin-right' : 'left-0 origin-left'}
                `}
                initial={false}
                animate={{
                    width: isExpanded && screenSize !== 'mobile' ? '200%' : '100%',
                    height: '100%', 
                    zIndex: isExpanded ? 40 : 1
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
                <div className="flex w-full h-full">
                    {/* Image Section */}
                    <div className={`${isExpanded && screenSize !== 'mobile' ? 'w-1/2' : 'w-full'} h-full relative transition-all duration-500`}>
                        {talent.image ? (
                            <img
                                src={talent.image}
                                alt={talent.name}
                                className={`w-full h-full object-cover transition-all duration-700 ${isExpanded ? 'grayscale-0' : 'grayscale group-hover:grayscale-0'}`}
                            />
                        ) : (
                            <div className="w-full h-full bg-zinc-800" />
                        )}
                        <motion.div 
                            initial={{ opacity: 1 }}
                            animate={{ opacity: isExpanded ? 0 : 1 }}
                            className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex flex-col justify-end p-6"
                        >
                            <h4 className="text-2xl font-['Syne'] font-bold text-white">{talent.name}</h4>
                            <p className="text-zinc-400 text-sm uppercase tracking-wider">{talent.category}</p>
                        </motion.div>
                    </div>

                    {/* Details Section */}
                    <AnimatePresence>
                        {isExpanded && screenSize !== 'mobile' && (
                            <motion.div 
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ delay: 0.1, duration: 0.3 }}
                                className="w-1/2 h-full p-8 bg-zinc-900 flex flex-col justify-between border-l border-white/5"
                            >
                                <div>
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h3 className="text-3xl font-['Syne'] font-bold text-white mb-1">{talent.name}</h3>
                                            <div className="flex gap-2">
                                                <span className="text-xs font-bold bg-white text-black px-2 py-1 rounded-sm uppercase tracking-widest">{talent.category}</span>
                                                <span className="text-xs font-bold border border-zinc-700 text-zinc-300 px-2 py-1 rounded-sm uppercase tracking-widest">{talent.age} Yrs</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 text-zinc-300">
                                            <MapPin className="w-4 h-4 text-zinc-500" />
                                            <span className="text-sm font-medium">{talent.location}</span>
                                        </div>
                                        
                                        {talent.category !== 'Creatives' && (
                                            <div className="grid grid-cols-2 gap-y-4 gap-x-2 pt-4 border-t border-white/10">
                                                <div>
                                                    <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1"><Ruler className="w-3 h-3" /> Height</p>
                                                    <p className="text-white font-medium">{talent.height}</p>
                                                </div>
                                                <div>
                                                        <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1"><Weight className="w-3 h-3" /> Size</p>
                                                        <p className="text-white font-medium">{talent.size}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                                                <div className="space-y-3">
                                                                                                                                                <button
                                                                                                                                                        onClick={(e) => {
                                                                                                                                                                e.stopPropagation();
                                                                                                                                                                onBookNow(talent);
                                                                                                                                                        }}
                                                                                                                                                        className="w-full py-3 bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
                                                                                                                                                >
                                                                                                                                                                Book Now
                                                                                                                                                </button>
                                                                                                                                                <button
                                                                                                                                                    onClick={(e) => {
                                                                                                                                                        e.stopPropagation();
                                                                                                                                                        onOpenProfile(talent.id);
                                                                                                                                                    }}
                                                                                                                                                    className="w-full py-2 mt-2 border border-zinc-700 text-zinc-200 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-900 transition-colors"
                                                                                                                                                >
                                                                                                                                                    View Full Profile
                                                                                                                                                </button>
                                    <div className="flex gap-2">
                                        <a
                                          href={`mailto:talents@elgrace.in?subject=${encodeURIComponent('Booking Enquiry for ' + talent.name)}`}
                                          className="flex-1 py-2 border border-zinc-700 hover:bg-zinc-800 text-zinc-300 text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-colors text-center"
                                        >
                                            <Mail className="w-3 h-3" /> Email
                                        </a>
                                        <button
                                          disabled={!talent.portfolioUrl}
                                          onClick={() => {
                                            if (talent.portfolioUrl) window.open(talent.portfolioUrl, '_blank');
                                          }}
                                          className={`flex-1 py-2 border text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${
                                            talent.portfolioUrl
                                              ? 'border-zinc-700 hover:bg-zinc-800 text-zinc-300'
                                              : 'border-zinc-800 text-zinc-600 cursor-not-allowed'
                                          }`}
                                        >
                                            <Instagram className="w-3 h-3" /> Portfolio
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    
                    {/* Mobile Expansion */}
                    <AnimatePresence>
                         {isExpanded && screenSize === 'mobile' && (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4 text-center"
                            >
                                <h3 className="text-2xl font-bold mb-2">{talent.name}</h3>
                                <p className="mb-4 text-sm">{talent.location} • {talent.height} • {talent.age} Yrs</p>
                                <button className="px-6 py-2 bg-white text-black font-bold uppercase text-xs" onClick={(e) => {e.stopPropagation(); setExpandedId(null);}}>Close</button>
                            </motion.div>
                         )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

export const TalentGallery: React.FC = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
  const [filter, setFilter] = useState<Category>('All');
    const [expandedId, setExpandedId] = useState<string | null>(null);
  const screenSize = useScreenSize();
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
    const [talents, setTalents] = useState<Talent[]>([]);
    const [loading, setLoading] = useState(true);

  // Advanced Search State
    const [locationSearch, setLocationSearch] = useState('');
    // Default to a wide age range so all talents are shown until user narrows it
    const [minAge, setMinAge] = useState<number>(0);
    const [maxAge, setMaxAge] = useState<number>(80);
  const [genderFilter, setGenderFilter] = useState<string>('All');
  const [minHeight, setMinHeight] = useState<number>(0);

    const handleBookNow = async (talent: Talent) => {
        try {
            if (!user) {
                window.location.href = '/#/auth';
                return;
            }
            if (user.role !== 'client') {
                showToast('Please login as a client to request a booking.', 'error');
                return;
            }
            const brandProfile = await getBrandProfileByUserId(user.id);
            if (!brandProfile) {
                showToast('Complete your brand profile before sending booking requests.', 'error');
                return;
            }

            const message = window.prompt(
                `Share a brief note for ${talent.name} (optional):`
            );

            await createBookingRequest({
                model_user_id: talent.id,
                client_user_id: user.id,
                brand_profile_id: brandProfile.id,
                message: message || null,
            });

            showToast('Booking request sent to the model.', 'success');
        } catch (err) {
            console.error('Failed to create booking request', err);
            showToast('Could not send booking request. Please try again.', 'error');
        }
    };
  
    useEffect(() => {
        (async () => {
            try {
                const profiles = await listOnlineProfiles();
                const mapped: Talent[] = profiles
                    .filter((p) => p.category === 'model')
                    .map((p) => {
                        const now = new Date();
                        const dob = p.dob ? new Date(p.dob) : null;
                        const age = dob ? now.getFullYear() - dob.getFullYear() - (now < new Date(now.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0) : 0;
                        const feet = p.height_feet ?? 0;
                        const inches = p.height_inches ?? 0;
                        const heightCm = Math.round(feet * 30.48 + inches * 2.54);
                        const heightLabel = feet || inches ? `${feet}'${inches}"` : 'N/A';
                        const sizeLabel = (p as any).size ? String((p as any).size) : 'N/A';
                        const gender: 'Male' | 'Female' | 'Other' =
                            p.gender === 'male' ? 'Male' : p.gender === 'female' ? 'Female' : 'Other';
                        // Derive display category for filters
                        let category: Category = 'Kids';
                        if (age >= 15) {
                            if (gender === 'Male') category = 'Male';
                            else if (gender === 'Female') category = 'Female';
                        }
                        const location = [p.city, p.state, p.country].filter(Boolean).join(', ');
                        const instagramHandle = p.instagram?.[0]?.handle;
                        return {
                            id: p.id as string,
                            name: p.full_name,
                            category,
                            image: '',
                            height: heightLabel,
                            size: sizeLabel,
                            location: location || 'Location TBA',
                            age,
                            gender,
                            heightCm,
                            instagramHandle,
                            portfolioUrl: p.portfolio_folder_link ?? null,
                        };
                    });
                setTalents(mapped);
            } catch (err) {
                console.error('Failed to load talents', err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    useEffect(() => {
        if (talents.length === 0) return;

        let cancelled = false;

        const loadThumbnails = async () => {
            const ids = talents.map((t) => t.id).filter(Boolean);
            const results: Record<string, string> = {};
            const concurrency = 6;
            let cursor = 0;

            const workers = Array.from({ length: Math.min(concurrency, ids.length) }, async () => {
                while (cursor < ids.length) {
                    const id = ids[cursor++];
                    try {
                        const records = await fetchMediaRecords(id);
                        const { profileImage } = deriveMedia(records);
                        if (profileImage?.media_url) results[id] = profileImage.media_url;
                    } catch {
                        // Ignore per-card failures
                    }
                }
            });

            await Promise.all(workers);
            if (cancelled) return;

            setTalents((prev) =>
                prev.map((t) => ({
                    ...t,
                    image: results[t.id] ?? t.image,
                }))
            );
        };

        loadThumbnails();
        return () => {
            cancelled = true;
        };
    }, [talents.length]);

        const filteredTalents = talents.filter(t => {
            // 1. Category Filter (Male, Female, Kids)
            if (filter === 'Male' && !(t.gender === 'Male' && t.age >= 15)) return false;
            if (filter === 'Female' && !(t.gender === 'Female' && t.age >= 15)) return false;
            if (filter === 'Kids' && !(t.age < 15)) return false;
      
      // 2. Advanced Filters (Only if panel is open)
      if (showAdvancedSearch) {
          if (locationSearch && !t.location.toLowerCase().includes(locationSearch.toLowerCase())) return false;
          if (t.age < minAge || t.age > maxAge) return false;
          if (genderFilter !== 'All' && t.gender !== genderFilter) return false;
          if (minHeight > 0 && t.heightCm < minHeight) return false;
      }
      return true;
  });

  useEffect(() => {
      setExpandedId(null);
  }, [filter, filteredTalents.length]);

  return (
    <section className="pt-8 pb-12 bg-zinc-950 relative border-t border-zinc-900 min-h-screen">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-start mb-8">
          <div>
            <h2 className="text-zinc-500 uppercase tracking-widest text-sm mb-4">Discover</h2>
            <h3 className="text-4xl md:text-5xl font-['Syne'] font-bold text-white">Our Talent</h3>
          </div>
          
                            <div className="flex flex-col items-end gap-4 mt-6 md:mt-0">
                            <button
                              onClick={() => navigate('/talents/onboarding')}
                              className="px-6 py-2 rounded-full border border-[#dfcda5] bg-[#dfcda5] text-black text-sm uppercase tracking-wider font-semibold hover:bg-white transition-all duration-300 mb-4"
                            >
                              Submit Profile
                            </button>
                            {/* Category Pills: All / Male / Female / Kids */}
                            <div className="flex gap-4 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                                {(['All', 'Male', 'Female', 'Kids'] as Category[]).map((cat) => (
                <button
                    key={cat}
                    onClick={() => setFilter(cat)}
                    className={`px-6 py-2 rounded-full border text-sm uppercase tracking-wider transition-all duration-300 ${
                    filter === cat 
                        ? 'bg-white text-black border-white' 
                        : 'bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-500 hover:text-zinc-300'
                    }`}
                >
                    {cat}
                </button>
                ))}
              </div>

                            {/* Advanced Search Toggle */}
                            <button 
                                onClick={() => {
                                    // When opening advanced filters, always switch category to All
                                    if (!showAdvancedSearch) {
                                        setFilter('All');
                                    }
                                    setShowAdvancedSearch(!showAdvancedSearch);
                                }}
                                className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-zinc-400 hover:text-white transition-colors"
                            >
                  <Filter className="w-4 h-4" /> 
                  {showAdvancedSearch ? 'Hide Filters' : 'Advanced Filters'}
              </button>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        <AnimatePresence>
            {showAdvancedSearch && (
                <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mb-12"
                >
                    <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl grid grid-cols-1 md:grid-cols-4 gap-6">
                        
                        {/* Location */}
                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                                <Search className="w-3 h-3" /> Location
                            </label>
                            <input 
                                type="text"
                                value={locationSearch}
                                onChange={(e) => setLocationSearch(e.target.value)}
                                placeholder="Search city..."
                                className="w-full bg-zinc-950 border border-zinc-800 text-white p-2 rounded focus:outline-none focus:border-zinc-600 text-sm"
                            />
                        </div>

                        {/* Gender */}
                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-wider text-zinc-500">Gender</label>
                            <select 
                                value={genderFilter}
                                onChange={(e) => setGenderFilter(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 text-white p-2 rounded focus:outline-none focus:border-zinc-600 text-sm"
                            >
                                <option value="All">Any Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                        </div>

                        {/* Age Range */}
                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-wider text-zinc-500">Age: {minAge} - {maxAge}</label>
                            <div className="flex gap-2">
                                <input 
                                    type="number" 
                                    min="0" max="100" 
                                    value={minAge} 
                                    onChange={(e) => setMinAge(Number(e.target.value))}
                                    className="w-1/2 bg-zinc-950 border border-zinc-800 text-white p-2 rounded text-sm"
                                />
                                <input 
                                    type="number" 
                                    min="0" max="100" 
                                    value={maxAge} 
                                    onChange={(e) => setMaxAge(Number(e.target.value))}
                                    className="w-1/2 bg-zinc-950 border border-zinc-800 text-white p-2 rounded text-sm"
                                />
                            </div>
                        </div>

                        {/* Height */}
                         <div className="space-y-2">
                            <label className="text-xs uppercase tracking-wider text-zinc-500">Min Height (cm)</label>
                            <input 
                                type="number" 
                                placeholder="e.g. 170"
                                value={minHeight === 0 ? '' : minHeight}
                                onChange={(e) => setMinHeight(Number(e.target.value))}
                                className="w-full bg-zinc-950 border border-zinc-800 text-white p-2 rounded focus:outline-none focus:border-zinc-600 text-sm"
                            />
                        </div>

                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        <motion.div 
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-32" 
        >
          <AnimatePresence mode='popLayout'>
            {filteredTalents.length > 0 ? (
                filteredTalents.map((talent, index) => (
                <TalentCard 
                    key={talent.id}
                    talent={talent}
                    index={index}
                    isExpanded={expandedId === talent.id}
                    setExpandedId={setExpandedId}
                    screenSize={screenSize}
                    onBookNow={handleBookNow}
                    onOpenProfile={(id) => navigate(`/talents/${id}`)}
                />
                ))
            ) : (
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="col-span-full text-center py-20"
                >
                    <p className="text-zinc-500 text-lg">No talents match your criteria.</p>
                </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
};