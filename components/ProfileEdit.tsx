import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ProfileData, InstagramHandle, getProfileByUserId, upsertProfile, uploadImage } from '../services/ProfileService';
import { buildDriveImageUrls } from '../services/gdrive';
import { compressImageFile } from '../services/image';
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
          intro_video_url: '',
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
          intro_video_url: '',
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
        <div className="max-w-4xl mx-auto bg-white border border-gray-200 rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-['Syne'] font-bold mb-2 text-black">Login Required</h3>
          <p className="text-gray-600">Please log in to edit your profile.</p>
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
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
        <div className="grid md:grid-cols-4 gap-3">
          {steps.map((s) => {
            const isCompleted = completed[s.key as keyof typeof completed];
            const isCurrent = active === s.key;
            return (
              <button key={s.key} onClick={() => setActive(s.key)} className={`flex items-center justify-between px-4 py-3 rounded-lg border text-sm ${isCurrent ? 'border-[#c9a961] bg-[#fbf3e4] text-black font-semibold' : 'border-gray-300 bg-white text-gray-700'}`}>
                <span>{s.label}</span>
                {isCompleted && <CheckCircle2 className="w-4 h-4 text-[#c9a961]" />}
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
        <div className="fixed bottom-6 right-6 z-50 bg-white border-2 border-[#c9a961] rounded-xl px-6 py-4 shadow-2xl animate-slide-up">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#c9a961]" />
            <span className="text-black font-semibold">Profile saved successfully!</span>
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
  const [ageInput, setAgeInput] = useState<number | ''>(() => {
    if (!profile.dob) return '';
    const d = new Date(profile.dob);
    if (Number.isNaN(d.getTime())) return '';
    const today = new Date();
    const age =
      today.getFullYear() -
      d.getFullYear() -
      (today < new Date(today.getFullYear(), d.getMonth(), d.getDate()) ? 1 : 0);
    return age;
  });

  useEffect(() => {
    if (!form.dob) {
      setAgeInput('');
      return;
    }
    const d = new Date(form.dob);
    if (Number.isNaN(d.getTime())) {
      setAgeInput('');
      return;
    }
    const today = new Date();
    const age =
      today.getFullYear() -
      d.getFullYear() -
      (today < new Date(today.getFullYear(), d.getMonth(), d.getDate()) ? 1 : 0);
    setAgeInput(age);
  }, [form.dob]);

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
    <div className="bg-white border border-gray-200 rounded-3xl p-8">
      <h4 className="text-lg font-['Syne'] font-bold mb-4 text-black">Personal Information</h4>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs uppercase tracking-widest text-gray-700 mb-2 font-semibold">Full Name</label>
          <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required className="w-full bg-[#fbf3e4] border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black placeholder-gray-500 focus:outline-none focus:border-[#c9a961]" />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-gray-700 mb-2 font-semibold">Age (years)</label>
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
              const today = new Date();
              const dob = new Date(
                today.getFullYear() - num,
                today.getMonth(),
                today.getDate()
              );
              const iso = dob.toISOString().split('T')[0];
              setForm({ ...form, dob: iso });
            }}
            required
            className="w-full bg-[#fbf3e4] border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black placeholder-gray-500 focus:outline-none focus:border-[#c9a961]"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-gray-700 mb-2 font-semibold">Gender</label>
          <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as any })} className="w-full bg-[#fbf3e4] border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black focus:outline-none focus:border-[#c9a961]">
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-gray-700 mb-2 font-semibold">Phone Number</label>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required className="w-full bg-[#fbf3e4] border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black placeholder-gray-500 focus:outline-none focus:border-[#c9a961]" />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-gray-700 mb-2 font-semibold">Contact Email</label>
          <input value={form.email} readOnly className="w-full bg-[#fbf3e4] border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black" />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-gray-700 mb-2 font-semibold">Country</label>
          <select value={form.country} onChange={(e) => handleCountryChange(e.target.value)} required className="w-full bg-[#fbf3e4] border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black focus:outline-none focus:border-[#c9a961]">
            <option value="">Select Country</option>
            {countries.map(c => <option key={c.isoCode} value={c.isoCode}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-gray-700 mb-2 font-semibold">State</label>
          <select value={form.state} onChange={(e) => handleStateChange(e.target.value)} required disabled={!form.country} className="w-full bg-[#fbf3e4] border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black focus:outline-none focus:border-[#c9a961] disabled:opacity-50">
            <option value="">Select State</option>
            {states.map(s => <option key={s.isoCode} value={s.isoCode}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-gray-700 mb-2 font-semibold">City</label>
          <select value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required disabled={!form.state} className="w-full bg-[#fbf3e4] border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black focus:outline-none focus:border-[#c9a961] disabled:opacity-50">
            <option value="">Select City</option>
            {cities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-gray-700 mb-2 font-semibold">Category</label>
          <input value={form.category} readOnly className="w-full bg-[#fbf3e4] border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black" />
        </div>
      </div>

      {/* Instagram */}
      <div className="mt-6 bg-[#fbf3e4] rounded-3xl p-6">
        <h5 className="text-sm uppercase tracking-widest text-gray-700 mb-3 font-semibold">Instagram Details</h5>
        <div className="space-y-3">
          {form.instagram.map((ig, idx) => (
            <div key={idx} className="grid md:grid-cols-2 gap-3">
              <input value={ig.handle} onChange={(e) => updateInstagram(idx, 'handle', e.target.value)} placeholder="Instagram Handle" className="w-full bg-white border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black placeholder-gray-500 focus:outline-none focus:border-[#c9a961]" />
              <select value={ig.followers} onChange={(e) => updateInstagram(idx, 'followers', e.target.value)} className="w-full bg-white border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black focus:outline-none focus:border-[#c9a961]">
                {followerBuckets.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
              </select>
              {idx > 0 && (
                <div className="md:col-span-2 flex gap-3">
                  <button type="button" onClick={() => setForm({ ...form, instagram: form.instagram.filter((_, i) => i !== idx) })} className="px-3 py-2 rounded-full border-2 border-[#dfcda5] bg-white text-gray-700 hover:bg-[#fbf3e4] font-semibold text-xs uppercase tracking-widest">Remove</button>
                </div>
              )}
            </div>
          ))}
          <button type="button" onClick={() => setForm({ ...form, instagram: [...form.instagram, { handle: '', followers: 'under_5k' }] })} className="px-4 py-3 rounded-full bg-[#c9a961] text-white border-none font-semibold text-xs uppercase tracking-widest hover:bg-[#b8985a]">Add another handle</button>
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
        })} className="px-4 py-3 rounded-2xl bg-[#c9a961] text-white font-bold uppercase tracking-widest border-2 border-[#c9a961] hover:bg-[#b8985a]">Save Personal Info</button>
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
    <div className="bg-white border border-gray-200 rounded-3xl p-8">
      <h4 className="text-lg font-['Syne'] font-bold mb-4 text-black">Professional Information</h4>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs uppercase tracking-widest text-gray-700 mb-2 font-semibold">Experience Level</label>
          <select value={form.experience_level} onChange={(e) => setForm({ ...form, experience_level: e.target.value as any })} className="w-full bg-[#fbf3e4] border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black focus:outline-none focus:border-[#c9a961]">
            <option value="lt_1">Less than 1 year</option>
            <option value="1_3">1–3 years</option>
            <option value="3_5">3–5 years</option>
            <option value="gt_5">Over 5 years</option>
          </select>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-gray-700 mb-2 font-semibold">Languages Spoken</label>
          <div className="flex gap-2 mb-3">
            <select value={languageInput} onChange={(e) => setLanguageInput(e.target.value)} className="flex-1 bg-[#fbf3e4] border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black focus:outline-none focus:border-[#c9a961]">
              <option value="">Select a language</option>
              {POPULAR_LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
            <button type="button" onClick={() => { if (languageInput && !form.languages?.includes(languageInput)) { setForm({ ...form, languages: [...(form.languages || []), languageInput] }); setLanguageInput(''); } }} className="px-4 py-3 bg-[#c9a961] text-white font-bold rounded-full hover:bg-[#b8985a] transition-colors border-none uppercase tracking-widest text-xs">Add</button>
          </div>
          {form.languages && form.languages.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.languages.map((lang) => (
                <div key={lang} className="flex items-center gap-2 px-3 py-2 bg-[#dfcda5] border border-[#c9a961] rounded-full">
                  <span className="text-black text-sm font-semibold">{lang}</span>
                  <button type="button" onClick={() => setForm({ ...form, languages: form.languages?.filter(l => l !== lang) })} className="text-black hover:text-white transition-colors font-bold">×</button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-gray-700 mb-2 font-semibold">Special Skills (optional)</label>
          <div className="flex gap-2 mb-3">
            <input type="text" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (skillInput.trim() && !form.skills?.includes(skillInput.trim())) { setForm({ ...form, skills: [...(form.skills || []), skillInput.trim()] }); setSkillInput(''); } } }} placeholder="Enter skill (e.g., Ramp Walk, Acting)" className="flex-1 bg-[#fbf3e4] border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black placeholder-gray-500 focus:outline-none focus:border-[#c9a961]" />
            <button type="button" onClick={() => { if (skillInput.trim() && !form.skills?.includes(skillInput.trim())) { setForm({ ...form, skills: [...(form.skills || []), skillInput.trim()] }); setSkillInput(''); } }} className="px-4 py-3 bg-[#c9a961] text-white font-bold rounded-full hover:bg-[#b8985a] transition-colors border-none uppercase tracking-widest text-xs">Add</button>
          </div>
          {form.skills && form.skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.skills.map((skill) => (
                <div key={skill} className="flex items-center gap-2 px-3 py-2 bg-[#dfcda5] border border-[#c9a961] rounded-full">
                  <span className="text-black text-sm font-semibold">{skill}</span>
                  <button type="button" onClick={() => setForm({ ...form, skills: form.skills?.filter(s => s !== skill) })} className="text-black hover:text-white transition-colors font-bold">×</button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-gray-700 mb-2 font-semibold">Open to Travel?</label>
          <div className="flex gap-3">
            <button type="button" onClick={() => setForm({ ...form, open_to_travel: true })} className={`px-4 py-2 rounded-full border-2 text-xs font-semibold uppercase tracking-widest transition-colors ${form.open_to_travel ? 'bg-[#c9a961] border-[#c9a961] text-white' : 'bg-[#fbf3e4] border-[#dfcda5] text-gray-700 hover:border-[#c9a961]'}`}>Yes</button>
            <button type="button" onClick={() => setForm({ ...form, open_to_travel: false })} className={`px-4 py-2 rounded-full border-2 text-xs font-semibold uppercase tracking-widest transition-colors ${form.open_to_travel === false ? 'bg-[#c9a961] border-[#c9a961] text-white' : 'bg-[#fbf3e4] border-[#dfcda5] text-gray-700 hover:border-[#c9a961]'}`}>No</button>
          </div>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-gray-700 mb-2 font-semibold">Has Ramp Walk Experience?</label>
          <div className="flex gap-3">
            <button type="button" onClick={() => setForm({ ...form, ramp_walk_experience: true })} className={`px-4 py-2 rounded-full border-2 text-xs font-semibold uppercase tracking-widest transition-colors ${form.ramp_walk_experience ? 'bg-[#c9a961] border-[#c9a961] text-white' : 'bg-[#fbf3e4] border-[#dfcda5] text-gray-700 hover:border-[#c9a961]'}`}>Yes</button>
            <button type="button" onClick={() => setForm({ ...form, ramp_walk_experience: false })} className={`px-4 py-2 rounded-full border-2 text-xs font-semibold uppercase tracking-widest transition-colors ${form.ramp_walk_experience === false ? 'bg-[#c9a961] border-[#c9a961] text-white' : 'bg-[#fbf3e4] border-[#dfcda5] text-gray-700 hover:border-[#c9a961]'}`}>No</button>
          </div>
        </div>
        {form.ramp_walk_experience && (
          <div className="md:col-span-2">
            <label className="block text-xs uppercase tracking-widest text-gray-700 mb-2 font-semibold">Ramp Walk Description</label>
            <textarea value={form.ramp_walk_description || ''} onChange={(e) => setForm({ ...form, ramp_walk_description: e.target.value })} className="w-full bg-[#fbf3e4] border-2 border-[#dfcda5] rounded-3xl px-4 py-3 text-black placeholder-gray-500 focus:outline-none focus:border-[#c9a961] h-24" placeholder="List fashion shows, designers, or brands you've walked for." />
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
        })} className="px-4 py-3 rounded-2xl bg-[#c9a961] text-white font-bold uppercase tracking-widest border-2 border-[#c9a961] hover:bg-[#b8985a]">Save Professional Info</button>
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
  const sizes = ['XXS','XS','S','M','L','XL','XXL'];
  const shoeSizes = [
    'UK 3 (US 5)', 'UK 3.5 (US 5.5)', 'UK 4 (US 6)', 'UK 4.5 (US 6.5)',
    'UK 5 (US 7)', 'UK 5.5 (US 7.5)', 'UK 6 (US 8)', 'UK 6.5 (US 8.5)',
    'UK 7 (US 9)', 'UK 7.5 (US 9.5)', 'UK 8 (US 10)', 'UK 8.5 (US 10.5)',
    'UK 9 (US 11)', 'UK 9.5 (US 11.5)', 'UK 10 (US 12)', 'UK 10.5 (US 12.5)',
    'UK 11 (US 13)', 'UK 11.5 (US 13.5)', 'UK 12 (US 14)', 'UK 12.5 (US 14.5)',
    'UK 13 (US 15)'
  ];
  const POPULAR_LANGUAGES = [
    'English', 'Hindi', 'Spanish', 'Mandarin Chinese', 'French', 'Arabic',
    'Bengali', 'Russian', 'Portuguese', 'Urdu', 'Indonesian', 'German',
    'Japanese', 'Swahili', 'Marathi', 'Telugu', 'Turkish', 'Tamil',
    'Korean', 'Italian'
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-8">
      <h4 className="text-lg font-['Syne'] font-bold mb-2 text-black">Your Measurements</h4>
      <p className="text-gray-600 mb-4">Please provide accurate measurements. These help us match you to the right opportunities.</p>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs uppercase tracking-widest text-gray-700 mb-2 font-semibold">Height (Feet)</label>
          <select value={form.height_feet} onChange={(e) => setForm({ ...form, height_feet: Number(e.target.value) })} className="w-full bg-[#fbf3e4] border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black focus:outline-none focus:border-[#c9a961]">
            {feet.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-gray-700 mb-2 font-semibold">Height (Inches)</label>
          <select value={form.height_inches} onChange={(e) => setForm({ ...form, height_inches: Number(e.target.value) })} className="w-full bg-[#fbf3e4] border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black focus:outline-none focus:border-[#c9a961]">
            {inches.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-gray-700 mb-2 font-semibold">Bust / Chest (inches)</label>
          <select value={form.bust_chest} onChange={(e) => setForm({ ...form, bust_chest: Number(e.target.value) })} className="w-full bg-[#fbf3e4] border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black focus:outline-none focus:border-[#c9a961]">
            {measureInches.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-gray-700 mb-2 font-semibold">Waist (inches)</label>
          <select value={form.waist} onChange={(e) => setForm({ ...form, waist: Number(e.target.value) })} className="w-full bg-[#fbf3e4] border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black focus:outline-none focus:border-[#c9a961]">
            {measureInches.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-gray-700 mb-2 font-semibold">Hips (inches)</label>
          <select value={form.hips ?? ''} onChange={(e) => setForm({ ...form, hips: Number(e.target.value) })} className="w-full bg-[#fbf3e4] border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black focus:outline-none focus:border-[#c9a961]">
            <option value="">—</option>
            {measureInches.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-gray-700 mb-2 font-semibold">Size</label>
          <select value={form.size ?? ''} onChange={(e) => setForm({ ...form, size: e.target.value || null })} className="w-full bg-[#fbf3e4] border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black focus:outline-none focus:border-[#c9a961]">
            <option value="">—</option>
            {sizes.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-gray-700 mb-2 font-semibold">Shoe Size</label>
          <select value={form.shoe_size} onChange={(e) => setForm({ ...form, shoe_size: e.target.value })} className="w-full bg-[#fbf3e4] border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black focus:outline-none focus:border-[#c9a961]">
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
          size: form.size ?? null,
          shoe_size: form.shoe_size,
        })} className="px-4 py-3 rounded-2xl bg-[#c9a961] text-white font-bold uppercase tracking-widest border-2 border-[#c9a961] hover:bg-[#b8985a]">Save Measurements</button>
      </div>
    </div>
  );
};

/* STEP 4: MEDIA */
const MediaForm: React.FC<{ profile: ProfileData; saving: boolean; onSave: (patch: Partial<ProfileData>) => void; }> = ({ profile, onSave, saving }) => {
  const { user } = useAuth();
  const [form, setForm] = useState<ProfileData>(profile);
  const [uploadingCover, setUploadingCover] = useState(false);

  useEffect(() => setForm(profile), [profile]);

  const coverCandidates = buildDriveImageUrls(form.cover_photo_url || '');

  const handleCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    try {
      setUploadingCover(true);
      // Compress to well under 1MB and convert to JPEG/compatible format
      const compressed = await compressImageFile(file, { maxBytes: 900 * 1024 });
      const path = `profiles/${user.id}/cover_${Date.now()}.jpg`;
      const url = await uploadImage(compressed, path);
      setForm(prev => ({ ...prev, cover_photo_url: url }));
      alert('Cover image uploaded successfully');
    } catch (err: any) {
      alert(`Cover upload failed: ${err?.message ?? err}`);
    } finally {
      setUploadingCover(false);
      e.target.value = '';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-8">
      <h4 className="text-lg font-['Syne'] font-bold mb-4 text-black">Photos / Media</h4>
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs uppercase tracking-widest text-gray-700 mb-2 font-semibold">Cover Photo</label>
          <input
            type="url"
            value={form.cover_photo_url || ''}
            onChange={(e) => setForm({ ...form, cover_photo_url: e.target.value })}
            placeholder="Paste an image URL (optional)"
            className="w-full bg-[#fbf3e4] border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black placeholder-gray-500 focus:outline-none focus:border-[#c9a961]"
          />
          <p className="text-xs text-gray-600 mt-1">Either upload an image or paste a direct/public image URL.</p>
          <div className="mt-3 flex items-center gap-3">
            <label className="px-3 py-2 rounded-full border-2 border-[#dfcda5] bg-[#fbf3e4] text-gray-700 hover:border-[#c9a961] cursor-pointer text-xs uppercase tracking-widest font-semibold">
              {uploadingCover ? 'Uploading…' : 'Upload Cover Image'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverFileChange}
                disabled={uploadingCover}
              />
            </label>
            <span className="text-xs text-gray-600">We compress to under 1MB and convert for web.</span>
          </div>
          {coverCandidates.length > 0 && (
            <div className="mt-3">
              <div className="text-xs text-gray-700 mb-1 font-semibold">Live preview:</div>
              <img
                src={coverCandidates[0]}
                alt="Cover preview"
                className="w-full aspect-[3/4] object-cover rounded-md border border-gray-300"
                onError={(e) => {
                  const el = e.currentTarget as HTMLImageElement & { _try?: number };
                  el._try = (el._try || 0) + 1;
                  if (el._try < coverCandidates.length) {
                    el.src = coverCandidates[el._try];
                  }
                }}
              />
            </div>
          )}
          {form.cover_photo_url && (
            <a
              href={form.cover_photo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-[#c9a961] hover:underline text-xs font-semibold"
            >
              Open original on Drive →
            </a>
          )}
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-gray-700 mb-2 font-semibold">Portfolio Folder Link (Google Drive)</label>
          <input
            type="url"
            value={form.portfolio_folder_link || ''}
            onChange={(e) => setForm({ ...form, portfolio_folder_link: e.target.value })}
            placeholder="https://drive.google.com/drive/folders/..."
            className="w-full bg-[#fbf3e4] border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black placeholder-gray-500 focus:outline-none focus:border-[#c9a961]"
          />
          <p className="text-xs text-gray-600 mt-1">
            Paste your Google Drive folder link with all portfolio images. Set sharing to "Anyone with the link can view".
          </p>
          {form.portfolio_folder_link && (
            <a
              href={form.portfolio_folder_link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-[#c9a961] hover:underline text-sm font-semibold"
            >
              Open portfolio folder →
            </a>
          )}
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-gray-700 mb-2 font-semibold">Intro Video URL (YouTube)</label>
          <input
            type="url"
            value={form.intro_video_url || ''}
            onChange={(e) => setForm({ ...form, intro_video_url: e.target.value })}
            placeholder="YouTube link to intro / self-tape"
            className="w-full bg-[#fbf3e4] border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black placeholder-gray-500 focus:outline-none focus:border-[#c9a961]"
          />
          <p className="text-xs text-gray-600 mt-1">
            Use a public or unlisted YouTube link. We embed it on your profile.
          </p>
          {form.intro_video_url && (
            <a
              href={form.intro_video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-[#c9a961] hover:underline text-sm font-semibold"
            >
              Preview intro video →
            </a>
          )}
        </div>
      </div>
      <div className="pt-4 flex gap-3">
        <button
          disabled={saving}
          onClick={() => onSave({
            cover_photo_url: form.cover_photo_url,
            portfolio_folder_link: form.portfolio_folder_link,
            intro_video_url: form.intro_video_url,
          })}
          className="px-4 py-3 rounded-2xl bg-[#c9a961] text-white font-bold uppercase tracking-widest border-2 border-[#c9a961] hover:bg-[#b8985a]"
        >
          Save Media
        </button>
      </div>
    </div>
  );
};
