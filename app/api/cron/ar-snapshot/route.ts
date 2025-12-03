/**
 * Daily AR Snapshot Cron Job
 * POST /api/cron/ar-snapshot
 *
 * Creates daily snapshots of AR aging data for trend analysis.
 * Runs at 23:00 SAST (21:00 UTC) to capture end-of-day AR state.
 *
 * Vercel Cron: 0 21 * * *
 */

import { NextRequest, NextResponse } from 'next/server';
import { NotificationTrackingService } from '@/lib/billing/notification-tracking-service';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('[AR Snapshot] Creating daily snapshot...');

    const result = await NotificationTrackingService.createDailySnapshot();

    if (!result.success) {
      console.error('[AR Snapshot] Failed:', result.error);
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    console.log('[AR Snapshot] Daily snapshot created successfully');

    return NextResponse.json({
      success: true,
      message: 'Daily AR snapshot created',
      date: new Date().toISOString().split('T')[0],
    });
  } catch (error) {
    console.error('[AR Snapshot] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}
