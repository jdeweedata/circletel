/**
 * Zoho CRM Retry Queue API Endpoint
 * GET /api/admin/integrations/zoho/retry-queue
 * POST /api/admin/integrations/zoho/retry-queue
 *
 * Processes failed Zoho CRM syncs with exponential backoff retry logic.
 * Can be triggered manually or via cron job.
 *
 * Epic 2.5 - Enhanced sync failure handling + retries
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { createClient } from '@/lib/supabase/server';
import { processRetryQueue } from '@/lib/integrations/zoho/sync-retry-service';
import { apiLogger } from '@/lib/logging';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for processing queue

/**
 * POST - Process retry queue
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate admin
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const supabaseAdmin = await createClient();

    apiLogger.info('[ZohoRetryQueue] Starting retry queue processing...');

    const result = await processRetryQueue();

    apiLogger.info('[ZohoRetryQueue] Retry queue processing complete', { result });

    return NextResponse.json({
      success: true,
      data: {
        processed: result.processed,
        succeeded: result.succeeded,
        failed: result.failed,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    apiLogger.error('[ZohoRetryQueue] Error processing retry queue', { error: error instanceof Error ? error.message : String(error) });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process retry queue',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Get retry queue status (how many pending retries)
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate admin
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const supabaseAdmin = await createClient();

    // Get count of products due for retry
    const now = new Date().toISOString();
    const { count: dueCount } = await supabaseAdmin
      .from('product_integrations')
      .select('*', { count: 'exact', head: true })
      .eq('sync_status', 'failed')
      .not('next_retry_at', 'is', null)
      .lte('next_retry_at', now)
      .lt('retry_count', 5);

    // Get count of all failed syncs
    const { count: failedCount } = await supabaseAdmin
      .from('product_integrations')
      .select('*', { count: 'exact', head: true })
      .eq('sync_status', 'failed');

    // Get count of max retries exhausted
    const { count: exhaustedCount } = await supabaseAdmin
      .from('product_integrations')
      .select('*', { count: 'exact', head: true })
      .eq('sync_status', 'failed')
      .gte('retry_count', 5);

    return NextResponse.json({
      success: true,
      data: {
        dueForRetry: dueCount ?? 0,
        totalFailed: failedCount ?? 0,
        maxRetriesExhausted: exhaustedCount ?? 0,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    apiLogger.error('[ZohoRetryQueue] Error getting retry queue status', { error: error instanceof Error ? error.message : String(error) });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get retry queue status',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
