/**
 * Update MTN Business Package Pricing
 *
 * Increases all MTN business package prices by 10% (rounded to nearest rand)
 * to differentiate business vs consumer pricing.
 *
 * Strategy: Business packages get 10% premium for enhanced support and features
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Pricing adjustments: Current price -> New price (10% increase, rounded)
const priceUpdates = {
  // 5G Uncapped
  449: 494,   // 35Mbps
  649: 714,   // 60Mbps
  949: 1044,  // Best Effort

  // LTE Uncapped
  299: 329,   // 5Mbps
  399: 439,   // 10Mbps
  599: 659,   // 20Mbps (also Premium 10Mbps, 1TB capped)
  699: 769,   // Premium 20Mbps

  // LTE Broadband Capped
  85: 94,     // 10GB
  109: 120,   // 15GB
  179: 197,   // 30GB
  269: 296,   // 60GB
  289: 318,   // 60GB+30GB Bonus
  369: 406,   // 110GB
  329: 362,   // 170GB
  519: 571,   // 230GB
  619: 681,   // 230GB+150GB
  649: 714    // 380GB (note: same as 60Mbps 5G)
};

async function updateBusinessPricing() {
  console.log('=== MTN Business Package Pricing Update ===\n');
  console.log('Strategy: +10% premium for business packages (rounded)\n');

  try {
    // Get all MTN business packages
    const { data: packages, error: fetchError } = await supabase
      .from('service_packages')
      .select('id, name, price, service_type, customer_type')
      .ilike('name', '%MTN%')
      .eq('customer_type', 'business');

    if (fetchError) throw fetchError;

    console.log(`📦 Found ${packages.length} MTN business packages\n`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const pkg of packages) {
      const oldPrice = pkg.price;
      const newPrice = priceUpdates[oldPrice];

      if (!newPrice) {
        console.log(`⚠️  SKIP: ${pkg.name} (R${oldPrice}) - No price mapping found`);
        skippedCount++;
        continue;
      }

      if (oldPrice === newPrice) {
        console.log(`➡️  SKIP: ${pkg.name} (R${oldPrice}) - Already at target price`);
        skippedCount++;
        continue;
      }

      try {
        const { error: updateError } = await supabase
          .from('service_packages')
          .update({ price: newPrice })
          .eq('id', pkg.id);

        if (updateError) throw updateError;

        const increase = newPrice - oldPrice;
        const percentage = ((increase / oldPrice) * 100).toFixed(1);

        console.log(`✅ UPDATED: ${pkg.name}`);
        console.log(`   R${oldPrice} → R${newPrice} (+R${increase}, +${percentage}%)`);
        updatedCount++;
      } catch (error) {
        console.error(`❌ ERROR: ${pkg.name}`);
        console.error(`   ${error.message}`);
        errorCount++;
      }
    }

    console.log('\n=== Update Summary ===');
    console.log(`✅ Successfully updated: ${updatedCount}`);
    console.log(`⚠️  Skipped: ${skippedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📊 Total processed: ${packages.length}`);

    if (updatedCount > 0) {
      console.log('\n💼 Business packages now have 10% premium pricing');
      console.log('Ready to create consumer packages at original pricing');
    }

  } catch (error) {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  }
}

// Run the update
updateBusinessPricing()
  .then(() => {
    console.log('\n✨ Pricing update completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Update failed:', error);
    process.exit(1);
  });
