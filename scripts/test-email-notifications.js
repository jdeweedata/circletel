/**
 * Email Notification Testing Script
 *
 * Tests Resend + Supabase email integration for:
 * 1. Account verification emails
 * 2. Password reset emails
 *
 * Usage:
 *   node scripts/test-email-notifications.js
 */

require('dotenv').config({ path: '.env.local' });
const readline = require('readline');

const COLORS = {
  GREEN: '\x1b[32m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  CYAN: '\x1b[36m',
  RESET: '\x1b[0m',
  BOLD: '\x1b[1m'
};

const STATUS = {
  PASS: '✅',
  FAIL: '❌',
  WARN: '⚠️',
  INFO: 'ℹ️',
  LOADING: '⏳'
};

function log(status, message, details = '') {
  const color =
    status === STATUS.PASS ? COLORS.GREEN :
    status === STATUS.FAIL ? COLORS.RED :
    status === STATUS.WARN ? COLORS.YELLOW :
    status === STATUS.LOADING ? COLORS.CYAN :
    COLORS.BLUE;

  console.log(`${color}${status} ${message}${COLORS.RESET}`);
  if (details) {
    console.log(`   ${details}`);
  }
}

function section(title) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`${COLORS.BOLD}${COLORS.CYAN}${title}${COLORS.RESET}`);
  console.log('='.repeat(70));
}

function ask(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(`${COLORS.YELLOW}${question}${COLORS.RESET} `, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function checkEnvironmentVariables() {
  section('STEP 1: Environment Variables Check');

  const requiredVars = {
    'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    'RESEND_API_KEY': process.env.RESEND_API_KEY
  };

  let allPresent = true;

  for (const [key, value] of Object.entries(requiredVars)) {
    if (!value) {
      log(STATUS.FAIL, `${key} not found in .env.local`);
      allPresent = false;
    } else {
      log(STATUS.PASS, `${key} found`);
      if (key === 'RESEND_API_KEY') {
        log(STATUS.INFO, `Key: ${value.substring(0, 10)}...${value.substring(value.length - 4)}`);
      }
    }
  }

  if (!allPresent) {
    log(STATUS.FAIL, 'Missing required environment variables');
    log(STATUS.INFO, 'Add them to .env.local and restart this script');
    return false;
  }

  return true;
}

async function checkResendAPI() {
  section('STEP 2: Resend API Connection Test');

  const apiKey = process.env.RESEND_API_KEY;

  try {
    log(STATUS.LOADING, 'Testing connection to Resend API...');

    const response = await fetch('https://api.resend.com/domains', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      log(STATUS.FAIL, 'Failed to connect to Resend API');
      log(STATUS.INFO, `Status: ${response.status}`, errorData.message || 'Unknown error');
      return false;
    }

    const data = await response.json();
    log(STATUS.PASS, 'Successfully connected to Resend API');

    if (data.data && data.data.length > 0) {
      log(STATUS.INFO, `Found ${data.data.length} domain(s):`);
      data.data.forEach(domain => {
        const statusIcon = domain.status === 'verified' ? STATUS.PASS : STATUS.WARN;
        log(statusIcon, `  ${domain.name} (${domain.status})`);
      });

      // Check for CircleTel domain
      const circletelDomain = data.data.find(d => d.name.includes('circletel'));
      if (circletelDomain) {
        if (circletelDomain.status === 'verified') {
          log(STATUS.PASS, 'CircleTel domain is verified and ready!');
          return true;
        } else {
          log(STATUS.WARN, 'CircleTel domain found but not verified');
          log(STATUS.INFO, 'Verify domain at: https://resend.com/domains');
          return false;
        }
      } else {
        log(STATUS.WARN, 'No CircleTel domain found in Resend');
        log(STATUS.INFO, 'Add domain at: https://resend.com/domains');
        return false;
      }
    } else {
      log(STATUS.WARN, 'No domains configured in Resend');
      return false;
    }
  } catch (error) {
    log(STATUS.FAIL, 'Error connecting to Resend API');
    log(STATUS.INFO, error.message);
    return false;
  }
}

async function testAccountCreation() {
  section('STEP 3: Test Account Creation Email');

  console.log('\n');
  log(STATUS.INFO, 'This will create a test account and trigger verification email');
  log(STATUS.INFO, 'The email will be sent via Supabase → Resend');
  console.log('\n');

  const testEmail = await ask('Enter test email address: ');

  if (!testEmail || !testEmail.includes('@')) {
    log(STATUS.FAIL, 'Invalid email address');
    return false;
  }

  const testPassword = 'TestPassword123!';
  log(STATUS.INFO, `Test password: ${testPassword} (for testing only)`);

  console.log('\n');
  const proceed = await ask('Proceed with account creation? (yes/no): ');

  if (proceed.toLowerCase() !== 'yes' && proceed.toLowerCase() !== 'y') {
    log(STATUS.INFO, 'Test skipped');
    return false;
  }

  try {
    log(STATUS.LOADING, 'Creating test account via Supabase Auth...');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const response = await fetch(`${supabaseUrl}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        options: {
          data: {
            first_name: 'Test',
            last_name: 'User'
          }
        }
      })
    });

    const result = await response.json();

    if (!response.ok) {
      log(STATUS.FAIL, 'Failed to create account');
      log(STATUS.INFO, result.error_description || result.msg || 'Unknown error');

      if (result.msg && result.msg.includes('already registered')) {
        log(STATUS.WARN, 'Email already registered - try password reset test instead');
      }

      return false;
    }

    log(STATUS.PASS, 'Account created successfully!');
    log(STATUS.INFO, `User ID: ${result.user?.id || 'N/A'}`);

    console.log('\n');
    log(STATUS.PASS, 'Verification email should be sent now!');
    console.log('\n');
    log(STATUS.INFO, 'Check your inbox:');
    console.log(`   Email: ${testEmail}`);
    console.log(`   From: CircleTel <noreply@notifications.circletelsa.co.za>`);
    console.log(`   Subject: Verify Your CircleTel Account`);
    console.log('\n');
    log(STATUS.INFO, 'Also check:');
    console.log('   - Spam/Junk folder');
    console.log('   - Promotions tab (Gmail)');
    console.log('   - Resend logs: https://resend.com/emails');
    console.log('\n');

    const emailReceived = await ask('Did you receive the email? (yes/no): ');

    if (emailReceived.toLowerCase() === 'yes' || emailReceived.toLowerCase() === 'y') {
      log(STATUS.PASS, 'Email verification test PASSED! ✨');

      console.log('\n');
      const brandingCheck = await ask('Does the email have CircleTel branding (orange header)? (yes/no): ');

      if (brandingCheck.toLowerCase() === 'yes' || brandingCheck.toLowerCase() === 'y') {
        log(STATUS.PASS, 'Branding check PASSED!');
        log(STATUS.INFO, 'Contact info: contactus@circletel.co.za / 087 087 6305');
      } else {
        log(STATUS.WARN, 'Branding might not be applied correctly');
        log(STATUS.INFO, 'Check Supabase email templates are uploaded');
      }

      return true;
    } else {
      log(STATUS.FAIL, 'Email not received');
      console.log('\n');
      log(STATUS.INFO, 'Troubleshooting steps:');
      console.log('   1. Check Resend logs: https://resend.com/emails');
      console.log('   2. Verify Supabase SMTP settings');
      console.log('   3. Check domain verification status');
      console.log('   4. Wait a few more minutes (delivery can be delayed)');
      return false;
    }

  } catch (error) {
    log(STATUS.FAIL, 'Error during account creation test');
    log(STATUS.INFO, error.message);
    return false;
  }
}

async function testPasswordReset() {
  section('STEP 4: Test Password Reset Email');

  console.log('\n');
  log(STATUS.INFO, 'This will trigger a password reset email');
  log(STATUS.INFO, 'The email will be sent via Supabase → Resend');
  console.log('\n');

  const testEmail = await ask('Enter email address (must be registered): ');

  if (!testEmail || !testEmail.includes('@')) {
    log(STATUS.FAIL, 'Invalid email address');
    return false;
  }

  console.log('\n');
  const proceed = await ask('Proceed with password reset? (yes/no): ');

  if (proceed.toLowerCase() !== 'yes' && proceed.toLowerCase() !== 'y') {
    log(STATUS.INFO, 'Test skipped');
    return false;
  }

  try {
    log(STATUS.LOADING, 'Sending password reset request...');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const response = await fetch(`${supabaseUrl}/auth/v1/recover`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: testEmail
      })
    });

    if (!response.ok) {
      const result = await response.json();
      log(STATUS.FAIL, 'Failed to send password reset');
      log(STATUS.INFO, result.error_description || result.msg || 'Unknown error');
      return false;
    }

    log(STATUS.PASS, 'Password reset request sent!');

    console.log('\n');
    log(STATUS.PASS, 'Password reset email should be sent now!');
    console.log('\n');
    log(STATUS.INFO, 'Check your inbox:');
    console.log(`   Email: ${testEmail}`);
    console.log(`   From: CircleTel <noreply@notifications.circletelsa.co.za>`);
    console.log(`   Subject: Reset Your CircleTel Password`);
    console.log('\n');
    log(STATUS.INFO, 'Also check:');
    console.log('   - Spam/Junk folder');
    console.log('   - Resend logs: https://resend.com/emails');
    console.log('\n');

    const emailReceived = await ask('Did you receive the email? (yes/no): ');

    if (emailReceived.toLowerCase() === 'yes' || emailReceived.toLowerCase() === 'y') {
      log(STATUS.PASS, 'Password reset email test PASSED! ✨');

      console.log('\n');
      const brandingCheck = await ask('Does the email have CircleTel branding (orange header)? (yes/no): ');

      if (brandingCheck.toLowerCase() === 'yes' || brandingCheck.toLowerCase() === 'y') {
        log(STATUS.PASS, 'Branding check PASSED!');
      } else {
        log(STATUS.WARN, 'Branding might not be applied correctly');
        log(STATUS.INFO, 'Check Supabase email templates are uploaded');
      }

      return true;
    } else {
      log(STATUS.FAIL, 'Email not received');
      console.log('\n');
      log(STATUS.INFO, 'Troubleshooting steps:');
      console.log('   1. Check Resend logs: https://resend.com/emails');
      console.log('   2. Verify Supabase SMTP settings');
      console.log('   3. Check that email address is registered');
      console.log('   4. Wait a few more minutes');
      return false;
    }

  } catch (error) {
    log(STATUS.FAIL, 'Error during password reset test');
    log(STATUS.INFO, error.message);
    return false;
  }
}

async function checkResendLogs() {
  section('STEP 5: Check Resend Logs');

  console.log('\n');
  log(STATUS.INFO, 'Checking recent emails in Resend...');

  const apiKey = process.env.RESEND_API_KEY;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      log(STATUS.WARN, 'Could not fetch Resend logs');
      log(STATUS.INFO, 'Check manually at: https://resend.com/emails');
      return;
    }

    const data = await response.json();

    if (data.data && data.data.length > 0) {
      log(STATUS.PASS, `Found ${data.data.length} recent email(s):`);
      console.log('\n');

      data.data.slice(0, 5).forEach((email, index) => {
        console.log(`${COLORS.CYAN}Email ${index + 1}:${COLORS.RESET}`);
        console.log(`   To: ${email.to}`);
        console.log(`   Subject: ${email.subject || 'N/A'}`);
        console.log(`   Status: ${email.last_event || 'sent'}`);
        console.log(`   Created: ${new Date(email.created_at).toLocaleString()}`);
        console.log('');
      });

      log(STATUS.INFO, 'View all logs at: https://resend.com/emails');
    } else {
      log(STATUS.WARN, 'No emails found in Resend');
      log(STATUS.INFO, 'This might mean emails are not being sent through Resend');
      log(STATUS.INFO, 'Check Supabase SMTP configuration');
    }

  } catch (error) {
    log(STATUS.WARN, 'Error fetching Resend logs');
    log(STATUS.INFO, error.message);
    log(STATUS.INFO, 'Check manually at: https://resend.com/emails');
  }
}

async function main() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║          CircleTel Email Notification Testing Tool                ║');
  console.log('║              Resend + Supabase Integration Test                    ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝');
  console.log('\n');

  // Step 1: Check environment variables
  const envOk = await checkEnvironmentVariables();
  if (!envOk) {
    log(STATUS.FAIL, 'Setup incomplete - fix environment variables first');
    process.exit(1);
  }

  // Step 2: Check Resend API
  const resendOk = await checkResendAPI();
  if (!resendOk) {
    log(STATUS.WARN, 'Resend API issues detected - emails might not send');
    console.log('\n');
    const continueAnyway = await ask('Continue with tests anyway? (yes/no): ');
    if (continueAnyway.toLowerCase() !== 'yes' && continueAnyway.toLowerCase() !== 'y') {
      log(STATUS.INFO, 'Tests cancelled');
      process.exit(0);
    }
  }

  // Step 3: Test account creation
  console.log('\n');
  const testSignup = await ask('Test account creation email? (yes/no): ');
  let signupPassed = false;

  if (testSignup.toLowerCase() === 'yes' || testSignup.toLowerCase() === 'y') {
    signupPassed = await testAccountCreation();
  } else {
    log(STATUS.INFO, 'Account creation test skipped');
  }

  // Step 4: Test password reset
  console.log('\n');
  const testReset = await ask('Test password reset email? (yes/no): ');
  let resetPassed = false;

  if (testReset.toLowerCase() === 'yes' || testReset.toLowerCase() === 'y') {
    resetPassed = await testPasswordReset();
  } else {
    log(STATUS.INFO, 'Password reset test skipped');
  }

  // Step 5: Check Resend logs
  await checkResendLogs();

  // Summary
  section('TEST SUMMARY');
  console.log('\n');

  log(STATUS.INFO, 'Environment Variables:', envOk ? 'PASS ✅' : 'FAIL ❌');
  log(STATUS.INFO, 'Resend API Connection:', resendOk ? 'PASS ✅' : 'WARN ⚠️');

  if (testSignup.toLowerCase() === 'yes' || testSignup.toLowerCase() === 'y') {
    log(STATUS.INFO, 'Account Creation Email:', signupPassed ? 'PASS ✅' : 'FAIL ❌');
  }

  if (testReset.toLowerCase() === 'yes' || testReset.toLowerCase() === 'y') {
    log(STATUS.INFO, 'Password Reset Email:', resetPassed ? 'PASS ✅' : 'FAIL ❌');
  }

  console.log('\n');

  if (signupPassed && resetPassed) {
    log(STATUS.PASS, 'All tests PASSED! Your email integration is working! 🎉');
  } else if (signupPassed || resetPassed) {
    log(STATUS.WARN, 'Some tests passed - check configuration for failures');
  } else {
    log(STATUS.FAIL, 'Tests failed - check Supabase SMTP configuration');
    console.log('\n');
    log(STATUS.INFO, 'Next steps:');
    console.log('   1. Verify Supabase SMTP settings are correct');
    console.log('   2. Check Resend domain is verified');
    console.log('   3. Ensure email templates are uploaded to Supabase');
    console.log('   4. Check Resend logs for error messages');
  }

  console.log('\n');
  log(STATUS.INFO, 'Useful links:');
  console.log('   - Resend Dashboard: https://resend.com/overview');
  console.log('   - Resend Emails: https://resend.com/emails');
  console.log('   - Supabase Auth: https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/settings/auth');
  console.log('\n');
}

// Run tests
main().catch(error => {
  console.error(`${COLORS.RED}Unexpected error:${COLORS.RESET}`, error);
  process.exit(1);
});
