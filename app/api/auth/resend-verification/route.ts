/**
 * Resend Verification Email API Endpoint
 *
 * Fallback when Supabase's built-in mailer fails to send confirmation emails.
 * Uses Supabase Admin API to generate a signup verification link,
 * then sends a branded email via Resend.
 *
 * Pattern follows: app/api/auth/password-reset/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { createClient } from '@supabase/supabase-js';
import { render } from '@react-email/render';
import EmailVerificationEmail from '@/emails/templates/consumer/email-verification';
import { apiLogger } from '@/lib/logging';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'CircleTel <noreply@notifications.circletelsa.co.za>';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Look up customer's first name
    const { data: customer } = await supabaseAdmin
      .from('customers')
      .select('first_name')
      .eq('email', email)
      .maybeSingle();

    const firstName = customer?.first_name || 'Customer';

    // Generate signup verification link using Admin API
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.circletel.co.za';

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email: email,
      options: {
        redirectTo: `${baseUrl}/auth/callback`,
      },
    });

    if (linkError) {
      apiLogger.error('[Resend Verification] Error generating verification link', { error: linkError });
      return NextResponse.json(
        { success: false, error: 'Failed to generate verification link.' },
        { status: 500 }
      );
    }

    // Extract token_hash from the action_link or hashed_token
    const actionLink = linkData.properties?.action_link;
    let tokenHash: string | undefined = linkData.properties?.hashed_token;

    if (!tokenHash && actionLink) {
      try {
        const actionUrl = new URL(actionLink);
        tokenHash = actionUrl.searchParams.get('token') || undefined;
      } catch (e) {
        apiLogger.error('[Resend Verification] Failed to parse action_link', { error: e });
      }
    }

    if (!actionLink && !tokenHash) {
      apiLogger.error('[Resend Verification] No action_link or hashed_token', { linkData });
      return NextResponse.json(
        { success: false, error: 'Failed to generate verification link.' },
        { status: 500 }
      );
    }

    // Build verification URL through our /auth/confirm endpoint
    let verifyUrl: string;
    if (tokenHash) {
      verifyUrl = `${baseUrl}/auth/confirm?token_hash=${tokenHash}&type=signup`;
    } else {
      verifyUrl = actionLink!;
    }

    // Render the email template
    const emailHtml = await render(
      EmailVerificationEmail({
        firstName,
        verifyUrl,
        expiresIn: '10 minutes',
      })
    );

    // Send via Resend
    if (!RESEND_API_KEY) {
      apiLogger.error('[Resend Verification] RESEND_API_KEY not configured');
      return NextResponse.json(
        { success: false, error: 'Email service not configured' },
        { status: 500 }
      );
    }

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: email,
        subject: 'Verify Your Email — CircleTel',
        html: emailHtml,
      }),
    });

    if (!resendResponse.ok) {
      const errorData = await resendResponse.json();
      apiLogger.error('[Resend Verification] Resend API error', { errorData });
      return NextResponse.json(
        { success: false, error: 'Failed to send verification email.' },
        { status: 500 }
      );
    }

    const resendResult = await resendResponse.json();
    apiLogger.info('[Resend Verification] Email sent', { email, messageId: resendResult.id });

    return NextResponse.json({ success: true });

  } catch (error) {
    apiLogger.error('[Resend Verification] Unexpected error', { error });
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
