/**
 * Script to disable HomeFibreConnect (MTN Fibre) products
 * Reason: Not market competitive at this stage
 * Date: 2025-10-24
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function disableHomeFibreProducts() {
  console.log('🔷 CircleTel - Disable HomeFibreConnect Products');
  console.log('='.repeat(60));
  console.log('Reason: MTN Fibre packages not market competitive\n');

  try {
    // Step 1: Query HomeFibreConnect products
    console.log('Step 1: Fetching HomeFibreConnect products...');
    const { data: products, error: fetchError } = await supabase
      .from('service_packages')
      .select('id, name, service_type, price, promotion_price, active')
      .eq('service_type', 'HomeFibreConnect')
      .eq('active', true);

    if (fetchError) {
      console.error('❌ Error fetching products:', fetchError.message);
      process.exit(1);
    }

    if (!products || products.length === 0) {
      console.log('ℹ️  No active HomeFibreConnect products found');
      console.log('All HomeFibreConnect products are already disabled\n');
      return;
    }

    console.log(`\nFound ${products.length} active HomeFibreConnect products:\n`);
    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   ID: ${product.id}`);
      console.log(`   Price: R${product.price} (Promo: R${product.promotion_price || 'N/A'})`);
      console.log(`   Status: ${product.active ? 'ACTIVE' : 'INACTIVE'}\n`);
    });

    // Step 2: Disable products
    console.log('Step 2: Disabling products in database...');
    const productIds = products.map(p => p.id);

    const { data: updateData, error: updateError } = await supabase
      .from('service_packages')
      .update({
        active: false,
        updated_at: new Date().toISOString()
      })
      .in('id', productIds)
      .select('id, name, active');

    if (updateError) {
      console.error('❌ Error updating products:', updateError.message);
      process.exit(1);
    }

    console.log('✅ Successfully disabled products:');
    updateData.forEach((product) => {
      console.log(`   - ${product.name} (${product.id})`);
      console.log(`     Status: ${product.active ? 'ACTIVE' : 'DISABLED'}`);
    });

    // Step 3: Verify products are disabled
    console.log('\nStep 3: Verifying products are disabled...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('service_packages')
      .select('id, name, active')
      .eq('service_type', 'HomeFibreConnect');

    if (verifyError) {
      console.error('❌ Error verifying products:', verifyError.message);
      process.exit(1);
    }

    const activeCount = verifyData.filter(p => p.active).length;
    const inactiveCount = verifyData.filter(p => !p.active).length;

    console.log(`\nVerification Results:`);
    console.log(`   Total HomeFibreConnect products: ${verifyData.length}`);
    console.log(`   ✅ Disabled: ${inactiveCount}`);
    console.log(`   ⚠️  Still Active: ${activeCount}`);

    if (activeCount > 0) {
      console.log('\n⚠️  Warning: Some HomeFibreConnect products are still active:');
      verifyData.filter(p => p.active).forEach(p => {
        console.log(`   - ${p.name} (${p.id})`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ HomeFibreConnect products disabled successfully');
    console.log('These products will no longer appear on the frontend');
    console.log('Admins can re-enable them via /admin/products page\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Run the script
disableHomeFibreProducts().then(() => {
  console.log('Script completed');
  process.exit(0);
});
