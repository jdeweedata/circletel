/**
 * Coverage package selection tests (audit H1)
 *
 * Locks in the semantics of the in-code filter that replaced the previous
 * Supabase .or(product_category.in / service_type.in) query on the public
 * coverage-check hot path.
 */

import {
  resolveCoverageCategories,
  selectPackagesForCoverage,
} from '@/lib/coverage/package-selection';
import type {
  CachedServiceTypeMapping,
  CachedServicePackage,
} from '@/lib/coverage/reference-data';

const mapping = (
  technical_type: string,
  product_category: string,
  priority = 1
): CachedServiceTypeMapping => ({ technical_type, product_category, active: true, priority });

const pkg = (overrides: Partial<CachedServicePackage>): CachedServicePackage => ({
  id: overrides.id ?? 'p',
  name: overrides.name ?? 'Package',
  service_type: overrides.service_type ?? 'SkyFibre',
  price: overrides.price ?? 999,
  active: true,
  ...overrides,
});

describe('resolveCoverageCategories', () => {
  it('maps technical types to unique product categories (mapped path)', () => {
    const mappings = [
      mapping('fwa_5g', 'wireless'),
      mapping('fibre_home', 'fibre_consumer'),
      mapping('fibre_home_alt', 'fibre_consumer'), // duplicate category
    ];
    const result = resolveCoverageCategories(mappings, ['fwa_5g', 'fibre_home', 'fibre_home_alt']);
    expect(result.useMappedCategories).toBe(true);
    expect(result.productCategories.sort()).toEqual(['fibre_consumer', 'wireless']);
  });

  it('ignores mappings whose technical_type is not in the available services', () => {
    const mappings = [mapping('fwa_5g', 'wireless'), mapping('unrelated', 'other')];
    const result = resolveCoverageCategories(mappings, ['fwa_5g']);
    expect(result.productCategories).toEqual(['wireless']);
  });

  it('falls back to the legacy path when mappings are null', () => {
    const result = resolveCoverageCategories(null, ['SkyFibre', 'HomeFibreConnect']);
    expect(result.useMappedCategories).toBe(false);
    expect(result.productCategories).toEqual(['SkyFibre', 'HomeFibreConnect']);
  });

  it('falls back to the legacy path when no mapping matches', () => {
    const mappings = [mapping('fwa_5g', 'wireless')];
    const result = resolveCoverageCategories(mappings, ['SkyFibre']);
    expect(result.useMappedCategories).toBe(false);
    expect(result.productCategories).toEqual(['SkyFibre']);
  });

  it('handles empty available services (legacy, empty)', () => {
    const result = resolveCoverageCategories([mapping('fwa_5g', 'wireless')], []);
    expect(result).toEqual({ productCategories: [], useMappedCategories: false });
  });
});

describe('selectPackagesForCoverage', () => {
  const packages = [
    pkg({ id: '1', service_type: 'SkyFibre', product_category: 'wireless', customer_type: 'consumer', price: 500 }),
    pkg({ id: '2', service_type: 'SkyFibre', product_category: 'wireless', customer_type: 'business', price: 700 }),
    pkg({ id: '3', service_type: 'HomeFibre', product_category: 'fibre_consumer', customer_type: 'consumer', price: 900 }),
    pkg({ id: '4', service_type: 'SkyFibre', product_category: undefined, customer_type: 'consumer', price: 400 }),
  ];

  it('matches by product_category and customer_type on the mapped path', () => {
    const result = selectPackagesForCoverage(packages, {
      customerType: 'consumer',
      productCategories: ['wireless'],
      useMappedCategories: true,
    });
    expect(result.map(p => p.id)).toEqual(['1']);
  });

  it('excludes packages with a null product_category on the mapped path', () => {
    // pkg 4 is consumer + SkyFibre but has no product_category → excluded when mapped
    const result = selectPackagesForCoverage(packages, {
      customerType: 'consumer',
      productCategories: ['wireless', 'fibre_consumer'],
      useMappedCategories: true,
    });
    expect(result.map(p => p.id)).toEqual(['1', '3']);
  });

  it('matches by service_type and customer_type on the legacy path', () => {
    // legacy path ignores product_category, so pkg 4 (SkyFibre, no category) qualifies
    const result = selectPackagesForCoverage(packages, {
      customerType: 'consumer',
      productCategories: ['SkyFibre'],
      useMappedCategories: false,
    });
    expect(result.map(p => p.id)).toEqual(['1', '4']);
  });

  it('filters out the wrong customer_type', () => {
    const result = selectPackagesForCoverage(packages, {
      customerType: 'business',
      productCategories: ['wireless'],
      useMappedCategories: true,
    });
    expect(result.map(p => p.id)).toEqual(['2']);
  });

  it('returns nothing when no category matches', () => {
    const result = selectPackagesForCoverage(packages, {
      customerType: 'consumer',
      productCategories: ['nonexistent'],
      useMappedCategories: true,
    });
    expect(result).toEqual([]);
  });

  it('preserves input order (no re-sort)', () => {
    const ordered = [
      pkg({ id: 'a', service_type: 'X', customer_type: 'consumer', price: 100 }),
      pkg({ id: 'b', service_type: 'X', customer_type: 'consumer', price: 900 }),
      pkg({ id: 'c', service_type: 'X', customer_type: 'consumer', price: 300 }),
    ];
    const result = selectPackagesForCoverage(ordered, {
      customerType: 'consumer',
      productCategories: ['X'],
      useMappedCategories: false,
    });
    expect(result.map(p => p.id)).toEqual(['a', 'b', 'c']);
  });
});
