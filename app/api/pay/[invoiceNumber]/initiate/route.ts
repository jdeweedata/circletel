/**
 * Public Invoice Payment Initiation
 * GET /api/pay/[invoiceNumber]/initiate
 *
 * Initiates NetCash payment for an invoice without requiring login.
 * Redirects customer to NetCash payment gateway.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPaymentProvider } from '@/lib/payments/payment-provider-factory';

interface RouteParams {
  params: Promise<{ invoiceNumber: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { invoiceNumber } = await params;
    const supabase = await createClient();

    // Normalize invoice number
    const normalizedInvoiceNumber = invoiceNumber.toUpperCase().trim();

    // Fetch invoice with customer data
    const { data: invoice, error: invoiceError } = await supabase
      .from('customer_invoices')
      .select(`
        id,
        invoice_number,
        total_amount,
        amount_paid,
        amount_due,
        status,
        customer:customers(
          id,
          first_name,
          last_name,
          email,
          account_number
        )
      `)
      .eq('invoice_number', normalizedInvoiceNumber)
      .single();

    if (invoiceError || !invoice) {
      // Redirect to pay page with error
      return NextResponse.redirect(
        new URL(`/pay/${invoiceNumber}?error=not_found`, request.url)
      );
    }

    // Check if already paid
    if (invoice.status === 'paid') {
      return NextResponse.redirect(
        new URL(`/pay/${invoiceNumber}?status=already_paid`, request.url)
      );
    }

    // Get payment provider
    const provider = getPaymentProvider();

    if (!provider.isConfigured()) {
      console.error('[Public Invoice Payment] Payment gateway not configured');
      return NextResponse.redirect(
        new URL(`/pay/${invoiceNumber}?error=gateway_error`, request.url)
      );
    }

    // Calculate amount due
    const amountDue = invoice.amount_due || (invoice.total_amount - (invoice.amount_paid || 0));

    // Get customer data
    const customer = Array.isArray(invoice.customer) ? invoice.customer[0] : invoice.customer;
    const customerName = customer
      ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
      : 'Customer';
    const customerEmail = customer?.email || '';

    // Build payment details
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
    const description = `CircleTel Invoice ${invoice.invoice_number}`;
    const paymentReference = invoice.invoice_number; // Use invoice number as reference

    // Initiate payment
    const paymentResult = await provider.initiate({
      amount: amountDue,
      currency: 'ZAR',
      reference: paymentReference,
      description,
      customerEmail,
      customerName,
      returnUrl: `${baseUrl}/pay/${invoiceNumber}?payment=success`,
      cancelUrl: `${baseUrl}/pay/${invoiceNumber}?payment=cancelled`,
      notifyUrl: `${baseUrl}/api/payments/netcash/webhook`,
      metadata: {
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        customer_id: customer?.id,
        type: 'public_invoice_payment',
      },
    });

    if (!paymentResult.success || !paymentResult.paymentUrl) {
      console.error('[Public Invoice Payment] Failed:', paymentResult.error);
      return NextResponse.redirect(
        new URL(`/pay/${invoiceNumber}?error=payment_failed`, request.url)
      );
    }

    // Generate full payment URL
    let fullPaymentUrl = paymentResult.paymentUrl;
    if (paymentResult.formData && provider.name === 'netcash') {
      const params = new URLSearchParams(paymentResult.formData as Record<string, string>);
      fullPaymentUrl = `${paymentResult.paymentUrl}?${params.toString()}`;
    }

    // Log payment initiation
    await supabase.from('payment_audit_logs').insert({
      invoice_id: invoice.id,
      event_type: 'public_invoice_payment_initiated',
      status: 'success',
      request_body: JSON.stringify({
        invoice_number: invoice.invoice_number,
        amount: amountDue,
        customer_email: customerEmail,
        source: 'public_pay_page',
      }),
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      created_at: new Date().toISOString(),
    });

    console.log('[Public Invoice Payment] Redirecting to NetCash:', {
      invoiceNumber: invoice.invoice_number,
      amount: amountDue,
    });

    // Redirect to payment gateway
    return NextResponse.redirect(fullPaymentUrl);
  } catch (error) {
    console.error('[Public Invoice Payment] Error:', error);
    const { invoiceNumber } = await params;
    return NextResponse.redirect(
      new URL(`/pay/${invoiceNumber}?error=system_error`, request.url)
    );
  }
}
