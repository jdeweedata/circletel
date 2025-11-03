// ZOHO Auth Service
// Extends ZohoAPIClient to add database token storage
// CRITICAL: Reuses existing OAuth logic from lib/zoho-api-client.ts

import { ZohoAPIClient } from '@/lib/zoho-api-client';
import { createClient } from '@/lib/supabase/server';
import type { ZohoToken } from './types';

/**
 * ZohoAuthService extends the base ZohoAPIClient to add:
 * 1. Database token storage (zoho_tokens table)
 * 2. Automatic token refresh with database persistence
 * 3. Token expiry checking
 *
 * This service REUSES the existing OAuth refresh logic from ZohoAPIClient
 * and adds database persistence on top.
 */
export class ZohoAuthService extends ZohoAPIClient {
  /**
   * Get a valid access token, checking database first
   * If token is expired, refresh and store new token
   */
  async getAccessToken(): Promise<string> {
    try {
      // 1. Check database for existing valid token
      const supabase = await createClient();
      const { data: tokenData, error } = await supabase
        .from('zoho_tokens')
        .select('*')
        .single();

      // 2. If token exists and is not expired, return it
      if (tokenData && !error) {
        const expiresAt = new Date(tokenData.expires_at);
        const now = new Date();

        // Add 5-minute buffer before expiry
        const bufferMs = 5 * 60 * 1000;
        if (expiresAt.getTime() - now.getTime() > bufferMs) {
          console.log('[ZohoAuth] Using cached token from database');
          return tokenData.access_token;
        }

        console.log('[ZohoAuth] Token expired, refreshing...');
      } else {
        console.log('[ZohoAuth] No token in database, obtaining new token...');
      }

      // 3. Token expired or doesn't exist - refresh using parent class
      const newAccessToken = await this.refreshAccessToken();

      // 4. Store new token in database
      await this.storeToken(newAccessToken);

      return newAccessToken;
    } catch (error) {
      console.error('[ZohoAuth] Failed to get access token:', error);
      throw new Error(`Failed to get ZOHO access token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Refresh access token using parent class OAuth logic
   * This method is inherited from ZohoAPIClient
   */
  async refreshAccessToken(): Promise<string> {
    console.log('[ZohoAuth] Refreshing access token via OAuth...');

    // Call parent class method (already implemented in ZohoAPIClient)
    const newToken = await super.refreshAccessToken();

    console.log('[ZohoAuth] Token refresh successful');
    return newToken;
  }

  /**
   * Store token in database with 1-hour expiry (ZOHO default)
   */
  private async storeToken(accessToken: string): Promise<void> {
    try {
      // ZOHO tokens expire in 1 hour (3600 seconds)
      const expiresAt = new Date(Date.now() + 3600 * 1000);

      const supabase = await createClient();

      const tokenData = {
        access_token: accessToken,
        refresh_token: process.env.ZOHO_REFRESH_TOKEN!,
        expires_at: expiresAt.toISOString(),
        token_type: 'Bearer',
        scope: 'ZohoCRM.modules.ALL',
      };

      // Upsert (insert or update) - table has unique constraint
      const { error } = await supabase
        .from('zoho_tokens')
        .upsert(tokenData, {
          onConflict: 'id', // Use singleton pattern
          ignoreDuplicates: false,
        });

      if (error) {
        console.error('[ZohoAuth] Failed to store token:', error);
        throw error;
      }

      console.log('[ZohoAuth] Token stored in database, expires at:', expiresAt.toISOString());
    } catch (error) {
      console.error('[ZohoAuth] Error storing token:', error);
      throw new Error(`Failed to store ZOHO token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get stored token from database (for debugging/admin)
   */
  async getStoredToken(): Promise<ZohoToken | null> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('zoho_tokens')
        .select('*')
        .single();

      if (error || !data) {
        return null;
      }

      return data as ZohoToken;
    } catch (error) {
      console.error('[ZohoAuth] Error getting stored token:', error);
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  async isTokenExpired(): Promise<boolean> {
    const token = await this.getStoredToken();
    if (!token) {
      return true;
    }

    const expiresAt = new Date(token.expires_at);
    const now = new Date();

    return expiresAt.getTime() <= now.getTime();
  }

  /**
   * Force token refresh (for testing/debugging)
   */
  async forceRefresh(): Promise<string> {
    console.log('[ZohoAuth] Force refreshing token...');
    const newToken = await this.refreshAccessToken();
    await this.storeToken(newToken);
    return newToken;
  }
}

/**
 * Create singleton instance of ZohoAuthService
 */
export function createZohoAuthService(): ZohoAuthService {
  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('ZOHO credentials not configured. Please set ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, and ZOHO_REFRESH_TOKEN environment variables.');
  }

  return new ZohoAuthService({
    clientId,
    clientSecret,
    refreshToken,
    region: (process.env.ZOHO_REGION as 'US' | 'EU' | 'IN' | 'AU' | 'CN') || 'US',
    orgId: process.env.ZOHO_ORG_ID,
  });
}
