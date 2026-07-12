/**
 * Tarana Link Metrics Collection Cron Job
 * GET/POST /api/cron/tarana-metrics
 *
 * Collects a snapshot of signal/link telemetry for all active Tarana RNs from
 * the TCS Portal and stores rows in tarana_link_metrics. Runs on the Vercel
 * cron mechanism (the equivalent Inngest cron does not self-fire in prod).
 *
 * Vercel Cron: every 15 minutes
 * Protected by CRON_SECRET header.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withCronLogging, verifyCronSecret } from '@/lib/logging';
import { collectLinkMetrics } from '@/lib/tarana/metrics-service';

export const runtime = 'nodejs';
export const maxDuration = 120; // 2 minutes — one NQS call per active RN

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await withCronLogging('tarana-metrics', 'vercel_cron', async () => {
      const collection = await collectLinkMetrics();
      return {
        records_processed: collection.collected,
        records_failed: collection.errors.length,
        records_skipped: collection.skipped,
        execution_details: { errors: collection.errors.slice(0, 5) },
      };
    });

    return NextResponse.json({
      success: result.records_failed === 0,
      message: `Tarana metrics collection ${result.records_failed > 0 ? 'partially ' : ''}completed`,
      collected: result.records_processed,
      skipped: result.records_skipped,
      errors: result.records_failed,
      duration_ms: result.durationMs,
      logId: result.logId,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}
