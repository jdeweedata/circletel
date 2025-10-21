/**
 * Comprehensive MTN Integration Test Suite
 *
 * This script tests:
 * 1. MTN API Endpoints (Business WMS, Consumer API)
 * 2. Database Integration (providers, logs, health monitoring)
 * 3. Admin Backend Integration
 * 4. Coverage-to-Package Integration
 * 5. Performance & Monitoring
 *
 * Run: npx tsx scripts/comprehensive-mtn-integration-test.ts
 */

import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://agyjovdugmtopasyvlng.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3006';

// Test coordinates (real South African locations)
const TEST_LOCATIONS = [
  { name: 'Johannesburg CBD', lat: -26.2041, lng: 28.0473 },
  { name: 'Cape Town City', lat: -33.9249, lng: 18.4241 },
  { name: 'Durban Beachfront', lat: -29.8587, lng: 31.0218 },
  { name: 'Pretoria', lat: -25.7479, lng: 28.2293 },
  { name: 'Sandton', lat: -26.1076, lng: 28.0567 }
];

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Test results tracking
interface TestResult {
  testName: string;
  passed: boolean;
  duration: number;
  details: any;
  error?: string;
}

const testResults: TestResult[] = [];

// Utility functions
function log(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') {
  const icons = {
    info: '🔵',
    success: '✅',
    error: '❌',
    warning: '⚠️'
  };
  console.log(`${icons[type]} ${message}`);
}

async function runTest(name: string, testFn: () => Promise<any>): Promise<TestResult> {
  const startTime = Date.now();
  log(`Running: ${name}`, 'info');

  try {
    const details = await testFn();
    const duration = Date.now() - startTime;
    const result: TestResult = { testName: name, passed: true, duration, details };
    testResults.push(result);
    log(`PASSED: ${name} (${duration}ms)`, 'success');
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    const result: TestResult = { testName: name, passed: false, duration, details: null, error: errorMessage };
    testResults.push(result);
    log(`FAILED: ${name} - ${errorMessage}`, 'error');
    return result;
  }
}

// =====================================================
// TEST 1: Database Schema Verification
// =====================================================
async function testDatabaseSchema() {
  const tests = [];

  // Check fttb_network_providers table
  const { data: providers, error: providersError } = await supabase
    .from('fttb_network_providers')
    .select('*')
    .limit(1);

  if (providersError) throw new Error(`fttb_network_providers table error: ${providersError.message}`);
  tests.push({ table: 'fttb_network_providers', exists: true });

  // Check provider_api_logs table
  const { data: logs, error: logsError } = await supabase
    .from('provider_api_logs')
    .select('*')
    .limit(1);

  if (logsError) throw new Error(`provider_api_logs table error: ${logsError.message}`);
  tests.push({ table: 'provider_api_logs', exists: true });

  // Check provider_configuration table
  const { data: config, error: configError } = await supabase
    .from('provider_configuration')
    .select('*')
    .limit(1);

  if (configError) throw new Error(`provider_configuration table error: ${configError.message}`);
  tests.push({ table: 'provider_configuration', exists: true });

  return { tables: tests, summary: 'All required tables exist' };
}

// =====================================================
// TEST 2: MTN Provider Configuration
// =====================================================
async function testMTNProviderConfig() {
  const expectedProviders = ['mtn_wholesale', 'mtn_business_wms', 'mtn_consumer'];

  const { data: providers, error } = await supabase
    .from('fttb_network_providers')
    .select('*')
    .in('name', expectedProviders);

  if (error) throw new Error(`Failed to fetch MTN providers: ${error.message}`);
  if (!providers || providers.length === 0) throw new Error('No MTN providers found in database');

  const foundProviders = providers.map(p => ({
    name: p.name,
    displayName: p.display_name,
    type: p.provider_type,
    technology: p.technology,
    active: p.active,
    priority: p.priority,
    healthStatus: p.health_status,
    hasApiCredentials: !!p.api_credentials,
    hasApiUrl: !!p.coverage_api_url
  }));

  // Verify all expected providers are present
  for (const expected of expectedProviders) {
    if (!foundProviders.find(p => p.name === expected)) {
      throw new Error(`Missing provider: ${expected}`);
    }
  }

  return {
    providers: foundProviders,
    count: providers.length,
    summary: `Found ${providers.length} MTN providers configured`
  };
}

// =====================================================
// TEST 3: MTN Coverage Check API (POST)
// =====================================================
async function testMTNCoverageAPI() {
  const location = TEST_LOCATIONS[0]; // Johannesburg

  const response = await fetch(`${API_BASE_URL}/api/coverage/mtn/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      coordinates: { lat: location.lat, lng: location.lng },
      includeSignalStrength: true
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API returned ${response.status}: ${errorText}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(`API returned success=false: ${data.error || 'Unknown error'}`);
  }

  return {
    location: location.name,
    coordinates: { lat: location.lat, lng: location.lng },
    servicesFound: data.data?.services?.length || 0,
    services: data.data?.services?.map((s: any) => ({
      type: s.type,
      available: s.available,
      signal: s.signal
    })) || [],
    provider: data.data?.provider,
    requestId: data.data?.requestId,
    locationInfo: data.data?.location
  };
}

// =====================================================
// TEST 4: Geographic Validation API
// =====================================================
async function testGeoValidationAPI() {
  const location = TEST_LOCATIONS[1]; // Cape Town

  const response = await fetch(`${API_BASE_URL}/api/coverage/geo-validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      coordinates: { lat: location.lat, lng: location.lng },
      includeLocationInfo: true
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API returned ${response.status}: ${errorText}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(`Validation failed: ${data.error || 'Unknown error'}`);
  }

  return {
    location: location.name,
    isValid: data.data?.isValid,
    confidence: data.data?.confidence,
    province: data.data?.province,
    nearestCity: data.data?.nearestCity,
    warnings: data.data?.warnings || [],
    locationInfo: data.data?.locationInfo
  };
}

// =====================================================
// TEST 5: Monitoring API
// =====================================================
async function testMonitoringAPI() {
  const statsResponse = await fetch(`${API_BASE_URL}/api/coverage/mtn/monitoring?action=stats&window=3600000`);

  if (!statsResponse.ok) {
    const errorText = await statsResponse.text();
    throw new Error(`Stats API returned ${statsResponse.status}: ${errorText}`);
  }

  const statsData = await statsResponse.json();

  if (!statsData.success) {
    throw new Error(`Monitoring API returned success=false: ${statsData.error || 'Unknown error'}`);
  }

  const healthResponse = await fetch(`${API_BASE_URL}/api/coverage/mtn/monitoring?action=health`);
  const healthData = await healthResponse.json();

  return {
    stats: {
      totalRequests: statsData.data?.totalRequests || 0,
      successfulRequests: statsData.data?.successfulRequests || 0,
      failedRequests: statsData.data?.failedRequests || 0,
      cacheHits: statsData.data?.cacheHits || 0,
      averageResponseTime: statsData.data?.averageResponseTime || 0
    },
    health: {
      status: healthData.data?.status || 'unknown',
      successRate: healthData.data?.successRate || 0,
      averageResponseTime: healthData.data?.averageResponseTime || 0,
      consecutiveFailures: healthData.data?.consecutiveFailures || 0
    }
  };
}

// =====================================================
// TEST 6: Database Health Metrics Functions
// =====================================================
async function testDatabaseHealthFunctions() {
  // Get a provider ID
  const { data: providers } = await supabase
    .from('fttb_network_providers')
    .select('id, name')
    .eq('name', 'mtn_wholesale')
    .single();

  if (!providers) throw new Error('MTN Wholesale provider not found');

  // Test success rate calculation
  const { data: successRateData, error: successRateError } = await supabase
    .rpc('calculate_provider_success_rate_24h', { p_provider_id: providers.id });

  if (successRateError) throw new Error(`Success rate function failed: ${successRateError.message}`);

  // Test avg response time calculation
  const { data: avgTimeData, error: avgTimeError } = await supabase
    .rpc('calculate_provider_avg_response_time_24h', { p_provider_id: providers.id });

  if (avgTimeError) throw new Error(`Avg response time function failed: ${avgTimeError.message}`);

  // Test health metrics update
  const { error: healthError } = await supabase
    .rpc('update_provider_health_metrics', { p_provider_id: providers.id });

  if (healthError) throw new Error(`Health metrics update failed: ${healthError.message}`);

  // Verify updated metrics
  const { data: updatedProvider } = await supabase
    .from('fttb_network_providers')
    .select('health_status, success_rate_24h, avg_response_time_24h, last_health_check')
    .eq('id', providers.id)
    .single();

  return {
    providerId: providers.id,
    providerName: providers.name,
    successRate: successRateData,
    avgResponseTime: avgTimeData,
    updatedHealth: {
      status: updatedProvider?.health_status,
      successRate: updatedProvider?.success_rate_24h,
      avgResponseTime: updatedProvider?.avg_response_time_24h,
      lastCheck: updatedProvider?.last_health_check
    }
  };
}

// =====================================================
// TEST 7: API Logs Verification
// =====================================================
async function testAPILogsCreation() {
  // Get recent logs
  const { data: recentLogs, error } = await supabase
    .from('provider_api_logs')
    .select(`
      id,
      endpoint_type,
      success,
      response_time_ms,
      created_at,
      fttb_network_providers (
        name,
        display_name
      )
    `)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) throw new Error(`Failed to fetch API logs: ${error.message}`);

  const summary = {
    totalLogs: recentLogs?.length || 0,
    successCount: recentLogs?.filter(l => l.success).length || 0,
    failureCount: recentLogs?.filter(l => !l.success).length || 0,
    avgResponseTime: recentLogs && recentLogs.length > 0
      ? Math.round(recentLogs.reduce((sum, l) => sum + (l.response_time_ms || 0), 0) / recentLogs.length)
      : 0,
    recentLogs: recentLogs?.slice(0, 5).map(l => ({
      id: l.id,
      provider: l.fttb_network_providers?.name,
      endpoint: l.endpoint_type,
      success: l.success,
      responseTime: l.response_time_ms,
      timestamp: l.created_at
    })) || []
  };

  return summary;
}

// =====================================================
// TEST 8: Multi-Location Coverage Test
// =====================================================
async function testMultiLocationCoverage() {
  const results = [];

  for (const location of TEST_LOCATIONS.slice(0, 3)) { // Test first 3 locations
    try {
      const response = await fetch(`${API_BASE_URL}/api/coverage/mtn/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coordinates: { lat: location.lat, lng: location.lng }
        })
      });

      const data = await response.json();

      results.push({
        location: location.name,
        success: data.success,
        servicesCount: data.data?.services?.length || 0,
        hasLocation: !!data.data?.location
      });
    } catch (error) {
      results.push({
        location: location.name,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  return {
    testedLocations: results.length,
    successfulChecks: results.filter(r => r.success).length,
    results
  };
}

// =====================================================
// TEST 9: Provider Configuration Validation
// =====================================================
async function testProviderConfiguration() {
  const { data: configs, error } = await supabase
    .from('provider_configuration')
    .select('*');

  if (error) throw new Error(`Failed to fetch provider configuration: ${error.message}`);

  const expectedConfigs = [
    'fallback_strategy',
    'default_timeouts',
    'rate_limits',
    'geographic_bounds',
    'mtn_wholesale_products'
  ];

  const foundConfigs = configs?.map(c => ({
    key: c.config_key,
    hasValue: !!c.config_value,
    description: c.description
  })) || [];

  // Verify all expected configs exist
  for (const expected of expectedConfigs) {
    if (!foundConfigs.find(c => c.key === expected)) {
      throw new Error(`Missing configuration: ${expected}`);
    }
  }

  return {
    totalConfigs: configs?.length || 0,
    expectedConfigs: expectedConfigs.length,
    configs: foundConfigs,
    allConfigsPresent: foundConfigs.length >= expectedConfigs.length
  };
}

// =====================================================
// TEST 10: Performance Benchmark
// =====================================================
async function testPerformanceBenchmark() {
  const iterations = 5;
  const location = TEST_LOCATIONS[0];
  const responseTimes: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const startTime = Date.now();

    const response = await fetch(`${API_BASE_URL}/api/coverage/mtn/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        coordinates: { lat: location.lat, lng: location.lng }
      })
    });

    const duration = Date.now() - startTime;
    responseTimes.push(duration);

    if (!response.ok) {
      throw new Error(`Request ${i + 1} failed with status ${response.status}`);
    }
  }

  return {
    iterations,
    responseTimes,
    avgResponseTime: Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length),
    minResponseTime: Math.min(...responseTimes),
    maxResponseTime: Math.max(...responseTimes),
    performanceGrade: responseTimes.every(t => t < 5000) ? 'EXCELLENT' :
                      responseTimes.every(t => t < 10000) ? 'GOOD' :
                      responseTimes.every(t => t < 15000) ? 'FAIR' : 'POOR'
  };
}

// =====================================================
// Main Test Runner
// =====================================================
async function runAllTests() {
  console.log('\n='.repeat(60));
  console.log('🧪 MTN Integration Comprehensive Test Suite');
  console.log('='.repeat(60));
  console.log(`📍 API Base URL: ${API_BASE_URL}`);
  console.log(`📍 Supabase URL: ${SUPABASE_URL}`);
  console.log('='.repeat(60));
  console.log('\n');

  // Run all tests
  await runTest('1. Database Schema Verification', testDatabaseSchema);
  await runTest('2. MTN Provider Configuration', testMTNProviderConfig);
  await runTest('3. MTN Coverage Check API', testMTNCoverageAPI);
  await runTest('4. Geographic Validation API', testGeoValidationAPI);
  await runTest('5. Monitoring API', testMonitoringAPI);
  await runTest('6. Database Health Functions', testDatabaseHealthFunctions);
  await runTest('7. API Logs Verification', testAPILogsCreation);
  await runTest('8. Multi-Location Coverage Test', testMultiLocationCoverage);
  await runTest('9. Provider Configuration Validation', testProviderConfiguration);
  await runTest('10. Performance Benchmark', testPerformanceBenchmark);

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));

  const passed = testResults.filter(r => r.passed).length;
  const failed = testResults.filter(r => !r.passed).length;
  const totalDuration = testResults.reduce((sum, r) => sum + r.duration, 0);

  console.log(`✅ Passed: ${passed}/${testResults.length}`);
  console.log(`❌ Failed: ${failed}/${testResults.length}`);
  console.log(`⏱️  Total Duration: ${totalDuration}ms`);
  console.log('='.repeat(60));

  // Print failed tests details
  if (failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.filter(r => !r.passed).forEach(r => {
      console.log(`  • ${r.testName}`);
      console.log(`    Error: ${r.error}`);
    });
  }

  // Print detailed results
  console.log('\n📋 DETAILED RESULTS:\n');
  testResults.forEach((result, index) => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} Test ${index + 1}: ${result.testName}`);
    console.log(`   Duration: ${result.duration}ms`);
    if (result.passed && result.details) {
      console.log(`   Details:`, JSON.stringify(result.details, null, 2));
    }
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    console.log('');
  });

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  log(`Fatal error: ${error}`, 'error');
  console.error(error);
  process.exit(1);
});
