/**
 * Send the invoice notifications DIRECTLY (bypass Inngest, which doesn't deliver
 * script-fired events). Mirrors lib/inngest/functions/invoice-notification.ts exactly:
 * debit-order email variant + "will be collected by debit order" SMS, then sets emailed_at.
 *
 * Run: set -a && source .env.local && set +a && npx tsx scripts/netcash/notify-pilot-direct.ts
 */
import { createClient } from '@/lib/supabase/server';
import { sendInvoiceGenerated } from '@/lib/emails/enhanced-notification-service';
import { ClickatellService } from '@/lib/integrations/clickatell/sms-service';

const INVOICE_NUMBERS = ['INV-2026-00014', 'INV-2026-00015'];

function buildSms(p: { first_name: string; invoice_number: string; total_amount: number; due_date: string }) {
  const dueDate = new Date(p.due_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
  return `Hi ${p.first_name}, your CircleTel invoice ${p.invoice_number} for R${p.total_amount.toFixed(2)} will be collected by debit order on ${dueDate}. No action needed.`;
}

async function main() {
  const sb = await createClient();
  for (const num of INVOICE_NUMBERS) {
    const { data: inv } = await sb.from('customer_invoices')
      .select('id, invoice_number, total_amount, subtotal, tax_amount, due_date, emailed_at, payment_collection_method, line_items, customer:customers(id, first_name, last_name, email, phone, account_number)')
      .eq('invoice_number', num).single();
    if (!inv) { console.log(`${num}: not found`); continue; }
    if (inv.emailed_at) { console.log(`${num}: already notified at ${inv.emailed_at} — skip`); continue; }
    const cust: any = Array.isArray(inv.customer) ? inv.customer[0] : inv.customer;
    const isDebitOrder = inv.payment_collection_method === 'debit_order';

    // Email
    let emailOk = false;
    try {
      const r = await sendInvoiceGenerated({
        invoice_id: inv.id, customer_id: cust.id, email: cust.email,
        customer_name: `${cust.first_name} ${cust.last_name}`, invoice_number: inv.invoice_number,
        total_amount: inv.total_amount, subtotal: inv.subtotal, vat_amount: inv.tax_amount,
        due_date: inv.due_date, account_number: cust.account_number ?? undefined,
        line_items: Array.isArray(inv.line_items) ? inv.line_items : [],
        mode: isDebitOrder ? 'debit_order' : 'paynow',
      } as any);
      emailOk = !!r.success;
      console.log(`${num}: email ${emailOk ? 'sent' : 'FAILED — ' + r.error} → ${cust.email}`);
    } catch (e) { console.log(`${num}: email EXCEPTION — ${e instanceof Error ? e.message : e}`); }

    // SMS (best-effort)
    if (cust.phone) {
      try {
        const sms = await new ClickatellService().sendSMS({ to: cust.phone, text: buildSms({ first_name: cust.first_name, invoice_number: inv.invoice_number, total_amount: inv.total_amount, due_date: inv.due_date }) });
        console.log(`${num}: sms ${sms.success ? 'sent' : 'FAILED — ' + sms.error} → ${cust.phone}`);
      } catch (e) { console.log(`${num}: sms EXCEPTION — ${e instanceof Error ? e.message : e}`); }
    } else { console.log(`${num}: no phone — SMS skipped`); }

    if (emailOk) {
      await sb.from('customer_invoices').update({ emailed_at: new Date().toISOString(), sms_reminder_count: 0 }).eq('id', inv.id);
      console.log(`${num}: emailed_at set ✓`);
    } else {
      console.log(`${num}: emailed_at NOT set (email failed) — will not mark notified`);
    }
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
