# Admin Operations Preview with Production Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a staging-only, admin-authenticated, permission-gated `/admin/operations-preview` that renders the approved CircleTel operations prototype with live, PII-free production aggregates and no mutation paths.

**Architecture:** A server-only Supabase reader fetches minimal, paginated production fields and passes them through pure aggregation functions into one typed response. A GET-only API owns the runtime flag, auth/RBAC, timeout, request ID, and no-store headers; the full-screen client owns loading/error/retry states and renders a selectively ported, interaction-contained prototype. The current staging admin shell remains authoritative and gains one explicit auth-guarded full-screen route policy.

**Tech Stack:** Next.js 15 App Router, React, TypeScript, Supabase/PostgREST, shadcn/ui, Recharts, Geist, Jest, React Test Renderer.

**Spec:** `docs/superpowers/specs/2026-07-13-operations-preview-production-data-design.md`

---

## Global constraints

- Execute in `/home/circletel/.worktrees/staging-operations-preview` on `codex/staging-operations-preview`, based on `origin/staging` at `75ee7dec`.
- Selectively port from `/home/circletel/.worktrees/codex-dashboard-prototype` at `7c141bef`; do not merge that branch.
- Do not modify `/admin/dashboard`, add a migration/RPC, expose the service-role key, or add a mutation endpoint.
- The response contains no names, contacts, addresses, subjects, descriptions, notes, record numbers, or source row objects.
- `OPERATIONS_PREVIEW_ENABLED` is server-only and must equal `true`; missing/false returns 404 before auth/data access.
- Require an active admin plus `PERMISSIONS.DASHBOARD.VIEW_ANALYTICS`; export `GET` only.
- Every response gets `Cache-Control: private, no-store, max-age=0`, `Pragma: no-cache`, and `X-Request-Id`.
- Database failure, parse failure, or timeout returns all-or-nothing 503. Never substitute zeros, fixtures, partial data, or stale data.
- Use `Africa/Johannesburg` boundaries and integer cents.
- Use `apply_patch`, TDD, and one commit per task.
- During execution dispatch one fresh subagent per task, then run requirements and code-quality reviews before advancing.

## File map

| File | Responsibility |
|---|---|
| `lib/admin/operations-preview/types.ts` | PII-free response and minimal internal row types. |
| `lib/admin/operations-preview/aggregate.ts` | Johannesburg windows, money conversion, pure metrics. |
| `lib/admin/operations-preview/read.ts` | Server-only paginated Supabase reads. |
| `lib/admin/operations-preview/__tests__/aggregate.test.ts` | Metric, money, and Johannesburg boundary tests. |
| `lib/admin/operations-preview/__tests__/read.test.ts` | Pagination, query error, and orchestration tests. |
| `app/api/admin/operations-preview/route.ts` | Flag, auth/RBAC, timeout, headers, response. |
| `app/api/admin/operations-preview/__tests__/route.test.ts` | 404/401/403/200/503/timeout/no-store/no-PII tests. |
| `app/admin/admin-route-policy.ts` | Pure admin route classification. |
| `app/admin/AdminLayoutClient.tsx` | Auth-guarded full-screen rendering. |
| `app/admin/operations-preview/navigation.ts` | Registry taxonomy and drift guards. |
| `app/admin/operations-preview/interaction.ts` | Navigation containment handlers. |
| `app/admin/operations-preview/__tests__/navigation.test.ts` | Registry coverage and nested href tests. |
| `app/admin/operations-preview/__tests__/interaction.test.ts` | Click/auxiliary/context-menu containment tests. |
| `components/ui/sidebar.tsx` | Accessible mobile sheet title/description. |
| `app/admin/operations-preview/view-model.ts` | KPI/chart/table formatting. |
| `app/admin/operations-preview/__tests__/view-model.test.ts` | Labels, formatting, and chart-range tests. |
| `app/admin/operations-preview/OperationsDashboard.tsx` | Approved CircleTel dashboard presentation. |
| `app/admin/operations-preview/__tests__/OperationsDashboard.test.tsx` | Read-only badge/action component tests. |
| `app/admin/operations-preview/OperationsPreviewClient.tsx` | Loading/redirect/forbidden/unavailable/retry/success. |
| `app/admin/operations-preview/__tests__/OperationsPreviewClient.test.tsx` | Client-state component tests. |
| `app/admin/operations-preview/page.tsx` | Runtime page gate and Geist wrapper. |
| `app/admin/operations-preview/__tests__/page.test.tsx` | Flag-off 404 and flag-on render tests. |
| `.env.example` | Disabled, server-only flag documentation. |

---

### Task 1: Typed contract and pure aggregation

**Files:**
- Create: `lib/admin/operations-preview/types.ts`
- Create: `lib/admin/operations-preview/aggregate.ts`
- Test: `lib/admin/operations-preview/__tests__/aggregate.test.ts`

- [ ] **Step 1: Write the failing aggregate tests**

~~~~ts
import { aggregateOperationsPreview, buildJohannesburgMonthWindows, moneyToCents } from '../aggregate';

describe('operations preview aggregation', () => {
  it('deduplicates customers while summing every active service', () => {
    const data = aggregateOperationsPreview({
      activeServices: [
        { customer_id: 'c1', monthly_price: '499.00' },
        { customer_id: 'c1', monthly_price: 250 },
        { customer_id: 'c2', monthly_price: '799.99' },
      ],
      unresolvedIncidents: [{ affected_customer_count: 3 }, { affected_customer_count: null }],
      invoices: [], customerCounts: Array.from({ length: 12 }, (_, i) => i + 1),
      openTickets: 8, needsAttention: 4, scheduledInstalls: 2,
      ordersInProgress: 17, availableTechnicians: 1,
    }, new Date('2026-07-13T10:00:00.000Z'));

    expect(data.kpis).toEqual(expect.objectContaining({
      activeCustomers: 2, activeMrrCents: 154899, openTickets: 8,
      needsAttention: 4, networkIncidents: 2, servicesImpacted: 3,
    }));
  });

  it('excludes voided and cancelled invoices', () => {
    const data = aggregateOperationsPreview({
      activeServices: [], unresolvedIncidents: [], customerCounts: Array(12).fill(0),
      openTickets: 0, needsAttention: 0, scheduledInstalls: 0,
      ordersInProgress: 0, availableTechnicians: 0,
      invoices: [
        { invoice_date: '2026-07-01', total_amount: '100', amount_paid: '60', amount_due: '40', status: 'partial' },
        { invoice_date: '2026-07-02', total_amount: '500', amount_paid: '0', amount_due: '500', status: 'voided' },
        { invoice_date: '2026-07-03', total_amount: '75', amount_paid: '75', amount_due: '0', status: 'paid' },
      ],
    }, new Date('2026-07-13T10:00:00.000Z'));

    expect(data.finance).toEqual(expect.objectContaining({
      billedCents: 17500, collectedCents: 13500, outstandingCents: 4000, paidInvoices: 1,
    }));
    expect(data.growth.at(-1)?.billedCents).toBe(17500);
  });

  it('rolls month at Johannesburg midnight', () => {
    expect(buildJohannesburgMonthWindows(new Date('2026-07-31T21:59:59Z')).at(-1)?.key).toBe('2026-07');
    expect(buildJohannesburgMonthWindows(new Date('2026-07-31T22:00:00Z')).at(-1)?.key).toBe('2026-08');
  });

  it('rejects invalid money instead of creating false zero', () => {
    expect(() => moneyToCents('not-money')).toThrow('Invalid monetary value');
  });
});
~~~~

- [ ] **Step 2: Run the test and confirm missing-module failure**

~~~~bash
npx jest lib/admin/operations-preview/__tests__/aggregate.test.ts --runInBand
~~~~

Expected: FAIL because the modules do not exist.

- [ ] **Step 3: Add the exact public contract**

~~~~ts
export const OPERATIONS_PREVIEW_TIME_ZONE = 'Africa/Johannesburg' as const;
export type MoneyValue = string | number;
export type ActiveServiceRow = { customer_id: string; monthly_price: MoneyValue };
export type IncidentRow = { affected_customer_count: number | null };
export type InvoiceRow = {
  invoice_date: string; total_amount: MoneyValue; amount_paid: MoneyValue;
  amount_due: MoneyValue; status: string;
};

export interface OperationsPreviewData {
  generatedAt: string; source: 'production'; timeZone: typeof OPERATIONS_PREVIEW_TIME_ZONE;
  kpis: { activeCustomers: number; activeMrrCents: number; openTickets: number;
    needsAttention: number; networkIncidents: number; servicesImpacted: number };
  growth: Array<{ month: string; label: string; totalCustomers: number; billedCents: number }>;
  operations: { scheduledInstalls: number; ordersInProgress: number;
    priorityTickets: number; availableTechnicians: number };
  finance: { periodStart: string; periodEnd: string; billedCents: number;
    collectedCents: number; outstandingCents: number; paidInvoices: number };
}

export type OperationsPreviewSuccess = { success: true; data: OperationsPreviewData };
export type OperationsPreviewFailure = { success: false; error: string;
  code?: 'OPERATIONS_PREVIEW_DATA_UNAVAILABLE'; requestId?: string };
~~~~

- [ ] **Step 4: Implement pure aggregation**

Use a fixed Johannesburg offset (`2 * 60 * 60 * 1000`; UTC+2 year-round), 12 end-exclusive month windows, and:

~~~~ts
export function moneyToCents(value: MoneyValue): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) throw new Error('Invalid monetary value: ' + String(value));
  return Math.round(parsed * 100);
}
~~~~

`aggregateOperationsPreview(input, now)` validates 12 non-negative customer counts, deduplicates customer IDs, sums every service, excludes `voided`/`cancelled`, returns current-month finance, and maps `needsAttention` to `operations.priorityTickets`.

- [ ] **Step 5: Run and commit**

~~~~bash
npx jest lib/admin/operations-preview/__tests__/aggregate.test.ts --runInBand
git add lib/admin/operations-preview
git commit -m "feat: define operations preview aggregates"
~~~~

Expected: PASS, then one domain commit.

---

### Task 2: Minimal paginated production reader

**Files:**
- Create: `lib/admin/operations-preview/read.ts`
- Test: `lib/admin/operations-preview/__tests__/read.test.ts`

- [ ] **Step 1: Write failing pagination tests**

~~~~ts
import { collectPages } from '../read';

it('reads beyond PostgREST 1000-row default', async () => {
  const rows = Array.from({ length: 1005 }, (_, id) => ({ id }));
  const load = jest.fn(async (from: number, to: number) => ({
    data: rows.slice(from, to + 1), error: null,
  }));
  await expect(collectPages(load, 1000)).resolves.toHaveLength(1005);
  expect(load).toHaveBeenCalledTimes(2);
});

it('rejects when page two fails', async () => {
  const load = jest.fn()
    .mockResolvedValueOnce({ data: Array(1000).fill({ id: 1 }), error: null })
    .mockResolvedValueOnce({ data: null, error: { message: 'database unavailable' } });
  await expect(collectPages(load, 1000)).rejects.toThrow('database unavailable');
});
~~~~

Also inject a repository returning the approved data shape and assert `readOperationsPreview({ repository, now })` calls every repository method and returns its aggregate.

- [ ] **Step 2: Run and confirm failure**

~~~~bash
npx jest lib/admin/operations-preview/__tests__/read.test.ts --runInBand
~~~~

Expected: FAIL because `read.ts` does not exist.

- [ ] **Step 3: Implement the server-only repository boundary**

Start with `import 'server-only'` and define:

~~~~ts
export interface OperationsPreviewRepository {
  getActiveServices(): Promise<ActiveServiceRow[]>;
  countOpenTickets(): Promise<number>;
  countPriorityTickets(): Promise<number>;
  getUnresolvedIncidents(): Promise<IncidentRow[]>;
  getCustomerCounts(monthEndExclusiveIso: string[]): Promise<number[]>;
  getInvoices(startDate: string, endDateExclusive: string): Promise<InvoiceRow[]>;
  countScheduledInstalls(today: string): Promise<number>;
  countOrdersInProgress(): Promise<number>;
  countAvailableTechnicians(): Promise<number>;
}
~~~~

Use exact table contracts:

~~~~text
customer_services: id,customer_id,monthly_price; status=active; paged/order id
outage_incidents: id,affected_customer_count; status!=resolved; resolved_at null; paged/order id
customer_invoices: id,invoice_date,total_amount,amount_paid,amount_due,status;
  12-month date range; status not in voided/cancelled; paged/order invoice_date then id
support_tickets open count: status in open,pending,in_progress
support_tickets priority count: same statuses plus priority in high,urgent
customers cumulative counts: created_at < each month-end-exclusive ISO
installation_schedules count: status in scheduled,rescheduled and scheduled_date >= Johannesburg today
consumer_orders count: status not in active,suspended,cancelled,failed
technicians count: is_active=true and status=available
~~~~

For counts use `{ count: 'exact', head: true }`; null count or error throws. Run independent reads with `Promise.all`. Create the service client only in the default repository path.

- [ ] **Step 4: Run and commit**

~~~~bash
npx jest lib/admin/operations-preview/__tests__/aggregate.test.ts lib/admin/operations-preview/__tests__/read.test.ts --runInBand
git add lib/admin/operations-preview
git commit -m "feat: read production operations aggregates"
~~~~

Expected: PASS, including the 1,005-row test.

---

### Task 3: Protected GET API

**Files:**
- Create: `app/api/admin/operations-preview/route.ts`
- Test: `app/api/admin/operations-preview/__tests__/route.test.ts`

- [ ] **Step 1: Write failing route tests**

Mock auth, permission, and reader. Cover flag-off 404 before auth; 401; permission 403; success 200; reader 503; eight-second timeout 503. Assert every response has:

~~~~ts
expect(response.headers.get('cache-control')).toBe('private, no-store, max-age=0');
expect(response.headers.get('pragma')).toBe('no-cache');
expect(response.headers.get('x-request-id')).toMatch(/^[0-9a-f-]{36}$/);
~~~~

Assert `requirePermission(adminUser, PERMISSIONS.DASHBOARD.VIEW_ANALYTICS)`. Confirm serialized success lacks `email`, `phone`, `address`, `subject`, `description`, `invoice_number`, `order_number`, and `customer_id`.

- [ ] **Step 2: Run and confirm failure**

~~~~bash
npx jest app/api/admin/operations-preview/__tests__/route.test.ts --runInBand
~~~~

Expected: FAIL because the route does not exist.

- [ ] **Step 3: Implement headers and timeout helpers**

~~~~ts
export const OPERATIONS_PREVIEW_TIMEOUT_MS = 8_000;

export function withPrivateNoStore(response: NextResponse, requestId: string) {
  response.headers.set('Cache-Control', 'private, no-store, max-age=0');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('X-Request-Id', requestId);
  return response;
}
~~~~

Use `Promise.race` with a cleared timer. `GET` order is UUID → flag/404 → `authenticateAdmin` → `requirePermission` → timed reader → 200. On error log only request ID, admin UUID, duration, and normalized category; return `OPERATIONS_PREVIEW_DATA_UNAVAILABLE` and request ID. Export no other HTTP method.

- [ ] **Step 4: Run and commit**

~~~~bash
npx jest app/api/admin/operations-preview/__tests__/route.test.ts lib/admin/operations-preview/__tests__ --runInBand
git add app/api/admin/operations-preview lib/admin/operations-preview
git commit -m "feat: expose protected operations preview data"
~~~~

Expected: PASS with no open timer.

---

### Task 4: Auth-guarded full-screen route policy

**Files:**
- Create: `app/admin/admin-route-policy.ts`
- Create: `app/admin/__tests__/admin-route-policy.test.ts`
- Modify: `app/admin/AdminLayoutClient.tsx:31-50,110-146`

- [ ] **Step 1: Write failing route-policy tests**

~~~~ts
import { getAdminRouteMode } from '../admin-route-policy';

describe('getAdminRouteMode', () => {
  it.each(['/admin/login', '/admin/signup', '/admin/forgot-password'])('%s is public', (path) => {
    expect(getAdminRouteMode(path, false)).toBe('public');
  });
  it('preserves the CMS full-screen bypass', () => {
    expect(getAdminRouteMode('/admin/cms/builder/page-1', false)).toBe('full-screen-unguarded');
  });
  it('makes operations preview full-screen and authenticated', () => {
    expect(getAdminRouteMode('/admin/operations-preview', false)).toBe('full-screen-authenticated');
  });
  it('keeps dashboard in the standard shell', () => {
    expect(getAdminRouteMode('/admin/dashboard', false)).toBe('standard');
  });
});
~~~~

- [ ] **Step 2: Run and confirm failure**

~~~~bash
npx jest app/admin/__tests__/admin-route-policy.test.ts --runInBand
~~~~

Expected: FAIL because the policy module does not exist.

- [ ] **Step 3: Implement the pure route policy**

~~~~ts
export type AdminRouteMode =
  | 'public'
  | 'full-screen-unguarded'
  | 'full-screen-authenticated'
  | 'standard';

const PUBLIC_ROUTES = [
  '/admin/login', '/admin/signup', '/admin/forgot-password',
  '/admin/reset-password', '/admin/sales/feasibility/designs',
];
const UNGUARDED_FULL_SCREEN_ROUTES = ['/admin/cms/builder'];
const AUTHENTICATED_FULL_SCREEN_ROUTES = ['/admin/operations-preview'];

export function getAdminRouteMode(pathname: string | null, studio: boolean): AdminRouteMode {
  if (studio || PUBLIC_ROUTES.some((route) => pathname?.startsWith(route))) return 'public';
  if (UNGUARDED_FULL_SCREEN_ROUTES.some((route) => pathname?.startsWith(route))) {
    return 'full-screen-unguarded';
  }
  if (AUTHENTICATED_FULL_SCREEN_ROUTES.some((route) => pathname?.startsWith(route))) {
    return 'full-screen-authenticated';
  }
  return 'standard';
}
~~~~

- [ ] **Step 4: Apply the policy to the existing layout**

Replace the inline route arrays in `AdminLayoutClient` with `routeMode`. Skip `/api/admin/me` only for `public` and `full-screen-unguarded`. Keep the existing loading and no-user guards for `full-screen-authenticated`; after a valid user exists, return children without the normal sidebar/header. Standard routes retain the current shell.

- [ ] **Step 5: Run and commit**

~~~~bash
npx jest app/admin/__tests__/admin-route-policy.test.ts --runInBand
git add app/admin/admin-route-policy.ts app/admin/__tests__/admin-route-policy.test.ts app/admin/AdminLayoutClient.tsx
git commit -m "feat: guard full-screen operations preview"
~~~~

Expected: PASS; CMS and ordinary admin policies remain unchanged.

---

### Task 5: Production navigation taxonomy and containment

**Files:**
- Create: `app/admin/operations-preview/navigation.ts`
- Create: `app/admin/operations-preview/interaction.ts`
- Create: `app/admin/operations-preview/__tests__/navigation.test.ts`
- Create: `app/admin/operations-preview/__tests__/interaction.test.ts`
- Modify: `components/ui/sidebar.tsx:11,193-209`

- [ ] **Step 1: Port the failing prototype regression tests**

Use the exact assertions from:

~~~~text
/home/circletel/.worktrees/codex-dashboard-prototype/app/demo/dashboard/__tests__/navigation.test.ts
/home/circletel/.worktrees/codex-dashboard-prototype/app/demo/dashboard/__tests__/interaction.test.ts
~~~~

Change describe labels to “read-only preview” and rename `createPrototypeNavigationHandlers` to `createPreviewNavigationHandlers`. Preserve the six exact groups, every-visible-item-once assertion, duplicate guard, and nested href checks.

- [ ] **Step 2: Run and confirm missing-module failure**

~~~~bash
npx jest app/admin/operations-preview/__tests__/navigation.test.ts app/admin/operations-preview/__tests__/interaction.test.ts --runInBand
~~~~

Expected: FAIL because the route-local modules do not exist.

- [ ] **Step 3: Port the exact registry adapter and containment helper**

With `apply_patch`, transcribe:

~~~~text
app/demo/dashboard/navigation.ts -> app/admin/operations-preview/navigation.ts
app/demo/dashboard/interaction.ts -> app/admin/operations-preview/interaction.ts
~~~~

Source: prototype commit `7c141bef`. Rename the handler as above. Keep staging's current `lib/admin/feature-registry.ts` untouched so drift checks validate the latest registry.

The containment result remains:

~~~~ts
return {
  onClick: (event) => {
    event.preventDefault();
    onNavigate(label);
    onMobileClose?.();
  },
  onAuxClick: (event) => event.preventDefault(),
  onContextMenu: (event) => event.preventDefault(),
};
~~~~

- [ ] **Step 4: Add mobile sheet semantics**

Import `SheetDescription` and `SheetTitle` in `components/ui/sidebar.tsx` and add before the mobile sheet content:

~~~~tsx
<SheetTitle className="sr-only">Navigation</SheetTitle>
<SheetDescription className="sr-only">
  Open the primary application navigation.
</SheetDescription>
~~~~

This matches the browser-verified prototype patch.

- [ ] **Step 5: Run and commit**

~~~~bash
npx jest app/admin/operations-preview/__tests__/navigation.test.ts app/admin/operations-preview/__tests__/interaction.test.ts --runInBand
git add app/admin/operations-preview/navigation.ts app/admin/operations-preview/interaction.ts app/admin/operations-preview/__tests__ components/ui/sidebar.tsx
git commit -m "feat: contain operations preview navigation"
~~~~

Expected: PASS with every visible production item categorized once.

---

### Task 6: Live-data view model and approved dashboard

**Files:**
- Create: `app/admin/operations-preview/view-model.ts`
- Create: `app/admin/operations-preview/__tests__/view-model.test.ts`
- Create: `app/admin/operations-preview/OperationsDashboard.tsx`
- Create: `app/admin/operations-preview/__tests__/OperationsDashboard.test.tsx`

- [ ] **Step 1: Write failing view-model tests**

Use one complete `OperationsPreviewData` fixture and assert:

~~~~ts
expect(buildKpis(data).map((item) => item.label)).toEqual([
  'Active customers', 'Active MRR', 'Open tickets', 'Network incidents',
]);
expect(buildKpis(data)[1].detail).toBe('Recurring run-rate from active services');
expect(buildKpis(data)[2].status).toBe('8 high or urgent');
expect(buildGrowthSeries(data, '6m')).toEqual(data.growth.slice(-6));
expect(buildGrowthSeries(data, '12m')).toEqual(data.growth);
expect(buildFinanceRows(data).map((row) => row.label)).toEqual([
  'Billed', 'Collected', 'Outstanding', 'Paid invoices',
]);
~~~~

Also assert `formatZar(1244600)` equals the actual `Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' })` result.

- [ ] **Step 2: Run and confirm failure**

~~~~bash
npx jest app/admin/operations-preview/__tests__/view-model.test.ts --runInBand
~~~~

Expected: FAIL because `view-model.ts` does not exist.

- [ ] **Step 3: Implement the presentation boundary**

~~~~ts
export type GrowthRange = '6m' | '12m';
export function formatZar(cents: number): string;
export function formatGeneratedAt(iso: string): string;
export function buildKpis(data: OperationsPreviewData): DashboardKpi[];
export function buildGrowthSeries(
  data: OperationsPreviewData,
  range: GrowthRange
): OperationsPreviewData['growth'];
export function buildOperationsRows(data: OperationsPreviewData): DashboardTableRow[];
export function buildFinanceRows(data: OperationsPreviewData): DashboardTableRow[];
~~~~

Use the exact labels/definitions from spec `6. Do not calculate growth percentages, collection rates, SLA breaches, geography, or “all systems monitored.”

- [ ] **Step 4: Write the failing read-only dashboard test**

Mock `next/image`, Recharts, and the shadcn sidebar primitives as inert React wrappers, then render a complete data fixture. Assert the rendered tree contains `Production data`, `Read-only preview`, `Active MRR`, `Total customers`, and `Billed revenue`. Find the six quick-action buttons plus `Create work item` and assert every one has `disabled: true` and `aria-disabled: 'true'`.

```tsx
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { OperationsDashboard } from '../OperationsDashboard';
import type { OperationsPreviewData } from '@/lib/admin/operations-preview/types';

const DATA: OperationsPreviewData = {
  generatedAt: '2026-07-13T10:00:00.000Z',
  source: 'production',
  timeZone: 'Africa/Johannesburg',
  kpis: { activeCustomers: 25, activeMrrCents: 1244600, openTickets: 8,
    needsAttention: 8, networkIncidents: 0, servicesImpacted: 0 },
  growth: Array.from({ length: 12 }, (_, index) => ({
    month: new Date(Date.UTC(2025, 7 + index, 1)).toISOString().slice(0, 7),
    label: `M${index + 1}`,
    totalCustomers: index + 1,
    billedCents: (index + 1) * 10000,
  })),
  operations: { scheduledInstalls: 2, ordersInProgress: 17,
    priorityTickets: 8, availableTechnicians: 1 },
  finance: { periodStart: '2026-07-01', periodEnd: '2026-07-31',
    billedCents: 100000, collectedCents: 75000, outstandingCents: 25000, paidInvoices: 3 },
};

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />,
}));

it('renders production/read-only labels and disables every workflow action', async () => {
  let renderer!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(
      <OperationsDashboard data={DATA} onRefresh={jest.fn()} isRefreshing={false} />,
    );
  });
  const serialized = JSON.stringify(renderer.toJSON());
  expect(serialized).toContain('Production data');
  expect(serialized).toContain('Read-only preview');
  expect(serialized).toContain('Active MRR');
  expect(serialized).toContain('Total customers');
  expect(serialized).toContain('Billed revenue');
  const disabledActions = renderer.root.findAllByProps({ 'aria-disabled': 'true' });
  expect(disabledActions).toHaveLength(7);
  expect(disabledActions.every((node) => node.props.disabled === true)).toBe(true);
});
```

The inert sidebar mock returns `{ isMobile: false, state: 'expanded', setOpen: jest.fn(), setOpenMobile: jest.fn() }` from `useSidebar`; Recharts primitives render their children.

```bash
npx jest app/admin/operations-preview/__tests__/OperationsDashboard.test.tsx --runInBand
```

Expected: FAIL because `OperationsDashboard.tsx` does not exist.

- [ ] **Step 5: Port and adapt the approved visual component**

Use `app/demo/dashboard/page.tsx` at `7c141bef` as the visual source and create:

~~~~ts
export interface OperationsDashboardProps {
  data: OperationsPreviewData;
  onRefresh: () => void;
  isRefreshing: boolean;
}
~~~~

Apply these exact changes:

- Keep real CircleTel logo assets, white shadcn sidebar, production icons/groups, responsive grid, Recharts, and tabs.
- Replace hardcoded person with “CircleTel operations” and avatar `CT`.
- Show `Production data` and `Read-only preview` badges.
- Delete all mock KPI/chart/table constants; use the view-model functions.
- Offer only 6m/12m because the API has monthly data.
- Label chart `Total customers` and `Billed revenue`; format cents as ZAR.
- Render `generatedAt` and a Refresh control.
- Disable quick actions and “Create work item” with `disabled`, `aria-disabled="true"`, and “Preview only.”
- Keep hrefs inspectable but spread `createPreviewNavigationHandlers` so activation cannot leave the route.

The top-level composition is:

~~~~tsx
<SidebarProvider defaultOpen className="min-h-svh bg-ui-bg" style={sidebarVariables}>
  <OperationsSidebar onNavigate={setContainedMessage} />
  <SidebarInset className="min-w-0 bg-ui-bg">
    <OperationsHeader onRefresh={onRefresh} isRefreshing={isRefreshing} />
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6 xl:p-8">
      <PreviewHeading generatedAt={data.generatedAt} />
      {containedMessage ? <ContainedNavigationAlert message={containedMessage} /> : null}
      <KpiGrid items={buildKpis(data)} />
      <QuickActionsDisabled />
      <AnalyticsGrid data={data} />
    </main>
  </SidebarInset>
</SidebarProvider>
~~~~

- [ ] **Step 6: Run and commit**

~~~~bash
npx jest app/admin/operations-preview/__tests__/view-model.test.ts app/admin/operations-preview/__tests__/OperationsDashboard.test.tsx app/admin/operations-preview/__tests__/navigation.test.ts app/admin/operations-preview/__tests__/interaction.test.ts --runInBand
git add app/admin/operations-preview
git commit -m "feat: render live operations preview dashboard"
~~~~

Expected: PASS and no mock metric exports remain.

---

### Task 7: Client states, page gate, and Geist

**Files:**
- Create: `app/admin/operations-preview/OperationsPreviewClient.tsx`
- Create: `app/admin/operations-preview/__tests__/OperationsPreviewClient.test.tsx`
- Create: `app/admin/operations-preview/page.tsx`
- Create: `app/admin/operations-preview/__tests__/page.test.tsx`
- Modify: `.env.example:214-219`

- [ ] **Step 1: Write failing client-state tests**

Mock `next/navigation` and mock `OperationsDashboard` as a child that prints `data.generatedAt`. With React Test Renderer and `act`, prove:

~~~~ts
it('shows loading before the protected GET resolves');
it('redirects 401 to /admin/login?redirect=/admin/operations-preview');
it('renders Access denied for 403 without dashboard values');
it('renders request ID and Retry for 503, then issues one new GET');
it('passes a successful typed response to OperationsDashboard');
~~~~

Every fetch must be:

~~~~ts
expect(global.fetch).toHaveBeenCalledWith('/api/admin/operations-preview', {
  method: 'GET',
  credentials: 'include',
  cache: 'no-store',
  headers: { Accept: 'application/json' },
});
~~~~

- [ ] **Step 2: Write failing page-gate tests**

Mock `next/navigation.notFound` to throw `NEXT_NOT_FOUND`, and mock `next/font/google.Geist` plus the client component. With the flag absent expect the thrown not-found sentinel. With `OPERATIONS_PREVIEW_ENABLED=true` expect a Geist-wrapped client.

- [ ] **Step 3: Run and confirm failure**

~~~~bash
npx jest app/admin/operations-preview/__tests__/OperationsPreviewClient.test.tsx app/admin/operations-preview/__tests__/page.test.tsx --runInBand
~~~~

Expected: FAIL because the client and page do not exist.

- [ ] **Step 4: Implement the closed fetch-state machine**

~~~~ts
type PreviewState =
  | { status: 'loading' }
  | { status: 'success'; data: OperationsPreviewData }
  | { status: 'forbidden' }
  | { status: 'unavailable'; requestId?: string };
~~~~

On 401 call `router.replace('/admin/login?redirect=/admin/operations-preview')` and retain loading. On 403 render a contained access-denied card. On non-2xx, network failure, or invalid success body render unavailable and preserve only a string request ID. Retry calls the same memoized load callback once; do not poll. During refresh retain the successful dashboard with `isRefreshing=true`, but replace it with unavailable if refresh fails so stale values are not shown as current.

- [ ] **Step 5: Implement the server page**

~~~~tsx
import { Geist } from 'next/font/google';
import { notFound } from 'next/navigation';
import { OperationsPreviewClient } from './OperationsPreviewClient';

export const dynamic = 'force-dynamic';
const geist = Geist({ subsets: ['latin'], display: 'swap' });

export default function OperationsPreviewPage() {
  if (process.env.OPERATIONS_PREVIEW_ENABLED !== 'true') notFound();
  return <div className={geist.className}><OperationsPreviewClient /></div>;
}
~~~~

Add under `.env.example` Feature Flags:

~~~~dotenv
# Server-only admin operations preview; enable only on staging after hidden-route verification
OPERATIONS_PREVIEW_ENABLED=false
~~~~

- [ ] **Step 6: Run all preview tests and commit**

~~~~bash
npx jest lib/admin/operations-preview/__tests__ app/api/admin/operations-preview/__tests__ app/admin/__tests__/admin-route-policy.test.ts app/admin/operations-preview/__tests__ --runInBand
git add app/admin/operations-preview app/admin/AdminLayoutClient.tsx app/admin/admin-route-policy.ts app/admin/__tests__ .env.example
git commit -m "feat: add guarded operations preview route"
~~~~

Expected: all suites PASS.

---

### Task 8: Integrated local verification and visual comparison

**Files:**
- Create: `docs/qa/operations-preview-staging.md`
- Modify only previously listed implementation files if verification finds a defect.

- [ ] **Step 1: Run the focused test gate**

~~~~bash
npx jest lib/admin/operations-preview/__tests__ app/api/admin/operations-preview/__tests__ app/admin/__tests__/admin-route-policy.test.ts app/admin/operations-preview/__tests__ --runInBand
~~~~

Expected: PASS with no leaked timer handles.

- [ ] **Step 2: Run TypeScript validation**

~~~~bash
npm run type-check:memory
~~~~

Expected: exit 0. If staging still has unrelated baseline diagnostics, save the exact output to `/tmp/operations-preview-typecheck.txt`, prove none reference touched files, and report the residual errors instead of claiming the full check passed.

- [ ] **Step 3: Run the production build path**

~~~~bash
npm run build:ci
~~~~

Expected: successful build containing `/admin/operations-preview` and `/api/admin/operations-preview`. The route remains compiled while the runtime flag is false.

- [ ] **Step 4: Start the memory-aware local server**

~~~~bash
OPERATIONS_PREVIEW_ENABLED=true npm run dev:memory -- --hostname 0.0.0.0 --port 3011
~~~~

Expected: `http://localhost:3011` listens. Authenticate through normal admin login; do not add an API development bypass or fixture fallback.

- [ ] **Step 5: Inspect in the user's in-app browser**

At 1440×1000 and 390×844 verify real CircleTel marks, Geist, white icon sidebar, nested production groups, no overflow, read-only badges, generated timestamp, disabled actions, contained navigation, and GET-only network behavior. Verify 403/503 states do not render aggregate values.

- [ ] **Step 6: Perform combined visual comparison**

Capture the final desktop state and compare it in one combined visual input with:

~~~~text
/root/.codex/attachments/5fd0f75c-2d09-4b6b-a084-c93003cae669/codex-clipboard-98be7eba-65e5-45f0-a32b-21f580fbe0c2.png
~~~~

Also compare against the approved `/demo/dashboard` evidence in the prototype worktree. Fix visible spacing, typography, border, radius, overflow, and asset discrepancies; rerun focused tests. Record viewport, evidence paths, checks, and result in `docs/qa/operations-preview-staging.md`.

- [ ] **Step 7: Commit QA evidence and corrections**

~~~~bash
git add app/admin/operations-preview app/admin/AdminLayoutClient.tsx app/admin/admin-route-policy.ts app/api/admin/operations-preview lib/admin/operations-preview components/ui/sidebar.tsx docs/qa/operations-preview-staging.md
git commit -m "test: verify operations preview end to end"
~~~~

Stage only existing task-related paths; if verification produced no code or QA-file change, do not create an empty commit.

---

### Task 9: Staging-first rollout, validation, and rollback proof

**Systems:**
- GitHub PR targeting `staging`
- Server-local `/home/circletel/.env.staging`
- Existing `.github/workflows/deploy-staging.yml` (do not modify)

- [ ] **Step 1: Review the final branch**

~~~~bash
git status --short
git diff --check origin/staging...HEAD
git diff --stat origin/staging...HEAD
git log --oneline origin/staging..HEAD
~~~~

Expected: clean worktree, no whitespace errors, and only design/plan plus scoped implementation/tests/QA.

- [ ] **Step 2: Push and open a staging PR**

~~~~bash
git push -u origin codex/staging-operations-preview
gh pr create --base staging --head codex/staging-operations-preview --title "feat: add read-only operations preview" --body "Staging-only admin operations preview with production aggregates, strict read-only controls, runtime flag, focused tests, and rollback verification."
~~~~

Expected: PR base is `staging`, never `main`.

- [ ] **Step 3: Deploy with the flag absent/false**

After reviews/checks, merge to `staging` without enabling the flag. Monitor:

~~~~bash
gh run list --workflow deploy-staging.yml --branch staging --limit 1
gh run list --workflow deploy-staging.yml --branch staging --limit 1 --json databaseId,status,conclusion,url
~~~~

Expected: the latest run reports `completed`/`success`, the container is healthy, and page/API return generic 404. If it fails, open the returned URL and inspect only the failed step logs before making any code or infrastructure change.

~~~~bash
curl -i https://staging.circletel.co.za/admin/operations-preview
curl -i https://staging.circletel.co.za/api/admin/operations-preview
~~~~

- [ ] **Step 4: Enable only staging and recreate through the existing workflow**

Use `apply_patch` to add exactly this line to `/home/circletel/.env.staging` without printing the file:

~~~~dotenv
OPERATIONS_PREVIEW_ENABLED=true
~~~~

Dispatch the existing workflow so the container reloads runtime environment:

~~~~bash
gh workflow run deploy-staging.yml --ref staging
gh run list --workflow deploy-staging.yml --branch staging --limit 1
~~~~

Expected: healthy deployment. Unauthenticated API now returns 401 with private/no-store and request-ID headers, proving the flag is on and auth remains closed.

- [ ] **Step 5: Validate authenticated staging behavior**

In the user's in-app browser:

1. Sign in as an existing active admin with `dashboard:view_analytics`.
2. Open `https://staging.circletel.co.za/admin/operations-preview`.
3. Confirm `source: production`, current `generatedAt`, 12 growth buckets, and no PII keys.
4. Compare displayed aggregates to an independent read-only production aggregate for the same Johannesburg window; output counts/totals only.
5. Verify `/admin/dashboard` and ordinary admin navigation are unchanged.
6. Verify Refresh issues one GET and no POST/PUT/PATCH/DELETE.
7. If an existing active admin without analytics permission is available, verify the 403 state. Do not change production permissions merely to create this case.

- [ ] **Step 6: Prove rollback**

Set the staging line to:

~~~~dotenv
OPERATIONS_PREVIEW_ENABLED=false
~~~~

Dispatch `deploy-staging.yml` and verify page/API return 404. Re-enable and dispatch once more only if staff should continue evaluating. This proves rollback without code revert or data restoration.

- [ ] **Step 7: Record the operational handoff**

Update `memory-os/short-term/active-tasks.md` and `memory-os/short-term/session-notes.md`, then create `memory-os/short-term/handoffs/2026-07-13-operations-preview-staging.md` with commit/PR/deployment IDs, current flag state, live checks, and residual risks. Do not include credentials, PII, or environment contents.

---

## Completion gate

Do not call the feature complete until:

- Focused Jest suites pass.
- Touched files have no TypeScript diagnostics; full type-check/build outcome is reported exactly.
- Flag-off page/API both return 404.
- Flag-on unauthenticated API returns 401 with no-store/request-ID headers.
- Authorized staging shows current production aggregates with no PII.
- Data failure shows 503/retry, never false zeros or fixtures.
- Browser network inspection shows no mutation from the preview.
- Desktop/mobile combined visual comparison passes.
- `/admin/dashboard` and normal admin navigation remain unchanged.
- Rollback by disabling the flag and recreating staging has been demonstrated.
