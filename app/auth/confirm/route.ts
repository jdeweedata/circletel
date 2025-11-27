import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Auth Confirm Route
 * 
 * Handles token-based email verification for:
 * - Password recovery (type=recovery)
 * - Email verification (type=signup, type=email_change)
 * - Magic link login (type=magiclink)
 * 
 * This route allows Supabase email templates to use your domain
 * instead of the default Supabase URL, improving email deliverability.
 * 
 * Usage in Supabase email template:
 * <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery">Reset Password</a>
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as 'recovery' | 'signup' | 'email_change' | 'magiclink' | null;
  const next = searchParams.get('next') || '/';

  // Validate required parameters
  if (!token_hash || !type) {
    console.error('[Auth Confirm] Missing token_hash or type');
    return NextResponse.redirect(
      new URL('/auth/login?error=invalid_link&message=Invalid or expired link', request.url)
    );
  }

  try {
    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Verify the OTP token
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type,
    });

    if (error) {
      console.error('[Auth Confirm] Token verification failed:', error.message);
      
      // Determine appropriate error redirect based on type
      const errorRedirect = type === 'recovery' 
        ? '/auth/forgot-password?error=expired&message=Reset link has expired. Please request a new one.'
        : '/auth/login?error=verification_failed&message=Verification failed. Please try again.';
      
      return NextResponse.redirect(new URL(errorRedirect, request.url));
    }

    console.log('[Auth Confirm] Token verified successfully for type:', type);

    // Determine redirect based on verification type
    let redirectUrl: string;

    switch (type) {
      case 'recovery':
        // Password reset - redirect to reset password page
        // The session is now set, user can update their password
        redirectUrl = '/auth/reset-password';
        break;
      
      case 'signup':
      case 'email_change':
        // Email verification - redirect to dashboard or specified next URL
        redirectUrl = next || '/dashboard';
        break;
      
      case 'magiclink':
        // Magic link login - redirect to dashboard or specified next URL
        redirectUrl = next || '/dashboard';
        break;
      
      default:
        redirectUrl = '/';
    }

    // Create response with redirect
    const response = NextResponse.redirect(new URL(redirectUrl, request.url));

    // If we have a session, we need to set the cookies
    // The verifyOtp call should have set the session, but we ensure cookies are set
    if (data.session) {
      // Set auth cookies for the session
      response.cookies.set('sb-access-token', data.session.access_token, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: data.session.expires_in,
      });
      
      response.cookies.set('sb-refresh-token', data.session.refresh_token, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }

    return response;

  } catch (error) {
    console.error('[Auth Confirm] Unexpected error:', error);
    return NextResponse.redirect(
      new URL('/auth/login?error=server_error&message=An unexpected error occurred', request.url)
    );
  }
}
