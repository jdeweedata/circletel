/**
 * Import SkyFibre Home Products to Supabase
 * Reads from skyfibre_home_residential_products.json and inserts into service_packages table
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Import Supabase client
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Read the products JSON file
const productsFilePath = 'C:\\Users\\JeffreyDeWee\\Downloads\\skyfibre_home_residential_products.json';

if (!fs.existsSync(productsFilePath)) {
  console.error(`❌ File not found: ${productsFilePath}`);
  process.exit(1);
}

const productsData = JSON.parse(fs.readFileSync(productsFilePath, 'utf-8'));

/**
 * Map JSON product to Supabase service_packages schema
 */
function mapProductToSchema(product) {
  // Extract speed from product name (e.g., "50" from "SKY-HOME-50")
  const speedMatch = product.sku.match(/SKY-HOME-(\d+)/);
  const speed = speedMatch ? parseInt(speedMatch[1]) : 50;

  return {
    // Basic Info
    name: product.name,
    service_type: '5g', // Use '5g' for wireless broadband (closest match in DB enum)

    // Speed (symmetrical for SkyFibre)
    speed_down: speed,
    speed_up: speed,

    // Pricing
    price: product.pricing.monthly,
    promotion_price: null, // Can be set for promotions
    promotion_months: 0,

    // Description
    description: product.description,

    // Features - store as JSONB array
    features: product.features,

    // Status
    active: product.is_active,

    // Display order (based on speed tier)
    sort_order: product.sku === 'SKY-HOME-50' ? 10 :
                product.sku === 'SKY-HOME-100' ? 11 : 12,

    // Categorization
    product_category: 'wireless', // SkyFibre is wireless
    customer_type: 'business', // Must be 'business' per DB constraint (will store actual type in metadata)

    // Provider info
    network_provider_id: null, // Will be set if we have provider in DB
    requires_fttb_coverage: false, // SkyFibre is wireless, not FTTB
    compatible_providers: ['mtn', 'skyfibre'], // Compatible provider slugs

    // Provider-specific config - store detailed metadata
    provider_specific_config: {
      ...product.metadata,
      pricing: product.pricing,
      cost_price_zar: product.cost_price_zar,
      base_price_zar: product.base_price_zar,
      is_featured: product.is_featured,
      is_popular: product.is_popular,
      slug: product.slug,
      sku: product.sku,
      actual_customer_type: 'residential', // Store actual customer type here
      actual_service_type: product.service_type, // Store actual service type (SkyFibre)
      target_market_segment: 'home' // SkyFibre Home is for residential homes
    },

    // Provider priority
    provider_priority: 1,

    // Timestamps handled by Supabase
  };
}

/**
 * Check if product already exists by name
 */
async function productExists(name) {
  const { data, error } = await supabase
    .from('service_packages')
    .select('id, name')
    .eq('name', name)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error(`Error checking product ${name}:`, error);
    return null;
  }

  return data;
}

/**
 * Insert or update product
 */
async function upsertProduct(product) {
  const mappedProduct = mapProductToSchema(product);

  // Check if exists by name
  const existing = await productExists(product.name);

  if (existing) {
    console.log(`📝 Updating existing product: ${product.name} (${product.sku})`);

    const { data, error } = await supabase
      .from('service_packages')
      .update(mappedProduct)
      .eq('name', product.name)
      .select();

    if (error) {
      console.error(`❌ Failed to update ${product.name}:`, error);
      return { success: false, error };
    }

    console.log(`✅ Updated: ${product.name}`);
    return { success: true, data, action: 'updated' };
  } else {
    console.log(`➕ Inserting new product: ${product.name} (${product.sku})`);

    const { data, error } = await supabase
      .from('service_packages')
      .insert([mappedProduct])
      .select();

    if (error) {
      console.error(`❌ Failed to insert ${product.name}:`, error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return { success: false, error };
    }

    console.log(`✅ Inserted: ${product.name}`);
    return { success: true, data, action: 'inserted' };
  }
}

/**
 * Main import function
 */
async function importProducts() {
  console.log('=== SkyFibre Home Products Import ===\n');
  console.log(`📁 Source: ${productsFilePath}`);
  console.log(`🗄️  Database: ${supabaseUrl}`);
  console.log(`📦 Products to import: ${productsData.products.length}\n`);

  const results = {
    inserted: 0,
    updated: 0,
    failed: 0
  };

  for (const product of productsData.products) {
    try {
      const result = await upsertProduct(product);

      if (result.success) {
        if (result.action === 'inserted') {
          results.inserted++;
        } else {
          results.updated++;
        }
      } else {
        results.failed++;
      }
    } catch (error) {
      console.error(`❌ Unexpected error processing ${product.sku}:`, error);
      results.failed++;
    }
  }

  console.log('\n=== Import Summary ===');
  console.log(`✅ Inserted: ${results.inserted}`);
  console.log(`📝 Updated: ${results.updated}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📊 Total: ${results.inserted + results.updated + results.failed}`);

  if (results.failed > 0) {
    console.log('\n⚠️  Some products failed to import. Check errors above.');
    process.exit(1);
  }

  console.log('\n🎉 Import completed successfully!');
}

// Run the import
importProducts().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
