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

/**
 * Select active packages matching the coverage result.
 *
 * Equivalent to the previous DB query: customer_type equality AND either a
 * product_category match (mapped path) or a service_type match (legacy path).
 * The input list is assumed already active-only and price-ordered (as the
 * cached read provides), so ordering is preserved and no re-sort is done.
 */
export function selectPackagesForCoverage(
  packages: CachedServicePackage[],
  { customerType, productCategories, useMappedCategories }: PackageSelectionOptions
): CachedServicePackage[] {
  return packages.filter(pkg =>
    pkg.customer_type === customerType &&
    (useMappedCategories
      ? !!pkg.product_category && productCategories.includes(pkg.product_category)
      : productCategories.includes(pkg.service_type))
  );
}
