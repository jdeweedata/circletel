import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/integrations/supabase/server';

/**
 * GET /api/payments/status/[transactionId]
 * Check the status of a payment transaction
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ transactionId: string }> }
) {
  try {
    const { transactionId } = await context.params;

    if (!transactionId) {
      return NextResponse.json(
        { success: false, error: 'Missing transaction ID' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch transaction details
    const { data: transaction, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (error || !transaction) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Fetch order details
    const { data: order } = await supabase
      .from('consumer_orders')
      .select('id, order_number, status, payment_status')
      .eq('id', transaction.order_id)
      .single();

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id,
        status: transaction.status,
        amount: transaction.amount,
        currency: transaction.currency,
        payment_method: transaction.payment_method,
        provider: transaction.payment_provider,
        reference: transaction.provider_reference,
        initiated_at: transaction.initiated_at,
        completed_at: transaction.completed_at,
        failed_at: transaction.failed_at,
      },
      order: order
        ? {
            id: order.id,
            order_number: order.order_number,
            status: order.status,
            payment_status: order.payment_status,
          }
        : null,
    });
  } catch (error) {
    console.error('Payment status check error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check payment status',
      },
      { status: 500 }
    );
  }
}
