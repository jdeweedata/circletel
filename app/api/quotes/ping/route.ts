import { NextResponse } from 'next/server';
import { apiLogger } from '@/lib/logging';

export async function GET() {
  const start = Date.now();

  try {
    apiLogger.info('[Ping API] Starting...');

    // Check environment variables
    const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const elapsed = Date.now() - start;
    apiLogger.info(`[Ping API] Completed in ${elapsed}ms`);

    return NextResponse.json({
      success: true,
      message: 'API is working',
      environment: {
        hasSupabaseUrl,
        hasServiceKey,
        hasAnonKey,
        supabaseUrl: hasSupabaseUrl ? process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...' : 'MISSING'
      },
      elapsed
    });
  } catch (error) {
    const elapsed = Date.now() - start;
    apiLogger.error('[Ping API] Exception:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      elapsed
    }, { status: 500 });
  }
}
