/**
 * Supersonic API Integration Test Script
 * Tests the complete implementation based on Playwright validation
 * 
 * Run: npx tsx scripts/test-supersonic-integration.ts
 */

import { checkCoverageWithFallback } from '../lib/coverage/coverage-fallback-service';

// Test locations from Playwright validation
const TEST_LOCATIONS = [
  {
    name: 'Centurion (Heritage Hill) - 5G Expected',
    address: '18 Rasmus Erasmus Boulevard, Heritage Hill, Centurion',
    latitude: -25.903104,
    longitude: 28.1706496
  },
  {
    name: 'Cape Town CBD - Fibre Expected',
    address: 'Long Street, Cape Town CBD',
    latitude: -33.9249,
    longitude: 18.4241
  },
  {
    name: 'Johannesburg CBD - Fibre Expected',
    address: 'Commissioner Street, Johannesburg CBD',
    latitude: -26.2041,
    longitude: 28.0473
  }
];

interface TestResult {
  location: string;
  success: boolean;
  source: string;
  packageCount: number;
  responseTimeMs: number;
  supersonicAttempted: boolean;
  supersonicSuccess: boolean;
  mtnAttempted: boolean;
  mtnSuccess: boolean;
  error?: string;
}

async function testLocation(location: typeof TEST_LOCATIONS[0]): Promise<TestResult> {
  const startTime = Date.now();
  
  console.log(`\n🧪 Testing: ${location.name}`);
  console.log(`   Address: ${location.address}`);
  console.log(`   Coordinates: ${location.latitude}, ${location.longitude}`);

  try {
    const result = await checkCoverageWithFallback(
      location.address,
      {
        latitude: location.latitude,
        longitude: location.longitude
      },
      {
        preferSupersonic: true,
        enableRetry: true,
        maxRetries: 3,
        retryDelay: 5000
      }
    );

    const responseTime = Date.now() - startTime;

    console.log(`   ✅ Success: ${result.success}`);
    console.log(`   📦 Packages: ${result.packages.length}`);
    console.log(`   🔄 Source: ${result.source}`);
    console.log(`   ⏱️  Response Time: ${responseTime}ms`);
    console.log(`   📊 Metadata:`);
    console.log(`      - Supersonic Attempted: ${result.metadata.supersonicAttempted}`);
    console.log(`      - Supersonic Success: ${result.metadata.supersonicSuccess}`);
    console.log(`      - MTN Attempted: ${result.metadata.mtnAttempted}`);
    console.log(`      - MTN Success: ${result.metadata.mtnSuccess}`);
    if (result.metadata.fallbackReason) {
      console.log(`      - Fallback Reason: ${result.metadata.fallbackReason}`);
    }

    return {
      location: location.name,
      success: result.success,
      source: result.source,
      packageCount: result.packages.length,
      responseTimeMs: responseTime,
      supersonicAttempted: result.metadata.supersonicAttempted,
      supersonicSuccess: result.metadata.supersonicSuccess,
      mtnAttempted: result.metadata.mtnAttempted,
      mtnSuccess: result.metadata.mtnSuccess
    };

  } catch (error) {
    const err = error as Error;
    const responseTime = Date.now() - startTime;

    console.log(`   ❌ Error: ${err.message}`);
    console.log(`   ⏱️  Response Time: ${responseTime}ms`);

    return {
      location: location.name,
      success: false,
      source: 'error',
      packageCount: 0,
      responseTimeMs: responseTime,
      supersonicAttempted: false,
      supersonicSuccess: false,
      mtnAttempted: false,
      mtnSuccess: false,
      error: err.message
    };
  }
}

async function runTests() {
  console.log('🚀 Supersonic API Integration Test Suite');
  console.log('=========================================');
  console.log('Based on Playwright API validation (Oct 16, 2025)\n');

  const results: TestResult[] = [];

  for (const location of TEST_LOCATIONS) {
    const result = await testLocation(location);
    results.push(result);
    
    // Wait between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Print summary
  console.log('\n\n📊 Test Summary');
  console.log('===============\n');

  const successCount = results.filter(r => r.success).length;
  const supersonicSuccessCount = results.filter(r => r.supersonicSuccess).length;
  const mtnSuccessCount = results.filter(r => r.mtnSuccess).length;
  const avgResponseTime = results.reduce((sum, r) => sum + r.responseTimeMs, 0) / results.length;
  const totalPackages = results.reduce((sum, r) => sum + r.packageCount, 0);

  console.log(`Total Tests: ${results.length}`);
  console.log(`Successful: ${successCount} (${Math.round(successCount / results.length * 100)}%)`);
  console.log(`Failed: ${results.length - successCount}`);
  console.log(`\nProvider Success Rates:`);
  console.log(`  Supersonic: ${supersonicSuccessCount}/${results.length} (${Math.round(supersonicSuccessCount / results.length * 100)}%)`);
  console.log(`  MTN: ${mtnSuccessCount}/${results.length} (${Math.round(mtnSuccessCount / results.length * 100)}%)`);
  console.log(`\nPerformance:`);
  console.log(`  Average Response Time: ${Math.round(avgResponseTime)}ms`);
  console.log(`  Total Packages Found: ${totalPackages}`);

  console.log('\n📋 Detailed Results:\n');
  console.table(results.map(r => ({
    Location: r.location,
    Success: r.success ? '✅' : '❌',
    Source: r.source,
    Packages: r.packageCount,
    'Time (ms)': r.responseTimeMs,
    'Supersonic': r.supersonicSuccess ? '✅' : '❌',
    'MTN': r.mtnSuccess ? '✅' : '❌',
    Error: r.error || '-'
  })));

  // Validation against expected outcomes
  console.log('\n✅ Validation Checks:\n');
  
  const checks = [
    {
      name: 'At least one test successful',
      passed: successCount > 0
    },
    {
      name: 'Average response time < 35s',
      passed: avgResponseTime < 35000
    },
    {
      name: 'Fallback chain functional',
      passed: results.some(r => r.mtnAttempted)
    },
    {
      name: 'Packages returned for coverage areas',
      passed: totalPackages > 0
    }
  ];

  checks.forEach(check => {
    console.log(`${check.passed ? '✅' : '❌'} ${check.name}`);
  });

  const allChecksPassed = checks.every(c => c.passed);
  
  console.log(`\n${allChecksPassed ? '🎉' : '⚠️'} Overall Status: ${allChecksPassed ? 'PASSED' : 'NEEDS ATTENTION'}\n`);

  process.exit(allChecksPassed ? 0 : 1);
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
