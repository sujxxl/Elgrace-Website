import { createClient } from '@supabase/supabase-js';
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
  gallery_urls?: string[];
};

// Use a dedicated table to avoid conflicts with the existing minimal `profiles` table
export const PROFILE_TABLE = 'model_profiles';

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

export async function uploadImage(file: File, path: string) {
  const bucket = 'media';
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
  if (error) throw error;
  const { data: pub } = await supabase.storage.from(bucket).getPublicUrl(path);
  return pub.publicUrl;
}

export const PROFILE_TABLE_SQL = `
-- Create a dedicated model profiles table
create table if not exists model_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text not null,
  dob date not null,
  gender text not null check (gender in ('male','female','other')),
  phone text not null,
  email text not null,
  state text not null,
  city text not null,
  category text not null,
  instagram jsonb not null,
  experience_level text,
  languages text[],
  skills text[],
  open_to_travel boolean,
  ramp_walk_experience boolean,
  ramp_walk_description text,
  height_feet int,
  height_inches int,
  bust_chest int,
  waist int,
  hips int,
  weight int,
  shoe_size text,
  cover_photo_url text,
  gallery_urls text[],
  inserted_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
create unique index if not exists model_profiles_user_id_unique on model_profiles(user_id);

-- Enable RLS and allow users to read and write their own row
alter table model_profiles enable row level security;
create policy if not exists "select own" on model_profiles for select using (auth.uid() = user_id);
create policy if not exists "insert own" on model_profiles for insert with check (auth.uid() = user_id);
create policy if not exists "update own" on model_profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
`;
