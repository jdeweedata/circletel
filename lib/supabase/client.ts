/**
 * Supabase Client for Client-Side Components
 * Creates a Supabase client for browser use
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Capture env vars at module level (Next.js replaces these at build time)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

// Lazy initialization - client created on first use
let _supabaseClient: ReturnType<typeof createSupabaseClient> | null = null;

function getSupabaseClient() {
  if (_supabaseClient) return _supabaseClient;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.');
  }

  _supabaseClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storageKey: 'sb-agyjovdugmtopasyvlng-auth-token', // Use consistent storage key
    },
    global: {
      headers: {
        'x-application-name': 'circletel-nextjs',
      },
    },
  });

  return _supabaseClient;
}

/**
 * Create a Supabase client for client-side use
 * This client uses the anon key and respects RLS policies
 */
export function createClient() {
  return getSupabaseClient();
}

// Export singleton instance with lazy initialization via Proxy
export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(_, prop) {
    return getSupabaseClient()[prop as keyof ReturnType<typeof createSupabaseClient>];
  }
});
