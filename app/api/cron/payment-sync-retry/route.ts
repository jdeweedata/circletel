/**
 * Payment Sync Retry Cron Job
 *
 * POST /api/cron/payment-sync-retry
 *
 * Scheduled job that runs every 4 hours to retry failed ZOHO payment syncs.
 * Part of the Unified Payment & Billing Architecture (Supabase-First).
 *
 * Purpose:
 * - Find payments with zoho_sync_status = 'failed'
 * - Retry sync to ZOHO Billing as "offline payments"
 * - Update sync status and log results
 *
 * Schedule: "0 *​/4 * * *" (every 4 hours)
 *
 * @see agent-os/specs/20251202-unified-payment-billing/SPEC.md
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { retryFailedPaymentSyncs, getPaymentSyncStats } from '@/lib/payments/payment-sync-service';
import { cronLogger } from '@/lib/logging';

/**
 * GET /api/cron/payment-sync-retry
 *
 * Vercel Cron Job - Runs every 4 hours
 *
 * Authentication: Vercel Cron Secret
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // =========================================================================
    // Verify Vercel Cron Secret
    // =========================================================================
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      cronLogger.error('[Payment Sync Retry] CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Cron secret not configured' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      cronLogger.error('[Payment Sync Retry] Invalid authorization');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // =========================================================================
    // Parse Query Parameters
    // =========================================================================
    const searchParams = request.nextUrl.searchParams;
    const dryRun = searchParams.get('dryRun') === 'true';
    const limit = searchParams.get('limit')
      ? parseInt(searchParams.get('limit')!, 10)
      : 50; // Default: 50 payments per run

    cronLogger.info('[Payment Sync Retry] ═══════════════════════════════════════════════════════════');
    cronLogger.info('[Payment Sync Retry]   Starting Payment Sync Retry Job');
    cronLogger.info('[Payment Sync Retry] ═══════════════════════════════════════════════════════════');
    cronLogger.info(`[Payment Sync Retry]   Timestamp: ${new Date().toISOString()}`);
    cronLogger.info(`[Payment Sync Retry]   Mode: ${dryRun ? '🧪 DRY RUN' : '🚀 LIVE'}`);
    cronLogger.info(`[Payment Sync Retry]   Limit: ${limit} payments`);
    cronLogger.info('[Payment Sync Retry] ═══════════════════════════════════════════════════════════\n');

    // =========================================================================
    // Get Current Stats
    // =========================================================================
    const beforeStats = await getPaymentSyncStats();
    cronLogger.info('[Payment Sync Retry] Current sync stats:', beforeStats);

    // =========================================================================
    // Skip if dry run
    // =========================================================================
    if (dryRun) {
      const duration = Date.now() - startTime;
      return NextResponse.json({
        success: true,
        message: 'Dry run completed - no payments processed',
        timestamp: new Date().toISOString(),
        duration_ms: duration,
        beforeStats,
        dryRun: true,
      });
    }

    // =========================================================================
    // Run Retry Logic
    // =========================================================================
    const result = await retryFailedPaymentSyncs(limit);

    const duration = Date.now() - startTime;

    // =========================================================================
    // Get Updated Stats
    // =========================================================================
    const afterStats = await getPaymentSyncStats();

    cronLogger.info('\n[Payment Sync Retry] ═══════════════════════════════════════════════════════════');
    cronLogger.info('[Payment Sync Retry]   Payment Sync Retry Job Completed');
    cronLogger.info('[Payment Sync Retry] ═══════════════════════════════════════════════════════════');
    cronLogger.info(`[Payment Sync Retry]   Processed: ${result.processed}`);
    cronLogger.info(`[Payment Sync Retry]   Succeeded: ${result.succeeded}`);
    cronLogger.info(`[Payment Sync Retry]   Failed: ${result.failed}`);
    cronLogger.info(`[Payment Sync Retry]   Duration: ${(duration / 1000).toFixed(1)}s`);
    cronLogger.info('[Payment Sync Retry] ═══════════════════════════════════════════════════════════\n');

    // =========================================================================
    // Log Execution to Database
    // =========================================================================
    try {
      const supabase = await createClient();

      const { error: logError } = await supabase.from('cron_execution_log').insert({
        job_name: 'payment-sync-retry',
        status: result.failed > 0 ? 'partial' : (result.processed === 0 ? 'skipped' : 'success'),
        execution_time_ms: duration,
        result_summary: {
          processed: result.processed,
          succeeded: result.succeeded,
          failed: result.failed,
          beforeStats,
          afterStats,
        },
        error_message:
          result.failed > 0
            ? `${result.failed} payments failed to sync`
            : null,
      });

      if (logError) {
        cronLogger.warn('[Payment Sync Retry] Failed to log execution (non-fatal):', logError.message);
      } else {
        cronLogger.info('[Payment Sync Retry] Execution logged to database');
      }
    } catch (logError: any) {
      cronLogger.warn('[Payment Sync Retry] Failed to log execution (non-fatal):', logError.message);
    }

    // =========================================================================
    // Return Summary
    // =========================================================================
    return NextResponse.json({
      success: true,
      message: `Payment sync retry completed`,
      timestamp: new Date().toISOString(),
      duration_ms: duration,
      summary: {
        processed: result.processed,
        succeeded: result.succeeded,
        failed: result.failed,
      },
      beforeStats,
      afterStats,
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;

    cronLogger.error('[Payment Sync Retry] Fatal error:', error);
    cronLogger.error('[Payment Sync Retry] Stack:', error.stack);

    // Try to log fatal error to database
    try {
      const supabase = await createClient();
      await supabase.from('cron_execution_log').insert({
        job_name: 'payment-sync-retry',
        status: 'failed',
        execution_time_ms: duration,
        error_message: error.message,
        result_summary: {
          error: error.message,
          stack: error.stack,
        },
      });
    } catch (logError) {
      cronLogger.error('[Payment Sync Retry] Failed to log fatal error:', logError);
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error.message,
        timestamp: new Date().toISOString(),
        duration_ms: duration,
      },
      { status: 500 }
    );
  }
}
