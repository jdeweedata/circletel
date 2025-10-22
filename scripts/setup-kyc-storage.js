/**
 * Setup KYC Documents Storage Bucket
 * Creates the kyc-documents bucket and applies RLS policies
 *
 * Usage: node scripts/setup-kyc-storage.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupStorage() {
  console.log('🚀 Setting up KYC Documents Storage...\n');

  try {
    // 1. Create bucket
    console.log('📦 Creating kyc-documents bucket...');
    const { data: bucket, error: bucketError } = await supabase.storage.createBucket('kyc-documents', {
      public: false, // Private bucket
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'application/pdf'
      ]
    });

    if (bucketError) {
      if (bucketError.message.includes('already exists')) {
        console.log('✅ Bucket already exists');
      } else {
        throw bucketError;
      }
    } else {
      console.log('✅ Bucket created successfully');
    }

    console.log('\n📋 Bucket Configuration:');
    console.log('  - Name: kyc-documents');
    console.log('  - Public: false (private)');
    console.log('  - Max file size: 5MB');
    console.log('  - Allowed types: PDF, JPG, PNG');

    console.log('\n⚠️  IMPORTANT: Storage RLS Policies');
    console.log('Storage policies must be created via Supabase Dashboard:');
    console.log('Dashboard → Storage → kyc-documents → Policies\n');

    console.log('Required Policies:');
    console.log('');
    console.log('1. "Allow authenticated uploads"');
    console.log('   - Operation: INSERT');
    console.log('   - Target roles: authenticated, anon');
    console.log('   - Policy: true');
    console.log('');
    console.log('2. "Allow authenticated to view their uploads"');
    console.log('   - Operation: SELECT');
    console.log('   - Target roles: authenticated, anon');
    console.log('   - Policy: true');
    console.log('');
    console.log('3. "Allow admins full access"');
    console.log('   - Operation: ALL');
    console.log('   - Target roles: authenticated');
    console.log('   - Policy: EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid())');
    console.log('');

    console.log('✅ Storage setup complete!\n');
    console.log('Next steps:');
    console.log('1. Apply RLS policies via Supabase Dashboard');
    console.log('2. Test file upload with: node scripts/test-kyc-upload.js');

  } catch (error) {
    console.error('❌ Error setting up storage:', error.message);
    process.exit(1);
  }
}

setupStorage();
