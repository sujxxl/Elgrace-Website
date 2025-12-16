import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PROFILE_TABLE_SQL, ProfileData, InstagramHandle, getProfileByUserId, upsertProfile, uploadImage } from '../services/ProfileService';
import { CheckCircle2 } from 'lucide-react';
import { Country, State, City } from 'country-state-city';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

type StepKey = 'personal-info' | 'professional-info' | 'measurements' | 'photos-media';
const steps: { key: StepKey; label: string }[] = [
  { key: 'personal-info', label: 'Personal Information' },
  { key: 'professional-info', label: 'Professional Information' },
  { key: 'measurements', label: 'Measurements' },
  { key: 'photos-media', label: 'Photos / Media' },
];

export const ProfileEdit: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const query = useQuery();
  const requestedSection = (query.get('section') as StepKey) || 'personal-info';

  const [active, setActive] = useState<StepKey>(requestedSection);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<StepKey | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [languageInput, setLanguageInput] = useState('');
  const [skillInput, setSkillInput] = useState('');

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const existing = await getProfileByUserId(user.id);
        setProfile(existing ?? {
          user_id: user.id,
          full_name: '',
          dob: '',
          gender: 'male',
          phone: '',
          email: user.email,
          country: '',
          state: '',
          city: '',
          category: 'model',
          instagram: [{ handle: '', followers: 'under_5k' }],
        });
      } catch (e) {
        console.error(e);
        // Ensure form still renders even if table/query fails
        setProfile({
          user_id: user.id,
          full_name: '',
          dob: '',
          gender: 'male',
          phone: '',
          email: user.email,
          country: '',
          state: '',
          city: '',
          category: 'model',
          instagram: [{ handle: '', followers: 'under_5k' }],
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  useEffect(() => {
    setActive(requestedSection);
    const el = document.getElementById(requestedSection);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [requestedSection]);

  if (!user) {
    return (
      <section className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 backdrop-blur-sm text-center">
          <h3 className="text-2xl font-['Syne'] font-bold mb-2">Login Required</h3>
          <p className="text-zinc-400">Please log in to edit your profile.</p>
        </div>
      </section>
    );
  }

  const onSave = async (part: StepKey, patch: Partial<ProfileData>) => {
    if (!profile) return;
    setSaving(part);
    try {
      const merged: ProfileData = { ...profile, ...patch, user_id: user.id, email: user.email, category: 'model' };
      const saved = await upsertProfile(merged);
      setProfile(saved);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (e) {
      console.error(e);
      const msg = (e as any)?.message ?? 'Failed to save. Please try again.';
      alert(msg);
    } finally {
      setSaving(null);
    }
  };

  const completed = {
    personal: !!profile?.full_name && !!profile?.dob && !!profile?.gender && !!profile?.phone && !!profile?.country && !!profile?.state && !!profile?.city && (profile?.instagram?.length ?? 0) > 0 && !!profile?.instagram?.[0]?.handle,
    professional: !!profile?.experience_level && profile?.open_to_travel !== undefined && profile?.ramp_walk_experience !== undefined && (profile?.ramp_walk_experience ? !!profile?.ramp_walk_description : true) && (profile?.languages?.length ?? 0) > 0,
    measurements: !!profile?.height_feet && !!profile?.height_inches && !!profile?.bust_chest && !!profile?.waist && !!profile?.shoe_size,
    media: !!profile?.cover_photo_url,
  };

  return (
    <section className="container mx-auto px-6">
      {/* Step Indicator */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm mb-6">
        <div className="grid md:grid-cols-4 gap-3">
          {steps.map((s) => {
            const isCompleted = completed[s.key as keyof typeof completed];
            const isCurrent = active === s.key;
            return (
              <button key={s.key} onClick={() => setActive(s.key)} className={`flex items-center justify-between px-4 py-3 rounded-lg border text-sm ${isCurrent ? 'border-[#dfcda5] bg-white/10 text-white' : 'border-white/10 bg-white/5 text-zinc-300'}`}>
                <span>{s.label}</span>
                {isCompleted && <CheckCircle2 className="w-4 h-4 text-white/70" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Step */}
      {active === 'personal-info' && profile && (
        <div id="personal-info"><PersonalForm profile={profile} onSave={(patch) => onSave('personal-info', patch)} saving={saving === 'personal-info'} /></div>
      )}
      {active === 'professional-info' && profile && (
        <div id="professional-info"><ProfessionalForm profile={profile} onSave={(patch) => onSave('professional-info', patch)} saving={saving === 'professional-info'} /></div>
      )}
      {active === 'measurements' && profile && (
        <div id="measurements"><MeasurementsForm profile={profile} onSave={(patch) => onSave('measurements', patch)} saving={saving === 'measurements'} /></div>
      )}
      {active === 'photos-media' && profile && (
        <div id="photos-media"><MediaForm profile={profile} onSave={(patch) => onSave('photos-media', patch)} saving={saving === 'photos-media'} /></div>
      )}

      {/* Success Toast */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 border-2 border-[#dfcda5] rounded-xl px-6 py-4 shadow-2xl backdrop-blur-md animate-slide-up">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#dfcda5]" />
            <span className="text-white font-semibold">Profile saved successfully!</span>
          </div>
        </div>
      )}
    </section>
  );
};

/* STEP 1: PERSONAL */
const PersonalForm: React.FC<{ profile: ProfileData; saving: boolean; onSave: (patch: Partial<ProfileData>) => void; }> = ({ profile, onSave, saving }) => {
  const [form, setForm] = useState<ProfileData>(profile);
  useEffect(() => setForm(profile), [profile]);

  const normalizeDateInput = (d?: string | null) => {
    if (!d) return '';
    const s = String(d);
    return s.includes('T') ? s.split('T')[0] : s;
  };

  // Country-State-City logic
  const countries = Country.getAllCountries();
  const states = form.country ? State.getStatesOfCountry(form.country) : [];
  const cities = form.state ? City.getCitiesOfState(form.country, form.state) : [];

  const handleCountryChange = (isoCode: string) => {
    const country = countries.find(c => c.isoCode === isoCode);
    setForm({ ...form, country: isoCode, state: '', city: '' });
  };

  const handleStateChange = (isoCode: string) => {
    setForm({ ...form, state: isoCode, city: '' });
  };

  const followerBuckets = [
    { value: 'under_5k', label: 'Under 5K' },
    { value: '5k_20k', label: '5K–20K' },
    { value: '20k_50k', label: '20K–50K' },
    { value: '50k_100k', label: '50K–100K' },
    { value: '100k_plus', label: '100K+' },
  ];

  const updateInstagram = (idx: number, key: keyof InstagramHandle, value: string) => {
    const next = [...form.instagram];
    const item = { ...next[idx], [key]: value } as InstagramHandle;
    next[idx] = item;
    setForm({ ...form, instagram: next });
  };

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm">
      <h4 className="text-lg font-['Syne'] font-bold mb-4">Personal Information</h4>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Full Name</label>
          <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white focus:outline-none focus:border-white/50" />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Date of Birth</label>
          <input
            type="date"
            value={normalizeDateInput(form.dob)}
            onChange={(e) => setForm({ ...form, dob: e.target.value })}
            required
            className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white focus:outline-none focus:border-white/50"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Gender</label>
          <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as any })} className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white">
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Phone Number</label>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white focus:outline-none focus:border-white/50" />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Contact Email</label>
          <input value={form.email} readOnly className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white" />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Country</label>
          <select value={form.country} onChange={(e) => handleCountryChange(e.target.value)} required className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white">
            <option value="">Select Country</option>
            {countries.map(c => <option key={c.isoCode} value={c.isoCode}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">State</label>
          <select value={form.state} onChange={(e) => handleStateChange(e.target.value)} required disabled={!form.country} className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white disabled:opacity-50">
            <option value="">Select State</option>
            {states.map(s => <option key={s.isoCode} value={s.isoCode}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">City</label>
          <select value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required disabled={!form.state} className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white disabled:opacity-50">
            <option value="">Select City</option>
            {cities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Category</label>
          <input value={form.category} readOnly className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white" />
        </div>
      </div>

      {/* Instagram */}
      <div className="mt-6">
        <h5 className="text-sm uppercase tracking-widest text-zinc-500 mb-2">Instagram Details</h5>
        <div className="space-y-3">
          {form.instagram.map((ig, idx) => (
            <div key={idx} className="grid md:grid-cols-2 gap-3">
              <input value={ig.handle} onChange={(e) => updateInstagram(idx, 'handle', e.target.value)} placeholder="Instagram Handle" className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white focus:outline-none focus:border-white/50" />
              <select value={ig.followers} onChange={(e) => updateInstagram(idx, 'followers', e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white">
                {followerBuckets.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
              </select>
              <div className="md:col-span-2 flex gap-3">
                <button type="button" onClick={() => setForm({ ...form, instagram: form.instagram.filter((_, i) => i !== idx) })} className="px-3 py-2 rounded-xl border border-white/10 text-zinc-300 hover:border-[#dfcda5]">Remove</button>
              </div>
            </div>
          ))}
          <button type="button" onClick={() => setForm({ ...form, instagram: [...form.instagram, { handle: '', followers: 'under_5k' }] })} className="px-4 py-2 rounded-xl border border-white/10 text-zinc-300 hover:border-[#dfcda5]">Add another handle</button>
        </div>
      </div>

      <div className="pt-4 flex gap-3">
        <button disabled={saving} onClick={() => onSave({
          full_name: form.full_name,
          dob: form.dob,
          gender: form.gender,
          phone: form.phone,
          country: form.country,
          state: form.state,
          city: form.city,
          instagram: form.instagram,
        })} className="px-4 py-3 rounded-2xl bg-gradient-to-br from-zinc-800 via-zinc-700 to-zinc-600 text-white font-bold uppercase tracking-widest border-2 border-[#dfcda5]">Save Personal Info</button>
      </div>
    </div>
  );
};

/* STEP 2: PROFESSIONAL */
const ProfessionalForm: React.FC<{ profile: ProfileData; saving: boolean; onSave: (patch: Partial<ProfileData>) => void; }> = ({ profile, onSave, saving }) => {
  const [form, setForm] = useState<ProfileData>(profile);
  const [languageInput, setLanguageInput] = useState('');
  const [skillInput, setSkillInput] = useState('');
  useEffect(() => setForm(profile), [profile]);

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm">
      <h4 className="text-lg font-['Syne'] font-bold mb-4">Professional Information</h4>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Experience Level</label>
          <select value={form.experience_level} onChange={(e) => setForm({ ...form, experience_level: e.target.value as any })} className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white">
            <option value="lt_1">Less than 1 year</option>
            <option value="1_3">1–3 years</option>
            <option value="3_5">3–5 years</option>
            <option value="gt_5">Over 5 years</option>
          </select>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Languages Spoken</label>
          <div className="flex gap-2 mb-3">
            <input type="text" value={languageInput} onChange={(e) => setLanguageInput(e.target.value)} onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (languageInput.trim() && !form.languages?.includes(languageInput.trim())) { setForm({ ...form, languages: [...(form.languages || []), languageInput.trim()] }); setLanguageInput(''); } } }} placeholder="Enter language (e.g., Hindi, Tamil)" className="flex-1 bg-zinc-950 border border-zinc-800 p-3 text-white focus:outline-none focus:border-white/50 rounded-lg" />
            <button type="button" onClick={() => { if (languageInput.trim() && !form.languages?.includes(languageInput.trim())) { setForm({ ...form, languages: [...(form.languages || []), languageInput.trim()] }); setLanguageInput(''); } }} className="px-4 py-3 bg-[#dfcda5] text-black font-bold rounded-lg hover:bg-[#e8d7b8] transition-colors">Add</button>
          </div>
          {form.languages && form.languages.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.languages.map((lang) => (
                <div key={lang} className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-[#dfcda5] rounded-full">
                  <span className="text-white text-sm">{lang}</span>
                  <button type="button" onClick={() => setForm({ ...form, languages: form.languages?.filter(l => l !== lang) })} className="text-[#dfcda5] hover:text-white transition-colors">×</button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Special Skills (optional)</label>
          <div className="flex gap-2 mb-3">
            <input type="text" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (skillInput.trim() && !form.skills?.includes(skillInput.trim())) { setForm({ ...form, skills: [...(form.skills || []), skillInput.trim()] }); setSkillInput(''); } } }} placeholder="Enter skill (e.g., Ramp Walk, Acting)" className="flex-1 bg-zinc-950 border border-zinc-800 p-3 text-white focus:outline-none focus:border-white/50 rounded-lg" />
            <button type="button" onClick={() => { if (skillInput.trim() && !form.skills?.includes(skillInput.trim())) { setForm({ ...form, skills: [...(form.skills || []), skillInput.trim()] }); setSkillInput(''); } }} className="px-4 py-3 bg-[#dfcda5] text-black font-bold rounded-lg hover:bg-[#e8d7b8] transition-colors">Add</button>
          </div>
          {form.skills && form.skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.skills.map((skill) => (
                <div key={skill} className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-[#dfcda5] rounded-full">
                  <span className="text-white text-sm">{skill}</span>
                  <button type="button" onClick={() => setForm({ ...form, skills: form.skills?.filter(s => s !== skill) })} className="text-[#dfcda5] hover:text-white transition-colors">×</button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Open to Travel?</label>
          <div className="flex gap-3">
            <button type="button" onClick={() => setForm({ ...form, open_to_travel: true })} className={`px-4 py-2 rounded-xl border ${form.open_to_travel ? 'border-[#dfcda5] text-white' : 'border-white/10 text-zinc-300'}`}>Yes</button>
            <button type="button" onClick={() => setForm({ ...form, open_to_travel: false })} className={`px-4 py-2 rounded-xl border ${form.open_to_travel === false ? 'border-[#dfcda5] text-white' : 'border-white/10 text-zinc-300'}`}>No</button>
          </div>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Has Ramp Walk Experience?</label>
          <div className="flex gap-3">
            <button type="button" onClick={() => setForm({ ...form, ramp_walk_experience: true })} className={`px-4 py-2 rounded-xl border ${form.ramp_walk_experience ? 'border-[#dfcda5] text-white' : 'border-white/10 text-zinc-300'}`}>Yes</button>
            <button type="button" onClick={() => setForm({ ...form, ramp_walk_experience: false })} className={`px-4 py-2 rounded-xl border ${form.ramp_walk_experience === false ? 'border-[#dfcda5] text-white' : 'border-white/10 text-zinc-300'}`}>No</button>
          </div>
        </div>
        {form.ramp_walk_experience && (
          <div className="md:col-span-2">
            <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Ramp Walk Description</label>
            <textarea value={form.ramp_walk_description || ''} onChange={(e) => setForm({ ...form, ramp_walk_description: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white focus:outline-none focus:border-white/50 h-24" placeholder="List fashion shows, designers, or brands you’ve walked for." />
          </div>
        )}
      </div>
      <div className="pt-4">
        <button disabled={saving} onClick={() => onSave({
          experience_level: form.experience_level,
          languages: form.languages,
          skills: form.skills,
          open_to_travel: form.open_to_travel,
          ramp_walk_experience: form.ramp_walk_experience,
          ramp_walk_description: form.ramp_walk_description || null,
        })} className="px-4 py-3 rounded-2xl bg-gradient-to-br from-zinc-800 via-zinc-700 to-zinc-600 text-white font-bold uppercase tracking-widest border-2 border-[#dfcda5]">Save Professional Info</button>
      </div>
    </div>
  );
};

/* STEP 3: MEASUREMENTS */
const MeasurementsForm: React.FC<{ profile: ProfileData; saving: boolean; onSave: (patch: Partial<ProfileData>) => void; }> = ({ profile, onSave, saving }) => {
  const [form, setForm] = useState<ProfileData>(profile);
  useEffect(() => setForm(profile), [profile]);

  const nums = (start: number, end: number) => Array.from({ length: end - start + 1 }, (_, i) => start + i);
  const feet = nums(4, 7);
  const inches = nums(0, 11);
  const measureInches = nums(20, 50);
  const weights = nums(40, 120);
  const shoeSizes = ['UK-5','UK-6','UK-7','UK-8','UK-9','UK-10','US-6','US-7','US-8','US-9','US-10','US-11'];

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm">
      <h4 className="text-lg font-['Syne'] font-bold mb-2">Your Measurements</h4>
      <p className="text-zinc-500 mb-4">Please provide accurate measurements. These help us match you to the right opportunities.</p>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Height (Feet)</label>
          <select value={form.height_feet} onChange={(e) => setForm({ ...form, height_feet: Number(e.target.value) })} className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white">
            {feet.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Height (Inches)</label>
          <select value={form.height_inches} onChange={(e) => setForm({ ...form, height_inches: Number(e.target.value) })} className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white">
            {inches.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Bust / Chest (inches)</label>
          <select value={form.bust_chest} onChange={(e) => setForm({ ...form, bust_chest: Number(e.target.value) })} className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white">
            {measureInches.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Waist (inches)</label>
          <select value={form.waist} onChange={(e) => setForm({ ...form, waist: Number(e.target.value) })} className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white">
            {measureInches.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Hips (inches)</label>
          <select value={form.hips ?? ''} onChange={(e) => setForm({ ...form, hips: Number(e.target.value) })} className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white">
            <option value="">—</option>
            {measureInches.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Weight (kg)</label>
          <select value={form.weight ?? ''} onChange={(e) => setForm({ ...form, weight: Number(e.target.value) })} className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white">
            <option value="">—</option>
            {weights.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Shoe Size</label>
          <select value={form.shoe_size} onChange={(e) => setForm({ ...form, shoe_size: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white">
            {shoeSizes.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div className="pt-4">
        <button disabled={saving} onClick={() => onSave({
          height_feet: form.height_feet,
          height_inches: form.height_inches,
          bust_chest: form.bust_chest,
          waist: form.waist,
          hips: form.hips ?? null,
          weight: form.weight ?? null,
          shoe_size: form.shoe_size,
        })} className="px-4 py-3 rounded-2xl bg-gradient-to-br from-zinc-800 via-zinc-700 to-zinc-600 text-white font-bold uppercase tracking-widest border-2 border-[#dfcda5]">Save Measurements</button>
      </div>
    </div>
  );
};

/* STEP 4: MEDIA */
const MediaForm: React.FC<{ profile: ProfileData; saving: boolean; onSave: (patch: Partial<ProfileData>) => void; }> = ({ profile, onSave, saving }) => {
  const [form, setForm] = useState<ProfileData>(profile);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<FileList | null>(null);

  useEffect(() => setForm(profile), [profile]);

  const handleUpload = async () => {
    if (coverFile) {
      const url = await uploadImage(coverFile, `covers/${form.user_id}.jpg`);
      form.cover_photo_url = url;
    }
    if (galleryFiles && galleryFiles.length) {
      const urls: string[] = [];
      for (let i = 0; i < galleryFiles.length; i++) {
        const f = galleryFiles.item(i)!;
        const url = await uploadImage(f, `gallery/${form.user_id}-${Date.now()}-${i}.jpg`);
        urls.push(url);
      }
      form.gallery_urls = urls;
    }
  };

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm">
      <h4 className="text-lg font-['Syne'] font-bold mb-4">Photos / Media</h4>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Cover Photo (required)</label>
          <input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} className="w-full text-zinc-300" />
          {form.cover_photo_url && <img src={form.cover_photo_url} alt="Cover" className="mt-2 h-32 object-cover rounded" />}
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Additional Photos (optional)</label>
          <input type="file" accept="image/*" multiple onChange={(e) => setGalleryFiles(e.target.files)} className="w-full text-zinc-300" />
        </div>
      </div>
      <div className="pt-4 flex gap-3">
        <button disabled={saving} onClick={async () => { await handleUpload(); await onSave({ cover_photo_url: form.cover_photo_url, gallery_urls: form.gallery_urls }); }} className="px-4 py-3 rounded-2xl bg-gradient-to-br from-zinc-800 via-zinc-700 to-zinc-600 text-white font-bold uppercase tracking-widest border-2 border-[#dfcda5]">Save Media</button>
      </div>
    </div>
  );
};
