// Re-export supabase client for integrations
import { supabase as sharedSupabase } from '@/lib/supabase';

/**
 * Create a Supabase client instance
 * Used for client-side authentication and real-time subscriptions
 *
 * IMPORTANT: Always returns the singleton client to prevent
 * "Multiple GoTrueClient instances" warning in the browser.
 *
 * Note: flowType option is deprecated - @supabase/ssr handles
 * PKCE/implicit automatically. The option is kept for backwards
 * compatibility but is now ignored.
 */
export function createClient(_options?: { flowType?: 'pkce' | 'implicit' }) {
  // Always return the shared singleton to prevent multiple GoTrueClient instances
  // The singleton client handles all auth flows automatically via @supabase/ssr
  return sharedSupabase as any;
}

// Also export the singleton instance for backwards compatibility
export { supabase } from '@/lib/supabase';