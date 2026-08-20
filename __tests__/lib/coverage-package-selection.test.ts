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
    pkg({ id: '1', name: 'SkyFibre Home Plus', service_type: 'SkyFibre', product_category: 'wireless', customer_type: 'consumer', price: 500 }),
    pkg({ id: '2', name: 'SkyFibre SME Essential', service_type: 'SkyFibre', product_category: 'wireless', customer_type: 'business', price: 700 }),
    pkg({ id: '3', service_type: 'HomeFibre', product_category: 'fibre_consumer', customer_type: 'consumer', price: 900 }),
    pkg({ id: '4', name: 'SkyFibre Home Max', service_type: 'SkyFibre', product_category: undefined, customer_type: 'consumer', price: 400 }),
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

  it('includes uncategorised LTE/5G packages when service_type matches a selected category', () => {
    const mixed = [
      pkg({
        id: 'op20',
        name: 'CircleConnect Uncapped 20 Mbps',
        sku: 'CC-OP-UNC-20',
        service_type: 'LTE',
        product_category: undefined,
        customer_type: 'consumer',
        price: 599,
        promotion_price: 549,
      }),
      pkg({
        id: 'fiveg',
        name: 'CircleConnect 5G 60 Mbps',
        sku: 'CC-5G-CON-060',
        service_type: '5G',
        product_category: '5g',
        customer_type: 'consumer',
        price: 699,
      }),
    ];
    const result = selectPackagesForCoverage(mixed, {
      customerType: 'consumer',
      productCategories: ['lte', '5g'],
      useMappedCategories: true,
    });
    expect(result.map(p => p.id)).toEqual(['op20', 'fiveg']);
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

  it('keeps only SkyFibre Home Plus and Home Max for consumer coverage', () => {
    const mixed = [
      pkg({ id: 'plus', name: 'SkyFibre Home Plus', service_type: 'SkyFibre', product_category: 'connectivity', customer_type: 'consumer' }),
      pkg({ id: 'max', name: 'SkyFibre Home Max', service_type: 'SkyFibre', product_category: 'connectivity', customer_type: 'consumer' }),
      pkg({ id: 'pro50', name: 'SkyFibre Home Pro 50', service_type: 'SkyFibre', product_category: 'connectivity', customer_type: 'consumer' }),
      pkg({ id: 'pro100', name: 'SkyFibre Home Pro 100', service_type: 'SkyFibre', product_category: 'connectivity', customer_type: 'consumer' }),
      pkg({ id: 'ultra', name: 'SkyFibre Home Ultra', service_type: 'SkyFibre', product_category: 'connectivity', customer_type: 'consumer' }),
      pkg({ id: 'biz', name: 'SkyFibre Business 100', service_type: 'SkyFibre', product_category: 'connectivity', customer_type: 'consumer' }),
    ];
    const result = selectPackagesForCoverage(mixed, {
      customerType: 'consumer',
      productCategories: ['connectivity'],
      useMappedCategories: true,
    });
    expect(result.map(p => p.id)).toEqual(['plus', 'max']);
  });

  it('keeps fibre, LTE, and 5G consumer packages when SkyFibre is filtered', () => {
    const mixed = [
      pkg({ id: 'plus', name: 'SkyFibre Home Plus', service_type: 'SkyFibre', product_category: 'connectivity', customer_type: 'consumer' }),
      pkg({ id: 'fibre', name: 'HomeFibre Plus 50Mbps', service_type: 'HomeFibreConnect', product_category: 'fibre_consumer', customer_type: 'consumer' }),
      pkg({ id: 'lte', name: 'LTE Uncapped 50Mbps', service_type: 'LTE', product_category: 'lte', customer_type: 'consumer' }),
      pkg({ id: 'fiveg', name: '5G Home Premium', service_type: '5G', product_category: '5g', customer_type: 'consumer' }),
      pkg({ id: 'ultra', name: 'SkyFibre Home Ultra', service_type: 'SkyFibre', product_category: 'connectivity', customer_type: 'consumer' }),
    ];
    const result = selectPackagesForCoverage(mixed, {
      customerType: 'consumer',
      productCategories: ['connectivity', 'fibre_consumer', 'lte', '5g'],
      useMappedCategories: true,
    });
    expect(result.map(p => p.id)).toEqual(['plus', 'fibre', 'lte', 'fiveg']);
  });

  it('does not restrict business SkyFibre SKUs', () => {
    const mixed = [
      pkg({ id: 'sme', name: 'SkyFibre SME Essential', service_type: 'SkyFibre', product_category: 'connectivity', customer_type: 'business' }),
      pkg({ id: 'sme100', name: 'SkyFibre SME Professional', service_type: 'SkyFibre', product_category: 'connectivity', customer_type: 'business' }),
    ];
    const result = selectPackagesForCoverage(mixed, {
      customerType: 'business',
      productCategories: ['connectivity'],
      useMappedCategories: true,
    });
    expect(result.map(p => p.id)).toEqual(['sme', 'sme100']);
  });
});
