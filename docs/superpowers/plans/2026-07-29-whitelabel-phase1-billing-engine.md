# Whitelabel Phase 1 — Billing Engine Seam Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `lib/billing/engine/` the only writer to billing ledger tables so a full month-cycle (generate → collect → reconcile → credit) runs without developer scripts, with illegal invoice transitions impossible in code.

**Architecture:** Introduce a thin engine façade that consolidates existing writers (`MonthlyInvoiceGenerator`, `CompliantBillingService`, debit/Pay Now paths, payment sync). Domain rules (status machine, amount math, eligibility) live as pure modules; NetCash debit and Pay Now become `CollectionRail` adapters. Crons and admin routes call the engine only. No microservices; no multi-tenant DB; no speculative second payment provider beyond the interface.

**Tech Stack:** Next.js 15 App Router, TypeScript, Supabase (`customer_invoices`, `payment_transactions`, `credit_notes`), Jest (`__tests__/` mirror), existing NetCash services under `lib/payments/`, finance admin under `app/admin/billing` + `app/admin/finance`.

**Spec:** `docs/superpowers/specs/2026-07-09-whitelabel-platform-design.md` §3, §11 Phase 1  
**Prior map:** Session analysis 2026-07-29 (existing `lib/billing/*` vs designed seam)  
**Wayfinder:** `.scratch/whitelabel-phase1-billing-engine/map.md` — **GO-BUILD authorized 2026-07-30**

### Locked decisions (wayfinder — do not reopen mid-build)

| Decision | Lock |
|----------|------|
| Invoice status model | Existing DB statuses only (`draft\|sent\|paid\|partial\|overdue\|cancelled\|voided`); no Phase 1 status migration |
| Cutover | **Delegate-first** façade over existing services |
| Generate authority | Sole path: `billingEngine.generateRecurring` → `MonthlyInvoiceGenerator`; **disable** `generate-invoices` + `generate-invoices-25th`; schedule must cover **all** `billing_day`s (typically daily sole job) |
| CollectionRail | `netcash_debit` + `netcash_paynow` + `netcash_cc_debit`; **`applyPayment` separate**; reuse NetCash limit constants |
| Sole-writer DoD | Façade + CI allowlist; seed from writer inventory; **shrink each PR**; zero-exception not required to close Phase 1 |
| Month-end UI | **No** new Month-end page; existing admin + engine APIs/crons; plan Task 10 **deferred** |
| Ship slices | **PR 1a–1d only** (1e deferred) |

Full answers: map Decisions so far + ticket files under `.scratch/whitelabel-phase1-billing-engine/issues/`.

---

## Global Constraints

- Work in an isolated worktree branch off latest `origin/main`, e.g. `feat/whitelabel-phase1-billing-engine`. Push after first commit.
- Ship as **multiple PRs** (slices **1a–1d** below). Each PR must leave production billing **behaviourally equivalent or safer** — never a half-cutover where both old and new double-write.
- `npm run type-check:memory` must pass for all files this plan touches (pre-existing errors elsewhere ignored by pre-push scoped check).
- Tests: Jest under `__tests__/lib/billing/engine/…`. Run single file: `npx jest __tests__/lib/billing/engine/state-machine.test.ts`.
- **No new npm dependencies.**
- DB migrations applied **manually** to shared project `agyjovdugmtopasyvlng` (staging/prod share this DB). **No status-enum migration** in Phase 1 — map design language onto existing `valid_invoice_status` values.
- VAT rule (non-negotiable, already production truth): `customer_services.monthly_price` and line item prices for consumer recurring are **VAT-inclusive (gross)**. Use `lib/billing/invoice-amounts.ts` (`computeVatInclusiveAmounts`). Never invent a second VAT path.
- Brand-literal ratchet: do not increase count; use `getTenantConfig()` for any new user-facing strings.
- Do not fix unrelated type errors, dead files, or Zoho feature work (Phase 3).
- Commit messages end with: `Co-Authored-By: Claude <noreply@anthropic.com>` (or the session’s standard trailer).

### Authorized PR slices (GO-BUILD)

| PR | Tasks | Ship criterion |
|----|-------|----------------|
| **1a** | 1–2 | Engine types + state machine + public API stub; zero behaviour change |
| **1b** | 3–4 | Generate + issue/credit via engine; sole generate path; disable daily + 25th BillingService crons (schedule still covers all billing_days) |
| **1c** | 5–6 | CollectionRail (debit + Pay Now + CC) + applyPayment; failure paths via engine |
| **1d** | 7–9, 11 | Writer-boundary ratchet (inventory-seeded allowlist) + simulation harness + docs; **no** Month-end UI |
| **1e** | 10 | **DEFERRED** — Month-end checklist page (wayfinder ticket 09) |

---

## File Map (target end state)

```
lib/billing/
  engine/
    index.ts                 # Public API only — re-exports billingEngine
    types.ts                 # Domain types (status, events, results)
    state-machine.ts         # Pure transition table + assertTransition()
    generate.ts              # Recurring + ad-hoc generate
    issue.ts                 # draft → sent (PDF/send hooks)
    credit.ts                # Credit notes
    collect.ts               # CollectionRail orchestration
    apply-payment.ts         # Webhook/recon payment application
    month-cycle.ts           # Orchestrates generate→collect for admin “run month”
    writer.ts                # Internal Supabase write helpers (ONLY place that mutates ledger tables)
  rails/
    collection-rail.ts       # Interface
    netcash-debit-rail.ts    # Adapter over NetCashDebitBatchService
    netcash-paynow-rail.ts   # Adapter over paynow-billing-service / failed-debit-handler pieces
  policy/
    # Prefer re-export/move of existing pure modules rather than copy:
    # invoice-amounts.ts, billing-eligibility.ts, prorata (single source)
  legacy/                    # Optional thin re-exports during cutover only
```

**Ledger tables owned by the engine (writes only via `engine/writer.ts`):**

- `customer_invoices`
- `payment_transactions` (status mutations tied to invoices)
- `credit_notes` (and credit-note line application fields on invoices)

**Not owned by the engine (side effects / integrations):** Zoho sync, Resend/WhatsApp/SMS, PDF storage helpers (called *after* status transitions), NetCash HTTP (behind rails).

---

## Status mapping (design language ↔ DB)

DB constraint today (`valid_invoice_status`):

`draft | sent | paid | partial | overdue | cancelled | voided`

| Design term (§3) | DB `status` | Notes |
|------------------|-------------|--------|
| draft | `draft` | Editable |
| issued | `sent` | Locked for edit; customer-visible |
| collecting | `sent` (or `overdue`) | Operational; collection attempts live in `payment_transactions` / debit batch rows — **not** a new status in Phase 1 |
| paid | `paid` | |
| failed (collection) | stays `sent` / moves `overdue` | Record failure on invoice tracking fields + payment txn; do not invent `failed` status |
| partial | `partial` | |
| credited | invoice stays; `credit_notes` issued/applied | |
| reconciled | `paid` (or partial) + recon metadata on payment_transactions | No new status |
| cancelled / voided | `cancelled` / `voided` | |

Illegal transitions rejected in `assertTransition()` before any write.

---

### Task 1: Canonical engine types + pure state machine

**Files:**
- Create: `lib/billing/engine/types.ts`
- Create: `lib/billing/engine/state-machine.ts`
- Create: `__tests__/lib/billing/engine/state-machine.test.ts`

**Produces:** `InvoiceDbStatus`, `assertTransition`, `canTransition`, `TRANSITION_TABLE`.

- [ ] **Step 1: Write the failing tests**

Create `__tests__/lib/billing/engine/state-machine.test.ts`:

```typescript
import {
  assertTransition,
  canTransition,
  InvoiceDbStatus,
} from '@/lib/billing/engine/state-machine';

describe('invoice state machine', () => {
  it('allows draft → sent', () => {
    expect(canTransition('draft', 'sent')).toBe(true);
    expect(() => assertTransition('draft', 'sent')).not.toThrow();
  });

  it('allows sent → paid | partial | overdue | cancelled | voided', () => {
    for (const to of ['paid', 'partial', 'overdue', 'cancelled', 'voided'] as InvoiceDbStatus[]) {
      expect(canTransition('sent', to)).toBe(true);
    }
  });

  it('rejects paid → sent (re-open)', () => {
    expect(canTransition('paid', 'sent')).toBe(false);
    expect(() => assertTransition('paid', 'sent')).toThrow(/illegal transition/i);
  });

  it('rejects draft → paid (skip issue)', () => {
    expect(canTransition('draft', 'paid')).toBe(false);
  });

  it('rejects voided → anything', () => {
    expect(canTransition('voided', 'paid')).toBe(false);
  });

  it('allows partial → paid | overdue', () => {
    expect(canTransition('partial', 'paid')).toBe(true);
    expect(canTransition('partial', 'overdue')).toBe(true);
  });

  it('allows overdue → paid | partial | cancelled', () => {
    expect(canTransition('overdue', 'paid')).toBe(true);
    expect(canTransition('overdue', 'partial')).toBe(true);
    expect(canTransition('overdue', 'cancelled')).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL (module missing)**

```bash
npx jest __tests__/lib/billing/engine/state-machine.test.ts
```

- [ ] **Step 3: Implement state machine**

`lib/billing/engine/types.ts`:

```typescript
/** Persisted on customer_invoices.status — must match valid_invoice_status */
export type InvoiceDbStatus =
  | 'draft'
  | 'sent'
  | 'paid'
  | 'partial'
  | 'overdue'
  | 'cancelled'
  | 'voided';

export type InvoiceType =
  | 'recurring'
  | 'installation'
  | 'pro_rata'
  | 'equipment'
  | 'adjustment';

export interface EngineAuditContext {
  user_id?: string;
  user_email?: string;
  source: 'cron' | 'admin' | 'webhook' | 'system' | 'simulation';
  reason?: string;
}
```

`lib/billing/engine/state-machine.ts`:

```typescript
import type { InvoiceDbStatus } from './types';

export type { InvoiceDbStatus };

/** from → allowed to[] */
export const TRANSITION_TABLE: Record<InvoiceDbStatus, readonly InvoiceDbStatus[]> = {
  draft: ['sent', 'cancelled', 'voided'],
  sent: ['paid', 'partial', 'overdue', 'cancelled', 'voided'],
  partial: ['paid', 'partial', 'overdue', 'cancelled', 'voided'],
  overdue: ['paid', 'partial', 'overdue', 'cancelled', 'voided'],
  paid: ['voided'], // refunds/credits handled via credit_notes, not re-open
  cancelled: [],
  voided: [],
} as const;

export function canTransition(from: InvoiceDbStatus, to: InvoiceDbStatus): boolean {
  if (from === to) return true; // idempotent no-op allowed at call sites
  return (TRANSITION_TABLE[from] ?? []).includes(to);
}

export function assertTransition(from: InvoiceDbStatus, to: InvoiceDbStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Illegal invoice transition: ${from} → ${to}`);
  }
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npx jest __tests__/lib/billing/engine/state-machine.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add lib/billing/engine/types.ts lib/billing/engine/state-machine.ts \
  __tests__/lib/billing/engine/state-machine.test.ts
git commit -m "$(cat <<'EOF'
feat(billing): pure invoice state machine for engine seam

Whitelabel Phase 1 foundation — maps design statuses onto
valid_invoice_status DB values.

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Engine public API skeleton + internal writer helper

**Files:**
- Create: `lib/billing/engine/writer.ts`
- Create: `lib/billing/engine/index.ts`
- Create: `lib/billing/engine/billing-engine.ts`
- Create: `__tests__/lib/billing/engine/billing-engine.api.test.ts`
- Create: `docs/architecture/BILLING_ENGINE.md`

**Produces:** `billingEngine` object with method stubs that throw `not implemented` except `assertTransition` re-export. Documents the write boundary.

- [ ] **Step 1: Write API shape test (compile-time + runtime stubs)**

```typescript
// __tests__/lib/billing/engine/billing-engine.api.test.ts
import { billingEngine } from '@/lib/billing/engine';

describe('billingEngine public API', () => {
  it('exposes the Phase 1 method surface', () => {
    expect(typeof billingEngine.generateRecurring).toBe('function');
    expect(typeof billingEngine.generateInvoice).toBe('function');
    expect(typeof billingEngine.issueInvoice).toBe('function');
    expect(typeof billingEngine.applyPayment).toBe('function');
    expect(typeof billingEngine.recordCollectionFailure).toBe('function');
    expect(typeof billingEngine.submitDebitCollection).toBe('function');
    expect(typeof billingEngine.createCreditNote).toBe('function');
    expect(typeof billingEngine.transitionStatus).toBe('function');
  });
});
```

- [ ] **Step 2: Implement skeleton**

`lib/billing/engine/writer.ts` — **only module allowed to call `.from('customer_invoices').insert/update`** once cutover completes. For now implement:

```typescript
import { createClient } from '@/lib/supabase/server';
import { assertTransition, type InvoiceDbStatus } from './state-machine';
import type { EngineAuditContext } from './types';
import { billingLogger } from '@/lib/logging';

export async function updateInvoiceStatus(params: {
  invoiceId: string;
  from: InvoiceDbStatus;
  to: InvoiceDbStatus;
  audit: EngineAuditContext;
  patch?: Record<string, unknown>;
}): Promise<void> {
  assertTransition(params.from, params.to);
  if (params.from === params.to && !params.patch) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from('customer_invoices')
    .update({
      status: params.to,
      ...params.patch,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.invoiceId)
    .eq('status', params.from); // optimistic concurrency on status

  if (error) {
    billingLogger.error('engine.writer.updateInvoiceStatus failed', {
      error: error.message,
      invoiceId: params.invoiceId,
      from: params.from,
      to: params.to,
    });
    throw new Error(`Failed to update invoice status: ${error.message}`);
  }
}
```

`lib/billing/engine/billing-engine.ts` — implement methods as thin wrappers that throw until Tasks 3–6 fill them in, **except** `transitionStatus` which uses `writer.updateInvoiceStatus` after loading current status.

```typescript
import type { EngineAuditContext, InvoiceType } from './types';
import type { InvoiceDbStatus } from './state-machine';
import { updateInvoiceStatus } from './writer';
import { createClient } from '@/lib/supabase/server';
import type { MonthlyBillingOptions, MonthlyBillingResult } from '@/lib/billing/monthly-invoice-generator';

export const billingEngine = {
  async transitionStatus(
    invoiceId: string,
    to: InvoiceDbStatus,
    audit: EngineAuditContext,
    patch?: Record<string, unknown>
  ) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('customer_invoices')
      .select('id, status')
      .eq('id', invoiceId)
      .single();
    if (error || !data) throw new Error(`Invoice not found: ${invoiceId}`);
    await updateInvoiceStatus({
      invoiceId,
      from: data.status as InvoiceDbStatus,
      to,
      audit,
      patch,
    });
  },

  async generateRecurring(_options: MonthlyBillingOptions): Promise<MonthlyBillingResult> {
    throw new Error('billingEngine.generateRecurring not implemented — Task 3');
  },

  async generateInvoice(_params: unknown, _audit?: EngineAuditContext): Promise<unknown> {
    throw new Error('billingEngine.generateInvoice not implemented — Task 3');
  },

  async issueInvoice(_invoiceId: string, _audit?: EngineAuditContext): Promise<unknown> {
    throw new Error('billingEngine.issueInvoice not implemented — Task 4');
  },

  async createCreditNote(_params: unknown, _audit?: EngineAuditContext): Promise<unknown> {
    throw new Error('billingEngine.createCreditNote not implemented — Task 4');
  },

  async submitDebitCollection(_params: unknown, _audit?: EngineAuditContext): Promise<unknown> {
    throw new Error('billingEngine.submitDebitCollection not implemented — Task 5');
  },

  async applyPayment(_params: unknown, _audit?: EngineAuditContext): Promise<unknown> {
    throw new Error('billingEngine.applyPayment not implemented — Task 6');
  },

  async recordCollectionFailure(_params: unknown, _audit?: EngineAuditContext): Promise<unknown> {
    throw new Error('billingEngine.recordCollectionFailure not implemented — Task 6');
  },
};
```

`lib/billing/engine/index.ts`:

```typescript
export { billingEngine } from './billing-engine';
export { assertTransition, canTransition, TRANSITION_TABLE } from './state-machine';
export type { InvoiceDbStatus } from './state-machine';
export type { EngineAuditContext, InvoiceType } from './types';
```

- [ ] **Step 3: Write `docs/architecture/BILLING_ENGINE.md`**

Cover: purpose, status mapping table (copy from plan), public API list, “only writer” rule, which tables, how crons call the engine, link to whitelabel spec §3.

- [ ] **Step 4: Type-check + test + commit**

```bash
npx jest __tests__/lib/billing/engine/
npm run type-check:memory
git add lib/billing/engine docs/architecture/BILLING_ENGINE.md __tests__/lib/billing/engine
git commit -m "$(cat <<'EOF'
feat(billing): engine public API skeleton and status writer

Phase 1a — no production call sites yet.

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

**Ship PR 1a here if desired.**

---

### Task 3: `generateRecurring` + `generateInvoice` (delegate then own writes)

**Files:**
- Create: `lib/billing/engine/generate.ts`
- Modify: `lib/billing/engine/billing-engine.ts`
- Modify: `app/api/cron/generate-monthly-invoices/route.ts`
- Modify: `app/api/admin/customers/[id]/generate-invoice/route.ts` (if present)
- Modify: `app/api/admin/billing/generate-invoices-now/route.ts` — **only after** verifying it should use monthly path; if it still uses `BillingService`, switch to engine.generateRecurring
- Test: `__tests__/lib/billing/engine/generate.test.ts` (unit with mocked supabase or pure orchestration flags)

**Strategy (safe cutover):**

1. First implementation: `billingEngine.generateRecurring(options)` **delegates** to `new MonthlyInvoiceGenerator().generateMonthlyInvoices(options)` with audit logging. Behaviour identical.
2. Primary cron + admin “generate for customer” call `billingEngine.generateRecurring` only.
3. Do **not** yet delete `MonthlyInvoiceGenerator` — it becomes private implementation detail (later move body into `engine/generate.ts`).

- [ ] **Step 1: Wire generateRecurring**

In `billing-engine.ts`:

```typescript
async generateRecurring(options: MonthlyBillingOptions = {}): Promise<MonthlyBillingResult> {
  const { MonthlyInvoiceGenerator } = await import(
    '@/lib/billing/monthly-invoice-generator'
  );
  const generator = new MonthlyInvoiceGenerator();
  return generator.generateMonthlyInvoices(options);
},
```

- [ ] **Step 2: Point monthly cron at engine**

In `app/api/cron/generate-monthly-invoices/route.ts`, replace:

```typescript
import { MonthlyInvoiceGenerator } from '@/lib/billing/monthly-invoice-generator';
// ...
const generator = new MonthlyInvoiceGenerator();
const result = await generator.generateMonthlyInvoices({ ... });
```

with:

```typescript
import { billingEngine } from '@/lib/billing/engine';
// ...
const result = await billingEngine.generateRecurring({
  dryRun,
  billingDay,
  customerId,
  skipZohoSync,
  skipPayNow,
});
```

- [ ] **Step 3: Point single-customer admin generate at engine**

`app/api/admin/customers/[id]/generate-invoice/route.ts` — use `billingEngine.generateRecurring({ customerId: id, ... })` or existing `generateInvoiceForCustomer` exported helper re-exported through engine if that API is cleaner. Prefer one public method:

```typescript
// optional convenience on billingEngine
async generateForCustomer(customerId: string, options?: Omit<MonthlyBillingOptions, 'customerId'>) {
  return this.generateRecurring({ ...options, customerId });
}
```

- [ ] **Step 4: Align admin generate-invoices-now**

Read `app/api/admin/billing/generate-invoices-now/route.ts`. If it uses `BillingService`, change it to `billingEngine.generateRecurring` so there is **one** generate authority for “run billing now”.

- [ ] **Step 5: Manual smoke (dry run)**

```bash
# With .env.local loaded and CRON_SECRET set:
curl -s -X POST "$APP_URL/api/cron/generate-monthly-invoices" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"dryRun":true}'
```

Expected: JSON success with servicesProcessed counts; no inserts when dryRun true.

- [ ] **Step 6: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(billing): route monthly generation through billingEngine

Delegates to MonthlyInvoiceGenerator; single entry for cron/admin.

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Issue + credit notes via engine

**Files:**
- Create: `lib/billing/engine/issue.ts`
- Create: `lib/billing/engine/credit.ts`
- Modify: `lib/billing/engine/billing-engine.ts`
- Modify: `app/api/admin/billing/invoices/[id]/send/route.ts`
- Modify: `app/api/admin/billing/invoices/[id]/void/route.ts`
- Modify: `app/api/admin/billing/credit-notes/route.ts`
- Test: `__tests__/lib/billing/engine/issue.test.ts` — pure tests around transition guards if send path is hard to mock; at minimum test that issueInvoice refuses non-draft via state machine when writer is used

**Strategy:** Delegate to `CompliantBillingService.sendInvoice` / `createCreditNote` / void paths initially, but **status changes must go through `assertTransition`** (either inside refactored compliant service or by engine wrapping after fetch).

- [ ] **Step 1: Implement issueInvoice**

```typescript
// billing-engine.ts
async issueInvoice(invoiceId: string, audit: EngineAuditContext = { source: 'admin' }) {
  const { CompliantBillingService } = await import(
    '@/lib/billing/compliant-billing-service'
  );
  // CompliantBillingService.sendInvoice already requires draft → sent
  return CompliantBillingService.sendInvoice(invoiceId, {
    user_id: audit.user_id,
    user_email: audit.user_email,
    reason: audit.reason,
  });
},
```

- [ ] **Step 2: Implement createCreditNote**

Delegate to `CompliantBillingService` credit-note methods. Ensure original invoice is not illegally re-opened to `draft`.

- [ ] **Step 3: Wire admin routes**

Replace direct `CompliantBillingService` imports in:
- `app/api/admin/billing/invoices/[id]/send/route.ts` → `billingEngine.issueInvoice`
- credit-notes route → `billingEngine.createCreditNote`
- void route → `billingEngine.transitionStatus(id, 'voided', audit)` **or** dedicated `voidInvoice` that uses compliant void logic if it does more than status

- [ ] **Step 4: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(billing): issue and credit-note paths via billingEngine

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

**Ship PR 1b here** after smoke: create draft invoice in admin (or dry-run generate), send, confirm status `sent`.

---

### Task 5: CollectionRail interface + NetCash debit adapter

**Files:**
- Create: `lib/billing/rails/collection-rail.ts`
- Create: `lib/billing/rails/netcash-debit-rail.ts`
- Create: `lib/billing/rails/netcash-paynow-rail.ts`
- Create: `__tests__/lib/billing/rails/netcash-debit-rail.test.ts` (mock NetCashDebitBatchService)
- Modify: `lib/billing/engine/collect.ts` + `billing-engine.submitDebitCollection`

**Interface (exact):**

```typescript
// lib/billing/rails/collection-rail.ts
export type CollectionRailId = 'netcash_debit' | 'netcash_paynow' | 'netcash_cc_debit';

export interface DebitCollectionItem {
  invoiceId: string;
  customerId: string;
  amount: number; // ZAR rands, 2dp
  reference: string;
  // pass-through fields required by NetCashDebitBatchService.DebitOrderItem —
  // map 1:1 when implementing adapter; do not invent parallel shapes
  [key: string]: unknown;
}

export interface CollectionSubmitResult {
  success: boolean;
  batchId?: string;
  fileToken?: string;
  errors: string[];
  raw?: unknown;
}

export interface CollectionRail {
  readonly id: CollectionRailId;
  submitDebitBatch?(
    items: DebitCollectionItem[],
    batchName?: string
  ): Promise<CollectionSubmitResult>;
  sendPayLink?(invoiceId: string): Promise<{ success: boolean; error?: string }>;
}
```

- [ ] **Step 1: Implement netcash-debit-rail wrapping `NetCashDebitBatchService`**

Adapter converts `DebitCollectionItem[]` → existing `DebitOrderItem[]` and calls `submitBatch`. Preserve NetCash limits if already encoded in the service; if limits live only in comments, add explicit guards in the adapter:

```typescript
const MAX_LINE_RANDS = 1500;
const MAX_DAY_RANDS = 20_000;
// reject batch if any line > MAX_LINE_RANDS or sum > MAX_DAY_RANDS
```

(Confirm live NetCash account rules in `lib/payments/netcash-debit-batch-service.ts` before hard-coding — if different constants already exist, **import those**, do not duplicate.)

- [ ] **Step 2: Implement netcash-paynow-rail**

Wrap `processPayNowForInvoice` / `failed-debit-handler` entry points for `sendPayLink`.

- [ ] **Step 3: billingEngine.submitDebitCollection**

```typescript
async submitDebitCollection(
  items: DebitCollectionItem[],
  audit: EngineAuditContext = { source: 'cron' },
  batchName?: string
) {
  const { createNetcashDebitRail } = await import(
    '@/lib/billing/rails/netcash-debit-rail'
  );
  const rail = createNetcashDebitRail();
  return rail.submitDebitBatch!(items, batchName);
},
```

- [ ] **Step 4: Point `app/api/cron/submit-debit-orders/route.ts` at engine**

This file is large (~600+ lines). **Minimal change:** where it currently constructs `NetCashDebitBatchService` and calls `submitBatch`, call `billingEngine.submitDebitCollection` instead. Do not rewrite batch selection SQL in this task.

- [ ] **Step 5: Tests for limit guards + adapter happy path (mocked)**

- [ ] **Step 6: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(billing): CollectionRail + NetCash debit adapter via engine

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: applyPayment + recordCollectionFailure

**Files:**
- Create: `lib/billing/engine/apply-payment.ts`
- Modify: `lib/billing/engine/billing-engine.ts`
- Modify (one vertical first): highest-traffic payment success path — prefer `lib/payments/payment-sync-service.ts` or NetCash webhook handler that marks invoices paid
- Modify: call sites of `failed-debit-handler` to go through `billingEngine.recordCollectionFailure`
- Test: state transitions for payment amounts (pure function tests)

**Payment application rules (implement as pure helper + writer):**

```typescript
export function nextStatusAfterPayment(params: {
  current: InvoiceDbStatus;
  totalAmount: number;
  amountPaidAfter: number;
}): InvoiceDbStatus {
  const { current, totalAmount, amountPaidAfter } = params;
  if (amountPaidAfter <= 0) return current;
  if (amountPaidAfter + 0.001 >= totalAmount) return 'paid';
  return 'partial';
}
```

- [ ] **Step 1: Pure tests for nextStatusAfterPayment**

- [ ] **Step 2: applyPayment implementation**

Load invoice → compute new amount_paid → `assertTransition` → update invoice + insert/update `payment_transactions` via writer helpers. Prefer moving the existing success-path logic from `payment-sync-service` rather than rewriting money math.

- [ ] **Step 3: recordCollectionFailure**

Delegate to existing `failed-debit-handler` after recording failure metadata; ensure it does not set an illegal status.

- [ ] **Step 4: Wire at least one webhook + failed-debit entry**

- [ ] **Step 5: Commit + Ship PR 1c**

```bash
git commit -m "$(cat <<'EOF'
feat(billing): applyPayment and collection failure through engine

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Deprecate legacy generate paths (stop double authority)

**Files:**
- Modify: `app/api/cron/generate-invoices/route.ts`
- Modify: `app/api/cron/generate-invoices-25th/route.ts`
- Modify: `lib/services/service-manager.ts` (if it generates invoices)
- Optionally: `vercel.json` crons — disable or point legacy paths to no-op with log

**Rules:**

1. After Task 3, **monthly** path is canonical for recurring services.
2. Legacy `BillingService` crons either:
   - **A (preferred):** Become thin wrappers that call `billingEngine.generateRecurring({ billingDay: 1|25 })`, or
   - **B:** Return 410/disabled with log if confirmed unused in production crontab (`ops/scheduler/check-drift.sh` + live crontab review).

- [ ] **Step 1: Inventory live cron usage**

```bash
ops/scheduler/check-drift.sh
crontab -l | rg 'generate-invoice|billing|debit'
```

Document which of `generate-invoices`, `generate-invoices-25th`, `generate-monthly-invoices` actually fire.

- [ ] **Step 2: Unify**

Ensure only **one** generate job creates recurring invoices per billing day. Others dry-run log or delegate without double-insert (MonthlyInvoiceGenerator already has duplicate prevention — still avoid dual runners same day).

- [ ] **Step 3: Mark BillingService.generate as deprecated**

Add JSDoc `@deprecated Use billingEngine.generateRecurring / generateInvoice` on class methods that write invoices.

- [ ] **Step 4: Commit**

```bash
git commit -m "$(cat <<'EOF'
refactor(billing): unify recurring generate authority on billingEngine

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Writer-boundary ratchet (CI)

**Files:**
- Create: `scripts/check-billing-writers.sh`
- Create: `.billing-writer-allowlist` (paths allowed to write ledger tables)
- Modify: `.github/workflows/pr-checks.yml` — add job `billing-writer-ratchet`
- Create: `docs/architecture/BILLING_ENGINE.md` section “Allowlist”

**Allowlist (initial — shrink over Tasks 6–7):**

```
lib/billing/engine/
lib/billing/monthly-invoice-generator.ts
lib/billing/compliant-billing-service.ts
lib/billing/billing-service.ts
lib/billing/failed-debit-handler.ts
lib/billing/paynow-billing-service.ts
lib/payments/payment-sync-service.ts
lib/payments/payment-processor.ts
# temporary until fully migrated — remove entries as Tasks complete
```

Script greps for `.from('customer_invoices')` with `.insert` / `.update` / `.upsert` outside allowlist and fails CI.

- [ ] **Step 1: Write script** (mirror `scripts/check-brand-literals.sh` style — exit 1 on violation)

- [ ] **Step 2: Seed allowlist from current grep reality; job must pass on main**

- [ ] **Step 3: After each later PR, remove files from allowlist when migrated**

- [ ] **Step 4: Commit + Ship PR 1d**

```bash
git commit -m "$(cat <<'EOF'
ci: billing ledger writer allowlist ratchet (Phase 1)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: Simulation harness

**Files:**
- Create: `lib/billing/engine/simulation/scenario.ts`
- Create: `lib/billing/engine/simulation/run-month.ts`
- Create: `__tests__/lib/billing/engine/simulation/month-cycle.test.ts`

**Goal:** Replay a synthetic month in pure/in-memory or DB-transaction style and assert ledger invariants.

**Minimum scenario (must implement):**

1. Service A activates mid-month → pro-rata invoice  
2. Service B full month recurring  
3. Payment full on A → status `paid`  
4. Partial payment on B → `partial`  
5. Collection failure on a third invoice → failure recorded, pay-link path invoked (mocked rail)  
6. Credit note on B → balances  
7. **Invariant:** sum(invoice totals − credits) − sum(payments) = outstanding AR for scenario set  
8. **Invariant:** no illegal transitions occurred  

**Implementation approach (YAGNI):**

- Prefer **pure domain simulation** first: feed fake invoice rows through `assertTransition` + `nextStatusAfterPayment` + amount helpers without live Supabase if full DB fixture is too heavy.
- Optional second test: integration against local/supabase with service role — mark `describe.skip` if CI has no DB.

- [ ] **Step 1: Write failing invariant tests**

- [ ] **Step 2: Implement scenario runner**

- [ ] **Step 3: Commit**

```bash
git commit -m "$(cat <<'EOF'
test(billing): synthetic month-cycle simulation harness

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

### Task 10: Finance month-end surface (admin) — DEFERRED

**Status:** Deferred by wayfinder [Month-end admin surface scope](../../../.scratch/whitelabel-phase1-billing-engine/issues/09-month-end-admin-surface.md).  
Do **not** implement a new Month-end page in Phase 1. Success = engine APIs + existing admin/crons without developer scripts.

---

### Task 11: Final verification, allowlist shrink, docs, PR

**Files:**
- Update: `docs/architecture/BILLING_ENGINE.md` (actual call graph)
- Update: `docs/superpowers/specs/2026-07-09-whitelabel-platform-design.md` — only if you add a one-line status note under §11 (optional)
- Update: `.billing-writer-allowlist` — remove fully migrated files
- Update: `docs/audits/` or session notes if billing incidents closed

- [ ] **Step 1: Full automated gate**

```bash
npx jest __tests__/lib/billing/engine __tests__/lib/billing/rails --ci
bash scripts/check-billing-writers.sh
bash scripts/check-brand-literals.sh
npm run type-check:memory
```

- [ ] **Step 2: Production-path smoke checklist**

| Check | How |
|-------|-----|
| Dry-run monthly generate | cron POST dryRun true |
| Single test customer invoice | admin generate |
| Issue/send invoice | admin send |
| Debit batch dry/safe env | only if non-prod credentials |
| Pay Now link on failure | staging |
| Illegal transition rejected | unit tests |

- [ ] **Step 3: Open PR (or final PR 1e)**

```bash
gh pr create --base main \
  --title "feat: whitelabel Phase 1 billing engine seam" \
  --body "$(cat <<'EOF'
## Summary
Implements whitelabel Phase 1 (spec §3 / §11): `lib/billing/engine` as the billing ledger façade, invoice state machine, CollectionRail (NetCash debit + Pay Now), primary cron/admin cutover, writer allowlist ratchet, simulation harness, finance month-end checklist.

## Test plan
- [ ] Jest engine + rails + simulation green
- [ ] check-billing-writers.sh green
- [ ] Monthly generate dryRun on staging
- [ ] Admin send invoice draft→sent
- [ ] No double-generate from legacy crons

## Spec
docs/superpowers/specs/2026-07-09-whitelabel-platform-design.md §3
docs/superpowers/plans/2026-07-29-whitelabel-phase1-billing-engine.md
EOF
)"
```

- [ ] **Step 4: Staging first, then main** per CircleTel deploy rules.

---

## Out of scope (do not do in Phase 1)

- Zoho Inventory / FSM (Phases 3–4 of BSS roadmap)
- Shared multi-tenant SaaS DB
- Replacing NetCash with another bank (interface only)
- Full `/help` MDX center (Phase 4 whitelabel)
- Microservices split
- Migrating every historical Inngest function in one PR (migrate when touched; ratchet prevents new strays)
- Fixing all open security burn-down ops items (keys rotation)

---

## Self-Review Notes (plan writing time)

### Spec coverage (§3)

| Spec requirement | Task |
|------------------|------|
| `lib/billing/engine/` only writer | 2, 8 (ratchet), 3–6 cutover |
| Explicit state machine | 1 |
| CollectionRail + NetCash adapter + limits | 5 |
| Finance workspace month-cycle zero scripts | 10 (+ 3–6) |
| Simulation harness | 9 |

### Deliberate deviations

1. **No new DB statuses** (`collecting`, `reconciled`) in Phase 1 — map to existing `valid_invoice_status` to avoid production CHECK failures. Documented in status mapping table.
2. **Delegate-first cutover** — generators/services stay as implementation; engine is façade first, then allowlist shrinks. Avoids big-bang rewrite risk on live debit.
3. **Multiple PRs** — Phase 0 was one PR; billing is revenue-critical so staged slices 1a–1e.

### Type consistency

- `InvoiceDbStatus` used everywhere (not three competing aliases).
- `EngineAuditContext.source` union fixed.
- `MonthlyBillingOptions` / `MonthlyBillingResult` reused from `monthly-invoice-generator` to avoid parallel option types.
- `billingEngine` method names stable across Tasks 2–6.

### Residual risks

- `submit-debit-orders/route.ts` size — touch only submit call boundary.
- Dual Inngest + cron paths may still both fire if Inngest is re-enabled; document Inngest as dormant; do not activate dual writers.
- Compliant vs monthly VAT display inconsistencies — engine must use `invoice-amounts` for recurring; do not “fix” VAT in Phase 1 beyond using the production-correct helper.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-29-whitelabel-phase1-billing-engine.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks  
2. **Inline Execution** — execute tasks in this session with checkpoints  

Start with **PR 1a (Tasks 1–2)** for zero behaviour risk, then **1b (Tasks 3–4)** for the first production cutover.
