/**
 * Verify CI/CD Setup for API Integration Tests
 *
 * This script checks that all required environment variables and
 * resources are properly configured for running API tests in CI/CD.
 *
 * Usage:
 *   node scripts/verify-ci-setup.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Color output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Required environment variables
const REQUIRED_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

const TEST_VARS = [
  'ADMIN_TEST_EMAIL',
  'ADMIN_TEST_PASSWORD'
];

async function checkEnvironmentVariables() {
  log('\n━━━ Checking Environment Variables ━━━', 'cyan');

  let allPresent = true;

  // Check required vars
  for (const varName of REQUIRED_VARS) {
    if (process.env[varName]) {
      log(`✅ ${varName}: SET`, 'green');
    } else {
      log(`❌ ${varName}: MISSING`, 'red');
      allPresent = false;
    }
  }

  // Check test vars (optional but recommended)
  for (const varName of TEST_VARS) {
    if (process.env[varName]) {
      log(`✅ ${varName}: SET`, 'green');
    } else {
      log(`⚠️  ${varName}: NOT SET (required for CI/CD)`, 'yellow');
    }
  }

  return allPresent;
}

async function checkSupabaseConnection() {
  log('\n━━━ Testing Supabase Connection ━━━', 'cyan');

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Test connection with simple query
    const { data, error } = await supabase
      .from('admin_users')
      .select('count')
      .limit(1);

    if (error) {
      log(`❌ Connection failed: ${error.message}`, 'red');
      return false;
    }

    log('✅ Supabase connection successful', 'green');
    return true;
  } catch (error) {
    log(`❌ Connection error: ${error.message}`, 'red');
    return false;
  }
}

async function checkAdminUser() {
  log('\n━━━ Checking Test Admin User ━━━', 'cyan');

  const testEmail = process.env.ADMIN_TEST_EMAIL;

  if (!testEmail) {
    log('⚠️  ADMIN_TEST_EMAIL not set - skipping', 'yellow');
    return false;
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase
      .from('admin_users')
      .select('email, role, is_active')
      .eq('email', testEmail)
      .maybeSingle();

    if (error) {
      log(`❌ Query error: ${error.message}`, 'red');
      return false;
    }

    if (!data) {
      log(`❌ Admin user not found: ${testEmail}`, 'red');
      log('   Run: node scripts/create-super-admin.js', 'yellow');
      return false;
    }

    if (!data.is_active) {
      log(`❌ Admin user is inactive: ${testEmail}`, 'red');
      return false;
    }

    log(`✅ Admin user found: ${data.email} (${data.role})`, 'green');
    return true;
  } catch (error) {
    log(`❌ Check failed: ${error.message}`, 'red');
    return false;
  }
}

async function checkTestPackages() {
  log('\n━━━ Checking Test Service Packages ━━━', 'cyan');

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase
      .from('service_packages')
      .select('id, name')
      .limit(5);

    if (error) {
      log(`❌ Query error: ${error.message}`, 'red');
      return false;
    }

    if (!data || data.length === 0) {
      log('❌ No service packages found', 'red');
      log('   Tests require at least one package for quote creation', 'yellow');
      return false;
    }

    log(`✅ Found ${data.length} service packages`, 'green');
    log(`   First package: ${data[0].name} (${data[0].id})`, 'blue');
    return true;
  } catch (error) {
    log(`❌ Check failed: ${error.message}`, 'red');
    return false;
  }
}

async function checkGitHubSecretsSetup() {
  log('\n━━━ GitHub Secrets Setup Instructions ━━━', 'cyan');

  log('\n📝 Required GitHub Secrets:', 'blue');
  log('   1. Navigate to: Settings → Secrets and variables → Actions');
  log('   2. Click "New repository secret" for each:');
  log('');

  const secrets = [
    { name: 'NEXT_PUBLIC_SUPABASE_URL', value: process.env.NEXT_PUBLIC_SUPABASE_URL },
    { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY },
    { name: 'SUPABASE_SERVICE_ROLE_KEY', value: process.env.SUPABASE_SERVICE_ROLE_KEY },
    { name: 'ADMIN_TEST_EMAIL', value: process.env.ADMIN_TEST_EMAIL || 'your-test-admin@example.com' },
    { name: 'ADMIN_TEST_PASSWORD', value: process.env.ADMIN_TEST_PASSWORD || 'YourSecurePassword123!' },
  ];

  secrets.forEach(({ name, value }) => {
    if (value && !value.startsWith('your-')) {
      log(`   ${name}: ${value.substring(0, 20)}...`, 'green');
    } else {
      log(`   ${name}: [NOT SET]`, 'yellow');
    }
  });

  log('\n⚠️  Important:', 'yellow');
  log('   - Use a TEST database (not production!)');
  log('   - Create a dedicated test admin user');
  log('   - Never commit secrets to the repository');
}

async function generateTestCommand() {
  log('\n━━━ Local Test Command ━━━', 'cyan');

  const testEmail = process.env.ADMIN_TEST_EMAIL || 'your-test-admin@example.com';
  const testPassword = process.env.ADMIN_TEST_PASSWORD || 'YourSecurePassword123!';

  log('\n📦 Run this command to test locally:', 'blue');
  log('');
  log(`ADMIN_TEST_EMAIL="${testEmail}" \\`, 'green');
  log(`ADMIN_TEST_PASSWORD="${testPassword}" \\`, 'green');
  log('node scripts/test-admin-quote-apis-authenticated.js', 'green');
  log('');
}

async function main() {
  log('╔═══════════════════════════════════════════════════════════════╗', 'cyan');
  log('║          CircleTel CI/CD Setup Verification                  ║', 'cyan');
  log('╚═══════════════════════════════════════════════════════════════╝', 'cyan');

  const checks = {
    env: await checkEnvironmentVariables(),
    connection: await checkSupabaseConnection(),
    adminUser: await checkAdminUser(),
    packages: await checkTestPackages(),
  };

  await checkGitHubSecretsSetup();
  await generateTestCommand();

  // Summary
  log('\n╔═══════════════════════════════════════════════════════════════╗', 'cyan');
  log('║                     VERIFICATION SUMMARY                      ║', 'cyan');
  log('╚═══════════════════════════════════════════════════════════════╝', 'cyan');

  const results = [
    { name: 'Environment Variables', passed: checks.env },
    { name: 'Supabase Connection', passed: checks.connection },
    { name: 'Test Admin User', passed: checks.adminUser },
    { name: 'Test Service Packages', passed: checks.packages },
  ];

  results.forEach(({ name, passed }) => {
    log(`   ${passed ? '✅' : '❌'} ${name}`, passed ? 'green' : 'red');
  });

  const allPassed = Object.values(checks).every(check => check);

  log('');
  if (allPassed) {
    log('🎉 All checks passed! Ready for CI/CD', 'green');
    log('');
    log('Next steps:', 'blue');
    log('   1. Configure GitHub Secrets (see above)');
    log('   2. Push changes to trigger workflow');
    log('   3. Monitor Actions tab for test results');
    log('');
    process.exit(0);
  } else {
    log('⚠️  Some checks failed - fix issues before enabling CI/CD', 'yellow');
    log('');
    log('Quick fixes:', 'blue');
    if (!checks.adminUser) {
      log('   → Create admin user: node scripts/create-super-admin.js');
    }
    if (!checks.packages) {
      log('   → Seed packages: npm run seed (or your seed command)');
    }
    log('');
    process.exit(1);
  }
}

main().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
