/**
 * Create Test Partner Account
 *
 * This script creates a test partner account for testing the partner portal.
 *
 * Prerequisites:
 * 1. Create an auth user first via Supabase Dashboard or signup flow
 * 2. Get the user's ID from auth.users
 * 3. Run this script with the user ID
 *
 * Usage:
 *   node scripts/create-test-partner.js <auth_user_id>
 *
 * Or run manually in Supabase SQL Editor with the SQL below.
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Make sure .env.local has:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL');
  console.error('  SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestPartner(userId) {
  if (!userId) {
    console.error('\nUsage: node scripts/create-test-partner.js <auth_user_id>');
    console.error('\nTo get a user ID:');
    console.error('1. Go to Supabase Dashboard > Authentication > Users');
    console.error('2. Create a new user or use an existing one');
    console.error('3. Copy the User UID');
    console.error('\nAlternatively, run this SQL in Supabase SQL Editor:\n');
    console.log(`
-- First, create an auth user via dashboard, then run:
INSERT INTO public.partners (
  user_id,
  business_name,
  business_type,
  contact_person,
  email,
  phone,
  street_address,
  city,
  province,
  postal_code,
  status,
  compliance_status,
  partner_number,
  tier,
  commission_rate
) VALUES (
  '<YOUR_AUTH_USER_ID>',  -- Replace with actual user ID
  'Test Partner Company',
  'Reseller',
  'Test Partner',
  'testpartner@circletel.co.za',
  '0821234567',
  '123 Test Street',
  'Johannesburg',
  'Gauteng',
  '2000',
  'approved',  -- Set to 'approved' so they can access the portal
  'complete',
  'CTPL-2025-00001',
  'bronze',
  10.00
);
`);
    process.exit(1);
  }

  console.log('Creating test partner for user:', userId);

  const { data, error } = await supabase
    .from('partners')
    .insert({
      user_id: userId,
      business_name: 'Test Partner Company',
      business_type: 'Reseller',
      contact_person: 'Test Partner',
      email: 'testpartner@circletel.co.za',
      phone: '0821234567',
      street_address: '123 Test Street',
      city: 'Johannesburg',
      province: 'Gauteng',
      postal_code: '2000',
      status: 'approved',
      compliance_status: 'complete',
      partner_number: 'CTPL-2025-00001',
      tier: 'bronze',
      commission_rate: 10.00,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating partner:', error.message);
    if (error.code === '23505') {
      console.error('Partner already exists for this user or duplicate partner number.');
    }
    process.exit(1);
  }

  console.log('\nTest partner created successfully!');
  console.log('Partner ID:', data.id);
  console.log('Business Name:', data.business_name);
  console.log('Status:', data.status);
  console.log('\nYou can now log in at /partner/login with the auth user credentials.');
}

const userId = process.argv[2];
createTestPartner(userId);
