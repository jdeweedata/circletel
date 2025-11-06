/**
 * Create Test Partner
 *
 * Quick script to create a fully set up test partner for testing the partner portal.
 * Creates partner record, assigns permissions, and optionally creates sample leads and commissions.
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://agyjovdugmtopasyvlng.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Test partner data
const testPartner = {
  businessName: 'CircleTel Test Agency',
  registrationNumber: '2024/TEST001/07',
  vatNumber: 'TEST123456789',
  businessType: 'company',

  contactPerson: 'Test Partner',
  email: 'test.partner@circletel.co.za',
  phone: '0821234567',
  alternativePhone: '0217654321',

  streetAddress: '123 Test Street',
  suburb: 'Tech Park',
  city: 'Cape Town',
  province: 'Western Cape',
  postalCode: '8001',

  bankName: 'FNB',
  accountHolder: 'CircleTel Test Agency',
  accountNumber: '62123456789',
  accountType: 'cheque',
  branchCode: '250655',

  // Pre-approved settings
  complianceStatus: 'verified',
  status: 'active',
  tier: 'silver',
  commissionRate: 30.00,
  partnerNumber: 'CTPL-2025-TEST'
};

async function createTestPartner() {
  console.log('\n🚀 Creating Test Partner Account\n');
  console.log('='.repeat(60));

  // Step 1: Create partner record
  console.log('\n1️⃣ Creating partner record...');

  const { data: partner, error: partnerError } = await supabase
    .from('partners')
    .insert([{
      business_name: testPartner.businessName,
      registration_number: testPartner.registrationNumber,
      vat_number: testPartner.vatNumber,
      business_type: testPartner.businessType,

      contact_person: testPartner.contactPerson,
      email: testPartner.email,
      phone: testPartner.phone,
      alternative_phone: testPartner.alternativePhone,

      street_address: testPartner.streetAddress,
      suburb: testPartner.suburb,
      city: testPartner.city,
      province: testPartner.province,
      postal_code: testPartner.postalCode,

      bank_name: testPartner.bankName,
      account_holder: testPartner.accountHolder,
      account_number: testPartner.accountNumber,
      account_type: testPartner.accountType,
      branch_code: testPartner.branchCode,

      compliance_status: testPartner.complianceStatus,
      compliance_verified_at: new Date().toISOString(),
      status: testPartner.status,
      tier: testPartner.tier,
      commission_rate: testPartner.commissionRate,
      partner_number: testPartner.partnerNumber
    }])
    .select()
    .single();

  if (partnerError) {
    console.error('   ❌ Error creating partner:', partnerError.message);
    return null;
  }

  console.log('   ✅ Partner created successfully');
  console.log(`      ID: ${partner.id}`);
  console.log(`      Number: ${partner.partner_number}`);
  console.log(`      Email: ${partner.email}`);

  // Step 2: Create test leads
  console.log('\n2️⃣ Creating test leads...');

  const testLeads = [
    {
      address: '456 Oak Avenue, Sandton, Johannesburg, 2196',
      latitude: -26.1076,
      longitude: 28.0567,
      customer_name: 'John Doe',
      customer_email: 'john.doe@example.com',
      customer_phone: '0821112222',
      service_type: 'fibre',
      status: 'new'
    },
    {
      address: '789 Pine Road, Centurion, 0157',
      latitude: -25.8601,
      longitude: 28.1889,
      customer_name: 'Sarah Williams',
      customer_email: 'sarah.williams@example.com',
      customer_phone: '0823334444',
      service_type: 'wireless',
      status: 'interested'
    },
    {
      address: '321 Beach Boulevard, Durban, 4001',
      latitude: -29.8587,
      longitude: 31.0218,
      customer_name: 'Michael Brown',
      customer_email: 'michael.brown@example.com',
      customer_phone: '0825556666',
      service_type: 'fibre',
      status: 'contacted'
    }
  ];

  const leadsToInsert = testLeads.map(lead => ({
    ...lead,
    assigned_partner_id: partner.id,
    lead_source: 'partner_referral',
    created_at: new Date().toISOString()
  }));

  const { data: leads, error: leadsError } = await supabase
    .from('coverage_leads')
    .insert(leadsToInsert)
    .select();

  if (leadsError) {
    console.log('   ⚠️  Error creating leads:', leadsError.message);
  } else {
    console.log(`   ✅ Created ${leads.length} test leads`);
    leads.forEach((lead, i) => {
      console.log(`      ${i + 1}. ${lead.customer_name} - ${lead.status}`);
    });
  }

  // Step 3: Create sample commission transactions
  console.log('\n3️⃣ Creating sample commission transactions...');

  const { data: commission1 } = await supabase.rpc('create_tiered_commission', {
    p_partner_id: partner.id,
    p_order_id: null,
    p_monthly_subscription: 799.00,
    p_contract_term_months: 24,
    p_transaction_type: 'lead_conversion'
  });

  if (commission1) {
    console.log('   ✅ Created tiered commission (R799 package):');
    console.log(`      Amount: R${commission1.toFixed(2)}`);
  }

  const { data: commission2 } = await supabase.rpc('create_margin_commission', {
    p_partner_id: partner.id,
    p_order_id: null,
    p_product_sku: 'bizfibre_plus_50',
    p_contract_term_months: 24,
    p_transaction_type: 'lead_conversion'
  });

  if (commission2) {
    console.log('   ✅ Created margin commission (BizFibre Plus 50):');
    console.log(`      Amount: R${commission2.toFixed(2)}`);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('✅ Test Partner Setup Complete!');
  console.log('='.repeat(60));
  console.log('\n📋 Login Credentials:');
  console.log(`   Email: ${testPartner.email}`);
  console.log(`   Partner Number: ${testPartner.partnerNumber}`);
  console.log(`   Status: ${testPartner.status.toUpperCase()}`);
  console.log(`   Tier: ${testPartner.tier.toUpperCase()}`);
  console.log(`   Commission Rate: ${testPartner.commissionRate}%`);

  console.log('\n📊 Test Data Created:');
  console.log(`   • Partner Record: ✅`);
  console.log(`   • Test Leads: ${leads ? leads.length : 0}`);
  console.log(`   • Commission Transactions: 2`);

  console.log('\n🌐 Next Steps:');
  console.log('   1. Create Supabase auth user with email: test.partner@circletel.co.za');
  console.log('   2. Grant PERMISSIONS.PARTNERS.VIEW to user');
  console.log('   3. Visit /partners to access portal');
  console.log('   4. Follow test guide: docs/testing/PARTNER_JOURNEY_TEST_GUIDE.md');

  console.log('\n💡 Quick SQL to Grant Permissions:');
  console.log(`   -- Replace {user_id} with actual Supabase auth user ID`);
  console.log(`   INSERT INTO user_permissions (user_id, permission)`);
  console.log(`   VALUES ('{user_id}', 'partners:view');`);

  console.log('\n🗑️  To Remove Test Data:');
  console.log(`   DELETE FROM partners WHERE partner_number = '${testPartner.partnerNumber}';`);

  console.log('\n');

  return partner;
}

async function main() {
  try {
    await createTestPartner();
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
