import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronLeft, ChevronRight, MapPin, Ruler, Weight, X } from 'lucide-react';
import { getProfileByUserId, ProfileData } from '../services/ProfileService';
import { deriveMedia, fetchMediaRecords, DerivedMedia } from '../services/mediaService';
import { ThemedVideo } from './ThemedVideo';

export const TalentProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
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
      <div className="container mx-auto max-w-6xl">
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
          className="rounded-3xl border border-[#e5d3a3] bg-white p-6 md:p-8 shadow-[0_16px_50px_rgba(61,33,26,0.12)]"
        >
          <div className="grid grid-cols-1 md:grid-cols-[240px_1fr_300px] gap-6 md:gap-8 items-stretch">
            {/* Name Initial + Model Code */}
            <div className="rounded-2xl border border-[#e5d3a3] bg-white p-5 flex flex-col justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#dfcda5] border border-[#c9a961] flex items-center justify-center">
                  <span className="font-['Syne'] text-2xl font-bold text-[#3d211a]">{modelInitial}</span>
                </div>
                <div className="min-w-0">
                  <div className="font-['Syne'] text-lg font-bold text-[#111827] truncate">{profile.full_name}</div>
                  <div className="text-[11px] uppercase tracking-[0.24em] text-[#6b7280]">Model Code</div>
                </div>
              </div>

              <div className="mt-5 flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs uppercase tracking-[0.28em] text-[#6b7280]">{profile.category === 'model' ? 'Model' : 'Client'}</div>
                  <div className="font-['Syne'] text-xl font-bold text-[#111827] truncate">{modelCode}</div>
                </div>
                <div className="text-[11px] uppercase tracking-[0.2em] text-[#4b5563]">
                  {profile.status ?? 'UNDER_REVIEW'}
                </div>
              </div>
            </div>

            {/* Cover Photo */}
            <div className="rounded-2xl border border-[#e5d3a3] bg-white overflow-hidden">
              <div className="relative w-full aspect-[4/3] md:aspect-[16/10]">
                {hasCover ? (
                  <img
                    src={coverUrl}
                    alt={profile.full_name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-white">
                    <div className="text-center">
                      <div className="font-['Syne'] text-lg font-bold text-[#111827]">No cover photo</div>
                      <div className="text-sm text-[#6b7280]">Cover photo will appear here.</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Measurements / Details */}
            <div className="rounded-2xl border border-[#e5d3a3] bg-white p-5">
              <div className="font-['Syne'] text-sm font-bold text-[#111827] uppercase tracking-[0.22em] mb-4">
                Measurements
              </div>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.22em] text-[#6b7280]">Location</dt>
                  <dd className="text-[#111827] flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#3d211a]" />
                    <span className="truncate">{location || '—'}</span>
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.22em] text-[#6b7280]">Age</dt>
                  <dd className="text-[#111827]">{age != null ? `${age} yrs` : '—'}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.22em] text-[#6b7280]">Height</dt>
                  <dd className="text-[#111827] flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-[#3d211a]" /> {heightLabel}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.22em] text-[#6b7280]">Size</dt>
                  <dd className="text-[#111827] flex items-center gap-2">
                    <Weight className="w-4 h-4 text-[#3d211a]" /> {sizeLabel}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.22em] text-[#6b7280]">Bust/Chest</dt>
                  <dd className="text-[#111827]">{profile.bust_chest ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.22em] text-[#6b7280]">Waist</dt>
                  <dd className="text-[#111827]">{profile.waist ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.22em] text-[#6b7280]">Hips</dt>
                  <dd className="text-[#111827]">{profile.hips ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.22em] text-[#6b7280]">Shoe</dt>
                  <dd className="text-[#111827]">{profile.shoe_size ?? '—'}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* PORTFOLIO VIDEOS ROW */}
          <div className="mt-8">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <div className="font-['Syne'] text-sm font-bold text-[#111827] uppercase tracking-[0.22em]">Portfolio Videos</div>
                <div className="text-sm text-[#6b7280]">Autoplay muted; tap controls to play or unmute.</div>
              </div>
            </div>

            {portfolioVideos.length > 0 ? (
              <PortfolioVideoRow videos={portfolioVideos.map((v) => v.media_url)} />
            ) : (
              <div className="rounded-2xl border border-[#e5d3a3] bg-white p-5 text-sm text-[#6b7280]">
                No portfolio videos uploaded.
              </div>
            )}
          </div>

          {/* INTRO VIDEO (FEATURED) */}
          {introVideoUrl && (
            <div className="mt-10">
              <div className="text-center mb-3">
                <div className="font-['Syne'] text-sm font-bold text-[#111827] uppercase tracking-[0.22em]">Intro Video</div>
                <div className="text-sm text-[#6b7280]">Featured intro — autoplay muted when in view.</div>
              </div>

              <div className="mx-auto max-w-4xl">
                <ThemedVideo
                  src={introVideoUrl}
                  autoPlay={false}
                  muted={true}
                  loop={true}
                  playWhenInView={true}
                  exclusiveAudioGroup="talent-profile"
                  containerClassName="w-full rounded-2xl border border-[#e5d3a3] bg-white overflow-hidden"
                  className="w-full h-full aspect-video object-cover"
                  ariaLabel="Intro video"
                />
              </div>
            </div>
          )}

          {/* PHOTOS PORTFOLIO */}
          <div className="mt-10">
            <div className="flex items-end justify-between gap-4 mb-4">
              <div>
                <div className="font-['Syne'] text-sm font-bold text-[#111827] uppercase tracking-[0.22em]">Photos Portfolio</div>
                <div className="text-sm text-[#6b7280]">Tap to view full image.</div>
              </div>
              <button
                type="button"
                onClick={() => openGalleryAt(0)}
                disabled={portfolioPhotos.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#c9a961] bg-transparent text-[11px] uppercase tracking-[0.2em] text-[#111827] hover:bg-[#e5d3a3]/50 disabled:opacity-50"
              >
                View full gallery
              </button>
            </div>

            {portfolioPhotos.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {previewPhotos.map((m, idx) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => openGalleryAt(idx)}
                    className="group text-left rounded-xl border border-[#e5d3a3] bg-white overflow-hidden transition-shadow hover:shadow-[0_12px_30px_rgba(61,33,26,0.14)]"
                    aria-label={`Open photo ${idx + 1}`}
                  >
                    <div className="relative w-full aspect-[3/4] bg-white">
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
              <div className="rounded-2xl border border-[#e5d3a3] bg-white p-5 text-sm text-[#6b7280]">
                No portfolio photos uploaded.
              </div>
            )}
          </div>
        </motion.div>

        {/* Details sections (keep all existing info) */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-3xl border border-[#e5d3a3] bg-white p-6 md:p-8 shadow-[0_12px_34px_rgba(61,33,26,0.10)]">
            <div className="font-['Syne'] text-sm font-bold text-[#111827] uppercase tracking-[0.22em] mb-4">Profile</div>
            <div className="space-y-2 text-sm text-[#4b5563]">
              <p>Email: <span className="text-[#111827]">{profile.email}</span></p>
              <p>Phone: <span className="text-[#111827]">{profile.phone ?? '—'}</span></p>
              <p>Gender: <span className="text-[#111827]">{profile.gender}</span></p>
              <p>Nationality: <span className="text-[#111827]">{profile.nationality}</span></p>
              <p>Country: <span className="text-[#111827]">{profile.country ?? '—'}</span></p>
              <p>State: <span className="text-[#111827]">{profile.state ?? '—'}</span></p>
              <p>City: <span className="text-[#111827]">{profile.city ?? '—'}</span></p>
              {profile.weight != null && <p>Weight: <span className="text-[#111827]">{profile.weight}</span></p>}
            </div>

            {profile.ramp_walk_description && (
              <div className="mt-6">
                <div className="text-[11px] uppercase tracking-[0.22em] text-[#6b7280] mb-2">Ramp Walk Experience</div>
                <p className="text-sm text-[#4b5563] whitespace-pre-line">{profile.ramp_walk_description}</p>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-[#e5d3a3] bg-white p-6 md:p-8 shadow-[0_12px_34px_rgba(61,33,26,0.10)]">
            <div className="font-['Syne'] text-sm font-bold text-[#111827] uppercase tracking-[0.22em] mb-4">Details</div>

            {profile.instagram && profile.instagram.length > 0 && (
              <div className="mb-6">
                <div className="text-[11px] uppercase tracking-[0.22em] text-[#6b7280] mb-2">Instagram</div>
                <div className="space-y-2 text-sm text-[#4b5563]">
                  {profile.instagram.map((ig) => (
                    <div key={ig.handle} className="flex justify-between gap-4">
                      <span className="text-[#111827]">@{ig.handle}</span>
                      <span className="text-[11px] uppercase tracking-[0.18em] text-[#6b7280]">{ig.followers.replace(/_/g, ' ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {profile.languages && profile.languages.length > 0 && (
              <div className="mb-6">
                <div className="text-[11px] uppercase tracking-[0.22em] text-[#6b7280] mb-2">Languages</div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {profile.languages.map((lang) => (
                    <span key={lang} className="px-3 py-1 rounded-full border border-[#d8b56a] bg-[#fdf4e3] text-[#111827]">
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {profile.skills && profile.skills.length > 0 && (
              <div className="mb-6">
                <div className="text-[11px] uppercase tracking-[0.22em] text-[#6b7280] mb-2">Skills</div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {profile.skills.map((skill) => (
                    <span key={skill} className="px-3 py-1 rounded-full border border-[#d8b56a] bg-[#fdf4e3] text-[#111827]">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-6">
              <div className="text-[11px] uppercase tracking-[0.22em] text-[#6b7280] mb-2">Meta</div>
              <div className="space-y-1 text-sm text-[#4b5563]">
                <p>Status: <span className="text-[#111827]">{profile.status ?? 'UNDER_REVIEW'}</span></p>
                {profile.open_to_travel !== undefined && (
                  <p>Open to travel: <span className="text-[#111827]">{profile.open_to_travel ? 'Yes' : 'No'}</span></p>
                )}
                {profile.experience_level && (
                  <p>Experience: <span className="text-[#111827]">{profile.experience_level}</span></p>
                )}
              </div>
            </div>

            {profile.portfolio_folder_link && (
              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-[#6b7280] mb-2">Portfolio</div>
                <a
                  href={profile.portfolio_folder_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-4 py-2 rounded-full border border-[#c9a961] bg-transparent text-[11px] uppercase tracking-[0.2em] text-[#111827] hover:bg-[#e5d3a3]/50"
                >
                  View Full Portfolio on Drive
                </a>
              </div>
            )}
          </div>
        </div>

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
              autoPlay={false}
              muted={true}
              loop={true}
              playWhenInView={true}
              exclusiveAudioGroup="talent-profile"
              containerClassName="w-full rounded-2xl border border-[#e5d3a3] bg-white overflow-hidden"
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
