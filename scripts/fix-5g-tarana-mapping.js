/**
 * Fix 5G vs Tarana Wireless Mapping
 *
 * Issue: uncapped_wireless was incorrectly mapped to '5g' product category
 * Correct: uncapped_wireless = Tarana wireless technology (should map to 'wireless')
 *          5G = Actual 5G cellular from layer 'mtnsi:MTNSA-Coverage-5G-5G'
 *
 * This script:
 * 1. Removes incorrect uncapped_wireless → 5g mapping
 * 2. Verifies uncapped_wireless → wireless mapping exists (for Tarana/SkyFibre)
 * 3. Ensures correct 5g → 5g mapping exists
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixMapping() {
  console.log('🔧 Fixing 5G vs Tarana Wireless Mapping\n');

  // Step 1: Check current mappings
  console.log('📊 Current service_type_mapping state:');
  const { data: currentMappings, error: fetchError } = await supabase
    .from('service_type_mapping')
    .select('*')
    .or('technical_type.eq.uncapped_wireless,technical_type.eq.5g')
    .order('technical_type', { ascending: true })
    .order('priority', { ascending: true });

  if (fetchError) {
    console.error('❌ Error fetching mappings:', fetchError);
    return;
  }

  console.log('\nFound mappings:');
  currentMappings?.forEach(m => {
    console.log(`  ${m.technical_type} → ${m.product_category} (priority ${m.priority}, active: ${m.active})`);
  });

  // Step 2: Remove incorrect uncapped_wireless → 5g mapping
  console.log('\n🗑️  Removing incorrect uncapped_wireless → 5g mapping...');
  const { data: deleted, error: deleteError } = await supabase
    .from('service_type_mapping')
    .delete()
    .eq('technical_type', 'uncapped_wireless')
    .eq('product_category', '5g')
    .select();

  if (deleteError) {
    console.error('❌ Error deleting mapping:', deleteError);
  } else if (deleted && deleted.length > 0) {
    console.log(`✅ Deleted ${deleted.length} incorrect mapping(s)`);
  } else {
    console.log('ℹ️  No incorrect mapping found (may have been deleted already)');
  }

  // Step 3: Verify uncapped_wireless → wireless mapping exists
  console.log('\n🔍 Verifying uncapped_wireless → wireless mapping (Tarana)...');
  const { data: wirelessMapping, error: wirelessError } = await supabase
    .from('service_type_mapping')
    .select('*')
    .eq('technical_type', 'uncapped_wireless')
    .eq('product_category', 'wireless')
    .single();

  if (wirelessError && wirelessError.code !== 'PGRST116') {
    console.error('❌ Error checking wireless mapping:', wirelessError);
  } else if (!wirelessMapping) {
    console.log('⚠️  Wireless mapping not found. Creating it...');
    const { data: created, error: createError } = await supabase
      .from('service_type_mapping')
      .insert({
        technical_type: 'uncapped_wireless',
        product_category: 'wireless',
        provider: 'mtn',
        priority: 3,
        active: true,
        notes: 'MTN Tarana Fixed Wireless (SkyFibre) - NOT 5G cellular'
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Error creating wireless mapping:', createError);
    } else {
      console.log('✅ Created uncapped_wireless → wireless mapping');
    }
  } else {
    console.log(`✅ Wireless mapping exists (priority ${wirelessMapping.priority}, active: ${wirelessMapping.active})`);
  }

  // Step 4: Verify 5g → 5g mapping exists
  console.log('\n🔍 Verifying 5g → 5g mapping...');
  const { data: fiveGMapping, error: fiveGError } = await supabase
    .from('service_type_mapping')
    .select('*')
    .eq('technical_type', '5g')
    .eq('product_category', '5g')
    .single();

  if (fiveGError && fiveGError.code !== 'PGRST116') {
    console.error('❌ Error checking 5g mapping:', fiveGError);
  } else if (!fiveGMapping) {
    console.log('⚠️  5G mapping not found. Creating it...');
    const { data: created, error: createError } = await supabase
      .from('service_type_mapping')
      .insert({
        technical_type: '5g',
        product_category: '5g',
        provider: 'mtn',
        priority: 1,
        active: true,
        notes: 'MTN 5G Cellular - Actual 5G from layer mtnsi:MTNSA-Coverage-5G-5G'
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Error creating 5g mapping:', createError);
    } else {
      console.log('✅ Created 5g → 5g mapping');
    }
  } else {
    console.log(`✅ 5G mapping exists (priority ${fiveGMapping.priority}, active: ${fiveGMapping.active})`);
  }

  // Step 5: Final verification
  console.log('\n📊 Final service_type_mapping state:');
  const { data: finalMappings, error: finalError } = await supabase
    .from('service_type_mapping')
    .select('*')
    .or('technical_type.eq.uncapped_wireless,technical_type.eq.5g')
    .order('technical_type', { ascending: true })
    .order('priority', { ascending: true });

  if (finalError) {
    console.error('❌ Error fetching final mappings:', finalError);
    return;
  }

  console.log('\nFinal mappings:');
  finalMappings?.forEach(m => {
    const icon = m.product_category === '5g' && m.technical_type === '5g' ? '✅' :
                 m.product_category === 'wireless' && m.technical_type === 'uncapped_wireless' ? '✅' : '⚠️';
    console.log(`  ${icon} ${m.technical_type} → ${m.product_category} (priority ${m.priority}, active: ${m.active})`);
  });

  console.log('\n✅ Mapping fix complete!\n');
  console.log('Summary:');
  console.log('  ✅ 5g → 5g (MTN 5G Cellular from layer mtnsi:MTNSA-Coverage-5G-5G)');
  console.log('  ✅ uncapped_wireless → wireless (MTN Tarana Fixed Wireless, NOT 5G)');
  console.log('  ❌ uncapped_wireless → 5g (REMOVED - this was incorrect)');
}

fixMapping().catch(console.error);
