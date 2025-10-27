// Re-export supabase client for integrations
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { supabase as sharedSupabase } from '@/lib/supabase';

/**
 * Create a new Supabase client instance
 * Used for client-side authentication and real-time subscriptions
 */
export function createClient(options?: { flowType?: 'pkce' | 'implicit' }) {
  // Use the shared singleton by default to prevent multiple GoTrue clients (flicker)
  if (!options?.flowType || options.flowType === 'pkce') {
    return sharedSupabase as any;
  }

  // Get environment variables at runtime
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  // Only when explicitly requesting a different flow type (rare), create a temporary client
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: options.flowType,
    },
    global: {
      headers: {
        'x-application-name': 'circletel-nextjs',
      },
    },
  });
}

// Also export the singleton instance for backwards compatibility
export { supabase } from '@/lib/supabase';