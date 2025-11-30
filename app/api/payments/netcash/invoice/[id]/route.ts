/**
 * Invoice Payment Initiation
 * GET /api/payments/netcash/invoice/[id]
 * 
 * Redirects customer to NetCash payment gateway for invoice payment
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPaymentProvider } from '@/lib/payments/payment-provider-factory';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: invoiceId } = await params;
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      // Redirect to login with return URL
      const returnUrl = encodeURIComponent(`/api/payments/netcash/invoice/${invoiceId}`);
      return NextResponse.redirect(new URL(`/login?redirect=${returnUrl}`, request.url));
    }

    // Get customer record
    const { data: customer } = await supabase
      .from('customers')
      .select('id, first_name, last_name, email, account_number')
      .eq('auth_user_id', user.id)
      .single();

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Get invoice and verify ownership
    const { data: invoice, error: invoiceError } = await supabase
      .from('customer_invoices')
      .select('*')
      .eq('id', invoiceId)
      .eq('customer_id', customer.id)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found or access denied' },
        { status: 404 }
      );
    }

    // Check if already paid
    if (invoice.status === 'paid') {
      return NextResponse.redirect(new URL(`/dashboard/invoices/${invoiceId}?status=already_paid`, request.url));
    }

    // Get payment provider
    const provider = getPaymentProvider();

    if (!provider.isConfigured()) {
      return NextResponse.json(
        { success: false, error: 'Payment gateway not configured' },
        { status: 500 }
      );
    }

    // Build payment details
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
    const customerName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Customer';
    const description = `CircleTel Invoice ${invoice.invoice_number}`;
    const paymentReference = invoice.invoice_number;

    // Initiate payment
    const paymentResult = await provider.initiate({
      amount: invoice.total_amount,
      currency: 'ZAR',
      reference: paymentReference,
      description,
      customerEmail: customer.email,
      customerName,
      returnUrl: `${baseUrl}/dashboard/invoices/${invoiceId}?payment=success`,
      cancelUrl: `${baseUrl}/dashboard/invoices/${invoiceId}?payment=cancelled`,
      notifyUrl: `${baseUrl}/api/payments/netcash/webhook`,
      metadata: {
        invoice_id: invoiceId,
        invoice_number: invoice.invoice_number,
        customer_id: customer.id,
        type: 'invoice_payment',
      }
    });

    if (!paymentResult.success || !paymentResult.paymentUrl) {
      console.error('[Invoice Payment] Failed:', paymentResult.error);
      return NextResponse.json(
        { success: false, error: paymentResult.error || 'Failed to initiate payment' },
        { status: 500 }
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
      invoice_id: invoiceId,
      event_type: 'invoice_payment_initiated',
      status: 'success',
      request_body: JSON.stringify({
        invoice_number: invoice.invoice_number,
        amount: invoice.total_amount,
        customer_email: customer.email,
      }),
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      created_at: new Date().toISOString()
    });

    console.log('[Invoice Payment] Redirecting to NetCash:', {
      invoiceId,
      invoiceNumber: invoice.invoice_number,
      amount: invoice.total_amount,
    });

    // Redirect to payment gateway
    return NextResponse.redirect(fullPaymentUrl);

  } catch (error) {
    console.error('[Invoice Payment] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to initiate payment' },
      { status: 500 }
    );
  }
}
