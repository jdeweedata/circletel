import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { EmailNotificationService } from '@/lib/notifications/notification-service';
import type { ConsumerOrder } from '@/lib/types/customer-journey';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      'first_name',
      'last_name',
      'email',
      'phone',
      'installation_address',
      'package_name',
      'package_speed',
      'package_price',
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    const supabase = await createClient();

    // Generate order number and payment reference
    const orderNumber = await generateOrderNumber(supabase);
    const paymentReference = `PAY-${orderNumber}`; // Generate payment reference from order number

    // Create order in database
    const { data: order, error: dbError } = await supabase
      .from('consumer_orders')
      .insert({
        order_number: orderNumber,
        payment_reference: paymentReference,

        // Customer details
        first_name: body.first_name,
        last_name: body.last_name,
        email: body.email,
        phone: body.phone,
        alternate_phone: body.alternate_phone || null,

        // Installation address
        installation_address: body.installation_address,
        suburb: body.suburb || null,
        city: body.city || null,
        province: body.province || null,
        postal_code: body.postal_code || null,
        coordinates: body.coordinates || null,
        special_instructions: body.special_instructions || null,

        // Billing address
        billing_same_as_installation: body.billing_same_as_installation ?? true,
        billing_address: body.billing_address || null,
        billing_suburb: body.billing_suburb || null,
        billing_city: body.billing_city || null,
        billing_province: body.billing_province || null,
        billing_postal_code: body.billing_postal_code || null,

        // Package details
        service_package_id: body.service_package_id || null,
        package_name: body.package_name,
        package_speed: body.package_speed,
        package_price: body.package_price,
        installation_fee: body.installation_fee || 0,
        router_included: body.router_included || false,
        router_rental_fee: body.router_rental_fee || null,

        // References
        coverage_check_id: body.coverage_check_id || null,
        coverage_lead_id: body.coverage_lead_id || null,

        // Payment
        payment_method: null,
        payment_status: 'pending',
        total_paid: 0,

        // Status
        status: 'pending',

        // Installation preferences
        preferred_installation_date: body.preferred_installation_date || null,
        installation_scheduled_date: null,
        installation_time_slot: null,

        // Contact preferences
        contact_preference: body.contact_preference || 'email',
        marketing_opt_in: body.marketing_opt_in || false,
        whatsapp_opt_in: body.whatsapp_opt_in || false,

        // Lead source
        lead_source: body.lead_source || 'coverage_checker',
        source_campaign: body.source_campaign || null,
        referral_code: body.referral_code || null,

        // Metadata
        metadata: body.metadata || {},
        internal_notes: null,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error creating order:', dbError);
      return NextResponse.json(
        { success: false, error: 'Failed to create order in database', details: dbError.message },
        { status: 500 }
      );
    }

    // Send confirmation email (async, don't block response)
    EmailNotificationService.sendOrderConfirmation(order as ConsumerOrder)
      .then((emailResult) => {
        if (emailResult.success) {
          console.log('Order confirmation email sent to:', order.email);
        } else {
          console.error('Failed to send confirmation email:', emailResult.error);
        }
      })
      .catch((error) => {
        console.error('Email send error:', error);
      });

    // TODO: Send notification to admin (optional)
    // TODO: Sync to Zoho CRM (optional)

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        order_number: order.order_number,
        payment_reference: order.payment_reference,
        first_name: order.first_name,
        last_name: order.last_name,
        email: order.email,
        status: order.status,
        package_name: order.package_name,
        package_price: order.package_price,
        created_at: order.created_at,
      },
      message: 'Order created successfully',
    });
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create order',
      },
      { status: 500 }
    );
  }
}

// Helper function to generate unique order number
async function generateOrderNumber(supabase: any): Promise<string> {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
  const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');

  let orderNumber = `ORD-${dateStr}-${randomNum}`;
  let attempts = 0;
  const maxAttempts = 10;

  // Check if order number exists, regenerate if it does
  while (attempts < maxAttempts) {
    const { data } = await supabase
      .from('consumer_orders')
      .select('id')
      .eq('order_number', orderNumber)
      .single();

    if (!data) {
      // Order number is unique
      return orderNumber;
    }

    // Generate new random number
    const newRandomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    orderNumber = `ORD-${dateStr}-${newRandomNum}`;
    attempts++;
  }

  // Fallback: use timestamp
  return `ORD-${dateStr}-${Date.now().toString().slice(-4)}`;
}

// GET endpoint to retrieve orders (for admin or customer)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('id');
    const orderNumber = searchParams.get('orderNumber');
    const email = searchParams.get('email');

    const supabase = await createClient();

    if (orderId) {
      // Get specific order by ID
      const { data: order, error } = await supabase
        .from('consumer_orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error) {
        return NextResponse.json(
          { success: false, error: 'Order not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        order,
      });
    } else if (orderNumber) {
      // Get specific order by order number
      const { data: order, error } = await supabase
        .from('consumer_orders')
        .select('*')
        .eq('order_number', orderNumber)
        .single();

      if (error) {
        return NextResponse.json(
          { success: false, error: 'Order not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        order,
      });
    } else if (email) {
      // Get all orders for an email
      const { data: orders, error } = await supabase
        .from('consumer_orders')
        .select('*')
        .eq('email', email)
        .order('created_at', { ascending: false });

      if (error) {
        return NextResponse.json(
          { success: false, error: 'Failed to fetch orders' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        orders,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Missing query parameter: id, orderNumber, or email' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Order fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch order',
      },
      { status: 500 }
    );
  }
}
