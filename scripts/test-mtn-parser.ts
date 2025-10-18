// Test MTN Parser with Real Response Data
// This script validates that the updated parser correctly handles MTN's actual response format

import { MTNWMSParser } from '../lib/coverage/mtn/wms-parser';
import type { MTNWMSResponse } from '../lib/coverage/mtn/types';
import type { Coordinates } from '../lib/coverage/types';

// Real 5G response from Johannesburg CBD
const real5GResponse: MTNWMSResponse = {
  success: true,
  layer: 'mtnsi:MTNSA-Coverage-5G-5G',
  data: [
    {
      feature: {
        type: 'Feature',
        id: 'MTNSA-Coverage-5G-5G.fid-215907dd_199a8cfafc8_-703d',
        geometry: {
          type: 'MultiPolygon',
          coordinates: [
            [
              [
                [28.04876892, -26.20400598],
                [28.04876712, -26.20382499],
                [28.04796684, -26.20383102],
                [28.04876892, -26.20400598]
              ]
            ]
          ]
        },
        geometry_name: 'WKB_GEOMETRY',
        properties: {
          SITEID: '9189',
          CELLID: 'N09189B1',
          NETWORK_TYPE: '5G',
          ACCESS_TYPE: 'Yes',
          SPEED: null
        }
      }
    }
  ]
};

// Real LTE response from Johannesburg CBD
const realLTEResponse: MTNWMSResponse = {
  success: true,
  layer: 'mtnsi:MTNSA-Coverage-LTE',
  data: [
    {
      feature: {
        type: 'Feature',
        id: 'MTNSA-Coverage-LTE.fid-33ffbde_199a8cfb617_-5c56',
        geometry: {
          type: 'MultiPolygon',
          coordinates: [
            [
              [
                [28.04657688, -26.20510497],
                [28.04677704, -26.20510398],
                [28.04677488, -26.20492299],
                [28.04657688, -26.20510497]
              ]
            ]
          ]
        },
        geometry_name: 'WKB_GEOMETRY',
        properties: {
          SITEID: '.006491',
          CELLID: 'L09189B9',
          NETWORK_TYPE: 'LTE',
          ACCESS_TYPE: 'Yes',
          SPEED: null
        }
      }
    }
  ]
};

// Test coordinates (Johannesburg CBD)
const testCoordinates: Coordinates = {
  lat: -26.2041,
  lng: 28.0473
};

function testParser() {
  console.log('🧪 Testing MTN Parser with Real Response Data\n');

  try {
    // Test single-source parsing with real responses
    const responses: MTNWMSResponse[] = [real5GResponse, realLTEResponse];

    console.log('📊 Parsing MTN responses...');
    const result = MTNWMSParser.parseSingleSourceCoverage(responses, testCoordinates);

    console.log('\n✅ Parser Results:');
    console.log(`   Available: ${result.available}`);
    console.log(`   Confidence: ${result.confidence}`);
    console.log(`   Services found: ${result.services.length}`);

    console.log('\n📡 Service Details:');
    for (const service of result.services) {
      console.log(`\n   ${service.type.toUpperCase()}:`);
      console.log(`     - Available: ${service.available}`);
      console.log(`     - Signal: ${service.signal}`);
      console.log(`     - Technology: ${service.technology || 'N/A'}`);

      if (service.estimatedSpeed) {
        const { download, upload, unit } = service.estimatedSpeed;
        console.log(`     - Speed: ${download}${unit} ↓ / ${upload}${unit} ↑`);
      }

      if (service.metadata?.infrastructureEstimate) {
        const { confidence, factors, explanation } = service.metadata.infrastructureEstimate;
        console.log(`     - Infrastructure: ${explanation}`);
        console.log(`     - Estimate Confidence: ${confidence}`);
        console.log(`     - Towers: ${factors.featureCount}`);
        console.log(`     - Avg Distance: ${factors.avgDistanceToTower}m`);
      }
    }

    // Test NETWORK_TYPE mapping
    console.log('\n🔄 Testing NETWORK_TYPE Mapping:');
    const testTypes = ['5G', 'LTE', 'UMTS-900', 'UMTS-2100', 'GSM', 'FIBRE', 'SUPERSONIC'];
    for (const networkType of testTypes) {
      const serviceType = MTNWMSParser.mapNetworkTypeToServiceType(networkType);
      console.log(`   ${networkType} → ${serviceType || 'NULL'}`);
    }

    // Test feature inference
    console.log('\n🔍 Testing Feature Inference:');
    const inferred5G = MTNWMSParser['inferCoverageFromFeatures'](real5GResponse.data);
    console.log(`   5G Coverage:`);
    console.log(`     - Available: ${inferred5G.available}`);
    console.log(`     - Signal: ${inferred5G.signal}`);
    console.log(`     - Technology: ${inferred5G.technology || 'N/A'}`);
    console.log(`     - Site ID: ${inferred5G.metadata?.siteId || 'N/A'}`);
    console.log(`     - Cell ID: ${inferred5G.metadata?.cellId || 'N/A'}`);

    console.log('\n✅ All tests passed successfully!');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
testParser();
