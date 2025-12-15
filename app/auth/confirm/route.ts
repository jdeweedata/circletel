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
 *
 * LINK PREVIEW BOT PROTECTION:
 * For password recovery, this route redirects to an intermediate page that requires
 * user interaction (button click) before verifying the token. This prevents email
 * security tools (Outlook SafeLinks, Proofpoint, etc.) from consuming one-time tokens.
 */

// Common link preview bot user agents
const BOT_USER_AGENTS = [
  'outlook-express',
  'microsoft office',
  'ms office',
  'safelinks',
  'proofpoint',
  'barracuda',
  'mimecast',
  'fireeye',
  'symantec',
  'messagelabs',
  'fortigate',
  'fortiguard',
  'websense',
  'mcafee',
  'ironport',
  'sophos',
  'trend micro',
  'paloalto',
  'cisco',
  'zscaler',
  'facebookexternalhit',
  'twitterbot',
  'linkedinbot',
  'slackbot',
  'telegrambot',
  'whatsapp',
  'discordbot',
  'googlebot',
  'bingbot',
  'baiduspider',
  'yandex',
  'duckduckbot',
  'bot',
  'crawler',
  'spider',
  'preview',
  'fetch',
  'urllib',
  'python-requests',
  'go-http-client',
  'java/',
  'curl/',
  'wget/',
];

function isLinkPreviewBot(userAgent: string | null): boolean {
  if (!userAgent) return false;
  const lowerUA = userAgent.toLowerCase();
  return BOT_USER_AGENTS.some(bot => lowerUA.includes(bot));
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as 'recovery' | 'signup' | 'email_change' | 'magiclink' | null;
  const next = searchParams.get('next') || '/';
  const confirmed = searchParams.get('confirmed') === 'true';
  const userAgent = request.headers.get('user-agent');

  // Validate required parameters
  if (!token_hash || !type) {
    console.error('[Auth Confirm] Missing token_hash or type');
    return NextResponse.redirect(
      new URL('/auth/login?error=invalid_link&message=Invalid or expired link', request.url)
    );
  }

  // LINK PREVIEW BOT PROTECTION for password recovery
  // Redirect to intermediate page unless user has confirmed (clicked button)
  if (type === 'recovery' && !confirmed) {
    const isBot = isLinkPreviewBot(userAgent);
    console.log('[Auth Confirm] Recovery request - User-Agent:', userAgent?.substring(0, 100), '| IsBot:', isBot);

    // Always redirect to confirmation page for recovery tokens
    // This ensures the token isn't consumed by bots OR by the initial GET request
    const confirmUrl = new URL('/auth/confirm-reset', request.url);
    confirmUrl.searchParams.set('token_hash', token_hash);
    confirmUrl.searchParams.set('type', type);
    if (next && next !== '/') {
      confirmUrl.searchParams.set('next', next);
    }

    console.log('[Auth Confirm] Redirecting to confirmation page:', confirmUrl.pathname);
    return NextResponse.redirect(confirmUrl);
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
      console.error('[Auth Confirm] Token verification failed:', error.message, '| Type:', type);

      // Determine appropriate error redirect based on type
      const errorRedirect = type === 'recovery'
        ? '/auth/forgot-password?error=expired&message=Reset link has expired. Please request a new one.'
        : '/auth/login?error=verification_failed&message=Verification failed. Please try again.';

      console.log('[Auth Confirm] Redirecting to error page:', errorRedirect);
      return NextResponse.redirect(new URL(errorRedirect, request.url));
    }

    console.log('[Auth Confirm] Token verified successfully for type:', type);
    console.log('[Auth Confirm] Session data:', data.session ? 'Session exists' : 'No session');

    // If we have a session, manually prepare the cookie data
    // The SSR client's setAll might not be called automatically by verifyOtp
    if (data.session && cookiesToSet.length === 0) {
      console.log('[Auth Confirm] Manually preparing session cookies...');
      const projectRef = 'agyjovdugmtopasyvlng';
      const cookieName = `sb-${projectRef}-auth-token`;

      // Supabase stores session as base64-encoded JSON chunks
      const sessionData = {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        expires_in: data.session.expires_in,
        token_type: data.session.token_type,
        user: data.session.user,
      };

      const sessionStr = JSON.stringify(sessionData);
      // Split into chunks if needed (Supabase does this for large cookies)
      const base64Session = Buffer.from(sessionStr).toString('base64');

      cookiesToSet = [{
        name: cookieName,
        value: base64Session,
        options: {
          path: '/',
          httpOnly: false, // Supabase client needs to read this
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax' as const,
          maxAge: 60 * 60 * 24 * 7, // 7 days
        },
      }];

      console.log('[Auth Confirm] Prepared manual session cookie');
    }

    // Determine redirect based on verification type
    let redirectUrl: URL;

    switch (type) {
      case 'recovery':
        // Password reset - redirect to reset password page
        // IMPORTANT: Pass tokens via URL hash so client-side can establish session
        // This is necessary because server-side cookies and client-side localStorage
        // use different storage mechanisms in the current Supabase setup
        redirectUrl = new URL('/auth/reset-password', request.url);
        if (data.session) {
          // Pass tokens in hash fragment (same format as Supabase default magic links)
          redirectUrl.hash = `access_token=${data.session.access_token}&refresh_token=${data.session.refresh_token}&type=recovery`;
          console.log('[Auth Confirm] Passing tokens via URL hash for recovery flow');
        }
        break;
      
      case 'signup':
      case 'email_change':
        // Email verification - redirect to dashboard or specified next URL
        redirectUrl = new URL(next || '/dashboard', request.url);
        break;
      
      case 'magiclink':
        // Magic link login - redirect to dashboard or specified next URL
        redirectUrl = new URL(next || '/dashboard', request.url);
        break;
      
      default:
        redirectUrl = new URL('/', request.url);
    }

    // Create response with redirect
    const response = NextResponse.redirect(redirectUrl);

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
