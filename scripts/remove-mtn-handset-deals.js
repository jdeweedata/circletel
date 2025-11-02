#!/usr/bin/env node
/**
 * Remove MTN Deals with Handsets
 * Keeps only SIM-only deals (where device is "Use Your Own")
 * Removes deals with physical devices (iPhone, Samsung, etc.)
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function removeHandsetDeals(options = {}) {
  const { dryRun = true } = options;

  console.log('\n🗑️  Remove MTN Handset Deals\n');
  console.log(`Mode: ${dryRun ? 'DRY RUN (preview only)' : '⚠️  LIVE DELETE'}\n`);

  try {
    // 1. Get all MTN products
    console.log('📊 Analyzing MTN products...\n');
    const { data: allProducts, error: allError } = await supabase
      .from('service_packages')
      .select('id, name, sku, metadata')
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

    console.log(`\n✅ SIM-Only products (will keep): ${simOnlyProducts.length}`);
    console.log(`❌ Handset products (will remove): ${handsetProducts.length}\n`);

    // 3. Show sample handset products to be removed
    console.log('📱 Sample Handset Products to Remove:\n');
    handsetProducts.slice(0, 10).forEach((product, i) => {
      const device = product.metadata?.oemDevice || 'Unknown';
      console.log(`${i + 1}. ${product.name}`);
      console.log(`   Device: ${device}`);
      console.log(`   SKU: ${product.sku}\n`);
    });

    if (handsetProducts.length > 10) {
      console.log(`   ... and ${handsetProducts.length - 10} more\n`);
    }

    // 4. Show sample SIM-only products to keep
    console.log('📶 Sample SIM-Only Products (will keep):\n');
    simOnlyProducts.slice(0, 5).forEach((product, i) => {
      console.log(`${i + 1}. ${product.name}`);
      console.log(`   SKU: ${product.sku}\n`);
    });

    if (simOnlyProducts.length > 5) {
      console.log(`   ... and ${simOnlyProducts.length - 5} more\n`);
    }

    if (dryRun) {
      console.log('🚫 DRY RUN - No changes made to database');
      console.log('\nTo actually remove these products, run:');
      console.log('node scripts/remove-mtn-handset-deals.js --confirm\n');
      return {
        simOnly: simOnlyProducts.length,
        handsets: handsetProducts.length,
        removed: 0
      };
    }

    // 5. Confirm deletion
    console.log('⚠️  WARNING: About to delete products!\n');
    console.log(`This will permanently delete ${handsetProducts.length} products with handsets.`);
    console.log(`${simOnlyProducts.length} SIM-only products will be kept.\n`);

    // 6. Delete related audit logs first
    console.log('🗑️  Cleaning up audit logs...\n');
    const productIds = handsetProducts.map(p => p.id).filter(id => id);
    
    if (productIds.length > 0) {
      const { error: auditError } = await supabase
        .from('service_packages_audit_logs')
        .delete()
        .in('package_id', productIds);
      
      if (auditError) {
        console.log(`⚠️  Warning: Could not delete audit logs: ${auditError.message}`);
      } else {
        console.log(`   ✅ Audit logs cleaned up\n`);
      }
    }

    // 7. Delete handset products
    console.log('🗑️  Deleting handset products...\n');
    let deleted = 0;
    let failed = 0;
    const failedProducts = [];

    for (const product of handsetProducts) {
      try {
        const { error } = await supabase
          .from('service_packages')
          .delete()
          .eq('id', product.id);

        if (error) {
          // Check if it's a foreign key constraint error
          if (error.message.includes('violates foreign key constraint')) {
            failedProducts.push({
              name: product.name,
              reason: 'Referenced in business quotes or orders'
            });
          } else {
            failedProducts.push({
              name: product.name,
              reason: error.message
            });
          }
          failed++;
        } else {
          deleted++;
          if (deleted % 100 === 0) {
            console.log(`   Deleted ${deleted}/${handsetProducts.length}...`);
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
      console.log('\n⚠️  Products that could not be deleted (referenced in quotes/orders):\n');
      failedProducts.slice(0, 10).forEach((p, i) => {
        console.log(`${i + 1}. ${p.name}`);
        console.log(`   Reason: ${p.reason}\n`);
      });
      if (failedProducts.length > 10) {
        console.log(`   ... and ${failedProducts.length - 10} more\n`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Deletion Summary');
    console.log('='.repeat(60));
    console.log(`Total MTN products: ${allProducts.length}`);
    console.log(`SIM-Only kept: ${simOnlyProducts.length}`);
    console.log(`Handset products deleted: ${deleted}`);
    console.log(`Failed deletions: ${failed}`);
    console.log('='.repeat(60));

    return {
      simOnly: simOnlyProducts.length,
      handsets: handsetProducts.length,
      removed: deleted,
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

  if (!dryRun) {
    console.log('\n⚠️  ⚠️  ⚠️  WARNING ⚠️  ⚠️  ⚠️');
    console.log('You are about to permanently delete MTN products with handsets!');
    console.log('Press Ctrl+C now to cancel, or wait 5 seconds to continue...\n');

    setTimeout(() => {
      removeHandsetDeals({ dryRun })
        .then(() => {
          console.log('\n✅ Operation completed!');
          process.exit(0);
        })
        .catch(error => {
          console.error('\n❌ Operation failed:', error.message);
          process.exit(1);
        });
    }, 5000);
  } else {
    removeHandsetDeals({ dryRun })
      .then(() => {
        console.log('\n✅ Preview completed!');
        process.exit(0);
      })
      .catch(error => {
        console.error('\n❌ Preview failed:', error.message);
        process.exit(1);
      });
  }
}

module.exports = { removeHandsetDeals };
