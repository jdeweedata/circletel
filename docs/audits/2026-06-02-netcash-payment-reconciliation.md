# NetCash Pay Now — Payment Reconciliation & Webhook Audit

**Date:** 2026-06-02
**Author:** Claude Code
**Scope:** Reconcile 3 customer auth records + 7 NetCash payment transactions (supplied by user) against the live Supabase database (`agyjovdugmtopasyvlng`), identify payment-integrity defects, and define a remediation + data-cleanup plan.
**Status:** Findings confirmed against live DB. Code fixes and data cleanup tracked in follow-up sections.

---

## 1. Executive Summary

| # | Finding | Severity | State |
|---|---------|----------|-------|
| 1 | Webhook writes the **NetCash notify URL into `customer_email`** (reads `Extra2`, which holds a URL) | **P0** | 2 rows corrupted in prod |
| 2 | Webhook **signature is never verified** for NetCash Pay Now (header-gated dead path) — unauthenticated POSTs can mark payments succeeded | **P0** | All 16 webhooks `signature_verified=false`, processed anyway |
| 3 | **Two parallel NetCash implementations**; the singular route + its validator are dead code (0 webhooks ever) | **P1** | Confirmed |
| 4 | R899 order payment (real revenue) has **null `customer_id`/`customer_email`** on the transaction despite being invoice-linked | **P2** | 1 row |
| 5 | 3 payment methods marked `token_status=active` + `is_primary` with **null `card_token`** — uncharffeable | **P1** | 3 rows |
| 6 | Ashwyn's two 08-May order payments never produced a webhook | **Investigated** | Not revenue — see §5 |
| 7 | Order webhook branch is **dead for real `CT-PAY-ORD-*` refs** (regex `/^CT-\d{8}-/` never matches) → orders never marked paid by webhook | **P1 (functional)** | Confirmed — see §8 |

**Bottom line on money:** Of the 7 supplied transactions, **only one is real revenue** — the R899 Ozow payment (`CT-20260505-95ppe6nm`) for invoice **INV-2026-00008**, which is correctly recorded as fully `paid`. The remaining six are R1 card-authorization / payment-method-validation charges, not package revenue. **No revenue has been lost.**

---

## 2. Data Sources

- `payment_transactions` — internal transaction ledger
- `payment_webhook_logs` — **live** webhook sink (16 rows; latest 2026-05-29 15:09)
- `payment_webhooks` — **0 rows, ever** (sink for the dead singular route)
- `consumer_orders`, `customer_invoices`, `customer_payment_methods`
- Code: `app/api/payments/netcash/webhook/route.ts` (live), `app/api/payment/netcash/webhook/route.ts` (dead), `lib/payment/netcash-webhook-validator.ts` (dead), `app/api/payment/netcash/initiate/route.ts`

### Which route is live? (empirical)

```
payment_webhook_logs : 16 rows  (latest 2026-05-29)   <- LIVE  (plural /api/payments/…)
payment_webhooks      : 0 rows                          <- DEAD  (singular /api/payment/…)
```

NetCash Pay Now posts notifications to the **account-level notify URL**, which resolves to the **plural** route. All findings and fixes below target the plural route. The singular route, `lib/payment/netcash-webhook-validator.ts`, and `lib/payment/netcash-webhook-processor.ts` have never executed in production.

---

## 3. Transaction Reconciliation (the 7 supplied records)

| # | Date | Ref | Amount | Type | DB status | Linked to | Notes |
|---|------|-----|--------|------|-----------|-----------|-------|
| 1 | 2026-05-06 | `CT-20260505-95ppe6nm` | R899 | Invoice payment | `completed` | INV-2026-00008 (`paid`) | **Real revenue.** `customer_id`/`email` null on txn → backfill (§6) |
| 2 | 2026-05-08 | `PAY-ORD-20260508-5728` | R1 | Card auth (order) | order `pending` | Ashwyn / order ORD-…-5728 | No webhook. Card tokenized OK (method `ddff8c36`). Not revenue |
| 3 | 2026-05-08 | `PAY-ORD-20260508-2875` | R1 | Card auth (order) | order `pending` | Ashwyn / order ORD-…-2875 | No webhook. Not revenue |
| 4 | 2026-05-11 | `CT-PM-VAL-914e4946-…` | R1 | PM validation | `completed` | jeffrey.de.wee | Method stored but `card_token` null (§Finding 5) |
| 5 | 2026-05-19 | `CT-PAY-ORD-20260519-3375-…` | R1 | Card auth (order) | `completed` | ORD-…-3375 (tkmultimedia) | **`customer_email` = notify URL** (corrupt). order still `pending` |
| 6 | 2026-05-29 | `CT-PM-VAL-412b8047-…` | R1 | PM validation | `completed` | raycdfg (Raymund) | Method stored but `card_token` null |
| 7 | 2026-05-29 | `CT-PAY-ORD-20260529-1561-…` | R1 | Card auth (order, declined) | `failed` | ORD-…-1561 (raycdfg) | **`customer_email` = notify URL** (corrupt) |

---

## 4. Findings (detail)

### Finding 1 — `Extra2` (notify URL) written into `customer_email` — P0

**Location:** `app/api/payments/netcash/webhook/route.ts:356`

```ts
customer_email: bodyParsed.Extra2 || null, // NetCash Extra2 for email  <-- WRONG
```

`Extra2` does **not** carry the customer email. For order-payment flows it carries the notify URL
(`https://www.circletel.co.za/api/payment/netcash/we…`, truncated to the column width). The real
customer email arrives in `Email` / `CustomerEmail`, which NetCash frequently omits on the notify.

This INSERT branch (line 346–362) only runs as a **fallback** when the webhook can't match an
existing transaction. PM-VAL transactions are pre-created and matched (UPDATE path), so they keep
correct emails — **only order payments corrupt**, because the order flow does not pre-create a
`payment_transactions` row.

**Live impact:** 2 rows corrupted —
`2bdb1f17-603c-4c29-8b52-90fea595572b` (ORD-3375) and `fc21435a-6c7a-44a4-9444-30b8f15c97b9` (ORD-1561).

**Fix:** map `customer_email` from `Email`/`CustomerEmail`, reject non-email values, never `Extra2`. (§ remediation)

### Finding 2 — Signature never verified for NetCash Pay Now — P0

**Location:** `app/api/payments/netcash/webhook/route.ts:134-172`

```ts
if (webhookSecret && signature) {        // signature only present if x-netcash-signature header exists
  signatureVerified = verifyWebhookSignature(...)
  if (!signatureVerified) return 401
} else {
  // No signature verification (webhook secret not configured)  <-- ALWAYS taken
}
```

NetCash Pay Now notifications **do not include an HMAC signature header**, so `signature` is always
empty and the verification branch never runs. Every one of the 16 stored webhooks has
`signature_verified=false`, yet all were processed and several marked invoices/transactions as
completed. An unauthenticated party who knows the endpoint and a plausible reference could POST
`TransactionAccepted=true` and mark an invoice paid.

> ⚠️ **Do not "just turn on" verification.** Because NetCash Pay Now does not sign Pay Now webhooks,
> enabling hard signature rejection would reject **all** live webhooks and break payments. The correct
> hardening is **transaction-existence + amount validation** (only act on a webhook whose reference
> matches a transaction *we* initiated, and whose amount matches), plus retaining the IP allowlist as
> defense-in-depth. This is a design change, tracked separately — not a one-line flip.

### Finding 3 — Duplicate dead NetCash route — P1

`app/api/payment/netcash/initiate/route.ts:96` registers the **singular** notify URL, but production
webhooks land in the **plural** route's table (`payment_webhook_logs`). The singular route
(`payment_webhooks`, 0 rows), `netcash-webhook-validator.ts`, and `netcash-webhook-processor.ts` are
dead. The singular route also hardcodes `signatureValid=true` (`route.ts:412`) — inert but misleading.
**Recommendation:** consolidate on the plural route; delete or clearly deprecate the singular stack.

### Finding 4 — Real-revenue transaction missing customer linkage — P2

`payment_transactions` row `d778c220-8d38-4d5e-baae-950cb247ded7` (R899, `CT-20260505-95ppe6nm`) has
`customer_id=null`, `customer_email=null`, but `invoice_id=3a9a0644…` → INV-2026-00008 (customer
`96cbba3b`, Shaun Robertson). Backfillable from the invoice. (§6)

### Finding 5 — Tokenized methods with null token — P1

Three `customer_payment_methods` rows are `token_status='active'`, `is_active=true`, `is_primary=true`
but have `card_token=null` / `card_masked_number=null` / `last_four='****'`:

| id | customer | verified |
|----|----------|----------|
| `0f1d1466…` | 412b8047 (raycdfg) | 2026-05-29 |
| `f32d111b…` | 914e4946 (jeffrey.de.wee) | 2026-05-11 |
| `ddd040a4…` | 7914e319 (pheello) | 2026-04-06 |

The PM-validation branch (`route.ts:411-432`) inserts the method as `active` even when NetCash returns
no `CardToken`/`MaskedPan`. These methods **cannot be charged**. (Ashwyn's `ddff8c36` is the only one
with a real token — proof the data path *can* work.) **Not auto-fixable** (no source of truth for the
missing tokens); requires re-tokenization. Recommend: only mark `active` when a token is actually
present; otherwise `pending`.

---

## 5. Ashwyn "Dropped Payments" — Reconciliation Outcome

The two 08-May R1 charges (`ORD-20260508-5728`, `-2875`) produced **no webhook** in either table and no
`payment_transactions` row. However, Ashwyn's card was **successfully tokenized** on 2026-05-08
(`customer_payment_methods.ddff8c36`, token `408137452`, masked `4483 XXXX XXXX 9809`).

**Conclusion:** these were **card-authorization / tokenization** charges during checkout, not package
payments. The tokenization succeeded via the return/redirect path; the corresponding notify either was
not sent by NetCash for an R1 auth, or was not retried. **No package revenue was due or lost** — both
orders are *correctly* `pending` for their actual package amount. No order-status change is warranted.
Action: none beyond linking the existing token to the order if desired (out of scope for cleanup).

---

## 6. Data Cleanup Plan (Phase 3)

All statements are scoped by primary key. **Run after review.**

```sql
-- 6.1 Backfill real-revenue R899 transaction from its invoice's customer
UPDATE payment_transactions pt
SET customer_id = ci.customer_id,
    customer_email = c.email
FROM customer_invoices ci
JOIN customers c ON c.id = ci.customer_id
WHERE pt.id = 'd778c220-8d38-4d5e-baae-950cb247ded7'
  AND ci.id = '3a9a0644-d491-44fc-ba38-c9407ceff2e2';

-- 6.2 Repair the 2 corrupted customer_email values (URL -> correct order email)
UPDATE payment_transactions SET customer_email = 'info.tkmultimedia@gmail.com'
WHERE id = '2bdb1f17-603c-4c29-8b52-90fea595572b' AND customer_email LIKE 'http%';

UPDATE payment_transactions SET customer_email = 'raycdfg@gmail.com'
WHERE id = 'fc21435a-6c7a-44a4-9444-30b8f15c97b9' AND customer_email LIKE 'http%';
```

> Order→customer backfill for the order-payment transactions is intentionally **excluded**: those
> orders themselves have `customer_id=null` (guest checkouts), so there is no customer to link.

---

## 7. Remediation Status

| Item | Action | Status |
|------|--------|--------|
| Finding 1 (Extra2) | `extractCustomerEmail()` helper (`lib/payments/netcash-webhook-email.ts`) wired into route; 9 unit tests incl. Extra2 regression | ✅ **Done** (type-check clean, tests pass) |
| Finding 2 (signature/auth) | Fail-safe **authorization gate** on the **invoice** mutation: `decideWebhookAction()` (`lib/payments/netcash-webhook-auth.ts`, 7 unit tests) requires amount-sanity vs the invoice before marking paid; mismatches → `manual_review`, no mutation, HTTP 200 | ✅ **Done** (invoice path; branch `feature/netcash-webhook-auth-hardening`) |
| Finding 3 (dead route) | Deprecate/remove singular stack | Recommended |
| Finding 4 (R899 linkage) | Data backfill 6.1 applied — txn `d778c220…` → `96cbba3b` / shaunr07@gmail.com | ✅ **Done** |
| Finding 1 cleanup | 6.2 applied — 2 corrupted URL emails repaired; 0 URL-emails remain | ✅ **Done** |
| Finding 5 (null tokens) | Re-tokenization + insert-guard (only mark `active` when token present) | Recommended |
| Finding 7 (dead order branch) | Fix routing regex + derive order total from `package_price`+fees, then gate — **separate scoped work** (see §8) | Recommended (own branch) |
| Ashwyn | No action (not revenue — card tokenized OK, orders correctly pending) | Closed |

> **Verification of Finding 2 fix:** the decision logic has 7 isolated unit tests (`netcash-webhook-auth.test.ts`) and the wiring is type-checked + peer-reviewed (gate provably precedes the `customer_invoices` update). A live webhook replay was **deliberately not run** because the webhook uses the service-role client against the production database — replaying would mutate real rows and pollute `payment_webhook_logs`. Confidence rests on unit tests + static review, not a prod-mutating replay.
>
> **Pre-existing test debt (not introduced here):** `__tests__/lib/payments/payment-processor.test.ts` and `netcash-provider.test.ts` fail on `main` (broken Supabase mocks — `Cannot read properties of undefined (reading 'from')`). Out of scope; flagged for separate cleanup.

---

## 8. Finding 7 — Order Webhook Branch Is Dead for Real References

The order-payment branch in `app/api/payments/netcash/webhook/route.ts` is gated on
`else if (reference && /^CT-\d{8}-/i.test(reference))`. Real order references arrive as
`CT-PAY-ORD-20260529-1561-<ts>` — after `CT-` comes `PAY`, **not 8 digits**, so the regex never
matches. Consequently `updateOrderFromPayment()` is **never called for real order payments**; they
fall through to the "No invoice or order matched — manual review" warning. This is consistent with the
DB: orders `ORD-20260529-1561`, `ORD-20260519-3375`, `ORD-20260508-5728/2875` all remain
`payment_status='pending'`, `total_paid=0`.

**Security note:** this is a *functional* bug, **not** a security hole — a forged webhook cannot mutate
an order via a branch that never executes for order-shaped references. The Finding 2 authorization gate
was therefore scoped to the **invoice** branch (the only live money-mutation path).

**Recommended separate fix (own branch, with tests):**
1. Correct the order-branch condition to match `CT-PAY-ORD-*` (or route by `normalizeNetcashReference()`
   resolving to a `consumer_orders.payment_reference`).
2. Derive the order's owed amount from `package_price + installation_fee + router_fee + prorata_amount`
   (there is **no** single `total_amount` column on `consumer_orders`).
3. Apply the same `decideWebhookAction()` gate before mutating the order.
