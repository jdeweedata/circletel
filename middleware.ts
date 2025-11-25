import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  
  // SUBDOMAIN ROUTING: studio.circletel.co.za -> /admin/cms
  // This allows the studio subdomain to serve the CMS content
  // IMPORTANT: Skip rewrite for API routes, static files, and CMS routes
  const isStudioSubdomain = hostname.startsWith('studio.');

  if (isStudioSubdomain &&
      !url.pathname.startsWith('/admin/cms') &&
      !url.pathname.startsWith('/api/') &&
      !url.pathname.startsWith('/_next/') &&
      !url.pathname.startsWith('/static/')) {
    console.log(`[Middleware] Rewriting subdomain ${hostname} to /admin/cms${url.pathname}`);
    url.pathname = `/admin/cms${url.pathname === '/' ? '' : url.pathname}`;
    return NextResponse.rewrite(url);
  }

  // IMPORTANT: Initial response uses headers only, not full request
  // Cookies will be added via setAll() callback
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const pathname = request.nextUrl.pathname;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const cookies = request.cookies.getAll();
          const authCookie = cookies.find(c => c.name.includes('auth-token'));
          console.log('[Middleware] Cookies:', {
            count: cookies.length,
            hasAuthCookie: !!authCookie,
            authCookiePreview: authCookie ? authCookie.value.substring(0, 50) + '...' : 'none'
          });
          return cookies;
        },
        setAll(cookiesToSet) {
          console.log('[Middleware] Setting cookies count:', cookiesToSet.length);
          // Step 1: Update request cookies (for server-side reads in this request)
          // Note: request.cookies.set() does NOT accept options parameter
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Step 2: Create new response with updated request
          response = NextResponse.next({
            request,
          });
          // Step 3: Set cookies on response (for browser) WITH options
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Get session from cookies (fast - no API call needed)
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  const user = session?.user || null;

  console.log('[Middleware] Session check:', {
    pathname,
    hasSession: !!session,
    hasUser: !!user,
    userId: user?.id,
    userEmail: user?.email,
    error: sessionError?.message
  });

  // Public admin routes
  const publicAdminRoutes = [
    '/admin/login',
    '/admin/signup',
    '/admin/forgot-password',
    '/admin/reset-password',
  ];

  const isPublicAdminRoute = publicAdminRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // If accessing protected admin routes without authentication
  if (pathname.startsWith('/admin') && !isPublicAdminRoute) {
    if (!user) {
      // No user session at all - redirect to login
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/admin/login';
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // User has session - let the client-side layout verify admin_users table
    // This avoids redirect loops and works with the existing layout auth logic
  }

  // If logged in and trying to access login/signup pages, allow it
  // The login page itself will handle redirecting authenticated users
  // This avoids middleware redirect loops
  if (isPublicAdminRoute && user) {
    // Let the login page handle the redirect decision
    return response;
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder content
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
