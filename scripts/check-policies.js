require('dotenv').config({ path: '.env.local' });

console.log('🔍 Checking if RLS Policies Were Created\n');
console.log('='.repeat(70));

console.log('\n⚠️  NOTE: Supabase JS Client cannot directly query pg_policies');
console.log('We need to check policies via Supabase Dashboard\n');

console.log('📋 To check policies in Supabase Dashboard:\n');
console.log('1. Go to: https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/sql/new');
console.log('2. Run this SQL query:\n');

const sqlQuery = `
-- Check RLS is enabled
SELECT tablename, rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'admin_users', 'customers', 'consumer_orders', 'partners',
    'partner_compliance_documents', 'kyc_documents', 'business_quotes',
    'coverage_leads', 'orders', 'service_packages',
    'fttb_network_providers', 'role_templates'
  )
ORDER BY tablename;

-- Check what policies exist
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as operation,
  qual as using_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'admin_users', 'customers', 'consumer_orders', 'partners',
    'partner_compliance_documents', 'kyc_documents', 'business_quotes',
    'coverage_leads', 'orders', 'service_packages',
    'fttb_network_providers', 'role_templates'
  )
ORDER BY tablename, policyname;

-- Count policies per table
SELECT
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'admin_users', 'customers', 'consumer_orders', 'partners',
    'partner_compliance_documents', 'kyc_documents', 'business_quotes',
    'coverage_leads', 'orders', 'service_packages',
    'fttb_network_providers', 'role_templates'
  )
GROUP BY tablename
ORDER BY tablename;
`;

console.log(sqlQuery);
console.log('\n' + '='.repeat(70));
console.log('\n✅ Copy and run the SQL above in Supabase Dashboard');
console.log('   This will show if policies were created successfully\n');

console.log('Expected policy counts per table:');
console.log('   admin_users: 3 policies');
console.log('   customers: 3 policies');
console.log('   consumer_orders: 3 policies');
console.log('   partners: 4 policies');
console.log('   partner_compliance_documents: 5 policies');
console.log('   kyc_documents: 3 policies');
console.log('   business_quotes: 3 policies');
console.log('   coverage_leads: 3 policies');
console.log('   orders: 2 policies');
console.log('   service_packages: 4 policies');
console.log('   fttb_network_providers: 3 policies');
console.log('   role_templates: 3 policies');
console.log('\n   TOTAL: 39 policies\n');
