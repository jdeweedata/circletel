/**
 * NetCash Payment Webhook Handler for Zoho Billing Integration
 *
 * Receives NetCash Pay Now payment webhooks and records payments in Zoho Billing
 *
 * Flow:
 * 1. Customer pays via NetCash Pay Now
 * 2. NetCash sends webhook to this endpoint
 * 3. Verify webhook signature (HMAC-SHA256)
 * 4. Extract payment details (amount, reference, status)
 * 5. Look up invoice in Zoho Billing (using reference as invoice number)
 * 6. Record payment in Zoho Billing
 * 7. Invoice automatically marked as paid
 *
 * Epic 3.5.5 - Payment Webhook Integration
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { ZohoBillingClient } from '@/lib/integrations/zoho/billing-client';

/**
 * Verify NetCash webhook signature (HMAC-SHA256)
 */
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  // Use timing-safe comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

export async function POST(request: NextRequest) {
  try {
    console.log('[NetCash Zoho Webhook] Received payment notification');

    // 1. Get webhook signature from header
    const signature = request.headers.get('x-netcash-signature');

    if (!signature) {
      console.error('[NetCash Zoho Webhook] Missing signature header');
      return NextResponse.json(
        { error: 'Missing webhook signature' },
        { status: 401 }
      );
    }

    // 2. Get raw payload for signature verification
    const payload = await request.text();

    // 3. Verify webhook signature
    const webhookSecret = process.env.NETCASH_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('[NetCash Zoho Webhook] NETCASH_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    if (!verifyWebhookSignature(payload, signature, webhookSecret)) {
      console.error('[NetCash Zoho Webhook] Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    // 4. Parse webhook payload
    const webhookData = JSON.parse(payload);

    console.log('[NetCash Zoho Webhook] Webhook data:', {
      transaction_id: webhookData.TransactionID,
      amount: webhookData.Amount,
      reference: webhookData.Reference,
      status: webhookData.Status,
    });

    // 5. Validate payment status (only process successful payments)
    if (webhookData.Status !== 'PAID' && webhookData.Status !== 'COMPLETE') {
      console.log('[NetCash Zoho Webhook] Payment not successful, status:', webhookData.Status);
      return NextResponse.json(
        { message: 'Payment not successful, skipping' },
        { status: 200 }
      );
    }

    // 6. Extract payment details
    const {
      TransactionID: transactionId,
      Amount: amountCents,
      Reference: reference,
      CustomerEmail: customerEmail,
    } = webhookData;

    // Convert amount from cents to rands
    const amount = parseFloat((amountCents / 100).toFixed(2));

    console.log('[NetCash Zoho Webhook] Processing payment:', {
      transactionId,
      amount,
      reference,
      customerEmail,
    });

    // 7. Look up invoice in Zoho Billing
    // Reference format: "INV-XXXXXX" or "SUB-XXXXXX"
    const client = new ZohoBillingClient();

    // For MVP, assume reference is subscription number
    // In production, you'd need to map references to invoices/subscriptions
    let invoice: any;
    let customerId: string;

    if (reference.startsWith('INV-')) {
      // Direct invoice payment
      // Search for invoice by invoice number
      console.log('[NetCash Zoho Webhook] Looking up invoice:', reference);

      // Note: Zoho Billing doesn't have a direct search by invoice_number
      // In production, you'd need to maintain a mapping table or use custom_field
      throw new Error('Direct invoice payment not yet implemented - use subscription reference');
    } else if (reference.startsWith('SUB-')) {
      // Subscription payment - get latest invoice
      console.log('[NetCash Zoho Webhook] Looking up subscription:', reference);

      // For MVP, we'll use the subscription number stored in CircleTel database
      // In production, implement proper reference mapping
      throw new Error('Subscription lookup not yet implemented - requires CircleTel DB integration');
    } else {
      console.error('[NetCash Zoho Webhook] Invalid reference format:', reference);
      return NextResponse.json(
        { error: 'Invalid payment reference format' },
        { status: 400 }
      );
    }

    // 8. Record payment in Zoho Billing
    const payment = await client.recordPayment({
      customer_id: customerId,
      payment_mode: 'banktransfer', // NetCash payment
      amount: amount,
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      reference_number: transactionId,
      description: `NetCash payment - ${reference}`,
      invoices: [
        {
          invoice_id: invoice.invoice_id,
          amount_applied: amount,
        },
      ],
    });

    console.log('[NetCash Zoho Webhook] Payment recorded in Zoho:', {
      payment_id: payment.payment_id,
      payment_number: payment.payment_number,
    });

    // 9. Return success
    return NextResponse.json({
      success: true,
      payment_id: payment.payment_id,
      payment_number: payment.payment_number,
      message: 'Payment recorded successfully in Zoho Billing',
    });

  } catch (error) {
    console.error('[NetCash Zoho Webhook] Error processing webhook:', error);

    return NextResponse.json(
      {
        error: 'Failed to process payment webhook',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
