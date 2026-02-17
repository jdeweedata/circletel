/**
 * Get billing cron run logs
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = await createClient();

    // Get cron logs
    const { data: logs, error: logsError, count } = await supabase
      .from('billing_cron_logs')
      .select('*', { count: 'exact' })
      .order('run_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (logsError) {
      return NextResponse.json({ error: logsError.message }, { status: 500 });
    }

    // Get latest run stats
    const latestRun = logs?.[0] || null;

    return NextResponse.json({
      logs: logs || [],
      total: count || 0,
      latestRun,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
