/**
 * Order Payment Update Service
 *
 * Connects NetCash payment webhooks to consumer orders
 * Updates order status and dashboards when payment is completed
 */

import { createClient } from '@supabase/supabase-js';
import { EmailNotificationService } from '@/lib/notifications/notification-service';
import { paymentLogger } from '@/lib/logging';

interface PaymentOrderUpdateResult {
  success: boolean;
  order_id?: string;
  order_number?: string;
  old_status?: string;
  new_status?: string;
  error?: string;
}

/**
 * Update order status when payment is completed
 * Called from NetCash webhook when ResponseCode = 0
 *
 * @param transactionReference - Payment reference (should match order_number or order_id)
 * @param paymentTransactionId - ID from payment_transactions table
 * @param amount - Payment amount
 * @returns Update result
 */
export async function updateOrderFromPayment(
  transactionReference: string,
  paymentTransactionId: string,
  amount: number
): Promise<PaymentOrderUpdateResult> {
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

  try {
    paymentLogger.info('Processing payment', { transactionReference });

    // Find the order by reference (could be order_number or order_id)
    const { data: orders, error: searchError } = await supabase
      .from('consumer_orders')
      .select('*')
      .or(`order_number.eq.${transactionReference},id.eq.${transactionReference}`)
      .limit(1);

    if (searchError) {
      throw new Error(`Failed to find order: ${searchError.message}`);
    }

    if (!orders || orders.length === 0) {
      paymentLogger.warn('No order found for reference', { transactionReference });
      return {
        success: false,
        error: `No order found for reference: ${transactionReference}`
      };
    }

    const order = orders[0];
    paymentLogger.debug('Found order', { orderNumber: order.order_number, status: order.status });

    // Determine new order status based on current status
    let newStatus = order.status;
    const updates: any = {
      payment_reference: transactionReference,
      total_paid: amount,
      payment_date: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Update status based on current workflow position
    if (order.status === 'pending' || order.status === 'payment_method_pending') {
      newStatus = 'payment_method_registered';
      updates.status = newStatus;
      updates.payment_status = 'paid';
      paymentLogger.debug('Advancing order to payment_method_registered');
    } else if (order.status === 'payment_pending') {
      newStatus = 'payment_received';
      updates.status = newStatus;
      updates.payment_status = 'paid';
      paymentLogger.debug('Marking payment as received');
    } else {
      // Just update payment info, don't change status
      updates.payment_status = 'paid';
      paymentLogger.debug('Updating payment info without status change');
    }

    // Update the order
    const { data: updatedOrder, error: updateError } = await supabase
      .from('consumer_orders')
      .update(updates)
      .eq('id', order.id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update order: ${updateError.message}`);
    }

    // Log status change if status changed
    if (newStatus !== order.status) {
      await supabase.from('order_status_history').insert({
        entity_type: 'consumer_order',
        entity_id: order.id,
        old_status: order.status,
        new_status: newStatus,
        change_reason: `Payment received via NetCash (Transaction: ${transactionReference})`,
        changed_by: null,
        automated: true,
        customer_notified: false,
        status_changed_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      });
    }

    // Send customer notification
    try {
      await EmailNotificationService.send({
        to: order.email,
        subject: `Payment Received - ${order.order_number}`,
        template: 'payment_received',
        data: {
          customer_name: `${order.first_name} ${order.last_name}`,
          order_number: order.order_number,
          amount: amount,
          package_name: order.package_name,
          payment_date: new Date().toLocaleDateString('en-ZA'),
        },
        tags: {
          order_id: order.id,
          notification_type: 'payment_received',
        },
      });
      paymentLogger.info('Customer payment notification sent', { orderId: order.id });
    } catch (notifyError) {
      // Log but don't fail the update
      paymentLogger.warn('Failed to send customer payment notification', {
        orderId: order.id,
        error: notifyError instanceof Error ? notifyError.message : 'Unknown error',
      });
    }

    // Notify admin of payment received
    try {
      const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'admin@circletel.co.za';
      await EmailNotificationService.send({
        to: adminEmail,
        subject: `Payment Received - ${order.order_number} (R${amount.toFixed(2)})`,
        template: 'admin_payment_received',
        data: {
          order_number: order.order_number,
          customer_name: `${order.first_name} ${order.last_name}`,
          customer_email: order.email,
          amount: amount,
          package_name: order.package_name,
          old_status: order.status,
          new_status: newStatus,
          transaction_reference: transactionReference,
        },
        tags: {
          order_id: order.id,
          notification_type: 'admin_payment_alert',
        },
      });
      paymentLogger.info('Admin payment notification sent', { orderId: order.id });
    } catch (adminNotifyError) {
      paymentLogger.warn('Failed to send admin payment notification', {
        orderId: order.id,
        error: adminNotifyError instanceof Error ? adminNotifyError.message : 'Unknown error',
      });
    }

    paymentLogger.info('Order updated successfully', {
      orderId: order.id,
      orderNumber: order.order_number,
      oldStatus: order.status,
      newStatus,
      amount,
    });

    return {
      success: true,
      order_id: order.id,
      order_number: order.order_number,
      old_status: order.status,
      new_status: newStatus
    };

  } catch (error) {
    paymentLogger.error('Order payment update error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      transactionReference,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get payment status for an order
 *
 * @param orderId - Order UUID
 * @returns Payment status details
 */
export async function getOrderPaymentStatus(orderId: string) {
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

  const { data: order } = await supabase
    .from('consumer_orders')
    .select('payment_status, payment_reference, total_paid, payment_date')
    .eq('id', orderId)
    .single();

  if (!order) {
    return null;
  }

  return {
    status: order.payment_status,
    reference: order.payment_reference,
    amount_paid: order.total_paid,
    payment_date: order.payment_date
  };
}
