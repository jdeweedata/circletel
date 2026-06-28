import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPaymentProvider } from '@/lib/payments/payment-provider-factory';
import {
  buildGenericDescription,
  buildOrderDescription,
  buildPaymentMethodDescription,
} from '@/lib/payments/description-builder';
import { logPaymentConsents, extractIpAddress, extractUserAgent } from '@/lib/payments/consent-logger';
import type { PaymentConsents } from '@/components/payments/PaymentConsentCheckboxes';
import { paymentLogger } from '@/lib/logging';
import {
  LEGACY_VALIDATION_CHARGE_AMOUNT,
  ORDER_PROCESSING_FEE_LABEL,
  isLegacyValidationChargeAmount,
  isOrderProcessingFeeAmount,
} from '@/lib/payments/payment-amounts';

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

    // SECURITY: only the orderId is trusted from the client. The amount,
    // recipient and reference are derived from the order record below — a
    // client-supplied amount must never determine what gets charged.
    const { orderId } = body;
    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing orderId'
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

    // Guard: only initiate payment for an order that is awaiting one. Blocks
    // re-charging an already-paid order or charging a cancelled/failed one.
    if (order.payment_status === 'paid') {
      return NextResponse.json(
        { success: false, error: 'Order has already been paid' },
        { status: 409 }
      );
    }
    if (order.status === 'cancelled' || order.status === 'failed') {
      return NextResponse.json(
        { success: false, error: 'Order is no longer active' },
        { status: 409 }
      );
    }

    // SECURITY: derive every payment input from the order, not the request body.
    // payment_amount is server-set at order creation. Legacy rows created before
    // the column existed fall back to the old R1 validation amount so they are
    // not surprise-repriced at initiation time.
    // NOTE (Phase 2): once orders carry an owner (auth_user_id), bind this to the
    // authenticated session and reject mismatches. Today orders are guest/unowned,
    // so a hard owner-gate would break checkout — see the order-journey plan.
    const amount = Number(order.payment_amount ?? LEGACY_VALIDATION_CHARGE_AMOUNT);
    const customerEmail: string = order.email;
    const customerName: string = `${order.first_name ?? ''} ${order.last_name ?? ''}`.trim();
    const paymentReference: string = order.payment_reference;

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

    // Build a customer-friendly payment description. New checkout orders are a
    // once-off processing fee, while legacy R1 rows remain payment verification.
    const description = isOrderProcessingFeeAmount(amount)
      ? buildGenericDescription(ORDER_PROCESSING_FEE_LABEL)
      : isLegacyValidationChargeAmount(amount)
        ? buildPaymentMethodDescription()
        : buildOrderDescription({
            account_number: order.account_number,
            order_number: order.order_number,
            package_name: order.package_name,
            city: order.city,
            suburb: order.suburb,
          });

    paymentLogger.info('[Payment Initiate] Building payment with description', { description });

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
      paymentLogger.error('[Payment Initiate] Failed', { error: paymentResult.error });
      return NextResponse.json(
        {
          success: false,
          error: paymentResult.error || 'Failed to initiate payment'
        },
        { status: 500 }
      );
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
      paymentLogger.error('Failed to update order status', { error: updateError.message });
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
      paymentLogger.error('Failed to log payment initiation', { error: auditError.message });
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
        paymentLogger.error('Failed to log payment consents', { error: consentLog.error });
        // Don't fail the payment if consent logging fails
      } else {
        paymentLogger.info('Payment consents logged successfully', { consent_id: consentLog.consent_id });
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
      paymentUrl: paymentResult.paymentUrl,
      formData: paymentResult.formData,
      paymentReference,
      transactionId: paymentResult.transactionId,
      orderId,
      description,
      message: 'Payment URL generated successfully'
    });

  } catch (error) {
    paymentLogger.error('Payment initiation error', { error: error instanceof Error ? error.message : String(error) });
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
