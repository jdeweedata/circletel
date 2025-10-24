const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyProviderLogos() {
  console.log('\n=== Verifying Provider Logo Migration ===\n');

  try {
    // Check providers with logos
    const { data: providers, error } = await supabase
      .from('fttb_network_providers')
      .select('provider_code, display_name, logo_url, logo_format, logo_aspect_ratio, active')
      .eq('active', true)
      .order('priority');

    if (error) {
      console.error('Error:', error);
      process.exit(1);
    }

    console.log('Active Providers with Logo Data:');
    console.log('================================\n');

    providers.forEach(p => {
      console.log(`Provider: ${p.display_name}`);
      console.log(`  Code: ${p.provider_code}`);
      console.log(`  Logo URL: ${p.logo_url || 'NOT SET'}`);
      console.log(`  Format: ${p.logo_format || 'NOT SET'}`);
      console.log(`  Aspect Ratio: ${p.logo_aspect_ratio || 'NOT SET'}`);
      console.log('');
    });

    const withLogos = providers.filter(p => p.logo_url).length;
    const total = providers.length;

    console.log('Summary:');
    console.log(`  ✓ Providers with logos: ${withLogos}/${total}`);
    console.log(`  ✓ Coverage: ${Math.round((withLogos/total) * 100)}%`);

    if (withLogos > 0) {
      console.log('\n✅ Migration SUCCESS - Provider logos are configured!\n');

      // Check if view exists
      const { data: viewData, error: viewError } = await supabase
        .from('v_providers_with_logos')
        .select('*')
        .limit(5);

      if (!viewError && viewData) {
        console.log(`✓ View 'v_providers_with_logos' exists (${viewData.length} rows)\n`);
      }
    } else {
      console.log('\n⚠️  Warning: No providers have logos set\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('Verification failed:', error);
    process.exit(1);
  }
}

verifyProviderLogos();
