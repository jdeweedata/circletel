import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Get current session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const pathname = request.nextUrl.pathname;

  // Public admin routes (login, signup, forgot password, reset password)
  const publicAdminRoutes = [
    '/admin/login',
    '/admin/signup',
    '/admin/forgot-password',
    '/admin/reset-password',
  ];

  const isPublicAdminRoute = publicAdminRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // If accessing admin routes (excluding public routes)
  if (pathname.startsWith('/admin') && !isPublicAdminRoute) {
    // If no session, redirect to login
    if (!session) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/admin/login';
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Check if user exists in admin_users table
    const { data: adminUser, error } = await supabase
      .from('admin_users')
      .select('id, is_active, role')
      .eq('id', session.user.id)
      .maybeSingle();

    // If user is not an admin or account is inactive, redirect to login
    if (error || !adminUser || !adminUser.is_active) {
      // Clear session
      await supabase.auth.signOut();

      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/admin/login';
      redirectUrl.searchParams.set('error', 'unauthorized');
      return NextResponse.redirect(redirectUrl);
    }
  }

  // If logged in and trying to access login/signup, redirect to dashboard
  if (isPublicAdminRoute && session) {
    // Check if user is an admin
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id, is_active')
      .eq('id', session.user.id)
      .maybeSingle();

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
