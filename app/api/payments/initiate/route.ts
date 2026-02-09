import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPaymentProvider } from '@/lib/payments/payment-provider-factory';
import { logPaymentConsents, extractIpAddress, extractUserAgent } from '@/lib/payments/consent-logger';
import type { PaymentConsents } from '@/components/payments/PaymentConsentCheckboxes';
import { paymentLogger } from '@/lib/logging';

/**
 * POST /api/payments/initiate
 *
 * Initiate a payment for a consumer order.
 * Uses the provider abstraction layer for multi-gateway support.
 *
 * @param request - NextRequest with orderId in body
 * @returns Payment initiation result with payment URL
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, consents } = body;

    // Validate request
    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: orderId' },
        { status: 400 }
      );
    }

    // Validate consents (optional but recommended)
    if (!consents) {
      paymentLogger.warn('Payment initiated without consents - consider updating client to send consents');
    }

    // Get payment provider (uses factory pattern)
    const provider = getPaymentProvider(); // Defaults to NetCash

    // Check if provider is configured
    if (!provider.isConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Payment gateway not configured. Please contact support.'
        },
        { status: 500 }
      );
    }

    const supabase = await createClient();

    // Fetch order details
    const { data: order, error: orderError } = await supabase
      .from('consumer_orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if order is already paid
    if (order.payment_status === 'paid') {
      return NextResponse.json(
        { success: false, error: 'Order is already paid' },
        { status: 400 }
      );
    }

    // Check if order is cancelled
    if (order.status === 'cancelled') {
      return NextResponse.json(
        { success: false, error: 'Order is cancelled and cannot be paid' },
        { status: 400 }
      );
    }

    // Calculate total amount (package price + installation fee)
    const packagePrice = order.package_price || 0;
    const installationFee = order.installation_fee || 0;
    const totalAmount = packagePrice + installationFee;

    if (totalAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid order amount' },
        { status: 400 }
      );
    }

    // Initiate payment via provider abstraction
    const paymentResult = await provider.initiate({
      amount: totalAmount,
      currency: 'ZAR',
      reference: order.order_number,
      description: `CircleTel Order ${order.order_number} - ${order.package_name}`,
      customerEmail: order.email,
      customerName: `${order.first_name} ${order.last_name}`,
      customerPhone: order.phone,
      returnUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success`,
      cancelUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/cancelled`,
      notifyUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payments/webhook`,
      metadata: {
        order_id: order.id,
        package_name: order.package_name,
        package_price: packagePrice,
        installation_fee: installationFee
      }
    });

    // Check if payment initiation was successful
    if (!paymentResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: paymentResult.error || 'Failed to initiate payment'
        },
        { status: 500 }
      );
    }

    // Create payment transaction record
    const { data: transaction, error: transactionError } = await supabase
      .from('payment_transactions')
      .insert({
        transaction_id: paymentResult.transactionId,
        order_id: order.id,
        amount: totalAmount,
        currency: 'ZAR',
        provider: provider.name,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (transactionError) {
      paymentLogger.error('Error creating payment transaction:', transactionError);
      // Continue anyway - payment can still work even if we don't track it perfectly
    }

    // Log consents if provided
    if (consents && transaction) {
      const consentLog = await logPaymentConsents({
        payment_transaction_id: transaction.id,
        order_id: order.id,
        customer_email: order.email,
        customer_id: order.customer_id || undefined,
        consents: consents as PaymentConsents,
        ip_address: extractIpAddress(request),
        user_agent: extractUserAgent(request),
        consent_type: 'payment'
      });

      if (!consentLog.success) {
        paymentLogger.error('Failed to log payment consents:', consentLog.error);
        // Don't fail the payment if consent logging fails
      } else {
        paymentLogger.info('Payment consents logged successfully:', consentLog.consent_id);
      }
    }

    // Return payment information
    return NextResponse.json({
      success: true,
      paymentUrl: paymentResult.paymentUrl,
      formData: paymentResult.formData,
      transactionId: paymentResult.transactionId,
      amount: totalAmount,
      provider: provider.name,
      order: {
        id: order.id,
        order_number: order.order_number,
        package_name: order.package_name
      },
      message: 'Payment initiated successfully'
    });
  } catch (error) {
    paymentLogger.error('Payment initiation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initiate payment'
      },
      { status: 500 }
    );
  }
}
