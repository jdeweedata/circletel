/**
 * Integration Webhook Log Details API
 *
 * GET /api/admin/integrations/webhooks/[id]/logs
 *
 * Get detailed information about a specific webhook log entry
 *
 * Response:
 * - Full webhook log details including payload and headers
 * - Processing timeline
 * - Retry history
 * - Related integration information
 *
 * Authentication: Admin users only (RBAC)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAdminPermission } from '@/lib/auth/rbac';

/**
 * GET /api/admin/integrations/webhooks/[id]/logs
 *
 * Get detailed information about a specific webhook log
 *
 * Authentication: Admin users with 'integrations:view' permission
 */
export async function GET(
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

    // Check admin permission
    const hasPermission = await checkAdminPermission(user.id, 'integrations:view');
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden - insufficient permissions' },
        { status: 403 }
      );
    }

    // =========================================================================
    // Fetch Webhook Log Details
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
        received_at,
        processed_at
      `
      )
      .eq('id', id)
      .single();

    if (logError || !webhookLog) {
      return NextResponse.json({ error: 'Webhook log not found' }, { status: 404 });
    }

    // =========================================================================
    // Fetch Integration Details
    // =========================================================================
    const { data: integration } = await supabase
      .from('integration_registry')
      .select('id, name, slug, category')
      .eq('slug', webhookLog.integration_slug)
      .single();

    // =========================================================================
    // Calculate Processing Metrics
    // =========================================================================
    const receivedAt = new Date(webhookLog.received_at);
    const processedAt = webhookLog.processed_at ? new Date(webhookLog.processed_at) : null;
    const processingTimeMs = processedAt
      ? processedAt.getTime() - receivedAt.getTime()
      : null;

    // =========================================================================
    // Fetch Related Logs (same event type, same integration, within 1 hour)
    // =========================================================================
    const oneHourBefore = new Date(receivedAt.getTime() - 60 * 60 * 1000).toISOString();
    const oneHourAfter = new Date(receivedAt.getTime() + 60 * 60 * 1000).toISOString();

    const { data: relatedLogs } = await supabase
      .from('integration_webhook_logs')
      .select('id, event_type, status_code, received_at')
      .eq('integration_slug', webhookLog.integration_slug)
      .eq('event_type', webhookLog.event_type)
      .neq('id', id)
      .gte('received_at', oneHourBefore)
      .lte('received_at', oneHourAfter)
      .order('received_at', { ascending: false })
      .limit(10);

    // =========================================================================
    // Format Response
    // =========================================================================
    return NextResponse.json({
      webhookLog: {
        id: webhookLog.id,
        integrationSlug: webhookLog.integration_slug,
        integrationName: integration?.name || webhookLog.integration_slug,
        integrationCategory: integration?.category || null,
        eventType: webhookLog.event_type,
        payload: webhookLog.payload,
        headers: webhookLog.headers,
        statusCode: webhookLog.status_code,
        errorMessage: webhookLog.error_message,
        retryCount: webhookLog.retry_count,
        receivedAt: webhookLog.received_at,
        processedAt: webhookLog.processed_at,
        processingTimeMs,
        isSuccessful: webhookLog.status_code === 200,
        isFailed: webhookLog.status_code !== 200,
      },
      relatedLogs: (relatedLogs || []).map((log) => ({
        id: log.id,
        eventType: log.event_type,
        statusCode: log.status_code,
        receivedAt: log.received_at,
      })),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[WebhookLogDetailsAPI] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
