import { CIRCLETEL_DEFAULTS } from './defaults';
import type { TenantConfig } from './types';

let cached: TenantConfig | null = null;

/**
 * Resolve the tenant's config: CircleTel defaults overridden by
 * NEXT_PUBLIC_TENANT_* env vars (set per deployment in the
 * instance-per-tenant model). NEXT_PUBLIC_ so the same accessor works
 * in server and client bundles (values are baked at build time on the
 * client, which is correct: one build per tenant).
 */
export function getTenantConfig(): TenantConfig {
  if (cached) return cached;
  const d = CIRCLETEL_DEFAULTS;
  cached = {
    branding: {
      ...d.branding,
      companyName:
        process.env.NEXT_PUBLIC_TENANT_COMPANY_NAME || d.branding.companyName,
      legalName:
        process.env.NEXT_PUBLIC_TENANT_LEGAL_NAME || d.branding.legalName,
      websiteUrl:
        process.env.NEXT_PUBLIC_TENANT_WEBSITE_URL || d.branding.websiteUrl,
      websiteShort:
        process.env.NEXT_PUBLIC_TENANT_WEBSITE_SHORT || d.branding.websiteShort,
      colors: {
        ...d.branding.colors,
        primary:
          process.env.NEXT_PUBLIC_TENANT_PRIMARY_COLOR ||
          d.branding.colors.primary,
      },
    },
    contacts: { ...d.contacts },
  };
  return cached;
}

/** Test-only: clear the cache so env overrides can be re-evaluated. */
export function resetTenantConfigForTests(): void {
  cached = null;
}
