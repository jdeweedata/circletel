import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get billing stats
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Fetch all stats in parallel
    const [
      pendingInvoicesResult,
      overdueInvoicesResult,
      paidInvoicesResult,
      activeServicesResult,
      activeCustomersResult,
      recentInvoicesResult,
      recentPaymentsResult,
    ] = await Promise.all([
      // Pending invoices (sent status)
      supabase
        .from('customer_invoices')
        .select('amount_due')
        .eq('status', 'sent'),

      // Overdue invoices
      supabase
        .from('customer_invoices')
        .select('amount_due')
        .eq('status', 'overdue'),

      // Paid invoices in last 30 days
      supabase
        .from('customer_invoices')
        .select('amount_paid, paid_at')
        .eq('status', 'paid')
        .gte('paid_at', thirtyDaysAgo.toISOString()),

      // Active services count
      supabase
        .from('customer_services')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active'),

      // Active customers count
      supabase
        .from('customers')
        .select('id', { count: 'exact', head: true }),

      // Recent invoices
      supabase
        .from('customer_invoices')
        .select(`
          id,
          invoice_number,
          total_amount,
          amount_due,
          status,
          due_date,
          customers (
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5),

      // Recent payments
      supabase
        .from('customer_invoices')
        .select(`
          id,
          invoice_number,
          amount_paid,
          paid_at,
          customers (
            first_name,
            last_name
          )
        `)
        .eq('status', 'paid')
        .not('paid_at', 'is', null)
        .order('paid_at', { ascending: false })
        .limit(5),
    ]);

    // Calculate totals
    const pendingInvoices = pendingInvoicesResult.data || [];
    const overdueInvoices = overdueInvoicesResult.data || [];
    const paidInvoices = paidInvoicesResult.data || [];

    const totalOutstanding =
      pendingInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount_due || '0'), 0) +
      overdueInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount_due || '0'), 0);

    const collectedLast30Days = paidInvoices.reduce(
      (sum, inv) => sum + parseFloat(inv.amount_paid || '0'),
      0
    );

    // Format recent invoices
    const recentInvoices = (recentInvoicesResult.data || []).map((inv: any) => ({
      id: inv.id,
      invoice_number: inv.invoice_number,
      customer_name: inv.customers
        ? `${inv.customers.first_name} ${inv.customers.last_name}`
        : 'Unknown',
      total_amount: parseFloat(inv.total_amount),
      amount_due: parseFloat(inv.amount_due),
      status: inv.status,
      due_date: inv.due_date,
    }));

    // Format recent payments
    const recentPayments = (recentPaymentsResult.data || []).map((inv: any) => ({
      id: inv.id,
      invoice_number: inv.invoice_number,
      customer_name: inv.customers
        ? `${inv.customers.first_name} ${inv.customers.last_name}`
        : 'Unknown',
      amount: parseFloat(inv.amount_paid),
      paid_at: inv.paid_at,
      method: 'Debit Order', // Default, could be enhanced later
    }));

    return NextResponse.json({
      stats: {
        totalOutstanding,
        pendingInvoices: pendingInvoices.length,
        overdueInvoices: overdueInvoices.length,
        paidLast30Days: paidInvoices.length,
        collectedLast30Days,
        activeServices: activeServicesResult.count || 0,
        activeCustomers: activeCustomersResult.count || 0,
      },
      recentInvoices,
      recentPayments,
    });
  } catch (error) {
    console.error('Error fetching billing stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch billing stats' },
      { status: 500 }
    );
  }
}
