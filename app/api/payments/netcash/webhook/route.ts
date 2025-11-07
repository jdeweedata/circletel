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

    // 2. Parse payload
    let bodyParsed;
    try {
      bodyParsed = JSON.parse(rawBody);
    } catch (parseError) {
      console.error('[NetCash Webhook] Failed to parse JSON:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    // 3. Extract webhook data
    const webhookId = bodyParsed.webhook_id || crypto.randomUUID();
    const eventType = bodyParsed.event_type || 'payment.notification';
    const transactionId = bodyParsed.transaction_id || bodyParsed.TransactionId || 'unknown';
    const reference = bodyParsed.reference || bodyParsed.Reference || bodyParsed.Extra1 || '';

    console.log('[NetCash Webhook] Processing:', {
      webhookId,
      eventType,
      transactionId,
      reference
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
    const amount = parseFloat(bodyParsed.Amount || bodyParsed.amount || '0');

    // NetCash Response Codes:
    // 0 = Successful
    // 1 = Declined
    // 2 = Cancelled
    // 3 = Pending
    if (responseCode === 0 || responseCode === '0') {
      paymentStatus = 'completed';
    } else if (responseCode === 1 || responseCode === '1') {
      paymentStatus = 'failed';
    } else if (responseCode === 2 || responseCode === '2') {
      paymentStatus = 'cancelled';
    } else {
      paymentStatus = 'pending';
    }

    console.log('[NetCash Webhook] Payment status:', paymentStatus, '(ResponseCode:', responseCode, ')');

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
    const { data: existingTransaction } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('transaction_id', transactionId)
      .single();

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
        .eq('transaction_id', transactionId);

      console.log('[NetCash Webhook] Transaction updated:', transactionId);
    } else {
      // Create new transaction
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
