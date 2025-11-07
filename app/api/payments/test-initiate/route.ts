/**
 * Test Payment Initiation API
 *
 * POST /api/payments/test-initiate
 *
 * Simplified payment initiation for testing webhooks.
 * Does NOT require an order - creates standalone test transaction.
 *
 * @module app/api/payments/test-initiate
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPaymentProvider } from '@/lib/payments/payment-provider-factory';

/**
 * POST handler - Initiate test payment
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, currency = 'ZAR', reference, customer_email, metadata } = body;

    // Validate request
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid amount' },
        { status: 400 }
      );
    }

    if (!reference) {
      return NextResponse.json(
        { success: false, error: 'Missing reference' },
        { status: 400 }
      );
    }

    // Get payment provider
    const provider = getPaymentProvider();

    // Check if provider is configured
    if (!provider.isConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Payment gateway not configured. Check NETCASH_SERVICE_KEY environment variable.'
        },
        { status: 500 }
      );
    }

    console.log('[Test Payment] Initiating payment:', {
      amount,
      currency,
      reference,
      provider: provider.name
    });

    // Get base URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;

    // Initiate payment via provider
    const paymentResult = await provider.initiate({
      amount,
      currency,
      reference,
      description: `CircleTel Test Payment - ${reference}`,
      customerEmail: customer_email || 'test@circletel.co.za',
      customerName: 'Test Customer',
      returnUrl: `${baseUrl}/test/payment?status=success`,
      cancelUrl: `${baseUrl}/test/payment?status=cancelled`,
      notifyUrl: `${baseUrl}/api/payments/netcash/webhook`,
      metadata: {
        ...metadata,
        test: true,
        test_reference: reference
      }
    });

    if (!paymentResult.success) {
      console.error('[Test Payment] Failed:', paymentResult.error);
      return NextResponse.json(
        {
          success: false,
          error: paymentResult.error || 'Failed to initiate payment'
        },
        { status: 500 }
      );
    }

    console.log('[Test Payment] Success:', {
      transactionId: paymentResult.transactionId,
      paymentUrl: paymentResult.paymentUrl
    });

    // Create payment transaction record
    const supabase = await createClient();
    const { error: transactionError } = await supabase
      .from('payment_transactions')
      .insert({
        transaction_id: paymentResult.transactionId,
        reference: reference,
        provider: provider.name,
        amount: amount,
        currency: currency,
        status: 'pending',
        customer_email: customer_email || 'test@circletel.co.za',
        metadata: metadata,
        initiated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (transactionError) {
      console.error('[Test Payment] Transaction record error:', transactionError);
      // Continue anyway - payment can still work
    }

    // Return payment information
    return NextResponse.json({
      success: true,
      payment_url: paymentResult.paymentUrl,
      transaction_id: paymentResult.transactionId,
      amount: amount,
      currency: currency,
      reference: reference,
      provider: provider.name,
      message: 'Test payment initiated successfully'
    });

  } catch (error) {
    console.error('[Test Payment] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initiate test payment'
      },
      { status: 500 }
    );
  }
}
