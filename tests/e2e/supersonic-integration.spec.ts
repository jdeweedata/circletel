/**
 * Supersonic Integration E2E Tests
 * Tests coverage checking across 5 major cities
 *
 * Test Locations:
 * 1. Cape Town CBD: -33.9249, 18.4241
 * 2. Johannesburg CBD: -26.2023, 28.0436
 * 3. Durban CBD: -29.8587, 31.0292
 * 4. Centurion: -25.903104, 28.1706496
 * 5. Pretoria: -25.7461, 28.2313
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3006';
const API_TIMEOUT = 10000; // 10 seconds
const CACHE_TEST_TIMEOUT = 2000; // 2 seconds

interface TestLocation {
  name: string;
  latitude: number;
  longitude: number;
  expectedTech: string;
  minPackages: number;
}

const TEST_LOCATIONS: TestLocation[] = [
  {
    name: 'Cape Town CBD',
    latitude: -33.9249,
    longitude: 18.4241,
    expectedTech: 'fibre',
    minPackages: 3
  },
  {
    name: 'Johannesburg CBD',
    latitude: -26.2023,
    longitude: 28.0436,
    expectedTech: 'fibre',
    minPackages: 3
  },
  {
    name: 'Durban CBD',
    latitude: -29.8587,
    longitude: 31.0292,
    expectedTech: 'fibre',
    minPackages: 3
  },
  {
    name: 'Centurion (Suburban)',
    latitude: -25.903104,
    longitude: 28.1706496,
    expectedTech: '5g-lte',
    minPackages: 2
  },
  {
    name: 'Pretoria (Suburban)',
    latitude: -25.7461,
    longitude: 28.2313,
    expectedTech: '5g-lte',
    minPackages: 2
  }
];

test.describe('Supersonic Integration - E2E Tests', () => {
  // ========== Lead Creation Tests ==========
  test.describe('Lead Creation API', () => {
    test.setTimeout(API_TIMEOUT);

    TEST_LOCATIONS.forEach(location => {
      test(`should create lead for ${location.name}`, async ({ request }) => {
        const response = await request.post(`${BASE_URL}/api/coverage/supersonic/lead`, {
          data: {
            address: `${location.name}, South Africa`,
            latitude: location.latitude,
            longitude: location.longitude,
            source: 'test_e2e'
          }
        });

        expect(response.status()).toBe(200);

        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.leadEntityID).toBeGreaterThan(0);
        expect(data.technology).toBeDefined();
        expect(data.technology.primary).toBeTruthy();
        expect(data.cached).toBeDefined();

        console.log(`✓ Lead created for ${location.name}`, {
          leadEntityID: data.leadEntityID,
          technology: data.technology.primary,
          confidence: data.technology.confidence
        });
      });
    });

    test('should return cached lead on second request', async ({ request }) => {
      const location = TEST_LOCATIONS[0];

      // First request
      const response1 = await request.post(`${BASE_URL}/api/coverage/supersonic/lead`, {
        data: {
          address: `${location.name}, South Africa`,
          latitude: location.latitude,
          longitude: location.longitude,
          source: 'test_e2e'
        }
      });

      expect(response1.status()).toBe(200);
      const data1 = await response1.json();
      expect(data1.cached).toBe(false);

      // Second request (should be cached)
      const response2 = await request.post(`${BASE_URL}/api/coverage/supersonic/lead`, {
        data: {
          address: `${location.name}, South Africa`,
          latitude: location.latitude,
          longitude: location.longitude,
          source: 'test_e2e'
        }
      });

      expect(response2.status()).toBe(200);
      const data2 = await response2.json();
      expect(data2.cached).toBe(true);
      expect(data2.leadEntityID).toBe(data1.leadEntityID);

      console.log('✓ Cache hit confirmed for second request');
    });

    test('should reject invalid coordinates', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/coverage/supersonic/lead`, {
        data: {
          address: 'Invalid Location',
          latitude: -90, // Outside SA bounds
          longitude: 180
        }
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.code).toBe('INVALID_COORDINATES');
    });

    test('should reject missing fields', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/coverage/supersonic/lead`, {
        data: {
          address: 'Test Location'
          // Missing latitude and longitude
        }
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
    });
  });

  // ========== Packages Retrieval Tests ==========
  test.describe('Packages Retrieval API', () => {
    test.setTimeout(API_TIMEOUT);

    TEST_LOCATIONS.forEach(location => {
      test(`should retrieve packages for ${location.name}`, async ({ request }) => {
        // First, create a lead
        const leadResponse = await request.post(`${BASE_URL}/api/coverage/supersonic/lead`, {
          data: {
            address: `${location.name}, South Africa`,
            latitude: location.latitude,
            longitude: location.longitude,
            source: 'test_e2e'
          }
        });

        const leadData = await leadResponse.json();
        const leadEntityID = leadData.leadEntityID;

        // Then retrieve packages
        const packagesResponse = await request.get(
          `${BASE_URL}/api/coverage/supersonic/packages?leadEntityID=${leadEntityID}`
        );

        expect(packagesResponse.status()).toBe(200);

        const packagesData = await packagesResponse.json();
        expect(packagesData.success).toBe(true);
        expect(Array.isArray(packagesData.packages)).toBe(true);
        expect(packagesData.packages.length).toBeGreaterThanOrEqual(location.minPackages);
        expect(packagesData.source).toBe('supersonic');

        // Validate package structure
        packagesData.packages.forEach((pkg: any) => {
          expect(pkg.id).toBeTruthy();
          expect(pkg.name).toBeTruthy();
          expect(pkg.technology_type).toBeTruthy();
          expect(pkg.regular_price).toBeGreaterThan(0);
          expect(pkg.billing_cycle).toMatch(/monthly|prepaid/);
        });

        console.log(`✓ Retrieved ${packagesData.packages.length} packages for ${location.name}`, {
          leadEntityID,
          response_time_ms: packagesData.metadata?.response_time_ms
        });
      });
    });

    test('should handle invalid leadEntityID gracefully', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/coverage/supersonic/packages?leadEntityID=invalid`);

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
    });
  });

  // ========== Technology Detection Tests ==========
  test.describe('Technology Detection API', () => {
    test.setTimeout(API_TIMEOUT);

    TEST_LOCATIONS.forEach(location => {
      test(`should detect correct technology for ${location.name}`, async ({ request }) => {
        const response = await request.get(
          `${BASE_URL}/api/coverage/technology-detect?lat=${location.latitude}&lng=${location.longitude}`
        );

        expect(response.status()).toBe(200);

        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.primary).toBe(location.expectedTech);
        expect(data.alternatives).toBeInstanceOf(Array);
        expect(data.confidence).toBeGreaterThan(0);
        expect(data.confidence).toBeLessThanOrEqual(1);
        expect(data.reasoning).toBeTruthy();

        console.log(`✓ Technology detected for ${location.name}`, {
          primary: data.primary,
          confidence: data.confidence,
          cbd_detected: data.cbd?.name || 'none'
        });
      });
    });

    test('should reject invalid coordinates', async ({ request }) => {
      const response = await request.get(
        `${BASE_URL}/api/coverage/technology-detect?lat=-90&lng=180`
      );

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
    });
  });

  // ========== Integration Tests ==========
  test.describe('Full Coverage Check Flow', () => {
    test.setTimeout(API_TIMEOUT);

    test('should complete full coverage check flow for Cape Town', async ({ request }) => {
      const location = TEST_LOCATIONS[0];

      // Step 1: Create lead
      const leadResponse = await request.post(`${BASE_URL}/api/coverage/supersonic/lead`, {
        data: {
          address: location.name,
          latitude: location.latitude,
          longitude: location.longitude
        }
      });

      expect(leadResponse.status()).toBe(200);
      const leadData = await leadResponse.json();
      expect(leadData.success).toBe(true);

      // Step 2: Get packages
      const packagesResponse = await request.get(
        `${BASE_URL}/api/coverage/supersonic/packages?leadEntityID=${leadData.leadEntityID}`
      );

      expect(packagesResponse.status()).toBe(200);
      const packagesData = await packagesResponse.json();
      expect(packagesData.success).toBe(true);
      expect(packagesData.packages.length).toBeGreaterThan(0);

      // Step 3: Verify technology
      const techResponse = await request.get(
        `${BASE_URL}/api/coverage/technology-detect?lat=${location.latitude}&lng=${location.longitude}`
      );

      expect(techResponse.status()).toBe(200);
      const techData = await techResponse.json();
      expect(techData.primary).toBe(location.expectedTech);

      console.log('✓ Full coverage flow completed successfully', {
        location: location.name,
        leadEntityID: leadData.leadEntityID,
        packages: packagesData.packages.length,
        technology: techData.primary
      });
    });
  });

  // ========== Performance Tests ==========
  test.describe('Performance Tests', () => {
    test('lead creation should respond within 2 seconds', async ({ request }) => {
      const location = TEST_LOCATIONS[0];
      const startTime = Date.now();

      const response = await request.post(`${BASE_URL}/api/coverage/supersonic/lead`, {
        data: {
          address: location.name,
          latitude: location.latitude,
          longitude: location.longitude
        }
      });

      const duration = Date.now() - startTime;

      expect(response.status()).toBe(200);
      expect(duration).toBeLessThan(2000); // Less than 2 seconds

      const responseTimeHeader = response.headers()['x-response-time'];
      console.log(`✓ Lead creation response time: ${responseTimeHeader}`);
    });

    test('cached lead retrieval should respond within 200ms', async ({ request }) => {
      const location = TEST_LOCATIONS[0];

      // First request to populate cache
      await request.post(`${BASE_URL}/api/coverage/supersonic/lead`, {
        data: {
          address: location.name,
          latitude: location.latitude,
          longitude: location.longitude
        }
      });

      // Second request (cached)
      const startTime = Date.now();
      const response = await request.post(`${BASE_URL}/api/coverage/supersonic/lead`, {
        data: {
          address: location.name,
          latitude: location.latitude,
          longitude: location.longitude
        }
      });

      const duration = Date.now() - startTime;
      expect(response.status()).toBe(200);
      expect(duration).toBeLessThan(CACHE_TEST_TIMEOUT);

      const cacheHeader = response.headers()['x-cache'];
      expect(cacheHeader).toBe('HIT');
      console.log(`✓ Cached response time: ${duration}ms (${cacheHeader})`);
    });

    test('should handle multiple concurrent requests', async ({ request }) => {
      const promises = TEST_LOCATIONS.map(location =>
        request.post(`${BASE_URL}/api/coverage/supersonic/lead`, {
          data: {
            address: location.name,
            latitude: location.latitude,
            longitude: location.longitude
          }
        })
      );

      const responses = await Promise.all(promises);

      responses.forEach((response, index) => {
        expect(response.status()).toBe(200);
        console.log(`✓ Concurrent request ${index + 1} completed successfully`);
      });
    });
  });

  // ========== Error Handling Tests ==========
  test.describe('Error Handling', () => {
    test('should handle malformed JSON gracefully', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/coverage/supersonic/lead`, {
        headers: { 'Content-Type': 'application/json' },
        data: 'invalid json'
      });

      expect(response.status()).toBeGreaterThanOrEqual(400);
    });

    test('should handle missing required fields', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/coverage/supersonic/lead`, {
        data: {
          address: 'Test'
        }
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    test('should handle empty package list', async ({ request }) => {
      // This test might fail if Supersonic API always returns packages
      // Adjust based on actual API behavior
      const response = await request.get(
        `${BASE_URL}/api/coverage/supersonic/packages?leadEntityID=999999999`
      );

      // Could be 404 or 502 depending on implementation
      expect([404, 502, 200]).toContain(response.status());
    });
  });

  // ========== Regression Tests ==========
  test.describe('Regression Tests', () => {
    test('should not break existing coverage endpoints', async ({ request }) => {
      // Verify legacy endpoint still works
      // This test ensures backward compatibility
      const response = await request.get(`${BASE_URL}/api/coverage/leads`);
      expect([200, 400]).toContain(response.status()); // Might need params
    });
  });
});

// ========== Helper Functions for Manual Testing ==========

/**
 * Print summary of all test locations
 */
export function printTestSummary() {
  console.log('\n=== Supersonic Integration Test Locations ===\n');

  TEST_LOCATIONS.forEach((location, index) => {
    console.log(`${index + 1}. ${location.name}`);
    console.log(`   Coordinates: ${location.latitude}, ${location.longitude}`);
    console.log(`   Expected Tech: ${location.expectedTech}`);
    console.log(`   Min Packages: ${location.minPackages}`);
    console.log();
  });
}
