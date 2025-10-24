// Re-export supabase client for integrations
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

/**
 * Create a new Supabase client instance
 * Used for client-side authentication and real-time subscriptions
 */
export function createClient(options?: { flowType?: 'pkce' | 'implicit' }) {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: options?.flowType ?? 'pkce', // Default to PKCE, allow override
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