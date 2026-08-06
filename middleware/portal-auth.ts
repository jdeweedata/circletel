import { NextResponse, type NextRequest } from 'next/server';
import type { SupabaseClient, User } from '@supabase/supabase-js';

const PUBLIC_PORTAL_ROUTES = [
  '/portal/login',
] as const;

export function isPublicPortalRoute(pathname: string): boolean {
  return PUBLIC_PORTAL_ROUTES.some((route) => pathname.startsWith(route));
}

export function isPortalRoute(pathname: string): boolean {
  return pathname.startsWith('/portal');
}

export interface PortalAuthResult {
  shouldRedirect: boolean;
  redirectResponse?: NextResponse;
  user: User | null;
}

export async function handlePortalAuth(
  request: NextRequest,
  supabase: SupabaseClient
): Promise<PortalAuthResult> {
  const pathname = request.nextUrl.pathname;

  if (!isPortalRoute(pathname)) {
    return { shouldRedirect: false, user: null };
  }

  if (isPublicPortalRoute(pathname)) {
    return { shouldRedirect: false, user: null };
  }

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.warn('Portal session retrieval error', { error: error.message });
  }

  const user = session?.user || null;

  if (!user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/portal/login';
    redirectUrl.searchParams.set('redirect', pathname);

    return {
      shouldRedirect: true,
      redirectResponse: NextResponse.redirect(redirectUrl),
      user: null,
    };
  }

  // Require a b2b_portal_users mapping (RLS: own row)
  const { data: portalUser, error: portalError } = await supabase
    .from('b2b_portal_users')
    .select('id')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (portalError) {
    console.warn('Portal user lookup error', { error: portalError.message });
  }

  if (!portalUser) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/portal/login';
    redirectUrl.searchParams.set('error', 'no_portal_access');

    // Sign-out is client-side; redirect away from protected pages
    return {
      shouldRedirect: true,
      redirectResponse: NextResponse.redirect(redirectUrl),
      user: null,
    };
  }

  return { shouldRedirect: false, user };
}
