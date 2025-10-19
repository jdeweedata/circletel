import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/integrations/supabase/server';
import { netcashService, NetcashCallback } from '@/lib/payments/netcash-service';
import { EmailNotificationService } from '@/lib/notifications/notification-service';

/**
 * POST /api/payments/callback
 * Webhook endpoint for Netcash payment notifications
 * This is called by Netcash when payment status changes
 */
export async function POST(request: NextRequest) {
  try {
    // Parse callback data (Netcash sends as form data or query params)
    const contentType = request.headers.get('content-type');
    let callbackData: NetcashCallback;

    if (contentType?.includes('application/json')) {
      callbackData = await request.json();
    } else {
      // Parse form data or query params
      const formData = await request.formData();
      callbackData = Object.fromEntries(formData.entries()) as any;
    }

    console.log('Netcash callback received:', callbackData);

    // Process the callback
    const result = netcashService.processCallback(callbackData);

    if (!result.success) {
      console.error('Payment callback processing failed:', result.error);
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    const { orderId, orderNumber, amount, reference, transactionDate, netcashTrace } = result;

    if (!orderId) {
      console.error('No order ID in callback data');
      return NextResponse.json(
        { success: false, error: 'Missing order ID' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Update payment transaction
    const { error: transactionError } = await supabase
      .from('payment_transactions')
      .update({
        status: 'completed',
        payment_method: 'card', // Netcash doesn't specify, default to card
        provider_transaction_id: netcashTrace || reference,
        completed_at: transactionDate || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('provider_reference', reference);

    if (transactionError) {
      console.error('Error updating payment transaction:', transactionError);
    }

    // Update order status
    const { data: order, error: orderError } = await supabase
      .from('consumer_orders')
      .update({
        status: 'payment',
        payment_status: 'paid',
        payment_method: 'card',
        payment_date: new Date().toISOString(),
        total_paid: amount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select()
      .single();

    if (orderError) {
      console.error('Error updating order:', orderError);
      return NextResponse.json(
        { success: false, error: 'Failed to update order' },
        { status: 500 }
      );
    }

    // Send payment confirmation email
    try {
      await EmailNotificationService.sendPaymentConfirmation(order);
      console.log('Payment confirmation email sent to:', order.email);
    } catch (emailError) {
      console.error('Failed to send payment confirmation email:', emailError);
      // Don't fail the callback if email fails
    }

    // Return success response for Netcash
    return NextResponse.json({
      success: true,
      message: 'Payment processed successfully',
    });
  } catch (error) {
    console.error('Payment callback error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process payment callback',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/payments/callback
 * Handle GET requests (Netcash might send callback as GET with query params)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const callbackData: NetcashCallback = {
      TransactionAccepted: searchParams.get('TransactionAccepted') || undefined,
      Complete: searchParams.get('Complete') || undefined,
      Amount: searchParams.get('Amount') || undefined,
      Reference: searchParams.get('Reference') || undefined,
      Reason: searchParams.get('Reason') || undefined,
      TransactionDate: searchParams.get('TransactionDate') || undefined,
      Extra1: searchParams.get('Extra1') || undefined,
      Extra2: searchParams.get('Extra2') || undefined,
      Extra3: searchParams.get('Extra3') || undefined,
      RequestTrace: searchParams.get('RequestTrace') || undefined,
    };

    // Forward to POST handler logic
    const result = netcashService.processCallback(callbackData);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    const { orderId, amount, reference } = result;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Missing order ID' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Update payment transaction and order (same logic as POST)
    await supabase
      .from('payment_transactions')
      .update({
        status: 'completed',
        payment_method: 'card',
        completed_at: new Date().toISOString(),
      })
      .eq('provider_reference', reference);

    const { data: order } = await supabase
      .from('consumer_orders')
      .update({
        status: 'payment',
        payment_status: 'paid',
        payment_method: 'card',
        payment_date: new Date().toISOString(),
        total_paid: amount,
      })
      .eq('id', orderId)
      .select()
      .single();

    if (order) {
      await EmailNotificationService.sendPaymentConfirmation(order);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Payment callback (GET) error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process callback' },
      { status: 500 }
    );
  }
}
