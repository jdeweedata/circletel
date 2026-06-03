# Debit-Order Pipeline — Sequenced Implementation Plan (W0–W5)

**Date:** 2026-06-03
**Status:** PLAN — awaiting go to implement
**Companion scope:** `docs/plans/2026-06-03-debit-order-pipeline-fix.md` (gaps, audits, decisions)
**Goal:** Make NetCash debit-order collection work end-to-end for **both B2C and B2B**, on `customer_payment_methods` as the single source of truth, with legally compliant mandate + consent retention. Keep the debit cron **OFF** until W5 passes in staging.

---

## Sequencing & Dependency Graph

```
W0 (NetCash account verify) ──────────────► gates GO-LIVE (W5) [runs in parallel, external]
        │ (W0.4 DebiCheck answer feeds W4.3)
W1 (table cutover) ──► W2 (gap fixes) ──► W3 (B2B/B2C decouple) ──► W4 (compliance) ──► W5 (staging E2E → enable cron)
   └ W1.2 webhook redirect == Gap 2 fix (folded in)
```

- **W0** starts immediately, runs alongside code; it blocks only the final go-live (W5), not coding.
- **W1 → W2 → W3 → W4** are mostly sequential (each builds on the prior). W4.1/W4.2 can start in parallel with W3.
- **One PR per workstream** (W1, W2, W3, W4). Type-check (`npm run type-check:memory`) + targeted manual test gate every PR.

**Estimated size:** W0 ≈ external (0 code), W1 ≈ 8 files + helper, W2 ≈ 2 files, W3 ≈ 3–4 files, W4 ≈ 3 files + 1 bucket. Recommend folding W1–W4 into the Unjani billing feature (same pipeline, 1 Aug deadline).

---

## W0 — NetCash Account Verification (external blocker, DO FIRST)

No code. Owner: account holder (Jeffrey). Gates W5 go-live. Output: a written confirmation appended to the scope doc.

| ID | Task | Done when |
|----|------|-----------|
| W0.1 | Confirm `NETCASH_DEBIT_ORDER_SERVICE_KEY` is set in **prod (Coolify)** and maps to a **contracted Debit Order service** (not Pay Now) | Key present in Coolify env; NetCash confirms it's a debit-order service |
| W0.2 | Confirm **DebiCheck / Debit Order product enabled** on the NetCash merchant account | NetCash support confirms in writing |
| W0.3 | Set **mandate postback URL** in NetConnector → `https://www.circletel.co.za/api/webhooks/netcash/emandate` | Dashboard shows URL; test postback received |
| W0.4 | Confirm mandate type issued: **DebiCheck (authenticated)** vs **Registered Mandate (RM)** | NetCash answer recorded (feeds W4.3) |
| W0.5 | Test **batch submit + load report** (`BatchFileUpload` + `RequestFileUploadReport`) against the debit key in NetCash **test mode** | Returns a fileToken + SUCCESSFUL load report |

**Deliverable:** a "W0 Verified" note (date, who, answers to W0.1–W0.5) in the scope doc.

---

## W1 — Mandate-Table Cutover to `customer_payment_methods` (PR #1)

Single source of truth = `customer_payment_methods`. Repoint all legacy `payment_methods` reads/writes. **W1.2 doubles as the Gap 2 fix.**

### W1.1 — Column-mapping helper + types
- **Create** `lib/payments/payment-method-mapper.ts`: functions to (a) map a NetCash mandate postback → `customer_payment_methods` row shape (`method_type='debit_order'`, `mandate_id`, `mandate_status`, `mandate_approved_at`, `is_active`, `is_primary`, `display_name`, `last_four`, `encrypted_details={ verified, provider:'netcash', mandate_reference, mandate_pdf_link, bank_name, bank_account_name, bank_account_number_masked, bank_account_type, branch_code, debit_day, agreement_date }`), and (b) flatten a `customer_payment_methods` row → the shape the admin UI/`PaymentMethodStatus` expects (bank_name, masked acct, mandate PDF, status, mandate_amount).
- **Acceptance:** unit-level mapping covered by a test in `__tests__/` exercising a real sample postback; `npm run type-check:memory` clean.

> **Progress (2026-06-03):** W1.1 done (mapper + 11 passing tests). W1.2 **webhook** done — `app/api/webhooks/netcash/emandate/route.ts` now writes the active mandate to `customer_payment_methods` via the mapper (Gap 2) and fixes the `customer_billing` write to real columns (**W2.1 pulled forward**, same code block). Type-checks clean. Legacy `payment_methods` writes kept **transitionally** (decline branch + still-present writers) so the admin GET reader keeps working until W1.3. **Reordering note:** writers 2 & 3 (initiate + admin POST) are coupled to the admin GET reader — fold their legacy-write removal into the W1.3 reader repoint (one non-breaking cutover, per §9) rather than removing writes first.

### W1.2 — Repoint WRITERS (== Gap 2 fix)
- `app/api/webhooks/netcash/emandate/route.ts`: on `mandateSuccessful`, **upsert `customer_payment_methods`** via the mapper (active+verified+`method_type='debit_order'`). Replace the legacy `payment_methods` UPDATE. On decline → set `mandate_status='declined'`, `is_active=false`.
- `app/api/payment/emandate/initiate/route.ts`: create the **pending** record in `customer_payment_methods` (`method_type='debit_order'`, `mandate_status='pending'`, `is_active=false`); update `emandate_requests.payment_method_id` to reference it. Repoint the DELETE-unsigned path.
- `app/api/admin/orders/[orderId]/payment-method/route.ts` (POST): same — pending record in `customer_payment_methods`; repoint UPDATE/DELETE.
- **Acceptance:** registering + signing a test mandate produces ONE active `customer_payment_methods` row with `encrypted_details.verified=true` and `mandate_status='active'`; no new `payment_methods` rows written.

> **Progress (2026-06-03, W1.3):** Cutover largely done. **New:** `lib/payments/activate-debit-order-mandate.ts` (shared activation: upsert cpm by `mandate_id` + demote others + customer_billing) and mapper `buildActiveDebitOrderMethod`. **Activation paths cut over:** webhook + `approve-validation` (manual approval — was a second writer) both now write `customer_payment_methods`; legacy `payment_methods` writes removed from both (incl. webhook decline branch). **Readers repointed:** admin order payment-method GET, `customers/[id]/payment-methods`, `admin/billing/payment-methods` (projected to dashboard shape), `payment/method/check` (legacy fallback removed). All changed files type-check clean; mapper 11 tests pass. **No migration needed** (FK to legacy table left intact but unused; `payment_method_id` set null going forward). **REMAINING (one focused step):** remove the pending-row `payment_methods` INSERT/DELETE/UPDATE from `emandate/initiate` + admin `payment-method` POST (they now write harmless dead rows; no reader reads them). Mechanical removal + `payment_method_id: null`, verified by type-check.

### W1.3 — Repoint READERS + admin UI
- Repoint reads to `customer_payment_methods` (via mapper for display): `app/api/admin/orders/[orderId]/payment-method/route.ts` (GET — make `customer_payment_methods` primary, drop legacy primary read; keep a temporary fallback flag during rollout), `app/api/admin/customers/[id]/payment-methods/route.ts`, `app/api/admin/billing/payment-methods/route.ts`, `app/api/payment/method/check/route.ts`, `app/api/admin/orders/[orderId]/approve-validation/route.ts`.
- Verify `components/admin/orders/PaymentMethodStatus.tsx` + `PaymentMethodRegistrationModal.tsx` still render bank name / masked acct / mandate PDF / status from the mapped output.
- **Acceptance:** admin order detail + customer payment-methods list + billing dashboard all display correctly off `customer_payment_methods`; `npm run type-check:memory` clean; legacy `payment_methods` no longer read in these paths.

**W1 exit:** ✅ **COMPLETE (2026-06-03).** No production read/write path depends on `payment_methods`. Writer-insert removal done in `emandate/initiate` + admin `payment-method` POST (no pending rows; `payment_method_id: null`). Both writer files have zero legacy-table writes; type-check clean (only the same pre-existing `unknown`-catch errors remain, unrelated to this work). Legacy `payment_methods` table is dormant — kept for history, not deleted; its FK from `emandate_requests` is intact but unused.

---

## W2 — Gap Fixes: invoice collection-method + customer_billing (PR #2)

### W2.1 — Gap 3: fix `customer_billing` write (small)
- In the emandate webhook (already edited in W1.2), change the `customer_billing` upsert to **existing columns**: `payment_method='debit_order'`, `billing_day=<debitDay∈{1,5,25,30}>`, `payment_method_details=<jsonb: mandate ref, pm id, debit_day>`, `updated_at`. Remove `primary_payment_method_id`/`payment_method_type`/`auto_pay_enabled`/`preferred_billing_date` (non-existent).
- **Acceptance:** after a signed mandate, `customer_billing` row exists with `payment_method='debit_order'` + correct `billing_day`; no upsert error in logs.

### W2.2 — Gap 1: invoice generator resolves collection method
- `lib/billing/monthly-invoice-generator.ts` `createInvoice()`: before insert, resolve collection method per customer — `payment_collection_method='debit_order'` IF the customer has an active debit mandate (`customer_payment_methods` method_type='debit_order', verified+active) OR `customer_billing.payment_method='debit_order'`; else leave for the paynow path. Additive change; default behavior (paynow) unchanged for everyone else.
- Add a single batched lookup (avoid N queries) mirroring the batch's mandate check.
- **Acceptance:** a debit-mandated customer's freshly generated invoice has `payment_collection_method='debit_order'`; a non-mandated customer's invoice is unchanged (paynow). Verify with a dry-run against a test customer. `npm run type-check:memory` clean.

> **Progress (2026-06-03, W2.2 DONE):** `lib/billing/monthly-invoice-generator.ts` — added `resolveCollectionMethod(customerId)` (active+verified `customer_payment_methods` debit mandate, same criteria as the batch; falls back to `customer_billing.payment_method='debit_order'`). `createInvoice` now sets `payment_collection_method` on the invoice and returns it. `processServiceBilling` **skips the Pay Now step** for debit-order invoices (else Pay Now would overwrite the field back to 'paynow' and risk a double charge). Additive — non-mandated customers unchanged (paynow). Type-checks clean. (The 14 failing `billing-service.test.ts` tests are a pre-existing, unrelated module — stale 2025 date assertions; 0 references to the generator.) Verified end-to-end in W5 step 3.

**W2 exit:** ✅ **COMPLETE.** Both halves of the chain are closed — invoices get marked `debit_order` (W2.2) AND mandates are visible in `customer_payment_methods` (W1). The **invoice path** of `lib/inngest/functions/debit-orders.ts` now has matching invoices AND visible mandates → batch would collect (still cron-OFF until W5).

---

## W3 — B2B + B2C Generalization (PR #3)

Decouple the mandate from `consumer_orders`; drive off `customer` + `customer_invoices`.

### W3.1 — Customer-context mandate-send
- Add a mandate-send entry that works from a **customer** (not strictly an `order_id`). Refactor `app/api/admin/orders/[orderId]/payment-method/route.ts` core into a reusable service `lib/payments/mandate-send-service.ts` taking `{ customerId, amount, billingDay, isConsumer, company? }` and building the `EMandateBatchRequest` (sets `isConsumer`, and for B2B `tradingName`/`registrationNumber`/`registeredName` from `business_customers`/`contracts`).
- **Acceptance:** can initiate a mandate for a customer with no `consumer_orders` row; `emandate_requests` + pending `customer_payment_methods` created.

### W3.2 — B2B trigger + invoice linkage
- Add an admin entry point to send a mandate from a B2B context (contract/business customer). Ensure B2B invoices (`customer_invoices` with `corporate_account_id`/`corporate_site_id`) are picked up by the **invoice path** (already B2C/B2B-agnostic after W2.2).
- Confirm the batch's invoice query needs no B2B-specific change (it keys on `customer_id` + `payment_collection_method`).
- **Acceptance:** a B2B customer with an active mandate + a due `customer_invoices` row is categorized "eligible" by the batch (dry-run/log), `isConsumer=false` mandate submitted to NetCash.

> **Progress (2026-06-03, W3 DONE):** Migration `20260603_emandate_order_id_nullable.sql` applied + verified (order_id now nullable; FK retained). New `lib/payments/mandate-send-service.ts` — `sendMandateRequest()` is customer-context + order-optional, and populates NetCash company fields (trading/registered/registration name) for `account_type='business'` (the B2B gap). New endpoint `app/api/admin/customers/[id]/send-mandate/route.ts` — admin sends an order-less mandate to any (incl. business) customer; B2B confirmed to live in the same `customers` table (21 rows, with business_name/business_registration). Webhook made **order-optional**: keyed on AccountRef (+customer_id) instead of order_id; consumer-order updates/notifications wrapped in `if (orderId)`. All W3 files type-check clean. Collection side already B2C/B2B-agnostic (batch reads `customer_invoices` by payment_collection_method + due_date). **DEFERRED (flagged):** (a) consolidate the existing admin order POST + `emandate/initiate` to call `sendMandateRequest` (DRY — they still have inline duplicates of the builder; left to avoid churn on working B2C paths); (b) B2B *invoice generation* — the monthly generator reads `customer_services`; whether B2B invoices populate `customer_invoices` (vs a contract-based generator) is a separate billing question, out of W3 scope (the debit batch collects any debit-order `customer_invoices` row regardless of origin).

**W3 exit:** ✅ **COMPLETE.** Mandate-send works for B2C and B2B from a customer context; webhook activates order-less mandates; `consumer_orders` order-path remains B2C-only.

---

## W4 — Compliance & Legal Retention (PR #4)

> Pair with SA attorney sign-off. Implements the technical controls from scope §12.

### W4.1 — Durable mandate-PDF retention
- On `mandateSuccessful` (emandate webhook), **download** `netcash_mandate_pdf_link`/`postback_mandate_pdf_link` and store to a **private Supabase storage bucket** (e.g. `debit-order-mandates`, path `customer_id/mandate_ref.pdf`). Persist the storage path on `customer_payment_methods.encrypted_details.mandate_pdf_path`. Retain ≥5 years (no auto-delete).
- **Acceptance:** after signing, the PDF exists in the bucket and the row references it; link no longer the sole copy.

### W4.2 — Consent-capture verification + policy snapshot
- Verify `lib/payments/consent-logger.ts` (`payment_consents`) fires on **every** B2C and B2B signup path (audit `app/api/orders/create`, B2B quote/contract paths). Add the call where missing.
- Snapshot the **exact accepted policy text** (or a content hash + archived version file) at consent time, not just `terms_version` + a live URL — so the agreed text is reproducible.
- **Acceptance:** a new test signup writes a `payment_consents` row with `recurring_payment_authorized`, `ip_address`, `user_agent`, `consent_timestamp`, and a retrievable policy snapshot/hash for both B2C and B2B.

### W4.3 — DebiCheck confirmation (depends W0.4)
- Based on W0.4: if account issues **DebiCheck**, document non-disputable status + the 60-day automated-dispute rule (eff. 13 Apr 2026). If only **RM**, raise a risk flag and recommend upgrading to DebiCheck before scaling collections.
- **Acceptance:** mandate type recorded on `customer_payment_methods` (`encrypted_details.mandate_type`); decision documented in scope doc.

> **Progress (2026-06-03, W4):** **W4.1 DONE** — new `lib/payments/retain-mandate-pdf.ts` downloads the signed mandate PDF and stores it in the existing private `mandate-documents` bucket (`{customerId}/{ref}.pdf`); the webhook bakes the path into `encrypted_details.mandate_pdf_path` before activation. Best-effort (failure logged, doesn't block activation). Admin GET + customers routes already sign `mandate-documents/`-prefixed paths, so it renders. Type-checks clean. **W4.2 VERIFIED** — consent IS captured: (a) consumer order signups via `app/api/orders/accept-terms` → `consumer_orders.terms_accepted/terms_version/terms_accepted_ip/terms_accepted_at` + `payment_audit_logs` 'terms_accepted'; (b) payment-initiate paths + B2B quotes via `payment_consents` (consent-logger). ⚠️ **Gap (flagged, needs product/legal input):** only a version *label* ('2026-05-27') is stored, not a content snapshot/hash of the exact accepted text — recommend hashing the canonical versioned policy doc at acceptance for strongest ECTA reproducibility; needs a canonical policy-doc source. **W4.3 GATED on W0.4** — `encrypted_details.mandate_type` field exists (null); populate with DebiCheck/RM once NetCash confirms.

**W4 exit:** ✅ **W4.1 done, W4.2 verified (snapshot hardening flagged), W4.3 awaits W0.4.** Signed-mandate PDFs now retained in our storage; consent captured B2C+B2B (label-level); mandate type to be recorded on W0 return.

---

## W5 — Staging E2E & Go-Live

Run only after W0 verified + W1–W4 merged to staging. Cron stays OFF until all pass.

| Step | Assertion |
|------|-----------|
| 1. Register mandate (admin) for a staging test customer (B2C) and a B2B customer | `emandate_requests` + pending `customer_payment_methods` created |
| 2. Sign mandate in NetCash test mode | `customer_payment_methods` → active/verified, `method_type='debit_order'`; `customer_billing.payment_method='debit_order'`; mandate PDF in bucket |
| 3. Generate invoice with `due_date=today` | `payment_collection_method='debit_order'` set (both B2C + B2B) |
| 4. Trigger `billing/debit-orders.requested` Inngest event manually | `debit_order_batches` + `debit_order_batch_items` created; NetCash batch submitted/authorised |
| 5. Non-mandated customer | Still gets PayNow fallback (no regression) |
| 6. Confirm `debit-orders` Inngest cron is registered & synced in prod | Function visible in Inngest; then enable on the agreed date |

> **Progress (2026-06-03, W5 prep):** Staging **routing fixed** — `staging.circletel.co.za` was 404 (container healthy on :3001 but missing Traefik labels + not on `coolify` network; workflow used non-existent `websecure` entrypoint). Recreated the container with correct http/https Traefik labels on the `coolify` network → HTTPS live, valid LE cert, eMandate webhook reachable. Workflow `.github/workflows/deploy-staging.yml` corrected to persist. See `staging-deployment-wiring` memory. **W5 harness ready:** `scripts/w5-debit-order-e2e.ts` (synthetic-postback pipeline test, runnable now, type-checks clean) + `docs/plans/2026-06-03-W5-staging-e2e-checklist.md` (Path A synthetic + Path B real-NetCash). Path B still needs W0 (Debit Order test key + eMandate postback URL).

> **W5 Path A result (2026-06-03): ✅ 13/13 PASS (direct mode).** Ran `scripts/w5-debit-order-e2e.ts` in-process against the real DB — validated the new W1–W4 code: activation → customer_payment_methods (active+verified+primary, mandate_id match), customer_billing (debit_order + billing_day), collection-method resolves to debit_order, invoice matches batch eligibility query, and non-mandated customer does NOT resolve to debit_order (no regression). Cleanup verified (0 leftover rows). **NOTE: staging currently runs OLD code** — my W1–W4 changes are uncommitted/undeployed, so HTTP-mode (against staging) returns the pre-W3 400 until the branch is built into staging. To run Path A http-mode + Path B real-NetCash, the code must first be deployed to staging.

**Go-live:** enable the daily debit cron only after Steps 1–6 green in staging.

---

## Risk Register

| Risk | Severity | Mitigation |
|------|----------|------------|
| `monthly-invoice-generator.ts` change breaks billing engine (PR #502) | High | Additive only; dry-run; type-check; default paynow unchanged |
| Cutover misses a `payment_methods` reader → admin UI blank | Medium | §9 reader list; keep GET fallback during rollout; manual UI check |
| NetCash debit product not contracted (W0.2 fails) | High (blocker) | W0 first; no go-live until confirmed |
| Non-DebiCheck (RM) mandates → undefendable 60-day disputes | High | W4.3; recommend DebiCheck before scaling |
| Mandate PDF link expires before retention | Medium | W4.1 download to own storage |
| Column-mapping data loss (bank fields → jsonb) | Medium | W1.1 mapper + test with real postback sample |

## Rollback
- Each workstream is its own PR → revert individually.
- W1: GET fallback flag lets readers fall back to `payment_methods` if mapping issues surface.
- Cron stays OFF throughout → no accidental collections during rollout.

## Files Touched (consolidated)
- **New:** `lib/payments/payment-method-mapper.ts`, `lib/payments/mandate-send-service.ts`, Supabase bucket `debit-order-mandates`
- **Edit:** `app/api/webhooks/netcash/emandate/route.ts`, `app/api/payment/emandate/initiate/route.ts`, `app/api/admin/orders/[orderId]/payment-method/route.ts`, `app/api/admin/customers/[id]/payment-methods/route.ts`, `app/api/admin/billing/payment-methods/route.ts`, `app/api/payment/method/check/route.ts`, `app/api/admin/orders/[orderId]/approve-validation/route.ts`, `lib/billing/monthly-invoice-generator.ts`, `lib/payments/consent-logger.ts`, `app/api/orders/create/route.ts` (consent call), `components/admin/orders/PaymentMethodStatus.tsx` (verify)
- **Verify only:** `lib/inngest/functions/debit-orders.ts`, `lib/inngest/index.ts`
