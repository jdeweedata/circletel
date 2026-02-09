import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPaymentProvider } from '@/lib/payments/payment-provider-factory';
import { buildOrderDescription } from '@/lib/payments/description-builder';
import { logPaymentConsents, extractIpAddress, extractUserAgent } from '@/lib/payments/consent-logger';
import type { PaymentConsents } from '@/components/payments/PaymentConsentCheckboxes';
import { paymentLogger } from '@/lib/logging';

interface InitiatePaymentRequest {
  orderId: string;
  amount: number;
  customerEmail: string;
  customerName: string;
  paymentReference: string;
  consents?: PaymentConsents;
}

/**
 * POST /api/payment/netcash/initiate
 * Generates Netcash payment URL and logs initiation
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body: InitiatePaymentRequest = await request.json();

    // Validate required fields
    const { orderId, amount, customerEmail, customerName, paymentReference } = body;
    if (!orderId || !amount || !customerEmail || !customerName || !paymentReference) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required payment fields'
        },
        { status: 400 }
      );
    }

    // Verify order exists and get full order details
    const { data: order, error: orderError } = await supabase
      .from('consumer_orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order not found'
        },
        { status: 404 }
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

    // Get base URL for return/cancel URLs
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
    const successUrl = process.env.NEXT_PUBLIC_PAYMENT_SUCCESS_URL || `${baseUrl}/payment/success`;
    const cancelUrl = process.env.NEXT_PUBLIC_PAYMENT_CANCEL_URL || `${baseUrl}/payment/cancelled`;

    // Build customer-friendly description for bank statement
    const description = buildOrderDescription({
      account_number: order.account_number,
      order_number: order.order_number,
      package_name: order.package_name,
      city: order.city,
      suburb: order.suburb,
    });

    paymentLogger.info('[Payment Initiate] Building payment with description:', description);

    // Initiate payment via provider
    const paymentResult = await provider.initiate({
      amount,
      currency: 'ZAR',
      reference: paymentReference,
      description,
      customerEmail,
      customerName,
      returnUrl: successUrl,
      cancelUrl,
      notifyUrl: `${baseUrl}/api/payment/netcash/webhook`,
      metadata: {
        order_id: orderId,
        order_number: order.order_number,
        package_name: order.package_name,
      }
    });

    if (!paymentResult.success) {
      paymentLogger.error('[Payment Initiate] Failed:', paymentResult.error);
      return NextResponse.json(
        {
          success: false,
          error: paymentResult.error || 'Failed to initiate payment'
        },
        { status: 500 }
      );
    }

    // Generate full payment URL with query parameters (GET method)
    let fullPaymentUrl = paymentResult.paymentUrl;
    if (paymentResult.formData && provider.name === 'netcash') {
      const params = new URLSearchParams(paymentResult.formData as Record<string, string>);
      fullPaymentUrl = `${paymentResult.paymentUrl}?${params.toString()}`;
    }

    // Update order status to processing
    const { error: updateError } = await supabase
      .from('consumer_orders')
      .update({
        payment_status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (updateError) {
      paymentLogger.error('Failed to update order status:', updateError);
    }

    // Log payment initiation in audit table
    const { error: auditError } = await supabase
      .from('payment_audit_logs')
      .insert({
        order_id: orderId,
        event_type: 'payment_initiated',
        status: 'success',
        request_body: JSON.stringify(body),
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        created_at: new Date().toISOString()
      });

    if (auditError) {
      paymentLogger.error('Failed to log payment initiation:', auditError);
    }

    // Log consents if provided
    if (body.consents) {
      const consentLog = await logPaymentConsents({
        order_id: orderId,
        customer_email: customerEmail,
        customer_id: order.customer_id || undefined,
        consents: body.consents,
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

    paymentLogger.info('[Payment Initiate] Success:', {
      orderId,
      paymentReference,
      amount,
      customerEmail,
      description,
      transactionId: paymentResult.transactionId
    });

    return NextResponse.json({
      success: true,
      paymentUrl: fullPaymentUrl,
      paymentReference,
      transactionId: paymentResult.transactionId,
      orderId,
      description,
      message: 'Payment URL generated successfully'
    });

  } catch (error) {
    paymentLogger.error('Payment initiation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to initiate payment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
