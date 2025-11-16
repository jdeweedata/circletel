/**
 * API Route: /api/admin/integrations/[slug]
 *
 * GET: Get detailed integration information
 * PATCH: Update integration settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServerClient } from '@supabase/ssr';
import { checkIntegrationHealth } from '@/lib/integrations/health-check-service';

/**
 * GET /api/admin/integrations/[slug]
 *
 * Get detailed integration information including:
 * - Basic info
 * - OAuth tokens (if applicable)
 * - Webhooks (if applicable)
 * - Recent metrics
 * - Cron jobs (if applicable)
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;

    // Create TWO clients:
    // 1. SSR client for authentication (reads cookies)
    const supabaseSSR = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {
            // No-op for GET requests
          },
        },
      }
    );

    // 2. Service role client for database queries (bypasses RLS)
    const supabaseAdmin = await createClient();

    // Check authentication using SSR client
    const {
      data: { user },
      error: authError,
    } = await supabaseSSR.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin user using service role client (bypasses RLS)
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('id, is_active')
      .eq('id', user.id)
      .eq('is_active', true)
      .single();

    if (adminError || !adminUser) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get integration details
    const { data: integration, error: integrationError } = await supabaseAdmin
      .from('integration_registry')
      .select('*')
      .eq('slug', slug)
      .single();

    if (integrationError || !integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    // Get OAuth tokens (if applicable)
    let oauthTokens = null;
    if (integration.integration_type === 'oauth') {
      const { data: tokens } = await supabaseAdmin
        .from('integration_oauth_tokens')
        .select('id, expires_at, last_refreshed_at, refresh_count, is_active, scopes')
        .eq('integration_slug', slug)
        .eq('is_active', true)
        .single();

      if (tokens) {
        oauthTokens = {
          hasAccessToken: true,
          hasRefreshToken: true,
          expiresAt: tokens.expires_at,
          lastRefreshedAt: tokens.last_refreshed_at,
          refreshCount: tokens.refresh_count,
          scopes: tokens.scopes,
        };
      }
    }

    // Get webhooks (if applicable)
    const { data: webhooks } = await supabaseAdmin
      .from('integration_webhooks')
      .select('*')
      .eq('integration_slug', slug);

    // Get recent API metrics (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const { data: metrics } = await supabaseAdmin
      .from('integration_api_metrics')
      .select('*')
      .eq('integration_slug', slug)
      .gte('metric_date', sevenDaysAgo.toISOString().split('T')[0])
      .order('metric_date', { ascending: false })
      .limit(7);

    // Calculate recent metrics summary
    const recentMetrics = metrics?.reduce(
      (acc, metric) => {
        acc.totalRequests += metric.total_requests || 0;
        acc.successfulRequests += metric.successful_requests || 0;
        acc.failedRequests += metric.failed_requests || 0;
        acc.totalResponseTime += (metric.avg_response_time_ms || 0) * (metric.total_requests || 0);
        return acc;
      },
      { totalRequests: 0, successfulRequests: 0, failedRequests: 0, totalResponseTime: 0 }
    );

    const metricsCalculated = recentMetrics
      ? {
          avgResponseTime:
            recentMetrics.totalRequests > 0
              ? Math.round(recentMetrics.totalResponseTime / recentMetrics.totalRequests)
              : 0,
          errorRate:
            recentMetrics.totalRequests > 0
              ? recentMetrics.failedRequests / recentMetrics.totalRequests
              : 0,
          uptime:
            recentMetrics.totalRequests > 0
              ? recentMetrics.successfulRequests / recentMetrics.totalRequests
              : 1,
        }
      : { avgResponseTime: 0, errorRate: 0, uptime: 1 };

    // Get cron jobs (if applicable)
    const { data: cronJobs } = await supabaseAdmin
      .from('integration_cron_jobs')
      .select('*')
      .eq('integration_slug', slug);

    // Get recent activity logs (last 20)
    const { data: activityLogs } = await supabaseAdmin
      .from('integration_activity_log')
      .select('*')
      .eq('integration_slug', slug)
      .order('created_at', { ascending: false })
      .limit(20);

    return NextResponse.json({
      integration,
      oauthTokens,
      webhooks: webhooks || [],
      recentMetrics: metricsCalculated,
      cronJobs: cronJobs || [],
      activityLogs: activityLogs || [],
    });
  } catch (error) {
    console.error('[Integration Detail API] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/integrations/[slug]
 *
 * Update integration settings
 *
 * Request Body:
 * {
 *   is_active?: boolean;
 *   health_check_enabled?: boolean;
 *   description?: string;
 * }
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;

    // Create TWO clients:
    // 1. SSR client for authentication (reads cookies)
    const supabaseSSR = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {
            // No-op for PATCH requests
          },
        },
      }
    );

    // 2. Service role client for database queries (bypasses RLS)
    const supabaseAdmin = await createClient();

    // Check authentication using SSR client
    const {
      data: { user },
      error: authError,
    } = await supabaseSSR.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin user using service role client (bypasses RLS)
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('id, is_active')
      .eq('id', user.id)
      .eq('is_active', true)
      .single();

    if (adminError || !adminUser) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { is_active, health_check_enabled, description } = body;

    // Build update object
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    };

    if (typeof is_active === 'boolean') {
      updateData.is_active = is_active;
    }

    if (typeof health_check_enabled === 'boolean') {
      updateData.health_check_enabled = health_check_enabled;
    }

    if (description !== undefined) {
      updateData.description = description;
    }

    // Update integration
    const { data: updatedIntegration, error: updateError } = await supabaseAdmin
      .from('integration_registry')
      .update(updateData)
      .eq('slug', slug)
      .select()
      .single();

    if (updateError) {
      console.error('[Integration Update API] Failed to update integration:', updateError);
      return NextResponse.json({ error: 'Failed to update integration' }, { status: 500 });
    }

    // Log activity
    await supabaseAdmin.from('integration_activity_log').insert({
      integration_slug: slug,
      action_type: 'configuration_updated',
      action_description: `Integration settings updated`,
      performed_by: user.id,
      performed_by_email: user.email,
      action_result: 'success',
      after_state: updateData,
    });

    return NextResponse.json({ integration: updatedIntegration });
  } catch (error) {
    console.error('[Integration Update API] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
