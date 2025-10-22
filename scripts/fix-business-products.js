/**
 * Fix Business Product Customer Types
 *
 * Issue: Several products have incorrect customer_type values
 * - SkyFibre SME Enterprise: marked as 'consumer' but should be 'business'
 * - Wireless Connect Business 100Mbps: marked as 'consumer' but should be 'business'
 * - Duplicate SkyFibre consumer products with uncapped_wireless service_type should be disabled
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixBusinessProducts() {
  console.log('🔧 Fixing business product customer_type values...\n');

  // Fix 1: SkyFibre SME Enterprise
  console.log('1. Fixing SkyFibre SME Enterprise...');
  const { data: smeEnterprise, error: error1 } = await supabase
    .from('service_packages')
    .update({ customer_type: 'business' })
    .eq('name', 'SkyFibre SME Enterprise')
    .eq('service_type', 'SkyFibre')
    .select();

  if (error1) {
    console.error('   ❌ Error:', error1.message);
  } else {
    console.log(`   ✅ Updated ${smeEnterprise?.length || 0} product(s)`);
  }

  // Fix 2: Wireless Connect Business 100Mbps
  console.log('\n2. Fixing Wireless Connect Business 100Mbps...');
  const { data: wirelessBusiness, error: error2 } = await supabase
    .from('service_packages')
    .update({ customer_type: 'business' })
    .eq('name', 'Wireless Connect Business 100Mbps')
    .eq('service_type', 'uncapped_wireless')
    .select();

  if (error2) {
    console.error('   ❌ Error:', error2.message);
  } else {
    console.log(`   ✅ Updated ${wirelessBusiness?.length || 0} product(s)`);
  }

  // Fix 3: Disable duplicate SkyFibre consumer products with uncapped_wireless service_type
  console.log('\n3. Disabling duplicate SkyFibre consumer wireless products...');
  const duplicateNames = ['SkyFibre Starter', 'SkyFibre Plus', 'SkyFibre Pro'];

  const { data: disabled, error: error3 } = await supabase
    .from('service_packages')
    .update({ active: false })
    .eq('service_type', 'uncapped_wireless')
    .eq('customer_type', 'consumer')
    .in('name', duplicateNames)
    .select();

  if (error3) {
    console.error('   ❌ Error:', error3.message);
  } else {
    console.log(`   ✅ Disabled ${disabled?.length || 0} duplicate product(s)`);
  }

  // Verify the changes
  console.log('\n📊 Verification:\n');

  // Check business products
  const { data: businessProducts } = await supabase
    .from('service_packages')
    .select('name, service_type, customer_type, active')
    .eq('customer_type', 'business')
    .eq('active', true)
    .order('name');

  console.log('Business products (active):');
  businessProducts?.forEach(p => {
    console.log(`   - ${p.name} (${p.service_type})`);
  });

  console.log(`\n   Total: ${businessProducts?.length || 0} business products`);

  // Check SkyFibre products
  const { data: skyFibreProducts } = await supabase
    .from('service_packages')
    .select('name, service_type, customer_type, active')
    .like('name', '%SkyFibre%')
    .eq('active', true)
    .order('customer_type, name');

  console.log('\nSkyFibre products (active):');
  skyFibreProducts?.forEach(p => {
    console.log(`   - ${p.name} (${p.service_type}, ${p.customer_type})`);
  });

  console.log('\n✅ Product fixes completed!');
}

fixBusinessProducts().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
