import { UNJANI_CORPORATE_CODE } from '@/lib/billing/unjani-connect-rules';

/** Public Unjani Connect app. Shared portal modules live under lib/portal and /api/portal. */
export const UNJANI_APP_BASE = '/unjani';

export const UNJANI_LOGIN_HREF = '/auth/login?account=unjani';

export function isUnjaniAppPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return pathname === UNJANI_APP_BASE || pathname.startsWith(`${UNJANI_APP_BASE}/`);
}

export function isLegacyPortalPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return pathname === '/portal' || pathname.startsWith('/portal/');
}

export function isUnjaniCorporateCode(code: string | null | undefined): boolean {
  return (code ?? '').trim().toUpperCase() === UNJANI_CORPORATE_CODE;
}

/** Map a legacy /portal URL onto /unjani. Other paths fall back to the Unjani home. */
export function safeUnjaniRedirect(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return UNJANI_APP_BASE;
  if (isUnjaniAppPath(raw)) return raw;
  if (isLegacyPortalPath(raw)) {
    const rest = raw.slice('/portal'.length);
    return rest ? `${UNJANI_APP_BASE}${rest}` : UNJANI_APP_BASE;
  }
  return UNJANI_APP_BASE;
}

export type PortalAccountLane = 'personal' | 'unjani';

/** `business` is the old login tab; it now opens Unjani Connect. */
export function parsePortalAccountLane(raw: string | null | undefined): PortalAccountLane {
  if (raw === 'unjani' || raw === 'business') return 'unjani';
  return 'personal';
}
