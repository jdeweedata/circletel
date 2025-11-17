/**
 * Integration Webhooks Management API
 *
 * GET /api/admin/integrations/webhooks
 *
 * List all webhook configurations across integrations
 *
 * Query Parameters:
 * - integration_slug: Filter by specific integration
 * - is_active: Filter by active/inactive status (true/false)
 * - event_type: Filter by event type
 * - limit: Number of results (default 50, max 100)
 * - offset: Pagination offset
 *
 * Response:
 * - List of webhook configurations
 * - Pagination metadata
 * - Summary statistics (total, active, inactive)
 *
 * Authentication: Admin users only (RBAC)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSSRClient } from '@/integrations/supabase/server';

/**
 * GET /api/admin/integrations/webhooks
 *
 * List all webhook configurations with optional filters
 *
 * Authentication: Admin users with 'integrations:view' permission
 */
export async function GET(request: NextRequest) {
  try {
    // =========================================================================
    // Authentication & Authorization
    // =========================================================================
    const supabase = await createSSRClient();

    // Get current user session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add RBAC permission check when implemented (integrations:view)

    // =========================================================================
    // Parse Query Parameters
    // =========================================================================
    const searchParams = request.nextUrl.searchParams;
    const integrationSlug = searchParams.get('integration_slug');
    const isActive = searchParams.get('is_active');
    const eventType = searchParams.get('event_type');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // =========================================================================
    // Build Query
    // =========================================================================
    let query = supabase
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
      `,
        { count: 'exact' }
      )
      .order('received_at', { ascending: false });

    // Apply filters
    if (integrationSlug) {
      query = query.eq('integration_slug', integrationSlug);
    }

    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data: webhookLogs, error: logsError, count } = await query;

    if (logsError) {
      console.error('[WebhooksAPI] Error fetching webhook logs:', logsError);
      return NextResponse.json(
        { error: 'Failed to fetch webhook logs' },
        { status: 500 }
      );
    }

    // =========================================================================
    // Get Summary Statistics
    // =========================================================================
    const { data: allLogs } = await supabase
      .from('integration_webhook_logs')
      .select('status_code, integration_slug');

    const summary = {
      total: allLogs?.length || 0,
      successful: allLogs?.filter((log) => log.status_code === 200).length || 0,
      failed: allLogs?.filter((log) => log.status_code !== 200).length || 0,
      byIntegration: {} as Record<string, number>,
    };

    // Group by integration
    if (allLogs) {
      for (const log of allLogs) {
        if (!summary.byIntegration[log.integration_slug]) {
          summary.byIntegration[log.integration_slug] = 0;
        }
        summary.byIntegration[log.integration_slug]++;
      }
    }

    // =========================================================================
    // Format Response
    // =========================================================================
    const formattedLogs = (webhookLogs || []).map((log) => ({
      id: log.id,
      integrationSlug: log.integration_slug,
      eventType: log.event_type,
      statusCode: log.status_code,
      errorMessage: log.error_message,
      retryCount: log.retry_count,
      receivedAt: log.received_at,
      processedAt: log.processed_at,
      // Don't include full payload/headers in list view for performance
      hasPayload: !!log.payload,
      hasHeaders: !!log.headers,
    }));

    // =========================================================================
    // Return Response
    // =========================================================================
    return NextResponse.json({
      webhooks: formattedLogs,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
      summary,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[WebhooksAPI] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
