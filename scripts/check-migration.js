// Check migration status
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkMigration() {
  try {
    console.log('🔍 Checking dynamic pricing tables...\n');
    
    // Check if pricing_rules exists
    try {
      const { data, error } = await supabase
        .from('pricing_rules')
        .select('count')
        .limit(1);
      
      if (error) {
        console.log('❌ pricing_rules:', error.message);
      } else {
        console.log('✅ pricing_rules table exists');
        const { count } = await supabase
          .from('pricing_rules')
          .select('*', { count: 'exact', head: true });
        console.log(`   Found ${count} pricing rules`);
      }
    } catch (e) {
      console.log('❌ pricing_rules: Does not exist');
    }

    // Check product_pricing_history
    try {
      const { error } = await supabase
        .from('product_pricing_history')
        .select('count')
        .limit(1);
      
      if (error) {
        console.log('❌ product_pricing_history:', error.message);
      } else {
        console.log('✅ product_pricing_history table exists');
      }
    } catch (e) {
      console.log('❌ product_pricing_history: Does not exist');
    }

    // Check live_pricing_cache
    try {
      const { error } = await supabase
        .from('live_pricing_cache')
        .select('count')
        .limit(1);
      
      if (error) {
        console.log('❌ live_pricing_cache:', error.message);
      } else {
        console.log('✅ live_pricing_cache table exists');
      }
    } catch (e) {
      console.log('❌ live_pricing_cache: Does not exist');
    }

    // Check pricing_notifications
    try {
      const { error } = await supabase
        .from('pricing_notifications')
        .select('count')
        .limit(1);
      
      if (error) {
        console.log('❌ pricing_notifications:', error.message);
      } else {
        console.log('✅ pricing_notifications table exists');
      }
    } catch (e) {
      console.log('❌ pricing_notifications: Does not exist');
    }

    console.log('\n🎯 Migration status check complete');
    
  } catch (error) {
    console.error('💥 Check failed:', error);
  }
}

checkMigration();
