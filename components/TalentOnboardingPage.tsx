import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Country, State, City } from 'country-state-city';
import { ProfileData, getNextModelUserId, createPublicProfile, upsertProfile } from '../services/ProfileService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const STEP_NAMES = ['Basic Info', 'Work & Skills', 'Measurements & Rates', 'Media & Submit'];

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
  'TV / Film',
  'Digital Creator / UGC',
];

const SIZE_OPTIONS = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL'];

export const TalentOnboardingPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [submittingProfile, setSubmittingProfile] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: user?.email || '',
    phone: '',
    age: '' as number | '',
    dob: '',
    gender: 'female' as 'male' | 'female' | 'other',
    country: 'IN',
    state: '',
    city: '',
    openToTravel: '' as boolean | '',
    experienceLevel: '',
    skills: [] as string[],
    languages: [] as string[],
    instagram: [{ handle: '', followers: 'under_5k' }],
    languageInput: '',
    height_feet: '' as number | '',
    height_inches: '' as number | '',
    bust_chest: '' as number | '',
    waist: '' as number | '',
    hips: '' as number | '',
    size: '',
    shoe_size: '',
    min_budget_half_day: '' as number | '',
    min_budget_full_day: '' as number | '',
    cover_photo_url: '',
    portfolio_folder_link: '',
    intro_video_url: '',
  });

  // Get country/state/city lists (memoized to avoid heavy recomputation)
  const countries = useMemo(() => Country.getAllCountries(), []);
  const states = useMemo(
    () => (formData.country ? State.getStatesOfCountry(formData.country) : []),
    [formData.country]
  );
  const cities = useMemo(
    () => (formData.state ? City.getCitiesOfState(formData.country, formData.state) : []),
    [formData.country, formData.state]
  );

  // (Draft restoration and auto-save removed as requested)

  // Validation per step
  const validateStep = (step: number): string[] => {
    const errors: string[] = [];
    if (step === 1) {
      if (!formData.fullName.trim()) errors.push('Full name is required');
      if (!formData.email.trim() || !formData.email.includes('@')) errors.push('Valid email is required');
      if (!formData.phone.trim() || formData.phone.length < 7) errors.push('Valid phone is required');
      if (!formData.age || formData.age <= 0) errors.push('Valid age is required');
      if (!formData.dob) errors.push('Age is required');
      if (!formData.gender) errors.push('Gender is required');
      if (!formData.country) errors.push('Country is required');
      if (!formData.state) errors.push('State is required');
      if (!formData.city) errors.push('City is required');
      if (formData.openToTravel === '') errors.push('Open to travel is required');
    } else if (step === 2) {
      if (!formData.experienceLevel) errors.push('Experience level is required');
      if (formData.languages.length === 0) errors.push('At least one language is required');
      if (formData.instagram.length === 0 || formData.instagram.some((i) => !i.handle.trim())) errors.push('Instagram handle is required');
    } else if (step === 3) {
      if (!Number.isFinite(formData.height_feet) || (formData.height_feet ?? 0) <= 0) errors.push('Valid height (feet) is required');
      if (!Number.isFinite(formData.height_inches) || (formData.height_inches ?? 0) < 0) errors.push('Valid height (inches) is required');
      if (!Number.isFinite(formData.bust_chest) || (formData.bust_chest ?? 0) <= 0) errors.push('Valid bust/chest is required');
      if (!Number.isFinite(formData.waist) || (formData.waist ?? 0) <= 0) errors.push('Valid waist is required');
      if (!Number.isFinite(formData.hips) || (formData.hips ?? 0) <= 0) errors.push('Valid hips is required');
      if (!formData.size) errors.push('Size is required');
      if (!formData.shoe_size) errors.push('Shoe size is required');
      if ((formData.min_budget_half_day ?? 0) <= 0) errors.push('Valid minimum budget (half day) is required');
      if ((formData.min_budget_full_day ?? 0) <= 0) errors.push('Valid minimum budget (full day) is required');
    } else if (step === 4) {
      if (!formData.cover_photo_url?.trim()) errors.push('Cover photo URL is required');
      if (!formData.portfolio_folder_link?.trim()) errors.push('Portfolio folder link is required');
      if (!formData.intro_video_url?.trim()) errors.push('Intro video URL is required');
    }
    return errors;
  };

  const persistStep = async (step: number) => {
    if (!user) return;
    try {
      const base: ProfileData = {
        full_name: formData.fullName,
        dob: formData.dob,
        gender: formData.gender,
        phone: formData.phone,
        email: formData.email,
        country: formData.country,
        state: formData.state,
        city: formData.city,
        category: 'model',
        instagram: formData.instagram,
        experience_level: formData.experienceLevel as any,
        languages: formData.languages,
        skills: formData.skills,
        open_to_travel: formData.openToTravel === true,
        height_feet: formData.height_feet ? Number(formData.height_feet) : undefined,
        height_inches: formData.height_inches ? Number(formData.height_inches) : undefined,
        bust_chest: formData.bust_chest ? Number(formData.bust_chest) : undefined,
        waist: formData.waist ? Number(formData.waist) : undefined,
        hips: formData.hips ? Number(formData.hips) : undefined,
        size: formData.size,
        shoe_size: formData.shoe_size,
        min_budget_half_day: formData.min_budget_half_day ? Number(formData.min_budget_half_day) : undefined,
        min_budget_full_day: formData.min_budget_full_day ? Number(formData.min_budget_full_day) : undefined,
        cover_photo_url: formData.cover_photo_url,
        portfolio_folder_link: formData.portfolio_folder_link,
        intro_video_url: formData.intro_video_url,
        status: undefined,
        model_code: undefined,
        user_id: user.id,
        id: user.id,
      };

      // For mid-steps we do a best-effort upsert; errors are non-blocking.
      await upsertProfile(base);
    } catch (err) {
      console.warn('Failed to auto-save onboarding step', err);
    }
  };

  const handleNext = async () => {
    const errors = validateStep(currentStep);
    if (errors.length > 0) {
      showToast(errors[0]);
      return;
    }
    await persistStep(currentStep);
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    const errors = validateStep(4);
    if (errors.length > 0) {
      showToast(errors[0]);
      return;
    }

    setSubmittingProfile(true);
    try {
      const nextCode = await getNextModelUserId();
      if (!nextCode) {
        showToast('Failed to generate model code');
        setSubmittingProfile(false);
        return;
      }

      const payload: ProfileData = {
        full_name: formData.fullName,
        dob: formData.dob,
        gender: formData.gender,
        phone: formData.phone,
        email: formData.email,
        country: formData.country,
        state: formData.state,
        city: formData.city,
        category: 'model',
        instagram: formData.instagram,
        experience_level: formData.experienceLevel as any,
        languages: formData.languages,
        skills: formData.skills,
        open_to_travel: formData.openToTravel === true,
        height_feet: formData.height_feet ? Number(formData.height_feet) : undefined,
        height_inches: formData.height_inches ? Number(formData.height_inches) : undefined,
        bust_chest: formData.bust_chest ? Number(formData.bust_chest) : undefined,
        waist: formData.waist ? Number(formData.waist) : undefined,
        hips: formData.hips ? Number(formData.hips) : undefined,
        size: formData.size,
        shoe_size: formData.shoe_size,
        min_budget_half_day: formData.min_budget_half_day ? Number(formData.min_budget_half_day) : undefined,
        min_budget_full_day: formData.min_budget_full_day ? Number(formData.min_budget_full_day) : undefined,
        cover_photo_url: formData.cover_photo_url,
        portfolio_folder_link: formData.portfolio_folder_link,
        intro_video_url: formData.intro_video_url,
        status: 'UNDER_REVIEW',
        model_code: nextCode,
      };

      await createPublicProfile(payload);
      showToast(`Profile submitted successfully! Your model ID: ${nextCode}`, 'success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      navigate('/talents');
    } catch (err: any) {
      console.error('Failed to save profile', err);
      showToast('Submission failed. Your data is safe — please try again.');
    } finally {
      setSubmittingProfile(false);
    }
  };

  const progress = (currentStep / 4) * 100;

  return (
    <main className="bg-[#fbf3e4] min-h-screen pt-24 pb-16 sm:pt-28 sm:pb-20">
      {/* Progress Bar (non-fixed, above content) */}
      <div className="bg-[#fbf3e4]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-4">
          <div className="w-full h-1 bg-[#dfcda5] rounded-full overflow-hidden mb-3">
            <div className="h-full bg-[#c9a961] transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs uppercase tracking-widest text-gray-600 font-semibold">
            Step {currentStep} of 4 – {STEP_NAMES[currentStep - 1]}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="bg-white border border-[#dfcda5] rounded-3xl p-6 sm:p-8 shadow-lg">
          {/* STEP 1: Basic Info */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-black mb-6">Basic Information</h2>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <input type="text" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} placeholder="Full Name *" className="w-full bg-[#fbf3e4] border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black" />
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="Email *" className="w-full bg-[#fbf3e4] border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black" />
                <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="Phone (WhatsApp) *" className="w-full bg-[#fbf3e4] border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black" />
                <input type="number" min={0} max={100} value={formData.age === '' ? '' : formData.age} onChange={(e) => { const v = e.target.value; if (v === '') { setFormData({ ...formData, age: '' }); return; } const num = Number(v); if (!Number.isFinite(num) || num < 0) return; setFormData({ ...formData, age: num }); const today = new Date(); const dob = new Date(today.getFullYear() - num, today.getMonth(), today.getDate()); setFormData((prev) => ({ ...prev, dob: dob.toISOString().split('T')[0] })); }} placeholder="Age *" className="w-full bg-[#fbf3e4] border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black" />
                <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })} className="w-full bg-[#fbf3e4] border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black">
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </select>
                <select value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value, state: '', city: '' })} className="w-full bg-[#fbf3e4] border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black">
                  <option value="">Country *</option>
                  {countries.map((c) => (<option key={c.isoCode} value={c.isoCode}>{c.name}</option>))}
                </select>
                <select value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value, city: '' })} disabled={!formData.country} className="w-full bg-[#fbf3e4] border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black disabled:opacity-50">
                  <option value="">State *</option>
                  {states.map((s) => (<option key={s.isoCode} value={s.isoCode}>{s.name}</option>))}
                </select>
                <select value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} disabled={!formData.state} className="w-full bg-[#fbf3e4] border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black disabled:opacity-50">
                  <option value="">City *</option>
                  {cities.map((c) => (<option key={c.name} value={c.name}>{c.name}</option>))}
                </select>
                <div className="md:col-span-2">
                  <label className="block text-xs uppercase tracking-widest text-gray-700 mb-2 font-semibold">Open to Travel *</label>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setFormData({ ...formData, openToTravel: true })} className={`px-4 py-2 rounded-full border-2 text-xs font-semibold uppercase tracking-widest ${formData.openToTravel === true ? 'bg-[#c9a961] border-[#c9a961] text-white' : 'bg-[#fbf3e4] border-[#dfcda5] text-gray-700'}`}>Yes</button>
                    <button type="button" onClick={() => setFormData({ ...formData, openToTravel: false })} className={`px-4 py-2 rounded-full border-2 text-xs font-semibold uppercase tracking-widest ${formData.openToTravel === false ? 'bg-[#c9a961] border-[#c9a961] text-white' : 'bg-[#fbf3e4] border-[#dfcda5] text-gray-700'}`}>No</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Work & Skills */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-black mb-6">Work & Skills</h2>
              <div className="mb-6">
                <label className="block text-xs uppercase tracking-widest text-gray-700 mb-2 font-semibold">Experience Level *</label>
                <select value={formData.experienceLevel} onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value })} className="w-full bg-[#fbf3e4] border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black">
                  <option value="">Select</option>
                  <option value="lt_1">Less than 1 year</option>
                  <option value="1_3">1–3 years</option>
                  <option value="3_5">3–5 years</option>
                  <option value="gt_5">Over 5 years</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-xs uppercase tracking-widest text-gray-700 mb-2 font-semibold">Key Skills *</label>
                <div className="flex flex-wrap gap-2">
                  {SKILL_PRESETS.map((skill) => {
                    const active = formData.skills.includes(skill);
                    return (
                      <button key={skill} type="button" onClick={() => setFormData({ ...formData, skills: active ? formData.skills.filter((s) => s !== skill) : [...formData.skills, skill] })} className={`px-3 py-1 rounded-full border-2 text-xs font-semibold uppercase tracking-widest ${active ? 'bg-[#c9a961] border-[#c9a961] text-white' : 'bg-[#fbf3e4] border-[#dfcda5] text-gray-700'}`}>
                        {skill}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-xs uppercase tracking-widest text-gray-700 mb-2 font-semibold">Languages *</label>
                <div className="flex gap-2 mb-2">
                  <select value={formData.languageInput} onChange={(e) => setFormData({ ...formData, languageInput: e.target.value })} className="flex-1 bg-[#fbf3e4] border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black">
                    <option value="">Select</option>
                    {POPULAR_LANGUAGES.map((lang) => (<option key={lang} value={lang}>{lang}</option>))}
                  </select>
                  <button type="button" onClick={() => { if (formData.languageInput && !formData.languages.includes(formData.languageInput)) { setFormData({ ...formData, languages: [...formData.languages, formData.languageInput], languageInput: '' }); } }} className="px-4 py-3 bg-[#c9a961] text-white font-bold rounded-full text-xs uppercase tracking-widest">Add</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.languages.map((lang) => (
                    <span key={lang} className="px-3 py-1 rounded-full bg-[#dfcda5] border border-[#c9a961] text-xs text-black flex items-center gap-2 font-semibold">
                      {lang}
                      <button type="button" onClick={() => setFormData({ ...formData, languages: formData.languages.filter((l) => l !== lang) })}>×</button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-xs uppercase tracking-widest text-gray-700 mb-3 font-semibold">Instagram Handles *</label>
                <div className="space-y-3">
                  {formData.instagram.map((ig, idx) => (
                    <div key={idx} className="grid md:grid-cols-2 gap-3">
                      <input value={ig.handle} onChange={(e) => { const next = [...formData.instagram]; next[idx] = { ...ig, handle: e.target.value }; setFormData({ ...formData, instagram: next }); }} placeholder="Handle (without @)" className="w-full bg-white border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black" />
                      <select value={ig.followers} onChange={(e) => { const next = [...formData.instagram]; next[idx] = { ...ig, followers: e.target.value }; setFormData({ ...formData, instagram: next }); }} className="w-full bg-white border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black">
                        <option value="under_5k">Under 5K</option>
                        <option value="5k_20k">5K–20K</option>
                        <option value="20k_50k">20K–50K</option>
                        <option value="50k_100k">50K–100K</option>
                        <option value="100k_plus">100K+</option>
                      </select>
                      {idx > 0 && (
                        <div className="md:col-span-2"><button type="button" onClick={() => setFormData({ ...formData, instagram: formData.instagram.filter((_, i) => i !== idx) })} className="px-3 py-2 rounded-full border-2 border-[#dfcda5] bg-white text-gray-700 font-semibold text-xs uppercase tracking-widest">Remove</button></div>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={() => setFormData({ ...formData, instagram: [...formData.instagram, { handle: '', followers: 'under_5k' }] })} className="px-4 py-3 rounded-full bg-[#c9a961] text-white border-none font-semibold text-xs uppercase tracking-widest">Add Handle</button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Measurements & Rates */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-black mb-6">Measurements & Rates</h2>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-700 mb-2 font-semibold">Height (ft/in) *</label>
                  <div className="flex gap-2">
                    <input type="number" value={formData.height_feet === '' ? '' : formData.height_feet} onChange={(e) => setFormData({ ...formData, height_feet: e.target.value === '' ? '' : Number(e.target.value) })} placeholder="ft" className="w-1/2 bg-[#fbf3e4] border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black" />
                    <input type="number" value={formData.height_inches === '' ? '' : formData.height_inches} onChange={(e) => setFormData({ ...formData, height_inches: e.target.value === '' ? '' : Number(e.target.value) })} placeholder="in" className="w-1/2 bg-[#fbf3e4] border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black" />
                  </div>
                </div>
                <input type="number" value={formData.bust_chest === '' ? '' : formData.bust_chest} onChange={(e) => setFormData({ ...formData, bust_chest: e.target.value === '' ? '' : Number(e.target.value) })} placeholder="Bust / Chest *" className="w-full bg-[#fbf3e4] border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black" />
                <input type="number" value={formData.waist === '' ? '' : formData.waist} onChange={(e) => setFormData({ ...formData, waist: e.target.value === '' ? '' : Number(e.target.value) })} placeholder="Waist *" className="w-full bg-[#fbf3e4] border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black" />
                <input type="number" value={formData.hips === '' ? '' : formData.hips} onChange={(e) => setFormData({ ...formData, hips: e.target.value === '' ? '' : Number(e.target.value) })} placeholder="Hips *" className="w-full bg-[#fbf3e4] border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black" />
                <select value={formData.size} onChange={(e) => setFormData({ ...formData, size: e.target.value })} className="w-full bg-[#fbf3e4] border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black">
                  <option value="">Size *</option>
                  {SIZE_OPTIONS.map((s) => (<option key={s} value={s}>{s}</option>))}
                </select>
                <select value={formData.shoe_size} onChange={(e) => setFormData({ ...formData, shoe_size: e.target.value })} className="w-full bg-[#fbf3e4] border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black">
                  <option value="">Shoe Size *</option>
                  {SHOE_SIZES.map((size) => (<option key={size} value={size}>{size}</option>))}
                </select>
                <input type="number" min={1500} value={formData.min_budget_half_day === '' ? '' : formData.min_budget_half_day} onChange={(e) => setFormData({ ...formData, min_budget_half_day: e.target.value === '' ? '' : Number(e.target.value) })} placeholder="Budget (Half Day) ₹ *" className="w-full bg-[#fbf3e4] border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black" />
                <input type="number" min={2000} value={formData.min_budget_full_day === '' ? '' : formData.min_budget_full_day} onChange={(e) => setFormData({ ...formData, min_budget_full_day: e.target.value === '' ? '' : Number(e.target.value) })} placeholder="Budget (Full Day) ₹ *" className="w-full bg-[#fbf3e4] border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black" />
              </div>
            </div>
          )}

          {/* STEP 4: Media & Submit */}
          {currentStep === 4 && (
            <div>
              <h2 className="text-2xl font-bold text-black mb-6">Media & Submit</h2>
              <div className="grid md:grid-cols-1 gap-4 mb-6">
                <input value={formData.cover_photo_url} onChange={(e) => setFormData({ ...formData, cover_photo_url: e.target.value })} placeholder="Cover Photo URL *" className="w-full bg-[#fbf3e4] border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black" />
                <input value={formData.portfolio_folder_link} onChange={(e) => setFormData({ ...formData, portfolio_folder_link: e.target.value })} placeholder="Portfolio Folder (Google Drive) *" className="w-full bg-[#fbf3e4] border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black" />
                <input value={formData.intro_video_url} onChange={(e) => setFormData({ ...formData, intro_video_url: e.target.value })} placeholder="Intro Video (YouTube) *" className="w-full bg-[#fbf3e4] border-2 border-[#dfcda5] rounded-full px-4 py-3 text-black" />
              </div>
              <p className="text-sm text-gray-600 mb-6">Review your information before submitting. All fields are mandatory.</p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex flex-wrap justify-between gap-3 mt-8">
            <button type="button" onClick={handlePrev} disabled={currentStep === 1} className="px-6 py-3 rounded-2xl border-2 border-[#dfcda5] bg-white text-gray-700 hover:bg-[#fbf3e4] font-semibold uppercase tracking-widest disabled:opacity-50 w-full sm:w-auto">
              Previous
            </button>
            {currentStep < 4 ? (
              <button type="button" onClick={handleNext} className="px-6 py-3 rounded-2xl bg-[#c9a961] text-white font-bold uppercase tracking-widest border-2 border-[#c9a961] hover:bg-[#b8985a] w-full sm:w-auto">
                Next Step
              </button>
            ) : (
              <button type="button" disabled={submittingProfile} onClick={handleSubmit} className="px-6 py-3 rounded-2xl bg-[#c9a961] text-white font-bold uppercase tracking-widest border-2 border-[#c9a961] hover:bg-[#b8985a] disabled:opacity-60 w-full sm:w-auto">
                {submittingProfile ? 'Submitting…' : 'Submit Profile'}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};
