/**
 * Integration Webhook Replay API
 *
 * POST /api/admin/integrations/webhooks/[id]/replay
 *
 * Replay a failed webhook by re-sending it to the webhook handler
 *
 * Use Cases:
 * - Recover from transient failures
 * - Debug webhook processing issues
 * - Manual retry after fixing integration issues
 *
 * Response:
 * - Replay result (success/failure)
 * - New webhook log ID
 * - Processing details
 *
 * Authentication: Admin users only (RBAC)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAdminPermission } from '@/lib/auth/rbac';

/**
 * POST /api/admin/integrations/webhooks/[id]/replay
 *
 * Replay a webhook by re-sending to the handler
 *
 * Authentication: Admin users with 'integrations:manage' permission
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // =========================================================================
    // Extract Params
    // =========================================================================
    const { id } = await context.params;

    // =========================================================================
    // Authentication & Authorization
    // =========================================================================
    const supabase = await createClient();

    // Get current user session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permission (requires manage permission for replay)
    const hasPermission = await checkAdminPermission(user.id, 'integrations:manage');
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden - insufficient permissions' },
        { status: 403 }
      );
    }

    // =========================================================================
    // Fetch Original Webhook Log
    // =========================================================================
    const { data: webhookLog, error: logError } = await supabase
      .from('integration_webhook_logs')
      .select(
        `
        id,
        integration_slug,
        event_type,
        payload,
        headers,
        status_code,
        error_message,
        retry_count,
        received_at
      `
      )
      .eq('id', id)
      .single();

    if (logError || !webhookLog) {
      return NextResponse.json({ error: 'Webhook log not found' }, { status: 404 });
    }

    // =========================================================================
    // Determine Webhook Handler URL
    // =========================================================================
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const webhookHandlers: Record<string, string> = {
      'didit-kyc': `${baseUrl}/api/webhooks/didit/kyc`,
      'netcash': `${baseUrl}/api/webhooks/netcash`,
      'zoho-sign': `${baseUrl}/api/webhooks/zoho/sign`,
      'zoho-crm': `${baseUrl}/api/webhooks/zoho/crm`,
      'zoho-billing': `${baseUrl}/api/webhooks/zoho/billing`,
    };

    const handlerUrl = webhookHandlers[webhookLog.integration_slug];
    if (!handlerUrl) {
      return NextResponse.json(
        {
          error: 'Webhook replay not supported for this integration',
          integrationSlug: webhookLog.integration_slug,
        },
        { status: 400 }
      );
    }

    // =========================================================================
    // Replay Webhook
    // =========================================================================
    const startTime = Date.now();
    let replayResult: {
      success: boolean;
      statusCode: number;
      errorMessage?: string;
      responseBody?: any;
    };

    try {
      // Add replay header to indicate this is a replay
      const replayHeaders = {
        ...((webhookLog.headers as Record<string, string>) || {}),
        'X-Webhook-Replay': 'true',
        'X-Replay-Original-ID': webhookLog.id,
        'X-Replay-Admin-ID': user.id,
        'Content-Type': 'application/json',
      };

      const response = await fetch(handlerUrl, {
        method: 'POST',
        headers: replayHeaders,
        body: JSON.stringify(webhookLog.payload),
      });

      const responseBody = await response.text();
      let parsedBody;
      try {
        parsedBody = JSON.parse(responseBody);
      } catch {
        parsedBody = responseBody;
      }

      replayResult = {
        success: response.ok,
        statusCode: response.status,
        responseBody: parsedBody,
        errorMessage: response.ok ? undefined : `HTTP ${response.status}: ${responseBody}`,
      };
    } catch (error) {
      replayResult = {
        success: false,
        statusCode: 500,
        errorMessage:
          error instanceof Error
            ? error.message
            : 'Failed to replay webhook - network error',
      };
    }

    const processingTime = Date.now() - startTime;

    // =========================================================================
    // Log Replay Activity
    // =========================================================================
    await supabase.from('integration_activity_log').insert({
      integration_slug: webhookLog.integration_slug,
      action_type: 'webhook_replay',
      action_description: `Webhook replayed: ${webhookLog.event_type} (original ID: ${id})`,
      action_result: replayResult.success ? 'success' : 'failed',
      metadata: {
        original_webhook_id: id,
        original_event_type: webhookLog.event_type,
        replay_status_code: replayResult.statusCode,
        replay_error: replayResult.errorMessage,
        replay_processing_time_ms: processingTime,
        replayed_by_admin_id: user.id,
      },
    });

    // =========================================================================
    // Create New Webhook Log Entry for Replay
    // =========================================================================
    const { data: newLog } = await supabase
      .from('integration_webhook_logs')
      .insert({
        integration_slug: webhookLog.integration_slug,
        event_type: `${webhookLog.event_type} (REPLAY)`,
        payload: webhookLog.payload,
        headers: {
          ...webhookLog.headers,
          'X-Webhook-Replay': 'true',
          'X-Replay-Original-ID': webhookLog.id,
        },
        status_code: replayResult.statusCode,
        error_message: replayResult.errorMessage,
        retry_count: webhookLog.retry_count + 1,
        received_at: new Date().toISOString(),
        processed_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    // =========================================================================
    // Return Response
    // =========================================================================
    return NextResponse.json({
      success: replayResult.success,
      originalWebhookId: id,
      newWebhookId: newLog?.id,
      result: {
        statusCode: replayResult.statusCode,
        errorMessage: replayResult.errorMessage,
        processingTimeMs: processingTime,
      },
      message: replayResult.success
        ? 'Webhook replayed successfully'
        : 'Webhook replay failed',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[WebhookReplayAPI] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
