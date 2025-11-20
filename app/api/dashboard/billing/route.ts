/**
 * Billing Dashboard Summary API
 * GET /api/dashboard/billing
 *
 * Returns comprehensive billing summary for customer dashboard including:
 * - Invoices (all customer invoices)
 * - Payment history (completed transactions)
 * - Payment methods (saved payment methods)
 * - Billing summary (balance, YTD totals, next billing date, monthly average)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createClientWithSession } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // Check Authorization header first (for client-side fetch requests)
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let user: any = null;

    if (token) {
      // Use token from Authorization header
      const supabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data: { user: tokenUser }, error: tokenError } = await supabase.auth.getUser(token);

      if (tokenError || !tokenUser) {
        return NextResponse.json(
          {
            success: false,
            error: 'Unauthorized',
            details: 'Invalid or expired session token'
          },
          { status: 401 }
        );
      }

      user = tokenUser;
    } else {
      // Fall back to cookies (for SSR/middleware scenarios)
      const sessionClient = await createClientWithSession();
      const { data: { session }, error: authError } = await sessionClient.auth.getSession();

      if (authError || !session?.user) {
        return NextResponse.json(
          {
            success: false,
            error: 'Unauthorized',
            details: 'No session found. Please login again.'
          },
          { status: 401 }
        );
      }

      user = session.user;
    }

    // Use service role client for database queries to bypass RLS
    const supabase = await createClient();

    // Get customer_id from auth_user_id
    const { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          error: 'Customer not found'
        },
        { status: 404 }
      );
    }

    // Fetch all invoices for the customer
    const { data: invoices } = await supabase
      .from('customer_invoices')
      .select('*')
      .eq('customer_id', customer.id)
      .order('invoice_date', { ascending: false });

    // Fetch payment transactions (successful payments only for history)
    const { data: payments } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('customer_id', customer.id)
      .in('status', ['completed', 'processing', 'pending'])
      .order('transaction_date', { ascending: false });

    // Fetch payment methods
    const { data: paymentMethods } = await supabase
      .from('customer_payment_methods')
      .select('*')
      .eq('customer_id', customer.id)
      .eq('is_active', true)
      .order('is_primary', { ascending: false });

    // Fetch billing info
    const { data: billing } = await supabase
      .from('customer_billing')
      .select('*')
      .eq('customer_id', customer.id)
      .single();

    // Get next billing date from active services
    const { data: nextBillingService } = await supabase
      .from('customer_services')
      .select('next_billing_date')
      .eq('customer_id', customer.id)
      .eq('status', 'active')
      .order('next_billing_date', { ascending: true })
      .limit(1)
      .single();

    // Calculate YTD payments (completed payments this year)
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);
    const ytdPayments = payments?.filter(p =>
      p.status === 'completed' && new Date(p.transaction_date) >= yearStart
    ) || [];
    const total_paid_ytd = ytdPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

    // Calculate average monthly (based on completed payments)
    const completedPayments = payments?.filter(p => p.status === 'completed') || [];
    const average_monthly = completedPayments.length > 0
      ? completedPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) / Math.max(completedPayments.length, 1)
      : 0;

    // Transform data to match page expectations
    const transformedInvoices = (invoices || []).map(inv => ({
      id: inv.id,
      invoice_number: inv.invoice_number,
      invoice_date: inv.invoice_date,
      due_date: inv.due_date,
      total_amount: parseFloat(inv.total_amount) || 0,
      amount_due: parseFloat(inv.amount_due) || 0,
      amount_paid: parseFloat(inv.amount_paid) || 0,
      status: inv.status as 'paid' | 'pending' | 'overdue' | 'cancelled',
      description: inv.notes || `Invoice ${inv.invoice_number}`,
      service_period_start: inv.period_start,
      service_period_end: inv.period_end
    }));

    const transformedPayments = (payments || []).map(pmt => ({
      id: pmt.id,
      payment_date: pmt.transaction_date,
      amount: parseFloat(pmt.amount) || 0,
      payment_method: pmt.payment_type || 'Unknown',
      transaction_id: pmt.transaction_id,
      status: pmt.status === 'completed' ? 'successful' : (pmt.status === 'failed' ? 'failed' : 'pending') as 'successful' | 'pending' | 'failed',
      invoice_id: pmt.invoice_id
    }));

    const transformedPaymentMethods = (paymentMethods || []).map(pm => ({
      id: pm.id,
      type: pm.method_type as 'credit_card' | 'debit_card' | 'bank_account' | 'eft',
      last_four: pm.last_four || '****',
      expiry_date: pm.encrypted_details?.expiry_month && pm.encrypted_details?.expiry_year
        ? `${pm.encrypted_details.expiry_month}/${pm.encrypted_details.expiry_year}`
        : undefined,
      is_primary: pm.is_primary || false,
      card_brand: pm.encrypted_details?.card_type || undefined,
      bank_name: pm.encrypted_details?.bank_name || undefined
    }));

    // Compile response matching page expectations
    const response = {
      success: true,
      data: {
        invoices: transformedInvoices,
        payments: transformedPayments,
        payment_methods: transformedPaymentMethods,
        billing_summary: {
          current_balance: parseFloat(billing?.account_balance) || 0,
          total_paid_ytd,
          next_billing_date: nextBillingService?.next_billing_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          average_monthly
        }
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Billing API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch billing data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
