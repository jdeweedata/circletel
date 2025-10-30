/**
 * Verify Admin Audit Logs Table Structure
 *
 * This script verifies the audit logs table structure and displays sample data.
 * Run: node scripts/verify-audit-logs-table.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Error: Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function verifyTable() {
  console.log('🔍 Verifying admin_audit_logs table structure...');
  console.log('');

  try {
    // Query recent audit logs
    const { data, error } = await supabase
      .from('v_admin_audit_logs_recent')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Error querying audit logs:', error.message);
      process.exit(1);
    }

    console.log('✅ Table structure verified successfully!');
    console.log('');

    if (data && data.length > 0) {
      console.log(`📊 Found ${data.length} recent audit log entries:`);
      console.log('');

      data.forEach((log, index) => {
        console.log(`[${index + 1}] ${log.created_at}`);
        console.log(`    User: ${log.full_name || 'Unknown'} (${log.user_email})`);
        console.log(`    Action: ${log.action} (${log.action_category})`);
        console.log(`    Status: ${log.status} | Severity: ${log.severity}`);
        console.log(`    IP: ${log.ip_address}`);
        if (log.is_suspicious) {
          console.log(`    ⚠️  SUSPICIOUS ACTIVITY DETECTED`);
        }
        console.log('');
      });
    } else {
      console.log('ℹ️  No audit log entries found yet');
      console.log('');
      console.log('This is normal if this is the first time running the system.');
      console.log('Audit logs will be created when:');
      console.log('  - Admin users request password resets');
      console.log('  - Admin users log in');
      console.log('  - Admin users perform actions');
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ Audit logs system is ready!');
    console.log('═══════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run verification
verifyTable()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Verification failed:', error);
    process.exit(1);
  });
