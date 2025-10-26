/**
 * Google OAuth Configuration Verification Script
 *
 * This script checks if Google OAuth is properly configured in Supabase
 * and verifies all necessary redirect URLs are set correctly.
 *
 * Usage: node scripts/verify-google-oauth.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_KEY ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function verifyGoogleOAuthConfiguration() {
  console.log('\n🔍 Google OAuth Configuration Verification\n');
  console.log('=' .repeat(60));

  const results = {
    checks: [],
    errors: [],
    warnings: []
  };

  // 1. Check environment variables
  console.log('\n1️⃣  Checking Environment Variables...');
  console.log('-'.repeat(60));

  const envVars = {
    'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY,
    'NEXT_PUBLIC_APP_URL': process.env.NEXT_PUBLIC_APP_URL
  };

  for (const [key, value] of Object.entries(envVars)) {
    if (value) {
      console.log(`   ✓ ${key}: ${key.includes('KEY') ? '[HIDDEN]' : value}`);
      results.checks.push({ name: key, status: 'pass' });
    } else {
      console.log(`   ✗ ${key}: NOT SET`);
      results.errors.push(`${key} is not set`);
    }
  }

  // 2. Test Supabase connection
  console.log('\n2️⃣  Testing Supabase Connection...');
  console.log('-'.repeat(60));

  try {
    const { data, error } = await supabase.from('customers').select('count').limit(1);
    if (error) {
      console.log(`   ✗ Connection failed: ${error.message}`);
      results.errors.push(`Supabase connection error: ${error.message}`);
    } else {
      console.log('   ✓ Connected to Supabase successfully');
      results.checks.push({ name: 'Supabase Connection', status: 'pass' });
    }
  } catch (error) {
    console.log(`   ✗ Connection error: ${error.message}`);
    results.errors.push(`Supabase connection error: ${error.message}`);
  }

  // 3. Check OAuth redirect URLs
  console.log('\n3️⃣  Checking OAuth Redirect URLs...');
  console.log('-'.repeat(60));

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3006';
  const requiredRedirects = [
    `${appUrl}/auth/callback`,
    `${appUrl}/auth/callback?next=/order/service-address`,
    `${appUrl}/order/account`,
    'http://localhost:3000/auth/callback', // Development fallback
    'http://localhost:3006/auth/callback', // Alternative dev port
  ];

  console.log('\n   Required redirect URLs (must be added to Supabase Dashboard):');
  requiredRedirects.forEach(url => {
    console.log(`   • ${url}`);
  });

  console.log('\n   ⚠️  To configure redirect URLs in Supabase:');
  console.log('   1. Go to: https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/auth/url-configuration');
  console.log('   2. Add each URL above to "Redirect URLs" section');
  console.log('   3. Click "Save" after adding all URLs');

  // 4. Test OAuth provider availability
  console.log('\n4️⃣  Testing OAuth Provider Configuration...');
  console.log('-'.repeat(60));

  console.log('\n   To enable Google OAuth in Supabase:');
  console.log('   1. Go to: https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/auth/providers');
  console.log('   2. Enable "Google" provider');
  console.log('   3. Add your Google OAuth credentials:');
  console.log('      - Client ID (from Google Cloud Console)');
  console.log('      - Client Secret (from Google Cloud Console)');
  console.log('   4. Click "Save"');

  console.log('\n   Google Cloud Console setup:');
  console.log('   1. Go to: https://console.cloud.google.com/apis/credentials');
  console.log('   2. Create OAuth 2.0 Client ID (if not exists)');
  console.log('   3. Add authorized redirect URIs:');
  console.log('      - https://agyjovdugmtopasyvlng.supabase.co/auth/v1/callback');
  requiredRedirects.forEach(url => {
    console.log(`      - ${url}`);
  });

  // 5. Check customer creation endpoint
  console.log('\n5️⃣  Verifying Customer Creation Endpoint...');
  console.log('-'.repeat(60));

  try {
    // Check if the API route exists
    const fs = await import('fs');
    const path = await import('path');
    const apiRoutePath = path.resolve(process.cwd(), 'app/api/auth/create-customer/route.ts');

    if (fs.existsSync(apiRoutePath)) {
      console.log('   ✓ Customer creation API route exists');
      results.checks.push({ name: 'Customer Creation API', status: 'pass' });
    } else {
      console.log('   ✗ Customer creation API route not found');
      results.errors.push('Customer creation API route missing');
    }
  } catch (error) {
    console.log(`   ⚠️  Could not verify API route: ${error.message}`);
    results.warnings.push('Could not verify customer creation API route');
  }

  // 6. Check auth callback page
  console.log('\n6️⃣  Verifying Auth Callback Page...');
  console.log('-'.repeat(60));

  try {
    const fs = await import('fs');
    const path = await import('path');
    const callbackPagePath = path.resolve(process.cwd(), 'app/auth/callback/page.tsx');

    if (fs.existsSync(callbackPagePath)) {
      console.log('   ✓ Auth callback page exists');

      // Read the file to check for OAuth handling
      const content = fs.readFileSync(callbackPagePath, 'utf-8');

      if (content.includes('window.location.hash') && content.includes('access_token')) {
        console.log('   ✓ Callback page handles OAuth implicit flow');
        results.checks.push({ name: 'OAuth Implicit Flow Handler', status: 'pass' });
      } else {
        console.log('   ⚠️  Callback page may not handle OAuth implicit flow');
        results.warnings.push('OAuth implicit flow handler may be missing');
      }

      if (content.includes('exchangeCodeForSession')) {
        console.log('   ✓ Callback page handles PKCE flow');
        results.checks.push({ name: 'PKCE Flow Handler', status: 'pass' });
      } else {
        console.log('   ⚠️  Callback page may not handle PKCE flow');
        results.warnings.push('PKCE flow handler may be missing');
      }

      if (content.includes('create-customer')) {
        console.log('   ✓ Callback page creates customer records for OAuth users');
        results.checks.push({ name: 'OAuth Customer Creation', status: 'pass' });
      } else {
        console.log('   ⚠️  Callback page may not create customer records');
        results.warnings.push('OAuth customer record creation may be missing');
      }
    } else {
      console.log('   ✗ Auth callback page not found');
      results.errors.push('Auth callback page missing');
    }
  } catch (error) {
    console.log(`   ⚠️  Could not verify callback page: ${error.message}`);
    results.warnings.push('Could not verify auth callback page');
  }

  // 7. Check account creation page
  console.log('\n7️⃣  Verifying Account Creation Page...');
  console.log('-'.repeat(60));

  try {
    const fs = await import('fs');
    const path = await import('path');
    const accountPagePath = path.resolve(process.cwd(), 'app/order/account/page.tsx');

    if (fs.existsSync(accountPagePath)) {
      console.log('   ✓ Account creation page exists');

      const content = fs.readFileSync(accountPagePath, 'utf-8');

      if (content.includes('signInWithGoogle')) {
        console.log('   ✓ Google sign-in button implemented');
        results.checks.push({ name: 'Google Sign-In Button', status: 'pass' });
      } else {
        console.log('   ✗ Google sign-in button not found');
        results.errors.push('Google sign-in button missing from account page');
      }

      if (content.includes('handleGoogleSignIn')) {
        console.log('   ✓ Google sign-in handler implemented');
        results.checks.push({ name: 'Google Sign-In Handler', status: 'pass' });
      } else {
        console.log('   ✗ Google sign-in handler not found');
        results.errors.push('Google sign-in handler missing from account page');
      }
    } else {
      console.log('   ✗ Account creation page not found');
      results.errors.push('Account creation page missing');
    }
  } catch (error) {
    console.log(`   ⚠️  Could not verify account page: ${error.message}`);
    results.warnings.push('Could not verify account creation page');
  }

  // Summary
  console.log('\n');
  console.log('=' .repeat(60));
  console.log('📊 VERIFICATION SUMMARY');
  console.log('=' .repeat(60));

  const totalChecks = results.checks.length;
  const passedChecks = results.checks.filter(c => c.status === 'pass').length;

  console.log(`\n✓ Passed Checks: ${passedChecks}/${totalChecks}`);

  if (results.errors.length > 0) {
    console.log(`\n❌ Errors (${results.errors.length}):`);
    results.errors.forEach(err => console.log(`   • ${err}`));
  }

  if (results.warnings.length > 0) {
    console.log(`\n⚠️  Warnings (${results.warnings.length}):`);
    results.warnings.forEach(warn => console.log(`   • ${warn}`));
  }

  console.log('\n📋 NEXT STEPS:\n');
  console.log('1. Configure Google OAuth in Supabase Dashboard:');
  console.log('   → https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/auth/providers\n');

  console.log('2. Add redirect URLs in Supabase Dashboard:');
  console.log('   → https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/auth/url-configuration\n');

  console.log('3. Configure Google Cloud Console:');
  console.log('   → https://console.cloud.google.com/apis/credentials\n');

  console.log('4. Test the Google sign-in flow:');
  console.log('   → Visit: http://localhost:3006/order/account');
  console.log('   → Click "Continue with Google"');
  console.log('   → Complete OAuth flow');
  console.log('   → Should redirect to: /order/service-address\n');

  console.log('5. Monitor for errors in browser console during OAuth flow\n');

  if (results.errors.length === 0) {
    console.log('✅ Configuration looks good! Follow the next steps to complete setup.\n');
    return true;
  } else {
    console.log('❌ Please fix the errors above before testing OAuth flow.\n');
    return false;
  }
}

// Run verification
verifyGoogleOAuthConfiguration()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n❌ Verification failed:', error);
    process.exit(1);
  });
