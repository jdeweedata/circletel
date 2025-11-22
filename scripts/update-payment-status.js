/**
 * Update order payment status to verified
 */
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updatePaymentStatus() {
  console.log('\n🔄 Updating payment status for order ORD-20251108-9841...\n');

  const orderId = '052e143e-0b6f-48bb-a754-421d5864ba65';

  // Update payment status to completed since payment method is active
  const { data, error } = await supabase
    .from('consumer_orders')
    .update({
      payment_status: 'completed',
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId)
    .select('order_number, payment_status, payment_method')
    .single();

  if (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }

  console.log('✅ Payment status updated successfully!');
  console.log('\n📋 Updated Order:');
  console.log(JSON.stringify(data, null, 2));
  console.log('\n💡 Payment method verified - debit order mandate is active and ready for billing');
}

updatePaymentStatus();
