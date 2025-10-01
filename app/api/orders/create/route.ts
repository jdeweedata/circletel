import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface CreateOrderRequest {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  packageId: string;
  serviceType: string;
  speedDown: number;
  speedUp: number;
  basePrice: number;
  installationFee: number;
  totalAmount: number;
  installationAddress: string;
  coordinates?: { lat: number; lng: number };
  preferredDate?: Date;
  specialInstructions?: string;
  customerNotes?: string;
}

/**
 * POST /api/orders/create
 * Creates a new order record in the database with a unique payment reference
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateOrderRequest = await request.json();

    // Validate required fields
    const requiredFields = [
      'customerName',
      'customerEmail',
      'customerPhone',
      'packageId',
      'serviceType',
      'basePrice',
      'installationFee',
      'totalAmount',
      'installationAddress'
    ];

    const missingFields = requiredFields.filter(field => !body[field as keyof CreateOrderRequest]);
    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Missing required fields: ${missingFields.join(', ')}`
        },
        { status: 400 }
      );
    }

    // Generate unique payment reference: CT-{timestamp}-{random4digits}
    const timestamp = Date.now();
    const randomDigits = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const paymentReference = `CT-${timestamp}-${randomDigits}`;

    // Prepare order data
    const orderData = {
      package_id: body.packageId,
      customer_name: body.customerName,
      customer_email: body.customerEmail,
      customer_phone: body.customerPhone,
      service_type: body.serviceType,
      speed_down: body.speedDown,
      speed_up: body.speedUp,
      base_price: body.basePrice,
      installation_fee: body.installationFee,
      payment_reference: paymentReference,
      payment_status: 'pending',
      payment_method: 'netcash',
      order_status: 'pending_payment',
      order_type: 'new_connection',
      status: 'pending',
      customer_notes: body.customerNotes || body.specialInstructions,
      installation_address: body.installationAddress,
      coordinates: body.coordinates || null,
      installation_date: body.preferredDate || null,
      total_amount: body.totalAmount,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Insert order into database
    const { data: order, error: insertError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create order in database',
          details: insertError.message
        },
        { status: 500 }
      );
    }

    // Log order creation
    console.log('Order created successfully:', {
      orderId: order.id,
      paymentReference: order.payment_reference,
      customerEmail: order.customer_email,
      totalAmount: body.totalAmount
    });

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        payment_reference: order.payment_reference,
        customer_email: order.customer_email,
        customer_name: order.customer_name,
        total_amount: body.totalAmount,
        payment_status: order.payment_status,
        order_status: order.order_status,
        created_at: order.created_at
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}