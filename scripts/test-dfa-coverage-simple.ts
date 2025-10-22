/**
 * Simple DFA Coverage Test (No Database Required)
 *
 * Tests DFA ArcGIS API integration with known addresses
 * Run: npx tsx scripts/test-dfa-coverage-simple.ts
 */

import { DFACoverageClient } from '../lib/coverage/providers/dfa/dfa-coverage-client';

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
  const client = new DFACoverageClient();

  console.log('🧪 DFA Coverage API Test (Simple)');
  console.log('='.repeat(80));
  console.log('');

  for (const testAddress of TEST_ADDRESSES) {
    console.log(`📍 Testing: ${testAddress.name}`);
    console.log(`   Description: ${testAddress.description}`);
    console.log(`   Coordinates: ${testAddress.latitude}, ${testAddress.longitude}`);
    console.log(`   Expected: ${testAddress.expectedCoverage}`);
    console.log('');

    try {
      // Check coverage
      const startTime = Date.now();
      const coverageResponse = await client.checkCoverage({
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

      // Show coverage details
      if (coverageResponse.hasCoverage) {
        if (coverageResponse.coverageType === 'connected' && coverageResponse.buildingDetails) {
          console.log(`   Building ID: ${coverageResponse.buildingDetails.buildingId}`);
          console.log(`   Status: ${coverageResponse.buildingDetails.status}`);
          console.log(`   FTTH: ${coverageResponse.buildingDetails.ftth || 'N/A'}`);
          console.log(`   Broadband: ${coverageResponse.buildingDetails.broadband || 'N/A'}`);
          console.log(`   Precinct: ${coverageResponse.buildingDetails.precinct || 'N/A'}`);
          console.log(`   Promotion: ${coverageResponse.buildingDetails.promotion || 'N/A'}`);
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
        console.log(`   ⚠️  Result differs from expectation`);
        console.log(`      Got: ${coverageResponse.coverageType}`);
        console.log(`      Expected: ${testAddress.expectedCoverage}`);
      }

    } catch (error) {
      console.log(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      if (error instanceof Error && error.stack) {
        console.log(`   Stack trace:`);
        console.log(error.stack.split('\n').slice(0, 3).map(line => `      ${line}`).join('\n'));
      }
    }

    console.log('');
    console.log('-'.repeat(80));
    console.log('');
  }

  // Health check
  console.log('🏥 DFA API Health Check');
  console.log('='.repeat(80));
  console.log('');

  try {
    const health = await client.checkHealth();
    console.log(`Status: ${health.healthy ? '✅ Healthy' : '❌ Unhealthy'}`);
    console.log(`Response Time: ${health.responseTime}ms`);

    if (health.healthy) {
      console.log('');
      console.log('API Endpoint: https://gisportal.dfafrica.co.za/server/rest/services/API');
      console.log('Integration Status: ✅ Working');
    }
  } catch (error) {
    console.log(`❌ Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  console.log('');
  console.log('='.repeat(80));
  console.log('✅ DFA Coverage API Test Complete');
}

// Run tests
testDFACoverage().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
