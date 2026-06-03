# W5 — Staging E2E Checklist

**Target:** `https://staging.circletel.co.za` (✅ routing fixed 2026-06-03; valid LE cert; eMandate webhook reachable).
**Note:** staging shares the **production** Supabase project — use marked test data and clean up.
**Cron stays OFF** until every check below passes.

---

## Path A — Synthetic pipeline test (no NetCash, runnable now)

Validates our whole pipeline (webhook → activation → invoice routing → batch eligibility) via a
synthetic postback. Does **not** require the Debit Order service key or human signing.

```bash
set -a && source .env.local && set +a && \
  W5_TARGET_URL=https://staging.circletel.co.za npx tsx scripts/w5-debit-order-e2e.ts
```

Asserts: customer_payment_methods active+verified (W1/Gap2) · customer_billing debit_order (W2.1/Gap3) ·
collection-method resolves to debit_order (W2.2/Gap1) · invoice matches the batch eligibility query ·
non-mandated customer does NOT resolve to debit_order. Creates + cleans up all test rows.

---

## Path B — Real NetCash test-account E2E (needs W0 items)

Full real flow incl. DebiCheck signing. Prerequisites (from W0):

- [ ] **W0.1/0.2** Debit Order service contracted + **Debit Order test service key** for account `52340889417`
      (the Pay Now key `7928c6de-…` shown in the dashboard is a *different* service).
- [ ] Set that key as `NETCASH_DEBIT_ORDER_SERVICE_KEY` in **staging** (`/home/circletel/.env.staging`) and
      recreate the staging container (or re-run the deploy workflow).
- [ ] **W0.3** On the test account's **Debit Order / eMandate** service, set the **mandate postback URL** to
      `https://staging.circletel.co.za/api/webhooks/netcash/emandate`.
- [ ] **W0.5** Confirm test-mode batch submit + load report works against the Debit Order key.

Steps:
1. [ ] Register a mandate for a test customer:
       `POST https://staging.circletel.co.za/api/admin/customers/<id>/send-mandate` (B2B/order-less) or via the
       admin order page (B2C). → `emandate_requests` row created, NetCash returns a fileToken.
2. [ ] Customer receives the NetCash test signing link (email/SMS) → sign in test mode (DebiCheck auth).
3. [ ] NetCash POSTs the result → our webhook activates the mandate.
   - [ ] `customer_payment_methods`: method_type='debit_order', is_active, mandate_status='active', encrypted_details.verified=true.
   - [ ] `customer_billing.payment_method='debit_order'`, billing_day set.
   - [ ] **Mandate PDF retained** in `mandate-documents` bucket; `encrypted_details.mandate_pdf_path` set (W4.1).
4. [ ] Generate an invoice with `due_date=today` for that customer → `payment_collection_method='debit_order'` (W2.2);
       confirm **no Pay Now link** was sent for it.
5. [ ] Trigger the debit batch: send Inngest event `billing/debit-orders.requested` (or wait for the 06:00 cron in staging).
       → `debit_order_batches` + `debit_order_batch_items` row for the invoice; NetCash batch submitted/authorised.
6. [ ] A non-mandated customer's invoice still gets the PayNow fallback (no regression).
7. [ ] Record **W0.4** (DebiCheck vs RM) → set `encrypted_details.mandate_type` (W4.3).

---

## Go-live gate

Enable the daily debit cron **only after** Path A is green AND Path B steps 1–6 pass in staging,
AND W0.1–W0.3 are confirmed on the production Debit Order service.
