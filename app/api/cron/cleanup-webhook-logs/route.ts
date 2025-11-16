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
      console.error('[WebhookLogsCleanup] CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Cron secret not configured' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('[WebhookLogsCleanup] Invalid authorization');
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

    console.log('[WebhookLogsCleanup] ═══════════════════════════════════════════════════════════');
    console.log('[WebhookLogsCleanup]   Starting Webhook Logs Cleanup Job');
    console.log('[WebhookLogsCleanup] ═══════════════════════════════════════════════════════════');
    console.log(`[WebhookLogsCleanup]   Timestamp: ${new Date().toISOString()}`);
    console.log(`[WebhookLogsCleanup]   Mode: ${dryRun ? '🧪 DRY RUN' : '🚀 LIVE'}`);
    console.log(`[WebhookLogsCleanup]   Retention: ${retentionDays} days`);
    console.log('[WebhookLogsCleanup] ═══════════════════════════════════════════════════════════\n');

    // =========================================================================
    // Calculate Cutoff Date
    // =========================================================================
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    console.log(`[WebhookLogsCleanup] Cutoff date: ${cutoffDate.toISOString()}`);
    console.log(`[WebhookLogsCleanup] Deleting logs older than ${retentionDays} days...\n`);

    // =========================================================================
    // Count Logs to Delete (for reporting)
    // =========================================================================
    const supabase = await createClient();

    const { count: logsToDelete, error: countError } = await supabase
      .from('integration_webhook_logs')
      .select('*', { count: 'exact', head: true })
      .lt('received_at', cutoffDate.toISOString());

    if (countError) {
      console.error('[WebhookLogsCleanup] Error counting logs:', countError);
      throw new Error('Failed to count webhook logs');
    }

    console.log(`[WebhookLogsCleanup] Found ${logsToDelete || 0} logs to delete\n`);

    if (logsToDelete === 0 || logsToDelete === null) {
      console.log('[WebhookLogsCleanup] No logs to delete. Job complete.\n');

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
      console.log('[WebhookLogsCleanup] Deleting logs...');

      const { error: deleteError, count: deletedCount } = await supabase
        .from('integration_webhook_logs')
        .delete({ count: 'exact' })
        .lt('received_at', cutoffDate.toISOString());

      if (deleteError) {
        console.error('[WebhookLogsCleanup] Error deleting logs:', deleteError);
        throw new Error('Failed to delete webhook logs');
      }

      logsDeleted = deletedCount || 0;

      console.log(`[WebhookLogsCleanup] ✅ Deleted ${logsDeleted} logs\n`);
    } else {
      console.log('[WebhookLogsCleanup] 🧪 DRY RUN - No logs deleted\n');
      logsDeleted = logsToDelete;
    }

    // =========================================================================
    // Log Summary
    // =========================================================================
    const duration = Date.now() - startTime;

    console.log('[WebhookLogsCleanup] ═══════════════════════════════════════════════════════════');
    console.log('[WebhookLogsCleanup]   Cleanup Complete');
    console.log('[WebhookLogsCleanup] ═══════════════════════════════════════════════════════════');
    console.log(`[WebhookLogsCleanup]   Logs deleted: ${logsDeleted}`);
    console.log(`[WebhookLogsCleanup]   Duration: ${duration}ms`);
    console.log(`[WebhookLogsCleanup]   Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
    console.log('[WebhookLogsCleanup] ═══════════════════════════════════════════════════════════\n');

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
    console.error('[WebhookLogsCleanup] Error running cleanup:', error);

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
