/**
 * W5 Path B — Real DebiCheck eMandate round-trip helper (staging)
 *
 * Drives the DEPLOYED eMandate flow end-to-end against the NetCash TEST account
 * (52340889417). Unlike w5-debit-order-e2e.ts (which posts a SYNTHETIC postback),
 * this seeds a real customer + order and calls the live initiate endpoint, which
 * submits a NetCash BatchFileUpload with sendMandate=1. NetCash then emails/SMSes
 * the customer a DebiCheck signing link; on signing, NetCash POSTs the result to
 * the dashboard "Mandate Postback url" → our webhook → activateDebitOrderMandate.
 *
 * The initiate endpoint returns a file_token, NOT a signing URL — the link is sent
 * by NetCash to the customer email/mobile (or appears in the NetCash test dashboard
 * under Debit Orders → eMandates). So you must supply a REAL email + SA mobile.
 *
 * Three modes (W5B_MODE):
 *   initiate (DEFAULT) — create customer+order, call staging initiate, print the ref to watch.
 *   check    — poll emandate_requests + customer_payment_methods for a given W5B_REF.
 *   cleanup  — delete the test customer/order/emandate/payment-method rows for a given W5B_REF.
 *
 * ⚠️ Staging shares the PRODUCTION Supabase project. Test rows are marked with
 *    account_number prefix "CTEM". Nothing is auto-deleted in `initiate` mode because
 *    the postback arrives later — run `cleanup` once the round-trip is verified.
 *
 * Run (initiate):
 *   set -a && source .env.local && set +a && \
 *     W5B_EMAIL=you@example.com W5B_PHONE=0825551234 \
 *     npx tsx --tsconfig tsconfig.json scripts/w5b-emandate-initiate.ts
 *
 * Watch:    W5B_MODE=check   W5B_REF=CTEM123456789  npx tsx ... scripts/w5b-emandate-initiate.ts
 * Cleanup:  W5B_MODE=cleanup W5B_REF=CTEM123456789  npx tsx ... scripts/w5b-emandate-initiate.ts
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const MODE = (process.env.W5B_MODE || 'initiate') as 'initiate' | 'check' | 'cleanup';
const TARGET = process.env.W5B_TARGET_URL || 'https://staging.circletel.co.za';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (source .env.local first)');
  process.exit(1);
}

const supabase: SupabaseClient = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Normalise a SA mobile to NetCash's 10-digit form (0XXXXXXXXX).
function normaliseMobile(raw: string): string {
  return raw.replace(/^\+27/, '0').replace(/\D/g, '');
}

async function runInitiate() {
  const email = process.env.W5B_EMAIL;
  const phoneRaw = process.env.W5B_PHONE;
  const amount = parseFloat(process.env.W5B_AMOUNT || '599.00');
  const billingDay = parseInt(process.env.W5B_BILLING_DAY || '1', 10);

  if (!email || !phoneRaw) {
    console.error('W5B_EMAIL and W5B_PHONE are required in initiate mode (NetCash sends the mandate link there).');
    process.exit(1);
  }
  const phone = normaliseMobile(phoneRaw);
  if (!/^0\d{9}$/.test(phone)) {
    console.error(`W5B_PHONE "${phoneRaw}" does not normalise to a 10-digit SA mobile (got "${phone}").`);
    process.exit(1);
  }

  const stamp = `${Date.now()}`.slice(-9);
  const accountRef = `CTEM${stamp}`; // <=15 chars, "CTEM" marks it as a test eMandate row
  const firstName = 'DebiCheck';
  const lastName = 'Tester';

  console.log(`\n=== W5 Path B — eMandate initiate (target ${TARGET}, test account 52340889417) ===\n`);

  // 1. Seed customer (account_number must be set — the initiate route rejects null).
  const { data: customer, error: custErr } = await supabase
    .from('customers')
    .insert({
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      account_type: 'personal',
      account_number: accountRef,
    })
    .select('id')
    .single();
  if (custErr || !customer) {
    console.error('Failed to create test customer:', custErr?.message);
    process.exit(1);
  }
  console.log(`  customer_id      = ${customer.id}`);

  // 2. Seed consumer_order (all NOT-NULL columns supplied).
  const orderNumber = `TEST-EM-${stamp}`;
  const { data: order, error: ordErr } = await supabase
    .from('consumer_orders')
    .insert({
      customer_id: customer.id,
      order_number: orderNumber,
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      installation_address: 'Test Address, Cape Town, 8001',
      package_name: 'Test Fibre 100/100',
      package_speed: '100/100',
      package_price: amount,
      installation_fee: 0,
    })
    .select('id')
    .single();
  if (ordErr || !order) {
    console.error('Failed to create test order:', ordErr?.message);
    // best-effort rollback of the customer
    await supabase.from('customers').delete().eq('id', customer.id);
    process.exit(1);
  }
  console.log(`  order_id         = ${order.id}`);
  console.log(`  account_reference= ${accountRef}\n`);

  // 3. Call the DEPLOYED initiate endpoint (passes customer_id so no auth token needed).
  const res = await fetch(`${TARGET}/api/payment/emandate/initiate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customer_id: customer.id, order_id: order.id, billing_day: billingDay }),
  });
  const json = await res.json().catch(() => ({}));

  if (!res.ok || !json.success) {
    console.error(`  ❌ initiate failed (HTTP ${res.status}):`, JSON.stringify(json));
    console.error(`\n  Test rows left in place for inspection. Clean up with:`);
    console.error(`    W5B_MODE=cleanup W5B_REF=${accountRef} npx tsx --tsconfig tsconfig.json scripts/w5b-emandate-initiate.ts`);
    process.exit(1);
  }

  console.log(`  ✅ initiate OK (HTTP ${res.status})`);
  console.log(`     emandate_request_id = ${json.emandate_request_id}`);
  console.log(`     file_token          = ${json.file_token}`);
  console.log(`     account_reference   = ${json.account_reference}`);
  console.log(`\n  NetCash is sending the DebiCheck mandate to:`);
  console.log(`     email  = ${email}`);
  console.log(`     mobile = ${phone}`);
  console.log(`  (or find it in the NetCash test dashboard → Debit Orders → eMandates → pending).`);
  console.log(`  Sign it to fire the postback to ${TARGET}/api/webhooks/netcash/emandate\n`);
  console.log(`  Watch for activation:`);
  console.log(`    W5B_MODE=check W5B_REF=${accountRef} npx tsx --tsconfig tsconfig.json scripts/w5b-emandate-initiate.ts`);
  console.log(`  Clean up when done:`);
  console.log(`    W5B_MODE=cleanup W5B_REF=${accountRef} npx tsx --tsconfig tsconfig.json scripts/w5b-emandate-initiate.ts\n`);
}

async function runCheck() {
  const ref = process.env.W5B_REF;
  if (!ref) { console.error('W5B_REF is required in check mode'); process.exit(1); }
  console.log(`\n=== W5 Path B — check status for ref ${ref} ===\n`);

  const { data: cust } = await supabase
    .from('customers').select('id, email, phone').eq('account_number', ref).maybeSingle();
  if (!cust) { console.log('  No customer found for that ref (cleaned up already?).'); return; }

  const { data: er } = await supabase
    .from('emandate_requests')
    .select('id, status, netcash_response_code, updated_at')
    .eq('netcash_account_reference', ref)
    .order('created_at', { ascending: false })
    .limit(1).maybeSingle();
  console.log(`  emandate_request: status=${er?.status ?? '—'} code=${er?.netcash_response_code ?? '—'} updated=${er?.updated_at ?? '—'}`);

  const { data: pm } = await supabase
    .from('customer_payment_methods')
    .select('method_type, mandate_status, is_active, is_primary, mandate_id, encrypted_details')
    .eq('customer_id', cust.id)
    .eq('method_type', 'debit_order')
    .maybeSingle();

  if (!pm) {
    console.log('  customer_payment_methods: no debit_order row yet → mandate NOT signed/postback not received.');
  } else {
    const verified = pm.encrypted_details?.verified === true || pm.encrypted_details?.verified === 'true';
    console.log(`  customer_payment_methods: ✅ debit_order row present`);
    console.log(`     mandate_status=${pm.mandate_status} is_active=${pm.is_active} is_primary=${pm.is_primary} verified=${verified} mandate_id=${pm.mandate_id}`);
    const ok = pm.is_active && (pm.mandate_status === 'active' || pm.mandate_status === 'approved') && verified;
    console.log(`  → ${ok ? '✅ MANDATE FULLY ACTIVE (Path B round-trip complete)' : '⏳ row exists but not yet active/verified'}`);
  }

  const { data: billing } = await supabase
    .from('customer_billing').select('payment_method, billing_day').eq('customer_id', cust.id).maybeSingle();
  console.log(`  customer_billing: payment_method=${billing?.payment_method ?? '—'} billing_day=${billing?.billing_day ?? '—'}\n`);
}

async function runCleanup() {
  const ref = process.env.W5B_REF;
  if (!ref) { console.error('W5B_REF is required in cleanup mode'); process.exit(1); }
  console.log(`\n=== W5 Path B — cleanup ref ${ref} ===`);

  const { data: cust } = await supabase
    .from('customers').select('id').eq('account_number', ref).maybeSingle();

  if (cust) {
    await supabase.from('customer_payment_methods').delete().eq('customer_id', cust.id);
    await supabase.from('customer_billing').delete().eq('customer_id', cust.id);
  }
  await supabase.from('emandate_requests').delete().eq('netcash_account_reference', ref);
  await supabase.from('consumer_orders').delete().eq('order_number', `TEST-EM-${ref.replace('CTEM', '')}`);
  if (cust) await supabase.from('customers').delete().eq('id', cust.id);

  console.log('  cleaned up test rows for', ref, '\n');
}

(async () => {
  if (MODE === 'check') return runCheck();
  if (MODE === 'cleanup') return runCleanup();
  return runInitiate();
})().catch((e) => { console.error(e); process.exit(1); });
