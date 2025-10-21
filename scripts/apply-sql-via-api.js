/**
 * Apply SQL Migration via Supabase Management API
 * This uses curl to execute SQL via Supabase's database webhook
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD;

console.log('============================================');
console.log('  SQL Migration via Direct Connection');
console.log('============================================\n');

// Read migration file
const migrationFile = path.join(__dirname, '..', 'supabase', 'migrations', '20251021000001_fix_health_metrics_function.sql');

console.log('[1/2] Reading migration file...');
const sqlContent = fs.readFileSync(migrationFile, 'utf8');
console.log('✓ Migration file loaded\n');

console.log('[2/2] Applying migration...');
console.log('  Using Supabase connection directly...\n');

// Create a temporary SQL file for execution
const tempSqlFile = path.join(__dirname, 'temp_migration.sql');
fs.writeFileSync(tempSqlFile, sqlContent);

try {
  // Try using psql if available
  const psqlCommand = `psql "postgresql://postgres.agyjovdugmtopasyvlng:${DB_PASSWORD}@aws-0-eu-central-1.pooler.supabase.com:5432/postgres?sslmode=require" -f "${tempSqlFile}"`;

  console.log('  Attempting psql connection...');
  const result = execSync(psqlCommand, { encoding: 'utf8', stdio: 'pipe' });

  console.log('\n✅ Migration Applied Successfully!\n');
  console.log('Result:');
  console.log(result);

  // Clean up temp file
  fs.unlinkSync(tempSqlFile);
  process.exit(0);

} catch (error) {
  // Clean up temp file
  if (fs.existsSync(tempSqlFile)) {
    fs.unlinkSync(tempSqlFile);
  }

  if (error.message.includes('psql') || error.message.includes('not found')) {
    console.log('⚠️  psql not found. Please install PostgreSQL client tools.\n');
    console.log('Alternative: Use Supabase Dashboard SQL Editor');
    console.log('=============================================\n');
    console.log('1. Go to: https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/sql/new');
    console.log('2. Copy and paste the following SQL:');
    console.log('\n' + '='.repeat(80));
    console.log(sqlContent);
    console.log('='.repeat(80) + '\n');
    console.log('3. Click "Run" to execute\n');
  } else {
    console.error('❌ Error executing migration:');
    console.error(error.message);
    console.error('\nStderr:', error.stderr?.toString());
    console.error('\nStdout:', error.stdout?.toString());
  }

  process.exit(1);
}
