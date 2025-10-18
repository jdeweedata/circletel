/**
 * CAS Ticket-Based Session Refresh Test
 *
 * Tests if MTN's CASTGC (Ticket Granting Ticket) can be used to
 * programmatically refresh session cookies without browser automation.
 *
 * CAS Protocol:
 * 1. CASTGC (Ticket Granting Ticket) - obtained after login
 * 2. Request service ticket using CASTGC
 * 3. Exchange service ticket for new JSESSIONID
 *
 * Usage:
 *   npx tsx scripts/test-cas-ticket-refresh.ts [--verbose]
 */

import fs from 'fs/promises';
import path from 'path';

interface Cookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires: number;
  httpOnly: boolean;
  secure: boolean;
  sameSite?: string;
}

interface CachedSession {
  cookies: Cookie[];
  sessionId: string;
  expiresAt: string;
}

interface RefreshResult {
  success: boolean;
  method?: string;
  newCookies?: Cookie[];
  error?: string;
  details?: string;
}

const CACHE_PATH = path.join(process.cwd(), '.cache', 'mtn-session.json');
const CAS_LOGIN_URL = 'https://sso.mtnbusiness.co.za/login';
const SERVICE_URL = 'https://asp-feasibility.mtnbusiness.co.za/login/cas';
const VERBOSE = process.argv.includes('--verbose');

/**
 * Load cached session
 */
async function loadCachedSession(): Promise<CachedSession | null> {
  try {
    const data = await fs.readFile(CACHE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Failed to load cached session:', error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Log verbose output
 */
function log(...args: any[]) {
  if (VERBOSE) {
    console.log(...args);
  }
}

/**
 * Test Method 1: CAS Service Ticket Request
 *
 * Attempts to request a new service ticket using the existing CASTGC.
 * If successful, the CAS server will redirect with a ticket parameter.
 */
async function testCASServiceTicketRequest(castgcCookie: Cookie): Promise<RefreshResult> {
  try {
    console.log('\n🔍 Testing CAS Service Ticket Request...');
    log('CASTGC value:', castgcCookie.value.substring(0, 30) + '...');

    const serviceUrlEncoded = encodeURIComponent(SERVICE_URL);
    const casUrl = `${CAS_LOGIN_URL}?service=${serviceUrlEncoded}`;

    log('Request URL:', casUrl);
    log('Cookie header:', `CASTGC=${castgcCookie.value.substring(0, 30)}...`);

    const response = await fetch(casUrl, {
      method: 'GET',
      headers: {
        'Cookie': `CASTGC=${castgcCookie.value}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://sso.mtnbusiness.co.za/',
      },
      redirect: 'manual' // Don't follow redirects automatically
    });

    log('Response status:', response.status);
    log('Response headers:', Object.fromEntries(response.headers.entries()));

    // Check for redirect with service ticket
    const location = response.headers.get('location');

    if (location && location.includes('ticket=')) {
      console.log('✅ CAS server issued redirect with service ticket');
      log('Redirect location:', location);

      // Extract ticket parameter
      const ticketMatch = location.match(/ticket=([^&]+)/);
      const serviceTicket = ticketMatch ? ticketMatch[1] : null;

      if (serviceTicket) {
        console.log('🎫 Service Ticket:', serviceTicket.substring(0, 20) + '...');

        // Now exchange the service ticket for a session
        return await exchangeServiceTicket(serviceTicket);
      } else {
        return {
          success: false,
          error: 'Failed to extract service ticket from redirect',
          details: location
        };
      }
    } else if (response.status === 200) {
      // If we get 200, CASTGC might be valid but CAS expects a login
      const body = await response.text();

      if (body.includes('login') || body.includes('password')) {
        return {
          success: false,
          error: 'CAS redirected to login page - CASTGC may be expired',
          details: 'Server requires re-authentication'
        };
      } else if (body.includes('ticket=') || location) {
        // Sometimes the ticket is in the response body or different redirect
        return {
          success: false,
          error: 'Unexpected response format',
          details: `Status ${response.status}, Location: ${location || 'none'}`
        };
      }
    } else if (response.status === 302 || response.status === 303) {
      return {
        success: false,
        error: `Redirect without ticket parameter (${response.status})`,
        details: location || 'No location header'
      };
    }

    return {
      success: false,
      error: `Unexpected response status: ${response.status}`,
      details: await response.text().then(t => t.substring(0, 200))
    };

  } catch (error) {
    return {
      success: false,
      error: 'CAS request failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Exchange service ticket for new session cookies
 */
async function exchangeServiceTicket(serviceTicket: string): Promise<RefreshResult> {
  try {
    console.log('\n🔄 Exchanging service ticket for session...');

    const serviceUrlWithTicket = `${SERVICE_URL}?ticket=${serviceTicket}`;
    log('Service URL:', serviceUrlWithTicket);

    const response = await fetch(serviceUrlWithTicket, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'manual'
    });

    log('Response status:', response.status);

    // Extract Set-Cookie headers
    const setCookieHeaders = response.headers.getSetCookie ?
      response.headers.getSetCookie() :
      [response.headers.get('set-cookie')].filter(Boolean) as string[];

    log('Set-Cookie headers:', setCookieHeaders);

    if (setCookieHeaders.length > 0) {
      // Parse cookies
      const newCookies: Cookie[] = setCookieHeaders.map(parseCookie).filter(c => c !== null) as Cookie[];

      if (newCookies.length > 0) {
        console.log('✅ Received new session cookies:');
        newCookies.forEach(cookie => {
          console.log(`   - ${cookie.name}: ${cookie.value.substring(0, 20)}...`);
        });

        return {
          success: true,
          method: 'CAS Service Ticket Exchange',
          newCookies
        };
      }
    }

    return {
      success: false,
      error: 'No session cookies in response',
      details: `Status ${response.status}, Cookies: ${setCookieHeaders.length}`
    };

  } catch (error) {
    return {
      success: false,
      error: 'Service ticket exchange failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Parse Set-Cookie header into Cookie object
 */
function parseCookie(setCookieHeader: string): Cookie | null {
  try {
    const parts = setCookieHeader.split(';').map(p => p.trim());
    const [nameValue] = parts;
    const [name, value] = nameValue.split('=');

    const cookie: Cookie = {
      name: name.trim(),
      value: value ? value.trim() : '',
      domain: '',
      path: '/',
      expires: -1,
      httpOnly: false,
      secure: false
    };

    // Parse attributes
    parts.slice(1).forEach(attr => {
      const [key, val] = attr.split('=').map(s => s.trim());
      const keyLower = key.toLowerCase();

      if (keyLower === 'domain') cookie.domain = val;
      else if (keyLower === 'path') cookie.path = val;
      else if (keyLower === 'expires') cookie.expires = new Date(val).getTime() / 1000;
      else if (keyLower === 'httponly') cookie.httpOnly = true;
      else if (keyLower === 'secure') cookie.secure = true;
      else if (keyLower === 'samesite') cookie.sameSite = val;
    });

    return cookie;
  } catch (error) {
    log('Failed to parse cookie:', setCookieHeader, error);
    return null;
  }
}

/**
 * Test Method 2: Direct API Call with Existing Cookies
 *
 * Tests if the existing session cookies still work by making an API call.
 */
async function testExistingSession(cookies: Cookie[]): Promise<RefreshResult> {
  try {
    console.log('\n🔍 Testing existing session validity...');

    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
    log('Cookie header length:', cookieHeader.length);

    const response = await fetch(
      'https://asp-feasibility.mtnbusiness.co.za/api/v1/feasibility/product/wholesale/mns',
      {
        method: 'GET',
        headers: {
          'Cookie': cookieHeader,
          'X-API-Key': 'bdaacbcae8ab77672e545649df54d0df',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        }
      }
    );

    log('Response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Existing session still valid');
      log('API response:', data);

      return {
        success: true,
        method: 'Existing Session (No Refresh Needed)',
        newCookies: cookies
      };
    } else {
      const errorText = await response.text();
      return {
        success: false,
        error: `API returned ${response.status}`,
        details: errorText.substring(0, 200)
      };
    }
  } catch (error) {
    return {
      success: false,
      error: 'API test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Save refreshed session to cache
 */
async function saveRefreshedSession(
  originalSession: CachedSession,
  newCookies: Cookie[]
): Promise<void> {
  try {
    // Merge new cookies with existing ones (keep _GRECAPTCHA)
    const existingGreCaptcha = originalSession.cookies.find(c => c.name === '_GRECAPTCHA');
    const mergedCookies = existingGreCaptcha ? [existingGreCaptcha, ...newCookies] : newCookies;

    // Find new session ID
    const newSessionId = newCookies.find(c => c.name === 'JSESSIONID')?.value || originalSession.sessionId;

    // Calculate new expiry (1 hour from now)
    const newExpiresAt = new Date(Date.now() + 3600000).toISOString();

    const refreshedSession: CachedSession = {
      cookies: mergedCookies,
      sessionId: newSessionId,
      expiresAt: newExpiresAt
    };

    await fs.writeFile(CACHE_PATH, JSON.stringify(refreshedSession, null, 2));
    console.log('✅ Refreshed session saved to cache');
    console.log(`   New expiry: ${newExpiresAt}`);
  } catch (error) {
    console.error('❌ Failed to save refreshed session:', error);
  }
}

/**
 * Main test execution
 */
async function main() {
  console.log('='.repeat(70));
  console.log('CAS Ticket-Based Session Refresh Test');
  console.log('='.repeat(70));
  console.log('');

  // Load cached session
  const session = await loadCachedSession();

  if (!session) {
    console.error('❌ No cached session found');
    console.error('');
    console.error('Please run manual authentication first:');
    console.error('  npx tsx scripts/test-mtn-sso-auth.ts --manual');
    process.exit(1);
  }

  console.log('📊 Session Info:');
  console.log(`   Session ID: ${session.sessionId}`);
  console.log(`   Expires: ${session.expiresAt}`);
  console.log(`   Cookies: ${session.cookies.length}`);
  console.log('');

  // Check if session is expired
  const expiresAt = new Date(session.expiresAt);
  const now = new Date();
  const minutesLeft = Math.floor((expiresAt.getTime() - now.getTime()) / 60000);

  console.log(`⏰ Time remaining: ${minutesLeft} minutes`);
  console.log('');

  // Test 1: Check if existing session still works
  const existingSessionResult = await testExistingSession(session.cookies);

  if (existingSessionResult.success) {
    console.log('');
    console.log('='.repeat(70));
    console.log('✅ Result: Existing session still valid, no refresh needed');
    console.log('='.repeat(70));
    process.exit(0);
  }

  console.log('⚠️  Existing session invalid, attempting refresh...');

  // Find CASTGC cookie
  const castgcCookie = session.cookies.find(c => c.name === 'CASTGC');

  if (!castgcCookie) {
    console.error('');
    console.error('❌ No CASTGC cookie found in session');
    console.error('   Manual re-authentication required');
    console.error('');
    console.error('Run: npx tsx scripts/test-mtn-sso-auth.ts --manual');
    process.exit(1);
  }

  // Test 2: Attempt CAS ticket refresh
  const casResult = await testCASServiceTicketRequest(castgcCookie);

  console.log('');
  console.log('='.repeat(70));

  if (casResult.success && casResult.newCookies) {
    console.log('✅ SUCCESS: CAS Ticket Refresh Works!');
    console.log('='.repeat(70));
    console.log('');
    console.log(`Method: ${casResult.method}`);
    console.log(`New Cookies: ${casResult.newCookies.length}`);
    console.log('');
    console.log('🎉 This means we can automate session refresh without browser!');
    console.log('');

    // Save refreshed session
    await saveRefreshedSession(session, casResult.newCookies);

    process.exit(0);
  } else {
    console.log('❌ FAILURE: CAS Ticket Refresh Failed');
    console.log('='.repeat(70));
    console.log('');
    console.log(`Error: ${casResult.error}`);
    console.log(`Details: ${casResult.details}`);
    console.log('');
    console.log('⚠️  Manual re-authentication required');
    console.log('');
    console.log('Run: npx tsx scripts/test-mtn-sso-auth.ts --manual');
    console.log('');

    process.exit(1);
  }
}

main();
