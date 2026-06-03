# Debit-Order Pipeline — Scope for Implementation & Correction

**Date:** 2026-06-03
**Author:** Claude Code
**Status:** SCOPING — not started, awaiting sign-off
**Trigger:** Audit of customer Ashwyn Watkins (chose EFT for now); blocks Unjani debit-order go-live (target 1 Aug 2026)

---

## 1. Problem Statement

The NetCash debit-order pipeline is **built but not wired end-to-end**. As of today it would never collect from any customer, even after a mandate is signed. Three code/schema gaps + one external-config unknown break the chain between "customer signs mandate" → "invoice gets collected by debit order."

There are also **two parallel payment-method implementations** that disagree on which table is the source of truth.

---

## 2. Verified Current State (evidence)

### The two parallel implementations

| Concern | Legacy flow | Current/canonical flow |
|---|---|---|
| Payment-method table | `payment_methods` | `customer_payment_methods` |
| Written by | emandate initiate (`/api/payment/emandate/initiate`), admin `/api/admin/orders/[orderId]/payment-method`, emandate webhook (`/api/webhooks/netcash/emandate`) | admin route fallback, Pay Now webhook (`/api/payments/netcash/webhook`), CC-debit batch, paynow service |
| `method_type` | `'bank_account'` | `'debit_order'` / `'credit_card'` / `'card'` |
| Read by debit batch? | ❌ No | ✅ Yes (`lib/inngest/functions/debit-orders.ts:273`) |

**Decision needed:** `customer_payment_methods` is the source of truth — the batch reads it, and it's the newer pattern. The mandate-signing path must be redirected to write it.

### Debit batch eligibility (verified, `lib/inngest/functions/debit-orders.ts`)

Two collection triggers run in the daily Inngest function (`cron 0 4 * * *`, registered `lib/inngest/index.ts:296`):

- **Invoice path** (Step 3, line 213-215): invoices with `status IN (draft,sent,partial,overdue)` AND `due_date = today` AND `payment_collection_method IN ('debit_order','Debit Order')`.
- **Order path** (Step 4, line 243-246): `consumer_orders` with `status='active'` AND `billing_active=true` AND `payment_method='Debit Order'` AND `next_billing_date = today`.

Mandate check (Step 5, line 272-307): reads `customer_payment_methods` WHERE `is_active=true` AND `method_type='debit_order'`; treats as **active** only if `encrypted_details.verified === true` AND `mandate_status IN ('active','approved')`.

---

## 3. The Gaps

### Gap 1 — No invoice is ever marked `payment_collection_method='debit_order'`
- `lib/billing/monthly-invoice-generator.ts` creates invoices with the field NULL.
- Only writers: `paynow-billing-service.ts:251` → `'paynow'`; `failed-debit-handler.ts:120` → `'debit_order_failed'`.
- → Invoice path of the batch never matches anything.

### Gap 2 — Signed mandate is written to the wrong table
- `app/api/webhooks/netcash/emandate/route.ts:114-154` updates `payment_methods` (legacy).
- Batch reads `customer_payment_methods`. → mandate invisible to batch.

### Gap 3 — `customer_billing` upsert references non-existent columns
- Webhook `route.ts:165-176` upserts `primary_payment_method_id`, `payment_method_type`, `auto_pay_enabled`, `preferred_billing_date`.
- Actual `customer_billing` columns: `payment_method`, `payment_method_details`, `billing_day`, `next_billing_date`, `payment_status`, … (NO such columns). → upsert fails at runtime (error logged, swallowed).

### Gap 4 (external/operational) — NetCash postback URL not set in code
- `lib/payments/netcash-emandate-batch-service.ts` does NOT pass a PostbackUrl; it must be configured in the NetCash (NetConnector) dashboard.
- **Unknown:** which URL NetCash is configured to POST mandate results to, or whether it's configured at all. If unset, mandates never confirm regardless of code fixes.

---

## 4. Proposed Correction (recommended approach)

Make `customer_payment_methods` + the invoice path canonical. Redirect mandate signing into it; teach the invoice generator to mark debit-order invoices.

### Task A — Redirect mandate confirmation to `customer_payment_methods` (Gap 2)
Modify `app/api/webhooks/netcash/emandate/route.ts` so a successful mandate upserts/updates a `customer_payment_methods` row:
- `method_type='debit_order'`, `is_active=true`, `is_primary=true`
- `mandate_status='active'`, `mandate_id=MandateReferenceNumber`, `mandate_approved_at=now`
- `encrypted_details = { verified: true, provider:'netcash', mandate_reference, debit_day, bank details }`
- Keep `display_name`/`last_four` from masked bank acct.
- Decide: dual-write legacy `payment_methods` for back-compat, or cut over fully. **Recommend** writing `customer_payment_methods` as source of truth; leave legacy write only if other UI reads it (audit `PaymentMethodStatus` component first).

### Task B — Fix `customer_billing` write (Gap 3)
Two options:
- **B1 (recommended, smaller):** change the webhook upsert to existing columns — `payment_method='debit_order'`, `billing_day=<debitDay>`, `payment_method_details=<jsonb>`.
- **B2:** migration to add `primary_payment_method_id/payment_method_type/auto_pay_enabled/preferred_billing_date` to `customer_billing` (larger, touches schema + types).
Pick B1 unless other code already expects the B2 columns (grep first).

### Task C — Invoice generator sets collection method (Gap 1)
Modify `lib/billing/monthly-invoice-generator.ts` `createInvoice()`:
- Before insert, resolve the customer's collection method: active debit mandate in `customer_payment_methods` (method_type='debit_order', verified+active) OR `customer_billing.payment_method='debit_order'` → set `payment_collection_method='debit_order'`, else leave for paynow path.
- This is the **highest-blast-radius** change (core billing engine, just fixed in PR #502). Must be additive and well-tested.

### Task D — Mandate-send entry point
Confirm the admin path works end-to-end: admin order detail → `PaymentMethodRegistrationModal` → `POST /api/admin/orders/[orderId]/payment-method` → NetCash batch submit → customer signs. Ensure the pending record + `emandate_requests.payment_method_id` reference align with the table chosen in Task A.

### Task E (external) — NetCash config verification (Gap 4) — BLOCKER
- Confirm with NetCash account: (1) Debit Order / DebiCheck product enabled, (2) mandate postback URL configured to `https://www.circletel.co.za/api/webhooks/netcash/emandate`, (3) debit-batch service key valid.
- Without this, nothing else collects. Verify FIRST.

---

## 5. Verification / Test Plan

1. Register a mandate for a test customer (or Ashwyn) via admin modal.
2. Sign mandate in NetCash test mode → confirm `customer_payment_methods` row goes `is_active=true, method_type='debit_order', mandate_status='active', encrypted_details.verified=true`; confirm `customer_billing.payment_method='debit_order'`.
3. Generate an invoice with `due_date=today` → assert `payment_collection_method='debit_order'`.
4. Manually trigger `billing/debit-orders.requested` Inngest event → assert a `debit_order_batches` row + `debit_order_batch_items` for the invoice, and NetCash batch submitted/authorised.
5. Confirm a skipped/no-mandate customer still gets the PayNow fallback (no regression).

---

## 6. Risk & Blast Radius

- **High:** `monthly-invoice-generator.ts` is the production billing engine (PR #502). Change must be additive; full type-check + dry-run before enabling.
- **Medium:** emandate webhook changes affect all future mandate confirmations.
- **Schema:** Task B2 (if chosen) touches `customer_billing` + generated types.
- **External dependency:** NetCash debit-order product + postback config (Task E) is outside the codebase and gates everything.
- **Keep the debit cron OFF** until Tasks A–E verified in staging (matches current "cron stays OFF" posture).

## 7. Files In Scope

- `app/api/webhooks/netcash/emandate/route.ts` (Tasks A, B)
- `lib/billing/monthly-invoice-generator.ts` (Task C)
- `app/api/admin/orders/[orderId]/payment-method/route.ts` (Task D, verify)
- `lib/inngest/functions/debit-orders.ts` (verify only; no change expected)
- (Optional) migration + `lib/types/billing.types.ts` (Task B2)
- External: NetCash dashboard (Task E)

## 8. Open Decisions for Sign-off — RESOLVED 2026-06-03

1. **Cut over fully to `customer_payment_methods`** ✅ (audit done — see §9). Legacy `payment_methods` is consumed by ~8 files, not just the webhook → cutover is bigger than first scoped.
2. **Gap 3: reuse existing `customer_billing` columns (B1)** ✅ — write `payment_method='debit_order'`, `billing_day`, `payment_method_details` jsonb.
3. **Verify NetCash debit-order product + postback URL FIRST** ✅ — checklist in §10. Code-side key `NETCASH_DEBIT_ORDER_SERVICE_KEY` is SET locally & distinct from Pay Now key; account-side config unverified.
4. **Must serve both B2C and B2B** ✅ — generalization in §11. Decouple mandate from `consumer_orders`; drive off `customer` + `customer_invoices`.
5. **Legal/compliance proof of sign-up + debit authorization** ✅ — assessment in §12 (separate workstream).

---

## 9. Cutover Audit — `payment_methods` → `customer_payment_methods` (Decision 1)

Full cutover is ~8 files, not 1. All must be repointed + a column-mapping handled.

**Writers (3):**
- `app/api/payment/emandate/initiate/route.ts` (INSERT pending, UPDATE, DELETE unsigned)
- `app/api/admin/orders/[orderId]/payment-method/route.ts` (INSERT pending, UPDATE, DELETE failed)
- `app/api/webhooks/netcash/emandate/route.ts` (UPDATE on signed/declined)

**Readers (5):**
- `app/api/admin/orders/[orderId]/payment-method/route.ts` GET (primary read = `payment_methods`; already has `customer_payment_methods` fallback)
- `app/api/admin/customers/[id]/payment-methods/route.ts` (list)
- `app/api/admin/billing/payment-methods/route.ts` (admin billing dashboard + stats)
- `app/api/payment/method/check/route.ts` (fallback read — already checks `customer_payment_methods` first)
- `app/api/admin/orders/[orderId]/approve-validation/route.ts`
- UI: `components/admin/orders/PaymentMethodStatus.tsx`, `PaymentMethodRegistrationModal.tsx` consume the admin route output.

**Column mapping required** (legacy top-level → target):
`payment_methods` stores bank/mandate as **top-level columns** (`bank_name`, `bank_account_name`, `bank_account_number_masked`, `bank_account_type`, `branch_code`, `mandate_amount`, `mandate_signed_at`, `netcash_mandate_reference`, `netcash_mandate_pdf_link`, `is_verified`, `status`).
`customer_payment_methods` stores them in `encrypted_details` jsonb + (`method_type`, `mandate_id`, `mandate_status`, `mandate_approved_at`, `is_active`, `display_name`, `last_four`). → Build a mapping helper so admin UI keeps showing bank name / masked acct / mandate PDF after cutover.

**Recommended approach:** one PR that (a) adds the mapping helper, (b) repoints all writers, (c) repoints all readers, (d) keeps the GET fallback during rollout, (e) deprecates `payment_methods` writes. Type-check + manual admin-UI verification mandatory.

---

## 10. NetCash Account Verification Checklist (Decision 3 — DO FIRST, external blocker)

Code uses a **dedicated debit-order service** (`lib/payments/netcash-emandate-batch-service.ts`): service key `NETCASH_DEBIT_ORDER_SERVICE_KEY`, WS `https://ws.netcash.co.za/NIWS/niws_nif.svc`, SOAP `BatchFileUpload` with `Instruction='Mandates'`, vendor key `24ade73c-…`, `sendMandate` (540) auto-sends signing request. **No postback URL is set in code** → must be configured in the NetCash NetConnector dashboard.

Verify on the NetCash account (account holder / Jeffrey):
1. `NETCASH_DEBIT_ORDER_SERVICE_KEY` is also set in **prod (Coolify)** and belongs to a **contracted Debit Order / DebiCheck service** (not the Pay Now service).
2. **Debit Order / DebiCheck product is enabled** (merchant contracted for collections).
3. **Mandate postback/notification URL** in NetConnector points to `https://www.circletel.co.za/api/webhooks/netcash/emandate` (the handler we keep).
4. **Mandate type**: confirm whether the account issues **DebiCheck-authenticated** mandates vs **Registered Mandate (RM)** — see §12; DebiCheck strongly recommended.
5. **Debit batch submission/authorise + load-report** (`RequestFileUploadReport`) works against this service key (test in NetCash test mode).

---

## 11. B2B + B2C Generalization (Decision 4)

**Current state:** all mandate/collection logic is **consumer-only** (`consumer_orders`). B2B (`business_quotes`/`contracts`/`business_customers`) captures consent but has **no mandate infrastructure**.

**Target design — decouple the mandate from the order:**
- The mandate belongs to the **customer**, not an order. `customer_payment_methods` is already keyed on `customer_id` → keep it the home for both B2C and B2B mandates.
- Drive collection off **`customer_invoices`** (already B2C+B2B, has `corporate_account_id`/`corporate_site_id`), i.e. the **invoice path** of the batch. Treat the `consumer_orders` order-path as legacy/consumer-only.
- The NetCash batch request already supports company mandates: `isConsumer=false` + `tradingName`/`registrationNumber`/`registeredName` (fields 121/122/123). So the NetCash side is B2B-ready; only the app plumbing is consumer-coupled.
- Make the mandate-send entry point work from a **customer context** (not strictly an `order_id`) so B2B contracts can trigger it.

**Implication:** the cutover (§9) + invoice-path fix (Gap 1, Task C) are the B2B/B2C-agnostic foundation; the consumer_orders order-path is not extended.

---

## 12. Compliance & Legal Proof (Decision 5)

> Not legal advice — get a SA attorney to sign off. Below is the technical/architectural position grounded in ECTA, CPA, POPIA, and PASA/DebiCheck rules.

**Two distinct legal instruments — don't conflate them:**

**(A) The service agreement** ("customer signed up for the service") — governed by **ECTA** (electronic agreements & signatures are valid), **CPA** (plain language, distance-selling cooling-off), **POPIA** (data-processing consent).
- **Current state is largely sufficient and already built.** `components/payments/PaymentConsentCheckboxes.tsx` renders versioned T&C / Privacy / Payment-Terms / recurring-payment checkboxes; `lib/payments/consent-logger.ts` writes `payment_consents` with `terms_version`, `recurring_payment_authorized`, `ip_address`, `user_agent`, `consent_timestamp`. That is an ECTA-defensible electronic agreement record.
- **Gaps to close:** (1) ensure `payment_consents` is written on **every** B2C and B2B signup path (verify it fires from order-create, not only some payment routes); (2) **archive the exact accepted policy text/version** (snapshot, not just a version string + live URL) so you can reproduce what the customer saw; (3) confirm CPA cooling-off handling for distance sales.

**(B) The debit-order mandate** ("authorization to debit the bank account") — governed by **PASA / National Payment System + DebiCheck**. **A website checkbox is NOT a valid debit-order mandate on its own.**
- The legally robust mandate is the **NetCash e-mandate the customer authenticates** — ideally **DebiCheck** (customer confirms at their own bank via app/USSD/ATM/card+PIN). Once authenticated it's on the central mandate register and is **non-disputable** when collections stay within the agreed amount/date/frequency.
- From **13 April 2026**: electronic mandates are valid legal evidence for disputes **only if a written/electronic record is created and retained** per PASA; and **disputes within 60 days are fully automated with no opportunity for the business to defend** non-authenticated collections. → **DebiCheck is strongly recommended** to avoid undefendable disputes.
- **Mandates must be retained for 5 years** after collections end.
- **Action items:** (1) on mandate-signed webhook, **download and store the mandate PDF** (`netcash_mandate_pdf_link`/`postback_mandate_pdf_link`) into a durable Supabase storage bucket — don't rely on the NetCash-hosted link; (2) retain ≥5 years; (3) confirm DebiCheck (not just RM) on the account (§10.4); (4) store mandate reference + authenticated amount/date/frequency alongside in `customer_payment_methods`.

**Bottom line for the user's question:** the T&C checkbox is fine as the *service-agreement* signature (ECTA), but it is **not** the debit-order authorization. The NetCash (DebiCheck) e-mandate + retained signed-mandate PDF is the required proof for debits. Both records must be captured and retained.

---

## 13. Revised Effort & Sequencing

This is now a **multi-workstream project**, not a 4-file patch:
- **W0 (blocker, external):** NetCash account verification (§10) — do first.
- **W1:** Mandate-table cutover (§9) — ~8 files + mapping helper.
- **W2:** Gaps 1–3 fixes (Tasks A/B/C) — webhook + invoice generator + customer_billing.
- **W3:** B2B/B2C generalization (§11) — decouple from `consumer_orders`.
- **W4:** Compliance (§12) — mandate-PDF retention, consent-capture verification, DebiCheck confirmation.
- **W5:** End-to-end test in staging; cron stays OFF until green.

Recommend folding W1–W4 with the **Unjani billing feature** (same pipeline, 1 Aug deadline) rather than as a separate effort.
