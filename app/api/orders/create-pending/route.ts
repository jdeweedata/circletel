import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Create a pending order without payment
 * This is part of the reduced-friction flow where payment is handled later in the dashboard
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user (may not be authenticated yet)
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    const body = await request.json();
    const {
      // Package details
      service_package_id,
      package_name,
      package_speed,
      package_price,

      // Installation details
      installation_address,
      coordinates,
      installation_location_type,
      installation_fee,

      // Customer details (will be stored for later association)
      email,
      phone,
      first_name,
      last_name,
      account_type,
    } = body;

    // Validation
    if (!package_name || !installation_address || !email) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: package_name, installation_address, email'
        },
        { status: 400 }
      );
    }

    // Generate payment reference
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const paymentReference = `CT-${timestamp}-${random}`;

    // Create pending order
    const orderData = {
      // Customer info (will be linked after authentication)
      customer_id: user?.id || null, // May be null if not logged in yet
      first_name: first_name || email.split('@')[0],
      last_name: last_name || 'Customer',
      email,
      phone: phone || '',

      // Package details
      service_package_id,
      package_name,
      package_speed: package_speed || '',
      package_price: package_price || 0,

      // Installation details
      installation_address,
      coordinates: coordinates || null,
      installation_location_type: installation_location_type || null,
      installation_fee: installation_fee || 0,

      // Order status
      status: 'pending_payment',
      payment_reference: paymentReference,
      payment_status: 'pending',

      // Account type
      account_type: account_type || 'personal',

      // Order metadata
      created_at: new Date().toISOString(),
    };

    console.log('Creating pending order:', orderData);

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create order',
          details: orderError.message
        },
        { status: 500 }
      );
    }

    console.log('Pending order created successfully:', order);

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        order_number: order.order_number,
        payment_reference: order.payment_reference,
        status: order.status,
      },
      message: 'Order created successfully. Please log in to complete your order.',
    });

  } catch (error) {
    console.error('Unexpected error creating pending order:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
