/**
 * Outstanding Invoices API
 *
 * GET /api/admin/finance/outstanding-invoices
 * Returns all unpaid/overdue invoices with customer details and payment verification status
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export interface OutstandingInvoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  amount_paid: number;
  amount_due: number;
  due_date: string;
  days_overdue: number;
  status: 'unpaid' | 'partial' | 'overdue';
  invoice_type: string;
  payment_method: string | null;
  has_active_mandate: boolean;
  order_number: string | null;
  created_at: string;
}

export interface OutstandingInvoicesSummary {
  total_outstanding: number;
  total_overdue: number;
  total_invoices: number;
  overdue_invoices: number;
  invoices_with_mandate: number;
  invoices_without_mandate: number;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Query parameters
    const status = searchParams.get('status'); // unpaid, partial, overdue, all
    const sortBy = searchParams.get('sortBy') || 'due_date';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query for outstanding invoices
    let query = supabase
      .from('customer_invoices')
      .select(`
        id,
        invoice_number,
        customer_id,
        total_amount,
        amount_paid,
        amount_due,
        due_date,
        status,
        invoice_type,
        payment_method,
        created_at,
        service_id,
        customers!inner (
          id,
          first_name,
          last_name,
          email,
          customer_payment_methods (
            id,
            method_type,
            mandate_status,
            is_active
          )
        ),
        consumer_orders (
          order_number
        )
      `)
      .in('status', status === 'all' ? ['unpaid', 'partial', 'overdue'] : [status || 'unpaid', 'partial', 'overdue']);

    // Apply sorting
    const ascending = sortOrder === 'asc';
    if (sortBy === 'due_date') {
      query = query.order('due_date', { ascending });
    } else if (sortBy === 'amount') {
      query = query.order('total_amount', { ascending });
    } else if (sortBy === 'created_at') {
      query = query.order('created_at', { ascending });
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: invoices, error } = await query;

    if (error) {
      console.error('Error fetching outstanding invoices:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch invoices' },
        { status: 500 }
      );
    }

    // Transform data
    const today = new Date();
    const outstandingInvoices: OutstandingInvoice[] = (invoices || []).map((invoice: any) => {
      const dueDate = new Date(invoice.due_date);
      const daysOverdue = Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
      
      const customer = invoice.customers;
      const paymentMethods = customer?.customer_payment_methods || [];
      const hasActiveMandate = paymentMethods.some(
        (pm: any) => pm.method_type === 'debit_order' && pm.mandate_status === 'active' && pm.is_active
      );

      return {
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        customer_id: invoice.customer_id,
        customer_name: `${customer?.first_name || ''} ${customer?.last_name || ''}`.trim() || 'Unknown',
        customer_email: customer?.email || '',
        total_amount: invoice.total_amount,
        amount_paid: invoice.amount_paid,
        amount_due: invoice.amount_due,
        due_date: invoice.due_date,
        days_overdue: daysOverdue,
        status: daysOverdue > 0 && invoice.status === 'unpaid' ? 'overdue' : invoice.status,
        invoice_type: invoice.invoice_type,
        payment_method: invoice.payment_method,
        has_active_mandate: hasActiveMandate,
        order_number: invoice.consumer_orders?.[0]?.order_number || null,
        created_at: invoice.created_at,
      };
    });

    // Calculate summary
    const summary: OutstandingInvoicesSummary = {
      total_outstanding: outstandingInvoices.reduce((sum, inv) => sum + inv.amount_due, 0),
      total_overdue: outstandingInvoices
        .filter(inv => inv.days_overdue > 0)
        .reduce((sum, inv) => sum + inv.amount_due, 0),
      total_invoices: outstandingInvoices.length,
      overdue_invoices: outstandingInvoices.filter(inv => inv.days_overdue > 0).length,
      invoices_with_mandate: outstandingInvoices.filter(inv => inv.has_active_mandate).length,
      invoices_without_mandate: outstandingInvoices.filter(inv => !inv.has_active_mandate).length,
    };

    return NextResponse.json({
      success: true,
      data: {
        invoices: outstandingInvoices,
        summary,
        pagination: {
          limit,
          offset,
          total: outstandingInvoices.length,
        },
      },
    });

  } catch (error) {
    console.error('Outstanding invoices API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST - Trigger payment verification for specific invoices
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { invoiceIds, actionDate } = body;

    if (!invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'invoiceIds array required' },
        { status: 400 }
      );
    }

    // Fetch invoices
    const { data: invoices, error } = await supabase
      .from('customer_invoices')
      .select('id, invoice_number, due_date')
      .in('id', invoiceIds);

    if (error || !invoices) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch invoices' },
        { status: 500 }
      );
    }

    // Trigger verification for each invoice
    const results = [];
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    for (const invoice of invoices) {
      try {
        const response = await fetch(`${baseUrl}/api/admin/payments/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            invoiceId: invoice.id,
            actionDate: actionDate || invoice.due_date,
          }),
        });

        const result = await response.json();
        results.push({
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoice_number,
          ...result,
        });
      } catch (err) {
        results.push({
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoice_number,
          success: false,
          error: 'Verification request failed',
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
    });

  } catch (error) {
    console.error('Batch verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
