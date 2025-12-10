/**
 * Supabase Client for Client-Side Components
 * Creates a Supabase client for browser use with cookie-based storage
 *
 * IMPORTANT: Uses @supabase/ssr createBrowserClient for cookie storage
 * to match the middleware and server-side session handling.
 */

import { createBrowserClient } from '@supabase/ssr';
import { SupabaseClient } from '@supabase/supabase-js';

// Capture env vars at module level (Next.js replaces these at build time)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

// Lazy initialization - client created on first use
let _supabaseClient: SupabaseClient | null = null;

function getSupabaseClient() {
  if (_supabaseClient) return _supabaseClient;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.');
  }

  // Use createBrowserClient from @supabase/ssr for cookie-based session storage
  // This ensures sessions are stored in cookies, matching middleware expectations
  _supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        'x-application-name': 'circletel-nextjs',
      },
    },
    // Configure cookie options for better persistence after external redirects
    cookieOptions: {
      // Use 'Lax' for SameSite to allow cookies on top-level navigations
      // This is important for redirects from external payment gateways
      sameSite: 'lax',
      // Ensure cookies are secure in production
      secure: process.env.NODE_ENV === 'production',
      // Set a reasonable max age (7 days)
      maxAge: 60 * 60 * 24 * 7,
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
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return getSupabaseClient()[prop as keyof SupabaseClient];
  }
});
