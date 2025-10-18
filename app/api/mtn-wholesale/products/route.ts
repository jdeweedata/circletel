import { NextResponse } from 'next/server';
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

export async function GET() {
  try {
    console.log('[MTN Products] Authenticating with SSO...');

    // Get authenticated session
    const authResult = await mtnSSOAuth.getAuthSession();

    if (!authResult.success || !authResult.cookies) {
      console.error('[MTN Products] Authentication failed:', authResult.error);
      return NextResponse.json(
        {
          error: 'Authentication failed',
          details: authResult.error,
          message: 'Failed to authenticate with MTN SSO. Please check credentials.'
        },
        { status: 401 }
      );
    }

    console.log('[MTN Products] Authentication successful, session ID:', authResult.sessionId);

    // Get cookie header
    const cookieHeader = await mtnSSOAuth.getCookieHeader();

    const response = await fetchWithRetry(
      `${MTN_API_BASE}/api/v1/feasibility/product/wholesale/mns`,
      {
        method: 'GET',
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
      },
      3
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[MTN Products] MTN API Error:', response.status, errorText);

      // If 401/403, session might be invalid - clear cache
      if (response.status === 401 || response.status === 403) {
        console.log('[MTN Products] Session appears invalid, clearing cache...');
        await mtnSSOAuth.clearSession();
      }

      return NextResponse.json(
        { error: `MTN API returned ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[MTN Products] Products fetched successfully:', data?.results?.length || data?.products?.length || 'unknown count');
    return NextResponse.json(data);
  } catch (error) {
    console.error('[MTN Products] Error fetching MTN products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products from MTN API', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
