import { supabase } from './supabaseClient';

export type InstagramHandle = {
  handle: string;
  followers: 'under_5k' | '5k_20k' | '20k_50k' | '50k_100k' | '100k_plus';
};

export type ProfileData = {
  id?: string;
  user_id?: string;
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
  // Clothing size (e.g., XS, S, M). Preferred over legacy weight.
  size?: string | null;
  // Media
  cover_photo_url?: string;
  portfolio_folder_link?: string;
  // Media (intro video)
  intro_video_url?: string | null;
  // Admin review & commercial
  overall_rating?: number | null; // 0-11 (F=0 to A*=11)
  expected_budget?: string | null; // legacy free-form, e.g. "₹10k/day"
  // Structured commercial minimum budgets (new, additive)
  min_budget_half_day?: number | null;
  min_budget_full_day?: number | null;
  // Admin moderation
  status?: 'UNDER_REVIEW' | 'ONLINE' | 'OFFLINE';
  // Human-facing code like M-1000001
  model_code?: string | null;
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
   shoot_date?: string | null; // date string
  created_at?: string;
  updated_at?: string;
};

export const PROFILE_TABLE = 'model_profiles';
export const BRAND_PROFILE_TABLE = 'brand_profiles';
export const CASTINGS_TABLE = 'castings';
export const BOOKINGS_TABLE = 'booking_requests';
export const CASTING_APPLICATIONS_TABLE = 'casting_applications';

export type BookingStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export type BookingRequest = {
  id?: string;
  model_user_id: string;
  client_user_id: string;
  brand_profile_id?: string | null;
  message?: string | null;
  status?: BookingStatus;
  created_at?: string;
};

export type CastingApplicationStatus = 'applied' | 'shortlisted' | 'booked' | 'rejected' | 'cancelled';

export type CastingApplication = {
  id?: string;
  casting_id: string;
  model_user_id: string;
  status?: CastingApplicationStatus;
  created_at?: string;
  // When fetched with joins
  casting?: Casting;
};

// Utility: generate next model_code like M-1000001, M-1000002, ...
export async function getNextModelUserId() {
  const prefix = 'M-';
  const base = 1000001;
  // 1) Preferred: RPC with security definer so anon users can get the next serial
  try {
    const { data: rpcCode, error: rpcError } = await supabase.rpc('next_model_code');
    if (!rpcError && rpcCode) return rpcCode as string;
    if (rpcError) console.warn('RPC next_model_code failed, falling back to select', rpcError.message || rpcError);
  } catch (err) {
    console.warn('RPC next_model_code threw, falling back to select', err);
  }

  // 2) Fallback: max(model_code) select (works when RLS allows)
  const fallbackUnique = `${prefix}${Math.floor(Date.now() / 1000)}`;
  const { data, error } = await supabase
    .from(PROFILE_TABLE)
    .select('model_code')
    .like('model_code', `${prefix}%`)
    .order('model_code', { ascending: false })
    .limit(1);

  if (error) {
    console.warn('Could not fetch latest model_code; using fallback', error?.message || error);
    return fallbackUnique;
  }

  const last = data && (data[0] as any)?.model_code as string | undefined;
  if (typeof last === 'string') {
    const m = last.match(/^M\-(\d+)$/);
    if (m) {
      const currentNum = Number(m[1]);
      if (Number.isFinite(currentNum)) {
        const next = currentNum + 1;
        return `${prefix}${next}`;
      }
    }
  }

  return fallbackUnique || `${prefix}${base}`;
}

export async function getProfileByUserId(userId: string) {
  const { data, error } = await supabase
    .from(PROFILE_TABLE)
    .select('*')
    // In the new schema, profiles are tracked by their own primary key id
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as ProfileData | null;
}

export async function getProfileByModelCode(modelCode: string) {
  const { data, error } = await supabase
    .from(PROFILE_TABLE)
    .select('*')
    .eq('model_code', modelCode)
    .maybeSingle();
  if (error) throw error;
  return data as ProfileData | null;
}

// Public create: used by the talent onboarding form.
// Uses a plain INSERT so only the INSERT RLS policy is required.
export async function createPublicProfile(payload: ProfileData) {
  const { data, error } = await supabase
    .from(PROFILE_TABLE)
    .insert(payload);
  if (error) throw error;
  // For anon/public inserts we don't rely on RETURNING data because
  // RLS SELECT policies may block reading UNDER_REVIEW rows. The
  // caller already has the payload and generated model_code.
  return (data?.[0] ?? null) as ProfileData | null;
}

// Admin upsert: used from the admin dashboard where the admin JWT has full access.
export async function upsertProfile(payload: ProfileData) {
  const { data, error } = await supabase
    .from(PROFILE_TABLE)
    // In the new admin-only schema, model_profiles.user_id is optional and not unique,
    // but model_code is unique. Use model_code for conflict resolution.
    .upsert(payload, { onConflict: 'model_code' })
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

export async function deleteCasting(id: string) {
  const { error } = await supabase.from(CASTINGS_TABLE).delete().eq('id', id);
  if (error) throw error;
}

export async function listCastings() {
  const { data, error } = await supabase
    .from(CASTINGS_TABLE)
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Casting[];
}

// ADMIN: list all model profiles
export async function listAllProfilesAdmin() {
  const { data, error } = await supabase.from(PROFILE_TABLE).select('*');
  if (error) throw error;
  return (data ?? []) as ProfileData[];
}

// PUBLIC: list only ONLINE model profiles
export async function listOnlineProfiles() {
  const { data, error } = await supabase
    .from(PROFILE_TABLE)
    .select('*')
    .eq('status', 'ONLINE');
  if (error) throw error;
  return (data ?? []) as ProfileData[];
}

// ADMIN: update profile status by profile id (primary key)
export async function updateProfileStatus(
  userId: string,
  status: 'UNDER_REVIEW' | 'ONLINE' | 'OFFLINE'
) {
  const { data, error } = await supabase
    .from(PROFILE_TABLE)
    .update({ status })
    .eq('id', userId)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data as ProfileData;
}

// ADMIN: list all castings
export async function listAllCastingsAdmin() {
  const { data, error } = await supabase
    .from(CASTINGS_TABLE)
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Casting[];
}

// PUBLIC/MODEL: list only "online" castings (mapped to status 'open')
export async function listOnlineCastings() {
  const { data, error } = await supabase
    .from(CASTINGS_TABLE)
    .select('*')
    .eq('status', 'open')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Casting[];
}

// BOOKINGS

export async function createBookingRequest(payload: BookingRequest) {
  const insertPayload = { ...payload, status: payload.status ?? 'pending' };
  const { data, error } = await supabase
    .from(BOOKINGS_TABLE)
    .insert(insertPayload)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data as BookingRequest;
}

export async function listBookingRequestsForModel(userId: string) {
  const { data, error } = await supabase
    .from(BOOKINGS_TABLE)
    .select('*')
    .eq('model_user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as BookingRequest[];
}

export async function listBookingRequestsForClient(userId: string) {
  const { data, error } = await supabase
    .from(BOOKINGS_TABLE)
    .select('*')
    .eq('client_user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as BookingRequest[];
}

export async function listAllBookingRequestsAdmin() {
  const { data, error } = await supabase
    .from(BOOKINGS_TABLE)
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as BookingRequest[];
}

export async function updateBookingStatus(id: string, status: BookingStatus) {
  const { data, error } = await supabase
    .from(BOOKINGS_TABLE)
    .update({ status })
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data as BookingRequest;
}

// CASTING APPLICATIONS

export async function applyToCasting(castingId: string, modelUserId: string) {
  const insertPayload = {
    casting_id: castingId,
    model_user_id: modelUserId,
    status: 'applied' as CastingApplicationStatus,
  };

  const { data, error } = await supabase
    .from(CASTING_APPLICATIONS_TABLE)
    .insert(insertPayload)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data as CastingApplication;
}

export async function listCastingApplicationsForModel(userId: string) {
  const { data, error } = await supabase
    .from(CASTING_APPLICATIONS_TABLE)
    .select('*, casting:castings(*)')
    .eq('model_user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as CastingApplication[];
}

export async function listCastingApplicationsForBrand(userId: string) {
  const { data, error } = await supabase
    .from(CASTING_APPLICATIONS_TABLE)
    .select('*, casting:castings(*)')
    .eq('casting.user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as CastingApplication[];
}

export async function listCastingApplicationsForCasting(castingId: string) {
  const { data, error } = await supabase
    .from(CASTING_APPLICATIONS_TABLE)
    .select('*, casting:castings(*)')
    .eq('casting_id', castingId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as CastingApplication[];
}

// ADMIN: list all casting applications with casting join
export async function listAllCastingApplicationsAdmin() {
  const { data, error } = await supabase
    .from(CASTING_APPLICATIONS_TABLE)
    .select('*, casting:castings(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as CastingApplication[];
}

export async function updateCastingApplicationStatus(
  id: string,
  status: CastingApplicationStatus
) {
  const { data, error } = await supabase
    .from(CASTING_APPLICATIONS_TABLE)
    .update({ status })
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data as CastingApplication;
}

// ADMIN: update casting status using high-level moderation statuses
export async function updateCastingStatus(
  id: string,
  uiStatus: 'UNDER_VERIFICATION' | 'ONLINE' | 'CLOSED'
) {
  // Map UI statuses to existing DB status values
  let dbStatus: Casting['status'];
  switch (uiStatus) {
    case 'ONLINE':
      dbStatus = 'open';
      break;
    case 'CLOSED':
      dbStatus = 'closed';
      break;
    case 'UNDER_VERIFICATION':
    default:
      dbStatus = 'under_review';
      break;
  }

  const { data, error } = await supabase
    .from(CASTINGS_TABLE)
    .update({ status: dbStatus })
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data as Casting;
}

// Generic image upload helper for cover photos
export async function uploadImage(file: File, path: string) {
  const bucket = 'media'; // Create a public bucket named "media" in Supabase
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
  if (error) throw error;
  const { data: pub } = await supabase.storage.from(bucket).getPublicUrl(path);
  return pub.publicUrl;
}

