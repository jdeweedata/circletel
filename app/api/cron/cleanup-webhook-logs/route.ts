/**
 * Webhook Logs Cleanup Cron Job
 *
 * Scheduled job that runs weekly on Sundays at 3 AM SAST
 *
 * Purpose:
 * - Delete webhook logs older than 90 days to prevent database bloat
 * - Maintain database performance and reduce storage costs
 * - Keep only recent logs for debugging and analysis
 *
 * Retention Policy:
 * - Webhook logs: 90 days (3 months)
 * - Deletion is permanent and cannot be undone
 * - Logs are deleted in batches to avoid timeouts
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cronLogger } from '@/lib/logging';

/**
 * GET /api/cron/cleanup-webhook-logs
 *
 * Vercel Cron Job - Runs weekly on Sundays at 3 AM SAST
 *
 * Schedule: 0 3 * * 0 (cron expression - Sundays at 3 AM)
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
      cronLogger.error('[WebhookLogsCleanup] CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Cron secret not configured' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      cronLogger.error('[WebhookLogsCleanup] Invalid authorization');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // =========================================================================
    // Parse Query Parameters (for testing)
    // =========================================================================
    const searchParams = request.nextUrl.searchParams;
    const dryRun = searchParams.get('dryRun') === 'true';
    const retentionDays = searchParams.get('retentionDays')
      ? parseInt(searchParams.get('retentionDays')!, 10)
      : 90; // Default: 90 days

    cronLogger.info('[WebhookLogsCleanup] ═══════════════════════════════════════════════════════════');
    cronLogger.info('[WebhookLogsCleanup]   Starting Webhook Logs Cleanup Job');
    cronLogger.info('[WebhookLogsCleanup] ═══════════════════════════════════════════════════════════');
    cronLogger.info(`[WebhookLogsCleanup]   Timestamp: ${new Date().toISOString()}`);
    cronLogger.info(`[WebhookLogsCleanup]   Mode: ${dryRun ? '🧪 DRY RUN' : '🚀 LIVE'}`);
    cronLogger.info(`[WebhookLogsCleanup]   Retention: ${retentionDays} days`);
    cronLogger.info('[WebhookLogsCleanup] ═══════════════════════════════════════════════════════════\n');

    // =========================================================================
    // Calculate Cutoff Date
    // =========================================================================
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    cronLogger.info(`[WebhookLogsCleanup] Cutoff date: ${cutoffDate.toISOString()}`);
    cronLogger.info(`[WebhookLogsCleanup] Deleting logs older than ${retentionDays} days...\n`);

    // =========================================================================
    // Count Logs to Delete (for reporting)
    // =========================================================================
    const supabase = await createClient();

    const { count: logsToDelete, error: countError } = await supabase
      .from('integration_webhook_logs')
      .select('*', { count: 'exact', head: true })
      .lt('received_at', cutoffDate.toISOString());

    if (countError) {
      cronLogger.error('[WebhookLogsCleanup] Error counting logs:', countError);
      throw new Error('Failed to count webhook logs');
    }

    cronLogger.info(`[WebhookLogsCleanup] Found ${logsToDelete || 0} logs to delete\n`);

    if (logsToDelete === 0 || logsToDelete === null) {
      cronLogger.info('[WebhookLogsCleanup] No logs to delete. Job complete.\n');

      return NextResponse.json({
        success: true,
        dryRun,
        summary: {
          logsDeleted: 0,
          retentionDays,
          cutoffDate: cutoffDate.toISOString(),
          duration: Date.now() - startTime,
        },
        timestamp: new Date().toISOString(),
      });
    }

    // =========================================================================
    // Delete Logs (if not dry run)
    // =========================================================================
    let logsDeleted = 0;

    if (!dryRun) {
      cronLogger.info('[WebhookLogsCleanup] Deleting logs...');

      const { error: deleteError, count: deletedCount } = await supabase
        .from('integration_webhook_logs')
        .delete({ count: 'exact' })
        .lt('received_at', cutoffDate.toISOString());

      if (deleteError) {
        cronLogger.error('[WebhookLogsCleanup] Error deleting logs:', deleteError);
        throw new Error('Failed to delete webhook logs');
      }

      logsDeleted = deletedCount || 0;

      cronLogger.info(`[WebhookLogsCleanup] ✅ Deleted ${logsDeleted} logs\n`);
    } else {
      cronLogger.info('[WebhookLogsCleanup] 🧪 DRY RUN - No logs deleted\n');
      logsDeleted = logsToDelete;
    }

    // =========================================================================
    // Log Summary
    // =========================================================================
    const duration = Date.now() - startTime;

    cronLogger.info('[WebhookLogsCleanup] ═══════════════════════════════════════════════════════════');
    cronLogger.info('[WebhookLogsCleanup]   Cleanup Complete');
    cronLogger.info('[WebhookLogsCleanup] ═══════════════════════════════════════════════════════════');
    cronLogger.info(`[WebhookLogsCleanup]   Logs deleted: ${logsDeleted}`);
    cronLogger.info(`[WebhookLogsCleanup]   Duration: ${duration}ms`);
    cronLogger.info(`[WebhookLogsCleanup]   Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
    cronLogger.info('[WebhookLogsCleanup] ═══════════════════════════════════════════════════════════\n');

    return NextResponse.json({
      success: true,
      dryRun,
      summary: {
        logsDeleted,
        retentionDays,
        cutoffDate: cutoffDate.toISOString(),
        duration,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    cronLogger.error('[WebhookLogsCleanup] Error running cleanup:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to run webhook logs cleanup',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
