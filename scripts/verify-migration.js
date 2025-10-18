// Verify dynamic pricing migration
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyMigration() {
  try {
    console.log('🔍 Verifying dynamic pricing migration...\n');

    const tables = [
      'pricing_rules',
      'product_pricing_history',
      'product_pricing_rule_applications', 
      'live_pricing_cache',
      'pricing_notifications'
    ];

    let allTablesExist = true;

    for (const tableName of tables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('count')
          .limit(1);

        if (error) {
          console.log(`❌ ${tableName}: ${error.message}`);
          allTablesExist = false;
        } else {
          console.log(`✅ ${tableName}: Table exists`);
          
          // Get record count for existing tables
          const { count } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });
            
          console.log(`   Records: ${count || 0}`);
        }
      } catch (e) {
        console.log(`❌ ${tableName}: Does not exist`);
        allTablesExist = false;
      }
    }

    if (allTablesExist) {
      console.log('\n🎉 All dynamic pricing tables exist!');
      
      // Check if default rules exist
      const { data: rules, error: rulesError } = await supabase
        .from('pricing_rules')
        .select('rule_name, rule_type, price_adjustment_value')
        .eq('created_by', 'system');

      if (!rulesError && rules) {
        console.log('\n📋 Default pricing rules:');
        rules.forEach((rule, index) => {
          console.log(`   ${index + 1}. ${rule.rule_name} (${rule.rule_type}): ${rule.price_adjustment_value}%`);
        });
      }

      console.log('\n✅ Migration verification successful!');
      console.log('🚀 Dynamic pricing system is ready for use.');
      
    } else {
      console.log('\n❌ Migration incomplete. Please run MANUAL_MIGRATION.sql in Supabase dashboard.');
      console.log('📁 File location: C:\\Projects\\circletel-nextjs\\MANUAL_MIGRATION.sql');
    }

  } catch (error) {
    console.error('💥 Verification failed:', error);
  }
}

verifyMigration();
