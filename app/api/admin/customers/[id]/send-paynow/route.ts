/**
 * Send Pay Now link for an unpaid invoice
 */

import { NextRequest, NextResponse } from 'next/server';
import { processPayNowForInvoice } from '@/lib/billing/paynow-billing-service';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: customerId } = await context.params;
    const body = await request.json();
    const { invoiceId } = body;

    if (!invoiceId) {
      return NextResponse.json({ error: 'invoiceId is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Verify invoice belongs to customer and is unpaid
    const { data: invoice, error: verifyError } = await supabase
      .from('customer_invoices')
      .select('id, status, customer_id')
      .eq('id', invoiceId)
      .eq('customer_id', customerId)
      .single();

    if (verifyError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (invoice.status === 'paid') {
      return NextResponse.json({ error: 'Invoice is already paid' }, { status: 400 });
    }

    // Process Pay Now
    const result = await processPayNowForInvoice(invoiceId, {
      sendEmail: true,
      sendSms: true,
      smsTemplate: 'paymentReminder',
      forceRegenerate: false,
    });

    return NextResponse.json({
      success: result.success,
      paymentUrl: result.paymentUrl,
      emailSent: result.notificationResult?.emailSent || false,
      smsSent: result.notificationResult?.smsSent || false,
      errors: result.errors,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
