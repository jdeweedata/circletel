/**
 * Notify the 4 July 2026 soft catch-up clinics via email + WhatsApp.
 *
 * Policy:
 * - Soft tone: July not billed on usual cycle, no late fees
 * - Sweetwaters: PayNow CTA
 * - Nokaneng / Cosmo / Bhekilanga: debit_order notice + optional Pay Now
 * - Generate paynow_transaction_ref for WhatsApp button + Sweetwaters email
 * - Do NOT flip debit_order invoices to paynow collection method
 *
 * Usage:
 *   set -a && source .env.local && set +a
 *   npx tsx scripts/billing/notify-july-2026-gap-catchup.ts           # dry-run
 *   npx tsx scripts/billing/notify-july-2026-gap-catchup.ts --execute
 */

import { createClient } from '@supabase/supabase-js';
import { whatsAppService } from '../../lib/integrations/whatsapp/whatsapp-service';

const INVOICE_NUMBERS = [
  'INV-2026-00041',
  'INV-2026-00042',
  'INV-2026-00043',
  'INV-2026-00044',
] as const;

const NETCASH = {
  serviceKey:
    process.env.NEXT_PUBLIC_NETCASH_SERVICE_KEY ||
    '65251ca3-95d8-47da-bbeb-d7fad8cd9ef1',
  pciVaultKey:
    process.env.NEXT_PUBLIC_NETCASH_PCI_VAULT_KEY ||
    '6940844b-ea39-44a5-b929-427b205e457e',
};

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || 'billing@notify.circletel.co.za';
const REPLY_TO = process.env.RESEND_REPLY_TO_EMAIL || 'contactus@circletel.co.za';

function generateTransactionRef(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 10);
  return `CT-${dateStr}-${rand}`;
}

function buildPayNowUrl(params: {
  transactionRef: string;
  invoiceNumber: string;
  amount: number;
  email: string;
}): string {
  const qs = new URLSearchParams({
    m1: NETCASH.serviceKey,
    m2: NETCASH.pciVaultKey,
    p2: params.transactionRef,
    p3: `CircleTel - ${params.invoiceNumber}`,
    p4: params.amount.toFixed(2),
    Budget: 'N',
    CustomerEmailAddress: params.email,
    m9: 'https://www.circletel.co.za/api/payments/netcash/redirect',
    m10: 'https://www.circletel.co.za/payment/cancelled',
    m4: params.transactionRef,
  });
  return `https://paynow.netcash.co.za/site/paynow.aspx?${qs.toString()}`;
}

function formatDueDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function displayName(c: {
  first_name: string | null;
  business_name: string | null;
}): string {
  return (c.first_name || c.business_name || 'there').trim();
}

function buildEmailHtml(params: {
  firstName: string;
  clinicName: string;
  invoiceNumber: string;
  amount: number;
  dueDateLabel: string;
  isDebitOrder: boolean;
  paynowUrl: string;
}): string {
  const debitNote = params.isDebitOrder
    ? `<p style="color:#4B5563;line-height:1.6;">Where you have an active debit order mandate, we will collect this amount on or after the due date. You may also pay earlier using the button below if you prefer.</p>`
    : `<p style="color:#4B5563;line-height:1.6;">Please pay by the due date using the secure Pay Now link below (card, EFT, or instant EFT).</p>`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>CircleTel Invoice ${params.invoiceNumber}</title></head>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f9fafb;">
  <div style="background:linear-gradient(135deg,#F5841E 0%,#FF9F45 100%);padding:28px;border-radius:8px 8px 0 0;">
    <h1 style="color:white;margin:0;font-size:24px;">CircleTel</h1>
    <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;">July 2026 clinic connectivity invoice</p>
  </div>
  <div style="background:#fff;padding:28px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
    <h2 style="color:#1F2937;margin-top:0;">Hi ${params.firstName},</h2>
    <p style="color:#4B5563;line-height:1.6;">
      Your <strong>July 2026</strong> clinic connectivity for <strong>${params.clinicName}</strong>
      was not invoiced on the usual date. We have issued invoice
      <strong>${params.invoiceNumber}</strong> for <strong>R${params.amount.toFixed(2)}</strong>
      (incl. VAT) for July only — <strong>no late fees or penalties</strong>.
    </p>
    <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;padding:20px;margin:20px 0;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="color:#6B7280;padding:8px 0;">Invoice</td>
          <td style="color:#1F2937;font-weight:bold;text-align:right;">${params.invoiceNumber}</td>
        </tr>
        <tr>
          <td style="color:#6B7280;padding:8px 0;">Amount due</td>
          <td style="color:#1F2937;font-weight:bold;text-align:right;">R${params.amount.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="color:#6B7280;padding:8px 0;">Due date</td>
          <td style="color:#1F2937;font-weight:bold;text-align:right;">${params.dueDateLabel}</td>
        </tr>
        <tr>
          <td style="color:#6B7280;padding:8px 0;">Period</td>
          <td style="color:#1F2937;font-weight:bold;text-align:right;">1–31 July 2026</td>
        </tr>
      </table>
    </div>
    ${debitNote}
    <div style="text-align:center;margin:28px 0;">
      <a href="${params.paynowUrl}"
         style="display:inline-block;background:#F5841E;color:white;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;">
        Pay Now — R${params.amount.toFixed(2)}
      </a>
    </div>
    <p style="color:#6B7280;font-size:13px;line-height:1.6;">
      If anything looks wrong, please contact us before the due date on WhatsApp
      <strong>082 487 3900</strong> or email <strong>contactus@circletel.co.za</strong>.
    </p>
    <hr style="border:none;border-top:1px solid #E5E7EB;margin:24px 0;">
    <p style="color:#9CA3AF;font-size:12px;text-align:center;margin:0;">
      CircleTel SA (Pty) Ltd · Mon–Fri 8am–5pm
    </p>
  </div>
</body>
</html>`;
}

function buildEmailText(params: {
  firstName: string;
  clinicName: string;
  invoiceNumber: string;
  amount: number;
  dueDateLabel: string;
  isDebitOrder: boolean;
  paynowUrl: string;
}): string {
  const debit = params.isDebitOrder
    ? 'Where you have an active debit order, we will collect on or after the due date. You may also pay earlier via the link below.'
    : 'Please pay by the due date using the secure Pay Now link below.';
  return `Hi ${params.firstName},

Your July 2026 clinic connectivity for ${params.clinicName} was not invoiced on the usual date. We have issued invoice ${params.invoiceNumber} for R${params.amount.toFixed(2)} (incl. VAT) for July only — no late fees or penalties.

Invoice: ${params.invoiceNumber}
Amount: R${params.amount.toFixed(2)}
Due: ${params.dueDateLabel}
Period: 1–31 July 2026

${debit}

Pay Now: ${params.paynowUrl}

Questions? WhatsApp 082 487 3900 or contactus@circletel.co.za
CircleTel SA (Pty) Ltd`;
}

async function main() {
  const execute = process.argv.includes('--execute');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendKey = process.env.RESEND_API_KEY;

  if (!url || !key) {
    console.error('Missing Supabase env — source .env.local');
    process.exit(1);
  }
  if (execute && !resendKey) {
    console.error('Missing RESEND_API_KEY');
    process.exit(1);
  }
  if (execute && !whatsAppService.isConfigured()) {
    console.error('WhatsApp not configured (WHATSAPP_PHONE_NUMBER_ID / WHATSAPP_ACCESS_TOKEN)');
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log(execute ? 'EXECUTE mode' : 'DRY-RUN mode (pass --execute to send)');
  console.log('');

  const { data: invoices, error: invErr } = await supabase
    .from('customer_invoices')
    .select(
      'id, invoice_number, total_amount, due_date, status, payment_collection_method, paynow_url, paynow_transaction_ref, emailed_at, whatsapp_sent_at, customer_id, line_items'
    )
    .in('invoice_number', [...INVOICE_NUMBERS])
    .order('invoice_number');

  if (invErr || !invoices?.length) {
    console.error('Failed to load invoices', invErr?.message);
    process.exit(1);
  }

  const results: Array<Record<string, unknown>> = [];

  for (const inv of invoices) {
    const { data: customer, error: cErr } = await supabase
      .from('customers')
      .select(
        'id, business_name, first_name, last_name, email, phone, account_number, whatsapp_consent'
      )
      .eq('id', inv.customer_id)
      .single();

    if (cErr || !customer) {
      console.error(`SKIP ${inv.invoice_number}: customer not found`);
      results.push({ invoice: inv.invoice_number, action: 'skip_no_customer' });
      continue;
    }

    const isDebitOrder = inv.payment_collection_method === 'debit_order';
    const firstName = displayName(customer);
    const clinicName = customer.business_name || firstName;
    const dueDateLabel = formatDueDate(inv.due_date);
    const amount = Number(inv.total_amount);

    // Ensure PayNow ref exists (for WhatsApp button + optional email CTA)
    let transactionRef = inv.paynow_transaction_ref as string | null;
    let paynowUrl = inv.paynow_url as string | null;

    if (!transactionRef || !paynowUrl) {
      transactionRef = generateTransactionRef();
      paynowUrl = buildPayNowUrl({
        transactionRef,
        invoiceNumber: inv.invoice_number,
        amount,
        email: customer.email || 'billing@circletel.co.za',
      });

      if (execute) {
        const { error: upErr } = await supabase
          .from('customer_invoices')
          .update({
            paynow_url: paynowUrl,
            paynow_transaction_ref: transactionRef,
            // Keep debit_order collection method unchanged
          })
          .eq('id', inv.id);
        if (upErr) {
          console.error(`FAIL paynow store ${inv.invoice_number}: ${upErr.message}`);
          results.push({
            invoice: inv.invoice_number,
            action: 'error_paynow',
            error: upErr.message,
          });
          continue;
        }
      }
    }

    console.log(
      `--- ${inv.invoice_number} | ${clinicName} | ${isDebitOrder ? 'debit_order' : 'paynow'} | R${amount.toFixed(2)} due ${dueDateLabel}`
    );
    console.log(`  email=${customer.email} phone=${customer.phone} consent=${customer.whatsapp_consent}`);
    console.log(`  paynow_ref=${transactionRef}`);

    let emailOk = false;
    let emailId: string | undefined;
    let waOk = false;
    let waId: string | undefined;
    const errors: string[] = [];

    // ---- EMAIL ----
    if (!customer.email) {
      errors.push('no_email');
      console.log('  EMAIL skip: no email');
    } else if (!execute) {
      console.log(`  WOULD email → ${customer.email}`);
      emailOk = true;
    } else {
      const html = buildEmailHtml({
        firstName,
        clinicName,
        invoiceNumber: inv.invoice_number,
        amount,
        dueDateLabel,
        isDebitOrder,
        paynowUrl: paynowUrl!,
      });
      const text = buildEmailText({
        firstName,
        clinicName,
        invoiceNumber: inv.invoice_number,
        amount,
        dueDateLabel,
        isDebitOrder,
        paynowUrl: paynowUrl!,
      });

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `CircleTel Billing <${FROM_EMAIL}>`,
          to: [customer.email],
          reply_to: REPLY_TO,
          subject: `CircleTel ${inv.invoice_number} — July 2026 R${amount.toFixed(2)} (no late fees)`,
          html,
          text,
          tags: [
            { name: 'campaign', value: 'july-2026-gap-catchup' },
            { name: 'invoice', value: inv.invoice_number },
          ],
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        errors.push(`email: ${body?.message || res.statusText}`);
        console.error(`  EMAIL fail:`, body);
      } else {
        emailOk = true;
        emailId = body.id;
        console.log(`  EMAIL ok id=${emailId}`);
        await supabase
          .from('customer_invoices')
          .update({
            emailed_at: new Date().toISOString(),
            email_attempts: 1,
          })
          .eq('id', inv.id);
      }
    }

    // ---- WHATSAPP ----
    if (!customer.phone) {
      errors.push('no_phone');
      console.log('  WA skip: no phone');
    } else if (!customer.whatsapp_consent) {
      errors.push('no_whatsapp_consent');
      console.log('  WA skip: no consent');
    } else if (!execute) {
      console.log(`  WOULD whatsapp → ${customer.phone} template circletel_invoice_payment`);
      waOk = true;
    } else {
      const waResult = await whatsAppService.sendInvoicePayment(
        customer.phone,
        {
          customerName: firstName,
          invoiceNumber: inv.invoice_number,
          amount: amount.toFixed(2),
          dueDate: dueDateLabel,
          // Meta dynamic button: base URL + bare transaction ref
          paymentUrl: transactionRef!,
        },
        {
          customerId: customer.id,
          invoiceId: inv.id,
          createdBy: 'july-2026-gap-catchup',
        }
      );
      if (!waResult.success) {
        errors.push(`whatsapp: ${waResult.error || 'unknown'}`);
        console.error(`  WA fail:`, waResult.error);
      } else {
        waOk = true;
        waId = waResult.messageId;
        console.log(`  WA ok id=${waId}`);
        await supabase
          .from('customer_invoices')
          .update({
            whatsapp_sent_at: new Date().toISOString(),
            whatsapp_message_id: waId,
            paynow_sent_at: new Date().toISOString(),
            paynow_sent_via: ['email', 'whatsapp'],
          })
          .eq('id', inv.id);
      }
    }

    // small pause between Meta/Resend calls
    if (execute) await new Promise((r) => setTimeout(r, 400));

    results.push({
      invoice: inv.invoice_number,
      clinic: clinicName,
      email: customer.email,
      phone: customer.phone,
      collection: inv.payment_collection_method,
      emailOk,
      emailId,
      waOk,
      waId,
      errors,
    });
  }

  console.log('\n--- Summary ---');
  console.log(JSON.stringify(results, null, 2));

  const failed = results.filter(
    (r) => r.errors && (r.errors as string[]).length > 0
  );
  if (!execute) {
    console.log('\nDry-run only. Re-run with --execute to send.');
  } else if (failed.length) {
    console.error(`\nCompleted with ${failed.length} partial failure(s).`);
    process.exit(1);
  } else {
    console.log('\nAll four clinics notified via email + WhatsApp.');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
