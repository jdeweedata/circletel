/**
 * Manual Payment Recording API
 * POST /api/admin/billing/payments/manual
 *
 * Allows admins to record offline/manual payments (EFT, cash, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';
import { apiLogger } from '@/lib/logging';

export const runtime = 'nodejs';
export const maxDuration = 30;

interface ManualPaymentRequest {
  invoice_id: string;
  amount: number;
  payment_method: 'eft' | 'cash' | 'cheque' | 'other';
  reference: string;
  payment_date: string;
  notes?: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get admin user (service role for admin operations)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body: ManualPaymentRequest = await request.json();
    const { invoice_id, amount, payment_method, reference, payment_date, notes } = body;

    // Validate required fields
    if (!invoice_id || !amount || !payment_method || !reference || !payment_date) {
      return NextResponse.json(
        { error: 'Missing required fields: invoice_id, amount, payment_method, reference, payment_date' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than zero' },
        { status: 400 }
      );
    }

    // Fetch invoice to validate
    const { data: invoice, error: invoiceError } = await supabase
      .from('customer_invoices')
      .select('id, invoice_number, total_amount, amount_paid, amount_due, status, customer_id')
      .eq('id', invoice_id)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Check if invoice is already paid
    if (invoice.status === 'paid') {
      return NextResponse.json(
        { error: 'Invoice is already fully paid' },
        { status: 400 }
      );
    }

    // Calculate new amounts
    const currentAmountPaid = invoice.amount_paid || 0;
    const newAmountPaid = currentAmountPaid + amount;
    const newAmountDue = invoice.total_amount - newAmountPaid;
    const isFullyPaid = newAmountDue <= 0;

    // Generate payment reference
    const paymentReference = `MAN-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`;

    // Start transaction - record payment and update invoice
    // Record payment in payment_transactions table (if exists) or payment_webhooks
    const { data: paymentRecord, error: paymentError } = await supabase
      .from('payment_webhooks')
      .insert({
        provider: 'manual',
        event_type: 'payment_recorded',
        payment_reference: paymentReference,
        amount: amount,
        currency: 'ZAR',
        status: 'completed',
        processed: true,
        processed_at: new Date().toISOString(),
        raw_payload: {
          type: 'manual_payment',
          invoice_id,
          invoice_number: invoice.invoice_number,
          customer_id: invoice.customer_id,
          payment_method,
          external_reference: reference,
          payment_date,
          notes,
          recorded_by: user.id,
          recorded_at: new Date().toISOString(),
        },
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (paymentError) {
      apiLogger.error('[Manual Payment] Failed to record payment:', paymentError);
      return NextResponse.json(
        { error: 'Failed to record payment', details: paymentError.message },
        { status: 500 }
      );
    }

    // Update invoice
    const { error: updateError } = await supabase
      .from('customer_invoices')
      .update({
        amount_paid: newAmountPaid,
        amount_due: Math.max(0, newAmountDue),
        status: isFullyPaid ? 'paid' : 'partial',
        paid_at: isFullyPaid ? new Date().toISOString() : null,
        payment_method: payment_method,
        payment_reference: reference,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoice_id);

    if (updateError) {
      apiLogger.error('[Manual Payment] Failed to update invoice:', updateError);
      return NextResponse.json(
        { error: 'Failed to update invoice', details: updateError.message },
        { status: 500 }
      );
    }

    // Update customer billing balance if fully paid
    if (isFullyPaid) {
      const { error: balanceError } = await supabase.rpc('update_customer_balance', {
        p_customer_id: invoice.customer_id,
        p_amount: -amount, // Negative to reduce owed balance
        p_description: `Manual payment recorded for ${invoice.invoice_number}`,
      });

      if (balanceError) {
        apiLogger.warn('[Manual Payment] Failed to update balance:', balanceError);
        // Don't fail the request, payment was recorded successfully
      }
    }

    // Log audit entry
    await supabase.from('payment_audit_logs').insert({
      invoice_id,
      event_type: 'manual_payment_recorded',
      status: 'success',
      request_body: JSON.stringify({
        amount,
        payment_method,
        reference,
        payment_date,
        recorded_by: user.id,
      }),
      response_body: JSON.stringify({
        payment_reference: paymentReference,
        new_amount_paid: newAmountPaid,
        new_amount_due: Math.max(0, newAmountDue),
        new_status: isFullyPaid ? 'paid' : 'partial',
      }),
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      created_at: new Date().toISOString(),
    });

    apiLogger.info('[Manual Payment] Payment recorded:', {
      invoice: invoice.invoice_number,
      amount,
      payment_method,
      reference,
      new_status: isFullyPaid ? 'paid' : 'partial',
    });

    return NextResponse.json({
      success: true,
      payment: {
        id: paymentRecord.id,
        reference: paymentReference,
        amount,
        payment_method,
        external_reference: reference,
        payment_date,
      },
      invoice: {
        id: invoice_id,
        invoice_number: invoice.invoice_number,
        total_amount: invoice.total_amount,
        amount_paid: newAmountPaid,
        amount_due: Math.max(0, newAmountDue),
        status: isFullyPaid ? 'paid' : 'partial',
      },
    });
  } catch (error) {
    apiLogger.error('[Manual Payment] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
