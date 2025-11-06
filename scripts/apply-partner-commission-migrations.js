const fs = require('fs');
const path = require('path');

// Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://agyjovdugmtopasyvlng.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment');
  process.exit(1);
}

// Migration files to apply in order
const migrations = [
  '20251104000001_create_partner_commissions.sql',
  '20251104000002_add_tiered_commission_structure.sql',
  '20251104000003_add_product_commission_models.sql'
];

async function executeSqlViaApi(sql) {
  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`   📝 Executing ${statements.length} SQL statements...`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';

    // Skip comments
    if (statement.startsWith('--')) continue;

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        },
        body: JSON.stringify({
          sql: statement
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        // Check if it's a "already exists" error - these are safe to ignore
        if (errorText.includes('already exists') || errorText.includes('duplicate')) {
          console.log(`   ⚠️  Statement ${i + 1}: Already exists (skipping)`);
          continue;
        }
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      process.stdout.write(`   ✓ Statement ${i + 1}/${statements.length}\r`);
    } catch (error) {
      console.error(`\n   ❌ Statement ${i + 1} failed:`, error.message);
      throw error;
    }
  }

  console.log(`\n   ✅ All statements executed`);
}

async function applyMigration(filename) {
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', filename);

  console.log(`\n${'='.repeat(60)}`);
  console.log(`📄 Migration: ${filename}`);
  console.log('='.repeat(60));

  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${filename}`);
    return false;
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');
  const lines = sql.split('\n').length;

  console.log(`   📊 Size: ${(sql.length / 1024).toFixed(1)} KB, ${lines} lines`);
  console.log(`   🔄 Applying to database...`);

  try {
    await executeSqlViaApi(sql);
    console.log(`   ✅ Migration applied successfully`);
    return true;
  } catch (error) {
    console.error(`   ❌ Error:`, error.message);
    return false;
  }
}

async function main() {
  console.log('\n🚀 Partner Commission Migrations\n');
  console.log(`📊 Database: ${SUPABASE_URL}`);
  console.log(`📝 Migrations: ${migrations.length}\n`);

  let successCount = 0;
  let failCount = 0;

  for (const migration of migrations) {
    const success = await applyMigration(migration);
    if (success) {
      successCount++;
    } else {
      failCount++;
      console.log(`\n⚠️  Continuing with next migration...\n`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Final Summary');
  console.log('='.repeat(60));
  console.log(`   ✅ Successful: ${successCount}/${migrations.length}`);
  console.log(`   ❌ Failed: ${failCount}/${migrations.length}`);
  console.log('='.repeat(60));

  if (successCount === migrations.length) {
    console.log('\n🎉 All migrations applied successfully!\n');
    console.log('📋 What was created:');
    console.log('   • partner_commission_transactions table');
    console.log('   • commission_tier_config table (7 tiers seeded)');
    console.log('   • product_commission_config table (10 products seeded)');
    console.log('   • SQL functions for commission calculations');
    console.log('   • Views for commission analysis\n');
    console.log('✅ Partner commission system is now active!');
  } else {
    console.log('\n💡 Some migrations failed. Common reasons:');
    console.log('   • Tables/functions already exist (safe to ignore)');
    console.log('   • RPC endpoint not available (try Supabase SQL Editor)');
    console.log('   • Permission issues (check service role key)\n');
    console.log('📌 Manual application option:');
    console.log('   1. Go to Supabase Dashboard → SQL Editor');
    console.log('   2. Copy contents of each migration file');
    console.log('   3. Run in SQL Editor');
  }
}

main().catch(console.error);
