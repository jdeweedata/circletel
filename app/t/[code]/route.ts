/**
 * Short Tracking URL Handler
 *
 * GET /t/[code] - Redirect to /api/track/[code]
 *
 * This provides a cleaner URL for ambassadors to share:
 * circletel.co.za/t/JOHN20 instead of circletel.co.za/api/track/JOHN20
 */

import { NextRequest, NextResponse } from 'next/server';
import { trackClick } from '@/lib/marketing/attribution-service';
import { v4 as uuidv4 } from 'uuid';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await context.params;

    if (!code) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Get client info
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const userAgent = request.headers.get('user-agent') || '';
    const referrer = request.headers.get('referer') || '';

    // Generate or get session ID from cookie
    let sessionId = request.cookies.get('ct_session')?.value;
    if (!sessionId) {
      sessionId = uuidv4();
    }

    // Track the click
    const result = await trackClick(code, {
      session_id: sessionId,
      ip_address: ip,
      user_agent: userAgent,
      referrer_url: referrer,
    });

    // Build destination URL
    let destinationUrl: URL;
    try {
      if (result.destination.startsWith('http')) {
        destinationUrl = new URL(result.destination);
      } else {
        destinationUrl = new URL(result.destination, request.url);
      }
    } catch {
      destinationUrl = new URL('/', request.url);
    }

    // Add tracking params to destination
    destinationUrl.searchParams.set('ref', code.toUpperCase());

    // Create redirect response
    const response = NextResponse.redirect(destinationUrl);

    // Set session cookie if new
    if (!request.cookies.get('ct_session')) {
      response.cookies.set('ct_session', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      });
    }

    // Set attribution cookie for later conversion tracking
    response.cookies.set('ct_ref', code.toUpperCase(), {
      httpOnly: false, // Allow JS access for conversion tracking
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Short track URL error:', error);
    // Always redirect to home on error
    return NextResponse.redirect(new URL('/', request.url));
  }
}
