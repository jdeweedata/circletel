const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function assignPackageProviders() {
  console.log('\n=== Assigning Providers to Packages ===\n');

  try {
    // Get all active packages without providers
    const { data: packages, error } = await supabase
      .from('service_packages')
      .select('id, name, service_type, product_category, compatible_providers')
      .eq('active', true)
      .or('compatible_providers.is.null,compatible_providers.eq.{}');

    if (error) {
      console.error('Error fetching packages:', error);
      process.exit(1);
    }

    console.log(`Found ${packages.length} packages without provider assignments\n`);

    const updates = [];

    packages.forEach(pkg => {
      let providers = [];

      // Assign providers based on naming patterns and service types
      const name = pkg.name.toLowerCase();
      const serviceType = (pkg.service_type || '').toLowerCase();
      const productCategory = (pkg.product_category || '').toLowerCase();

      // MTN-branded products
      if (name.includes('mtn') || serviceType.includes('mtn')) {
        providers.push('mtn');
      }
      // HomeFibre products (MTN network)
      else if (name.includes('homefibre') || serviceType.includes('homefibre')) {
        providers.push('mtn');
      }
      // BizFibre products (DFA network)
      else if (name.includes('bizfibre') || serviceType.includes('bizfibre')) {
        providers.push('dfa');
      }
      // SkyFibre products (MTN wireless)
      else if (name.includes('skyfibre') || serviceType.includes('skyfibre')) {
        providers.push('mtn');
      }
      // Wireless/LTE products (MTN)
      else if (name.includes('wireless') || name.includes('lte') ||
               serviceType.includes('wireless') || serviceType.includes('lte')) {
        providers.push('mtn');
      }
      // Generic fibre products - assign to both MTN and DFA
      else if (productCategory.includes('fibre')) {
        providers.push('mtn', 'dfa');
      }
      // Default: assign to MTN
      else {
        providers.push('mtn');
      }

      updates.push({
        id: pkg.id,
        name: pkg.name,
        providers: providers
      });
    });

    console.log('Proposed Updates:');
    console.log('=================\n');

    updates.forEach(u => {
      console.log(`${u.name}`);
      console.log(`  → Assigning providers: ${u.providers.join(', ')}\n`);
    });

    console.log(`\nTotal packages to update: ${updates.length}\n`);
    console.log('Applying updates...\n');

    // Apply updates in batches
    let successCount = 0;
    let errorCount = 0;

    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('service_packages')
        .update({ compatible_providers: update.providers })
        .eq('id', update.id);

      if (updateError) {
        console.error(`  ✗ Failed: ${update.name}`, updateError.message);
        errorCount++;
      } else {
        console.log(`  ✓ Updated: ${update.name}`);
        successCount++;
      }
    }

    console.log('\n=== Update Complete ===\n');
    console.log(`  ✓ Success: ${successCount}`);
    console.log(`  ✗ Errors: ${errorCount}`);
    console.log(`  📊 Total: ${updates.length}\n`);

    if (successCount > 0) {
      console.log('✅ Provider assignments complete! Packages will now show logos.\n');
    }

    process.exit(errorCount > 0 ? 1 : 0);
  } catch (error) {
    console.error('Assignment failed:', error);
    process.exit(1);
  }
}

assignPackageProviders();
