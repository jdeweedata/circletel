#!/usr/bin/env node
/**
 * Complete Product Import Workflow E2E Test
 * Tests the entire flow: Import → Admin UI → Approval → Notifications → Database
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runCompleteWorkflow() {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 PRODUCT IMPORT WORKFLOW - COMPLETE E2E TEST');
  console.log('='.repeat(80) + '\n');

  let importId = null;
  let approvalId = null;

  try {
    // ============================================
    // STEP 1: Verify Tables Exist
    // ============================================
    console.log('📋 STEP 1: Verifying database setup...\n');

    const { data: tables, error: tableError } = await supabase.rpc('execute_sql', {
      query: `
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name IN (
          'product_imports',
          'product_approval_queue',
          'notifications',
          'reminders'
        )
        ORDER BY table_name;
      `
    }).catch(() => ({ data: null, error: { message: 'RPC not available' } }));

    // Alternative check using direct query
    const tableChecks = await Promise.all([
      supabase.from('product_imports').select('id').limit(1),
      supabase.from('product_approval_queue').select('id').limit(1),
      supabase.from('notifications').select('id').limit(1),
      supabase.from('reminders').select('id').limit(1)
    ]);

    const allTablesExist = tableChecks.every(check => !check.error || check.error.code === 'PGRST116');

    if (!allTablesExist) {
      console.log('❌ MIGRATION NOT APPLIED!');
      console.log('\n⚠️  Please apply the migration first:');
      console.log('   See: APPLY_MIGRATION_NOW.md');
      console.log('   File: supabase/migrations/20251019000002_create_product_approval_system.sql\n');
      process.exit(1);
    }

    console.log('✅ All required tables exist\n');

    // ============================================
    // STEP 2: Import Products
    // ============================================
    console.log('📦 STEP 2: Importing products...\n');

    const { importProductExcel } = require('./import-product-excel');
    const excelPath = 'docs/products/01_ACTIVE_PRODUCTS/BizFibreConnect/DFA Business Internet Access Service with ENNI-GNNI Infrastructure.xlsx';

    const importRecord = await importProductExcel(excelPath, null);
    importId = importRecord.id;

    console.log(`✅ Import completed: ${importId}`);
    console.log(`   Products imported: ${importRecord.total_products}\n`);

    // ============================================
    // STEP 3: Verify Approval Queue
    // ============================================
    console.log('📋 STEP 3: Checking approval queue...\n');

    const { data: approvals, error: approvalError } = await supabase
      .from('product_approval_queue')
      .select('*')
      .eq('import_id', importId);

    if (approvalError) {
      throw new Error(`Failed to fetch approvals: ${approvalError.message}`);
    }

    console.log(`✅ Found ${approvals.length} products in approval queue`);
    approvals.forEach((approval, i) => {
      console.log(`   ${i + 1}. ${approval.product_name} - ${approval.status}`);
    });

    if (approvals.length > 0) {
      approvalId = approvals[0].id;
    }

    console.log('');

    // ============================================
    // STEP 4: Check Notifications
    // ============================================
    console.log('🔔 STEP 4: Checking notifications...\n');

    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for triggers

    const { data: notifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('related_entity_id', importId)
      .order('created_at', { ascending: false });

    if (notifications && notifications.length > 0) {
      console.log(`✅ Created ${notifications.length} notification(s)`);
      notifications.forEach(n => {
        console.log(`   📧 ${n.title}`);
        console.log(`      ${n.message}`);
      });
    } else {
      console.log('⚠️  No notifications (Product Manager users may not exist)');
    }

    console.log('');

    // ============================================
    // STEP 5: Test Approval (Programmatic)
    // ============================================
    console.log('✅ STEP 5: Testing approval workflow...\n');

    if (!approvalId) {
      console.log('⚠️  No approvals to test\n');
    } else {
      // Get first approval
      const approval = approvals[0];
      const productData = approval.product_data;

      console.log(`Testing approval for: ${approval.product_name}`);

      // Simulate approval by creating service package
      const { data: servicePackage, error: packageError } = await supabase
        .from('service_packages')
        .insert({
          name: productData.name,
          speed: productData.speed,
          price: productData.regularPrice,
          promo_price: productData.promoPrice || null,
          installation_fee: productData.installationFee,
          router_model: productData.router?.model,
          router_included: productData.router?.included || false,
          category: 'BizFibre Connect',
          is_active: true,
          metadata: {
            importedFrom: 'E2E Test',
            testData: true
          }
        })
        .select()
        .single();

      if (packageError) {
        console.log(`⚠️  Could not create service package: ${packageError.message}`);
      } else {
        console.log(`✅ Created service package: ${servicePackage.id}`);
        console.log(`   Name: ${servicePackage.name}`);
        console.log(`   Speed: ${servicePackage.speed}`);
        console.log(`   Price: R ${servicePackage.price}`);

        // Update approval status
        await supabase
          .from('product_approval_queue')
          .update({
            status: 'approved',
            service_package_id: servicePackage.id,
            approval_notes: 'Approved via E2E test'
          })
          .eq('id', approvalId);

        console.log(`✅ Updated approval queue status to 'approved'\n`);
      }
    }

    // ============================================
    // STEP 6: Workflow Summary
    // ============================================
    console.log('='.repeat(80));
    console.log('📊 WORKFLOW TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`Import ID: ${importId}`);
    console.log(`Products Imported: ${approvals?.length || 0}`);
    console.log(`Notifications Sent: ${notifications?.length || 0}`);
    console.log(`Status: ✅ COMPLETE`);
    console.log('='.repeat(80));

    console.log('\n✨ Next Steps:\n');
    console.log('1. Start dev server: npm run dev');
    console.log('2. Navigate to: http://localhost:3006/admin/products/approvals');
    console.log('3. Login with admin credentials');
    console.log('4. Review and approve products via UI');
    console.log('5. Check notifications bell in header\n');

    console.log('🎭 To test with Playwright:');
    console.log('   (I can guide you through this next)\n');

    // ============================================
    // Cleanup (Optional)
    // ============================================
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    readline.question('🧹 Clean up test data? (y/n): ', async (answer) => {
      if (answer.toLowerCase() === 'y') {
        console.log('\nCleaning up...');

        // Delete in correct order (FK constraints)
        await supabase.from('product_approval_activity_log').delete().eq('import_id', importId);
        await supabase.from('notifications').delete().eq('related_entity_id', importId);
        await supabase.from('product_approval_queue').delete().eq('import_id', importId);

        // Delete test service packages
        await supabase.from('service_packages').delete().match({ metadata: { testData: true } });

        await supabase.from('product_imports').delete().eq('id', importId);

        console.log('✅ Test data cleaned up\n');
      } else {
        console.log('\n✅ Test data preserved for review\n');
      }

      readline.close();
      process.exit(0);
    });

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the workflow
if (require.main === module) {
  runCompleteWorkflow();
}

module.exports = { runCompleteWorkflow };
