import { NextResponse } from 'next/server';

/**
 * Diagnostic endpoint - NO Supabase, NO database
 * Tests if the API route itself works and environment variables are set
 */
export async function GET() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    node_env: process.env.NODE_ENV,
    has_supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    has_service_role_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    has_anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
    vercel_env: process.env.VERCEL_ENV,
    vercel_url: process.env.VERCEL_URL
  };

  return NextResponse.json({
    success: true,
    message: 'Diagnostic endpoint is working',
    diagnostics
  });
}
