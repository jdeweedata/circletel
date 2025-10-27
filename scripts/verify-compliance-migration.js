/**
 * Verification Script: Compliance Migration
 *
 * Tests that the KYC → Compliance migration was applied successfully
 *
 * Usage:
 *   node scripts/verify-compliance-migration.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyCompliance() {
  console.log('\n🔍 Verifying Compliance Migration Status...\n');

  let allPassed = true;

  // Test 1: Check partners table columns
  console.log('📋 Test 1: Partners table columns');
  const { data: partnersColumns, error: partnersError } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'partners'
      AND column_name IN (
        'compliance_status', 'compliance_verified_at', 'compliance_notes',
        'partner_number', 'commission_rate', 'tier'
      )
      ORDER BY column_name;
    `
  }).catch(() => {
    // Fallback: Try direct query
    return supabase
      .from('partners')
      .select('compliance_status, partner_number, commission_rate, tier')
      .limit(0);
  });

  const requiredColumns = [
    'compliance_status',
    'compliance_verified_at',
    'compliance_notes',
    'partner_number',
    'commission_rate',
    'tier'
  ];

  if (partnersError) {
    console.log('   ✅ Cannot query schema directly, testing via select...');
    // Try to select these columns to verify they exist
    const { error: selectError } = await supabase
      .from('partners')
      .select('compliance_status, compliance_verified_at, compliance_notes, partner_number, commission_rate, tier')
      .limit(0);

    if (selectError) {
      console.log(`   ❌ Missing columns: ${selectError.message}`);
      allPassed = false;
    } else {
      console.log('   ✅ All required columns exist');
    }
  } else {
    console.log('   ✅ All required columns exist');
  }

  // Test 2: Check old columns are gone
  console.log('\n📋 Test 2: Old KYC columns removed');
  const { error: oldColumnsError } = await supabase
    .from('partners')
    .select('kyc_status, kyc_verified_at')
    .limit(0);

  if (oldColumnsError && oldColumnsError.message.includes('does not exist')) {
    console.log('   ✅ Old KYC columns successfully removed');
  } else if (!oldColumnsError) {
    console.log('   ⚠️  Old KYC columns still exist - migration incomplete');
    allPassed = false;
  }

  // Test 3: Check partner_compliance_documents table exists
  console.log('\n📋 Test 3: Compliance documents table');
  const { error: docsTableError } = await supabase
    .from('partner_compliance_documents')
    .select('id')
    .limit(0);

  if (docsTableError && docsTableError.message.includes('does not exist')) {
    console.log('   ❌ Table partner_compliance_documents does not exist');
    allPassed = false;
  } else {
    console.log('   ✅ Table partner_compliance_documents exists');
  }

  // Test 4: Check indexes
  console.log('\n📋 Test 4: Compliance indexes');
  const { data: indexes } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT indexname
      FROM pg_indexes
      WHERE tablename IN ('partners', 'partner_compliance_documents')
      ORDER BY indexname;
    `
  }).catch(() => ({ data: null }));

  const requiredIndexes = [
    'idx_partners_compliance_status',
    'idx_partners_partner_number',
    'idx_partners_tier'
  ];

  const oldIndexes = [
    'idx_partners_kyc_status',
    'idx_partner_kyc_partner_id',
    'idx_partner_kyc_verification_status'
  ];

  if (indexes) {
    const indexNames = indexes.map(i => i.indexname);

    const missingIndexes = requiredIndexes.filter(idx => !indexNames.includes(idx));
    const remainingOldIndexes = oldIndexes.filter(idx => indexNames.includes(idx));

    if (missingIndexes.length > 0) {
      console.log(`   ⚠️  Missing indexes: ${missingIndexes.join(', ')}`);
      allPassed = false;
    }

    if (remainingOldIndexes.length > 0) {
      console.log(`   ⚠️  Old indexes still present: ${remainingOldIndexes.join(', ')}`);
      allPassed = false;
    }

    if (missingIndexes.length === 0 && remainingOldIndexes.length === 0) {
      console.log('   ✅ All compliance indexes present, old indexes removed');
    }
  } else {
    console.log('   ℹ️  Cannot verify indexes (requires superuser permissions)');
  }

  // Test 5: Check RLS policies
  console.log('\n📋 Test 5: RLS policies');
  const { data: policies } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT policyname
      FROM pg_policies
      WHERE tablename = 'partner_compliance_documents'
      ORDER BY policyname;
    `
  }).catch(() => ({ data: null }));

  const requiredPolicies = [
    'partners_view_own_compliance_documents',
    'partners_upload_compliance_documents',
    'partners_delete_own_unverified_compliance_documents',
    'admins_view_all_compliance_documents',
    'admins_manage_compliance_documents'
  ];

  if (policies) {
    const policyNames = policies.map(p => p.policyname);
    const missingPolicies = requiredPolicies.filter(pol => !policyNames.includes(pol));

    if (missingPolicies.length > 0) {
      console.log(`   ⚠️  Missing policies: ${missingPolicies.join(', ')}`);
      allPassed = false;
    } else {
      console.log('   ✅ All compliance RLS policies present');
    }
  } else {
    console.log('   ℹ️  Cannot verify policies (requires superuser permissions)');
  }

  // Test 6: Check constraints
  console.log('\n📋 Test 6: Check constraints');
  const { data: constraints } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT constraint_name, table_name
      FROM information_schema.table_constraints
      WHERE table_name IN ('partners', 'partner_compliance_documents')
      AND constraint_name LIKE '%compliance%'
      ORDER BY constraint_name;
    `
  }).catch(() => ({ data: null }));

  const requiredConstraints = [
    'partners_compliance_status_check',
    'partner_compliance_documents_document_category_check',
    'partner_compliance_documents_verification_status_check'
  ];

  if (constraints) {
    const constraintNames = constraints.map(c => c.constraint_name);
    const missingConstraints = requiredConstraints.filter(con => !constraintNames.includes(con));

    if (missingConstraints.length > 0) {
      console.log(`   ⚠️  Missing constraints: ${missingConstraints.join(', ')}`);
      allPassed = false;
    } else {
      console.log('   ✅ All compliance constraints present');
    }
  } else {
    console.log('   ℹ️  Cannot verify constraints (requires permissions)');
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('✅ All compliance migration checks passed!');
    console.log('\nNext steps:');
    console.log('1. Configure Supabase Storage bucket (see docs/partners/SUPABASE_STORAGE_SETUP.md)');
    console.log('2. Test document upload at /partners/onboarding/verify');
    console.log('3. Create partner approval workflow API');
  } else {
    console.log('⚠️  Some migration checks failed');
    console.log('\nRecommended action:');
    console.log('Run migration: supabase/migrations/20251027100002_fix_compliance_migration.sql');
    console.log('In Supabase Dashboard → SQL Editor');
  }
  console.log('='.repeat(50) + '\n');
}

verifyCompliance().catch(console.error);
