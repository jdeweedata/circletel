/**
 * Netcash Webhook Processor
 * Handles payment status updates, order management, and notifications
 * Task 3.3: Netcash Webhook Integration
 */

import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';
import type { NetcashWebhookPayload } from './netcash-webhook-validator';
import { normalizeNetcashReference } from './netcash-webhook-validator';
import {
  ORDER_PROCESSING_FEE_LABEL,
  isLegacyValidationChargeAmount,
  isOrderProcessingFeeAmount,
} from '@/lib/payments/payment-amounts';

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
  payment_date?: string;
  total_paid?: number;
  metadata?: Record<string, unknown>;
}

/** Order data structure for email notifications */
export interface OrderForEmail {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  payment_reference: string;
  package_name?: string;
  package_price?: number;
  installation_address?: string;
  payment_status?: string;
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
 *
 * Handles three scenarios:
 * 1. Legacy R1.00 card validation → stores payment method, does NOT activate order
 * 2. Once-off order processing fee → confirms checkout, does NOT activate service
 * 3. Full payment → updates order status, stores payment method, sends emails
 */
export async function processPaymentSuccess(
  payload: NetcashWebhookPayload,
  webhookId: string
): Promise<WebhookProcessingResult> {
  try {
    console.log('[Webhook Processor] Processing payment success:', payload.Reference);
    const supabase = await createClient();

    const amountPaid = parseFloat(payload.Amount) / 100;
    const isLegacyCardValidation = isLegacyValidationChargeAmount(amountPaid);
    const isOrderProcessingFee = isOrderProcessingFeeAmount(amountPaid);

    // 1. Find order by payment reference — try exact match first, then normalized
    let { data: order, error: orderError } = await supabase
      .from('consumer_orders')
      .select('*')
      .eq('payment_reference', payload.Reference)
      .single();

    if (orderError || !order) {
      // Try normalized reference (strip CT- prefix and timestamp suffix)
      const normalizedRef = normalizeNetcashReference(payload.Reference);
      console.log('[Webhook Processor] Exact reference match failed, trying normalized:', normalizedRef);

      const { data: normalizedOrder, error: normalizedError } = await supabase
        .from('consumer_orders')
        .select('*')
        .eq('payment_reference', normalizedRef)
        .single();

      if (normalizedError || !normalizedOrder) {
        throw new Error(
          `Order not found for reference: ${payload.Reference} (also tried normalized: ${normalizedRef})`
        );
      }

      order = normalizedOrder;
    }

    // 2. Store payment method for recurring billing (always, even for R1.00 validations)
    if (order.customer_id) {
      await storePaymentMethod(payload, order.customer_id, order.id, webhookId);
    } else {
      // If order has no customer_id yet, try to find customer by email
      const { data: customerData } = await supabase
        .from('customers')
        .select('id')
        .eq('email', order.email)
        .maybeSingle();

      if (customerData?.id) {
        await storePaymentMethod(payload, customerData.id, order.id, webhookId);
        // Also update the order's customer_id
        await supabase
          .from('consumer_orders')
          .update({ customer_id: customerData.id, updated_at: new Date().toISOString() })
          .eq('id', order.id);
      }
    }

    // 3. For legacy R1.00 card validations, don't activate the order — just store payment method
    if (isLegacyCardValidation) {
      console.log('[Webhook Processor] R1.00 card validation detected — payment method stored, order NOT activated');

      // Update order with payment method validation metadata (keep status as pending)
      await supabase
        .from('consumer_orders')
        .update({
          metadata: {
            ...(order.metadata as Record<string, unknown> || {}),
            netcash_transaction_id: payload.TransactionID || '',
            card_validated: true,
            card_validated_at: new Date().toISOString(),
            card_validated_via: 'netcash_webhook',
            card_last_four: payload.CardNumber?.slice(-4) || null,
            card_type: payload.CardType || null,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      await createWebhookAudit(webhookId, 'card_validated', {
        order_id: order.id,
        transaction_id: payload.TransactionID,
        card_last_four: payload.CardNumber?.slice(-4),
      });

      return {
        success: true,
        orderId: order.id,
        message: 'Card validation processed — payment method stored',
      };
    }

    // 4. The checkout processing fee confirms the order but should not activate
    // service. Installation and service activation still happen through ops.
    if (isOrderProcessingFee) {
      console.log('[Webhook Processor] Order processing fee detected — order confirmed, service NOT activated');

      const updateData: OrderUpdateData = {
        payment_status: 'paid',
        status: 'confirmed',
        payment_date: new Date().toISOString(),
        total_paid: amountPaid,
        metadata: {
          ...(order.metadata as Record<string, unknown> || {}),
          netcash_transaction_id: payload.TransactionID || '',
          payment_confirmed_at: new Date().toISOString(),
          payment_confirmed_via: 'webhook',
          checkout_charge_type: 'order_processing_fee',
          checkout_charge_label: ORDER_PROCESSING_FEE_LABEL,
          card_last_four: payload.CardNumber?.slice(-4) || null,
          card_type: payload.CardType || null,
        },
      };

      const { error: updateError } = await supabase
        .from('consumer_orders')
        .update(updateData)
        .eq('id', order.id);

      if (updateError) {
        throw new Error(`Failed to update order: ${updateError.message}`);
      }

      await createWebhookAudit(webhookId, 'order_processing_fee_paid', {
        order_id: order.id,
        transaction_id: payload.TransactionID,
        amount: amountPaid,
      });

      return {
        success: true,
        orderId: order.id,
        message: 'Order processing fee processed — order confirmed',
      };
    }

    // 5. Full payment: update order status
    const updateData: OrderUpdateData = {
      payment_status: 'paid',
      status: 'active',
      payment_date: new Date().toISOString(),
      total_paid: amountPaid,
      metadata: {
        ...(order.metadata as Record<string, unknown> || {}),
        netcash_transaction_id: payload.TransactionID || '',
        payment_confirmed_at: new Date().toISOString(),
        payment_confirmed_via: 'webhook',
      },
    };

    const { error: updateError } = await supabase
      .from('consumer_orders')
      .update(updateData)
      .eq('id', order.id);

    if (updateError) {
      throw new Error(`Failed to update order: ${updateError.message}`);
    }

    // 5. Create audit log
    await createWebhookAudit(webhookId, 'order_updated', {
      order_id: order.id,
      previous_status: order.payment_status,
      new_status: 'paid'
    });

    // 6. Send confirmation email
    try {
      await sendOrderConfirmationEmail(order as OrderForEmail);
      await createWebhookAudit(webhookId, 'email_sent', {
        order_id: order.id,
        email: order.email
      });
    } catch (emailError) {
      console.error('[Webhook Processor] Email send failed:', emailError);
      await createWebhookAudit(webhookId, 'email_failed', {
        order_id: order.id,
        error: emailError instanceof Error ? emailError.message : 'Unknown error'
      });
    }

    // 7. Trigger service activation workflow
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
    const supabase = await createClient();

    // 1. Find order — try exact match first, then normalized
    let { data: order, error: orderError } = await supabase
      .from('consumer_orders')
      .select('*')
      .eq('payment_reference', payload.Reference)
      .single();

    if (orderError || !order) {
      const normalizedRef = normalizeNetcashReference(payload.Reference);
      const { data: normalizedOrder, error: normalizedError } = await supabase
        .from('consumer_orders')
        .select('*')
        .eq('payment_reference', normalizedRef)
        .single();

      if (normalizedError || !normalizedOrder) {
        throw new Error(`Order not found for reference: ${payload.Reference}`);
      }

      order = normalizedOrder;
    }

    // 2. Update order status
    const errorMessage = payload.ResponseText || payload.StatusText || 'Payment declined';
    const updateData: OrderUpdateData = {
      payment_status: 'failed',
      status: 'pending',
      metadata: {
        ...(order.metadata as Record<string, unknown> || {}),
        netcash_transaction_id: payload.TransactionID || '',
        payment_error: errorMessage,
        payment_failed_at: new Date().toISOString(),
      },
    };

    const { error: updateError } = await supabase
      .from('consumer_orders')
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
      await sendPaymentFailureEmail(order as OrderForEmail, errorMessage);
      await createWebhookAudit(webhookId, 'email_sent', {
        order_id: order.id,
        email: order.email,
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
    const supabase = await createClient();

    // 1. Find order — try exact match first, then normalized
    let { data: order, error: orderError } = await supabase
      .from('consumer_orders')
      .select('*')
      .eq('payment_reference', payload.Reference)
      .single();

    if (orderError || !order) {
      const normalizedRef = normalizeNetcashReference(payload.Reference);
      const { data: normalizedOrder, error: normalizedError } = await supabase
        .from('consumer_orders')
        .select('*')
        .eq('payment_reference', normalizedRef)
        .single();

      if (normalizedError || !normalizedOrder) {
        throw new Error(`Order not found for reference: ${payload.Reference}`);
      }

      order = normalizedOrder;
    }

    // 2. Update order status
    const updateData: OrderUpdateData = {
      payment_status: 'refunded',
      status: 'cancelled',
      metadata: {
        ...(order.metadata as Record<string, unknown> || {}),
        netcash_transaction_id: payload.TransactionID || '',
        refunded_at: new Date().toISOString(),
      },
    };

    const { error: updateError } = await supabase
      .from('consumer_orders')
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
      await sendRefundNotificationEmail(order as OrderForEmail, parseFloat(payload.Amount) / 100);
      await createWebhookAudit(webhookId, 'email_sent', {
        order_id: order.id,
        email: order.email,
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
    const supabase = await createClient();

    // 1. Find order — try exact match first, then normalized
    let { data: order, error: orderError } = await supabase
      .from('consumer_orders')
      .select('*')
      .eq('payment_reference', payload.Reference)
      .single();

    if (orderError || !order) {
      const normalizedRef = normalizeNetcashReference(payload.Reference);
      const { data: normalizedOrder, error: normalizedError } = await supabase
        .from('consumer_orders')
        .select('*')
        .eq('payment_reference', normalizedRef)
        .single();

      if (normalizedError || !normalizedOrder) {
        throw new Error(`Order not found for reference: ${payload.Reference}`);
      }

      order = normalizedOrder;
    }

    // 2. Update order status (no 'disputed' in order_status enum — use 'suspended')
    const updateData: OrderUpdateData = {
      payment_status: 'chargeback',
      status: 'suspended',
      metadata: {
        ...(order.metadata as Record<string, unknown> || {}),
        netcash_transaction_id: payload.TransactionID || '',
        chargeback_at: new Date().toISOString(),
        chargeback_reason: 'chargeback',
      },
    };

    const { error: updateError } = await supabase
      .from('consumer_orders')
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
    await sendChargebackAlert(order as OrderForEmail, payload);

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
async function sendOrderConfirmationEmail(order: OrderForEmail): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Webhook Processor] Resend API key not configured, skipping email');
    return;
  }

  try {
    const resend = getResend();
    const customerName = `${order.first_name} ${order.last_name}`.trim();
    await resend.emails.send({
      from: 'CircleTel <orders@circletel.co.za>',
      to: order.email,
      subject: `Order Confirmation - ${order.payment_reference}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #F5831F;">Thank You for Your Order!</h1>

          <p>Dear ${customerName},</p>

          <p>Your payment has been successfully processed. Your order is now active and will be processed shortly.</p>

          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0;">Order Details</h2>
            <p><strong>Order Reference:</strong> ${order.payment_reference}</p>
            <p><strong>Package:</strong> ${order.package_name || 'Service Package'}</p>
            <p><strong>Amount Paid:</strong> R${order.package_price?.toFixed(2) || '0.00'}</p>
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

    console.log('[Webhook Processor] Confirmation email sent to:', order.email);
  } catch (error) {
    console.error('[Webhook Processor] Failed to send confirmation email:', error);
    throw error;
  }
}

/**
 * Send payment failure notification
 */
async function sendPaymentFailureEmail(order: OrderForEmail, errorMessage: string): Promise<void> {
  if (!process.env.RESEND_API_KEY) return;

  try {
    const resend = getResend();
    const customerName = `${order.first_name} ${order.last_name}`.trim();
    await resend.emails.send({
      from: 'CircleTel <orders@circletel.co.za>',
      to: order.email,
      subject: `Payment Failed - ${order.payment_reference}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #F5831F;">Payment Could Not Be Processed</h1>

          <p>Dear ${customerName},</p>

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

    console.log('[Webhook Processor] Failure email sent to:', order.email);
  } catch (error) {
    console.error('[Webhook Processor] Failed to send failure email:', error);
    throw error;
  }
}

/**
 * Send refund notification
 */
async function sendRefundNotificationEmail(order: OrderForEmail, refundAmount: number): Promise<void> {
  if (!process.env.RESEND_API_KEY) return;

  try {
    const resend = getResend();
    const customerName = `${order.first_name} ${order.last_name}`.trim();
    await resend.emails.send({
      from: 'CircleTel <finance@circletel.co.za>',
      to: order.email,
      subject: `Refund Processed - ${order.payment_reference}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #F5831F;">Refund Processed</h1>

          <p>Dear ${customerName},</p>

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

    console.log('[Webhook Processor] Refund email sent to:', order.email);
  } catch (error) {
    console.error('[Webhook Processor] Failed to send refund email:', error);
    throw error;
  }
}

/**
 * Send chargeback alert to finance team
 */
async function sendChargebackAlert(order: OrderForEmail, payload: NetcashWebhookPayload): Promise<void> {
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
            <p><strong>Customer:</strong> ${order.first_name} ${order.last_name} (${order.email})</p>
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
  eventData: Record<string, unknown>
): Promise<void> {
  try {
    const supabase = await createClient();
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
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('consumer_orders')
    .select('id')
    .eq('payment_reference', paymentReference)
    .single();

  return !error && !!data;
}

/**
 * Get order by payment reference
 */
export async function getOrderByReference(paymentReference: string): Promise<any | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('consumer_orders')
    .select('*')
    .eq('payment_reference', paymentReference)
    .single();

  if (error) {
    console.error('[Webhook Processor] Failed to fetch order:', error);
    return null;
  }

  return data;
}

// ==================================================================
// PAYMENT METHOD STORAGE
// ==================================================================

/**
 * Store payment method for recurring billing
 * Extracts card details from webhook payload and stores in customer_payment_methods
 */
async function storePaymentMethod(
  payload: NetcashWebhookPayload,
  customerId: string,
  orderId: string,
  webhookId: string
): Promise<void> {
  try {
    const supabase = await getSupabase();

    // Extract card details from payload
    const cardLast4 = payload.CardNumber?.slice(-4) || 'XXXX';
    const cardType = (payload.CardType?.toLowerCase() || 'visa');
    const cardToken = payload.Token || payload.CardToken || payload.TransactionID;

    if (!cardToken) {
      console.warn('[Webhook Processor] No card token in payload, skipping payment method storage');
      return;
    }

    // Build display name
    const displayName = `${cardType.charAt(0).toUpperCase() + cardType.slice(1)} ***${cardLast4}`;

    // Check if payment method already exists for this customer with same card
    const { data: existing } = await supabase
      .from('customer_payment_methods')
      .select('id')
      .eq('customer_id', customerId)
      .eq('last_four', cardLast4)
      .eq('method_type', 'card')
      .maybeSingle();

    if (existing) {
      console.log('[Webhook Processor] Payment method already exists:', existing.id);
      // Update verification status
      await supabase
        .from('customer_payment_methods')
        .update({
          token_status: 'active',
          token_verified_at: new Date().toISOString(),
          token_last_used_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
      return;
    }

    // Check if customer already has a primary payment method
    const { data: existingPrimary } = await supabase
      .from('customer_payment_methods')
      .select('id')
      .eq('customer_id', customerId)
      .eq('is_primary', true)
      .eq('is_active', true)
      .maybeSingle();

    const shouldBePrimary = !existingPrimary;

    // Clear any existing primary if we're setting a new one
    if (shouldBePrimary) {
      await supabase
        .from('customer_payment_methods')
        .update({ is_primary: false })
        .eq('customer_id', customerId)
        .eq('is_primary', true);
    }

    // Create new payment method
    const { data: paymentMethod, error } = await supabase
      .from('customer_payment_methods')
      .insert({
        customer_id: customerId,
        method_type: 'card',
        display_name: displayName,
        card_type: cardType,
        last_four: cardLast4,
        card_masked_number: payload.CardNumber || null,
        card_token: cardToken,
        is_active: true,
        is_primary: shouldBePrimary,
        token_status: 'active',
        token_verified_at: new Date().toISOString(),
        encrypted_details: {
          verification_method: 'r1_validation',
          verification_date: new Date().toISOString(),
          transaction_id: payload.TransactionID,
          order_id: orderId,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to store payment method: ${error.message}`);
    }

    console.log('[Webhook Processor] Payment method stored:', paymentMethod.id);

    await createWebhookAudit(webhookId, 'payment_method_stored', {
      payment_method_id: paymentMethod.id,
      card_type: cardType,
      card_last_four: cardLast4,
    });

  } catch (error) {
    console.error('[Webhook Processor] Failed to store payment method:', error);
    await createWebhookAudit(webhookId, 'payment_method_storage_failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    // Don't throw - payment processing succeeded, method storage is supplementary
  }
}
