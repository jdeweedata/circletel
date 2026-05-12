/**
 * Daily Customer Stats Snapshot Cron Job
 * GET/POST /api/cron/stats-snapshot
 *
 * Creates daily snapshots of customer statistics for dashboard trend tracking.
 * Runs at 01:00 UTC daily.
 *
 * Vercel Cron: 0 1 * * *
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withCronLogging, verifyCronSecret } from '@/lib/logging';

export const runtime = 'nodejs';
export const maxDuration = 120; // 2 minutes for processing all customers

interface CustomerStats {
  customer_id: string;
  active_services: number;
  total_orders: number;
  pending_orders: number;
  overdue_invoices: number;
  account_balance: number;
  total_invoiced_mtd: number;
  total_paid_mtd: number;
}

async function calculateCustomerStats(
  supabase: Awaited<ReturnType<typeof createClient>>,
  customerId: string
): Promise<CustomerStats> {
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  // Get active services count
  const { count: activeServices } = await supabase
    .from('customer_services')
    .select('*', { count: 'exact', head: true })
    .eq('customer_id', customerId)
    .eq('status', 'active');

  // Get total orders count
  const { count: totalOrders } = await supabase
    .from('consumer_orders')
    .select('*', { count: 'exact', head: true })
    .eq('customer_id', customerId);

  // Get pending orders count
  const { count: pendingOrders } = await supabase
    .from('consumer_orders')
    .select('*', { count: 'exact', head: true })
    .eq('customer_id', customerId)
    .in('status', ['pending', 'awaiting_payment', 'payment_pending']);

  // Get overdue invoices count
  const { count: overdueInvoices } = await supabase
    .from('customer_invoices')
    .select('*', { count: 'exact', head: true })
    .eq('customer_id', customerId)
    .in('status', ['sent', 'partial', 'overdue'])
    .lt('due_date', today.toISOString().split('T')[0]);

  // Get account balance from customer_billing
  const { data: billing } = await supabase
    .from('customer_billing')
    .select('account_balance')
    .eq('customer_id', customerId)
    .single();

  // Get total invoiced MTD
  const { data: invoicesMtd } = await supabase
    .from('customer_invoices')
    .select('total_amount')
    .eq('customer_id', customerId)
    .gte('invoice_date', monthStart.toISOString().split('T')[0]);

  const totalInvoicedMtd = invoicesMtd?.reduce(
    (sum, inv) => sum + (parseFloat(inv.total_amount) || 0),
    0
  ) || 0;

  // Get total paid MTD
  const { data: paymentsMtd } = await supabase
    .from('payment_transactions')
    .select('amount')
    .eq('customer_id', customerId)
    .eq('status', 'completed')
    .gte('transaction_date', monthStart.toISOString().split('T')[0]);

  const totalPaidMtd = paymentsMtd?.reduce(
    (sum, pay) => sum + (parseFloat(pay.amount) || 0),
    0
  ) || 0;

  return {
    customer_id: customerId,
    active_services: activeServices || 0,
    total_orders: totalOrders || 0,
    pending_orders: pendingOrders || 0,
    overdue_invoices: overdueInvoices || 0,
    account_balance: billing?.account_balance || 0,
    total_invoiced_mtd: totalInvoicedMtd,
    total_paid_mtd: totalPaidMtd,
  };
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await withCronLogging('stats-snapshot', 'vercel_cron', async () => {
      const snapshotDate = new Date().toISOString().split('T')[0];
      const supabase = await createClient();

      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('id')
        .not('auth_user_id', 'is', null)
        .in('account_status', ['active', 'pending']);

      if (customersError) {
        throw new Error(`Failed to fetch customers: ${customersError.message}`);
      }

      if (!customers || customers.length === 0) {
        return { records_processed: 0, records_failed: 0, records_skipped: 0, execution_details: { snapshot_date: snapshotDate, total_customers: 0 } };
      }

      let processed = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const customer of customers) {
        try {
          const stats = await calculateCustomerStats(supabase, customer.id);

          const { error: upsertError } = await supabase
            .from('customer_stats_snapshots')
            .upsert(
              {
                customer_id: stats.customer_id,
                snapshot_date: snapshotDate,
                active_services: stats.active_services,
                total_orders: stats.total_orders,
                pending_orders: stats.pending_orders,
                overdue_invoices: stats.overdue_invoices,
                account_balance: stats.account_balance,
                total_invoiced_mtd: stats.total_invoiced_mtd,
                total_paid_mtd: stats.total_paid_mtd,
              },
              { onConflict: 'customer_id,snapshot_date' }
            );

          if (upsertError) {
            failed++;
            errors.push(`Customer ${customer.id}: ${upsertError.message}`);
          } else {
            processed++;
          }
        } catch (err) {
          failed++;
          errors.push(`Customer ${customer.id}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }

      return {
        records_processed: processed,
        records_failed: failed,
        records_skipped: 0,
        execution_details: { snapshot_date: snapshotDate, total_customers: customers.length, errors: errors.slice(0, 5) },
      };
    });

    return NextResponse.json({
      success: result.records_failed === 0,
      message: `Daily stats snapshot ${result.records_failed > 0 ? 'partially ' : ''}completed`,
      processed: result.records_processed,
      failed: result.records_failed,
      duration_ms: result.durationMs,
      logId: result.logId,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}
