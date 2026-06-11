# Product Workspace Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate 8 admin product pages into one Product Workspace at `/admin/products` with shared components, edit drawers, persisted rules config, and hard-cutover redirects.

**Architecture:** Evolve the existing `UnifiedProductConsole` (read-only aggregation over 4 source tables) into a read-write workspace: URL-param state so redirects deep-link into filtered views, a left-rail shell hosting Catalogue / Suppliers / MTN Tools sections (reusing existing section components), an edit drawer hitting existing per-source endpoints, a relationships panel in the detail rail, aggregator cost fix for drafts, and a `product_rules_config` table so Rules Studio thresholds persist. Old routes become `redirect()` pages; superseded components are deleted at the end.

**Tech Stack:** Next.js 15 (App Router, async params), TypeScript, Supabase (project `agyjovdugmtopasyvlng`), Tailwind + `components/backend/` kit, react-icons/pi, Jest (`__tests__/lib/...`).

**Spec:** `docs/superpowers/specs/2026-06-11-product-workspace-design.md`

**Branch:** `feat/product-workspace-phase1` (create from `main`; use a git worktree — the shared checkout has concurrent actors, see memory `unified-product-console.md`).

**Verified facts the plan relies on (do not re-derive):**
- `POST /api/admin/products/[id]/publish` ALREADY enforces rules via `evaluateAdminProductForPublish()` → no work there.
- Edit endpoints: `PATCH /api/admin/products/[id]` → `service_packages` (NOT admin_products); `PATCH /api/hardware/products/[id]` → `circletel_hardware_products` (body passed to `updateHardwareProduct`); `PUT /api/admin/mtn-dealer-products/[id]` → `mtn_dealer_products`. `admin_products` has NO direct update endpoint — its detail rail is publish + cost components only.
- ⚠️ service_packages PATCH treats a `cost_price_zar` body field as `pricing.setup`. NEVER send cost through it. Send `base_price_zar`, `name`, `description`, `featured`, `is_active`, `category` only.
- Draft cost lives in `product_cost_components` (`product_id`, summed by `lib/catalog/publish.ts`); the aggregator currently hardcodes `cost: 0` for admin_products.
- Rules engine: `rulesEngine.evaluateMany(products, configOverrides)` from `@/lib/products/rules`; `RuleConfig` has `marginFloorPct`, `bundleMarginFloorPct`, `mtnDefaultMarkupFloorPct`, `ficaRequiredSources`.
- Backend kit props are strict — see `.claude/rules/admin-shared-components.md` (`StatusBadge` takes `status` not `label`; `StatCard` icon is ReactNode).

---

### Task 1: URL-param codec for workspace state

Pure helpers that map URL search params ⇄ console state, so old-route redirects (`?status=draft`, `?source=hardware`) land on filtered views and views are shareable.

**Files:**
- Create: `lib/products/workspace-params.ts`
- Test: `__tests__/lib/products/workspace-params.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/lib/products/workspace-params.test.ts
import {
  parseWorkspaceParams,
  buildWorkspaceQuery,
  type WorkspaceParams,
} from '@/lib/products/workspace-params';

describe('parseWorkspaceParams', () => {
  it('returns defaults for empty params', () => {
    expect(parseWorkspaceParams(new URLSearchParams())).toEqual({
      section: 'catalogue',
      source: 'all',
      status: 'all',
      search: '',
      sort: 'updated_desc',
      page: 1,
    });
  });

  it('parses redirect-style params from old routes', () => {
    expect(parseWorkspaceParams(new URLSearchParams('status=draft'))).toMatchObject({
      status: 'draft',
    });
    expect(parseWorkspaceParams(new URLSearchParams('source=hardware'))).toMatchObject({
      source: 'Hardware',
    });
    expect(parseWorkspaceParams(new URLSearchParams('source=mtn'))).toMatchObject({
      source: 'MTN / Arlan',
    });
    expect(parseWorkspaceParams(new URLSearchParams('section=suppliers'))).toMatchObject({
      section: 'suppliers',
    });
  });

  it('ignores invalid values', () => {
    const p = parseWorkspaceParams(new URLSearchParams('status=bogus&source=nope&page=-3'));
    expect(p.status).toBe('all');
    expect(p.source).toBe('all');
    expect(p.page).toBe(1);
  });
});

describe('buildWorkspaceQuery', () => {
  it('round-trips and omits defaults', () => {
    const params: WorkspaceParams = {
      section: 'catalogue',
      source: 'Hardware',
      status: 'draft',
      search: 'router',
      sort: 'price_desc',
      page: 2,
    };
    const qs = buildWorkspaceQuery(params);
    expect(parseWorkspaceParams(new URLSearchParams(qs))).toEqual(params);
    expect(buildWorkspaceQuery(parseWorkspaceParams(new URLSearchParams()))).toBe('');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/lib/products/workspace-params.test.ts`
Expected: FAIL — `Cannot find module '@/lib/products/workspace-params'`

- [ ] **Step 3: Implement the codec**

```typescript
// lib/products/workspace-params.ts
/**
 * URL search-param codec for the Product Workspace (/admin/products).
 * Old routes redirect here with these params (e.g. /admin/products?status=draft),
 * so parsing must accept short aliases ("hardware", "mtn") as well as the
 * canonical UnifiedProductSource labels.
 */
import type {
  UnifiedProductSource,
  UnifiedProductStatus,
} from '@/lib/types/unified-product';

export type WorkspaceSection = 'catalogue' | 'suppliers' | 'mtn-tools';

export interface WorkspaceParams {
  section: WorkspaceSection;
  source: UnifiedProductSource | 'all';
  status: UnifiedProductStatus | 'all';
  search: string;
  sort: 'updated_desc' | 'created_desc' | 'name_asc' | 'price_desc' | 'price_asc';
  page: number;
}

export const WORKSPACE_DEFAULTS: WorkspaceParams = {
  section: 'catalogue',
  source: 'all',
  status: 'all',
  search: '',
  sort: 'updated_desc',
  page: 1,
};

const SECTIONS: WorkspaceSection[] = ['catalogue', 'suppliers', 'mtn-tools'];
const STATUSES: Array<UnifiedProductStatus> = ['active', 'draft', 'pending', 'archived', 'inactive'];
const SORTS: WorkspaceParams['sort'][] = ['updated_desc', 'created_desc', 'name_asc', 'price_desc', 'price_asc'];

/** Accepts canonical labels and redirect-friendly aliases. */
const SOURCE_ALIASES: Record<string, UnifiedProductSource> = {
  circletel: 'CircleTel',
  CircleTel: 'CircleTel',
  mtn: 'MTN / Arlan',
  'MTN / Arlan': 'MTN / Arlan',
  hardware: 'Hardware',
  Hardware: 'Hardware',
};

export function parseWorkspaceParams(sp: URLSearchParams): WorkspaceParams {
  const section = sp.get('section') as WorkspaceSection | null;
  const status = sp.get('status') as UnifiedProductStatus | null;
  const sort = sp.get('sort') as WorkspaceParams['sort'] | null;
  const rawSource = sp.get('source');
  const page = Number(sp.get('page'));
  return {
    section: section && SECTIONS.includes(section) ? section : WORKSPACE_DEFAULTS.section,
    source: (rawSource && SOURCE_ALIASES[rawSource]) || WORKSPACE_DEFAULTS.source,
    status: status && STATUSES.includes(status) ? status : WORKSPACE_DEFAULTS.status,
    search: sp.get('search') ?? '',
    sort: sort && SORTS.includes(sort) ? sort : WORKSPACE_DEFAULTS.sort,
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

/** Omits default values so the canonical URL stays clean. */
export function buildWorkspaceQuery(params: WorkspaceParams): string {
  const sp = new URLSearchParams();
  if (params.section !== WORKSPACE_DEFAULTS.section) sp.set('section', params.section);
  if (params.source !== 'all') sp.set('source', params.source);
  if (params.status !== 'all') sp.set('status', params.status);
  if (params.search.trim()) sp.set('search', params.search.trim());
  if (params.sort !== WORKSPACE_DEFAULTS.sort) sp.set('sort', params.sort);
  if (params.page > 1) sp.set('page', String(params.page));
  return sp.toString();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/lib/products/workspace-params.test.ts`
Expected: PASS (3+2 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/products/workspace-params.ts __tests__/lib/products/workspace-params.test.ts
git commit -m "feat(products): URL-param codec for product workspace state"
```

---

### Task 2: Wire UnifiedProductConsole to URL params

Console state initializes from `useSearchParams()` and writes back via `router.replace` so filters are deep-linkable. Also accept saved-view chips.

**Files:**
- Modify: `components/admin/products/unified/UnifiedProductConsole.tsx`

- [ ] **Step 1: Initialize state from URL params**

In `UnifiedProductConsole.tsx`:
- Add imports: `import { useRouter, useSearchParams, usePathname } from 'next/navigation';` and `import { parseWorkspaceParams, buildWorkspaceQuery, WORKSPACE_DEFAULTS, type WorkspaceParams } from '@/lib/products/workspace-params';`
- At the top of the component:

```typescript
const router = useRouter();
const pathname = usePathname();
const searchParams = useSearchParams();
const initial = useMemo(
  () => parseWorkspaceParams(new URLSearchParams(searchParams.toString())),
  // Parse once on mount only — the console owns state afterwards.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  []
);
```

- Seed existing useState calls from `initial`: `useState<SourceTab>(initial.source === 'all' ? 'all' : initial.source)`, `useState(initial.search)`, `useState<UnifiedProductStatus | 'all'>(initial.status)`, `useState<UnifiedSort>(initial.sort)`, `useState(initial.page)`.

- [ ] **Step 2: Reflect state back into the URL**

Add below the debounce effect:

```typescript
// Keep the URL shareable: reflect filters without adding history entries.
useEffect(() => {
  const qs = buildWorkspaceQuery({
    ...WORKSPACE_DEFAULTS,
    source: sourceTab === 'all' ? 'all' : sourceTab,
    status,
    search: debouncedSearch,
    sort,
    page,
  });
  router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
}, [sourceTab, status, debouncedSearch, sort, page, pathname, router]);
```

Note: the workspace shell (Task 3) owns the `section` param; the console only writes filter params. The shell renders the console only when `section === 'catalogue'`, so there is no conflict.

- [ ] **Step 3: Suspense boundary**

`useSearchParams()` requires a Suspense boundary in App Router. In Task 3's page, wrap the workspace in `<Suspense>` (shown there). No change needed here.

- [ ] **Step 4: Type-check and manually verify**

Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -i "unified\|workspace" || echo "no new errors in touched files"`
Expected: no errors referencing the touched files.

- [ ] **Step 5: Commit**

```bash
git add components/admin/products/unified/UnifiedProductConsole.tsx
git commit -m "feat(products): deep-linkable URL state for unified console"
```

---

### Task 3: Workspace shell with left rail + sections

`/admin/products` becomes the workspace: left rail with Catalogue / Suppliers / MTN Tools sections and a Rules Studio launcher. Suppliers and MTN content are the EXISTING page components extracted, not rewrites.

**Files:**
- Create: `components/admin/products/workspace/ProductWorkspace.tsx`
- Create: `components/admin/products/workspace/SuppliersSection.tsx` (extraction)
- Create: `components/admin/products/workspace/MTNToolsSection.tsx` (extraction)
- Modify: `app/admin/products/page.tsx`

- [ ] **Step 1: Extract SuppliersSection**

Move the JSX + state from `app/admin/suppliers/page.tsx` (413 lines: supplier cards, sync status, sync trigger calling `POST /api/admin/suppliers/sync`, quick links) into `components/admin/products/workspace/SuppliersSection.tsx` as a `'use client'` component named `SuppliersSection` with no props. Change nothing functional — this is a mechanical move. Update the quick link "Hardware catalogue" to `/admin/products?source=hardware`. Do NOT delete the old page yet (Task 7 turns it into a redirect).

- [ ] **Step 2: Extract MTNToolsSection**

`app/admin/mtn-dealer-products/page.tsx` renders tabs: Overview, Products, Commission Calculator. The Products tab is superseded by the catalogue grid (`?source=mtn`). Create `components/admin/products/workspace/MTNToolsSection.tsx` (`'use client'`, no props) that renders ONLY the Overview and Commission tabs by reusing the existing components (`MTNOverviewTab`, `MTNCommissionTab` — import from their current location under `components/admin/mtn-dealer-products/`), plus the import action (`POST /api/admin/mtn-dealer-products/import`) if it lives in the header component. Keep the existing tab styling via `ConsoleTabsList` from `@/components/backend` if the old page already uses plain buttons — match whichever pattern the extracted code already has (Rule: don't blend patterns).

- [ ] **Step 3: Build ProductWorkspace shell**

```tsx
// components/admin/products/workspace/ProductWorkspace.tsx
'use client';

import { useMemo, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  PiSquaresFourBold,
  PiTruckBold,
  PiHandshakeBold,
} from 'react-icons/pi';
import { cn } from '@/lib/utils';
import {
  parseWorkspaceParams,
  type WorkspaceSection,
} from '@/lib/products/workspace-params';
import { UnifiedProductConsole } from '@/components/admin/products/unified/UnifiedProductConsole';
import { SuppliersSection } from './SuppliersSection';
import { MTNToolsSection } from './MTNToolsSection';

const SECTIONS: Array<{ id: WorkspaceSection; label: string; icon: React.ReactNode }> = [
  { id: 'catalogue', label: 'Catalogue', icon: <PiSquaresFourBold className="h-4 w-4" /> },
  { id: 'suppliers', label: 'Suppliers', icon: <PiTruckBold className="h-4 w-4" /> },
  { id: 'mtn-tools', label: 'MTN Tools', icon: <PiHandshakeBold className="h-4 w-4" /> },
];

/**
 * Product Workspace — single home for product management.
 * Left rail switches sections; the catalogue section is the unified console.
 */
export function ProductWorkspace() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialSection = useMemo(
    () => parseWorkspaceParams(new URLSearchParams(searchParams.toString())).section,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const [section, setSection] = useState<WorkspaceSection>(initialSection);

  const switchSection = (next: WorkspaceSection) => {
    setSection(next);
    // Section changes reset filter params — each section owns its own state.
    router.replace(next === 'catalogue' ? pathname : `${pathname}?section=${next}`, {
      scroll: false,
    });
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <aside className="w-52 shrink-0 border-r border-ui-border bg-white p-3">
        <p className="px-2 pb-2 text-xs font-bold uppercase tracking-wide text-ui-text-muted">
          Product Workspace
        </p>
        <nav className="space-y-1">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => switchSection(s.id)}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
                section === s.id
                  ? 'bg-circleTel-orange/10 text-circleTel-orange'
                  : 'text-ui-text-secondary hover:bg-slate-50'
              )}
            >
              {s.icon}
              {s.label}
            </button>
          ))}
        </nav>
      </aside>
      <main className="min-w-0 flex-1">
        {section === 'catalogue' && <UnifiedProductConsole />}
        {section === 'suppliers' && <SuppliersSection />}
        {section === 'mtn-tools' && <MTNToolsSection />}
      </main>
    </div>
  );
}
```

- [ ] **Step 4: Point /admin/products at the workspace**

```tsx
// app/admin/products/page.tsx  (replaces the ProductsDashboard wrapper)
import { Suspense } from 'react';
import { ProductWorkspace } from '@/components/admin/products/workspace/ProductWorkspace';

export const metadata = {
  title: 'Product Workspace | CircleTel Admin',
};

export default function ProductsPage() {
  return (
    <Suspense>
      <ProductWorkspace />
    </Suspense>
  );
}
```

- [ ] **Step 5: Add saved-view chips to the console**

In `UnifiedProductConsole.tsx`, below the source tabs, add a chip row that applies preset filters in one click (replaces the old Drafts/Archived/Hardware pages):

```tsx
const SAVED_VIEWS: Array<{ label: string; apply: () => void }> = [
  { label: 'Drafts', apply: () => { setStatus('draft'); setSourceTab('all'); setPage(1); } },
  { label: 'Archived', apply: () => { setStatus('archived'); setSourceTab('all'); setPage(1); } },
  { label: 'Hardware', apply: () => { setSourceTab('Hardware'); setStatus('all'); setPage(1); } },
  { label: 'MTN Deals', apply: () => { setSourceTab('MTN / Arlan'); setStatus('all'); setPage(1); } },
];
```

Render as small rounded buttons (`rounded-full border border-ui-border px-3 py-1 text-xs font-medium text-ui-text-secondary hover:border-circleTel-orange hover:text-circleTel-orange`) in a `flex gap-2` row labelled "Views:".

- [ ] **Step 6: Verify in browser, then commit**

Run dev server (`npm run dev:memory`, Bash run_in_background) and check `http://localhost:3000/admin/products` renders the workspace with all three sections switching (middleware dev-bypass renders admin pages locally; API data needs a minted session — layout verification is enough here).

```bash
git add components/admin/products/workspace/ app/admin/products/page.tsx components/admin/products/unified/UnifiedProductConsole.tsx
git commit -m "feat(products): product workspace shell with catalogue/suppliers/mtn sections"
```

---

### Task 4: Relationships panel in the detail rail

Replaces the standalone `/admin/products/relationships` page. Reuses the existing API (`GET/POST/DELETE /api/admin/products/[id]/relationships`, types in `lib/types/product-relationships.ts`). Relationships only exist for `service_packages` rows — the panel renders only for that source.

**Files:**
- Create: `components/admin/products/unified/RelationshipsPanel.tsx`
- Modify: `components/admin/products/unified/UnifiedProductDetailSidebar.tsx`

- [ ] **Step 1: Read the existing page for the data contract**

Read `app/admin/products/relationships/page.tsx:1-120` and `lib/types/product-relationships.ts` to copy the exact relationship type union (`addon | requires | excludes | alternative | includes`) and API response shapes. Use those — do not invent fields.

- [ ] **Step 2: Build RelationshipsPanel**

`'use client'` component with props `{ productId: string }`. Behaviour:
- On mount: `GET /api/admin/products/${productId}/relationships` → list grouped by `relationship_type` (reuse the grouping labels from the old page).
- Each row: target product name, mandatory badge (`StatusBadge` with `status="Required"` / `variant="info"` when `is_mandatory`), price modifier when set, delete button → `DELETE /api/admin/products/${productId}/relationships?relationshipId=${id}` then refetch.
- "Add relationship" inline form: product search input (reuse the search pattern from the old page — it fetches `GET /api/admin/products` and filters client-side), type `<select>` with the 5 types, mandatory checkbox → `POST` then refetch.
- Wrap sections in `SectionCard` from `@/components/backend` (`title="Relationships"`).
- Loading/empty/error: `LoadingState` / `EmptyState` / `ErrorState` from `@/components/backend`.

- [ ] **Step 3: Mount in the detail sidebar**

In `UnifiedProductDetailSidebar.tsx`, after the existing detail sections, render:

```tsx
{product.sourceTable === 'service_packages' && (
  <RelationshipsPanel productId={product.id} />
)}
```

- [ ] **Step 4: Type-check and commit**

Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -i "relationship\|sidebar" || echo OK`
Expected: OK

```bash
git add components/admin/products/unified/RelationshipsPanel.tsx components/admin/products/unified/UnifiedProductDetailSidebar.tsx
git commit -m "feat(products): relationships panel in workspace detail rail"
```

---

### Task 5: Edit drawer + archive action

Read-write console: edit fields per source through the verified existing endpoints. `admin_products` is display-only (publish flow already exists in the detail rail).

**Files:**
- Create: `components/admin/products/unified/ProductEditDrawer.tsx`
- Modify: `components/admin/products/unified/UnifiedProductDetailSidebar.tsx` (Edit button)
- Modify: `components/admin/products/unified/UnifiedProductConsole.tsx` (drawer state + refetch)

- [ ] **Step 1: Define the per-source edit contract**

At the top of `ProductEditDrawer.tsx`:

```typescript
import type { UnifiedProduct } from '@/lib/types/unified-product';

interface EditableFields {
  name: string;
  description: string;
  price: number;        // monthly/retail price excl context — maps per source below
  cost: number | null;  // null = not editable for this source
  status: string;
  isFeatured: boolean;
}

/**
 * Per-source endpoint + body mapping (all verified 2026-06-11):
 * - service_packages: PATCH /api/admin/products/{id}
 *     body: { name, description, base_price_zar, featured, is_active }
 *     ⚠️ NEVER send cost_price_zar here — that endpoint maps it to pricing.setup.
 *     cost not editable via drawer for this source.
 * - circletel_hardware_products: PATCH /api/hardware/products/{id}
 *     body: { name, description, retail_price, cost_price, status }
 *     (status: 'published' | 'draft' | 'archived'; passed to updateHardwareProduct)
 * - mtn_dealer_products: PUT /api/admin/mtn-dealer-products/{id}
 *     body: { selling_price_incl_vat, status, change_reason }
 *     name/description are MTN feed data — not editable.
 * - admin_products: no update endpoint — drawer not offered (button hidden).
 */
```

Before implementing, verify the hardware field whitelist in `lib/hardware-catalogue` (`updateHardwareProduct`) and the MTN PUT handler (`app/api/admin/mtn-dealer-products/[id]/route.ts:60-130`) accept exactly these keys; adjust the body maps to what the handlers actually read.

- [ ] **Step 2: Build the drawer**

`'use client'`; props `{ product: UnifiedProduct | null; onClose: () => void; onSaved: () => void }`. Slide-over panel matching `UnifiedProductDetailSidebar`'s pattern (read that file first and reuse its overlay/panel classes — one pattern, not a blend). Form behaviour:
- Seed form state from `product` (`name`, `description ?? ''`, `price`, `cost`, mapped raw status options per source, `isFeatured`).
- Status `<select>` options come from the source's real status set: service_packages `active|inactive`, hardware `published|draft|archived`, MTN `active|inactive|archived`.
- Save button: builds the per-source body (map above), `fetch` with the per-source method/URL, on `!res.ok` show the API's `error` string inline (red banner, same classes as the console's error banner), on success call `onSaved()` then `onClose()`.
- MTN saves include `change_reason: 'Edited in Product Workspace'`.
- Disable Save while submitting.

- [ ] **Step 3: Wire into console + sidebar**

- `UnifiedProductConsole`: add `const [editing, setEditing] = useState<UnifiedProduct | null>(null);`, render `<ProductEditDrawer product={editing} onClose={() => setEditing(null)} onSaved={refetch} />` (the `refetch` already comes from `useUnifiedProducts`).
- `UnifiedProductDetailSidebar`: add an `onEdit?: (p: UnifiedProduct) => void` prop; render an "Edit" button (orange, top of the actions area) only when `product.sourceTable !== 'admin_products'`. Console passes `onEdit={(p) => { setSelected(null); setEditing(p); }}`.

- [ ] **Step 4: Type-check + browser-verify an edit**

Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -iE "drawer|console|sidebar" || echo OK`
Browser: with a minted admin session (memory `admin-session-cookie-minting.md`), edit a hardware product's name on localhost; confirm the grid refreshes with the new name.

- [ ] **Step 5: Commit**

```bash
git add components/admin/products/unified/
git commit -m "feat(products): per-source edit drawer in product workspace"
```

---

### Task 6: Aggregator cost for admin_products drafts

Margin rules currently can't evaluate drafts because the aggregator hardcodes `cost: 0`. Cost data exists in `product_cost_components`. Sum it per fetched page (one `IN` query — never per-row).

**Files:**
- Modify: `lib/services/unified-product-aggregator.ts` (the admin_products fetch path)
- Modify: `lib/types/unified-product.ts` (`normalizeAdminProductToUnified`)
- Test: `__tests__/lib/types/unified-product-cost.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/lib/types/unified-product-cost.test.ts
import { normalizeAdminProductToUnified } from '@/lib/types/unified-product';
import type { AdminProduct, AdminProductPricing } from '@/lib/types/admin-products';

const row = {
  id: 'p1', name: 'HomeConnect 50', slug: 'homeconnect-50', category: 'fibre',
  service_type: 'fibre', description: 'Test', status: 'draft',
  is_featured: false, created_at: null, updated_at: null,
} as unknown as AdminProduct;
const pricing = { price_regular: 899 } as unknown as AdminProductPricing;

describe('normalizeAdminProductToUnified cost', () => {
  it('uses the summed cost when provided', () => {
    const u = normalizeAdminProductToUnified(row, pricing, 600);
    expect(u.cost).toBe(600);
    expect(u.margin).toBe(33); // (899-600)/899 ≈ 33%
  });

  it('defaults to 0 cost when not provided (backward compatible)', () => {
    const u = normalizeAdminProductToUnified(row, pricing);
    expect(u.cost).toBe(0);
    expect(u.margin).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/lib/types/unified-product-cost.test.ts`
Expected: FAIL — normalizer doesn't accept a third argument / `margin` is 0.

- [ ] **Step 3: Extend the normalizer**

In `lib/types/unified-product.ts`, change the signature and the two fields:

```typescript
export function normalizeAdminProductToUnified(
  row: AdminProduct,
  pricing?: AdminProductPricing | null,
  /** Summed product_cost_components for this product, when loaded. */
  costSum?: number
): UnifiedProduct {
  const price = toNumber(pricing?.price_regular);
  const cost = toNumber(costSum);
  // ...existing statusMap...
  // in the returned object:
  //   cost,
  //   margin: computeMarginPct(price, cost),
```

(Keep everything else identical; `margin: 0` comment about untracked cost is now obsolete — delete it.)

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/lib/types/unified-product-cost.test.ts`
Expected: PASS

- [ ] **Step 5: Feed cost sums from the aggregator**

In `lib/services/unified-product-aggregator.ts`, find where the admin_products page is fetched and normalized (it already fetches `admin_product_pricing` separately — follow that same pattern). After the page of rows is fetched:

```typescript
// Sum cost components for just this page of products (one query, not per row).
const ids = rows.map((r) => r.id);
const { data: costRows } = await supabase
  .from('product_cost_components')
  .select('product_id, amount')
  .in('product_id', ids);
const costByProduct = new Map<string, number>();
for (const c of costRows ?? []) {
  costByProduct.set(
    c.product_id,
    (costByProduct.get(c.product_id) ?? 0) + toNumber(c.amount)
  );
}
```

Pass `costByProduct.get(row.id)` as the third argument to `normalizeAdminProductToUnified`.
⚠️ First verify the amount column name: `SELECT column_name FROM information_schema.columns WHERE table_name = 'product_cost_components'` via the Supabase MCP (`verify-schema-first` rule) — `lib/catalog/publish.ts` sums these rows already; mirror its column usage exactly.

- [ ] **Step 6: Type-check + commit**

Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -iE "aggregator|unified-product" || echo OK`

```bash
git add lib/types/unified-product.ts lib/services/unified-product-aggregator.ts __tests__/lib/types/unified-product-cost.test.ts
git commit -m "feat(products): draft margin from product_cost_components in aggregator"
```

---

### Task 7: Persist Rules Studio config

New `product_rules_config` table + admin API + Studio load/save. Single-row config (the whole `RuleConfig` object as JSONB) — YAGNI on per-rule rows.

**Files:**
- Create: `supabase/migrations/20260612090000_product_rules_config.sql`
- Create: `app/api/admin/products/rules-config/route.ts`
- Modify: `components/admin/products/unified/UnifiedProductConsole.tsx` (load on mount)
- Modify: `components/admin/products/unified/RulesStudio.tsx` (save button)
- Test: `__tests__/api/rules-config.test.ts` (pure merge helper)

- [ ] **Step 1: Migration**

```sql
-- supabase/migrations/20260612090000_product_rules_config.sql
-- Persists Rules Studio threshold overrides (previously client-side only).
-- Single-row config keyed by a fixed id; config JSONB matches Partial<RuleConfig>.
CREATE TABLE IF NOT EXISTS product_rules_config (
  id text PRIMARY KEY DEFAULT 'default',
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid REFERENCES admin_users(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE product_rules_config ENABLE ROW LEVEL SECURITY;
-- Service-role only (admin API uses the service client); no anon/authenticated policies.
```

Apply via Supabase MCP `apply_migration` (Coolify deploys do NOT run migrations — memory `customers-phone-uniqueness.md`). Also commit the file.

- [ ] **Step 2: API route**

```typescript
// app/api/admin/products/rules-config/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import type { RuleConfig } from '@/lib/products/rules';

const NUMERIC_KEYS = ['marginFloorPct', 'bundleMarginFloorPct', 'mtnDefaultMarkupFloorPct'] as const;

/** Keep only known RuleConfig keys with sane values (0–100 for percentages). */
export function sanitizeRuleConfig(input: unknown): Partial<RuleConfig> {
  if (typeof input !== 'object' || input === null) return {};
  const out: Partial<RuleConfig> = {};
  for (const key of NUMERIC_KEYS) {
    const v = (input as Record<string, unknown>)[key];
    if (typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 100) {
      out[key] = v;
    }
  }
  return out;
}

export async function GET(request: NextRequest) {
  const auth = await authenticateAdmin(request);
  if (!auth.success) return auth.response;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('product_rules_config')
    .select('config, updated_at')
    .eq('id', 'default')
    .maybeSingle();
  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true, config: data?.config ?? {}, updatedAt: data?.updated_at ?? null });
}

export async function PUT(request: NextRequest) {
  const auth = await authenticateAdmin(request);
  if (!auth.success) return auth.response;
  if (!['super_admin', 'product_manager'].includes(auth.adminUser.role)) {
    return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  const config = sanitizeRuleConfig(body?.config);
  const supabase = await createClient();
  const { error } = await supabase.from('product_rules_config').upsert({
    id: 'default',
    config,
    updated_by: auth.adminUser.id,
    updated_at: new Date().toISOString(),
  });
  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true, config });
}
```

⚠️ Verify `authenticateAdmin`'s result shape (`auth.adminUser.id`, `.role`) against `lib/auth/admin-api-auth.ts` before relying on it — copy whatever the publish route (`app/api/admin/products/[id]/publish/route.ts:30-44`) does.

- [ ] **Step 3: Test the sanitizer**

```typescript
// __tests__/api/rules-config.test.ts
import { sanitizeRuleConfig } from '@/app/api/admin/products/rules-config/route';

describe('sanitizeRuleConfig', () => {
  it('keeps valid numeric thresholds', () => {
    expect(sanitizeRuleConfig({ marginFloorPct: 30 })).toEqual({ marginFloorPct: 30 });
  });
  it('drops unknown keys, out-of-range and non-numeric values', () => {
    expect(
      sanitizeRuleConfig({ marginFloorPct: 200, bundleMarginFloorPct: 'x', evil: true })
    ).toEqual({});
  });
  it('handles null/garbage input', () => {
    expect(sanitizeRuleConfig(null)).toEqual({});
    expect(sanitizeRuleConfig('nope')).toEqual({});
  });
});
```

Run: `npx jest __tests__/api/rules-config.test.ts` — Expected: PASS.
(If importing from a route file trips Jest on `next/server`, move `sanitizeRuleConfig` to `lib/products/rules/config-sanitizer.ts` and import it in both places — check how existing `__tests__/api/*` tests handle route imports first and follow that pattern.)

- [ ] **Step 4: Load + save in the UI**

- `UnifiedProductConsole.tsx`: on mount, `fetch('/api/admin/products/rules-config')` and if `res.ok` seed `setRuleConfig(json.config)` (silent failure → defaults; don't block the console).
- `RulesStudio.tsx`: add a "Save as default" button next to the existing controls; `PUT` the current `config`; show a small "Saved ✓" confirmation state for 2s; on failure show the error inline. Read the file first and match its existing button/feedback styling exactly.

- [ ] **Step 5: Verify + commit**

Browser (minted session): change margin floor in Rules Studio → Save → hard-refresh → value persists.

```bash
git add supabase/migrations/20260612090000_product_rules_config.sql app/api/admin/products/rules-config/route.ts components/admin/products/unified/ __tests__/api/rules-config.test.ts
git commit -m "feat(products): persist rules studio thresholds in product_rules_config"
```

---

### Task 8: Hard cutover — redirects, sidebar, legacy deletion

**Files:**
- Modify (replace contents): `app/admin/products/unified-console/page.tsx`, `app/admin/products/drafts/page.tsx`, `app/admin/products/archived/page.tsx`, `app/admin/products/hardware/page.tsx`, `app/admin/products/relationships/page.tsx`, `app/admin/mtn-dealer-products/page.tsx`, `app/admin/suppliers/page.tsx`
- Modify: `components/admin/layout/Sidebar.tsx:81-91, 168-172`
- Delete: `app/admin/products/mtn-deals/` (legacy page) and `app/api/products/mtn-deals/` (orphan API) — verify no other importers first

- [ ] **Step 1: Redirect pages**

Every old page becomes a one-line server redirect (same pattern for all seven):

```tsx
// app/admin/products/drafts/page.tsx
import { redirect } from 'next/navigation';
export default function DraftProductsPage() {
  redirect('/admin/products?status=draft');
}
```

Targets: unified-console → `/admin/products` · drafts → `?status=draft` · archived → `?status=archived` · hardware → `?source=hardware` · relationships → `/admin/products` · mtn-dealer-products → `?source=mtn` · suppliers → `?section=suppliers`.

- [ ] **Step 2: Sidebar consolidation**

In `Sidebar.tsx`, replace the Products group items (lines 84-91) with:

```typescript
{ name: 'Product Workspace', href: '/admin/products', icon: PiSquaresFourBold },
{ name: 'Add Product', href: '/admin/products/new', icon: PiPlusBold },
```

In the Suppliers group (lines 171-172), replace both items with:

```typescript
{ name: 'Suppliers', href: '/admin/products?section=suppliers', icon: PiTruckBold },
```

Remove now-unused icon imports (`PiListBold`, `PiCubeBold`, `PiLinkBold`, `PiHandshakeBold`, `PiFileTextBold`, `PiArchiveBold`) ONLY if nothing else in the file uses them — grep the file first.

- [ ] **Step 3: Delete the dead MTN legacy page**

```bash
grep -rn "mtn-deals" app/ components/ lib/ --include="*.ts" --include="*.tsx" | grep -v "app/admin/products/mtn-deals\|app/api/products/mtn-deals"
```
Expected: no hits (nothing else references it). Then:

```bash
git rm -r app/admin/products/mtn-deals app/api/products/mtn-deals
```
If the grep DOES hit, stop and list the importers instead of deleting.

- [ ] **Step 4: Verify redirects + commit**

Dev server: request each old URL with `curl -sI http://localhost:3000/admin/products/drafts | head -3` → expect `307` with `location: /admin/products?status=draft` (repeat for all seven).

```bash
git add -A app/admin app/api components/admin/layout/Sidebar.tsx
git commit -m "feat(products): hard cutover — redirects, slim sidebar, delete legacy mtn-deals"
```

---

### Task 9: Delete superseded components + final verification

**Files:**
- Delete: `components/admin/products/ProductsDashboard.tsx` and its now-orphaned children (the list/ filter components it exclusively owns)
- Modify: none expected

- [ ] **Step 1: Confirm ProductsDashboard is orphaned**

```bash
grep -rn "ProductsDashboard" app/ components/ --include="*.tsx" | grep -v "components/admin/products/ProductsDashboard"
```
Expected: no hits (Task 8 removed the three page wrappers). For each component imported ONLY by ProductsDashboard (check `ProductsList`, `ProductsFilters`, `ProductsStatCards`, `ProductsListHeader`, `ProductsViewToggle` in `components/admin/products/list/`), run the same orphan grep; delete confirmed orphans with `git rm`. If anything else imports them, leave that file and note it in the commit message.

**Accepted functionality loss (per spec):** ProductsDashboard's drag-drop ordering, bulk actions, and CSV export are dropped in Phase 1. If the team misses them, they return as workspace toolbar features in a follow-up.

- [ ] **Step 2: Full test + type-check pass**

```bash
npx jest __tests__/lib/products __tests__/lib/types __tests__/api/rules-config.test.ts
npm run type-check:memory 2>&1 | tail -20
```
Expected: new tests pass; type-check shows no NEW errors in touched files (repo carries ~295 pre-existing errors — compare against `main` if unsure: the pre-push hook will scope-check automatically).

- [ ] **Step 3: Staging deploy + browser verification**

```bash
git push origin feat/product-workspace-phase1:staging
```
On staging (minted admin session): workspace renders with live data; each saved view filters; edit a hardware product; Rules Studio save persists across refresh; all 7 old URLs redirect correctly; suppliers sync trigger still works; MTN commission calculator loads.

- [ ] **Step 4: Final commit + PR**

```bash
git add -A && git commit -m "chore(products): remove superseded ProductsDashboard components"
gh pr create --base main --title "feat: Product Workspace — consolidate 8 product admin pages (Phase 1)" --body "Implements docs/superpowers/specs/2026-06-11-product-workspace-design.md Phase 1.

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

---

## Self-review notes

- Spec §3.1 routes covered by Task 8; §3.2 shell by Task 3; §3.3 editing by Tasks 4–5; §3.4(2) by Task 7; §3.4(3) by Task 6; §6 verification by Task 9. Spec §3.2 "margin filter" in the toolbar is NOT included — the existing search component has status/sort only; margin filtering stays a Phase 2 nicety (noted deviation, keeps Phase 1 lean).
- `/admin/products/new` is intentionally untouched (still the standalone form; sidebar keeps its entry).
- Tasks 2/3 both write to the URL: the console writes filter params only when it is the active section; the shell rewrites the URL on section switch. Section + filter params never coexist (sections reset filters) — by design.
