/**
 * CircleTel Coverage API Integration Test Suite
 *
 * Tests all coverage module APIs:
 * - MTN WMS Client (Business)
 * - MTN WMS Realtime Client (Consumer)
 * - MTN Wholesale Client
 * - DFA Client
 * - Aggregation Service
 * - Geographic Validation
 */

import { mtnWMSClient } from '../lib/coverage/mtn/wms-client';
import { mtnWMSRealtimeClient } from '../lib/coverage/mtn/wms-realtime-client';
import { checkDFACoverage } from '../lib/coverage/dfa/client';
import { CoverageAggregationService } from '../lib/coverage/aggregation-service';
import { validateSouthAfricanCoordinates } from '../lib/coverage/mtn/geo-validation';
import { Coordinates } from '../lib/coverage/types';

// Test addresses with known coverage
const TEST_LOCATIONS = {
  johannesburg_cbd: {
    address: 'Johannesburg CBD, Johannesburg, 2001',
    coordinates: { lat: -26.2041, lng: 28.0473 },
    expected: { mtn_5g: true, mtn_lte: true, fibre: true }
  },
  pretoria_centurion: {
    address: 'Centurion, Pretoria, 0157',
    coordinates: { lat: -25.8601, lng: 28.1871 },
    expected: { mtn_5g: true, mtn_lte: true, fibre: true }
  },
  heritage_hill: {
    address: 'Heritage Hill, Johannesburg, 2091',
    coordinates: { lat: -26.0433, lng: 27.9608 },
    expected: { mtn_5g: true, mtn_lte: true }
  },
  fish_eagle: {
    address: '35 Fish Eagle Drive, Fourways, 2055',
    coordinates: { lat: -26.0147, lng: 28.0053 },
    expected: { mtn_5g: true, mtn_lte: true }
  }
};

interface TestResult {
  api: string;
  location: string;
  status: 'pass' | 'fail' | 'error';
  responseTime: number;
  details: any;
  error?: string;
}

const results: TestResult[] = [];

// Helper: Measure execution time
async function measureTime<T>(fn: () => Promise<T>): Promise<{ result: T; time: number }> {
  const start = Date.now();
  const result = await fn();
  const time = Date.now() - start;
  return { result, time };
}

// Test 1: Geographic Validation
async function testGeoValidation() {
  console.log('\n🌍 Testing Geographic Validation...');

  for (const [name, location] of Object.entries(TEST_LOCATIONS)) {
    try {
      const { result: validation, time } = await measureTime(() =>
        Promise.resolve(validateSouthAfricanCoordinates(location.coordinates))
      );

      results.push({
        api: 'Geographic Validation',
        location: name,
        status: validation.isValid ? 'pass' : 'fail',
        responseTime: time,
        details: {
          coordinates: location.coordinates,
          validation: validation.isValid,
          reason: validation.reason
        }
      });

      console.log(`  ✓ ${name}: ${validation.isValid ? 'Valid' : 'Invalid'} (${time}ms)`);
    } catch (error) {
      results.push({
        api: 'Geographic Validation',
        location: name,
        status: 'error',
        responseTime: 0,
        details: null,
        error: error instanceof Error ? error.message : String(error)
      });
      console.log(`  ✗ ${name}: Error - ${error}`);
    }
  }
}

// Test 2: MTN WMS Client (Business)
async function testMTNWMSClient() {
  console.log('\n📡 Testing MTN WMS Client (Business)...');

  for (const [name, location] of Object.entries(TEST_LOCATIONS)) {
    try {
      const { result: coverage, time } = await measureTime(() =>
        mtnWMSClient.checkCoverage(location.coordinates, ['lte', '5g'])
      );

      results.push({
        api: 'MTN WMS (Business)',
        location: name,
        status: coverage.success ? 'pass' : 'fail',
        responseTime: time,
        details: {
          coordinates: location.coordinates,
          services: coverage.data?.services || [],
          available: coverage.data?.available,
          error: coverage.error
        }
      });

      const servicesFound = coverage.data?.services?.length || 0;
      console.log(`  ${coverage.success ? '✓' : '✗'} ${name}: ${servicesFound} services (${time}ms)`);
    } catch (error) {
      results.push({
        api: 'MTN WMS (Business)',
        location: name,
        status: 'error',
        responseTime: 0,
        details: null,
        error: error instanceof Error ? error.message : String(error)
      });
      console.log(`  ✗ ${name}: Error - ${error}`);
    }
  }
}

// Test 3: MTN WMS Realtime Client (Consumer)
async function testMTNRealtimeClient() {
  console.log('\n📡 Testing MTN WMS Realtime Client (Consumer)...');

  for (const [name, location] of Object.entries(TEST_LOCATIONS)) {
    try {
      const { result: coverage, time } = await measureTime(() =>
        mtnWMSRealtimeClient.checkCoverage(location.coordinates)
      );

      results.push({
        api: 'MTN WMS Realtime (Consumer)',
        location: name,
        status: coverage.success ? 'pass' : 'fail',
        responseTime: time,
        details: {
          coordinates: location.coordinates,
          services: coverage.data?.services || [],
          available: coverage.data?.available,
          error: coverage.error
        }
      });

      const servicesFound = coverage.data?.services?.length || 0;
      console.log(`  ${coverage.success ? '✓' : '✗'} ${name}: ${servicesFound} services (${time}ms)`);
    } catch (error) {
      results.push({
        api: 'MTN WMS Realtime (Consumer)',
        location: name,
        status: 'error',
        responseTime: 0,
        details: null,
        error: error instanceof Error ? error.message : String(error)
      });
      console.log(`  ✗ ${name}: Error - ${error}`);
    }
  }
}

// Test 4: DFA Coverage Check
async function testDFAClient() {
  console.log('\n🏢 Testing DFA Coverage Client...');

  for (const [name, location] of Object.entries(TEST_LOCATIONS)) {
    try {
      const { result: coverage, time } = await measureTime(() =>
        checkDFACoverage(location.coordinates)
      );

      results.push({
        api: 'DFA Coverage',
        location: name,
        status: coverage.success ? 'pass' : 'fail',
        responseTime: time,
        details: {
          coordinates: location.coordinates,
          available: coverage.data?.available,
          services: coverage.data?.services || [],
          error: coverage.error
        }
      });

      console.log(`  ${coverage.success ? '✓' : '✗'} ${name}: ${coverage.data?.available ? 'Available' : 'Not available'} (${time}ms)`);
    } catch (error) {
      results.push({
        api: 'DFA Coverage',
        location: name,
        status: 'error',
        responseTime: 0,
        details: null,
        error: error instanceof Error ? error.message : String(error)
      });
      console.log(`  ✗ ${name}: Error - ${error}`);
    }
  }
}

// Test 5: Coverage Aggregation Service
async function testAggregationService() {
  console.log('\n🔀 Testing Coverage Aggregation Service...');

  const service = CoverageAggregationService.getInstance();

  for (const [name, location] of Object.entries(TEST_LOCATIONS)) {
    try {
      const { result: aggregated, time } = await measureTime(() =>
        service.aggregateCoverage(location.coordinates, {
          providers: ['mtn'],
          includeAlternatives: true
        })
      );

      const providerCount = Object.keys(aggregated.providers).length;
      const serviceCount = aggregated.bestServices?.length || 0;

      results.push({
        api: 'Aggregation Service',
        location: name,
        status: aggregated.overallCoverage ? 'pass' : 'fail',
        responseTime: time,
        details: {
          coordinates: location.coordinates,
          providers: providerCount,
          services: serviceCount,
          overallCoverage: aggregated.overallCoverage,
          bestServices: aggregated.bestServices
        }
      });

      console.log(`  ${aggregated.overallCoverage ? '✓' : '✗'} ${name}: ${providerCount} providers, ${serviceCount} services (${time}ms)`);
    } catch (error) {
      results.push({
        api: 'Aggregation Service',
        location: name,
        status: 'error',
        responseTime: 0,
        details: null,
        error: error instanceof Error ? error.message : String(error)
      });
      console.log(`  ✗ ${name}: Error - ${error}`);
    }
  }
}

// Generate Summary Report
function generateReport() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 COVERAGE API INTEGRATION TEST RESULTS');
  console.log('='.repeat(80));

  const apis = [...new Set(results.map(r => r.api))];

  for (const api of apis) {
    const apiResults = results.filter(r => r.api === api);
    const passed = apiResults.filter(r => r.status === 'pass').length;
    const failed = apiResults.filter(r => r.status === 'fail').length;
    const errors = apiResults.filter(r => r.status === 'error').length;
    const avgTime = apiResults.reduce((sum, r) => sum + r.responseTime, 0) / apiResults.length;

    console.log(`\n${api}:`);
    console.log(`  ✓ Passed: ${passed}/${apiResults.length}`);
    console.log(`  ✗ Failed: ${failed}/${apiResults.length}`);
    console.log(`  ⚠ Errors: ${errors}/${apiResults.length}`);
    console.log(`  ⏱ Avg Response Time: ${avgTime.toFixed(0)}ms`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('OVERALL STATISTICS');
  console.log('='.repeat(80));

  const totalTests = results.length;
  const totalPassed = results.filter(r => r.status === 'pass').length;
  const totalFailed = results.filter(r => r.status === 'fail').length;
  const totalErrors = results.filter(r => r.status === 'error').length;
  const successRate = ((totalPassed / totalTests) * 100).toFixed(1);

  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${totalPassed} (${successRate}%)`);
  console.log(`Failed: ${totalFailed}`);
  console.log(`Errors: ${totalErrors}`);

  // Save results to JSON
  const fs = require('fs');
  const outputPath = './scripts/coverage-api-test-results.json';
  fs.writeFileSync(outputPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      total: totalTests,
      passed: totalPassed,
      failed: totalFailed,
      errors: totalErrors,
      successRate: parseFloat(successRate)
    },
    results
  }, null, 2));

  console.log(`\n📄 Detailed results saved to: ${outputPath}`);
  console.log('='.repeat(80));
}

// Main execution
async function main() {
  console.log('🚀 CircleTel Coverage API Integration Tests');
  console.log('Testing Date:', new Date().toISOString());
  console.log('='.repeat(80));

  try {
    await testGeoValidation();
    await testMTNWMSClient();
    await testMTNRealtimeClient();
    await testDFAClient();
    await testAggregationService();

    generateReport();

    // Exit with appropriate code
    const hasErrors = results.some(r => r.status === 'error');
    const hasFailed = results.some(r => r.status === 'fail');

    if (hasErrors) {
      console.log('\n⚠️  Tests completed with ERRORS');
      process.exit(1);
    } else if (hasFailed) {
      console.log('\n⚠️  Tests completed with FAILURES');
      process.exit(1);
    } else {
      console.log('\n✅ All tests PASSED');
      process.exit(0);
    }
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Run tests
main().catch(console.error);
