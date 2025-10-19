import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/integrations/supabase/server';
import { netcashService } from '@/lib/payments/netcash-service';

/**
 * POST /api/payments/initiate
 * Initiate a payment for an order
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: orderId' },
        { status: 400 }
      );
    }

    // Check if Netcash is configured
    if (!netcashService.isConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Payment gateway not configured. Please contact support.'
        },
        { status: 500 }
      );
    }

    const supabase = await createClient();

    // Fetch order details
    const { data: order, error: orderError } = await supabase
      .from('consumer_orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if order is already paid
    if (order.payment_status === 'paid') {
      return NextResponse.json(
        { success: false, error: 'Order is already paid' },
        { status: 400 }
      );
    }

    // Check if order is cancelled
    if (order.status === 'cancelled') {
      return NextResponse.json(
        { success: false, error: 'Order is cancelled and cannot be paid' },
        { status: 400 }
      );
    }

    // Calculate total amount (package price + installation fee)
    const packagePrice = order.package_price || 0;
    const installationFee = order.installation_fee || 0;
    const totalAmount = packagePrice + installationFee;

    if (totalAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid order amount' },
        { status: 400 }
      );
    }

    // Generate payment form data
    const paymentFormData = netcashService.generatePaymentFormData({
      orderId: order.id,
      orderNumber: order.order_number,
      customerName: `${order.first_name} ${order.last_name}`,
      customerEmail: order.email,
      amount: totalAmount,
      description: `CircleTel Order ${order.order_number} - ${order.package_name}`,
    });

    // Generate payment URL
    const paymentUrl = netcashService.generatePaymentUrl(paymentFormData);

    // Create payment transaction record
    const { data: transaction, error: transactionError } = await supabase
      .from('payment_transactions')
      .insert({
        order_id: order.id,
        order_type: 'consumer',
        order_number: order.order_number,
        amount: totalAmount,
        currency: 'ZAR',
        payment_provider: 'netcash',
        provider_reference: paymentFormData.m5, // Transaction reference
        status: 'pending',
        payment_method: null,
        customer_email: order.email,
        customer_name: `${order.first_name} ${order.last_name}`,
        metadata: {
          package_name: order.package_name,
          package_price: packagePrice,
          installation_fee: installationFee,
        },
      })
      .select()
      .single();

    if (transactionError) {
      console.error('Error creating payment transaction:', transactionError);
      // Continue anyway - payment can still work even if we don't track it perfectly
    }

    return NextResponse.json({
      success: true,
      paymentUrl,
      transactionId: transaction?.id,
      amount: totalAmount,
      order: {
        id: order.id,
        order_number: order.order_number,
        package_name: order.package_name,
      },
      message: 'Payment initiated successfully',
    });
  } catch (error) {
    console.error('Payment initiation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initiate payment',
      },
      { status: 500 }
    );
  }
}
