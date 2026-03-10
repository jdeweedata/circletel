/**
 * Zoho Sign Health Check Endpoint
 * GET /api/admin/zoho/sign/health
 *
 * Verifies Zoho Sign integration is properly configured and working.
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { ZohoAPIClient } from '@/lib/zoho-api-client';

export const runtime = 'nodejs';
export const maxDuration = 30;

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    credentials: CheckResult;
    tokenRefresh: CheckResult;
    apiConnection: CheckResult;
  };
  details?: {
    region: string;
    scopes?: string[];
    requestCount?: number;
  };
}

interface CheckResult {
  status: 'pass' | 'fail';
  message: string;
  duration_ms?: number;
}

export async function GET(request: NextRequest) {
  // Authenticate admin
  const authResult = await authenticateAdmin(request);
  if (!authResult.success) {
    return authResult.response;
  }

  const result: HealthCheckResult = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      credentials: { status: 'fail', message: 'Not checked' },
      tokenRefresh: { status: 'fail', message: 'Not checked' },
      apiConnection: { status: 'fail', message: 'Not checked' },
    },
  };

  // Check 1: Credentials configured
  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN;
  const region = process.env.ZOHO_REGION || 'US';

  if (!clientId || !clientSecret || !refreshToken) {
    const missing = [];
    if (!clientId) missing.push('ZOHO_CLIENT_ID');
    if (!clientSecret) missing.push('ZOHO_CLIENT_SECRET');
    if (!refreshToken) missing.push('ZOHO_REFRESH_TOKEN');

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
  result.details = { region };

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

  // Check 3: API connection - list recent requests
  const apiStartTime = Date.now();

  try {
    const response = await fetch('https://sign.zoho.com/api/v1/requests?data={"page_context":{"row_count":1,"start_index":0}}', {
      method: 'GET',
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });

    const data = await response.json();

    if (data.code === 0) {
      const requestCount = data.page_context?.total_count || 0;

      result.checks.apiConnection = {
        status: 'pass',
        message: 'Successfully connected to Zoho Sign API',
        duration_ms: Date.now() - apiStartTime,
      };
      result.details!.requestCount = requestCount;
      result.details!.scopes = ['ZohoSign.documents.ALL', 'ZohoSign.account.READ'];
    } else {
      result.checks.apiConnection = {
        status: 'fail',
        message: data.message || `API error code: ${data.code}`,
        duration_ms: Date.now() - apiStartTime,
      };
      result.status = 'degraded';
    }
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
