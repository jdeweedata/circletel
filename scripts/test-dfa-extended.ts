/**
 * Extended DFA Coverage Test with Fiber Route Check
 * Tests DFA coverage and checks distance to nearest fiber infrastructure
 * Run: npx tsx scripts/test-dfa-extended.ts
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

function calculateDistance(point1: { x: number; y: number }, point2: { x: number; y: number }): number {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

async function testDFACoverageExtended(address: string, lat: number, lng: number) {
  console.log('🧪 DFA Extended Coverage Test');
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

  // Test 2: Check Near-Net Buildings (200m)
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

  // Test 3: Check Fiber Routes (500m) - to see if fiber is nearby
  console.log('3️⃣  Checking Fiber Infrastructure (within 500m)...');
  try {
    const bbox = createBoundingBox(lat, lng, 500);
    const params = new URLSearchParams({
      f: 'json',
      returnGeometry: 'true',
      spatialRel: 'esriSpatialRelIntersects',
      geometry: JSON.stringify(bbox),
      geometryType: 'esriGeometryEnvelope',
      inSR: '102100',
      outFields: 'OBJECTID,stage,ea1,totlength',
      outSR: '102100',
      where: "stage = 'Completed'"
    });

    const response = await axios.get(
      `${baseUrl}/API_BasedOSPLayers/MapServer/1/query`,
      { params, timeout: 5000 }
    );

    if (response.data.features && response.data.features.length > 0) {
      console.log(`   ✅ Found ${response.data.features.length} fiber route(s) within 500m`);
      
      // Calculate distance to nearest route
      let nearestDistance = 500;
      let nearestRoute = null;

      for (const feature of response.data.features) {
        if (feature.geometry?.paths) {
          const path = feature.geometry.paths[0];
          for (const point of path) {
            const distance = calculateDistance(webMercator, { x: point[0], y: point[1] });
            if (distance < nearestDistance) {
              nearestDistance = distance;
              nearestRoute = feature.attributes.ea1;
            }
          }
        }
      }

      if (nearestRoute) {
        console.log(`   📏 Nearest fiber route: ${Math.round(nearestDistance)}m away`);
        console.log(`   🛣️  Route name: ${nearestRoute || 'Unnamed'}`);
        console.log('');
        console.log('   ℹ️  Fiber infrastructure exists nearby but not yet available for connection');
        console.log('   💡 Consider registering interest for future expansion');
      }
      
      return { hasCoverage: false, type: 'nearby', distance: Math.round(nearestDistance) };
    } else {
      console.log('   ℹ️  No fiber routes found within 500m');
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown'}`);
  }

  console.log('');
  console.log('   ❌ NO DFA FIBER COVERAGE AT THIS LOCATION');
  console.log('   💡 Consider alternative providers: Openserve, Vumatel, Frogfoot');
  return { hasCoverage: false, type: 'none' };
}

// Test the user's address
const TEST_ADDRESS = '5 Ben St, Nonzwakazi, De Aar, 7000, South Africa';
const TEST_LAT = -30.6500;
const TEST_LNG = 24.0167;

testDFACoverageExtended(TEST_ADDRESS, TEST_LAT, TEST_LNG)
  .then(result => {
    console.log('');
    console.log('='.repeat(80));
    console.log('📊 Final Result:');
    console.log(`   Coverage: ${result.hasCoverage ? 'YES ✅' : 'NO ❌'}`);
    console.log(`   Type: ${result.type}`);
    if (result.type === 'nearby' && result.distance) {
      console.log(`   Distance to fiber: ${result.distance}m`);
    }
    console.log('='.repeat(80));
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
