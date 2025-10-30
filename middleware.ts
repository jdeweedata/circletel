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
  if (pathname.startsWith('/admin') && !isPublicAdminRoute) {
    if (!user) {
      // No user session at all
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/admin/login';
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // User has session, but verify they're in admin_users table
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('id, is_active')
      .eq('id', user.id)
      .single();

    if (adminError || !adminUser || !adminUser.is_active) {
      // User not in admin_users or inactive - redirect to login
      // Let the layout handle signOut to avoid middleware redirect loops
      console.log('[Middleware] User not authorized as admin:', {
        userId: user.id,
        error: adminError?.message,
        hasAdminUser: !!adminUser,
        isActive: adminUser?.is_active
      });

      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/admin/login';
      redirectUrl.searchParams.set('error', 'unauthorized');
      redirectUrl.searchParams.set('signout', 'true'); // Tell layout to sign out
      return NextResponse.redirect(redirectUrl);
    }
  }

  // If logged in as admin and trying to access login/signup, redirect to dashboard
  // BUT skip this if signout=true is present (user is being signed out)
  if (isPublicAdminRoute && user) {
    const signoutParam = request.nextUrl.searchParams.get('signout');

    // If signout=true, let them access the login page to sign out
    if (signoutParam === 'true') {
      return response;
    }

    // Verify they're actually an admin before redirecting
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id, is_active')
      .eq('id', user.id)
      .single();

    if (adminUser && adminUser.is_active) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/admin';
      return NextResponse.redirect(redirectUrl);
    }
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
