#!/usr/bin/env node

/**
 * Apply service_type_mapping migration
 * This script populates the service_type_mapping table with MTN service mappings
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration from .env.local
const supabaseUrl = 'https://agyjovdugmtopasyvlng.supabase.co';
const supabaseServiceKey = 'sb_secret_KZlUVioFZ4r8vbeOK4215g_f3tUgyoG';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('Applying service_type_mapping migration...\n');

  try {
    // Insert service type mappings
    const { data, error } = await supabase
      .from('service_type_mapping')
      .upsert([
        {
          technical_type: 'SkyFibre',
          provider: 'mtn',
          product_category: 'wireless',
          priority: 1,
          active: true,
          notes: 'SkyFibre Fixed Wireless Access packages'
        },
        {
          technical_type: 'SkyFibre',
          provider: 'mtn',
          product_category: '5g',
          priority: 2,
          active: true,
          notes: 'SkyFibre 5G packages'
        },
        {
          technical_type: 'SkyFibre',
          provider: 'mtn',
          product_category: 'lte',
          priority: 3,
          active: true,
          notes: 'SkyFibre LTE packages'
        },
        {
          technical_type: 'HomeFibreConnect',
          provider: 'mtn',
          product_category: 'fibre_consumer',
          priority: 1,
          active: true,
          notes: 'Home Fibre consumer packages'
        },
        {
          technical_type: 'BizFibreConnect',
          provider: 'mtn',
          product_category: 'fibre_business',
          priority: 1,
          active: true,
          notes: 'Business Fibre packages'
        },
        {
          technical_type: 'BizFibreConnect',
          provider: 'mtn',
          product_category: 'connectivity',
          priority: 2,
          active: true,
          notes: 'Business connectivity packages'
        }
      ], {
        onConflict: 'technical_type,provider,product_category',
        ignoreDuplicates: true
      })
      .select();

    if (error) {
      console.error('❌ Error applying migration:', error.message);
      console.error('Details:', error);
      process.exit(1);
    }

    console.log('✅ Migration applied successfully!');
    console.log(`✅ Inserted/updated ${data?.length || 0} mappings\n`);

    // Verify mappings
    const { data: mappings, error: verifyError } = await supabase
      .from('service_type_mapping')
      .select('technical_type, product_category, priority, active')
      .order('technical_type', { ascending: true })
      .order('priority', { ascending: true });

    if (verifyError) {
      console.error('❌ Error verifying mappings:', verifyError.message);
      process.exit(1);
    }

    console.log('📊 Current service_type_mapping records:');
    console.table(mappings);

    process.exit(0);
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  }
}

applyMigration();
