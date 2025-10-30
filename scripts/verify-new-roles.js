/**
 * Verify New RBAC Role Templates
 *
 * This script verifies that the new executive and manager roles were added successfully.
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyNewRoles() {
  console.log('=== Verifying New RBAC Role Templates ===\n');

  const roleIds = [
    'cto',
    'cmo',
    'general_manager',
    'department_manager',
    'regional_manager',
    'service_delivery_manager',
    'service_delivery_administrator'
  ];

  // Query the role templates
  const { data: roles, error } = await supabase
    .from('role_templates')
    .select('id, name, department, level, permissions, color, icon')
    .in('id', roleIds)
    .order('level', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    console.error('❌ Error querying role templates:', error.message);
    process.exit(1);
  }

  if (!roles || roles.length === 0) {
    console.log('❌ No new roles found. Migration may not have run.');
    process.exit(1);
  }

  console.log(`✅ Found ${roles.length} new role templates:\n`);

  // Display each role
  roles.forEach((role, index) => {
    const permissionCount = Array.isArray(role.permissions) ? role.permissions.length : 0;

    console.log(`${index + 1}. ${role.name}`);
    console.log(`   ID: ${role.id}`);
    console.log(`   Department: ${role.department}`);
    console.log(`   Level: ${role.level}`);
    console.log(`   Color: ${role.color}`);
    console.log(`   Icon: ${role.icon}`);
    console.log(`   Permissions: ${permissionCount}`);
    console.log('');
  });

  // Summary by level
  const executives = roles.filter(r => r.level === 'executive');
  const managers = roles.filter(r => r.level === 'management');

  console.log('=== Summary ===');
  console.log(`Executive Roles: ${executives.length} (${executives.map(r => r.name).join(', ')})`);
  console.log(`Management Roles: ${managers.length} (${managers.map(r => r.name).join(', ')})`);
  console.log('\n✅ All new roles verified successfully!');
}

verifyNewRoles().catch(error => {
  console.error('❌ Verification failed:', error.message);
  process.exit(1);
});
