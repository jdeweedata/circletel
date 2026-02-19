/**
 * Admin Tarana Sync API
 *
 * POST /api/admin/tarana/sync
 *
 * Triggers a manual Tarana base station sync via Inngest.
 * Requires admin authentication and checks for existing running syncs.
 *
 * @version 1.0
 * @created 2026-02-19
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSSRClient } from '@/integrations/supabase/server';
import { createClient } from '@/lib/supabase/server';
import { inngest } from '@/lib/inngest';
import { apiLogger } from '@/lib/logging';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 30;

interface TaranaSyncOptions {
  dryRun?: boolean;
  deleteStale?: boolean;
}

/**
 * POST /api/admin/tarana/sync
 *
 * Triggers a manual Tarana base station sync.
 * Creates a sync log entry and sends an Inngest event for background processing.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  apiLogger.info('[Tarana Sync API] Manual sync request received');

  try {
    // =========================================================================
    // Step 1: Admin Authentication
    // =========================================================================
    const supabaseSSR = await createSSRClient();

    // Get current user from session
    const { data: { user }, error: authError } = await supabaseSSR.auth.getUser();

    if (authError || !user) {
      apiLogger.warn('[Tarana Sync API] Unauthenticated request');
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
      apiLogger.warn('[Tarana Sync API] User not found in admin_users', { userId: user.id });
      return NextResponse.json(
        { success: false, error: 'Access denied: Admin privileges required' },
        { status: 403 }
      );
    }

    if (!adminUser.is_active) {
      apiLogger.warn('[Tarana Sync API] Inactive admin user', { email: adminUser.email });
      return NextResponse.json(
        { success: false, error: 'Account is inactive' },
        { status: 403 }
      );
    }

    apiLogger.info('[Tarana Sync API] Admin authenticated', { email: adminUser.email });

    // =========================================================================
    // Step 2: Conflict Detection - Check for running syncs
    // =========================================================================
    const { data: activeSyncs, error: activeError } = await supabase
      .from('tarana_sync_logs')
      .select('id, status, started_at')
      .in('status', ['pending', 'running'])
      .order('created_at', { ascending: false })
      .limit(1);

    if (activeError) {
      apiLogger.error('[Tarana Sync API] Failed to check active syncs', { error: activeError.message });
      return NextResponse.json(
        { success: false, error: 'Failed to check sync status' },
        { status: 500 }
      );
    }

    if (activeSyncs && activeSyncs.length > 0) {
      const activeSync = activeSyncs[0];
      apiLogger.warn('[Tarana Sync API] Sync already in progress', { syncId: activeSync.id });
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
    let options: TaranaSyncOptions = {};
    try {
      const body = await request.json();
      options = {
        dryRun: body.dryRun === true,
        deleteStale: body.deleteStale === true,
      };
    } catch {
      // No body or invalid JSON - use defaults
      options = { dryRun: false, deleteStale: false };
    }

    apiLogger.info('[Tarana Sync API] Sync options', { dryRun: options.dryRun, deleteStale: options.deleteStale });

    // =========================================================================
    // Step 4: Create Sync Log Entry
    // =========================================================================
    const { data: syncLog, error: insertError } = await supabase
      .from('tarana_sync_logs')
      .insert({
        status: 'pending',
        trigger_type: 'manual',
        triggered_by: adminUser.id,
      })
      .select('id')
      .single();

    if (insertError || !syncLog) {
      apiLogger.error('[Tarana Sync API] Failed to create sync log', { error: insertError?.message });
      return NextResponse.json(
        { success: false, error: 'Failed to create sync log entry' },
        { status: 500 }
      );
    }

    apiLogger.info('[Tarana Sync API] Created sync log', { syncLogId: syncLog.id });

    // =========================================================================
    // Step 5: Send Inngest Event
    // =========================================================================
    try {
      await inngest.send({
        name: 'tarana/sync.requested',
        data: {
          triggered_by: 'manual',
          admin_user_id: adminUser.id,
          sync_log_id: syncLog.id,
          options: {
            dryRun: options.dryRun,
            deleteStale: options.deleteStale,
          },
        },
      });

      apiLogger.info('[Tarana Sync API] Inngest event sent for sync', { syncLogId: syncLog.id });
    } catch (inngestError) {
      const errorMessage = inngestError instanceof Error ? inngestError.message : 'Unknown error';
      apiLogger.error('[Tarana Sync API] Failed to send Inngest event', { error: errorMessage });

      // Mark sync log as failed since we couldn't queue the job
      await supabase
        .from('tarana_sync_logs')
        .update({
          status: 'failed',
          errors: [{ message: 'Failed to queue background job', timestamp: new Date().toISOString() }],
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
    apiLogger.info('[Tarana Sync API] Manual sync triggered successfully', { durationMs: duration });

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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    apiLogger.error('[Tarana Sync API] Unexpected error', { error: errorMessage });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
