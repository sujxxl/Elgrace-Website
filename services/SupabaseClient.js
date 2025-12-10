import { createClient } from '@supabase/supabase-js';

// Vite exposes env via import.meta.env
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in env');
}

// export named and default to match any import style
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export default supabase;