/**
 * Admin Customer Summary API
 * GET /api/admin/customers/[id]/summary
 *
 * Lightweight at-a-glance summary for the customer detail header strip:
 * outstanding balance, oldest unpaid invoice (for one-click Pay Now),
 * active service, and last completed payment.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await authenticateAdmin(request);
  if (!authResult.success) return authResult.response;

  try {
    const { id: customerId } = await context.params;
    const supabase = await createClient();

    const [invoicesResult, servicesResult, paymentResult] = await Promise.all([
      supabase
        .from('customer_invoices')
        .select('id, invoice_number, total_amount, amount_paid, status, due_date')
        .eq('customer_id', customerId)
        .neq('status', 'paid')
        .order('due_date', { ascending: true }),
      supabase
        .from('customer_services')
        .select('id, status, monthly_price, service_packages (name, price)')
        .eq('customer_id', customerId)
        .eq('status', 'active')
        .order('created_at', { ascending: false }),
      supabase
        .from('payment_transactions')
        .select('amount, transaction_date, payment_type')
        .eq('customer_id', customerId)
        .eq('status', 'completed')
        .order('transaction_date', { ascending: false })
        .limit(1),
    ]);

    if (invoicesResult.error) {
      console.error('[Customer Summary] Invoice query failed:', invoicesResult.error);
      return NextResponse.json(
        { success: false, error: 'Failed to load balance' },
        { status: 500 }
      );
    }

    const unpaidInvoices = invoicesResult.data || [];
    const now = new Date();

    const totalOutstanding = unpaidInvoices.reduce(
      (sum, inv) => sum + ((inv.total_amount || 0) - (inv.amount_paid || 0)),
      0
    );
    const overdueInvoices = unpaidInvoices.filter(
      (inv) => inv.due_date && new Date(inv.due_date) < now
    );
    const totalOverdue = overdueInvoices.reduce(
      (sum, inv) => sum + ((inv.total_amount || 0) - (inv.amount_paid || 0)),
      0
    );

    const oldestUnpaid = unpaidInvoices[0] || null;

    const services = servicesResult.data || [];
    const firstService = services[0] as unknown as
      | {
          id: string;
          status: string;
          monthly_price: number | null;
          service_packages: { name: string; price: number } | null;
        }
      | undefined;

    const lastPayment = paymentResult.data?.[0] || null;

    return NextResponse.json({
      success: true,
      summary: {
        total_outstanding: totalOutstanding,
        total_overdue: totalOverdue,
        overdue_count: overdueInvoices.length,
        oldest_unpaid_invoice: oldestUnpaid
          ? {
              id: oldestUnpaid.id,
              invoice_number: oldestUnpaid.invoice_number,
              amount_due: (oldestUnpaid.total_amount || 0) - (oldestUnpaid.amount_paid || 0),
              due_date: oldestUnpaid.due_date,
            }
          : null,
        active_service: firstService
          ? {
              id: firstService.id,
              package_name: firstService.service_packages?.name || 'Unknown Package',
              monthly_price:
                firstService.monthly_price ?? firstService.service_packages?.price ?? 0,
              status: firstService.status,
            }
          : null,
        active_services_count: services.length,
        last_payment: lastPayment
          ? {
              amount: lastPayment.amount,
              date: lastPayment.transaction_date,
              payment_type: lastPayment.payment_type,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('[Customer Summary] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
