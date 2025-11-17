/**
 * Integration Detailed Health Metrics API
 *
 * GET /api/admin/integrations/health/[slug]
 *
 * Returns detailed health metrics for a specific integration
 *
 * Response:
 * - Current health status and consecutive failures
 * - 24-hour health check history (48 checks at 30-min intervals)
 * - 7-day trend data (daily aggregates)
 * - Recent webhook failures (last 24 hours)
 * - OAuth token status and expiration
 * - Recent activity logs (last 50 events)
 *
 * Authentication: Admin users only (RBAC)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSSRClient } from '@/integrations/supabase/server';
import { subHours, subDays, startOfDay, endOfDay } from 'date-fns';

/**
 * GET /api/admin/integrations/health/[slug]
 *
 * Get detailed health metrics for a specific integration
 *
 * Authentication: Admin users with 'integrations:view' permission
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    // =========================================================================
    // Extract Params
    // =========================================================================
    const { slug } = await context.params;

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
    // Fetch Integration Details
    // =========================================================================
    const { data: integration, error: integrationError } = await supabase
      .from('integration_registry')
      .select(
        `
        id,
        slug,
        name,
        integration_type,
        description,
        health_status,
        last_health_check_at,
        consecutive_failures,
        last_alert_sent_at,
        health_check_enabled,
        is_active,
        base_url,
        documentation_url,
        icon_url,
        uptime_percentage,
        avg_response_time_ms,
        total_requests_30d,
        failed_requests_30d,
        is_production_ready,
        created_at,
        updated_at
      `
      )
      .eq('slug', slug)
      .single();

    if (integrationError || !integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    // =========================================================================
    // Fetch OAuth Token Status (if applicable)
    // =========================================================================
    let oauthStatus = null;
    if (integration.requires_oauth) {
      const { data: oauthTokens } = await supabase
        .from('integration_oauth_tokens')
        .select('id, expires_at, created_at, updated_at')
        .eq('integration_slug', slug)
        .order('created_at', { ascending: false })
        .limit(1);

      if (oauthTokens && oauthTokens.length > 0) {
        const token = oauthTokens[0];
        const now = new Date();
        const expiresAt = token.expires_at ? new Date(token.expires_at) : null;

        oauthStatus = {
          hasToken: true,
          expiresAt: token.expires_at,
          isExpired: expiresAt ? expiresAt < now : false,
          createdAt: token.created_at,
          updatedAt: token.updated_at,
        };
      } else {
        oauthStatus = {
          hasToken: false,
          expiresAt: null,
          isExpired: null,
          createdAt: null,
          updatedAt: null,
        };
      }
    }

    // =========================================================================
    // Fetch 24-Hour Health Check History
    // =========================================================================
    const twentyFourHoursAgo = subHours(new Date(), 24).toISOString();

    const { data: healthChecks24h } = await supabase
      .from('integration_activity_log')
      .select('action_type, action_result, metadata, created_at')
      .eq('integration_slug', slug)
      .eq('action_type', 'health_check')
      .gte('created_at', twentyFourHoursAgo)
      .order('created_at', { ascending: true });

    // Format 24-hour history
    const healthHistory24h = (healthChecks24h || []).map((check) => ({
      timestamp: check.created_at,
      status: check.metadata?.health_status || check.action_result,
      duration: check.metadata?.duration || null,
      issues: check.metadata?.issues || [],
    }));

    // =========================================================================
    // Fetch 7-Day Trend Data (Daily Aggregates)
    // =========================================================================
    const sevenDaysAgo = subDays(new Date(), 7);
    const { data: healthChecks7d } = await supabase
      .from('integration_activity_log')
      .select('action_result, metadata, created_at')
      .eq('integration_slug', slug)
      .eq('action_type', 'health_check')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    // Aggregate by day
    const dailyTrend: Record<
      string,
      { date: string; healthy: number; degraded: number; down: number; total: number }
    > = {};

    for (const check of healthChecks7d || []) {
      const date = startOfDay(new Date(check.created_at)).toISOString().split('T')[0];
      if (!dailyTrend[date]) {
        dailyTrend[date] = { date, healthy: 0, degraded: 0, down: 0, total: 0 };
      }

      const status = check.metadata?.health_status || check.action_result;
      dailyTrend[date].total++;

      if (status === 'healthy') {
        dailyTrend[date].healthy++;
      } else if (status === 'degraded') {
        dailyTrend[date].degraded++;
      } else if (status === 'down') {
        dailyTrend[date].down++;
      }
    }

    const trend7d = Object.values(dailyTrend).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    // =========================================================================
    // Fetch Recent Webhook Failures (Last 24 Hours, if applicable)
    // =========================================================================
    let webhookFailures = null;
    if (integration.supports_webhooks) {
      const { data: failedWebhooks } = await supabase
        .from('integration_webhook_logs')
        .select('id, event_type, status_code, error_message, received_at')
        .eq('integration_slug', slug)
        .gte('received_at', twentyFourHoursAgo)
        .neq('status_code', 200)
        .order('received_at', { ascending: false })
        .limit(20);

      webhookFailures = {
        total: failedWebhooks?.length || 0,
        failures: (failedWebhooks || []).map((webhook) => ({
          id: webhook.id,
          eventType: webhook.event_type,
          statusCode: webhook.status_code,
          errorMessage: webhook.error_message,
          receivedAt: webhook.received_at,
        })),
      };
    }

    // =========================================================================
    // Fetch Recent Activity Logs (Last 50 Events)
    // =========================================================================
    const { data: activityLogs } = await supabase
      .from('integration_activity_log')
      .select('id, action_type, action_description, action_result, created_at')
      .eq('integration_slug', slug)
      .order('created_at', { ascending: false })
      .limit(50);

    const recentActivity = (activityLogs || []).map((log) => ({
      id: log.id,
      actionType: log.action_type,
      description: log.action_description,
      result: log.action_result,
      timestamp: log.created_at,
    }));

    // =========================================================================
    // Calculate Uptime Percentage (Last 24 Hours)
    // =========================================================================
    const totalChecks24h = healthHistory24h.length;
    const healthyChecks24h = healthHistory24h.filter(
      (check) => check.status === 'healthy'
    ).length;
    const uptimePercentage24h =
      totalChecks24h > 0 ? (healthyChecks24h / totalChecks24h) * 100 : null;

    // Calculate Uptime Percentage (Last 7 Days)
    const totalChecks7d = (healthChecks7d || []).length;
    const healthyChecks7d = (healthChecks7d || []).filter(
      (check) =>
        check.metadata?.health_status === 'healthy' || check.action_result === 'healthy'
    ).length;
    const uptimePercentage7d =
      totalChecks7d > 0 ? (healthyChecks7d / totalChecks7d) * 100 : null;

    // =========================================================================
    // Return Response
    // =========================================================================
    return NextResponse.json({
      integration: {
        id: integration.id,
        slug: integration.slug,
        name: integration.name,
        category: integration.integration_type, // Map integration_type to category for frontend
        description: integration.description,
        healthStatus: integration.health_status,
        healthLastCheckedAt: integration.last_health_check_at,
        consecutiveFailures: integration.consecutive_failures,
        lastAlertSentAt: integration.last_alert_sent_at,
        healthCheckEnabled: integration.health_check_enabled,
        isActive: integration.is_active,
        baseUrl: integration.base_url,
        documentationUrl: integration.documentation_url,
        iconUrl: integration.icon_url,
        uptimePercentage: integration.uptime_percentage,
        avgResponseTimeMs: integration.avg_response_time_ms,
        totalRequests30d: integration.total_requests_30d,
        failedRequests30d: integration.failed_requests_30d,
        isProductionReady: integration.is_production_ready,
        requiresOauth: integration.integration_type === 'oauth', // Inferred from type
        supportsWebhooks: integration.integration_type !== 'api_key', // Inferred from type
        createdAt: integration.created_at,
        updatedAt: integration.updated_at,
      },
      oauthStatus,
      metrics: {
        uptime24h: uptimePercentage24h,
        uptime7d: uptimePercentage7d,
        totalChecks24h,
        totalChecks7d,
      },
      healthHistory24h,
      trend7d,
      webhookFailures,
      recentActivity,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[HealthDetailAPI] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
