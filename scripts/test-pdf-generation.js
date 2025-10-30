/**
 * Test Script: PDF Generation
 *
 * Tests the PDF generation functionality:
 * 1. Generate PDF for a quote
 * 2. Verify PDF structure
 * 3. Check file size and format
 * 4. Test with different quote configurations
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const API_BASE = 'http://localhost:3003';
const TEST_OUTPUT_DIR = path.join(__dirname, '..', 'test-output');

// Ensure test output directory exists
if (!fs.existsSync(TEST_OUTPUT_DIR)) {
  fs.mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
}

async function createTestQuote() {
  console.log('\n📝 Creating test quote for PDF generation...');

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Get a real lead ID
  const { data: leads } = await supabase.from('coverage_leads').select('id').limit(1);
  const leadId = leads && leads.length > 0 ? leads[0].id : 'b9b17aff-21f4-4bcd-9945-a5d2511e4dce';

  const quote = {
    lead_id: leadId,
    customer_type: 'enterprise',
    company_name: 'Test Enterprise Solutions (Pty) Ltd',
    registration_number: '2020/999888/07',
    vat_number: '4999888777',
    contact_name: 'John Doe',
    contact_email: 'john.doe@testenterprise.co.za',
    contact_phone: '+27821234567',
    service_address: '7 Autumn Street, Rivonia Office Park, Sandton, Gauteng, 2128',
    contract_term: 36,
    customer_notes: 'This is a test quote for PDF generation. Special requirements: Redundant backup line required, 24/7 support, SLA of 99.9% uptime.',
    items: [
      {
        package_id: '98f8b365-a95d-46b6-acd5-3d4f7fe8a6f1', // BizFibre Essential
        item_type: 'primary',
        quantity: 2,
        notes: 'Primary connection - 2 locations'
      },
      {
        package_id: '5c68bd1f-508f-4530-937e-0242d02814e6', // BizFibre Pro
        item_type: 'secondary',
        quantity: 1,
        notes: 'Backup connection for failover'
      },
      {
        package_id: 'e2b94815-3593-4f46-8b81-04373e70c30c', // MTN Business 5G
        item_type: 'additional',
        quantity: 1,
        notes: 'Mobile backup solution'
      }
    ]
  };

  try {
    const response = await fetch(`${API_BASE}/api/quotes/business/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quote)
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Test quote created');
      console.log(`   Quote ID: ${data.quote.id}`);
      console.log(`   Quote Number: ${data.quote.quote_number}`);
      console.log(`   Items: ${data.quote.items.length}`);
      console.log(`   Total Monthly: R${data.quote.total_monthly}`);
      return data.quote;
    } else {
      console.log('❌ Failed to create test quote');
      console.log(`   Error: ${data.error}`);
      return null;
    }
  } catch (error) {
    console.log('❌ Request failed');
    console.log(`   Error: ${error.message}`);
    return null;
  }
}

async function testPDFGeneration(quoteId, quoteName) {
  console.log('\n🧪 Test 1: Generate and Download PDF');

  try {
    const response = await fetch(`${API_BASE}/api/quotes/business/${quoteId}/pdf`);

    if (!response.ok) {
      console.log('❌ PDF generation failed');
      console.log(`   Status: ${response.status}`);
      const error = await response.json();
      console.log(`   Error: ${error.error}`);
      return null;
    }

    // Get PDF content
    const pdfBuffer = await response.arrayBuffer();
    const pdfSize = pdfBuffer.byteLength;

    console.log('✅ PDF generated successfully');
    console.log(`   Size: ${(pdfSize / 1024).toFixed(2)} KB`);

    // Check content type
    const contentType = response.headers.get('content-type');
    console.log(`   Content-Type: ${contentType}`);

    if (contentType !== 'application/pdf') {
      console.log('⚠️  Warning: Content-Type is not application/pdf');
    }

    // Check content disposition
    const contentDisposition = response.headers.get('content-disposition');
    console.log(`   Content-Disposition: ${contentDisposition}`);

    // Save PDF for manual inspection
    const filename = `test-quote-${quoteName}.pdf`;
    const filepath = path.join(TEST_OUTPUT_DIR, filename);
    fs.writeFileSync(filepath, Buffer.from(pdfBuffer));
    console.log(`   Saved to: ${filepath}`);

    // Validate PDF structure (basic check)
    const pdfHeader = Buffer.from(pdfBuffer.slice(0, 5)).toString();
    if (pdfHeader === '%PDF-') {
      console.log('✅ PDF file structure valid');
    } else {
      console.log('❌ Invalid PDF file structure');
      console.log(`   Header: ${pdfHeader}`);
      return null;
    }

    return {
      size: pdfSize,
      filepath,
      contentType,
      contentDisposition
    };
  } catch (error) {
    console.log('❌ PDF test failed');
    console.log(`   Error: ${error.message}`);
    return null;
  }
}

async function testPDFContent(quoteId) {
  console.log('\n🧪 Test 2: Verify PDF Content');

  try {
    const response = await fetch(`${API_BASE}/api/quotes/business/${quoteId}/pdf`);
    const pdfBuffer = await response.arrayBuffer();
    const pdfText = Buffer.from(pdfBuffer).toString('latin1');

    // Check for key content elements
    const checks = [
      { name: 'Quote Number', pattern: /BQ-\d{4}-\d{3}/, found: false },
      { name: 'CircleTel Branding', pattern: /CircleTel/, found: false },
      { name: 'Company Name', pattern: /Test Enterprise Solutions/, found: false },
      { name: 'VAT', pattern: /VAT/, found: false },
      { name: 'Total Monthly', pattern: /TOTAL MONTHLY/, found: false },
      { name: 'Terms & Conditions', pattern: /TERMS AND CONDITIONS/, found: false },
      { name: 'Customer Details', pattern: /CUSTOMER DETAILS/, found: false },
      { name: 'Service Package', pattern: /SERVICE PACKAGE DETAILS/, found: false },
      { name: 'Pricing', pattern: /PRICING/, found: false }
    ];

    checks.forEach(check => {
      check.found = check.pattern.test(pdfText);
    });

    console.log('Content Verification:');
    checks.forEach(check => {
      const status = check.found ? '✅' : '❌';
      console.log(`   ${status} ${check.name}: ${check.found ? 'Present' : 'Missing'}`);
    });

    const allPresent = checks.every(c => c.found);
    if (allPresent) {
      console.log('\n✅ All required content present in PDF');
      return true;
    } else {
      console.log('\n⚠️  Some content missing from PDF');
      return false;
    }
  } catch (error) {
    console.log('❌ Content verification failed');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function testPDFPerformance(quoteId, iterations = 5) {
  console.log(`\n🧪 Test 3: PDF Generation Performance (${iterations} iterations)`);

  const times = [];

  for (let i = 0; i < iterations; i++) {
    const start = Date.now();

    try {
      const response = await fetch(`${API_BASE}/api/quotes/business/${quoteId}/pdf`);
      if (!response.ok) {
        console.log(`❌ Iteration ${i + 1} failed`);
        continue;
      }

      await response.arrayBuffer();
      const duration = Date.now() - start;
      times.push(duration);

      console.log(`   Iteration ${i + 1}: ${duration}ms`);
    } catch (error) {
      console.log(`❌ Iteration ${i + 1} error: ${error.message}`);
    }
  }

  if (times.length > 0) {
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);

    console.log('\n📊 Performance Summary:');
    console.log(`   Average: ${avg.toFixed(2)}ms`);
    console.log(`   Min: ${min}ms`);
    console.log(`   Max: ${max}ms`);
    console.log(`   Samples: ${times.length}/${iterations}`);

    if (avg < 2000) {
      console.log('✅ Performance acceptable (< 2s average)');
      return true;
    } else {
      console.log('⚠️  Performance slow (> 2s average)');
      return false;
    }
  } else {
    console.log('❌ No successful iterations');
    return false;
  }
}

async function testMultipleQuoteTypes() {
  console.log('\n🧪 Test 4: Different Quote Configurations');

  // Test with minimal quote (1 item)
  console.log('\n  Testing minimal quote (1 item)...');
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: leads } = await supabase.from('coverage_leads').select('id').limit(1);
  const leadId = leads && leads.length > 0 ? leads[0].id : 'b9b17aff-21f4-4bcd-9945-a5d2511e4dce';

  const minimalQuote = {
    lead_id: leadId,
    customer_type: 'smme',
    company_name: 'Minimal Test Co',
    contact_name: 'Test User',
    contact_email: 'test@minimal.co.za',
    contact_phone: '0123456789',
    service_address: 'Test Address',
    contract_term: 12,
    items: [{
      package_id: 'e2b94815-3593-4f46-8b81-04373e70c30c',
      item_type: 'primary',
      quantity: 1
    }]
  };

  const response = await fetch(`${API_BASE}/api/quotes/business/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(minimalQuote)
  });

  const data = await response.json();

  if (data.success) {
    const pdfResult = await testPDFGeneration(data.quote.id, 'minimal');
    await cleanupQuote(data.quote.id);

    if (pdfResult) {
      console.log('  ✅ Minimal quote PDF generated successfully');
      return true;
    } else {
      console.log('  ❌ Minimal quote PDF failed');
      return false;
    }
  } else {
    console.log('  ❌ Failed to create minimal quote');
    return false;
  }
}

async function cleanupQuote(quoteId) {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  await supabase.from('business_quotes').delete().eq('id', quoteId);
}

async function runAllTests() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  PDF Generation - Integration Tests');
  console.log('═══════════════════════════════════════════════════════\n');

  let passed = 0;
  let failed = 0;

  try {
    // Create a comprehensive test quote
    const testQuote = await createTestQuote();

    if (!testQuote) {
      console.log('\n❌ Failed to create test quote - cannot continue tests');
      process.exit(1);
    }

    // Test 1: Basic PDF generation
    const pdfResult = await testPDFGeneration(testQuote.id, testQuote.quote_number);
    if (pdfResult) passed++; else failed++;

    // Test 2: Content verification
    if (await testPDFContent(testQuote.id)) passed++; else failed++;

    // Test 3: Performance
    if (await testPDFPerformance(testQuote.id, 3)) passed++; else failed++;

    // Test 4: Multiple configurations
    if (await testMultipleQuoteTypes()) passed++; else failed++;

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await cleanupQuote(testQuote.id);
    console.log('✅ Cleanup complete');

    console.log('\n═══════════════════════════════════════════════════════');
    console.log(`  Test Results: ${passed} passed, ${failed} failed`);
    console.log(`  PDF Files: Check ${TEST_OUTPUT_DIR} for generated PDFs`);
    console.log('═══════════════════════════════════════════════════════\n');

    if (failed > 0) {
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
runAllTests();
