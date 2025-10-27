/**
 * Check status of both compliance document tables
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTables() {
  console.log('\n🔍 Checking Document Tables Status...\n');

  // Check old table
  console.log('📋 Checking: partner_kyc_documents');
  const { data: oldData, error: oldError } = await supabase
    .from('partner_kyc_documents')
    .select('*')
    .limit(5);

  if (oldError) {
    console.log(`   ✅ Table does NOT exist (${oldError.message})`);
  } else {
    console.log(`   ⚠️  Table EXISTS with ${oldData?.length || 0} sample records`);
    if (oldData && oldData.length > 0) {
      console.log('   Sample record:', oldData[0]);
    }
  }

  // Check new table
  console.log('\n📋 Checking: partner_compliance_documents');
  const { data: newData, error: newError } = await supabase
    .from('partner_compliance_documents')
    .select('*')
    .limit(5);

  if (newError) {
    console.log(`   ❌ Table does NOT exist (${newError.message})`);
  } else {
    console.log(`   ✅ Table EXISTS with ${newData?.length || 0} sample records`);
    if (newData && newData.length > 0) {
      console.log('   Sample record:', newData[0]);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('Analysis:');

  if (!oldError && !newError) {
    console.log('⚠️  BOTH tables exist - migration did not rename the table');
    console.log('\nThis means:');
    console.log('- The IF EXISTS check in the migration found no table to rename');
    console.log('- The table might have been created with the new name already');
    console.log('- Need to manually drop old table if it exists');
    console.log('\nAction: Run this SQL in Supabase:');
    console.log('DROP TABLE IF EXISTS partner_kyc_documents CASCADE;');
  } else if (oldError && !newError) {
    console.log('✅ CORRECT - Only new table exists');
  } else if (!oldError && newError) {
    console.log('❌ ERROR - Only old table exists, new table missing');
  } else {
    console.log('❌ ERROR - Neither table exists');
  }
  console.log('='.repeat(60) + '\n');
}

checkTables().catch(console.error);
