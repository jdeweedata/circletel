/**
 * Public Invoice Lookup API
 * GET /api/pay/[invoiceNumber]
 *
 * Fetches invoice details by invoice number for public payment page.
 * No authentication required - uses invoice number as identifier.
 * Returns limited data for security (no full customer details).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ invoiceNumber: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { invoiceNumber } = await params;

    // Use service role client to bypass RLS for public invoice lookup
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Normalize invoice number (uppercase, trim)
    const normalizedInvoiceNumber = invoiceNumber.toUpperCase().trim();

    // Fetch invoice with limited customer data
    const { data: invoice, error } = await supabase
      .from('customer_invoices')
      .select(`
        id,
        invoice_number,
        invoice_date,
        due_date,
        total_amount,
        amount_paid,
        amount_due,
        status,
        line_items,
        subtotal,
        tax_amount,
        vat_amount,
        customer:customers(
          id,
          first_name,
          email
        )
      `)
      .eq('invoice_number', normalizedInvoiceNumber)
      .single();

    if (error || !invoice) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invoice not found',
          message: 'Please check the invoice number and try again.',
        },
        { status: 404 }
      );
    }

    // Check if already paid
    if (invoice.status === 'paid') {
      return NextResponse.json({
        success: true,
        invoice: {
          invoice_number: invoice.invoice_number,
          status: 'paid',
          total_amount: invoice.total_amount,
          amount_paid: invoice.amount_paid,
          paid: true,
        },
        message: 'This invoice has already been paid.',
      });
    }

    // Calculate amount due if not set
    const amountDue = invoice.amount_due || (invoice.total_amount - (invoice.amount_paid || 0));

    // Return invoice data (limited for security)
    const customer = Array.isArray(invoice.customer) ? invoice.customer[0] : invoice.customer;

    return NextResponse.json({
      success: true,
      invoice: {
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        invoice_date: invoice.invoice_date,
        due_date: invoice.due_date,
        total_amount: invoice.total_amount,
        amount_paid: invoice.amount_paid || 0,
        amount_due: amountDue,
        status: invoice.status,
        subtotal: invoice.subtotal,
        tax_amount: invoice.tax_amount || invoice.vat_amount || 0,
        line_items: invoice.line_items || [],
        customer_first_name: customer?.first_name || 'Customer',
        // Mask email for privacy (show first 2 chars + domain)
        customer_email_masked: customer?.email
          ? `${customer.email.substring(0, 2)}***@${customer.email.split('@')[1]}`
          : null,
        paid: false,
      },
    });
  } catch (error) {
    console.error('[Public Invoice API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch invoice',
      },
      { status: 500 }
    );
  }
}
