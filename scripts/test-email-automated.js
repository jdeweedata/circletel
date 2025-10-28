/**
 * Automated Email Notification Test
 * Non-interactive version for quick testing
 */

require('dotenv').config({ path: '.env.local' });

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

async function checkSetup() {
  section('STEP 1: Checking Configuration');

  const checks = {
    supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    resendKey: !!process.env.RESEND_API_KEY
  };

  if (checks.supabaseUrl) {
    log(STATUS.PASS, 'Supabase URL configured');
  } else {
    log(STATUS.FAIL, 'Supabase URL missing');
  }

  if (checks.supabaseKey) {
    log(STATUS.PASS, 'Supabase anon key configured');
  } else {
    log(STATUS.FAIL, 'Supabase anon key missing');
  }

  if (checks.resendKey) {
    log(STATUS.PASS, 'Resend API key configured');
    const key = process.env.RESEND_API_KEY;
    log(STATUS.INFO, `Key: ${key.substring(0, 10)}...${key.substring(key.length - 4)}`);
  } else {
    log(STATUS.FAIL, 'Resend API key missing');
  }

  return Object.values(checks).every(v => v);
}

async function testResendConnection() {
  section('STEP 2: Testing Resend API Connection');

  const apiKey = process.env.RESEND_API_KEY;

  try {
    log(STATUS.LOADING, 'Connecting to Resend API...');

    const response = await fetch('https://api.resend.com/domains', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      log(STATUS.FAIL, 'Failed to connect to Resend API');
      return false;
    }

    const data = await response.json();
    log(STATUS.PASS, 'Connected to Resend API');

    if (data.data && data.data.length > 0) {
      log(STATUS.INFO, `Found ${data.data.length} domain(s):`);
      data.data.forEach(domain => {
        const statusIcon = domain.status === 'verified' ? STATUS.PASS : STATUS.WARN;
        log(statusIcon, `  ${domain.name} (${domain.status})`);
      });

      const circletelDomain = data.data.find(d => d.name.includes('circletel'));
      if (circletelDomain && circletelDomain.status === 'verified') {
        log(STATUS.PASS, 'CircleTel domain verified!');
        return true;
      }
    }

    return false;
  } catch (error) {
    log(STATUS.FAIL, 'Error connecting to Resend API');
    log(STATUS.INFO, error.message);
    return false;
  }
}

async function testSupabaseAuth() {
  section('STEP 3: Testing Supabase Auth Configuration');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  try {
    log(STATUS.LOADING, 'Checking Supabase Auth endpoint...');

    const response = await fetch(`${supabaseUrl}/auth/v1/health`, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey
      }
    });

    if (response.ok) {
      log(STATUS.PASS, 'Supabase Auth is accessible');
      return true;
    } else {
      log(STATUS.WARN, 'Supabase Auth responded with non-200 status');
      return false;
    }
  } catch (error) {
    log(STATUS.FAIL, 'Error checking Supabase Auth');
    log(STATUS.INFO, error.message);
    return false;
  }
}

async function checkResendLogs() {
  section('STEP 4: Checking Recent Resend Emails');

  const apiKey = process.env.RESEND_API_KEY;

  try {
    log(STATUS.LOADING, 'Fetching recent emails from Resend...');

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
      log(STATUS.PASS, `Found ${data.data.length} recent email(s)`);
      console.log('');

      const recentEmails = data.data.slice(0, 5);
      recentEmails.forEach((email, index) => {
        console.log(`${COLORS.CYAN}Email ${index + 1}:${COLORS.RESET}`);
        console.log(`   To: ${email.to || email.to?.[0] || 'N/A'}`);
        console.log(`   Subject: ${email.subject || 'N/A'}`);
        console.log(`   Status: ${email.last_event || 'sent'}`);
        console.log(`   Created: ${new Date(email.created_at).toLocaleString()}`);
        console.log('');
      });

      log(STATUS.INFO, 'View all logs at: https://resend.com/emails');
    } else {
      log(STATUS.WARN, 'No emails found in Resend');
      log(STATUS.INFO, 'This might mean:');
      console.log('   - Supabase SMTP not configured yet');
      console.log('   - No emails sent recently');
      console.log('   - Check Supabase SMTP settings');
    }

  } catch (error) {
    log(STATUS.WARN, 'Error fetching Resend logs');
    log(STATUS.INFO, error.message);
  }
}

async function verifySupabaseSMTP() {
  section('STEP 5: Supabase SMTP Configuration Check');

  console.log('');
  log(STATUS.INFO, 'Manual verification required:');
  console.log('');
  console.log('   1. Go to Supabase Dashboard:');
  console.log('      https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/settings/auth');
  console.log('');
  console.log('   2. Verify SMTP Settings:');
  console.log('      ✅ Custom SMTP: Enabled');
  console.log('      ✅ Host: smtp.resend.com');
  console.log('      ✅ Port: 587');
  console.log('      ✅ User: resend');
  console.log('      ✅ Password: [Your Resend API Key]');
  console.log('      ✅ Sender: noreply@notifications.circletelsa.co.za');
  console.log('      ✅ Name: CircleTel');
  console.log('');
  console.log('   3. Verify Email Templates:');
  console.log('      https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/auth/templates');
  console.log('      ✅ Confirm signup: CircleTel branding uploaded');
  console.log('      ✅ Reset password: CircleTel branding uploaded');
  console.log('');
}

async function testCreateAccount() {
  section('STEP 6: Live Test - Create Account Email');

  console.log('');
  log(STATUS.INFO, 'To test account creation email:');
  console.log('');
  console.log('   1. Go to: https://circletel-staging.vercel.app/order/account');
  console.log('   2. Fill in the form with a test email');
  console.log('   3. Click "Create Account"');
  console.log('   4. Check your inbox for verification email');
  console.log('');
  log(STATUS.INFO, 'Expected email:');
  console.log('   From: CircleTel <noreply@notifications.circletelsa.co.za>');
  console.log('   Subject: Verify Your CircleTel Account');
  console.log('   Content: Orange CircleTel header, verification button');
  console.log('   Footer: contactus@circletel.co.za / 087 087 6305');
  console.log('');
}

async function testPasswordReset() {
  section('STEP 7: Live Test - Password Reset Email');

  console.log('');
  log(STATUS.INFO, 'To test password reset email:');
  console.log('');
  console.log('   1. Go to: https://circletel-staging.vercel.app/auth/forgot-password');
  console.log('   2. Enter a registered email address');
  console.log('   3. Click "Send Reset Link"');
  console.log('   4. Check your inbox for reset email');
  console.log('');
  log(STATUS.INFO, 'Expected email:');
  console.log('   From: CircleTel <noreply@notifications.circletelsa.co.za>');
  console.log('   Subject: Reset Your CircleTel Password');
  console.log('   Content: Orange CircleTel header, reset button, security warning');
  console.log('   Footer: contactus@circletel.co.za / 087 087 6305');
  console.log('');
}

async function main() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║       CircleTel Email Integration - Automated Test Report         ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝');
  console.log('\n');

  const results = {
    setup: false,
    resend: false,
    supabase: false
  };

  // Run all checks
  results.setup = await checkSetup();
  if (!results.setup) {
    log(STATUS.FAIL, 'Setup incomplete - check environment variables');
    process.exit(1);
  }

  results.resend = await testResendConnection();
  results.supabase = await testSupabaseAuth();

  await checkResendLogs();
  await verifySupabaseSMTP();
  await testCreateAccount();
  await testPasswordReset();

  // Summary
  section('INTEGRATION TEST SUMMARY');
  console.log('');

  log(results.setup ? STATUS.PASS : STATUS.FAIL, 'Environment Configuration');
  log(results.resend ? STATUS.PASS : STATUS.FAIL, 'Resend API Connection');
  log(results.supabase ? STATUS.PASS : STATUS.FAIL, 'Supabase Auth Access');

  console.log('');

  if (results.setup && results.resend && results.supabase) {
    log(STATUS.PASS, 'Integration checks PASSED! 🎉');
    console.log('');
    log(STATUS.INFO, 'Next steps:');
    console.log('   1. Configure Supabase SMTP settings (see Step 5 above)');
    console.log('   2. Upload email templates to Supabase');
    console.log('   3. Test account creation (see Step 6 above)');
    console.log('   4. Test password reset (see Step 7 above)');
  } else {
    log(STATUS.WARN, 'Some checks failed - review errors above');
  }

  console.log('');
  log(STATUS.INFO, 'Useful links:');
  console.log('   - Resend Dashboard: https://resend.com/overview');
  console.log('   - Resend Emails: https://resend.com/emails');
  console.log('   - Supabase Auth: https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/settings/auth');
  console.log('   - Email Templates: https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/auth/templates');
  console.log('');
}

// Run automated tests
main().catch(error => {
  console.error(`${COLORS.RED}Unexpected error:${COLORS.RESET}`, error);
  process.exit(1);
});
