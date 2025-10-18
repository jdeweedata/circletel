/**
 * Test Supersonic Public API Directly
 * Based on documentation from PRODUCTION_COVERAGE_API_ENDPOINTS.md
 */

async function testSupersonicAPI() {
  console.log('🚀 Testing Supersonic Public API\n');
  console.log('Base URL: https://supersonic.agilitygis.com\n');

  const testLocations = [
    {
      name: 'Centurion (Heritage Hill)',
      address: '18 Rasmus Erasmus Boulevard, Heritage Hill, Centurion',
      latitude: -25.903104,
      longitude: 28.1706496,
      expectedTechnology: '5G'
    },
    {
      name: 'Cape Town CBD',
      address: '100 St Georges Mall, Cape Town City Centre, Cape Town',
      latitude: -33.9249,
      longitude: 18.4241,
      expectedTechnology: 'Fibre'
    },
    {
      name: 'Johannesburg CBD',
      address: '1 Commissioner Street, Johannesburg',
      latitude: -26.2023,
      longitude: 28.0436,
      expectedTechnology: 'Fibre'
    }
  ];

  for (const location of testLocations) {
    console.log('='.repeat(80));
    console.log(`📍 Testing: ${location.name}`);
    console.log(`   Address: ${location.address}`);
    console.log(`   Coordinates: ${location.latitude}, ${location.longitude}`);
    console.log(`   Expected: ${location.expectedTechnology}`);
    console.log('='.repeat(80));

    try {
      // Step 1: Create lead
      console.log('\n📝 Step 1: Creating lead...');

      const leadPayload = {
        address: location.address,
        latitude: location.latitude,
        longitude: location.longitude,
        source: 'circletel_test'
      };

      console.log('   Request:', JSON.stringify(leadPayload, null, 2));

      const leadResponse = await fetch('https://supersonic.agilitygis.com/api/lead', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://supersonic.co.za/',
          'Origin': 'https://supersonic.co.za'
        },
        body: JSON.stringify(leadPayload)
      });

      console.log(`   Response Status: ${leadResponse.status} ${leadResponse.statusText}`);

      if (!leadResponse.ok) {
        const errorText = await leadResponse.text();
        console.log(`   ❌ Error: ${errorText}`);
        console.log('\n   📋 Response Headers:');
        leadResponse.headers.forEach((value, key) => {
          console.log(`      ${key}: ${value}`);
        });
        continue;
      }

      const leadData = await leadResponse.json();
      console.log('   ✅ Lead Created:', JSON.stringify(leadData, null, 2));

      if (!leadData.LeadEntityID && !leadData.success) {
        console.log('   ❌ No LeadEntityID in response');
        continue;
      }

      const leadEntityID = leadData.LeadEntityID;

      // Step 2: Get packages
      console.log(`\n📦 Step 2: Fetching packages for LeadEntityID: ${leadEntityID}...`);

      const packagesUrl = `https://supersonic.agilitygis.com/api/availablepackages?LeadEntityID=${leadEntityID}`;
      console.log('   URL:', packagesUrl);

      const packagesResponse = await fetch(packagesUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://supersonic.co.za/',
          'Origin': 'https://supersonic.co.za'
        }
      });

      console.log(`   Response Status: ${packagesResponse.status} ${packagesResponse.statusText}`);

      if (!packagesResponse.ok) {
        const errorText = await packagesResponse.text();
        console.log(`   ❌ Error: ${errorText}`);
        continue;
      }

      const packagesData = await packagesResponse.json();
      console.log('   ✅ Packages Response:', JSON.stringify(packagesData, null, 2).substring(0, 500));

      // Analyze packages
      if (packagesData.packages && Array.isArray(packagesData.packages)) {
        console.log(`\n   📊 Found ${packagesData.packages.length} packages:`);

        packagesData.packages.forEach((pkg: any, idx: number) => {
          console.log(`\n   [${idx + 1}] ${pkg.name || 'Unknown Package'}`);
          console.log(`       Type: ${pkg.type || 'N/A'}`);
          console.log(`       Price: R${pkg.price || 'N/A'}`);
          if (pkg.promo_price) {
            console.log(`       Promo Price: R${pkg.promo_price}`);
          }
          if (pkg.data_day) {
            console.log(`       Data: ${pkg.data_day} day / ${pkg.data_night || pkg.data_day} night`);
          }
          if (pkg.fair_usage) {
            console.log(`       Fair Usage: ${pkg.fair_usage}`);
          }
        });

        // Verify technology type
        const detectedTech = packagesData.packages[0]?.type || 'Unknown';
        const matchesExpected = detectedTech.toLowerCase().includes(location.expectedTechnology.toLowerCase());

        console.log(`\n   🎯 Technology Detection:`);
        console.log(`       Expected: ${location.expectedTechnology}`);
        console.log(`       Detected: ${detectedTech}`);
        console.log(`       Match: ${matchesExpected ? '✅' : '❌'}`);
      } else if (Array.isArray(packagesData)) {
        console.log(`\n   📊 Found ${packagesData.length} packages (array format):`);
        packagesData.forEach((pkg: any, idx: number) => {
          console.log(`\n   [${idx + 1}] ${pkg.name || 'Unknown'}`);
          console.log(`       Price: R${pkg.price || 'N/A'}`);
        });
      } else {
        console.log('   ⚠️  Unexpected response format:', packagesData);
      }

    } catch (error) {
      console.log(`\n   ❌ Exception: ${error}`);
      if (error instanceof Error) {
        console.log(`      ${error.message}`);
        console.log(`      ${error.stack?.split('\n').slice(0, 3).join('\n')}`);
      }
    }

    console.log('\n');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s between locations
  }

  console.log('\n' + '='.repeat(80));
  console.log('🎯 TEST SUMMARY');
  console.log('='.repeat(80));
  console.log('\nIf all tests passed:');
  console.log('  ✅ Supersonic API is accessible');
  console.log('  ✅ Lead creation works');
  console.log('  ✅ Package fetching works');
  console.log('  ✅ Ready for integration\n');

  console.log('If tests failed with CORS errors:');
  console.log('  ⚠️  Need to implement server-side proxy');
  console.log('  ⚠️  Browser is blocking cross-origin requests');
  console.log('  ✅ API endpoints are correct\n');

  console.log('If tests failed with 500/502 errors:');
  console.log('  ⚠️  API may require session cookies');
  console.log('  ⚠️  Need to contact AgilityGIS for API key');
  console.log('  ⚠️  May need to use browser session approach\n');
}

testSupersonicAPI().catch(console.error);
