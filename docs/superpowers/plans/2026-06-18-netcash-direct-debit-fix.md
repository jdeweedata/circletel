# NetCash Direct TwoDay Debit Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Fix the broken NetCash debit-collection service to actually collect debit orders via `BatchFileUpload`/`TwoDay` with inline bank details, then bill the two Unjani clinics (CT-2026-00016, CT-2026-00017) — no eMandate signature, no masterfile load.

**Architecture:** Live test-profile spike proved a `TwoDay` debit batch carrying bank details inline collects successfully (`SUCCESSFUL` load report) on a fresh reference, with no signature and no masterfile. The existing `netcash-debit-batch-service.ts` calls a non-existent SOAP action (`UploadDebitOrderBatch` → 500). We rewrite it to build a `TwoDay` H/K/T/F file and submit via `BatchFileUpload` (the same proven path as `netcash-emandate-batch-service.ts`), sourcing bank details from `customer_payment_methods.encrypted_details`. Legal basis = retained wizard click-wrap mandate (user-approved).

**Tech Stack:** TypeScript, NetCash NIWS_NIF SOAP `BatchFileUpload` + `RequestFileUploadReport`, Supabase, Jest, tsx.

## Global Constraints (all verified against the live test profile 52340889417)

- Debit submission = SOAP `BatchFileUpload(ServiceKey, File)`; SOAPAction `http://tempuri.org/INIWS_NIF/BatchFileUpload`. There is NO `UploadDebitOrderBatch` / `AuthoriseBatch` on this endpoint — remove them.
- H record: `H \t <serviceKey> \t 1 \t TwoDay \t <batchName> \t <actionDate CCYYMMDD> \t <vendorKey>`. Vendor key `24ade73c-98cf-47b3-99be-cc7b867b3080`.
- K record (TwoDay mandatory fields, in this order): `101`(account ref) `102`(name) `131`(bankDetailType=1 for bank) `132`(bank account name) `133`(account type: 1=Current/Cheque, 2=Savings) `134`(branch code) `136`(account number) `162`(amount).
- **Amount field 162 is in CENTS** (100 = R1.00). Footer: `F \t <count> \t <total cents> \t 9999`.
- Records tab-delimited, joined by `\n`.
- Action date must clear NetCash's TwoDay lead time: +2 calendar days was REJECTED ("Action date is not valid"); +7 days worked. Use a safe business-day calc (≥2 business days ahead, skip Sat/Sun).
- Bank details source: `customer_payment_methods.encrypted_details` (plain JSON): `bank_name`, `account_holder_name`, `account_type` ('Cheque / Current' | 'Savings'), `account_number`, `branch_code`. Map account_type starting with 'savings' (case-insensitive) → 2, else → 1.
- Test profile key for dry runs: pass inline `NETCASH_DEBIT_ORDER_SERVICE_KEY=09ab1a6e-a770-40f3-bfa5-ea9999ef380c`. Real profile = 52552945156 (from `.env.local`). Never hardcode keys in committed code.
- Real-money steps run only after a test-profile end-to-end dry run returns `SUCCESSFUL`.
- **MATCHING PRINCIPLE (mandatory).** Every debit MUST be collected off a generated `customer_invoices` row: `accountReference = invoice.invoice_number` (NOT the clinic account number) and `amount = invoice.total_amount`. Never debit a hardcoded amount outside an invoice — it skips customer notification, breaks amount-matching, and breaks `payment-reconciliation` (which matches NetCash results back to invoices by `invoice_number`). The flow is: generate invoice → notify customer (existing `billing/invoice.generated` → invoice-notification) → debit off invoice → reconcile → Zoho. The collect scripts in Tasks D/G must therefore (a) generate/locate the invoice first, then (b) collect using its number + amount.

## Billing Business Rules (user-confirmed 2026-06-19)

The collection fix (Tasks A–D) is plumbing. These rules govern WHEN and HOW MUCH — implemented via the EXISTING invoice infra (`MonthlyInvoiceGenerator`, `computeProRata`, `generateCustomerInvoice`) plus targeted gate changes (Tasks E–G). Do not rebuild invoice generation.

- **Rule 1 — Eligibility gate.** A clinic is billable only when ALL are true: `customer_services.status='active'` AND latest `onboarding_submissions.document_vetting_status='approved'` AND an active `customer_payment_methods` (method_type='debit_order', is_active=true) with bank `account_number`+`branch_code` in `encrypted_details`. This REPLACES the current eMandate-signed requirement (`mandate_status` active + `encrypted_details.verified`), which the click-wrap pivot bypasses.
- **Rule 2 — Pro-rata from billing-start.** First invoice is pro-rated by `computeProRata(billing-start, billing_day)`. Already implemented (monthly-invoice-generator.ts:514-535). VAT 15%; R450 ex VAT = R517.50 incl.
- **Rule 3 — Original cohort billing-start = 2026-06-15.** The original ~21 onboarded clinics bill effective **2026-06-15**: a June pro-rata of **16/30 × R450 = R240.00 ex VAT (R276.00 incl)** per clinic, then full **R517.50 incl monthly from 1 July** on `billing_day=1`.
- **Rule 4 — New clinics: first recurring bill ~1 month after activation.** Clinics NOT in the original cohort get their first full recurring bill one month after `activation_date`; the part-month before that is pro-rata. Original cohort is exempt (bills from 2026-06-15 per Rule 3).
- **Rule 5 — Payment-method-aware invoice notification.** Debit order is the PREFERRED method for both consumer and business customers. The invoice email/SMS CTA branches on `customer_invoices.payment_collection_method`:
  - `'debit_order'` (clinics, business, consumers with a debit order) → notice: *"R{amount} will be collected by debit order from your account on {due_date} — no action needed."* NO PayNow "pay now" CTA (PayNow may appear only as an optional "pay early" link, not the primary CTA).
  - otherwise (consumers WITHOUT a debit order) → PayNow link as the CTA (the current behaviour).
  - PayNow remains the method for once-off / cash purchases (separate flows) for both consumer and business.

### Open items to confirm before any real invoice/debit run
- **Cohort count/list.** DB shows **20** active Unjani clinics (CT-2026-00009 … CT-2026-00028, all `activation_date=2026-06-01`); user says "21". Confirm the exact account-number list of the original cohort.
- **Billing-start vs activation_date.** DB `activation_date` is 2026-06-01; Rule 3 wants billing effective 2026-06-15. Plan sets the cohort's pro-rata billing-start to 2026-06-15 (Task G). Confirm no back-billing for 1–14 June is owed.

---

## Task A: Rewrite `netcash-debit-batch-service.ts` to use BatchFileUpload/TwoDay

**Files:**
- Modify (rewrite): `lib/payments/netcash-debit-batch-service.ts`
- Test: `lib/payments/__tests__/netcash-debit-batch-service.test.ts` (create)

**Interfaces:**
- Produces:
  - `interface DebitOrderItem { accountReference: string; amount: number; actionDate: Date; customerId: string; invoiceId?: string; orderId?: string; accountName: string; accountType: 'current' | 'savings'; branchCode: string; accountNumber: string; }`
  - `buildTwoDayFile(items: DebitOrderItem[], batchName: string): string`
  - `nextValidActionDate(from: Date): Date` (≥2 business days ahead, skipping weekends)
  - `submitBatch(items: DebitOrderItem[], batchName?: string): Promise<BatchSubmissionResult>` — now builds a TwoDay file and calls BatchFileUpload; returns `{ success, fileToken?, itemsSubmitted, errors[], warnings[] }`.
  - `requestLoadReport(fileToken: string): Promise<{ result?: string; errors: {message:string}[] }>` (port the report parser from netcash-emandate-batch-service.ts).
- Removed: `authoriseBatch`, `UploadDebitOrderBatch` XML, `formatDebitOrderItem` returning only ref/amount/date.

- [ ] **Step 1: Write the failing tests**

Create `lib/payments/__tests__/netcash-debit-batch-service.test.ts`:

```ts
import { NetCashDebitBatchService } from '../netcash-debit-batch-service';

const svc = new NetCashDebitBatchService();
const item = {
  accountReference: 'CT-2026-00016', amount: 517.5, actionDate: new Date('2026-06-25T00:00:00Z'),
  customerId: 'x', accountName: 'Unjani Clinic Heidelberg', accountType: 'current' as const,
  branchCode: '250655', accountNumber: '62836392449',
};

describe('buildTwoDayFile', () => {
  it('emits H/K/T/F with TwoDay instruction, full K fields, amount in cents', () => {
    const lines = svc.buildTwoDayFile([item], 'BATCH1').split('\n');
    expect(lines[0].split('\t')[3]).toBe('TwoDay');
    expect(lines[1]).toBe('K\t101\t102\t131\t132\t133\t134\t136\t162');
    expect(lines[2]).toBe('T\tCT-2026-00016\tUnjani Clinic Heidelberg\t1\tUnjani Clinic Heidelberg\t1\t250655\t62836392449\t51750');
    expect(lines[3]).toBe('F\t1\t51750\t9999');
  });

  it('maps savings account type to 2', () => {
    const lines = svc.buildTwoDayFile([{ ...item, accountType: 'savings' }], 'B').split('\n');
    expect(lines[2].split('\t')[5]).toBe('2'); // field 133 position
  });
});

describe('nextValidActionDate', () => {
  it('returns at least 2 days ahead and never a weekend', () => {
    const d = svc.nextValidActionDate(new Date('2026-06-18T12:00:00Z')); // Thu
    expect(d.getTime()).toBeGreaterThan(new Date('2026-06-19T00:00:00Z').getTime());
    expect([0, 6]).not.toContain(d.getDay());
  });
});
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `npx jest lib/payments/__tests__/netcash-debit-batch-service.test.ts`
Expected: FAIL — `buildTwoDayFile`/`nextValidActionDate` not a function.

- [ ] **Step 3: Rewrite the service**

Replace the body of `lib/payments/netcash-debit-batch-service.ts` with (keep the singleton export at the end):

```ts
import { parseStringPromise } from 'xml2js';

export interface DebitOrderItem {
  accountReference: string;
  amount: number;            // Rands
  actionDate: Date;
  customerId: string;
  invoiceId?: string;
  orderId?: string;
  accountName: string;       // holder / mandate name (fields 102 + 132)
  accountType: 'current' | 'savings';
  branchCode: string;
  accountNumber: string;
}

export interface BatchSubmissionResult {
  success: boolean;
  fileToken?: string;
  itemsSubmitted: number;
  errors: string[];
  warnings: string[];
}

const VENDOR_KEY = '24ade73c-98cf-47b3-99be-cc7b867b3080';

export class NetCashDebitBatchService {
  private serviceKey: string;
  private webServiceUrl: string;

  constructor() {
    this.serviceKey = process.env.NETCASH_DEBIT_ORDER_SERVICE_KEY || '';
    this.webServiceUrl = process.env.NETCASH_WS_URL || 'https://ws.netcash.co.za/NIWS/niws_nif.svc';
    if (!this.serviceKey) console.warn('NetCash Debit Order Service Key not configured');
  }

  isConfigured(): boolean { return !!this.serviceKey; }

  private formatDate(d: Date): string {
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  }

  /** Next action date >= 2 business days ahead, never a weekend. */
  nextValidActionDate(from: Date): Date {
    const d = new Date(from);
    let added = 0;
    while (added < 2) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0 && d.getDay() !== 6) added++; }
    return d;
  }

  private escapeXml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  }

  buildTwoDayFile(items: DebitOrderItem[], batchName: string): string {
    const TAB = '\t';
    const actionDate = this.formatDate(items[0].actionDate);
    const header = ['H', this.serviceKey, '1', 'TwoDay', batchName, actionDate, VENDOR_KEY].join(TAB);
    const key = ['K', '101', '102', '131', '132', '133', '134', '136', '162'].join(TAB);
    let totalCents = 0;
    const rows = items.map(i => {
      const cents = Math.round(i.amount * 100);
      totalCents += cents;
      const acctType = i.accountType === 'savings' ? '2' : '1';
      return ['T', i.accountReference.substring(0, 22), i.accountName.substring(0, 50), '1',
        i.accountName.substring(0, 50), acctType, i.branchCode, i.accountNumber, cents.toString()].join(TAB);
    });
    const footer = ['F', items.length.toString(), totalCents.toString(), '9999'].join(TAB);
    return [header, key, ...rows, footer].join('\n');
  }

  async submitBatch(items: DebitOrderItem[], batchName?: string): Promise<BatchSubmissionResult> {
    const result: BatchSubmissionResult = { success: false, itemsSubmitted: 0, errors: [], warnings: [] };
    if (!this.serviceKey) { result.errors.push('NetCash Debit Order Service Key not configured'); return result; }
    if (items.length === 0) { result.warnings.push('No items to submit'); result.success = true; return result; }

    const file = this.buildTwoDayFile(items, batchName || `CircleTel-${this.formatDate(items[0].actionDate)}`);
    const envelope = `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/"><soap:Body><tem:BatchFileUpload><tem:ServiceKey>${this.escapeXml(this.serviceKey)}</tem:ServiceKey><tem:File>${this.escapeXml(file)}</tem:File></tem:BatchFileUpload></soap:Body></soap:Envelope>`;

    try {
      const res = await fetch(this.webServiceUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/xml; charset=utf-8', 'SOAPAction': 'http://tempuri.org/INIWS_NIF/BatchFileUpload' },
        body: envelope,
      });
      const text = await res.text();
      if (!res.ok) { result.errors.push(`NetCash API returned ${res.status}: ${res.statusText} ${text.substring(0, 300)}`); return result; }
      const token = text.match(/<BatchFileUploadResult>([\s\S]*?)<\/BatchFileUploadResult>/)?.[1] || '';
      if (!token || ['100', '101', '102', '200'].includes(token)) {
        result.errors.push(`BatchFileUpload rejected (code ${token})`); return result;
      }
      result.success = true; result.fileToken = token; result.itemsSubmitted = items.length;
      return result;
    } catch (e) {
      result.errors.push(e instanceof Error ? e.message : 'Unknown error'); return result;
    }
  }

  /** Poll the file upload report — confirms whether the batch loaded SUCCESSFULLY. */
  async requestLoadReport(fileToken: string): Promise<{ result?: string; errors: { message: string }[] }> {
    const envelope = `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/"><soap:Body><tem:RequestFileUploadReport><tem:ServiceKey>${this.escapeXml(this.serviceKey)}</tem:ServiceKey><tem:FileToken>${this.escapeXml(fileToken)}</tem:FileToken></tem:RequestFileUploadReport></soap:Body></soap:Envelope>`;
    const res = await fetch(this.webServiceUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/xml; charset=utf-8', 'SOAPAction': 'http://tempuri.org/INIWS_NIF/RequestFileUploadReport' },
      body: envelope,
    });
    const xml = await res.text();
    const body = (await parseStringPromise(xml).catch(() => null));
    const raw = xml.match(/<RequestFileUploadReportResult>([\s\S]*?)<\/RequestFileUploadReportResult>/)?.[1] || '';
    const errors: { message: string }[] = [];
    let result: string | undefined;
    for (const line of raw.split(/&#xD;|\r?\n/).map(l => l.trim()).filter(Boolean)) {
      if (line.startsWith('###BEGIN')) {
        const p = line.split('\t');
        result = /SUCCESSFUL WITH ERRORS/.test(p[2]) ? 'SUCCESSFUL WITH ERRORS' : /UNSUCCESSFUL/.test(p[2]) ? 'UNSUCCESSFUL' : /SUCCESSFUL/.test(p[2]) ? 'SUCCESSFUL' : undefined;
      } else if (line.startsWith('###ERROR')) {
        errors.push({ message: line.replace(/^###ERROR:?\s*/, '') });
      }
    }
    void body;
    return { result, errors };
  }
}

export const netcashDebitBatchService = new NetCashDebitBatchService();
```

- [ ] **Step 4: Run tests, verify pass**

Run: `npx jest lib/payments/__tests__/netcash-debit-batch-service.test.ts`
Expected: PASS (3 passing).

- [ ] **Step 5: Type-check the file**

Run: `npm run type-check:memory`
Expected: no NEW errors in `netcash-debit-batch-service.ts`. NOTE: callers in `app/api/cron/submit-debit-orders/route.ts`, `app/api/cron/submit-cc-debit-orders/route.ts`, and `lib/inngest/functions/debit-orders.ts` now have type errors because `DebitOrderItem` gained required fields and `authoriseBatch` was removed — those are fixed in Task C. List them in your report; do not fix them here.

- [ ] **Step 6: Commit**

```bash
git add lib/payments/netcash-debit-batch-service.ts lib/payments/__tests__/netcash-debit-batch-service.test.ts
git commit -m "fix(netcash): rewrite debit batch to BatchFileUpload/TwoDay with inline bank details"
```

---

## Task B: Verify batch release on the test profile (does TwoDay auto-process, or need authorisation?)

**Files:**
- Modify: `scripts/netcash/verify-direct-debit.ts` (already exists from the spike — extend to confirm post-upload status)

**Context:** The spike's load report returned `SUCCESSFUL` (= file loaded) but we removed `authoriseBatch`. We must confirm a BatchFileUpload TwoDay batch actually RELEASES for processing (not stuck awaiting authorisation). The test profile has "Lock batch on upload" unchecked, which should auto-release — confirm.

- [ ] **Step 1:** In the NetCash test portal (profile 52340889417), after running `scripts/netcash/verify-direct-debit.ts`, check Services → Debit Orders → the uploaded batch shows as released/authorised (not "awaiting authorisation"). Record the observed status in the task report.
- [ ] **Step 2:** If batches require authorisation, research the correct NIWS release method (or document that "Lock batch on upload" must stay OFF on the prod profile 52552945156) and note it. If they auto-release, record that no authorisation call is needed.
- [ ] **Step 3:** Commit any script change: `git add scripts/netcash/verify-direct-debit.ts && git commit -m "test(netcash): confirm TwoDay batch release behaviour"` (skip if no change).

---

## Task C: Update prod cron callers to supply bank details

**Files:**
- Modify: `app/api/cron/submit-debit-orders/route.ts` (item building ~lines 197-279; remove `authoriseBatch` call ~313-323)
- Modify: `lib/inngest/functions/debit-orders.ts` (its `submitBatch`/`authoriseBatch` usage ~455-478)

**Interfaces:** Consumes the new `DebitOrderItem` (now requires `accountName`, `accountType`, `branchCode`, `accountNumber`) from Task A.

- [ ] **Step 1:** In `submit-debit-orders/route.ts`, for each eligible invoice/order, fetch the customer's bank details from `customer_payment_methods` (select `encrypted_details` where `customer_id = ... AND method_type='debit_order' AND is_active=true`), read `encrypted_details.{account_holder_name, account_type, account_number, branch_code}`, and populate the new `DebitOrderItem` fields. Map `account_type` (case-insensitive startsWith 'savings') → 'savings' else 'current'. Skip the item (increment `result.skipped`) if no bank details are found, logging the reason.

- [ ] **Step 2:** Remove the `authoriseBatch` block (Task A removed the method). After `submitBatch`, call `requestLoadReport(batchResult.fileToken)` and treat `result !== 'SUCCESSFUL' && result !== 'SUCCESSFUL WITH ERRORS'` as a failure; log the report errors.

- [ ] **Step 3:** Apply the equivalent change in `lib/inngest/functions/debit-orders.ts` (fetch bank details into the items it builds; drop `authoriseBatch`; verify via `requestLoadReport`).

- [ ] **Step 4:** Type-check: `npm run type-check:memory` — confirm the caller errors from Task A Step 5 are resolved and no new ones introduced in these files.

- [ ] **Step 5:** Run existing related tests: `npx jest lib/inngest/functions/__tests__/debit-orders.test.ts lib/inngest/functions/__tests__/billing-integration.test.ts` — update the mocks if they reference `authoriseBatch` (the mocks at debit-orders.test.ts:45 / billing-integration.test.ts:45 mock `authoriseBatch`; remove those mock lines and any assertions on them). Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/api/cron/submit-debit-orders/route.ts lib/inngest/functions/debit-orders.ts lib/inngest/functions/__tests__/debit-orders.test.ts lib/inngest/functions/__tests__/billing-integration.test.ts
git commit -m "fix(billing): source bank details for TwoDay debit, drop authoriseBatch"
```

---

## Task D: Bill the two clinics (test-profile dry run → real)

**Files:**
- Create: `scripts/netcash/collect-clinics.ts`

**Interfaces:** Consumes `netcashDebitBatchService.submitBatch` + `requestLoadReport` + `nextValidActionDate`.

- [ ] **Step 1:** Write `scripts/netcash/collect-clinics.ts` that: loads CT-2026-00016 and CT-2026-00017 from Supabase (customers + their `customer_payment_methods.encrypted_details`), builds `DebitOrderItem`s (amount R517.50, `nextValidActionDate(new Date())`), calls `submitBatch`, waits 30s, calls `requestLoadReport`, and prints the verdict. Use the service-role Supabase client (`@/lib/supabase/server` `createClient`).

```ts
/**
 * Collect the two Unjani clinics via TwoDay debit.
 * Dry run (test profile): set -a && source .env.local && set +a && NETCASH_DEBIT_ORDER_SERVICE_KEY=09ab1a6e-a770-40f3-bfa5-ea9999ef380c npx tsx scripts/netcash/collect-clinics.ts
 * Real:               set -a && source .env.local && set +a && npx tsx scripts/netcash/collect-clinics.ts
 */
import { createClient } from '@/lib/supabase/server';
import { netcashDebitBatchService, type DebitOrderItem } from '@/lib/payments/netcash-debit-batch-service';

const REFS = ['CT-2026-00016', 'CT-2026-00017'];
const AMOUNT = 517.5;

async function main() {
  const sb = await createClient();
  const actionDate = netcashDebitBatchService.nextValidActionDate(new Date());
  const items: DebitOrderItem[] = [];
  for (const ref of REFS) {
    const { data: c } = await sb.from('customers').select('id').eq('account_number', ref).single();
    if (!c) { console.log(`${ref}: customer not found`); continue; }
    const { data: pm } = await sb.from('customer_payment_methods')
      .select('encrypted_details').eq('customer_id', c.id).eq('method_type', 'debit_order').eq('is_active', true).single();
    const d = pm?.encrypted_details as any;
    if (!d?.account_number) { console.log(`${ref}: no bank details`); continue; }
    items.push({
      accountReference: ref, amount: AMOUNT, actionDate, customerId: c.id,
      accountName: d.account_holder_name, accountType: String(d.account_type).toLowerCase().startsWith('savings') ? 'savings' : 'current',
      branchCode: d.branch_code, accountNumber: d.account_number,
    });
  }
  console.log('Items:', items.map(i => ({ ref: i.accountReference, last4: i.accountNumber.slice(-4), amount: i.amount, date: i.actionDate.toISOString().slice(0,10) })));
  if (!items.length) return console.log('Nothing to collect.');
  const r = await netcashDebitBatchService.submitBatch(items, `UNJANI-${Date.now()}`);
  console.log('submit:', r);
  if (!r.success || !r.fileToken) return console.log('SUBMIT FAILED.');
  await new Promise(x => setTimeout(x, 30_000));
  const rep = await netcashDebitBatchService.requestLoadReport(r.fileToken);
  console.log('load report:', JSON.stringify(rep, null, 2));
  console.log(rep.result === 'SUCCESSFUL' ? 'COLLECTED (loaded).' : `Review: ${rep.result}`);
}
main().catch(e => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Dry run on the TEST profile.** Run with the test key (see header). Expected: load report `SUCCESSFUL`. If errors, fix before real run.
- [ ] **Step 3: Confirm amount + action date with the user** before the real run (real money).
- [ ] **Step 4: Real run** on the live profile (no key override). Expected: `SUCCESSFUL`. Verify the batch in the NetCash prod portal.
- [ ] **Step 5: Commit:** `git add scripts/netcash/collect-clinics.ts && git commit -m "chore(netcash): TwoDay collection script for Unjani clinics"`

---

## Task E: Change the eligibility gate to vetting + active + bank details (drop signature)

**Files:**
- Modify: `lib/onboarding/billing-ready.ts` (`maybeMarkBillingReady`, lines 33-49)
- Modify: `app/api/cron/submit-debit-orders/route.ts` (`checkMandateStatus`, lines 393-422)
- Test: `lib/onboarding/__tests__/billing-ready.test.ts` (create)

**Interfaces:** `maybeMarkBillingReady(supabase, customerId): Promise<boolean>` unchanged signature; new gate semantics. `checkMandateStatus` returns `'active'` when the new criteria are met.

- [ ] **Step 1:** In `maybeMarkBillingReady`, replace the mandate verified+active check (lines 44-49) with: mandate row exists AND `encrypted_details.account_number` and `encrypted_details.branch_code` are present (bank details on file). Keep the `document_vetting_status === 'approved'` check. Add a `customer_services.status='active'` check (query customer_services for the customer; require at least one active). Return true only if vetting approved AND a service is active AND bank details present.
- [ ] **Step 2:** In `checkMandateStatus`, change the `'active'` condition from `isVerified && mandateActive` to: payment method exists with `encrypted_details.account_number` present (bank details on file). (Vetting + active-service gating is enforced upstream by billing_ready, so the collection cron continues to bill only off generated invoices for billing_ready customers.)
- [ ] **Step 3:** Write `lib/onboarding/__tests__/billing-ready.test.ts` asserting: (a) vetting approved + active service + bank details → returns true even when `mandate_status='pending'` and `verified` absent; (b) missing bank details → false; (c) vetting not approved → false. Mock the Supabase client.
- [ ] **Step 4:** Run `npx jest lib/onboarding/__tests__/billing-ready.test.ts` → PASS. Type-check.
- [ ] **Step 5:** Backfill — write `scripts/netcash/mark-cohort-billing-ready.ts` that calls `maybeMarkBillingReady` for every active Unjani clinic (customers join customer_services status='active', business_name ILIKE 'Unjani%'), logging which flipped to billing_ready. Run it (read-only safe; only flips onboarding_status). Confirm the cohort is now billing_ready.
- [ ] **Step 6: Commit** the gate change + test + backfill script.

## Task F: New-clinic "first recurring bill ~1 month after activation"

**Files:**
- Modify: `lib/billing/monthly-invoice-generator.ts` (first-invoice block ~514-535)

- [ ] **Step 1:** Define the cohort boundary: a clinic is "original cohort" if `activation_date <= '2026-06-01'` (exempt from the 1-month delay; billed per Task G). New clinics = `activation_date > '2026-06-01'`.
- [ ] **Step 2:** In the first-invoice path, for NEW clinics, suppress the full recurring invoice until the first `billing_day` that is `>= activation_date + 1 month`; bill only the pro-rata part-month before that. Add a unit test covering: new clinic activated mid-month bills pro-rata that month, full month thereafter, first full bill no earlier than activation+1 month.
- [ ] **Step 3:** Run the generator's tests + type-check. Commit.

## Task G: Original-cohort billing run — June pro-rata from 2026-06-15, then monthly

**Files:**
- Create: `scripts/netcash/cohort-june-prorata.ts`

**Preconditions:** Tasks A–E complete; cohort list + 2026-06-15 billing-start CONFIRMED with the user (see Open items).

- [ ] **Step 1:** Confirm the exact cohort account-number list with the user (resolve 20-vs-21).
- [ ] **Step 2:** Set the cohort's pro-rata billing-start: update `customer_services.activation_date='2026-06-15'` for the confirmed cohort (so `computeProRata` yields 16/30). Do this in the script with an explicit WHERE on the confirmed account numbers; print before/after.
- [ ] **Step 3:** Generate the June pro-rata invoice per clinic via `generateCustomerInvoice` with `invoice_type='pro_rata'`, `period_start='2026-06-15'`, `period_end='2026-06-30'`, line item from `buildInvoiceLineItems('pro_rata', service, R240.00)`, `payment_collection_method='debit_order'`, due date ~2026-06-15. Set `last_invoice_date` so the 1 July monthly cron generates a FULL-month July invoice (no double pro-rata). Verify amounts: R240.00 ex VAT, R36.00 VAT, R276.00 incl per clinic.
- [ ] **Step 4: Dry run on TEST profile** — collect the June pro-rata invoices via the Task-D TwoDay path with the test key. Expect load report `SUCCESSFUL`.
- [ ] **Step 5: Confirm with user**, then **real run**: collect the cohort's June pro-rata on the live profile. Verify in the NetCash portal.
- [ ] **Step 6:** Confirm the `generate-monthly-invoices` cron is scheduled and will pick up the cohort on 1 July (billing_day=1, now billing_ready, full R517.50). Document the verification.
- [ ] **Step 7: Commit** the script + a short runbook note.

## Task H: Link payment to invoice in Zoho Books (fix matching principle)

**Files:**
- Modify: `app/api/cron/payment-reconciliation/route.ts` (the `payment_transactions` insert, ~lines 260-274)
- Modify (if needed): `lib/integrations/zoho/books-sync-orchestrator.ts` (payment sync ~606-624 — already reads `payment.invoice.zoho_books_invoice_id`; verify the join works once invoice_id is set)
- Test: extend payment-reconciliation tests if present.

**Problem:** `payment-reconciliation` inserts `payment_transactions` WITHOUT `invoice_id`, so the Zoho payment sync can't link the payment to the invoice → invoice stays open in Zoho Books after a successful debit (breaks the matching principle).

- [ ] **Step 1:** In the `payment_transactions` insert, set `invoice_id: <the matched invoiceId>` (the reconciliation already knows the invoice it matched by `invoice_number`). 
- [ ] **Step 2:** Confirm `books-sync-orchestrator.ts` payment sync (lines 606-624) joins `payment_transactions.invoice_id → customer_invoices.zoho_books_invoice_id` and applies the payment to the Zoho invoice (`invoices: [{ invoice_id, amount_applied }]`).
- [ ] **Step 3:** Verify end-to-end on a synced test invoice: debit succeeds → reconciliation sets invoice paid + payment_transactions.invoice_id → next zoho-books-sync applies the payment to the Zoho invoice (invoice shows paid in Zoho). 
- [ ] **Step 4: Commit.**

## Task I: Payment-method-aware invoice notification (debit-order notice vs PayNow)

**Files:**
- Modify: `lib/inngest/functions/invoice-notification.ts` (fetch `payment_collection_method`; branch SMS at lines 51-65 + 169-175; pass a mode flag to the email at 131-145)
- Modify: `lib/emails/enhanced-notification-service.ts` (`sendInvoiceGenerated` — add a debit-order variant that says "will be collected by debit order on {due_date}" instead of a Pay Now CTA)
- Test: extend/add a test for the branch.

**Rule:** Per Rule 5 — debit-order invoices get a "will be debited" notice (no PayNow CTA); others get the PayNow link.

- [ ] **Step 1:** Add `payment_collection_method` to the invoice select (line 88-101).
- [ ] **Step 2:** Compute `isDebitOrder = invoice.payment_collection_method === 'debit_order'`.
- [ ] **Step 3:** SMS: if `isDebitOrder`, build a debit notice (`"Hi {name}, your CircleTel invoice {number} for R{amount} will be collected by debit order on {due_date}. No action needed."`) and do NOT require/append `paynow_url`. Else keep the existing Pay Now SMS. Remove the hard `no_paynow_url` skip for debit-order invoices (they don't need one).
- [ ] **Step 4:** Email: pass `mode: isDebitOrder ? 'debit_order' : 'paynow'` to `sendInvoiceGenerated`; render the debit-order copy variant (no Pay Now button, or Pay Now only as secondary "pay early").
- [ ] **Step 5:** Tests: a debit-order invoice produces the debit notice + no PayNow CTA; a non-debit invoice keeps PayNow. Run + type-check. Commit.

## Task J: Align the onboarding journey with the no-eMandate-signature model

**Files:**
- Modify: `app/api/admin/b2b/onboarding-pipeline/route.ts` (`determineStage`, lines 55-92) — reach `billing_ready` from docs-approved + active service + bank details (no `mandate_status='active'` requirement). Relabel/retire the `mandate_active` stage.
- Modify: `app/admin/unjani/onboarding/page.tsx` — relabel mandate-status UI ("Payment method on file"), remove/disable "Send DebiCheck reminder"/"Send mandate link" actions for the debit path.
- Modify/retire: `app/api/admin/unjani/send-mandate-reminder/route.ts` + `circletel_debicheck_reminder` usage (remove or repurpose to a "payment method confirmed" message).
- Modify/disable: `lib/inngest/functions/clinic-mandate-poll.ts` (no mandates to poll once signing is bypassed).
- Keep unchanged: `circletel_clinic_onboarding`, `circletel_docs_received`, the T&C acceptance capture, and `issue-service-order` (the legal artifact).

- [ ] **Step 1:** Update `determineStage` so vetting-approved + active service + bank details on file → `billing_ready` (mirrors the Task E gate). Retire `mandate_active` (or relabel to "Payment method on file").
- [ ] **Step 2:** In the admin pipeline UI, relabel mandate-status text and remove the DebiCheck-reminder / send-mandate-link actions from the debit-order path.
- [ ] **Step 3:** Disable (or repurpose) `clinic-mandate-poll` and the `send-mandate-reminder` endpoint + `circletel_debicheck_reminder` template usage.
- [ ] **Step 4:** Ensure the **Service Order PDF is issued** for billable clinics (it's the legal basis) — backfill-issue for CT-2026-00016/00017 (currently `service_order_pdf_path` NULL) and make issuance part of the billing-ready transition.
- [ ] **Step 5:** Tests for `determineStage`; manual UI check. Commit.

## Task K (decision-gated): Update Service Order terms wording to match standard debit

**Problem:** Accepted terms (`SERVICE_ORDER_TERMS`, version 2026-06-11) authorise collection "via **DebiCheck** debit order", but we collect via a standard TwoDay debit order. The authorisation should match what we do.

- [ ] **Step 1 (decision):** Confirm with the user/legal whether to amend the terms wording to "debit order (DebiCheck or standard EFT debit order)" and whether existing 22 acceptances need re-acceptance or are covered.
- [ ] **Step 2 (if approved):** Update `SERVICE_ORDER_TERMS` wording + bump `SERVICE_ORDER_TERMS_VERSION`. New acceptances capture the corrected wording.

## Task D/G integration note (matching principle)

Tasks D and G must NOT debit hardcoded amounts. Corrected flow for both:
1. Generate the invoice(s) (Task G: June pro-rata R276 incl via `generateCustomerInvoice` invoice_type='pro_rata'; Task D pilot: the same, or the next monthly invoice) — this notifies the customer via the existing `billing/invoice.generated` path.
2. Ensure each invoice is synced to Zoho Books (daily cron, or trigger).
3. Collect via the fixed `submitBatch` using `accountReference = invoice.invoice_number`, `amount = invoice.total_amount`, bank details from the customer's payment method.
4. `payment-reconciliation` matches the NetCash result back to the invoice by `invoice_number` and (with Task H) applies the payment in Zoho.

## Phase 2 (separate plan)

Auto-wire `submitBatch` (single-item) into the vetting-approved handler so every future business-account clinic is debited on the next billing cycle once vetting completes. Needs the vetting-approval code path; write after Phase 1 bills cleanly. Task F's new-clinic rule governs their first-bill timing.

## Decision carried forward

Task 1's `MandateToMasterfile` code (commit cc28f085 on this branch) is unused. The final whole-branch review should decide: keep as a dormant capability, or revert for focus. Flag it; don't silently ship.

## Self-Review

- **Spec coverage:** fix broken service (Task A) ✓; verify release (Task B) ✓; rewire prod callers with bank details (Task C — "fix in place" per user) ✓; bill 2 clinics test→real (Task D) ✓; future clinics (Phase 2, deferred) ✓.
- **Placeholder scan:** all code complete; amount/date flagged for confirmation not blank.
- **Type consistency:** `DebitOrderItem` fields, `buildTwoDayFile`, `nextValidActionDate`, `requestLoadReport`, `submitBatch` returning `fileToken` are consistent across Tasks A/C/D.
