import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Country, State, City } from 'country-state-city';
import { ProfileData, getNextModelUserId, upsertProfile } from '../services/ProfileService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const POPULAR_LANGUAGES = [
  'English', 'Hindi', 'Spanish', 'Mandarin Chinese', 'French', 'Arabic',
  'Bengali', 'Russian', 'Portuguese', 'Urdu', 'Indonesian', 'German',
  'Japanese', 'Swahili', 'Marathi', 'Telugu', 'Turkish', 'Tamil',
  'Korean', 'Italian'
];

const SHOE_SIZES = [
  'UK 3 (US 5)', 'UK 3.5 (US 5.5)', 'UK 4 (US 6)', 'UK 4.5 (US 6.5)',
  'UK 5 (US 7)', 'UK 5.5 (US 7.5)', 'UK 6 (US 8)', 'UK 6.5 (US 8.5)',
  'UK 7 (US 9)', 'UK 7.5 (US 9.5)', 'UK 8 (US 10)', 'UK 8.5 (US 10.5)',
  'UK 9 (US 11)', 'UK 9.5 (US 11.5)', 'UK 10 (US 12)', 'UK 10.5 (US 12.5)',
  'UK 11 (US 13)', 'UK 11.5 (US 13.5)', 'UK 12 (US 14)', 'UK 12.5 (US 14.5)',
  'UK 13 (US 15)'
];

const SKILL_PRESETS = [
  'Ramp Walk',
  'Acting',
  'Print / Catalog',
  'TV / Film',
  'Digital Creator / UGC',
];

const SIZE_OPTIONS = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL'];

export const TalentOnboardingPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [submittingProfile, setSubmittingProfile] = useState(false);
  const [loadingCode, setLoadingCode] = useState(false);
  const [submitProfile, setSubmitProfile] = useState<ProfileData>({
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
    intro_video_url: '',
  });
  const [submitAgeInput, setSubmitAgeInput] = useState<number | ''>('');
  const [submitLanguageInput, setSubmitLanguageInput] = useState('');

  const submitCountries = Country.getAllCountries();
  const submitStates = submitProfile.country ? State.getStatesOfCountry(submitProfile.country) : [];
  const submitCities = submitProfile.state ? City.getCitiesOfState(submitProfile.country, submitProfile.state) : [];

  useEffect(() => {
    const init = async () => {
      setLoadingCode(true);
      try {
        const nextId = await getNextModelUserId();
        setSubmitProfile({
          full_name: '',
          dob: '',
          gender: 'female',
          phone: '',
          email: user?.email || '',
          country: '',
          state: '',
          city: '',
          category: 'model',
          instagram: [{ handle: '', followers: 'under_5k' }],
          status: 'UNDER_REVIEW',
          model_code: nextId,
          intro_video_url: '',
        });
        setSubmitAgeInput('');
        setSubmitLanguageInput('');
      } catch (err) {
        console.error('Failed to generate model code', err);
        showToast('Failed to load onboarding form');
      } finally {
        setLoadingCode(false);
      }
    };
    init();
  }, [showToast, user?.email]);

  const handleCountryChange = (isoCode: string) => {
    setSubmitProfile({ ...submitProfile, country: isoCode, state: '', city: '' });
  };

  const handleStateChange = (isoCode: string) => {
    setSubmitProfile({ ...submitProfile, state: isoCode, city: '' });
  };

  const updateSubmitInstagramHandle = (idx: number, key: 'handle' | 'followers', value: string) => {
    const next = [...(submitProfile.instagram || [])];
    const item = { ...(next[idx] || { handle: '', followers: 'under_5k' }), [key]: value };
    next[idx] = item;
    setSubmitProfile({ ...submitProfile, instagram: next });
  };

  const addSubmitLanguage = () => {
    if (!submitLanguageInput || submitProfile.languages?.includes(submitLanguageInput)) return;
    const next = [...(submitProfile.languages || []), submitLanguageInput];
    setSubmitProfile({ ...submitProfile, languages: next });
    setSubmitLanguageInput('');
  };

  const handleSaveSubmitProfile = async () => {
    const code = submitProfile.model_code?.toString().trim();
    if (!code) {
      showToast('Model code is required');
      return;
    }
    if (!submitProfile.full_name.trim()) {
      showToast('Full name is required');
      return;
    }
    if (!submitProfile.email.trim()) {
      showToast('Email is required');
      return;
    }
    setSubmittingProfile(true);
    try {
      const payload: ProfileData = {
        ...submitProfile,
        email: submitProfile.email.trim(),
        category: 'model',
      };
      await upsertProfile(payload);
      showToast('Profile submitted successfully!', 'success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      navigate('/talents');
    } catch (err: any) {
      console.error('Failed to save profile', err);
      showToast(err?.message ?? 'Failed to submit profile');
    } finally {
      setSubmittingProfile(false);
    }
  };

  return (
    <main className="bg-[#fbf3e4] min-h-screen pt-16 pb-16">
      <div className="max-w-5xl mx-auto px-4">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-600 font-semibold">Talent Onboarding</p>
          <h1 className="text-4xl md:text-5xl font-['Syne'] font-bold text-black mt-2">Submit Your Profile</h1>
          <p className="text-gray-700 mt-3 max-w-3xl">Share your details to join the Elgrace roster. We review every submission to maintain quality and client fit.</p>
          <div className="mt-3 text-sm text-gray-600">
            {loadingCode ? 'Generating your model code…' : submitProfile.model_code ? `Model Code: ${submitProfile.model_code}` : 'Model code unavailable'}
          </div>
        </div>

        <div className="bg-white border border-[#dfcda5] rounded-3xl p-8 shadow-lg">
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-700 mb-2 font-semibold">Full Name</label>
              <input
                value={submitProfile.full_name}
                onChange={(e) => setSubmitProfile({ ...submitProfile, full_name: e.target.value })}
                className="w-full bg-[#fbf3e4] border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black placeholder-gray-500 focus:outline-none focus:border-[#c9a961]"
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-700 mb-2 font-semibold">Email</label>
              <input
                type="email"
                value={submitProfile.email}
                onChange={(e) => setSubmitProfile({ ...submitProfile, email: e.target.value })}
                className="w-full bg-[#fbf3e4] border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black placeholder-gray-500 focus:outline-none focus:border-[#c9a961]"
                placeholder="name@email.com"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-700 mb-2 font-semibold">Phone</label>
              <input
                value={submitProfile.phone}
                onChange={(e) => setSubmitProfile({ ...submitProfile, phone: e.target.value })}
                className="w-full bg-[#fbf3e4] border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black placeholder-gray-500 focus:outline-none focus:border-[#c9a961]"
                placeholder="WhatsApp preferred"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-700 mb-2 font-semibold">Age (years)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={submitAgeInput === '' ? '' : submitAgeInput}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === '') {
                    setSubmitAgeInput('');
                    return;
                  }
                  const num = Number(v);
                  if (!Number.isFinite(num) || num < 0) return;
                  setSubmitAgeInput(num);
                  const today = new Date();
                  const dob = new Date(today.getFullYear() - num, today.getMonth(), today.getDate());
                  const iso = dob.toISOString().split('T')[0];
                  setSubmitProfile({ ...submitProfile, dob: iso });
                }}
                className="w-full bg-[#fbf3e4] border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black placeholder-gray-500 focus:outline-none focus:border-[#c9a961]"
                placeholder="e.g. 24"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-700 mb-2 font-semibold">Gender</label>
              <select
                value={submitProfile.gender}
                onChange={(e) => setSubmitProfile({ ...submitProfile, gender: e.target.value as any })}
                className="w-full bg-[#fbf3e4] border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black focus:outline-none focus:border-[#c9a961]"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-700 mb-2 font-semibold">Country</label>
              <select
                value={submitProfile.country}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full bg-[#fbf3e4] border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black focus:outline-none focus:border-[#c9a961]"
              >
                <option value="">Select Country</option>
                {submitCountries.map((c) => (
                  <option key={c.isoCode} value={c.isoCode}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-700 mb-2 font-semibold">State</label>
              <select
                value={submitProfile.state}
                onChange={(e) => handleStateChange(e.target.value)}
                disabled={!submitProfile.country}
                className="w-full bg-[#fbf3e4] border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black focus:outline-none focus:border-[#c9a961] disabled:opacity-50"
              >
                <option value="">Select State</option>
                {submitStates.map((s) => (
                  <option key={s.isoCode} value={s.isoCode}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-700 mb-2 font-semibold">City</label>
              <select
                value={submitProfile.city}
                onChange={(e) => setSubmitProfile({ ...submitProfile, city: e.target.value })}
                disabled={!submitProfile.state}
                className="w-full bg-[#fbf3e4] border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black focus:outline-none focus:border-[#c9a961] disabled:opacity-50"
              >
                <option value="">Select City</option>
                {submitCities.map((c) => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-6 bg-[#fbf3e4] rounded-3xl p-6">
            <h3 className="text-sm font-semibold mb-3 text-gray-700 uppercase tracking-widest">Instagram</h3>
            <div className="space-y-3">
              {(submitProfile.instagram || []).map((ig, idx) => (
                <div key={idx} className="grid md:grid-cols-2 gap-3">
                  <input
                    value={ig.handle}
                    onChange={(e) => updateSubmitInstagramHandle(idx, 'handle', e.target.value)}
                    placeholder="Handle (without @)"
                    className="w-full bg-white border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black placeholder-gray-500 focus:outline-none focus:border-[#c9a961]"
                  />
                  <select
                    value={ig.followers}
                    onChange={(e) => updateSubmitInstagramHandle(idx, 'followers', e.target.value)}
                    className="w-full bg-white border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black focus:outline-none focus:border-[#c9a961]"
                  >
                    <option value="under_5k">Under 5K</option>
                    <option value="5k_20k">5K–20K</option>
                    <option value="20k_50k">20K–50K</option>
                    <option value="50k_100k">50K–100K</option>
                    <option value="100k_plus">100K+</option>
                  </select>
                  {idx > 0 && (
                    <div className="md:col-span-2 flex gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setSubmitProfile({
                            ...submitProfile,
                            instagram: (submitProfile.instagram || []).filter((_, i) => i !== idx),
                          })
                        }
                        className="px-3 py-2 rounded-full border-2 border-[#dfcda5] bg-white text-gray-700 hover:bg-[#fbf3e4] font-semibold text-xs uppercase tracking-widest"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setSubmitProfile({
                    ...submitProfile,
                    instagram: [...(submitProfile.instagram || []), { handle: '', followers: 'under_5k' }],
                  })
                }
                className="px-4 py-3 rounded-full bg-[#c9a961] text-white border-none font-semibold text-xs uppercase tracking-widest hover:bg-[#b8985a]"
              >
                Add Instagram handle
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-700 mb-2 font-semibold">Experience Level</label>
              <select
                value={submitProfile.experience_level ?? 'lt_1'}
                onChange={(e) => setSubmitProfile({ ...submitProfile, experience_level: e.target.value as any })}
                className="w-full bg-[#fbf3e4] border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black focus:outline-none focus:border-[#c9a961]"
              >
                <option value="lt_1">Less than 1 year</option>
                <option value="1_3">1–3 years</option>
                <option value="3_5">3–5 years</option>
                <option value="gt_5">Over 5 years</option>
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-700 mb-2 font-semibold">Languages</label>
              <div className="flex gap-2 mb-2">
                <select
                  value={submitLanguageInput}
                  onChange={(e) => setSubmitLanguageInput(e.target.value)}
                  className="flex-1 bg-[#fbf3e4] border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black focus:outline-none focus:border-[#c9a961]"
                >
                  <option value="">Select a language</option>
                  {POPULAR_LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={addSubmitLanguage}
                  className="px-4 py-3 bg-[#c9a961] text-white font-bold rounded-full text-xs uppercase tracking-widest hover:bg-[#b8985a]"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(submitProfile.languages || []).map((lang) => (
                  <span
                    key={lang}
                    className="px-3 py-1 rounded-full bg-[#dfcda5] border border-[#c9a961] text-xs text-black flex items-center gap-2 font-semibold"
                  >
                    {lang}
                    <button
                      type="button"
                      onClick={() =>
                        setSubmitProfile({
                          ...submitProfile,
                          languages: (submitProfile.languages || []).filter((l) => l !== lang),
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
              <label className="block text-xs uppercase tracking-widest text-gray-700 mb-2 font-semibold">Key Skills</label>
              <p className="text-[11px] text-gray-600 mb-2">Select all that apply</p>
              <div className="flex flex-wrap gap-2 mb-2">
                {SKILL_PRESETS.map((skill) => {
                  const active = (submitProfile.skills || []).includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => {
                        const current = submitProfile.skills || [];
                        setSubmitProfile({
                          ...submitProfile,
                          skills: active ? current.filter((s) => s !== skill) : [...current, skill],
                        });
                      }}
                      className={`px-3 py-1 rounded-full border-2 text-xs font-semibold uppercase tracking-widest transition-colors ${
                        active
                          ? 'bg-[#c9a961] border-[#c9a961] text-white'
                          : 'bg-[#fbf3e4] border-[#dfcda5] text-gray-700 hover:border-[#c9a961]'
                      }`}
                    >
                      {skill}
                    </button>
                  );
                })}
              </div>
              {submitProfile.skills && submitProfile.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {submitProfile.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 rounded-full bg-[#dfcda5] border border-[#c9a961] text-xs text-black flex items-center gap-2 font-semibold"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() =>
                          setSubmitProfile({
                            ...submitProfile,
                            skills: (submitProfile.skills || []).filter((s) => s !== skill),
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
              <label className="block text-xs uppercase tracking-widest text-gray-700 mb-2 font-semibold">Open to Travel</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setSubmitProfile({ ...submitProfile, open_to_travel: true })}
                  className={`px-4 py-2 rounded-full border-2 text-xs font-semibold uppercase tracking-widest transition-colors ${
                    submitProfile.open_to_travel ? 'bg-[#c9a961] border-[#c9a961] text-white' : 'bg-[#fbf3e4] border-[#dfcda5] text-gray-700 hover:border-[#c9a961]'
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setSubmitProfile({ ...submitProfile, open_to_travel: false })}
                  className={`px-4 py-2 rounded-full border-2 text-xs font-semibold uppercase tracking-widest transition-colors ${
                    submitProfile.open_to_travel === false
                      ? 'bg-[#c9a961] border-[#c9a961] text-white'
                      : 'bg-[#fbf3e4] border-[#dfcda5] text-gray-700 hover:border-[#c9a961]'
                  }`}
                >
                  No
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-700 mb-2 font-semibold">
                Minimum Budget (Half Day)
              </label>
              <input
                type="number"
                min={1500}
                value={submitProfile.min_budget_half_day ?? ''}
                onChange={(e) =>
                  setSubmitProfile({
                    ...submitProfile,
                    min_budget_half_day: e.target.value === '' ? null : Number(e.target.value),
                  })
                }
                className="w-full bg-[#fbf3e4] border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black placeholder-gray-500 focus:outline-none focus:border-[#c9a961]"
                placeholder="e.g. 1500"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-700 mb-2 font-semibold">
                Minimum Budget (Full Day)
              </label>
              <input
                type="number"
                min={2000}
                value={submitProfile.min_budget_full_day ?? ''}
                onChange={(e) =>
                  setSubmitProfile({
                    ...submitProfile,
                    min_budget_full_day: e.target.value === '' ? null : Number(e.target.value),
                  })
                }
                className="w-full bg-[#fbf3e4] border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black placeholder-gray-500 focus:outline-none focus:border-[#c9a961]"
                placeholder="e.g. 2000"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-700 mb-2 font-semibold">Height (feet / inches)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={submitProfile.height_feet ?? ''}
                  onChange={(e) => setSubmitProfile({ ...submitProfile, height_feet: Number(e.target.value) || undefined })}
                  className="w-1/2 bg-[#fbf3e4] border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black placeholder-gray-500 focus:outline-none focus:border-[#c9a961]"
                  placeholder="ft"
                />
                <input
                  type="number"
                  value={submitProfile.height_inches ?? ''}
                  onChange={(e) => setSubmitProfile({ ...submitProfile, height_inches: Number(e.target.value) || undefined })}
                  className="w-1/2 bg-[#fbf3e4] border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black placeholder-gray-500 focus:outline-none focus:border-[#c9a961]"
                  placeholder="in"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-700 mb-2 font-semibold">Bust / Chest (inches)</label>
              <input
                type="number"
                value={submitProfile.bust_chest ?? ''}
                onChange={(e) => setSubmitProfile({ ...submitProfile, bust_chest: Number(e.target.value) || undefined })}
                className="w-full bg-[#fbf3e4] border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black placeholder-gray-500 focus:outline-none focus:border-[#c9a961]"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-700 mb-2 font-semibold">Waist (inches)</label>
              <input
                type="number"
                value={submitProfile.waist ?? ''}
                onChange={(e) => setSubmitProfile({ ...submitProfile, waist: Number(e.target.value) || undefined })}
                className="w-full bg-[#fbf3e4] border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black placeholder-gray-500 focus:outline-none focus:border-[#c9a961]"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-700 mb-2 font-semibold">Hips (inches)</label>
              <input
                type="number"
                value={submitProfile.hips ?? ''}
                onChange={(e) => setSubmitProfile({ ...submitProfile, hips: Number(e.target.value) || null })}
                className="w-full bg-[#fbf3e4] border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black placeholder-gray-500 focus:outline-none focus:border-[#c9a961]"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-700 mb-2 font-semibold">Size</label>
              <select
                value={submitProfile.size ?? ''}
                onChange={(e) => setSubmitProfile({ ...submitProfile, size: e.target.value || null })}
                className="w-full bg-[#fbf3e4] border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black focus:outline-none focus:border-[#c9a961]"
              >
                <option value="">Select size</option>
                {SIZE_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-700 mb-2 font-semibold">Shoe Size</label>
              <select
                value={submitProfile.shoe_size ?? ''}
                onChange={(e) => setSubmitProfile({ ...submitProfile, shoe_size: e.target.value })}
                className="w-full bg-[#fbf3e4] border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black focus:outline-none focus:border-[#c9a961]"
              >
                <option value="">Select shoe size</option>
                {SHOE_SIZES.map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-700 mb-2 font-semibold">Cover Photo URL</label>
              <input
                value={submitProfile.cover_photo_url ?? ''}
                onChange={(e) => setSubmitProfile({ ...submitProfile, cover_photo_url: e.target.value })}
                className="w-full bg-[#fbf3e4] border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black placeholder-gray-500 focus:outline-none focus:border-[#c9a961]"
                placeholder="Direct image URL or Google Drive link"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-700 mb-2 font-semibold">Portfolio Folder Link</label>
              <input
                value={submitProfile.portfolio_folder_link ?? ''}
                onChange={(e) => setSubmitProfile({ ...submitProfile, portfolio_folder_link: e.target.value })}
                className="w-full bg-[#fbf3e4] border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black placeholder-gray-500 focus:outline-none focus:border-[#c9a961]"
                placeholder="Google Drive folder link"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-700 mb-2 font-semibold">Intro Video URL (YouTube)</label>
              <input
                value={submitProfile.intro_video_url ?? ''}
                onChange={(e) => setSubmitProfile({ ...submitProfile, intro_video_url: e.target.value })}
                className="w-full bg-[#fbf3e4] border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black placeholder-gray-500 focus:outline-none focus:border-[#c9a961]"
                placeholder="YouTube link to intro / self-tape"
              />
            </div>
          </div>

          <div className="flex flex-wrap justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                navigate('/talents');
              }}
              className="px-6 py-3 rounded-2xl border-2 border-[#dfcda5] bg-white text-gray-700 hover:bg-[#fbf3e4] font-semibold uppercase tracking-widest"
            >
              Back to Gallery
            </button>
            <button
              type="button"
              disabled={submittingProfile || loadingCode}
              onClick={handleSaveSubmitProfile}
              className="px-6 py-3 rounded-2xl bg-[#c9a961] text-white font-bold uppercase tracking-widest border-2 border-[#c9a961] hover:bg-[#b8985a] disabled:opacity-60"
            >
              {submittingProfile ? 'Submitting…' : 'Submit Profile'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};
