require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function checkRLSSecurity() {
  console.log('🔒 CircleTel Supabase Security Audit\n');
  console.log('=' .repeat(70));

  // Tables that MUST have RLS enabled
  const criticalTables = [
    'service_packages',
    'coverage_leads',
    'orders',
    'consumer_orders',
    'customers',
    'admin_users',
    'partners',
    'partner_compliance_documents',
    'business_quotes',
    'kyc_documents'
  ];

  const allTables = [
    ...criticalTables,
    'role_templates',
    'permissions',
    'fttb_network_providers',
    'partner_leads',
    'partner_commissions',
    'quote_line_items',
    'api_usage_logs'
  ];

  let issues = [];
  let warnings = [];

  console.log('\n📋 Checking RLS Status...\n');

  // Check RLS status using information_schema
  for (const table of allTables) {
    try {
      // Try to query the table with anon key (should fail if RLS is working)
      const anonSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        { auth: { persistSession: false } }
      );

      const { data, error } = await anonSupabase
        .from(table)
        .select('*')
        .limit(1);

      const isCritical = criticalTables.includes(table);

      if (!error && data !== null) {
        // Table is accessible without auth - potential security issue
        if (isCritical) {
          issues.push({
            severity: 'CRITICAL',
            table,
            issue: 'Table accessible without authentication (RLS may be disabled or policy too permissive)'
          });
          console.log(`🔴 CRITICAL: ${table.padEnd(35)} - Accessible without auth!`);
        } else {
          warnings.push({
            severity: 'WARNING',
            table,
            issue: 'Table accessible without authentication'
          });
          console.log(`🟡 WARNING:  ${table.padEnd(35)} - Accessible without auth`);
        }
      } else if (error && error.code === 'PGRST116') {
        // RLS is enabled and blocking access
        console.log(`✅ SECURE:   ${table.padEnd(35)} - RLS enabled & blocking`);
      } else if (error && error.code === '42501') {
        // Permission denied - RLS is working
        console.log(`✅ SECURE:   ${table.padEnd(35)} - RLS enabled & blocking`);
      } else if (error) {
        console.log(`⚠️  UNKNOWN:  ${table.padEnd(35)} - ${error.message.substring(0, 30)}`);
      }
    } catch (e) {
      console.log(`❌ ERROR:    ${table.padEnd(35)} - ${e.message.substring(0, 30)}`);
    }
  }

  // Check for common security issues
  console.log('\n\n🔍 Checking Common Security Issues...\n');

  // 1. Check if admin_users has proper policies
  try {
    const { count } = await supabase
      .from('admin_users')
      .select('*', { count: 'exact', head: true });

    if (count > 0) {
      console.log(`✅ Admin users table exists (${count} admins)`);
    }
  } catch (e) {
    warnings.push({
      severity: 'WARNING',
      table: 'admin_users',
      issue: 'Could not verify admin users table'
    });
  }

  // 2. Check sensitive data tables
  const sensitiveTables = ['customers', 'partner_compliance_documents', 'kyc_documents'];
  console.log('\n📦 Sensitive Data Tables:');

  for (const table of sensitiveTables) {
    try {
      const { count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      console.log(`   ${table.padEnd(35)} - ${count || 0} records (service role access)`);
    } catch (e) {
      console.log(`   ${table.padEnd(35)} - Error: ${e.message.substring(0, 30)}`);
    }
  }

  // 3. Check public access tables (these should be publicly readable)
  const publicTables = ['service_packages', 'fttb_network_providers'];
  console.log('\n🌐 Public Access Tables (should be readable):');

  for (const table of publicTables) {
    try {
      const anonSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );

      const { data, error } = await anonSupabase
        .from(table)
        .select('id')
        .limit(1);

      if (!error && data) {
        console.log(`   ✅ ${table.padEnd(35)} - Publicly readable (expected)`);
      } else {
        warnings.push({
          severity: 'INFO',
          table,
          issue: 'Public table may not be readable (check if intentional)'
        });
        console.log(`   ⚠️  ${table.padEnd(35)} - Not publicly readable`);
      }
    } catch (e) {
      console.log(`   ❌ ${table.padEnd(35)} - Error checking access`);
    }
  }

  // Summary
  console.log('\n\n' + '='.repeat(70));
  console.log('📊 Security Audit Summary\n');

  if (issues.length === 0 && warnings.length === 0) {
    console.log('✅ No critical security issues found!');
    console.log('✅ All tables appear to have proper RLS configuration.');
  } else {
    if (issues.length > 0) {
      console.log(`🔴 CRITICAL ISSUES: ${issues.length}\n`);
      issues.forEach((issue, i) => {
        console.log(`   ${i + 1}. [${issue.severity}] ${issue.table}`);
        console.log(`      ${issue.issue}\n`);
      });
    }

    if (warnings.length > 0) {
      console.log(`🟡 WARNINGS: ${warnings.length}\n`);
      warnings.forEach((warning, i) => {
        console.log(`   ${i + 1}. [${warning.severity}] ${warning.table}`);
        console.log(`      ${warning.issue}\n`);
      });
    }
  }

  // Recommendations
  console.log('\n💡 Security Recommendations:\n');
  console.log('   1. Enable RLS on ALL tables (especially sensitive data)');
  console.log('   2. Create specific policies for authenticated users');
  console.log('   3. Use auth.uid() to restrict data to owners');
  console.log('   4. Limit service_role key usage to backend only');
  console.log('   5. Regular audit logs review (api_usage_logs table)');
  console.log('   6. Enable MFA for admin accounts');
  console.log('\n   📚 See: .claude/skills/supabase-manager/references/rls_policies.md');
  console.log('        for RLS policy templates and best practices\n');

  console.log('='.repeat(70));
}

checkRLSSecurity().catch(console.error);
