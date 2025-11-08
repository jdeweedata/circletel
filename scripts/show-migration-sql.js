/**
 * Display migration SQL for manual application
 * Usage: node scripts/show-migration-sql.js [migration-name]
 */

const fs = require('fs');
const path = require('path');

const migrationName = process.argv[2] || '20251108090000_add_admin_activity_log_insert_policy';
const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', `${migrationName}.sql`);

console.log('\n═══════════════════════════════════════════════════════');
console.log('   Supabase Migration SQL');
console.log('═══════════════════════════════════════════════════════\n');

console.log(`Migration: ${migrationName}\n`);
console.log('Instructions:');
console.log('1. Go to: https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/sql/new');
console.log('2. Copy the SQL below');
console.log('3. Paste into the SQL editor');
console.log('4. Click "Run" to execute\n');

console.log('═══════════════════════════════════════════════════════');
console.log('   SQL MIGRATION (Copy from below this line)');
console.log('═══════════════════════════════════════════════════════\n');

try {
  const sql = fs.readFileSync(migrationPath, 'utf8');
  console.log(sql);
} catch (error) {
  console.error(`\n❌ Error reading migration file: ${error.message}`);
  console.error(`   Path: ${migrationPath}`);
  process.exit(1);
}

console.log('\n═══════════════════════════════════════════════════════');
console.log('   End of SQL Migration');
console.log('═══════════════════════════════════════════════════════\n');
