/**
 * Integration Logs API
 *
 * GET /api/admin/integrations/[slug]/logs
 *
 * Returns aggregated logs for a specific integration from multiple sources:
 * - integration_activity_log (admin actions)
 * - integration_webhook_logs (webhook events)
 * - zoho_sync_logs (for Zoho integrations)
 *
 * Query parameters:
 * - log_type: Filter by log type (all, activity, webhook, sync)
 * - status: Filter by status (success, failed, pending, etc.)
 * - date_from: Start date (ISO string)
 * - date_to: End date (ISO string)
 * - search: Search in messages/descriptions
 * - limit: Number of records (default: 50, max: 100)
 * - offset: Pagination offset (default: 0)
 *
 * @module app/api/admin/integrations/[slug]/logs
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClientWithSession, createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging';

interface UnifiedLog {
  id: string;
  log_type: 'activity' | 'webhook' | 'sync';
  event_type: string;
  status: 'success' | 'failed' | 'pending' | 'processing' | 'retry';
  message: string;
  details: Record<string, unknown> | null;
  user_email: string | null;
  ip_address: string | null;
  created_at: string;
  related_entity_type: string | null;
  related_entity_id: string | null;
}

/**
 * GET /api/admin/integrations/[slug]/logs
 *
 * Get aggregated logs for an integration
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;

    // Session client to read the authenticated user from cookies
    const supabaseSession = await createClientWithSession();

    // Verify admin authentication
    const { data: { user }, error: authError } = await supabaseSession.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Service-role client for privileged operations
    const supabase = await createClient();

    // Check if user is admin
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id, email, role')
      .eq('id', user.id)
      .eq('is_active', true)
      .single();

    if (!adminUser) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Verify integration exists
    const { data: integration, error: integrationError } = await supabase
      .from('integration_registry')
      .select('id, slug, name')
      .eq('slug', slug)
      .single();

    if (integrationError || !integration) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const logType = searchParams.get('log_type') || 'all';
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const search = searchParams.get('search');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const unifiedLogs: UnifiedLog[] = [];

    // Fetch activity logs
    if (logType === 'all' || logType === 'activity') {
      let activityQuery = supabase
        .from('integration_activity_log')
        .select('*')
        .eq('integration_slug', slug)
        .order('created_at', { ascending: false });

      if (dateFrom) {
        activityQuery = activityQuery.gte('created_at', dateFrom);
      }
      if (dateTo) {
        activityQuery = activityQuery.lte('created_at', dateTo);
      }
      if (status) {
        activityQuery = activityQuery.eq('action_result', status);
      }
      if (search) {
        activityQuery = activityQuery.or(`action_description.ilike.%${search}%,action_type.ilike.%${search}%`);
      }

      const { data: activityLogs } = await activityQuery.limit(limit);

      if (activityLogs) {
        for (const log of activityLogs) {
          unifiedLogs.push({
            id: log.id,
            log_type: 'activity',
            event_type: log.action_type,
            status: log.action_result === 'success' ? 'success' : log.action_result === 'failed' ? 'failed' : 'pending',
            message: log.action_description || formatActionType(log.action_type),
            details: {
              before_state: log.before_state,
              after_state: log.after_state,
              error_message: log.error_message,
            },
            user_email: log.performed_by_email,
            ip_address: log.ip_address,
            created_at: log.created_at,
            related_entity_type: log.related_entity_type,
            related_entity_id: log.related_entity_id,
          });
        }
      }
    }

    // Fetch webhook logs
    if (logType === 'all' || logType === 'webhook') {
      let webhookQuery = supabase
        .from('integration_webhook_logs')
        .select('*')
        .eq('integration_slug', slug)
        .order('received_at', { ascending: false });

      if (dateFrom) {
        webhookQuery = webhookQuery.gte('received_at', dateFrom);
      }
      if (dateTo) {
        webhookQuery = webhookQuery.lte('received_at', dateTo);
      }
      if (status) {
        const statusMap: Record<string, string> = {
          'success': 'completed',
          'failed': 'failed',
          'pending': 'processing',
        };
        webhookQuery = webhookQuery.eq('processing_status', statusMap[status] || status);
      }
      if (search) {
        webhookQuery = webhookQuery.or(`processing_error.ilike.%${search}%,idempotency_key.ilike.%${search}%`);
      }

      const { data: webhookLogs } = await webhookQuery.limit(limit);

      if (webhookLogs) {
        for (const log of webhookLogs) {
          const webhookStatus = log.processing_status === 'completed' ? 'success'
            : log.processing_status === 'failed' ? 'failed'
            : log.processing_status === 'retry' ? 'retry'
            : 'processing';

          unifiedLogs.push({
            id: log.id,
            log_type: 'webhook',
            event_type: `webhook_${log.http_method?.toLowerCase() || 'post'}`,
            status: webhookStatus,
            message: log.processing_error || `Webhook ${log.processing_status}`,
            details: {
              request_body: log.request_body,
              response_status: log.response_status,
              response_body: log.response_body,
              response_time_ms: log.response_time_ms,
              signature_valid: log.signature_valid,
              retry_count: log.retry_count,
            },
            user_email: null,
            ip_address: log.request_ip,
            created_at: log.received_at,
            related_entity_type: log.related_entity_type,
            related_entity_id: log.related_entity_id,
          });
        }
      }
    }

    // Fetch Zoho sync logs (for Zoho integrations)
    if ((logType === 'all' || logType === 'sync') && slug.startsWith('zoho')) {
      let syncQuery = supabase
        .from('zoho_sync_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (dateFrom) {
        syncQuery = syncQuery.gte('created_at', dateFrom);
      }
      if (dateTo) {
        syncQuery = syncQuery.lte('created_at', dateTo);
      }
      if (status) {
        syncQuery = syncQuery.eq('status', status);
      }
      if (search) {
        syncQuery = syncQuery.or(`error_message.ilike.%${search}%,entity_type.ilike.%${search}%`);
      }

      const { data: syncLogs } = await syncQuery.limit(limit);

      if (syncLogs) {
        for (const log of syncLogs) {
          const syncStatus = log.status === 'success' ? 'success'
            : log.status === 'failed' ? 'failed'
            : log.status === 'retrying' ? 'retry'
            : 'pending';

          unifiedLogs.push({
            id: log.id,
            log_type: 'sync',
            event_type: `sync_${log.entity_type}`,
            status: syncStatus,
            message: log.error_message || `${log.entity_type} sync ${log.status}`,
            details: {
              entity_type: log.entity_type,
              entity_id: log.entity_id,
              zoho_id: log.zoho_id,
              attempt_count: log.attempt_count,
              request_payload: log.request_payload,
              response_payload: log.response_payload,
            },
            user_email: null,
            ip_address: null,
            created_at: log.created_at,
            related_entity_type: log.entity_type,
            related_entity_id: log.entity_id,
          });
        }
      }
    }

    // Sort all logs by created_at descending
    unifiedLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Apply pagination to combined results
    const paginatedLogs = unifiedLogs.slice(offset, offset + limit);

    // Calculate stats
    const stats = {
      total: unifiedLogs.length,
      success: unifiedLogs.filter(l => l.status === 'success').length,
      failed: unifiedLogs.filter(l => l.status === 'failed').length,
      pending: unifiedLogs.filter(l => l.status === 'pending' || l.status === 'processing').length,
      by_type: {
        activity: unifiedLogs.filter(l => l.log_type === 'activity').length,
        webhook: unifiedLogs.filter(l => l.log_type === 'webhook').length,
        sync: unifiedLogs.filter(l => l.log_type === 'sync').length,
      },
    };

    return NextResponse.json({
      success: true,
      data: {
        integration: {
          slug: integration.slug,
          name: integration.name,
        },
        logs: paginatedLogs,
        stats,
        pagination: {
          total: unifiedLogs.length,
          limit,
          offset,
          has_more: unifiedLogs.length > (offset + limit),
        },
      },
    });

  } catch (error) {
    apiLogger.error('Integration logs API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * Format action type to human-readable text
 */
function formatActionType(actionType: string): string {
  const actionMap: Record<string, string> = {
    'oauth_token_refreshed': 'OAuth token was refreshed',
    'oauth_token_revoked': 'OAuth token was revoked',
    'webhook_enabled': 'Webhook was enabled',
    'webhook_disabled': 'Webhook was disabled',
    'webhook_tested': 'Webhook test was performed',
    'health_check_run': 'Health check was executed',
    'integration_enabled': 'Integration was enabled',
    'integration_disabled': 'Integration was disabled',
    'configuration_updated': 'Configuration was updated',
    'manual_sync_triggered': 'Manual sync was triggered',
    'cron_job_triggered': 'Scheduled job was triggered',
  };

  return actionMap[actionType] || actionType.replace(/_/g, ' ');
}
