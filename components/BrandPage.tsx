import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Globe, Instagram, Calendar, Users } from 'lucide-react';
import {
  BrandProfile,
  Casting,
  BookingRequest,
  CastingApplication,
  getBrandProfileByUserId,
  listCastings,
  listCastingApplicationsForBrand,
  listBookingRequestsForClient,
  updateCastingApplicationStatus,
  updateBookingStatus,
} from '../services/ProfileService';
import { useAuth } from '../context/AuthContext';

export const BrandPage: React.FC = () => {
  const { user } = useAuth();
  const { userId } = useParams<{ userId: string }>();
  const [brand, setBrand] = useState<BrandProfile | null>(null);
  const [castings, setCastings] = useState<Casting[]>([]);
  const [applications, setApplications] = useState<CastingApplication[]>([]);
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setError('Missing brand id');
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const profile = await getBrandProfileByUserId(userId);
        if (!profile) {
          setError('Brand profile not found');
        } else {
          setBrand(profile);
        }

        const allCastings = await listCastings();
        const brandCastings = allCastings.filter((c) => c.user_id === userId);
        setCastings(brandCastings);

        const apps = await listCastingApplicationsForBrand(userId);
        setApplications(apps);

        const brandBookings = await listBookingRequestsForClient(userId);
        setBookings(brandBookings);
      } catch (err) {
        console.error('Failed to load brand overview', err);
        setError('Failed to load brand overview');
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const groupedApplications = useMemo(() => {
    const map = new Map<string, CastingApplication[]>();
    for (const app of applications) {
      if (!app.casting_id) continue;
      const list = map.get(app.casting_id) ?? [];
      list.push(app);
      map.set(app.casting_id, list);
    }
    return map;
  }, [applications]);

  const totalOpenCastings = castings.filter((c) => c.status === 'open').length;
  const totalApplications = applications.length;
  const pendingBookings = bookings.filter((b) => (b.status ?? 'pending') === 'pending').length;

  const isAdmin = user?.role === 'admin';

  if (loading) {
    return (
      <section className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-400 text-sm">Loading brand overview...</p>
      </section>
    );
  }

  if (error || !brand) {
    return (
      <section className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400 mb-4 text-sm">{error ?? 'Brand not found'}</p>
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 px-4 py-2 border border-zinc-700 rounded-full text-xs uppercase tracking-widest text-zinc-200 hover:bg-zinc-900"
          >
            Back to Mod Board
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-zinc-950 pt-10 pb-16 px-6">
      <div className="container mx-auto max-w-6xl space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white font-bold text-2xl">
              {brand.brand_name?.charAt(0)?.toUpperCase() || 'B'}
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-['Syne'] font-bold text-white">{brand.brand_name}</h1>
              <div className="flex flex-wrap gap-2 text-xs text-zinc-400 mt-1 items-center">
                {brand.website_url && (
                  <span className="inline-flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    <a
                      href={brand.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#dfcda5]"
                    >
                      {brand.website_url.replace(/^https?:\/\//, '')}
                    </a>
                  </span>
                )}
                {brand.instagram_handle && (
                  <span className="inline-flex items-center gap-1">
                    <Instagram className="w-3 h-3" />
                    <a
                      href={`https://instagram.com/${brand.instagram_handle.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#dfcda5]"
                    >
                      {brand.instagram_handle}
                    </a>
                  </span>
                )}
                {brand.contact_email && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>{brand.contact_email}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.2em] text-zinc-400">
            <Link
              to="/admin"
              className="px-4 py-2 rounded-full border border-zinc-700 hover:bg-zinc-900 text-xs"
            >
              Mod Board
            </Link>
            <Link
              to="/talents"
              className="px-4 py-2 rounded-full border border-zinc-700 hover:bg-zinc-900 text-xs"
            >
              Talents Page
            </Link>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid md:grid-cols-3 gap-4"
        >
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4">
            <div className="text-xs uppercase tracking-[0.25em] text-zinc-500 mb-1">Open Castings</div>
            <div className="text-2xl font-semibold text-white">{totalOpenCastings}</div>
          </div>
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4">
            <div className="text-xs uppercase tracking-[0.25em] text-zinc-500 mb-1">Total Applications</div>
            <div className="text-2xl font-semibold text-white">{totalApplications}</div>
          </div>
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4">
            <div className="text-xs uppercase tracking-[0.25em] text-zinc-500 mb-1">Pending Bookings</div>
            <div className="text-2xl font-semibold text-white">{pendingBookings}</div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-[2fr,1.4fr] gap-6">
          <div className="space-y-4">
            <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4">
              <h2 className="text-sm uppercase tracking-[0.25em] text-zinc-500 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Castings & Applications
              </h2>
              {castings.length === 0 ? (
                <p className="text-zinc-400 text-sm">No castings posted yet for this brand.</p>
              ) : (
                <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                  {castings.map((c) => {
                    const appsForCasting = groupedApplications.get(c.id as string) ?? [];
                    const openCount = appsForCasting.filter(
                      (a) => (a.status ?? 'applied') !== 'cancelled' && a.status !== 'rejected'
                    ).length;
                    return (
                      <div
                        key={c.id ?? c.title}
                        className="border border-zinc-800 rounded-xl p-3 bg-zinc-950/60"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-white truncate">{c.title}</div>
                            <div className="text-[11px] text-zinc-500 mt-0.5">
                              {c.location || 'Location TBA'} ·{' '}
                              {c.shoot_date
                                ? `Shoot ${new Date(c.shoot_date).toLocaleDateString()}`
                                : 'Shoot TBA'}
                            </div>
                            <div className="text-[11px] text-zinc-500 mt-0.5">
                              {c.application_deadline
                                ? `Apply by ${new Date(c.application_deadline).toLocaleDateString()}`
                                : 'Deadline TBA'}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-900 text-zinc-300 border border-zinc-700">
                              {c.status ?? 'under_review'}
                            </span>
                            <span className="text-[10px] text-zinc-500">
                              {appsForCasting.length} applications ({openCount} active)
                            </span>
                          </div>
                        </div>

                        {appsForCasting.length > 0 && (
                          <div className="mt-3 border-t border-zinc-800 pt-2 space-y-1">
                            {appsForCasting.map((app) => {
                              const status = app.status ?? 'applied';
                              return (
                                <div
                                  key={app.id}
                                  className="flex items-center justify-between gap-3 text-[11px] text-zinc-300"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <Users className="w-3 h-3 text-zinc-500" />
                                    <Link
                                      to={`/talents/${app.model_user_id}`}
                                      className="hover:underline truncate"
                                    >
                                      Model {app.model_user_id.slice(0, 8)}…
                                    </Link>
                                    <span className="text-zinc-500">
                                      · {app.created_at ? new Date(app.created_at).toLocaleDateString() : '—'}
                                    </span>
                                  </div>
                                  {isAdmin && app.id && (
                                    <div className="flex gap-1 flex-wrap justify-end">
                                      {(['applied', 'shortlisted', 'booked', 'rejected', 'cancelled'] as CastingApplication['status'][]).map(
                                        (target) => (
                                          <button
                                            key={target}
                                            type="button"
                                            disabled={status === target}
                                            onClick={async () => {
                                              try {
                                                const updated = await updateCastingApplicationStatus(app.id as string, target);
                                                setApplications((prev) =>
                                                  prev.map((a) => (a.id === updated.id ? updated : a))
                                                );
                                              } catch (err) {
                                                console.error('Failed to update application status', err);
                                              }
                                            }}
                                            className={`px-2 py-0.5 rounded border text-[9px] uppercase tracking-widest ${
                                              status === target
                                                ? 'border-zinc-700 text-zinc-500 cursor-not-allowed'
                                                : target === 'booked'
                                                ? 'border-emerald-500/40 text-emerald-200'
                                                : target === 'rejected' || target === 'cancelled'
                                                ? 'border-red-500/40 text-red-200'
                                                : target === 'shortlisted'
                                                ? 'border-amber-500/40 text-amber-200'
                                                : 'border-zinc-500/40 text-zinc-200'
                                            }`}
                                          >
                                            {target}
                                          </button>
                                        )
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4">
              <h2 className="text-sm uppercase tracking-[0.25em] text-zinc-500 mb-3">Brand Details</h2>
              <p className="text-sm text-zinc-300 whitespace-pre-line">
                {brand.brand_description || 'No brand description provided yet.'}
              </p>
            </div>

            <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4">
              <h2 className="text-sm uppercase tracking-[0.25em] text-zinc-500 mb-3">Booking Requests</h2>
              {bookings.length === 0 ? (
                <p className="text-zinc-400 text-sm">No booking requests yet for this brand.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {bookings.map((b) => (
                    <div
                      key={b.id}
                      className="border border-zinc-800 rounded-xl p-3 bg-zinc-950/60 flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-xs text-zinc-300">
                          Booking for model {b.model_user_id.slice(0, 8)}…
                        </div>
                        <div className="text-[10px] uppercase tracking-widest text-zinc-500">
                          {b.status ?? 'pending'}
                        </div>
                      </div>
                      {b.message && (
                        <div className="text-[11px] text-zinc-400 max-w-md">{b.message}</div>
                      )}
                      {isAdmin && b.id && (
                        <div className="flex gap-2 flex-wrap text-[10px] uppercase tracking-widest mt-1">
                          {(['approved', 'rejected', 'cancelled'] as BookingRequest['status'][]).map(
                            (target) => (
                              <button
                                key={target}
                                type="button"
                                disabled={b.status === target}
                                onClick={async () => {
                                  try {
                                    const updated = await updateBookingStatus(b.id as string, target!);
                                    setBookings((prev) =>
                                      prev.map((bk) => (bk.id === updated.id ? updated : bk))
                                    );
                                  } catch (err) {
                                    console.error('Failed to update booking status', err);
                                  }
                                }}
                                className={`px-3 py-1 rounded border font-medium ${
                                  b.status === target
                                    ? 'border-zinc-700 text-zinc-500 cursor-not-allowed'
                                    : target === 'approved'
                                    ? 'border-emerald-500/40 text-emerald-200'
                                    : target === 'rejected'
                                    ? 'border-red-500/40 text-red-200'
                                    : 'border-zinc-500/40 text-zinc-200'
                                }`}
                              >
                                {target}
                              </button>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
