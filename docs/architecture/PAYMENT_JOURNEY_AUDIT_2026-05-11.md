# CircleTel Payment Journey — Security, Correctness & Resilience Audit

**Date**: 2026-05-11
**Auditor**: Claude Opus 4.6 (read-only)
**Scope**: Full payment lifecycle — initiation through reconciliation

---

## Journey Map

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              CIRCLETEL PAYMENT JOURNEY                                   │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  BROWSER                          SERVER                         NETCASH                 │
│  ───────                          ──────                         ───────                 │
│                                                                                          │
│  [Pay Clicked]                                                                           │
│       │                                                                                  │
│       ├──► POST /api/orders/create ──► consumer_orders (pending)                        │
│       │         (auth required)                                                          │
│       │                                                                                  │
│       ├──► POST /api/payment/netcash/initiate ──────────────────────────────────►        │
│       │         ⚠️ NO AUTH CHECK                                                         │
│       │         ⚠️ amount FROM CLIENT (not DB)                                           │
│       │         ← returns { redirectUrl, formData }                                      │
│       │                                                                                  │
│       ├──► Hidden <form> POST ────────────────────────────► [NetCash Gateway]            │
│       │                                                         │                        │
│       │    ┌──── redirect to accept/decline URL ◄───────────────┘                        │
│       │    │                                                                             │
│       │    │     POST /api/payment/netcash/webhook ◄──── async notification              │
│       │    │         ├── validate signature                                               │
│       │    │         ├── check idempotency                                                │
│       │    │         ├── ⚠️ queries `orders` NOT `consumer_orders`                       │
│       │    │         └── update order + email                                             │
│       │    │                                                                             │
│  [Success/Fail page] ◄────┘                                                             │
│                                                                                          │
│  DAILY CRON (payment-reconciliation)                                                     │
│       ├── fetch NetCash statement                                                        │
│       ├── match by reference string                                                      │
│       ├── ⚠️ NO amount verification                                                     │
│       └── mark invoice/order as paid                                                     │
│                                                                                          │
│  eMandATE FLOW (separate path)                                                           │
│       ├── POST /api/payment/emandate/initiate (auth via Bearer token)                    │
│       ├── NetCash Batch File Upload API                                                  │
│       └── Customer receives SMS/email to sign mandate                                    │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Area 1: Payment Initiation Correctness

**Status: CRITICAL**

| Finding | Severity | Location |
|---------|----------|----------|
| Amount from client, not DB | CRITICAL | `initiate/route.ts:88` |
| No idempotency on initiation | CONCERN | `initiate/route.ts` (entire file) |
| Order status update failure doesn't halt flow | CONCERN | `initiate/route.ts:117-126` |

**Evidence**: The `amount` field in the payment initiation request body comes directly from the client (`PaymentStage.tsx:148`: `amount: totalAmount`). The server never verifies this against the order's `package_price` in `consumer_orders`. An attacker can POST any amount (e.g., R0.01) for a valid orderId.

**Recommendation**: After looking up the order at `initiate/route.ts:41`, use `order.package_price` as the payment amount. Reject requests where the client-supplied amount doesn't match.

---

## Area 2: Input Validation

**Status: CONCERN**

| Finding | Severity | Location |
|---------|----------|----------|
| No amount bounds checking | CONCERN | `initiate/route.ts:88` |
| No reference format validation | CONCERN | `initiate/route.ts:59` |
| Card details pass through server | CONCERN | `tokenize/route.ts:17-23` |
| Webhook payload validation present | PASS | `netcash-webhook-validator.ts:195-258` |

**Evidence**: The tokenize endpoint at `tokenize/route.ts:17-23` receives raw card number, CVV, expiry in the request body and passes them server-side. If this endpoint is actively used, card data transits through CircleTel's server, which has PCI DSS implications.

**Recommendation**: Ensure card tokenization uses NetCash's client-side PCI vault SDK so card data never touches CircleTel's backend. If the tokenize endpoint is unused/legacy, remove it.

---

## Area 3: Authentication & Authorization

**Status: CRITICAL**

| Finding | Severity | Location |
|---------|----------|----------|
| No auth on payment initiation | CRITICAL | `initiate/route.ts:8` |
| No auth on process endpoint | CRITICAL | `process/route.ts:4` |
| No auth on tokenize endpoint | CRITICAL | `tokenize/route.ts:4` |
| No ownership check (orderId) | CRITICAL | `initiate/route.ts:41` |
| eMandate has proper auth | PASS | `emandate/initiate/route.ts:50-84` |
| Payment method check has auth | PASS | `method/check/route.ts:8-50` |
| Middleware doesn't protect /api/payment | CONCERN | `middleware.ts` |

**Evidence**: The initiation endpoint uses `createClient()` (service role) at `initiate/route.ts:35` and never calls `getUser()`. Any anonymous HTTP request can initiate a payment for any orderId. The process and tokenize endpoints are similarly unprotected.

**Recommendation**: Add auth to all payment endpoints. At minimum, verify the caller owns the order (customer_id matches authenticated user). The eMandate endpoint is a good reference for the correct pattern.

---

## Area 4: Error Handling

**Status: CONCERN**

| Finding | Severity | Location |
|---------|----------|----------|
| Fire-and-forget compensation | CONCERN | `checkout/page.tsx:273-279` |
| Webhook always returns 200 | PASS | `webhook/route.ts:326-333` |
| Email failures don't break webhook | PASS | `netcash-webhook-processor.ts:118-131` |
| Reconciliation errors not checked after update | CONCERN | `payment-reconciliation/route.ts:230-242` |
| `triggerServiceActivation` is a TODO stub | CONCERN | `netcash-webhook-processor.ts:606-625` |

**Evidence**: When payment initiation fails after order creation, the compensation PATCH at `checkout/page.tsx:273-279` uses `.catch(() => console.error(...))`. If this fails, the order remains in a `pending` state indefinitely — an orphaned order with no cleanup mechanism.

**Recommendation**: Add a periodic cleanup job that detects orders stuck in `pending` with no corresponding payment initiation for >1 hour and marks them as `abandoned`.

---

## Area 5: Race Conditions

**Status: CONCERN**

| Finding | Severity | Location |
|---------|----------|----------|
| No idempotency on initiation | CONCERN | `initiate/route.ts` |
| Webhook has idempotency check | PASS | `webhook/route.ts:143-165` |
| Client-side only double-submit guard | CONCERN | `PaymentStage.tsx` (`isProcessing` state) |
| In-memory rate limit (not distributed) | CONCERN | `webhook/route.ts:36` |

**Evidence**: A user can click "Pay" twice quickly. The only guard is React state `isProcessing` at the client. No server-side idempotency key prevents two payment initiations for the same order. The webhook rate limiter at `webhook/route.ts:36` uses an in-memory Map — it resets on every serverless cold start and doesn't work across instances.

**Recommendation**: Add a DB-level idempotency check in the initiation endpoint: reject if a payment initiation already exists for the orderId within the last 5 minutes. Replace the in-memory webhook rate limiter with a Supabase-based check or accept that it's advisory only.

---

## Area 6: Callback/Notify URL Security

**Status: CRITICAL**

| Finding | Severity | Location |
|---------|----------|----------|
| Webhook signature bypass when secret missing | CRITICAL | `netcash-provider.ts:304-306` |
| `NETCASH_WEBHOOK_SECRET` appears commented out | CRITICAL | `.env.local:47` |
| IP whitelist not enforced (logged, not blocked) | CONCERN | `netcash-webhook-validator.ts:313-317` |
| Signature skipped in dev mode | CONCERN | `netcash-webhook-validator.ts:324` |
| Timing-safe signature comparison | PASS | `netcash-webhook-validator.ts:135-138` |

**Evidence**: In `.env.local`, the webhook secret is commented out (`# NETCASH_WEBHOOK_SECRET=...`). The provider at `netcash-provider.ts:304-306` logs a warning but **returns true** (skips verification) when the secret is empty. The webhook validator at `netcash-webhook-validator.ts:324` also skips signature validation when no signature header is present and `NODE_ENV !== 'development'` — but the main webhook route uses a DB-based config lookup for the secret (`webhook/route.ts:202-220`), adding a second code path. If `get_active_payment_config` returns a null `webhook_secret`, validation passes without signature check.

Additionally, IP whitelisting at `netcash-webhook-validator.ts:313-317` logs unauthorized IPs but the return is commented out — non-NetCash IPs are allowed through.

**Recommendation**: 
1. Uncomment and set `NETCASH_WEBHOOK_SECRET` in production.
2. Make signature verification mandatory (fail-closed, not fail-open).
3. Enforce IP whitelist — uncomment the early return at line 317.

---

## Area 7: State Management

**Status: CRITICAL**

| Finding | Severity | Location |
|---------|----------|----------|
| Webhook queries `orders`, not `consumer_orders` | CRITICAL | `netcash-webhook-processor.ts:78` |
| Order state machine not enforced | CONCERN | `initiate/route.ts:117` |
| localStorage payment persistence | PASS | `PaymentStage.tsx` |

**Evidence**: The webhook processor at `netcash-webhook-processor.ts:78` queries `.from('orders')` for all operations (success, failure, refund, chargeback). The checkout flow creates records in `consumer_orders` (`initiate/route.ts:41`). **This means webhook notifications will never find the order** — `processPaymentSuccess` will always throw "Order not found for reference", and the payment will be logged as failed even though money was collected. Customers pay but their orders stay in "pending" forever. This is almost certainly causing real revenue recognition issues today.

**Recommendation**: Update all queries in `netcash-webhook-processor.ts` from `.from('orders')` to `.from('consumer_orders')`. This is the highest-priority fix.

---

## Area 8: Reconciliation

**Status: CONCERN**

| Finding | Severity | Location |
|---------|----------|----------|
| No amount verification | CONCERN | `payment-reconciliation/route.ts` |
| Reference-only matching | CONCERN | `payment-reconciliation/route.ts` |
| Cron secret protection present | PASS | `payment-reconciliation/route.ts:28-30` |
| No partial payment handling | CONCERN | `payment-reconciliation/route.ts` |

**Evidence**: Reconciliation matches payments to invoices/orders by reference string only. It marks items as fully paid without comparing the payment amount to the invoice amount. A partial payment (or overpayment) is treated identically to a correct payment.

**Recommendation**: Add amount comparison. If `payment_amount < invoice_total`, mark as `partial`. If `payment_amount > invoice_total * 1.01`, flag for manual review.

---

## Area 9: Sensitive Data Exposure

**Status: CRITICAL**

| Finding | Severity | Location |
|---------|----------|----------|
| Service key exposed via `NEXT_PUBLIC_` prefix | CRITICAL | `netcash-provider.ts:107` |
| PCI vault key exposed via `NEXT_PUBLIC_` prefix | CRITICAL | `netcash-provider.ts:108` |
| Hardcoded fallback keys in source | CRITICAL | `netcash-config.ts:29,36` |
| Full request body logged to `payment_audit_logs` | CONCERN | `initiate/route.ts:136` |
| Card data transits server (tokenize endpoint) | CONCERN | `tokenize/route.ts:17-23` |
| Webhook sanitizes card data for logs | PASS | `netcash-webhook-validator.ts:424-437` |

**Evidence**: 
- `NEXT_PUBLIC_NETCASH_SERVICE_KEY` and `NEXT_PUBLIC_NETCASH_PCI_VAULT_KEY` are bundled into client-side JavaScript by Next.js (any `NEXT_PUBLIC_*` env var is). Anyone can view-source or inspect the JS bundle to extract these keys.
- `netcash-config.ts:29` contains hardcoded fallback values: `3143ee79-0c96-4909-968e-5a716fd19a65` (PCI vault key) and `7928c6de-219f-4b75-9408-ea0e53be8c87` (service key). Even if env vars are configured differently, these test keys are in the git repo.

**Recommendation**: 
1. Rename to `NETCASH_SERVICE_KEY` and `NETCASH_PCI_VAULT_KEY` (drop `NEXT_PUBLIC_` prefix) — these are only needed server-side.
2. Remove hardcoded fallback keys from `netcash-config.ts`.
3. Rotate the exposed keys with NetCash immediately.

---

## Area 10: Invoice Generation Atomicity

**Status: CONCERN**

| Finding | Severity | Location |
|---------|----------|----------|
| Reconciliation creates payment_transactions without transaction | CONCERN | `payment-reconciliation/route.ts` |
| Order + payment not atomic | CONCERN | checkout flow (2-step: create order → initiate payment) |
| eMandate rollback on failure | PASS | `emandate/initiate/route.ts:277-278` |

**Evidence**: The reconciliation cron updates invoices, orders, and creates payment_transactions in separate Supabase calls without a transaction. If the process crashes mid-way, an invoice could be marked paid without a corresponding payment_transaction record (or vice versa).

**Recommendation**: Use a Supabase RPC function that wraps the invoice update + payment_transaction insert in a single database transaction.

---

## Summary Matrix

| # | Area | Status | Findings |
|---|------|--------|----------|
| 1 | Payment Initiation | **CRITICAL** | Client-controlled amount, no idempotency |
| 2 | Input Validation | CONCERN | Card data transits server, no amount bounds |
| 3 | Auth & Authorization | **CRITICAL** | 3 endpoints with zero auth, no ownership check |
| 4 | Error Handling | CONCERN | Fire-and-forget compensation, orphaned orders |
| 5 | Race Conditions | CONCERN | Client-only double-submit guard, in-memory rate limit |
| 6 | Callback Security | **CRITICAL** | Signature verification bypass, IP whitelist not enforced |
| 7 | State Management | **CRITICAL** | Webhook queries wrong table — payments never confirmed |
| 8 | Reconciliation | CONCERN | No amount verification, no partial payment handling |
| 9 | Sensitive Data | **CRITICAL** | Service key + PCI vault key exposed to browser |
| 10 | Invoice Atomicity | CONCERN | Non-transactional multi-table updates |

---

## Top 3 Priorities (Risk x Likelihood)

### Priority 1: Webhook queries wrong table (Area 7)
**Risk**: HIGH | **Likelihood**: CERTAIN (happening right now)

`netcash-webhook-processor.ts` queries `.from('orders')` but orders are in `consumer_orders`. **Every webhook notification fails silently.** Payments are collected by NetCash but orders are never confirmed in the database. Customers pay but their orders stay in "pending" forever. This is almost certainly causing real revenue recognition issues today.

**Fix**: Change all `.from('orders')` to `.from('consumer_orders')` in `netcash-webhook-processor.ts` (lines 78, 97, 172, 190, 254, 271, 335, 352). Verify column names match between tables.

### Priority 2: Sensitive keys exposed to browser (Area 9)
**Risk**: HIGH | **Likelihood**: HIGH (keys are in every JS bundle)

`NEXT_PUBLIC_NETCASH_SERVICE_KEY` and `NEXT_PUBLIC_NETCASH_PCI_VAULT_KEY` are compiled into client-side JavaScript. Anyone visiting the site can extract them. Combined with the hardcoded fallback keys in `netcash-config.ts:29,36`, this is a credentials exposure.

**Fix**: Remove `NEXT_PUBLIC_` prefix. Remove hardcoded fallbacks. Rotate keys with NetCash.

### Priority 3: No auth + client-controlled amount (Areas 1 + 3)
**Risk**: HIGH | **Likelihood**: MEDIUM (requires knowledge of the API)

An unauthenticated attacker can call `/api/payment/netcash/initiate` with any orderId and any amount. They could initiate a R0.01 payment for a R999 order. Combined with the webhook table mismatch (Priority 1), the order would never be confirmed anyway — but once the webhook is fixed, this becomes exploitable.

**Fix**: Add authentication. Verify amount against `consumer_orders.package_price`. Add server-side idempotency.

---

*End of audit. No files were modified.*
