/**
 * Test General Health APIs
 *
 * Tests:
 * 1. GET /api/admin/integrations/health - Health overview
 * 2. GET /api/admin/integrations/health/[slug] - Detailed metrics
 * 3. Response structure validation
 * 4. Data accuracy verification
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
 * Test 1: GET /api/admin/integrations/health
 */
async function testHealthOverview(token) {
  console.log('\n============================================================');
  console.log('Test 1: GET /api/admin/integrations/health');
  console.log('============================================================\n');

  const response = await fetch(`${BASE_URL}/api/admin/integrations/health`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('❌ Test 1 FAILED:', response.status, data);
    return false;
  }

  console.log('✅ Test 1 PASSED: Health overview endpoint responded');
  console.log('\nSummary:');
  console.log(`  Total integrations: ${data.summary.total}`);
  console.log(`  Healthy: ${data.summary.healthy}`);
  console.log(`  Degraded: ${data.summary.degraded}`);
  console.log(`  Down: ${data.summary.down}`);
  console.log(`  Unknown: ${data.summary.unknown}`);
  console.log(`  Active alerts: ${data.summary.activeAlerts}`);
  console.log(`  Suppressed alerts: ${data.summary.suppressedAlerts}`);
  console.log(`  Health checks enabled: ${data.summary.healthCheckEnabled}`);
  console.log(`  Last check: ${data.summary.lastCheckAt || 'Never'}`);

  console.log('\nIntegrations:');
  for (const integration of data.integrations) {
    const statusEmoji = {
      healthy: '✅',
      degraded: '⚠️',
      down: '❌',
      unknown: '❓',
    }[integration.healthStatus] || '❓';

    console.log(
      `  ${statusEmoji} ${integration.name} (${integration.slug}): ${integration.healthStatus}` +
        (integration.consecutiveFailures > 0
          ? ` - ${integration.consecutiveFailures} failures`
          : '')
    );
  }

  console.log('\nBy Category:');
  for (const [category, integrations] of Object.entries(data.byCategory)) {
    console.log(`  ${category}: ${integrations.length} integrations`);
  }

  // Validate response structure
  if (
    !data.summary ||
    !data.integrations ||
    !Array.isArray(data.integrations) ||
    !data.byCategory
  ) {
    console.error('❌ Response structure validation failed');
    return false;
  }

  console.log('\n✅ Response structure validated');
  return true;
}

/**
 * Test 2: GET /api/admin/integrations/health/[slug]
 */
async function testHealthDetail(token, slug) {
  console.log('\n============================================================');
  console.log(`Test 2: GET /api/admin/integrations/health/${slug}`);
  console.log('============================================================\n');

  const response = await fetch(`${BASE_URL}/api/admin/integrations/health/${slug}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('❌ Test 2 FAILED:', response.status, data);
    return false;
  }

  console.log('✅ Test 2 PASSED: Detailed health metrics endpoint responded');
  console.log('\nIntegration Details:');
  console.log(`  Name: ${data.integration.name}`);
  console.log(`  Slug: ${data.integration.slug}`);
  console.log(`  Category: ${data.integration.category}`);
  console.log(`  Health Status: ${data.integration.healthStatus}`);
  console.log(`  Consecutive Failures: ${data.integration.consecutiveFailures}`);
  console.log(`  Last Checked: ${data.integration.healthLastCheckedAt || 'Never'}`);
  console.log(`  Last Alert Sent: ${data.integration.lastAlertSentAt || 'Never'}`);
  console.log(`  Health Check Enabled: ${data.integration.healthCheckEnabled}`);
  console.log(
    `  Check Interval: ${data.integration.healthCheckIntervalMinutes} minutes`
  );

  if (data.oauthStatus) {
    console.log('\nOAuth Status:');
    console.log(`  Has Token: ${data.oauthStatus.hasToken}`);
    if (data.oauthStatus.hasToken) {
      console.log(`  Expires At: ${data.oauthStatus.expiresAt}`);
      console.log(`  Is Expired: ${data.oauthStatus.isExpired}`);
    }
  }

  console.log('\nMetrics:');
  console.log(
    `  Uptime (24h): ${data.metrics.uptime24h !== null ? data.metrics.uptime24h.toFixed(2) + '%' : 'N/A'}`
  );
  console.log(
    `  Uptime (7d): ${data.metrics.uptime7d !== null ? data.metrics.uptime7d.toFixed(2) + '%' : 'N/A'}`
  );
  console.log(`  Total Checks (24h): ${data.metrics.totalChecks24h}`);
  console.log(`  Total Checks (7d): ${data.metrics.totalChecks7d}`);

  console.log('\n24-Hour Health History:');
  console.log(`  Total checks: ${data.healthHistory24h.length}`);
  if (data.healthHistory24h.length > 0) {
    const recentChecks = data.healthHistory24h.slice(-5);
    console.log(`  Recent checks (last 5):`);
    for (const check of recentChecks) {
      console.log(
        `    ${check.timestamp}: ${check.status}${check.duration ? ` (${check.duration}ms)` : ''}`
      );
    }
  }

  console.log('\n7-Day Trend:');
  console.log(`  Total days: ${data.trend7d.length}`);
  for (const day of data.trend7d) {
    const uptimePercent = day.total > 0 ? ((day.healthy / day.total) * 100).toFixed(1) : 0;
    console.log(
      `    ${day.date}: ${uptimePercent}% uptime (${day.healthy}/${day.total} healthy)`
    );
  }

  if (data.webhookFailures) {
    console.log('\nWebhook Failures (24h):');
    console.log(`  Total failures: ${data.webhookFailures.total}`);
    if (data.webhookFailures.failures.length > 0) {
      console.log(`  Recent failures (last 5):`);
      for (const failure of data.webhookFailures.failures.slice(0, 5)) {
        console.log(
          `    ${failure.receivedAt}: ${failure.eventType} - ${failure.statusCode} - ${failure.errorMessage}`
        );
      }
    }
  }

  console.log('\nRecent Activity:');
  console.log(`  Total events: ${data.recentActivity.length}`);
  if (data.recentActivity.length > 0) {
    console.log(`  Recent events (last 5):`);
    for (const event of data.recentActivity.slice(0, 5)) {
      console.log(
        `    ${event.timestamp}: ${event.actionType} - ${event.description} [${event.result}]`
      );
    }
  }

  // Validate response structure
  if (
    !data.integration ||
    !data.metrics ||
    !Array.isArray(data.healthHistory24h) ||
    !Array.isArray(data.trend7d) ||
    !Array.isArray(data.recentActivity)
  ) {
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
  console.log('Testing General Health APIs');
  console.log('============================================================\n');

  try {
    // Authenticate
    const token = await authenticateAdmin();
    if (!token) {
      console.error('❌ Failed to authenticate');
      process.exit(1);
    }
    console.log('✅ Authentication successful\n');

    // Test 1: Health overview
    const test1Passed = await testHealthOverview(token);

    // Test 2: Health detail for zoho-crm
    const test2Passed = await testHealthDetail(token, 'zoho-crm');

    // Test 3: Health detail for netcash (non-OAuth integration)
    const test3Passed = await testHealthDetail(token, 'netcash');

    // Summary
    console.log('\n============================================================');
    console.log('Test Summary');
    console.log('============================================================');
    console.log(`Test 1 (Health Overview): ${test1Passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(
      `Test 2 (Health Detail - zoho-crm): ${test2Passed ? '✅ PASSED' : '❌ FAILED'}`
    );
    console.log(
      `Test 3 (Health Detail - netcash): ${test3Passed ? '✅ PASSED' : '❌ FAILED'}`
    );

    if (test1Passed && test2Passed && test3Passed) {
      console.log('\n🎉 All tests passed!');
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
