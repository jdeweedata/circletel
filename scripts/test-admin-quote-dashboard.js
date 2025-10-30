/**
 * Test Script: Admin Quote Dashboard
 *
 * Tests the admin quote management functionality:
 * 1. List quotes with filtering
 * 2. View quote details
 * 3. Approve quotes
 * 4. Reject quotes
 * 5. Send quotes to customers
 */

require('dotenv').config({ path: '.env.local' });

const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const API_BASE = 'http://localhost:3001';

async function createTestQuote() {
  console.log('\n📝 Creating test quote...');

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Get a real lead ID
  const { data: leads } = await supabase.from('coverage_leads').select('id').limit(1);
  const leadId = leads && leads.length > 0 ? leads[0].id : 'b9b17aff-21f4-4bcd-9945-a5d2511e4dce';

  const quote = {
    lead_id: leadId,
    customer_type: 'smme',
    company_name: 'Test Admin Dashboard Company',
    registration_number: '2020/987654/07',
    vat_number: '9876543210',
    contact_name: 'Admin Test User',
    contact_email: 'admin-test@example.com',
    contact_phone: '0821234567',
    service_address: 'Admin Test Address, Sandton',
    contract_term: 24,
    customer_notes: 'Test quote for admin dashboard testing',
    items: [
      {
        package_id: '5c68bd1f-508f-4530-937e-0242d02814e6', // BizFibre Pro
        item_type: 'primary',
        quantity: 1,
        notes: 'Primary service'
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

async function testListQuotes() {
  console.log('\n🧪 Test 1: List All Quotes');

  try {
    const response = await fetch(`${API_BASE}/api/quotes/business/list?limit=10`);
    const data = await response.json();

    if (data.success) {
      console.log('✅ Quotes retrieved successfully');
      console.log(`   Total: ${data.pagination.total}`);
      console.log(`   Returned: ${data.quotes.length}`);

      if (data.quotes.length > 0) {
        const quote = data.quotes[0];
        console.log(`   Sample Quote: ${quote.quote_number} - ${quote.company_name} (${quote.status})`);
      }

      return true;
    } else {
      console.log('❌ Failed to list quotes');
      console.log(`   Error: ${data.error}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Request failed');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function testListWithFilters() {
  console.log('\n🧪 Test 2: List Quotes with Status Filter');

  try {
    const response = await fetch(`${API_BASE}/api/quotes/business/list?status=draft&limit=10`);
    const data = await response.json();

    if (data.success) {
      console.log('✅ Filtered quotes retrieved');
      console.log(`   Total drafts: ${data.pagination.total}`);
      console.log(`   All results are draft: ${data.quotes.every(q => q.status === 'draft')}`);
      return true;
    } else {
      console.log('❌ Failed to filter quotes');
      console.log(`   Error: ${data.error}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Request failed');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function testGetQuoteDetails(quoteId) {
  console.log('\n🧪 Test 3: Get Quote Details');

  try {
    const response = await fetch(`${API_BASE}/api/quotes/business/${quoteId}`);
    const data = await response.json();

    if (data.success) {
      console.log('✅ Quote details retrieved');
      console.log(`   Quote: ${data.quote.quote_number}`);
      console.log(`   Company: ${data.quote.company_name}`);
      console.log(`   Status: ${data.quote.status}`);
      console.log(`   Items: ${data.quote.items.length}`);
      console.log(`   Versions: ${data.quote.versions.length}`);
      return data.quote;
    } else {
      console.log('❌ Failed to get quote details');
      console.log(`   Error: ${data.error}`);
      return null;
    }
  } catch (error) {
    console.log('❌ Request failed');
    console.log(`   Error: ${error.message}`);
    return null;
  }
}

async function testApproveQuote(quoteId) {
  console.log('\n🧪 Test 4: Approve Quote');

  try {
    // First, update to pending_approval status
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    await supabase
      .from('business_quotes')
      .update({ status: 'pending_approval' })
      .eq('id', quoteId);

    console.log('   Updated to pending_approval status');

    // Now approve
    const response = await fetch(`${API_BASE}/api/quotes/business/${quoteId}/approve`, {
      method: 'POST'
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Quote approved successfully');
      console.log(`   New Status: ${data.quote.status}`);
      console.log(`   Approved At: ${data.quote.approved_at}`);
      return true;
    } else {
      console.log('❌ Failed to approve quote');
      console.log(`   Error: ${data.error}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Request failed');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function testSendQuote(quoteId, email) {
  console.log('\n🧪 Test 5: Send Quote to Customer');

  try {
    const response = await fetch(`${API_BASE}/api/quotes/business/${quoteId}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient_email: email,
        message: 'Your business quote is ready for review.'
      })
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Quote sent successfully');
      console.log(`   New Status: ${data.quote.status}`);
      console.log(`   Sent At: ${data.quote.sent_at}`);
      return true;
    } else {
      console.log('❌ Failed to send quote');
      console.log(`   Error: ${data.error}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Request failed');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function testRejectQuote(quoteId) {
  console.log('\n🧪 Test 6: Reject Quote');

  // First, create a new quote to reject
  const testQuote = await createTestQuote();
  if (!testQuote) {
    console.log('⚠️  Skipping reject test - could not create test quote');
    return false;
  }

  try {
    const response = await fetch(`${API_BASE}/api/quotes/business/${testQuote.id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rejection_reason: 'Testing rejection functionality'
      })
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Quote rejected successfully');
      console.log(`   New Status: ${data.quote.status}`);

      // Cleanup
      await cleanupQuote(testQuote.id);
      return true;
    } else {
      console.log('❌ Failed to reject quote');
      console.log(`   Error: ${data.error}`);

      // Cleanup
      await cleanupQuote(testQuote.id);
      return false;
    }
  } catch (error) {
    console.log('❌ Request failed');
    console.log(`   Error: ${error.message}`);

    // Cleanup
    await cleanupQuote(testQuote.id);
    return false;
  }
}

async function testPendingQuotesList() {
  console.log('\n🧪 Test 7: List Pending Approval Quotes');

  try {
    const response = await fetch(`${API_BASE}/api/quotes/business/admin/pending?status=pending_approval&limit=10`);
    const data = await response.json();

    if (data.success) {
      console.log('✅ Pending quotes retrieved');
      console.log(`   Total pending: ${data.pagination.total}`);
      return true;
    } else {
      console.log('❌ Failed to get pending quotes');
      console.log(`   Error: ${data.error}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Request failed');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function testAnalytics() {
  console.log('\n🧪 Test 8: Get Quote Analytics');

  try {
    const response = await fetch(`${API_BASE}/api/quotes/business/admin/analytics`);
    const data = await response.json();

    if (data.success) {
      console.log('✅ Analytics retrieved');
      console.log(`   Total Quotes: ${data.analytics.total_quotes}`);
      console.log(`   Accepted Quotes: ${data.analytics.accepted_quotes}`);
      console.log(`   Conversion Rate: ${data.analytics.conversion_rate.toFixed(2)}%`);
      console.log(`   Average Quote Value: R${data.analytics.average_quote_value.toFixed(2)}`);
      return true;
    } else {
      console.log('❌ Failed to get analytics');
      console.log(`   Error: ${data.error}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Request failed');
    console.log(`   Error: ${error.message}`);
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
  console.log('  Admin Quote Dashboard - Integration Tests');
  console.log('═══════════════════════════════════════════════════════\n');

  let passed = 0;
  let failed = 0;

  try {
    // Create a test quote for workflow testing
    const testQuote = await createTestQuote();

    if (!testQuote) {
      console.log('\n❌ Failed to create test quote - cannot continue tests');
      process.exit(1);
    }

    // Test 1: List all quotes
    if (await testListQuotes()) passed++; else failed++;

    // Test 2: List with filters
    if (await testListWithFilters()) passed++; else failed++;

    // Test 3: Get quote details
    const quoteDetails = await testGetQuoteDetails(testQuote.id);
    if (quoteDetails) passed++; else failed++;

    // Test 4: Approve quote
    if (await testApproveQuote(testQuote.id)) passed++; else failed++;

    // Test 5: Send quote
    if (await testSendQuote(testQuote.id, testQuote.contact_email)) passed++; else failed++;

    // Test 6: Reject quote (uses separate test quote)
    if (await testRejectQuote()) passed++; else failed++;

    // Test 7: Pending quotes list
    if (await testPendingQuotesList()) passed++; else failed++;

    // Test 8: Analytics
    if (await testAnalytics()) passed++; else failed++;

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await cleanupQuote(testQuote.id);
    console.log('✅ Cleanup complete');

    console.log('\n═══════════════════════════════════════════════════════');
    console.log(`  Test Results: ${passed} passed, ${failed} failed`);
    console.log('═══════════════════════════════════════════════════════\n');

    if (failed > 0) {
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run tests
runAllTests();
