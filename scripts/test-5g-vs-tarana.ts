/**
 * Test 5G vs Tarana Wireless Coverage Detection
 *
 * This script tests the corrected coverage detection:
 * - 5G cellular from layer 'mtnsi:MTNSA-Coverage-5G-5G'
 * - Tarana wireless from layer 'mtnsi:MTNSA-Coverage-Tarana' (uncapped_wireless)
 *
 * Test Address: 7 Autumn St, Rivonia, Sandton, 2128
 * Known Coverage: Tarana wireless (confirmed), 5G cellular (to be verified)
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { MTNWMSRealtimeClient } from '../lib/coverage/mtn/wms-realtime-client';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test address coordinates
const testAddress = '7 Autumn St, Rivonia, Sandton, 2128';
const coordinates = {
  lat: -26.0542,
  lng: 28.0600
};

async function testCoverage() {
  console.log('🧪 Testing 5G vs Tarana Wireless Coverage Detection\n');
  console.log(`📍 Test Address: ${testAddress}`);
  console.log(`📍 Coordinates: ${coordinates.lat}, ${coordinates.lng}\n`);

  // Step 1: Check MTN WMS API coverage
  console.log('🌐 Step 1: Checking MTN WMS API Coverage...');
  try {
    const coverageResult = await MTNWMSRealtimeClient.checkCoverage(
      coordinates,
      ['5g', 'uncapped_wireless', 'fixed_lte', 'fibre']
    );

    console.log('\n✅ Coverage Result:');
    console.log(JSON.stringify(coverageResult, null, 2));

    // Check what service types were found
    const serviceTypes = coverageResult.services || [];
    console.log('\n📊 Service Types Detected:');
    serviceTypes.forEach(service => {
      const icon = service.available ? '✅' : '❌';
      console.log(`  ${icon} ${service.type}: ${service.available ? 'AVAILABLE' : 'NOT AVAILABLE'}`);
      if (service.available && service.layerData) {
        console.log(`     Layer: ${service.layerData.layer || 'unknown'}`);
        console.log(`     Technology: ${service.layerData.TYPE || service.layerData.TECHNOLOGY || 'unknown'}`);
      }
    });

    // Step 2: Check service_type_mapping
    console.log('\n🗺️  Step 2: Checking Service Type Mappings...');
    const technicalTypes = serviceTypes.filter(s => s.available).map(s => s.type);

    for (const techType of technicalTypes) {
      const { data: mappings, error } = await supabase
        .from('service_type_mapping')
        .select('*')
        .eq('technical_type', techType)
        .eq('active', true)
        .order('priority', { ascending: true });

      if (error) {
        console.error(`❌ Error fetching mappings for ${techType}:`, error);
      } else if (mappings && mappings.length > 0) {
        console.log(`\n  ${techType}:`);
        mappings.forEach(m => {
          console.log(`    → ${m.product_category} (priority ${m.priority}) - ${m.notes || 'no notes'}`);
        });
      }
    }

    // Step 3: Query packages for each detected service
    console.log('\n📦 Step 3: Checking Available Packages...');

    // Get all product categories from mappings
    const productCategories = new Set<string>();
    for (const techType of technicalTypes) {
      const { data: mappings } = await supabase
        .from('service_type_mapping')
        .select('product_category')
        .eq('technical_type', techType)
        .eq('active', true);

      mappings?.forEach(m => productCategories.add(m.product_category));
    }

    console.log(`\nProduct categories to query: ${Array.from(productCategories).join(', ')}`);

    // Query consumer packages
    console.log('\n  🏠 Consumer Packages:');
    for (const category of productCategories) {
      const { data: packages, error } = await supabase
        .from('service_packages')
        .select('id, name, service_type, product_category, price, active')
        .eq('product_category', category)
        .eq('customer_type', 'consumer')
        .eq('active', true)
        .order('price', { ascending: true });

      if (error) {
        console.error(`    ❌ Error fetching ${category} packages:`, error);
      } else if (packages && packages.length > 0) {
        console.log(`\n    ${category.toUpperCase()} (${packages.length} packages):`);
        packages.forEach(p => {
          console.log(`      • ${p.name} - R${p.price}/mo`);
        });
      } else {
        console.log(`\n    ${category.toUpperCase()}: No packages found`);
      }
    }

    // Query business packages
    console.log('\n  🏢 Business Packages:');
    for (const category of productCategories) {
      const { data: packages, error } = await supabase
        .from('service_packages')
        .select('id, name, service_type, product_category, price, active')
        .eq('product_category', category)
        .eq('customer_type', 'business')
        .eq('active', true)
        .order('price', { ascending: true });

      if (error) {
        console.error(`    ❌ Error fetching ${category} packages:`, error);
      } else if (packages && packages.length > 0) {
        console.log(`\n    ${category.toUpperCase()} (${packages.length} packages):`);
        packages.forEach(p => {
          console.log(`      • ${p.name} - R${p.price}/mo`);
        });
      } else {
        console.log(`\n    ${category.toUpperCase()}: No packages found`);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 SUMMARY');
    console.log('='.repeat(80));

    const has5G = serviceTypes.some(s => s.type === '5g' && s.available);
    const hasTarana = serviceTypes.some(s => s.type === 'uncapped_wireless' && s.available);

    console.log(`\n✅ 5G Cellular Coverage: ${has5G ? 'YES' : 'NO'}`);
    console.log(`✅ Tarana Wireless Coverage: ${hasTarana ? 'YES' : 'NO'}`);

    if (has5G) {
      console.log('\n5G packages should be shown (actual 5G cellular technology)');
    }
    if (hasTarana) {
      console.log('\nWireless packages should be shown (Tarana fixed wireless, NOT 5G)');
    }

    console.log('\n✅ Test complete!');

  } catch (error) {
    console.error('❌ Error during coverage check:', error);
  }
}

testCoverage().catch(console.error);
