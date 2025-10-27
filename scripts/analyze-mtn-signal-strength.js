/**
 * Analyze MTN API Signal Strength Parameters
 * Checks WMS API responses for signal/quality indicators
 */

// Test coordinates: Heritage Hill, Centurion
const TEST_ADDRESS = {
  address: 'The Courtyard, 18 Rasmus Erasmus Blvd, Heritage Hill, Centurion, 0169',
  coordinates: {
    lat: -25.8894,
    lng: 28.1786
  }
};

const MTN_WMS_BASE_URL = 'https://mtnsi.mtn.co.za/cache/geoserver/wms';
const SRS = 'EPSG:900913';
const TILE_SIZE = 256;
const DEFAULT_ZOOM = 14;

// MTN WMS Layers - focusing on wireless services
const MTN_LAYERS = {
  FIXED_LTE: {
    wmsLayer: 'mtnsi:MTNSA-Coverage-FIXLTE-EBU-0',
    label: 'Fixed LTE',
    description: 'Fixed LTE coverage with capacity metrics'
  },
  UNCAPPED_WIRELESS: {
    wmsLayer: 'mtnsi:MTNSA-Coverage-Tarana',
    label: 'Uncapped Wireless (Tarana)',
    description: 'Uncapped wireless using Tarana technology'
  },
  LICENSED_WIRELESS: {
    wmsLayer: 'mtnsi:MTN-PMP-Feasible-Integrated',
    label: 'Licensed Wireless (PMP)',
    description: 'Point-to-multipoint licensed wireless'
  },
  FIBRE: {
    wmsLayer: 'mtnsi:MTN-FTTB-Feasible',
    label: 'Fibre (FTTB)',
    description: 'Fibre to the building'
  }
};

function calculateBBox(coordinates, zoom) {
  const x = coordinates.lng * 20037508.34 / 180;
  const y = Math.log(Math.tan((90 + coordinates.lat) * Math.PI / 360)) / (Math.PI / 180);
  const yMercator = y * 20037508.34 / 180;
  const resolution = 156543.03392804097 / Math.pow(2, zoom);
  const halfExtent = (TILE_SIZE * resolution) / 2;
  return [x - halfExtent, yMercator - halfExtent, x + halfExtent, yMercator + halfExtent];
}

function latLngToPixel(coordinates, bbox) {
  const x = coordinates.lng * 20037508.34 / 180;
  const y = Math.log(Math.tan((90 + coordinates.lat) * Math.PI / 360)) / (Math.PI / 180);
  const yMercator = y * 20037508.34 / 180;
  const pixelX = Math.floor(((x - bbox[0]) / (bbox[2] - bbox[0])) * TILE_SIZE);
  const pixelY = Math.floor(((bbox[3] - yMercator) / (bbox[3] - bbox[1])) * TILE_SIZE);
  return { x: pixelX, y: pixelY };
}

async function analyzeLayer(layerKey, config) {
  const bbox = calculateBBox(TEST_ADDRESS.coordinates, DEFAULT_ZOOM);
  const pixelCoords = latLngToPixel(TEST_ADDRESS.coordinates, bbox);

  const params = new URLSearchParams({
    service: 'WMS',
    version: '1.3.0',
    request: 'GetFeatureInfo',
    layers: config.wmsLayer,
    query_layers: config.wmsLayer,
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

  console.log('\n' + '='.repeat(80));
  console.log(`📡 ${config.label}`);
  console.log('='.repeat(80));
  console.log(`Description: ${config.description}`);
  console.log(`Layer: ${config.wmsLayer}\n`);

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
      console.log(`❌ HTTP Error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();

    if (data.features && data.features.length > 0) {
      console.log(`✅ Coverage Found: ${data.features.length} feature(s)\n`);

      data.features.forEach((feature, idx) => {
        console.log(`Feature ${idx + 1}/${data.features.length}:`);
        console.log(`  ID: ${feature.id}`);
        console.log(`  Type: ${feature.type}`);

        const props = feature.properties;
        console.log(`\n  📊 Properties (${Object.keys(props).length} fields):`);

        // Analyze each property for signal/quality indicators
        const signalRelated = [];
        const capacityRelated = [];
        const locationRelated = [];
        const other = [];

        Object.entries(props).forEach(([key, value]) => {
          const keyLower = key.toLowerCase();

          if (keyLower.includes('signal') || keyLower.includes('rssi') ||
              keyLower.includes('rsrp') || keyLower.includes('rsrq') ||
              keyLower.includes('sinr') || keyLower.includes('quality') ||
              keyLower.includes('strength')) {
            signalRelated.push({ key, value, category: 'SIGNAL' });
          } else if (keyLower.includes('slot') || keyLower.includes('capacity') ||
                     keyLower.includes('bandwidth') || keyLower.includes('speed') ||
                     keyLower.includes('throughput')) {
            capacityRelated.push({ key, value, category: 'CAPACITY' });
          } else if (keyLower.includes('lat') || keyLower.includes('lon') ||
                     keyLower.includes('clat') || keyLower.includes('clon') ||
                     keyLower.includes('distance')) {
            locationRelated.push({ key, value, category: 'LOCATION' });
          } else if (value !== null) {
            other.push({ key, value, category: 'OTHER' });
          }
        });

        // Display categorized properties
        if (signalRelated.length > 0) {
          console.log(`\n  🔴 SIGNAL STRENGTH INDICATORS (${signalRelated.length}):`);
          signalRelated.forEach(p => console.log(`    ✓ ${p.key}: ${p.value}`));
        } else {
          console.log(`\n  ⚠️  NO DIRECT SIGNAL STRENGTH INDICATORS FOUND`);
        }

        if (capacityRelated.length > 0) {
          console.log(`\n  🟢 CAPACITY/BANDWIDTH INDICATORS (${capacityRelated.length}):`);
          capacityRelated.forEach(p => console.log(`    • ${p.key}: ${p.value}`));
        }

        if (locationRelated.length > 0) {
          console.log(`\n  🟡 LOCATION/DISTANCE DATA (${locationRelated.length}):`);
          locationRelated.forEach(p => console.log(`    • ${p.key}: ${p.value}`));
        }

        if (other.length > 0) {
          console.log(`\n  🔵 OTHER METADATA (${other.length}):`);
          other.forEach(p => console.log(`    • ${p.key}: ${p.value}`));
        }

        console.log('');
      });

      return {
        layer: layerKey,
        hasSignalStrength: data.features.some(f => {
          const props = Object.keys(f.properties);
          return props.some(k => {
            const kl = k.toLowerCase();
            return kl.includes('signal') || kl.includes('rssi') || kl.includes('rsrp') ||
                   kl.includes('rsrq') || kl.includes('sinr') || kl.includes('quality') ||
                   kl.includes('strength');
          });
        }),
        hasCapacity: data.features.some(f => {
          const props = Object.keys(f.properties);
          return props.some(k => {
            const kl = k.toLowerCase();
            return kl.includes('slot') || kl.includes('capacity') || kl.includes('bandwidth');
          });
        }),
        featureCount: data.features.length,
        sampleProperties: data.features[0]?.properties
      };
    } else {
      console.log(`❌ No coverage found at this location\n`);
      return { layer: layerKey, hasSignalStrength: false, hasCapacity: false, featureCount: 0 };
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
    return null;
  }
}

async function main() {
  console.log('═'.repeat(80));
  console.log('🔍 MTN API SIGNAL STRENGTH ANALYSIS');
  console.log('═'.repeat(80));
  console.log(`\n📍 Test Location: ${TEST_ADDRESS.address}`);
  console.log(`🗺️  Coordinates: ${TEST_ADDRESS.coordinates.lat}, ${TEST_ADDRESS.coordinates.lng}\n`);

  const results = {};

  // Analyze each layer
  for (const [key, config] of Object.entries(MTN_LAYERS)) {
    const result = await analyzeLayer(key, config);
    if (result) results[key] = result;
    await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 SIGNAL STRENGTH ANALYSIS SUMMARY');
  console.log('='.repeat(80) + '\n');

  Object.entries(results).forEach(([key, result]) => {
    if (result && result.featureCount > 0) {
      console.log(`${MTN_LAYERS[key].label}:`);
      console.log(`  • Features found: ${result.featureCount}`);
      console.log(`  • Direct signal strength data: ${result.hasSignalStrength ? '✅ YES' : '❌ NO'}`);
      console.log(`  • Capacity/bandwidth data: ${result.hasCapacity ? '✅ YES' : '❌ NO'}`);

      if (result.hasSignalStrength) {
        console.log(`  • Signal parameters available for quality estimation`);
      } else if (result.hasCapacity) {
        console.log(`  • Can infer signal quality from capacity metrics`);
      } else {
        console.log(`  • Signal strength must be estimated from location data`);
      }
      console.log('');
    }
  });

  console.log('═'.repeat(80));
  console.log('✅ Analysis complete\n');
}

main().catch(console.error);
