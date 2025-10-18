#!/usr/bin/env tsx
/**
 * Test MTN WMS Client with Enhanced Headers
 *
 * This script tests the Tier 1 workaround for MTN anti-bot protection
 * by making direct coverage check requests with enhanced browser headers.
 *
 * Usage: npx tsx scripts/test-mtn-enhanced-headers.ts
 */

import { mtnWMSClient } from '../lib/coverage/mtn/wms-client';
import { Coordinates, ServiceType } from '../lib/coverage/types';

// Test locations in South Africa
const testLocations: Array<{ name: string; coords: Coordinates }> = [
  {
    name: 'Johannesburg CBD',
    coords: { lat: -26.2041, lng: 28.0473 }
  },
  {
    name: 'Pretoria Central',
    coords: { lat: -25.7479, lng: 28.2293 }
  },
  {
    name: 'Cape Town CBD',
    coords: { lat: -33.9249, lng: 18.4241 }
  },
  {
    name: 'Durban Beachfront',
    coords: { lat: -29.8587, lng: 31.0218 }
  }
];

// Service types to test
const serviceTypes: ServiceType[] = ['5g', 'lte', 'fibre', 'fixed_lte'];

async function testMTNCoverage() {
  console.log('🧪 Testing MTN WMS Client with Enhanced Headers\n');
  console.log('═'.repeat(60));

  let successCount = 0;
  let failureCount = 0;
  let http418Count = 0;

  for (const location of testLocations) {
    console.log(`\n📍 Testing: ${location.name}`);
    console.log(`   Coordinates: ${location.coords.lat}, ${location.coords.lng}`);

    try {
      const startTime = Date.now();

      // Test coverage check
      const results = await mtnWMSClient.checkCoverage(
        location.coords,
        serviceTypes
      );

      const duration = Date.now() - startTime;

      console.log(`   ✅ Success (${duration}ms)`);
      console.log(`   Services found: ${results.filter(r => r.success).length}/${results.length}`);

      // Show available services
      results.forEach(result => {
        if (result.success && result.data && result.data.length > 0) {
          console.log(`      - ${result.layer}: ${result.data.length} features`);
        }
      });

      successCount++;

    } catch (error: any) {
      console.log(`   ❌ Failed`);

      if (error.code === 'ANTI_BOT_PROTECTION' || error.message?.includes('418')) {
        console.log(`   🚫 HTTP 418 - Anti-bot protection still active`);
        http418Count++;
      } else {
        console.log(`   Error: ${error.message || error}`);
        console.log(`   Code: ${error.code || 'UNKNOWN'}`);
      }

      failureCount++;
    }

    // Add delay between requests to avoid rate limiting
    if (location !== testLocations[testLocations.length - 1]) {
      console.log('   ⏳ Waiting 2s before next test...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('\n📊 Test Summary:');
  console.log(`   Total locations tested: ${testLocations.length}`);
  console.log(`   ✅ Successful: ${successCount} (${Math.round(successCount/testLocations.length*100)}%)`);
  console.log(`   ❌ Failed: ${failureCount} (${Math.round(failureCount/testLocations.length*100)}%)`);

  if (http418Count > 0) {
    console.log(`   🚫 HTTP 418 errors: ${http418Count}`);
    console.log('\n⚠️  Anti-bot protection still active. Consider:');
    console.log('   1. Implementing Tier 2 (Playwright browser automation)');
    console.log('   2. Contacting MTN for official API access');
    console.log('   3. Using manual verification fallback');
  }

  if (successCount === testLocations.length) {
    console.log('\n🎉 All tests passed! Enhanced headers are working.');
    console.log('   The Tier 1 workaround successfully bypassed anti-bot protection.');
  } else if (successCount > 0) {
    console.log('\n⚠️  Partial success. Some locations work, others fail.');
    console.log('   This may indicate intermittent anti-bot protection.');
  } else {
    console.log('\n❌ All tests failed. Enhanced headers alone are not sufficient.');
    console.log('   Moving to Tier 2 (Playwright fallback) is recommended.');
  }

  console.log('\n' + '═'.repeat(60) + '\n');
}

// Run the test
testMTNCoverage().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
