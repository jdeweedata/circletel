/**
 * Simple DFA Coverage Test (No Dependencies)
 * Tests the DFA ArcGIS API directly without Supabase
 * Run: npx tsx scripts/test-dfa-simple.ts
 */

import axios from 'axios';

// Coordinate conversion utilities
function latLngToWebMercator(lat: number, lng: number): { x: number; y: number } {
  const x = lng * 20037508.34 / 180;
  let y = Math.log(Math.tan((90 + lat) * Math.PI / 360)) / (Math.PI / 180);
  y = y * 20037508.34 / 180;
  return { x, y };
}

function createBoundingBox(lat: number, lng: number, radiusMeters: number) {
  const center = latLngToWebMercator(lat, lng);
  return {
    xmin: center.x - radiusMeters,
    ymin: center.y - radiusMeters,
    xmax: center.x + radiusMeters,
    ymax: center.y + radiusMeters
  };
}

async function testDFACoverage(address: string, lat: number, lng: number) {
  console.log('🧪 DFA Coverage Test');
  console.log('='.repeat(80));
  console.log(`📍 Address: ${address}`);
  console.log(`   Coordinates: ${lat}, ${lng}`);
  console.log('');

  const baseUrl = 'https://gisportal.dfafrica.co.za/server/rest/services/API';
  const webMercator = latLngToWebMercator(lat, lng);

  // Test 1: Check Connected Buildings
  console.log('1️⃣  Checking Connected Buildings Layer...');
  try {
    const params = new URLSearchParams({
      f: 'json',
      returnGeometry: 'false',
      spatialRel: 'esriSpatialRelIntersects',
      geometry: JSON.stringify({ x: webMercator.x, y: webMercator.y }),
      geometryType: 'esriGeometryPoint',
      inSR: '102100',
      outFields: 'OBJECTID,DFA_Building_ID,Longitude,Latitude,DFA_Connected_Y_N,FTTH,Broadband,Precinct,Promotion',
      outSR: '102100'
    });

    const response = await axios.get(
      `${baseUrl}/DFA_Connected_Buildings/MapServer/0/query`,
      { params, timeout: 5000 }
    );

    if (response.data.features && response.data.features.length > 0) {
      const feature = response.data.features[0];
      const attrs = feature.attributes;
      
      console.log('   ✅ Found in Connected Buildings!');
      console.log(`   Building ID: ${attrs.DFA_Building_ID}`);
      console.log(`   Connected: ${attrs.DFA_Connected_Y_N}`);
      console.log(`   FTTH: ${attrs.FTTH || 'N/A'}`);
      console.log(`   Broadband: ${attrs.Broadband || 'N/A'}`);
      console.log(`   Precinct: ${attrs.Precinct || 'N/A'}`);
      console.log(`   Promotion: ${attrs.Promotion || 'N/A'}`);
      
      if (attrs.DFA_Connected_Y_N === 'Y') {
        console.log('');
        console.log('   🎉 ACTIVE FIBER CONNECTION AVAILABLE!');
        return { hasCoverage: true, type: 'connected', details: attrs };
      }
    } else {
      console.log('   ℹ️  Not in Connected Buildings layer');
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown'}`);
  }

  console.log('');

  // Test 2: Check Near-Net Buildings
  console.log('2️⃣  Checking Near-Net Buildings (within 200m)...');
  try {
    const bbox = createBoundingBox(lat, lng, 200);
    const params = new URLSearchParams({
      f: 'json',
      returnGeometry: 'true',
      spatialRel: 'esriSpatialRelIntersects',
      geometry: JSON.stringify(bbox),
      geometryType: 'esriGeometryEnvelope',
      inSR: '102100',
      outFields: 'OBJECTID,DFA_Building_ID,Building_Name,Street_Address',
      outSR: '102100'
    });

    const response = await axios.get(
      `${baseUrl}/Promotions/MapServer/1/query`,
      { params, timeout: 5000 }
    );

    if (response.data.features && response.data.features.length > 0) {
      console.log(`   ✅ Found ${response.data.features.length} near-net building(s)`);
      
      for (const feature of response.data.features.slice(0, 3)) {
        const attrs = feature.attributes;
        console.log(`   - ${attrs.Building_Name || 'Unnamed'}`);
        console.log(`     Address: ${attrs.Street_Address || 'N/A'}`);
      }
      
      console.log('');
      console.log('   📡 FIBER EXTENSION AVAILABLE (within 200m)');
      return { hasCoverage: true, type: 'near-net', count: response.data.features.length };
    } else {
      console.log('   ℹ️  No near-net buildings found within 200m');
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown'}`);
  }

  console.log('');
  console.log('   ❌ NO DFA FIBER COVERAGE AT THIS LOCATION');
  return { hasCoverage: false, type: 'none' };
}

// Test the user's address
const TEST_ADDRESS = '5 BenBernard Estate, Simonsvlei Rd, Paarl, 7624';
const TEST_LAT = -33.7275;
const TEST_LNG = 18.9667;

testDFACoverage(TEST_ADDRESS, TEST_LAT, TEST_LNG)
  .then(result => {
    console.log('');
    console.log('='.repeat(80));
    console.log('📊 Final Result:');
    console.log(`   Coverage: ${result.hasCoverage ? 'YES ✅' : 'NO ❌'}`);
    console.log(`   Type: ${result.type}`);
    console.log('='.repeat(80));
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
