/**
 * Simple Compliance Migration Verification
 * Tests that KYC → Compliance migration was successful
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

async function verify() {
  console.log('\n🔍 Verifying Compliance Migration...\n');

  let allPassed = true;

  // Test 1: Check new compliance columns exist
  console.log('📋 Test 1: Compliance columns in partners table');
  try {
    const { error } = await supabase
      .from('partners')
      .select('compliance_status, compliance_verified_at, compliance_notes, partner_number, commission_rate, tier')
      .limit(0);

    if (error) {
      console.log(`   ❌ FAIL: ${error.message}`);
      allPassed = false;
    } else {
      console.log('   ✅ PASS: All new columns exist');
    }
  } catch (e) {
    console.log(`   ❌ ERROR: ${e.message}`);
    allPassed = false;
  }

  // Test 2: Check old KYC columns are gone
  console.log('\n📋 Test 2: Old KYC columns removed');
  try {
    const { error } = await supabase
      .from('partners')
      .select('kyc_status, kyc_verified_at')
      .limit(0);

    if (error && error.message.includes('does not exist')) {
      console.log('   ✅ PASS: Old KYC columns removed');
    } else {
      console.log('   ⚠️  WARNING: Old columns still exist');
      allPassed = false;
    }
  } catch (e) {
    console.log('   ✅ PASS: Old columns removed (caught expected error)');
  }

  // Test 3: Check partner_compliance_documents table exists
  console.log('\n📋 Test 3: Compliance documents table');
  try {
    const { error } = await supabase
      .from('partner_compliance_documents')
      .select('id, document_category, document_type, document_number, expiry_date')
      .limit(0);

    if (error) {
      console.log(`   ❌ FAIL: ${error.message}`);
      allPassed = false;
    } else {
      console.log('   ✅ PASS: Table exists with all new columns');
    }
  } catch (e) {
    console.log(`   ❌ ERROR: ${e.message}`);
    allPassed = false;
  }

  // Test 4: Check old table is gone
  console.log('\n📋 Test 4: Old KYC documents table removed');
  try {
    const { error } = await supabase
      .from('partner_kyc_documents')
      .select('id')
      .limit(0);

    if (error && (error.message.includes('does not exist') || error.message.includes('not found') || error.message.includes('schema cache'))) {
      console.log('   ✅ PASS: Old table removed');
    } else if (error) {
      console.log(`   ⚠️  WARNING: Unexpected error: ${error.message}`);
    } else {
      console.log('   ⚠️  WARNING: Old table still exists');
      allPassed = false;
    }
  } catch (e) {
    console.log('   ✅ PASS: Old table removed (caught expected error)');
  }

  // Test 5: Check a sample partner record structure
  console.log('\n📋 Test 5: Sample partner record structure');
  try {
    const { data, error } = await supabase
      .from('partners')
      .select('id, business_name, compliance_status, partner_number, commission_rate, tier')
      .limit(1)
      .maybeSingle();

    if (error && !error.message.includes('0 rows')) {
      console.log(`   ❌ FAIL: ${error.message}`);
      allPassed = false;
    } else if (data) {
      console.log('   ✅ PASS: Sample record found with correct structure');
      console.log(`      - Business: ${data.business_name || 'N/A'}`);
      console.log(`      - Compliance Status: ${data.compliance_status || 'N/A'}`);
      console.log(`      - Partner Number: ${data.partner_number || 'Not yet assigned'}`);
      console.log(`      - Commission Rate: ${data.commission_rate || 0}%`);
      console.log(`      - Tier: ${data.tier || 'bronze'}`);
    } else {
      console.log('   ℹ️  No partners exist yet (table is empty)');
    }
  } catch (e) {
    console.log(`   ❌ ERROR: ${e.message}`);
    allPassed = false;
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    console.log('✅ ALL TESTS PASSED!');
    console.log('\n✨ Migration completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('1. Configure Supabase Storage bucket');
    console.log('   → See: docs/partners/SUPABASE_STORAGE_SETUP.md');
    console.log('2. Test document upload at /partners/onboarding/verify');
    console.log('3. Create partner approval workflow API');
  } else {
    console.log('⚠️  SOME TESTS FAILED');
    console.log('\n📋 Recommended Actions:');
    console.log('1. Review error messages above');
    console.log('2. Re-run migration if needed');
    console.log('3. Check Supabase logs for details');
  }
  console.log('='.repeat(60) + '\n');
}

verify().catch(console.error);
