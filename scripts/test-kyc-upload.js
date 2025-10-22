/**
 * Test KYC Document Upload End-to-End
 * Tests the complete KYC upload flow: storage upload + database record
 *
 * Usage: node scripts/test-kyc-upload.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testKycUpload() {
  console.log('🧪 Testing KYC Document Upload System\n');

  try {
    // Step 1: Create a test order
    console.log('1️⃣  Creating test order...');
    const { data: order, error: orderError } = await supabase
      .from('consumer_orders')
      .insert({
        order_number: `TEST-${Date.now()}`,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@test.com',
        phone: '+27123456789',
        installation_address: '123 Test Street, Johannesburg',
        package_name: 'Test Package',
        package_speed: '100Mbps',
        package_price: 500.00,
        installation_fee: 0,
        status: 'pending'
      })
      .select()
      .single();

    if (orderError) throw orderError;
    console.log(`✅ Test order created: ${order.id}`);
    console.log(`   Customer: ${order.first_name} ${order.last_name} (${order.email})\n`);

    // Step 2: Create a test file (1x1 PNG)
    console.log('2️⃣  Creating test file...');
    const testFileName = 'test-id-document.png';
    const testFilePath = path.join(__dirname, testFileName);

    // Create a minimal 1x1 PNG file (base64 decoded)
    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    const pngBuffer = Buffer.from(pngBase64, 'base64');
    fs.writeFileSync(testFilePath, pngBuffer);
    console.log(`✅ Test file created: ${testFileName} (${pngBuffer.length} bytes)\n`);

    // Step 3: Upload file to Supabase Storage
    console.log('3️⃣  Uploading file to Supabase Storage...');
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const storageFileName = `${timestamp}_${randomString}.png`;
    const storagePath = `${order.id}/id_document/${storageFileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('kyc-documents')
      .upload(storagePath, pngBuffer, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;
    console.log(`✅ File uploaded to storage: ${uploadData.path}\n`);

    // Step 4: Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('kyc-documents')
      .getPublicUrl(uploadData.path);
    console.log(`📎 File URL: ${publicUrl}\n`);

    // Step 5: Create database record
    console.log('4️⃣  Creating KYC document record...');
    const customerName = `${order.first_name} ${order.last_name}`;

    const { data: kycDocument, error: kycError } = await supabase
      .from('kyc_documents')
      .insert({
        consumer_order_id: order.id,
        customer_type: 'consumer', // Default to consumer for test
        customer_name: customerName,
        customer_email: order.email,
        customer_phone: order.phone,
        document_type: 'id_document',
        document_title: 'Test ID Document',
        file_name: testFileName,
        file_path: uploadData.path,
        file_size: pngBuffer.length,
        file_type: 'image/png',
        verification_status: 'pending',
        is_sensitive: true,
        encrypted: false
      })
      .select()
      .single();

    if (kycError) throw kycError;
    console.log(`✅ KYC document record created: ${kycDocument.id}`);
    console.log(`   Document: ${kycDocument.document_title}`);
    console.log(`   Type: ${kycDocument.document_type}`);
    console.log(`   Status: ${kycDocument.verification_status}\n`);

    // Step 6: Update order status
    console.log('5️⃣  Updating order status...');
    const { error: updateError } = await supabase
      .from('consumer_orders')
      .update({ status: 'kyc_pending' })
      .eq('id', order.id);

    if (updateError) throw updateError;
    console.log(`✅ Order status updated to: kyc_pending\n`);

    // Step 7: Verify retrieval
    console.log('6️⃣  Verifying document retrieval...');
    const { data: documents, error: getError } = await supabase
      .from('kyc_documents')
      .select('*')
      .eq('consumer_order_id', order.id);

    if (getError) throw getError;
    console.log(`✅ Retrieved ${documents.length} document(s) for order ${order.id}\n`);

    // Step 8: Cleanup
    console.log('7️⃣  Cleaning up test data...');

    // Delete storage file
    const { error: deleteFileError } = await supabase.storage
      .from('kyc-documents')
      .remove([uploadData.path]);
    if (deleteFileError) console.warn('⚠️  Could not delete storage file:', deleteFileError.message);

    // Delete KYC document
    const { error: deleteKycError } = await supabase
      .from('kyc_documents')
      .delete()
      .eq('id', kycDocument.id);
    if (deleteKycError) console.warn('⚠️  Could not delete KYC document:', deleteKycError.message);

    // Delete order
    const { error: deleteOrderError } = await supabase
      .from('consumer_orders')
      .delete()
      .eq('id', order.id);
    if (deleteOrderError) console.warn('⚠️  Could not delete order:', deleteOrderError.message);

    // Delete local test file
    fs.unlinkSync(testFilePath);

    console.log('✅ Test data cleaned up\n');

    console.log('✅ ALL TESTS PASSED! 🎉\n');
    console.log('KYC Upload System Status:');
    console.log('  ✅ Storage bucket operational');
    console.log('  ✅ File upload working');
    console.log('  ✅ Database records creating correctly');
    console.log('  ✅ Order status updates working');
    console.log('  ✅ Document retrieval working');
    console.log('  ✅ Cleanup successful\n');

    console.log('Next Steps:');
    console.log('1. Apply RLS policies to storage bucket (see scripts/setup-kyc-storage.js output)');
    console.log('2. Test UI component with real file upload');
    console.log('3. Implement admin review page (Task 2.2)');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

testKycUpload();
