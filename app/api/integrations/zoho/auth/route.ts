// ZOHO OAuth Callback Handler
// Handles OAuth authorization callback from ZOHO

import { NextRequest, NextResponse } from 'next/server';
import { createZohoAuthService } from '@/lib/integrations/zoho/auth-service';

/**
 * GET /api/integrations/zoho/auth
 * OAuth callback handler
 *
 * ZOHO OAuth flow:
 * 1. User authorizes in ZOHO
 * 2. ZOHO redirects to this endpoint with code
 * 3. Exchange code for access + refresh tokens
 * 4. Store tokens in database
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    // Handle OAuth error
    if (error) {
      console.error('[ZOHO OAuth] Authorization error:', error);
      return NextResponse.json(
        {
          success: false,
          error: `Authorization failed: ${error}`,
        },
        { status: 400 }
      );
    }

    // Validate authorization code
    if (!code) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authorization code not provided',
        },
        { status: 400 }
      );
    }

    console.log('[ZOHO OAuth] Received authorization code');

    // Note: Token exchange requires additional OAuth setup
    // For now, we use refresh token from environment
    const auth = createZohoAuthService();

    // Force refresh to ensure we have valid token
    const accessToken = await auth.forceRefresh();

    console.log('[ZOHO OAuth] Token refresh successful');

    return NextResponse.json({
      success: true,
      message: 'ZOHO authorization successful',
      tokenExpiry: new Date(Date.now() + 3600000).toISOString(),
    });
  } catch (error) {
    console.error('[ZOHO OAuth] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'OAuth callback failed',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/integrations/zoho/auth
 * Test connection and refresh token
 */
export async function POST(request: NextRequest) {
  try {
    const auth = createZohoAuthService();

    // Test connection
    const token = await auth.getAccessToken();

    // Get stored token info
    const storedToken = await auth.getStoredToken();

    return NextResponse.json({
      success: true,
      message: 'ZOHO connection successful',
      tokenExpiry: storedToken?.expires_at,
      isExpired: await auth.isTokenExpired(),
    });
  } catch (error) {
    console.error('[ZOHO OAuth] Connection test failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed',
      },
      { status: 500 }
    );
  }
}
