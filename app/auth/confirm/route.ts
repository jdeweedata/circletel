import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

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
 *
 * IMPORTANT: Uses @supabase/ssr createServerClient to properly persist
 * session cookies after verifyOtp(). This ensures the session is available
 * when the user is redirected to /auth/reset-password.
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

  // We need to track cookies that need to be set on the response
  // since we can't set cookies until we have the response object
  let cookiesToSet: { name: string; value: string; options: any }[] = [];

  try {
    // Create SSR-aware Supabase client that properly handles cookies
    // This ensures the session from verifyOtp() is persisted to browser cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookies) {
            // Store cookies to set on response later
            cookiesToSet = cookies;
          },
        },
      }
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

    // Apply cookies from Supabase SSR client
    // This properly sets the session cookies with correct names (sb-<project>-auth-token)
    // so the browser client and middleware can read the session
    if (cookiesToSet.length > 0) {
      console.log('[Auth Confirm] Setting', cookiesToSet.length, 'session cookies');
      cookiesToSet.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options);
      });
    } else if (data.session) {
      // Fallback: If SSR client didn't set cookies (shouldn't happen),
      // log a warning for debugging
      console.warn('[Auth Confirm] Session exists but no cookies were set by SSR client');
    }

    return response;

  } catch (error) {
    console.error('[Auth Confirm] Unexpected error:', error);
    return NextResponse.redirect(
      new URL('/auth/login?error=server_error&message=An unexpected error occurred', request.url)
    );
  }
}
