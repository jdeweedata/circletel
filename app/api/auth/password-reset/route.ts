/**
 * Custom Password Reset API Endpoint
 * 
 * Uses Supabase Admin API to generate reset link and sends
 * a custom branded email via Resend with the customer's first name.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { render } from '@react-email/render';
import PasswordResetEmail from '@/emails/templates/consumer/password-reset';
import { apiLogger } from '@/lib/logging';

// Initialize Supabase Admin client
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

// Resend API configuration
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'CircleTel <noreply@notifications.circletelsa.co.za>';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if user exists in auth.users
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (userError) {
      apiLogger.error('Error listing users', { error: userError });
      // Don't reveal if user exists or not for security
      return NextResponse.json({ 
        success: true, 
        message: 'If an account exists with this email, a password reset link will be sent.' 
      });
    }

    const user = userData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (!user) {
      // Don't reveal if user exists - return success anyway
      apiLogger.info('Password reset requested for non-existent email', { email });
      return NextResponse.json({ 
        success: true, 
        message: 'If an account exists with this email, a password reset link will be sent.' 
      });
    }

    // Look up customer's first name from customers table
    const { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .select('first_name, last_name')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (customerError) {
      apiLogger.error('Error fetching customer', { error: customerError });
    }

    const firstName = customer?.first_name || 'Customer';

    // Generate password reset link using Admin API
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.circletel.co.za';
    const redirectTo = `${baseUrl}/auth/reset-password`;
    
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo,
      },
    });

    if (linkError) {
      apiLogger.error('Error generating reset link', { error: linkError });
      return NextResponse.json(
        { error: 'Failed to generate reset link. Please try again.' },
        { status: 500 }
      );
    }

    // Log the full response for debugging
    apiLogger.info('generateLink response', { linkData });

    // The action_link goes through Supabase's verify endpoint
    // We need to extract the token and build our own URL that goes through /auth/confirm
    const actionLink = linkData.properties?.action_link;
    let tokenHash = linkData.properties?.hashed_token;

    // If hashed_token is not directly available, extract it from the action_link
    // action_link format: https://project.supabase.co/auth/v1/verify?token=<hash>&type=recovery&...
    if (!tokenHash && actionLink) {
      try {
        const actionUrl = new URL(actionLink);
        tokenHash = actionUrl.searchParams.get('token') || undefined;
        apiLogger.info('Extracted token_hash from action_link', { found: !!tokenHash });
      } catch (e) {
        apiLogger.error('Failed to parse action_link', { error: e });
      }
    }

    if (!actionLink && !tokenHash) {
      apiLogger.error('No action_link or hashed_token in response', { linkData });
      return NextResponse.json(
        { error: 'Failed to generate reset link. Please try again.' },
        { status: 500 }
      );
    }

    // Build the reset URL that goes through our /auth/confirm endpoint
    // This ensures proper token verification and session handling
    let resetUrl: string;

    if (tokenHash) {
      // Use our confirm endpoint with the token hash
      resetUrl = `${baseUrl}/auth/confirm?token_hash=${tokenHash}&type=recovery`;
      apiLogger.info('Using custom /auth/confirm route with token_hash');
    } else {
      // Fallback to the action_link from Supabase (should not happen with extraction above)
      apiLogger.warn('Falling back to Supabase action_link - token extraction failed');
      resetUrl = actionLink!;
    }
    
    apiLogger.info('Reset URL being sent', { resetUrl });

    // Render the email template
    const emailHtml = await render(
      PasswordResetEmail({
        firstName,
        resetUrl,
        expiresIn: '1 hour',
      })
    );

    // Send email via Resend
    if (!RESEND_API_KEY) {
      apiLogger.error('RESEND_API_KEY not configured');
      return NextResponse.json(
        { error: 'Email service not configured' },
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
        subject: 'Reset Your Password - CircleTel',
        html: emailHtml,
      }),
    });

    if (!resendResponse.ok) {
      const errorData = await resendResponse.json();
      apiLogger.error('Resend API error', { errorData });
      return NextResponse.json(
        { error: 'Failed to send email. Please try again.' },
        { status: 500 }
      );
    }

    const resendResult = await resendResponse.json();
    apiLogger.info('Password reset email sent', { email, messageId: resendResult.id });

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a password reset link will be sent.',
    });

  } catch (error) {
    apiLogger.error('Password reset error', { error });
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
