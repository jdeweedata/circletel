/**
 * Send invoice notification to customer
 * Run: node scripts/send-invoice-notification.js
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findCustomerInvoices() {
  const customerEmail = 'shaunr07@gmail.com';
  const customerPhone = '0826574256'; // From user metadata

  console.log('🔍 Looking up customer:', customerEmail);

  // First find the customer by email
  const { data: customer, error: custError } = await supabase
    .from('customers')
    .select('id, first_name, last_name, email, phone, account_number')
    .eq('email', customerEmail)
    .single();

  if (custError) {
    console.log('❌ Customer lookup error:', custError.message);
    console.log('Trying to find by auth_user_id...');
    
    // Try by auth user id
    const { data: custById, error: err2 } = await supabase
      .from('customers')
      .select('id, first_name, last_name, email, phone, account_number')
      .eq('auth_user_id', 'cb4837a2-ee97-4b85-b2ca-35886d6d56c2')
      .single();
    
    if (err2) {
      console.log('❌ Still not found:', err2.message);
      return null;
    }
    
    console.log('✅ Customer found by auth_user_id:', JSON.stringify(custById, null, 2));
    return { customer: custById, phone: customerPhone };
  }

  console.log('✅ Customer found:', JSON.stringify(customer, null, 2));

  // Find their invoices
  const { data: invoices, error: invError } = await supabase
    .from('customer_invoices')
    .select('id, invoice_number, invoice_date, due_date, total_amount, amount_paid, amount_due, status')
    .eq('customer_id', customer.id)
    .in('status', ['unpaid', 'overdue', 'partial', 'sent'])
    .order('due_date', { ascending: true });

  if (invError) {
    console.log('❌ Invoice lookup error:', invError.message);
    return { customer, phone: customer.phone || customerPhone, invoices: [] };
  }

  console.log('📄 Invoices found:', invoices?.length || 0);
  if (invoices && invoices.length > 0) {
    console.log(JSON.stringify(invoices, null, 2));
  }

  return { customer, phone: customer.phone || customerPhone, invoices: invoices || [] };
}

findCustomerInvoices().then(result => {
  if (result) {
    console.log('\n📊 Summary:');
    console.log('Customer:', result.customer?.first_name, result.customer?.last_name);
    console.log('Email:', result.customer?.email);
    console.log('Phone:', result.phone);
    console.log('Outstanding Invoices:', result.invoices?.length || 0);
  }
});
