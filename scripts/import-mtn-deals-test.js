#!/usr/bin/env node
/**
 * Test MTN Deals Import with limited rows
 * Tests the import with first 10 deals only
 */

const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

// Import the main function
const { importMTNDeals } = require('./import-mtn-deals.js');

const filePath = process.argv[2];
if (!filePath) {
  console.log('Usage: node import-mtn-deals-test.js <path-to-excel>');
  process.exit(1);
}

// Read first 11 rows only (header + 10 deals)
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const fullData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

// Create temp file with limited rows
const testData = fullData.slice(0, 11); // Header + 10 deals
const testWorkbook = XLSX.utils.book_new();
const testWorksheet = XLSX.utils.aoa_to_sheet(testData);
XLSX.utils.book_append_sheet(testWorkbook, testWorksheet, 'Sheet1');

const tempFile = 'temp-mtn-deals-test.xlsx';
XLSX.writeFile(testWorkbook, tempFile);

console.log(`\n🧪 Test Mode: Importing first 10 deals only\n`);

// Run import
importMTNDeals(tempFile, { dryRun: false, updateExisting: true })
  .then(result => {
    fs.unlinkSync(tempFile); // Clean up temp file
    console.log('\n✅ Test import completed!');
    console.log(`\nResults: ${result.inserted} inserted, ${result.updated} updated`);
    process.exit(0);
  })
  .catch(error => {
    fs.unlinkSync(tempFile); // Clean up temp file
    console.error('\n❌ Test import failed:', error.message);
    process.exit(1);
  });
