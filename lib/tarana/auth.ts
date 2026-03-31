/**
 * Tarana TCS Portal Authentication
 * Uses HTTP Basic Auth on login; subsequent API calls are authenticated via
 * httpOnly cookies (idToken, accessToken, userId) set by the server.
 */

import { TaranaAuthResponse, TaranaUser } from './types';

const TARANA_API_BASE = 'https://portal.tcs.taranawireless.com';

// Credentials from environment
const TARANA_USERNAME = process.env.TARANA_USERNAME || '';
const TARANA_PASSWORD = process.env.TARANA_PASSWORD || '';

// Browser-like headers required by the portal
const BROWSER_HEADERS = {
  'Accept': 'application/json, text/plain, */*',
  'Referer': `${TARANA_API_BASE}/`,
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'X-Caller-Name': 'operator-portal',
};

interface SessionCache {
  cookies: string;   // Raw Cookie header value extracted from Set-Cookie
  userId: string;
  expiresAt: number;
  user: TaranaUser | null;
}

let sessionCache: SessionCache | null = null;

/**
 * Parse Set-Cookie headers from a Response and return a Cookie header string.
 * Node fetch returns headers as a Headers object; we need to extract all
 * Set-Cookie values and re-join them as a single Cookie: header.
 */
function extractCookies(response: Response): string {
  const cookies: string[] = [];
  // Node 18+ fetch supports getSetCookie(); fall back to iterating entries
  const raw = response.headers as unknown as { getSetCookie?: () => string[] };
  const setCookieValues: string[] = typeof raw.getSetCookie === 'function'
    ? raw.getSetCookie()
    : (() => {
        const vals: string[] = [];
        response.headers.forEach((value, name) => {
          if (name.toLowerCase() === 'set-cookie') vals.push(value);
        });
        return vals;
      })();

  for (const cookieStr of setCookieValues) {
    // Take only name=value (before the first semicolon)
    const nameValue = cookieStr.split(';')[0].trim();
    if (nameValue) cookies.push(nameValue);
  }
  return cookies.join('; ');
}

/**
 * Authenticate with Tarana Portal.
 * Uses HTTP Basic Auth on the login endpoint; stores the resulting
 * httpOnly session cookies for use in subsequent API calls.
 */
export async function authenticateTarana(
  username?: string,
  password?: string
): Promise<TaranaAuthResponse> {
  const user = username || TARANA_USERNAME;
  const pass = password || TARANA_PASSWORD;

  if (!user || !pass) {
    throw new Error('Tarana credentials not configured. Set TARANA_USERNAME and TARANA_PASSWORD environment variables.');
  }

  const basicCredentials = Buffer.from(`${user}:${pass}`).toString('base64');

  const response = await fetch(`${TARANA_API_BASE}/api/tcs/v1/user-auth/login`, {
    method: 'POST',
    headers: {
      ...BROWSER_HEADERS,
      'Authorization': `Basic ${basicCredentials}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Tarana authentication failed: ${response.status} - ${error}`);
  }

  const raw = await response.json();
  // Response: { data: { accessToken, refreshToken, userId, session } }
  const data = raw.data ?? raw;

  // Extract session cookies from Set-Cookie headers
  const cookies = extractCookies(response);

  // Tokens expire in 1 hour (3600s); cache with 1-min buffer
  sessionCache = {
    cookies,
    userId: data.userId || '',
    expiresAt: Date.now() + (3600 - 60) * 1000,
    user: null,
  };

  return {
    accessToken: data.accessToken || data.access_token,
    refreshToken: data.refreshToken || data.refresh_token || '',
    expiresIn: 3600,
    tokenType: 'Cookie',
  };
}

/**
 * Get the Cookie header string for authenticated API requests.
 * Re-authenticates automatically when the session expires.
 */
export async function getSessionCookies(): Promise<string> {
  if (sessionCache && sessionCache.expiresAt > Date.now() && sessionCache.cookies) {
    return sessionCache.cookies;
  }
  await authenticateTarana();
  return sessionCache!.cookies;
}

/**
 * @deprecated Use getSessionCookies() instead.
 * Kept for backward compatibility — returns an empty string which will
 * cause 403s; callers should be migrated to cookie-based auth.
 */
export async function getAccessToken(): Promise<string> {
  await getSessionCookies();
  return '';
}

/**
 * Get current user info
 */
export async function getTaranaUser(): Promise<TaranaUser> {
  const cookies = await getSessionCookies();

  const response = await fetch(`${TARANA_API_BASE}/api/tcs/v1/users`, {
    headers: { ...BROWSER_HEADERS, 'Cookie': cookies },
  });

  if (!response.ok) {
    throw new Error(`Failed to get user info: ${response.status}`);
  }

  const data = await response.json();

  if (sessionCache) {
    sessionCache.user = data.data ?? data;
  }

  return data.data ?? data;
}

/**
 * Clear cached session (for logout or forced re-auth)
 */
export function clearTaranaAuth(): void {
  sessionCache = null;
}

/**
 * Check if we have a valid cached session
 */
export function hasTaranaAuth(): boolean {
  return sessionCache !== null && sessionCache.expiresAt > Date.now() && !!sessionCache.cookies;
}
