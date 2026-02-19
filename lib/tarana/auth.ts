/**
 * Tarana TCS Portal Authentication
 * Uses AWS Cognito for JWT-based authentication
 */

import { TaranaAuthResponse, TaranaUser } from './types';

const TARANA_API_BASE = 'https://portal.tcs.taranawireless.com';

// Credentials from environment
const TARANA_USERNAME = process.env.TARANA_USERNAME || '';
const TARANA_PASSWORD = process.env.TARANA_PASSWORD || '';

interface TokenCache {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: TaranaUser | null;
}

let tokenCache: TokenCache | null = null;

/**
 * Authenticate with Tarana Portal and get JWT tokens
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

  const response = await fetch(`${TARANA_API_BASE}/api/tcs/v1/user-auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ username: user, password: pass }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Tarana authentication failed: ${response.status} - ${error}`);
  }

  const data = await response.json();

  // Cache the tokens
  tokenCache = {
    accessToken: data.accessToken || data.access_token,
    refreshToken: data.refreshToken || data.refresh_token,
    expiresAt: Date.now() + ((data.expiresIn || 3600) * 1000) - 60000, // 1 min buffer
    user: null,
  };

  return {
    accessToken: tokenCache.accessToken,
    refreshToken: tokenCache.refreshToken,
    expiresIn: data.expiresIn || 3600,
    tokenType: data.tokenType || 'Bearer',
  };
}

/**
 * Get valid access token, refreshing if needed
 */
export async function getAccessToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    return tokenCache.accessToken;
  }

  // Token expired or not cached, re-authenticate
  const auth = await authenticateTarana();
  return auth.accessToken;
}

/**
 * Get current user info
 */
export async function getTaranaUser(): Promise<TaranaUser> {
  const token = await getAccessToken();

  const response = await fetch(`${TARANA_API_BASE}/api/tcs/v1/users`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get user info: ${response.status}`);
  }

  const data = await response.json();

  if (tokenCache) {
    tokenCache.user = data;
  }

  return data;
}

/**
 * Clear cached tokens (for logout or re-auth)
 */
export function clearTaranaAuth(): void {
  tokenCache = null;
}

/**
 * Check if we have valid cached credentials
 */
export function hasTaranaAuth(): boolean {
  return tokenCache !== null && tokenCache.expiresAt > Date.now();
}
