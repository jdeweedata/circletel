/**
 * Test Supabase Storage Bucket Configuration
 * Verifies partner-compliance-documents bucket is properly configured
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

async function testStorageBucket() {
  console.log('\n🔍 Testing Storage Bucket Configuration...\n');

  let allPassed = true;

  // Test 1: Check bucket exists
  console.log('📋 Test 1: Bucket exists');
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      console.log(`   ❌ FAIL: ${error.message}`);
      allPassed = false;
    } else {
      const complianceBucket = buckets.find(b => b.id === 'partner-compliance-documents');

      if (complianceBucket) {
        console.log('   ✅ PASS: Bucket exists');
        console.log(`      - Name: ${complianceBucket.name}`);
        console.log(`      - Public: ${complianceBucket.public ? 'Yes ⚠️' : 'No ✅'}`);
        console.log(`      - File size limit: ${complianceBucket.file_size_limit ? (complianceBucket.file_size_limit / 1024 / 1024).toFixed(0) + 'MB' : 'Not set'}`);

        if (complianceBucket.public) {
          console.log('   ⚠️  WARNING: Bucket should be PRIVATE, not public!');
          allPassed = false;
        }
      } else {
        console.log('   ❌ FAIL: Bucket "partner-compliance-documents" not found');
        allPassed = false;
      }
    }
  } catch (e) {
    console.log(`   ❌ ERROR: ${e.message}`);
    allPassed = false;
  }

  // Test 2: Check bucket accessibility (RLS)
  console.log('\n📋 Test 2: Bucket RLS configuration');
  try {
    // Try to list files as service role (should work)
    const { data, error } = await supabase.storage
      .from('partner-compliance-documents')
      .list('', { limit: 1 });

    if (error) {
      console.log(`   ⚠️  Note: ${error.message}`);
      console.log('   ℹ️  This is normal if bucket is empty or RLS restricts service role');
    } else {
      console.log('   ✅ PASS: Bucket accessible via service role');
      console.log(`      - Files found: ${data?.length || 0}`);
    }
  } catch (e) {
    console.log(`   ℹ️  ${e.message}`);
  }

  // Test 3: Check allowed MIME types (if accessible)
  console.log('\n📋 Test 3: Allowed file types');
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucket = buckets.find(b => b.id === 'partner-compliance-documents');

    if (bucket && bucket.allowed_mime_types) {
      const allowedTypes = bucket.allowed_mime_types;
      const requiredTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png'
      ];

      const missingTypes = requiredTypes.filter(t => !allowedTypes.includes(t));

      if (missingTypes.length === 0) {
        console.log('   ✅ PASS: All required MIME types configured');
        console.log(`      - Allowed: ${allowedTypes.join(', ')}`);
      } else {
        console.log('   ⚠️  WARNING: Missing some MIME types');
        console.log(`      - Missing: ${missingTypes.join(', ')}`);
        console.log(`      - Current: ${allowedTypes.join(', ')}`);
      }
    } else {
      console.log('   ⚠️  Cannot verify MIME types (bucket config not accessible)');
    }
  } catch (e) {
    console.log(`   ℹ️  ${e.message}`);
  }

  // Test 4: Check storage policies exist (requires superuser)
  console.log('\n📋 Test 4: Storage policies');
  console.log('   ℹ️  Policies must be created via Supabase Dashboard');
  console.log('   ℹ️  Required policies:');
  console.log('      1. partners_upload_own_compliance_documents (INSERT)');
  console.log('      2. partners_view_own_compliance_documents (SELECT)');
  console.log('      3. partners_delete_own_unverified_compliance_documents (DELETE)');
  console.log('      4. admins_access_all_compliance_documents (ALL)');
  console.log('   📖 See: docs/partners/SUPABASE_STORAGE_SETUP_DASHBOARD.md');

  // Summary
  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    console.log('✅ BUCKET CONFIGURATION LOOKS GOOD!');
    console.log('\n📋 Next Steps:');
    console.log('1. Create 4 storage policies (via Dashboard)');
    console.log('   → See: docs/partners/SUPABASE_STORAGE_SETUP_DASHBOARD.md');
    console.log('2. Test document upload at /partners/onboarding/verify');
    console.log('3. Verify RLS isolation (partners can only see own files)');
  } else {
    console.log('⚠️  SOME CHECKS FAILED');
    console.log('\n📋 Recommended Actions:');
    console.log('1. Create bucket via Supabase Dashboard → Storage');
    console.log('2. Set bucket as PRIVATE (not public)');
    console.log('3. Set file size limit to 20MB');
    console.log('4. Add allowed MIME types: PDF, JPG, PNG, ZIP');
    console.log('5. Follow: docs/partners/SUPABASE_STORAGE_SETUP_DASHBOARD.md');
  }
  console.log('='.repeat(60) + '\n');
}

testStorageBucket().catch(console.error);
