import { NextResponse, type NextRequest } from 'next/server';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import {
  BUSINESS_LOGIN_HREF,
  isBusinessAppPath,
  isPortalAppPath,
  isUnjaniAppPath,
  isUnjaniCorporateCode,
  mapBusinessAppPath,
  PORTAL_APP_BASE,
  UNJANI_APP_BASE,
} from '@/lib/portal/paths';

const PUBLIC_PORTAL_ROUTES = ['/unjani/login', '/portal/login'] as const;

export function isPublicPortalRoute(pathname: string): boolean {
  return PUBLIC_PORTAL_ROUTES.some((route) => pathname.startsWith(route));
}

export function isPortalRoute(pathname: string): boolean {
  return isBusinessAppPath(pathname);
}

export interface PortalAuthResult {
  shouldRedirect: boolean;
  redirectResponse?: NextResponse;
  user: User | null;
}

function loginRedirect(
  request: NextRequest,
  extra?: { redirect?: string; error?: string }
): NextResponse {
  const redirectUrl = request.nextUrl.clone();
  const [path, query] = BUSINESS_LOGIN_HREF.split('?');
  redirectUrl.pathname = path;
  redirectUrl.search = '';
  const params = new URLSearchParams(query);
  if (extra?.redirect) params.set('redirect', extra.redirect);
  if (extra?.error) params.set('error', extra.error);
  redirectUrl.search = params.toString();
  return NextResponse.redirect(redirectUrl);
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
    return {
      shouldRedirect: true,
      redirectResponse: loginRedirect(request, { redirect: pathname }),
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

  if (!portalUser) {
    return {
      shouldRedirect: true,
      redirectResponse: loginRedirect(request, { error: 'no_portal_access' }),
      user: null,
    };
  }

  if (isUnjaniCorporateCode(code)) {
    if (isPortalAppPath(pathname)) {
      const target = request.nextUrl.clone();
      target.pathname = mapBusinessAppPath(pathname, UNJANI_APP_BASE);
      return {
        shouldRedirect: true,
        redirectResponse: NextResponse.redirect(target),
        user,
      };
    }
    return { shouldRedirect: false, user };
  }

  if (isUnjaniAppPath(pathname)) {
    const target = request.nextUrl.clone();
    target.pathname = PORTAL_APP_BASE;
    target.search = '';
    return {
      shouldRedirect: true,
      redirectResponse: NextResponse.redirect(target),
      user,
    };
  }

  return { shouldRedirect: false, user };
}
