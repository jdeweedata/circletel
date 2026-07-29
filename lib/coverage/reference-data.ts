/**
 * Cached coverage reference data
 *
 * The public coverage-check hot path (/api/coverage/packages) reads four
 * reference tables that change rarely. These getters wrap those reads in
 * unstable_cache so repeat coverage checks skip the DB round-trips.
 *
 * Invalidation contract (audit H1): any route that WRITES service_packages
 * or fttb_network_providers must call revalidateCoverageReferenceCache()
 * after a successful write, or admins will see stale coverage data.
 * coverage_areas and service_type_mapping currently have no write paths
 * in the codebase, so they rely on time-based revalidation alone.
 */

import { unstable_cache, revalidateTag } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export const COVERAGE_REFERENCE_TAGS = {
  servicePackages: 'coverage-ref-service-packages',
  coverageAreas: 'coverage-ref-coverage-areas',
  serviceTypeMappings: 'coverage-ref-service-type-mapping',
  networkProviders: 'coverage-ref-network-providers',
} as const;

export interface CachedCoverageArea {
  area_name: string;
  city?: string;
  service_type: string;
  status: string;
}

export interface CachedServiceTypeMapping {
  technical_type: string;
  product_category: string;
  active: boolean;
  priority: number;
}

export interface CachedServicePackage {
  id: string;
  name: string;
  service_type: string;
  product_category?: string;
  customer_type?: string;
  speed_down?: number;
  speed_up?: number;
  price: number;
  promotion_price?: number;
  promotion_months?: number;
  description?: string;
  features?: string[];
  metadata?: Record<string, unknown> | null;
  compatible_providers?: string[];
  active: boolean;
}

export interface CachedNetworkProvider {
  provider_code: string;
  display_name: string;
  logo_url?: string;
  logo_dark_url?: string;
  logo_light_url?: string;
  logo_format?: string;
  logo_aspect_ratio?: string;
  priority: number;
  active: boolean;
}

/** Active coverage areas (legacy address-matching fallback). */
export const getActiveCoverageAreas = unstable_cache(
  async (): Promise<CachedCoverageArea[]> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('coverage_areas')
      .select('area_name, city, service_type, status')
      .eq('status', 'active');
    if (error) throw new Error(`coverage_areas read failed: ${error.message}`);
    return data ?? [];
  },
  ['coverage-ref-coverage-areas'],
  { revalidate: 600, tags: [COVERAGE_REFERENCE_TAGS.coverageAreas] }
);

/** All active technical-type → product-category mappings, priority order. */
export const getActiveServiceTypeMappings = unstable_cache(
  async (): Promise<CachedServiceTypeMapping[]> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('service_type_mapping')
      .select('technical_type, product_category, active, priority')
      .eq('active', true)
      .order('priority', { ascending: true });
    if (error) throw new Error(`service_type_mapping read failed: ${error.message}`);
    return data ?? [];
  },
  ['coverage-ref-service-type-mapping'],
  { revalidate: 600, tags: [COVERAGE_REFERENCE_TAGS.serviceTypeMappings] }
);

/** All active service packages, price ascending. Callers filter in code. */
export const getActiveServicePackages = unstable_cache(
  async (): Promise<CachedServicePackage[]> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('service_packages')
      .select('*')
      .eq('active', true)
      .order('price', { ascending: true });
    if (error) throw new Error(`service_packages read failed: ${error.message}`);
    return data ?? [];
  },
  ['coverage-ref-service-packages'],
  { revalidate: 300, tags: [COVERAGE_REFERENCE_TAGS.servicePackages] }
);

/** Active FTTB network providers (logo/display data). */
export const getActiveNetworkProviders = unstable_cache(
  async (): Promise<CachedNetworkProvider[]> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('fttb_network_providers')
      .select('provider_code, display_name, logo_url, logo_dark_url, logo_light_url, logo_format, logo_aspect_ratio, priority, active')
      .eq('active', true);
    if (error) throw new Error(`fttb_network_providers read failed: ${error.message}`);
    return data ?? [];
  },
  ['coverage-ref-network-providers'],
  { revalidate: 600, tags: [COVERAGE_REFERENCE_TAGS.networkProviders] }
);

/**
 * Invalidate cached coverage reference data after a write.
 * Call with the tables that were mutated; defaults to all four.
 */
export function revalidateCoverageReferenceCache(
  tables: Array<keyof typeof COVERAGE_REFERENCE_TAGS> = [
    'servicePackages',
    'coverageAreas',
    'serviceTypeMappings',
    'networkProviders',
  ]
): void {
  for (const table of tables) {
    revalidateTag(COVERAGE_REFERENCE_TAGS[table]);
  }
}
