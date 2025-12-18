import { supabase } from './supabaseClient';

export type InstagramHandle = {
  handle: string;
  followers: 'under_5k' | '5k_20k' | '20k_50k' | '50k_100k' | '100k_plus';
};

export type ProfileData = {
  id?: string;
  user_id: string;
  full_name: string;
  dob: string; // ISO date
  gender: 'male' | 'female' | 'other';
  phone: string;
  email: string; // from auth
  country: string;
  state: string;
  city: string;
  category: 'model' | 'client';
  instagram: InstagramHandle[];
  // Professional
  experience_level?: 'lt_1' | '1_3' | '3_5' | 'gt_5';
  languages?: string[];
  skills?: string[];
  open_to_travel?: boolean;
  ramp_walk_experience?: boolean;
  ramp_walk_description?: string | null;
  // Measurements
  height_feet?: number;
  height_inches?: number;
  bust_chest?: number;
  waist?: number;
  hips?: number | null;
  weight?: number | null;
  shoe_size?: string; // e.g., 'UK-8' or 'US-9'
  // Media
  cover_photo_url?: string;
  portfolio_folder_link?: string;
};

// Brand profiles (clients)
export type BrandProfile = {
  id?: string;
  user_id: string;
  brand_name: string;
  website_url?: string | null;
  instagram_handle?: string | null;
  contact_email?: string | null;
  brand_description?: string | null;
};

export type Casting = {
  id?: string;
  brand_profile_id?: string | null;
  user_id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  budget_min?: number | null;
  budget_max?: number | null;
  requirements?: string | null;
  status?: 'under_review' | 'open' | 'closed' | 'draft';
  application_deadline?: string | null; // date string
  created_at?: string;
  updated_at?: string;
};

export const PROFILE_TABLE = 'model_profiles';
export const BRAND_PROFILE_TABLE = 'brand_profiles';
export const CASTINGS_TABLE = 'castings';

export async function getProfileByUserId(userId: string) {
  const { data, error } = await supabase
    .from(PROFILE_TABLE)
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as ProfileData | null;
}

export async function upsertProfile(payload: ProfileData) {
  const { data, error } = await supabase
    .from(PROFILE_TABLE)
    .upsert(payload, { onConflict: 'user_id' })
    .select()
    .maybeSingle();
  if (error) throw error;
  return data as ProfileData;
}

export async function getBrandProfileByUserId(userId: string) {
  const { data, error } = await supabase
    .from(BRAND_PROFILE_TABLE)
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as BrandProfile | null;
}

export async function upsertBrandProfile(payload: BrandProfile) {
  const { data, error } = await supabase
    .from(BRAND_PROFILE_TABLE)
    .upsert(payload, { onConflict: 'user_id' })
    .select()
    .maybeSingle();
  if (error) throw error;
  return data as BrandProfile;
}

export async function createCasting(payload: Casting) {
  const insertPayload = { ...payload, status: payload.status ?? 'under_review' };
  const { data, error } = await supabase
    .from(CASTINGS_TABLE)
    .insert(insertPayload)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data as Casting;
}

export async function listCastings() {
  const { data, error } = await supabase
    .from(CASTINGS_TABLE)
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Casting[];
}

// Generic image upload helper for cover photos
export async function uploadImage(file: File, path: string) {
  const bucket = 'media'; // Create a public bucket named "media" in Supabase
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
  if (error) throw error;
  const { data: pub } = await supabase.storage.from(bucket).getPublicUrl(path);
  return pub.publicUrl;
}

