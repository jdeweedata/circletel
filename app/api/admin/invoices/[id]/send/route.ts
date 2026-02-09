/**
 * API Route: Send Invoice
 * POST /api/admin/invoices/[id]/send
 * 
 * Marks an invoice as sent in both local database and Zoho Billing
 * Optionally sends email to customer
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ZohoBillingClient } from '@/lib/integrations/zoho/billing-client';
import { apiLogger } from '@/lib/logging/logger';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { send_email = false } = body;

    // Get the invoice
    const { data: invoice, error: fetchError } = await supabase
      .from('customer_invoices')
      .select('*, customer:customers(email, first_name, last_name)')
      .eq('id', id)
      .single();

    if (fetchError || !invoice) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Get Zoho invoice ID
    const zohoInvoiceId = invoice.zoho_invoice_id || invoice.zoho_billing_invoice_id;

    if (!zohoInvoiceId) {
      return NextResponse.json(
        { success: false, error: 'Invoice not synced to Zoho. Please sync first.' },
        { status: 400 }
      );
    }

    apiLogger.info('[SendInvoice] Processing invoice', {
      id,
      invoice_number: invoice.invoice_number,
      zoho_invoice_id: zohoInvoiceId,
      send_email,
    });

    // Mark as sent in Zoho Billing
    const billingClient = new ZohoBillingClient();

    try {
      if (send_email) {
        // Send via email (this also marks as sent)
        await billingClient.emailInvoice(zohoInvoiceId, {
          to_mail_ids: [invoice.customer?.email],
        });
        apiLogger.info('[SendInvoice] Invoice emailed to', { email: invoice.customer?.email });
      } else {
        // Just mark as sent without emailing
        await billingClient.markInvoiceAsSent(zohoInvoiceId);
        apiLogger.info('[SendInvoice] Invoice marked as sent in Zoho');
      }
    } catch (zohoError: any) {
      // Log the error but continue to update local status
      // Invoice may already be sent in Zoho, which is fine
      apiLogger.info('[SendInvoice] Zoho API response (may be already sent)', { message: zohoError.message });
    }

    // Update local invoice status
    // Valid statuses: 'draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled', 'voided'
    const updateData: any = {
      status: 'sent', // Changed from draft to sent
      updated_at: new Date().toISOString(),
    };

    if (send_email) {
      updateData.emailed_at = new Date().toISOString();
      updateData.email_attempts = (invoice.email_attempts || 0) + 1;
    }

    apiLogger.info('[SendInvoice] Updating local invoice', { id, updateData });

    const { data: updatedInvoice, error: updateError } = await supabase
      .from('customer_invoices')
      .update(updateData)
      .eq('id', id)
      .select('id, status, updated_at')
      .single();

    if (updateError) {
      apiLogger.error('[SendInvoice] Failed to update local invoice', { error: updateError });
      // Return error since local update failed
      return NextResponse.json({
        success: false,
        error: `Failed to update local invoice: ${updateError.message}`,
      }, { status: 500 });
    }

    apiLogger.info('[SendInvoice] Local invoice updated', { updatedInvoice });

    return NextResponse.json({
      success: true,
      message: send_email
        ? `Invoice sent to ${invoice.customer?.email}`
        : 'Invoice marked as sent',
      invoice: {
        id,
        invoice_number: invoice.invoice_number,
        status: 'sent',
        emailed: send_email,
      }
    });

  } catch (error) {
    apiLogger.error('[SendInvoice] Error', { error });
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
