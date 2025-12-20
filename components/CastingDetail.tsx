import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, DollarSign, Calendar, ArrowLeft, Users } from 'lucide-react';
import { Casting, getBrandProfileByUserId } from '../services/ProfileService';
import { supabase } from '../services/supabaseClient';

const fetchCastingById = async (id: string): Promise<Casting | null> => {
  const { data, error } = await supabase
    .from('castings')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return (data as Casting) ?? null;
};

export const CastingDetail: React.FC = () => {
  const { castingId } = useParams<{ castingId: string }>();
  const [casting, setCasting] = useState<Casting | null>(null);
  const [brandName, setBrandName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!castingId) {
      setError('Missing casting id');
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const c = await fetchCastingById(castingId);
        if (!c) {
          setError('Casting not found');
          return;
        }
        setCasting(c);
        if (c.user_id) {
          const brandProfile = await getBrandProfileByUserId(c.user_id);
          if (brandProfile?.brand_name) {
            setBrandName(brandProfile.brand_name);
          }
        }
      } catch (err) {
        console.error('Failed to load casting', err);
        setError('Failed to load casting');
      } finally {
        setLoading(false);
      }
    })();
  }, [castingId]);

  const formatBudget = (min?: number | null, max?: number | null) => {
    if (!min && !max) return 'Budget TBA';
    if (min && max) return `₹${min.toLocaleString()} - ₹${max.toLocaleString()}`;
    if (min) return `From ₹${min.toLocaleString()}`;
    return `Up to ₹${max?.toLocaleString()}`;
  };

  if (loading) {
    return (
      <section className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-400 text-sm">Loading casting...</p>
      </section>
    );
  }

  if (error || !casting) {
    return (
      <section className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400 mb-4 text-sm">{error ?? 'Casting not found'}</p>
          <Link
            to="/castings"
            className="inline-flex items-center gap-2 px-4 py-2 border border-zinc-700 rounded-full text-xs uppercase tracking-widest text-zinc-200 hover:bg-zinc-900"
          >
            <ArrowLeft className="w-3 h-3" /> Back to Castings
          </Link>
        </div>
      </section>
    );
  }

  const shortId = casting.id ? casting.id.slice(0, 8) : '';

  return (
    <section className="min-h-screen bg-zinc-950 pt-10 pb-16 px-6">
      <div className="container mx-auto max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/castings"
            className="inline-flex items-center gap-2 px-4 py-2 border border-zinc-800 rounded-full text-[10px] uppercase tracking-[0.2em] text-zinc-300 hover:bg-zinc-900/80"
          >
            <ArrowLeft className="w-3 h-3" /> Back to Castings
          </Link>
          {shortId && (
            <span className="text-[11px] text-zinc-500 uppercase tracking-[0.25em]">ID: {shortId}</span>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900/70 border border-zinc-800 rounded-3xl p-8 md:p-10 shadow-[0_30px_80px_rgba(0,0,0,0.8)]"
        >
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] px-3 py-1 rounded-full bg-zinc-800 text-zinc-200 border border-zinc-700">
                  <Users className="w-3 h-3" /> {brandName || 'Casting' }
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-['Syne'] font-bold text-white mb-3">{casting.title}</h1>
              {casting.description && (
                <p className="text-zinc-300 text-sm leading-relaxed max-w-2xl">{casting.description}</p>
              )}
            </div>

            <div className="w-full md:w-56 space-y-3 text-sm text-zinc-200">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-zinc-500" />
                <span>{casting.location || 'Location TBA'}</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-zinc-500" />
                <span>{formatBudget(casting.budget_min ?? null, casting.budget_max ?? null)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-zinc-500" />
                <span>
                  Apply by{' '}
                  {casting.application_deadline
                    ? new Date(casting.application_deadline).toLocaleDateString()
                    : 'TBA'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-zinc-500" />
                <span>
                  Shoot date{' '}
                  {casting.shoot_date ? new Date(casting.shoot_date).toLocaleDateString() : 'TBA'}
                </span>
              </div>
            </div>
          </div>

          {casting.requirements && (
            <div className="border-t border-zinc-800 pt-6 mt-4">
              <h2 className="text-sm uppercase tracking-[0.25em] text-zinc-500 mb-2">Requirements</h2>
              <p className="text-zinc-200 text-sm leading-relaxed whitespace-pre-line">{casting.requirements}</p>
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/talents"
              className="px-5 py-2.5 rounded-full text-[11px] uppercase tracking-[0.25em] border border-white/30 text-white hover:bg-white hover:text-black transition-colors"
            >
              Browse Talents
            </Link>
            <Link
              to="/profile"
              className="px-5 py-2.5 rounded-full text-[11px] uppercase tracking-[0.25em] border border-zinc-600 text-zinc-200 hover:bg-zinc-900 transition-colors"
            >
              Go to Mod Board
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
