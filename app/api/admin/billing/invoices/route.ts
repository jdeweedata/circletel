/**
 * Admin Invoices List API
 * GET /api/admin/billing/invoices
 *
 * Fetches all invoices with customer details and calculates stats.
 * Used by the admin billing invoices page.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { apiLogger } from '@/lib/logging';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
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

    // Fetch all invoices with customer details
    const { data: invoices, error: invoicesError } = await supabase
      .from('customer_invoices')
      .select(`
        id,
        invoice_number,
        customer_id,
        invoice_date,
        due_date,
        subtotal,
        tax_amount,
        total_amount,
        amount_paid,
        amount_due,
        status,
        line_items,
        customers (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .order('invoice_date', { ascending: false });

    if (invoicesError) {
      apiLogger.error('Error fetching invoices:', invoicesError);
      return NextResponse.json(
        { error: 'Failed to fetch invoices' },
        { status: 500 }
      );
    }

    // Calculate stats
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let totalOutstanding = 0;
    let paidThisMonth = 0;
    let overdueAmount = 0;
    let overdueCount = 0;

    const formattedInvoices = (invoices || []).map((inv: any) => {
      const amountDue = parseFloat(inv.amount_due || '0');
      const amountPaid = parseFloat(inv.amount_paid || '0');
      const totalAmount = parseFloat(inv.total_amount || '0');

      // Calculate stats
      if (inv.status === 'sent' || inv.status === 'partial') {
        totalOutstanding += amountDue;
      }

      if (inv.status === 'overdue') {
        totalOutstanding += amountDue;
        overdueAmount += amountDue;
        overdueCount++;
      }

      if (inv.status === 'paid' && inv.paid_at) {
        const paidDate = new Date(inv.paid_at);
        if (paidDate >= startOfMonth) {
          paidThisMonth += amountPaid;
        }
      }

      // Extract customer from relationship
      const customer = Array.isArray(inv.customers) ? inv.customers[0] : inv.customers;

      return {
        id: inv.id,
        invoice_number: inv.invoice_number,
        customer_id: inv.customer_id,
        customer_name: customer
          ? `${customer.first_name} ${customer.last_name}`
          : 'Unknown',
        customer_email: customer?.email || '',
        invoice_date: inv.invoice_date,
        due_date: inv.due_date,
        subtotal: parseFloat(inv.subtotal || '0'),
        tax_amount: parseFloat(inv.tax_amount || '0'),
        total_amount: totalAmount,
        amount_paid: amountPaid,
        amount_due: amountDue,
        status: inv.status,
        line_items: inv.line_items || [],
      };
    });

    return NextResponse.json({
      invoices: formattedInvoices,
      stats: {
        totalOutstanding,
        paidThisMonth,
        overdueAmount,
        overdueCount,
      },
    });
  } catch (error) {
    apiLogger.error('Error in invoices API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}
