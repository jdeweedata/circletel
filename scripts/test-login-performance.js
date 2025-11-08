/**
 * Test script to check admin login API performance
 * Usage: node scripts/test-login-performance.js
 */

const https = require('https');

const API_URL = 'https://www.circletel.co.za/api/admin/login';
const TEST_CREDENTIALS = {
  email: 'devadmin@circletel.co.za',
  password: 'aQp6vK8bBfNVB4C!'
};

async function testLogin() {
  console.log('🔍 Testing login performance...');
  console.log(`   URL: ${API_URL}`);
  console.log(`   Email: ${TEST_CREDENTIALS.email}`);
  console.log('');

  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(TEST_CREDENTIALS);

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(API_URL, options, (res) => {
      const responseTime = Date.now() - startTime;

      console.log(`⏱️  Response Time: ${responseTime}ms`);
      console.log(`📊 Status Code: ${res.statusCode}`);
      console.log(`📋 Headers:`, res.headers);
      console.log('');

      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const totalTime = Date.now() - startTime;
        console.log(`⏱️  Total Time: ${totalTime}ms`);
        console.log('');

        try {
          const result = JSON.parse(data);
          console.log('📦 Response:', JSON.stringify(result, null, 2));

          if (result.success) {
            console.log('');
            console.log('✅ Login successful!');
            console.log(`   User: ${result.user?.email}`);
            console.log(`   Role: ${result.user?.role}`);
          } else {
            console.log('');
            console.log('❌ Login failed!');
            console.log(`   Error: ${result.error}`);
          }
        } catch (error) {
          console.log('❌ Failed to parse response:', error.message);
          console.log('   Raw data:', data);
        }

        resolve();
      });
    });

    req.on('error', (error) => {
      const errorTime = Date.now() - startTime;
      console.log(`❌ Request failed after ${errorTime}ms`);
      console.log(`   Error: ${error.message}`);
      reject(error);
    });

    req.setTimeout(30000, () => {
      console.log('⏰ Request timed out after 30 seconds');
      req.destroy();
    });

    req.write(postData);
    req.end();
  });
}

// Run the test
console.log('═══════════════════════════════════════════════════════');
console.log('   Admin Login Performance Test');
console.log('═══════════════════════════════════════════════════════');
console.log('');

testLogin()
  .then(() => {
    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('   Test Complete');
    console.log('═══════════════════════════════════════════════════════');
    process.exit(0);
  })
  .catch((error) => {
    console.error('');
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
