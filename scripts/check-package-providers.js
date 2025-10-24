const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkPackageProviders() {
  console.log('\n=== Checking Package Provider Assignments ===\n');

  try {
    // Get all active packages
    const { data: packages, error } = await supabase
      .from('service_packages')
      .select('id, name, service_type, product_category, compatible_providers, active')
      .eq('active', true)
      .order('name');

    if (error) {
      console.error('Error:', error);
      process.exit(1);
    }

    console.log(`Total active packages: ${packages.length}\n`);

    const withProviders = packages.filter(p => p.compatible_providers && p.compatible_providers.length > 0);
    const withoutProviders = packages.filter(p => !p.compatible_providers || p.compatible_providers.length === 0);

    console.log('Packages WITH provider assignments:');
    console.log('=====================================');
    if (withProviders.length > 0) {
      withProviders.forEach(p => {
        console.log(`  • ${p.name} (${p.product_category})`);
        console.log(`    Providers: ${p.compatible_providers.join(', ')}`);
      });
    } else {
      console.log('  None found');
    }
    console.log('');

    console.log('Packages WITHOUT provider assignments:');
    console.log('=======================================');
    if (withoutProviders.length > 0) {
      withoutProviders.slice(0, 10).forEach(p => {
        console.log(`  • ${p.name} (${p.product_category || p.service_type})`);
      });
      if (withoutProviders.length > 10) {
        console.log(`  ... and ${withoutProviders.length - 10} more`);
      }
    } else {
      console.log('  None found');
    }
    console.log('');

    console.log('Summary:');
    console.log(`  ✓ With providers: ${withProviders.length}`);
    console.log(`  ⚠️  Without providers: ${withoutProviders.length}`);
    console.log(`  📊 Coverage: ${Math.round(withProviders.length / packages.length * 100)}%\n`);

    if (withProviders.length === 0) {
      console.log('⚠️  ACTION REQUIRED: Products need compatible_providers assigned');
      console.log('   Products must be linked to providers (mtn, dfa, etc.) to show logos\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('Check failed:', error);
    process.exit(1);
  }
}

checkPackageProviders();
