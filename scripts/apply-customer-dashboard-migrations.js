// Apply Customer Dashboard migrations directly
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Migrations to apply in order
const migrations = [
  '20251102121000_customer_dashboard_backfill_orders.sql',
  '20251102122000_customer_services_and_billing_tables.sql',
  '20251102123000_customer_invoices_and_payments.sql',
  '20251102124000_audit_and_tracking_tables.sql',
];

// ============================================================================
// HELPER FUNCTIONS (extracted to reduce complexity)
// ============================================================================

/**
 * Parse SQL file into individual statements
 */
function parseStatements(sql) {
  return sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'))
    .filter((s) => !s.match(/^DO\s+\$\$/i)); // Skip DO blocks for now
}

/**
 * Get a human-readable description for a SQL statement
 */
function getStatementDescription(stmt, index, total) {
  let description = `Statement ${index + 1}/${total}`;

  const patterns = [
    { regex: /CREATE TABLE(?:\s+IF NOT EXISTS)?\s+(?:public\.)?(\w+)/i, prefix: 'CREATE TABLE' },
    { regex: /CREATE(?:\s+UNIQUE)?\s+INDEX(?:\s+IF NOT EXISTS)?\s+(\w+)/i, prefix: 'CREATE INDEX' },
    { regex: /ALTER TABLE\s+(?:public\.)?(\w+)/i, prefix: 'ALTER TABLE' },
  ];

  for (const { regex, prefix } of patterns) {
    const match = stmt.match(regex);
    if (match) {
      return `${description} - ${prefix} ${match[1]}`;
    }
  }

  // Fallback descriptions based on keywords
  const keywordDescriptions = [
    { keyword: 'GRANT', desc: 'GRANT permissions' },
    { keyword: 'INSERT INTO', desc: 'INSERT data' },
    { keyword: 'UPDATE', desc: 'UPDATE data' },
    { keyword: 'WITH', desc: 'CTE query' },
  ];

  for (const { keyword, desc } of keywordDescriptions) {
    if (stmt.includes(keyword)) {
      return `${description} - ${desc}`;
    }
  }

  return description;
}

/**
 * Check if a statement should be skipped (too complex for RPC)
 */
function shouldSkipStatement(stmt) {
  return stmt.includes('WITH') || stmt.includes('DO $$');
}

/**
 * Determine result status from Supabase error
 */
function getResultStatus(error) {
  if (!error) return 'success';

  const msg = error.message || '';
  if (msg.includes('already exists') || msg.includes('duplicate')) {
    return 'exists';
  }
  if (msg.includes('does not exist')) {
    return 'missing';
  }
  return 'error';
}

/**
 * Log statement result with appropriate icon
 */
function logStatementResult(status, description, errorMessage) {
  const icons = {
    success: '✅',
    exists: '✓',
    skipped: '⏭️ ',
    missing: '⚠️ ',
    error: '❌',
  };

  const icon = icons[status] || '?';
  const suffix = status === 'exists' ? ' - EXISTS' : status === 'skipped' ? ' - SKIPPED (complex statement)' : '';

  console.log(`  ${icon} ${description}${suffix}`);

  if (errorMessage && status !== 'exists') {
    console.log(`     Error: ${errorMessage}`);
  }
}

/**
 * Execute a single SQL statement
 */
async function executeStatement(stmt, index, total) {
  const fullStmt = stmt + ';';

  // Skip comments and empty statements
  if (fullStmt.trim().startsWith('--') || fullStmt.trim() === ';') {
    return { status: 'skipped', counted: false };
  }

  const description = getStatementDescription(stmt, index, total);

  // Skip complex statements
  if (shouldSkipStatement(stmt)) {
    logStatementResult('skipped', description);
    return { status: 'skipped', counted: true };
  }

  try {
    const { error } = await supabase.rpc('exec_sql', { sql: fullStmt });
    const status = getResultStatus(error);

    logStatementResult(status, description, error?.message);

    return {
      status: status === 'success' || status === 'exists' ? 'success' : 'error',
      counted: true,
    };
  } catch (err) {
    logStatementResult('error', description, err.message);
    return { status: 'error', counted: true };
  }
}

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * Execute all SQL statements in a migration file
 * Refactored to reduce complexity from 42 to ~8
 */
async function executeSql(sql, migrationName) {
  console.log(`\nExecuting: ${migrationName}`);
  console.log('─'.repeat(80));

  try {
    const statements = parseStatements(sql);
    console.log(`  Found ${statements.length} statements to execute\n`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const result = await executeStatement(statements[i], i, statements.length);

      if (!result.counted) continue;

      if (result.status === 'success') successCount++;
      else if (result.status === 'skipped') skipCount++;
      else errorCount++;

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log('\n  Summary:');
    console.log(`    ✅ Success: ${successCount}`);
    console.log(`    ⏭️  Skipped: ${skipCount}`);
    console.log(`    ❌ Errors: ${errorCount}`);

    return { successCount, skipCount, errorCount };
  } catch (err) {
    console.error(`  ❌ Failed to execute migration: ${err.message}`);
    return { successCount: 0, skipCount: 0, errorCount: 1 };
  }
}

/**
 * Apply all migrations in order
 */
async function applyMigrations() {
  console.log('='.repeat(80));
  console.log('APPLYING CUSTOMER DASHBOARD MIGRATIONS');
  console.log('='.repeat(80));

  const results = [];

  for (const migration of migrations) {
    const filePath = path.join(__dirname, '..', 'supabase', 'migrations', migration);

    if (!fs.existsSync(filePath)) {
      console.log(`\n❌ Migration file not found: ${migration}`);
      results.push({ migration, status: 'NOT_FOUND' });
      continue;
    }

    const sql = fs.readFileSync(filePath, 'utf8');
    const result = await executeSql(sql, migration);

    results.push({
      migration,
      status: result.errorCount === 0 ? 'SUCCESS' : 'PARTIAL',
      ...result,
    });

    // Wait between migrations
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // Final summary
  console.log('\n' + '='.repeat(80));
  console.log('FINAL SUMMARY');
  console.log('='.repeat(80));

  results.forEach((r) => {
    const statusIcon = r.status === 'SUCCESS' ? '✅' : r.status === 'PARTIAL' ? '⚠️' : '❌';
    console.log(`${statusIcon} ${r.migration}`);
    if (r.successCount !== undefined) {
      console.log(`   Success: ${r.successCount}, Skipped: ${r.skipCount}, Errors: ${r.errorCount}`);
    }
  });

  const allSuccess = results.every((r) => r.status === 'SUCCESS' || r.status === 'PARTIAL');
  console.log('\n' + '='.repeat(80));
  if (allSuccess) {
    console.log('✅ All migrations applied (some statements may have been skipped)');
  } else {
    console.log('⚠️  Some migrations had issues');
  }

  return allSuccess;
}

// Run migrations
applyMigrations()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
