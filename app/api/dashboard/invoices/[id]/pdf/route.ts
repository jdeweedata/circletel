/**
 * Customer Invoice PDF — generate on-the-fly
 * GET /api/dashboard/invoices/[id]/pdf
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClientWithSession } from '@/lib/supabase/server';
import { buildInvoiceData, generateInvoicePDFBuffer } from '@/lib/invoices/invoice-pdf-generator';
import { billingLogger } from '@/lib/logging/logger';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // Auth: Bearer token OR cookies
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : null;

    let user: { id: string } | null = null;
    let supabase: SupabaseClient;

    if (token) {
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );
      const { data: { user: tokenUser }, error } = await supabase.auth.getUser(token);
      if (error || !tokenUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      user = tokenUser;
    } else {
      supabase = await createClientWithSession() as unknown as SupabaseClient;
      const { data: { user: cookieUser }, error } = await supabase.auth.getUser();
      if (error || !cookieUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      user = cookieUser;
    }

    // Resolve customer_id from auth user
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, first_name, last_name, email, phone, account_number, business_name, business_registration, tax_number')
      .eq('auth_user_id', user.id)
      .single();

    if (customerError || !customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Fetch invoice — verify ownership
    const { data: invoice, error: invoiceError } = await supabase
      .from('customer_invoices')
      .select('id, invoice_number, invoice_date, due_date, period_start, period_end, subtotal, tax_amount, total_amount, amount_paid, amount_due, line_items, notes, status')
      .eq('id', id)
      .eq('customer_id', customer.id)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Optionally fetch most-recent order for installation address
    const { data: order } = await supabase
      .from('consumer_orders')
      .select('installation_address, city, province, postal_code')
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Build InvoiceData and generate PDF
    const invoiceData = buildInvoiceData({
      invoice: {
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        invoice_date: invoice.invoice_date,
        due_date: invoice.due_date,
        period_start: invoice.period_start ?? undefined,
        period_end: invoice.period_end ?? undefined,
        subtotal: parseFloat(invoice.subtotal) || 0,
        tax_amount: invoice.tax_amount ? parseFloat(invoice.tax_amount) : undefined,
        total_amount: parseFloat(invoice.total_amount) || 0,
        line_items: invoice.line_items || [],
        notes: invoice.notes ?? undefined,
        status: invoice.status,
      },
      customer: {
        first_name: customer.first_name,
        last_name: customer.last_name,
        email: customer.email,
        phone: customer.phone ?? undefined,
        account_number: customer.account_number ?? undefined,
        business_name: customer.business_name ?? undefined,
        business_registration: customer.business_registration ?? undefined,
        tax_number: customer.tax_number ?? undefined,
      },
      order: order ? {
        installation_address: order.installation_address ?? undefined,
        city: order.city ?? undefined,
        province: order.province ?? undefined,
        postal_code: order.postal_code ?? undefined,
      } : undefined,
    });

    // Populate payment summary from DB fields
    invoiceData.amountPaid = parseFloat(invoice.amount_paid) || 0;
    invoiceData.amountDue = parseFloat(invoice.amount_due) || 0;

    const pdfBuffer = generateInvoicePDFBuffer(invoiceData);

    const disposition = request.nextUrl.searchParams.get('download') === 'true'
      ? 'attachment'
      : 'inline';

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${disposition}; filename="${invoice.invoice_number}.pdf"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });

  } catch (error) {
    billingLogger.error('Unexpected error generating invoice PDF', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
