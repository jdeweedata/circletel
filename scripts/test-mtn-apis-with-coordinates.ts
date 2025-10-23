/**
 * MTN API Test with Known Coordinates
 * Tests both MTN Business and Consumer APIs
 * Uses pre-determined coordinates for the test addresses
 */

import { MTNWMSClient } from '../lib/coverage/mtn/wms-client';

// Test locations with coordinates (manually geocoded)
const TEST_LOCATIONS = [
  {
    name: 'George, South Africa',
    address: 'Test location in George, Western Cape',
    lat: -33.688037,
    lng: 23.046141,
    type: 'test'
  }
];

interface TestResult {
  name: string;
  address: string;
  type: string;
  coordinates: { lat: number; lng: number };
  businessAPI: {
    success: boolean;
    duration?: number;
    results?: any[];
    layerCount?: number;
    error?: string;
  };
  consumerAPI: {
    success: boolean;
    duration?: number;
    results?: any[];
    layerCount?: number;
    error?: string;
  };
}

async function testLocation(location: typeof TEST_LOCATIONS[0]): Promise<TestResult> {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Testing: ${location.name} Address`);
  console.log(`Address: ${location.address}`);
  console.log(`Coordinates: ${location.lat}, ${location.lng}`);
  console.log('='.repeat(80));

  const result: TestResult = {
    name: location.name,
    address: location.address,
    type: location.type,
    coordinates: { lat: location.lat, lng: location.lng },
    businessAPI: {
      success: false
    },
    consumerAPI: {
      success: false
    }
  };

  try {
    console.log('\n📡 Querying MTN APIs...');
    const mtnClient = new MTNWMSClient();

    const startTime = Date.now();
    const coverageResult = await mtnClient.checkCoverage({
      lat: location.lat,
      lng: location.lng
    });
    const duration = Date.now() - startTime;

    console.log(`\nQuery completed in ${duration}ms\n`);

    // Business API Results
    console.log(`${'─'.repeat(80)}`);
    console.log(`MTN BUSINESS API (Wholesale)`);
    console.log('─'.repeat(80));

    if (coverageResult.business.length > 0) {
      result.businessAPI.success = true;
      result.businessAPI.duration = duration;
      result.businessAPI.results = coverageResult.business;
      result.businessAPI.layerCount = coverageResult.business.length;

      console.log(`✅ Coverage Found`);
      console.log(`   Layers detected: ${coverageResult.business.length}\n`);

      coverageResult.business.forEach((layer, index) => {
        console.log(`   Layer ${index + 1}:`);
        console.log(`     Name: ${layer.layer || 'Unknown'}`);
        console.log(`     Has Signal: ${layer.hasSignal ? 'Yes' : 'No'}`);
        if (layer.signalStrength) {
          console.log(`     Signal Strength: ${layer.signalStrength}`);
        }
        if (layer.serviceTypes && layer.serviceTypes.length > 0) {
          console.log(`     Service Types: ${layer.serviceTypes.join(', ')}`);
        }
        if (layer.properties) {
          console.log(`     Properties:`, JSON.stringify(layer.properties, null, 8));
        }
        console.log('');
      });
    } else {
      console.log(`⚠️  No coverage found\n`);
    }

    // Consumer API Results
    console.log(`${'─'.repeat(80)}`);
    console.log(`MTN CONSUMER API`);
    console.log('─'.repeat(80));

    if (coverageResult.consumer.length > 0) {
      result.consumerAPI.success = true;
      result.consumerAPI.duration = duration;
      result.consumerAPI.results = coverageResult.consumer;
      result.consumerAPI.layerCount = coverageResult.consumer.length;

      console.log(`✅ Coverage Found`);
      console.log(`   Layers detected: ${coverageResult.consumer.length}\n`);

      coverageResult.consumer.forEach((layer, index) => {
        console.log(`   Layer ${index + 1}:`);
        console.log(`     Name: ${layer.layer || 'Unknown'}`);
        console.log(`     Has Signal: ${layer.hasSignal ? 'Yes' : 'No'}`);
        if (layer.signalStrength) {
          console.log(`     Signal Strength: ${layer.signalStrength}`);
        }
        if (layer.serviceTypes && layer.serviceTypes.length > 0) {
          console.log(`     Service Types: ${layer.serviceTypes.join(', ')}`);
        }
        if (layer.properties) {
          console.log(`     Properties:`, JSON.stringify(layer.properties, null, 8));
        }
        console.log('');
      });
    } else {
      console.log(`⚠️  No coverage found\n`);
    }

  } catch (error) {
    console.error(`\n❌ Error during test:`);
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    result.businessAPI.error = errorMessage;
    result.consumerAPI.error = errorMessage;
  }

  return result;
}

async function runAllTests() {
  console.log('\n');
  console.log('█'.repeat(80));
  console.log('MTN API COMPREHENSIVE TEST');
  console.log('Testing Business (Wholesale) and Consumer APIs');
  console.log('█'.repeat(80));

  const results: TestResult[] = [];

  for (const location of TEST_LOCATIONS) {
    const result = await testLocation(location);
    results.push(result);

    // Delay between tests to avoid rate limiting
    if (TEST_LOCATIONS.indexOf(location) < TEST_LOCATIONS.length - 1) {
      console.log(`\n⏳ Waiting 3 seconds before next test...\n`);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  // Print Summary
  console.log('\n\n');
  console.log('█'.repeat(80));
  console.log('TEST SUMMARY');
  console.log('█'.repeat(80));

  for (const result of results) {
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`${result.type.toUpperCase()} ADDRESS`);
    console.log(`Address: ${result.address}`);
    console.log(`Coordinates: ${result.coordinates.lat}, ${result.coordinates.lng}`);
    console.log('─'.repeat(80));

    console.log(`\n📡 Business API:`);
    if (result.businessAPI.success) {
      console.log(`   Status: ✅ Success`);
      console.log(`   Duration: ${result.businessAPI.duration}ms`);
      console.log(`   Layers Found: ${result.businessAPI.layerCount}`);
    } else {
      console.log(`   Status: ⚠️  No Coverage`);
      if (result.businessAPI.error) {
        console.log(`   Error: ${result.businessAPI.error}`);
      }
    }

    console.log(`\n📡 Consumer API:`);
    if (result.consumerAPI.success) {
      console.log(`   Status: ✅ Success`);
      console.log(`   Duration: ${result.consumerAPI.duration}ms`);
      console.log(`   Layers Found: ${result.consumerAPI.layerCount}`);
    } else {
      console.log(`   Status: ⚠️  No Coverage`);
      if (result.consumerAPI.error) {
        console.log(`   Error: ${result.consumerAPI.error}`);
      }
    }
  }

  // Save results to JSON
  const fs = await import('fs');
  const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
  const filename = `test-results/mtn-api-test-${timestamp}.json`;

  // Ensure test-results directory exists
  try {
    fs.mkdirSync('test-results', { recursive: true });
  } catch (e) {
    // Directory might already exist
  }

  fs.writeFileSync(filename, JSON.stringify(results, null, 2));
  console.log(`\n📄 Full results saved to: ${filename}`);

  console.log('\n' + '█'.repeat(80));
  console.log('TEST COMPLETE');
  console.log('█'.repeat(80) + '\n');
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
