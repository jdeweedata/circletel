/**
 * Import MTN Business Standard Uncapped LTE Products
 *
 * This script imports 5 MTN LTE Uncapped products based on the documentation
 * in docs/products/01_ACTIVE_PRODUCTS/MTN 5G-LTE/mtn-lte-uncapped-product-doc.md
 *
 * Products:
 * 1. LTE Basic (5 Mbps, 300GB FUP, R299)
 * 2. LTE Standard (10 Mbps, 400GB FUP, R399)
 * 3. LTE Advanced (20 Mbps, 600GB FUP, R599)
 * 4. LTE Premium 10 (10 Mbps, 700GB FUP, R599)
 * 5. LTE Premium 20 (20 Mbps, 1TB FUP, R699)
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const products = [
  {
    name: 'MTN Business Uncapped LTE 5Mbps',
    service_type: 'lte',
    speed_down: 5,
    speed_up: 2,
    price: 299,
    promotion_price: null,
    promotion_months: null,
    description: 'MTN Business LTE Basic - Guaranteed 5Mbps with 300GB Fair Usage Policy. Ideal for small offices (3-5 users), POS systems, and backup connectivity.',
    features: [
      'Guaranteed 5 Mbps download speed',
      'Up to 2 Mbps upload speed',
      '300GB Fair Usage Policy',
      'Reduced to 1 Mbps after FUP (unlimited)',
      'Static IP available (free upon request)',
      '24-month contract',
      'Business-grade network priority',
      'BYOD or Tozed ZLT X100 Pro 5G CPE available',
      'Promotion valid Feb 1 - Sept 7, 2025',
      'Deal Code: 202503EBU2805 (SIM Only) / 202506EBU4100 (With Router)',
      'Router bundle: +R70/month (R369 total incl VAT)'
    ],
    active: true,
    sort_order: 100,
    product_category: 'lte',
    customer_type: 'business',
    network_provider_id: null,
    requires_fttb_coverage: false,
    compatible_providers: ['mtn'],
    provider_specific_config: {
      fup_gb: 300,
      post_fup_speed_mbps: 1,
      contract_months: 24,
      static_ip: true,
      deal_code_sim: '202503EBU2805',
      deal_code_router: '202506EBU4100',
      router_model: 'Tozed ZLT X100 Pro 5G CPE',
      router_bundle_price: 369
    },
    provider_priority: 1
  },
  {
    name: 'MTN Business Uncapped LTE 10Mbps',
    service_type: 'lte',
    speed_down: 10,
    speed_up: 5,
    price: 399,
    promotion_price: null,
    promotion_months: null,
    description: 'MTN Business LTE Standard - Guaranteed 10Mbps with 400GB Fair Usage Policy. Perfect for small-medium offices (8-12 users) with cloud applications.',
    features: [
      'Guaranteed 10 Mbps download speed',
      'Up to 5 Mbps upload speed',
      '400GB Fair Usage Policy',
      'Reduced to 1 Mbps after FUP (unlimited)',
      'Static IP available (free upon request)',
      '24-month contract',
      'Business-grade network priority',
      'BYOD or Tozed ZLT X100 Pro 5G CPE available',
      'Promotion valid Feb 1 - Sept 7, 2025',
      'Deal Code: 202503EBU2806 (SIM Only) / 202506EBU4101 (With Router)',
      'Router bundle: +R80/month (R479 total incl VAT)'
    ],
    active: true,
    sort_order: 101,
    product_category: 'lte',
    customer_type: 'business',
    network_provider_id: null,
    requires_fttb_coverage: false,
    compatible_providers: ['mtn'],
    provider_specific_config: {
      fup_gb: 400,
      post_fup_speed_mbps: 1,
      contract_months: 24,
      static_ip: true,
      deal_code_sim: '202503EBU2806',
      deal_code_router: '202506EBU4101',
      router_model: 'Tozed ZLT X100 Pro 5G CPE',
      router_bundle_price: 479
    },
    provider_priority: 1
  },
  {
    name: 'MTN Business Uncapped LTE 20Mbps',
    service_type: 'lte',
    speed_down: 20,
    speed_up: 10,
    price: 599,
    promotion_price: null,
    promotion_months: null,
    description: 'MTN Business LTE Advanced - Guaranteed 20Mbps with 600GB Fair Usage Policy. Ideal for medium offices (15-25 users) with HD video conferencing.',
    features: [
      'Guaranteed 20 Mbps download speed',
      'Up to 10 Mbps upload speed',
      '600GB Fair Usage Policy',
      'Reduced to 2 Mbps after FUP (unlimited)',
      'Static IP available (free upon request)',
      '24-month contract',
      'Business-grade network priority',
      'BYOD or Tozed ZLT X100 Pro 5G CPE available',
      'Promotion valid Feb 1 - Sept 7, 2025',
      'Deal Code: 202503EBU2807 (SIM Only) / 202506EBU4102 (With Router)',
      'Router bundle: +R100/month (R699 total incl VAT)'
    ],
    active: true,
    sort_order: 102,
    product_category: 'lte',
    customer_type: 'business',
    network_provider_id: null,
    requires_fttb_coverage: false,
    compatible_providers: ['mtn'],
    provider_specific_config: {
      fup_gb: 600,
      post_fup_speed_mbps: 2,
      contract_months: 24,
      static_ip: true,
      deal_code_sim: '202503EBU2807',
      deal_code_router: '202506EBU4102',
      router_model: 'Tozed ZLT X100 Pro 5G CPE',
      router_bundle_price: 699
    },
    provider_priority: 1
  },
  {
    name: 'MTN Business Uncapped LTE Premium 10Mbps',
    service_type: 'lte',
    speed_down: 10,
    speed_up: 5,
    price: 599,
    promotion_price: null,
    promotion_months: null,
    description: 'MTN Business LTE Premium 10 - Guaranteed 10Mbps with 700GB Fair Usage Policy (75% more data than standard). Perfect for high-usage small teams and 24/7 operations.',
    features: [
      'Guaranteed 10 Mbps download speed',
      'Up to 5 Mbps upload speed',
      '700GB Fair Usage Policy (75% more than standard)',
      'Reduced to 1 Mbps after FUP (unlimited)',
      'Static IP available (free upon request)',
      '24-month contract',
      'Enhanced business-grade network priority',
      'BYOD or Tozed ZLT X100 Pro 5G CPE available',
      'Promotion valid Feb 1 - Sept 7, 2025',
      'Deal Code: 202503EBU2808 (SIM Only) / 202506EBU4103 (With Router)',
      'Router bundle: +R100/month (R699 total incl VAT)'
    ],
    active: true,
    sort_order: 103,
    product_category: 'lte',
    customer_type: 'business',
    network_provider_id: null,
    requires_fttb_coverage: false,
    compatible_providers: ['mtn'],
    provider_specific_config: {
      fup_gb: 700,
      post_fup_speed_mbps: 1,
      contract_months: 24,
      static_ip: true,
      deal_code_sim: '202503EBU2808',
      deal_code_router: '202506EBU4103',
      router_model: 'Tozed ZLT X100 Pro 5G CPE',
      router_bundle_price: 699,
      premium_tier: true
    },
    provider_priority: 1
  },
  {
    name: 'MTN Business Uncapped LTE Premium 20Mbps',
    service_type: 'lte',
    speed_down: 20,
    speed_up: 10,
    price: 699,
    promotion_price: null,
    promotion_months: null,
    description: 'MTN Business LTE Premium 20 - Guaranteed 20Mbps with 1TB Fair Usage Policy. Ideal for large offices (25-40 users) and data-intensive operations.',
    features: [
      'Guaranteed 20 Mbps download speed',
      'Up to 10 Mbps upload speed',
      '1TB Fair Usage Policy',
      'Reduced to 2 Mbps after FUP (unlimited)',
      'Static IP available (free upon request)',
      '24-month contract',
      'Premium business-grade network priority',
      'BYOD or Tozed ZLT X100 Pro 5G CPE available',
      'Promotion valid Feb 1 - Sept 7, 2025',
      'Deal Code: 202503EBU2809 (SIM Only) / 202506EBU4104 (With Router)',
      'Router bundle: +R110/month (R809 total incl VAT)'
    ],
    active: true,
    sort_order: 104,
    product_category: 'lte',
    customer_type: 'business',
    network_provider_id: null,
    requires_fttb_coverage: false,
    compatible_providers: ['mtn'],
    provider_specific_config: {
      fup_gb: 1024,
      post_fup_speed_mbps: 2,
      contract_months: 24,
      static_ip: true,
      deal_code_sim: '202503EBU2809',
      deal_code_router: '202506EBU4104',
      router_model: 'Tozed ZLT X100 Pro 5G CPE',
      router_bundle_price: 809,
      premium_tier: true
    },
    provider_priority: 1
  }
];

async function importProducts() {
  console.log('=== MTN LTE Uncapped Products Import ===\n');
  console.log(`📦 Importing ${products.length} products...\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const product of products) {
    try {
      // Check if product already exists
      const { data: existing, error: checkError } = await supabase
        .from('service_packages')
        .select('id, name')
        .eq('name', product.name)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existing) {
        console.log(`⚠️  SKIP: ${product.name} (already exists)`);
        continue;
      }

      // Insert new product
      const { data, error } = await supabase
        .from('service_packages')
        .insert([product])
        .select();

      if (error) {
        throw error;
      }

      console.log(`✅ IMPORTED: ${product.name}`);
      console.log(`   Speed: ${product.speed_down} Mbps | FUP: ${product.provider_specific_config.fup_gb}GB | Price: R${product.price}`);
      console.log(`   Deal Codes: ${product.provider_specific_config.deal_code_sim} (SIM) / ${product.provider_specific_config.deal_code_router} (Router)\n`);
      successCount++;
    } catch (error) {
      console.error(`❌ ERROR: ${product.name}`);
      console.error(`   ${error.message}\n`);
      errorCount++;
    }
  }

  console.log('\n=== Import Summary ===');
  console.log(`✅ Successfully imported: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📊 Total processed: ${products.length}`);

  if (successCount > 0) {
    console.log('\n🎉 Products are now available in CircleTel!');
    console.log('You can view them at: /admin/products or /packages');
  }
}

// Run the import
importProducts()
  .then(() => {
    console.log('\n✨ Import process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error during import:', error);
    process.exit(1);
  });
