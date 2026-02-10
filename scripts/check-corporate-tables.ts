/**
 * Check if corporate_accounts table exists
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL or SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function checkTables() {
  console.log('Checking if corporate_accounts table exists...');

  // Check if corporate_accounts already exists
  const { data, error } = await supabase
    .from('corporate_accounts')
    .select('id')
    .limit(1);

  if (error && error.code === '42P01') {
    console.log('STATUS: Table does NOT exist - migration needed');
    return false;
  } else if (error) {
    console.log('Error checking table:', error.message, '(code:', error.code, ')');
    return false;
  } else {
    console.log('STATUS: Table EXISTS - migration already applied');

    // Check for corporate_sites too
    const { error: sitesError } = await supabase
      .from('corporate_sites')
      .select('id')
      .limit(1);

    if (sitesError && sitesError.code === '42P01') {
      console.log('corporate_sites: NOT found');
    } else if (sitesError) {
      console.log('corporate_sites error:', sitesError.message);
    } else {
      console.log('corporate_sites: EXISTS');
    }

    return true;
  }
}

checkTables();
