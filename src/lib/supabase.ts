import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Note: We use 'any' for the Database type to avoid strict type checking issues
// with Supabase's generated types. The actual types are enforced at runtime.
// In a production setup, you would use: npx supabase gen types typescript
// to generate accurate types from your database schema.

// Environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Validate required environment variables
function validateEnv(): { url: string; anonKey: string; serviceKey: string } {
  if (!supabaseUrl) {
    throw new Error('Missing SUPABASE_URL environment variable');
  }
  if (!supabaseAnonKey) {
    throw new Error('Missing SUPABASE_ANON_KEY environment variable');
  }
  if (!supabaseServiceKey) {
    throw new Error('Missing SUPABASE_SERVICE_KEY environment variable');
  }
  return { url: supabaseUrl, anonKey: supabaseAnonKey, serviceKey: supabaseServiceKey };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClientAny = SupabaseClient<any, 'public', any>;

// Lazy initialization to allow environment to be configured first
let _supabase: SupabaseClientAny | null = null;
let _supabaseAdmin: SupabaseClientAny | null = null;

/**
 * Get the Supabase client for public/anonymous operations
 * Uses the anon key with RLS policies
 */
export function getSupabase(): SupabaseClientAny {
  if (!_supabase) {
    const { url, anonKey } = validateEnv();
    _supabase = createClient(url, anonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: false,
      },
    });
  }
  return _supabase;
}

/**
 * Get the Supabase admin client for server-side operations
 * Bypasses RLS - use carefully!
 */
export function getSupabaseAdmin(): SupabaseClientAny {
  if (!_supabaseAdmin) {
    const { url, serviceKey } = validateEnv();
    _supabaseAdmin = createClient(url, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return _supabaseAdmin;
}

/**
 * Check if Supabase is configured
 */
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey && supabaseServiceKey);
}

// Re-export types for convenience
export type { Database } from '../types/database';
