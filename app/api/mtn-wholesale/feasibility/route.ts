import { NextRequest, NextResponse } from 'next/server';
import { mtnSSOAuth } from '@/lib/services/mtn-sso-auth';

const MTN_API_BASE = 'https://asp-feasibility.mtnbusiness.co.za';
const MTN_API_KEY = 'bdaacbcae8ab77672e545649df54d0df';

// Enhanced headers to avoid anti-bot protection
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      return response;
    } catch (error) {
      lastError = error as Error;
      console.log(`Attempt ${i + 1}/${maxRetries} failed, retrying...`, error);

      // Exponential backoff
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
  }

  throw lastError || new Error('Failed to fetch after retries');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    if (!body.inputs || !Array.isArray(body.inputs) || body.inputs.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: inputs array is required' },
        { status: 400 }
      );
    }

    if (!body.product_names || !Array.isArray(body.product_names) || body.product_names.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: product_names array is required' },
        { status: 400 }
      );
    }

    if (!body.requestor) {
      return NextResponse.json(
        { error: 'Invalid request: requestor email is required' },
        { status: 400 }
      );
    }

    console.log('[MTN Feasibility] Proxying feasibility request to MTN API:', {
      locations: body.inputs.length,
      products: body.product_names.length,
      requestor: body.requestor
    });

    // Get authenticated session
    console.log('[MTN Feasibility] Authenticating with SSO...');
    const authResult = await mtnSSOAuth.getAuthSession();

    if (!authResult.success || !authResult.cookies) {
      console.error('[MTN Feasibility] Authentication failed:', authResult.error);
      return NextResponse.json(
        {
          error: 'Authentication failed',
          details: authResult.error,
          message: 'Failed to authenticate with MTN SSO. Please check credentials.'
        },
        { status: 401 }
      );
    }

    console.log('[MTN Feasibility] Authentication successful, session ID:', authResult.sessionId);

    // Get cookie header
    const cookieHeader = await mtnSSOAuth.getCookieHeader();

    const response = await fetchWithRetry(
      `${MTN_API_BASE}/api/v1/feasibility/product/wholesale/mns`,
      {
        method: 'POST',
        headers: {
          'Cookie': cookieHeader || '',
          'X-API-Key': MTN_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': getRandomUserAgent(),
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Referer': 'https://asp-feasibility.mtnbusiness.co.za/',
          'Origin': 'https://asp-feasibility.mtnbusiness.co.za',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin',
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify(body),
      },
      3
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[MTN Feasibility] MTN API Error:', response.status, errorText);

      // If 401/403, session might be invalid - clear cache
      if (response.status === 401 || response.status === 403) {
        console.log('[MTN Feasibility] Session appears invalid, clearing cache...');
        await mtnSSOAuth.clearSession();
      }

      return NextResponse.json(
        { error: `MTN API returned ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[MTN Feasibility] MTN API Response:', {
      error_code: data.error_code,
      outputs_count: data.outputs?.length || 0
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in MTN feasibility check:', error);
    return NextResponse.json(
      { error: 'Failed to check feasibility with MTN API', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
