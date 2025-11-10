import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const start = Date.now();

  try {
    console.log('[Test API] Starting...');

    // Check env var
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    console.log('[Test API] Has service key:', hasServiceKey);

    // Create client
    const supabase = await createClient();
    console.log('[Test API] Client created');

    // Simple count query
    const { count, error } = await supabase
      .from('business_quotes')
      .select('*', { count: 'exact', head: true });

    const elapsed = Date.now() - start;
    console.log(`[Test API] Query completed in ${elapsed}ms`);

    if (error) {
      console.error('[Test API] Error:', error);
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
    console.error('[Test API] Exception:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      elapsed
    }, { status: 500 });
  }
}
