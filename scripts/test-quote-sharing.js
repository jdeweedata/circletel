/**
 * Test Script: Quote Sharing and Tracking System
 *
 * Tests the complete flow:
 * 1. Generate a shareable link for a quote
 * 2. Access the quote via share token
 * 3. Track view events
 * 4. Retrieve tracking analytics
 *
 * Usage: node scripts/test-quote-sharing.js [quote-id]
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3001';

// Use the first quote ID from database or provide one
const QUOTE_ID = process.argv[2] || '00000000-0000-0000-0000-000000000000'; // Replace with actual quote ID

async function testShareLinkGeneration() {
  console.log('\n🔗 Test 1: Generate Share Link');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const response = await fetch(`${BASE_URL}/api/quotes/business/${QUOTE_ID}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Share link generated successfully');
      console.log(`   Share URL: ${data.data.share_url}`);
      console.log(`   Share Token: ${data.data.share_token}`);
      console.log(`   Quote Number: ${data.data.quote_number}`);
      return data.data.share_token;
    } else {
      console.log('❌ Failed to generate share link');
      console.log(`   Error: ${data.error}`);
      return null;
    }
  } catch (error) {
    console.log('❌ Error generating share link');
    console.log(`   ${error.message}`);
    return null;
  }
}

async function testTokenResolution(shareToken) {
  console.log('\n🔍 Test 2: Resolve Share Token');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const response = await fetch(`${BASE_URL}/api/quotes/share/${shareToken}`);
    const data = await response.json();

    if (data.success) {
      console.log('✅ Token resolved successfully');
      console.log(`   Quote ID: ${data.data.quote_id}`);
      console.log(`   Quote Number: ${data.data.quote_number}`);
      return data.data.quote_id;
    } else {
      console.log('❌ Failed to resolve token');
      console.log(`   Error: ${data.error}`);
      console.log(`   Status: ${response.status}`);
      return null;
    }
  } catch (error) {
    console.log('❌ Error resolving token');
    console.log(`   ${error.message}`);
    return null;
  }
}

async function testTrackingEvent(quoteId) {
  console.log('\n📊 Test 3: Track View Event');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const sessionId = `test-session-${Date.now()}`;

    const response = await fetch(`${BASE_URL}/api/quotes/business/${quoteId}/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Test Script/1.0',
        'Referer': `${BASE_URL}/quotes/share/test-token?utm_source=test&utm_medium=script`
      },
      body: JSON.stringify({
        event_type: 'view',
        session_id: sessionId,
        viewer_email: 'test@example.com',
        viewer_name: 'Test User',
        time_spent_seconds: 30,
        metadata: {
          test: true,
          source: 'automated_test'
        }
      })
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ View event tracked successfully');
      console.log(`   Session ID: ${sessionId}`);
      console.log(`   Event Type: view`);
      console.log(`   Time Spent: 30 seconds`);
    } else {
      console.log('❌ Failed to track event');
      console.log(`   Error: ${data.error}`);
    }
  } catch (error) {
    console.log('❌ Error tracking event');
    console.log(`   ${error.message}`);
  }
}

async function testRetrieveAnalytics(quoteId) {
  console.log('\n📈 Test 4: Retrieve Tracking Analytics');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const response = await fetch(`${BASE_URL}/api/quotes/business/${quoteId}/track`);
    const data = await response.json();

    if (data.success) {
      console.log('✅ Analytics retrieved successfully');
      console.log(`   Total Views: ${data.data.total_views}`);
      console.log(`   Unique Views: ${data.data.unique_views}`);
      console.log(`   Total Time Spent: ${data.data.total_time_spent_seconds} seconds`);
      console.log(`   Emails Sent: ${data.data.emails_sent}`);
      console.log(`   Shares: ${data.data.shares}`);
      console.log(`   Downloads: ${data.data.downloads}`);

      if (data.data.tracking_events && data.data.tracking_events.length > 0) {
        console.log(`\n   Recent Events (${data.data.tracking_events.length}):`);
        data.data.tracking_events.slice(0, 3).forEach((event, index) => {
          console.log(`   ${index + 1}. ${event.event_type} - ${new Date(event.created_at).toLocaleString()}`);
          if (event.viewer_ip) console.log(`      IP: ${event.viewer_ip}`);
          if (event.session_id) console.log(`      Session: ${event.session_id.substring(0, 8)}...`);
        });
      }
    } else {
      console.log('❌ Failed to retrieve analytics');
      console.log(`   Error: ${data.error}`);
    }
  } catch (error) {
    console.log('❌ Error retrieving analytics');
    console.log(`   ${error.message}`);
  }
}

async function testShareLinkRevocation(quoteId) {
  console.log('\n🚫 Test 5: Revoke Share Link');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const response = await fetch(`${BASE_URL}/api/quotes/business/${quoteId}/share`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Share link revoked successfully');
      console.log(`   Message: ${data.message}`);
    } else {
      console.log('❌ Failed to revoke share link');
      console.log(`   Error: ${data.error}`);
    }
  } catch (error) {
    console.log('❌ Error revoking share link');
    console.log(`   ${error.message}`);
  }
}

async function runAllTests() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║   Quote Sharing & Tracking System - Test Suite           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log(`\nBase URL: ${BASE_URL}`);
  console.log(`Quote ID: ${QUOTE_ID}`);
  console.log('\n⚠️  Note: Make sure you have a valid quote ID in the database');
  console.log('   and that the dev server is running.');

  // Test 1: Generate share link
  const shareToken = await testShareLinkGeneration();
  if (!shareToken) {
    console.log('\n❌ Cannot continue tests - share link generation failed');
    console.log('   Please check:');
    console.log('   1. Quote ID exists in database');
    console.log('   2. Migration has been applied');
    console.log('   3. Admin authentication is not required for test');
    return;
  }

  // Wait a moment
  await new Promise(resolve => setTimeout(resolve, 500));

  // Test 2: Resolve token
  const resolvedQuoteId = await testTokenResolution(shareToken);
  if (!resolvedQuoteId) {
    console.log('\n⚠️  Token resolution failed, but continuing with other tests...');
  }

  // Wait a moment
  await new Promise(resolve => setTimeout(resolve, 500));

  // Test 3: Track event
  await testTrackingEvent(QUOTE_ID);

  // Wait a moment
  await new Promise(resolve => setTimeout(resolve, 500));

  // Test 4: Retrieve analytics
  await testRetrieveAnalytics(QUOTE_ID);

  // Wait a moment
  await new Promise(resolve => setTimeout(resolve, 500));

  // Test 5: Revoke share link
  await testShareLinkRevocation(QUOTE_ID);

  // Summary
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║   Test Suite Completed                                    ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
}

// Run tests
runAllTests().catch(error => {
  console.error('\n❌ Fatal error running tests:', error);
  process.exit(1);
});
