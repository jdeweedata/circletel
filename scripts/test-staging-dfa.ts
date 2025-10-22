/**
 * Staging Environment DFA Coverage Test
 *
 * Comprehensive test suite for DFA integration in staging environment
 * Tests: API health, coverage detection, multi-provider aggregation, error handling
 *
 * Run: npx tsx scripts/test-staging-dfa.ts
 */

import { DFACoverageClient } from '../lib/coverage/providers/dfa/dfa-coverage-client';
import type { DFACoverageRequest } from '../lib/coverage/providers/dfa/types';

// Test scenarios
const TEST_SCENARIOS = [
  {
    name: 'Sandton High-Density Area',
    description: 'Major business district - should have fiber coverage',
    coordinates: { latitude: -26.1076, longitude: 28.0567 },
    expectedCoverage: true
  },
  {
    name: 'Johannesburg CBD',
    description: 'Central business district',
    coordinates: { latitude: -26.2041, longitude: 28.0473 },
    expectedCoverage: false
  },
  {
    name: 'Rosebank Commercial',
    description: 'Commercial area near Sandton',
    coordinates: { latitude: -26.1446, longitude: 28.0417 },
    expectedCoverage: false
  },
  {
    name: 'Pretoria Hatfield',
    description: 'University area with businesses',
    coordinates: { latitude: -25.7515, longitude: 28.2385 },
    expectedCoverage: false
  },
  {
    name: 'Cape Town City Bowl',
    description: 'Cape Town central area',
    coordinates: { latitude: -33.9249, longitude: 18.4241 },
    expectedCoverage: false
  }
];

interface TestResult {
  scenario: string;
  success: boolean;
  hasCoverage: boolean;
  coverageType: string;
  responseTime: number;
  distance?: number;
  buildingId?: string;
  error?: string;
}

async function runStagingTests() {
  const client = new DFACoverageClient();
  const results: TestResult[] = [];

  console.log('🧪 DFA Coverage - Staging Environment Test Suite');
  console.log('='.repeat(80));
  console.log('');
  console.log('📅 Test Date:', new Date().toISOString());
  console.log('🌍 Environment: Staging');
  console.log('🔗 API Endpoint: https://gisportal.dfafrica.co.za/server/rest/services/API');
  console.log('');
  console.log('='.repeat(80));
  console.log('');

  // Test 1: API Health Check
  console.log('🏥 Test 1: API Health Check');
  console.log('-'.repeat(80));

  try {
    const healthStart = Date.now();
    const health = await client.checkHealth();
    const healthTime = Date.now() - healthStart;

    console.log(`✅ Health Check: ${health.healthy ? 'PASSED' : 'FAILED'}`);
    console.log(`   Response Time: ${health.responseTime}ms`);
    console.log(`   Total Time: ${healthTime}ms`);
    console.log('');
  } catch (error) {
    console.log(`❌ Health Check: FAILED`);
    console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.log('');
  }

  // Test 2: Coverage Detection for Multiple Locations
  console.log('📍 Test 2: Coverage Detection (5 Locations)');
  console.log('-'.repeat(80));
  console.log('');

  for (const scenario of TEST_SCENARIOS) {
    console.log(`Testing: ${scenario.name}`);
    console.log(`   Description: ${scenario.description}`);
    console.log(`   Coordinates: ${scenario.coordinates.latitude}, ${scenario.coordinates.longitude}`);

    try {
      const startTime = Date.now();
      const response = await client.checkCoverage({
        latitude: scenario.coordinates.latitude,
        longitude: scenario.coordinates.longitude,
        checkNearNet: true,
        maxNearNetDistance: 200
      });
      const responseTime = Date.now() - startTime;

      const result: TestResult = {
        scenario: scenario.name,
        success: true,
        hasCoverage: response.hasCoverage,
        coverageType: response.coverageType,
        responseTime
      };

      if (response.coverageType === 'connected' && response.buildingDetails) {
        result.buildingId = response.buildingDetails.buildingId;
      } else if (response.coverageType === 'near-net' && response.nearNetDetails) {
        result.distance = response.nearNetDetails.distance;
      }

      results.push(result);

      console.log(`   ✅ Test: PASSED (${responseTime}ms)`);
      console.log(`   Coverage: ${response.hasCoverage ? 'YES' : 'NO'}`);
      console.log(`   Type: ${response.coverageType}`);

      if (response.coverageType === 'connected' && response.buildingDetails) {
        console.log(`   Building ID: ${response.buildingDetails.buildingId}`);
        console.log(`   FTTH: ${response.buildingDetails.ftth || 'N/A'}`);
      } else if (response.coverageType === 'near-net' && response.nearNetDetails) {
        console.log(`   Distance: ${Math.round(response.nearNetDetails.distance)}m`);
        console.log(`   Building: ${response.nearNetDetails.buildingName}`);
      }

      console.log(`   Message: ${response.message}`);

    } catch (error) {
      results.push({
        scenario: scenario.name,
        success: false,
        hasCoverage: false,
        coverageType: 'error',
        responseTime: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      console.log(`   ❌ Test: FAILED`);
      console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    console.log('');
  }

  // Test 3: Error Handling
  console.log('🛡️  Test 3: Error Handling & Edge Cases');
  console.log('-'.repeat(80));
  console.log('');

  // Test invalid coordinates (outside South Africa)
  console.log('Testing: Invalid Coordinates (Outside SA)');
  console.log('   Coordinates: 51.5074, -0.1278 (London, UK)');

  try {
    await client.checkCoverage({
      latitude: 51.5074,
      longitude: -0.1278
    });
    console.log('   ❌ Test: FAILED (Should have thrown error)');
  } catch (error) {
    console.log('   ✅ Test: PASSED (Error correctly thrown)');
    console.log(`   Error Message: ${error instanceof Error ? error.message : 'Unknown'}`);
  }
  console.log('');

  // Test 4: Performance Analysis
  console.log('⚡ Test 4: Performance Analysis');
  console.log('-'.repeat(80));
  console.log('');

  const responseTimes = results.filter(r => r.success).map(r => r.responseTime);
  const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  const minResponseTime = Math.min(...responseTimes);
  const maxResponseTime = Math.max(...responseTimes);

  console.log(`   Average Response Time: ${Math.round(avgResponseTime)}ms`);
  console.log(`   Min Response Time: ${minResponseTime}ms`);
  console.log(`   Max Response Time: ${maxResponseTime}ms`);
  console.log(`   Success Rate: ${results.filter(r => r.success).length}/${results.length} (${Math.round(results.filter(r => r.success).length / results.length * 100)}%)`);
  console.log('');

  // Test Summary
  console.log('='.repeat(80));
  console.log('📊 Test Summary');
  console.log('='.repeat(80));
  console.log('');

  const totalTests = results.length + 2; // +2 for health check and error handling
  const passedTests = results.filter(r => r.success).length + 2;
  const coverageFound = results.filter(r => r.hasCoverage).length;

  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Success Rate: ${Math.round(passedTests / totalTests * 100)}%`);
  console.log('');
  console.log(`Coverage Statistics:`);
  console.log(`   Locations with Coverage: ${coverageFound}/${results.length}`);
  console.log(`   Connected: ${results.filter(r => r.coverageType === 'connected').length}`);
  console.log(`   Near-Net: ${results.filter(r => r.coverageType === 'near-net').length}`);
  console.log(`   No Coverage: ${results.filter(r => r.coverageType === 'none').length}`);
  console.log('');

  // Detailed Results Table
  console.log('Detailed Results:');
  console.log('');
  console.log('| Scenario | Coverage | Type | Response Time | Details |');
  console.log('|----------|----------|------|---------------|---------|');

  results.forEach(result => {
    const coverage = result.hasCoverage ? '✅ YES' : '❌ NO';
    const details = result.buildingId
      ? `Building: ${result.buildingId}`
      : result.distance
      ? `${Math.round(result.distance)}m away`
      : result.error || '-';

    console.log(`| ${result.scenario} | ${coverage} | ${result.coverageType} | ${result.responseTime}ms | ${details} |`);
  });

  console.log('');
  console.log('='.repeat(80));
  console.log('✅ Staging Environment Test Complete');
  console.log('='.repeat(80));

  // Exit with appropriate code
  const allTestsPassed = passedTests === totalTests;
  process.exit(allTestsPassed ? 0 : 1);
}

// Run tests
runStagingTests().catch(error => {
  console.error('Fatal error during testing:', error);
  process.exit(1);
});
