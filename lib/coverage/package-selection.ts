/**
 * Coverage package selection (audit H1)
 *
 * Pure helpers that reproduce, in code, the package-selection semantics the
 * /api/coverage/packages route previously expressed as Supabase queries —
 * extracted so the mapped-vs-legacy branch and the customer_type filter are
 * unit-testable rather than buried in the handler. No I/O; inputs are the
 * already-cached reference reads from lib/coverage/reference-data.ts.
 */

import type { CachedServiceTypeMapping, CachedServicePackage } from '@/lib/coverage/reference-data';

export interface ResolvedCategories {
  /** Product categories (mapped) or raw service types (legacy) to match packages against. */
  productCategories: string[];
  /** True when technical types mapped to product categories; false = legacy service_type match. */
  useMappedCategories: boolean;
}

/**
 * Derive the categories to match packages against, from the available service
 * types and the service_type_mapping table.
 *
 * Mirrors the original logic: keep only mappings whose technical_type is in the
 * available (non-licensed-wireless) services; if any survive, use their unique
 * product categories (mapped path); otherwise the services are already product
 * categories from the legacy coverage_areas table (legacy path).
 */
export function resolveCoverageCategories(
  allMappings: CachedServiceTypeMapping[] | null,
  packageableServices: string[]
): ResolvedCategories {
  const relevant = (allMappings ?? []).filter(m =>
    packageableServices.includes(m.technical_type)
  );

  if (relevant.length > 0) {
    return {
      productCategories: [...new Set(relevant.map(m => m.product_category))],
      useMappedCategories: true,
    };
  }

  return { productCategories: packageableServices, useMappedCategories: false };
}

export interface PackageSelectionOptions {
  customerType: string;
  productCategories: string[];
  useMappedCategories: boolean;
}

/** Consumer SkyFibre SKUs sold on the public residential coverage page. */
const CONSUMER_SKYFIBRE_PACKAGE_NAMES = new Set([
  'SkyFibre Home Plus',
  'SkyFibre Home Max',
]);

function isSkyFibrePackage(pkg: CachedServicePackage): boolean {
  const serviceType = (pkg.service_type || '').toLowerCase();
  const productCategory = (pkg.product_category || '').toLowerCase();
  const name = (pkg.name || '').toLowerCase();
  return (
    serviceType.includes('skyfibre') ||
    productCategory.includes('skyfibre') ||
    name.includes('skyfibre')
  );
}

function matchesCoverageCategory(
  pkg: CachedServicePackage,
  productCategories: string[],
  useMappedCategories: boolean
): boolean {
  if (!useMappedCategories) {
    return productCategories.includes(pkg.service_type);
  }
  if (pkg.product_category && productCategories.includes(pkg.product_category)) {
    return true;
  }
  // OP19627 LTE promo (and similar) can ship with a null product_category.
  // Match the technical service_type against mapped categories (LTE → lte).
  const serviceType = (pkg.service_type || '').toLowerCase();
  return productCategories.some((category) => category.toLowerCase() === serviceType);
}

/**
 * Select active packages matching the coverage result.
 *
 * Equivalent to the previous DB query: customer_type equality AND either a
 * product_category match (mapped path) or a service_type match (legacy path).
 * The input list is assumed already active-only and price-ordered (as the
 * cached read provides), so ordering is preserved and no re-sort is done.
 *
 * Residential (consumer) SkyFibre is further restricted to Home Plus (50 Mbps)
 * and Home Max (100 Mbps). Fibre, LTE, and 5G packages are left unchanged.
 */
export function selectPackagesForCoverage(
  packages: CachedServicePackage[],
  { customerType, productCategories, useMappedCategories }: PackageSelectionOptions
): CachedServicePackage[] {
  return packages.filter(pkg => {
    if (pkg.customer_type !== customerType) return false;
    if (!matchesCoverageCategory(pkg, productCategories, useMappedCategories)) {
      return false;
    }
    if (customerType === 'consumer' && isSkyFibrePackage(pkg)) {
      return CONSUMER_SKYFIBRE_PACKAGE_NAMES.has(pkg.name);
    }
    return true;
  });
}
