/**
 * Test Script: Business Quote Request Form
 *
 * Tests the complete quote creation flow:
 * 1. Form validation
 * 2. API endpoint functionality
 * 3. Database record creation
 * 4. Pricing calculations
 */

require('dotenv').config({ path: '.env.local' });

const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const API_BASE = 'http://localhost:3000';

async function testQuoteCreation() {
  console.log('\n🧪 Testing Business Quote Request Form\n');

  // Test 1: Valid quote request
  console.log('Test 1: Create valid business quote...');

  // Get a real lead ID from the database
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: leads } = await supabase.from('coverage_leads').select('id').limit(1);
  const leadId = leads && leads.length > 0 ? leads[0].id : 'b9b17aff-21f4-4bcd-9945-a5d2511e4dce';

  const validQuote = {
    lead_id: leadId,
    customer_type: 'smme',
    company_name: 'Test Company (Pty) Ltd',
    registration_number: '2020/123456/07',
    vat_number: '4123456789',
    contact_name: 'John Smith',
    contact_email: 'john@testcompany.co.za',
    contact_phone: '0123456789',
    service_address: '7 Autumn Street, Rivonia, Sandton, 2128',
    contract_term: 24,
    customer_notes: 'Test quote for development',
    items: [
      {
        package_id: '98f8b365-a95d-46b6-acd5-3d4f7fe8a6f1', // BizFibre Essential - R1109
        item_type: 'primary',
        quantity: 1,
        notes: 'Primary connection'
      },
      {
        package_id: 'e2b94815-3593-4f46-8b81-04373e70c30c', // MTN Business 5G Essential - R494
        item_type: 'secondary',
        quantity: 1,
        notes: 'Backup connection'
      }
    ]
  };

  try {
    const response = await fetch(`${API_BASE}/api/quotes/business/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validQuote)
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Quote created successfully');
      console.log(`   Quote ID: ${data.quote.id}`);
      console.log(`   Quote Number: ${data.quote.quote_number}`);
      console.log(`   Status: ${data.quote.status}`);
      console.log(`   Total Monthly: R${data.quote.total_monthly}`);
      console.log(`   Total Installation: R${data.quote.total_installation}`);
      console.log(`   Items: ${data.quote.items.length}`);

      // Verify database record
      await verifyQuoteInDatabase(data.quote.id);

      return data.quote;
    } else {
      console.log('❌ Failed to create quote');
      console.log(`   HTTP Status: ${response.status}`);
      console.log(`   Error: ${data.error}`);
      console.log(`   Code: ${data.code || 'N/A'}`);
      if (data.details) {
        console.log(`   Details: ${JSON.stringify(data.details, null, 2)}`);
      }
      return null;
    }
  } catch (error) {
    console.log('❌ API request failed');
    console.log(`   Error: ${error.message}`);
    return null;
  }
}

async function verifyQuoteInDatabase(quoteId) {
  console.log('\n📊 Verifying database records...');

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Check quote record
    const { data: quote, error: quoteError } = await supabase
      .from('business_quotes')
      .select('*')
      .eq('id', quoteId)
      .single();

    if (quoteError) throw quoteError;

    console.log('✅ Quote record found in database');
    console.log(`   ID: ${quote.id}`);
    console.log(`   Quote Number: ${quote.quote_number}`);
    console.log(`   Status: ${quote.status}`);
    console.log(`   Company: ${quote.company_name}`);

    // Check quote items
    const { data: items, error: itemsError } = await supabase
      .from('business_quote_items')
      .select('*')
      .eq('quote_id', quoteId);

    if (itemsError) throw itemsError;

    console.log(`✅ Quote items found: ${items.length}`);
    items.forEach((item, index) => {
      console.log(`   Item ${index + 1}: ${item.service_name} (${item.item_type})`);
      console.log(`     Monthly: R${item.monthly_price} x ${item.quantity}`);
      console.log(`     Installation: R${item.installation_price}`);
    });

    // Check totals
    const expectedMonthly = items.reduce((sum, item) => sum + item.monthly_price * item.quantity, 0);
    const vatMonthly = expectedMonthly * 0.15;
    const totalMonthly = expectedMonthly + vatMonthly;

    console.log('\n💰 Pricing Breakdown:');
    console.log(`   Subtotal Monthly: R${expectedMonthly.toFixed(2)}`);
    console.log(`   VAT (15%): R${vatMonthly.toFixed(2)}`);
    console.log(`   Total Monthly: R${totalMonthly.toFixed(2)}`);
    console.log(`   Database Total: R${quote.total_monthly}`);

    if (Math.abs(quote.total_monthly - totalMonthly) < 0.01) {
      console.log('✅ Pricing calculations correct');
    } else {
      console.log('❌ Pricing mismatch');
    }

  } catch (error) {
    console.log('❌ Database verification failed');
    console.log(`   Error: ${error.message}`);
  }
}

async function testValidation() {
  console.log('\n🧪 Testing Form Validation\n');

  const testCases = [
    {
      name: 'Missing company name',
      data: { company_name: '' },
      expectedError: 'Company name is required'
    },
    {
      name: 'Invalid registration number',
      data: {
        company_name: 'Test Company',
        registration_number: '123456'
      },
      expectedError: 'Registration number must be in format YYYY/NNNNNN/NN'
    },
    {
      name: 'Invalid VAT number',
      data: {
        company_name: 'Test Company',
        vat_number: '123'
      },
      expectedError: 'VAT number must be 10 digits'
    },
    {
      name: 'Invalid email',
      data: {
        company_name: 'Test Company',
        contact_name: 'John',
        contact_email: 'invalid-email'
      },
      expectedError: 'Valid contact email is required'
    },
    {
      name: 'No items',
      data: {
        company_name: 'Test Company',
        contact_name: 'John',
        contact_email: 'john@test.com',
        contact_phone: '0123456789',
        service_address: 'Test Address',
        contract_term: 24,
        items: []
      },
      expectedError: 'At least one service item is required'
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    try {
      const response = await fetch(`${API_BASE}/api/quotes/business/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: 'test-lead',
          customer_type: 'smme',
          ...testCase.data
        })
      });

      const data = await response.json();

      if (!data.success && data.error.includes(testCase.expectedError)) {
        console.log(`✅ ${testCase.name}: Validation working`);
        passed++;
      } else {
        console.log(`❌ ${testCase.name}: Unexpected result`);
        console.log(`   Expected: ${testCase.expectedError}`);
        console.log(`   Got: ${data.error}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${testCase.name}: Test failed`);
      console.log(`   Error: ${error.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Validation Tests: ${passed} passed, ${failed} failed`);
}

async function testQuoteRetrieval(quoteId) {
  console.log('\n🧪 Testing Quote Retrieval\n');

  try {
    const response = await fetch(`${API_BASE}/api/quotes/business/${quoteId}`);
    const data = await response.json();

    if (data.success) {
      console.log('✅ Quote retrieved successfully');
      console.log(`   Items: ${data.quote.items.length}`);
      console.log(`   Signature: ${data.quote.signature ? 'Present' : 'None'}`);
      console.log(`   Versions: ${data.quote.versions.length}`);
      return true;
    } else {
      console.log('❌ Failed to retrieve quote');
      console.log(`   Error: ${data.error}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Retrieval test failed');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function cleanupTestData(quoteId) {
  console.log('\n🧹 Cleaning up test data...');

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Delete quote (cascade will handle items)
    const { error } = await supabase
      .from('business_quotes')
      .delete()
      .eq('id', quoteId);

    if (error) throw error;

    console.log('✅ Test data cleaned up');
  } catch (error) {
    console.log('⚠️  Failed to cleanup test data');
    console.log(`   Error: ${error.message}`);
  }
}

async function runAllTests() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  Business Quote Request Form - Integration Tests');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // Test 1: Validation
    await testValidation();

    // Test 2: Quote creation
    const quote = await testQuoteCreation();

    if (quote) {
      // Test 3: Quote retrieval
      await testQuoteRetrieval(quote.id);

      // Cleanup
      await cleanupTestData(quote.id);
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  Tests Complete');
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run tests
runAllTests();
