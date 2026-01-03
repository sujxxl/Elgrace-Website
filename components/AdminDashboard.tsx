import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Ruler, Weight } from 'lucide-react';
import { Country, State, City } from 'country-state-city';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import {
  ProfileData,
  Casting,
  BookingRequest,
  CastingApplication,
  listAllProfilesAdmin,
  updateProfileStatus,
  listAllCastingsAdmin,
  updateCastingStatus,
  listAllBookingRequestsAdmin,
  updateBookingStatus,
  listAllCastingApplicationsAdmin,
  updateCastingApplicationStatus,
  getProfileByUserId,
  upsertProfile,
  getNextModelUserId,
  getProfileByModelCode,
} from '../services/ProfileService';

type ProfileStatus = 'UNDER_REVIEW' | 'ONLINE' | 'OFFLINE';
type CastingUiStatus = 'UNDER_VERIFICATION' | 'ONLINE' | 'CLOSED';

type TabKey = 'model-entry' | 'profiles' | 'castings' | 'applications' | 'bookings' | 'review';

type CastingSortKey = 'created_at' | 'application_deadline' | 'shoot_date';

const profileStatusLabel: Record<ProfileStatus, string> = {
  UNDER_REVIEW: 'Under Review',
  ONLINE: 'Online',
  OFFLINE: 'Offline',
};

const castingStatusLabel: Record<CastingUiStatus, string> = {
  UNDER_VERIFICATION: 'Under Verification',
  ONLINE: 'Online',
  CLOSED: 'Closed',
};

// Height filter limits in inches (4'0" to 8'0")
const HEIGHT_MIN_IN = 48; // 4 ft 0 in
const HEIGHT_MAX_IN = 96; // 8 ft 0 in

type ScreenSize = 'mobile' | 'tablet' | 'desktop';

const useScreenSize = (): ScreenSize => {
  const [screenSize, setScreenSize] = useState<ScreenSize>('desktop');

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

function mapCastingDbStatusToUi(status?: Casting['status']): CastingUiStatus {
  if (!status) return 'UNDER_VERIFICATION';
  if (status === 'open') return 'ONLINE';
  if (status === 'closed') return 'CLOSED';
  // treat draft & under_review as under verification
  return 'UNDER_VERIFICATION';
}

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const screenSize = useScreenSize();
  const [activeTab, setActiveTab] = useState<TabKey>('model-entry');

  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [profileViewMode, setProfileViewMode] = useState<'table' | 'detailed'>('detailed');

  // Advanced filters and sorting for detailed profiles view
  const [profileSearch, setProfileSearch] = useState('');
  const [profileStatusFilter, setProfileStatusFilter] = useState<'ALL' | ProfileStatus>('ALL');
  const [profileGenderFilter, setProfileGenderFilter] = useState<'All' | 'male' | 'female' | 'other'>('All');
  const [profileOpenToTravel, setProfileOpenToTravel] = useState<'any' | 'yes' | 'no'>('any');
  const [profileMinRating, setProfileMinRating] = useState<number>(0);
  const [profileMinAge, setProfileMinAge] = useState<number | ''>('');
  const [profileMaxAge, setProfileMaxAge] = useState<number | ''>('');
  // Height filter stored as inches, min and max, default 5'8" to 8'0"
  const [profileMinHeightIn, setProfileMinHeightIn] = useState<number>(68);
  const [profileMaxHeightIn, setProfileMaxHeightIn] = useState<number>(96);
  const [profileLocationSearch, setProfileLocationSearch] = useState('');
  const [profileSortBy, setProfileSortBy] = useState<'rating' | 'model_code' | 'age'>('rating');
  const [expandedProfileId, setExpandedProfileId] = useState<string | null>(null);

  const [castings, setCastings] = useState<Casting[]>([]);
  const [castingsLoading, setCastingsLoading] = useState(false);
  const [castingSortBy, setCastingSortBy] = useState<CastingSortKey>('created_at');

  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  const [applications, setApplications] = useState<CastingApplication[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    if (activeTab === 'profiles') {
      void loadProfiles();
    } else if (activeTab === 'castings') {
      void loadCastings();
    } else if (activeTab === 'applications') {
      void loadApplications();
    } else if (activeTab === 'bookings') {
      void loadBookings();
    } else if (activeTab === 'review') {
      void loadProfiles();
      void loadCastings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user?.id]);

  const loadProfiles = async () => {
    try {
      setProfilesLoading(true);
      const data = await listAllProfilesAdmin();
      setProfiles(data);
    } catch (err) {
      console.error('Failed to load profiles for admin', err);
      showToast('Failed to load profiles');
    } finally {
      setProfilesLoading(false);
    }
  };

  const loadCastings = async () => {
    try {
      setCastingsLoading(true);
      const data = await listAllCastingsAdmin();
      setCastings(data);
    } catch (err) {
      console.error('Failed to load castings for admin', err);
      showToast('Failed to load castings');
    } finally {
      setCastingsLoading(false);
    }
  };

  const loadBookings = async () => {
    try {
      setBookingsLoading(true);
      const data = await listAllBookingRequestsAdmin();
      setBookings(data);
    } catch (err) {
      console.error('Failed to load booking requests', err);
      showToast('Failed to load booking requests');
    } finally {
      setBookingsLoading(false);
    }
  };

  const loadApplications = async () => {
    try {
      setApplicationsLoading(true);
      const data = await listAllCastingApplicationsAdmin();
      setApplications(data);
    } catch (err) {
      console.error('Failed to load casting applications for admin', err);
      showToast('Failed to load applications');
    } finally {
      setApplicationsLoading(false);
    }
  };

  const handleProfileStatusChange = async (profile: ProfileData, status: ProfileStatus) => {
    if (!profile.id) return;
    try {
      // Optimistic update
      setProfiles((prev) => prev.map((p) => (p.id === profile.id ? { ...p, status } : p)));

      const updated = await updateProfileStatus(profile.id, status);
      setProfiles((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      showToast(`Profile set to ${profileStatusLabel[status]}`);
    } catch (err) {
      console.error('Failed to update profile status', err);
      showToast('Failed to update profile status');
    }
  };

  const handleCastingStatusChange = async (casting: Casting, status: CastingUiStatus) => {
    if (!casting.id) return;
    try {
      const updated = await updateCastingStatus(casting.id, status);
      setCastings((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      showToast(`Casting set to ${castingStatusLabel[status]}`);
    } catch (err) {
      console.error('Failed to update casting status', err);
      showToast('Failed to update casting status');
    }
  };

  const sortedCastings = useMemo(() => {
    const key = castingSortBy;
    const copy = [...castings];
    copy.sort((a, b) => {
      const av = (a as any)[key] as string | null | undefined;
      const bv = (b as any)[key] as string | null | undefined;
      if (!av && !bv) return 0;
      if (!av) return 1;
      if (!bv) return -1;
      return av.localeCompare(bv);
    });
    return copy;
  }, [castings, castingSortBy]);

  type AdminProfileDerived = ProfileData & {
    age?: number;
    heightCm?: number;
    heightLabel: string;
    locationLabel: string;
  };

  const profilesWithDerived: AdminProfileDerived[] = useMemo(() => {
    const now = new Date();
    return profiles.map((p) => {
      let age: number | undefined;
      if (p.dob) {
        const dob = new Date(p.dob);
        if (!Number.isNaN(dob.getTime())) {
          const today = new Date();
          age =
            today.getFullYear() -
            dob.getFullYear() -
            (today < new Date(today.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0);
        }
      }

      const feet = (p as any).height_feet ?? 0;
      const inches = (p as any).height_inches ?? 0;
      const heightCm = feet || inches ? Math.round(feet * 30.48 + inches * 2.54) : undefined;
      const heightLabel = feet || inches ? `${feet}'${inches}"` : 'N/A';
      const locationLabel = [p.city, p.state, p.country].filter(Boolean).join(', ');

      return {
        ...(p as ProfileData),
        age,
        heightCm,
        heightLabel,
        locationLabel,
      };
    });
  }, [profiles]);

  const filteredProfilesDetailed = useMemo(() => {
    return profilesWithDerived.filter((p) => {
      const status = (p.status ?? 'UNDER_REVIEW') as ProfileStatus;

      if (profileStatusFilter !== 'ALL' && status !== profileStatusFilter) return false;

      if (profileGenderFilter !== 'All' && p.gender !== profileGenderFilter) return false;

      if (profileOpenToTravel === 'yes' && !p.open_to_travel) return false;
      if (profileOpenToTravel === 'no' && p.open_to_travel) return false;

      if (typeof profileMinRating === 'number' && profileMinRating > 0) {
        if ((p as any).overall_rating != null && typeof (p as any).overall_rating === 'number') {
          if ((p as any).overall_rating < profileMinRating) return false;
        }
      }

      if (typeof profileMinAge === 'number' && profileMinAge >= 0 && p.age != null) {
        if (p.age < profileMinAge) return false;
      }
      if (typeof profileMaxAge === 'number' && profileMaxAge > 0 && p.age != null) {
        if (p.age > profileMaxAge) return false;
      }

      if (p.heightCm != null) {
        // Convert profile height in cm to inches for comparison
        const heightIn = p.heightCm / 2.54;
        const minIn = typeof profileMinHeightIn === 'number' ? profileMinHeightIn : HEIGHT_MIN_IN;
        const maxIn = typeof profileMaxHeightIn === 'number' ? profileMaxHeightIn : HEIGHT_MAX_IN;

        if (heightIn < minIn || heightIn > maxIn) {
          return false;
        }
      }

      if (profileLocationSearch.trim()) {
        const q = profileLocationSearch.trim().toLowerCase();
        if (!p.locationLabel.toLowerCase().includes(q)) return false;
      }

      if (profileSearch.trim()) {
        const q = profileSearch.trim().toLowerCase();
        const budgetParts: string[] = [];
        const legacyBudget = (p as any).expected_budget as string | undefined;
        const minHalf = (p as any).min_budget_half_day as number | null | undefined;
        const minFull = (p as any).min_budget_full_day as number | null | undefined;
        if (legacyBudget) budgetParts.push(legacyBudget);
        if (minHalf != null) budgetParts.push(String(minHalf));
        if (minFull != null) budgetParts.push(String(minFull));
        const haystack = [
          p.full_name,
          p.email,
          p.model_code ?? '',
          p.category ?? '',
          budgetParts.join(' '),
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [
    profilesWithDerived,
    profileStatusFilter,
    profileGenderFilter,
    profileOpenToTravel,
    profileMinRating,
    profileMinAge,
    profileMaxAge,
    profileMinHeightIn,
    profileMaxHeightIn,
    profileLocationSearch,
    profileSearch,
  ]);

  const renderProfiles = () => {
    const header = (
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
        <h2 className="text-xl font-semibold">Model Profiles</h2>
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-full border border-zinc-300 bg-white/80 p-1 text-xs uppercase tracking-[0.16em] dark:border-zinc-700 dark:bg-zinc-950/60">
            <button
              type="button"
              onClick={() => setProfileViewMode('detailed')}
              className={`px-3 py-1 rounded-full transition-colors ${
                profileViewMode === 'detailed'
                  ? 'bg-white text-black'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              Detailed View
            </button>
            <button
              type="button"
              onClick={() => setProfileViewMode('table')}
              className={`px-3 py-1 rounded-full transition-colors ${
                profileViewMode === 'table'
                  ? 'bg-white text-black'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              Table View
            </button>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-600 dark:text-zinc-400">Sort</span>
            <select
              value={profileSortBy}
              onChange={(e) => setProfileSortBy(e.target.value as 'rating' | 'model_code' | 'age')}
              className="bg-white border border-zinc-300 rounded px-2 py-1 text-xs text-zinc-900 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-200"
            >
              <option value="rating">Rating</option>
              <option value="model_code">Model ID</option>
              <option value="age">Age</option>
            </select>
          </div>
          <button
            onClick={loadProfiles}
            className="px-3 py-1 text-xs border rounded-lg bg-[#3b2418] text-[#f6ead8] border-[#3b2418] hover:bg-[#4a3323] dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Refresh
          </button>
        </div>
      </div>
    );

    if (profilesLoading) {
      return (
        <div className="mt-8">
          {header}
          <p className="text-zinc-400 text-sm">Loading profiles...</p>
        </div>
      );
    }

    if (profiles.length === 0) {
      return (
        <div className="mt-8">
          {header}
          <p className="text-zinc-500 text-sm">No profiles found.</p>
        </div>
      );
    }

    const sortProfiles = (items: typeof profilesWithDerived) => {
      const arr = [...items];
      arr.sort((a, b) => {
        if (profileSortBy === 'rating') {
          const ra = (a as any).overall_rating ?? 0;
          const rb = (b as any).overall_rating ?? 0;
          return rb - ra;
        }
        if (profileSortBy === 'model_code') {
          const ma = (a.model_code || '').localeCompare(b.model_code || '');
          return ma;
        }
        if (profileSortBy === 'age') {
          const aa = a.age ?? 0;
          const ab = b.age ?? 0;
          return ab - aa;
        }
        return 0;
      });
      return arr;
    };

    if (profileViewMode === 'table') {
      return (
        <div className="mt-8">
          {header}
          <div className="overflow-x-auto border rounded-xl bg-white/95 shadow-sm dark:bg-transparent dark:border-zinc-800">
            <table className="w-full text-sm">
              <thead className="bg-zinc-100 text-zinc-600 uppercase text-xs dark:bg-zinc-900/80 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Location</th>
                  <th className="px-4 py-3 text-left">Instagram</th>
                  <th className="px-4 py-3 text-left">Experience</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {sortProfiles(profilesWithDerived).map((p) => {
                  const status = (p.status ?? 'UNDER_REVIEW') as ProfileStatus;
                  const locationParts = [p.city, p.state, p.country].filter(Boolean).join(', ');
                  const ig = (p.instagram ?? []).map((i) => i.handle).join(', ');
                  return (
                    <tr
                      key={p.id ?? p.model_code ?? p.email}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40"
                    >
                      <td className="px-4 py-3 text-sm text-zinc-900 dark:text-white">
                        <button
                          type="button"
                          onClick={() => p.id && navigate(`/talents/${p.id}`)}
                          className="hover:underline text-left"
                        >
                          {p.full_name}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">{locationParts || '—'}</td>
                      <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">{ig || '—'}</td>
                      <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">{p.experience_level ?? '—'}</td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            status === 'ONLINE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-500/40'
                              : status === 'OFFLINE'
                              ? 'bg-zinc-100 text-zinc-700 border border-zinc-200 dark:bg-zinc-900/60 dark:text-zinc-300 dark:border-zinc-700/60'
                              : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-500/40'
                          }`}
                        >
                          {profileStatusLabel[status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => handleProfileStatusChange(p, 'UNDER_REVIEW')}
                            className="px-2 py-1 rounded border border-amber-400 text-amber-700 bg-amber-50 hover:bg-amber-100 dark:border-amber-500/40 dark:text-amber-200 dark:bg-transparent dark:hover:bg-amber-900/30"
                          >
                            Under Review
                          </button>
                          <button
                            onClick={() => handleProfileStatusChange(p, 'ONLINE')}
                            className="px-2 py-1 rounded border border-emerald-400 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:border-emerald-500/40 dark:text-emerald-200 dark:bg-transparent dark:hover:bg-emerald-900/30"
                          >
                            Online
                          </button>
                          <button
                            onClick={() => handleProfileStatusChange(p, 'OFFLINE')}
                            className="px-2 py-1 rounded border border-zinc-300 text-zinc-700 bg-zinc-50 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-200 dark:bg-transparent dark:hover:bg-zinc-900/60"
                          >
                            Offline
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    // Detailed view
    return (
      <div className="mt-8">
        {header}
        <div className="mt-4 flex flex-col lg:flex-row gap-4">
          <div className="w-full lg:w-80 lg:flex-shrink-0 text-xs">
            <div className="lg:sticky lg:top-24 space-y-4">
              <div className="flex items-center justify-between">
                <span className="uppercase tracking-[0.16em] text-[11px] text-zinc-500">Filters</span>
                <span className="text-[11px] text-zinc-500">
                  {filteredProfilesDetailed.length} / {profiles.length}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-2">
                  <label className="uppercase tracking-widest text-zinc-600 dark:text-zinc-500">Search</label>
                  <input
                    value={profileSearch}
                    onChange={(e) => setProfileSearch(e.target.value)}
                    placeholder="Name, email, model code, budget..."
                    className="w-full bg-white border border-zinc-300 p-2 rounded text-sm text-zinc-900 placeholder:text-zinc-400 dark:bg-zinc-950 dark:border-zinc-800 dark:text-white dark:placeholder:text-zinc-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="uppercase tracking-widest text-zinc-600 dark:text-zinc-500">Status</label>
                  <select
                    value={profileStatusFilter}
                    onChange={(e) => setProfileStatusFilter(e.target.value as 'ALL' | ProfileStatus)}
                    className="w-full bg-white border border-zinc-300 p-2 rounded text-sm text-zinc-900 dark:bg-zinc-950 dark:border-zinc-800 dark:text-white"
                  >
                    <option value="ALL">Any Status</option>
                    <option value="UNDER_REVIEW">Under Review</option>
                    <option value="ONLINE">Online</option>
                    <option value="OFFLINE">Offline</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="uppercase tracking-widest text-zinc-600 dark:text-zinc-500">Gender</label>
                  <select
                    value={profileGenderFilter}
                    onChange={(e) => setProfileGenderFilter(e.target.value as any)}
                    className="w-full bg-white border border-zinc-300 p-2 rounded text-sm text-zinc-900 dark:bg-zinc-950 dark:border-zinc-800 dark:text-white"
                  >
                    <option value="All">Any</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="uppercase tracking-widest text-zinc-600 dark:text-zinc-500">Open to Travel</label>
                  <select
                    value={profileOpenToTravel}
                    onChange={(e) => setProfileOpenToTravel(e.target.value as 'any' | 'yes' | 'no')}
                    className="w-full bg-white border border-zinc-300 p-2 rounded text-sm text-zinc-900 dark:bg-zinc-950 dark:border-zinc-800 dark:text-white"
                  >
                    <option value="any">Any</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="uppercase tracking-widest text-zinc-600 dark:text-zinc-500">Min Rating</label>
                    <span className="text-[11px] font-medium text-zinc-800 dark:text-zinc-100">
                      {profileMinRating}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-zinc-600 dark:text-zinc-400">
                      <span>Minimum rating</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={10}
                      step={1}
                      value={profileMinRating}
                      onChange={(e) => setProfileMinRating(Number(e.target.value))}
                      className="w-full accent-[#dfcda5]"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="uppercase tracking-widest text-zinc-600 dark:text-zinc-500">Age Range</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      placeholder="Min"
                      value={profileMinAge === '' ? '' : profileMinAge}
                      onChange={(e) => {
                        const v = e.target.value;
                        setProfileMinAge(v === '' ? '' : Number(v));
                      }}
                      className="w-1/2 bg-white border border-zinc-300 p-2 rounded text-sm text-zinc-900 dark:bg-zinc-950 dark:border-zinc-800 dark:text-white"
                    />
                    <input
                      type="number"
                      min={0}
                      max={100}
                      placeholder="Max"
                      value={profileMaxAge === '' ? '' : profileMaxAge}
                      onChange={(e) => {
                        const v = e.target.value;
                        setProfileMaxAge(v === '' ? '' : Number(v));
                      }}
                      className="w-1/2 bg-white border border-zinc-300 p-2 rounded text-sm text-zinc-900 dark:bg-zinc-950 dark:border-zinc-800 dark:text-white"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  {/* Height range selector */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="uppercase tracking-widest text-[11px] text-zinc-600 dark:text-zinc-500">
                        Height
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                      {/* Close icon: resets to defaults */}
                      <button
                        type="button"
                        onClick={() => {
                          setProfileMinHeightIn(68);
                          setProfileMaxHeightIn(96);
                        }}
                        className="h-5 w-5 flex items-center justify-center rounded-full border border-zinc-300 text-[10px] hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
                        aria-label="Reset height range"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white/70 p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40">
                    {/* Dual-handle slider using two range inputs */}
                    <div className="space-y-2">
                      <div className="relative h-1 rounded-full bg-[#fde6c8] dark:bg-zinc-800">
                        <div
                          className="absolute inset-y-0 rounded-full bg-[#8b5b34] dark:bg-zinc-200"
                          style={{
                            left: `${((profileMinHeightIn - HEIGHT_MIN_IN) / (HEIGHT_MAX_IN - HEIGHT_MIN_IN)) * 100}%`,
                            right: `${100 -
                              ((profileMaxHeightIn - HEIGHT_MIN_IN) / (HEIGHT_MAX_IN - HEIGHT_MIN_IN)) * 100}%`,
                          }}
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min={HEIGHT_MIN_IN}
                          max={HEIGHT_MAX_IN}
                          value={profileMinHeightIn}
                          onChange={(e) => {
                            const next = Math.min(Number(e.target.value), profileMaxHeightIn);
                            setProfileMinHeightIn(next);
                          }}
                          className="w-full accent-[#dfcda5] bg-transparent"
                        />
                        <input
                          type="range"
                          min={HEIGHT_MIN_IN}
                          max={HEIGHT_MAX_IN}
                          value={profileMaxHeightIn}
                          onChange={(e) => {
                            const next = Math.max(Number(e.target.value), profileMinHeightIn);
                            setProfileMaxHeightIn(next);
                          }}
                          className="w-full accent-[#dfcda5] bg-transparent"
                        />
                      </div>
                    </div>
                    {/* Inputs for min and max height in ft/in */}
                    <div className="grid grid-cols-2 gap-3 text-[11px] text-zinc-700 dark:text-zinc-300">
                      <div className="space-y-1">
                        <div className="text-[10px] uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
                          Min Height
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 flex items-center rounded-full border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white">
                            <input
                              type="number"
                              min={4}
                              max={8}
                              value={Math.floor(profileMinHeightIn / 12)}
                              onChange={(e) => {
                                const ft = Number(e.target.value);
                                const inches = profileMinHeightIn % 12;
                                const total = Math.min(Math.max(ft * 12 + inches, HEIGHT_MIN_IN), profileMaxHeightIn);
                                setProfileMinHeightIn(total);
                              }}
                              className="w-10 bg-transparent outline-none text-center"
                            />
                            <span className="ml-1 text-[10px] text-zinc-500 dark:text-zinc-400">ft</span>
                          </div>
                          <div className="flex-1 flex items-center rounded-full border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white">
                            <input
                              type="number"
                              min={0}
                              max={11}
                              value={profileMinHeightIn % 12}
                              onChange={(e) => {
                                const inch = Number(e.target.value);
                                const ft = Math.floor(profileMinHeightIn / 12);
                                const total = Math.min(Math.max(ft * 12 + inch, HEIGHT_MIN_IN), profileMaxHeightIn);
                                setProfileMinHeightIn(total);
                              }}
                              className="w-10 bg-transparent outline-none text-center"
                            />
                            <span className="ml-1 text-[10px] text-zinc-500 dark:text-zinc-400">in</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
                          Max Height
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 flex items-center rounded-full border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white">
                            <input
                              type="number"
                              min={4}
                              max={8}
                              value={Math.floor(profileMaxHeightIn / 12)}
                              onChange={(e) => {
                                const ft = Number(e.target.value);
                                const inches = profileMaxHeightIn % 12;
                                const total = Math.max(Math.min(ft * 12 + inches, HEIGHT_MAX_IN), profileMinHeightIn);
                                setProfileMaxHeightIn(total);
                              }}
                              className="w-10 bg-transparent outline-none text-center"
                            />
                            <span className="ml-1 text-[10px] text-zinc-500 dark:text-zinc-400">ft</span>
                          </div>
                          <div className="flex-1 flex items-center rounded-full border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white">
                            <input
                              type="number"
                              min={0}
                              max={11}
                              value={profileMaxHeightIn % 12}
                              onChange={(e) => {
                                const inch = Number(e.target.value);
                                const ft = Math.floor(profileMaxHeightIn / 12);
                                const total = Math.max(Math.min(ft * 12 + inch, HEIGHT_MAX_IN), profileMinHeightIn);
                                setProfileMaxHeightIn(total);
                              }}
                              className="w-10 bg-transparent outline-none text-center"
                            />
                            <span className="ml-1 text-[10px] text-zinc-500 dark:text-zinc-400">in</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="uppercase tracking-widest text-zinc-600 dark:text-zinc-500">Location Contains</label>
                  <input
                    value={profileLocationSearch}
                    onChange={(e) => setProfileLocationSearch(e.target.value)}
                    placeholder="City / state / country"
                    className="w-full bg-white border border-zinc-300 p-2 rounded text-sm text-zinc-900 dark:bg-zinc-950 dark:border-zinc-800 dark:text-white"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setProfileSearch('');
                    setProfileStatusFilter('ALL');
                    setProfileGenderFilter('All');
                    setProfileOpenToTravel('any');
                    setProfileMinRating(0);
                    setProfileMinAge('');
                    setProfileMaxAge('');
                    setProfileMinHeightIn(68);
                    setProfileMaxHeightIn(96);
                    setProfileLocationSearch('');
                  }}
                  className="mt-2 w-full border border-zinc-300 rounded-full py-1.5 text-[11px] uppercase tracking-[0.16em] text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900/80"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-[260px]">
            {filteredProfilesDetailed.length === 0 ? (
              <p className="text-zinc-500 text-sm">No profiles match these filters.</p>
            ) : (
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {sortProfiles(filteredProfilesDetailed).map((p, index) => {
                      const status = (p.status ?? 'UNDER_REVIEW') as ProfileStatus;
                      const cardId = String(p.id ?? p.model_code ?? p.email ?? index);
                      const isExpanded = expandedProfileId === cardId;

                      let isRightEdge = false;
                      if (screenSize === 'desktop') {
                        // Approximate 3-column layout on wide screens
                        isRightEdge = (index + 1) % 3 === 0;
                      } else if (screenSize === 'tablet') {
                        isRightEdge = (index + 1) % 2 === 0;
                      }

                      const minHalf = (p as any).min_budget_half_day as number | null | undefined;
                      const minFull = (p as any).min_budget_full_day as number | null | undefined;
                      const legacyBudget = (p as any).expected_budget as string | undefined;
                      const budgetText = (() => {
                        if (minHalf != null || minFull != null) {
                          const parts: string[] = [];
                          if (minHalf != null)
                            parts.push(`Half-day: INR ${Number(minHalf).toLocaleString()}`);
                          if (minFull != null)
                            parts.push(`Full-day: INR ${Number(minFull).toLocaleString()}`);
                          return parts.join(' | ');
                        }
                        return legacyBudget || 'N/A';
                      })();

                      const handleMouseEnter = () => {
                        if (screenSize !== 'mobile') {
                          setExpandedProfileId(cardId);
                        }
                      };

                      const handleMouseLeave = () => {
                        if (screenSize !== 'mobile') {
                          setExpandedProfileId(null);
                        }
                      };

                      const handleClick = () => {
                        if (screenSize === 'mobile') {
                          setExpandedProfileId(isExpanded ? null : cardId);
                        }
                      };

                      return (
                        <div
                          key={cardId}
                          className={`relative aspect-[3/4] ${isExpanded ? 'z-40' : 'z-0'}`}
                        >
                          <motion.div
                            layout
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                            onClick={handleClick}
                            className={`absolute top-0 h-full rounded-2xl border overflow-hidden cursor-pointer shadow-xl transition-colors duration-300
                              ${isRightEdge ? 'right-0 origin-right' : 'left-0 origin-left'}
                              ${isExpanded ? 'shadow-2xl ring-1 ring-black/10 dark:ring-white/20' : 'hover:border-zinc-400/60 dark:hover:border-zinc-600'}
                              bg-[#f6ead8] border-[#e0cdb0] text-zinc-100 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100
                            `}
                            initial={false}
                            animate={{
                              width: isExpanded && screenSize !== 'mobile' ? '200%' : '100%',
                              height: '100%',
                              zIndex: isExpanded ? 40 : 1,
                            }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                          >
                            <div className="flex w-full h-full">
                              {/* Image section */}
                              <div
                                className={`${
                                  isExpanded && screenSize !== 'mobile' ? 'w-1/2' : 'w-full'
                                } h-full relative transition-all duration-500 bg-[#f2e2cc] dark:bg-[#111111]`}
                              >
                                {p.cover_photo_url ? (
                                  <img
                                  src={p.cover_photo_url}
                                  alt={p.full_name || 'Model image'}
                                  className={`w-full h-full object-cover transition-all duration-700 ${
                                    isExpanded
                                    ? 'grayscale-0'
                                    : 'dark:grayscale dark:hover:grayscale-0'
                                  }`}
                                  />
                                ) : (
                                  <div className="w-full h-full bg-[#e7d5bc] dark:bg-zinc-900" />
                                )}

                                {/* Light-mode base tint so cards don't read as black even with dark photos */}
                                <div className="absolute inset-0 bg-[#f6ead8]/55 pointer-events-none dark:white/10" />

                                <motion.div
                                  initial={{ opacity: 1 }}
                                  animate={{ opacity: isExpanded ? 0 : 1 }}
                                  className="absolute inset-0 bg-gradient-to-t from-[#f6ead8]/95 via-transparent to-transparent dark:from-black/80 flex flex-col justify-end p-4"
                                >
                                  <div className="flex items-end justify-between gap-3">
                                    <div className="min-w-0">
                                      <div className="text-sm font-semibold truncate">
                                        {p.full_name || 'Unnamed Model'}
                                      </div>
                                      <div className="text-[11px] truncate">
                                        {p.model_code || 'No code'}
                                        {p.category ? ` · ${p.category}` : ''}
                                      </div>
                                    </div>
                                    <span
                                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border backdrop-blur-sm ${
                                        status === 'ONLINE'
                                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-400 dark:text-black dark:border-emerald-300'
                                          : status === 'OFFLINE'
                                          ? 'bg-zinc-100 text-zinc-700 border-zinc-300 dark:bg-zinc-700 dark:text-zinc-50 dark:border-zinc-600'
                                          : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-400 dark:text-black dark:border-amber-300'
                                      }`}
                                    >
                                      {profileStatusLabel[status]}
                                    </span>
                                  </div>
                                </motion.div>

                              </div>

                              {/* Details section (desktop / tablet) */}
                              <AnimatePresence>
                                {isExpanded && screenSize !== 'mobile' && (
                                  <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ delay: 0.05, duration: 0.25 }}
                                    className="w-1/2 h-full p-5 bg-[#f6ead8] dark:bg-zinc-900 flex flex-col justify-between border-l border-[#e0cdb0] dark:border-white/10 text-xs text-zinc-100"
                                  >
                                    <div className="space-y-3">
                                      <div className="flex items-start justify-between gap-3">
                                      <div className="min-w-0">
                                        <div className="text-sm font-semibold truncate text-zinc-100">
                                        {p.full_name || 'Unnamed Model'}
                                        </div>
                                        <div className="text-[11px] text-zinc-300 dark:text-zinc-400 truncate">
                                        {p.locationLabel || 'Location TBA'}
                                        </div>
                                      </div>
                                      <span
                                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                                        status === 'ONLINE'
                                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-400 dark:text-black dark:border-emerald-300'
                                          : status === 'OFFLINE'
                                          ? 'bg-zinc-100 text-zinc-700 border-zinc-300 dark:bg-zinc-700 dark:text-zinc-50 dark:border-zinc-600'
                                          : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-400 dark:text-black dark:border-amber-300'
                                        }`}
                                      >
                                        {profileStatusLabel[status]}
                                      </span>
                                      </div>

                                      <div className="grid grid-cols-2 gap-3 mt-1">
                                      <div>
                                        <div className="text-zinc-500 dark:text-zinc-400 uppercase tracking-widest text-[10px]">
                                        Age
                                        </div>
                                        <div>{p.age != null ? `${p.age} yrs` : 'N/A'}</div>
                                      </div>
                                      <div>
                                        <div className="text-zinc-500 dark:text-zinc-400 uppercase tracking-widest text-[10px] flex items-center gap-1">
                                        <Ruler className="w-3 h-3" /> Height
                                        </div>
                                        <div>{p.heightLabel}</div>
                                      </div>
                                      <div>
                                        <div className="text-zinc-500 dark:text-zinc-400 uppercase tracking-widest text-[10px]">
                                        Rating
                                        </div>
                                        <div>
                                        {(p as any).overall_rating != null
                                          ? `${(p as any).overall_rating}/10`
                                          : 'N/A'}
                                        </div>
                                      </div>
                                      <div>
                                        <div className="text-zinc-500 dark:text-zinc-400 uppercase tracking-widest text-[10px] flex items-center gap-1">
                                        <Weight className="w-3 h-3" /> Budget
                                        </div>
                                        <div>{budgetText}</div>
                                      </div>
                                      <div>
                                        <div className="text-zinc-500 dark:text-zinc-400 uppercase tracking-widest text-[10px]">
                                        Open to Travel
                                        </div>
                                        <div>
                                        {p.open_to_travel == null
                                          ? 'Any'
                                          : p.open_to_travel
                                          ? 'Yes'
                                          : 'No'}
                                        </div>
                                      </div>
                                      <div>
                                        <div className="text-zinc-500 dark:text-zinc-400 uppercase tracking-widest text-[10px]">
                                        Experience
                                        </div>
                                        <div>{p.experience_level || 'N/A'}</div>
                                      </div>
                                      </div>

                                      {(p.languages && p.languages.length > 0) ||
                                      (p.skills && p.skills.length > 0) ? (
                                      <div className="mt-2 space-y-2 text-[11px]">
                                        {p.languages && p.languages.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                          <span className="text-zinc-500 dark:text-zinc-400 uppercase tracking-widest text-[10px] mr-1">
                                          Languages:
                                          </span>
                                          {p.languages.slice(0, 10).map((lang) => (
                                          <span
                                            key={lang}
                                            className="px-2 py-0.5 rounded-full border border-[#d6c3a6] text-zinc-100 dark:border-zinc-600 dark:text-zinc-100"
                                          >
                                            {lang}
                                          </span>
                                          ))}
                                        </div>
                                        )}
                                        {p.skills && p.skills.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                          <span className="text-zinc-500 dark:text-zinc-400 uppercase tracking-widest text-[10px] mr-1">
                                          Skills:
                                          </span>
                                          {p.skills.slice(0, 10).map((skill) => (
                                          <span
                                            key={skill}
                                            className="px-2 py-0.5 rounded-full border border-[#d6c3a6] text-zinc-100 dark:border-zinc-600 dark:text-zinc-100"
                                          >
                                            {skill}
                                          </span>
                                          ))}
                                        </div>
                                        )}
                                      </div>
                                      ) : null}
                                    </div>

                                    <div className="mt-3 flex flex-wrap gap-2 text-[11px]" />
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              {/* Mobile expansion overlay */}
                              <AnimatePresence>
                                {isExpanded && screenSize === 'mobile' && (
                                  <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4 text-center text-sm text-white"
                                  >
                                    <h3 className="text-2xl font-semibold mb-2">
                                      {p.full_name || 'Unnamed Model'}
                                    </h3>
                                    <p className="mb-4 text-xs text-zinc-200">
                                      {p.locationLabel || 'Location TBA'} · {p.heightLabel} ·{' '}
                                      {p.age != null ? `${p.age} yrs` : 'Age N/A'}
                                    </p>
                                    <div className="flex flex-col gap-2 w-full max-w-xs">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setExpandedProfileId(null);
                                        }}
                                        className="w-full px-4 py-2 border border-zinc-400 text-[11px] uppercase tracking-[0.16em] text-zinc-100"
                                      >
                                        Close
                                      </button>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </motion.div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderCastings = () => (
    <div className="mt-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <h2 className="text-xl font-semibold">Castings</h2>
        <div className="flex items-center gap-3 text-xs">
          <label className="text-zinc-400">Sort by</label>
          <select
            value={castingSortBy}
            onChange={(e) => setCastingSortBy(e.target.value as CastingSortKey)}
            className="bg-zinc-950 border border-zinc-700 px-2 py-1 rounded text-xs"
          >
            <option value="created_at">Date Added</option>
            <option value="application_deadline">Apply by (Deadline)</option>
            <option value="shoot_date">Shoot Date</option>
          </select>
          <button
            onClick={loadCastings}
            className="ml-2 px-3 py-1 border border-zinc-700 rounded-lg hover:bg-zinc-800"
          >
            Refresh
          </button>
        </div>
      </div>
      {castingsLoading ? (
        <p className="text-zinc-400 text-sm">Loading castings...</p>
      ) : sortedCastings.length === 0 ? (
        <p className="text-zinc-500 text-sm">No castings found.</p>
      ) : (
        <div className="overflow-x-auto border border-zinc-800 rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900/80 text-zinc-400 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Title</th>
                <th className="px-4 py-3 text-left">Location</th>
                <th className="px-4 py-3 text-left">Budget</th>
                <th className="px-4 py-3 text-left">Apply By</th>
                <th className="px-4 py-3 text-left">Shoot Date</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {sortedCastings.map((c) => {
                const uiStatus = mapCastingDbStatusToUi(c.status);
                const budget = (() => {
                  const min = c.budget_min ?? undefined;
                  const max = c.budget_max ?? undefined;
                  if (!min && !max) return 'TBA';
                  if (min && max) return `${Number(min).toLocaleString()} - ${Number(max).toLocaleString()}`;
                  if (min) return `From ${Number(min).toLocaleString()}`;
                  return `Up to ${Number(max!).toLocaleString()}`;
                })();
                return (
                  <tr key={c.id ?? c.title} className="hover:bg-zinc-900/40">
                    <td className="px-4 py-3 text-sm text-white max-w-xs">
                      <div className="font-medium truncate">{c.title}</div>
                      {c.description && (
                        <div className="text-xs text-zinc-400 truncate mt-1">{c.description}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-300">{c.location || '—'}</td>
                    <td className="px-4 py-3 text-sm text-zinc-300">{budget}</td>
                    <td className="px-4 py-3 text-sm text-zinc-300">
                      {c.application_deadline ? new Date(c.application_deadline).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-300">
                      {c.shoot_date ? new Date(c.shoot_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          uiStatus === 'ONLINE'
                            ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-500/40'
                            : uiStatus === 'CLOSED'
                            ? 'bg-zinc-900/60 text-zinc-300 border border-zinc-700/60'
                            : 'bg-amber-900/40 text-amber-200 border border-amber-500/40'
                        }`}
                      >
                        {castingStatusLabel[uiStatus]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => handleCastingStatusChange(c, 'UNDER_VERIFICATION')}
                          className="px-2 py-1 rounded border border-amber-500/40 text-amber-200 hover:bg-amber-900/30"
                        >
                          Under Verification
                        </button>
                        <button
                          onClick={() => handleCastingStatusChange(c, 'ONLINE')}
                          className="px-2 py-1 rounded border border-emerald-500/40 text-emerald-200 hover:bg-emerald-900/30"
                        >
                          Online
                        </button>
                        <button
                          onClick={() => handleCastingStatusChange(c, 'CLOSED')}
                          className="px-2 py-1 rounded border border-zinc-600 text-zinc-200 hover:bg-zinc-900/60"
                        >
                          Closed
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderBookings = () => (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Booking Requests</h2>
        <button
          onClick={loadBookings}
          className="px-3 py-1 text-xs border border-zinc-700 rounded-lg hover:bg-zinc-800"
        >
          Refresh
        </button>
      </div>
      {bookingsLoading ? (
        <p className="text-zinc-400 text-sm">Loading booking requests...</p>
      ) : bookings.length === 0 ? (
        <p className="text-zinc-500 text-sm">No booking requests yet.</p>
      ) : (
        <div className="overflow-x-auto border border-zinc-800 rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900/80 text-zinc-400 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Model</th>
                <th className="px-4 py-3 text-left">Client</th>
                <th className="px-4 py-3 text-left">Message</th>
                <th className="px-4 py-3 text-left">Created</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-zinc-900/40">
                  <td className="px-4 py-3 text-sm text-zinc-300">{b.model_user_id.slice(0, 8)}…</td>
                  <td className="px-4 py-3 text-sm text-zinc-300">{b.client_user_id.slice(0, 8)}…</td>
                  <td className="px-4 py-3 text-sm text-zinc-300 max-w-xs truncate">{b.message || '—'}</td>
                  <td className="px-4 py-3 text-sm text-zinc-300">
                    {b.created_at ? new Date(b.created_at).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-300">{b.status ?? 'pending'}</td>
                  <td className="px-4 py-3 text-xs">
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={async () => {
                          if (!b.id) return;
                          try {
                            const updated = await updateBookingStatus(b.id, 'approved');
                            setBookings((prev) => prev.map((bk) => (bk.id === updated.id ? updated : bk)));
                            showToast('Booking approved.', 'success');
                          } catch (err) {
                            console.error('Failed to approve booking', err);
                            showToast('Failed to approve booking.', 'error');
                          }
                        }}
                        className="px-2 py-1 rounded border border-emerald-500/40 text-emerald-200 hover:bg-emerald-900/30"
                      >
                        Approve
                      </button>
                      <button
                        onClick={async () => {
                          if (!b.id) return;
                          try {
                            const updated = await updateBookingStatus(b.id, 'rejected');
                            setBookings((prev) => prev.map((bk) => (bk.id === updated.id ? updated : bk)));
                            showToast('Booking rejected.', 'success');
                          } catch (err) {
                            console.error('Failed to reject booking', err);
                            showToast('Failed to reject booking.', 'error');
                          }
                        }}
                        className="px-2 py-1 rounded border border-red-500/40 text-red-200 hover:bg-red-900/30"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderApplications = () => (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Casting Applications</h2>
        <button
          onClick={loadApplications}
          className="px-3 py-1 text-xs border border-zinc-700 rounded-lg hover:bg-zinc-800"
        >
          Refresh
        </button>
      </div>
      {applicationsLoading ? (
        <p className="text-zinc-400 text-sm">Loading applications...</p>
      ) : applications.length === 0 ? (
        <p className="text-zinc-500 text-sm">No casting applications yet.</p>
      ) : (
        <div className="overflow-x-auto border border-zinc-800 rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900/80 text-zinc-400 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Casting</th>
                <th className="px-4 py-3 text-left">Model</th>
                <th className="px-4 py-3 text-left">Brand</th>
                <th className="px-4 py-3 text-left">Applied</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {applications.map((app) => {
                const c = app.casting as Casting | undefined;
                const status = (app.status ?? 'applied') as CastingApplication['status'];
                return (
                  <tr key={app.id} className="hover:bg-zinc-900/40">
                    <td className="px-4 py-3 text-sm text-white max-w-xs">
                      {c?.id ? (
                        <button
                          type="button"
                          onClick={() => navigate(`/castings/${c.id}`)}
                          className="hover:underline text-left truncate"
                        >
                          {c.title}
                        </button>
                      ) : (
                        c?.title ?? 'Casting'
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-300">
                      <button
                        type="button"
                        onClick={() => navigate(`/talents/${app.model_user_id}`)}
                        className="hover:underline"
                      >
                        {app.model_user_id.slice(0, 8)}…
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-300">
                      {c?.user_id ? (
                        <button
                          type="button"
                          onClick={() => navigate(`/brands/${c.user_id}`)}
                          className="hover:underline"
                        >
                          {c.user_id.slice(0, 8)}…
                        </button>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-300">
                      {app.created_at ? new Date(app.created_at).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-300 capitalize">{status}</td>
                    <td className="px-4 py-3 text-xs">
                      <div className="flex gap-2 flex-wrap">
                        {(['applied', 'shortlisted', 'booked', 'rejected', 'cancelled'] as CastingApplication['status'][]).map(
                          (target) => (
                            <button
                              key={target}
                              type="button"
                              disabled={status === target}
                              onClick={async () => {
                                if (!app.id) return;
                                try {
                                  const updated = await updateCastingApplicationStatus(app.id, target);
                                  setApplications((prev) =>
                                    prev.map((a) => (a.id === updated.id ? updated : a))
                                  );
                                  showToast(`Application set to ${target}.`);
                                } catch (err) {
                                  console.error('Failed to update application status', err);
                                  showToast('Failed to update application status');
                                }
                              }}
                              className={`px-2 py-1 rounded border text-[10px] uppercase tracking-widest font-medium ${
                                status === target
                                  ? 'border-zinc-700 text-zinc-500 cursor-not-allowed'
                                  : target === 'booked'
                                  ? 'border-emerald-500/40 text-emerald-200 hover:bg-emerald-900/30'
                                  : target === 'rejected' || target === 'cancelled'
                                  ? 'border-red-500/40 text-red-200 hover:bg-red-900/30'
                                  : target === 'shortlisted'
                                  ? 'border-amber-500/40 text-amber-200 hover:bg-amber-900/30'
                                  : 'border-zinc-500/40 text-zinc-200 hover:bg-zinc-900/30'
                              }`}
                            >
                              {target}
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderReviewBoard = () => {
    const profilesUnderReview = profiles.filter((p) => p.status === 'UNDER_REVIEW');
    const castingsUnderVerification = castings.filter(
      (c) => mapCastingDbStatusToUi(c.status) === 'UNDER_VERIFICATION'
    );

    return (
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-300">
              Profiles Under Review
            </h2>
            <span className="text-[11px] text-zinc-500">{profilesUnderReview.length} pending</span>
          </div>
          {profilesLoading && <p className="text-zinc-400 text-xs">Loading profiles...</p>}
          {!profilesLoading && profilesUnderReview.length === 0 && (
            <p className="text-zinc-500 text-xs">No profiles awaiting review.</p>
          )}
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {profilesUnderReview.map((p) => {
              const location = [p.city, p.state, p.country].filter(Boolean).join(', ');
              const ig = (p.instagram ?? []).map((i) => i.handle).join(', ');
              return (
                <div
                  key={p.id ?? p.model_code ?? p.email}
                  className="flex items-start justify-between gap-3 px-3 py-2 rounded-lg bg-zinc-950/60 border border-zinc-800"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-white truncate">{p.full_name}</div>
                    <div className="text-[11px] text-zinc-400 truncate">
                      {location || 'Location TBA'}
                    </div>
                    {ig && (
                      <div className="text-[11px] text-zinc-500 truncate">{ig}</div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-900/40 text-amber-200 border border-amber-500/40">
                      Under Review
                    </span>
                    <button
                      onClick={() => handleProfileStatusChange(p, 'ONLINE')}
                      className="px-2 py-0.5 rounded border border-emerald-500/40 text-emerald-200 text-[10px] hover:bg-emerald-900/30"
                    >
                      Approve & Go Online
                    </button>
                    <button
                      onClick={() => handleProfileStatusChange(p, 'OFFLINE')}
                      className="px-2 py-0.5 rounded border border-zinc-600 text-zinc-200 text-[10px] hover:bg-zinc-900/60"
                    >
                      Mark Offline
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-300">
              Castings Under Verification
            </h2>
            <span className="text-[11px] text-zinc-500">{castingsUnderVerification.length} pending</span>
          </div>
          {castingsLoading && <p className="text-zinc-400 text-xs">Loading castings...</p>}
          {!castingsLoading && castingsUnderVerification.length === 0 && (
            <p className="text-zinc-500 text-xs">No castings awaiting verification.</p>
          )}
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {castingsUnderVerification.map((c) => (
              <div
                key={c.id ?? c.title}
                className="flex items-start justify-between gap-3 px-3 py-2 rounded-lg bg-zinc-950/60 border border-zinc-800"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white truncate">{c.title}</div>
                  {c.location && (
                    <div className="text-[11px] text-zinc-400 truncate">{c.location}</div>
                  )}
                  {c.application_deadline && (
                    <div className="text-[11px] text-zinc-500">
                      Apply by {new Date(c.application_deadline).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-900/40 text-amber-200 border border-amber-500/40">
                    Under Verification
                  </span>
                  <button
                    onClick={() => handleCastingStatusChange(c, 'ONLINE')}
                    className="px-2 py-0.5 rounded border border-emerald-500/40 text-emerald-200 text-[10px] hover:bg-emerald-900/30"
                  >
                    Approve & Go Online
                  </button>
                  <button
                    onClick={() => handleCastingStatusChange(c, 'CLOSED')}
                    className="px-2 py-0.5 rounded border border-zinc-600 text-zinc-200 text-[10px] hover:bg-zinc-900/60"
                  >
                    Close Casting
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderModelEntry = () => <ModelDataEntry />;

  return (
    <section className="min-h-[70vh] max-w-6xl mx-auto px-4 pb-16">
      <header className="mb-6 border-b border-zinc-800 pb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Admin</p>
          <h1 className="text-3xl md:text-4xl font-['Syne'] font-bold">Moderation Dashboard</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Review and control model profiles and casting visibility.
          </p>
        </div>
        <div className="text-xs text-zinc-500">
          Signed in as <span className="text-zinc-200 font-medium">{user?.email}</span>
        </div>
      </header>

      <div className="flex gap-2 border-b border-zinc-800 pb-2">
        <div className="flex gap-3 pb-2 md:pb-0 overflow-x-auto md:overflow-visible scrollbar-hide">
          <button
            onClick={() => setActiveTab('model-entry')}
            className={`group relative px-6 py-2 rounded-full border text-xs md:text-sm font-semibold uppercase tracking-[0.16em] md:tracking-wider transition-all duration-300 transform ${
              activeTab === 'model-entry'
                ? 'bg-white text-black border-white scale-105 shadow-md'
                : 'bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-500 hover:text-zinc-300 hover:scale-105 hover:z-10'
            }`}
          >
            <span>Model Data Entry</span>
          </button>
          <button
            onClick={() => setActiveTab('profiles')}
            className={`group relative px-6 py-2 rounded-full border text-xs md:text-sm font-semibold uppercase tracking-[0.16em] md:tracking-wider transition-all duration-300 transform ${
              activeTab === 'profiles'
                ? 'bg-white text-black border-white scale-105 shadow-md'
                : 'bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-500 hover:text-zinc-300 hover:scale-105 hover:z-10'
            }`}
          >
            <span>Model Profiles</span>
          </button>
          <button
            onClick={() => setActiveTab('castings')}
            className={`group relative px-6 py-2 rounded-full border text-xs md:text-sm font-semibold uppercase tracking-[0.16em] md:tracking-wider transition-all duration-300 transform ${
              activeTab === 'castings'
                ? 'bg-white text-black border-white scale-105 shadow-md'
                : 'bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-500 hover:text-zinc-300 hover:scale-105 hover:z-10'
            }`}
          >
            <span>Castings</span>
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`group relative px-6 py-2 rounded-full border text-xs md:text-sm font-semibold uppercase tracking-[0.16em] md:tracking-wider transition-all duration-300 transform ${
              activeTab === 'applications'
                ? 'bg-white text-black border-white scale-105 shadow-md'
                : 'bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-500 hover:text-zinc-300 hover:scale-105 hover:z-10'
            }`}
          >
            <span>Applications</span>
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`group relative px-6 py-2 rounded-full border text-xs md:text-sm font-semibold uppercase tracking-[0.16em] md:tracking-wider transition-all duration-300 transform ${
              activeTab === 'bookings'
                ? 'bg-white text-black border-white scale-105 shadow-md'
                : 'bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-500 hover:text-zinc-300 hover:scale-105 hover:z-10'
            }`}
          >
            <span>Bookings</span>
          </button>
          <button
            onClick={() => setActiveTab('review')}
            className={`group relative px-6 py-2 rounded-full border text-xs md:text-sm font-semibold uppercase tracking-[0.16em] md:tracking-wider transition-all duration-300 transform ${
              activeTab === 'review'
                ? 'bg-white text-black border-white scale-105 shadow-md'
                : 'bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-500 hover:text-zinc-300 hover:scale-105 hover:z-10'
            }`}
          >
            <span>Review Board</span>
          </button>
        </div>
      </div>

      {activeTab === 'model-entry'
        ? renderModelEntry()
        : activeTab === 'profiles'
        ? renderProfiles()
        : activeTab === 'castings'
        ? renderCastings()
        : activeTab === 'applications'
        ? renderApplications()
        : activeTab === 'bookings'
        ? renderBookings()
        : renderReviewBoard()}
    </section>
  );
};

const emptyProfile: ProfileData = {
  full_name: '',
  dob: '',
  gender: 'female',
  phone: '',
  email: '',
  country: '',
  state: '',
  city: '',
  category: 'model',
  instagram: [{ handle: '', followers: 'under_5k' }],
  status: 'UNDER_REVIEW',
  model_code: null,
};

const ModelDataEntry: React.FC = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lookupUserId, setLookupUserId] = useState('');
  const [profile, setProfile] = useState<ProfileData>({ ...emptyProfile });
  const [ageInput, setAgeInput] = useState<number | ''>('');
  const [languageInput, setLanguageInput] = useState('');
  const SKILL_PRESETS = [
    'Ramp Walk',
    'Acting',
    'Print / Catalog',
    'TV / Film',
    'Digital Creator / UGC',
  ];

  const SIZE_OPTIONS = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL'];

  // Country-State-City options, mirroring the talent ProfileEdit form
  const countries = Country.getAllCountries();
  const states = profile.country ? State.getStatesOfCountry(profile.country) : [];
  const cities = profile.state ? City.getCitiesOfState(profile.country, profile.state) : [];

  const handleCountryChange = (isoCode: string) => {
    setProfile({ ...profile, country: isoCode, state: '', city: '' });
  };

  const handleStateChange = (isoCode: string) => {
    setProfile({ ...profile, state: isoCode, city: '' });
  };

  const handleLoad = async () => {
    const trimmed = lookupUserId.trim();
    setLoading(true);
    try {
      // If a specific ID is provided, try to load that; otherwise start a new one with the next series ID
      // If a specific code is provided, try to load by model_code; otherwise start a new one with the next series code
      if (trimmed) {
        const existing = await getProfileByModelCode(trimmed);
        if (existing) {
          setProfile(existing);
          // derive age from DOB for UI field
          if (existing.dob) {
            const dob = new Date(existing.dob);
            if (!Number.isNaN(dob.getTime())) {
              const today = new Date();
              const age =
                today.getFullYear() -
                dob.getFullYear() -
                (today < new Date(today.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0);
              setAgeInput(age);
            } else {
              setAgeInput('');
            }
          } else {
            setAgeInput('');
          }
          showToast('Loaded existing model profile');
        } else {
          const nextId = await getNextModelUserId();
          setProfile({ ...emptyProfile, model_code: nextId });
          setLookupUserId(nextId);
          setAgeInput('');
          showToast('No existing profile, starting a new one');
        }
      } else {
        const nextId = await getNextModelUserId();
        setProfile({ ...emptyProfile, model_code: nextId });
        setLookupUserId(nextId);
        setAgeInput('');
        showToast('Starting new profile with next ID');
      }
    } catch (err: any) {
      console.error('Failed to load model profile', err);
      showToast(err?.message ?? 'Failed to load model profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const code = profile.model_code?.toString().trim();
    if (!code) {
      showToast('Model code is required');
      return;
    }
    if (!profile.full_name.trim()) {
      showToast('Full name is required');
      return;
    }
    if (!profile.email.trim()) {
      showToast('Email is required');
      return;
    }
    setSaving(true);
    try {
      const payload: ProfileData = {
        ...profile,
        email: profile.email.trim(),
        category: 'model',
      };
      const saved = await upsertProfile(payload);
      setProfile(saved);
      showToast('Model profile saved');
    } catch (err: any) {
      console.error('Failed to save model profile', err);
      showToast(err?.message ?? 'Failed to save model profile');
    } finally {
      setSaving(false);
    }
  };

  const updateInstagramHandle = (idx: number, key: 'handle' | 'followers', value: string) => {
    const next = [...(profile.instagram || [])];
    const item = { ...(next[idx] || { handle: '', followers: 'under_5k' }), [key]: value };
    next[idx] = item;
    setProfile({ ...profile, instagram: next });
  };

  const addLanguage = () => {
    if (!languageInput.trim()) return;
    const next = [...(profile.languages || []), languageInput.trim()];
    setProfile({ ...profile, languages: next });
    setLanguageInput('');
  };

  return (
    <div className="mt-8 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 admin-panel">
      <h2 className="text-xl font-semibold mb-4">Model Data Entry (Employees Only)</h2>
      <p className="text-sm text-zinc-400 mb-6">
        Use this form to add or update model profiles in the database. This does not require the model to
        have a login; all data is maintained by the Elgrace team.
      </p>

      <div className="flex flex-col md:flex-row md:items-end gap-3 mb-6">
        <div className="flex-1">
          <label className="block text-xs uppercase tracking-[0.16em] text-zinc-500 mb-1">Lookup by Model Code</label>
          <input
            value={lookupUserId}
            onChange={(e) => setLookupUserId(e.target.value)}
            placeholder="Enter existing model ID (e.g. M-1000001) to load or leave blank for next ID"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white"
          />
        </div>
        <button
          type="button"
          onClick={handleLoad}
          disabled={loading}
          className="px-4 py-2 rounded-full text-xs uppercase tracking-[0.16em] border border-[#dfcda5] text-white bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 admin-primary-btn"
        >
          {loading ? 'Loading…' : 'Load / Start New'}
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Model Code</label>
          <input
            value={profile.model_code ?? ''}
            onChange={(e) => setProfile({ ...profile, model_code: e.target.value })}
            className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white focus:outline-none focus:border-white/50"
            placeholder="Model code (e.g. M-1000001)"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Status</label>
          <select
            value={profile.status ?? 'UNDER_REVIEW'}
            onChange={(e) => setProfile({ ...profile, status: e.target.value as ProfileStatus })}
            className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white"
          >
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="ONLINE">Online</option>
            <option value="OFFLINE">Offline</option>
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Full Name</label>
          <input
            value={profile.full_name}
            onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
            className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Email</label>
          <input
            type="email"
            value={profile.email}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Phone</label>
          <input
            value={profile.phone}
            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Age (years)</label>
          <input
            type="number"
            min={0}
            max={100}
            value={ageInput === '' ? '' : ageInput}
            onChange={(e) => {
              const v = e.target.value;
              if (v === '') {
                setAgeInput('');
                return;
              }
              const num = Number(v);
              if (!Number.isFinite(num) || num < 0) return;
              setAgeInput(num);
              // derive DOB as "today minus age years"
              const today = new Date();
              const dob = new Date(
                today.getFullYear() - num,
                today.getMonth(),
                today.getDate()
              );
              const iso = dob.toISOString().split('T')[0];
              setProfile({ ...profile, dob: iso });
            }}
            className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Gender</label>
          <select
            value={profile.gender}
            onChange={(e) => setProfile({ ...profile, gender: e.target.value as any })}
            className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Country</label>
          <select
            value={profile.country}
            onChange={(e) => handleCountryChange(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white"
          >
            <option value="">Select Country</option>
            {countries.map((c) => (
              <option key={c.isoCode} value={c.isoCode}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">State</label>
          <select
            value={profile.state}
            onChange={(e) => handleStateChange(e.target.value)}
            disabled={!profile.country}
            className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white disabled:opacity-50"
          >
            <option value="">Select State</option>
            {states.map((s) => (
              <option key={s.isoCode} value={s.isoCode}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">City</label>
          <select
            value={profile.city}
            onChange={(e) => setProfile({ ...profile, city: e.target.value })}
            disabled={!profile.state}
            className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white disabled:opacity-50"
          >
            <option value="">Select City</option>
            {cities.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-semibold mb-2">Instagram</h3>
        <div className="space-y-3">
          {(profile.instagram || []).map((ig, idx) => (
            <div key={idx} className="grid md:grid-cols-2 gap-3">
              <input
                value={ig.handle}
                onChange={(e) => updateInstagramHandle(idx, 'handle', e.target.value)}
                placeholder="Handle (without @)"
                className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white"
              />
              <select
                value={ig.followers}
                onChange={(e) => updateInstagramHandle(idx, 'followers', e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white"
              >
                <option value="under_5k">Under 5K</option>
                <option value="5k_20k">5K–20K</option>
                <option value="20k_50k">20K–50K</option>
                <option value="50k_100k">50K–100K</option>
                <option value="100k_plus">100K+</option>
              </select>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setProfile({
                ...profile,
                instagram: [...(profile.instagram || []), { handle: '', followers: 'under_5k' }],
              })
            }
            className="px-4 py-2 rounded-xl border border-white/10 text-zinc-300 hover:border-[#dfcda5] text-xs"
          >
            Add Instagram handle
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Experience Level</label>
          <select
            value={profile.experience_level ?? 'lt_1'}
            onChange={(e) => setProfile({ ...profile, experience_level: e.target.value as any })}
            className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white"
          >
            <option value="lt_1">Less than 1 year</option>
            <option value="1_3">1–3 years</option>
            <option value="3_5">3–5 years</option>
            <option value="gt_5">Over 5 years</option>
          </select>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Languages</label>
          <div className="flex gap-2 mb-2">
            <input
              value={languageInput}
              onChange={(e) => setLanguageInput(e.target.value)}
              className="flex-1 bg-zinc-950 border border-zinc-800 p-3 text-white rounded-lg"
              placeholder="Add language and press Add"
            />
            <button
              type="button"
              onClick={addLanguage}
              className="px-4 py-3 bg-[#dfcda5] text-black font-bold rounded-lg text-xs"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {(profile.languages || []).map((lang) => (
              <span
                key={lang}
                className="px-3 py-1 rounded-full bg-zinc-900 border border-[#dfcda5] text-xs text-white flex items-center gap-2"
              >
                {lang}
                <button
                  type="button"
                  onClick={() =>
                    setProfile({
                      ...profile,
                      languages: (profile.languages || []).filter((l) => l !== lang),
                    })
                  }
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Key Skills</label>
          <p className="text-[11px] text-zinc-500 mb-2">Select all that apply</p>
          <div className="flex flex-wrap gap-2 mb-2">
            {SKILL_PRESETS.map((skill) => {
              const active = (profile.skills || []).includes(skill);
              return (
                <button
                  key={skill}
                  type="button"
                  onClick={() => {
                    const current = profile.skills || [];
                    setProfile({
                      ...profile,
                      skills: active
                        ? current.filter((s) => s !== skill)
                        : [...current, skill],
                    });
                  }}
                  className={`px-3 py-1 rounded-full border text-xs font-medium transition-colors ${
                    active
                      ? 'bg-[#dfcda5] text-black border-[#dfcda5]'
                      : 'bg-zinc-950 border-zinc-700 text-zinc-200 hover:border-[#dfcda5]'
                  }`}
                >
                  {skill}
                </button>
              );
            })}
          </div>
          {profile.skills && profile.skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-1">
              {profile.skills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1 rounded-full bg-zinc-900 border border-[#dfcda5] text-xs text-white flex items-center gap-2"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() =>
                      setProfile({
                        ...profile,
                        skills: (profile.skills || []).filter((s) => s !== skill),
                      })
                    }
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Open to Travel</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setProfile({ ...profile, open_to_travel: true })}
              className={`px-4 py-2 rounded-xl border text-xs ${
                profile.open_to_travel ? 'border-[#dfcda5] text-white' : 'border-white/10 text-zinc-300'
              }`}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => setProfile({ ...profile, open_to_travel: false })}
              className={`px-4 py-2 rounded-xl border text-xs ${
                profile.open_to_travel === false
                  ? 'border-[#dfcda5] text-white'
                  : 'border-white/10 text-zinc-300'
              }`}
            >
              No
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">
            Overall Rating (out of 10)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={10}
              step={1}
              value={profile.overall_rating ?? 0}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  overall_rating: Number(e.target.value),
                })
              }
              className="flex-1 accent-[#dfcda5]"
            />
            <span className="w-8 text-sm text-white text-right">
              {profile.overall_rating ?? 0}
            </span>
          </div>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">
            Minimum Budget (Half Day)
          </label>
          <input
            type="number"
            min={1500}
            value={profile.min_budget_half_day ?? ''}
            onChange={(e) =>
              setProfile({
                ...profile,
                min_budget_half_day: e.target.value === '' ? null : Number(e.target.value),
              })
            }
            className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white"
            placeholder="e.g. 1500"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">
            Minimum Budget (Full Day)
          </label>
          <input
            type="number"
            min={2000}
            value={profile.min_budget_full_day ?? ''}
            onChange={(e) =>
              setProfile({
                ...profile,
                min_budget_full_day: e.target.value === '' ? null : Number(e.target.value),
              })
            }
            className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white"
            placeholder="e.g. 2000"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Height (feet / inches)</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={profile.height_feet ?? ''}
              onChange={(e) => setProfile({ ...profile, height_feet: Number(e.target.value) || undefined })}
              className="w-1/2 bg-zinc-950 border border-zinc-800 p-3 text-white"
              placeholder="ft"
            />
            <input
              type="number"
              value={profile.height_inches ?? ''}
              onChange={(e) => setProfile({ ...profile, height_inches: Number(e.target.value) || undefined })}
              className="w-1/2 bg-zinc-950 border border-zinc-800 p-3 text-white"
              placeholder="in"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Bust / Chest (inches)</label>
          <input
            type="number"
            value={profile.bust_chest ?? ''}
            onChange={(e) => setProfile({ ...profile, bust_chest: Number(e.target.value) || undefined })}
            className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Waist (inches)</label>
          <input
            type="number"
            value={profile.waist ?? ''}
            onChange={(e) => setProfile({ ...profile, waist: Number(e.target.value) || undefined })}
            className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Hips (inches)</label>
          <input
            type="number"
            value={profile.hips ?? ''}
            onChange={(e) => setProfile({ ...profile, hips: Number(e.target.value) || null })}
            className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Size</label>
          <select
            value={profile.size ?? ''}
            onChange={(e) => setProfile({ ...profile, size: e.target.value || null })}
            className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white"
          >
            <option value="">Select size</option>
            {SIZE_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Shoe Size</label>
          <input
            value={profile.shoe_size ?? ''}
            onChange={(e) => setProfile({ ...profile, shoe_size: e.target.value })}
            className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white"
            placeholder="e.g. UK-8 or US-9"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Cover Photo URL</label>
          <input
            value={profile.cover_photo_url ?? ''}
            onChange={(e) => setProfile({ ...profile, cover_photo_url: e.target.value })}
            className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white"
            placeholder="Direct image URL or Google Drive link"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Portfolio Folder Link</label>
          <input
            value={profile.portfolio_folder_link ?? ''}
            onChange={(e) => setProfile({ ...profile, portfolio_folder_link: e.target.value })}
            className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white"
            placeholder="Google Drive folder link"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="px-6 py-3 rounded-2xl bg-gradient-to-br from-zinc-800 via-zinc-700 to-zinc-600 text-white font-bold uppercase tracking-widest border-2 border-[#dfcda5] disabled:opacity-60 admin-primary-btn"
        >
          {saving ? 'Saving…' : 'Save Model Profile'}
        </button>
      </div>
    </div>
  );
};
