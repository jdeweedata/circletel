#!/usr/bin/env node
/**
 * Test MTN Deals Import with limited rows
 * Tests the import with first 10 deals only
 */

const ExcelJS = require('exceljs');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

// Import the main function and helpers
const { importMTNDeals, sheetToArray } = require('./import-mtn-deals.js');

const filePath = process.argv[2];
if (!filePath) {
  console.log('Usage: node import-mtn-deals-test.js <path-to-excel>');
  process.exit(1);
}

(async () => {
  // Read first 11 rows only (header + 10 deals)
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.worksheets[0];
  const fullData = sheetToArray(worksheet);

  // Create temp file with limited rows
  const testData = fullData.slice(0, 11); // Header + 10 deals

  const testWorkbook = new ExcelJS.Workbook();
  const testWorksheet = testWorkbook.addWorksheet('Sheet1');
  testData.forEach(row => {
    testWorksheet.addRow(row);
  });

  const tempFile = 'temp-mtn-deals-test.xlsx';
  await testWorkbook.xlsx.writeFile(tempFile);

  console.log(`\n🧪 Test Mode: Importing first 10 deals only\n`);

  // Run import
  try {
    const result = await importMTNDeals(tempFile, { dryRun: false, updateExisting: true });
    fs.unlinkSync(tempFile); // Clean up temp file
    console.log('\n✅ Test import completed!');
    console.log(`\nResults: ${result.inserted} inserted, ${result.updated} updated`);
    process.exit(0);
  } catch (error) {
    fs.unlinkSync(tempFile); // Clean up temp file
    console.error('\n❌ Test import failed:', error.message);
    process.exit(1);
  }
})();
