# Admin Billing Recon Hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-layout `/admin/billing` as a **daily cash-match recon hub** (NetCash → CT invoice primary; Zoho Books secondary) so finance can see day-done status and work an exception list without tab-hopping.

**Architecture:** Single page rewrite of `app/admin/billing/page.tsx` plus small presentational components under `components/admin/billing/`. Prefer **one thin hub API** (`GET /api/admin/billing/recon-hub`) that composes existing Supabase tables + patterns from recon status / stats / Zoho health — avoids fragile multi-fetch race logic in the client. Deep-links keep Finance queue, Zoho Books admin, and Payments pages as systems of record for approve/retry.

**Tech Stack:** Next.js 15 App Router, React client page, existing `components/backend` / `components/admin/shared` (PageHeader, StatCard, SectionCard, StatusBadge, AdminPage), Phosphor icons via `react-icons/pi`, admin auth via `authenticateAdmin`, Supabase service client.

**Wayfinder source (decisions locked):** `.scratch/admin-billing-recon-workspace/map.md`  
**Wireframe:** `.scratch/admin-billing-recon-workspace/assets/admin-billing-recon-hub-wireframe.html`

| Decision | Lock |
|----------|------|
| Job | Daily cash match |
| Home | Full hub on `/admin/billing` |
| MVP | Status strip + exception table |
| Day-done | **Zero unmatched NetCash→CT** (red until 0); Zoho lag = yellow |
| Out of MVP | Bulk three-way editor, bulk Zoho retry, CSV, debit-batch UI |

---

## File map

| File | Responsibility |
|------|----------------|
| `app/api/admin/billing/recon-hub/route.ts` | **Create** — windowed hub payload (summary + exceptions) |
| `lib/billing/recon-hub/types.ts` | **Create** — shared request/response types |
| `lib/billing/recon-hub/build-exceptions.ts` | **Create** — pure classifiers for exception rows (unit-tested) |
| `lib/billing/recon-hub/window.ts` | **Create** — parse window → `{ from, to }` ISO bounds (Africa/Johannesburg day optional; use UTC day bounds with documented note if TZ helper missing) |
| `__tests__/lib/billing/recon-hub/build-exceptions.test.ts` | **Create** — pure tests for row classification |
| `__tests__/lib/billing/recon-hub/window.test.ts` | **Create** — window parsing |
| `components/admin/billing/recon/DayDoneBanner.tsx` | **Create** — green/red day-done banner |
| `components/admin/billing/recon/CashMatchStrip.tsx` | **Create** — 4 primary tiles |
| `components/admin/billing/recon/ExceptionTable.tsx` | **Create** — payment-first table + filter chips |
| `components/admin/billing/recon/SecondaryKpis.tsx` | **Create** — compact AR / collected / services |
| `components/admin/billing/recon/DeepLinks.tsx` | **Create** — Finance / Zoho Books / Payments / Invoices |
| `app/admin/billing/page.tsx` | **Rewrite** — compose hub; drop old “recent invoices” as hero |
| `components/admin/layout/AdminHeader.tsx` | **Optional** — title/description if still “Billing & Revenue” only |
| `docs/architecture/BILLING_ENGINE.md` or short note in `docs/admin/` | **Optional** — one paragraph linking hub to recon APIs |

**Do not modify in MVP:** Finance reconciliation page, Zoho Books admin (except deep-link), payment rails, billing engine ledger writers.

---

## Data contract

### Window query

`GET /api/admin/billing/recon-hub?window=today|yesterday|48h`

Default: `yesterday` (matches ops “run recon on yesterday’s cash”).

### Response shape

```typescript
// lib/billing/recon-hub/types.ts
export type ReconWindow = 'today' | 'yesterday' | '48h';

export type ExceptionFilter = 'unmatched_cash' | 'zoho_lag' | 'open_ar' | 'all';

export interface ReconHubSummary {
  window: ReconWindow;
  windowFrom: string; // ISO
  windowTo: string;
  /** Primary day-done metric */
  unmatchedNetcashToCt: number;
  netcashCompletedInWindow: number;
  netcashMatchedInWindow: number;
  zohoPaymentLagCount: number; // pending|failed among matched payments in window
  dayDone: boolean; // unmatchedNetcashToCt === 0
  paynowRecon: {
    lastRunAt: string | null;
    status: 'success' | 'partial' | 'failed' | null;
    durationMs: number;
    unmatchedFromLastRun: number;
  };
  zohoBooks: {
    healthStatus: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
    failedEntityCount: number;
  };
  secondary: {
    openAr: number;
    collectedLast30Days: number;
    activeServices: number;
  };
}

export type ExceptionReasonCode =
  | 'no_ct_invoice'
  | 'paynow_unmatched'
  | 'zoho_payment_pending'
  | 'zoho_payment_failed'
  | 'open_ar';

export interface ReconExceptionRow {
  id: string; // payment id or synthetic unmatched key
  kind: 'payment' | 'paynow_unmatched' | 'invoice_ar';
  date: string; // ISO
  netcashRef: string | null;
  amount: number;
  invoiceId: string | null;
  invoiceNumber: string | null;
  invoiceStatus: string | null;
  zohoStatus: 'n/a' | 'synced' | 'pending' | 'failed' | 'skipped';
  reasonCode: ExceptionReasonCode;
  reasonLabel: string;
  severity: 'red' | 'amber' | 'neutral'; // red = unmatched cash
  href: string | null; // /admin/billing/invoices/{id} or finance queue
}

export interface ReconHubResponse {
  summary: ReconHubSummary;
  exceptions: ReconExceptionRow[];
}
```

### Exception classification rules (pure)

| Condition | severity | reasonCode | filter chips |
|-----------|----------|------------|--------------|
| Completed NetCash payment, no `customer_invoice_id` / invoice link | `red` | `no_ct_invoice` | unmatched_cash, all |
| PayNow recon last-run unmatched detail (even if no payment row) | `red` | `paynow_unmatched` | unmatched_cash, all |
| Payment linked to invoice, `zoho_sync_status` in `pending`,`failed` | `amber` | `zoho_payment_*` | zoho_lag, all |
| Optional: open AR invoices (`sent`/`partial`/`overdue`) with collection method — only if cheap | `neutral` | `open_ar` | open_ar, all |

**Day-done:** `summary.dayDone === true` iff no `severity === 'red'` rows in window (equivalently `unmatchedNetcashToCt === 0`).

### Hub API composition (server)

1. Auth: `authenticateAdmin(request)`.
2. Compute window bounds.
3. Query `payment_transactions` where `provider = 'netcash'` and `completed_at` (or `updated_at` if completed_at null) in window; select invoice + zoho fields.
4. Load recon status (inline same logic as `/api/admin/billing/reconciliation/status` or internal helper extract — **prefer extract shared loader** to avoid drift).
5. Zoho: lightweight counts from `payment_transactions` failed/pending globally or window; health optional (call existing logic or skip full health and only count failed rows — YAGNI).
6. Secondary: reuse patterns from `/api/admin/billing/stats` (open AR sum, collected 30d, active services count).
7. Build exceptions via pure functions; return JSON.

If extract of recon status is too large for one PR: **duplicate the small select** from status route once, leave TODO comment to share later (do not block ship).

---

### Task 1: Pure window + exception helpers (TDD)

**Files:**
- Create: `lib/billing/recon-hub/types.ts`
- Create: `lib/billing/recon-hub/window.ts`
- Create: `lib/billing/recon-hub/build-exceptions.ts`
- Create: `__tests__/lib/billing/recon-hub/window.test.ts`
- Create: `__tests__/lib/billing/recon-hub/build-exceptions.test.ts`

- [ ] **Step 1: Write window tests**

```typescript
// __tests__/lib/billing/recon-hub/window.test.ts
import { resolveReconWindow } from '@/lib/billing/recon-hub/window';

describe('resolveReconWindow', () => {
  const now = new Date('2026-07-30T12:00:00.000Z');

  it('yesterday is the UTC calendar day before now', () => {
    const w = resolveReconWindow('yesterday', now);
    expect(w.from.startsWith('2026-07-29')).toBe(true);
    expect(w.to.startsWith('2026-07-30')).toBe(true);
  });

  it('48h is now minus 48 hours through now', () => {
    const w = resolveReconWindow('48h', now);
    expect(new Date(w.to).getTime()).toBe(now.getTime());
    expect(new Date(w.from).getTime()).toBe(now.getTime() - 48 * 3600 * 1000);
  });
});
```

- [ ] **Step 2: Implement `window.ts` + types; tests pass**

- [ ] **Step 3: Write exception builder tests**

```typescript
// __tests__/lib/billing/recon-hub/build-exceptions.test.ts
import { buildExceptionRows, countUnmatchedCash } from '@/lib/billing/recon-hub/build-exceptions';

describe('buildExceptionRows', () => {
  it('marks completed payment without invoice as red unmatched', () => {
    const rows = buildExceptionRows({
      payments: [{
        id: 'p1',
        status: 'completed',
        provider: 'netcash',
        provider_reference: 'NC-1',
        amount: 450,
        completed_at: '2026-07-29T10:00:00Z',
        customer_invoice_id: null,
        zoho_sync_status: 'pending',
      }],
      paynowUnmatched: [],
      openArInvoices: [],
    });
    expect(rows.some((r) => r.severity === 'red' && r.reasonCode === 'no_ct_invoice')).toBe(true);
    expect(countUnmatchedCash(rows)).toBe(1);
  });

  it('marks linked payment with failed zoho as amber only', () => {
    const rows = buildExceptionRows({
      payments: [{
        id: 'p2',
        status: 'completed',
        provider: 'netcash',
        provider_reference: 'NC-2',
        amount: 450,
        completed_at: '2026-07-29T10:00:00Z',
        customer_invoice_id: 'inv-1',
        invoice_number: 'INV-1',
        invoice_status: 'paid',
        zoho_sync_status: 'failed',
      }],
      paynowUnmatched: [],
      openArInvoices: [],
    });
    const zoho = rows.find((r) => r.id === 'p2');
    expect(zoho?.severity).toBe('amber');
    expect(countUnmatchedCash(rows)).toBe(0);
  });
});
```

- [ ] **Step 4: Implement builders until green**

```bash
npx jest __tests__/lib/billing/recon-hub --ci --forceExit
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/billing/recon-hub __tests__/lib/billing/recon-hub
git commit -m "feat(billing): pure recon-hub window and exception classifiers"
```

---

### Task 2: Hub API route

**Files:**
- Create: `app/api/admin/billing/recon-hub/route.ts`
- Optionally extract: `lib/billing/recon-hub/load-paynow-status.ts` from status route logic

- [ ] **Step 1: Implement GET handler**

```typescript
// Sketch — fill with real Supabase selects matching Task 1 types
export async function GET(request: NextRequest) {
  const authResult = await authenticateAdmin(request);
  if (!authResult.success) return authResult.response;

  const windowParam = (new URL(request.url).searchParams.get('window') || 'yesterday') as ReconWindow;
  const bounds = resolveReconWindow(windowParam, new Date());

  // 1) payments in window (netcash)
  // 2) paynow recon status
  // 3) secondary stats
  // 4) buildExceptionRows(...)
  // 5) return ReconHubResponse
}
```

Rules:
- Use `createClient` from `@/lib/supabase/server` **or** same service-role pattern as `stats/route.ts` — **match the file you copy from**; do not invent a third client style in the same folder without reason. Prefer `stats/route.ts` service-role pattern for aggregations.
- Join invoice fields: either second query `customer_invoices` by ids or select if FK embed exists.
- Cap exceptions list at **100** rows (newest first).
- Auth failures return existing admin 401 pattern.

- [ ] **Step 2: Manual smoke (with env)**

```bash
set -a && source .env.local && set +a
# From logged-in admin session cookie or bearer — if only cookie auth, use browser.
# At minimum: type-check the route and unit tests still pass.
npx jest __tests__/lib/billing/recon-hub --ci --forceExit
```

- [ ] **Step 3: Commit**

```bash
git add app/api/admin/billing/recon-hub lib/billing/recon-hub
git commit -m "feat(billing): recon-hub API for admin cash-match dashboard"
```

---

### Task 3: Presentational components

**Files:**
- Create: `components/admin/billing/recon/DayDoneBanner.tsx`
- Create: `components/admin/billing/recon/CashMatchStrip.tsx`
- Create: `components/admin/billing/recon/ExceptionTable.tsx`
- Create: `components/admin/billing/recon/SecondaryKpis.tsx`
- Create: `components/admin/billing/recon/DeepLinks.tsx`

- [ ] **Step 1: Implement components against `ReconHubResponse` props**

Follow wireframe hierarchy and existing patterns:

```tsx
// DayDoneBanner — use StatusBadge-like styling or plain Tailwind
// dayDone true → green “Cash matched…”
// dayDone false → red “N unmatched NetCash payments need a CT invoice”

// CashMatchStrip — 4 StatCards or custom tiles
// unmatched = primary red/green border
// zoho lag = amber value

// ExceptionTable — chips set filter client-side on props.exceptions
// default chip: unmatched_cash (severity === 'red')
// columns per wireframe; row link href to invoice when present
// “Match…” for unmatched → Link to /admin/finance/reconciliation

// SecondaryKpis — dashed compact strip from summary.secondary

// DeepLinks — 4 outline buttons/cards
// /admin/finance/reconciliation
// /admin/integrations/zoho-books
// /admin/payments/transactions
// /admin/billing/invoices
```

Icons: Phosphor `react-icons/pi` only for UI chrome.

- [ ] **Step 2: Commit**

```bash
git add components/admin/billing/recon
git commit -m "feat(billing): recon hub presentational components"
```

---

### Task 4: Rewrite `/admin/billing` page

**Files:**
- Modify: `app/admin/billing/page.tsx`

- [ ] **Step 1: Replace dashboard fetch**

```tsx
// Fetch GET /api/admin/billing/recon-hub?window=${window}
// State: window, data, loading, error
// Header actions: window select, refresh, trigger recon (POST existing trigger), link invoices
```

Trigger recon: keep calling existing  
`POST /api/admin/billing/reconciliation/trigger` (same as Finance page) then refresh hub.

- [ ] **Step 2: Compose layout order**

1. PageHeader  
2. DayDoneBanner  
3. CashMatchStrip  
4. SecondaryKpis  
5. ExceptionTable  
6. DeepLinks  

Remove as **hero**: old recent invoices / recent payments dual cards (optional: keep a small “Recent paid” link only — not required).

- [ ] **Step 3: Loading / error**

Reuse `LoadingState` / `ErrorState` from `@/components/backend`.

- [ ] **Step 4: Commit**

```bash
git add app/admin/billing/page.tsx
git commit -m "feat(admin): billing home is daily cash-match recon hub"
```

---

### Task 5: Header copy + smoke verification

**Files:**
- Modify if needed: `components/admin/layout/AdminHeader.tsx` (billing title/description)

- [ ] **Step 1: Set billing header description** to something like “Daily cash match · NetCash → invoices → Zoho”

- [ ] **Step 2: Verification**

```bash
npx jest __tests__/lib/billing/recon-hub --ci --forceExit
# scoped type-check on touched files if pre-push requires it
npm run type-check:memory   # or project scoped equivalent if too heavy
```

Manual (staging/prod admin session):

| Check | Expect |
|-------|--------|
| Open `/admin/billing` | Day-done banner + strip + table visible |
| Window = yesterday | Counts change vs today |
| Unmatched > 0 | Banner red; primary tile red |
| Unmatched = 0 | Banner green; dayDone true |
| Zoho lag > 0, unmatched = 0 | Still green day-done; amber tile |
| Match… / Finance link | Lands on recon queue |
| Zoho Books link | Lands on integrations page |
| Trigger recon | Does not 500; refresh updates last run if cron log exists |

- [ ] **Step 3: Commit**

```bash
git add components/admin/layout/AdminHeader.tsx
git commit -m "chore(admin): billing header copy for cash-match hub"
```

---

### Task 6: PR

- [ ] **Step 1: Branch** `feat/admin-billing-recon-hub` from latest `origin/main` in a worktree (git-tree hygiene).

- [ ] **Step 2: Push + PR**

```bash
git push -u origin HEAD
gh pr create --base main --title "feat(admin): billing recon hub for NetCash cash-match" --body "$(cat <<'EOF'
## Summary
Replaces the generic /admin/billing dashboard with a daily cash-match recon hub (wayfinder map admin-billing-recon-workspace).

- Day-done = zero unmatched NetCash→CT
- Status strip + exception table (MVP)
- Zoho lag secondary (yellow)
- Deep-links to Finance queue, Zoho Books, Payments

## Test plan
- [ ] Unit: recon-hub window + exceptions
- [ ] Admin smoke: banner red/green, filters, deep-links
- [ ] Trigger recon + refresh

## Spec / map
- `.scratch/admin-billing-recon-workspace/map.md`
- Wireframe: `.scratch/admin-billing-recon-workspace/assets/admin-billing-recon-hub-wireframe.html`
- Plan: `docs/superpowers/plans/2026-07-30-admin-billing-recon-hub.md`
EOF
)"
```

---

## Non-goals (do not implement in this plan)

- In-page bulk match / bulk Zoho retry  
- Full three-way side-by-side editor  
- Debit-order batch recon UI  
- CSV accountant export  
- Unjani Connect rename filters  
- Changing Finance or Zoho Books pages beyond deep-links  

---

## Self-review (plan writing time)

| Wayfinder / wireframe requirement | Task |
|-----------------------------------|------|
| Daily cash match primary | 2, 4 |
| Full hub on `/admin/billing` | 4 |
| Status strip + exception table | 3, 4 |
| Day-done unmatched NetCash→CT | 1, 2, 3 |
| Zoho secondary yellow | 1, 2, 3 |
| Deep-links | 3 |
| Pure tests for classifiers | 1 |

**Residual risks:**  
- `completed_at` sparse on older payments → fall back to `updated_at` when status=completed.  
- PayNow unmatched list may duplicate payment rows → de-dupe by netcashRef in builder.  
- Empty historical queue does not block hub (unmatched can still come from payment rows + last run details).

---

## Execution handoff

Plan saved to `docs/superpowers/plans/2026-07-30-admin-billing-recon-hub.md`.

**Two execution options:**

1. **Subagent-driven (recommended)** — fresh subagent per task, review between tasks  
2. **Inline** — implement in this session with checkpoints  

Say which approach (or simply **`implement`**) to start.
