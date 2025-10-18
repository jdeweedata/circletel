/**
 * Supersonic Package Mapper Unit Tests
 * Tests package transformation from Supersonic to CircleTel schema
 */

import { describe, it, expect } from '@jest/globals';
import {
  mapPackage,
  mapPackages,
  validatePackage,
  validatePackages,
  sortByPrice,
  filterByTechnology,
  filterByPriceRange,
  getPromotionalPackages,
  calculatePromotionalSavings,
  mergePackages
} from '@/lib/coverage/supersonic/mapper';
import { SupersonicPackage, CircleTelPackage } from '@/lib/coverage/supersonic/types';

describe('Supersonic Package Mapper', () => {
  // ========== Single Package Mapping ==========
  describe('mapPackage', () => {
    const validPackage: SupersonicPackage = {
      id: 1,
      name: '5G Capped 60GB',
      type: '5G',
      price: 279,
      promo_price: 199,
      data_day: '60GB',
      data_night: '60GB',
      router_charge: 399,
      contract: 'Month-to-Month',
      is_promotional: true
    };

    it('should map valid 5G package correctly', () => {
      const result = mapPackage(validPackage);

      expect(result.id).toBe('supersonic_1');
      expect(result.name).toBe('5G Capped 60GB');
      expect(result.technology_type).toBe('5g-lte');
      expect(result.regular_price).toBe(279);
      expect(result.promo_price).toBe(199);
      expect(result.data_limit).toBe('60GB day + 60GB night');
      expect(result.billing_cycle).toBe('monthly');
      expect(result.router_included).toBe(true);
      expect(result.source).toBe('supersonic');
      expect(result.promoted).toBe(true);
    });

    it('should map Fibre package with different contract type', () => {
      const fibrePackage: SupersonicPackage = {
        id: 2,
        name: 'Fibre 100Mbps',
        type: 'Fibre',
        price: 599,
        data_day: 'Uncapped',
        data_night: 'Uncapped',
        router_charge: 0,
        contract: '24-Month',
        is_promotional: false
      };

      const result = mapPackage(fibrePackage);

      expect(result.technology_type).toBe('fibre');
      expect(result.billing_cycle).toBe('monthly');
      expect(result.data_limit).toBe('Uncapped');
      expect(result.router_included).toBe(false);
      expect(result.promoted).toBe(false);
    });

    it('should map AirFibre package', () => {
      const airfibrePackage: SupersonicPackage = {
        id: 3,
        name: 'AirFibre Starter',
        type: 'AirFibre',
        price: 149,
        data_day: '20GB',
        router_charge: 299,
        contract: 'Prepaid',
        is_promotional: false
      };

      const result = mapPackage(airfibrePackage);

      expect(result.technology_type).toBe('airfibre');
      expect(result.billing_cycle).toBe('prepaid');
      expect(result.data_limit).toBe('20GB day');
    });

    it('should throw error for invalid package', () => {
      const invalidPackage = {
        id: 4,
        name: '',
        type: 'Unknown',
        price: -100
      };

      expect(() => mapPackage(invalidPackage as SupersonicPackage)).toThrow();
    });

    it('should extract features correctly', () => {
      const packageWithFeatures: SupersonicPackage = {
        id: 5,
        name: 'Premium 5G',
        type: '5G',
        price: 599,
        router_charge: 0,
        fair_usage: 'Fair Usage Policy applies',
        contract: 'Month-to-Month',
        tier: 'Premium'
      };

      const result = mapPackage(packageWithFeatures);

      expect(result.features).toContain('Fair Usage Policy applies');
      expect(result.features).toContain('Contract: Month-to-Month');
      expect(result.features).toContain('Tier: Premium');
    });

    it('should handle packages with no promotion correctly', () => {
      const nonPromoPackage: SupersonicPackage = {
        id: 6,
        name: 'Standard LTE',
        type: 'LTE',
        price: 199,
        promo_price: 299, // Higher than regular price
        contract: 'Month-to-Month',
        is_promotional: false
      };

      const result = mapPackage(nonPromoPackage);

      expect(result.promoted).toBe(false);
      expect(result.promo_price).toBeNull();
    });
  });

  // ========== Multiple Package Mapping ==========
  describe('mapPackages', () => {
    const packages: SupersonicPackage[] = [
      {
        id: 1,
        name: '5G 60GB',
        type: '5G',
        price: 279,
        contract: 'Month-to-Month'
      },
      {
        id: 2,
        name: 'Fibre 100',
        type: 'Fibre',
        price: 599,
        contract: 'Month-to-Month'
      }
    ];

    it('should map multiple packages', () => {
      const result = mapPackages(packages);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('5G 60GB');
      expect(result[1].name).toBe('Fibre 100');
    });

    it('should skip invalid packages in array', () => {
      const mixedPackages = [
        ...packages,
        { invalid: 'package' } // This will be skipped
      ];

      const result = mapPackages(mixedPackages as SupersonicPackage[]);

      expect(result).toHaveLength(2);
    });

    it('should throw error if not an array', () => {
      expect(() => mapPackages(null as any)).toThrow();
      expect(() => mapPackages({} as any)).toThrow();
    });
  });

  // ========== Validation ==========
  describe('validatePackage', () => {
    it('should validate correct package', () => {
      const pkg: SupersonicPackage = {
        id: 1,
        name: 'Test Package',
        type: '5G',
        price: 100,
        contract: 'Month-to-Month'
      };

      expect(validatePackage(pkg)).toBe(true);
    });

    it('should reject package with missing fields', () => {
      expect(validatePackage({ id: 1 })).toBe(false);
      expect(validatePackage({ name: 'Test' })).toBe(false);
      expect(validatePackage({})).toBe(false);
      expect(validatePackage(null)).toBe(false);
    });

    it('should reject package with invalid price', () => {
      expect(
        validatePackage({
          id: 1,
          name: 'Test',
          type: '5G',
          price: -100,
          contract: 'Month-to-Month'
        })
      ).toBe(false);
    });
  });

  describe('validatePackages', () => {
    const validPackages: SupersonicPackage[] = [
      {
        id: 1,
        name: 'Package 1',
        type: '5G',
        price: 100,
        contract: 'Month-to-Month'
      }
    ];

    it('should validate correct array', () => {
      expect(validatePackages(validPackages)).toBe(true);
    });

    it('should reject non-array', () => {
      expect(validatePackages(null as any)).toBe(false);
      expect(validatePackages({} as any)).toBe(false);
    });
  });

  // ========== Filtering ==========
  describe('filterByTechnology', () => {
    const packages: CircleTelPackage[] = [
      {
        id: '1',
        name: 'Package 5G',
        technology_type: '5g-lte',
        regular_price: 100,
        promo_price: null,
        data_limit: '60GB',
        speed_download: 'Variable',
        speed_upload: 'Variable',
        billing_cycle: 'monthly',
        router_included: false,
        features: [],
        source: 'supersonic'
      },
      {
        id: '2',
        name: 'Package Fibre',
        technology_type: 'fibre',
        regular_price: 500,
        promo_price: null,
        data_limit: 'Uncapped',
        speed_download: '100Mbps',
        speed_upload: '50Mbps',
        billing_cycle: 'monthly',
        router_included: false,
        features: [],
        source: 'supersonic'
      }
    ];

    it('should filter by technology type', () => {
      const result = filterByTechnology(packages, '5g-lte');

      expect(result).toHaveLength(1);
      expect(result[0].technology_type).toBe('5g-lte');
    });

    it('should return empty array if no matches', () => {
      const result = filterByTechnology(packages, 'airfibre');

      expect(result).toHaveLength(0);
    });
  });

  describe('filterByPriceRange', () => {
    const packages: CircleTelPackage[] = [
      {
        id: '1',
        name: 'Cheap',
        technology_type: '5g-lte',
        regular_price: 100,
        promo_price: null,
        data_limit: '10GB',
        speed_download: 'Variable',
        speed_upload: 'Variable',
        billing_cycle: 'monthly',
        router_included: false,
        features: [],
        source: 'supersonic'
      },
      {
        id: '2',
        name: 'Mid',
        technology_type: '5g-lte',
        regular_price: 300,
        promo_price: null,
        data_limit: '60GB',
        speed_download: 'Variable',
        speed_upload: 'Variable',
        billing_cycle: 'monthly',
        router_included: false,
        features: [],
        source: 'supersonic'
      },
      {
        id: '3',
        name: 'Expensive',
        technology_type: 'fibre',
        regular_price: 800,
        promo_price: null,
        data_limit: 'Uncapped',
        speed_download: '1Gbps',
        speed_upload: '500Mbps',
        billing_cycle: 'monthly',
        router_included: false,
        features: [],
        source: 'supersonic'
      }
    ];

    it('should filter by price range', () => {
      const result = filterByPriceRange(packages, 100, 400);

      expect(result).toHaveLength(2);
      expect(result.every(p => p.regular_price >= 100 && p.regular_price <= 400)).toBe(
        true
      );
    });

    it('should handle no matches', () => {
      const result = filterByPriceRange(packages, 1000, 2000);

      expect(result).toHaveLength(0);
    });
  });

  // ========== Sorting ==========
  describe('sortByPrice', () => {
    const packages: CircleTelPackage[] = [
      {
        id: '1',
        name: 'Expensive',
        technology_type: '5g-lte',
        regular_price: 500,
        promo_price: null,
        data_limit: '100GB',
        speed_download: 'Variable',
        speed_upload: 'Variable',
        billing_cycle: 'monthly',
        router_included: false,
        features: [],
        source: 'supersonic'
      },
      {
        id: '2',
        name: 'Cheap',
        technology_type: '5g-lte',
        regular_price: 99,
        promo_price: null,
        data_limit: '10GB',
        speed_download: 'Variable',
        speed_upload: 'Variable',
        billing_cycle: 'monthly',
        router_included: false,
        features: [],
        source: 'supersonic'
      },
      {
        id: '3',
        name: 'Mid',
        technology_type: '5g-lte',
        regular_price: 299,
        promo_price: null,
        data_limit: '60GB',
        speed_download: 'Variable',
        speed_upload: 'Variable',
        billing_cycle: 'monthly',
        router_included: false,
        features: [],
        source: 'supersonic'
      }
    ];

    it('should sort by price ascending', () => {
      const result = sortByPrice(packages);

      expect(result[0].regular_price).toBe(99);
      expect(result[1].regular_price).toBe(299);
      expect(result[2].regular_price).toBe(500);
    });

    it('should not mutate original array', () => {
      const original = [...packages];
      sortByPrice(packages);

      expect(packages).toEqual(original);
    });
  });

  // ========== Promotional Packages ==========
  describe('getPromotionalPackages', () => {
    const packages: CircleTelPackage[] = [
      {
        id: '1',
        name: 'On Promo',
        technology_type: '5g-lte',
        regular_price: 299,
        promo_price: 199,
        data_limit: '60GB',
        speed_download: 'Variable',
        speed_upload: 'Variable',
        billing_cycle: 'monthly',
        router_included: false,
        features: [],
        source: 'supersonic',
        promoted: true
      },
      {
        id: '2',
        name: 'Not Promo',
        technology_type: '5g-lte',
        regular_price: 99,
        promo_price: null,
        data_limit: '10GB',
        speed_download: 'Variable',
        speed_upload: 'Variable',
        billing_cycle: 'monthly',
        router_included: false,
        features: [],
        source: 'supersonic',
        promoted: false
      }
    ];

    it('should get only promotional packages', () => {
      const result = getPromotionalPackages(packages);

      expect(result).toHaveLength(1);
      expect(result[0].promoted).toBe(true);
    });

    it('should return empty array if no promotions', () => {
      const nonPromoPackages = packages.map(p => ({ ...p, promoted: false, promo_price: null }));
      const result = getPromotionalPackages(nonPromoPackages);

      expect(result).toHaveLength(0);
    });
  });

  describe('calculatePromotionalSavings', () => {
    const packages: CircleTelPackage[] = [
      {
        id: '1',
        name: 'Save 50',
        technology_type: '5g-lte',
        regular_price: 100,
        promo_price: 50,
        data_limit: '60GB',
        speed_download: 'Variable',
        speed_upload: 'Variable',
        billing_cycle: 'monthly',
        router_included: false,
        features: [],
        source: 'supersonic',
        promoted: true
      },
      {
        id: '2',
        name: 'Save 100',
        technology_type: '5g-lte',
        regular_price: 200,
        promo_price: 100,
        data_limit: '100GB',
        speed_download: 'Variable',
        speed_upload: 'Variable',
        billing_cycle: 'monthly',
        router_included: false,
        features: [],
        source: 'supersonic',
        promoted: true
      }
    ];

    it('should calculate average promotional savings', () => {
      const result = calculatePromotionalSavings(packages);

      expect(result).toBe(75); // (50 + 100) / 2
    });

    it('should return 0 if no promotional packages', () => {
      const nonPromoPackages = packages.map(p => ({
        ...p,
        promoted: false,
        promo_price: null
      }));
      const result = calculatePromotionalSavings(nonPromoPackages);

      expect(result).toBe(0);
    });
  });

  // ========== Merge ==========
  describe('mergePackages', () => {
    it('should merge two package arrays and remove duplicates', () => {
      const packages1: CircleTelPackage[] = [
        {
          id: '1',
          name: 'Package A',
          technology_type: '5g-lte',
          regular_price: 100,
          promo_price: null,
          data_limit: '60GB',
          speed_download: 'Variable',
          speed_upload: 'Variable',
          billing_cycle: 'monthly',
          router_included: false,
          features: [],
          source: 'supersonic'
        }
      ];

      const packages2: CircleTelPackage[] = [
        {
          id: '2',
          name: 'Package B',
          technology_type: 'fibre',
          regular_price: 500,
          promo_price: null,
          data_limit: 'Uncapped',
          speed_download: '100Mbps',
          speed_upload: '50Mbps',
          billing_cycle: 'monthly',
          router_included: false,
          features: [],
          source: 'supersonic'
        }
      ];

      const result = mergePackages(packages1, packages2);

      expect(result).toHaveLength(2);
    });

    it('should prefer promotional package when merging duplicates', () => {
      const regular: CircleTelPackage[] = [
        {
          id: '1',
          name: 'Same Package',
          technology_type: '5g-lte',
          regular_price: 100,
          promo_price: null,
          data_limit: '60GB',
          speed_download: 'Variable',
          speed_upload: 'Variable',
          billing_cycle: 'monthly',
          router_included: false,
          features: [],
          source: 'supersonic',
          promoted: false
        }
      ];

      const promo: CircleTelPackage[] = [
        {
          id: '2',
          name: 'Same Package',
          technology_type: '5g-lte',
          regular_price: 100,
          promo_price: 50,
          data_limit: '60GB',
          speed_download: 'Variable',
          speed_upload: 'Variable',
          billing_cycle: 'monthly',
          router_included: false,
          features: [],
          source: 'supersonic',
          promoted: true
        }
      ];

      const result = mergePackages(regular, promo);

      expect(result).toHaveLength(1);
      expect(result[0].promoted).toBe(true);
    });
  });
});
