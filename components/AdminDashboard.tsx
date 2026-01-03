import React, { useEffect, useMemo, useState } from 'react';
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
  const [activeTab, setActiveTab] = useState<TabKey>('model-entry');

  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(false);

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
                  <tr key={p.id ?? p.model_code ?? p.email} className="hover:bg-zinc-900/40">
                    <td className="px-4 py-3 text-sm text-white">
                      <button
                        type="button"
                        onClick={() => p.id && navigate(`/talents/${p.id}`)}
                        className="hover:underline text-left"
                      >
                        {p.full_name}
                      </button>
                    </td>
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
        <button
          onClick={() => setActiveTab('model-entry')}
          className={`px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] rounded-full border transition-colors ${
            activeTab === 'model-entry'
              ? 'bg-white text-black border-white'
              : 'border-zinc-800 text-zinc-400 hover:bg-zinc-900'
          }`}
        >
          Model Data Entry
        </button>
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
          onClick={() => setActiveTab('applications')}
          className={`px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] rounded-full border transition-colors ${
            activeTab === 'applications'
              ? 'bg-white text-black border-white'
              : 'border-zinc-800 text-zinc-400 hover:bg-zinc-900'
          }`}
        >
          Applications
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
  const [languageInput, setLanguageInput] = useState('');
  const [skillInput, setSkillInput] = useState('');

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
          showToast('Loaded existing model profile');
        } else {
          const nextId = await getNextModelUserId();
          setProfile({ ...emptyProfile, model_code: nextId });
          setLookupUserId(nextId);
          showToast('No existing profile, starting a new one');
        }
      } else {
        const nextId = await getNextModelUserId();
        setProfile({ ...emptyProfile, model_code: nextId });
        setLookupUserId(nextId);
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

  const addSkill = () => {
    if (!skillInput.trim()) return;
    const next = [...(profile.skills || []), skillInput.trim()];
    setProfile({ ...profile, skills: next });
    setSkillInput('');
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
          <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Date of Birth</label>
          <input
            type="date"
            value={profile.dob || ''}
            onChange={(e) => setProfile({ ...profile, dob: e.target.value })}
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
          <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Skills</label>
          <div className="flex gap-2 mb-2">
            <input
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              className="flex-1 bg-zinc-950 border border-zinc-800 p-3 text-white rounded-lg"
              placeholder="Add skill and press Add"
            />
            <button
              type="button"
              onClick={addSkill}
              className="px-4 py-3 bg-[#dfcda5] text-black font-bold rounded-lg text-xs"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {(profile.skills || []).map((skill) => (
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
            Expected Budget
          </label>
          <input
            value={profile.expected_budget ?? ''}
            onChange={(e) => setProfile({ ...profile, expected_budget: e.target.value })}
            className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white"
            placeholder="e.g. ₹10,000/day or ₹5,000 per shoot"
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
          <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Weight (kg)</label>
          <input
            type="number"
            value={profile.weight ?? ''}
            onChange={(e) => setProfile({ ...profile, weight: Number(e.target.value) || null })}
            className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white"
          />
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
