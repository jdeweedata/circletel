/**
 * Get a recent quote ID from the database for testing
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function getRecentQuotes() {
  const { data, error } = await supabase
    .from('business_quotes')
    .select('id, quote_number, company_name, status, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching quotes:', error);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log('No quotes found in database');
    process.exit(0);
  }

  console.log('\n📋 Recent Quotes:\n');
  data.forEach((quote, index) => {
    console.log(`${index + 1}. ${quote.quote_number} - ${quote.company_name}`);
    console.log(`   ID: ${quote.id}`);
    console.log(`   Status: ${quote.status}`);
    console.log(`   Created: ${new Date(quote.created_at).toLocaleDateString()}\n`);
  });

  // Return the first quote ID for use in other scripts
  console.log(`\n💡 Use this quote ID for testing:`);
  console.log(`   ${data[0].id}\n`);
}

getRecentQuotes();
