import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface InitiatePaymentRequest {
  orderId: string;
  amount: number;
  customerEmail: string;
  customerName: string;
  paymentReference: string;
}

/**
 * POST /api/payment/netcash/initiate
 * Generates Netcash payment URL and logs initiation
 */
export async function POST(request: NextRequest) {
  try {
    const body: InitiatePaymentRequest = await request.json();

    // Validate required fields
    const { orderId, amount, customerEmail, customerName, paymentReference } = body;
    if (!orderId || !amount || !customerEmail || !customerName || !paymentReference) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required payment fields'
        },
        { status: 400 }
      );
    }

    // Verify order exists
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order not found'
        },
        { status: 404 }
      );
    }

    // Get environment variables
    const serviceKey = process.env.NEXT_PUBLIC_NETCASH_SERVICE_KEY;
    const merchantId = process.env.NETCASH_MERCHANT_ID;
    const paymentUrl = process.env.NETCASH_PAYMENT_URL;
    const successUrl = process.env.NEXT_PUBLIC_PAYMENT_SUCCESS_URL;
    const cancelUrl = process.env.NEXT_PUBLIC_PAYMENT_CANCEL_URL;

    if (!serviceKey || !merchantId || !paymentUrl || !successUrl || !cancelUrl) {
      console.error('Missing Netcash environment variables');
      return NextResponse.json(
        {
          success: false,
          error: 'Payment gateway configuration error'
        },
        { status: 500 }
      );
    }

    // Convert amount to cents (Netcash requires amount in cents)
    const amountInCents = Math.round(amount * 100);

    // Construct Netcash payment URL with query parameters
    const netcashParams = new URLSearchParams({
      ServiceKey: serviceKey,
      MerchantReference: paymentReference,
      Amount: amountInCents.toString(),
      CustomerEmail: customerEmail,
      CustomerName: customerName,
      OrderId: orderId,
      ReturnUrl: successUrl,
      CancelUrl: cancelUrl,
      NotifyUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/netcash/webhook`,
      Currency: 'ZAR',
      PaymentMethod: 'CC', // Credit Card
      Extra1: orderId, // Pass order ID for reference
      Extra2: paymentReference,
      Extra3: customerEmail
    });

    const fullPaymentUrl = `${paymentUrl}?${netcashParams.toString()}`;

    // Update order status to processing
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        payment_status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Failed to update order status:', updateError);
    }

    // Log payment initiation in audit table
    const { error: auditError } = await supabase
      .from('payment_audit_logs')
      .insert({
        order_id: orderId,
        event_type: 'payment_initiated',
        status: 'success',
        request_body: JSON.stringify(body),
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        created_at: new Date().toISOString()
      });

    if (auditError) {
      console.error('Failed to log payment initiation:', auditError);
    }

    console.log('Payment initiated:', {
      orderId,
      paymentReference,
      amount: amountInCents,
      customerEmail
    });

    return NextResponse.json({
      success: true,
      paymentUrl: fullPaymentUrl,
      paymentReference,
      orderId,
      message: 'Payment URL generated successfully'
    });

  } catch (error) {
    console.error('Payment initiation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to initiate payment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
