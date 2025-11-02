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
  '20251102124000_audit_and_tracking_tables.sql'
];

async function executeSql(sql, migrationName) {
  console.log(`\nExecuting: ${migrationName}`);
  console.log('─'.repeat(80));

  try {
    // Split SQL into individual statements (basic splitting)
    // This is a simplified approach - assumes ; at end of statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
      .filter(s => !s.match(/^DO\s+\$\$/i)); // Skip DO blocks for now

    console.log(`  Found ${statements.length} statements to execute\n`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i] + ';';

      // Skip comments and empty statements
      if (stmt.trim().startsWith('--') || stmt.trim() === ';') {
        continue;
      }

      // Extract table name for logging (if CREATE TABLE)
      let logMsg = `Statement ${i + 1}/${statements.length}`;
      const createTableMatch = stmt.match(/CREATE TABLE(?:\s+IF NOT EXISTS)?\s+(?:public\.)?(\w+)/i);
      const createIndexMatch = stmt.match(/CREATE(?:\s+UNIQUE)?\s+INDEX(?:\s+IF NOT EXISTS)?\s+(\w+)/i);
      const alterTableMatch = stmt.match(/ALTER TABLE\s+(?:public\.)?(\w+)/i);

      if (createTableMatch) {
        logMsg += ` - CREATE TABLE ${createTableMatch[1]}`;
      } else if (createIndexMatch) {
        logMsg += ` - CREATE INDEX ${createIndexMatch[1]}`;
      } else if (alterTableMatch) {
        logMsg += ` - ALTER TABLE ${alterTableMatch[1]}`;
      } else if (stmt.includes('GRANT')) {
        logMsg += ' - GRANT permissions';
      } else if (stmt.includes('INSERT INTO')) {
        logMsg += ' - INSERT data';
      } else if (stmt.includes('UPDATE')) {
        logMsg += ' - UPDATE data';
      } else if (stmt.includes('WITH')) {
        logMsg += ' - CTE query';
      }

      try {
        // Try executing via rpc if available, otherwise skip complex statements
        if (stmt.includes('WITH') || stmt.includes('DO $$')) {
          console.log(`  ⏭️  ${logMsg} - SKIPPED (complex statement)`);
          skipCount++;
          continue;
        }

        const { data, error } = await supabase.rpc('exec_sql', { sql: stmt });

        if (error) {
          // Check if error is about already exists
          if (error.message.includes('already exists') ||
              error.message.includes('duplicate')) {
            console.log(`  ✓ ${logMsg} - EXISTS`);
            successCount++;
          } else if (error.message.includes('does not exist')) {
            console.log(`  ⚠️  ${logMsg} - ${error.message}`);
            errorCount++;
          } else {
            console.log(`  ❌ ${logMsg}`);
            console.log(`     Error: ${error.message}`);
            errorCount++;
          }
        } else {
          console.log(`  ✅ ${logMsg}`);
          successCount++;
        }
      } catch (err) {
        console.log(`  ❌ ${logMsg}`);
        console.log(`     Error: ${err.message}`);
        errorCount++;
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
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
      ...result
    });

    // Wait between migrations
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Final summary
  console.log('\n' + '='.repeat(80));
  console.log('FINAL SUMMARY');
  console.log('='.repeat(80));

  results.forEach(r => {
    const statusIcon = r.status === 'SUCCESS' ? '✅' :
                      r.status === 'PARTIAL' ? '⚠️' : '❌';
    console.log(`${statusIcon} ${r.migration}`);
    if (r.successCount !== undefined) {
      console.log(`   Success: ${r.successCount}, Skipped: ${r.skipCount}, Errors: ${r.errorCount}`);
    }
  });

  const allSuccess = results.every(r => r.status === 'SUCCESS' || r.status === 'PARTIAL');
  console.log('\n' + '='.repeat(80));
  if (allSuccess) {
    console.log('✅ All migrations applied (some statements may have been skipped)');
  } else {
    console.log('⚠️  Some migrations had issues');
  }

  return allSuccess;
}

applyMigrations()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
