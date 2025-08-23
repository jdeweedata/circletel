// CircleTel Supabase Client Configuration
// Environment-aware client for development/staging/production
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Get environment variables with fallbacks
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://agyjovdugmtopasyvlng.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFneWpvdmR1Z210b3Bhc3l2bG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwNjg0MzYsImV4cCI6MjA1NzY0NDQzNn0.tEGMZGJLGJetMDf-0aCL9gfPelj347LMNpWrt4HOLXU";

// Environment detection
const ENV = import.meta.env.VITE_ENV || 'production';
const isDevelopment = ENV === 'development';
const isStaging = ENV === 'staging';
const isProduction = ENV === 'production';

// Log environment info in development
if (isDevelopment) {
  console.log('🔧 CircleTel Development Environment');
  console.log('Supabase URL:', SUPABASE_URL);
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Export environment helpers
export { ENV, isDevelopment, isStaging, isProduction };