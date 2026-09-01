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

  // Determine overall health status.
  //
  // Prefer PASSIVE health derived from real recorded traffic — what customers
  // actually experienced beats a synthetic ping. Fall back to the probe-based
  // verdict when the window is too thin to judge.
  const passive = await derivePassiveHealth(integrationSlug);
  const healthStatus = passive ? passive.status : determineHealthStatus(checks, issues);
  const healthSource: HealthSource = passive
    ? 'traffic'
    : checks.api || checks.oauth || checks.webhook
      ? 'probe'
      : 'none';

  if (passive) {
    issues.push(
      `Derived from ${passive.totalCalls} recorded calls in the last ${PASSIVE_WINDOW_MINUTES}min ` +
        `(${passive.successRate.toFixed(1)}% success, p95 ${passive.p95Ms}ms)`
    );
  }

  // Update integration registry with health status
  await supabase
    .from('integration_registry')
    .update({
      health_status: healthStatus,
      health_source: healthSource,
      last_health_check_at: new Date().toISOString(),
      avg_response_time_ms: passive ? passive.avgMs : checks.api?.responseTime,
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
    // mtn-coverage and dfa are handled above by probes that assert the service
    // actually served a result, not merely that some HTTP endpoint answered.
    // The old 'https://www.mtn.co.za' entry proved a marketing site renders.
    'google-maps': {
      url: 'https://maps.googleapis.com/maps/api/staticmap?center=0,0&zoom=1&size=1x1', // Minimal request
    },
  };

  // Providers whose liveness cannot be judged by "did an HTTP request return".
  // These own their assertion because a 200 does not mean the service worked.
  if (integrationSlug === 'dfa') {
    const { DFACoverageClient } = await import('@/lib/coverage/providers/dfa/dfa-coverage-client');
    const result = await new DFACoverageClient().checkHealth();
    return {
      reachable: result.healthy,
      statusCode: result.healthy ? 200 : 0,
      responseTime: result.responseTime,
    };
  }

  if (integrationSlug === 'mtn-coverage') {
    return await probeMtnWmsLayer();
  }

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
 * Real MTN WMS liveness probe.
 *
 * Replaces `fetch('https://www.mtn.co.za')`, which proved only that MTN's
 * marketing site renders — it returned 200 while the coverage layer was failing,
 * which is why mtn-coverage read `healthy` throughout.
 *
 * Healthy = HTTP 200 AND a parseable GetFeatureInfo body. Deliberately does NOT
 * require features.length > 0: an empty feature list is a valid "no coverage
 * here" answer, and requiring coverage would make the probe depend on the
 * coordinate still being served.
 *
 * ⚠️ PROBE_COORDINATE is Johannesburg CBD, taken from lib/coverage/mtn/test-data.ts
 * where it is MOCK fixture data that has never been validated against live MTN.
 * It is used here only for a bounding box, and the assertion does not depend on
 * it having coverage — but if this probe proves flaky, validating the coordinate
 * is the first thing to check.
 */
const PROBE_COORDINATE = { lat: -26.2041, lng: 28.0473 };
const MTN_WMS_PROBE_URL = 'https://mtnsi.mtn.co.za/cache/geoserver/wms';
const MTN_PROBE_LAYER = 'mtnsi:MTNSA-Coverage-LTE';

async function probeMtnWmsLayer(): Promise<{
  reachable: boolean;
  statusCode: number;
  responseTime: number;
}> {
  const startTime = Date.now();
  const d = 0.0005; // ~100m box around the coordinate
  const { lat, lng } = PROBE_COORDINATE;

  const params = new URLSearchParams({
    SERVICE: 'WMS',
    VERSION: '1.3.0',
    REQUEST: 'GetFeatureInfo',
    LAYERS: MTN_PROBE_LAYER,
    QUERY_LAYERS: MTN_PROBE_LAYER,
    INFO_FORMAT: 'application/json',
    FEATURE_COUNT: '10',
    CRS: 'CRS:84',
    BBOX: `${lng - d},${lat - d},${lng + d},${lat + d}`,
    WIDTH: '256',
    HEIGHT: '256',
    I: '128',
    J: '128',
  });

  try {
    const response = await fetch(`${MTN_WMS_PROBE_URL}?${params.toString()}`, {
      // Anti-bot headers are mandatory — see .claude/rules/coding-standards.md
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Referer: 'https://www.mtn.co.za/',
        Origin: 'https://www.mtn.co.za',
      },
      signal: AbortSignal.timeout(10000),
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      return { reachable: false, statusCode: response.status, responseTime };
    }

    // A 200 carrying an unparseable body means the layer is not actually serving.
    const body = await response.json().catch(() => null);
    const servedFeatureInfo = body !== null && Array.isArray((body as { features?: unknown }).features);

    return {
      reachable: servedFeatureInfo,
      statusCode: response.status,
      responseTime,
    };
  } catch {
    return { reachable: false, statusCode: 0, responseTime: Date.now() - startTime };
  }
}

/**
 * Passive health thresholds.
 *
 * Tighter than the retired MTNCoverageMonitor's 85% because these are REAL
 * customer checks: at CircleTel's volume, one in twenty coverage checks failing
 * is already customer-visible.
 */
const PASSIVE_WINDOW_MINUTES = 60;
const PASSIVE_MIN_CALLS = 5;      // below this a single failure swings the rate wildly
const PASSIVE_HEALTHY_RATE = 95;  // % success
const PASSIVE_DEGRADED_RATE = 80; // % success; below this is `down`
const PASSIVE_P95_DEGRADED_MS = 10_000;

export type HealthSource = 'traffic' | 'probe' | 'none';

/**
 * Derive health from recorded provider calls, or null when there isn't enough
 * traffic in the window to judge (caller then falls back to the synthetic probe).
 *
 * Reads `provider_api_calls` directly rather than the hourly rollup: the rollup
 * runs at :05 and this runs at :00/:30, so rollup-derived health would be up to
 * an hour stale — the exact staleness this whole effort exists to remove.
 */
async function derivePassiveHealth(integrationSlug: string): Promise<{
  status: HealthStatus;
  totalCalls: number;
  successRate: number;
  avgMs: number;
  p95Ms: number;
} | null> {
  const supabase = await createClient();
  const since = new Date(Date.now() - PASSIVE_WINDOW_MINUTES * 60_000).toISOString();

  const { data, error } = await supabase
    .from('provider_api_calls')
    .select('success, duration_ms')
    .eq('integration_slug', integrationSlug)
    .gte('created_at', since);

  if (error || !data || data.length < PASSIVE_MIN_CALLS) return null;

  const totalCalls = data.length;
  const successes = data.filter((r) => r.success).length;
  const successRate = (successes / totalCalls) * 100;

  const durations = data.map((r) => r.duration_ms).sort((a, b) => a - b);
  const avgMs = Math.round(durations.reduce((s, d) => s + d, 0) / totalCalls);
  const p95Ms = durations[Math.min(durations.length - 1, Math.ceil(0.95 * durations.length) - 1)];

  let status: HealthStatus;
  if (successRate < PASSIVE_DEGRADED_RATE) {
    status = 'down';
  } else if (successRate < PASSIVE_HEALTHY_RATE) {
    status = 'degraded';
  } else {
    status = 'healthy';
  }

  // Slow but succeeding is degraded, never healthy.
  if (status === 'healthy' && p95Ms > PASSIVE_P95_DEGRADED_MS) {
    status = 'degraded';
  }

  return { status, totalCalls, successRate, avgMs, p95Ms };
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
