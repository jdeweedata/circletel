/**
 * MTN SSO Session Refresh API
 *
 * This endpoint can be called by:
 * 1. Vercel Cron Jobs (every 50 minutes)
 * 2. GitHub Actions (scheduled workflow)
 * 3. External monitoring service (UptimeRobot, etc.)
 *
 * It attempts to refresh the MTN session and update environment variables
 */

import { NextRequest, NextResponse } from 'next/server';
import { mtnSSOAuth } from '@/lib/services/mtn-sso-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max execution time

/**
 * POST /api/mtn-wholesale/refresh
 *
 * Triggers a session refresh. Requires CRON_SECRET for security.
 */
export async function POST(request: NextRequest) {
  try {
    // Security: Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[MTN Refresh] Starting session refresh...');

    // In Vercel, we can't use Playwright, so this will return an error
    // instructing to manually refresh the session
    if (process.env.VERCEL) {
      const currentSession = await mtnSSOAuth.getAuthSession();

      if (!currentSession.success) {
        return NextResponse.json({
          success: false,
          error: 'Session refresh not possible in Vercel environment',
          message: 'Please manually refresh the MTN_SESSION environment variable',
          instructions: [
            '1. Run locally: npx tsx scripts/test-mtn-sso-auth.ts --manual',
            '2. Export session: npx tsx scripts/export-session-env.ts',
            '3. Update MTN_SESSION in Vercel dashboard',
            '4. Redeploy or wait for automatic deployment'
          ],
          currentSessionExpired: true
        }, { status: 503 });
      }

      // Check if session is about to expire (within 10 minutes)
      const expiresAt = currentSession.expiresAt;
      const now = new Date();
      const timeLeftMs = expiresAt ? expiresAt.getTime() - now.getTime() : 0;
      const minutesLeft = Math.floor(timeLeftMs / 60000);

      if (minutesLeft < 10) {
        return NextResponse.json({
          success: false,
          warning: 'Session expiring soon',
          minutesLeft,
          expiresAt: expiresAt?.toISOString(),
          message: 'Please refresh MTN_SESSION manually',
          instructions: [
            '1. Run locally: npx tsx scripts/test-mtn-sso-auth.ts --manual',
            '2. Export session: npx tsx scripts/export-session-env.ts',
            '3. Update MTN_SESSION in Vercel dashboard'
          ]
        }, { status: 200 });
      }

      return NextResponse.json({
        success: true,
        message: 'Session is still valid',
        minutesLeft,
        expiresAt: expiresAt?.toISOString()
      });
    }

    // Local environment - attempt to refresh
    console.log('[MTN Refresh] Clearing current session...');
    await mtnSSOAuth.clearSession();

    console.log('[MTN Refresh] Authenticating with MTN SSO...');
    const newSession = await mtnSSOAuth.getAuthSession();

    if (!newSession.success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to refresh session',
        details: newSession.error
      }, { status: 500 });
    }

    console.log('[MTN Refresh] Session refreshed successfully');
    console.log('[MTN Refresh] New session expires at:', newSession.expiresAt?.toISOString());

    return NextResponse.json({
      success: true,
      message: 'Session refreshed successfully',
      expiresAt: newSession.expiresAt?.toISOString(),
      sessionId: newSession.sessionId
    });

  } catch (error) {
    console.error('[MTN Refresh] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET /api/mtn-wholesale/refresh
 *
 * Check current session status
 */
export async function GET() {
  try {
    const session = await mtnSSOAuth.getAuthSession();

    if (!session.success) {
      return NextResponse.json({
        valid: false,
        error: session.error
      }, { status: 503 });
    }

    const expiresAt = session.expiresAt;
    const now = new Date();
    const timeLeftMs = expiresAt ? expiresAt.getTime() - now.getTime() : 0;
    const minutesLeft = Math.floor(timeLeftMs / 60000);

    return NextResponse.json({
      valid: true,
      expiresAt: expiresAt?.toISOString(),
      minutesLeft,
      needsRefresh: minutesLeft < 10
    });

  } catch (error) {
    return NextResponse.json({
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
