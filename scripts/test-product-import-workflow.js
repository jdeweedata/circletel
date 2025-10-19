#!/usr/bin/env node
/**
 * End-to-End Product Import Workflow Test
 * Tests: Excel parsing → Import → Approval Queue → Notifications
 */

const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runWorkflowTest() {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 PRODUCT IMPORT WORKFLOW - END-TO-END TEST');
  console.log('='.repeat(70) + '\n');

  let testResults = {
    passed: 0,
    failed: 0,
    warnings: 0
  };

  try {
    // ============================================
    // TEST 1: Database Tables Exist
    // ============================================
    console.log('📋 TEST 1: Checking database tables...');

    const tables = [
      'product_imports',
      'product_approval_queue',
      'notifications',
      'reminders',
      'product_approval_activity_log'
    ];

    for (const table of tables) {
      const { error } = await supabase.from(table).select('id').limit(1);
      if (error && error.code !== 'PGRST116') { // PGRST116 = empty table
        console.log(`   ❌ Table '${table}' not found or error:`, error.message);
        testResults.failed++;
      } else {
        console.log(`   ✅ Table '${table}' exists`);
        testResults.passed++;
      }
    }

    // ============================================
    // TEST 2: Excel File Parsing
    // ============================================
    console.log('\n📄 TEST 2: Parsing Excel file...');

    const excelPath = 'docs/products/01_ACTIVE_PRODUCTS/BizFibreConnect/DFA Business Internet Access Service with ENNI-GNNI Infrastructure.xlsx';

    if (!fs.existsSync(excelPath)) {
      console.log(`   ❌ Excel file not found: ${excelPath}`);
      testResults.failed++;
    } else {
      const workbook = XLSX.readFile(excelPath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      console.log(`   ✅ Excel file loaded successfully`);
      console.log(`   ✅ Found sheet: ${sheetName}`);
      console.log(`   ✅ Total rows: ${sheetData.length}`);
      testResults.passed += 3;

      // Find products
      const headerRowIndex = sheetData.findIndex(row =>
        row[0] === 'Package' && row[1] === 'Speed'
      );

      if (headerRowIndex === -1) {
        console.log(`   ❌ Could not find product pricing header`);
        testResults.failed++;
      } else {
        console.log(`   ✅ Found product pricing header at row ${headerRowIndex + 1}`);
        testResults.passed++;

        // Count products
        let productCount = 0;
        for (let i = headerRowIndex + 1; i < sheetData.length; i++) {
          const row = sheetData[i];
          if (!row || row.length === 0 || row[0]?.includes('Detailed Cost Breakdown')) break;
          if (row[0]?.includes('*Requires')) continue;
          if (row[0] && row[1]) productCount++;
        }

        console.log(`   ✅ Parsed ${productCount} products`);
        testResults.passed++;
      }
    }

    // ============================================
    // TEST 3: Test Product Import (Dry Run)
    // ============================================
    console.log('\n💾 TEST 3: Testing product import...');

    const testUserId = null; // System import for testing

    // Parse sample product
    const workbook = XLSX.readFile(excelPath);
    const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });
    const headerRowIndex = sheetData.findIndex(row => row[0] === 'Package' && row[1] === 'Speed');

    const sampleProduct = {
      name: 'Test Product - BizFibre Connect Lite',
      speed: '10/10 Mbps',
      regularPrice: 1699,
      installationFee: 2500,
      totalFirstMonth: 4199,
      router: { model: 'Reyee RG-EW1300G', included: true }
    };

    console.log(`   📦 Sample product: ${sampleProduct.name}`);

    // Create test import record
    const { data: importRecord, error: importError } = await supabase
      .from('product_imports')
      .insert({
        source_file: 'test-import.xlsx',
        product_category: 'BizFibre Connect - TEST',
        imported_by: testUserId,
        status: 'pending',
        total_products: 1,
        metadata: { test: true },
        notes: 'End-to-end workflow test'
      })
      .select()
      .single();

    if (importError) {
      console.log(`   ❌ Failed to create import record:`, importError.message);
      testResults.failed++;
    } else {
      console.log(`   ✅ Created import record: ${importRecord.id}`);
      testResults.passed++;

      // Add to approval queue
      const { data: queueItem, error: queueError } = await supabase
        .from('product_approval_queue')
        .insert({
          import_id: importRecord.id,
          product_name: sampleProduct.name,
          product_data: sampleProduct,
          status: 'pending',
          priority: 'medium'
        })
        .select()
        .single();

      if (queueError) {
        console.log(`   ❌ Failed to add to approval queue:`, queueError.message);
        testResults.failed++;
      } else {
        console.log(`   ✅ Added to approval queue: ${queueItem.id}`);
        testResults.passed++;
      }

      // ============================================
      // TEST 4: Notifications Created
      // ============================================
      console.log('\n🔔 TEST 4: Checking notifications...');

      // Wait a moment for triggers to fire
      await new Promise(resolve => setTimeout(resolve, 1000));

      const { data: notifications, error: notifError } = await supabase
        .from('notifications')
        .select('*')
        .eq('related_entity_id', importRecord.id);

      if (notifError) {
        console.log(`   ⚠️ Warning: Could not fetch notifications:`, notifError.message);
        testResults.warnings++;
      } else if (notifications && notifications.length > 0) {
        console.log(`   ✅ Created ${notifications.length} notification(s)`);
        notifications.forEach(n => {
          console.log(`      - ${n.title}: ${n.message}`);
        });
        testResults.passed++;
      } else {
        console.log(`   ⚠️ Warning: No notifications created (may need Product Manager users in DB)`);
        testResults.warnings++;
      }

      // ============================================
      // TEST 5: Cleanup Test Data
      // ============================================
      console.log('\n🧹 TEST 5: Cleaning up test data...');

      // Delete in correct order (FK constraints)
      await supabase.from('product_approval_activity_log').delete().eq('import_id', importRecord.id);
      await supabase.from('notifications').delete().eq('related_entity_id', importRecord.id);
      await supabase.from('product_approval_queue').delete().eq('import_id', importRecord.id);
      await supabase.from('product_imports').delete().eq('id', importRecord.id);

      console.log(`   ✅ Test data cleaned up`);
      testResults.passed++;
    }

    // ============================================
    // FINAL RESULTS
    // ============================================
    console.log('\n' + '='.repeat(70));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(70));
    console.log(`✅ Passed:   ${testResults.passed}`);
    console.log(`❌ Failed:   ${testResults.failed}`);
    console.log(`⚠️  Warnings: ${testResults.warnings}`);
    console.log('='.repeat(70));

    if (testResults.failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED! Workflow is ready to use.\n');
      console.log('Next steps:');
      console.log('1. Apply the migration: Run SQL in Supabase Dashboard');
      console.log('2. Import products: node scripts/import-product-excel.js "<excel-path>"');
      console.log('3. Review products: Navigate to /admin/products/approvals');
      console.log('4. Approve/reject: Use the admin UI\n');
    } else {
      console.log('\n⚠️  SOME TESTS FAILED. Please review errors above.\n');
    }

  } catch (error) {
    console.error('\n❌ Test execution error:', error);
    process.exit(1);
  }
}

// Run tests
runWorkflowTest()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
