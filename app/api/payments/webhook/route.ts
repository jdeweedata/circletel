/**
 * POST /api/payments/webhook
 * Payment Provider Webhook Handler
 *
 * Handles payment confirmation from payment providers (NetCash, ZOHO, etc.)
 * Uses provider abstraction layer for multi-gateway support.
 *
 * Auto-creates order and triggers RICA submission on successful payment.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPaymentProvider } from '@/lib/payments/payment-provider-factory';

/**
 * Payment Webhook Handler
 *
 * Events:
 * - payment.completed: Payment successful
 * - payment.failed: Payment failed
 * - payment.pending: Payment pending (EFT, etc.)
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    // 1. Get payment provider
    const provider = getPaymentProvider();

    // 2. Get signature from headers
    const signature = request.headers.get('x-webhook-signature') ||
                     request.headers.get('x-netcash-signature') || '';
    const rawBody = await request.text();

    if (!signature) {
      console.error('[Payment Webhook] Missing signature');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 401 }
      );
    }

    // 3. Parse payload
    const payload = JSON.parse(rawBody);

    // 4. Process webhook via provider abstraction
    const webhookResult = await provider.processWebhook(payload, signature);

    if (!webhookResult.success) {
      console.error('[Payment Webhook] Processing failed:', webhookResult.error);
      return NextResponse.json(
        { error: webhookResult.error || 'Webhook processing failed' },
        { status: 400 }
      );
    }

    const {
      transactionId,
      status,
      amount,
      reference,
      completedAt,
      failureReason,
      metadata
    } = webhookResult;

    console.log('[Payment Webhook] Received event:', {
      provider: provider.name,
      transactionId,
      status,
      amount,
      reference
    });

    // 5. Check idempotency (prevent duplicate processing)
    const { data: existingWebhook } = await supabase
      .from('payment_webhooks')
      .select('id')
      .eq('transaction_id', transactionId)
      .single();

    if (existingWebhook) {
      console.log('[Payment Webhook] Duplicate webhook, ignoring');
      return NextResponse.json({ message: 'Webhook already processed' });
    }

    // 6. Log webhook event
    await supabase.from('payment_webhooks').insert({
      transaction_id: transactionId,
      event_type: `payment.${status}`,
      payload: metadata,
      processed_at: new Date().toISOString(),
    });

    // 7. Find payment transaction to get invoice/order details
    const { data: paymentTransaction } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('transaction_id', transactionId)
      .single();

    // 8. Update payment transaction status
    if (paymentTransaction) {
      await supabase
        .from('payment_transactions')
        .update({
          status,
          transaction_date: completedAt?.toISOString() || new Date().toISOString(),
          netcash_response: metadata,
          processed_at: status === 'completed' ? new Date().toISOString() : null,
          failed_at: status === 'failed' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('transaction_id', transactionId);
    }

    // 9. Handle invoice-based payments (B2B flow)
    // Extract invoice_id from metadata if present
    const invoiceId = (metadata?.invoice_id as string) || null;

    if (invoiceId) {
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('*, contract_id')
        .eq('id', invoiceId)
        .single();

      if (!invoiceError && invoice) {
        // Update invoice based on payment status
        if (status === 'completed') {
          await supabase
            .from('invoices')
            .update({
              payment_status: 'paid',
              payment_method: metadata?.payment_method as string || 'unknown',
              payment_reference: transactionId,
              total_paid: amount,
              paid_at: completedAt?.toISOString() || new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', invoiceId);

          console.log('[Payment Webhook] Invoice marked as paid:', invoiceId);

          // 10. AUTO-CREATE ORDER on successful payment
          const { data: contract } = await supabase
            .from('contracts')
            .select('*, quote:business_quotes(*), kyc_session:kyc_sessions(*)')
            .eq('id', invoice.contract_id)
            .single();

          if (contract && contract.quote) {
            const quote = contract.quote;

            // Create consumer_orders record
            const { data: order, error: orderError } = await supabase
              .from('consumer_orders')
              .insert({
                // Order number auto-generated by trigger

                // Customer info from quote
                first_name: quote.contact_name?.split(' ')[0] || '',
                last_name: quote.contact_name?.split(' ').slice(1).join(' ') || '',
                email: quote.contact_email,
                phone: quote.contact_phone,

                // Address
                installation_address: quote.service_address,
                billing_same_as_installation: true,

                // Product selection
                service_package_id: quote.service_package_id,
                package_name: quote.package_details?.name,
                package_speed: quote.package_details?.speed,
                package_price: quote.monthly_price,
                installation_fee: quote.installation_fee,
                router_included: quote.router_included,

                // Payment
                payment_method: metadata?.payment_method as string || 'unknown',
                payment_status: 'paid',
                payment_reference: transactionId,
                total_paid: amount,

                // Status
                status: 'payment_received',

                // Installation
                preferred_installation_date: quote.preferred_installation_date,

                // Tracking
                lead_source: 'b2b_quote',
                contract_id: contract.id,
              })
              .select()
              .single();

            if (orderError) {
              console.error('[Payment Webhook] Failed to create order:', orderError);
            } else {
              console.log('[Payment Webhook] Order created:', order.order_number);

              // 11. TRIGGER RICA SUBMISSION (if KYC approved)
              if (contract.kyc_session?.verification_result === 'approved') {
                try {
                  // Call RICA submission API
                  const ricaResponse = await fetch(
                    `${request.nextUrl.origin}/api/activation/rica-submit`,
                    {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        kycSessionId: contract.kyc_session.id,
                        orderId: order.id,
                        serviceLines: [
                          {
                            iccid: null, // Will be assigned during installation
                            serviceType: quote.service_type,
                            productName: quote.package_details?.name,
                          },
                        ],
                      }),
                    }
                  );

                  if (ricaResponse.ok) {
                    console.log('[Payment Webhook] RICA submission triggered');
                  } else {
                    console.error('[Payment Webhook] RICA submission failed');
                  }
                } catch (ricaError) {
                  console.error('[Payment Webhook] RICA submission error:', ricaError);
                }
              }

              // 12. Update contract status
              await supabase
                .from('contracts')
                .update({
                  status: 'payment_received',
                  updated_at: new Date().toISOString(),
                })
                .eq('id', contract.id);
            }
          }
        } else if (status === 'failed') {
          await supabase
            .from('invoices')
            .update({
              payment_status: 'failed',
              updated_at: new Date().toISOString(),
            })
            .eq('id', invoiceId);

          console.log('[Payment Webhook] Invoice marked as failed:', invoiceId);
        } else if (status === 'pending' || status === 'processing') {
          await supabase
            .from('invoices')
            .update({
              payment_status: 'pending',
              updated_at: new Date().toISOString(),
            })
            .eq('id', invoiceId);

          console.log('[Payment Webhook] Invoice marked as pending:', invoiceId);
        }
      }
    }

    // 13. Handle order-based payments (B2C flow)
    if (paymentTransaction?.order_id) {
      if (status === 'completed') {
        await supabase
          .from('consumer_orders')
          .update({
            payment_status: 'paid',
            status: 'payment_received',
            updated_at: new Date().toISOString()
          })
          .eq('id', paymentTransaction.order_id);

        console.log('[Payment Webhook] Order marked as paid:', paymentTransaction.order_id);
      } else if (status === 'failed') {
        await supabase
          .from('consumer_orders')
          .update({
            payment_status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', paymentTransaction.order_id);

        console.log('[Payment Webhook] Order marked as failed:', paymentTransaction.order_id);
      }
    }

    // 14. Return success
    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
      transactionId,
      status,
      provider: provider.name
    });
  } catch (error) {
    console.error('[Payment Webhook] Error processing webhook:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
