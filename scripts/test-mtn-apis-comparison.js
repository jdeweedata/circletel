/**
 * MTN API Comparison Test Script
 * Tests both MTN Wholesale (Business) and Consumer APIs
 * Compares responses for residential and business addresses
 */

const https = require('https');

// Test addresses
const RESIDENTIAL_ADDRESS = '18 Rasmus Erasmus, Heritage Hill';
const BUSINESS_ADDRESS = '7 Autumn Street, Rivonia, Sandton';

// MTN API endpoints
const MTN_WHOLESALE_URL = 'https://mtnbusiness.hashx.co.za/services/GetCoverageCheck';
const MTN_CONSUMER_URL = 'https://shop.mtn.co.za/mtn/graphql';

// Enhanced headers that bypass bot detection
const ENHANCED_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
  'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-origin',
  'DNT': '1',
  'Connection': 'keep-alive',
};

/**
 * Test MTN Wholesale API (Business)
 */
async function testWholesaleAPI(address) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Testing MTN WHOLESALE API (Business)`);
  console.log(`Address: ${address}`);
  console.log('='.repeat(80));

  const payload = JSON.stringify({
    searchString: address,
  });

  const options = {
    method: 'POST',
    headers: {
      ...ENHANCED_HEADERS,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
      'Origin': 'https://mtnbusiness.hashx.co.za',
      'Referer': 'https://mtnbusiness.hashx.co.za/',
    },
  };

  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const req = https.request(MTN_WHOLESALE_URL, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const duration = Date.now() - startTime;
        console.log(`\nStatus Code: ${res.statusCode}`);
        console.log(`Response Time: ${duration}ms`);
        console.log(`\nResponse Headers:`);
        console.log(JSON.stringify(res.headers, null, 2));

        try {
          const json = JSON.parse(data);
          console.log(`\nParsed JSON Response:`);
          console.log(JSON.stringify(json, null, 2));

          // Extract key information
          if (json.Results && json.Results.length > 0) {
            console.log(`\n${'─'.repeat(80)}`);
            console.log('SUMMARY:');
            console.log('─'.repeat(80));
            console.log(`Total Results: ${json.Results.length}`);
            json.Results.forEach((result, index) => {
              console.log(`\nResult ${index + 1}:`);
              console.log(`  Address: ${result.Address || 'N/A'}`);
              console.log(`  Coverage: ${result.CoverageStatus || 'N/A'}`);
              console.log(`  Services: ${result.ServiceTypes?.join(', ') || 'N/A'}`);
              console.log(`  Latitude: ${result.Latitude || 'N/A'}`);
              console.log(`  Longitude: ${result.Longitude || 'N/A'}`);
            });
          } else {
            console.log('\n⚠️  No results found in response');
          }

          resolve({ success: true, data: json, duration });
        } catch (error) {
          console.log(`\nRaw Response (JSON parse failed):`);
          console.log(data);
          console.error(`\n❌ Error parsing JSON: ${error.message}`);
          resolve({ success: false, error: error.message, rawData: data, duration });
        }
      });
    });

    req.on('error', (error) => {
      console.error(`\n❌ Request Error: ${error.message}`);
      reject({ success: false, error: error.message });
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Test MTN Consumer API
 */
async function testConsumerAPI(address) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Testing MTN CONSUMER API`);
  console.log(`Address: ${address}`);
  console.log('='.repeat(80));

  const query = `
    query getCoverageCheck($addressSearchStr: String!) {
      getCoverageCheck(addressSearchStr: $addressSearchStr) {
        serviceabilityId
        address
        coverageResult
        technology
        latitude
        longitude
      }
    }
  `;

  const payload = JSON.stringify({
    query,
    variables: {
      addressSearchStr: address,
    },
  });

  const options = {
    method: 'POST',
    headers: {
      ...ENHANCED_HEADERS,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
      'Origin': 'https://shop.mtn.co.za',
      'Referer': 'https://shop.mtn.co.za/mtn/fibre',
    },
  };

  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const req = https.request(MTN_CONSUMER_URL, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const duration = Date.now() - startTime;
        console.log(`\nStatus Code: ${res.statusCode}`);
        console.log(`Response Time: ${duration}ms`);
        console.log(`\nResponse Headers:`);
        console.log(JSON.stringify(res.headers, null, 2));

        try {
          const json = JSON.parse(data);
          console.log(`\nParsed JSON Response:`);
          console.log(JSON.stringify(json, null, 2));

          // Extract key information
          if (json.data?.getCoverageCheck) {
            const results = json.data.getCoverageCheck;
            console.log(`\n${'─'.repeat(80)}`);
            console.log('SUMMARY:');
            console.log('─'.repeat(80));
            console.log(`Total Results: ${results.length}`);
            results.forEach((result, index) => {
              console.log(`\nResult ${index + 1}:`);
              console.log(`  Address: ${result.address || 'N/A'}`);
              console.log(`  Coverage: ${result.coverageResult || 'N/A'}`);
              console.log(`  Technology: ${result.technology || 'N/A'}`);
              console.log(`  Latitude: ${result.latitude || 'N/A'}`);
              console.log(`  Longitude: ${result.longitude || 'N/A'}`);
              console.log(`  Serviceability ID: ${result.serviceabilityId || 'N/A'}`);
            });
          } else if (json.errors) {
            console.log('\n❌ GraphQL Errors:');
            json.errors.forEach((error, index) => {
              console.log(`\nError ${index + 1}:`);
              console.log(`  Message: ${error.message}`);
              console.log(`  Path: ${error.path?.join(' -> ') || 'N/A'}`);
            });
          } else {
            console.log('\n⚠️  No results found in response');
          }

          resolve({ success: true, data: json, duration });
        } catch (error) {
          console.log(`\nRaw Response (JSON parse failed):`);
          console.log(data);
          console.error(`\n❌ Error parsing JSON: ${error.message}`);
          resolve({ success: false, error: error.message, rawData: data, duration });
        }
      });
    });

    req.on('error', (error) => {
      console.error(`\n❌ Request Error: ${error.message}`);
      reject({ success: false, error: error.message });
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('\n');
  console.log('█'.repeat(80));
  console.log('MTN API COMPARISON TEST');
  console.log('Testing both Wholesale (Business) and Consumer APIs');
  console.log('█'.repeat(80));

  const results = {
    residential: {
      wholesale: null,
      consumer: null,
    },
    business: {
      wholesale: null,
      consumer: null,
    },
  };

  try {
    // Test 1: Residential address - Wholesale API
    results.residential.wholesale = await testWholesaleAPI(RESIDENTIAL_ADDRESS);
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay

    // Test 2: Residential address - Consumer API
    results.residential.consumer = await testConsumerAPI(RESIDENTIAL_ADDRESS);
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay

    // Test 3: Business address - Wholesale API
    results.business.wholesale = await testWholesaleAPI(BUSINESS_ADDRESS);
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay

    // Test 4: Business address - Consumer API
    results.business.consumer = await testConsumerAPI(BUSINESS_ADDRESS);

  } catch (error) {
    console.error(`\n❌ Fatal error during testing: ${error.message}`);
  }

  // Print final comparison
  console.log('\n\n');
  console.log('█'.repeat(80));
  console.log('FINAL COMPARISON SUMMARY');
  console.log('█'.repeat(80));

  console.log(`\n${'─'.repeat(80)}`);
  console.log('RESIDENTIAL ADDRESS: ' + RESIDENTIAL_ADDRESS);
  console.log('─'.repeat(80));
  console.log(`Wholesale API: ${results.residential.wholesale?.success ? '✅ Success' : '❌ Failed'} (${results.residential.wholesale?.duration || 'N/A'}ms)`);
  console.log(`Consumer API:  ${results.residential.consumer?.success ? '✅ Success' : '❌ Failed'} (${results.residential.consumer?.duration || 'N/A'}ms)`);

  console.log(`\n${'─'.repeat(80)}`);
  console.log('BUSINESS ADDRESS: ' + BUSINESS_ADDRESS);
  console.log('─'.repeat(80));
  console.log(`Wholesale API: ${results.business.wholesale?.success ? '✅ Success' : '❌ Failed'} (${results.business.wholesale?.duration || 'N/A'}ms)`);
  console.log(`Consumer API:  ${results.business.consumer?.success ? '✅ Success' : '❌ Failed'} (${results.business.consumer?.duration || 'N/A'}ms)`);

  console.log('\n' + '█'.repeat(80));
  console.log('TEST COMPLETE');
  console.log('█'.repeat(80) + '\n');

  // Save results to file
  const fs = require('fs');
  const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
  const filename = `test-results/mtn-api-comparison-${timestamp}.json`;

  fs.writeFileSync(filename, JSON.stringify(results, null, 2));
  console.log(`\n📄 Full results saved to: ${filename}\n`);
}

// Run tests
runAllTests().catch(console.error);
