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

/**
 * Authenticate with Ruijie Cloud and get access token
 */
export async function authenticateRuijie(): Promise<RuijieAuthResponse> {
  if (!RUIJIE_APP_ID || !RUIJIE_SECRET) {
    throw new Error(
      'Ruijie credentials not configured. Set RUIJIE_APP_ID and RUIJIE_SECRET environment variables.'
    );
  }

  const response = await fetch(`${RUIJIE_BASE_URL}/maint/token/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      appId: RUIJIE_APP_ID,
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

  // Cache the token with 60s buffer before expiry
  tokenCache = {
    accessToken: data.access_token || data.accessToken,
    expiresAt: Date.now() + ((data.expires_in || data.expiresIn || 3600) * 1000) - 60000,
  };

  return {
    accessToken: tokenCache.accessToken,
    expiresIn: data.expires_in || data.expiresIn || 3600,
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
