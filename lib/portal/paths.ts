import { UNJANI_CORPORATE_CODE } from '@/lib/billing/unjani-connect-rules';

export const UNJANI_APP_BASE = '/unjani';
export const PORTAL_APP_BASE = '/portal';
export const BUSINESS_LOGIN_HREF = '/auth/login?account=business';

/** @deprecated Use BUSINESS_LOGIN_HREF. Old Unjani login links still work. */
export const UNJANI_LOGIN_HREF = BUSINESS_LOGIN_HREF;

export function isUnjaniAppPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return pathname === UNJANI_APP_BASE || pathname.startsWith(`${UNJANI_APP_BASE}/`);
}

export function isPortalAppPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return pathname === PORTAL_APP_BASE || pathname.startsWith(`${PORTAL_APP_BASE}/`);
}

export function isBusinessAppPath(pathname: string | null | undefined): boolean {
  return isUnjaniAppPath(pathname) || isPortalAppPath(pathname);
}

/** @deprecated Use isPortalAppPath. */
export function isLegacyPortalPath(pathname: string | null | undefined): boolean {
  return isPortalAppPath(pathname);
}

export function isUnjaniCorporateCode(code: string | null | undefined): boolean {
  return (code ?? '').trim().toUpperCase() === UNJANI_CORPORATE_CODE;
}

export function homeForOrganisation(code: string | null | undefined): string {
  return isUnjaniCorporateCode(code) ? UNJANI_APP_BASE : PORTAL_APP_BASE;
}

function restAfterBase(pathname: string, base: string): string {
  if (pathname === base) return '';
  if (pathname.startsWith(`${base}/`)) return pathname.slice(base.length);
  return '';
}

const UNJANI_ONLY_PREFIXES = ['/coverage'];

function isUnjaniOnlyRest(rest: string): boolean {
  return UNJANI_ONLY_PREFIXES.some(
    (prefix) => rest === prefix || rest.startsWith(`${prefix}/`)
  );
}

/** Rewrite a /portal or /unjani path onto the other app, keeping the rest. */
export function mapBusinessAppPath(
  pathname: string,
  toBase: typeof UNJANI_APP_BASE | typeof PORTAL_APP_BASE
): string {
  if (isUnjaniAppPath(pathname)) {
    const rest = restAfterBase(pathname, UNJANI_APP_BASE);
    return rest ? `${toBase}${rest}` : toBase;
  }
  if (isPortalAppPath(pathname)) {
    const rest = restAfterBase(pathname, PORTAL_APP_BASE);
    return rest ? `${toBase}${rest}` : toBase;
  }
  return toBase;
}

/**
 * Keep a post-login redirect inside the org's app.
 * UNJ may use /unjani or a /portal bookmark mapped onto /unjani.
 * Other orgs stay on /portal and cannot be sent to /unjani.
 */
export function safeBusinessRedirect(
  raw: string | null | undefined,
  organisationCode: string | null | undefined
): string {
  const home = homeForOrganisation(organisationCode);
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return home;

  if (isUnjaniCorporateCode(organisationCode)) {
    if (isUnjaniAppPath(raw)) return raw;
    if (isPortalAppPath(raw)) {
      const rest = restAfterBase(raw, PORTAL_APP_BASE);
      return rest ? `${UNJANI_APP_BASE}${rest}` : UNJANI_APP_BASE;
    }
    return home;
  }

  if (isPortalAppPath(raw)) {
    const rest = restAfterBase(raw, PORTAL_APP_BASE);
    if (isUnjaniOnlyRest(rest)) return PORTAL_APP_BASE;
    return raw;
  }
  if (isUnjaniAppPath(raw)) {
    const rest = restAfterBase(raw, UNJANI_APP_BASE);
    if (!rest || isUnjaniOnlyRest(rest)) return PORTAL_APP_BASE;
    return `${PORTAL_APP_BASE}${rest}`;
  }
  return home;
}

/** Map a path onto the Unjani app (UNJ users only). */
export function safeUnjaniRedirect(raw: string | null | undefined): string {
  return safeBusinessRedirect(raw, UNJANI_CORPORATE_CODE);
}

export type PortalAccountLane = 'personal' | 'business';

/** `unjani` is a legacy query value; it opens the Business tab. */
export function parsePortalAccountLane(
  raw: string | null | undefined
): PortalAccountLane {
  if (raw === 'unjani' || raw === 'business') return 'business';
  return 'personal';
}
