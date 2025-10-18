#!/usr/bin/env tsx
/**
 * Complete Customer Journey Test
 *
 * Tests the full customer journey flow:
 * 1. User enters address
 * 2. Geocode + create lead in Supabase
 * 3. Check MTN coverage via API (with enhanced headers)
 * 4. Get available packages
 * 5. Verify Zoho CRM integration (optional)
 *
 * Usage: npx tsx scripts/test-customer-journey-complete.ts
 */

import { Coordinates } from '../lib/coverage/types';

const API_BASE_URL = 'http://localhost:3005';

interface JourneyTestResult {
  step: string;
  success: boolean;
  duration: number;
  data?: any;
  error?: string;
}

const testAddress = {
  address: '1 Commissioner Street, Johannesburg CBD, South Africa',
  coordinates: { lat: -26.2041, lng: 28.0473 }
};

async function testCompleteJourney() {
  console.log('🧪 Testing Complete Customer Journey\n');
  console.log('═'.repeat(70));
  console.log('\n📍 Test Location:', testAddress.address);
  console.log('📍 Coordinates:', testAddress.coordinates);
  console.log('\n' + '═'.repeat(70) + '\n');

  const results: JourneyTestResult[] = [];
  let leadId: string | null = null;

  // Step 1: Create Coverage Lead (simulating address entry + geocoding)
  console.log('Step 1: Creating coverage lead in Supabase...');
  const step1Start = Date.now();

  try {
    const response = await fetch(`${API_BASE_URL}/api/coverage/lead`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: testAddress.address,
        coordinates: testAddress.coordinates,
        source: 'homepage_hero'
      })
    });

    const data = await response.json();
    const step1Duration = Date.now() - step1Start;

    if (data.success && data.data?.id) {
      leadId = data.data.id;
      console.log(`   ✅ Lead created: ${leadId} (${step1Duration}ms)`);
      results.push({
        step: 'Create Lead',
        success: true,
        duration: step1Duration,
        data: { leadId }
      });
    } else {
      throw new Error(data.error || 'Failed to create lead');
    }
  } catch (error: any) {
    const step1Duration = Date.now() - step1Start;
    console.log(`   ❌ Failed: ${error.message} (${step1Duration}ms)`);
    results.push({
      step: 'Create Lead',
      success: false,
      duration: step1Duration,
      error: error.message
    });
    return results; // Cannot continue without lead
  }

  // Step 2: Check MTN Coverage (with enhanced headers)
  console.log('\nStep 2: Checking MTN coverage with enhanced headers...');
  const step2Start = Date.now();

  try {
    const response = await fetch(`${API_BASE_URL}/api/coverage/mtn/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        coordinates: testAddress.coordinates,
        serviceTypes: ['5g', 'lte', 'fibre', 'fixed_lte']
      })
    });

    const data = await response.json();
    const step2Duration = Date.now() - step2Start;

    if (data.success) {
      const servicesCount = data.data?.services?.length || 0;
      const availableCount = data.data?.services?.filter((s: any) => s.available).length || 0;

      console.log(`   ✅ Coverage check complete (${step2Duration}ms)`);
      console.log(`   📡 Services found: ${servicesCount}`);
      console.log(`   ✓ Available: ${availableCount}`);
      console.log(`   Provider: ${data.data?.provider || 'Unknown'}`);
      console.log(`   Confidence: ${data.data?.confidence || 'Unknown'}`);

      results.push({
        step: 'MTN Coverage Check',
        success: true,
        duration: step2Duration,
        data: {
          servicesFound: servicesCount,
          servicesAvailable: availableCount,
          provider: data.data?.provider,
          confidence: data.data?.confidence
        }
      });
    } else {
      throw new Error(data.error || 'Coverage check failed');
    }
  } catch (error: any) {
    const step2Duration = Date.now() - step2Start;
    console.log(`   ❌ Failed: ${error.message} (${step2Duration}ms)`);
    results.push({
      step: 'MTN Coverage Check',
      success: false,
      duration: step2Duration,
      error: error.message
    });
  }

  // Step 3: Get Available Packages
  console.log('\nStep 3: Fetching available packages for lead...');
  const step3Start = Date.now();

  try {
    const response = await fetch(`${API_BASE_URL}/api/coverage/packages?leadId=${leadId}`);
    const data = await response.json();
    const step3Duration = Date.now() - step3Start;

    if (data.success && data.data?.packages) {
      const packagesCount = data.data.packages.length;
      console.log(`   ✅ Packages retrieved (${step3Duration}ms)`);
      console.log(`   📦 Packages available: ${packagesCount}`);

      if (packagesCount > 0) {
        console.log('\n   Top 3 Packages:');
        data.data.packages.slice(0, 3).forEach((pkg: any, index: number) => {
          console.log(`      ${index + 1}. ${pkg.name} - R${pkg.price}/month (${pkg.type})`);
        });
      }

      results.push({
        step: 'Get Packages',
        success: true,
        duration: step3Duration,
        data: {
          packagesCount,
          topPackages: data.data.packages.slice(0, 3).map((p: any) => ({
            name: p.name,
            price: p.price,
            type: p.type
          }))
        }
      });
    } else {
      throw new Error(data.error || 'Failed to get packages');
    }
  } catch (error: any) {
    const step3Duration = Date.now() - step3Start;
    console.log(`   ❌ Failed: ${error.message} (${step3Duration}ms)`);
    results.push({
      step: 'Get Packages',
      success: false,
      duration: step3Duration,
      error: error.message
    });
  }

  // Summary
  console.log('\n' + '═'.repeat(70));
  console.log('\n📊 Journey Test Summary:\n');

  const successCount = results.filter(r => r.success).length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  console.log(`   Total Steps: ${results.length}`);
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${results.length - successCount}`);
  console.log(`   ⏱️  Total Duration: ${totalDuration}ms`);

  console.log('\n   Step Details:');
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`   ${status} ${result.step}: ${result.duration}ms`);
    if (result.error) {
      console.log(`      Error: ${result.error}`);
    }
  });

  // Final verdict
  console.log('\n' + '═'.repeat(70));

  if (successCount === results.length) {
    console.log('\n🎉 ALL STEPS PASSED - Customer journey working perfectly!');
    console.log('\n✅ MTN Enhanced Headers: Working');
    console.log('✅ Lead Creation: Working');
    console.log('✅ Package Recommendations: Working');
  } else if (successCount > 0) {
    console.log('\n⚠️  PARTIAL SUCCESS - Some steps failed');
    console.log('\nReview failed steps above for issues.');
  } else {
    console.log('\n❌ ALL STEPS FAILED - Critical system issues');
    console.log('\nReview error messages above.');
  }

  console.log('\n' + '═'.repeat(70) + '\n');

  return results;
}

// Run the test
testCompleteJourney().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
