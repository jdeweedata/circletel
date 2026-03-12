/**
 * Zoho Billing Health Check Endpoint
 * GET /api/admin/zoho/billing/health
 *
 * Verifies Zoho Billing integration is properly configured and working.
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { ZohoAPIClient } from '@/lib/zoho-api-client';

export const runtime = 'nodejs';
export const maxDuration = 30;

interface CheckResult {
  status: 'pass' | 'fail';
  message: string;
  duration_ms?: number;
}

interface ZohoBillingHealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    credentials: CheckResult;
    tokenRefresh: CheckResult;
    apiConnection: CheckResult;
  };
  stats: {
    plansCount: number;
    customersCount: number;
    activeSubscriptionsCount: number;
    pendingInvoicesCount: number;
  };
  details: {
    region: string;
    organizationId: string;
    scopes: string[];
    apiLatencyMs: number;
  };
}

export async function GET(request: NextRequest) {
  // Authenticate admin
  const authResult = await authenticateAdmin(request);
  if (!authResult.success) {
    return authResult.response;
  }

  const result: ZohoBillingHealthCheckResult = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      credentials: { status: 'fail', message: 'Not checked' },
      tokenRefresh: { status: 'fail', message: 'Not checked' },
      apiConnection: { status: 'fail', message: 'Not checked' },
    },
    stats: {
      plansCount: 0,
      customersCount: 0,
      activeSubscriptionsCount: 0,
      pendingInvoicesCount: 0,
    },
    details: {
      region: 'US',
      organizationId: '',
      scopes: [],
      apiLatencyMs: 0,
    },
  };

  // Check 1: Credentials configured
  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN;
  const orgId = process.env.ZOHO_ORG_ID;
  const region = process.env.ZOHO_REGION || 'US';

  if (!clientId || !clientSecret || !refreshToken || !orgId) {
    const missing = [];
    if (!clientId) missing.push('ZOHO_CLIENT_ID');
    if (!clientSecret) missing.push('ZOHO_CLIENT_SECRET');
    if (!refreshToken) missing.push('ZOHO_REFRESH_TOKEN');
    if (!orgId) missing.push('ZOHO_ORG_ID');

    result.checks.credentials = {
      status: 'fail',
      message: `Missing environment variables: ${missing.join(', ')}`,
    };
    result.status = 'unhealthy';

    return NextResponse.json(result, { status: 503 });
  }

  result.checks.credentials = {
    status: 'pass',
    message: 'All required credentials configured',
  };
  result.details.region = region;
  result.details.organizationId = orgId;

  // Check 2: Token refresh
  const tokenStartTime = Date.now();
  let accessToken: string;

  try {
    const zohoClient = new ZohoAPIClient({
      clientId,
      clientSecret,
      refreshToken,
      region: region as 'US' | 'EU' | 'IN' | 'AU' | 'CN',
    });

    // Get access token (this triggers a refresh)
    // @ts-ignore - accessing protected method for health check
    accessToken = await zohoClient.refreshAccessToken();

    result.checks.tokenRefresh = {
      status: 'pass',
      message: 'Successfully refreshed access token',
      duration_ms: Date.now() - tokenStartTime,
    };
  } catch (error) {
    result.checks.tokenRefresh = {
      status: 'fail',
      message: error instanceof Error ? error.message : 'Token refresh failed',
      duration_ms: Date.now() - tokenStartTime,
    };
    result.status = 'unhealthy';

    return NextResponse.json(result, { status: 503 });
  }

  // Check 3: API connection and gather stats
  const apiStartTime = Date.now();
  const billingBaseUrl = getBillingBaseUrl(region);

  try {
    // Fetch stats in parallel
    const [plansRes, customersRes, subscriptionsRes, invoicesRes] = await Promise.all([
      fetchBillingEndpoint(`${billingBaseUrl}/plans?organization_id=${orgId}&per_page=1`, accessToken),
      fetchBillingEndpoint(`${billingBaseUrl}/customers?organization_id=${orgId}&per_page=1`, accessToken),
      fetchBillingEndpoint(`${billingBaseUrl}/subscriptions?organization_id=${orgId}&status=live&per_page=1`, accessToken),
      fetchBillingEndpoint(`${billingBaseUrl}/invoices?organization_id=${orgId}&status=pending&per_page=1`, accessToken),
    ]);

    // Check if any request failed
    const errors = [plansRes, customersRes, subscriptionsRes, invoicesRes].filter(r => r.code !== 0);
    if (errors.length > 0) {
      result.checks.apiConnection = {
        status: 'fail',
        message: errors[0].message || `API error code: ${errors[0].code}`,
        duration_ms: Date.now() - apiStartTime,
      };
      result.status = 'degraded';
    } else {
      result.checks.apiConnection = {
        status: 'pass',
        message: 'Successfully connected to Zoho Billing API',
        duration_ms: Date.now() - apiStartTime,
      };

      // Extract counts from page_context
      result.stats.plansCount = plansRes.page_context?.total || 0;
      result.stats.customersCount = customersRes.page_context?.total || 0;
      result.stats.activeSubscriptionsCount = subscriptionsRes.page_context?.total || 0;
      result.stats.pendingInvoicesCount = invoicesRes.page_context?.total || 0;
    }

    result.details.apiLatencyMs = Date.now() - apiStartTime;
    result.details.scopes = [
      'ZohoCRM.modules.ALL',
      'ZohoCRM.settings.ALL',
      'ZohoSubscriptions.fullaccess.all',
      'ZohoSign.documents.ALL',
    ];
  } catch (error) {
    result.checks.apiConnection = {
      status: 'fail',
      message: error instanceof Error ? error.message : 'API connection failed',
      duration_ms: Date.now() - apiStartTime,
    };
    result.status = 'unhealthy';

    return NextResponse.json(result, { status: 503 });
  }

  // Determine overall status
  const allPassed = Object.values(result.checks).every(c => c.status === 'pass');
  const anyFailed = Object.values(result.checks).some(c => c.status === 'fail');

  if (allPassed) {
    result.status = 'healthy';
  } else if (anyFailed) {
    result.status = 'unhealthy';
  } else {
    result.status = 'degraded';
  }

  return NextResponse.json(result, {
    status: result.status === 'healthy' ? 200 : 503
  });
}

/**
 * Get Zoho Billing API base URL for region
 */
function getBillingBaseUrl(region: string): string {
  const regionMap: Record<string, string> = {
    US: 'https://www.zohoapis.com/billing/v1',
    EU: 'https://www.zohoapis.eu/billing/v1',
    IN: 'https://www.zohoapis.in/billing/v1',
    AU: 'https://www.zohoapis.com.au/billing/v1',
    CN: 'https://www.zohoapis.com.cn/billing/v1',
  };
  return regionMap[region] || regionMap.US;
}

/**
 * Fetch from Zoho Billing API endpoint
 */
async function fetchBillingEndpoint(url: string, accessToken: string): Promise<any> {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Zoho-oauthtoken ${accessToken}`,
      'Content-Type': 'application/json',
    },
    signal: AbortSignal.timeout(10000),
  });

  return response.json();
}
