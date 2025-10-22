/**
 * Test Script for DFA Coverage Integration
 *
 * Tests DFA ArcGIS API integration with known addresses
 * Run: npx tsx scripts/test-dfa-coverage.ts
 */

import { dfaCoverageClient } from '../lib/coverage/providers/dfa';
import { dfaProductMapper } from '../lib/coverage/providers/dfa';

// Test addresses from DFA portal analysis
const TEST_ADDRESSES = [
  {
    name: 'Sandton City (Connected)',
    latitude: -26.1076,
    longitude: 28.0567,
    expectedCoverage: 'connected' as const,
    description: 'Major shopping center with active DFA fiber'
  },
  {
    name: 'Jan Smuts Avenue, Johannesburg (Near-Net)',
    latitude: -26.1558,
    longitude: 28.0456,
    expectedCoverage: 'near-net' as const,
    description: 'Residential/commercial area near fiber infrastructure'
  },
  {
    name: 'Fourways, Johannesburg',
    latitude: -26.0114,
    longitude: 28.0062,
    expectedCoverage: 'connected' as const,
    description: 'Business district with fiber connectivity'
  },
  {
    name: 'Pretoria CBD',
    latitude: -25.7479,
    longitude: 28.2293,
    expectedCoverage: 'connected' as const,
    description: 'Capital city central business district'
  },
  {
    name: 'Remote Location (No Coverage)',
    latitude: -28.5,
    longitude: 27.5,
    expectedCoverage: 'none' as const,
    description: 'Rural area without fiber infrastructure'
  }
];

async function testDFACoverage() {
  console.log('🧪 DFA Coverage Integration Test');
  console.log('='.repeat(80));
  console.log('');

  for (const testAddress of TEST_ADDRESSES) {
    console.log(`📍 Testing: ${testAddress.name}`);
    console.log(`   Description: ${testAddress.description}`);
    console.log(`   Coordinates: ${testAddress.latitude}, ${testAddress.longitude}`);
    console.log(`   Expected: ${testAddress.expectedCoverage}`);
    console.log('');

    try {
      // Test 1: Check coverage
      const startTime = Date.now();
      const coverageResponse = await dfaCoverageClient.checkCoverage({
        latitude: testAddress.latitude,
        longitude: testAddress.longitude,
        checkNearNet: true,
        maxNearNetDistance: 200
      });
      const responseTime = Date.now() - startTime;

      console.log(`   ✅ Coverage Check Complete (${responseTime}ms)`);
      console.log(`   Coverage: ${coverageResponse.hasCoverage ? 'YES' : 'NO'}`);
      console.log(`   Type: ${coverageResponse.coverageType}`);
      console.log(`   Message: ${coverageResponse.message}`);

      // Test 2: Get products if coverage exists
      if (coverageResponse.hasCoverage) {
        const products = await dfaProductMapper.mapToProducts(coverageResponse);
        console.log(`   Products Available: ${products.length}`);

        if (products.length > 0) {
          console.log(`   Sample Product: ${products[0].name} - R${products[0].price}/month (${products[0].download_speed}/${products[0].upload_speed} Mbps)`);
          console.log(`   Installation: ${products[0].coverage_details.installation_note}`);
        }

        // Test 3: Get installation estimate
        const estimate = dfaProductMapper.getInstallationEstimate(coverageResponse);
        console.log(`   Installation Cost: ${estimate.estimatedCost}`);
        console.log(`   Installation Time: ${estimate.estimatedDays}`);

        // Test 4: Building/Near-Net details
        if (coverageResponse.coverageType === 'connected' && coverageResponse.buildingDetails) {
          console.log(`   Building ID: ${coverageResponse.buildingDetails.buildingId}`);
          console.log(`   FTTH: ${coverageResponse.buildingDetails.ftth || 'N/A'}`);
          console.log(`   Broadband: ${coverageResponse.buildingDetails.broadband || 'N/A'}`);
        } else if (coverageResponse.coverageType === 'near-net' && coverageResponse.nearNetDetails) {
          console.log(`   Distance: ${Math.round(coverageResponse.nearNetDetails.distance)}m`);
          console.log(`   Building: ${coverageResponse.nearNetDetails.buildingName}`);
          console.log(`   Address: ${coverageResponse.nearNetDetails.address}`);
        }
      }

      // Verify expectation
      const matches = coverageResponse.coverageType === testAddress.expectedCoverage;
      if (matches) {
        console.log(`   ✅ Result matches expectation`);
      } else {
        console.log(`   ⚠️  Result differs from expectation (got: ${coverageResponse.coverageType}, expected: ${testAddress.expectedCoverage})`);
      }

    } catch (error) {
      console.log(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      if (error instanceof Error && error.stack) {
        console.log(`   Stack: ${error.stack.split('\n')[1]}`);
      }
    }

    console.log('');
    console.log('-'.repeat(80));
    console.log('');
  }

  // Test 5: Health check
  console.log('🏥 DFA API Health Check');
  console.log('='.repeat(80));
  console.log('');

  try {
    const health = await dfaCoverageClient.checkHealth();
    console.log(`Status: ${health.healthy ? '✅ Healthy' : '❌ Unhealthy'}`);
    console.log(`Response Time: ${health.responseTime}ms`);
  } catch (error) {
    console.log(`❌ Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  console.log('');
  console.log('='.repeat(80));
  console.log('✅ DFA Coverage Integration Test Complete');
}

// Run tests
testDFACoverage().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
