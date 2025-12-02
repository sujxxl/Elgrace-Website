import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Instagram, Mail, MapPin, Ruler, Weight, Filter, Search } from 'lucide-react';

type Category = 'All' | 'Models' | 'Actors' | 'Creatives';

interface Talent {
  id: number;
  name: string;
  category: Category;
  image: string;
  height: string;
  weight: string;
  eyes: string;
  hair: string;
  location: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  heightCm: number; // For filtering logic
}

const talentData: Talent[] = [
  { id: 1, name: "Aarav S.", category: "Models", image: "https://picsum.photos/600/800?random=20", height: "6'1\"", heightCm: 185, weight: "75 kg", eyes: "Brown", hair: "Black", location: "Mumbai", age: 24, gender: 'Male' },
  { id: 2, name: "Elena R.", category: "Models", image: "https://picsum.photos/600/800?random=21", height: "5'9\"", heightCm: 175, weight: "58 kg", eyes: "Green", hair: "Blonde", location: "New Delhi", age: 21, gender: 'Female' },
  { id: 3, name: "Vikram J.", category: "Actors", image: "https://picsum.photos/600/800?random=22", height: "5'11\"", heightCm: 180, weight: "70 kg", eyes: "Black", hair: "Black", location: "Mumbai", age: 28, gender: 'Male' },
  { id: 4, name: "Sophie M.", category: "Creatives", image: "https://picsum.photos/600/800?random=23", height: "N/A", heightCm: 0, weight: "N/A", eyes: "N/A", hair: "N/A", location: "Bangalore", age: 30, gender: 'Female' },
  { id: 5, name: "Rohan K.", category: "Models", image: "https://picsum.photos/600/800?random=24", height: "6'0\"", heightCm: 183, weight: "78 kg", eyes: "Brown", hair: "Brown", location: "Delhi", age: 25, gender: 'Male' },
  { id: 6, name: "Priya D.", category: "Actors", image: "https://picsum.photos/600/800?random=25", height: "5'6\"", heightCm: 168, weight: "52 kg", eyes: "Dark Brown", hair: "Black", location: "Mumbai", age: 23, gender: 'Female' },
  { id: 7, name: "Zara L.", category: "Models", image: "https://picsum.photos/600/800?random=26", height: "5'10\"", heightCm: 178, weight: "60 kg", eyes: "Hazel", hair: "Brunette", location: "Goa", age: 22, gender: 'Female' },
  { id: 8, name: "Kabir S.", category: "Creatives", image: "https://picsum.photos/600/800?random=27", height: "N/A", heightCm: 0, weight: "N/A", eyes: "N/A", hair: "N/A", location: "Mumbai", age: 32, gender: 'Male' },
];

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
    setExpandedId: (id: number | null) => void;
    screenSize: 'mobile' | 'tablet' | 'desktop';
}> = ({ talent, index, isExpanded, setExpandedId, screenSize }) => {
    
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
                        <img
                            src={talent.image}
                            alt={talent.name}
                            className={`w-full h-full object-cover transition-all duration-700 ${isExpanded ? 'grayscale-0' : 'grayscale group-hover:grayscale-0'}`}
                        />
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
                                                    <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1"><Weight className="w-3 h-3" /> Weight</p>
                                                    <p className="text-white font-medium">{talent.weight}</p>
                                                </div>
                                                <div>
                                                    <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">Eyes</p>
                                                    <p className="text-white font-medium">{talent.eyes}</p>
                                                </div>
                                                <div>
                                                    <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">Hair</p>
                                                    <p className="text-white font-medium">{talent.hair}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <button className="w-full py-3 bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors">
                                        Book Now
                                    </button>
                                    <div className="flex gap-2">
                                        <button className="flex-1 py-2 border border-zinc-700 hover:bg-zinc-800 text-zinc-300 text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-colors">
                                            <Mail className="w-3 h-3" /> Email
                                        </button>
                                        <button className="flex-1 py-2 border border-zinc-700 hover:bg-zinc-800 text-zinc-300 text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-colors">
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
  const [filter, setFilter] = useState<Category>('All');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const screenSize = useScreenSize();
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);

  // Advanced Search State
  const [locationSearch, setLocationSearch] = useState('');
  const [minAge, setMinAge] = useState<number>(18);
  const [maxAge, setMaxAge] = useState<number>(60);
  const [genderFilter, setGenderFilter] = useState<string>('All');
  const [minHeight, setMinHeight] = useState<number>(0);

  const filteredTalents = talentData.filter(t => {
      // 1. Category Filter
      if (filter !== 'All' && t.category !== filter) return false;
      
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
    <section className="py-24 bg-zinc-950 relative border-t border-zinc-900 min-h-screen">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-8">
          <div>
            <h2 className="text-zinc-500 uppercase tracking-widest text-sm mb-4">Discover</h2>
            <h3 className="text-4xl md:text-5xl font-['Syne'] font-bold text-white">Our Talent</h3>
          </div>
          
          <div className="flex flex-col items-end gap-4 mt-6 md:mt-0">
              {/* Category Pills */}
              <div className="flex gap-4 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                {(['All', 'Models', 'Actors', 'Creatives'] as Category[]).map((cat) => (
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
                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
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
                                    min="18" max="100" 
                                    value={minAge} 
                                    onChange={(e) => setMinAge(Number(e.target.value))}
                                    className="w-1/2 bg-zinc-950 border border-zinc-800 text-white p-2 rounded text-sm"
                                />
                                <input 
                                    type="number" 
                                    min="18" max="100" 
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