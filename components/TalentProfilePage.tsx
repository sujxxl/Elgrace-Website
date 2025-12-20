import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Ruler, Weight, ArrowLeft } from 'lucide-react';
import { getProfileByUserId, ProfileData } from '../services/ProfileService';

export const TalentProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setError('Missing talent id');
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const data = await getProfileByUserId(userId);
        if (!data) {
          setError('Talent not found or not online yet.');
        } else {
          setProfile(data);
        }
      } catch (err) {
        console.error('Failed to load profile', err);
        setError('Failed to load talent profile');
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  if (loading) {
    return (
      <section className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-400 text-sm">Loading talent...</p>
      </section>
    );
  }

  if (error || !profile) {
    return (
      <section className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400 mb-4 text-sm">{error ?? 'Talent not found'}</p>
          <Link
            to="/talents"
            className="inline-flex items-center gap-2 px-4 py-2 border border-zinc-700 rounded-full text-xs uppercase tracking-widest text-zinc-200 hover:bg-zinc-900"
          >
            <ArrowLeft className="w-3 h-3" /> Back to Talents
          </Link>
        </div>
      </section>
    );
  }

  const location = [profile.city, profile.state, profile.country].filter(Boolean).join(', ');
  const feet = profile.height_feet ?? 0;
  const inches = profile.height_inches ?? 0;
  const heightLabel = feet || inches ? `${feet}'${inches}"` : 'N/A';
  const weightLabel = profile.weight ? `${profile.weight} kg` : 'N/A';

  return (
    <section className="min-h-screen bg-zinc-950 pt-10 pb-16 px-6">
      <div className="container mx-auto max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/talents"
            className="inline-flex items-center gap-2 px-4 py-2 border border-zinc-800 rounded-full text-[10px] uppercase tracking-[0.2em] text-zinc-300 hover:bg-zinc-900/80"
          >
            <ArrowLeft className="w-3 h-3" /> Back to Talents
          </Link>
          <Link
            to="/profile"
            className="inline-flex items-center gap-2 px-4 py-2 border border-zinc-700 rounded-full text-[10px] uppercase tracking-[0.2em] text-zinc-200 hover:bg-zinc-900/80"
          >
            Go to Mod Board
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900/70 border border-zinc-800 rounded-3xl overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.8)]"
        >
          <div className="h-64 bg-gradient-to-br from-zinc-800 via-zinc-900 to-black relative">
            {profile.cover_photo_url && (
              <img
                src={profile.cover_photo_url}
                alt={profile.full_name}
                className="w-full h-full object-cover opacity-80"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-['Syne'] font-bold text-white mb-1">{profile.full_name}</h1>
                <p className="text-zinc-300 text-sm uppercase tracking-[0.25em]">
                  {profile.category === 'model' ? 'MODEL' : 'CLIENT'}
                </p>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-zinc-200">
                {location && (
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 border border-zinc-700">
                    <MapPin className="w-3 h-3 text-zinc-400" /> {location}
                  </span>
                )}
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 border border-zinc-700">
                  <Ruler className="w-3 h-3 text-zinc-400" /> {heightLabel}
                </span>
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 border border-zinc-700">
                  <Weight className="w-3 h-3 text-zinc-400" /> {weightLabel}
                </span>
              </div>
            </div>
          </div>

          <div className="p-8 md:p-10 grid md:grid-cols-3 gap-10">
            <div className="space-y-6 md:col-span-2">
              <div>
                <h2 className="text-sm uppercase tracking-[0.25em] text-zinc-500 mb-2">Profile</h2>
                <div className="space-y-1 text-sm text-zinc-200">
                  <p>Email: <span className="text-zinc-300">{profile.email}</span></p>
                  <p>Phone: <span className="text-zinc-300">{profile.phone}</span></p>
                  <p>DOB: <span className="text-zinc-300">{profile.dob}</span></p>
                  <p>Gender: <span className="text-zinc-300">{profile.gender}</span></p>
                </div>
              </div>

              {profile.languages && profile.languages.length > 0 && (
                <div>
                  <h2 className="text-sm uppercase tracking-[0.25em] text-zinc-500 mb-2">Languages</h2>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {profile.languages.map((lang) => (
                      <span
                        key={lang}
                        className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-200"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile.skills && profile.skills.length > 0 && (
                <div>
                  <h2 className="text-sm uppercase tracking-[0.25em] text-zinc-500 mb-2">Skills</h2>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {profile.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-200"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile.ramp_walk_description && (
                <div>
                  <h2 className="text-sm uppercase tracking-[0.25em] text-zinc-500 mb-2">Ramp Walk Experience</h2>
                  <p className="text-sm text-zinc-200 whitespace-pre-line">{profile.ramp_walk_description}</p>
                </div>
              )}
            </div>

            <div className="space-y-6">
              {profile.instagram && profile.instagram.length > 0 && (
                <div>
                  <h2 className="text-sm uppercase tracking-[0.25em] text-zinc-500 mb-2">Instagram</h2>
                  <div className="space-y-2 text-sm text-zinc-200">
                    {profile.instagram.map((ig) => (
                      <div key={ig.handle} className="flex justify-between gap-4">
                        <span>@{ig.handle}</span>
                        <span className="text-xs text-zinc-400">{ig.followers.replace(/_/g, ' ')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h2 className="text-sm uppercase tracking-[0.25em] text-zinc-500 mb-2">Meta</h2>
                <div className="space-y-1 text-xs text-zinc-400">
                  <p>Status: <span className="text-zinc-200">{profile.status ?? 'UNDER_REVIEW'}</span></p>
                  {profile.open_to_travel !== undefined && (
                    <p>Open to travel: <span className="text-zinc-200">{profile.open_to_travel ? 'Yes' : 'No'}</span></p>
                  )}
                  {profile.experience_level && (
                    <p>Experience: <span className="text-zinc-200">{profile.experience_level}</span></p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
