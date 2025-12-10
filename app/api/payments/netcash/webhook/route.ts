/**
 * NetCash Pay Now Webhook Handler
 *
 * POST /api/payments/netcash/webhook
 *
 * Handles payment notifications from NetCash Pay Now.
 * Logs all webhooks to payment_webhook_logs table.
 * Updates payment_transactions table.
 *
 * @module app/api/payments/netcash/webhook
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';
import { syncPaymentToZohoBilling } from '@/lib/integrations/zoho/payment-sync-service';
import { updateOrderFromPayment } from '@/lib/orders/payment-order-updater';
import { EnhancedEmailService } from '@/lib/emails/enhanced-notification-service';
import { formatPaymentMethod } from '@/lib/payments/types';

/**
 * Verify NetCash webhook signature
 *
 * NetCash signs webhook requests using HMAC-SHA256.
 * This prevents unauthorized requests and ensures data integrity.
 *
 * @param payload - Raw request body
 * @param signature - Signature from x-netcash-signature header
 * @param secret - NetCash service key
 * @returns True if signature is valid
 */
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('[NetCash Webhook] Signature verification error:', error);
    return false;
  }
}

/**
 * POST handler - Process NetCash webhook
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const supabase = await createClient();

  try {
    // 1. Get webhook data
    const rawBody = await request.text();
    const headers = Object.fromEntries(request.headers.entries());
    const signature = headers['x-netcash-signature'] || headers['x-webhook-signature'] || '';
    const sourceIp = headers['x-forwarded-for'] || headers['x-real-ip'] || 'unknown';
    const userAgent = headers['user-agent'] || 'unknown';

    console.log('[NetCash Webhook] Received webhook from:', sourceIp);

    // 2. Parse payload - NetCash sends form data (application/x-www-form-urlencoded), NOT JSON
    let bodyParsed: Record<string, unknown> = {};
    const contentType = headers['content-type'] || '';

    try {
      if (contentType.includes('application/json')) {
        // JSON payload
        bodyParsed = JSON.parse(rawBody);
        console.log('[NetCash Webhook] Parsed as JSON');
      } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
        // Form data payload (NetCash default format)
        const params = new URLSearchParams(rawBody);
        params.forEach((value, key) => {
          bodyParsed[key] = value;
        });
        console.log('[NetCash Webhook] Parsed as form data');
      } else {
        // Try JSON first, then form data as fallback
        try {
          bodyParsed = JSON.parse(rawBody);
          console.log('[NetCash Webhook] Parsed as JSON (no content-type)');
        } catch {
          const params = new URLSearchParams(rawBody);
          params.forEach((value, key) => {
            bodyParsed[key] = value;
          });
          console.log('[NetCash Webhook] Parsed as form data (fallback)');
        }
      }
    } catch (parseError) {
      console.error('[NetCash Webhook] Failed to parse payload:', parseError);
      console.error('[NetCash Webhook] Raw body:', rawBody.substring(0, 500));
      return NextResponse.json(
        { error: 'Invalid payload format' },
        { status: 400 }
      );
    }

    console.log('[NetCash Webhook] Parsed body:', JSON.stringify(bodyParsed).substring(0, 500));

    // 3. Extract webhook data - NetCash uses various field names
    const webhookId = (bodyParsed.webhook_id as string) || crypto.randomUUID();
    const eventType = (bodyParsed.event_type as string) || 'payment.notification';
    // NetCash sends transaction ID as RequestTrace, TransactionId, or transaction_id
    const transactionId = (bodyParsed.RequestTrace as string) ||
                         (bodyParsed.TransactionId as string) ||
                         (bodyParsed.transaction_id as string) ||
                         'unknown';
    // Reference is in Reference or Extra1 field
    const reference = (bodyParsed.Reference as string) ||
                     (bodyParsed.reference as string) ||
                     (bodyParsed.Extra1 as string) || '';

    console.log('[NetCash Webhook] Processing:', {
      webhookId,
      eventType,
      transactionId,
      reference,
      allFields: Object.keys(bodyParsed)
    });

    // 4. Verify signature (if secret is configured)
    const webhookSecret = process.env.NETCASH_WEBHOOK_SECRET || process.env.NETCASH_SERVICE_KEY || '';
    let signatureVerified = false;

    if (webhookSecret && signature) {
      signatureVerified = verifyWebhookSignature(rawBody, signature, webhookSecret);

      if (!signatureVerified) {
        console.warn('[NetCash Webhook] Invalid signature!');

        // Log failed webhook
        await supabase.from('payment_webhook_logs').insert({
          webhook_id: webhookId,
          provider: 'netcash',
          event_type: eventType,
          http_method: 'POST',
          headers: headers,
          body: rawBody,
          body_parsed: bodyParsed,
          signature: signature,
          signature_verified: false,
          status: 'failed',
          success: false,
          error_message: 'Invalid webhook signature',
          source_ip: sourceIp,
          user_agent: userAgent,
          transaction_id: transactionId,
          reference: reference,
          received_at: new Date().toISOString()
        });

        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    } else {
      console.warn('[NetCash Webhook] No signature verification (webhook secret not configured)');
    }

    // 5. Start processing
    const processingStartedAt = new Date().toISOString();

    // 6. Determine payment status from NetCash response
    let paymentStatus = 'pending';
    const responseCode = bodyParsed.ResponseCode || bodyParsed.response_code;
    const transactionAccepted = bodyParsed.TransactionAccepted || bodyParsed.transaction_accepted;
    const reason = bodyParsed.Reason || bodyParsed.reason || '';
    const amount = parseFloat(String(bodyParsed.Amount || bodyParsed.amount || '0'));

    // NetCash uses multiple status indicators:
    // 1. TransactionAccepted: "true" / "false" (most common in Pay Now)
    // 2. ResponseCode: 0=Success, 1=Declined, 2=Cancelled, 3=Pending
    // 3. Reason: "Success", "Declined", etc.

    // Check TransactionAccepted first (primary indicator for Pay Now)
    if (transactionAccepted === 'true' || transactionAccepted === true) {
      paymentStatus = 'completed';
    } else if (transactionAccepted === 'false' || transactionAccepted === false) {
      // Check reason for more detail
      if (reason.toLowerCase().includes('cancel')) {
        paymentStatus = 'cancelled';
      } else {
        paymentStatus = 'failed';
      }
    } else if (responseCode !== undefined) {
      // Fallback to ResponseCode
      if (responseCode === 0 || responseCode === '0') {
        paymentStatus = 'completed';
      } else if (responseCode === 1 || responseCode === '1') {
        paymentStatus = 'failed';
      } else if (responseCode === 2 || responseCode === '2') {
        paymentStatus = 'cancelled';
      }
    } else if (reason.toLowerCase() === 'success') {
      // Last resort: check Reason field
      paymentStatus = 'completed';
    }

    console.log('[NetCash Webhook] Payment status:', paymentStatus, {
      transactionAccepted,
      responseCode,
      reason
    });

    // 7. Check for existing webhook (idempotency)
    const { data: existingWebhook } = await supabase
      .from('payment_webhook_logs')
      .select('id')
      .eq('transaction_id', transactionId)
      .eq('status', 'processed')
      .single();

    if (existingWebhook) {
      console.log('[NetCash Webhook] Duplicate webhook, ignoring');
      return NextResponse.json({
        success: true,
        message: 'Webhook already processed'
      });
    }

    // 8. Log webhook
    const { data: webhookLog, error: webhookError } = await supabase
      .from('payment_webhook_logs')
      .insert({
        webhook_id: webhookId,
        provider: 'netcash',
        event_type: eventType,
        http_method: 'POST',
        headers: headers,
        body: rawBody,
        body_parsed: bodyParsed,
        signature: signature || null,
        signature_verified: signatureVerified,
        signature_algorithm: signature ? 'hmac-sha256' : null,
        status: 'processing',
        processing_started_at: processingStartedAt,
        source_ip: sourceIp,
        user_agent: userAgent,
        transaction_id: transactionId,
        reference: reference,
        received_at: new Date().toISOString()
      })
      .select()
      .single();

    if (webhookError) {
      console.error('[NetCash Webhook] Failed to log webhook:', webhookError);
    }

    // 9. Update or create payment transaction
    // First try to find by transaction_id (NetCash RequestTrace)
    let { data: existingTransaction } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('transaction_id', transactionId)
      .single();

    // If not found by transaction_id (RequestTrace), try matching transaction_id column against Reference field
    // NetCash sends our full transaction reference (CT-PM-VAL-xxx) in the Reference field
    if (!existingTransaction && reference) {
      console.log('[NetCash Webhook] Transaction not found by RequestTrace, trying transaction_id column with Reference:', reference);
      const { data: txByTxIdRef } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('transaction_id', reference)
        .single();

      if (txByTxIdRef) {
        existingTransaction = txByTxIdRef;
        console.log('[NetCash Webhook] Found transaction by transaction_id column:', existingTransaction.id);
      }
    }

    // Try by reference column
    if (!existingTransaction && reference) {
      console.log('[NetCash Webhook] Trying by reference column:', reference);
      const { data: txByRef } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('reference', reference)
        .single();

      if (txByRef) {
        existingTransaction = txByRef;
        console.log('[NetCash Webhook] Found transaction by reference:', existingTransaction.id);
      }
    }

    // Try with CT- prefix and trailing timestamp removed to match stored reference format
    // e.g., CT-PM-VAL-92d6d9fb-1765356713732-1765356713732 -> PM-VAL-92d6d9fb-1765356713732
    if (!existingTransaction && reference.startsWith('CT-')) {
      // Remove CT- prefix and the trailing duplicate timestamp
      const parts = reference.replace(/^CT-/, '').split('-');
      // Reference format is PM-VAL-{customerId}-{timestamp}-{timestamp2}, we want PM-VAL-{customerId}-{timestamp}
      if (parts.length >= 4 && parts[parts.length - 1] === parts[parts.length - 2]) {
        parts.pop(); // Remove duplicate timestamp
      }
      const cleanedRef = parts.join('-');
      console.log('[NetCash Webhook] Trying cleaned reference:', cleanedRef);
      const { data: txByCleanedRef } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('reference', cleanedRef)
        .single();

      if (txByCleanedRef) {
        existingTransaction = txByCleanedRef;
        console.log('[NetCash Webhook] Found transaction by cleaned reference:', existingTransaction.id);
      }
    }

    if (existingTransaction) {
      // Update existing transaction
      await supabase
        .from('payment_transactions')
        .update({
          status: paymentStatus,
          payment_method: bodyParsed.PaymentMethod || bodyParsed.payment_method || null,
          provider_response: bodyParsed,
          completed_at: paymentStatus === 'completed' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingTransaction.id);

      console.log('[NetCash Webhook] Transaction updated:', existingTransaction.id);
    } else {
      // Create new transaction (fallback - this shouldn't normally happen for payment method validations)
      console.log('[NetCash Webhook] No existing transaction found, creating new one');
      await supabase
        .from('payment_transactions')
        .insert({
          transaction_id: transactionId,
          reference: reference,
          provider: 'netcash',
          amount: amount,
          currency: 'ZAR',
          status: paymentStatus,
          payment_method: bodyParsed.PaymentMethod || bodyParsed.payment_method || null,
          customer_email: bodyParsed.Extra2 || null, // NetCash Extra2 for email
          provider_response: bodyParsed,
          initiated_at: new Date().toISOString(),
          completed_at: paymentStatus === 'completed' ? new Date().toISOString() : null
        });

      console.log('[NetCash Webhook] New transaction created:', transactionId);
    }

    // Process completed payments
    if (paymentStatus === 'completed' && existingTransaction) {
      // Use the transaction we already found (includes metadata, customer_id, etc.)
      const paymentTransaction = existingTransaction;

      if (paymentTransaction?.id) {
        // Check if this is a payment method validation transaction
        const txMetadata = paymentTransaction.metadata as Record<string, unknown> || {};

        if (txMetadata.type === 'payment_method_validation') {
          console.log('[Payment Method Validation] Processing successful validation');

          const customerId = paymentTransaction.customer_id || txMetadata.customer_id as string;

          if (customerId) {
            try {
              // Check if customer already has a primary payment method
              const { data: existingMethods } = await supabase
                .from('customer_payment_methods')
                .select('id')
                .eq('customer_id', customerId)
                .eq('is_primary', true)
                .eq('is_active', true)
                .limit(1);

              const shouldBePrimary = !existingMethods || existingMethods.length === 0;

              // Extract payment method details from NetCash response
              const paymentMethodType = bodyParsed.PaymentMethod || bodyParsed.payment_method || 'card';
              const cardType = bodyParsed.CardType || bodyParsed.card_type || 'unknown';
              const maskedCard = bodyParsed.CardMasked || bodyParsed.MaskedPan || bodyParsed.card_masked || '';
              const lastFour = maskedCard ? maskedCard.slice(-4) : '****';

              // Determine method type
              const methodType = paymentMethodType.toLowerCase().includes('card') ||
                                paymentMethodType.toLowerCase().includes('visa') ||
                                paymentMethodType.toLowerCase().includes('master') ? 'card' : 'eft';

              // Store the validated payment method
              const { error: pmError } = await supabase
                .from('customer_payment_methods')
                .insert({
                  customer_id: customerId,
                  method_type: methodType,
                  display_name: `${cardType !== 'unknown' ? cardType : methodType.toUpperCase()} ***${lastFour}`,
                  last_four: lastFour,
                  card_type: cardType !== 'unknown' ? cardType : null,
                  card_masked_number: maskedCard || null,
                  is_primary: shouldBePrimary,
                  is_active: true,
                  token_status: 'verified',
                  token_verified_at: new Date().toISOString(),
                  encrypted_details: JSON.stringify({
                    validation_transaction_id: transactionId,
                    payment_method: paymentMethodType,
                    card_type: cardType,
                    validated_at: new Date().toISOString()
                  }),
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                });

              if (pmError) {
                console.error('[Payment Method Validation] Failed to store payment method:', pmError);
              } else {
                console.log('[Payment Method Validation] Payment method stored successfully', {
                  customer_id: customerId,
                  method_type: methodType,
                  is_primary: shouldBePrimary
                });
              }
            } catch (storageError) {
              console.error('[Payment Method Validation] Error storing payment method:', storageError);
            }
          } else {
            console.warn('[Payment Method Validation] No customer_id found in transaction');
          }

          // Mark webhook as processed and return early (don't process as invoice/order)
          if (webhookLog) {
            await supabase
              .from('payment_webhook_logs')
              .update({
                status: 'processed',
                success: true,
                processing_completed_at: new Date().toISOString(),
                processing_duration_ms: Date.now() - startTime,
                actions_taken: ['payment_method_validation_stored']
              })
              .eq('id', webhookLog.id);
          }

          return NextResponse.json({
            success: true,
            message: 'Payment method validation processed',
            transaction_id: transactionId
          });
        }

        // Check if this is an invoice payment (reference starts with INV-)
        if (reference.startsWith('INV-')) {
          // Update invoice status to paid
          console.log('[Invoice Payment] Updating invoice:', reference);

          // Get invoice and customer data for email
          const { data: invoice, error: invoiceFetchError } = await supabase
            .from('customer_invoices')
            .select(`
              id,
              invoice_number,
              total_amount,
              amount_paid,
              amount_due,
              customer:customers(
                id,
                email,
                first_name,
                last_name
              )
            `)
            .eq('invoice_number', reference)
            .single();

          if (invoiceFetchError || !invoice) {
            console.error('[Invoice Payment] Invoice not found:', reference);
          } else {
            // Extract customer from relationship (Supabase returns array for relations)
            const customer = Array.isArray(invoice.customer) ? invoice.customer[0] : invoice.customer;

            // Calculate new amount paid and remaining balance
            const newAmountPaid = (invoice.amount_paid || 0) + amount;
            const newAmountDue = Math.max(0, invoice.total_amount - newAmountPaid);
            const newStatus = newAmountDue <= 0 ? 'paid' : 'partial';

            // Update invoice
            const { error: invoiceUpdateError } = await supabase
              .from('customer_invoices')
              .update({
                status: newStatus,
                amount_paid: newAmountPaid,
                amount_due: newAmountDue,
                paid_at: newStatus === 'paid' ? new Date().toISOString() : null,
                updated_at: new Date().toISOString()
              })
              .eq('invoice_number', reference);

            if (invoiceUpdateError) {
              console.error('[Invoice Payment] Failed to update invoice:', invoiceUpdateError);
            } else {
              console.log('[Invoice Payment] Invoice updated:', {
                invoice_number: reference,
                status: newStatus,
                amount_paid: newAmountPaid,
                amount_due: newAmountDue
              });

              // Send payment receipt email
              if (customer?.email) {
                const paymentMethod = bodyParsed.PaymentMethod || bodyParsed.payment_method || 'Online Payment';

                EnhancedEmailService.sendPaymentReceipt({
                  invoice_id: invoice.id,
                  customer_id: customer.id,
                  email: customer.email,
                  customer_name: `${customer.first_name} ${customer.last_name}`,
                  invoice_number: invoice.invoice_number,
                  payment_amount: amount,
                  payment_date: new Date().toISOString(),
                  payment_method: formatPaymentMethod(paymentMethod),
                  payment_reference: transactionId,
                  remaining_balance: newAmountDue,
                })
                  .then((result) => {
                    if (result.success) {
                      console.log('[Invoice Payment] Payment receipt email sent:', result.message_id);
                    } else {
                      console.error('[Invoice Payment] Payment receipt email failed:', result.error);
                    }
                  })
                  .catch((error) => {
                    console.error('[Invoice Payment] Payment receipt email error:', error);
                  });
              }
            }
          }
        } else {
          // 1. Update associated order (if any)
          console.log('[Payment Processing] Updating order for reference:', reference);
          updateOrderFromPayment(reference, paymentTransaction.id, amount)
            .then((orderResult) => {
              if (orderResult.success) {
                console.log('[Order Update] Order updated successfully:', {
                  order_number: orderResult.order_number,
                  status_change: `${orderResult.old_status} → ${orderResult.new_status}`
                });
              } else {
                console.log('[Order Update] No order update needed:', orderResult.error);
              }
            })
            .catch((error) => {
              console.error('[Order Update] Error updating order:', error);
            });
        }

        // 2. Sync to ZOHO Billing (async, non-blocking)
        // This records the payment as an "offline payment" in ZOHO for reporting/BI
        syncPaymentToZohoBilling(paymentTransaction.id)
          .then((result) => {
            if (result.success) {
              console.log('[ZOHO Trigger] Payment synced to ZOHO Billing:', result.zoho_payment_id);
            } else {
              console.error('[ZOHO Trigger] Payment sync failed:', result.error);
            }
          })
          .catch((error) => {
            console.error('[ZOHO Trigger] Payment sync error:', error);
          });

        // Note: Customer notification is sent above for invoice payments
        // Order payments use the sendPaymentReceived flow in updateOrderFromPayment
      }
    }

    // 10. Mark webhook as processed
    const processingCompletedAt = new Date().toISOString();
    const processingDuration = Date.now() - startTime;

    if (webhookLog) {
      await supabase
        .from('payment_webhook_logs')
        .update({
          status: 'processed',
          success: true,
          processing_completed_at: processingCompletedAt,
          processing_duration_ms: processingDuration,
          actions_taken: ['transaction_updated'],
          response_status_code: 200,
          response_body: { success: true, message: 'Webhook processed' }
        })
        .eq('id', webhookLog.id);
    }

    console.log('[NetCash Webhook] Processing completed in', processingDuration, 'ms');

    // 11. Return success
    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
      transaction_id: transactionId,
      status: paymentStatus,
      processing_time_ms: processingDuration
    });

  } catch (error) {
    console.error('[NetCash Webhook] Error:', error);

    // Try to log error to database
    try {
      await supabase.from('payment_webhook_logs').insert({
        webhook_id: crypto.randomUUID(),
        provider: 'netcash',
        event_type: 'error',
        http_method: 'POST',
        headers: Object.fromEntries(request.headers.entries()),
        body: 'Error parsing request',
        status: 'failed',
        success: false,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        error_stack: error instanceof Error ? error.stack : null,
        received_at: new Date().toISOString()
      });
    } catch (logError) {
      console.error('[NetCash Webhook] Failed to log error:', logError);
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Webhook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler - Webhook endpoint health check
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/payments/netcash/webhook',
    provider: 'netcash',
    status: 'active',
    methods: ['POST'],
    signature_verification: !!process.env.NETCASH_WEBHOOK_SECRET || !!process.env.NETCASH_SERVICE_KEY
  });
}
