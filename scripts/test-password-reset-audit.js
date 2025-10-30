/**
 * Test Password Reset Audit Logging
 *
 * This script tests that password reset requests are being logged to audit logs.
 * Run: node scripts/test-password-reset-audit.js
 */

async function testPasswordResetAudit() {
  console.log('🧪 Testing Password Reset Audit Logging...');
  console.log('');

  try {
    const testEmail = 'jeffrey.de.wee@circletel.co.za';
    const apiUrl = 'http://localhost:3000/api/admin/forgot-password';

    console.log(`📧 Sending password reset request for: ${testEmail}`);
    console.log(`📍 API Endpoint: ${apiUrl}`);
    console.log('');

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Test Script)',
      },
      body: JSON.stringify({ email: testEmail })
    });

    const result = await response.json();

    console.log(`📥 Response Status: ${response.status}`);
    console.log(`📄 Response Body:`, result);
    console.log('');

    if (response.ok) {
      console.log('✅ Password reset request successful');
      console.log('');
      console.log('🔍 Now checking audit logs...');
      console.log('');

      // Wait a bit for the audit log to be written
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify audit log was created
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
        .eq('user_email', testEmail)
        .eq('action', 'password_reset_requested')
        .order('created_at', { ascending: false })
        .limit(1);

      if (logsError) {
        console.error('❌ Error fetching audit logs:', logsError.message);
        return;
      }

      if (logs && logs.length > 0) {
        const log = logs[0];
        console.log('✅ Audit log entry found!');
        console.log('');
        console.log('📋 Audit Log Details:');
        console.log(`   ID: ${log.id}`);
        console.log(`   User: ${log.full_name || 'Unknown'} (${log.user_email})`);
        console.log(`   Action: ${log.action}`);
        console.log(`   Category: ${log.action_category}`);
        console.log(`   Status: ${log.status}`);
        console.log(`   Severity: ${log.severity}`);
        console.log(`   IP Address: ${log.ip_address}`);
        console.log(`   Time: ${log.created_at}`);
        console.log(`   Suspicious: ${log.is_suspicious ? 'YES ⚠️' : 'No'}`);
        if (log.metadata) {
          console.log(`   Metadata:`, log.metadata);
        }
        console.log('');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('✅ Password Reset Audit Logging Test PASSED');
        console.log('═══════════════════════════════════════════════════════════');
      } else {
        console.log('⚠️  No audit log entry found');
        console.log('');
        console.log('This could mean:');
        console.log('  1. The audit logging is not working correctly');
        console.log('  2. The dev server is not running');
        console.log('  3. The table was not fully migrated');
        console.log('');
        console.log('Please check:');
        console.log('  - Is dev server running? (npm run dev)');
        console.log('  - Check app/api/admin/forgot-password/route.ts for audit logging code');
      }
    } else {
      console.error('❌ Password reset request failed');
      console.error('This might be expected if:');
      console.error('  - Dev server is not running');
      console.error('  - Email does not exist in admin_users table');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('');
    console.log('Make sure:');
    console.log('  1. Dev server is running: npm run dev');
    console.log('  2. Database migration is applied');
    console.log('  3. .env.local has correct Supabase credentials');
  }
}

// Run test
console.log('═══════════════════════════════════════════════════════════');
console.log('Password Reset Audit Logging Test');
console.log('═══════════════════════════════════════════════════════════');
console.log('');

testPasswordResetAudit()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  });
