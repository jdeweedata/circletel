/**
 * Service Integration Tests for Admin Products
 *
 * These tests validate the adminProducts service layer integration with:
 * - React Query caching behavior
 * - Technology-based cache keys
 * - Service error handling
 * - Data transformation accuracy
 * - Cache invalidation scenarios
 *
 * Following TDD principles: These tests MUST FAIL initially until the
 * service implementation is complete (T010-T012).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import type {
  AdminProductsCoverageApiResponse,
  ServicePackage,
  TechnologyType
} from '@/types/adminProducts';

// =============================================================================
// Test Configuration
// =============================================================================

const TEST_TIMEOUT = 10000; // 10 seconds for service calls
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes as per research.md

// Mock Edge Function URL (will be replaced with actual service)
const MOCK_EDGE_FUNCTION_URL = 'https://agyjovdugmtopasyvlng.supabase.co/functions/v1/admin-products-coverage';

// =============================================================================
// Test Utilities and Mocks
// =============================================================================

/**
 * Create a fresh QueryClient for each test
 */
function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: CACHE_TTL_MS,
        staleTime: CACHE_TTL_MS,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * React Query wrapper for hook testing
 */
function createWrapper(queryClient: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

/**
 * Mock successful API response
 */
const mockSuccessResponse: AdminProductsCoverageApiResponse = {
  success: true,
  data: [
    {
      id: 'prod-fibre-100',
      name: '100Mbps Business Fibre',
      technology: 'FIBRE',
      provider: 'CircleTel',
      speed: '100Mbps',
      price: 1299,
      installation: 0,
      router: 0,
      contract: 24,
      features: ['Symmetric Upload/Download', 'Static IP Available', 'SLA Guaranteed'],
      available: true,
      isRecommended: true,
      promotionalOffer: {
        freeInstallation: true,
        freeRouter: true,
        discountedPrice: 999,
        validUntil: '2025-12-31'
      },
      originalPrice: 1299
    },
    {
      id: 'prod-wireless-50',
      name: '50Mbps Fixed Wireless',
      technology: 'FIXED_WIRELESS',
      provider: 'CircleTel',
      speed: '50Mbps',
      price: 899,
      installation: 1500,
      router: 800,
      contract: 12,
      features: ['Quick Installation', 'Weather Resistant'],
      available: true,
      isRecommended: false
    }
  ],
  meta: {
    count: 2,
    technologies: ['FIBRE', 'FIXED_WIRELESS']
  }
};

/**
 * Mock error response
 */
const mockErrorResponse = {
  success: false,
  error: {
    code: 'INVALID_TECHNOLOGY',
    message: 'Invalid technology type specified'
  }
};

/**
 * Mock fetch implementation
 */
const mockFetch = vi.fn();
global.fetch = mockFetch;

// =============================================================================
// Cache Key Generation Tests
// =============================================================================

describe('Admin Products Service - Cache Key Generation', () => {

  it('should generate unique cache keys for different technology combinations', () => {
    // Test single technology
    const singleTechKey = generateCacheKey(['FIBRE']);
    expect(singleTechKey).toBe('admin-products-FIBRE');

    // Test multiple technologies (should be sorted for consistency)
    const multiTechKey1 = generateCacheKey(['FIBRE', 'FIXED_WIRELESS']);
    const multiTechKey2 = generateCacheKey(['FIXED_WIRELESS', 'FIBRE']);
    expect(multiTechKey1).toBe('admin-products-FIBRE,FIXED_WIRELESS');
    expect(multiTechKey2).toBe('admin-products-FIBRE,FIXED_WIRELESS');
    expect(multiTechKey1).toBe(multiTechKey2); // Order should not matter

    // Test all technologies
    const allTechKey = generateCacheKey(['FIBRE', 'FIXED_WIRELESS', 'LTE']);
    expect(allTechKey).toBe('admin-products-FIBRE,FIXED_WIRELESS,LTE');
  });

  it('should handle coverage area parameter in cache keys', () => {
    const withAreaKey = generateCacheKey(['FIBRE'], 'johannesburg-north');
    expect(withAreaKey).toBe('admin-products-FIBRE-johannesburg-north');

    const withoutAreaKey = generateCacheKey(['FIBRE']);
    expect(withoutAreaKey).toBe('admin-products-FIBRE');

    expect(withAreaKey).not.toBe(withoutAreaKey);
  });

});

// =============================================================================
// React Query Integration Tests
// =============================================================================

describe('Admin Products Service - React Query Integration', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    mockFetch.mockClear();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should cache successful responses for 5 minutes', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSuccessResponse
    });

    const wrapper = createWrapper(queryClient);

    // This test assumes useAdminProducts hook exists (will be created in T011)
    const { result: result1 } = renderHook(
      () => useAdminProducts(['FIBRE']),
      { wrapper }
    );

    await waitFor(() => {
      expect(result1.current.isSuccess).toBe(true);
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Second call should use cache
    const { result: result2 } = renderHook(
      () => useAdminProducts(['FIBRE']),
      { wrapper }
    );

    await waitFor(() => {
      expect(result2.current.isSuccess).toBe(true);
    });

    // Should not make another API call due to caching
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result2.current.data).toEqual(result1.current.data);
  }, TEST_TIMEOUT);

  it('should make separate requests for different technology combinations', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockSuccessResponse
    });

    const wrapper = createWrapper(queryClient);

    // First request for FIBRE
    const { result: fibreResult } = renderHook(
      () => useAdminProducts(['FIBRE']),
      { wrapper }
    );

    await waitFor(() => {
      expect(fibreResult.current.isSuccess).toBe(true);
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Second request for FIXED_WIRELESS (different cache key)
    const { result: wirelessResult } = renderHook(
      () => useAdminProducts(['FIXED_WIRELESS']),
      { wrapper }
    );

    await waitFor(() => {
      expect(wirelessResult.current.isSuccess).toBe(true);
    });

    // Should make a new API call for different technology
    expect(mockFetch).toHaveBeenCalledTimes(2);
  }, TEST_TIMEOUT);

  it('should handle cache invalidation correctly', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockSuccessResponse
    });

    const wrapper = createWrapper(queryClient);
    const cacheKey = generateCacheKey(['FIBRE']);

    // Initial request
    const { result } = renderHook(
      () => useAdminProducts(['FIBRE']),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Invalidate cache
    queryClient.invalidateQueries({ queryKey: [cacheKey] });

    // Should refetch after invalidation
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  }, TEST_TIMEOUT);

});

// =============================================================================
// Error Handling Tests
// =============================================================================

describe('Admin Products Service - Error Handling', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    mockFetch.mockClear();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should handle API error responses gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => mockErrorResponse
    });

    const wrapper = createWrapper(queryClient);

    const { result } = renderHook(
      () => useAdminProducts(['INVALID_TECH' as TechnologyType]),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  }, TEST_TIMEOUT);

  it('should handle network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const wrapper = createWrapper(queryClient);

    const { result } = renderHook(
      () => useAdminProducts(['FIBRE']),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  }, TEST_TIMEOUT);

  it('should provide user-friendly error messages', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Database connection failed'
        }
      })
    });

    const wrapper = createWrapper(queryClient);

    const { result } = renderHook(
      () => useAdminProducts(['FIBRE']),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Error should be transformed to user-friendly format
    const error = result.current.error as unknown;
    expect(error.message).toContain('Unable to load products');
  }, TEST_TIMEOUT);

});

// =============================================================================
// Data Transformation Tests
// =============================================================================

describe('Admin Products Service - Data Transformation', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    mockFetch.mockClear();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should transform API response to ServicePackage format correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSuccessResponse
    });

    const wrapper = createWrapper(queryClient);

    const { result } = renderHook(
      () => useAdminProducts(['FIBRE']),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const products = result.current.data as ServicePackage[];

    expect(products).toHaveLength(2);

    // Validate first product transformation
    const fibreProduct = products[0];
    expect(fibreProduct).toMatchObject({
      id: 'prod-fibre-100',
      name: '100Mbps Business Fibre',
      speed: '100Mbps',
      price: 999, // Should use promotional price
      originalPrice: 1299,
      installation: 0, // Should be 0 due to promotional offer
      router: 0, // Should be 0 due to promotional offer
      provider: 'CircleTel',
      technology: 'FIBRE',
      contract: 24,
      features: expect.arrayContaining(['Symmetric Upload/Download']),
      isRecommended: true,
      available: true
    });

    // Validate promotional pricing calculation
    expect(fibreProduct.promotionalOffer).toMatchObject({
      freeInstallation: true,
      freeRouter: true,
      discountedPrice: 999,
      validUntil: '2025-12-31'
    });
  }, TEST_TIMEOUT);

  it('should handle products without promotional offers', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSuccessResponse
    });

    const wrapper = createWrapper(queryClient);

    const { result } = renderHook(
      () => useAdminProducts(['FIXED_WIRELESS']),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const products = result.current.data as ServicePackage[];
    const wirelessProduct = products.find(p => p.technology === 'FIXED_WIRELESS');

    expect(wirelessProduct).toBeDefined();
    expect(wirelessProduct?.price).toBe(899); // Original price
    expect(wirelessProduct?.originalPrice).toBeUndefined();
    expect(wirelessProduct?.promotionalOffer).toBeUndefined();
    expect(wirelessProduct?.installation).toBe(1500); // Original installation cost
    expect(wirelessProduct?.router).toBe(800); // Original router cost
  }, TEST_TIMEOUT);

  it('should validate data integrity after transformation', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSuccessResponse
    });

    const wrapper = createWrapper(queryClient);

    const { result } = renderHook(
      () => useAdminProducts(['FIBRE', 'FIXED_WIRELESS']),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const products = result.current.data as ServicePackage[];

    // Validate all products have required fields
    products.forEach(product => {
      expect(product.id).toBeTruthy();
      expect(product.name).toBeTruthy();
      expect(product.speed).toMatch(/^\d+Mbps$/);
      expect(product.price).toBeGreaterThan(0);
      expect(['FIBRE', 'FIXED_WIRELESS', 'LTE']).toContain(product.technology);
      expect(product.provider).toBeTruthy();
      expect([12, 24, 36]).toContain(product.contract);
      expect(Array.isArray(product.features)).toBe(true);
      expect(typeof product.available).toBe('boolean');
      expect(typeof product.isRecommended).toBe('boolean');
    });
  }, TEST_TIMEOUT);

});

// =============================================================================
// Performance Tests
// =============================================================================

describe('Admin Products Service - Performance', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    mockFetch.mockClear();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should meet performance requirements for data loading', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSuccessResponse
    });

    const wrapper = createWrapper(queryClient);
    const startTime = performance.now();

    const { result } = renderHook(
      () => useAdminProducts(['FIBRE']),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const endTime = performance.now();
    const loadTime = endTime - startTime;

    // Should complete within 2 seconds (requirement from research.md)
    expect(loadTime).toBeLessThan(2000);
  }, TEST_TIMEOUT);

  it('should optimize cache usage for repeated requests', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockSuccessResponse
    });

    const wrapper = createWrapper(queryClient);

    // Make multiple requests rapidly
    const promises = Array(5).fill(null).map(() =>
      renderHook(() => useAdminProducts(['FIBRE']), { wrapper })
    );

    await Promise.all(promises.map(({ result }) =>
      waitFor(() => expect(result.current.isSuccess).toBe(true))
    ));

    // Should only make one API call due to caching
    expect(mockFetch).toHaveBeenCalledTimes(1);
  }, TEST_TIMEOUT);

});

// =============================================================================
// Mock Implementations (Will be replaced with actual service in T010-T012)
// =============================================================================

/**
 * Mock cache key generation function
 * This will be replaced with the actual implementation in T010
 */
function generateCacheKey(technologies: TechnologyType[], coverageArea?: string): string {
  const sortedTechs = technologies.sort().join(',');
  const baseKey = `admin-products-${sortedTechs}`;
  return coverageArea ? `${baseKey}-${coverageArea}` : baseKey;
}

/**
 * Mock useAdminProducts hook
 * This will be replaced with the actual implementation in T011
 */
function useAdminProducts(technologies: TechnologyType[], coverageArea?: string) {
  // Mock implementation that will fail initially
  throw new Error('useAdminProducts hook not implemented yet - this is expected in TDD approach');
}

// =============================================================================
// Type Guards and Validation Utilities
// =============================================================================

/**
 * Validate ServicePackage data structure
 */
function validateServicePackage(pkg: unknown): pkg is ServicePackage {
  return (
    typeof pkg === 'object' &&
    typeof pkg.id === 'string' &&
    typeof pkg.name === 'string' &&
    ['FIBRE', 'FIXED_WIRELESS', 'LTE'].includes(pkg.technology) &&
    typeof pkg.provider === 'string' &&
    typeof pkg.speed === 'string' &&
    typeof pkg.price === 'number' &&
    typeof pkg.installation === 'number' &&
    typeof pkg.router === 'number' &&
    typeof pkg.contract === 'number' &&
    Array.isArray(pkg.features) &&
    typeof pkg.available === 'boolean' &&
    typeof pkg.isRecommended === 'boolean'
  );
}

/**
 * Custom Vitest matchers for better test readability
 */
declare global {
// eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Vi {
    interface Assertion<T = unknown> {
      toBeWithinTimeLimit(limit: number): void;
    }
  }
}

expect.extend({
  toBeWithinTimeLimit(received: number, limit: number) {
    const pass = received <= limit;
    return {
      pass,
      message: () =>
        pass
          ? `expected ${received}ms not to be within ${limit}ms limit`
          : `expected ${received}ms to be within ${limit}ms limit`
    };
  }
});

export {};