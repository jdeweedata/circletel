/**
 * Billing Dashboard Summary API
 * GET /api/dashboard/billing
 * 
 * Returns comprehensive billing summary for customer dashboard
 * Task 2.7: Billing Dashboard API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createClientWithSession } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { PaymentMethodService } from '@/lib/billing/payment-method-service';

/**
 * GET /api/dashboard/billing
 *
 * Returns:
 * - account_balance
 * - credit_limit
 * - next_billing_date (from services)
 * - primary_payment_method (masked)
 * - recent_transactions (last 10)
 * - upcoming_invoices (unpaid, next 30 days)
 * - overdue_invoices
 * - auto_pay_enabled
 * - billing_preferences
 */
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
    
    // Fetch billing information
    const { data: billing } = await supabase
      .from('customer_billing')
      .select('*')
      .eq('customer_id', customer.id)
      .single();
    
    // Get primary payment method (masked)
    const primaryMethod = await PaymentMethodService.getPrimaryMethod(customer.id);
    
    // Get recent transactions (last 10)
    const { data: recentTransactions } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('customer_id', customer.id)
      .order('transaction_date', { ascending: false })
      .limit(10);
    
    // Get upcoming invoices (unpaid, due in next 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const { data: upcomingInvoices } = await supabase
      .from('customer_invoices')
      .select('*')
      .eq('customer_id', customer.id)
      .eq('status', 'unpaid')
      .lte('due_date', thirtyDaysFromNow.toISOString().split('T')[0])
      .order('due_date', { ascending: true });
    
    // Get overdue invoices
    const today = new Date().toISOString().split('T')[0];
    const { data: overdueInvoices } = await supabase
      .from('customer_invoices')
      .select('*')
      .eq('customer_id', customer.id)
      .eq('status', 'unpaid')
      .lt('due_date', today)
      .order('due_date', { ascending: true });
    
    // Get next billing date from active services
    const { data: nextBillingService } = await supabase
      .from('customer_services')
      .select('next_billing_date')
      .eq('customer_id', customer.id)
      .eq('status', 'active')
      .order('next_billing_date', { ascending: true })
      .limit(1)
      .single();
    
    // Compile billing summary
    const billingSummary = {
      account_balance: billing?.account_balance || 0,
      credit_limit: billing?.credit_limit || 0,
      next_billing_date: nextBillingService?.next_billing_date || null,
      primary_payment_method: primaryMethod || null,
      recent_transactions: recentTransactions || [],
      upcoming_invoices: upcomingInvoices || [],
      overdue_invoices: overdueInvoices || [],
      auto_pay_enabled: billing?.auto_pay_enabled || false,
      billing_preferences: {
        preferred_billing_date: billing?.preferred_billing_date || 1,
        paper_billing_enabled: billing?.paper_billing_enabled || false,
        email_invoices_enabled: billing?.email_invoices_enabled || true,
        sms_notifications_enabled: billing?.sms_notifications_enabled || true,
        billing_email: billing?.billing_email || null,
        billing_phone: billing?.billing_phone || null
      },
      stats: {
        total_invoiced: upcomingInvoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0,
        total_overdue: overdueInvoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0,
        overdue_count: overdueInvoices?.length || 0
      }
    };
    
    return NextResponse.json(billingSummary);
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
