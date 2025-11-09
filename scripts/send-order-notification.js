const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function sendOrderNotification() {
  try {
    const email = 'shaunr07@gmail.com';

    console.log(`📧 Looking up order for ${email}...`);

    // Get the order
    const { data: order, error: orderError } = await supabase
      .from('consumer_orders')
      .select('*')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (orderError) {
      console.error('❌ Error fetching order:', orderError);
      return;
    }

    if (!order) {
      console.error('❌ No order found for this email');
      return;
    }

    console.log(`✅ Found order: ${order.order_number}`);
    console.log(`   Customer: ${order.first_name} ${order.last_name}`);
    console.log(`   Package: ${order.package_name}`);
    console.log(`   Status: ${order.status}`);
    console.log(`   Created: ${order.created_at}`);

    // Trigger email notification by making API call
    console.log('\n📨 Sending email notification...');

    const apiUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    const response = await fetch(`${apiUrl}/api/notifications/send-order-confirmation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId: order.id,
        orderNumber: order.order_number
      })
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ Email notification sent successfully!');
      console.log(`   Message ID: ${result.message_id}`);
      console.log(`   Recipient: ${order.email}`);
    } else {
      console.error('❌ Failed to send notification:', result.error);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

sendOrderNotification();
