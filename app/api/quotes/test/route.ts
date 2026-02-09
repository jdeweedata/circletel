import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging';

export async function GET() {
  const start = Date.now();

  try {
    apiLogger.info('[Test API] Starting...');

    // Check env var
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    apiLogger.info('[Test API] Has service key:', hasServiceKey);

    // Create client
    const supabase = await createClient();
    apiLogger.info('[Test API] Client created');

    // Simple count query
    const { count, error } = await supabase
      .from('business_quotes')
      .select('*', { count: 'exact', head: true });

    const elapsed = Date.now() - start;
    apiLogger.info(`[Test API] Query completed in ${elapsed}ms`);

    if (error) {
      apiLogger.error('[Test API] Error:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
        elapsed
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      count,
      hasServiceKey,
      elapsed
    });
  } catch (error) {
    const elapsed = Date.now() - start;
    apiLogger.error('[Test API] Exception:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      elapsed
    }, { status: 500 });
  }
}
