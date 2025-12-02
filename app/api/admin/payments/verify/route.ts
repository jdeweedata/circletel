/**
 * Payment Verification API
 *
 * Verifies payment status via NetCash Statement API
 *
 * POST /api/admin/payments/verify
 * - Verify specific order/invoice payment status
 *
 * GET /api/admin/payments/verify?date=YYYY-MM-DD
 * - Get all debit order results for a specific date
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { netcashStatementService, DebitOrderResult } from '@/lib/payments/netcash-statement-service';

interface VerifyPaymentRequest {
  orderId?: string;
  invoiceId?: string;
  orderNumber?: string;
  invoiceNumber?: string;
  actionDate?: string; // YYYY-MM-DD format
}

interface PaymentVerificationResult {
  success: boolean;
  orderId?: string;
  invoiceId?: string;
  reference: string;
  paymentStatus: 'paid' | 'unpaid' | 'pending' | 'not_found';
  amount?: number;
  transactionDate?: string;
  unpaidCode?: string;
  unpaidReason?: string;
  error?: string;
}

/**
 * POST - Verify payment for specific order/invoice
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body: VerifyPaymentRequest = await request.json();

    // Validate request
    if (!body.orderId && !body.invoiceId && !body.orderNumber && !body.invoiceNumber) {
      return NextResponse.json(
        { success: false, error: 'Must provide orderId, invoiceId, orderNumber, or invoiceNumber' },
        { status: 400 }
      );
    }

    // Find the order/invoice
    let orderNumber: string | null = null;
    let orderId: string | null = null;
    let invoiceId: string | null = null;
    let actionDate: Date | null = null;
    let expectedAmount: number | null = null;

    if (body.orderId || body.orderNumber) {
      const { data: order, error } = await supabase
        .from('consumer_orders')
        .select('id, order_number, total_amount, created_at, payment_status')
        .or(`id.eq.${body.orderId || ''},order_number.eq.${body.orderNumber || ''}`)
        .single();

      if (error || !order) {
        return NextResponse.json(
          { success: false, error: 'Order not found' },
          { status: 404 }
        );
      }

      orderId = order.id;
      orderNumber = order.order_number;
      expectedAmount = order.total_amount;
      
      // Use provided action date or default to order creation date
      actionDate = body.actionDate 
        ? new Date(body.actionDate) 
        : new Date(order.created_at);
    }

    if (body.invoiceId || body.invoiceNumber) {
      const { data: invoice, error } = await supabase
        .from('customer_invoices')
        .select('id, invoice_number, total_amount, due_date, status')
        .or(`id.eq.${body.invoiceId || ''},invoice_number.eq.${body.invoiceNumber || ''}`)
        .single();

      if (error || !invoice) {
        return NextResponse.json(
          { success: false, error: 'Invoice not found' },
          { status: 404 }
        );
      }

      invoiceId = invoice.id;
      orderNumber = orderNumber || invoice.invoice_number;
      expectedAmount = expectedAmount || invoice.total_amount;
      actionDate = actionDate || new Date(invoice.due_date);
    }

    if (!orderNumber || !actionDate) {
      return NextResponse.json(
        { success: false, error: 'Could not determine payment reference or action date' },
        { status: 400 }
      );
    }

    // Build possible reference variations
    const references = [
      orderNumber,
      `PAY-${orderNumber}`,
      orderNumber.replace('ORD-', ''),
      orderNumber.replace('INV-', ''),
    ];

    // Query NetCash statement
    const statement = await netcashStatementService.getStatement(actionDate);

    if (!statement.success) {
      return NextResponse.json({
        success: false,
        orderId,
        invoiceId,
        reference: orderNumber,
        paymentStatus: 'pending',
        error: statement.error || 'Could not retrieve statement',
      });
    }

    // Find matching debit order results
    const results = netcashStatementService.findDebitOrderResults(statement, references);

    if (results.length === 0) {
      // No matching transaction found - could be pending or not yet processed
      return NextResponse.json({
        success: true,
        orderId,
        invoiceId,
        reference: orderNumber,
        paymentStatus: 'not_found',
        message: 'No matching transaction found in statement. Payment may be pending or scheduled for a future date.',
      });
    }

    // Get the most relevant result (prefer successful over unpaid)
    const result = results.find(r => r.status === 'successful') || results[0];

    // Update database if payment was successful
    if (result.status === 'successful') {
      await updatePaymentStatus(supabase, orderId, invoiceId, result);
    }

    return NextResponse.json({
      success: true,
      orderId,
      invoiceId,
      reference: orderNumber,
      paymentStatus: result.status === 'successful' ? 'paid' : result.status,
      amount: result.amount,
      transactionDate: result.transactionDate,
      unpaidCode: result.unpaidCode,
      unpaidReason: result.unpaidReason,
      transactionCode: result.transactionCode,
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET - Get all debit order results for a date
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date');

    if (!dateStr) {
      return NextResponse.json(
        { success: false, error: 'Date parameter required (YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Get statement for the date
    const statement = await netcashStatementService.getStatement(date);

    if (!statement.success) {
      return NextResponse.json({
        success: false,
        error: statement.error,
        date: dateStr,
      });
    }

    // Filter for debit order transactions only
    const debitOrderCodes = ['TDD', 'SDD', 'TDC', 'SDC', 'DCS', 'DRU', 'DCX', 'DCD', 'DCU'];
    const debitOrderTransactions = statement.transactions.filter(
      tx => debitOrderCodes.includes(tx.transactionCode)
    );

    return NextResponse.json({
      success: true,
      date: dateStr,
      openingBalance: statement.openingBalance,
      closingBalance: statement.closingBalance,
      totalTransactions: statement.transactions.length,
      debitOrderTransactions: debitOrderTransactions.length,
      transactions: debitOrderTransactions,
    });

  } catch (error) {
    console.error('Statement retrieval error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Update payment status in database
 */
async function updatePaymentStatus(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orderId: string | null,
  invoiceId: string | null,
  result: DebitOrderResult
) {
  const now = new Date().toISOString();

  // Update order if provided
  if (orderId) {
    await supabase
      .from('consumer_orders')
      .update({
        payment_status: 'paid',
        total_paid: result.amount,
        updated_at: now,
      })
      .eq('id', orderId);

    // Log the payment transaction
    await supabase
      .from('payment_transactions')
      .upsert({
        transaction_id: `NETCASH-${result.transactionCode}-${result.transactionDate}-${orderId}`,
        order_id: orderId,
        amount: result.amount,
        currency: 'ZAR',
        payment_type: 'debit_order',
        status: 'completed',
        netcash_reference: result.accountReference,
        netcash_response: result,
        processed_at: now,
        transaction_date: result.transactionDate,
      }, {
        onConflict: 'transaction_id',
      });
  }

  // Update invoice if provided
  if (invoiceId) {
    await supabase
      .from('customer_invoices')
      .update({
        status: 'paid',
        amount_paid: result.amount,
        paid_at: now,
        payment_method: 'debit_order',
        payment_reference: result.accountReference,
        updated_at: now,
      })
      .eq('id', invoiceId);
  }
}
