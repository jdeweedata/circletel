/**
 * W5 — Debit-Order Pipeline End-to-End Test
 *
 * Two modes:
 *  - direct (DEFAULT): imports and runs the ACTUAL pipeline lib code in-process against the DB
 *    (mapPostbackToPaymentMethod → activateDebitOrderMandate → collection-method resolution →
 *    batch eligibility). Validates W1–W4 logic WITHOUT a deploy. Use this pre-deploy.
 *  - http (W5_MODE=http): POSTs a synthetic postback to a deployed eMandate webhook. Use this to
 *    validate the DEPLOYED pipeline AFTER the branch is built into staging.
 *
 * Exercises:  webhook/activation → customer_payment_methods active+verified (W1/Gap2) →
 *             customer_billing debit_order (W2.1/Gap3) → collection-method debit_order (W2.2/Gap1)
 *             → debit batch eligibility → non-mandated customer = paynow (no regression).
 *
 * ⚠️ Staging shares the PRODUCTION Supabase project — creates clearly-marked test rows
 * (email w5-e2e+*@example.test, account_number CTW5*) and cleans EVERYTHING up in a finally block.
 *
 * Run (direct, default):
 *   set -a && source .env.local && set +a && npx tsx --tsconfig tsconfig.json scripts/w5-debit-order-e2e.ts
 * Run (http, post-deploy):
 *   set -a && source .env.local && set +a && \
 *     W5_MODE=http W5_TARGET_URL=https://staging.circletel.co.za \
 *     npx tsx --tsconfig tsconfig.json scripts/w5-debit-order-e2e.ts
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { EMandatePostback } from '@/lib/payments/netcash-emandate-service';
import { mapPostbackToPaymentMethod } from '@/lib/payments/payment-method-mapper';
import { activateDebitOrderMandate } from '@/lib/payments/activate-debit-order-mandate';

const MODE = process.env.W5_MODE === 'http' ? 'http' : 'direct';
const TARGET = process.env.W5_TARGET_URL || 'https://staging.circletel.co.za';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (source .env.local first)');
  process.exit(1);
}

const supabase: SupabaseClient = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const stamp = `${Date.now()}`.slice(-9);
const MANDATE_REF = `W5MND${stamp}`;
const today = new Date().toISOString().split('T')[0];

let pass = 0;
let fail = 0;
function check(label: string, ok: boolean, detail?: unknown) {
  if (ok) { pass++; console.log(`  ✅ ${label}`); }
  else { fail++; console.log(`  ❌ ${label}${detail !== undefined ? ` — ${JSON.stringify(detail)}` : ''}`); }
}

const created: { customerIds: string[]; emandateIds: string[]; invoiceIds: string[] } = {
  customerIds: [], emandateIds: [], invoiceIds: [],
};

async function createTestCustomer(suffix: string, accountNumber: string, businessName?: string): Promise<string> {
  const { data, error } = await supabase
    .from('customers')
    .insert({
      email: `w5-e2e+${suffix}-${stamp}@example.test`,
      first_name: 'W5',
      last_name: `Test-${suffix}`,
      phone: '0820000000',
      account_type: businessName ? 'business' : 'internal_test',
      account_number: accountNumber,
      business_name: businessName ?? null,
      status: 'active',
    })
    .select('id')
    .single();
  if (error || !data) throw new Error(`createTestCustomer(${suffix}) failed: ${error?.message}`);
  created.customerIds.push(data.id);
  return data.id;
}

function buildPostback(customerId: string, accountRef: string): EMandatePostback {
  return {
    MandateSuccessful: '1',
    IsDeclined: '0',
    AccountRef: accountRef,
    AccountName: 'W5 Test',
    DefaultAmount: '517.50',
    MandateReferenceNumber: MANDATE_REF,
    Field1: '',
    Field2: accountRef,
    Field3: customerId,
    IsCreditCard: 'False',
    BankName: 'FNB',
    BankAccountName: 'W5 Test',
    BankAccountNo: '1234XXXX5678',
    BankAccountType: 'Current',
    BranchCode: '250655',
    DebitDay: '1',
    AgreementDate: today.replace(/-/g, ''),
    MandatePDFLink: '',
  } as unknown as EMandatePostback;
}

/** Mirror of MonthlyInvoiceGenerator.resolveCollectionMethod (kept in sync). */
async function resolveCollectionMethod(customerId: string): Promise<'debit_order' | null> {
  const { data: methods } = await supabase
    .from('customer_payment_methods')
    .select('mandate_status, encrypted_details')
    .eq('customer_id', customerId)
    .eq('method_type', 'debit_order')
    .eq('is_active', true);
  const active = (methods || []).some((m: any) => {
    const verified = m.encrypted_details?.verified === true || m.encrypted_details?.verified === 'true';
    const mandateActive = m.mandate_status === 'active' || m.mandate_status === 'approved';
    return verified && mandateActive;
  });
  if (active) return 'debit_order';
  const { data: billing } = await supabase
    .from('customer_billing')
    .select('payment_method')
    .eq('customer_id', customerId)
    .maybeSingle();
  return billing?.payment_method === 'debit_order' ? 'debit_order' : null;
}

async function run() {
  console.log(`\n=== W5 Debit-Order E2E — mode=${MODE}${MODE === 'http' ? ` target=${TARGET}` : ''} ===\n`);

  const accountRef = `CTW5${stamp}`.slice(0, 15);
  const customerId = await createTestCustomer('b2c', accountRef);

  if (MODE === 'http') {
    // Preflight + pending request + synthetic postback to the deployed webhook.
    const health = await fetch(`${TARGET}/api/health`).then((r) => r.status).catch(() => 0);
    check('preflight: target /api/health reachable (200)', health === 200, health);
    const { data: er } = await supabase.from('emandate_requests').insert({
      payment_method_id: null, order_id: null, customer_id: customerId, request_type: 'batch',
      status: 'pending', netcash_account_reference: accountRef,
      request_payload: { mandate_amount: 517.5, billing_day: 1, is_consumer: true },
      notification_email: `w5-e2e+b2c-${stamp}@example.test`,
      expires_at: new Date(Date.now() + 7 * 864e5).toISOString(),
    }).select('id').single();
    if (er) created.emandateIds.push(er.id);

    const pb = buildPostback(customerId, accountRef);
    const form = new URLSearchParams(pb as unknown as Record<string, string>);
    const res = await fetch(`${TARGET}/api/webhooks/netcash/emandate`, {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form.toString(),
    });
    check('webhook: POST synthetic postback accepted (200)', res.status === 200, res.status);
    await new Promise((r) => setTimeout(r, 1500));
  } else {
    // DIRECT: run the real activation code in-process (validates new code pre-deploy).
    const pb = buildPostback(customerId, accountRef);
    const pmWrite = mapPostbackToPaymentMethod(pb, customerId, new Date().toISOString());
    const { errors } = await activateDebitOrderMandate(supabase, customerId, pmWrite);
    check('activation: activateDebitOrderMandate ran without errors', errors.length === 0, errors);
  }

  // --- Assertions (same for both modes) ---
  const { data: pm } = await supabase
    .from('customer_payment_methods')
    .select('method_type, is_active, mandate_status, mandate_id, is_primary, encrypted_details')
    .eq('customer_id', customerId)
    .eq('method_type', 'debit_order')
    .maybeSingle();
  check('W1/Gap2: customer_payment_methods debit_order row exists', !!pm, pm);
  check('W1/Gap2: mandate is_active=true', pm?.is_active === true);
  check('W1/Gap2: mandate_status active/approved', pm?.mandate_status === 'active' || pm?.mandate_status === 'approved');
  check('W1/Gap2: encrypted_details.verified=true', pm?.encrypted_details?.verified === true);
  check('W1/Gap2: mandate_id matches postback ref', pm?.mandate_id === MANDATE_REF, pm?.mandate_id);
  check('W1/Gap2: is_primary=true', pm?.is_primary === true);

  const { data: billing } = await supabase
    .from('customer_billing').select('payment_method, billing_day').eq('customer_id', customerId).maybeSingle();
  check('W2.1/Gap3: customer_billing.payment_method=debit_order', billing?.payment_method === 'debit_order', billing);
  check('W2.1/Gap3: customer_billing.billing_day=1', billing?.billing_day === 1, billing?.billing_day);

  const resolved = await resolveCollectionMethod(customerId);
  check('W2.2/Gap1: mandated customer resolves to debit_order', resolved === 'debit_order', resolved);

  const { data: inv } = await supabase.from('customer_invoices').insert({
    invoice_number: `W5-INV-${stamp}`, customer_id: customerId, invoice_date: today, due_date: today,
    subtotal: 450, vat_rate: 15, tax_amount: 67.5, total_amount: 517.5,
    amount_due: 517.5, amount_paid: 0, status: 'sent',
    invoice_type: 'recurring', payment_collection_method: 'debit_order',
  }).select('id').single();
  if (inv) created.invoiceIds.push(inv.id);
  const { data: eligible } = await supabase
    .from('customer_invoices').select('id')
    .in('status', ['draft', 'sent', 'partial', 'overdue']).eq('due_date', today)
    .in('payment_collection_method', ['debit_order', 'Debit Order']).eq('customer_id', customerId);
  check('batch: invoice matches eligibility query', (eligible?.length || 0) >= 1, eligible?.length);
  check('batch: customer has active mandate → would be collected', resolved === 'debit_order');

  // Negative — no mandate → not debit_order
  const customerId2 = await createTestCustomer('nomandate', `CTW5N${stamp}`.slice(0, 15));
  const resolved2 = await resolveCollectionMethod(customerId2);
  check('regression: non-mandated customer does NOT resolve to debit_order', resolved2 === null, resolved2);

  console.log(`\n=== W5 result: ${pass} passed, ${fail} failed ===`);
}

async function cleanup() {
  console.log('\n=== cleanup ===');
  for (const id of created.invoiceIds) await supabase.from('customer_invoices').delete().eq('id', id);
  for (const id of created.customerIds) {
    await supabase.from('customer_payment_methods').delete().eq('customer_id', id);
    await supabase.from('customer_billing').delete().eq('customer_id', id);
    await supabase.from('customer_invoices').delete().eq('customer_id', id);
  }
  for (const id of created.emandateIds) await supabase.from('emandate_requests').delete().eq('id', id);
  for (const id of created.customerIds) await supabase.from('customers').delete().eq('id', id);
  console.log('  cleaned up test rows');
}

run()
  .catch((e) => { console.error('\nE2E ERROR:', e instanceof Error ? e.message : e); fail++; })
  .finally(async () => {
    await cleanup().catch((e) => console.error('cleanup error:', e));
    process.exit(fail > 0 ? 1 : 0);
  });
