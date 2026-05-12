import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { apiLogger } from '@/lib/logging';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await authenticateAdmin(request);
  if (!authResult.success) {
    return authResult.response;
  }

  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const statusFilter = request.nextUrl.searchParams.get('status');

    const { data: invoices, error } = await supabase
      .from('customer_invoices')
      .select(`
        id,
        invoice_number,
        total_amount,
        amount_paid,
        status,
        due_date,
        invoice_date,
        transaction_ref,
        sms_reminder_count,
        corporate_site_id,
        customer_id,
        customer:customers(first_name, last_name, email, phone),
        site:corporate_sites(id, site_name, account_number)
      `)
      .eq('corporate_account_id', id)
      .order('due_date', { ascending: false });

    if (error) {
      apiLogger.error('Failed to fetch corporate billing', { error: error.message });
      return NextResponse.json({ error: 'Failed to fetch billing data' }, { status: 500 });
    }

    const filtered = statusFilter
      ? (invoices || []).filter((inv: any) => inv.status === statusFilter)
      : (invoices || []);

    let total_invoices = 0;
    let total_amount = 0;
    let total_collected = 0;
    let overdue_count = 0;
    let paid_count = 0;

    const siteMap = new Map<string, {
      site_id: string;
      site_name: string;
      account_number: string;
      nurse_name: string;
      nurse_email: string;
      nurse_phone: string | null;
      invoices: any[];
      total_outstanding: number;
      latest_status: string;
    }>();

    for (const inv of filtered) {
      const customer = Array.isArray(inv.customer) ? inv.customer[0] : inv.customer;
      const site = Array.isArray(inv.site) ? inv.site[0] : inv.site;
      const siteId = inv.corporate_site_id || 'unknown';
      const amountDue = inv.total_amount - (inv.amount_paid || 0);

      total_invoices++;
      total_amount += inv.total_amount;
      total_collected += inv.amount_paid || 0;
      if (inv.status === 'overdue') overdue_count++;
      if (inv.status === 'paid') paid_count++;

      if (!siteMap.has(siteId)) {
        siteMap.set(siteId, {
          site_id: siteId,
          site_name: site?.site_name || 'Unknown Site',
          account_number: site?.account_number || '',
          nurse_name: customer ? `${customer.first_name} ${customer.last_name}` : 'Unknown',
          nurse_email: customer?.email || '',
          nurse_phone: customer?.phone || null,
          invoices: [],
          total_outstanding: 0,
          latest_status: inv.status,
        });
      }

      const entry = siteMap.get(siteId)!;
      entry.invoices.push({
        id: inv.id,
        invoice_number: inv.invoice_number,
        total_amount: inv.total_amount,
        amount_paid: inv.amount_paid || 0,
        amount_due: amountDue,
        status: inv.status,
        due_date: inv.due_date,
        invoice_date: inv.invoice_date,
        transaction_ref: inv.transaction_ref,
        sms_reminder_count: inv.sms_reminder_count || 0,
      });
      entry.total_outstanding += amountDue;
    }

    const sites = [...siteMap.values()].sort((a, b) => a.site_name.localeCompare(b.site_name));

    return NextResponse.json({
      summary: {
        total_invoices,
        total_amount,
        total_collected,
        total_outstanding: total_amount - total_collected,
        overdue_count,
        paid_count,
      },
      sites,
    });
  } catch (error) {
    apiLogger.error('Corporate billing endpoint error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
