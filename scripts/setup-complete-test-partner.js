/**
 * Complete Test Partner Setup
 *
 * Creates:
 * 1. Supabase auth user (test.partner@circletel.co.za)
 * 2. Partner record with all details
 * 3. Partner permissions
 * 4. Sample leads (3)
 * 5. Sample commission transactions (2)
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://agyjovdugmtopasyvlng.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test partner details
const testPartnerEmail = 'test.partner@circletel.co.za';
const testPartnerPassword = 'TestPartner2025!';

const testPartnerData = {
  businessName: 'CircleTel Test Agency',
  registrationNumber: '2024/TEST001/07',
  vatNumber: 'TEST123456789',
  businessType: 'company',

  contactPerson: 'Test Partner',
  email: testPartnerEmail,
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
  status: 'approved',
  tier: 'silver',
  commissionRate: 30.00,
  partnerNumber: 'CTPL-2025-TEST'
};

async function setupCompleteTestPartner() {
  console.log('\n🚀 Complete Test Partner Setup\n');
  console.log('='.repeat(60));

  // Step 1: Check if auth user exists
  console.log('\n1️⃣ Checking for existing auth user...');

  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find(u => u.email === testPartnerEmail);

  let authUserId;

  if (existingUser) {
    console.log('   ✅ Auth user already exists');
    console.log(`      User ID: ${existingUser.id}`);
    console.log(`      Email: ${existingUser.email}`);
    authUserId = existingUser.id;
  } else {
    // Create auth user
    console.log('   📝 Creating auth user...');

    const { data: newUser, error: authError } = await supabase.auth.admin.createUser({
      email: testPartnerEmail,
      password: testPartnerPassword,
      email_confirm: true,
      user_metadata: {
        full_name: testPartnerData.contactPerson,
        role: 'partner'
      }
    });

    if (authError) {
      console.error('   ❌ Error creating auth user:', authError.message);
      return null;
    }

    console.log('   ✅ Auth user created successfully');
    console.log(`      User ID: ${newUser.user.id}`);
    console.log(`      Email: ${newUser.user.email}`);
    authUserId = newUser.user.id;
  }

  // Step 2: Check if partner record exists
  console.log('\n2️⃣ Checking for existing partner record...');

  const { data: existingPartner } = await supabase
    .from('partners')
    .select('*')
    .eq('email', testPartnerEmail)
    .single();

  let partnerId;

  if (existingPartner) {
    console.log('   ✅ Partner record already exists');
    console.log(`      Partner ID: ${existingPartner.id}`);
    console.log(`      Partner Number: ${existingPartner.partner_number}`);
    console.log(`      Status: ${existingPartner.status}`);
    partnerId = existingPartner.id;
  } else {
    // Create partner record
    console.log('   📝 Creating partner record...');

    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .insert([{
        user_id: authUserId,
        business_name: testPartnerData.businessName,
        registration_number: testPartnerData.registrationNumber,
        vat_number: testPartnerData.vatNumber,
        business_type: testPartnerData.businessType,

        contact_person: testPartnerData.contactPerson,
        email: testPartnerData.email,
        phone: testPartnerData.phone,
        alternative_phone: testPartnerData.alternativePhone,

        street_address: testPartnerData.streetAddress,
        suburb: testPartnerData.suburb,
        city: testPartnerData.city,
        province: testPartnerData.province,
        postal_code: testPartnerData.postalCode,

        bank_name: testPartnerData.bankName,
        account_holder: testPartnerData.accountHolder,
        account_number: testPartnerData.accountNumber,
        account_type: testPartnerData.accountType,
        branch_code: testPartnerData.branchCode,

        compliance_status: testPartnerData.complianceStatus,
        compliance_verified_at: new Date().toISOString(),
        status: testPartnerData.status,
        tier: testPartnerData.tier,
        commission_rate: testPartnerData.commissionRate,
        partner_number: testPartnerData.partnerNumber
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
    partnerId = partner.id;
  }

  // Step 3: Grant partner permissions
  console.log('\n3️⃣ Setting up partner permissions...');

  const { data: existingPermission } = await supabase
    .from('user_permissions')
    .select('*')
    .eq('user_id', authUserId)
    .eq('permission', 'partners:view')
    .single();

  if (existingPermission) {
    console.log('   ✅ Partner permission already exists');
  } else {
    const { error: permissionError } = await supabase
      .from('user_permissions')
      .insert([{
        user_id: authUserId,
        permission: 'partners:view'
      }]);

    if (permissionError) {
      console.log('   ⚠️  Could not create permission:', permissionError.message);
    } else {
      console.log('   ✅ Partner permission granted');
    }
  }

  // Step 4: Create test leads
  console.log('\n4️⃣ Creating test leads...');

  const { data: existingLeads } = await supabase
    .from('coverage_leads')
    .select('*')
    .eq('assigned_partner_id', partnerId);

  if (existingLeads && existingLeads.length > 0) {
    console.log(`   ✅ ${existingLeads.length} test leads already exist`);
  } else {
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
      assigned_partner_id: partnerId,
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
  }

  // Step 5: Create sample commission transactions
  console.log('\n5️⃣ Creating sample commission transactions...');

  const { data: existingCommissions } = await supabase
    .from('partner_commission_transactions')
    .select('*')
    .eq('partner_id', partnerId);

  if (existingCommissions && existingCommissions.length > 0) {
    console.log(`   ✅ ${existingCommissions.length} commission transactions already exist`);
  } else {
    // Try tiered commission
    const { data: commission1, error: comm1Error } = await supabase.rpc('create_tiered_commission', {
      p_partner_id: partnerId,
      p_order_id: null,
      p_monthly_subscription: 799.00,
      p_contract_term_months: 24,
      p_transaction_type: 'lead_conversion'
    });

    if (comm1Error) {
      console.log('   ⚠️  Tiered commission function not available:', comm1Error.message);
    } else if (commission1) {
      console.log('   ✅ Created tiered commission (R799 package):');
      console.log(`      Amount: R${commission1.toFixed(2)}`);
    }

    // Try margin commission
    const { data: commission2, error: comm2Error } = await supabase.rpc('create_margin_commission', {
      p_partner_id: partnerId,
      p_order_id: null,
      p_product_sku: 'bizfibre_plus_50',
      p_contract_term_months: 24,
      p_transaction_type: 'lead_conversion'
    });

    if (comm2Error) {
      console.log('   ⚠️  Margin commission function not available:', comm2Error.message);
    } else if (commission2) {
      console.log('   ✅ Created margin commission (BizFibre Plus 50):');
      console.log(`      Amount: R${commission2.toFixed(2)}`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('✅ Test Partner Setup Complete!');
  console.log('='.repeat(60));
  console.log('\n📋 Login Credentials:');
  console.log(`   Email: ${testPartnerEmail}`);
  console.log(`   Password: ${testPartnerPassword}`);
  console.log(`   Partner Number: ${testPartnerData.partnerNumber}`);
  console.log(`   Status: ${testPartnerData.status.toUpperCase()} ✅`);
  console.log(`   Tier: ${testPartnerData.tier.toUpperCase()}`);

  console.log('\n🌐 Partner Portal URLs:');
  console.log('   • Portal Home: http://localhost:3002/partner');
  console.log('   • Dashboard: http://localhost:3002/partner/dashboard');
  console.log('   • Registration: http://localhost:3002/partner/onboarding');
  console.log('   • Document Upload: http://localhost:3002/partner/onboarding/verify');
  console.log('   • Leads: http://localhost:3002/partner/leads');
  console.log('   • Commissions: http://localhost:3002/partner/commissions');
  console.log('   • Calculator: http://localhost:3002/partner/commissions/tiers');
  console.log('   • Resources: http://localhost:3002/partner/resources');
  console.log('   • Profile: http://localhost:3002/partner/profile');

  console.log('\n🗑️  To Remove Test Data:');
  console.log(`   DELETE FROM partners WHERE partner_number = '${testPartnerData.partnerNumber}';`);
  console.log(`   DELETE FROM auth.users WHERE email = '${testPartnerEmail}';`);

  console.log('\n');

  return {
    authUserId,
    partnerId,
    email: testPartnerEmail,
    password: testPartnerPassword
  };
}

async function main() {
  try {
    await setupCompleteTestPartner();
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();
