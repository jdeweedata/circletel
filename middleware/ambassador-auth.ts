/**
 * Ambassador Authentication Handler
 *
 * Handles authentication checks for ambassador portal routes.
 * Redirects unauthenticated users to ambassador login page.
 */

import { NextResponse, type NextRequest } from 'next/server';
import type { SupabaseClient, User } from '@supabase/supabase-js';

/**
 * Public ambassador routes that don't require authentication
 */
const PUBLIC_AMBASSADOR_ROUTES = [
  '/ambassadors/login',
  '/ambassadors/register',
] as const;

/**
 * Check if a path is a public ambassador route
 */
export function isPublicAmbassadorRoute(pathname: string): boolean {
  return PUBLIC_AMBASSADOR_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Check if a path is an ambassador route
 */
export function isAmbassadorRoute(pathname: string): boolean {
  return pathname.startsWith('/ambassadors');
}

export interface AmbassadorAuthResult {
  shouldRedirect: boolean;
  redirectResponse?: NextResponse;
  user: User | null;
}

/**
 * Handle ambassador route authentication
 *
 * @param request - The incoming request
 * @param supabase - Supabase client
 * @returns Auth result with redirect information
 */
export async function handleAmbassadorAuth(
  request: NextRequest,
  supabase: SupabaseClient
): Promise<AmbassadorAuthResult> {
  const pathname = request.nextUrl.pathname;

  // Not an ambassador route - no auth needed
  if (!isAmbassadorRoute(pathname)) {
    return { shouldRedirect: false, user: null };
  }

  // Public ambassador route - allow access
  if (isPublicAmbassadorRoute(pathname)) {
    return { shouldRedirect: false, user: null };
  }

  // Get user session
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.warn('Ambassador session retrieval error', { error: error.message });
  }

  const user = session?.user || null;

  // Protected ambassador route without authentication
  if (!user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/ambassadors/login';
    redirectUrl.searchParams.set('redirect', pathname);

    return {
      shouldRedirect: true,
      redirectResponse: NextResponse.redirect(redirectUrl),
      user: null,
    };
  }

  // User is authenticated - let client-side verify ambassador status
  // This avoids redirect loops and works with existing layout auth logic
  return { shouldRedirect: false, user };
}
