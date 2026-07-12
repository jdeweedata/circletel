import { CIRCLETEL_DEFAULTS } from './defaults';
import { isModuleId } from '@/lib/admin/workspace-access';
import type { ModuleId } from '@/lib/admin/feature-registry';
import type { TenantConfig } from './types';

let cached: TenantConfig | null = null;

/**
 * Parse NEXT_PUBLIC_TENANT_MODULES ("billing,crm,orders"). Unknown ids are
 * dropped with a warning; 'core' is always force-included (Dashboard/Users/
 * Settings and the guard's deny-landing live there — disabling it would brick
 * the admin). Returns null for unset/blank -> caller falls back to defaults.
 */
function parseModules(raw: string | undefined): ModuleId[] | null {
  if (!raw || !raw.trim()) return null;
  const modules: ModuleId[] = [];
  for (const part of raw.split(',')) {
    const id = part.trim();
    if (!id) continue;
    if (isModuleId(id)) {
      if (!modules.includes(id)) modules.push(id);
    } else {
      console.warn(`[tenant-config] Unknown module id in NEXT_PUBLIC_TENANT_MODULES: "${id}" (dropped)`);
    }
  }
  if (!modules.includes('core')) modules.push('core');
  return modules;
}

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
    modules: parseModules(process.env.NEXT_PUBLIC_TENANT_MODULES) ?? [...d.modules],
  };
  return cached;
}

/** Test-only: clear the cache so env overrides can be re-evaluated. */
export function resetTenantConfigForTests(): void {
  cached = null;
}
