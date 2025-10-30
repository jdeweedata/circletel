import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
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

  // Refresh session and get current user
  const { data: { user }, error } = await supabase.auth.getUser();

  console.log('[Middleware] Session refresh result:', {
    pathname,
    hasUser: !!user,
    userId: user?.id,
    userEmail: user?.email,
    error: error?.message
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
  if (pathname.startsWith('/admin') && !isPublicAdminRoute &&!user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/admin/login';
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If logged in and trying to access login/signup, redirect to dashboard
  if (isPublicAdminRoute && user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/admin';
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    '/admin/:path*',
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
