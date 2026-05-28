// Supabase client (spec §3). Uses our self-minted JWT via the `accessToken`
// callback so PostgREST applies RLS based on our custom claims.
import { createClient } from '@supabase/supabase-js';
import { tokenStore } from './tokenStore';

const url = (import.meta.env.VITE_SUPABASE_URL as string) || '';
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

/** True when the Supabase project is not yet configured (env vars missing). */
export const isSupabaseConfigured = url.length > 0 && anonKey.length > 0;

export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    // Return our active token; falls back to anon key when logged out so that
    // *_login RPCs (granted to anon) remain callable.
    accessToken: async () => tokenStore.getActive() ?? anonKey,
  },
);

export const FUNCTIONS_BASE = `${url}/functions/v1`;
