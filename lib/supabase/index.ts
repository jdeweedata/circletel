/**
 * Supabase Client Module
 * Re-exports client and server utilities
 */

// Client-side exports (browser)
export { createClient, supabase } from './client';

// Server-side exports are in ./server.ts and should be imported directly
// e.g., import { createClient } from '@/lib/supabase/server';
