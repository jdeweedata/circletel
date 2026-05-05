import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { syncPaymentToZohoBilling } from '@/lib/integrations/zoho/payment-sync-service';

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { invoice_id, admin_user_id } = body as {
      invoice_id: string;
      admin_user_id?: string;
    };

    if (!invoice_id) {
      return NextResponse.json(
        { error: 'invoice_id is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: queueItem, error: fetchError } = await supabase
      .from('reconciliation_queue')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !queueItem) {
      return NextResponse.json(
        { error: 'Queue item not found' },
        { status: 404 }
      );
    }

    if (queueItem.status !== 'pending') {
      return NextResponse.json(
        { error: `Item already ${queueItem.status}` },
        { status: 409 }
      );
    }

    const { data: invoice, error: invoiceError } = await supabase
      .from('customer_invoices')
      .select('id, invoice_number, status, total_amount')
      .eq('id', invoice_id)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    if (invoice.status === 'paid') {
      return NextResponse.json(
        { error: `Invoice ${invoice.invoice_number} is already paid` },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();
    const providerRef = queueItem.source === 'zoho_cashbook'
      ? `EFT-${queueItem.source_reference}`
      : `PAYNOW-${queueItem.source_reference}`;

    const { data: paymentRecord, error: paymentError } = await supabase
      .from('payment_transactions')
      .insert({
        invoice_id: invoice.id,
        transaction_id: `MANUAL-RECON-${queueItem.source_reference}`,
        provider_reference: providerRef,
        amount: queueItem.amount,
        currency: queueItem.currency || 'ZAR',
        payment_method: queueItem.payment_method || 'eft',
        status: 'completed',
        reconciliation_source: 'manual_approval',
        completed_at: now,
        netcash_response: queueItem.raw_data,
      })
      .select('id')
      .single();

    if (paymentError) {
      return NextResponse.json(
        { error: `Failed to create payment: ${paymentError.message}` },
        { status: 500 }
      );
    }

    const { error: invoiceUpdateError } = await supabase
      .from('customer_invoices')
      .update({
        status: 'paid',
        amount_paid: queueItem.amount,
        paid_at: now,
        payment_method: queueItem.payment_method || 'eft',
        payment_reference: queueItem.payer_reference,
        updated_at: now,
      })
      .eq('id', invoice.id);

    if (invoiceUpdateError) {
      return NextResponse.json(
        { error: `Failed to update invoice: ${invoiceUpdateError.message}` },
        { status: 500 }
      );
    }

    await supabase
      .from('reconciliation_queue')
      .update({
        status: 'approved',
        matched_invoice_id: invoice.id,
        resolved_by: admin_user_id || null,
        resolved_at: now,
        resolution_notes: `Manually matched to ${invoice.invoice_number}`,
      })
      .eq('id', id);

    if (paymentRecord?.id) {
      try {
        await syncPaymentToZohoBilling(paymentRecord.id);
      } catch {
        // Non-fatal
      }
    }

    return NextResponse.json({
      success: true,
      payment_id: paymentRecord?.id,
      invoice_number: invoice.invoice_number,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
