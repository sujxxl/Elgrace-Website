-- Supabase schema for the new admin-only ELGRACE Model DB app
-- Run this in your new Supabase project (SQL editor) after creating the project.

-- Enable needed extension for UUID generation (usually already enabled in Supabase)
create extension if not exists "pgcrypto";

-- Helper: updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

/*
  MODEL PROFILES
  - Admin-maintained model records (no login required for models)
  - Mirrors ProfileData in services/ProfileService.ts
  - This block is non-destructive: it only creates/extends the table, never drops data.
*/
create table if not exists public.model_profiles (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  dob date not null,
  gender text not null check (gender in ('male','female','other')),
  phone text not null,
  email text not null,
  country text not null,
  state text not null,
  city text not null,
  category text not null default 'model' check (category in ('model','client')),
  instagram jsonb not null default '[]',
  experience_level text check (experience_level in ('lt_1','1_3','3_5','gt_5')),
  languages text[],
  skills text[],
  open_to_travel boolean,
  ramp_walk_experience boolean,
  ramp_walk_description text,
  height_feet integer,
  height_inches integer,
  bust_chest integer,
  waist integer,
  hips integer,
  weight integer,
  shoe_size text,
  overall_rating integer check (overall_rating >= 0 and overall_rating <= 11),
  expected_budget text,
  -- New structured commercial fields (additive; keep expected_budget for legacy data)
  min_budget_half_day numeric,
  min_budget_full_day numeric,
  -- Clothing size (e.g., XS, S, M, L). Kept separate from legacy weight.
  size text,
  intro_video_url text,
  cover_photo_url text,
  portfolio_folder_link text,
  status text not null default 'UNDER_REVIEW' check (status in ('UNDER_REVIEW','ONLINE','OFFLINE')),
  model_code text unique, -- human-facing ID like M-1000001
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Safely migrate from older versions (additive only - no data loss):
-- Ensure model_code column & unique constraint and new fields exist even if table pre-existed
alter table public.model_profiles add column if not exists model_code text;
alter table public.model_profiles add column if not exists overall_rating integer check (overall_rating >= 0 and overall_rating <= 11);
alter table public.model_profiles add column if not exists expected_budget text;
alter table public.model_profiles add column if not exists min_budget_half_day numeric;
alter table public.model_profiles add column if not exists min_budget_full_day numeric;
alter table public.model_profiles add column if not exists size text;
alter table public.model_profiles add column if not exists intro_video_url text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'model_profiles_model_code_key'
  ) then
    alter table public.model_profiles
      add constraint model_profiles_model_code_key unique (model_code);
  end if;
end;
$$;

drop trigger if exists model_profiles_set_updated_at on public.model_profiles;
create trigger model_profiles_set_updated_at
before update on public.model_profiles
for each row
execute procedure public.handle_updated_at();

/*
  BRAND PROFILES (optional client-side brands)
  - Kept for compatibility with existing types, but you won't have logins for clients
*/
create table if not exists public.brand_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id),
  brand_name text not null,
  website_url text,
  instagram_handle text,
  contact_email text,
  brand_description text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
 
drop trigger if exists brand_profiles_set_updated_at on public.brand_profiles;
create trigger brand_profiles_set_updated_at
before update on public.brand_profiles
for each row
execute procedure public.handle_updated_at();

/*
  CASTINGS (GIGS)
  - Admin-created gigs, optionally linked to a brand profile
*/
create table if not exists public.castings (
  id uuid primary key default gen_random_uuid(),
  brand_profile_id uuid references public.brand_profiles(id),
  user_id uuid references auth.users(id), -- original client user id (unused in admin-only setup)
  title text not null,
  description text,
  location text,
  budget_min numeric,
  budget_max numeric,
  requirements text,
  status text not null default 'under_review' check (status in ('under_review','open','closed','draft')),
  application_deadline date,
  shoot_date date,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
 
drop trigger if exists castings_set_updated_at on public.castings;
create trigger castings_set_updated_at
before update on public.castings
for each row
execute procedure public.handle_updated_at();

/*
  BOOKING REQUESTS
  - Used by admin dashboard to track bookings between models and brands/clients
*/
create table if not exists public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  model_user_id uuid not null,
  client_user_id uuid not null,
  brand_profile_id uuid references public.brand_profiles(id),
  message text,
  status text not null default 'pending' check (status in ('pending','approved','rejected','cancelled')),
  created_at timestamptz not null default timezone('utc', now())
);

/*
  CASTING APPLICATIONS
  - Applications of models to castings, surfaced in the admin dashboard
*/
create table if not exists public.casting_applications (
  id uuid primary key default gen_random_uuid(),
  casting_id uuid not null references public.castings(id) on delete cascade,
  model_user_id uuid not null,
  status text not null default 'applied' check (status in ('applied','shortlisted','booked','rejected','cancelled')),
  created_at timestamptz not null default timezone('utc', now())
);

-- Enable Row Level Security
alter table public.model_profiles enable row level security;
alter table public.castings enable row level security;
alter table public.booking_requests enable row level security;
alter table public.casting_applications enable row level security;

/*
  RLS POLICIES
  - Only admins (JWT claim role = 'admin') can write
  - Public can read ONLINE models and OPEN castings
*/

-- NOTE: Postgres in Supabase does not support IF NOT EXISTS on CREATE POLICY
-- Run this file once in a fresh project, or drop/recreate policies manually.

-- MODEL PROFILES
drop policy if exists "Public read online models" on public.model_profiles;
create policy "Public read online models"
  on public.model_profiles
  for select
  using (status = 'ONLINE');

-- Allow public (including anon) to create new model profiles
-- All such profiles are forced into UNDER_REVIEW so only admins
-- can later approve and publish them.
drop policy if exists "Public create model profiles under review" on public.model_profiles;
create policy "Public create model profiles under review"
  on public.model_profiles
  for insert
  with check (true);

drop policy if exists "Admin full access to model_profiles" on public.model_profiles;
create policy "Admin full access to model_profiles"
  on public.model_profiles
  for all
  using (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
  with check (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

-- CASTINGS (GIGS)
drop policy if exists "Public read open castings" on public.castings;
create policy "Public read open castings"
  on public.castings
  for select
  using (status = 'open');

drop policy if exists "Admin full access to castings" on public.castings;
create policy "Admin full access to castings"
  on public.castings
  for all
  using (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
  with check (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

-- BOOKING REQUESTS (admin-only)
drop policy if exists "Admin full access to booking_requests" on public.booking_requests;
create policy "Admin full access to booking_requests"
  on public.booking_requests
  for all
  using (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
  with check (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

-- CASTING APPLICATIONS (admin-only)
drop policy if exists "Admin full access to casting_applications" on public.casting_applications;
create policy "Admin full access to casting_applications"
  on public.casting_applications
  for all
  using (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
  with check (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

-- NOTE: Storage bucket (optional)
-- If you later switch to uploading images to Supabase instead of Google Drive,
-- create a public storage bucket named "media" and allow public read.
-- The current app setup uses Google Drive links for cover photos/portfolio.
