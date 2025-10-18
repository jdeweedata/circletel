/**
 * MTN SSO Authentication Management API
 *
 * Provides endpoints to manage MTN SSO authentication sessions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { mtnSSOAuth } from '@/lib/services/mtn-sso-auth';

/**
 * GET - Check authentication status and session info
 */
export async function GET() {
  try {
    const session = await mtnSSOAuth.getAuthSession();

    return NextResponse.json({
      success: session.success,
      authenticated: session.success,
      sessionId: session.sessionId,
      expiresAt: session.expiresAt?.toISOString(),
      cookiesCount: session.cookies?.length || 0,
      error: session.error
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        authenticated: false,
        error: error instanceof Error ? error.message : 'Failed to check authentication status'
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Trigger manual authentication (force re-authentication)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { manual } = body;

    let result;

    if (manual) {
      // Run manual authentication with visible browser
      result = await mtnSSOAuth.authenticateManual();
    } else {
      // Clear cache and re-authenticate
      await mtnSSOAuth.clearSession();
      result = await mtnSSOAuth.getAuthSession();
    }

    return NextResponse.json({
      success: result.success,
      sessionId: result.sessionId,
      expiresAt: result.expiresAt?.toISOString(),
      error: result.error,
      message: result.success
        ? 'Authentication successful'
        : 'Authentication failed - check server logs for details'
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Clear authentication session cache
 */
export async function DELETE() {
  try {
    await mtnSSOAuth.clearSession();

    return NextResponse.json({
      success: true,
      message: 'Session cache cleared successfully'
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to clear session cache'
      },
      { status: 500 }
    );
  }
}
