/**
 * Authenticated Invoice Payment Initiation
 * POST /api/dashboard/invoices/[id]/pay
 *
 * Initiates NetCash payment for an invoice from customer dashboard.
 * Requires authentication and validates customer owns the invoice.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getPaymentProvider } from '@/lib/payments/payment-provider-factory';

export const runtime = 'nodejs';
export const maxDuration = 30;

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: invoiceId } = await params;

    // Get auth token from header or cookies
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized', details: 'Authentication required' },
        { status: 401 }
      );
    }

    // Use service role client for auth validation and database queries
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Validate token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', details: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    // Get customer record
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, first_name, last_name, email, account_number')
      .eq('auth_user_id', user.id)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Fetch invoice and verify customer owns it
    const { data: invoice, error: invoiceError } = await supabase
      .from('customer_invoices')
      .select(`
        id,
        invoice_number,
        total_amount,
        amount_paid,
        amount_due,
        status,
        customer_id
      `)
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Verify customer owns this invoice
    if (invoice.customer_id !== customer.id) {
      return NextResponse.json(
        { error: 'Access denied', details: 'You do not have access to this invoice' },
        { status: 403 }
      );
    }

    // Check if already paid
    if (invoice.status === 'paid') {
      return NextResponse.json(
        { error: 'Invoice already paid', status: 'already_paid' },
        { status: 400 }
      );
    }

    // Get payment provider
    const provider = getPaymentProvider();

    if (!provider.isConfigured()) {
      console.error('[Dashboard Invoice Payment] Payment gateway not configured');
      return NextResponse.json(
        { error: 'Payment gateway not available' },
        { status: 503 }
      );
    }

    // Calculate amount due
    const amountDue = invoice.amount_due || (invoice.total_amount - (invoice.amount_paid || 0));

    if (amountDue <= 0) {
      return NextResponse.json(
        { error: 'No amount due on this invoice' },
        { status: 400 }
      );
    }

    // Build payment details
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
    const description = `CircleTel Invoice ${invoice.invoice_number}`;
    const paymentReference = invoice.invoice_number;
    const customerName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim();

    // Initiate payment
    const paymentResult = await provider.initiate({
      amount: amountDue,
      currency: 'ZAR',
      reference: paymentReference,
      description,
      customerEmail: customer.email,
      customerName,
      returnUrl: `${baseUrl}/dashboard/billing?payment=success&invoice=${invoice.invoice_number}`,
      cancelUrl: `${baseUrl}/dashboard/billing?payment=cancelled&invoice=${invoice.invoice_number}`,
      notifyUrl: `${baseUrl}/api/payments/netcash/webhook`,
      metadata: {
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        customer_id: customer.id,
        type: 'dashboard_invoice_payment',
      },
    });

    if (!paymentResult.success || !paymentResult.paymentUrl) {
      console.error('[Dashboard Invoice Payment] Failed:', paymentResult.error);
      return NextResponse.json(
        { error: 'Failed to initiate payment', details: paymentResult.error },
        { status: 500 }
      );
    }

    // Generate full payment URL
    let fullPaymentUrl = paymentResult.paymentUrl;
    if (paymentResult.formData && provider.name === 'netcash') {
      const formParams = new URLSearchParams(paymentResult.formData as Record<string, string>);
      fullPaymentUrl = `${paymentResult.paymentUrl}?${formParams.toString()}`;
    }

    // Log payment initiation
    await supabase.from('payment_audit_logs').insert({
      invoice_id: invoice.id,
      event_type: 'dashboard_invoice_payment_initiated',
      status: 'success',
      request_body: JSON.stringify({
        invoice_number: invoice.invoice_number,
        amount: amountDue,
        customer_id: customer.id,
        source: 'customer_dashboard',
      }),
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      created_at: new Date().toISOString(),
    });

    console.log('[Dashboard Invoice Payment] Payment initiated:', {
      invoiceNumber: invoice.invoice_number,
      amount: amountDue,
      customerId: customer.id,
    });

    // Return payment URL (client will redirect)
    return NextResponse.json({
      success: true,
      paymentUrl: fullPaymentUrl,
      invoiceNumber: invoice.invoice_number,
      amount: amountDue,
    });
  } catch (error) {
    console.error('[Dashboard Invoice Payment] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
