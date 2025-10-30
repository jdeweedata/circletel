/**
 * Test Admin Login Flow
 * Tests the complete login flow including cookie setting
 */

require('dotenv').config({ path: '.env.local' });

async function testLoginFlow() {
  console.log('🧪 Testing Admin Login Flow...\n');

  const baseUrl = 'http://localhost:3002';

  try {
    console.log('Step 1: Testing login API endpoint...');

    const loginResponse = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@circletel.co.za',
        password: 'admin123',
      }),
    });

    console.log(`Response Status: ${loginResponse.status}`);

    const cookies = loginResponse.headers.get('set-cookie');
    console.log(`Cookies Set: ${cookies ? 'Yes' : 'No'}`);
    if (cookies) {
      console.log(`Cookie Header: ${cookies.substring(0, 100)}...`);
    }

    const result = await loginResponse.json();
    console.log(`Response:`, JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('\n✅ Login API successful!');
      console.log(`User: ${result.user.full_name} (${result.user.role})`);

      if (cookies) {
        console.log('\n✅ Session cookie was set');
        console.log('   The middleware should now allow access to /admin');
      } else {
        console.log('\n⚠️  WARNING: No session cookie was set!');
        console.log('   The middleware will block access to /admin');
        console.log('   This needs to be fixed.');
      }
    } else {
      console.log('\n❌ Login failed');
      console.log(`Error: ${result.error}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('Next Steps:');
    console.log('1. Go to: http://localhost:3002/admin/login');
    console.log('2. Login with: admin@circletel.co.za / admin123');
    console.log('3. Check if you are redirected to /admin dashboard');
    console.log('4. If not redirected, check browser console for errors');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testLoginFlow();
