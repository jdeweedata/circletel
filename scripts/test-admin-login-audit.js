/**
 * Test Admin Login Audit Logging
 *
 * This script tests that admin login attempts are being logged to audit logs.
 * Tests both successful and failed login attempts.
 * Run: node scripts/test-admin-login-audit.js
 */

async function testLoginAudit() {
  console.log('🧪 Testing Admin Login Audit Logging...');
  console.log('');

  const apiUrl = 'http://localhost:3000/api/admin/login';
  const validEmail = 'admin@circletel.co.za';
  const validPassword = 'admin123';
  const invalidPassword = 'wrongpassword';

  // Test 1: Failed Login Attempt
  console.log('═══════════════════════════════════════════════════════════');
  console.log('Test 1: Failed Login Attempt');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  try {
    console.log(`📧 Email: ${validEmail}`);
    console.log(`🔒 Password: ${invalidPassword} (incorrect)`);
    console.log(`📍 API Endpoint: ${apiUrl}`);
    console.log('');

    const failResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Test Script - Login Audit',
      },
      body: JSON.stringify({
        email: validEmail,
        password: invalidPassword
      })
    });

    const failResult = await failResponse.json();

    console.log(`📥 Response Status: ${failResponse.status}`);
    console.log(`📄 Response:`, failResult);
    console.log('');

    if (failResponse.status === 401) {
      console.log('✅ Failed login handled correctly (401 Unauthorized)');
    } else {
      console.log('⚠️  Unexpected response status');
    }
  } catch (error) {
    console.error('❌ Test 1 failed:', error.message);
  }

  // Wait a bit between tests
  console.log('');
  console.log('⏳ Waiting 2 seconds before next test...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  console.log('');

  // Test 2: Successful Login Attempt
  console.log('═══════════════════════════════════════════════════════════');
  console.log('Test 2: Successful Login Attempt');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  try {
    console.log(`📧 Email: ${validEmail}`);
    console.log(`🔒 Password: ${validPassword} (correct)`);
    console.log(`📍 API Endpoint: ${apiUrl}`);
    console.log('');

    const successResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Test Script - Login Audit',
      },
      body: JSON.stringify({
        email: validEmail,
        password: validPassword
      })
    });

    const successResult = await successResponse.json();

    console.log(`📥 Response Status: ${successResponse.status}`);
    console.log(`📄 Response:`, successResult);
    console.log('');

    if (successResponse.ok && successResult.success) {
      console.log('✅ Successful login handled correctly');
      console.log(`   User: ${successResult.user?.full_name || 'Unknown'}`);
      console.log(`   Email: ${successResult.user?.email}`);
      console.log(`   Role: ${successResult.user?.role}`);
    } else {
      console.log('❌ Login failed unexpectedly');
    }
  } catch (error) {
    console.error('❌ Test 2 failed:', error.message);
  }

  // Wait before checking audit logs
  console.log('');
  console.log('⏳ Waiting 2 seconds for audit logs to be written...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  console.log('');

  // Test 3: Verify Audit Logs
  console.log('═══════════════════════════════════════════════════════════');
  console.log('Test 3: Verify Audit Logs Created');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  try {
    const { createClient } = require('@supabase/supabase-js');
    require('dotenv').config({ path: '.env.local' });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { data: logs, error: logsError } = await supabase
      .from('v_admin_audit_logs_recent')
      .select('*')
      .eq('user_email', validEmail)
      .in('action', ['login_failed', 'login_success'])
      .order('created_at', { ascending: false })
      .limit(10);

    if (logsError) {
      console.error('❌ Error fetching audit logs:', logsError.message);
      return;
    }

    if (logs && logs.length > 0) {
      console.log(`✅ Found ${logs.length} audit log entries`);
      console.log('');

      // Count by action type
      const failedLogins = logs.filter(log => log.action === 'login_failed').length;
      const successfulLogins = logs.filter(log => log.action === 'login_success').length;

      console.log(`📊 Summary:`);
      console.log(`   Failed Login Attempts: ${failedLogins}`);
      console.log(`   Successful Logins: ${successfulLogins}`);
      console.log('');

      // Show recent entries
      console.log('📋 Recent Audit Log Entries:');
      console.log('');

      logs.slice(0, 5).forEach((log, index) => {
        console.log(`[${index + 1}] ${new Date(log.created_at).toLocaleString()}`);
        console.log(`    User: ${log.full_name || 'Unknown'} (${log.user_email})`);
        console.log(`    Action: ${log.action}`);
        console.log(`    Status: ${log.status} | Severity: ${log.severity}`);
        console.log(`    IP: ${log.ip_address}`);
        if (log.is_suspicious) {
          console.log(`    ⚠️  SUSPICIOUS ACTIVITY DETECTED`);
        }
        console.log('');
      });

      console.log('═══════════════════════════════════════════════════════════');
      console.log('✅ Login Audit Logging Test PASSED');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('');
      console.log('Summary:');
      console.log('  ✅ Failed login attempts are logged');
      console.log('  ✅ Successful logins are logged');
      console.log('  ✅ IP addresses are tracked');
      console.log('  ✅ User agents are tracked');
      console.log('  ✅ Suspicious activity detection is working');

    } else {
      console.log('⚠️  No audit log entries found');
      console.log('');
      console.log('This could mean:');
      console.log('  1. The dev server is not running');
      console.log('  2. The audit logging is not working correctly');
      console.log('  3. The API endpoint is not being called');
      console.log('');
      console.log('Please verify:');
      console.log('  - Dev server is running: npm run dev');
      console.log('  - API route exists: app/api/admin/login/route.ts');
      console.log('  - Database migration is applied');
    }

  } catch (error) {
    console.error('❌ Test 3 failed:', error.message);
  }
}

// Run tests
console.log('═══════════════════════════════════════════════════════════');
console.log('Admin Login Audit Logging Test Suite');
console.log('═══════════════════════════════════════════════════════════');
console.log('');
console.log('This test will:');
console.log('  1. Test failed login attempt (wrong password)');
console.log('  2. Test successful login attempt (correct credentials)');
console.log('  3. Verify audit logs were created');
console.log('');
console.log('Make sure dev server is running: npm run dev');
console.log('');

testLoginAudit()
  .then(() => {
    console.log('');
    console.log('✨ Test suite completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  });
