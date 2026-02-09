/**
 * Payment Method Validation Initiation API
 *
 * POST /api/payments/payment-method-initiate
 *
 * Initiates R1.00 validation charge for adding a payment method.
 * Redirects to /dashboard/billing after completion.
 *
 * This endpoint is dedicated to payment method validation (not test payments).
 * It requires authentication and properly stores the payment method on success.
 *
 * @module app/api/payments/payment-method-initiate
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createClientWithSession } from '@/lib/supabase/server';
import { getPaymentProvider } from '@/lib/payments/payment-provider-factory';
import { buildPaymentMethodDescription } from '@/lib/payments/description-builder';
import { paymentLogger } from '@/lib/logging';

/**
 * POST handler - Initiate payment method validation
 */
export async function POST(request: NextRequest) {
  const requestStart = Date.now();
  paymentLogger.info('[Payment Method Initiate] Starting...');

  try {
    // 1. Get authenticated user - check BOTH Authorization header AND cookies
    let user = null;
    const supabase = await createClient();

    // First, try Authorization header (works with localStorage sessions)
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data?.user) {
        user = data.user;
        paymentLogger.info('[Payment Method Initiate] Auth via header:', user.email);
      }
    }

    // Fallback to cookie-based session
    if (!user) {
      const supabaseWithSession = await createClientWithSession();
      const { data, error } = await supabaseWithSession.auth.getUser();
      if (!error && data?.user) {
        user = data.user;
        paymentLogger.info('[Payment Method Initiate] Auth via cookies:', user.email);
      }
    }

    if (!user) {
      paymentLogger.info('[Payment Method Initiate] No authenticated user found');
      return NextResponse.json(
        { success: false, error: 'Authentication required. Please log in to add a payment method.' },
        { status: 401 }
      );
    }

    // 2. Get customer record
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, email, first_name, last_name, account_number')
      .eq('auth_user_id', user.id)
      .single();

    if (customerError || !customer) {
      paymentLogger.error('[Payment Method Initiate] Customer not found:', customerError);
      return NextResponse.json(
        { success: false, error: 'Customer record not found. Please contact support.' },
        { status: 404 }
      );
    }

    paymentLogger.info('[Payment Method Initiate] Customer found:', customer.id, customer.email);

    // 3. Get payment provider
    const provider = getPaymentProvider();

    if (!provider.isConfigured()) {
      paymentLogger.error('[Payment Method Initiate] Payment gateway not configured');
      return NextResponse.json(
        { success: false, error: 'Payment gateway not configured. Please contact support.' },
        { status: 500 }
      );
    }

    // 4. Generate unique reference for this validation
    const timestamp = Date.now();
    const customerIdPrefix = customer.id.slice(0, 8);
    const reference = `PM-VAL-${customerIdPrefix}-${timestamp}`;

    paymentLogger.info('[Payment Method Initiate] Generated reference:', reference);

    // 5. Get base URL for redirects
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;

    // 6. Initiate R1.00 validation payment with CORRECT return URLs
    const initiateStart = Date.now();
    const paymentResult = await provider.initiate({
      amount: 1.0, // R1.00 validation charge
      currency: 'ZAR',
      reference,
      description: buildPaymentMethodDescription(),
      customerEmail: customer.email,
      customerName: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Customer',
      // Return URLs - redirect to /payment/callback (doesn't require auth, handles session loss)
      returnUrl: `${baseUrl}/api/payments/netcash/redirect`,
      cancelUrl: `${baseUrl}/api/payments/netcash/redirect`,
      notifyUrl: `${baseUrl}/api/payments/netcash/webhook`,
      metadata: {
        type: 'payment_method_validation',
        customer_id: customer.id,
        customer_email: customer.email,
        account_number: customer.account_number,
        validation_amount: 1.0,
        timestamp: new Date().toISOString()
      }
    });

    const initiateEnd = Date.now();
    paymentLogger.info('[Payment Method Initiate] Provider.initiate completed', {
      duration_ms: initiateEnd - initiateStart,
      success: paymentResult.success
    });

    if (!paymentResult.success) {
      paymentLogger.error('[Payment Method Initiate] Failed:', paymentResult.error);
      return NextResponse.json(
        { success: false, error: paymentResult.error || 'Failed to initiate payment validation' },
        { status: 500 }
      );
    }

    // 7. Build full payment URL with form data (GET method for NetCash)
    let finalPaymentUrl = paymentResult.paymentUrl;
    if (paymentResult.formData && provider.name === 'netcash') {
      const params = new URLSearchParams(paymentResult.formData as Record<string, string>);
      finalPaymentUrl = `${paymentResult.paymentUrl}?${params.toString()}`;
    }

    paymentLogger.info('[Payment Method Initiate] Payment URL generated');

    // 8. Create payment transaction record for webhook to process later
    const dbInsertStart = Date.now();
    const { error: transactionError } = await supabase
      .from('payment_transactions')
      .insert({
        transaction_id: paymentResult.transactionId,
        reference: reference,
        provider: provider.name,
        amount: 1.0,
        currency: 'ZAR',
        status: 'pending',
        customer_email: customer.email,
        customer_id: customer.id,
        metadata: {
          type: 'payment_method_validation',
          customer_id: customer.id,
          customer_email: customer.email,
          account_number: customer.account_number,
          validation_amount: 1.0
        },
        initiated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    const dbInsertEnd = Date.now();
    paymentLogger.info('[Payment Method Initiate] Transaction insert completed', {
      duration_ms: dbInsertEnd - dbInsertStart,
      hasError: !!transactionError
    });

    if (transactionError) {
      paymentLogger.error('[Payment Method Initiate] Transaction record error:', transactionError);
      // Continue anyway - payment can still work, webhook will handle it
    }

    const totalMs = Date.now() - requestStart;
    paymentLogger.info('[Payment Method Initiate] Success', {
      transaction_id: paymentResult.transactionId,
      reference,
      total_ms: totalMs
    });

    // 9. Return payment information
    return NextResponse.json({
      success: true,
      payment_url: finalPaymentUrl,
      transaction_id: paymentResult.transactionId,
      reference: reference,
      amount: 1.0,
      currency: 'ZAR',
      provider: provider.name,
      message: 'Payment method validation initiated. You will be redirected to the payment gateway.'
    });

  } catch (error) {
    paymentLogger.error('[Payment Method Initiate] Error:', {
      error,
      total_ms: Date.now() - requestStart
    });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initiate payment method validation'
      },
      { status: 500 }
    );
  }
}
