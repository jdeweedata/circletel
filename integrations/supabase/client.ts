// Re-export supabase client for integrations
import { createBrowserClient } from '@supabase/ssr';
import { supabase as sharedSupabase } from '@/lib/supabase';

// Capture env vars at module level (Next.js replaces these at build time)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

/**
 * Create a new Supabase client instance
 * Used for client-side authentication and real-time subscriptions
 *
 * Note: flowType option is deprecated with @supabase/ssr as it handles
 * PKCE/implicit automatically. Maintained for backwards compatibility
 * but will always return cookie-based client.
 */
export function createClient(options?: { flowType?: 'pkce' | 'implicit' }) {
  // Use the shared singleton by default to prevent multiple GoTrue clients (flicker)
  // The shared client is now cookie-based via @supabase/ssr
  if (!options?.flowType || options.flowType === 'pkce') {
    return sharedSupabase as any;
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.');
  }

  // For implicit flow (rare, used in password reset on staging),
  // still use createBrowserClient for cookie consistency
  // Note: @supabase/ssr handles auth flow internally
  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        'x-application-name': 'circletel-nextjs',
      },
    },
  });
}

// Also export the singleton instance for backwards compatibility
export { supabase } from '@/lib/supabase';