import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { apiLogger } from '@/lib/logging';

/**
 * POST /api/admin/orders/[orderId]/approve-validation
 * Manually approve payment method validation after receiving NetCash "102 Validation" email
 *
 * This is needed because NetCash sends bank validation confirmations via EMAIL,
 * not via webhook. When an admin receives the "102 Validation return" email,
 * they can use this endpoint to mark the payment method as validated.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await context.params;

    // Parse request body for optional reference number
    let body: { netcashReference?: string; notes?: string } = {};
    try {
      body = await request.json();
    } catch {
      // Empty body is fine
    }

    // Use service role to bypass RLS for admin
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get the order to find customer_id
    const { data: order, error: orderError } = await supabase
      .from('consumer_orders')
      .select('id, order_number, customer_id, status')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Find the emandate request for this order
    const { data: emandateRequest, error: emError } = await supabase
      .from('emandate_requests')
      .select('*, payment_methods(*)')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (emError) {
      apiLogger.error('Error finding emandate request:', emError);
      return NextResponse.json(
        { success: false, error: 'Failed to find payment method request' },
        { status: 500 }
      );
    }

    if (!emandateRequest) {
      return NextResponse.json(
        { success: false, error: 'No payment method request found for this order' },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();

    // Update emandate_requests status to 'signed'
    const { error: emUpdateError } = await supabase
      .from('emandate_requests')
      .update({
        status: 'signed',
        signed_at: now,
        updated_at: now,
        postback_data: {
          ...emandateRequest.postback_data,
          manual_approval: true,
          manual_approval_at: now,
          manual_approval_notes: body.notes || 'Approved via admin panel after 102 Validation email',
        },
      })
      .eq('id', emandateRequest.id);

    if (emUpdateError) {
      apiLogger.error('Error updating emandate request:', emUpdateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update emandate request' },
        { status: 500 }
      );
    }

    // Update payment_methods status to 'active'
    const { error: pmUpdateError } = await supabase
      .from('payment_methods')
      .update({
        status: 'active',
        mandate_active: true,
        mandate_signed_at: now,
        is_verified: true,
        verification_method: 'netcash_validation',
        netcash_mandate_reference: body.netcashReference || emandateRequest.netcash_account_reference,
        activated_at: now,
        updated_at: now,
      })
      .eq('id', emandateRequest.payment_method_id);

    if (pmUpdateError) {
      apiLogger.error('Error updating payment method:', pmUpdateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update payment method' },
        { status: 500 }
      );
    }

    // Update order status to payment_method_registered if still pending
    if (order.status === 'payment_method_pending') {
      const { error: orderUpdateError } = await supabase
        .from('consumer_orders')
        .update({
          status: 'payment_method_registered',
          payment_method: 'debit_order',
          updated_at: now,
        })
        .eq('id', orderId);

      if (orderUpdateError) {
        apiLogger.error('Error updating order status:', orderUpdateError);
      }
    }

    // Log the action in order_status_history
    await supabase.from('order_status_history').insert({
      entity_type: 'consumer_order',
      entity_id: orderId,
      old_status: order.status,
      new_status: 'payment_method_registered',
      change_reason: 'Payment method validation approved manually (NetCash 102 Validation email received)',
      automated: false,
      customer_notified: false,
      status_changed_at: now,
    });

    apiLogger.info('Payment method validation approved:', {
      orderId,
      orderNumber: order.order_number,
      paymentMethodId: emandateRequest.payment_method_id,
    });

    return NextResponse.json({
      success: true,
      message: 'Payment method validation approved successfully',
      data: {
        orderId,
        orderNumber: order.order_number,
        paymentMethodId: emandateRequest.payment_method_id,
        newStatus: 'active',
      },
    });
  } catch (error) {
    apiLogger.error('Error approving payment method validation:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
