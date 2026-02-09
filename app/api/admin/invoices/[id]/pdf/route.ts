/**
 * Admin Invoice PDF Generation API
 * GET /api/admin/invoices/[id]/pdf
 *
 * Generates SARS-compliant PDF invoice for download.
 * Uses jsPDF to create professional tax invoices.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createClientWithSession } from '@/lib/supabase/server';
import { generateInvoicePDF, buildInvoiceData } from '@/lib/invoices/invoice-pdf-generator';
import { apiLogger } from '@/lib/logging/logger';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: invoiceId } = await context.params;

    // Use session-aware client to get authenticated user
    const sessionClient = await createClientWithSession();
    const { data: { user }, error: authError } = await sessionClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Use service role client for data operations (bypasses RLS)
    const supabase = await createClient();

    // Check admin permissions
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id, role, permissions')
      .eq('email', user.email)
      .single();

    if (!adminUser) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Fetch the invoice with customer data
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
          account_number,
          account_type,
          business_name,
          business_registration,
          tax_number
        )
      `)
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Try to fetch order data for address (prefer residential/KYC-verified address for invoicing)
    let orderData = null;
    const { data: order } = await supabase
      .from('consumer_orders')
      .select('installation_address, city, province, postal_code, residential_address, residential_suburb, residential_city, residential_province, residential_postal_code, kyc_address_verified')
      .eq('customer_id', invoice.customer_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Use residential address (KYC-verified) if available, otherwise fall back to installation address
    if (order) {
      if (order.residential_address && order.kyc_address_verified) {
        orderData = {
          installation_address: order.residential_address,
          city: order.residential_city || order.residential_suburb,
          province: order.residential_province,
          postal_code: order.residential_postal_code
        };
      } else {
        orderData = {
          installation_address: order.installation_address,
          city: order.city,
          province: order.province,
          postal_code: order.postal_code
        };
      }
    }

    // Build invoice data for PDF generation
    const invoiceData = buildInvoiceData({
      invoice: {
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        invoice_date: invoice.invoice_date,
        due_date: invoice.due_date,
        period_start: invoice.period_start,
        period_end: invoice.period_end,
        subtotal: parseFloat(invoice.subtotal) || 0,
        tax_amount: parseFloat(invoice.tax_amount) || 0,
        total_amount: parseFloat(invoice.total_amount) || 0,
        line_items: invoice.line_items || [],
        notes: invoice.notes,
        status: invoice.status
      },
      customer: {
        first_name: invoice.customer?.first_name || 'Customer',
        last_name: invoice.customer?.last_name || '',
        email: invoice.customer?.email || '',
        phone: invoice.customer?.phone,
        account_number: invoice.customer?.account_number,
        business_name: invoice.customer?.business_name,
        business_registration: invoice.customer?.business_registration,
        tax_number: invoice.customer?.tax_number
      },
      order: orderData ? {
        installation_address: orderData.installation_address,
        city: orderData.city,
        province: orderData.province,
        postal_code: orderData.postal_code
      } : undefined
    });

    // Generate PDF
    const doc = generateInvoicePDF(invoiceData);
    const pdfBuffer = doc.output('arraybuffer');

    // Return PDF as downloadable file
    const filename = `CircleTel_Invoice_${invoice.invoice_number}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.byteLength.toString()
      }
    });

  } catch (error: any) {
    apiLogger.error('Invoice PDF generation failed', { error });
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
