/**
 * Test DFA Coverage via API Endpoint
 * Tests the full API integration including aggregation service
 * Run: npx tsx scripts/test-dfa-api-endpoint.ts
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';
const TEST_ADDRESS = '7 Autumn St, Rivonia, Sandton, 2128, South Africa';
const TEST_LAT = -26.0525;
const TEST_LNG = 28.0598;

async function testViaAPI() {
  console.log('🧪 DFA Coverage API Endpoint Test');
  console.log('='.repeat(80));
  console.log(`📍 Address: ${TEST_ADDRESS}`);
  console.log(`   Coordinates: ${TEST_LAT}, ${TEST_LNG}`);
  console.log('');

  try {
    // Test via aggregation endpoint
    console.log('🔄 Calling /api/coverage/aggregate...');
    
    const response = await axios.post(`${API_BASE_URL}/api/coverage/aggregate`, {
      coordinates: {
        lat: TEST_LAT,
        lng: TEST_LNG
      },
      address: TEST_ADDRESS,
      providers: ['dfa'], // Request DFA specifically
      serviceTypes: ['fibre'],
      includeAlternatives: true
    });

    console.log('');
    console.log('✅ API Response Received');
    console.log('='.repeat(80));
    console.log(JSON.stringify(response.data, null, 2));
    console.log('='.repeat(80));

  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.log('');
      console.log('❌ API Error');
      console.log(`   Status: ${error.response?.status}`);
      console.log(`   Message: ${error.message}`);
      
      if (error.response?.data) {
        console.log('   Response:');
        console.log(JSON.stringify(error.response.data, null, 2));
      }
    } else {
      console.log('❌ Error:', error);
    }
  }
}

// Run test
console.log('⚠️  Note: Make sure your Next.js dev server is running on localhost:3000');
console.log('   Run: npm run dev');
console.log('');

testViaAPI().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
