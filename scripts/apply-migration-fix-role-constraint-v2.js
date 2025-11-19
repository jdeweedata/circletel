const { Client } = require('pg');
require('dotenv').config({ path: '.env.production.local' });

async function applyMigration() {
  const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;

  if (!connectionString) {
    console.error('Missing POSTGRES_URL or POSTGRES_URL_NON_POOLING');
    process.exit(1);
  }

  console.log('Connecting to database...');
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('Connected successfully!\n');

    console.log('Applying migration: fix_pending_admin_users_role_constraint\n');

    // Drop the outdated check constraint
    console.log('1. Dropping outdated check constraint...');
    await client.query(`
      ALTER TABLE pending_admin_users
      DROP CONSTRAINT IF EXISTS pending_admin_users_requested_role_check;
    `);
    console.log('   ✓ Constraint dropped\n');

    // Add foreign key constraint
    console.log('2. Adding foreign key constraint...');
    try {
      await client.query(`
        ALTER TABLE pending_admin_users
        ADD CONSTRAINT pending_admin_users_requested_role_template_fkey
        FOREIGN KEY (requested_role_template_id)
        REFERENCES role_templates(id);
      `);
      console.log('   ✓ Foreign key added\n');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('   ✓ Foreign key already exists\n');
      } else {
        throw err;
      }
    }

    // Add index
    console.log('3. Adding index for performance...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_pending_admin_users_requested_role_template
      ON pending_admin_users(requested_role_template_id);
    `);
    console.log('   ✓ Index created\n');

    console.log('✅ Migration applied successfully!');
    console.log('\nThe admin signup form should now accept all 25 role templates.');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration();
