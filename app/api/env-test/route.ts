import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const start = Date.now();

  try {
    console.log('[ENV Test] Starting...');

    // Check what environment variables are available
    const envCheck = {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 50),
      anonKeyPrefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20),
      serviceKeyPrefix: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20),
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV
    };

    const elapsed = Date.now() - start;
    console.log(`[ENV Test] Completed in ${elapsed}ms`, envCheck);

    return NextResponse.json({
      success: true,
      elapsed,
      environment: envCheck,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const elapsed = Date.now() - start;
    console.error('[ENV Test] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      elapsed
    }, { status: 500 });
  }
}
