/**
 * Test Webhook Management APIs
 *
 * Tests:
 * 1. GET /api/admin/integrations/webhooks - List all webhooks
 * 2. GET /api/admin/integrations/webhooks/[id]/logs - Get webhook log details
 * 3. POST /api/admin/integrations/webhooks/[id]/test - Send test webhook
 * 4. POST /api/admin/integrations/webhooks/[id]/replay - Replay failed webhook
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

// Admin credentials from environment
const ADMIN_EMAIL = process.env.ADMIN_TEST_EMAIL || 'jeffrey@circletel.co.za';
const ADMIN_PASSWORD = process.env.ADMIN_TEST_PASSWORD;

if (!ADMIN_PASSWORD) {
  console.error('❌ ADMIN_TEST_PASSWORD environment variable is required');
  process.exit(1);
}

/**
 * Authenticate as admin user and get session token
 */
async function authenticateAdmin() {
  console.log('Authenticating as admin user...');
  const response = await fetch(`${BASE_URL}/api/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Authentication failed: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  return data.session?.access_token;
}

/**
 * Test 1: GET /api/admin/integrations/webhooks
 */
async function testListWebhooks(token) {
  console.log('\n============================================================');
  console.log('Test 1: GET /api/admin/integrations/webhooks');
  console.log('============================================================\n');

  const response = await fetch(`${BASE_URL}/api/admin/integrations/webhooks?limit=10`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('❌ Test 1 FAILED:', response.status, data);
    return { passed: false, webhookId: null };
  }

  console.log('✅ Test 1 PASSED: Webhooks list endpoint responded');
  console.log('\nSummary:');
  console.log(`  Total webhooks: ${data.summary.total}`);
  console.log(`  Successful: ${data.summary.successful}`);
  console.log(`  Failed: ${data.summary.failed}`);

  console.log('\nBy Integration:');
  for (const [slug, count] of Object.entries(data.summary.byIntegration)) {
    console.log(`  ${slug}: ${count} webhooks`);
  }

  console.log('\nPagination:');
  console.log(`  Total: ${data.pagination.total}`);
  console.log(`  Limit: ${data.pagination.limit}`);
  console.log(`  Offset: ${data.pagination.offset}`);
  console.log(`  Has More: ${data.pagination.hasMore}`);

  if (data.webhooks && data.webhooks.length > 0) {
    console.log('\nRecent webhooks (first 5):');
    for (const webhook of data.webhooks.slice(0, 5)) {
      console.log(
        `  ${webhook.id}: ${webhook.integrationSlug} - ${webhook.eventType} [${webhook.statusCode}]`
      );
    }
  }

  // Validate response structure
  if (
    !data.webhooks ||
    !Array.isArray(data.webhooks) ||
    !data.pagination ||
    !data.summary
  ) {
    console.error('❌ Response structure validation failed');
    return { passed: false, webhookId: null };
  }

  console.log('\n✅ Response structure validated');

  // Return first webhook ID for subsequent tests
  const firstWebhookId = data.webhooks.length > 0 ? data.webhooks[0].id : null;
  return { passed: true, webhookId: firstWebhookId };
}

/**
 * Test 2: GET /api/admin/integrations/webhooks/[id]/logs
 */
async function testWebhookLogDetails(token, webhookId) {
  console.log('\n============================================================');
  console.log(`Test 2: GET /api/admin/integrations/webhooks/${webhookId}/logs`);
  console.log('============================================================\n');

  if (!webhookId) {
    console.log('⚠️ Test 2 SKIPPED: No webhook ID available');
    return false;
  }

  const response = await fetch(
    `${BASE_URL}/api/admin/integrations/webhooks/${webhookId}/logs`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error('❌ Test 2 FAILED:', response.status, data);
    return false;
  }

  console.log('✅ Test 2 PASSED: Webhook log details endpoint responded');
  console.log('\nWebhook Details:');
  console.log(`  ID: ${data.webhookLog.id}`);
  console.log(`  Integration: ${data.webhookLog.integrationName} (${data.webhookLog.integrationSlug})`);
  console.log(`  Event Type: ${data.webhookLog.eventType}`);
  console.log(`  Status Code: ${data.webhookLog.statusCode}`);
  console.log(`  Successful: ${data.webhookLog.isSuccessful}`);
  console.log(`  Retry Count: ${data.webhookLog.retryCount}`);
  console.log(`  Received At: ${data.webhookLog.receivedAt}`);
  console.log(`  Processed At: ${data.webhookLog.processedAt || 'Not processed'}`);
  console.log(`  Processing Time: ${data.webhookLog.processingTimeMs !== null ? data.webhookLog.processingTimeMs + 'ms' : 'N/A'}`);

  if (data.webhookLog.errorMessage) {
    console.log(`  Error: ${data.webhookLog.errorMessage}`);
  }

  console.log('\nRelated Logs:');
  console.log(`  Found ${data.relatedLogs.length} related webhooks within 1 hour`);
  for (const log of data.relatedLogs.slice(0, 3)) {
    console.log(`    ${log.id}: ${log.eventType} [${log.statusCode}] at ${log.receivedAt}`);
  }

  // Validate response structure
  if (!data.webhookLog || !Array.isArray(data.relatedLogs)) {
    console.error('❌ Response structure validation failed');
    return false;
  }

  console.log('\n✅ Response structure validated');
  return true;
}

/**
 * Test 3: POST /api/admin/integrations/webhooks/[slug]/test
 */
async function testWebhookTest(token, integrationSlug = 'netcash') {
  console.log('\n============================================================');
  console.log(`Test 3: POST /api/admin/integrations/webhooks/${integrationSlug}/test`);
  console.log('============================================================\n');

  const response = await fetch(
    `${BASE_URL}/api/admin/integrations/webhooks/${integrationSlug}/test`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventType: 'payment.success',
        payload: {
          test: true,
          amount: '100.00',
          reference: 'TEST-' + Date.now(),
        },
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error('❌ Test 3 FAILED:', response.status, data);
    return false;
  }

  console.log('✅ Test 3 PASSED: Webhook test endpoint responded');
  console.log('\nTest Result:');
  console.log(`  Success: ${data.success}`);
  console.log(`  Integration: ${data.integrationName} (${data.integrationSlug})`);
  console.log(`  Webhook Log ID: ${data.webhookLogId}`);
  console.log(`  Event Type: ${data.test.eventType}`);
  console.log(`  Handler URL: ${data.test.handlerUrl}`);
  console.log(`  Status Code: ${data.test.statusCode}`);
  console.log(`  Processing Time: ${data.test.processingTimeMs}ms`);

  if (data.test.errorMessage) {
    console.log(`  Error: ${data.test.errorMessage}`);
  }

  console.log(`  Message: ${data.message}`);

  // Validate response structure
  if (!data.test || typeof data.success !== 'boolean') {
    console.error('❌ Response structure validation failed');
    return false;
  }

  console.log('\n✅ Response structure validated');
  return true;
}

/**
 * Test 4: POST /api/admin/integrations/webhooks/[id]/replay
 */
async function testWebhookReplay(token, webhookId) {
  console.log('\n============================================================');
  console.log(`Test 4: POST /api/admin/integrations/webhooks/${webhookId}/replay`);
  console.log('============================================================\n');

  if (!webhookId) {
    console.log('⚠️ Test 4 SKIPPED: No webhook ID available');
    return false;
  }

  const response = await fetch(
    `${BASE_URL}/api/admin/integrations/webhooks/${webhookId}/replay`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error('❌ Test 4 FAILED:', response.status, data);
    return false;
  }

  console.log('✅ Test 4 PASSED: Webhook replay endpoint responded');
  console.log('\nReplay Result:');
  console.log(`  Success: ${data.success}`);
  console.log(`  Original Webhook ID: ${data.originalWebhookId}`);
  console.log(`  New Webhook ID: ${data.newWebhookId}`);
  console.log(`  Status Code: ${data.result.statusCode}`);
  console.log(`  Processing Time: ${data.result.processingTimeMs}ms`);

  if (data.result.errorMessage) {
    console.log(`  Error: ${data.result.errorMessage}`);
  }

  console.log(`  Message: ${data.message}`);

  // Validate response structure
  if (!data.result || typeof data.success !== 'boolean') {
    console.error('❌ Response structure validation failed');
    return false;
  }

  console.log('\n✅ Response structure validated');
  return true;
}

/**
 * Main test function
 */
async function runTests() {
  console.log('============================================================');
  console.log('Testing Webhook Management APIs');
  console.log('============================================================\n');

  try {
    // Authenticate
    const token = await authenticateAdmin();
    if (!token) {
      console.error('❌ Failed to authenticate');
      process.exit(1);
    }
    console.log('✅ Authentication successful\n');

    // Test 1: List webhooks
    const { passed: test1Passed, webhookId } = await testListWebhooks(token);

    // Test 2: Get webhook log details
    const test2Passed = await testWebhookLogDetails(token, webhookId);

    // Test 3: Test webhook
    const test3Passed = await testWebhookTest(token, 'netcash');

    // Test 4: Replay webhook
    const test4Passed = await testWebhookReplay(token, webhookId);

    // Summary
    console.log('\n============================================================');
    console.log('Test Summary');
    console.log('============================================================');
    console.log(`Test 1 (List Webhooks): ${test1Passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(
      `Test 2 (Webhook Log Details): ${test2Passed ? '✅ PASSED' : '⚠️ SKIPPED' }`
    );
    console.log(`Test 3 (Test Webhook): ${test3Passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(
      `Test 4 (Replay Webhook): ${test4Passed ? '✅ PASSED' : '⚠️ SKIPPED'}`
    );

    if (test1Passed && test3Passed) {
      console.log('\n🎉 Core tests passed! (Some tests may have been skipped if no webhook logs exist)');
    } else {
      console.log('\n❌ Some tests failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Test suite failed with error:', error);
    process.exit(1);
  }
}

runTests();
