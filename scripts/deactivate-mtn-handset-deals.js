#!/usr/bin/env node
/**
 * Deactivate MTN Deals with Handsets
 * Marks handset products as inactive (won't show in admin/frontend)
 * Keeps only SIM-only deals active
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function deactivateHandsetDeals(options = {}) {
  const { dryRun = true } = options;

  console.log('\n🔒 Deactivate MTN Handset Deals\n');
  console.log(`Mode: ${dryRun ? 'DRY RUN (preview only)' : '⚠️  LIVE UPDATE'}\n`);

  try {
    // 1. Get all MTN products
    console.log('📊 Analyzing MTN products...\n');
    const { data: allProducts, error: allError } = await supabase
      .from('service_packages')
      .select('id, name, sku, metadata, active, status')
      .like('name', 'MTN%');

    if (allError) {
      throw new Error(`Failed to fetch products: ${allError.message}`);
    }

    console.log(`Total MTN products: ${allProducts.length}`);

    // 2. Separate products by device type
    const simOnlyProducts = [];
    const handsetProducts = [];

    allProducts.forEach(product => {
      const device = product.metadata?.oemDevice;
      
      if (device === 'Use Your Own') {
        simOnlyProducts.push(product);
      } else {
        handsetProducts.push(product);
      }
    });

    console.log(`\n✅ SIM-Only products (will keep active): ${simOnlyProducts.length}`);
    console.log(`❌ Handset products (will deactivate): ${handsetProducts.length}\n`);

    // 3. Show sample handset products to be deactivated
    console.log('📱 Sample Handset Products to Deactivate:\n');
    handsetProducts.slice(0, 10).forEach((product, i) => {
      const device = product.metadata?.oemDevice || 'Unknown';
      const currentStatus = product.active ? '✅ Active' : '🔒 Inactive';
      console.log(`${i + 1}. ${product.name}`);
      console.log(`   Device: ${device}`);
      console.log(`   Current: ${currentStatus}`);
      console.log(`   SKU: ${product.sku}\n`);
    });

    if (handsetProducts.length > 10) {
      console.log(`   ... and ${handsetProducts.length - 10} more\n`);
    }

    // 4. Show sample SIM-only products to keep
    console.log('📶 Sample SIM-Only Products (will remain active):\n');
    simOnlyProducts.slice(0, 5).forEach((product, i) => {
      const currentStatus = product.active ? '✅ Active' : '🔒 Inactive';
      console.log(`${i + 1}. ${product.name}`);
      console.log(`   Current: ${currentStatus}`);
      console.log(`   SKU: ${product.sku}\n`);
    });

    if (simOnlyProducts.length > 5) {
      console.log(`   ... and ${simOnlyProducts.length - 5} more\n`);
    }

    if (dryRun) {
      console.log('🚫 DRY RUN - No changes made to database');
      console.log('\nTo actually deactivate these products, run:');
      console.log('node scripts/deactivate-mtn-handset-deals.js --confirm\n');
      console.log('Note: Deactivated products won\'t show in admin/frontend but will remain in database.');
      return {
        simOnly: simOnlyProducts.length,
        handsets: handsetProducts.length,
        deactivated: 0
      };
    }

    // 5. Deactivate handset products
    console.log('🔒 Deactivating handset products...\n');
    let deactivated = 0;
    let failed = 0;
    const failedProducts = [];

    for (const product of handsetProducts) {
      try {
        const { error } = await supabase
          .from('service_packages')
          .update({
            active: false,
            status: 'archived'
          })
          .eq('id', product.id);

        if (error) {
          failedProducts.push({
            name: product.name,
            reason: error.message
          });
          failed++;
        } else {
          deactivated++;
          if (deactivated % 100 === 0) {
            console.log(`   Deactivated ${deactivated}/${handsetProducts.length}...`);
          }
        }
      } catch (err) {
        failedProducts.push({
          name: product.name,
          reason: err.message || 'Unknown error'
        });
        failed++;
      }
    }

    if (failedProducts.length > 0) {
      console.log('\n⚠️  Products that could not be deactivated:\n');
      failedProducts.forEach((p, i) => {
        console.log(`${i + 1}. ${p.name}`);
        console.log(`   Reason: ${p.reason}\n`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Deactivation Summary');
    console.log('='.repeat(60));
    console.log(`Total MTN products: ${allProducts.length}`);
    console.log(`SIM-Only kept active: ${simOnlyProducts.length}`);
    console.log(`Handset products deactivated: ${deactivated}`);
    console.log(`Failed updates: ${failed}`);
    console.log('='.repeat(60));
    console.log('\n✅ Deactivated products are hidden from admin and frontend');
    console.log('   but remain in database for historical quotes/orders.');

    return {
      simOnly: simOnlyProducts.length,
      handsets: handsetProducts.length,
      deactivated: deactivated,
      failed: failed
    };

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    throw error;
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const confirm = args.includes('--confirm');
  const dryRun = !confirm;

  deactivateHandsetDeals({ dryRun })
    .then(() => {
      console.log(dryRun ? '\n✅ Preview completed!' : '\n✅ Operation completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error(dryRun ? '\n❌ Preview failed:' : '\n❌ Operation failed:', error.message);
      process.exit(1);
    });
}

module.exports = { deactivateHandsetDeals };
