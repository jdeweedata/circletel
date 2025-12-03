/**
 * Invoice Detail API with Payment History
 *
 * GET /api/admin/billing/invoices/[id]
 *
 * Returns invoice details including all payments made against it.
 * Part of the Unified Payment & Billing Architecture.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // Use service role client to bypass RLS for admin access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get invoice with customer details
    const { data: invoice, error: invoiceError } = await supabase
      .from('customer_invoices')
      .select(`
        *,
        customer:customers(
          id,
          first_name,
          last_name,
          email,
          phone,
          business_name
        )
      `)
      .eq('id', id)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Get payments for this invoice (by invoice_id or reference matching invoice_number)
    const { data: payments, error: paymentsError } = await supabase
      .from('payment_transactions')
      .select(`
        id,
        transaction_id,
        reference,
        amount,
        currency,
        status,
        payment_method,
        provider,
        provider_response,
        zoho_payment_id,
        zoho_sync_status,
        zoho_last_synced_at,
        zoho_last_sync_error,
        initiated_at,
        completed_at,
        created_at
      `)
      .or(`invoice_id.eq.${id},reference.eq.${invoice.invoice_number}`)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false });

    if (paymentsError) {
      console.error('[Invoice Detail] Error fetching payments:', paymentsError);
    }

    // Get invoice line items if they exist
    const { data: lineItems } = await supabase
      .from('invoice_line_items')
      .select('*')
      .eq('invoice_id', id)
      .order('created_at', { ascending: true });

    // Extract customer from relationship
    const customer = Array.isArray(invoice.customer) ? invoice.customer[0] : invoice.customer;

    return NextResponse.json({
      success: true,
      data: {
        invoice: {
          ...invoice,
          customer,
        },
        payments: payments || [],
        lineItems: lineItems || [],
        summary: {
          totalPaid: payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0,
          paymentCount: payments?.length || 0,
          remainingBalance: invoice.amount_due || 0,
        },
      },
    });
  } catch (error) {
    console.error('[Invoice Detail] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch invoice details',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
