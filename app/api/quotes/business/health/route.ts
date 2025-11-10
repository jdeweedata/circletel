import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Health check endpoint - bypasses authentication
 * Tests basic database connectivity
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    console.log('[Health Check] Starting...');

    // Test 1: Database connection
    const supabase = await createClient();

    console.log('[Health Check] Testing database connection...');
    const { data, error } = await supabase
      .from('business_quotes')
      .select('id', { count: 'exact', head: true });

    if (error) {
      console.error('[Health Check] Database error:', error);
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: error.message,
        elapsed_ms: Date.now() - startTime
      }, { status: 500 });
    }

    const elapsed = Date.now() - startTime;
    console.log(`[Health Check] ✅ Success in ${elapsed}ms`);

    return NextResponse.json({
      success: true,
      message: 'Database connection OK',
      quote_count: data || 0,
      elapsed_ms: elapsed
    });
  } catch (error) {
    console.error('[Health Check] Exception:', error);
    return NextResponse.json({
      success: false,
      error: 'Health check failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      elapsed_ms: Date.now() - startTime
    }, { status: 500 });
  }
}
