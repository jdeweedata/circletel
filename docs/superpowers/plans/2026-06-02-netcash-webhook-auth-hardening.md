# NetCash Webhook Authorization Hardening — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop the live NetCash webhook from mutating financial state (marking invoices/orders paid) on unauthenticated, unverified, or amount-mismatched requests — without breaking any legitimate live payment flow.

**Architecture:** NetCash Pay Now does **not** HMAC-sign its webhooks, so signature verification can never run and must not be made a hard gate (it would reject every real webhook). Instead we add a **fail-safe authorization gate**: before any money mutation, the webhook must (1) resolve its reference to an entity *we* created (a `customer_invoices` or `consumer_orders` row — both already exist at webhook time, proven empirically), and (2) pass an amount sanity check against that entity (positive, not exceeding what's owed). On failure, the webhook is recorded as `manual_review`, **no financial state is changed**, and we still return HTTP 200 so NetCash does not retry-storm. All decision logic lives in a pure, unit-tested module; the route only fetches data and calls the decider.

**Tech Stack:** Next.js 15 route handler (`app/api/payments/netcash/webhook/route.ts`), Supabase service-role client, Jest + ts-jest.

**Out of scope (documented separately in `docs/audits/2026-06-02-netcash-payment-reconciliation.md`):** Finding 3 (removing the dead singular route stack) and Finding 5 (null-token payment methods). Do not touch those here.

---

## Background facts the implementer must know

- **Live route:** `app/api/payments/netcash/webhook/route.ts` (writes `payment_webhook_logs`). The singular `app/api/payment/netcash/webhook/route.ts` is **dead** (0 webhooks ever) — do not modify it.
- **Reference formats:** NetCash sends e.g. `CT-PAY-ORD-20260529-1561-1780059893449` (order) or `CT-INV2026-00002-...` (invoice). Normalize with `normalizeNetcashReference()` from `lib/payment/netcash-webhook-validator.ts` → `PAY-ORD-20260529-1561`. This already matches `consumer_orders.payment_reference`.
- **Existing matchers:** `matchInvoiceByReference(reference, supabase)` in `lib/billing/invoice-matcher.ts` returns `{ matched, invoice }`. The order branch calls `updateOrderFromPayment(reference, txId, amount)` in `lib/orders/payment-order-updater.ts`.
- **The mutation branches to gate** (current line anchors — re-grep before editing, the file is under active change):
  - Invoice: `matchInvoiceByReference(reference, supabase)` at ~line 473, invoice update at ~line 496.
  - Order: `updateOrderFromPayment(reference, paymentTransaction.id, amount)` at ~line 557.
  - `amount` is parsed at ~line 183: `const amount = parseFloat(String(bodyParsed.Amount || bodyParsed.amount || '0'));`
- **Amounts are in Rands** in this route (e.g. `899.00`, `1.00`). Do not divide by 100 here (that bug belongs to the dead singular route).
- The PM-VAL branch (`txMetadata.type === 'payment_method_validation'`, ~line 382) is a fixed R1 charge and returns early; **leave it unchanged** — it is not a financial-ledger mutation and is already matched by pre-created transaction.

---

## File Structure

- **Create** `lib/payments/netcash-webhook-auth.ts` — pure decision helpers (no DB, no I/O). One responsibility: decide authorize vs manual_review from already-fetched facts.
- **Create** `__tests__/lib/payments/netcash-webhook-auth.test.ts` — unit tests for the pure helpers.
- **Modify** `app/api/payments/netcash/webhook/route.ts` — fetch expected amounts and wrap the invoice and order mutation branches in the gate.

---

## Task 1: Pure authorization-decision module

**Files:**
- Create: `lib/payments/netcash-webhook-auth.ts`
- Test: `__tests__/lib/payments/netcash-webhook-auth.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// __tests__/lib/payments/netcash-webhook-auth.test.ts
import { amountIsSane, decideWebhookAction } from '@/lib/payments/netcash-webhook-auth';

describe('amountIsSane', () => {
  it('accepts a positive amount not exceeding what is owed', () => {
    expect(amountIsSane(899, 899)).toBe(true);   // exact
    expect(amountIsSane(1, 899)).toBe(true);      // valid partial / R1 auth
  });
  it('rejects zero, negative, NaN', () => {
    expect(amountIsSane(0, 899)).toBe(false);
    expect(amountIsSane(-5, 899)).toBe(false);
    expect(amountIsSane(Number.NaN, 899)).toBe(false);
  });
  it('rejects overpayment beyond a 1-cent tolerance', () => {
    expect(amountIsSane(900, 899)).toBe(false);
    expect(amountIsSane(899.005, 899)).toBe(true); // within 1c tolerance
  });
  it('rejects when owed amount is unknown', () => {
    expect(amountIsSane(899, null)).toBe(false);
  });
});

describe('decideWebhookAction', () => {
  it('authorizes when entity matched and amount sane', () => {
    expect(decideWebhookAction({ entityMatched: true, owedAmount: 899, receivedAmount: 899 }))
      .toEqual({ action: 'authorize', reason: expect.any(String) });
  });
  it('routes to manual_review when no entity matched', () => {
    expect(decideWebhookAction({ entityMatched: false, owedAmount: 899, receivedAmount: 899 }).action)
      .toBe('manual_review');
  });
  it('routes to manual_review on amount mismatch', () => {
    expect(decideWebhookAction({ entityMatched: true, owedAmount: 899, receivedAmount: 5000 }).action)
      .toBe('manual_review');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/lib/payments/netcash-webhook-auth.test.ts`
Expected: FAIL — `Cannot find module '@/lib/payments/netcash-webhook-auth'`.

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/payments/netcash-webhook-auth.ts
/**
 * Pure authorization-decision helpers for the NetCash Pay Now webhook.
 *
 * NetCash Pay Now does NOT sign its notify webhooks, so we cannot verify a
 * signature. Instead we fail safe: only mutate financial state when the webhook
 * resolves to an entity we created AND the amount is sane for that entity.
 * No DB or I/O here so this stays unit-testable in isolation.
 */

const CENT = 0.01;

/**
 * An amount is "sane" for a target entity when it is a positive value that does
 * not exceed what is owed (allowing a 1-cent rounding tolerance, and allowing
 * partials / R1 card-authorisations which are < owed).
 */
export function amountIsSane(receivedAmount: number, owedAmount: number | null | undefined): boolean {
  if (owedAmount == null || Number.isNaN(receivedAmount)) return false;
  if (receivedAmount <= 0) return false;
  return receivedAmount <= owedAmount + CENT;
}

export type WebhookAction = 'authorize' | 'manual_review';

export interface DecideInput {
  entityMatched: boolean;
  owedAmount: number | null;
  receivedAmount: number;
}

export function decideWebhookAction(input: DecideInput): { action: WebhookAction; reason: string } {
  if (!input.entityMatched) {
    return { action: 'manual_review', reason: 'reference did not resolve to a known invoice or order' };
  }
  if (!amountIsSane(input.receivedAmount, input.owedAmount)) {
    return {
      action: 'manual_review',
      reason: `amount failed sanity check: received ${input.receivedAmount}, owed ${input.owedAmount}`,
    };
  }
  return { action: 'authorize', reason: 'reference resolved and amount sane' };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/lib/payments/netcash-webhook-auth.test.ts`
Expected: PASS — all cases green.

- [ ] **Step 5: Commit**

```bash
git add lib/payments/netcash-webhook-auth.ts __tests__/lib/payments/netcash-webhook-auth.test.ts
git commit -m "feat(payments): add pure NetCash webhook authorization decider"
```

---

## Task 2: Gate the invoice-payment mutation

**Files:**
- Modify: `app/api/payments/netcash/webhook/route.ts` (invoice branch, ~line 473–552)

- [ ] **Step 1: Add the import**

At the top of the file, alongside the existing `extractCustomerEmail` import:

```ts
import { decideWebhookAction } from '@/lib/payments/netcash-webhook-auth';
```

- [ ] **Step 2: Insert the gate immediately after the invoice is matched**

Locate (re-grep): `const invoiceMatch = await matchInvoiceByReference(reference, supabase);` then the
`if (invoiceMatch.matched && invoiceMatch.invoice) {` block. Immediately inside that `if`, before
`const invoice = invoiceMatch.invoice;` is used to mutate, add:

```ts
          const invoice = invoiceMatch.invoice;

          // AUTHORIZATION GATE: only mutate when amount is sane for this invoice.
          const owed = Number(invoice.amount_due ?? invoice.total_amount ?? 0);
          const decision = decideWebhookAction({
            entityMatched: true,
            owedAmount: owed,
            receivedAmount: amount,
          });
          if (decision.action === 'manual_review') {
            webhookLogger.warn('[Invoice Payment] Blocked — manual review required', {
              reference, invoiceNumber: invoice.invoice_number, amount, owed, reason: decision.reason,
            });
            if (webhookLog) {
              await supabase.from('payment_webhook_logs')
                .update({ status: 'manual_review', success: false, error_message: decision.reason,
                          processing_completed_at: new Date().toISOString() })
                .eq('id', webhookLog.id);
            }
            return NextResponse.json(
              { success: true, message: 'Webhook received; held for manual review', reference },
              { status: 200 }
            );
          }
```

Remove the now-duplicate `const invoice = invoiceMatch.invoice;` line that previously followed the
`if` (there must be exactly one declaration).

- [ ] **Step 3: Type-check**

Run: `node --max-old-space-size=4096 ./node_modules/typescript/bin/tsc --noEmit 2>&1 | grep 'payments/netcash/webhook/route' || echo OK`
Expected: `OK`

- [ ] **Step 4: Commit**

```bash
git add app/api/payments/netcash/webhook/route.ts
git commit -m "feat(payments): gate invoice webhook mutation on amount sanity"
```

---

## Task 3: Gate the order-payment mutation

**Files:**
- Modify: `app/api/payments/netcash/webhook/route.ts` (order branch, ~line 553–569)

- [ ] **Step 1: Add the order import**

At the top of the file:

```ts
import { normalizeNetcashReference } from '@/lib/payment/netcash-webhook-validator';
```

- [ ] **Step 2: Replace the order branch body with a gated version**

Locate (re-grep): the `else if (reference && /^CT-\d{8}-/i.test(reference)) {` branch **and** confirm
whether order references actually match this regex. NOTE: order refs look like
`CT-PAY-ORD-20260529-1561-...` — verify the branch condition that currently routes them (it may be a
different `else if`). Wrap whichever branch calls `updateOrderFromPayment(...)` so that, before the
call, the order is fetched and amount-checked:

```ts
          // AUTHORIZATION GATE for order payments.
          const normalizedRef = normalizeNetcashReference(reference);
          const { data: orderRow } = await supabase
            .from('consumer_orders')
            .select('id, order_number, total_amount, total_paid')
            .eq('payment_reference', normalizedRef)
            .single();

          const owedOrder = orderRow ? Number(orderRow.total_amount ?? 0) : null;
          const orderDecision = decideWebhookAction({
            entityMatched: !!orderRow,
            owedAmount: owedOrder,
            receivedAmount: amount,
          });
          if (orderDecision.action === 'manual_review') {
            webhookLogger.warn('[Order Payment] Blocked — manual review required', {
              reference, normalizedRef, amount, owedOrder, reason: orderDecision.reason,
            });
            if (webhookLog) {
              await supabase.from('payment_webhook_logs')
                .update({ status: 'manual_review', success: false, error_message: orderDecision.reason,
                          processing_completed_at: new Date().toISOString() })
                .eq('id', webhookLog.id);
            }
            return NextResponse.json(
              { success: true, message: 'Webhook received; held for manual review', reference },
              { status: 200 }
            );
          }

          webhookLogger.info('[Payment Processing] Updating order for reference', { reference });
          updateOrderFromPayment(reference, paymentTransaction.id, amount)
            .then((orderResult) => { /* keep existing .then/.catch body unchanged */ });
```

> Confirm `consumer_orders` has a `total_amount` column before relying on it; if the order total lives
> in a different column (e.g. `total` or `monthly_total`), use that. Verify with:
> `select column_name from information_schema.columns where table_name='consumer_orders' and column_name ilike '%total%';`

- [ ] **Step 3: Type-check**

Run: `node --max-old-space-size=4096 ./node_modules/typescript/bin/tsc --noEmit 2>&1 | grep 'payments/netcash/webhook/route' || echo OK`
Expected: `OK`

- [ ] **Step 4: Run the full payments unit suite**

Run: `npx jest __tests__/lib/payments`
Expected: PASS (existing suites + the new auth + email suites).

- [ ] **Step 5: Commit**

```bash
git add app/api/payments/netcash/webhook/route.ts
git commit -m "feat(payments): gate order webhook mutation on order existence + amount sanity"
```

---

## Task 4: Manual replay verification (real webhook payloads)

**Goal:** prove the gate lets real webhooks through and blocks forged/mismatched ones. Uses actual
historical payloads from `payment_webhook_logs.body`.

- [ ] **Step 1: Capture a known-good payload**

Run (Supabase SQL): get the raw body of the successful R899 invoice webhook —
```sql
SELECT body FROM payment_webhook_logs WHERE reference = 'CT-20260505-95ppe6nm' LIMIT 1;
```
Save it as `scratch/webhook-good.txt` (in `.claude/scratch/`, gitignored).

- [ ] **Step 2: Start dev server**

Run: `npm run dev:memory`

- [ ] **Step 3: Replay the good payload**

Run:
```bash
curl -s -X POST http://localhost:3000/api/payments/netcash/webhook \
  -H 'content-type: application/x-www-form-urlencoded' \
  --data @.claude/scratch/webhook-good.txt | jq .
```
Expected: `{"success": true, ... "status": "completed"}` — processed normally (the invoice is already
paid; idempotency or a re-mark to paid is fine). Confirm logs show the gate emitted **authorize**.

- [ ] **Step 4: Replay a forged-amount payload**

Copy the good payload to `.claude/scratch/webhook-forged.txt`, change `Amount` to `5000.00` and
`Reference`/`Extra1` to a real invoice reference. Replay:
```bash
curl -s -X POST http://localhost:3000/api/payments/netcash/webhook \
  -H 'content-type: application/x-www-form-urlencoded' \
  --data @.claude/scratch/webhook-forged.txt | jq .
```
Expected: `{"success": true, "message": "Webhook received; held for manual review", ...}` and the
invoice is **NOT** further modified. Verify with:
```sql
SELECT status, amount_paid FROM customer_invoices WHERE invoice_number = '<that invoice>';
SELECT status, error_message FROM payment_webhook_logs ORDER BY received_at DESC LIMIT 1;
```
Expected: invoice unchanged; latest webhook log `status = 'manual_review'`.

- [ ] **Step 5: Document the result** in `docs/audits/2026-06-02-netcash-payment-reconciliation.md`
(update Finding 2 status to Done) and commit.

```bash
git add docs/audits/2026-06-02-netcash-payment-reconciliation.md
git commit -m "docs(payments): record webhook auth hardening verification"
```

---

## Self-Review Notes

- **Spec coverage:** Finding 2 (signature/auth) is addressed by Tasks 1–4. The "don't break live flow"
  constraint is satisfied because (a) we never hard-reject on missing signature, (b) we resolve against
  invoice/order rows that already exist at webhook time, (c) partial/R1 amounts pass `amountIsSane`.
- **Edge case — order branch condition:** Task 3 Step 2 explicitly flags that order references may not
  match the existing `^CT-\d{8}-` regex; the implementer must confirm the real routing branch before
  wrapping it. This is the highest-risk step — verify against a real `CT-PAY-ORD-*` payload.
- **No migration needed:** `payment_webhook_logs.status` is free-text; `'manual_review'` is a new value,
  not a schema change.
- **Idempotency preserved:** the gate runs after the existing duplicate-check, so replays still short-circuit.
```
