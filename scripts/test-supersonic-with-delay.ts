/**
 * Test Supersonic API with Delayed Package Retrieval
 * Theory: Packages become available after async feasibility check completes
 */

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testWithDelay() {
  console.log('🚀 Testing Supersonic API with Delayed Retrieval\n');

  const testLocation = {
    name: 'Centurion (Heritage Hill)',
    address: '18 Rasmus Erasmus Boulevard, Heritage Hill, Centurion',
    latitude: -25.903104,
    longitude: 28.1706496
  };

  console.log(`📍 Testing: ${testLocation.name}`);
  console.log(`   Address: ${testLocation.address}\n`);

  try {
    // Step 1: Create lead
    console.log('📝 Step 1: Creating lead...');

    const leadResponse = await fetch('https://supersonic.agilitygis.com/api/lead', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      body: JSON.stringify({
        address: testLocation.address,
        latitude: testLocation.latitude,
        longitude: testLocation.longitude,
        source: 'circletel_test_delay'
      })
    });

    const leadData = await leadResponse.json();
    const leadEntityID = leadData.LeadEntityID;

    console.log(`✅ Lead Created: ${leadEntityID}`);
    console.log(`   FeasibilityStatus: ${leadData.FeasibilityStatus}`);
    console.log(`   Feasibility: ${leadData.Feasibility}\n`);

    // Step 2: Try immediate fetch (expected to fail)
    console.log('📦 Step 2: Immediate package fetch (0 seconds)...');
    const immediatePackages = await fetch(
      `https://supersonic.agilitygis.com/api/availablepackages?LeadEntityID=${leadEntityID}`
    ).then(r => r.json());

    console.log(`   Result: ${immediatePackages.length || 0} packages`);
    if (immediatePackages.length > 0) {
      console.log('   ✅ SUCCESS! Packages available immediately');
      console.log('   ', JSON.stringify(immediatePackages[0]));
      return;
    }
    console.log('   ❌ Empty (as expected)\n');

    // Step 3: Retry with delays
    const delays = [5, 10, 15, 20, 30];

    for (const delaySec of delays) {
      console.log(`⏳ Waiting ${delaySec} seconds for feasibility check...`);
      await sleep(delaySec * 1000);

      console.log(`📦 Attempting package fetch (after ${delaySec}s)...`);
      const packages = await fetch(
        `https://supersonic.agilitygis.com/api/availablepackages?LeadEntityID=${leadEntityID}`
      ).then(r => r.json());

      console.log(`   Result: ${packages.length || 0} packages`);

      if (packages.length > 0) {
        console.log('\n' + '='.repeat(80));
        console.log('✅ SUCCESS! Packages found after delay');
        console.log('='.repeat(80));
        console.log(`\nOptimal Delay: ${delaySec} seconds`);
        console.log(`Packages Found: ${packages.length}\n`);

        packages.forEach((pkg: any, idx: number) => {
          console.log(`[${idx + 1}] ${pkg.name || 'Unknown Package'}`);
          console.log(`    Type: ${pkg.type || 'N/A'}`);
          console.log(`    Price: R${pkg.price || 'N/A'}`);
          if (pkg.promo_price) {
            console.log(`    Promo: R${pkg.promo_price}`);
          }
          if (pkg.data_day) {
            console.log(`    Data: ${pkg.data_day} / ${pkg.data_night || pkg.data_day}`);
          }
          console.log();
        });

        console.log('\n🎯 RECOMMENDATION:');
        console.log(`   - Implement retry logic with ${delaySec}s initial delay`);
        console.log('   - Use exponential backoff for retries');
        console.log('   - Set max wait time to 45 seconds');
        console.log('   - Fallback to MTN API if no packages after max wait\n');

        return;
      }

      console.log('   ❌ Still empty\n');
    }

    console.log('\n' + '='.repeat(80));
    console.log('❌ PACKAGES NEVER APPEARED');
    console.log('='.repeat(80));
    console.log('\nPossible reasons:');
    console.log('   1. No coverage available at this location');
    console.log('   2. Feasibility check failed');
    console.log('   3. Requires different API endpoint or auth');
    console.log('   4. Site instance mismatch (Supersonic vs CircleTel)');
    console.log('\n🎯 RECOMMENDATION:');
    console.log('   - Implement fallback to MTN Consumer API');
    console.log('   - Use Supersonic as supplementary data source only');
    console.log('   - Contact AgilityGIS for official API guidance\n');

  } catch (error) {
    console.error('\n❌ Error:', error);
  }
}

testWithDelay().catch(console.error);
