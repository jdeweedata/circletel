import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { apiLogger } from '@/lib/logging';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { sendMandateRequest } from '@/lib/payments/mandate-send-service';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * POST /api/admin/customers/[id]/send-mandate
 *
 * Admin-initiated NetCash eMandate for a customer WITHOUT a consumer order — the B2B path
 * (customers.account_type='business') and any order-less debit-order setup. Collection then
 * runs off customer_invoices via the daily debit batch (same as B2C).
 *
 * Body:
 *  - amount: number (required) — monthly debit amount in Rands
 *  - billingDay?: 1 | 5 | 25 | 30 (default 1)
 *  - agreementReference?: string (e.g. contract number; defaults to account_number)
 *  - notes?: string
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await authenticateAdmin(request);
  if (!authResult.success) return authResult.response;

  try {
    const { id: customerId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const { amount, billingDay = 1, agreementReference, notes } = body as {
      amount?: number;
      billingDay?: number;
      agreementReference?: string;
      notes?: string;
    };

    const parsedAmount = typeof amount === 'number' ? amount : parseFloat(String(amount));
    if (!parsedAmount || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'A valid monthly amount is required' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, first_name, last_name, email, phone, account_type, account_number, business_name, business_registration')
      .eq('id', customerId)
      .single();

    if (customerError || !customer) {
      apiLogger.error('[Customer SendMandate] Customer not found', { error: customerError?.message, customerId });
      return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 });
    }

    if (!customer.account_number) {
      return NextResponse.json(
        { success: false, error: 'Customer account number not yet assigned. Please contact support.' },
        { status: 400 }
      );
    }

    const result = await sendMandateRequest({
      supabase,
      customer,
      amount: parsedAmount,
      billingDay,
      agreementReference: agreementReference || customer.account_number,
      orderId: null, // B2B / order-less
      notes: notes ?? null,
      initiatedBy: 'admin',
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || null,
      userAgent: request.headers.get('user-agent') || null,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to send mandate', emandateRequestId: result.emandateRequestId },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        emandateRequestId: result.emandateRequestId,
        accountReference: result.accountReference,
        fileToken: result.fileToken,
        expiresAt: result.expiresAt,
      },
      message: 'eMandate request submitted. The customer will receive an email/SMS from NetCash to sign the mandate.',
    });
  } catch (error: unknown) {
    apiLogger.error('[Customer SendMandate] Unexpected error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
