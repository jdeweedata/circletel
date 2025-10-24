/**
 * Supabase Server Client
 * Creates a Supabase client for server-side operations (API routes, server components)
 * Uses service role key for elevated permissions
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Create a Supabase client for server-side use
 * This client has elevated permissions via the service role key
 */
export async function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}
