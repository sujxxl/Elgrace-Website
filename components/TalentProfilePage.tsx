import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronLeft, ChevronRight, MapPin, Ruler, Weight, X } from 'lucide-react';
import { getProfileByUserId, ProfileData } from '../services/ProfileService';
import { deriveMedia, fetchMediaRecords, DerivedMedia } from '../services/mediaService';
import { ThemedVideo } from './ThemedVideo';
import { useAuth } from '../context/AuthContext';

export const TalentProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [derivedMedia, setDerivedMedia] = useState<DerivedMedia>({
    profileImage: null,
    introVideo: null,
    portfolio: [],
    portfolioVideos: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState<number>(0);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Guard: if the slug is the onboarding path, redirect to onboarding instead of trying to load a profile
    if (userId === 'onboarding') {
      navigate('/talents/onboarding', { replace: true });
      return;
    }

    if (!userId) {
      setError('Missing talent id');
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const [data, mediaRecords] = await Promise.all([
          getProfileByUserId(userId),
          fetchMediaRecords(userId),
        ]);
        if (!data) {
          setError('Talent not found or not online yet.');
        } else {
          setProfile(data);
        }

        setDerivedMedia(deriveMedia(mediaRecords));
      } catch (err) {
        console.error('Failed to load profile', err);
        setError('Failed to load talent profile');
      } finally {
        setLoading(false);
      }
    })();
  }, [userId, navigate]);

  if (loading) {
    return (
      <section className="min-h-screen bg-[#fbf3e4] flex items-center justify-center px-6">
        <div className="w-full max-w-md rounded-3xl border border-[#e5d3a3] bg-white p-6 text-center">
          <p className="text-[#4b5563] text-sm">Loading talent…</p>
        </div>
      </section>
    );
  }

  if (error || !profile) {
    return (
      <section className="min-h-screen bg-[#fbf3e4] flex items-center justify-center px-6">
        <div className="w-full max-w-lg rounded-3xl border border-[#e5d3a3] bg-white p-8 text-center">
          <p className="text-[#4b5563] mb-5 text-sm">{error ?? 'Talent not found'}</p>
          <Link
            to="/talents"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-[#e5d3a3] text-[11px] uppercase tracking-[0.2em] text-[#111827] hover:bg-[#e5d3a3]/50"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Talents
          </Link>
        </div>
      </section>
    );
  }

  const location = [profile.city, profile.state, profile.country].filter(Boolean).join(', ');
  const feet = profile.height_feet ?? 0;
  const inches = profile.height_inches ?? 0;
  const heightLabel = feet || inches ? `${feet}'${inches}"` : 'N/A';
  const sizeLabel = (profile as any).size ? String((profile as any).size) : 'N/A';
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
  const age = computeAge(profile.dob);
  const coverUrl = derivedMedia.profileImage?.media_url || '';
  const introVideoUrl = derivedMedia.introVideo?.media_url || '';
  const hasCover = !!coverUrl;
  const modelInitial = (profile.full_name || '').trim().charAt(0).toUpperCase() || 'M';
  const modelCode = profile.model_code || '—';
  const portfolioVideos = derivedMedia.portfolioVideos;
  const portfolioPhotos = derivedMedia.portfolio;
  const previewPhotos = portfolioPhotos.slice(0, 6);

  const isAdmin = user?.role === 'admin';

  const inch = (value?: number | null) => (value != null ? `${value}"` : '—');

  const experienceLabel = (() => {
    const v = profile.experience_level;
    if (!v) return '—';
    const map: Record<string, string> = {
      lt_1: 'Less than 1 year',
      '1_3': '1–3 years',
      '3_5': '3–5 years',
      gt_5: '5+ years',
    };
    return map[v] ?? String(v).replace(/_/g, ' ');
  })();

  const followerLabel = (() => {
    if (!profile.instagram || profile.instagram.length === 0) return '—';
    // Show follower bucket(s) without exposing handles.
    const labels = profile.instagram
      .map((ig) => ig.followers)
      .filter(Boolean)
      .map((s) => String(s).replace(/_/g, ' '));
    const unique = Array.from(new Set(labels));
    return unique.length ? unique.join(', ') : '—';
  })();

  const money = (value?: number | null) => {
    if (value == null) return '—';
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(value);
    } catch {
      return `₹${value}`;
    }
  };

  const activeGallerySrc = portfolioPhotos[galleryIndex]?.media_url;
  const openGalleryAt = (index: number) => {
    setGalleryIndex(Math.max(0, Math.min(index, portfolioPhotos.length - 1)));
    setGalleryOpen(true);
  };
  const closeGallery = () => setGalleryOpen(false);
  const prevGallery = () => setGalleryIndex((i) => (portfolioPhotos.length ? (i - 1 + portfolioPhotos.length) % portfolioPhotos.length : 0));
  const nextGallery = () => setGalleryIndex((i) => (portfolioPhotos.length ? (i + 1) % portfolioPhotos.length : 0));

  return (
    <section className="min-h-screen bg-[#fbf3e4] pt-10 pb-16 px-6 text-[#111827]">
      <div className="w-full">
        <div className="flex items-center justify-between gap-3 mb-8">
          <Link
            to="/talents"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-[#e5d3a3] text-[11px] uppercase tracking-[0.2em] text-[#111827] hover:bg-[#e5d3a3]/50"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Talents
          </Link>
          <Link
            to="/profile"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-[#e5d3a3] text-[11px] uppercase tracking-[0.2em] text-[#111827] hover:bg-[#e5d3a3]/50"
          >
            Go to Mod Board
          </Link>
        </div>

        {/* TOP SECTION — IDENTITY ROW */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="w-full"
        >
          {/* Header (NO CARD) */}
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-full bg-[#fbf3e4] flex items-center justify-center">
                <span className="font-['Syne'] text-xl font-bold text-[#3d211a]">{modelInitial}</span>
              </div>
              <div className="min-w-0">
                {isAdmin && (
                  <div className="font-['Syne'] text-lg font-bold text-[#111827] truncate">{profile.full_name}</div>
                )}
              </div>
            </div>

            <div className="text-right">
              <div className="text-[11px] uppercase tracking-[0.24em] text-[#6b7280]">Model Code</div>
              <div className="font-['Syne'] text-xl font-bold text-[#111827]">{modelCode}</div>
            </div>
          </div>

          {/* MAIN MEDIA + DETAILS ROW */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            {/* Media (left half): Cover + Intro side-by-side */}
            <div className="grid grid-cols-2 gap-6">
              {/* Cover Photo (3:4) */}
              <div className="relative w-full aspect-[3/4] overflow-hidden">
                {hasCover ? (
                  <img
                    src={coverUrl}
                    alt={isAdmin ? profile.full_name : `Model ${modelCode}`}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center px-4">
                      <div className="font-['Syne'] text-base font-bold text-[#111827]">No cover photo</div>
                      <div className="text-sm text-[#6b7280]">Cover photo will appear here.</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Intro Video (3:4) */}
              {introVideoUrl ? (
                <ThemedVideo
                  src={introVideoUrl}
                  autoPlay={true}
                  muted={true}
                  loop={true}
                  playWhenInView={true}
                  exclusiveAudioGroup="talent-profile"
                  containerClassName="w-full aspect-[3/4]"
                  className="absolute inset-0 w-full h-full object-cover"
                  ariaLabel="Intro video"
                />
              ) : (
                <div className="w-full aspect-[3/4] flex items-center justify-center">
                  <div className="text-center px-4">
                    <div className="font-['Syne'] text-base font-bold text-[#111827]">No intro video</div>
                    <div className="text-sm text-[#6b7280]">Intro video will appear here.</div>
                  </div>
                </div>
              )}
            </div>

            {/* Details (right half) */}
            <div>
              <div className="rounded-2xl bg-[#fbf3e4] border border-[#3d211a]/10 p-6">
                <div className="font-['Syne'] text-sm font-bold text-[#111827] uppercase tracking-[0.22em] mb-3">
                  Measurements & Details
                </div>

              {/* Top metrics row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-10 gap-y-6">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.28em] text-[#6b7280]">Height</div>
                  <div className="font-['Syne'] text-2xl font-bold text-[#111827] leading-tight">{heightLabel}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-[0.28em] text-[#6b7280]">Chest</div>
                  <div className="font-['Syne'] text-2xl font-bold text-[#111827] leading-tight">{inch(profile.bust_chest)}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-[0.28em] text-[#6b7280]">Waist</div>
                  <div className="font-['Syne'] text-2xl font-bold text-[#111827] leading-tight">{inch(profile.waist)}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-[0.28em] text-[#6b7280]">Shoe</div>
                  <div className="font-['Syne'] text-2xl font-bold text-[#111827] leading-tight">{profile.shoe_size ?? '—'}</div>
                </div>
              </div>

              {/* Detail grid */}
                <dl className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-x-14 gap-y-6">
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.28em] text-[#6b7280]">Gender</dt>
                  <dd className="font-['Syne'] text-lg font-bold text-[#111827]">{profile.gender ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.28em] text-[#6b7280]">Modeling Experience</dt>
                  <dd className="font-['Syne'] text-lg font-bold text-[#111827]">{experienceLabel}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.28em] text-[#6b7280]">Age</dt>
                  <dd className="font-['Syne'] text-lg font-bold text-[#111827]">{age != null ? String(age) : '—'}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.28em] text-[#6b7280]">Location</dt>
                  <dd className="font-['Syne'] text-lg font-bold text-[#111827]">{location || '—'}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.28em] text-[#6b7280]">Special Skills</dt>
                  <dd className="font-['Syne'] text-lg font-bold text-[#111827]">
                    {profile.skills && profile.skills.length > 0 ? profile.skills.join(', ') : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.28em] text-[#6b7280]">Languages Spoken</dt>
                  <dd className="font-['Syne'] text-lg font-bold text-[#111827]">
                    {profile.languages && profile.languages.length > 0 ? profile.languages.join(', ') : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.28em] text-[#6b7280]">Instagram Followers</dt>
                  <dd className="font-['Syne'] text-lg font-bold text-[#111827]">{followerLabel}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.28em] text-[#6b7280]">Open to Travel?</dt>
                  <dd className="font-['Syne'] text-lg font-bold text-[#111827]">
                    {profile.open_to_travel === undefined ? '—' : profile.open_to_travel ? 'Yes' : 'No'}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.28em] text-[#6b7280]">Ramp Walk Experience</dt>
                  <dd className="font-['Syne'] text-lg font-bold text-[#111827]">
                    {profile.ramp_walk_experience === undefined ? '—' : profile.ramp_walk_experience ? 'Yes' : 'No'}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.28em] text-[#6b7280]">Size</dt>
                  <dd className="font-['Syne'] text-lg font-bold text-[#111827]">{sizeLabel}</dd>
                </div>
              </dl>

              {/* Admin-only fields appended as extra rows (not rendered for public) */}
              {isAdmin && (
                <>
                  <div className="mt-8 pt-8 border-t border-[#3d211a]/10">
                    <div className="font-['Syne'] text-sm font-bold text-[#111827] uppercase tracking-[0.22em]">
                      Admin
                    </div>
                    <dl className="mt-5 grid grid-cols-1 gap-y-6">
                      <div>
                        <dt className="text-[11px] uppercase tracking-[0.28em] text-[#6b7280]">Email</dt>
                        <dd className="font-['Syne'] text-lg font-bold text-[#111827] break-words">{profile.email}</dd>
                      </div>
                      <div>
                        <dt className="text-[11px] uppercase tracking-[0.28em] text-[#6b7280]">Phone</dt>
                        <dd className="font-['Syne'] text-lg font-bold text-[#111827]">{profile.phone ?? '—'}</dd>
                      </div>
                      <div>
                        <dt className="text-[11px] uppercase tracking-[0.28em] text-[#6b7280]">Instagram Handles</dt>
                        <dd className="font-['Syne'] text-lg font-bold text-[#111827]">
                          {profile.instagram && profile.instagram.length > 0
                            ? profile.instagram.map((ig) => `@${ig.handle}`).join(', ')
                            : '—'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[11px] uppercase tracking-[0.28em] text-[#6b7280]">Min Budget (Half)</dt>
                        <dd className="font-['Syne'] text-lg font-bold text-[#111827]">{money(profile.min_budget_half_day)}</dd>
                      </div>
                      <div>
                        <dt className="text-[11px] uppercase tracking-[0.28em] text-[#6b7280]">Min Budget (Full)</dt>
                        <dd className="font-['Syne'] text-lg font-bold text-[#111827]">{money(profile.min_budget_full_day)}</dd>
                      </div>
                      <div>
                        <dt className="text-[11px] uppercase tracking-[0.28em] text-[#6b7280]">Portfolio Link</dt>
                        <dd className="font-['Syne'] text-lg font-bold text-[#111827]">
                          {profile.portfolio_folder_link ? (
                            <a
                              href={profile.portfolio_folder_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#3d211a] hover:underline"
                            >
                              Open
                            </a>
                          ) : (
                            '—'
                          )}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </>
              )}
              </div>
            </div>
          </div>

          {/* PORTFOLIO VIDEOS ROW */}
          <div className="mt-12">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <div className="font-['Syne'] text-sm font-bold text-[#111827] uppercase tracking-[0.22em]">Portfolio Videos</div>
                <div className="text-sm text-[#6b7280]">Autoplay muted.</div>
              </div>
            </div>

            {portfolioVideos.length > 0 ? (
              <PortfolioVideoRow videos={portfolioVideos.map((v) => v.media_url)} />
            ) : (
              <div className="text-sm text-[#6b7280]">
                No portfolio videos uploaded.
              </div>
            )}
          </div>

          {/* PHOTOS PORTFOLIO */}
          <div className="mt-12">
            <div className="flex items-end justify-between gap-4 mb-4">
              <div>
                <div className="font-['Syne'] text-sm font-bold text-[#111827] uppercase tracking-[0.22em]">Photos Portfolio</div>
                <div className="text-sm text-[#6b7280]">Tap to view full image.</div>
              </div>
              <button
                type="button"
                onClick={() => openGalleryAt(0)}
                disabled={portfolioPhotos.length === 0}
                className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-[#111827] disabled:opacity-50 hover:underline"
              >
                View full gallery
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {portfolioPhotos.length > 0 ? (
              <div className="grid grid-cols-3 gap-4">
                {previewPhotos.map((m, idx) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => openGalleryAt(idx)}
                    className="text-left"
                    aria-label={`Open photo ${idx + 1}`}
                  >
                    <div className="relative w-full aspect-[3/4]">
                      <img
                        src={m.media_url}
                        alt={`Portfolio photo ${idx + 1}`}
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-sm text-[#6b7280]">
                No portfolio photos uploaded.
              </div>
            )}
          </div>
        </motion.div>

        {/* Full gallery modal */}
        {galleryOpen && portfolioPhotos.length > 0 && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(61, 33, 26, 0.22)' }}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeGallery();
            }}
          >
            <div className="relative w-full max-w-5xl rounded-3xl border border-[#e5d3a3] bg-white shadow-[0_26px_80px_rgba(61,33,26,0.20)] overflow-hidden">
              <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[#dfcda5]">
                <div className="text-[11px] uppercase tracking-[0.22em] text-[#6b7280]">
                  Photo {galleryIndex + 1} / {portfolioPhotos.length}
                </div>
                <button
                  type="button"
                  onClick={closeGallery}
                  className="w-10 h-10 rounded-full border border-[#dfcda5] hover:bg-[#dfcda5]/40 flex items-center justify-center"
                  aria-label="Close gallery"
                >
                  <X className="w-5 h-5 text-[#111827]" />
                </button>
              </div>

              <div className="relative bg-white">
                <div className="relative w-full max-h-[76vh] aspect-[4/3] md:aspect-[16/10]">
                  {activeGallerySrc && (
                    <img
                      src={activeGallerySrc}
                      alt={`Gallery image ${galleryIndex + 1}`}
                      className="absolute inset-0 w-full h-full object-contain bg-white"
                    />
                  )}
                </div>

                <button
                  type="button"
                  onClick={prevGallery}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full border border-[#d8b56a] bg-[#fdf4e3] hover:border-[#c9a961] flex items-center justify-center"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="w-5 h-5 text-[#111827]" />
                </button>
                <button
                  type="button"
                  onClick={nextGallery}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full border border-[#d8b56a] bg-[#fdf4e3] hover:border-[#c9a961] flex items-center justify-center"
                  aria-label="Next photo"
                >
                  <ChevronRight className="w-5 h-5 text-[#111827]" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

function PortfolioVideoRow({ videos }: { videos: string[] }) {
  const scrollerRef = React.useRef<HTMLDivElement | null>(null);

  const scrollRight = () => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: Math.max(240, Math.floor(el.clientWidth * 0.8)), behavior: 'smooth' });
  };

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        className="no-scrollbar overflow-x-auto flex gap-4 pr-14"
      >
        {videos.map((src, idx) => (
          <div
            key={`${src}_${idx}`}
            className="shrink-0 w-56 sm:w-60"
          >
            <ThemedVideo
              src={src}
              autoPlay={true}
              muted={true}
              loop={true}
              playWhenInView={true}
              exclusiveAudioGroup="talent-profile"
              containerClassName="w-full"
              className="w-full h-full aspect-[9/16] object-cover"
              ariaLabel={`Portfolio video ${idx + 1}`}
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={scrollRight}
        className="absolute right-0 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full border border-[#d8b56a] bg-[#fdf4e3] hover:border-[#c9a961] flex items-center justify-center"
        aria-label="Scroll videos right"
      >
        <ChevronRight className="w-5 h-5 text-[#111827]" />
      </button>
    </div>
  );
}
