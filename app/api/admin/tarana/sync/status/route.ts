/**
 * Tarana Sync Status Polling API
 *
 * GET /api/admin/tarana/sync/status
 *
 * Returns sync status for polling UI components.
 * Supports fetching specific sync by ID or latest sync.
 *
 * Query Parameters:
 * - id (optional): Specific sync log ID to retrieve
 *
 * Response includes:
 * - current: The requested or latest sync log
 * - recent: Last 5 sync logs for history display
 *
 * @version 1.0
 * @created 2026-02-19
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSSRClient } from '@/integrations/supabase/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging';

export const dynamic = 'force-dynamic';

// Fields to select from tarana_sync_logs
const SYNC_LOG_FIELDS = `
  id,
  status,
  trigger_type,
  triggered_by,
  stations_fetched,
  inserted,
  updated,
  deleted,
  errors,
  attempt,
  started_at,
  completed_at,
  duration_ms,
  created_at
`;

interface SyncLog {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  trigger_type: 'cron' | 'manual';
  triggered_by: string | null;
  stations_fetched: number;
  inserted: number;
  updated: number;
  deleted: number;
  errors: Array<{ message: string; timestamp: string }>;
  attempt: number;
  started_at: string | null;
  completed_at: string | null;
  duration_ms: number | null;
  created_at: string;
}

interface SyncStatusResponse {
  success: boolean;
  data?: {
    current: SyncLog | null;
    recent: SyncLog[];
  };
  error?: string;
}

/**
 * GET /api/admin/tarana/sync/status
 *
 * Retrieves sync status for polling.
 * - With ?id=<uuid>: Returns specific sync log
 * - Without id: Returns latest sync log
 * - Always includes recent history (last 5)
 */
export async function GET(request: NextRequest): Promise<NextResponse<SyncStatusResponse>> {
  const startTime = Date.now();

  try {
    // =========================================================================
    // Step 1: Admin Authentication
    // =========================================================================
    const supabaseSSR = await createSSRClient();

    // Get current user from session
    const { data: { user }, error: authError } = await supabaseSSR.auth.getUser();

    if (authError || !user) {
      apiLogger.warn('[Tarana Sync Status] Unauthenticated request');
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Use service role client to check admin_users (bypasses RLS)
    const supabase = await createClient();

    // Verify user is an admin
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('id, is_active')
      .eq('id', user.id)
      .maybeSingle();

    if (adminError || !adminUser) {
      apiLogger.warn('[Tarana Sync Status] User not found in admin_users', { userId: user.id });
      return NextResponse.json(
        { success: false, error: 'Access denied: Admin privileges required' },
        { status: 403 }
      );
    }

    if (!adminUser.is_active) {
      apiLogger.warn('[Tarana Sync Status] Inactive admin user');
      return NextResponse.json(
        { success: false, error: 'Account is inactive' },
        { status: 403 }
      );
    }

    // =========================================================================
    // Step 2: Parse Query Parameters
    // =========================================================================
    const { searchParams } = new URL(request.url);
    const syncLogId = searchParams.get('id');

    // =========================================================================
    // Step 3: Fetch Current Sync Log
    // =========================================================================
    let current: SyncLog | null = null;

    if (syncLogId) {
      // Fetch specific sync log by ID
      const { data, error } = await supabase
        .from('tarana_sync_logs')
        .select(SYNC_LOG_FIELDS)
        .eq('id', syncLogId)
        .maybeSingle();

      if (error) {
        apiLogger.error('[Tarana Sync Status] Failed to fetch sync log', { id: syncLogId, error: error.message });
        return NextResponse.json(
          { success: false, error: 'Failed to fetch sync log' },
          { status: 500 }
        );
      }

      current = data as SyncLog | null;
    } else {
      // Fetch latest sync log
      const { data, error } = await supabase
        .from('tarana_sync_logs')
        .select(SYNC_LOG_FIELDS)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        apiLogger.error('[Tarana Sync Status] Failed to fetch latest sync', { error: error.message });
        return NextResponse.json(
          { success: false, error: 'Failed to fetch sync status' },
          { status: 500 }
        );
      }

      current = data as SyncLog | null;
    }

    // =========================================================================
    // Step 4: Fetch Recent Sync History
    // =========================================================================
    const { data: recentLogs, error: recentError } = await supabase
      .from('tarana_sync_logs')
      .select(SYNC_LOG_FIELDS)
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentError) {
      apiLogger.error('[Tarana Sync Status] Failed to fetch recent syncs', { error: recentError.message });
      return NextResponse.json(
        { success: false, error: 'Failed to fetch sync history' },
        { status: 500 }
      );
    }

    // =========================================================================
    // Success Response
    // =========================================================================
    const duration = Date.now() - startTime;
    apiLogger.debug('[Tarana Sync Status] Status retrieved', {
      syncLogId: syncLogId || 'latest',
      durationMs: duration,
    });

    return NextResponse.json({
      success: true,
      data: {
        current,
        recent: (recentLogs as SyncLog[]) || [],
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    apiLogger.error('[Tarana Sync Status] Unexpected error', { error: errorMessage });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
