# Debit-Order Rail End-to-End — Design

**Date:** 2026-07-02
**Goal:** The August Unjani billing cycle collects by debit order and reconciles back to invoices with zero NetCash portal work (except the one NetCash account setting we cannot control).

## Problem (evidence-backed, 2026-07-02 audit)

The automated debit rail has never fired. Every collection to date was a manually loaded + manually authorised NetCash portal batch, and results never flowed back to Supabase. Five independent defects:

1. **Mandates stuck `pending`.** Click-wrap Service Order acceptance (terms v2026-06-19, clause: acceptance = signed debit order mandate) creates `customer_payment_methods` with `mandate_status='pending'`. Nothing ever activates it. `submit-debit-orders` requires `active` → skips everything and falls back to PayNow.
2. **PayNow overwrites the collection method.** `monthly-invoice-generator` creates billing-ready invoices with `payment_collection_method='debit_order'`, then immediately calls `processPayNowForInvoice`, which overwrites the field to `'paynow'` (`paynow-billing-service.ts:251`). The debit cron filters on `'debit_order'` → never matches.
3. **Debit cron matches `due_date = today` only.** Any missed day is lost forever.
4. **Reconciliation looks at yesterday's statement only.** Empirically (probe 2026-07-02): NetCash posts TDD lines onto the *action-date* statement 1–2 days late (settlement). By the time the line exists, the cron has moved on. Result: 0 records processed every scheduled run; all posting has been manual.
5. **`RetrieveBatchStatus` parsing is broken** (`parseBatchStatusResponse` expects array-style `soap:Envelope`; NetCash returns `s:Envelope` + string). It throws on every call. The batch-authorise flow (`authoriseBatchByName`) depends on it → would never find the batch.

Plus data damage found on the way: Kayamandi (INV-2026-00016, entity Esterkula Pty Ltd) was debited **twice** (29-Jun + 01-Jul, R276 each); Cosmo City (INV-2026-00017) was **never debited** despite being masterfile-loaded (the "duplicate" deletion removed the wrong item).

## Design

### Code (branch `feat/debit-rail-endtoend`, built on `feat/netcash-batch-authorise`)

1. **Mandate activation at acceptance** — `app/api/onboarding/submit/route.ts` creates the debit-order payment method with `mandate_status='active'`, `mandate_approved_at=acceptedAt`. Legal basis: the accepted terms text itself ("constitutes your signed debit order mandate") + captured acceptance evidence (IP/UA/terms hash). The NetCash eMandate request still goes out unchanged (a later DebiCheck signature only re-affirms).
2. **PayNow no longer overwrites `debit_order`** — the generator skips the PayNow step for `debit_order` invoices and instead sends the existing invoice notification flagged as debit-order notice ("will be collected by debit order on/about <due date>") — no payment link, no overwrite. `processPayNowForInvoice` also gets a guard: it refuses to downgrade `payment_collection_method` when the invoice is `debit_order` **unless** called with `allowCollectionMethodOverride` (used by the cron's pending-mandate PayNow fallback, where flipping is correct).
3. **Debit cron widened** — select unpaid (`draft/sent/partial/overdue`) `debit_order` invoices with `due_date <= today` and `due_date >= today - 45d`. Dedupe: exclude invoices already in `debit_order_batch_items` with status `pending/submitted/processed`, and invoices with a completed `payment_transactions` row for the same reference. (The cron already records every batch via `recordBatchSubmission`, so the dedupe source is maintained by the same run.)
4. **Batch authorise** — from `feat/netcash-batch-authorise`: `RequestBatchAuthorise` after upload + line/daily-limit guards. Requires NetCash "Auto Authorisation" on the profile; until enabled, code 322 is handled gracefully and the existing unauthorised-batch alert email (#596) covers the manual step.
5. **Fix `parseBatchStatusResponse`** — same parsing pattern as the working statement parser (`explicitArray:false`, `s:`/`soap:` envelope fallback, string result). Live-verified against the real endpoint.
6. **Reconciliation rolling window** — `payment-reconciliation` reconciles statements for each of the last `RECON_WINDOW_DAYS` (default 5) days instead of yesterday only. Idempotent: skips refs that already have a completed `payment_transactions` row. `DRU` (unpaid) lines mark the invoice `debit_order_failed_at` + reason and set status back for retry/alerting. Multiple identical TDD lines for one ref across the window post once (first wins); extra lines are logged as over-collection warnings — this is exactly the Kayamandi case.

### Data (shared prod DB, one-off)

- Reverse the incorrect Cosmo posting (INV-2026-00017 marked paid earlier today on the assumption the 29-Jun batch was Cosmo's; the statement proves it never ran): delete the `NETCASH-RECONCILE-INV-2026-00017` transaction, invoice back to `sent`, `payment_collection_method='debit_order'` so the widened cron collects it.
- Backfill `mandate_status='active'` + `mandate_approved_at` for the 5 live clinics (acceptance evidence exists for all).
- Tag open invoices `INV-2026-00025/26/27` (July R450s) `payment_collection_method='debit_order'`.
- Kayamandi double-debit (R276 over-collection): **business decision** — recommend crediting against INV-2026-00027 (R450 July) rather than a NetCash refund. Not automated.

### Out of scope

- NetCash Auto Authorisation is an account setting only NetCash can enable (code 322 until then). Request already drafted in `docs/netcash/2026-06-27_netcash-debit-limit-increase-request.md` (branch).
- The phantom 05:00 UTC reconciliation run (always fails with "statement not available") comes from a scheduler outside this repo; harmless but should be found and removed.

### August cycle, end to end (after deploy + NetCash auto-auth)

1. 1 Aug: `generate-monthly-invoices` creates R450 invoices tagged `debit_order` (no PayNow overwrite), notification email sent.
2. Same morning: `submit-debit-orders` picks them up (mandates active), uploads batch with limit guards, authorises via `RequestBatchAuthorise` (or alerts finance if 322).
3. Action date +1–2 days: `payment-reconciliation` rolling window finds the TDD lines, posts payments, marks invoices paid; DRU lines flag failures.
