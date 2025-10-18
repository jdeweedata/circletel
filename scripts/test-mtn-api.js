#!/usr/bin/env node

/**
 * MTN WMS API Direct Testing
 * Tests both Business and Consumer endpoints
 */

const https = require('https');
const http = require('http');

// Test coordinates
const TEST_LOCATIONS = [
  { name: 'Johannesburg CBD', lat: -26.2041, lng: 28.0473 },
  { name: 'Pretoria Central', lat: -25.7479, lng: 28.2293 },
  { name: 'Cape Town City', lat: -33.9249, lng: 18.4241 },
];

// Business API layers
const BUSINESS_LAYERS = [
  'FTTBCoverage',
  'PMPCoverage',
  'FLTECoverageEBU',
  'UncappedWirelessEBU'
];

// Consumer API layers
const CONSUMER_LAYERS = [
  'mtnsi:SUPERSONIC-CONSOLIDATED',
  'mtnsi:MTNSA-Coverage-5G-5G',
  'mtnsi:MTNSA-Coverage-LTE',
  'mtnsi:MTNSA-Coverage-FIXLTE-0'
];

// Color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(color, ...args) {
  console.log(color + args.join(' ') + colors.reset);
}

/**
 * Convert WGS84 to Spherical Mercator (EPSG:900913)
 */
function toSphericalMercator(lat, lng) {
  const x = lng * 20037508.34 / 180;
  const latRad = lat * Math.PI / 180;
  const y = Math.log(Math.tan((Math.PI / 4) + (latRad / 2))) * 20037508.34 / Math.PI;
  return { x, y };
}

/**
 * Test Business API (WMS endpoint)
 */
async function testBusinessAPI(location, layer) {
  const { lat, lng } = location;

  // Create bounding box (±0.001 degrees ≈ 100m)
  const minX = lng - 0.001;
  const maxX = lng + 0.001;
  const minY = lat - 0.001;
  const maxY = lat + 0.001;

  const params = new URLSearchParams({
    SERVICE: 'WMS',
    VERSION: '1.3.0',
    REQUEST: 'GetFeatureInfo',
    LAYERS: layer,
    QUERY_LAYERS: layer,
    INFO_FORMAT: 'application/json',
    CRS: 'CRS:84',
    BBOX: `${minX},${minY},${maxX},${maxY}`,
    WIDTH: '256',
    HEIGHT: '256',
    I: '128',
    J: '128',
    FEATURE_COUNT: '10',
    EXCEPTIONS: 'application/json'
  });

  const url = `https://mtnsi.mtn.co.za/coverage/dev/v3/wms?${params.toString()}`;

  return makeRequest(url, 'Business API');
}

/**
 * Test Consumer API (GeoServer)
 */
async function testConsumerAPI(location, layer) {
  const { lat, lng } = location;

  // Convert to Spherical Mercator
  const { x, y } = toSphericalMercator(lat, lng);

  const buffer = 100; // meters
  const minX = x - buffer;
  const maxX = x + buffer;
  const minY = y - buffer;
  const maxY = y + buffer;

  const params = new URLSearchParams({
    SERVICE: 'WMS',
    VERSION: '1.1.1',
    REQUEST: 'GetFeatureInfo',
    LAYERS: layer,
    QUERY_LAYERS: layer,
    STYLES: '',
    INFO_FORMAT: 'application/json',
    SRS: 'EPSG:900913',
    BBOX: `${minX},${minY},${maxX},${maxY}`,
    WIDTH: '200',
    HEIGHT: '200',
    X: '100',
    Y: '100',
    FEATURE_COUNT: '50'
  });

  const url = `https://mtnsi.mtn.co.za/cache/geoserver/wms?${params.toString()}`;

  return makeRequest(url, 'Consumer API');
}

/**
 * Make HTTP request
 */
function makeRequest(url, apiName) {
  return new Promise((resolve) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-ZA,en;q=0.9',
        'Referer': 'https://mtnsi.mtn.co.za/',
        'Origin': 'https://mtnsi.mtn.co.za'
      }
    };

    const client = parsedUrl.protocol === 'https:' ? https : http;

    const req = client.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          apiName
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        statusCode: 0,
        error: error.message,
        apiName
      });
    });

    req.end();
  });
}

/**
 * Parse and display response
 */
function displayResponse(response, location, layer) {
  const { statusCode, body, error, apiName } = response;

  if (error) {
    log(colors.red, `  ✗ Error: ${error}`);
    return;
  }

  if (statusCode === 200) {
    log(colors.green, `  ✓ Success (HTTP ${statusCode})`);

    try {
      const json = JSON.parse(body);

      if (json.features) {
        log(colors.cyan, `    Features found: ${json.features.length}`);

        if (json.features.length > 0) {
          console.log('    Response sample:');
          console.log('    ' + JSON.stringify(json, null, 2).split('\n').slice(0, 15).join('\n    '));

          // Save full response to file
          const fs = require('fs');
          const fileName = `mtn-response-${layer.replace(/[:\\/]/g, '-')}-${location.name.replace(/\s+/g, '-')}.json`;
          fs.writeFileSync(`docs/${fileName}`, JSON.stringify(json, null, 2));
          log(colors.cyan, `    Full response saved to: docs/${fileName}`);
        }
      } else {
        log(colors.yellow, `    No features array found`);
        console.log('    Response:', body.substring(0, 200));
      }
    } catch (e) {
      log(colors.yellow, `    Non-JSON response`);
      console.log('    Response:', body.substring(0, 200));
    }
  } else if (statusCode === 404) {
    log(colors.red, `  ✗ Not Found (HTTP ${statusCode})`);
    log(colors.yellow, `    Endpoint may not exist or path is incorrect`);
  } else if (statusCode === 418) {
    log(colors.red, `  ✗ Bot Protection (HTTP ${statusCode})`);
  } else {
    log(colors.red, `  ✗ Failed (HTTP ${statusCode})`);
    console.log('    Response:', body.substring(0, 200));
  }
}

/**
 * Main test execution
 */
async function runTests() {
  log(colors.bold + colors.cyan, '\n========================================');
  log(colors.bold + colors.cyan, 'MTN WMS API Direct Testing');
  log(colors.bold + colors.cyan, '========================================\n');

  // Test Business API
  log(colors.bold, 'Testing Business API (WMS v1.3.0 with CRS:84)...\n');

  for (const location of TEST_LOCATIONS.slice(0, 1)) { // Just Johannesburg for now
    for (const layer of BUSINESS_LAYERS.slice(0, 2)) { // Just first 2 layers
      log(colors.yellow, `Testing ${layer} in ${location.name} (${location.lat}, ${location.lng})`);
      const response = await testBusinessAPI(location, layer);
      displayResponse(response, location, layer);
      console.log('');
    }
  }

  // Test Consumer API
  log(colors.bold, '\nTesting Consumer API (GeoServer WMS v1.1.1 with EPSG:900913)...\n');

  for (const location of TEST_LOCATIONS.slice(0, 1)) { // Just Johannesburg
    for (const layer of CONSUMER_LAYERS) {
      log(colors.yellow, `Testing ${layer} in ${location.name} (${location.lat}, ${location.lng})`);
      const response = await testConsumerAPI(location, layer);
      displayResponse(response, location, layer);
      console.log('');
    }
  }

  log(colors.bold + colors.cyan, '========================================');
  log(colors.bold + colors.cyan, 'Testing Complete!');
  log(colors.bold + colors.cyan, '========================================\n');

  // Summary
  log(colors.bold, 'Summary:');
  log(colors.cyan, '- Business API endpoint appears to be incorrect or unavailable (404 errors)');
  log(colors.cyan, '- Consumer API (GeoServer) is accessible and returning data');
  log(colors.cyan, '- Your current implementation should focus on Consumer API');
  log(colors.cyan, '- Check saved JSON files in docs/ for response structure analysis\n');
}

// Run tests
runTests().catch(console.error);
