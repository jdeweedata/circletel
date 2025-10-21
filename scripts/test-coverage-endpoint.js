/**
 * Comprehensive Coverage Endpoint Testing
 * Tests MTN coverage API with various South African locations
 */

// Use built-in fetch (Node 18+) or fallback to https
const fetch = globalThis.fetch || (async (url, options) => {
  const https = require('https');
  const http = require('http');

  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const lib = urlObj.protocol === 'https:' ? https : http;

    const req = lib.request(url, {
      method: options.method || 'GET',
      headers: options.headers || {}
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          statusText: res.statusMessage,
          json: async () => JSON.parse(data)
        });
      });
    });

    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
});

const API_BASE = 'http://localhost:3000';

// Test locations across South Africa
const TEST_LOCATIONS = [
  {
    name: 'Johannesburg CBD',
    lat: -26.2041,
    lng: 28.0473,
    expectedProvince: 'Gauteng'
  },
  {
    name: 'Cape Town City Bowl',
    lat: -33.9249,
    lng: 18.4241,
    expectedProvince: 'Western Cape'
  },
  {
    name: 'Durban Beachfront',
    lat: -29.8587,
    lng: 31.0218,
    expectedProvince: 'KwaZulu-Natal'
  },
  {
    name: 'Pretoria Central',
    lat: -25.7479,
    lng: 28.2293,
    expectedProvince: 'Gauteng'
  },
  {
    name: 'Port Elizabeth (Gqeberha)',
    lat: -33.9608,
    lng: 25.6022,
    expectedProvince: 'Eastern Cape'
  },
  {
    name: 'Bloemfontein',
    lat: -29.1211,
    lng: 26.2149,
    expectedProvince: 'Free State'
  },
  {
    name: 'Nelspruit (Mbombela)',
    lat: -25.4655,
    lng: 30.9704,
    expectedProvince: 'Mpumalanga'
  },
  {
    name: 'Polokwane',
    lat: -23.9045,
    lng: 29.4689,
    expectedProvince: 'Limpopo'
  },
  {
    name: 'Kimberley',
    lat: -28.7322,
    lng: 24.7622,
    expectedProvince: 'Northern Cape'
  },
  {
    name: 'Rustenburg',
    lat: -25.6672,
    lng: 27.2424,
    expectedProvince: 'North West'
  }
];

// Test scenarios
const SCENARIOS = [
  {
    name: 'Valid Coordinates',
    test: (location) => ({ latitude: location.lat, longitude: location.lng })
  },
  {
    name: 'Address Query',
    test: (location) => ({ address: `${location.name}, South Africa` })
  },
  {
    name: 'Both Coordinates and Address',
    test: (location) => ({
      latitude: location.lat,
      longitude: location.lng,
      address: `${location.name}, South Africa`
    })
  }
];

// Performance tracking
const performanceStats = {
  responseTimes: [],
  errors: 0,
  successes: 0,
  totalTests: 0
};

async function testCoverageEndpoint(location, scenario) {
  const startTime = Date.now();

  try {
    const payload = scenario.test(location);

    const response = await fetch(`${API_BASE}/api/coverage/mtn/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const responseTime = Date.now() - startTime;
    performanceStats.responseTimes.push(responseTime);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Validate response structure
    if (!data.success) {
      throw new Error(data.error || 'API returned success: false');
    }

    // Validate required fields
    const requiredFields = ['services', 'provider', 'requestId'];
    const missingFields = requiredFields.filter(field => !(field in data));

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    performanceStats.successes++;
    performanceStats.totalTests++;

    return {
      success: true,
      responseTime,
      data: {
        servicesCount: data.services?.length || 0,
        provider: data.provider,
        requestId: data.requestId,
        location: data.location,
        services: data.services?.map(s => ({
          type: s.type,
          available: s.available,
          signal: s.signal
        }))
      }
    };

  } catch (error) {
    performanceStats.errors++;
    performanceStats.totalTests++;

    return {
      success: false,
      error: error.message,
      responseTime: Date.now() - startTime
    };
  }
}

async function runTests() {
  console.log('============================================');
  console.log('  Coverage Endpoint Comprehensive Testing');
  console.log('============================================\n');
  console.log(`📍 API: ${API_BASE}/api/coverage/mtn/check`);
  console.log(`📊 Test Locations: ${TEST_LOCATIONS.length}`);
  console.log(`🧪 Test Scenarios: ${SCENARIOS.length}`);
  console.log(`📈 Total Tests: ${TEST_LOCATIONS.length * SCENARIOS.length}\n`);

  const results = [];

  // Test each location with each scenario
  for (const location of TEST_LOCATIONS) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📍 Testing: ${location.name}`);
    console.log(`   Coordinates: ${location.lat}, ${location.lng}`);
    console.log(`   Expected Province: ${location.expectedProvince}`);
    console.log('─'.repeat(60));

    for (const scenario of SCENARIOS) {
      process.stdout.write(`  ${scenario.name}... `);

      const result = await testCoverageEndpoint(location, scenario);

      if (result.success) {
        console.log(`✅ ${result.responseTime}ms`);
        console.log(`     Services: ${result.data.servicesCount}`);
        console.log(`     Provider: ${result.data.provider}`);
        console.log(`     Request ID: ${result.data.requestId}`);

        if (result.data.location) {
          console.log(`     Location Info:`);
          console.log(`       - Province: ${result.data.location.province || 'N/A'}`);
          console.log(`       - City: ${result.data.location.nearestCity || 'N/A'}`);
          console.log(`       - Coverage Likelihood: ${result.data.location.coverageLikelihood || 'N/A'}`);
        }

        if (result.data.services && result.data.services.length > 0) {
          console.log(`     Available Services:`);
          result.data.services.forEach((service, idx) => {
            console.log(`       ${idx + 1}. ${service.type} - ${service.signal} signal`);
          });
        }
      } else {
        console.log(`❌ FAILED`);
        console.log(`     Error: ${result.error}`);
        console.log(`     Response Time: ${result.responseTime}ms`);
      }

      results.push({
        location: location.name,
        scenario: scenario.name,
        ...result
      });

      // Small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Calculate statistics
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${performanceStats.totalTests}`);
  console.log(`✅ Successes: ${performanceStats.successes} (${Math.round(performanceStats.successes / performanceStats.totalTests * 100)}%)`);
  console.log(`❌ Failures: ${performanceStats.errors} (${Math.round(performanceStats.errors / performanceStats.totalTests * 100)}%)`);
  console.log('');

  if (performanceStats.responseTimes.length > 0) {
    const avgResponseTime = Math.round(
      performanceStats.responseTimes.reduce((a, b) => a + b, 0) / performanceStats.responseTimes.length
    );
    const minResponseTime = Math.min(...performanceStats.responseTimes);
    const maxResponseTime = Math.max(...performanceStats.responseTimes);

    console.log('⏱️  PERFORMANCE METRICS');
    console.log('─'.repeat(60));
    console.log(`Average Response Time: ${avgResponseTime}ms`);
    console.log(`Min Response Time: ${minResponseTime}ms`);
    console.log(`Max Response Time: ${maxResponseTime}ms`);
    console.log('');

    // Performance grade
    let grade = 'POOR';
    if (avgResponseTime < 100) grade = 'EXCELLENT';
    else if (avgResponseTime < 500) grade = 'GOOD';
    else if (avgResponseTime < 1000) grade = 'ACCEPTABLE';

    console.log(`Performance Grade: ${grade}`);
    console.log('');
  }

  // Success by location
  console.log('📍 SUCCESS BY LOCATION');
  console.log('─'.repeat(60));
  TEST_LOCATIONS.forEach(location => {
    const locationResults = results.filter(r => r.location === location.name);
    const successes = locationResults.filter(r => r.success).length;
    const total = locationResults.length;
    const percentage = Math.round(successes / total * 100);

    console.log(`${location.name}: ${successes}/${total} (${percentage}%) ${percentage === 100 ? '✅' : '⚠️'}`);
  });
  console.log('');

  // Success by scenario
  console.log('🧪 SUCCESS BY SCENARIO');
  console.log('─'.repeat(60));
  SCENARIOS.forEach(scenario => {
    const scenarioResults = results.filter(r => r.scenario === scenario.name);
    const successes = scenarioResults.filter(r => r.success).length;
    const total = scenarioResults.length;
    const percentage = Math.round(successes / total * 100);

    console.log(`${scenario.name}: ${successes}/${total} (${percentage}%) ${percentage === 100 ? '✅' : '⚠️'}`);
  });
  console.log('');

  // Failed tests details
  const failures = results.filter(r => !r.success);
  if (failures.length > 0) {
    console.log('❌ FAILED TESTS DETAILS');
    console.log('─'.repeat(60));
    failures.forEach((failure, idx) => {
      console.log(`${idx + 1}. ${failure.location} - ${failure.scenario}`);
      console.log(`   Error: ${failure.error}`);
    });
    console.log('');
  }

  console.log('='.repeat(60));
  console.log(performanceStats.errors === 0 ? '✅ ALL TESTS PASSED!' : '⚠️ SOME TESTS FAILED');
  console.log('='.repeat(60));
  console.log('');

  return performanceStats.errors === 0;
}

runTests().then(success => {
  process.exit(success ? 0 : 1);
});
