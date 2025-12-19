import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  ProfileData,
  Casting,
  BookingRequest,
  listAllProfilesAdmin,
  updateProfileStatus,
  listAllCastingsAdmin,
  updateCastingStatus,
  listAllBookingRequestsAdmin,
  updateBookingStatus,
} from '../services/ProfileService';

type ProfileStatus = 'UNDER_REVIEW' | 'ONLINE' | 'OFFLINE';
type CastingUiStatus = 'UNDER_VERIFICATION' | 'ONLINE' | 'CLOSED';

type TabKey = 'profiles' | 'castings' | 'bookings' | 'review';

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
  const [activeTab, setActiveTab] = useState<TabKey>('profiles');

  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(false);

  const [castings, setCastings] = useState<Casting[]>([]);
  const [castingsLoading, setCastingsLoading] = useState(false);
  const [castingSortBy, setCastingSortBy] = useState<CastingSortKey>('created_at');

  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    if (activeTab === 'profiles') {
      void loadProfiles();
    } else if (activeTab === 'castings') {
      void loadCastings();
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

  const handleProfileStatusChange = async (profile: ProfileData, status: ProfileStatus) => {
    if (!profile.user_id) return;
    try {
      // Optimistic update
      setProfiles((prev) => prev.map((p) => (p.user_id === profile.user_id ? { ...p, status } : p)));

      const updated = await updateProfileStatus(profile.user_id, status);
      setProfiles((prev) => prev.map((p) => (p.user_id === updated.user_id ? updated : p)));
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

  const renderProfiles = () => (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Model Profiles</h2>
        <button
          onClick={loadProfiles}
          className="px-3 py-1 text-xs border border-zinc-700 rounded-lg hover:bg-zinc-800"
        >
          Refresh
        </button>
      </div>
      {profilesLoading ? (
        <p className="text-zinc-400 text-sm">Loading profiles...</p>
      ) : profiles.length === 0 ? (
        <p className="text-zinc-500 text-sm">No profiles found.</p>
      ) : (
        <div className="overflow-x-auto border border-zinc-800 rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900/80 text-zinc-400 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Location</th>
                <th className="px-4 py-3 text-left">Instagram</th>
                <th className="px-4 py-3 text-left">Experience</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {profiles.map((p) => {
                const status = (p.status ?? 'UNDER_REVIEW') as ProfileStatus;
                const locationParts = [p.city, p.state, p.country].filter(Boolean).join(', ');
                const ig = (p.instagram ?? []).map((i) => i.handle).join(', ');
                return (
                  <tr key={p.id ?? p.user_id} className="hover:bg-zinc-900/40">
                    <td className="px-4 py-3 text-sm text-white">{p.full_name}</td>
                    <td className="px-4 py-3 text-sm text-zinc-300">{locationParts || '—'}</td>
                    <td className="px-4 py-3 text-sm text-zinc-300">{ig || '—'}</td>
                    <td className="px-4 py-3 text-sm text-zinc-300">{p.experience_level ?? '—'}</td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          status === 'ONLINE'
                            ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-500/40'
                            : status === 'OFFLINE'
                            ? 'bg-zinc-900/60 text-zinc-300 border border-zinc-700/60'
                            : 'bg-amber-900/40 text-amber-200 border border-amber-500/40'
                        }`}
                      >
                        {profileStatusLabel[status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => handleProfileStatusChange(p, 'UNDER_REVIEW')}
                          className="px-2 py-1 rounded border border-amber-500/40 text-amber-200 hover:bg-amber-900/30"
                        >
                          Under Review
                        </button>
                        <button
                          onClick={() => handleProfileStatusChange(p, 'ONLINE')}
                          className="px-2 py-1 rounded border border-emerald-500/40 text-emerald-200 hover:bg-emerald-900/30"
                        >
                          Online
                        </button>
                        <button
                          onClick={() => handleProfileStatusChange(p, 'OFFLINE')}
                          className="px-2 py-1 rounded border border-zinc-600 text-zinc-200 hover:bg-zinc-900/60"
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
      )}
    </div>
  );

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
                  key={p.id ?? p.user_id}
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
        <button
          onClick={() => setActiveTab('profiles')}
          className={`px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] rounded-full border transition-colors ${
            activeTab === 'profiles'
              ? 'bg-white text-black border-white'
              : 'border-zinc-800 text-zinc-400 hover:bg-zinc-900'
          }`}
        >
          Model Profiles
        </button>
        <button
          onClick={() => setActiveTab('castings')}
          className={`px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] rounded-full border transition-colors ${
            activeTab === 'castings'
              ? 'bg-white text-black border-white'
              : 'border-zinc-800 text-zinc-400 hover:bg-zinc-900'
          }`}
        >
          Castings
        </button>
        <button
          onClick={() => setActiveTab('bookings')}
          className={`px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] rounded-full border transition-colors ${
            activeTab === 'bookings'
              ? 'bg-white text-black border-white'
              : 'border-zinc-800 text-zinc-400 hover:bg-zinc-900'
          }`}
        >
          Bookings
        </button>
        <button
          onClick={() => setActiveTab('review')}
          className={`px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] rounded-full border transition-colors ${
            activeTab === 'review'
              ? 'bg-white text-black border-white'
              : 'border-zinc-800 text-zinc-400 hover:bg-zinc-900'
          }`}
        >
          Review Board
        </button>
      </div>

      {activeTab === 'profiles'
        ? renderProfiles()
        : activeTab === 'castings'
        ? renderCastings()
        : activeTab === 'bookings'
        ? renderBookings()
        : renderReviewBoard()}
    </section>
  );
};
