const https = require('https');

const MTN_API_KEY = 'bdaacbcae8ab77672e545649df54d0df';
// Updated to use TEST environment (production has connectivity issues)
// Production URL: https://ftool.mtnbusiness.co.za (requires IP whitelisting/VPN)
const MTN_BASE_URL = 'https://asp-feasibility.mtnbusiness.co.za';

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, MTN_BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'X-API-KEY': MTN_API_KEY,
        'Content-Type': 'application/json',
        'User-Agent': 'CircleTel-Test/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = {
            statusCode: res.statusCode,
            headers: res.headers,
            data: body.startsWith('<') ? body : JSON.parse(body)
          };
          resolve(response);
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: body
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testProductsEndpoint() {
  console.log('\n=== Testing MTN Wholesale Products Endpoint ===\n');
  
  try {
    console.log('Requesting product list...');
    const response = await makeRequest('/api/v1/feasibility/product/wholesale/mns', 'GET');
    
    console.log(`Status Code: ${response.statusCode}`);
    console.log('Response Headers:', Object.keys(response.headers));
    console.log('\nResponse Data:');
    console.log(JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('Error testing products endpoint:', error.message);
    throw error;
  }
}

async function testFeasibilityEndpoint(productList) {
  console.log('\n=== Testing MTN Wholesale Feasibility Endpoint ===\n');
  
  const testLocations = [
    {
      latitude: '-26.171060',
      longitude: '27.954887',
      customer_name: 'Johannesburg Test Location'
    },
    {
      latitude: '-33.925839', 
      longitude: '18.423218',
      customer_name: 'Cape Town Test Location'
    }
  ];

  // Use actual products from the API response
  const testProducts = productList?.outputs?.slice(0, 2) || ['Wholesale Cloud Connect', 'Fixed Wireless Broadband'];
  
  const requestData = {
    inputs: testLocations,
    product_names: testProducts,
    requestor: 'test@circletel.co.za'
  };

  console.log('Request Payload:');
  console.log(JSON.stringify(requestData, null, 2));
  console.log('\nSending feasibility request...');

  try {
    const response = await makeRequest('/api/v1/feasibility/product/wholesale/mns', 'POST', requestData);
    
    console.log(`Status Code: ${response.statusCode}`);
    console.log('Response Headers:', Object.keys(response.headers));
    console.log('\nResponse Data:');
    console.log(JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('Error testing feasibility endpoint:', error.message);
    throw error;
  }
}

async function runTests() {
  console.log('🚀 Starting MTN Wholesale API Tests');
  console.log('API Key:', MTN_API_KEY);
  console.log('Base URL:', MTN_BASE_URL);
  
  try {
    // Test 1: Get product list
    const productList = await testProductsEndpoint();
    
    // Test 2: Check feasibility
    await testFeasibilityEndpoint(productList);
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
runTests();
