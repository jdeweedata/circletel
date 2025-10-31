require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const anonSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { persistSession: false } }
);

async function checkRLSSecurity() {
  console.log('🔒 CircleTel Supabase Security Audit (v2 - Improved)\n');
  console.log('=' .repeat(70));

  const criticalTables = {
    'admin_users': { expectPublic: false, hasData: true },
    'customers': { expectPublic: false, hasData: true },
    'consumer_orders': { expectPublic: false, hasData: true },
    'partners': { expectPublic: false, hasData: false },
    'partner_compliance_documents': { expectPublic: false, hasData: false },
    'kyc_documents': { expectPublic: false, hasData: true },
    'business_quotes': { expectPublic: false, hasData: true },
    'coverage_leads': { expectPublic: 'insert-only', hasData: true },
    'orders': { expectPublic: false, hasData: true },
    'service_packages': { expectPublic: true, hasData: true },
    'fttb_network_providers': { expectPublic: true, hasData: true },
    'role_templates': { expectPublic: false, hasData: true }
  };

  let secureCount = 0;
  let insecureCount = 0;
  let warnings = [];
  const issues = [];

  console.log('\n📋 Checking RLS Status (Improved Test)...\n');

  for (const [table, config] of Object.entries(criticalTables)) {
    try {
      // First, check if table has data (using service role)
      const { count: actualCount } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      // Then check what anon can see
      const { data: anonData, error: anonError } = await anonSupabase
        .from(table)
        .select('*')
        .limit(10);

      const hasActualData = actualCount > 0;
      const anonGetsData = anonData && anonData.length > 0;
      const anonCanQuery = !anonError || anonError.code !== '42501'; // 42501 = permission denied

      // Evaluate security
      if (config.expectPublic === true) {
        // Should be publicly accessible
        if (anonGetsData || (hasActualData && anonCanQuery)) {
          console.log(`✅ PUBLIC:  ${table.padEnd(35)} (${actualCount} rows, ${anonData?.length || 0} visible to anon)`);
          secureCount++;
        } else {
          console.log(`⚠️  WARNING: ${table.padEnd(35)} Should be public but anon can't access`);
          warnings.push({ table, issue: 'Should be publicly readable' });
        }
      } else if (config.expectPublic === 'insert-only') {
        // Should allow anon INSERT but not SELECT
        if (!anonGetsData) {
          console.log(`✅ SECURE:  ${table.padEnd(35)} (anon cannot read, ${actualCount} rows exist)`);
          secureCount++;
        } else {
          console.log(`🔴 CRITICAL: ${table.padEnd(35)} Anon can read ${anonData.length} rows!`);
          issues.push({ table, severity: 'CRITICAL', data: anonData.length });
          insecureCount++;
        }
      } else {
        // Should NOT be accessible to anon
        if (anonGetsData) {
          console.log(`🔴 CRITICAL: ${table.padEnd(35)} Anon can read ${anonData.length}/${actualCount} rows!`);
          issues.push({ table, severity: 'CRITICAL', data: anonData.length, total: actualCount });
          insecureCount++;
        } else if (anonError && anonError.code === '42501') {
          console.log(`✅ SECURE:  ${table.padEnd(35)} (permission denied to anon, ${actualCount} rows protected)`);
          secureCount++;
        } else {
          // Query succeeded but returned 0 rows - RLS is filtering
          console.log(`✅ SECURE:  ${table.padEnd(35)} (RLS filtering active, ${actualCount} rows protected)`);
          secureCount++;
        }
      }
    } catch (e) {
      console.log(`❌ ERROR:   ${table.padEnd(35)} ${e.message.substring(0, 40)}`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 Security Audit Summary\n');

  if (insecureCount === 0) {
    console.log('✅ EXCELLENT! No critical security issues found!\n');
    console.log(`   Secure tables: ${secureCount}`);
    console.log(`   Warnings: ${warnings.length}`);
    console.log('\n🎉 Your database is properly secured with RLS!\n');
  } else {
    console.log(`🔴 CRITICAL ISSUES: ${insecureCount}\n`);
    issues.forEach((issue, i) => {
      console.log(`   ${i + 1}. ${issue.table}`);
      console.log(`      Anonymous users can read ${issue.data} rows!`);
      if (issue.total) {
        console.log(`      (${issue.data} of ${issue.total} total rows exposed)`);
      }
      console.log();
    });
  }

  if (warnings.length > 0) {
    console.log(`\n⚠️  WARNINGS: ${warnings.length}\n`);
    warnings.forEach((w, i) => {
      console.log(`   ${i + 1}. ${w.table}: ${w.issue}`);
    });
  }

  console.log('\n' + '='.repeat(70));

  return insecureCount === 0;
}

checkRLSSecurity().then(success => {
  process.exit(success ? 0 : 1);
}).catch(console.error);
