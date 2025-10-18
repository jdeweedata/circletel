#!/usr/bin/env node

/**
 * Test Live MTN Consumer API Directly
 *
 * This script bypasses our project's API routes and queries
 * the live MTN GeoServer WMS API directly to validate results.
 */

const https = require('https');

// MTN Consumer API endpoint
const MTN_WMS_ENDPOINT = 'https://mtnsi.mtn.co.za/cache/geoserver/wms';

// Test locations
const TEST_LOCATIONS = [
  { name: 'Johannesburg CBD', lat: -26.2028787, lng: 28.0657856 },
  { name: 'Pretoria', lat: -25.7461389, lng: 28.1881141 },
  { name: 'Sandton', lat: -26.1076256, lng: 28.0567252 },
  { name: 'Midrand', lat: -25.9893, lng: 28.1288 },
  { name: 'Soweto', lat: -26.2678, lng: 27.8585 },
  { name: 'Centurion', lat: -25.8601, lng: 28.1894 },
  { name: 'Roodepoort', lat: -26.1625, lng: 27.8725 }
];

// MTN WMS layers
const LAYERS = [
  'MTNSA-Coverage-5G-5G',           // 5G coverage
  'MTNSA-Coverage-LTE',              // LTE coverage
  'MTNSA-Coverage-FIXLTE-0',         // Fixed LTE
  'SUPERSONIC-CONSOLIDATED'          // Fibre coverage
];

// Coordinate converter
class CoordinateConverter {
  constructor() {
    this.EARTH_RADIUS = 20037508.34;
  }

  toSphericalMercator(lat, lng) {
    if (lat < -85.0511 || lat > 85.0511) {
      throw new Error(`Latitude ${lat} out of valid range`);
    }

    const x = lng * this.EARTH_RADIUS / 180;
    const latRad = lat * Math.PI / 180;
    const y = Math.log(Math.tan((Math.PI / 4) + (latRad / 2))) * this.EARTH_RADIUS / Math.PI;

    return { x, y };
  }

  createBoundingBox(lat, lng, radiusMeters = 100) {
    const { x, y } = this.toSphericalMercator(lat, lng);
    return {
      minX: x - radiusMeters,
      minY: y - radiusMeters,
      maxX: x + radiusMeters,
      maxY: y + radiusMeters
    };
  }
}

const converter = new CoordinateConverter();

/**
 * Query MTN WMS API
 */
function queryMTNWMS(location, layer) {
  return new Promise((resolve, reject) => {
    const bbox = converter.createBoundingBox(location.lat, location.lng);

    const params = new URLSearchParams({
      service: 'WMS',
      version: '1.3.0',
      request: 'GetFeatureInfo',
      layers: layer,
      query_layers: layer,
      feature_count: '100',
      srs: 'EPSG:900913',
      bbox: `${bbox.minX},${bbox.minY},${bbox.maxX},${bbox.maxY}`,
      width: '256',
      height: '256',
      i: '128',
      j: '128',
      info_format: 'application/json'
    });

    const url = `${MTN_WMS_ENDPOINT}?${params.toString()}`;

    const options = {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CircleTel-Coverage-Checker/1.0'
      }
    };

    https.get(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            layer,
            status: res.statusCode,
            features: parsed.features || [],
            totalFeatures: parsed.totalFeatures || 0,
            hasCoverage: (parsed.features || []).length > 0
          });
        } catch (error) {
          resolve({
            layer,
            status: res.statusCode,
            error: 'Failed to parse JSON',
            rawData: data.substring(0, 200)
          });
        }
      });
    }).on('error', (error) => {
      reject({ layer, error: error.message });
    });
  });
}

/**
 * Test all layers for a location
 */
async function testLocation(location) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${location.name}`);
  console.log(`Coordinates: ${location.lat}, ${location.lng}`);
  console.log(`${'='.repeat(60)}\n`);

  const results = [];

  for (const layer of LAYERS) {
    try {
      const result = await queryMTNWMS(location, layer);
      results.push(result);

      const statusIcon = result.hasCoverage ? '✅' : '❌';
      console.log(`${statusIcon} ${layer.padEnd(30)} - Features: ${result.totalFeatures || 0}`);

      if (result.error) {
        console.log(`   ⚠️  Error: ${result.error}`);
      }
    } catch (error) {
      console.log(`❌ ${layer.padEnd(30)} - Error: ${error.error || error.message}`);
      results.push({ layer, error: error.error || error.message });
    }
  }

  // Summary
  const coverageLayers = results.filter(r => r.hasCoverage).map(r => r.layer);
  const serviceTypes = mapLayersToServices(coverageLayers);

  console.log(`\nSummary:`);
  console.log(`  Coverage Layers: ${coverageLayers.length}/4`);
  console.log(`  Service Types: ${serviceTypes.join(', ') || 'None'}`);

  return {
    location: location.name,
    coordinates: { lat: location.lat, lng: location.lng },
    results,
    serviceTypes,
    totalCoverageLayers: coverageLayers.length
  };
}

/**
 * Map WMS layers to service types
 */
function mapLayersToServices(layers) {
  const services = [];

  if (layers.includes('SUPERSONIC-CONSOLIDATED')) {
    services.push('fibre');
  }
  if (layers.includes('MTNSA-Coverage-FIXLTE-0')) {
    services.push('fixed_lte');
  }
  if (layers.includes('MTNSA-Coverage-LTE')) {
    services.push('uncapped_wireless');
  }
  if (layers.includes('MTNSA-Coverage-5G-5G')) {
    services.push('licensed_wireless');
  }

  return services;
}

/**
 * Main test runner
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   MTN Consumer API Live Validation Test                   ║');
  console.log('║   Testing 7 Gauteng locations against production API      ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\nEndpoint: ${MTN_WMS_ENDPOINT}`);
  console.log(`SRS: EPSG:900913 (Spherical Mercator)`);
  console.log(`Layers: ${LAYERS.join(', ')}`);

  const allResults = [];

  for (const location of TEST_LOCATIONS) {
    const result = await testLocation(location);
    allResults.push(result);

    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Final summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('FINAL SUMMARY');
  console.log(`${'='.repeat(60)}\n`);

  const table = allResults.map(r => ({
    Location: r.location.padEnd(20),
    Services: r.totalCoverageLayers,
    Types: r.serviceTypes.join(', ') || 'None'
  }));

  console.table(table);

  const successCount = allResults.filter(r => r.totalCoverageLayers > 0).length;
  console.log(`\nSuccess Rate: ${successCount}/${TEST_LOCATIONS.length} (${Math.round(successCount/TEST_LOCATIONS.length*100)}%)`);

  // Save results to JSON
  const fs = require('fs');
  const outputPath = 'docs/MTN_LIVE_API_VALIDATION.json';
  fs.writeFileSync(outputPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    endpoint: MTN_WMS_ENDPOINT,
    srs: 'EPSG:900913',
    layers: LAYERS,
    results: allResults
  }, null, 2));

  console.log(`\n✅ Results saved to: ${outputPath}`);
}

main().catch(console.error);
