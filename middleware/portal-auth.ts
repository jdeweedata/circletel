import { NextResponse, type NextRequest } from 'next/server';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { isUnjaniAppPath, isUnjaniCorporateCode } from '@/lib/portal/paths';

const PUBLIC_UNJANI_ROUTES = ['/unjani/login'] as const;

export function isPublicPortalRoute(pathname: string): boolean {
  return PUBLIC_UNJANI_ROUTES.some((route) => pathname.startsWith(route));
}

export function isPortalRoute(pathname: string): boolean {
  return isUnjaniAppPath(pathname);
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
    redirectUrl.pathname = '/auth/login';
    redirectUrl.searchParams.set('account', 'unjani');
    redirectUrl.searchParams.set('redirect', pathname);

    return {
      shouldRedirect: true,
      redirectResponse: NextResponse.redirect(redirectUrl),
      user: null,
    };
  }

  const { data: portalUser, error: portalError } = await supabase
    .from('b2b_portal_users')
    .select('id, corporate_accounts!inner (corporate_code)')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (portalError) {
    console.warn('Portal user lookup error', { error: portalError.message });
  }

  const org = portalUser?.corporate_accounts as
    | { corporate_code?: string }
    | { corporate_code?: string }[]
    | null
    | undefined;
  const code = Array.isArray(org) ? org[0]?.corporate_code : org?.corporate_code;

  if (!portalUser || !isUnjaniCorporateCode(code)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/auth/login';
    redirectUrl.searchParams.set('account', 'unjani');
    redirectUrl.searchParams.set('error', 'no_portal_access');

    return {
      shouldRedirect: true,
      redirectResponse: NextResponse.redirect(redirectUrl),
      user: null,
    };
  }

  return { shouldRedirect: false, user };
}
