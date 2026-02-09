/**
 * API Route: Initialize Zoho Token
 * POST /api/admin/integrations/zoho/init-token
 * 
 * Refreshes the Zoho access token using the refresh token from environment
 * and stores it in the database.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging';

const ZOHO_CLIENT_ID = process.env.ZOHO_CLIENT_ID;
const ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET;
const ZOHO_REFRESH_TOKEN = process.env.ZOHO_REFRESH_TOKEN;
const ZOHO_ACCOUNTS_URL = 'https://accounts.zoho.com';

export async function POST(request: NextRequest) {
  try {
    if (!ZOHO_CLIENT_ID || !ZOHO_CLIENT_SECRET || !ZOHO_REFRESH_TOKEN) {
      return NextResponse.json(
        { success: false, error: 'Zoho credentials not configured in environment' },
        { status: 500 }
      );
    }

    apiLogger.info('[ZohoInit] Refreshing access token...');

    // Refresh the access token using the refresh token
    const tokenResponse = await fetch(`${ZOHO_ACCOUNTS_URL}/oauth/v2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        refresh_token: ZOHO_REFRESH_TOKEN,
        client_id: ZOHO_CLIENT_ID,
        client_secret: ZOHO_CLIENT_SECRET,
        grant_type: 'refresh_token',
      }).toString(),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      apiLogger.error('[ZohoInit] Token refresh failed:', tokenData);
      return NextResponse.json(
        { 
          success: false, 
          error: `Token refresh failed: ${tokenData.error}`,
          details: tokenData
        },
        { status: 400 }
      );
    }

    apiLogger.info('[ZohoInit] Token refresh successful, storing in database...');

    // Calculate expiry time (Zoho tokens expire in 1 hour)
    const expiresAt = new Date(Date.now() + (tokenData.expires_in || 3600) * 1000);

    // Store token in database
    const supabase = await createClient();
    
    // First, delete any existing tokens
    await supabase.from('zoho_tokens').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Insert new token
    const { data, error } = await supabase
      .from('zoho_tokens')
      .insert({
        access_token: tokenData.access_token,
        refresh_token: ZOHO_REFRESH_TOKEN,
        expires_at: expiresAt.toISOString(),
        token_type: tokenData.token_type || 'Bearer',
        scope: tokenData.scope || 'ZohoCRM.modules.ALL',
      })
      .select()
      .single();

    if (error) {
      apiLogger.error('[ZohoInit] Failed to store token:', error);
      return NextResponse.json(
        { success: false, error: `Failed to store token: ${error.message}` },
        { status: 500 }
      );
    }

    apiLogger.info('[ZohoInit] Token stored successfully, expires at:', expiresAt.toISOString());

    return NextResponse.json({
      success: true,
      message: 'Zoho token initialized successfully',
      expires_at: expiresAt.toISOString(),
      scope: tokenData.scope,
    });

  } catch (error) {
    apiLogger.error('[ZohoInit] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET - Check current token status
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: token, error } = await supabase
      .from('zoho_tokens')
      .select('id, expires_at, scope, token_type, created_at, updated_at')
      .single();

    if (error || !token) {
      return NextResponse.json({
        success: true,
        status: 'not_initialized',
        message: 'No Zoho token found. Call POST to initialize.',
      });
    }

    const expiresAt = new Date(token.expires_at);
    const now = new Date();
    const isExpired = expiresAt <= now;
    const expiresInMinutes = Math.round((expiresAt.getTime() - now.getTime()) / 60000);

    return NextResponse.json({
      success: true,
      status: isExpired ? 'expired' : 'valid',
      expires_at: token.expires_at,
      expires_in_minutes: isExpired ? 0 : expiresInMinutes,
      scope: token.scope,
    });

  } catch (error) {
    apiLogger.error('[ZohoInit] Error checking status:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
