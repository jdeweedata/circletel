/**
 * Integration Health Check Service
 *
 * Monitors the health of all third-party integrations by:
 * - Checking OAuth token validity and expiration
 * - Pinging API endpoints for reachability
 * - Analyzing webhook failure rates
 * - Updating integration health status in database
 *
 * Used by automated cron job (every 15 minutes) and manual health checks
 */

import { createClient } from '@/lib/supabase/server';
import { differenceInHours, differenceInMinutes } from 'date-fns';

export type HealthStatus = 'healthy' | 'degraded' | 'down' | 'unknown';

export interface HealthCheckResult {
  integrationSlug: string;
  integrationName: string;
  healthStatus: HealthStatus;
  responseTime: number; // milliseconds
  lastChecked: Date;
  checks: {
    oauth?: {
      valid: boolean;
      expiresIn: number; // hours
      lastRefreshed?: Date;
    };
    api?: {
      reachable: boolean;
      statusCode: number;
      responseTime: number; // milliseconds
    };
    webhook?: {
      recentFailureRate: number; // 0-1
      totalReceived: number;
      totalFailed: number;
    };
  };
  issues: string[];
}

export interface BatchHealthCheckResult {
  totalIntegrations: number;
  healthy: number;
  degraded: number;
  down: number;
  unknown: number;
  results: HealthCheckResult[];
  duration: number; // milliseconds
}

/**
 * Check health of a single integration
 */
export async function checkIntegrationHealth(
  integrationSlug: string
): Promise<HealthCheckResult> {
  const startTime = Date.now();
  const supabase = await createClient();

  // Get integration details
  const { data: integration, error: integrationError } = await supabase
    .from('integration_registry')
    .select('*')
    .eq('slug', integrationSlug)
    .single();

  if (integrationError || !integration) {
    throw new Error(`Integration not found: ${integrationSlug}`);
  }

  const checks: HealthCheckResult['checks'] = {};
  const issues: string[] = [];

  // Check 1: OAuth Token Health (if applicable)
  if (integration.integration_type === 'oauth') {
    const oauthCheck = await checkOAuthHealth(integrationSlug);
    checks.oauth = oauthCheck;

    if (!oauthCheck.valid) {
      issues.push('OAuth token expired or invalid');
    } else if (oauthCheck.expiresIn < 24) {
      issues.push(`OAuth token expiring soon (${oauthCheck.expiresIn}h remaining)`);
    }
  }

  // Check 2: API Reachability (if has_api_client flag or integration-specific ping)
  const apiCheck = await checkApiHealth(integrationSlug, integration.base_url);
  if (apiCheck) {
    checks.api = apiCheck;

    if (!apiCheck.reachable) {
      issues.push(`API unreachable (status: ${apiCheck.statusCode})`);
    } else if (apiCheck.responseTime > 5000) {
      issues.push(`API slow response (${apiCheck.responseTime}ms)`);
    }
  }

  // Check 3: Webhook Failure Rate (if has webhooks)
  const { data: webhooks } = await supabase
    .from('integration_webhooks')
    .select('id')
    .eq('integration_slug', integrationSlug);

  if (webhooks && webhooks.length > 0) {
    const webhookCheck = await checkWebhookHealth(integrationSlug);
    checks.webhook = webhookCheck;

    if (webhookCheck.recentFailureRate > 0.5) {
      issues.push(`High webhook failure rate (${(webhookCheck.recentFailureRate * 100).toFixed(1)}%)`);
    } else if (webhookCheck.recentFailureRate > 0.2) {
      issues.push(`Elevated webhook failure rate (${(webhookCheck.recentFailureRate * 100).toFixed(1)}%)`);
    }
  }

  // Determine overall health status
  const healthStatus = determineHealthStatus(checks, issues);

  // Update integration registry with health status
  await supabase
    .from('integration_registry')
    .update({
      health_status: healthStatus,
      last_health_check_at: new Date().toISOString(),
      avg_response_time_ms: checks.api?.responseTime,
      updated_at: new Date().toISOString(),
    })
    .eq('slug', integrationSlug);

  const responseTime = Date.now() - startTime;

  return {
    integrationSlug,
    integrationName: integration.name,
    healthStatus,
    responseTime,
    lastChecked: new Date(),
    checks,
    issues,
  };
}

/**
 * Check OAuth token health for an integration
 */
async function checkOAuthHealth(integrationSlug: string): Promise<{
  valid: boolean;
  expiresIn: number;
  lastRefreshed?: Date;
}> {
  const supabase = await createClient();

  const { data: token, error } = await supabase
    .from('integration_oauth_tokens')
    .select('expires_at, last_refreshed_at, access_token')
    .eq('integration_slug', integrationSlug)
    .eq('is_active', true)
    .single();

  if (error || !token) {
    return {
      valid: false,
      expiresIn: 0,
    };
  }

  // If no expiration date, assume refresh token (valid for ~6 months)
  if (!token.expires_at) {
    return {
      valid: true,
      expiresIn: 999999, // Essentially infinite for refresh tokens
      lastRefreshed: token.last_refreshed_at ? new Date(token.last_refreshed_at) : undefined,
    };
  }

  const expiresAt = new Date(token.expires_at);
  const now = new Date();
  const expiresIn = differenceInHours(expiresAt, now);

  return {
    valid: expiresIn > 0,
    expiresIn: Math.max(0, expiresIn),
    lastRefreshed: token.last_refreshed_at ? new Date(token.last_refreshed_at) : undefined,
  };
}

/**
 * Check API reachability for an integration
 */
async function checkApiHealth(
  integrationSlug: string,
  baseUrl: string | null
): Promise<{ reachable: boolean; statusCode: number; responseTime: number } | null> {
  // Integration-specific health check endpoints
  const healthEndpoints: Record<string, { url: string; headers?: Record<string, string> }> = {
    'zoho-crm': {
      url: 'https://www.zohoapis.com/crm/v2/settings/modules',
    },
    'zoho-billing': {
      url: 'https://www.zohoapis.com/billing/v1/plans',
    },
    'zoho-sign': {
      url: 'https://sign.zoho.com/api/v1/templates',
    },
    'netcash': {
      // NetCash doesn't have a public health endpoint, skip
      url: '',
    },
    'didit-kyc': {
      url: 'https://api.didit.me/health',
    },
    'clickatell': {
      url: 'https://platform.clickatell.com/v1/ping',
    },
    'resend': {
      url: 'https://api.resend.com/emails', // Will return 401 without key, but proves reachable
    },
    'mtn-coverage': {
      url: 'https://www.mtn.co.za',
    },
    'google-maps': {
      url: 'https://maps.googleapis.com/maps/api/staticmap?center=0,0&zoom=1&size=1x1', // Minimal request
    },
  };

  const endpoint = healthEndpoints[integrationSlug];
  if (!endpoint || !endpoint.url) {
    return null; // No health check endpoint configured
  }

  const startTime = Date.now();

  try {
    const response = await fetch(endpoint.url, {
      method: 'GET',
      headers: endpoint.headers || {},
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    const responseTime = Date.now() - startTime;

    // Consider 2xx, 401 (auth error), and 403 (forbidden) as "reachable"
    // We're just checking if the service is up, not if we have valid credentials
    const reachable = response.status < 500;

    return {
      reachable,
      statusCode: response.status,
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;

    return {
      reachable: false,
      statusCode: 0,
      responseTime,
    };
  }
}

/**
 * Check webhook health for an integration (failure rate in last 24 hours)
 */
async function checkWebhookHealth(integrationSlug: string): Promise<{
  recentFailureRate: number;
  totalReceived: number;
  totalFailed: number;
}> {
  const supabase = await createClient();

  // Get webhook logs from last 24 hours
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const { data: logs, error } = await supabase
    .from('integration_webhook_logs')
    .select('processing_status')
    .eq('integration_slug', integrationSlug)
    .gte('received_at', twentyFourHoursAgo.toISOString());

  if (error || !logs || logs.length === 0) {
    return {
      recentFailureRate: 0,
      totalReceived: 0,
      totalFailed: 0,
    };
  }

  const totalReceived = logs.length;
  const totalFailed = logs.filter((log) => log.processing_status === 'failed').length;
  const recentFailureRate = totalFailed / totalReceived;

  return {
    recentFailureRate,
    totalReceived,
    totalFailed,
  };
}

/**
 * Determine overall health status based on checks
 */
function determineHealthStatus(
  checks: HealthCheckResult['checks'],
  issues: string[]
): HealthStatus {
  // DOWN: Critical failures
  if (checks.oauth && !checks.oauth.valid) {
    return 'down'; // OAuth token expired
  }

  if (checks.api && !checks.api.reachable) {
    return 'down'; // API unreachable
  }

  // DEGRADED: Warning conditions
  if (checks.oauth && checks.oauth.expiresIn < 24) {
    return 'degraded'; // OAuth token expiring soon
  }

  if (checks.webhook && checks.webhook.recentFailureRate > 0.2) {
    return 'degraded'; // High webhook failure rate
  }

  if (checks.api && checks.api.responseTime > 5000) {
    return 'degraded'; // Slow API response
  }

  // HEALTHY: All checks pass
  if (checks.oauth || checks.api || checks.webhook) {
    return 'healthy';
  }

  // UNKNOWN: No checks performed
  return 'unknown';
}

/**
 * Check health of all active integrations
 */
export async function checkAllIntegrationsHealth(): Promise<BatchHealthCheckResult> {
  const startTime = Date.now();
  const supabase = await createClient();

  // Get all active integrations
  const { data: integrations, error } = await supabase
    .from('integration_registry')
    .select('slug')
    .eq('is_active', true)
    .eq('health_check_enabled', true);

  if (error || !integrations) {
    throw new Error('Failed to fetch integrations');
  }

  // Check each integration in parallel
  const results = await Promise.all(
    integrations.map((integration) => checkIntegrationHealth(integration.slug))
  );

  // Calculate summary stats
  const summary = results.reduce(
    (acc, result) => {
      acc[result.healthStatus]++;
      return acc;
    },
    { healthy: 0, degraded: 0, down: 0, unknown: 0 }
  );

  const duration = Date.now() - startTime;

  return {
    totalIntegrations: integrations.length,
    healthy: summary.healthy,
    degraded: summary.degraded,
    down: summary.down,
    unknown: summary.unknown,
    results,
    duration,
  };
}

/**
 * Get current health status for all integrations (from database, no checks performed)
 */
export async function getIntegrationsHealthStatus(): Promise<{
  integrations: Array<{
    slug: string;
    name: string;
    healthStatus: HealthStatus;
    lastChecked: Date | null;
  }>;
  summary: {
    healthy: number;
    degraded: number;
    down: number;
    unknown: number;
  };
}> {
  const supabase = await createClient();

  const { data: integrations, error } = await supabase
    .from('integration_registry')
    .select('slug, name, health_status, last_health_check_at')
    .eq('is_active', true)
    .order('slug');

  if (error || !integrations) {
    throw new Error('Failed to fetch integrations health status');
  }

  const summary = integrations.reduce(
    (acc, integration) => {
      const status = integration.health_status as HealthStatus;
      acc[status]++;
      return acc;
    },
    { healthy: 0, degraded: 0, down: 0, unknown: 0 }
  );

  return {
    integrations: integrations.map((i) => ({
      slug: i.slug,
      name: i.name,
      healthStatus: i.health_status as HealthStatus,
      lastChecked: i.last_health_check_at ? new Date(i.last_health_check_at) : null,
    })),
    summary,
  };
}
