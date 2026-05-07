import { NextResponse } from 'next/server';
import { createClientWithSession } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClientWithSession();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: invoices, error } = await supabase
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
      vat_amount,
      total_amount,
      amount_paid,
      amount_due,
      line_items,
      invoice_type,
      status,
      paid_at,
      payment_method,
      pdf_url,
      pdf_generated_at
    `)
    .order('invoice_date', { ascending: false });

  if (error) {
    console.error('[Portal /billing] Query error:', error.message);
    return NextResponse.json({ error: 'Failed to load invoices' }, { status: 500 });
  }

  return NextResponse.json({ invoices: invoices ?? [] });
}
