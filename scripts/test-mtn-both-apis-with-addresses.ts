/**
 * MTN API Comprehensive Test with Address Geocoding
 * Tests both MTN Wholesale (Business) and Consumer APIs with real addresses
 */

import { MTNWMSClient } from '../lib/coverage/mtn/wms-client';
import { geocodeAddress } from '../lib/services/google-geocoding';

// Test addresses
const TEST_ADDRESSES = [
  {
    name: 'Residential',
    address: '18 Rasmus Erasmus, Heritage Hill',
    type: 'residential'
  },
  {
    name: 'Business',
    address: '7 Autumn Street, Rivonia, Sandton',
    type: 'business'
  }
];

interface TestResult {
  address: string;
  type: string;
  geocoded: {
    success: boolean;
    lat?: number;
    lng?: number;
    formattedAddress?: string;
    error?: string;
  };
  businessAPI: {
    success: boolean;
    duration?: number;
    results?: any[];
    error?: string;
  };
  consumerAPI: {
    success: boolean;
    duration?: number;
    results?: any[];
    error?: string;
  };
}

async function testAddress(addressData: typeof TEST_ADDRESSES[0]): Promise<TestResult> {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Testing: ${addressData.name} Address`);
  console.log(`Address: ${addressData.address}`);
  console.log('='.repeat(80));

  const result: TestResult = {
    address: addressData.address,
    type: addressData.type,
    geocoded: {
      success: false
    },
    businessAPI: {
      success: false
    },
    consumerAPI: {
      success: false
    }
  };

  try {
    // Step 1: Geocode the address
    console.log('\n📍 Step 1: Geocoding address...');
    const geocodeResult = await geocodeAddress(addressData.address);

    if (!geocodeResult.success || !geocodeResult.coordinates) {
      console.log(`❌ Geocoding failed: ${geocodeResult.error || 'Unknown error'}`);
      result.geocoded.success = false;
      result.geocoded.error = geocodeResult.error;
      return result;
    }

    const { lat, lng } = geocodeResult.coordinates;
    result.geocoded.success = true;
    result.geocoded.lat = lat;
    result.geocoded.lng = lng;
    result.geocoded.formattedAddress = geocodeResult.formattedAddress;

    console.log(`✅ Geocoded successfully:`);
    console.log(`   Latitude: ${lat}`);
    console.log(`   Longitude: ${lng}`);
    console.log(`   Formatted: ${geocodeResult.formattedAddress}`);

    // Step 2: Test MTN APIs
    console.log('\n📡 Step 2: Testing MTN APIs...');
    const mtnClient = new MTNWMSClient();

    const startTime = Date.now();
    const coverageResult = await mtnClient.checkCoverage({ lat, lng });
    const duration = Date.now() - startTime;

    // Business API Results
    console.log(`\n─── Business API Results ───`);
    if (coverageResult.business.length > 0) {
      result.businessAPI.success = true;
      result.businessAPI.duration = duration;
      result.businessAPI.results = coverageResult.business;

      console.log(`✅ Success (${duration}ms)`);
      console.log(`   Layers found: ${coverageResult.business.length}`);
      coverageResult.business.forEach((layer, index) => {
        console.log(`\n   Layer ${index + 1}:`);
        console.log(`     Name: ${layer.layer || 'Unknown'}`);
        console.log(`     Coverage: ${layer.hasSignal ? 'Available' : 'Not Available'}`);
        if (layer.signalStrength) {
          console.log(`     Signal: ${layer.signalStrength}`);
        }
        if (layer.serviceTypes && layer.serviceTypes.length > 0) {
          console.log(`     Services: ${layer.serviceTypes.join(', ')}`);
        }
      });
    } else {
      console.log(`⚠️  No coverage found`);
    }

    // Consumer API Results
    console.log(`\n─── Consumer API Results ───`);
    if (coverageResult.consumer.length > 0) {
      result.consumerAPI.success = true;
      result.consumerAPI.duration = duration;
      result.consumerAPI.results = coverageResult.consumer;

      console.log(`✅ Success (${duration}ms)`);
      console.log(`   Layers found: ${coverageResult.consumer.length}`);
      coverageResult.consumer.forEach((layer, index) => {
        console.log(`\n   Layer ${index + 1}:`);
        console.log(`     Name: ${layer.layer || 'Unknown'}`);
        console.log(`     Coverage: ${layer.hasSignal ? 'Available' : 'Not Available'}`);
        if (layer.signalStrength) {
          console.log(`     Signal: ${layer.signalStrength}`);
        }
        if (layer.serviceTypes && layer.serviceTypes.length > 0) {
          console.log(`     Services: ${layer.serviceTypes.join(', ')}`);
        }
      });
    } else {
      console.log(`⚠️  No coverage found`);
    }

  } catch (error) {
    console.error(`\n❌ Error during test: ${error instanceof Error ? error.message : 'Unknown error'}`);
    result.businessAPI.error = error instanceof Error ? error.message : 'Unknown error';
    result.consumerAPI.error = error instanceof Error ? error.message : 'Unknown error';
  }

  return result;
}

async function runAllTests() {
  console.log('\n');
  console.log('█'.repeat(80));
  console.log('MTN API COMPREHENSIVE TEST');
  console.log('Testing Business and Consumer APIs with Real Addresses');
  console.log('█'.repeat(80));

  const results: TestResult[] = [];

  for (const addressData of TEST_ADDRESSES) {
    const result = await testAddress(addressData);
    results.push(result);

    // Delay between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Print Summary
  console.log('\n\n');
  console.log('█'.repeat(80));
  console.log('TEST SUMMARY');
  console.log('█'.repeat(80));

  for (const result of results) {
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`${result.type.toUpperCase()} ADDRESS: ${result.address}`);
    console.log('─'.repeat(80));

    if (result.geocoded.success) {
      console.log(`📍 Geocoding: ✅ Success`);
      console.log(`   Coordinates: ${result.geocoded.lat}, ${result.geocoded.lng}`);
      console.log(`   Formatted: ${result.geocoded.formattedAddress}`);
    } else {
      console.log(`📍 Geocoding: ❌ Failed (${result.geocoded.error || 'Unknown error'})`);
      continue;
    }

    console.log(`\n📡 Business API: ${result.businessAPI.success ? '✅ Success' : '⚠️  No Results'} ${result.businessAPI.duration ? `(${result.businessAPI.duration}ms)` : ''}`);
    if (result.businessAPI.results) {
      console.log(`   Layers: ${result.businessAPI.results.length}`);
    }

    console.log(`📡 Consumer API: ${result.consumerAPI.success ? '✅ Success' : '⚠️  No Results'} ${result.consumerAPI.duration ? `(${result.consumerAPI.duration}ms)` : ''}`);
    if (result.consumerAPI.results) {
      console.log(`   Layers: ${result.consumerAPI.results.length}`);
    }
  }

  // Save results to JSON
  const fs = await import('fs');
  const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
  const filename = `test-results/mtn-comprehensive-test-${timestamp}.json`;

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
