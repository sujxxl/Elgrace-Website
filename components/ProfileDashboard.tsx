import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Edit, Plus, MapPin, DollarSign, Calendar } from 'lucide-react';
import { BrandProfile, Casting, BookingRequest, CastingApplication, listBookingRequestsForModel, listBookingRequestsForClient, updateBookingStatus, getBrandProfileByUserId, upsertBrandProfile, createCasting, listCastings, listCastingApplicationsForBrand, getProfileByUserId, ProfileData, updateProfileStatus, deleteCasting } from '../services/ProfileService';
import { buildDriveImageUrls } from '../services/gdrive';
import { deriveMedia, fetchMediaRecords, MediaItem } from '../services/mediaService';

// This dashboard strictly inherits existing theme: black/white base, neutral glass,
// existing buttons, spacing, borders, typography. Accent via outlines (#dfcda5) only.

type TabKey = 'dashboard' | 'profile' | 'castings' | 'bookings' | 'settings';

const EmptyCastingsNotice: React.FC = () => (
  <div className="bg-[#f5e6d3] border border-[#dfcda5] rounded-2xl p-6 backdrop-blur-sm">
    <h3 className="text-xl font-['Syne'] font-bold mb-2">Castings</h3>
    <p className="text-zinc-400 text-sm">
      The casting application system is currently disabled. You can still keep your profile up to date so the Elgrace
      team can match you to opportunities directly.
    </p>
  </div>
);

export const ProfileDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');

  if (!user) {
    return (
      <section className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto bg-[#f5e6d3] border border-[#dfcda5] rounded-2xl p-8 backdrop-blur-sm text-center">
          <h3 className="text-2xl font-['Syne'] font-bold mb-2">Login Required</h3>
          <p className="text-zinc-400">Please log in to access your profile dashboard.</p>
        </div>
      </section>
    );
  }

  const isModel = user.role === 'model';
  const isClient = user.role === 'client';
  const displayName = user.name || user.email || 'Your account';

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'dashboard', label: 'Overview' },
    { key: 'profile', label: isModel ? 'Profile' : 'Brand Profile' },
    { key: 'castings', label: 'Castings' },
    { key: 'bookings', label: 'Bookings' },
    { key: 'settings', label: 'Settings' },
  ];

  return (
    <section className="container mx-auto px-6 py-6">
      <div className="grid grid-cols-1 md:grid-cols-[260px,1fr] gap-6">
        {/* Sidebar */}
        <aside className="bg-[#f5e6d3] border border-[#dfcda5] rounded-2xl p-6 backdrop-blur-sm flex flex-col gap-6">
          {/* User Info */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#f5e6d3]/10 border border-white/20 flex items-center justify-center text-white font-bold">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-semibold text-white">{displayName}</div>
              <div className="text-[11px] uppercase tracking-widest text-zinc-500">
                {isModel ? 'Model' : isClient ? 'Client / Brand' : 'User'}
              </div>
              <div className="text-xs text-zinc-500">{user.email}</div>
            </div>
          </div>

          {/* Tabs */}
          <nav className="space-y-2 pt-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`w-full flex items-center justify-between px-4 py-2 rounded-xl border text-xs uppercase tracking-widest ${
                  activeTab === tab.key
                    ? 'border-[#dfcda5] bg-[#f5e6d3]/10 text-white'
                    : 'border-white/10 bg-transparent text-zinc-300 hover:border-[#dfcda5]'
                }`}
              >
                <span>{tab.label}</span>
                {activeTab === tab.key && <CheckCircle2 className="w-4 h-4 text-white/70" />}
              </button>
            ))}
          </nav>

          {isModel && (
            <button
              type="button"
              onClick={() => navigate('/profile/edit')}
              className="mt-4 px-4 py-2 rounded-xl border-2 border-[#dfcda5] text-white text-xs uppercase tracking-widest"
            >
              Edit Full Profile
            </button>
          )}
        </aside>

        {/* Main content */}
        <div className="space-y-6">
          {isModel && (
            <>
              {activeTab === 'dashboard' && (
                <>
                  <ModelProfileView />
                  <ModelBookings />
                </>
              )}
              {activeTab === 'profile' && <ModelProfileView />}
              {activeTab === 'castings' && <EmptyCastingsNotice />}
              {activeTab === 'bookings' && <ModelBookings />}
              {activeTab === 'settings' && <SettingsPanel user={{ email: user.email }} />}
            </>
          )}

          {isClient && (
            <>
              {activeTab === 'dashboard' && (
                <ClientDashboard
                  onEditBrand={() => setActiveTab('profile')}
                  onAddCasting={() => setActiveTab('castings')}
                />
              )}
              {activeTab === 'profile' && <ClientBrandProfile />}
              {activeTab === 'castings' && <ClientCastingsList />}
              {activeTab === 'bookings' && <ClientBookings />}
              {activeTab === 'settings' && <SettingsPanel user={{ email: user.email }} />}
            </>
          )}

          {!isModel && !isClient && (
            <div className="bg-[#f5e6d3] border border-[#dfcda5] rounded-2xl p-6 backdrop-blur-sm text-zinc-300">
              Your account does not have a model or client role yet.
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

/* PROFILE STEPPER */
type CompletionMap = {
  personal: boolean;
  professional: boolean;
  measurements: boolean;
  media: boolean;
};

type EditSectionKey = 'personal-info' | 'professional-info' | 'measurements' | 'photos-media';

const ProfileStepper: React.FC<{
  completion: CompletionMap;
  current: keyof CompletionMap;
  onGoTo: (section: EditSectionKey) => void;
}> = ({ completion, current, onGoTo }) => {
  const steps: Array<{
    id: keyof CompletionMap;
    label: string;
    section: EditSectionKey;
  }> = [
    { id: 'personal', label: 'Personal Information', section: 'personal-info' },
    { id: 'professional', label: 'Professional Information', section: 'professional-info' },
    { id: 'measurements', label: 'Measurements', section: 'measurements' },
    { id: 'media', label: 'Photos / Media', section: 'photos-media' },
  ];

  const allComplete = steps.every((s) => completion[s.id]);
  const nextSection =
    steps.find((s) => !completion[s.id])?.section || 'personal-info';

  return (
    <div className="space-y-3">
      {steps.map((s) => {
        const isCompleted = completion[s.id];
        const isCurrent = s.id === current || (allComplete && s.id === 'media');
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onGoTo(s.section)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border text-sm text-left
              ${isCurrent ? 'border-[#dfcda5] bg-[#f5e6d3]/10 text-white' : 'border-white/10 bg-[#f5e6d3]/5 text-zinc-300 hover:border-[#dfcda5]'}
            `}
          >
            <span>{s.label}</span>
            {isCompleted && <CheckCircle2 className="w-4 h-4 text-white/70" />}
          </button>
        );
      })}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => onGoTo(nextSection)}
          className="px-4 py-2 rounded-xl border-2 border-[#dfcda5] text-white text-xs uppercase tracking-widest"
        >
          {allComplete ? 'Review Profile' : 'Continue'}
        </button>
        <button
          type="button"
          onClick={() => onGoTo('personal-info')}
          className="px-4 py-2 rounded-xl border border-white/10 text-zinc-300 hover:border-[#dfcda5] text-xs uppercase tracking-widest"
        >
          Edit Manually
        </button>
      </div>
    </div>
  );
};

/* MODEL PROFILE VIEW */
const ModelProfileView: React.FC = () => {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mediaRecords, setMediaRecords] = useState<MediaItem[]>([]);

  const derivedMedia = useMemo(() => deriveMedia(mediaRecords), [mediaRecords]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const data = await getProfileByUserId(user.id);
        setProfile(data);
        
        // Fetch media from model_media table (VPS backend)
        const records = await fetchMediaRecords(user.id, session?.access_token);
        setMediaRecords(records);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, session?.access_token]);

  const computeAge = (dob?: string | null) => {
    if (!dob) return null;
    const d = new Date(dob);
    if (Number.isNaN(d.getTime())) return null;
    const today = new Date();
    const age =
      today.getFullYear() -
      d.getFullYear() -
      (today < new Date(today.getFullYear(), d.getMonth(), d.getDate()) ? 1 : 0);
    return age;
  };

  const age = computeAge(profile?.dob);

  if (loading) {
    return (
      <div className="bg-[#f5e6d3] border border-[#dfcda5] rounded-2xl p-6 backdrop-blur-sm text-zinc-400">Loading your profile...</div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-[#f5e6d3] border border-[#dfcda5] rounded-2xl p-6 backdrop-blur-sm">
        <div className="text-zinc-400">Your model profile is not completed yet.</div>
        <a
          href="/talents/onboarding"
          className="inline-block mt-3 px-4 py-2 rounded-xl border-2 border-[#dfcda5] text-white text-xs uppercase tracking-widest"
        >
          Complete Profile
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header with Image */}
      <div className="bg-[#f5e6d3] border border-[#dfcda5] rounded-2xl p-6 backdrop-blur-sm">
        <div className="flex items-center gap-6">
          <div className="flex-shrink-0">
            {derivedMedia.profileImage ? (
              <img
                src={derivedMedia.profileImage.media_url}
                alt={profile.full_name}
                className="w-32 h-40 object-cover rounded-lg border border-white/10"
                onError={(e) => {
                  console.error('Failed to load profile image:', e.currentTarget.src);
                }}
              />
            ) : (
              <div className="w-32 h-40 rounded-lg border border-white/10 bg-[#f5e6d3]/5 flex items-center justify-center text-zinc-500 text-sm">
                No photo
              </div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-3xl font-['Syne'] font-bold text-white mb-2">{profile.full_name}</h3>
            <div className="space-y-1 text-zinc-300 text-sm">
              {age && <div>Age: <span className="font-medium">{age}</span></div>}
              {profile.nationality && <div>Nationality: <span className="font-medium">{profile.nationality}</span></div>}
              {profile.city && <div>Location: <span className="font-medium">{[profile.city, profile.state, profile.country].filter(Boolean).join(', ')}</span></div>}
              {profile.gender && <div>Gender: <span className="font-medium capitalize">{profile.gender}</span></div>}
            </div>
            <button 
              onClick={() => navigate('/profile/edit?section=photos-media')} 
              className="mt-4 px-4 py-2 rounded-xl border-2 border-[#dfcda5] text-white hover:bg-[#f5e6d3]/10 flex items-center gap-2 text-xs uppercase tracking-widest font-semibold"
            >
              <Edit className="w-4 h-4" /> Update Photos
            </button>
          </div>
        </div>
      </div>

      {/* Media Card: cover + gallery */}
      <div className="bg-[#f5e6d3] border border-[#dfcda5] rounded-2xl p-6 backdrop-blur-sm">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-['Syne'] font-bold">Photos / Media</h4>
          <button onClick={() => navigate('/profile/edit?section=photos-media')} className="px-3 py-2 rounded-xl border border-white/10 text-zinc-300 hover:border-[#dfcda5] flex items-center gap-2 text-xs uppercase tracking-widest">
            <Edit className="w-4 h-4" /> Edit
          </button>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <div className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Cover Photo</div>
            {derivedMedia.profileImage ? (
              <img
                src={derivedMedia.profileImage.media_url}
                alt="Cover"
                className="w-full aspect-[3/4] object-cover rounded-lg border border-white/10"
                onError={(e) => {
                  console.error('Failed to load cover image:', e.currentTarget.src);
                }}
              />
            ) : (
              <div className="w-full aspect-[3/4] rounded-lg border border-white/10 bg-[#f5e6d3]/5 flex items-center justify-center text-zinc-500 text-sm">
                No cover set
              </div>
            )}
          </div>
          <div className="md:col-span-1">
            <div className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Intro Video</div>
            {derivedMedia.introVideo ? (
              <div className="w-full bg-black rounded-lg overflow-hidden aspect-video border border-white/10">
                <video
                  src={derivedMedia.introVideo.media_url}
                  controls
                  className="w-full h-full"
                  onError={(e) => {
                    console.error('Failed to load intro video:', e.currentTarget.src);
                  }}
                />
              </div>
            ) : (
              <div className="w-full aspect-video rounded-lg border border-white/10 bg-[#f5e6d3]/5 flex items-center justify-center text-zinc-500 text-sm">
                No video set
              </div>
            )}
          </div>
          <div className="md:col-span-1">
            <div className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Portfolio</div>
            {derivedMedia.portfolio.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {derivedMedia.portfolio.slice(0, 4).map((item) => (
                  <img
                    key={item.id}
                    src={item.media_url}
                    alt="Portfolio"
                    className="w-full aspect-square object-cover rounded border border-white/10"
                  />
                ))}
                {derivedMedia.portfolio.length > 4 && (
                  <div className="col-span-2 text-center text-xs text-zinc-500 mt-1">
                    +{derivedMedia.portfolio.length - 4} more
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-full min-h-[120px] rounded-lg border border-white/10 bg-[#f5e6d3]/5 flex items-center justify-center text-zinc-500 text-sm">
                No portfolio set
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-[#f5e6d3] border border-[#dfcda5] rounded-2xl p-6 backdrop-blur-sm">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-['Syne'] font-bold">Personal Information</h4>
          <button onClick={() => navigate('/profile/edit?section=personal-info')} className="px-3 py-2 rounded-xl border border-white/10 text-zinc-300 hover:border-[#dfcda5] flex items-center gap-2 text-xs uppercase tracking-widest">
            <Edit className="w-4 h-4" /> Edit
          </button>
        </div>
        <div className="grid md:grid-cols-2 gap-4 text-zinc-300">
          <div><span className="text-zinc-500 text-xs uppercase">Full Name</span><div className="font-medium">{profile.full_name}</div></div>
          <div><span className="text-zinc-500 text-xs uppercase">Email</span><div className="font-medium">{profile.email}</div></div>
          <div><span className="text-zinc-500 text-xs uppercase">Phone</span><div className="font-medium">{profile.phone}</div></div>
          <div><span className="text-zinc-500 text-xs uppercase">Age</span><div className="font-medium">{age != null ? `${age} yrs` : '—'}</div></div>
          <div><span className="text-zinc-500 text-xs uppercase">Gender</span><div className="font-medium">{profile.gender}</div></div>
          <div><span className="text-zinc-500 text-xs uppercase">Nationality</span><div className="font-medium">{profile.nationality || '—'}</div></div>
          <div className="md:col-span-2"><span className="text-zinc-500 text-xs uppercase">Location</span><div className="font-medium">{[profile.city, profile.state, profile.country].filter(Boolean).join(', ')}</div></div>
        </div>
      </div>

      {/* Professional */}
      <div className="bg-[#f5e6d3] border border-[#dfcda5] rounded-2xl p-6 backdrop-blur-sm">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-['Syne'] font-bold">Professional Information</h4>
          <button onClick={() => navigate('/profile/edit?section=professional-info')} className="px-3 py-2 rounded-xl border border-white/10 text-zinc-300 hover:border-[#dfcda5] flex items-center gap-2 text-xs uppercase tracking-widest">
            <Edit className="w-4 h-4" /> Edit
          </button>
        </div>
        <div className="grid md:grid-cols-2 gap-4 text-zinc-300">
          <div><span className="text-zinc-500 text-xs uppercase">Experience</span><div className="font-medium">{profile.experience_level || '—'}</div></div>
          <div><span className="text-zinc-500 text-xs uppercase">Open to Travel</span><div className="font-medium">{profile.open_to_travel ? 'Yes' : profile.open_to_travel === false ? 'No' : '—'}</div></div>
          <div className="md:col-span-2"><span className="text-zinc-500 text-xs uppercase">Languages</span><div className="font-medium">{profile.languages?.join(', ') || '—'}</div></div>
          <div className="md:col-span-2"><span className="text-zinc-500 text-xs uppercase">Skills</span><div className="font-medium">{profile.skills?.join(', ') || '—'}</div></div>
          <div className="md:col-span-2"><span className="text-zinc-500 text-xs uppercase">Ramp Walk</span><div className="font-medium">{profile.ramp_walk_experience ? (profile.ramp_walk_description || 'Yes') : (profile.ramp_walk_experience === false ? 'No' : '—')}</div></div>
        </div>
      </div>

      {/* Measurements */}
      <div className="bg-[#f5e6d3] border border-[#dfcda5] rounded-2xl p-6 backdrop-blur-sm">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-['Syne'] font-bold">Measurements & Rates</h4>
          <button onClick={() => navigate('/profile/edit?section=measurements')} className="px-3 py-2 rounded-xl border border-white/10 text-zinc-300 hover:border-[#dfcda5] flex items-center gap-2 text-xs uppercase tracking-widest">
            <Edit className="w-4 h-4" /> Edit
          </button>
        </div>
        <div className="grid md:grid-cols-3 gap-4 text-zinc-300">
          <div><span className="text-zinc-500 text-xs uppercase">Height</span><div className="font-medium">{profile.height_feet && profile.height_inches ? `${profile.height_feet}' ${profile.height_inches}"` : '—'}</div></div>
          <div><span className="text-zinc-500 text-xs uppercase">Bust/Chest</span><div className="font-medium">{profile.bust_chest ? `${profile.bust_chest}"` : '—'}</div></div>
          <div><span className="text-zinc-500 text-xs uppercase">Waist</span><div className="font-medium">{profile.waist ? `${profile.waist}"` : '—'}</div></div>
          <div><span className="text-zinc-500 text-xs uppercase">Hips</span><div className="font-medium">{profile.hips ? `${profile.hips}"` : '—'}</div></div>
          <div><span className="text-zinc-500 text-xs uppercase">Size</span><div className="font-medium">{(profile as any).size || '—'}</div></div>
          <div><span className="text-zinc-500 text-xs uppercase">Shoe Size</span><div className="font-medium">{profile.shoe_size || '—'}</div></div>
          <div><span className="text-zinc-500 text-xs uppercase">Half Day Rate</span><div className="font-medium">{profile.min_budget_half_day ? `₹${profile.min_budget_half_day}` : '—'}</div></div>
          <div><span className="text-zinc-500 text-xs uppercase">Full Day Rate</span><div className="font-medium">{profile.min_budget_full_day ? `₹${profile.min_budget_full_day}` : '—'}</div></div>
        </div>
      </div>
    </div>
  );
};

/* MODEL BOOKINGS */
const ModelBookings: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const data = await listBookingRequestsForModel(user.id);
        setBookings(data);
      } catch (err) {
        console.error('Failed to load booking requests', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const handleStatusChange = async (booking: BookingRequest, status: 'approved' | 'rejected') => {
    if (!booking.id) return;
    try {
      const updated = await updateBookingStatus(booking.id, status);
      setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      showToast(`Booking ${status === 'approved' ? 'approved' : 'rejected'}.`, 'success');
    } catch (err) {
      console.error('Failed to update booking status', err);
      showToast('Could not update booking status.', 'error');
    }
  };

  return (
    <div className="bg-[#f5e6d3] border border-[#dfcda5] rounded-2xl p-6 backdrop-blur-sm">
      <h4 className="text-lg font-['Syne'] font-bold mb-4">Booking Requests</h4>
      {loading ? (
        <div className="text-zinc-400 text-sm">Loading booking requests...</div>
      ) : bookings.length === 0 ? (
        <div className="text-zinc-400 text-sm">No booking requests yet.</div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div key={b.id} className="bg-[#f5e6d3] border border-[#dfcda5] rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <div className="text-sm text-zinc-300">Booking from brand</div>
                {b.message && <div className="text-xs text-zinc-400 mt-1 max-w-md">{b.message}</div>}
                <div className="text-[10px] uppercase tracking-widest text-zinc-500 mt-2">
                  Status: {b.status ?? 'pending'}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={b.status === 'approved'}
                  onClick={() => handleStatusChange(b, 'approved')}
                  className={`px-3 py-2 rounded-xl border text-xs uppercase tracking-widest font-semibold ${
                    b.status === 'approved'
                      ? 'border-emerald-900 text-emerald-700 cursor-not-allowed'
                      : 'border-emerald-400 text-emerald-200 hover:bg-emerald-900/20'
                  }`}
                >
                  Approve
                </button>
                <button
                  type="button"
                  disabled={b.status === 'rejected'}
                  onClick={() => handleStatusChange(b, 'rejected')}
                  className={`px-3 py-2 rounded-xl border text-xs uppercase tracking-widest font-semibold ${
                    b.status === 'rejected'
                      ? 'border-red-900 text-red-700 cursor-not-allowed'
                      : 'border-red-400 text-red-200 hover:bg-red-900/20'
                  }`}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* CLIENT DASHBOARD */
const ClientDashboard: React.FC<{ onEditBrand: () => void; onAddCasting: () => void }> = ({ onEditBrand, onAddCasting }) => {
  const { user } = useAuth();
  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);
  const [recentCastings, setRecentCastings] = useState<Casting[]>([]);
  const [applications, setApplications] = useState<CastingApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const profile = await getBrandProfileByUserId(user.id);
        setBrandProfile(profile);
        
        const castings = await listCastings();
        const userCastings = castings.filter(c => c.user_id === user.id).slice(0, 3);
        setRecentCastings(userCastings);

        const apps = await listCastingApplicationsForBrand(user.id);
        setApplications(apps);
      } catch (err) {
        console.error('Failed to load brand data', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  return (
    <div className="bg-[#f5e6d3] border border-[#dfcda5] rounded-2xl p-6 backdrop-blur-sm">
      <h3 className="text-2xl font-['Syne'] font-bold mb-4">Brand Overview</h3>
      {loading ? (
        <div className="text-zinc-400">Loading brand profile...</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-[#f5e6d3] border border-[#dfcda5] rounded-xl p-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg bg-[#f5e6d3]/10 border border-white/20 flex items-center justify-center text-white font-bold text-xl">
                {brandProfile?.brand_name?.charAt(0)?.toUpperCase() || 'B'}
              </div>
              <div>
                <div className="font-semibold">{brandProfile?.brand_name || 'Brand Name'}</div>
                <div className="text-xs text-zinc-500">
                  {brandProfile?.website_url && (
                    <a href={brandProfile.website_url} target="_blank" rel="noopener noreferrer" className="hover:text-[#dfcda5] transition-colors">
                      {brandProfile.website_url.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                  {brandProfile?.website_url && brandProfile?.instagram_handle && ' • '}
                  {brandProfile?.instagram_handle && (
                    <a href={`https://instagram.com/${brandProfile.instagram_handle.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="hover:text-[#dfcda5] transition-colors">
                      {brandProfile.instagram_handle}
                    </a>
                  )}
                  {!brandProfile?.website_url && !brandProfile?.instagram_handle && 'Complete your profile'}
                </div>
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button onClick={onEditBrand} className="px-4 py-2 rounded-xl border-2 border-[#dfcda5] text-white">Edit Brand Profile</button>
              <button onClick={onAddCasting} className="px-4 py-2 rounded-xl border-2 border-[#dfcda5] text-white flex items-center gap-2"><Plus className="w-4 h-4"/> Add New Casting</button>
            </div>
          </div>
          <div className="bg-[#f5e6d3] border border-[#dfcda5] rounded-xl p-4">
            <h4 className="text-sm uppercase tracking-widest text-zinc-500 mb-2">Recent Castings</h4>
            {recentCastings.length === 0 ? (
              <div className="text-zinc-400 text-sm">No castings posted yet.</div>
            ) : (
              <div className="space-y-2">
                {recentCastings.map((casting) => (
                  <div key={casting.id} className="text-sm">
                    <div className="text-white font-medium">{casting.title}</div>
                    <div className="text-xs text-zinc-500">
                      {casting.status === 'open' ? '🟢 Open' : casting.status === 'closed' ? '🔴 Closed' : '🟡 ' + casting.status}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="md:col-span-2 bg-[#f5e6d3] border border-[#dfcda5] rounded-xl p-4 mt-4">
            <h4 className="text-sm uppercase tracking-widest text-zinc-500 mb-2">Recent Applications To Your Castings</h4>
            {applications.length === 0 ? (
              <div className="text-zinc-400 text-sm">No applications yet.</div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {applications.slice(0, 5).map((app) => {
                  const c = app.casting as any as Casting | undefined;
                  return (
                    <div key={app.id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-[#f5e6d3] border border-[#dfcda5]">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-white truncate">{c?.title ?? 'Casting'}</div>
                        <div className="text-[11px] text-zinc-500 mt-1">Applicant: {app.model_user_id.slice(0, 8)}…</div>
                        <div className="text-[11px] text-zinc-500 mt-1">Status: {app.status ?? 'applied'}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* CLIENT BOOKINGS (BRAND SIDE) */
const ClientBookings: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const data = await listBookingRequestsForClient(user.id);
        setBookings(data);
      } catch (err) {
        console.error('Failed to load bookings for client', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const handleCancelBooking = async (booking: BookingRequest) => {
    if (!booking.id) return;
    try {
      const updated = await updateBookingStatus(booking.id, 'cancelled');
      setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      showToast('Booking request cancelled.', 'success');
    } catch (err) {
      console.error('Failed to cancel booking', err);
      showToast('Could not cancel booking.', 'error');
    }
  };

  return (
    <div className="bg-[#f5e6d3] border border-[#dfcda5] rounded-2xl p-6 backdrop-blur-sm">
      <h4 className="text-lg font-['Syne'] font-bold mb-4">Your Booking Requests</h4>
      {loading ? (
        <div className="text-zinc-400 text-sm">Loading booking requests...</div>
      ) : bookings.length === 0 ? (
        <div className="text-zinc-400 text-sm">You have not requested any bookings yet.</div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div key={b.id} className="bg-[#f5e6d3] border border-[#dfcda5] rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <div className="text-sm text-zinc-300">Request to a model</div>
                {b.message && <div className="text-xs text-zinc-400 mt-1 max-w-md">{b.message}</div>}
                <div className="text-[10px] uppercase tracking-widest text-zinc-500 mt-2">
                  Status: {b.status ?? 'pending'}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={b.status === 'cancelled'}
                  onClick={() => handleCancelBooking(b)}
                  className={`px-3 py-2 rounded-xl border text-xs uppercase tracking-widest font-semibold ${
                    b.status === 'cancelled'
                      ? 'border-red-900 text-red-700 cursor-not-allowed'
                      : 'border-red-400 text-red-200 hover:bg-red-900/20'
                  }`}
                >
                  Cancel Request
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* CLIENT BRAND PROFILE */
const ClientBrandProfile: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState<BrandProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const existing = await getBrandProfileByUserId(user.id);
        setForm(
          existing ?? {
            user_id: user.id,
            brand_name: '',
            contact_email: user.email,
            website_url: '',
            instagram_handle: '',
            brand_description: '',
          }
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const handleSave = async () => {
    if (!form || !user) return;
    setSaving(true);
    try {
      const payload: BrandProfile = { ...form, user_id: user.id };
      const saved = await upsertBrandProfile(payload);
      setForm(saved);
      showToast('✨ Brand profile saved successfully!');
    } catch (err: any) {
      alert(`Save failed: ${err.message ?? err}`);
    }
    setSaving(false);
  };

  if (!form || loading) {
    return (
      <div className="bg-[#f5e6d3] border border-[#dfcda5] rounded-2xl p-6 backdrop-blur-sm text-zinc-400">Loading brand profile...</div>
    );
  }

  return (
    <div className="bg-[#f5e6d3] border border-[#dfcda5] rounded-2xl p-6 backdrop-blur-sm">
      <h4 className="text-lg font-['Syne'] font-bold mb-4">Brand Profile</h4>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <label className="block text-xs uppercase tracking-widest text-zinc-500">Brand Name</label>
          <input
            required
            className="w-full bg-[#e8d4bd] border border-[#dfcda5] p-3 text-white focus:outline-none focus:border-white/50"
            placeholder="Your Brand"
            value={form.brand_name}
            onChange={(e) => setForm({ ...form, brand_name: e.target.value })}
          />
        </div>
        <div className="space-y-3">
          <label className="block text-xs uppercase tracking-widest text-zinc-500">Website URL</label>
          <input
            className="w-full bg-[#e8d4bd] border border-[#dfcda5] p-3 text-white focus:outline-none focus:border-white/50"
            placeholder="https://"
            value={form.website_url ?? ''}
            onChange={(e) => setForm({ ...form, website_url: e.target.value })}
          />
        </div>
        <div className="space-y-3">
          <label className="block text-xs uppercase tracking-widest text-zinc-500">Instagram Handle</label>
          <input
            className="w-full bg-[#e8d4bd] border border-[#dfcda5] p-3 text-white focus:outline-none focus:border-white/50"
            placeholder="@handle"
            value={form.instagram_handle ?? ''}
            onChange={(e) => setForm({ ...form, instagram_handle: e.target.value })}
          />
        </div>
        <div className="space-y-3 md:col-span-2">
          <label className="block text-xs uppercase tracking-widest text-zinc-500">Contact Email</label>
          <input
            className="w-full bg-[#e8d4bd] border border-[#dfcda5] p-3 text-white focus:outline-none focus:border-white/50"
            placeholder="contact@brand.com"
            value={form.contact_email ?? ''}
            onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
          />
        </div>
        <div className="space-y-3 md:col-span-2">
          <label className="block text-xs uppercase tracking-widest text-zinc-500">Brand Description</label>
          <textarea
            className="w-full bg-[#e8d4bd] border border-[#dfcda5] p-3 text-white focus:outline-none focus:border-white/50 h-28"
            placeholder="What does your brand do?"
            value={form.brand_description ?? ''}
            onChange={(e) => setForm({ ...form, brand_description: e.target.value })}
          />
        </div>
      </div>
      <div className="pt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-3 rounded-2xl bg-gradient-to-br from-zinc-800 via-zinc-700 to-zinc-600 text-white font-bold uppercase tracking-widest border-2 border-[#dfcda5]"
        >
          {saving ? 'Saving...' : 'Save Brand Profile'}
        </button>
      </div>
    </div>
  );
};

/* CLIENT CASTINGS LIST */
const ClientCastingsList: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [castings, setCastings] = useState<Casting[]>([]);
  const [applicationsByCasting, setApplicationsByCasting] = useState<Record<string, CastingApplication[]>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newCasting, setNewCasting] = useState({
    title: '',
    description: '',
    location: '',
    budget_min: '',
    budget_max: '',
    application_deadline: '',
    requirements: ''
  });

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const data = await listCastings();
        const userCastings = data.filter(c => c.user_id === user.id);
        setCastings(userCastings);

        const apps = await listCastingApplicationsForBrand(user.id);
        const grouped: Record<string, CastingApplication[]> = {};
        apps.forEach((app) => {
          const cid = app.casting_id;
          if (!grouped[cid]) grouped[cid] = [];
          grouped[cid].push(app);
        });
        setApplicationsByCasting(grouped);
      } catch (err) {
        console.error('Failed to load castings', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const handlePostCasting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
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
      });
      setCastings([created, ...castings]);
      setIsModalOpen(false);
      setNewCasting({ title: '', description: '', location: '', budget_min: '', budget_max: '', application_deadline: '', requirements: '' });
      showToast('🎬 Casting posted successfully!');
    } catch (err: any) {
      alert(`Failed to post casting: ${err.message ?? err}`);
    }
  };

  const formatBudget = (min?: number | null, max?: number | null) => {
    if (!min && !max) return 'Budget TBA';
    if (min && max) return `₹${min.toLocaleString()} - ₹${max.toLocaleString()}`;
    if (min) return `From ₹${min.toLocaleString()}`;
    return `Up to ₹${max?.toLocaleString()}`;
  };

  const handleDeleteCasting = async (id: string) => {
    const confirmDelete = window.confirm('Delete this casting? This action cannot be undone.');
    if (!confirmDelete) return;
    try {
      await deleteCasting(id);
      setCastings((prev) => prev.filter((c) => c.id !== id));
      showToast('Casting deleted.', 'success');
    } catch (err) {
      console.error('Failed to delete casting', err);
      showToast('Could not delete casting.', 'error');
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="bg-[#f5e6d3] border border-[#dfcda5] rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="text-lg font-['Syne'] font-bold">Your Castings</h4>
              <p className="text-zinc-400 text-sm mt-1">Create clear briefs with budget range, deadlines, and must-have requirements.</p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-[#dfcda5] text-white hover:bg-[#f5e6d3]/5 transition-colors text-xs uppercase tracking-widest font-bold"
            >
              <Plus className="w-4 h-4" /> Create Casting
            </button>
          </div>
          
          {loading ? (
            <div className="text-zinc-400 text-sm">Loading your castings...</div>
          ) : castings.length === 0 ? (
            <div className="text-zinc-400 text-sm mt-4">No castings posted yet. Create your first casting to get started!</div>
          ) : (
            <div className="space-y-4 mt-6">
              {castings.map((casting) => (
                <div
                  key={casting.id}
                  className="bg-[#f5e6d3] border border-[#dfcda5] rounded-xl p-4 hover:border-[#c9a961] transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h5 className="text-white font-semibold text-lg">{casting.title}</h5>
                      <span className="text-xs text-zinc-500 uppercase tracking-wider">
                        {casting.status === 'open' ? '🟢 Open' : casting.status === 'closed' ? '🔴 Closed' : '🟡 ' + casting.status}
                      </span>
                    </div>
                    {casting.id && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCasting(casting.id as string)}
                        className="px-3 py-1 rounded-xl border border-red-400 text-red-200 text-[11px] uppercase tracking-widest hover:bg-red-900/20"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  <p className="text-zinc-400 text-sm mb-3">{casting.description}</p>
                  <div className="flex flex-wrap gap-4 text-xs text-zinc-400">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {casting.location || 'Location TBA'}
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {formatBudget(casting.budget_min, casting.budget_max)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {casting.application_deadline || 'No deadline'}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-zinc-600 inline-block" />
                      {applicationsByCasting[casting.id as string]?.length ?? 0} applicants
                    </div>
                  </div>
                  {applicationsByCasting[casting.id as string]?.length ? (
                    <div className="mt-3 border-t border-[#dfcda5] pt-3 text-xs text-zinc-300">
                      <div className="mb-1 font-semibold">Recent Applicants</div>
                      <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                        {applicationsByCasting[casting.id as string]
                          .slice(0, 3)
                          .map((app) => (
                            <div key={app.id} className="flex items-center justify-between gap-2">
                              <span className="truncate">Model {app.model_user_id.slice(0, 8)}…</span>
                              <span className="capitalize text-zinc-400">{app.status ?? 'applied'}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Casting Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-zinc-900 w-full max-w-2xl p-8 rounded-xl border border-[#dfcda5] shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-2xl font-bold font-['Syne'] mb-6">Create New Casting</h3>
              <form onSubmit={handlePostCasting} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">Project Title</label>
                  <input
                    required
                    value={newCasting.title}
                    onChange={(e) => setNewCasting({ ...newCasting, title: e.target.value })}
                    className="w-full bg-[#e8d4bd] border border-[#dfcda5] p-3 text-white focus:outline-none focus:border-white/50"
                    placeholder="e.g. Winter Campaign 2024"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">Description</label>
                  <textarea
                    required
                    value={newCasting.description}
                    onChange={(e) => setNewCasting({ ...newCasting, description: e.target.value })}
                    className="w-full bg-[#e8d4bd] border border-[#dfcda5] p-3 text-white focus:outline-none focus:border-white/50 h-32"
                    placeholder="Describe the role and project..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">Location</label>
                    <input
                      required
                      value={newCasting.location}
                      onChange={(e) => setNewCasting({ ...newCasting, location: e.target.value })}
                      className="w-full bg-[#e8d4bd] border border-[#dfcda5] p-3 text-white focus:outline-none focus:border-white/50"
                      placeholder="City, Country"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">Budget Min</label>
                      <input
                        type="number"
                        value={newCasting.budget_min}
                        onChange={(e) => setNewCasting({ ...newCasting, budget_min: e.target.value })}
                        className="w-full bg-[#e8d4bd] border border-[#dfcda5] p-3 text-white focus:outline-none focus:border-white/50"
                        placeholder="30000"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">Budget Max</label>
                      <input
                        type="number"
                        value={newCasting.budget_max}
                        onChange={(e) => setNewCasting({ ...newCasting, budget_max: e.target.value })}
                        className="w-full bg-[#e8d4bd] border border-[#dfcda5] p-3 text-white focus:outline-none focus:border-white/50"
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
                    onChange={(e) => setNewCasting({ ...newCasting, requirements: e.target.value })}
                    className="w-full bg-[#e8d4bd] border border-[#dfcda5] p-3 text-white focus:outline-none focus:border-white/50"
                    placeholder="e.g. Female, 20-25, 5'8+"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">Application Deadline</label>
                  <input
                    type="date"
                    value={newCasting.application_deadline}
                    onChange={(e) => setNewCasting({ ...newCasting, application_deadline: e.target.value })}
                    className="w-full bg-[#e8d4bd] border border-[#dfcda5] p-3 text-white focus:outline-none focus:border-white/50"
                  />
                </div>

                <div className="pt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 border-2 border-[#dfcda5] hover:bg-[#f5e6d3]/5 transition-colors uppercase tracking-widest font-bold text-xs rounded-xl backdrop-blur-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 text-white uppercase tracking-widest font-bold text-xs rounded-2xl bg-gradient-to-br from-zinc-800 via-zinc-700 to-zinc-600 hover:from-zinc-700 hover:to-zinc-500 border-2 border-[#dfcda5] backdrop-blur-md"
                  >
                    Post Casting
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

/* SETTINGS */
const SettingsPanel: React.FC<{ user: { email: string | null; } }> = ({ user }) => {
  const { verifyAndUpdatePassword } = useAuth();
  const { showToast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updating, setUpdating] = useState(false);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!currentPassword.trim()) {
      showToast('⚠️ Please enter your current password');
      return;
    }
    
    if (!newPassword.trim()) {
      showToast('⚠️ Please enter a new password');
      return;
    }
    
    if (newPassword.length < 6) {
      showToast('⚠️ Password must be at least 6 characters');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      showToast('⚠️ Passwords do not match');
      return;
    }
    
    if (currentPassword === newPassword) {
      showToast('⚠️ New password must be different from current password');
      return;
    }
    
    setUpdating(true);
    const res = await verifyAndUpdatePassword(currentPassword, newPassword);
    setUpdating(false);
    
    if (res.success) {
      showToast('🔐 Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      showToast(res.message ?? '❌ Password update failed');
    }
  };

  return (
    <div className="rounded-2xl p-6 space-y-6">
      <div>
        <h4 className="text-lg font-['Syne'] font-bold mb-2">Email Management</h4>
        <p className="text-zinc-400 text-sm mb-3">To update your registered email, please contact support.</p>
        <div className="flex items-center gap-3">
          <span className="text-white">{user.email || 'No email'}</span>
          <span className="text-xs uppercase tracking-widest text-emerald-400">Verified</span>
        </div>
      </div>
      <div className="pt-2 border-t border-[#dfcda5]">
        <h4 className="text-lg font-['Syne'] font-bold mb-2">Change Password</h4>
        <p className="text-zinc-400 text-sm mb-4">Enter your current password to verify your identity, then set a new password (minimum 6 characters).</p>
        <form onSubmit={handlePasswordUpdate}>
          <div className="space-y-3">
            <input
              type="password"
              placeholder="Current Password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full bg-[#e8d4bd] border border-[#dfcda5] p-3 text-white focus:outline-none focus:border-white/50 placeholder:text-zinc-600"
            />
            <div className="grid md:grid-cols-2 gap-3">
              <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                required
                className="w-full bg-[#e8d4bd] border border-[#dfcda5] p-3 text-white focus:outline-none focus:border-white/50 placeholder:text-zinc-600"
              />
              <input
                type="password"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
                required
                className="w-full bg-[#e8d4bd] border border-[#dfcda5] p-3 text-white focus:outline-none focus:border-white/50 placeholder:text-zinc-600"
              />
            </div>
          </div>
          <div className="pt-4 flex items-center gap-4">
            <button
              type="submit"
              disabled={updating || !currentPassword || !newPassword || !confirmPassword}
              className="px-4 py-3 rounded-2xl bg-gradient-to-br from-zinc-800 via-zinc-700 to-zinc-600 text-white font-bold uppercase tracking-widest border-2 border-[#dfcda5] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {updating ? 'Updating...' : 'Update Password'}
            </button>
            <button
              type="button"
              className="text-zinc-400 text-sm hover:text-[#dfcda5] transition-colors"
              onClick={() => {
                window.location.href = '/auth?reset=1';
              }}
            >
              Forgot password?
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};




