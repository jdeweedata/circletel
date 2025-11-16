/**
 * Zoho Daily Sync Cron Job - Epic 4.4
 *
 * Scheduled job that runs daily at 02:00 SAST
 *
 * Purpose:
 * - Find products needing sync (failed, never synced, or stale)
 * - Sync to Zoho CRM Products module
 * - Sync to Zoho Billing (Plans and Items)
 * - Update product_integrations with sync status
 *
 * Smart Sync Logic:
 * - Priority 1: Failed syncs (sync_status = 'failed')
 * - Priority 2: Never synced (no product_integrations record)
 * - Priority 3: Stale syncs (last_synced_at > 24 hours ago)
 *
 * Rate Limit Compliance:
 * - 90 API calls/min (10% safety buffer under 100/min limit)
 * - Batch processing: 20 products per batch, 15s delays between batches
 * - Product delays: 700ms between products
 * - API delays: 150ms between individual API calls
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runDailySync } from '@/lib/integrations/zoho/daily-sync-service';

/**
 * GET /api/cron/zoho-sync
 *
 * Vercel Cron Job - Runs daily at 02:00 SAST
 *
 * Schedule: 0 2 * * * (cron expression)
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
      console.error('[Zoho Sync Cron] CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Cron secret not configured' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('[Zoho Sync Cron] Invalid authorization');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // =========================================================================
    // Parse Query Parameters (for testing)
    // =========================================================================
    const searchParams = request.nextUrl.searchParams;
    const dryRun = searchParams.get('dryRun') === 'true';
    const maxProducts = searchParams.get('maxProducts')
      ? parseInt(searchParams.get('maxProducts')!, 10)
      : 100; // Default: 100 products (safety limit)

    console.log('[Zoho Sync Cron] ═══════════════════════════════════════════════════════════');
    console.log('[Zoho Sync Cron]   Starting Zoho Daily Sync Job');
    console.log('[Zoho Sync Cron] ═══════════════════════════════════════════════════════════');
    console.log(`[Zoho Sync Cron]   Timestamp: ${new Date().toISOString()}`);
    console.log(`[Zoho Sync Cron]   Mode: ${dryRun ? '🧪 DRY RUN' : '🚀 LIVE'}`);
    console.log(`[Zoho Sync Cron]   Max Products: ${maxProducts}`);
    console.log('[Zoho Sync Cron] ═══════════════════════════════════════════════════════════\n');

    // =========================================================================
    // Run Daily Sync
    // =========================================================================
    const summary = await runDailySync({
      maxProducts,
      dryRun,
    });

    const duration = Date.now() - startTime;

    console.log('\n[Zoho Sync Cron] ═══════════════════════════════════════════════════════════');
    console.log('[Zoho Sync Cron]   Daily Sync Job Completed');
    console.log('[Zoho Sync Cron] ═══════════════════════════════════════════════════════════');
    console.log(`[Zoho Sync Cron]   Total Candidates: ${summary.totalCandidates}`);
    console.log(`[Zoho Sync Cron]   Processed: ${summary.processed}`);
    console.log(`[Zoho Sync Cron]   CRM: ✅ ${summary.crmSucceeded} | ❌ ${summary.crmFailed}`);
    console.log(`[Zoho Sync Cron]   Billing: ✅ ${summary.billingSucceeded} | ❌ ${summary.billingFailed}`);
    console.log(`[Zoho Sync Cron]   Duration: ${(duration / 1000).toFixed(1)}s`);
    console.log('[Zoho Sync Cron] ═══════════════════════════════════════════════════════════\n');

    // =========================================================================
    // Log Execution to Database
    // =========================================================================
    try {
      const supabase = await createClient();

      // Check if cron_execution_log table exists, if not skip logging
      const { error: logError } = await supabase.from('cron_execution_log').insert({
        job_name: 'zoho-sync',
        status: summary.crmFailed + summary.billingFailed > 0 ? 'partial' : 'success',
        execution_time_ms: duration,
        result_summary: {
          totalCandidates: summary.totalCandidates,
          processed: summary.processed,
          crmSucceeded: summary.crmSucceeded,
          crmFailed: summary.crmFailed,
          billingSucceeded: summary.billingSucceeded,
          billingFailed: summary.billingFailed,
          skipped: summary.skipped,
        },
        error_message:
          summary.crmFailed + summary.billingFailed > 0
            ? `${summary.crmFailed + summary.billingFailed} products failed to sync`
            : null,
      });

      if (logError) {
        console.warn('[Zoho Sync Cron] Failed to log execution (non-fatal):', logError.message);
      } else {
        console.log('[Zoho Sync Cron] ✅ Execution logged to database');
      }
    } catch (logError: any) {
      console.warn('[Zoho Sync Cron] Failed to log execution (non-fatal):', logError.message);
    }

    // =========================================================================
    // Log Failed Products to zoho_sync_logs
    // =========================================================================
    if (summary.results.length > 0) {
      const failedResults = summary.results.filter(
        (r) => !r.crmSuccess || !r.billingSuccess
      );

      if (failedResults.length > 0) {
        console.log(`[Zoho Sync Cron] Logging ${failedResults.length} failed products to zoho_sync_logs...`);

        const supabase = await createClient();

        for (const result of failedResults) {
          try {
            // Log CRM failure
            if (!result.crmSuccess && result.crmError) {
              await supabase.from('zoho_sync_logs').insert({
                entity_type: 'service_package',
                entity_id: result.productId,
                status: 'failed',
                error_message: result.crmError,
                attempt_number: 1,
                metadata: {
                  sku: result.sku,
                  name: result.name,
                  sync_type: 'crm',
                  job: 'daily-sync',
                },
              });
            }

            // Log Billing failure
            if (!result.billingSuccess && result.billingError) {
              await supabase.from('zoho_sync_logs').insert({
                entity_type: 'service_package',
                entity_id: result.productId,
                status: 'failed',
                error_message: result.billingError,
                attempt_number: 1,
                metadata: {
                  sku: result.sku,
                  name: result.name,
                  sync_type: 'billing',
                  job: 'daily-sync',
                },
              });
            }
          } catch (logError: any) {
            console.warn(
              `[Zoho Sync Cron] Failed to log error for ${result.sku}:`,
              logError.message
            );
          }
        }

        console.log('[Zoho Sync Cron] ✅ Failed products logged to zoho_sync_logs');
      }
    }

    // =========================================================================
    // Return Summary
    // =========================================================================
    return NextResponse.json({
      success: true,
      message: `Zoho daily sync completed`,
      timestamp: new Date().toISOString(),
      duration_ms: duration,
      summary: {
        totalCandidates: summary.totalCandidates,
        processed: summary.processed,
        crmSucceeded: summary.crmSucceeded,
        crmFailed: summary.crmFailed,
        billingSucceeded: summary.billingSucceeded,
        billingFailed: summary.billingFailed,
        skipped: summary.skipped,
      },
      // Include detailed results for debugging (first 10 only to avoid huge payloads)
      results: summary.results.slice(0, 10),
      resultsCount: summary.results.length,
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;

    console.error('[Zoho Sync Cron] ❌ Fatal error:', error);
    console.error('[Zoho Sync Cron] Stack:', error.stack);

    // Try to log fatal error to database
    try {
      const supabase = await createClient();
      await supabase.from('cron_execution_log').insert({
        job_name: 'zoho-sync',
        status: 'failed',
        execution_time_ms: duration,
        error_message: error.message,
        result_summary: {
          error: error.message,
          stack: error.stack,
        },
      });
    } catch (logError) {
      console.error('[Zoho Sync Cron] Failed to log fatal error:', logError);
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
