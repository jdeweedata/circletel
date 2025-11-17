/**
 * Test Cron Job Management APIs
 *
 * Tests:
 * 1. GET /api/admin/integrations/cron - List all cron jobs
 * 2. POST /api/admin/integrations/cron/[id]/trigger - Manually trigger cron job
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
 * Test 1: GET /api/admin/integrations/cron
 */
async function testListCronJobs(token) {
  console.log('\n============================================================');
  console.log('Test 1: GET /api/admin/integrations/cron');
  console.log('============================================================\n');

  const response = await fetch(`${BASE_URL}/api/admin/integrations/cron`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('❌ Test 1 FAILED:', response.status, data);
    return { passed: false, cronJobId: null };
  }

  console.log('✅ Test 1 PASSED: Cron jobs list endpoint responded');
  console.log('\nSummary:');
  console.log(`  Total cron jobs: ${data.summary.total}`);
  console.log(`  Active: ${data.summary.active}`);
  console.log(`  Inactive: ${data.summary.inactive}`);

  console.log('\nBy Integration:');
  for (const [slug, count] of Object.entries(data.summary.byIntegration)) {
    console.log(`  ${slug}: ${count} cron jobs`);
  }

  console.log('\nPagination:');
  console.log(`  Total: ${data.pagination.total}`);
  console.log(`  Limit: ${data.pagination.limit}`);
  console.log(`  Offset: ${data.pagination.offset}`);
  console.log(`  Has More: ${data.pagination.hasMore}`);

  if (data.cronJobs && data.cronJobs.length > 0) {
    console.log('\nCron Jobs:');
    for (const job of data.cronJobs) {
      console.log(`\n  ${job.jobName} (${job.id}):`);
      console.log(`    Integration: ${job.integrationSlug}`);
      console.log(`    Schedule: ${job.schedule}`);
      console.log(`    Human Readable: ${job.humanReadableSchedule}`);
      console.log(`    URL: ${job.jobUrl}`);
      console.log(`    Active: ${job.isActive}`);
      console.log(`    Description: ${job.description}`);
      if (job.lastRunAt) {
        console.log(`    Last Run: ${job.lastRunAt} [${job.lastRunStatus}]`);
        console.log(`    Duration: ${job.lastRunDurationMs}ms`);
      }
    }
  }

  // Validate response structure
  if (
    !data.cronJobs ||
    !Array.isArray(data.cronJobs) ||
    !data.pagination ||
    !data.summary
  ) {
    console.error('❌ Response structure validation failed');
    return { passed: false, cronJobId: null };
  }

  console.log('\n✅ Response structure validated');

  // Return first cron job ID for subsequent tests
  const firstCronJobId = data.cronJobs.length > 0 ? data.cronJobs[0].id : null;
  return { passed: true, cronJobId: firstCronJobId };
}

/**
 * Test 2: POST /api/admin/integrations/cron/[id]/trigger
 */
async function testTriggerCronJob(token, cronJobId) {
  console.log('\n============================================================');
  console.log(`Test 2: POST /api/admin/integrations/cron/${cronJobId}/trigger`);
  console.log('============================================================\n');

  if (!cronJobId) {
    console.log('⚠️ Test 2 SKIPPED: No cron job ID available');
    return false;
  }

  console.log(`⚠️ WARNING: This will trigger the cron job: ${cronJobId}`);
  console.log('This may send real emails or perform actual operations!');
  console.log('Skipping trigger test in automated test suite.\n');
  console.log('To manually test, run:');
  console.log(
    `  POST ${BASE_URL}/api/admin/integrations/cron/${cronJobId}/trigger`
  );
  console.log(`  Authorization: Bearer <token>\n`);

  return true; // Skip actual trigger for safety

  /* Uncomment to actually trigger cron job
  const response = await fetch(
    `${BASE_URL}/api/admin/integrations/cron/${cronJobId}/trigger`,
    {
      method: 'POST',
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

  console.log('✅ Test 2 PASSED: Cron job trigger endpoint responded');
  console.log('\nTrigger Result:');
  console.log(`  Success: ${data.success}`);
  console.log(`  Cron Job: ${data.cronJobName} (${data.cronJobId})`);
  console.log(`  Integration: ${data.integrationSlug}`);
  console.log(`  URL: ${data.cronJobUrl}`);
  console.log(`  Status Code: ${data.execution.statusCode}`);
  console.log(`  Duration: ${data.execution.durationMs}ms`);

  if (data.execution.errorMessage) {
    console.log(`  Error: ${data.execution.errorMessage}`);
  }

  console.log(`  Message: ${data.message}`);

  if (data.execution.output) {
    console.log('\nExecution Output:');
    console.log(JSON.stringify(data.execution.output, null, 2));
  }

  // Validate response structure
  if (!data.execution || typeof data.success !== 'boolean') {
    console.error('❌ Response structure validation failed');
    return false;
  }

  console.log('\n✅ Response structure validated');
  return true;
  */
}

/**
 * Main test function
 */
async function runTests() {
  console.log('============================================================');
  console.log('Testing Cron Job Management APIs');
  console.log('============================================================\n');

  try {
    // Authenticate
    const token = await authenticateAdmin();
    if (!token) {
      console.error('❌ Failed to authenticate');
      process.exit(1);
    }
    console.log('✅ Authentication successful\n');

    // Test 1: List cron jobs
    const { passed: test1Passed, cronJobId } = await testListCronJobs(token);

    // Test 2: Trigger cron job (skipped for safety)
    const test2Passed = await testTriggerCronJob(token, cronJobId);

    // Summary
    console.log('\n============================================================');
    console.log('Test Summary');
    console.log('============================================================');
    console.log(`Test 1 (List Cron Jobs): ${test1Passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(
      `Test 2 (Trigger Cron Job): ${test2Passed ? '⚠️ SKIPPED' : '❌ FAILED'}`
    );

    if (test1Passed) {
      console.log('\n🎉 Core tests passed!');
      console.log(
        '\n📝 Note: Trigger test was skipped for safety. To manually test:'
      );
      console.log(
        `   POST ${BASE_URL}/api/admin/integrations/cron/${cronJobId}/trigger`
      );
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
