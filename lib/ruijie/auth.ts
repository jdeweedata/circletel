/**
 * Ruijie Cloud API Authentication
 * OAuth2 token management with module-level cache
 *
 * Pattern mirrors lib/tarana/auth.ts
 */

import { RuijieAuthResponse } from './types';

const RUIJIE_BASE_URL = process.env.RUIJIE_BASE_URL || 'https://cloud.ruijienetworks.com/service/api';
const RUIJIE_APP_ID = process.env.RUIJIE_APP_ID || '';
const RUIJIE_SECRET = process.env.RUIJIE_SECRET || '';

interface TokenCache {
  accessToken: string;
  expiresAt: number;
}

// Module-level cache (survives warm Vercel instances)
// On cold start, simply re-fetches — acceptable cost at our scale
let tokenCache: TokenCache | null = null;

// Fixed token from Ruijie docs (required query param)
const AUTH_TOKEN_PARAM = 'd63dss0a81e4415a889ac5b78fsc904a';

// Token expires in 30 days per docs (2592000 seconds)
const TOKEN_EXPIRY_SECONDS = 30 * 24 * 60 * 60;

/**
 * Authenticate with Ruijie Cloud and get access token
 * Endpoint: /service/api/oauth20/client/access_token?token=d63dss0a81e4415a889ac5b78fsc904a
 */
export async function authenticateRuijie(): Promise<RuijieAuthResponse> {
  if (!RUIJIE_APP_ID || !RUIJIE_SECRET) {
    throw new Error(
      'Ruijie credentials not configured. Set RUIJIE_APP_ID and RUIJIE_SECRET environment variables.'
    );
  }

  // Note: RUIJIE_BASE_URL should be https://cloud.ruijienetworks.com/service/api
  // The endpoint is /oauth20/client/access_token with required token param
  const url = `${RUIJIE_BASE_URL}/oauth20/client/access_token?token=${AUTH_TOKEN_PARAM}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      appid: RUIJIE_APP_ID,  // lowercase per API spec
      secret: RUIJIE_SECRET,
    }),
  });

  if (!response.ok) {
    clearRuijieAuth();
    const error = await response.text();
    throw new Error(
      `Ruijie auth failed: ${response.status} — check RUIJIE_APP_ID and RUIJIE_SECRET env vars. Details: ${error}`
    );
  }

  const data = await response.json();

  // Check for API error response (code != 0 means failure)
  if (data.code !== 0) {
    clearRuijieAuth();
    throw new Error(`Ruijie auth failed: ${data.msg || 'Unknown error'}`);
  }

  // Cache the token - 30 day expiry per docs, with 1 hour buffer
  tokenCache = {
    accessToken: data.accessToken,
    expiresAt: Date.now() + (TOKEN_EXPIRY_SECONDS * 1000) - (60 * 60 * 1000),
  };

  return {
    accessToken: tokenCache.accessToken,
    expiresIn: TOKEN_EXPIRY_SECONDS,
    tokenType: 'Bearer',
  };
}

/**
 * Get valid access token, refreshing if needed
 */
export async function getAccessToken(): Promise<string> {
  // Return cached if still valid
  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    return tokenCache.accessToken;
  }

  // Token expired or not cached, re-authenticate
  const auth = await authenticateRuijie();
  return auth.accessToken;
}

/**
 * Clear cached token (for logout or error recovery)
 */
export function clearRuijieAuth(): void {
  tokenCache = null;
}

/**
 * Check if we have valid cached credentials
 */
export function hasRuijieAuth(): boolean {
  return tokenCache !== null && tokenCache.expiresAt > Date.now();
}
