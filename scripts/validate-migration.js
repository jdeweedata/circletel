require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Corrected RLS Migration\n');
console.log('='.repeat(70));

// Read the corrected migration
const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20251101000001_enable_rls_all_tables_CORRECTED.sql');

if (!fs.existsSync(migrationPath)) {
  console.error('❌ Corrected migration file not found!');
  process.exit(1);
}

const sql = fs.readFileSync(migrationPath, 'utf8');

// Validation checks
console.log('📋 Running Validation Checks...\n');

const checks = [
  {
    name: 'admin_users.id reference',
    pattern: /auth\.uid\(\) = id/g,
    expected: true,
    description: 'admin_users uses id column (matches auth.users.id)'
  },
  {
    name: 'customers.auth_user_id reference',
    pattern: /auth\.uid\(\) = auth_user_id/g,
    expected: true,
    description: 'customers uses auth_user_id column'
  },
  {
    name: 'consumer_orders email matching',
    pattern: /SELECT email FROM customers WHERE auth_user_id = auth\.uid\(\)/g,
    expected: true,
    description: 'consumer_orders matches via email'
  },
  {
    name: 'kyc_documents.consumer_order_id',
    pattern: /consumer_order_id/g,
    expected: true,
    description: 'kyc_documents uses consumer_order_id (not user_id)'
  },
  {
    name: 'business_quotes.contact_email',
    pattern: /contact_email/g,
    expected: true,
    description: 'business_quotes uses contact_email'
  },
  {
    name: 'No user_id in SQL statements (wrong column)',
    validate: (sql) => {
      // Remove all comment lines
      const sqlNoComments = sql.split('\n')
        .filter(line => !line.trim().startsWith('--'))
        .join('\n');
      // Check for user_id (not auth_user_id)
      const matches = sqlNoComments.match(/[^_]user_id/g);
      return !matches || matches.length === 0;
    },
    expected: true,
    description: 'Should NOT use user_id in SQL (only in comments is OK)'
  },
  {
    name: 'Service role policies',
    pattern: /TO service_role/g,
    expected: true,
    description: 'Service role bypass policies included'
  },
  {
    name: 'Public read for packages',
    pattern: /Public can read service packages/g,
    expected: true,
    description: 'Public catalog access maintained'
  },
  {
    name: 'Public insert for coverage_leads',
    pattern: /Public can insert coverage leads/g,
    expected: true,
    description: 'Coverage checker public submission'
  }
];

let passed = 0;
let failed = 0;

checks.forEach((check, i) => {
  let testPassed = false;
  let matchCount = 0;

  if (check.validate) {
    // Custom validation function
    testPassed = check.validate(sql) === check.expected;
  } else {
    // Pattern matching
    const matches = sql.match(check.pattern);
    const found = matches && matches.length > 0;
    matchCount = matches ? matches.length : 0;
    testPassed = (found && check.expected) || (!found && !check.expected);
  }

  if (testPassed) {
    console.log(`✅ ${i + 1}. ${check.name}`);
    console.log(`   ${check.description}`);
    if (matchCount > 0) {
      console.log(`   Found: ${matchCount} occurrence(s)`);
    }
    passed++;
  } else {
    console.log(`❌ ${i + 1}. ${check.name}`);
    console.log(`   ${check.description}`);
    failed++;
  }
  console.log();
});

// Count statements
const statements = sql
  .split('\n')
  .filter(line => !line.trim().startsWith('--') && line.trim() !== '')
  .join('\n')
  .split(';')
  .filter(stmt => stmt.trim() !== '');

console.log('='.repeat(70));
console.log('📊 Validation Summary\n');
console.log(`   Total Checks: ${checks.length}`);
console.log(`   ✅ Passed: ${passed}`);
console.log(`   ❌ Failed: ${failed}`);
console.log(`\n   SQL Statements: ${statements.length - 1}`); // -1 for last empty
console.log('='.repeat(70));

if (failed === 0) {
  console.log('\n✅ VALIDATION PASSED! Migration is ready to apply.\n');
  console.log('Next steps:');
  console.log('1. Open Supabase Dashboard SQL Editor');
  console.log('2. Copy contents from: supabase/migrations/20251101000001_enable_rls_all_tables_CORRECTED.sql');
  console.log('3. Paste and Run');
  console.log('\n📋 Or follow the walkthrough: I\'ll guide you step-by-step!\n');
} else {
  console.log('\n❌ VALIDATION FAILED! Please review errors above.\n');
  process.exit(1);
}
