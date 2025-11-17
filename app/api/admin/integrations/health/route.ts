/**
 * Integration Health Overview API
 *
 * GET /api/admin/integrations/health
 *
 * Returns health status overview for all integrations
 *
 * Response:
 * - Summary counts (healthy, degraded, down, unknown)
 * - List of all integrations with current health status
 * - Recent health check timestamp
 * - Alerts summary (active, suppressed)
 *
 * Authentication: Admin users only (RBAC)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSSRClient } from '@/integrations/supabase/server';

/**
 * GET /api/admin/integrations/health
 *
 * Get health status overview for all integrations
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
    // Fetch All Integrations with Health Status
    // =========================================================================
    const { data: integrations, error: integrationsError } = await supabase
      .from('integration_registry')
      .select(
        `
        id,
        slug,
        name,
        category,
        health_status,
        health_last_checked_at,
        consecutive_failures,
        last_alert_sent_at,
        health_check_enabled,
        is_active,
        updated_at
      `
      )
      .order('name', { ascending: true });

    if (integrationsError) {
      console.error('[HealthAPI] Error fetching integrations:', integrationsError);
      return NextResponse.json(
        { error: 'Failed to fetch integrations' },
        { status: 500 }
      );
    }

    // =========================================================================
    // Calculate Summary Statistics
    // =========================================================================
    const summary = {
      total: integrations.length,
      healthy: 0,
      degraded: 0,
      down: 0,
      unknown: 0,
      activeAlerts: 0,
      suppressedAlerts: 0,
      healthCheckEnabled: 0,
      lastCheckAt: null as string | null,
    };

    for (const integration of integrations) {
      // Count by health status
      switch (integration.health_status) {
        case 'healthy':
          summary.healthy++;
          break;
        case 'degraded':
          summary.degraded++;
          break;
        case 'down':
          summary.down++;
          break;
        default:
          summary.unknown++;
      }

      // Count health check enabled
      if (integration.health_check_enabled) {
        summary.healthCheckEnabled++;
      }

      // Count active alerts (3+ consecutive failures)
      if (integration.consecutive_failures >= 3) {
        summary.activeAlerts++;
      }

      // Count suppressed alerts (has last_alert_sent_at)
      if (integration.last_alert_sent_at) {
        summary.suppressedAlerts++;
      }

      // Track most recent health check
      if (integration.health_last_checked_at) {
        if (
          !summary.lastCheckAt ||
          new Date(integration.health_last_checked_at) > new Date(summary.lastCheckAt)
        ) {
          summary.lastCheckAt = integration.health_last_checked_at;
        }
      }
    }

    // =========================================================================
    // Format Integration Data
    // =========================================================================
    const formattedIntegrations = integrations.map((integration) => ({
      id: integration.id,
      slug: integration.slug,
      name: integration.name,
      category: integration.category,
      healthStatus: integration.health_status,
      healthLastCheckedAt: integration.health_last_checked_at,
      consecutiveFailures: integration.consecutive_failures,
      lastAlertSentAt: integration.last_alert_sent_at,
      healthCheckEnabled: integration.health_check_enabled,
      isActive: integration.is_active,
      hasActiveAlert: integration.consecutive_failures >= 3,
      updatedAt: integration.updated_at,
    }));

    // =========================================================================
    // Group by Category
    // =========================================================================
    const byCategory = formattedIntegrations.reduce(
      (acc, integration) => {
        const category = integration.category;
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(integration);
        return acc;
      },
      {} as Record<string, typeof formattedIntegrations>
    );

    // =========================================================================
    // Return Response
    // =========================================================================
    return NextResponse.json({
      summary,
      integrations: formattedIntegrations,
      byCategory,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[HealthAPI] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
