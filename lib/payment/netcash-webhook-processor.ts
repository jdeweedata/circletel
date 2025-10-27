/**
 * Netcash Webhook Processor
 * Handles payment status updates, order management, and notifications
 * Task 3.3: Netcash Webhook Integration
 */

import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';
import type { NetcashWebhookPayload } from './netcash-webhook-validator';

// ==================================================================
// TYPES
// ==================================================================

export interface WebhookProcessingResult {
  success: boolean;
  orderId?: string;
  message?: string;
  error?: string;
}

export interface OrderUpdateData {
  payment_status: string;
  status?: string;
  netcash_transaction_id?: string;
  payment_date?: string;
  payment_amount?: number;
  payment_error?: string;
}

// ==================================================================
// INITIALIZATION
// ==================================================================

// Helper to get Supabase client (lazy initialization)
async function getSupabase() {
  return await createClient();
}

// Helper to get Resend client (lazy initialization)
function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable is not set');
  }
  return new Resend(apiKey);
}

// ==================================================================
// PAYMENT SUCCESS PROCESSING
// ==================================================================

/**
 * Process successful payment webhook
 */
export async function processPaymentSuccess(
  payload: NetcashWebhookPayload,
  webhookId: string
): Promise<WebhookProcessingResult> {
  try {
    console.log('[Webhook Processor] Processing payment success:', payload.Reference);

    // 1. Find order by payment reference
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('payment_reference', payload.Reference)
      .single();

    if (orderError || !order) {
      throw new Error(`Order not found for reference: ${payload.Reference}`);
    }

    // 2. Update order status
    const updateData: OrderUpdateData = {
      payment_status: 'paid',
      status: 'active',
      netcash_transaction_id: payload.TransactionID || '',
      payment_date: new Date().toISOString(),
      payment_amount: parseFloat(payload.Amount) / 100, // Convert from cents
    };

    const { error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', order.id);

    if (updateError) {
      throw new Error(`Failed to update order: ${updateError.message}`);
    }

    // 3. Create audit log
    await createWebhookAudit(webhookId, 'order_updated', {
      order_id: order.id,
      previous_status: order.payment_status,
      new_status: 'paid'
    });

    // 4. Send confirmation email
    try {
      await sendOrderConfirmationEmail(order);
      await createWebhookAudit(webhookId, 'email_sent', {
        order_id: order.id,
        email: order.customer_email
      });
    } catch (emailError) {
      console.error('[Webhook Processor] Email send failed:', emailError);
      // Don't fail the webhook if email fails
      await createWebhookAudit(webhookId, 'email_failed', {
        order_id: order.id,
        error: emailError instanceof Error ? emailError.message : 'Unknown error'
      });
    }

    // 5. Trigger service activation workflow (if needed)
    await triggerServiceActivation(order.id);

    return {
      success: true,
      orderId: order.id,
      message: 'Payment processed successfully'
    };
  } catch (error) {
    console.error('[Webhook Processor] Payment success processing failed:', error);

    await createWebhookAudit(webhookId, 'processing_failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// ==================================================================
// PAYMENT FAILURE PROCESSING
// ==================================================================

/**
 * Process failed payment webhook
 */
export async function processPaymentFailure(
  payload: NetcashWebhookPayload,
  webhookId: string
): Promise<WebhookProcessingResult> {
  try {
    console.log('[Webhook Processor] Processing payment failure:', payload.Reference);

    // 1. Find order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('payment_reference', payload.Reference)
      .single();

    if (orderError || !order) {
      throw new Error(`Order not found for reference: ${payload.Reference}`);
    }

    // 2. Update order status
    const updateData: OrderUpdateData = {
      payment_status: 'failed',
      status: 'pending',
      netcash_transaction_id: payload.TransactionID || '',
      payment_error: payload.ResponseText || payload.StatusText || 'Payment declined'
    };

    const { error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', order.id);

    if (updateError) {
      throw new Error(`Failed to update order: ${updateError.message}`);
    }

    // 3. Create audit log
    await createWebhookAudit(webhookId, 'order_updated', {
      order_id: order.id,
      previous_status: order.payment_status,
      new_status: 'failed',
      error: payload.ResponseText
    });

    // 4. Send failure notification email
    try {
      await sendPaymentFailureEmail(order, payload.ResponseText || 'Payment was declined');
      await createWebhookAudit(webhookId, 'email_sent', {
        order_id: order.id,
        email: order.customer_email,
        type: 'failure_notification'
      });
    } catch (emailError) {
      console.error('[Webhook Processor] Email send failed:', emailError);
    }

    return {
      success: true,
      orderId: order.id,
      message: 'Payment failure processed'
    };
  } catch (error) {
    console.error('[Webhook Processor] Payment failure processing failed:', error);

    await createWebhookAudit(webhookId, 'processing_failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// ==================================================================
// REFUND PROCESSING
// ==================================================================

/**
 * Process refund webhook
 */
export async function processRefund(
  payload: NetcashWebhookPayload,
  webhookId: string
): Promise<WebhookProcessingResult> {
  try {
    console.log('[Webhook Processor] Processing refund:', payload.Reference);

    // 1. Find order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('payment_reference', payload.Reference)
      .single();

    if (orderError || !order) {
      throw new Error(`Order not found for reference: ${payload.Reference}`);
    }

    // 2. Update order status
    const updateData: OrderUpdateData = {
      payment_status: 'refunded',
      status: 'cancelled',
      netcash_transaction_id: payload.TransactionID || ''
    };

    const { error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', order.id);

    if (updateError) {
      throw new Error(`Failed to update order: ${updateError.message}`);
    }

    // 3. Create audit log
    await createWebhookAudit(webhookId, 'order_updated', {
      order_id: order.id,
      previous_status: order.payment_status,
      new_status: 'refunded',
      refund_amount: payload.Amount
    });

    // 4. Send refund notification
    try {
      await sendRefundNotificationEmail(order, parseFloat(payload.Amount) / 100);
      await createWebhookAudit(webhookId, 'email_sent', {
        order_id: order.id,
        email: order.customer_email,
        type: 'refund_notification'
      });
    } catch (emailError) {
      console.error('[Webhook Processor] Email send failed:', emailError);
    }

    return {
      success: true,
      orderId: order.id,
      message: 'Refund processed successfully'
    };
  } catch (error) {
    console.error('[Webhook Processor] Refund processing failed:', error);

    await createWebhookAudit(webhookId, 'processing_failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// ==================================================================
// CHARGEBACK PROCESSING
// ==================================================================

/**
 * Process chargeback webhook
 */
export async function processChargeback(
  payload: NetcashWebhookPayload,
  webhookId: string
): Promise<WebhookProcessingResult> {
  try {
    console.log('[Webhook Processor] Processing chargeback:', payload.Reference);

    // 1. Find order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('payment_reference', payload.Reference)
      .single();

    if (orderError || !order) {
      throw new Error(`Order not found for reference: ${payload.Reference}`);
    }

    // 2. Update order status
    const updateData: OrderUpdateData = {
      payment_status: 'chargeback',
      status: 'disputed',
      netcash_transaction_id: payload.TransactionID || ''
    };

    const { error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', order.id);

    if (updateError) {
      throw new Error(`Failed to update order: ${updateError.message}`);
    }

    // 3. Create audit log
    await createWebhookAudit(webhookId, 'order_updated', {
      order_id: order.id,
      previous_status: order.payment_status,
      new_status: 'chargeback',
      chargeback_amount: payload.Amount
    });

    // 4. Alert finance team
    await sendChargebackAlert(order, payload);

    return {
      success: true,
      orderId: order.id,
      message: 'Chargeback processed successfully'
    };
  } catch (error) {
    console.error('[Webhook Processor] Chargeback processing failed:', error);

    await createWebhookAudit(webhookId, 'processing_failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// ==================================================================
// EMAIL NOTIFICATION FUNCTIONS
// ==================================================================

/**
 * Send order confirmation email
 */
async function sendOrderConfirmationEmail(order: any): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Webhook Processor] Resend API key not configured, skipping email');
    return;
  }

  try {
    const resend = getResend();
    await resend.emails.send({
      from: 'CircleTel <orders@circletel.co.za>',
      to: order.customer_email,
      subject: `Order Confirmation - ${order.payment_reference}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #F5831F;">Thank You for Your Order!</h1>

          <p>Dear ${order.customer_name},</p>

          <p>Your payment has been successfully processed. Your order is now active and will be processed shortly.</p>

          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0;">Order Details</h2>
            <p><strong>Order Reference:</strong> ${order.payment_reference}</p>
            <p><strong>Package:</strong> ${order.package_name || 'Service Package'}</p>
            <p><strong>Amount Paid:</strong> R${order.total_amount?.toFixed(2) || '0.00'}</p>
            <p><strong>Installation Address:</strong> ${order.installation_address || 'N/A'}</p>
          </div>

          <p>Our team will contact you within 24 hours to schedule your installation.</p>

          <p>If you have any questions, please contact us at:</p>
          <ul>
            <li>Email: support@circletel.co.za</li>
            <li>Phone: 0860 CIRCLE (247 253)</li>
          </ul>

          <p>Thank you for choosing CircleTel!</p>

          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="font-size: 12px; color: #666;">
            This is an automated confirmation email. Please do not reply to this message.
          </p>
        </div>
      `
    });

    console.log('[Webhook Processor] Confirmation email sent to:', order.customer_email);
  } catch (error) {
    console.error('[Webhook Processor] Failed to send confirmation email:', error);
    throw error;
  }
}

/**
 * Send payment failure notification
 */
async function sendPaymentFailureEmail(order: any, errorMessage: string): Promise<void> {
  if (!process.env.RESEND_API_KEY) return;

  try {
    const resend = getResend();
    await resend.emails.send({
      from: 'CircleTel <orders@circletel.co.za>',
      to: order.customer_email,
      subject: `Payment Failed - ${order.payment_reference}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #F5831F;">Payment Could Not Be Processed</h1>

          <p>Dear ${order.customer_name},</p>

          <p>We were unable to process your payment for order ${order.payment_reference}.</p>

          <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
            <strong>Reason:</strong> ${errorMessage}
          </div>

          <p>Please try again or contact your bank if you believe this was an error.</p>

          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/order/payment?ref=${order.payment_reference}"
             style="display: inline-block; background-color: #F5831F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0;">
            Retry Payment
          </a></p>

          <p>If you need assistance, please contact us at support@circletel.co.za or call 0860 CIRCLE (247 253).</p>
        </div>
      `
    });

    console.log('[Webhook Processor] Failure email sent to:', order.customer_email);
  } catch (error) {
    console.error('[Webhook Processor] Failed to send failure email:', error);
    throw error;
  }
}

/**
 * Send refund notification
 */
async function sendRefundNotificationEmail(order: any, refundAmount: number): Promise<void> {
  if (!process.env.RESEND_API_KEY) return;

  try {
    const resend = getResend();
    await resend.emails.send({
      from: 'CircleTel <finance@circletel.co.za>',
      to: order.customer_email,
      subject: `Refund Processed - ${order.payment_reference}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #F5831F;">Refund Processed</h1>

          <p>Dear ${order.customer_name},</p>

          <p>Your refund has been processed successfully.</p>

          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Order Reference:</strong> ${order.payment_reference}</p>
            <p><strong>Refund Amount:</strong> R${refundAmount.toFixed(2)}</p>
            <p><strong>Processed Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>

          <p>The refund will appear in your account within 3-5 business days.</p>

          <p>If you have any questions, please contact our finance team at finance@circletel.co.za.</p>
        </div>
      `
    });

    console.log('[Webhook Processor] Refund email sent to:', order.customer_email);
  } catch (error) {
    console.error('[Webhook Processor] Failed to send refund email:', error);
    throw error;
  }
}

/**
 * Send chargeback alert to finance team
 */
async function sendChargebackAlert(order: any, payload: NetcashWebhookPayload): Promise<void> {
  if (!process.env.RESEND_API_KEY) return;

  try {
    const resend = getResend();
    await resend.emails.send({
      from: 'CircleTel Alerts <alerts@circletel.co.za>',
      to: 'finance@circletel.co.za',
      subject: `⚠️ Chargeback Alert - ${order.payment_reference}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #dc3545;">⚠️ Chargeback Alert</h1>

          <p>A chargeback has been initiated for the following order:</p>

          <div style="background-color: #f8d7da; padding: 20px; border-left: 4px solid #dc3545; margin: 20px 0;">
            <p><strong>Order Reference:</strong> ${order.payment_reference}</p>
            <p><strong>Customer:</strong> ${order.customer_name} (${order.customer_email})</p>
            <p><strong>Amount:</strong> R${(parseFloat(payload.Amount) / 100).toFixed(2)}</p>
            <p><strong>Transaction ID:</strong> ${payload.TransactionID || 'N/A'}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          </div>

          <p><strong>Action Required:</strong> Please review this chargeback in the admin panel and prepare a response.</p>

          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/payments/webhooks"
             style="display: inline-block; background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
            View Details
          </a></p>
        </div>
      `
    });

    console.log('[Webhook Processor] Chargeback alert sent to finance team');
  } catch (error) {
    console.error('[Webhook Processor] Failed to send chargeback alert:', error);
    throw error;
  }
}

// ==================================================================
// HELPER FUNCTIONS
// ==================================================================

/**
 * Create webhook audit log entry
 */
async function createWebhookAudit(
  webhookId: string,
  eventType: string,
  eventData: any
): Promise<void> {
  try {
    await supabase
      .from('payment_webhook_audit')
      .insert({
        webhook_id: webhookId,
        event_type: eventType,
        event_data: eventData
      });
  } catch (error) {
    console.error('[Webhook Processor] Failed to create audit log:', error);
  }
}

/**
 * Trigger service activation workflow
 * This is a placeholder - implement based on your service activation process
 */
async function triggerServiceActivation(orderId: string): Promise<void> {
  try {
    console.log('[Webhook Processor] Triggering service activation for order:', orderId);

    // TODO: Implement service activation logic
    // This might involve:
    // - Creating tickets in support system
    // - Scheduling installation
    // - Provisioning accounts
    // - Updating CRM

    // For now, just log
    await createWebhookAudit(orderId, 'service_activation_triggered', {
      order_id: orderId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Webhook Processor] Service activation failed:', error);
  }
}

/**
 * Check if order exists
 */
export async function orderExists(paymentReference: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('orders')
    .select('id')
    .eq('payment_reference', paymentReference)
    .single();

  return !error && !!data;
}

/**
 * Get order by payment reference
 */
export async function getOrderByReference(paymentReference: string): Promise<any | null> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('payment_reference', paymentReference)
    .single();

  if (error) {
    console.error('[Webhook Processor] Failed to fetch order:', error);
    return null;
  }

  return data;
}
