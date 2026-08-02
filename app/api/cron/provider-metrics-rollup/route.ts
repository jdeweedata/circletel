/**
 * Provider API Metrics Rollup Cron Job
 *
 * Aggregates call-grain rows from `provider_api_calls` into the hourly
 * `integration_api_metrics` table, then prunes raw rows past retention.
 *
 * Schedule: `5 * * * *` — five past the hour, so late-arriving fire-and-forget
 * writes from recordProviderCall() have landed before the hour is aggregated.
 *
 * ⚠️ SCHEDULING: the scheduler of record is the VPS crontab, which is GENERATED
 * from vercel.json by ops/scheduler/generate-crontab.sh. Adding the vercel.json
 * entry is NOT sufficient — someone must run
 *   ops/scheduler/generate-crontab.sh | crontab -
 * on VPS 94.72.104.81 or this job never fires. See docs/architecture/CRON_SCHEDULE.md.
 * Do NOT add an Inngest cron trigger for this: that file documents active
 * dual-fire risks where Inngest crons duplicate crontab entries.
 *
 * All aggregation happens in SQL (rollup_provider_api_metrics). p95 needs
 * percentile_cont over the raw sample, which is the reason the raw table exists.
 *
 * Spec: docs/superpowers/specs/2026-08-01-coverage-integrations-observability-split-design.md
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cronLogger } from '@/lib/logging';

/** Matches the retention decided in the spec. Raw rows older than this are pruned. */
const RETENTION_DAYS = 90;

/**
 * GET /api/cron/provider-metrics-rollup
 *
 * Authentication: Bearer CRON_SECRET (matches every other entry in the crontab).
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      cronLogger.error('[ProviderMetricsRollup] CRON_SECRET not configured');
      return NextResponse.json({ error: 'Cron secret not configured' }, { status: 500 });
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      cronLogger.error('[ProviderMetricsRollup] Invalid authorization');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    cronLogger.info('[ProviderMetricsRollup] Starting rollup');

    const supabase = await createClient();

    // Recomputes the previous complete hour plus any hour with raw rows but no
    // metrics row, then prunes. Idempotent — safe to re-run.
    const { data, error } = await supabase.rpc('rollup_provider_api_metrics', {
      p_retention_days: RETENTION_DAYS,
    });

    if (error) {
      cronLogger.error('[ProviderMetricsRollup] Rollup failed', { error: error.message });
      return NextResponse.json(
        { success: false, error: error.message, durationMs: Date.now() - startTime },
        { status: 500 }
      );
    }

    // The function returns a single row: { hours_rolled, rows_pruned }.
    const result = Array.isArray(data) ? data[0] : data;
    const hoursRolled = result?.hours_rolled ?? 0;
    const rowsPruned = result?.rows_pruned ?? 0;

    cronLogger.info('[ProviderMetricsRollup] Complete', {
      hoursRolled,
      rowsPruned,
      durationMs: Date.now() - startTime,
    });

    return NextResponse.json({
      success: true,
      hoursRolled,
      rowsPruned,
      retentionDays: RETENTION_DAYS,
      durationMs: Date.now() - startTime,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    cronLogger.error('[ProviderMetricsRollup] Unhandled error', { error: message });
    return NextResponse.json(
      { success: false, error: message, durationMs: Date.now() - startTime },
      { status: 500 }
    );
  }
}
