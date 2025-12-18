-- Casting management table
-- Run in Supabase SQL editor
create table if not exists castings (
  id uuid primary key default gen_random_uuid(),
  brand_profile_id uuid references brand_profiles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  location text,
  budget_min numeric,
  budget_max numeric,
  requirements text,
  status text not null default 'under_review' check (status in ('under_review','open','closed','draft')),
  application_deadline date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists castings_user_id_idx on castings(user_id);
create index if not exists castings_brand_profile_id_idx on castings(brand_profile_id);

alter table castings enable row level security;
create policy if not exists "castings_select_own" on castings for select using (auth.uid() = user_id);
create policy if not exists "castings_insert_own" on castings for insert with check (auth.uid() = user_id);
create policy if not exists "castings_update_own" on castings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
