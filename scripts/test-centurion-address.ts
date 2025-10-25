/**
 * Test MTN Coverage for Specific Centurion Address
 * Address: 18 Rasmus Erasmus Blvd, Heritage Hill, Centurion, South Africa
 */

import { MTNWMSClient } from '../lib/coverage/mtn/wms-client';

// Target address
const TARGET_ADDRESS = {
  name: 'Heritage Hill, Centurion',
  fullAddress: '18 Rasmus Erasmus Blvd, Heritage Hill, Centurion, South Africa',
  // Coordinates for Heritage Hill, Centurion (approximate)
  // You can verify these coordinates at: https://www.google.com/maps
  lat: -25.8535,
  lng: 28.1286
};

interface CoverageTestResult {
  address: string;
  coordinates: { lat: number; lng: number };
  timestamp: string;
  businessAPI: {
    success: boolean;
    duration?: number;
    layerCount?: number;
    layers?: Array<{
      name: string;
      hasSignal: boolean;
      signalStrength?: string;
      serviceTypes?: string[];
      properties?: any;
    }>;
    error?: string;
  };
  consumerAPI: {
    success: boolean;
    duration?: number;
    layerCount?: number;
    layers?: Array<{
      name: string;
      hasSignal: boolean;
      signalStrength?: string;
      serviceTypes?: string[];
      properties?: any;
    }>;
    error?: string;
  };
}

async function testCenturionAddress(): Promise<CoverageTestResult> {
  console.log('\n' + '═'.repeat(80));
  console.log('MTN COVERAGE TEST - CENTURION ADDRESS');
  console.log('═'.repeat(80));
  console.log(`\n📍 Address: ${TARGET_ADDRESS.fullAddress}`);
  console.log(`📍 Coordinates: ${TARGET_ADDRESS.lat}, ${TARGET_ADDRESS.lng}`);
  console.log(`⏰ Test Time: ${new Date().toISOString()}\n`);

  const result: CoverageTestResult = {
    address: TARGET_ADDRESS.fullAddress,
    coordinates: { lat: TARGET_ADDRESS.lat, lng: TARGET_ADDRESS.lng },
    timestamp: new Date().toISOString(),
    businessAPI: {
      success: false
    },
    consumerAPI: {
      success: false
    }
  };

  try {
    console.log('🔄 Initializing MTN WMS Client...');
    const mtnClient = new MTNWMSClient();

    console.log('📡 Querying MTN APIs (Business + Consumer)...\n');
    const startTime = Date.now();
    
    const coverageResult = await mtnClient.checkCoverage({
      lat: TARGET_ADDRESS.lat,
      lng: TARGET_ADDRESS.lng
    });
    
    const duration = Date.now() - startTime;
    console.log(`✅ Query completed in ${duration}ms\n`);

    // ========================================
    // BUSINESS API RESULTS
    // ========================================
    console.log('═'.repeat(80));
    console.log('MTN BUSINESS API (Wholesale WMS)');
    console.log('═'.repeat(80));

    if (coverageResult.business && coverageResult.business.length > 0) {
      result.businessAPI.success = true;
      result.businessAPI.duration = duration;
      result.businessAPI.layerCount = coverageResult.business.length;
      result.businessAPI.layers = [];

      console.log(`\n✅ Coverage Found!`);
      console.log(`📊 Total Layers: ${coverageResult.business.length}\n`);

      coverageResult.business.forEach((layer: any, index: number) => {
        const layerInfo = {
          name: layer.layer || 'Unknown',
          hasSignal: layer.hasSignal || false,
          signalStrength: layer.signalStrength,
          serviceTypes: layer.serviceTypes || [],
          properties: layer.properties || layer.data
        };

        result.businessAPI.layers!.push(layerInfo);

        console.log(`${'─'.repeat(80)}`);
        console.log(`Layer ${index + 1}: ${layerInfo.name}`);
        console.log(`${'─'.repeat(80)}`);
        console.log(`  🔵 Has Signal: ${layerInfo.hasSignal ? '✅ YES' : '❌ NO'}`);
        
        if (layerInfo.signalStrength) {
          console.log(`  📶 Signal Strength: ${layerInfo.signalStrength}`);
        }
        
        if (layerInfo.serviceTypes && layerInfo.serviceTypes.length > 0) {
          console.log(`  🌐 Service Types: ${layerInfo.serviceTypes.join(', ')}`);
        }
        
        if (layerInfo.properties) {
          console.log(`  📋 Properties:`);
          console.log(JSON.stringify(layerInfo.properties, null, 4));
        }
        console.log('');
      });
    } else {
      console.log(`\n⚠️  No Business API coverage found at this location\n`);
    }

    // ========================================
    // CONSUMER API RESULTS
    // ========================================
    console.log('═'.repeat(80));
    console.log('MTN CONSUMER API (GeoServer WMS)');
    console.log('═'.repeat(80));

    if (coverageResult.consumer && coverageResult.consumer.length > 0) {
      result.consumerAPI.success = true;
      result.consumerAPI.duration = duration;
      result.consumerAPI.layerCount = coverageResult.consumer.length;
      result.consumerAPI.layers = [];

      console.log(`\n✅ Coverage Found!`);
      console.log(`📊 Total Layers: ${coverageResult.consumer.length}\n`);

      coverageResult.consumer.forEach((layer: any, index: number) => {
        const layerInfo = {
          name: layer.layer || 'Unknown',
          hasSignal: layer.hasSignal || false,
          signalStrength: layer.signalStrength,
          serviceTypes: layer.serviceTypes || [],
          properties: layer.properties || layer.data
        };

        result.consumerAPI.layers!.push(layerInfo);

        console.log(`${'─'.repeat(80)}`);
        console.log(`Layer ${index + 1}: ${layerInfo.name}`);
        console.log(`${'─'.repeat(80)}`);
        console.log(`  🔵 Has Signal: ${layerInfo.hasSignal ? '✅ YES' : '❌ NO'}`);
        
        if (layerInfo.signalStrength) {
          console.log(`  📶 Signal Strength: ${layerInfo.signalStrength}`);
        }
        
        if (layerInfo.serviceTypes && layerInfo.serviceTypes.length > 0) {
          console.log(`  🌐 Service Types: ${layerInfo.serviceTypes.join(', ')}`);
        }
        
        if (layerInfo.properties) {
          console.log(`  📋 Properties:`);
          console.log(JSON.stringify(layerInfo.properties, null, 4));
        }
        console.log('');
      });
    } else {
      console.log(`\n⚠️  No Consumer API coverage found at this location\n`);
    }

  } catch (error) {
    console.error('\n❌ ERROR DURING TEST:');
    console.error(error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    result.businessAPI.error = errorMessage;
    result.consumerAPI.error = errorMessage;
  }

  return result;
}

async function main() {
  const result = await testCenturionAddress();

  // ========================================
  // SUMMARY
  // ========================================
  console.log('\n' + '═'.repeat(80));
  console.log('TEST SUMMARY');
  console.log('═'.repeat(80));
  console.log(`\n📍 Address: ${result.address}`);
  console.log(`📍 Coordinates: ${result.coordinates.lat}, ${result.coordinates.lng}`);
  console.log(`⏰ Timestamp: ${result.timestamp}\n`);

  console.log('─'.repeat(80));
  console.log('Business API (Wholesale WMS)');
  console.log('─'.repeat(80));
  if (result.businessAPI.success) {
    console.log(`✅ Status: SUCCESS`);
    console.log(`⏱️  Duration: ${result.businessAPI.duration}ms`);
    console.log(`📊 Layers Found: ${result.businessAPI.layerCount}`);
    if (result.businessAPI.layers) {
      console.log(`\n   Available Services:`);
      result.businessAPI.layers.forEach((layer, i) => {
        console.log(`   ${i + 1}. ${layer.name} - ${layer.hasSignal ? '✅ Signal' : '❌ No Signal'}`);
      });
    }
  } else {
    console.log(`⚠️  Status: NO COVERAGE`);
    if (result.businessAPI.error) {
      console.log(`❌ Error: ${result.businessAPI.error}`);
    }
  }

  console.log('\n' + '─'.repeat(80));
  console.log('Consumer API (GeoServer WMS)');
  console.log('─'.repeat(80));
  if (result.consumerAPI.success) {
    console.log(`✅ Status: SUCCESS`);
    console.log(`⏱️  Duration: ${result.consumerAPI.duration}ms`);
    console.log(`📊 Layers Found: ${result.consumerAPI.layerCount}`);
    if (result.consumerAPI.layers) {
      console.log(`\n   Available Services:`);
      result.consumerAPI.layers.forEach((layer, i) => {
        console.log(`   ${i + 1}. ${layer.name} - ${layer.hasSignal ? '✅ Signal' : '❌ No Signal'}`);
      });
    }
  } else {
    console.log(`⚠️  Status: NO COVERAGE`);
    if (result.consumerAPI.error) {
      console.log(`❌ Error: ${result.consumerAPI.error}`);
    }
  }

  // Save results to JSON
  const fs = await import('fs');
  const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
  const filename = `test-results/centurion-coverage-${timestamp}.json`;

  try {
    fs.mkdirSync('test-results', { recursive: true });
  } catch (e) {
    // Directory might already exist
  }

  fs.writeFileSync(filename, JSON.stringify(result, null, 2));
  console.log(`\n📄 Full results saved to: ${filename}`);

  console.log('\n' + '═'.repeat(80));
  console.log('TEST COMPLETE');
  console.log('═'.repeat(80) + '\n');
}

// Run the test
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
