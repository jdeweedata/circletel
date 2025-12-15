/**
 * Supabase Client for Client-Side Components
 * Creates a Supabase client for browser use with localStorage-based storage
 *
 * IMPORTANT: Uses standard @supabase/supabase-js createClient for consistent
 * localStorage-based session storage across all client-side components.
 */

import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

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

  // Use standard createClient from @supabase/supabase-js for localStorage-based session
  // This ensures consistent session storage across all client-side components
  _supabaseClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        'x-application-name': 'circletel-nextjs',
      },
    },
    auth: {
      // Use localStorage for session persistence (default behavior)
      persistSession: true,
      // Automatically refresh the session before it expires
      autoRefreshToken: true,
      // Detect session from URL (for OAuth callbacks)
      detectSessionInUrl: true,
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

/**
 * Clear all Supabase session cookies from the browser
 * Use this when detecting stale/invalid sessions (403 errors)
 * to allow users to log in fresh without manual cookie clearing
 */
export function clearSupabaseSession(): void {
  if (typeof window === 'undefined') return;

  // Supabase cookie names for our project
  const projectRef = 'agyjovdugmtopasyvlng';
  const cookieNames = [
    `sb-${projectRef}-auth-token`,
    `sb-${projectRef}-auth-token-code-verifier`,
  ];

  // Clear each cookie by setting it to expire in the past
  cookieNames.forEach(name => {
    // Clear for current path
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    // Also clear for root path
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
  });

  // Also clear localStorage items that Supabase might use
  try {
    const keysToRemove = Object.keys(localStorage).filter(
      key => key.startsWith('sb-') || key.includes('supabase')
    );
    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (e) {
    // localStorage might not be available
    console.warn('[clearSupabaseSession] Could not clear localStorage:', e);
  }

  // Reset the singleton client so a fresh one is created
  _supabaseClient = null;

  console.log('[clearSupabaseSession] Cleared Supabase session cookies and localStorage');
}
