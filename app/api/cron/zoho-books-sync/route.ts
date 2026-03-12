/**
 * Zoho Books Daily Sync Cron
 *
 * Scheduled job that runs daily at 3am SAST
 *
 * Purpose:
 * - Sync customers to Zoho Books (contacts)
 * - Sync ALL invoices to Zoho Books (no type exclusion)
 * - Sync completed payments to Zoho Books
 *
 * Key difference from Zoho Billing sync:
 * - Uses Zoho Books API v3 (not Billing API)
 * - Syncs ALL invoice types (recurring included)
 * - Preserves CircleTel invoice numbers
 *
 * Schedule: 0 3 * * * (3am daily)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runZohoBooksSyncWorkflow } from '@/lib/integrations/zoho/books-sync-orchestrator';
import { sendZohoBooksAlert } from '@/lib/integrations/zoho/books-alerting-service';
import { cronLogger } from '@/lib/logging';

export const maxDuration = 600; // 10 minutes
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // =========================================================================
    // Verify Vercel Cron Secret
    // =========================================================================
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      cronLogger.error('[ZohoBooks Sync] CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Cron secret not configured' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      cronLogger.error('[ZohoBooks Sync] Invalid authorization');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // =========================================================================
    // Parse Query Parameters
    // =========================================================================
    const searchParams = request.nextUrl.searchParams;
    const dryRun = searchParams.get('dryRun') === 'true';
    const maxCustomers = searchParams.get('maxCustomers')
      ? parseInt(searchParams.get('maxCustomers')!, 10)
      : 30;
    const maxInvoices = searchParams.get('maxInvoices')
      ? parseInt(searchParams.get('maxInvoices')!, 10)
      : 40;
    const maxPayments = searchParams.get('maxPayments')
      ? parseInt(searchParams.get('maxPayments')!, 10)
      : 20;

    cronLogger.info('[ZohoBooks Sync] ═══════════════════════════════════════════════════════════');
    cronLogger.info('[ZohoBooks Sync]   Starting Zoho Books Daily Sync');
    cronLogger.info('[ZohoBooks Sync] ═══════════════════════════════════════════════════════════');
    cronLogger.info(`[ZohoBooks Sync]   Timestamp: ${new Date().toISOString()}`);
    cronLogger.info(`[ZohoBooks Sync]   Mode: ${dryRun ? '🧪 DRY RUN' : '🚀 LIVE'}`);
    cronLogger.info(`[ZohoBooks Sync]   Limits: ${maxCustomers} customers, ${maxInvoices} invoices, ${maxPayments} payments`);
    cronLogger.info('[ZohoBooks Sync] ═══════════════════════════════════════════════════════════\n');

    // =========================================================================
    // Run Sync Workflow
    // =========================================================================
    const summary = await runZohoBooksSyncWorkflow({
      dryRun,
      maxCustomers,
      maxInvoices,
      maxPayments,
    });

    const duration = Date.now() - startTime;

    cronLogger.info('\n[ZohoBooks Sync] ═══════════════════════════════════════════════════════════');
    cronLogger.info('[ZohoBooks Sync]   Daily Sync Completed');
    cronLogger.info('[ZohoBooks Sync] ═══════════════════════════════════════════════════════════');
    cronLogger.info(`[ZohoBooks Sync]   Customers: ✅ ${summary.customers.succeeded} | ❌ ${summary.customers.failed}`);
    cronLogger.info(`[ZohoBooks Sync]   Invoices: ✅ ${summary.invoices.succeeded} | ❌ ${summary.invoices.failed}`);
    cronLogger.info(`[ZohoBooks Sync]   Payments: ✅ ${summary.payments.succeeded} | ❌ ${summary.payments.failed}`);
    cronLogger.info(`[ZohoBooks Sync]   Duration: ${(duration / 1000).toFixed(1)}s`);
    cronLogger.info('[ZohoBooks Sync] ═══════════════════════════════════════════════════════════\n');

    // =========================================================================
    // Log Execution to Database
    // =========================================================================
    try {
      const supabase = await createClient();

      const totalFailed =
        summary.customers.failed +
        summary.invoices.failed +
        summary.payments.failed;

      await supabase.from('cron_execution_log').insert({
        job_name: 'zoho-books-sync',
        status: totalFailed > 0 ? 'partial' : 'success',
        execution_time_ms: duration,
        result_summary: {
          customers: summary.customers,
          invoices: summary.invoices,
          payments: summary.payments,
          dryRun,
        },
        error_message: totalFailed > 0 ? `${totalFailed} entities failed to sync` : null,
      });

      cronLogger.info('[ZohoBooks Sync] ✅ Execution logged to database');
    } catch (logError: any) {
      cronLogger.warn('[ZohoBooks Sync] Failed to log execution (non-fatal)', {
        error: logError.message,
      });
    }

    // =========================================================================
    // Return Summary
    // =========================================================================
    return NextResponse.json({
      success: true,
      message: 'Zoho Books daily sync completed',
      timestamp: new Date().toISOString(),
      duration_ms: duration,
      dryRun,
      summary: {
        customers: summary.customers,
        invoices: summary.invoices,
        payments: summary.payments,
      },
      // Include first 10 results for debugging
      results: summary.results.slice(0, 10),
      resultsCount: summary.results.length,
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    const isOAuthError = error.message?.startsWith('OAUTH_ERROR:');

    cronLogger.error('[ZohoBooks Sync] Fatal error', { error: error.message });
    cronLogger.error('[ZohoBooks Sync] Stack', { stack: error.stack });

    // Send alert for OAuth errors
    if (isOAuthError) {
      try {
        await sendZohoBooksAlert({
          type: 'oauth_failure',
          message: error.message,
          details: {
            timestamp: new Date().toISOString(),
            stack: error.stack,
          },
        });
        cronLogger.info('[ZohoBooks Sync] ⚠️ OAuth alert sent');
      } catch (alertError) {
        cronLogger.error('[ZohoBooks Sync] Failed to send alert', {
          error: alertError instanceof Error ? alertError.message : String(alertError),
        });
      }
    }

    // Log fatal error to database
    try {
      const supabase = await createClient();
      await supabase.from('cron_execution_log').insert({
        job_name: 'zoho-books-sync',
        status: 'failed',
        execution_time_ms: duration,
        error_message: error.message,
        result_summary: {
          error: error.message,
          isOAuthError,
        },
      });
    } catch (logError) {
      cronLogger.error('[ZohoBooks Sync] Failed to log fatal error', {
        error: logError instanceof Error ? logError.message : String(logError),
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: isOAuthError ? 'OAuth authentication failed' : 'Internal server error',
        details: error.message,
        timestamp: new Date().toISOString(),
        duration_ms: duration,
      },
      { status: 500 }
    );
  }
}
