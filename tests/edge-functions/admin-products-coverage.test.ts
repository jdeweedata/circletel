/**
 * Contract Tests for Admin Products Coverage Edge Function
 *
 * These tests validate the API contract defined in:
 * specs/001-admin-products-integration/contracts/admin-products-coverage-api.yaml
 *
 * Following TDD principles: These tests MUST FAIL initially until the
 * Edge Function implementation is complete (T007-T009).
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type {
  AdminProductsCoverageApiResponse,
  ServicePackage
} from '@/types/adminProducts';

// =============================================================================
// Test Configuration
// =============================================================================

const EDGE_FUNCTION_URL = 'https://agyjovdugmtopasyvlng.supabase.co/functions/v1/admin-products-coverage';
const TEST_TIMEOUT = 10000; // 10 seconds for Edge Function calls
const PERFORMANCE_THRESHOLD = 500; // 500ms as per requirements

// Mock Supabase environment for testing
const mockSupabaseEnv = {
  SUPABASE_URL: 'https://agyjovdugmtopasyvlng.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-key'
};

// =============================================================================
// Test Utilities
// =============================================================================

/**
 * Make a request to the Edge Function with proper headers
 */
async function makeEdgeFunctionRequest(
  endpoint: string,
  params: Record<string, string> = {}
): Promise<Response> {
  const url = new URL(endpoint);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const startTime = performance.now();

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${mockSupabaseEnv.SUPABASE_SERVICE_ROLE_KEY}`
    }
  });

  const endTime = performance.now();
  const responseTime = endTime - startTime;

  // Attach response time for performance tests
  (response as any).responseTime = responseTime;

  return response;
}

/**
 * Validate ServicePackage structure according to contract
 */
function validateServicePackage(pkg: any): pkg is ServicePackage {
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
    typeof pkg.available === 'boolean'
  );
}

/**
 * Validate API response structure
 */
function validateApiResponse(response: any): response is AdminProductsCoverageApiResponse {
  if (response.success === true) {
    return (
      Array.isArray(response.data) &&
      typeof response.meta === 'object' &&
      typeof response.meta.count === 'number' &&
      Array.isArray(response.meta.technologies)
    );
  } else {
    return (
      response.success === false &&
      typeof response.error === 'object' &&
      typeof response.error.code === 'string' &&
      typeof response.error.message === 'string'
    );
  }
}

// =============================================================================
// Contract Tests - Technology Filtering
// =============================================================================

describe('Admin Products Coverage API - Technology Filtering', () => {

  it('should accept valid single technology type', async () => {
    const response = await makeEdgeFunctionRequest(EDGE_FUNCTION_URL, {
      technologies: 'FIBRE'
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(validateApiResponse(data)).toBe(true);

    if (data.success) {
      expect(data.meta.technologies).toContain('FIBRE');
      data.data.forEach((pkg: any) => {
        expect(validateServicePackage(pkg)).toBe(true);
        expect(pkg.technology).toBe('FIBRE');
      });
    }
  }, TEST_TIMEOUT);

  it('should accept valid multiple technology types', async () => {
    const response = await makeEdgeFunctionRequest(EDGE_FUNCTION_URL, {
      technologies: 'FIBRE,FIXED_WIRELESS'
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(validateApiResponse(data)).toBe(true);

    if (data.success) {
      expect(data.meta.technologies).toEqual(['FIBRE', 'FIXED_WIRELESS']);
      data.data.forEach((pkg: any) => {
        expect(validateServicePackage(pkg)).toBe(true);
        expect(['FIBRE', 'FIXED_WIRELESS']).toContain(pkg.technology);
      });
    }
  }, TEST_TIMEOUT);

  it('should accept all valid technology types', async () => {
    const response = await makeEdgeFunctionRequest(EDGE_FUNCTION_URL, {
      technologies: 'FIBRE,FIXED_WIRELESS,LTE'
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(validateApiResponse(data)).toBe(true);

    if (data.success) {
      expect(data.meta.technologies).toEqual(['FIBRE', 'FIXED_WIRELESS', 'LTE']);
    }
  }, TEST_TIMEOUT);

  it('should reject invalid technology types', async () => {
    const response = await makeEdgeFunctionRequest(EDGE_FUNCTION_URL, {
      technologies: 'INVALID_TECH'
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('INVALID_TECHNOLOGY');
    expect(data.error.message).toContain('INVALID_TECH');
  }, TEST_TIMEOUT);

  it('should reject mixed valid and invalid technology types', async () => {
    const response = await makeEdgeFunctionRequest(EDGE_FUNCTION_URL, {
      technologies: 'FIBRE,INVALID_TECH,FIXED_WIRELESS'
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('INVALID_TECHNOLOGY');
  }, TEST_TIMEOUT);

  it('should reject missing technologies parameter', async () => {
    const response = await makeEdgeFunctionRequest(EDGE_FUNCTION_URL);

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('MISSING_PARAMETERS');
    expect(data.error.message).toContain('technologies');
  }, TEST_TIMEOUT);

});

// =============================================================================
// Contract Tests - Promotional Pricing
// =============================================================================

describe('Admin Products Coverage API - Promotional Pricing', () => {

  it('should include promotional pricing when available', async () => {
    const response = await makeEdgeFunctionRequest(EDGE_FUNCTION_URL, {
      technologies: 'FIBRE'
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    if (data.success) {
      const promotionalProducts = data.data.filter((pkg: any) => pkg.promotionalOffer);

      promotionalProducts.forEach((pkg: any) => {
        expect(pkg.promotionalOffer).toMatchObject({
          freeInstallation: expect.any(Boolean),
          freeRouter: expect.any(Boolean)
        });

        // If promotional pricing exists, should show original price
        if (pkg.promotionalOffer.discountedPrice) {
          expect(pkg.originalPrice).toBeGreaterThan(pkg.price);
          expect(pkg.promotionalOffer.validUntil).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        }
      });
    }
  }, TEST_TIMEOUT);

  it('should show original pricing when no promotions active', async () => {
    const response = await makeEdgeFunctionRequest(EDGE_FUNCTION_URL, {
      technologies: 'LTE' // Assuming LTE has no promotions
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    if (data.success) {
      data.data.forEach((pkg: any) => {
        if (!pkg.promotionalOffer) {
          expect(pkg.originalPrice).toBeUndefined();
        }
      });
    }
  }, TEST_TIMEOUT);

  it('should handle expired promotional pricing correctly', async () => {
    // This test validates that expired promotions are not included
    const response = await makeEdgeFunctionRequest(EDGE_FUNCTION_URL, {
      technologies: 'FIBRE,FIXED_WIRELESS'
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    if (data.success) {
      data.data.forEach((pkg: any) => {
        if (pkg.promotionalOffer && pkg.promotionalOffer.validUntil) {
          const validUntilDate = new Date(pkg.promotionalOffer.validUntil);
          const now = new Date();
          expect(validUntilDate.getTime()).toBeGreaterThan(now.getTime());
        }
      });
    }
  }, TEST_TIMEOUT);

});

// =============================================================================
// Contract Tests - Error Handling
// =============================================================================

describe('Admin Products Coverage API - Error Handling', () => {

  it('should handle OPTIONS requests (CORS preflight)', async () => {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'OPTIONS'
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET');
  }, TEST_TIMEOUT);

  it('should reject non-GET methods', async () => {
    const response = await fetch(EDGE_FUNCTION_URL + '?technologies=FIBRE', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('INVALID_REQUEST');
    expect(data.error.message).toContain('POST');
  }, TEST_TIMEOUT);

  it('should provide health check endpoint', async () => {
    const healthUrl = EDGE_FUNCTION_URL + '/health';
    const response = await fetch(healthUrl);

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.service).toBe('admin-products-coverage');
    expect(data.environment.supabaseConfigured).toBe(true);
    expect(data.environment.serviceKeyConfigured).toBe(true);
  }, TEST_TIMEOUT);

  it('should handle database connection errors gracefully', async () => {
    // This test will need to be implemented once we have actual database queries
    // For now, we validate the error response structure
    const response = await makeEdgeFunctionRequest(EDGE_FUNCTION_URL, {
      technologies: 'FIBRE'
    });

    // Even if successful, validate error response structure would be correct
    expect(response.status).toBeOneOf([200, 500]);

    const data = await response.json();
    if (!data.success) {
      expect(data.error.code).toMatch(/^[A-Z_]+$/);
      expect(data.error.message).toBeTruthy();
    }
  }, TEST_TIMEOUT);

});

// =============================================================================
// Contract Tests - Response Format Compliance
// =============================================================================

describe('Admin Products Coverage API - Response Format', () => {

  it('should return valid ServicePackage objects', async () => {
    const response = await makeEdgeFunctionRequest(EDGE_FUNCTION_URL, {
      technologies: 'FIBRE'
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
    expect(typeof data.meta).toBe('object');
    expect(typeof data.meta.count).toBe('number');
    expect(data.meta.count).toBe(data.data.length);

    data.data.forEach((pkg: any) => {
      expect(validateServicePackage(pkg)).toBe(true);

      // Validate specific contract requirements
      expect(pkg.id).toBeTruthy();
      expect(pkg.name).toBeTruthy();
      expect(['FIBRE', 'FIXED_WIRELESS', 'LTE']).toContain(pkg.technology);
      expect(pkg.provider).toBeTruthy();
      expect(pkg.speed).toMatch(/^\d+Mbps$/);
      expect(pkg.price).toBeGreaterThan(0);
      expect(pkg.installation).toBeGreaterThanOrEqual(0);
      expect(pkg.router).toBeGreaterThanOrEqual(0);
      expect([12, 24, 36]).toContain(pkg.contract);
      expect(Array.isArray(pkg.features)).toBe(true);
      expect(typeof pkg.available).toBe('boolean');
    });
  }, TEST_TIMEOUT);

  it('should include proper CORS headers', async () => {
    const response = await makeEdgeFunctionRequest(EDGE_FUNCTION_URL, {
      technologies: 'FIBRE'
    });

    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(response.headers.get('Content-Type')).toContain('application/json');
  }, TEST_TIMEOUT);

  it('should include cache control headers', async () => {
    const response = await makeEdgeFunctionRequest(EDGE_FUNCTION_URL, {
      technologies: 'FIBRE'
    });

    expect(response.headers.get('Cache-Control')).toContain('max-age=300');
  }, TEST_TIMEOUT);

  it('should handle coverage area parameter', async () => {
    const response = await makeEdgeFunctionRequest(EDGE_FUNCTION_URL, {
      technologies: 'FIBRE',
      coverageArea: 'johannesburg-north'
    });

    // Should accept the parameter without error (even if not implemented yet)
    expect(response.status).toBe(200);
  }, TEST_TIMEOUT);

});

// =============================================================================
// Contract Tests - Performance Requirements
// =============================================================================

describe('Admin Products Coverage API - Performance', () => {

  it('should respond within 500ms for typical requests', async () => {
    const response = await makeEdgeFunctionRequest(EDGE_FUNCTION_URL, {
      technologies: 'FIBRE'
    });

    expect(response.status).toBe(200);
    expect((response as any).responseTime).toBeLessThan(PERFORMANCE_THRESHOLD);
  }, TEST_TIMEOUT);

  it('should respond within 500ms for multiple technologies', async () => {
    const response = await makeEdgeFunctionRequest(EDGE_FUNCTION_URL, {
      technologies: 'FIBRE,FIXED_WIRELESS,LTE'
    });

    expect(response.status).toBe(200);
    expect((response as any).responseTime).toBeLessThan(PERFORMANCE_THRESHOLD);
  }, TEST_TIMEOUT);

  it('should handle concurrent requests efficiently', async () => {
    const requests = Array(5).fill(null).map(() =>
      makeEdgeFunctionRequest(EDGE_FUNCTION_URL, {
        technologies: 'FIBRE'
      })
    );

    const responses = await Promise.all(requests);

    responses.forEach((response) => {
      expect(response.status).toBe(200);
      expect((response as any).responseTime).toBeLessThan(PERFORMANCE_THRESHOLD * 2); // Allow 2x for concurrent load
    });
  }, TEST_TIMEOUT * 2);

});

// =============================================================================
// Test Lifecycle Hooks
// =============================================================================

beforeAll(async () => {
  // Validate test environment is properly configured
  expect(EDGE_FUNCTION_URL).toBeTruthy();
  expect(mockSupabaseEnv.SUPABASE_URL).toBeTruthy();

  console.log('🧪 Admin Products Coverage Contract Tests');
  console.log('📍 Edge Function URL:', EDGE_FUNCTION_URL);
  console.log('⚡ Performance Threshold:', PERFORMANCE_THRESHOLD + 'ms');
  console.log('');
  console.log('⚠️  TDD Notice: These tests MUST FAIL initially until implementation is complete (T007-T009)');
});

beforeEach(() => {
  // Reset any test state if needed
});

afterAll(() => {
  console.log('');
  console.log('✅ Contract tests completed');
  console.log('📝 Next: Implement Edge Function logic (T007-T009) to make these tests pass');
});

// =============================================================================
// Custom Vitest Matchers
// =============================================================================

declare global {
  namespace Vi {
    interface Assertion<T = any> {
      toBeOneOf(values: T[]): void;
    }
  }
}

expect.extend({
  toBeOneOf(received: any, values: any[]) {
    const pass = values.includes(received);
    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be one of ${values.join(', ')}`
          : `expected ${received} to be one of ${values.join(', ')}`
    };
  }
});

export {};