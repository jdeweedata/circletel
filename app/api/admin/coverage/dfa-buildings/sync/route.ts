/**
 * Admin DFA Sync API
 *
 * POST /api/admin/coverage/dfa-buildings/sync
 * - Triggers a manual DFA building sync via Inngest
 * - Requires admin authentication
 * - Checks for existing running syncs
 *
 * GET /api/admin/coverage/dfa-buildings/sync
 * - Returns sync status for polling UI components
 * - Supports fetching specific sync by ID or latest sync
 *
 * @version 1.0
 * @created 2026-02-26
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSSRClient } from '@/integrations/supabase/server';
import { createClient } from '@/lib/supabase/server';
import { inngest } from '@/lib/inngest';
import { apiLogger } from '@/lib/logging';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 30;

interface DFASyncOptions {
  dryRun?: boolean;
  connectedOnly?: boolean;
  nearNetOnly?: boolean;
}

// Fields to select from dfa_sync_logs
const SYNC_LOG_FIELDS = `
  id,
  status,
  triggered_by,
  triggered_by_user_id,
  connected_count,
  near_net_count,
  records_fetched,
  records_inserted,
  records_updated,
  records_deleted,
  error_message,
  duration_ms,
  started_at,
  completed_at,
  metadata,
  created_at
`;

/**
 * POST /api/admin/coverage/dfa-buildings/sync
 *
 * Triggers a manual DFA building sync.
 * Creates a sync log entry and sends an Inngest event for background processing.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  apiLogger.info('[DFA Sync API] Manual sync request received');

  try {
    // =========================================================================
    // Step 1: Admin Authentication
    // =========================================================================
    const supabaseSSR = await createSSRClient();

    // Get current user from session
    const {
      data: { user },
      error: authError,
    } = await supabaseSSR.auth.getUser();

    if (authError || !user) {
      apiLogger.warn('[DFA Sync API] Unauthenticated request');
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
      .select('id, email, full_name, is_active')
      .eq('id', user.id)
      .maybeSingle();

    if (adminError || !adminUser) {
      apiLogger.warn('[DFA Sync API] User not found in admin_users', {
        userId: user.id,
      });
      return NextResponse.json(
        { success: false, error: 'Access denied: Admin privileges required' },
        { status: 403 }
      );
    }

    if (!adminUser.is_active) {
      apiLogger.warn('[DFA Sync API] Inactive admin user', {
        email: adminUser.email,
      });
      return NextResponse.json(
        { success: false, error: 'Account is inactive' },
        { status: 403 }
      );
    }

    apiLogger.info('[DFA Sync API] Admin authenticated', {
      email: adminUser.email,
    });

    // =========================================================================
    // Step 2: Conflict Detection - Check for running syncs
    // =========================================================================
    const { data: activeSyncs, error: activeError } = await supabase
      .from('dfa_sync_logs')
      .select('id, status, started_at')
      .in('status', ['pending', 'running'])
      .order('created_at', { ascending: false })
      .limit(1);

    if (activeError) {
      apiLogger.error('[DFA Sync API] Failed to check active syncs', {
        error: activeError.message,
      });
      return NextResponse.json(
        { success: false, error: 'Failed to check sync status' },
        { status: 500 }
      );
    }

    if (activeSyncs && activeSyncs.length > 0) {
      const activeSync = activeSyncs[0];
      apiLogger.warn('[DFA Sync API] Sync already in progress', {
        syncId: activeSync.id,
      });
      return NextResponse.json(
        {
          success: false,
          error: 'A sync is already in progress',
          active_sync: {
            id: activeSync.id,
            status: activeSync.status,
            started_at: activeSync.started_at,
          },
        },
        { status: 409 }
      );
    }

    // =========================================================================
    // Step 3: Parse Options
    // =========================================================================
    let options: DFASyncOptions = {};
    try {
      const body = await request.json();
      options = {
        dryRun: body.dryRun === true,
        connectedOnly: body.connectedOnly === true,
        nearNetOnly: body.nearNetOnly === true,
      };
    } catch {
      // No body or invalid JSON - use defaults
      options = { dryRun: false, connectedOnly: false, nearNetOnly: false };
    }

    apiLogger.info('[DFA Sync API] Sync options', {
      dryRun: options.dryRun,
      connectedOnly: options.connectedOnly,
      nearNetOnly: options.nearNetOnly,
    });

    // =========================================================================
    // Step 4: Create Sync Log Entry
    // =========================================================================
    const { data: syncLog, error: insertError } = await supabase
      .from('dfa_sync_logs')
      .insert({
        status: 'pending',
        triggered_by: 'manual',
        triggered_by_user_id: adminUser.id,
      })
      .select('id')
      .single();

    if (insertError || !syncLog) {
      apiLogger.error('[DFA Sync API] Failed to create sync log', {
        error: insertError?.message,
      });
      return NextResponse.json(
        { success: false, error: 'Failed to create sync log entry' },
        { status: 500 }
      );
    }

    apiLogger.info('[DFA Sync API] Created sync log', { syncLogId: syncLog.id });

    // =========================================================================
    // Step 5: Send Inngest Event
    // =========================================================================
    try {
      await inngest.send({
        name: 'dfa/sync.requested',
        data: {
          triggered_by: 'manual',
          admin_user_id: adminUser.id,
          sync_log_id: syncLog.id,
          options: {
            dryRun: options.dryRun,
            connectedOnly: options.connectedOnly,
            nearNetOnly: options.nearNetOnly,
          },
        },
      });

      apiLogger.info('[DFA Sync API] Inngest event sent for sync', {
        syncLogId: syncLog.id,
      });
    } catch (inngestError) {
      const errorMessage =
        inngestError instanceof Error ? inngestError.message : 'Unknown error';
      apiLogger.error('[DFA Sync API] Failed to send Inngest event', {
        error: errorMessage,
      });

      // Mark sync log as failed since we couldn't queue the job
      await supabase
        .from('dfa_sync_logs')
        .update({
          status: 'failed',
          error_message: 'Failed to queue background job',
          completed_at: new Date().toISOString(),
        })
        .eq('id', syncLog.id);

      return NextResponse.json(
        { success: false, error: 'Failed to queue sync job' },
        { status: 500 }
      );
    }

    // =========================================================================
    // Success Response
    // =========================================================================
    const duration = Date.now() - startTime;
    apiLogger.info('[DFA Sync API] Manual sync triggered successfully', {
      durationMs: duration,
    });

    return NextResponse.json({
      success: true,
      sync_log_id: syncLog.id,
      message: options.dryRun
        ? 'Dry run sync started - no changes will be made'
        : 'Sync started',
      options,
      triggered_by: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.full_name,
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    apiLogger.error('[DFA Sync API] Unexpected error', { error: errorMessage });
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/coverage/dfa-buildings/sync
 *
 * Retrieves sync status for polling.
 * - With ?id=<uuid>: Returns specific sync log
 * - Without id: Returns latest sync log
 * - Always includes recent history (last 5)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // =========================================================================
    // Step 1: Admin Authentication
    // =========================================================================
    const supabaseSSR = await createSSRClient();

    // Get current user from session
    const {
      data: { user },
      error: authError,
    } = await supabaseSSR.auth.getUser();

    if (authError || !user) {
      apiLogger.warn('[DFA Sync Status] Unauthenticated request');
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
      apiLogger.warn('[DFA Sync Status] User not found in admin_users', {
        userId: user.id,
      });
      return NextResponse.json(
        { success: false, error: 'Access denied: Admin privileges required' },
        { status: 403 }
      );
    }

    if (!adminUser.is_active) {
      apiLogger.warn('[DFA Sync Status] Inactive admin user');
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
    let current = null;

    if (syncLogId) {
      // Fetch specific sync log by ID
      const { data, error } = await supabase
        .from('dfa_sync_logs')
        .select(SYNC_LOG_FIELDS)
        .eq('id', syncLogId)
        .maybeSingle();

      if (error) {
        apiLogger.error('[DFA Sync Status] Failed to fetch sync log', {
          id: syncLogId,
          error: error.message,
        });
        return NextResponse.json(
          { success: false, error: 'Failed to fetch sync log' },
          { status: 500 }
        );
      }

      current = data;
    } else {
      // Fetch latest sync log
      const { data, error } = await supabase
        .from('dfa_sync_logs')
        .select(SYNC_LOG_FIELDS)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        apiLogger.error('[DFA Sync Status] Failed to fetch latest sync', {
          error: error.message,
        });
        return NextResponse.json(
          { success: false, error: 'Failed to fetch sync status' },
          { status: 500 }
        );
      }

      current = data;
    }

    // =========================================================================
    // Step 4: Fetch Recent Sync History
    // =========================================================================
    const { data: recentLogs, error: recentError } = await supabase
      .from('dfa_sync_logs')
      .select(SYNC_LOG_FIELDS)
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentError) {
      apiLogger.error('[DFA Sync Status] Failed to fetch recent syncs', {
        error: recentError.message,
      });
      return NextResponse.json(
        { success: false, error: 'Failed to fetch sync history' },
        { status: 500 }
      );
    }

    // =========================================================================
    // Success Response
    // =========================================================================
    const duration = Date.now() - startTime;
    apiLogger.debug('[DFA Sync Status] Status retrieved', {
      syncLogId: syncLogId || 'latest',
      durationMs: duration,
    });

    return NextResponse.json({
      success: true,
      data: current,
      recent: recentLogs || [],
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    apiLogger.error('[DFA Sync Status] Unexpected error', {
      error: errorMessage,
    });
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
