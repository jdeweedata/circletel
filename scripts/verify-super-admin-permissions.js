/**
 * Verify and Fix Super Admin Permissions
 *
 * Ensures jeffrey.de.wee@circletel.co.za has:
 * - Super Admin role template
 * - ALL permissions granted
 * - No restrictions
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'Set' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySuperAdmin() {
  console.log('🔍 Checking Super Admin: jeffrey.de.wee@circletel.co.za\n');

  // 1. Check if user exists
  const { data: user, error: userError } = await supabase
    .from('admin_users')
    .select('*')
    .eq('email', 'jeffrey.de.wee@circletel.co.za')
    .single();

  if (userError || !user) {
    console.error('❌ Super admin user not found in database');
    console.error('Error:', userError?.message);
    return null;
  }

  console.log('✅ User found:', {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role_template_id: user.role_template_id || '(none)',
    is_active: user.is_active,
    created_at: user.created_at
  });
  console.log('');

  // 2. Check role template
  let role = null;
  if (user.role_template_id) {
    const { data: roleData, error: roleError} = await supabase
      .from('role_templates')
      .select('*')
      .eq('id', user.role_template_id)
      .single();

    if (roleError) {
      console.error('⚠️ Role template not found');
      console.error('Error:', roleError?.message);
    } else {
      role = roleData;
    }
  } else {
    console.log('⚠️ User has NO role_template_id assigned\n');
  }

  if (role) {
    console.log('📋 Current Role Template:', {
      id: role.id,
      name: role.name,
      description: role.description,
      department: role.department,
      level: role.level,
      permissions_count: role.permissions?.length || 0
    });
    console.log('');

    // 3. Check permissions
    console.log('🔑 Current Permissions:');
    if (role.permissions && role.permissions.length > 0) {
      console.log(`   Total: ${role.permissions.length} permissions`);

      // Group by category
      const byCategory = {};
      role.permissions.forEach(perm => {
        const [category] = perm.split(':');
        if (!byCategory[category]) byCategory[category] = [];
        byCategory[category].push(perm);
      });

      Object.entries(byCategory).forEach(([category, perms]) => {
        console.log(`   ${category}: ${perms.length} permissions`);
      });
    } else {
      console.log('   ⚠️ NO PERMISSIONS GRANTED!');
    }
    console.log('');

    // 4. Check if role is "Super Admin"
    if (role.name !== 'Super Admin') {
      console.log('⚠️ User is not assigned "Super Admin" role');
      console.log(`   Current role: ${role.name}`);
      console.log('');
    }
  }

  // 5. Check if has all product permissions
  const requiredPermissions = [
    'products:read',
    'products:create',
    'products:edit',
    'products:delete',
    'products:manage_pricing',
    'products:manage_categories',
    'products:manage_features',
    'products:view_audit_logs',
    'products:manage_providers'
  ];

  const currentPermissions = role?.permissions || [];
  const missingPermissions = requiredPermissions.filter(
    perm => !currentPermissions.includes(perm)
  );

  if (missingPermissions.length > 0) {
    console.log('❌ Missing Product Permissions:');
    missingPermissions.forEach(perm => console.log(`   - ${perm}`));
    console.log('');
  } else if (role) {
    console.log('✅ Has all required product permissions');
    console.log('');
  }

  return { user, role, missingPermissions };
}

async function fixSuperAdmin() {
  console.log('🔧 Fixing Super Admin Permissions...\n');

  // Get or create Super Admin role template with ALL permissions
  const allPermissions = [
    // Products
    'products:read',
    'products:create',
    'products:edit',
    'products:delete',
    'products:manage_pricing',
    'products:manage_categories',
    'products:manage_features',
    'products:view_audit_logs',
    'products:manage_providers',
    // Orders
    'orders:read',
    'orders:create',
    'orders:edit',
    'orders:delete',
    'orders:manage_status',
    'orders:view_payments',
    'orders:refund',
    // Users
    'users:read',
    'users:create',
    'users:edit',
    'users:delete',
    'users:manage_roles',
    // Admin
    'admin:view_dashboard',
    'admin:manage_settings',
    'admin:view_analytics',
    'admin:manage_system',
    // Quotes
    'quotes:read',
    'quotes:create',
    'quotes:edit',
    'quotes:delete',
    'quotes:approve',
    // Customers
    'customers:read',
    'customers:create',
    'customers:edit',
    'customers:delete',
    // Reports
    'reports:view',
    'reports:export',
    // Coverage
    'coverage:read',
    'coverage:manage',
    // Leads
    'leads:read',
    'leads:create',
    'leads:edit',
    'leads:delete',
    // Partners
    'partners:read',
    'partners:create',
    'partners:edit',
    'partners:delete',
    'partners:approve'
  ];

  // Check if Super Admin role template exists
  let { data: superAdminRole } = await supabase
    .from('role_templates')
    .select('*')
    .eq('name', 'Super Admin')
    .maybeSingle();

  if (!superAdminRole) {
    console.log('📝 Creating Super Admin role template...');
    const { data: newRole, error: createError } = await supabase
      .from('role_templates')
      .insert({
        id: 'super-admin',
        name: 'Super Admin',
        description: 'Full system access with all permissions - unrestricted access to all features',
        department: 'Executive',
        level: 'executive',
        permissions: allPermissions,
        is_default: false,
        is_active: true,
        color: '#DC2626',
        icon: 'ShieldCheck'
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Failed to create Super Admin role:', createError.message);
      return;
    }
    superAdminRole = newRole;
    console.log('✅ Super Admin role template created');
  } else {
    console.log('📝 Updating Super Admin role template permissions...');
    const { error: updateError } = await supabase
      .from('role_templates')
      .update({
        permissions: allPermissions,
        description: 'Full system access with all permissions - unrestricted access to all features',
        level: 'executive',
        is_active: true
      })
      .eq('id', superAdminRole.id);

    if (updateError) {
      console.error('❌ Failed to update role:', updateError.message);
      return;
    }
    console.log('✅ Super Admin role template updated with all permissions');
  }

  // Assign role template to jeffrey.de.wee@circletel.co.za
  console.log('\n📝 Assigning Super Admin role to jeffrey.de.wee@circletel.co.za...');
  const { error: assignError } = await supabase
    .from('admin_users')
    .update({
      role_template_id: superAdminRole.id,
      is_active: true,
      department: 'Executive',
      job_title: 'Super Administrator'
    })
    .eq('email', 'jeffrey.de.wee@circletel.co.za');

  if (assignError) {
    console.error('❌ Failed to assign role:', assignError.message);
    return;
  }

  console.log('✅ Super Admin role assigned successfully\n');
  console.log('📊 Summary:');
  console.log(`   Role: ${superAdminRole.name}`);
  console.log(`   Permissions: ${allPermissions.length} total`);
  console.log(`   User: jeffrey.de.wee@circletel.co.za`);
  console.log(`   Status: Active`);
  console.log(`   Department: Executive`);
  console.log(`   Level: executive`);
  console.log('');
  console.log('🎉 Super Admin is now configured with FULL UNRESTRICTED ACCESS!');
}

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('     Super Admin Permission Verification');
  console.log('═══════════════════════════════════════════════════\n');

  const result = await verifySuperAdmin();

  if (!result) {
    console.log('❌ Verification failed. Cannot proceed with fix.\n');
    process.exit(1);
  }

  const needsFix = !result.role ||
                   result.missingPermissions.length > 0 ||
                   result.role?.name !== 'Super Admin';

  if (needsFix) {
    console.log('🔧 Issues detected. Applying fix...\n');
    console.log('═══════════════════════════════════════════════════\n');
    await fixSuperAdmin();
  } else {
    console.log('✅ Super Admin is properly configured!');
    console.log('   No changes needed.\n');
  }
}

main().catch(console.error);
