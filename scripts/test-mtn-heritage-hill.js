/**
 * Test MTN Coverage API for Heritage Hill Address
 * Tests: The Courtyard, 18 Rasmus Erasmus Blvd, Heritage Hill, Centurion
 */

// Coordinates for The Courtyard, 18 Rasmus Erasmus Blvd, Heritage Hill, Centurion, 0169
const TEST_ADDRESS = {
  address: 'The Courtyard, 18 Rasmus Erasmus Blvd, Heritage Hill, Centurion, 0169, South Africa',
  coordinates: {
    lat: -25.8894,
    lng: 28.1786
  }
};

const MTN_WMS_BASE_URL = 'https://mtnsi.mtn.co.za/cache/geoserver/wms';
const QUERY_LAYER = 'mtnsi:OSM South Africa';
const SRS = 'EPSG:900913'; // Web Mercator
const TILE_SIZE = 256;
const DEFAULT_ZOOM = 14;

// MTN WMS Layers
const MTN_LAYERS = {
  FIBRE: {
    layerId: 'FTTBCoverage',
    wmsLayer: 'mtnsi:MTN-FTTB-Feasible',
    wmsStyle: 'MTN-FTTB-Feasible',
    label: 'Fibre (FTTB)',
  },
  UNCAPPED_WIRELESS: {
    layerId: 'UncappedWirelessEBU',
    wmsLayer: 'mtnsi:MTNSA-Coverage-Tarana',
    wmsStyle: 'MTN-Coverage-UWA-EBU',
    label: 'Uncapped Wireless (Tarana)',
  },
  FIXED_LTE: {
    layerId: 'FLTECoverageEBU',
    wmsLayer: 'mtnsi:MTNSA-Coverage-FIXLTE-EBU-0',
    wmsStyle: 'MTNSA-Coverage-FIXLTE-EBU-0',
    label: 'Fixed LTE',
  },
  LICENSED_WIRELESS: {
    layerId: 'PMPCoverage',
    wmsLayer: 'mtnsi:MTN-PMP-Feasible-Integrated',
    wmsStyle: 'MTN-PMP-Feasible-Integrated',
    label: 'Licensed Wireless (PMP)',
  }
};

/**
 * Calculate bounding box for tile at given coordinates and zoom level
 */
function calculateBBox(coordinates, zoom) {
  // Convert lat/lng to Web Mercator (EPSG:900913)
  const x = coordinates.lng * 20037508.34 / 180;
  const y = Math.log(Math.tan((90 + coordinates.lat) * Math.PI / 360)) / (Math.PI / 180);
  const yMercator = y * 20037508.34 / 180;

  // Calculate tile extent at zoom level
  const resolution = 156543.03392804097 / Math.pow(2, zoom);
  const halfExtent = (TILE_SIZE * resolution) / 2;

  return [
    x - halfExtent,  // minx
    yMercator - halfExtent,  // miny
    x + halfExtent,  // maxx
    yMercator + halfExtent   // maxy
  ];
}

/**
 * Convert lat/lng to pixel coordinates within tile
 */
function latLngToPixel(coordinates, bbox) {
  const x = coordinates.lng * 20037508.34 / 180;
  const y = Math.log(Math.tan((90 + coordinates.lat) * Math.PI / 360)) / (Math.PI / 180);
  const yMercator = y * 20037508.34 / 180;

  // Calculate pixel position within tile
  const pixelX = Math.floor(
    ((x - bbox[0]) / (bbox[2] - bbox[0])) * TILE_SIZE
  );
  const pixelY = Math.floor(
    ((bbox[3] - yMercator) / (bbox[3] - bbox[1])) * TILE_SIZE
  );

  return { x: pixelX, y: pixelY };
}

/**
 * Query MTN WMS layer for coverage
 */
async function queryMTNLayer(layerName, wmsLayer) {
  const bbox = calculateBBox(TEST_ADDRESS.coordinates, DEFAULT_ZOOM);
  const pixelCoords = latLngToPixel(TEST_ADDRESS.coordinates, bbox);

  // FIXED: Query the actual coverage layer, not the OSM base layer
  const params = new URLSearchParams({
    service: 'WMS',
    version: '1.3.0',
    request: 'GetFeatureInfo',
    layers: wmsLayer, // Use the coverage layer
    query_layers: wmsLayer, // Query coverage layer
    feature_count: '100',
    srs: SRS,
    bbox: bbox.join(','),
    width: TILE_SIZE.toString(),
    height: TILE_SIZE.toString(),
    i: pixelCoords.x.toString(),
    j: pixelCoords.y.toString(),
    info_format: 'application/json'
  });

  const url = `${MTN_WMS_BASE_URL}?${params.toString()}`;

  console.log(`\n🔍 Querying MTN ${layerName}...`);
  console.log(`   Layer: ${wmsLayer}`);
  console.log(`   BBox: [${bbox.map(n => n.toFixed(2)).join(', ')}]`);
  console.log(`   Pixel: (${pixelCoords.x}, ${pixelCoords.y})`);

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.mtn.co.za/',
        'Origin': 'https://www.mtn.co.za'
      }
    });

    if (!response.ok) {
      console.log(`   ❌ HTTP Error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();

    if (data.features && data.features.length > 0) {
      console.log(`   ✅ Coverage AVAILABLE (${data.features.length} features found)`);
      console.log(`   📊 Feature Details:`);
      data.features.forEach((feature, idx) => {
        console.log(`\n      Feature ${idx + 1}:`);
        console.log(`      Type: ${feature.type}`);
        console.log(`      ID: ${feature.id}`);
        console.log(`      Properties:`, JSON.stringify(feature.properties, null, 8));
      });
      return { available: true, data };
    } else {
      console.log(`   ❌ No coverage found (0 features)`);
      return { available: false, data };
    }

  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return null;
  }
}

/**
 * Main test function
 */
async function testMTNCoverage() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🏢 MTN Coverage API Test - Heritage Hill, Centurion');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`\n📍 Test Address: ${TEST_ADDRESS.address}`);
  console.log(`🗺️  Coordinates: ${TEST_ADDRESS.coordinates.lat}, ${TEST_ADDRESS.coordinates.lng}`);
  console.log('\n═══════════════════════════════════════════════════════════════');

  const results = {};

  // Test all layers
  for (const [key, layer] of Object.entries(MTN_LAYERS)) {
    const result = await queryMTNLayer(layer.label, layer.wmsLayer);
    results[key] = result;

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('📊 COVERAGE SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const available = [];
  const notAvailable = [];
  const errors = [];

  for (const [key, result] of Object.entries(results)) {
    const layer = MTN_LAYERS[key];
    if (result === null) {
      errors.push(layer.label);
    } else if (result.available) {
      available.push(layer.label);
    } else {
      notAvailable.push(layer.label);
    }
  }

  if (available.length > 0) {
    console.log(`✅ Available Services (${available.length}):`);
    available.forEach(service => console.log(`   • ${service}`));
    console.log('');
  }

  if (notAvailable.length > 0) {
    console.log(`❌ Not Available (${notAvailable.length}):`);
    notAvailable.forEach(service => console.log(`   • ${service}`));
    console.log('');
  }

  if (errors.length > 0) {
    console.log(`⚠️  Errors (${errors.length}):`);
    errors.forEach(service => console.log(`   • ${service}`));
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`\n✅ Test completed at ${new Date().toLocaleTimeString()}\n`);
}

// Run test
testMTNCoverage().catch(console.error);
