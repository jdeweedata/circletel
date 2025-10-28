/**
 * Resend Email Integration Verification Script
 *
 * Checks if Resend is properly configured for CircleTel email sending
 *
 * Usage:
 *   node scripts/verify-resend-integration.js
 */

require('dotenv').config({ path: '.env.local' });

const CHECKS = {
  ENV_VAR: 'Environment Variable Check',
  API_CONNECTION: 'Resend API Connection',
  DOMAIN_STATUS: 'Domain Verification',
  TEMPLATE_FILES: 'Email Template Files',
  SUPABASE_CONFIG: 'Supabase Configuration'
};

const STATUS = {
  PASS: '✅',
  FAIL: '❌',
  WARN: '⚠️',
  INFO: 'ℹ️'
};

// Color codes for terminal output
const COLORS = {
  GREEN: '\x1b[32m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  RESET: '\x1b[0m'
};

function log(status, message, details = '') {
  const color =
    status === STATUS.PASS ? COLORS.GREEN :
    status === STATUS.FAIL ? COLORS.RED :
    status === STATUS.WARN ? COLORS.YELLOW :
    COLORS.BLUE;

  console.log(`${color}${status} ${message}${COLORS.RESET}`);
  if (details) {
    console.log(`   ${details}`);
  }
}

function section(title) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`${COLORS.BLUE}${title}${COLORS.RESET}`);
  console.log('='.repeat(60));
}

async function checkEnvironmentVariable() {
  section(CHECKS.ENV_VAR);

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    log(STATUS.FAIL, 'RESEND_API_KEY not found');
    log(STATUS.INFO, 'Add to .env.local:', 'RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
    return false;
  }

  if (!apiKey.startsWith('re_')) {
    log(STATUS.WARN, 'RESEND_API_KEY has unexpected format');
    log(STATUS.INFO, 'Should start with "re_"');
    return false;
  }

  log(STATUS.PASS, 'RESEND_API_KEY found');
  log(STATUS.INFO, `Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);
  return true;
}

async function checkAPIConnection() {
  section(CHECKS.API_CONNECTION);

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    log(STATUS.FAIL, 'Skipped (no API key)');
    return false;
  }

  try {
    // Test API connection by listing domains
    const response = await fetch('https://api.resend.com/domains', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      log(STATUS.FAIL, 'API request failed');
      log(STATUS.INFO, `Status: ${response.status}`, `Error: ${errorData.message || 'Unknown error'}`);
      return false;
    }

    const data = await response.json();
    log(STATUS.PASS, 'Successfully connected to Resend API');
    log(STATUS.INFO, `Found ${data.data?.length || 0} domain(s) configured`);
    return data;
  } catch (error) {
    log(STATUS.FAIL, 'Failed to connect to Resend API');
    log(STATUS.INFO, error.message);
    return false;
  }
}

async function checkDomainVerification(domainsData) {
  section(CHECKS.DOMAIN_STATUS);

  if (!domainsData || !domainsData.data) {
    log(STATUS.WARN, 'No domain data available');
    return false;
  }

  const domains = domainsData.data;
  const targetDomain = 'notifications.circletelsa.co.za';
  const circletelDomain = domains.find(d => d.name === targetDomain);

  if (!circletelDomain) {
    log(STATUS.WARN, `Domain "${targetDomain}" not found in Resend`);
    log(STATUS.INFO, 'Registered domains:');
    domains.forEach(d => {
      log(STATUS.INFO, `  - ${d.name} (${d.status})`);
    });
    log(STATUS.INFO, 'Add domain at: https://resend.com/domains');
    return false;
  }

  const isVerified = circletelDomain.status === 'verified';
  const status = isVerified ? STATUS.PASS : STATUS.WARN;

  log(status, `Domain: ${circletelDomain.name}`);
  log(STATUS.INFO, `Status: ${circletelDomain.status}`);
  log(STATUS.INFO, `Region: ${circletelDomain.region || 'N/A'}`);
  log(STATUS.INFO, `Created: ${new Date(circletelDomain.created_at).toLocaleDateString()}`);

  if (!isVerified) {
    log(STATUS.INFO, 'Verify domain at: https://resend.com/domains');
    log(STATUS.INFO, 'Add DNS records provided by Resend');
  }

  return isVerified;
}

async function checkTemplateFiles() {
  section(CHECKS.TEMPLATE_FILES);

  const fs = require('fs');
  const path = require('path');

  const templatePath = path.join(process.cwd(), 'lib', 'email', 'verification-templates.ts');

  if (!fs.existsSync(templatePath)) {
    log(STATUS.FAIL, 'Template file not found');
    log(STATUS.INFO, `Expected: ${templatePath}`);
    return false;
  }

  log(STATUS.PASS, 'Template file exists');
  log(STATUS.INFO, `Path: ${templatePath}`);

  // Check for required exports
  const content = fs.readFileSync(templatePath, 'utf-8');
  const requiredExports = [
    'getVerificationEmailHTML',
    'getPasswordResetEmailHTML',
    'getVerificationEmailText',
    'getPasswordResetEmailText'
  ];

  let allExportsFound = true;
  requiredExports.forEach(exportName => {
    if (content.includes(`export const ${exportName}`)) {
      log(STATUS.PASS, `Export found: ${exportName}`);
    } else {
      log(STATUS.FAIL, `Export missing: ${exportName}`);
      allExportsFound = false;
    }
  });

  return allExportsFound;
}

async function checkSupabaseConfiguration() {
  section(CHECKS.SUPABASE_CONFIG);

  log(STATUS.INFO, 'Manual verification required:');
  console.log('');
  console.log('   1. Go to Supabase Dashboard:');
  console.log('      https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/settings/auth');
  console.log('');
  console.log('   2. Check SMTP Settings:');
  console.log('      - Custom SMTP: Enabled');
  console.log('      - Host: smtp.resend.com');
  console.log('      - Port: 587');
  console.log('      - User: resend');
  console.log('      - Password: [Your Resend API Key]');
  console.log('      - Sender: noreply@notifications.circletelsa.co.za');
  console.log('      - Name: CircleTel');
  console.log('');
  console.log('   3. Check Email Templates:');
  console.log('      https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/auth/templates');
  console.log('      - Confirm signup: Updated with CircleTel branding');
  console.log('      - Reset password: Updated with CircleTel branding');
  console.log('');

  return true;
}

async function sendTestEmail() {
  section('Test Email Send (Optional)');

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    log(STATUS.INFO, 'Skipped (no API key)');
    return false;
  }

  // Ask if user wants to send test email
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('\nSend test email? (yes/no): ', async (answer) => {
      rl.close();

      if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
        log(STATUS.INFO, 'Test email skipped');
        resolve(false);
        return;
      }

      rl.question('Enter test email address: ', async (email) => {
        rl.close();

        if (!email || !email.includes('@')) {
          log(STATUS.FAIL, 'Invalid email address');
          resolve(false);
          return;
        }

        try {
          const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: 'CircleTel <noreply@notifications.circletelsa.co.za>',
              to: email,
              subject: 'Test Email from CircleTel',
              html: '<h1 style="color: #F5831F;">CircleTel Test Email</h1><p>If you received this, your Resend integration is working!</p>'
            })
          });

          if (!response.ok) {
            const errorData = await response.json();
            log(STATUS.FAIL, 'Failed to send test email');
            log(STATUS.INFO, errorData.message || 'Unknown error');
            resolve(false);
            return;
          }

          const result = await response.json();
          log(STATUS.PASS, 'Test email sent successfully!');
          log(STATUS.INFO, `Email ID: ${result.id}`);
          log(STATUS.INFO, `Check inbox: ${email}`);
          resolve(true);
        } catch (error) {
          log(STATUS.FAIL, 'Error sending test email');
          log(STATUS.INFO, error.message);
          resolve(false);
        }
      });
    });
  });
}

async function main() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     CircleTel - Resend Integration Verification Tool      ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  const results = {
    envVar: false,
    apiConnection: false,
    domainVerified: false,
    templatesExist: false
  };

  // Run checks
  results.envVar = await checkEnvironmentVariable();

  if (results.envVar) {
    const domainsData = await checkAPIConnection();
    results.apiConnection = !!domainsData;

    if (domainsData) {
      results.domainVerified = await checkDomainVerification(domainsData);
    }
  }

  results.templatesExist = await checkTemplateFiles();
  await checkSupabaseConfiguration();

  // Summary
  section('VERIFICATION SUMMARY');

  const checks = [
    { name: 'Environment Variable', status: results.envVar },
    { name: 'API Connection', status: results.apiConnection },
    { name: 'Domain Verification', status: results.domainVerified },
    { name: 'Template Files', status: results.templatesExist }
  ];

  checks.forEach(check => {
    log(check.status ? STATUS.PASS : STATUS.FAIL, check.name);
  });

  const allPassed = checks.every(c => c.status);

  console.log('\n');
  if (allPassed) {
    log(STATUS.PASS, 'All checks passed! Your Resend integration is ready.');
    log(STATUS.INFO, 'Next steps:');
    console.log('   1. Configure Supabase SMTP settings (see manual verification above)');
    console.log('   2. Upload email templates to Supabase dashboard');
    console.log('   3. Test by creating a new account on CircleTel');
  } else {
    log(STATUS.WARN, 'Some checks failed. Please review the errors above.');
    log(STATUS.INFO, 'See checklist:', 'docs/email-templates/RESEND_INTEGRATION_CHECKLIST.md');
  }

  console.log('\n');

  // Optional test email
  if (allPassed) {
    await sendTestEmail();
  }

  console.log('\n');
}

// Run verification
main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
