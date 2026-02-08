/**
 * Admin Authentication Handler
 *
 * Handles authentication checks for admin routes.
 * Redirects unauthenticated users to login page.
 */

import { NextResponse, type NextRequest } from 'next/server';
import type { SupabaseClient, User } from '@supabase/supabase-js';

// Note: Using console.log in middleware as @/lib/logging may not work in edge runtime

/**
 * Public admin routes that don't require authentication
 */
const PUBLIC_ADMIN_ROUTES = [
  '/admin/login',
  '/admin/signup',
  '/admin/forgot-password',
  '/admin/reset-password',
] as const;

/**
 * Check if a path is a public admin route
 */
export function isPublicAdminRoute(pathname: string): boolean {
  return PUBLIC_ADMIN_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Check if a path is an admin route
 */
export function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith('/admin');
}

/**
 * Get the current user from Supabase session
 *
 * @param supabase - Supabase client
 * @returns The user object or null
 */
export async function getSessionUser(
  supabase: SupabaseClient
): Promise<User | null> {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error) {
    console.warn('Session retrieval error', { error: error.message });
  }

  return session?.user || null;
}

export interface AdminAuthResult {
  shouldRedirect: boolean;
  redirectResponse?: NextResponse;
  user: User | null;
}

/**
 * Handle admin route authentication
 *
 * @param request - The incoming request
 * @param supabase - Supabase client
 * @returns Auth result with redirect information
 */
export async function handleAdminAuth(
  request: NextRequest,
  supabase: SupabaseClient
): Promise<AdminAuthResult> {
  const pathname = request.nextUrl.pathname;
  const user = await getSessionUser(supabase);

  // Debug logging removed - middleware edge runtime constraints
  // console.debug('Admin auth check', { pathname, hasUser: !!user, userId: user?.id });

  // Not an admin route - no auth needed
  if (!isAdminRoute(pathname)) {
    return { shouldRedirect: false, user };
  }

  // Public admin route - allow access
  if (isPublicAdminRoute(pathname)) {
    // Even if user is logged in, let the page handle redirect
    // This avoids middleware redirect loops
    return { shouldRedirect: false, user };
  }

  // Protected admin route without authentication
  if (!user) {
    // console.log('Unauthenticated access to admin route', { pathname });

    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/admin/login';
    redirectUrl.searchParams.set('redirect', pathname);

    return {
      shouldRedirect: true,
      redirectResponse: NextResponse.redirect(redirectUrl),
      user: null,
    };
  }

  // User is authenticated - let client-side verify admin_users table
  // This avoids redirect loops and works with existing layout auth logic
  return { shouldRedirect: false, user };
}
