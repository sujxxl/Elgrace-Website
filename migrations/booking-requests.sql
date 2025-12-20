-- Booking requests between brands (clients) and models

create table if not exists public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  model_user_id uuid not null references auth.users(id) on delete cascade,
  client_user_id uuid not null references auth.users(id) on delete cascade,
  brand_profile_id uuid references public.brand_profiles(id) on delete set null,
  message text,
  status text not null default 'pending' check (status in ('pending','approved','rejected','cancelled')),
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.booking_requests enable row level security;

-- Client who created the request can see it
create policy booking_requests_select_client
  on public.booking_requests
  for select
  using ( auth.uid() = client_user_id );

-- Model who is targeted can see it
create policy booking_requests_select_model
  on public.booking_requests
  for select
  using ( auth.uid() = model_user_id );

-- Admins can see all booking requests
create policy booking_requests_select_admin
  on public.booking_requests
  for select
  using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- Clients can create booking requests for themselves
create policy booking_requests_insert_client
  on public.booking_requests
  for insert
  with check ( auth.uid() = client_user_id );

-- Models can update status of requests that target them
create policy booking_requests_update_model
  on public.booking_requests
  for update
  using ( auth.uid() = model_user_id )
  with check ( auth.uid() = model_user_id );

-- Clients can cancel their own booking requests
create policy booking_requests_update_client
  on public.booking_requests
  for update
  using ( auth.uid() = client_user_id )
  with check ( auth.uid() = client_user_id );

-- Admins can update any booking request
create policy booking_requests_update_admin
  on public.booking_requests
  for update
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
