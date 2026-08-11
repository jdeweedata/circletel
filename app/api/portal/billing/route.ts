import { NextResponse } from 'next/server';
import { requirePortalUser } from '@/lib/portal/require-portal-user';

export async function GET() {
  const auth = await requirePortalUser();
  if (!auth.ok) return auth.response;

  const { portalUser, adminDb } = auth;

  const { data: invoices, error } = await adminDb
    .from('customer_invoices')
    .select(`
      id,
      invoice_number,
      invoice_date,
      due_date,
      period_start,
      period_end,
      subtotal,
      vat_rate,
      tax_amount,
      total_amount,
      amount_paid,
      amount_due,
      line_items,
      invoice_type,
      status,
      paid_at
    `)
    .eq('corporate_account_id', portalUser.organisation_id)
    .order('invoice_date', { ascending: false });

  if (error) {
    console.error('[Portal /billing] Query error:', error.message);
    return NextResponse.json({ error: 'Failed to load invoices' }, { status: 500 });
  }

  // customer_invoices stores VAT in tax_amount; the portal reads vat_amount.
  const normalised = (invoices ?? []).map((inv) => ({
    ...inv,
    vat_amount: inv.tax_amount ?? 0,
  }));

  return NextResponse.json({ invoices: normalised });
}
