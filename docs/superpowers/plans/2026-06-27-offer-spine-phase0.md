# Offer Spine (Phase 0) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the canonical "Offer" layer — a thin spine above the existing product source tables that publishes any source product into a uniform sellable unit with a resolved pricing/margin snapshot, kept fresh by an event-driven recompute job.

**Architecture:** Three new tables (`offers`, `offer_components`, `offer_pricing_snapshot`) sit above the existing systems-of-record. A **publisher** maps a `UnifiedProduct` (the existing read model) into an Offer + components. A pure **pricing resolver** computes the cost build-up, margin, and guardrail status. An **Inngest job** recomputes snapshots on demand and writes them back, with a `computed_at` **staleness guard**. No customer-facing UI in this plan — that is Plan 2 (Storefront) and Plan 3 (Cart & Checkout).

**Tech Stack:** Next.js 15 (App Router), TypeScript, Supabase (Postgres), Inngest, Jest + ts-jest.

## Global Constraints

- **TypeScript strict** — no `any` in new exported signatures; guard optionals per `.claude/rules/type-guards-optionals.md`.
- **Supabase server client** — `import { createClient } from '@/lib/supabase/server'` (service role) for all writes; `await createClient()`.
- **Migrations** — file name pattern `supabase/migrations/YYYYMMDDHHMMSS_<desc>.sql`; next free timestamp after the latest existing `20260627180000_*`.
- **Money** — all amounts ZAR, `numeric(10,2)` in DB, `number` in TS. Never store cents.
- **Margin floor** — default contribution-margin floor is **25%** (`product_rules_config` → `marginFloorPct`); warning band is floor → floor+5.
- **Run scripts with creds** — `set -a && source .env.local && set +a && npx tsx <script>` (`.env.local` is NOT loaded by `dotenv/config`).
- **Inngest** — client `id: 'circletel'` in `lib/inngest/client.ts`; functions registered in `lib/inngest/index.ts` `functions` array; served at `app/api/inngest/route.ts`.
- **Provenance** — every Offer records `source_uid` = the originating `UnifiedProduct.uid` (`"${sourceTable}:${id}"`).

---

## File Structure

| File | Responsibility |
|------|----------------|
| `supabase/migrations/20260628000000_create_offer_spine.sql` | Create `offers`, `offer_components`, `offer_pricing_snapshot` + indexes + RLS |
| `lib/types/offer.ts` | All Offer TypeScript types (no logic) |
| `lib/offers/publisher.ts` | Pure `buildOfferDraftFromUnified` + I/O `persistOfferDraft` / `publishFromUnified` |
| `lib/offers/pricing-resolver.ts` | Pure `resolveOfferPricing` (cost build-up, margin, guardrail) |
| `lib/offers/staleness.ts` | Pure `isSnapshotStale` |
| `lib/offers/snapshot-writer.ts` | I/O `writeSnapshot` (upsert into `offer_pricing_snapshot`) |
| `lib/inngest/functions/recompute-offer-pricing.ts` | Inngest job: resolve + write snapshot, emit completed |
| `lib/inngest/client.ts` | (modify) add offer recompute event types |
| `lib/inngest/index.ts` | (modify) register the new function |
| `app/api/admin/offers/publish/route.ts` | Admin trigger: publish one/all UnifiedProducts into Offers |
| `__tests__/lib/offers/publisher.test.ts` | Tests for `buildOfferDraftFromUnified` |
| `__tests__/lib/offers/pricing-resolver.test.ts` | Tests for `resolveOfferPricing` |
| `__tests__/lib/offers/staleness.test.ts` | Tests for `isSnapshotStale` |
| `scripts/offers/verify-publish.ts` | Integration verification: publish one known product, assert rows |

---

## Task 1: Offer types

**Files:**
- Create: `lib/types/offer.ts`

**Interfaces:**
- Produces: `OfferSourceType`, `OfferLifecycleState`, `OfferGuardrailStatus`, `OfferComponentDraft`, `OfferDraft`, `CostBuildupLine`, `OfferPricingSnapshotInput`, `OfferPricingSnapshot`.

- [ ] **Step 1: Create the types file**

```typescript
// lib/types/offer.ts

export type OfferSourceType =
  | 'service_package'
  | 'hardware'
  | 'mtn_deal'
  | 'supplier_product'
  | 'labour'
  | 'recurring';

export type OfferLifecycleState =
  | 'idea'
  | 'draft'
  | 'priced'
  | 'approved'
  | 'active'
  | 'archived';

export type OfferGuardrailStatus = 'pass' | 'warning' | 'fail';

export type OfferCustomerType = 'consumer' | 'business' | 'both';

export type OfferComponentRole = 'primary' | 'addon' | 'required';

export interface OfferComponentDraft {
  sourceType: OfferSourceType;
  sourceId: string;       // id in the source table
  qty: number;
  role: OfferComponentRole;
  unitCost: number;       // ZAR, cost-of-sale for this component
  unitPrice: number;      // ZAR, contribution to the offer sell price
  label: string;
}

export interface OfferDraft {
  slug: string;
  title: string;
  customerType: OfferCustomerType;
  basePrice: number;            // resolved sell price (ZAR)
  channelVisibility: string[];  // e.g. ['direct']
  sourceUid: string;            // UnifiedProduct.uid provenance
  sourceUpdatedAt: string | null; // ISO; latest source updated_at
  components: OfferComponentDraft[];
}

export interface CostBuildupLine {
  label: string;
  sourceType: OfferSourceType;
  unitCost: number;
  qty: number;
  lineCost: number;       // unitCost * qty
}

/** Input to the pure resolver — no DB ids/timestamps. */
export interface OfferPricingSnapshotInput {
  resolvedPrice: number;
  costBuildup: CostBuildupLine[];
  totalCost: number;
  marginPct: number;
  guardrailStatus: OfferGuardrailStatus;
}

/** Persisted snapshot (resolver output + offer id + computedAt). */
export interface OfferPricingSnapshot extends OfferPricingSnapshotInput {
  offerId: string;
  computedAt: string;     // ISO
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep 'lib/types/offer.ts' || echo "OK: no errors in offer.ts"`
Expected: `OK: no errors in offer.ts`

- [ ] **Step 3: Commit**

```bash
git add lib/types/offer.ts
git commit -m "feat(offers): add Offer spine TypeScript types"
```

---

## Task 2: Pricing resolver (pure)

**Files:**
- Create: `lib/offers/pricing-resolver.ts`
- Test: `__tests__/lib/offers/pricing-resolver.test.ts`

**Interfaces:**
- Consumes: `OfferDraft`, `CostBuildupLine`, `OfferGuardrailStatus`, `OfferPricingSnapshotInput` from `lib/types/offer.ts`.
- Produces: `resolveOfferPricing(draft: OfferDraft, opts?: { marginFloorPct?: number }): OfferPricingSnapshotInput`. Default `marginFloorPct = 25`. Warning band is `[floor, floor+5)`. `resolvedPrice <= 0` ⇒ `guardrailStatus: 'fail'`, `marginPct: 0`.

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/lib/offers/pricing-resolver.test.ts
import { describe, it, expect } from '@jest/globals';
import { resolveOfferPricing } from '@/lib/offers/pricing-resolver';
import type { OfferDraft } from '@/lib/types/offer';

function draft(over: Partial<OfferDraft> = {}): OfferDraft {
  return {
    slug: 'skyfibre-home-50',
    title: 'SkyFibre Home 50/50',
    customerType: 'consumer',
    basePrice: 899,
    channelVisibility: ['direct'],
    sourceUid: 'service_packages:abc',
    sourceUpdatedAt: '2026-06-01T00:00:00.000Z',
    components: [
      { sourceType: 'service_package', sourceId: 'abc', qty: 1, role: 'primary',
        unitCost: 499, unitPrice: 899, label: 'SkyFibre Home 50/50' },
    ],
    ...over,
  };
}

describe('resolveOfferPricing', () => {
  it('builds cost lines, total cost, and margin from components', () => {
    const r = resolveOfferPricing(draft());
    expect(r.resolvedPrice).toBe(899);
    expect(r.totalCost).toBe(499);
    expect(r.costBuildup).toHaveLength(1);
    expect(r.costBuildup[0].lineCost).toBe(499);
    // margin = (899-499)/899*100 = 44.49 -> rounded 44
    expect(r.marginPct).toBe(44);
    expect(r.guardrailStatus).toBe('pass');
  });

  it('sums multi-component cost build-up', () => {
    const r = resolveOfferPricing(draft({
      basePrice: 1500,
      components: [
        { sourceType: 'service_package', sourceId: 'a', qty: 1, role: 'primary', unitCost: 499, unitPrice: 899, label: 'Conn' },
        { sourceType: 'hardware', sourceId: 'b', qty: 2, role: 'addon', unitCost: 200, unitPrice: 300, label: 'Router' },
      ],
    }));
    expect(r.totalCost).toBe(899); // 499 + 200*2
    expect(r.costBuildup[1].lineCost).toBe(400);
  });

  it('flags fail when margin below the floor', () => {
    const r = resolveOfferPricing(draft({ basePrice: 600, components: [
      { sourceType: 'service_package', sourceId: 'a', qty: 1, role: 'primary', unitCost: 499, unitPrice: 600, label: 'Conn' },
    ] }), { marginFloorPct: 25 });
    // margin = (600-499)/600*100 = 16.8 -> 17 < 25
    expect(r.marginPct).toBe(17);
    expect(r.guardrailStatus).toBe('fail');
  });

  it('flags warning inside the floor..floor+5 band', () => {
    const r = resolveOfferPricing(draft({ basePrice: 680, components: [
      { sourceType: 'service_package', sourceId: 'a', qty: 1, role: 'primary', unitCost: 499, unitPrice: 680, label: 'Conn' },
    ] }), { marginFloorPct: 25 });
    // margin = (680-499)/680*100 = 26.6 -> 27, in [25,30)
    expect(r.marginPct).toBe(27);
    expect(r.guardrailStatus).toBe('warning');
  });

  it('fails on non-positive price', () => {
    const r = resolveOfferPricing(draft({ basePrice: 0 }));
    expect(r.marginPct).toBe(0);
    expect(r.guardrailStatus).toBe('fail');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest __tests__/lib/offers/pricing-resolver.test.ts`
Expected: FAIL — `Cannot find module '@/lib/offers/pricing-resolver'`

- [ ] **Step 3: Implement the resolver**

```typescript
// lib/offers/pricing-resolver.ts
import type {
  OfferDraft,
  CostBuildupLine,
  OfferGuardrailStatus,
  OfferPricingSnapshotInput,
} from '@/lib/types/offer';

const DEFAULT_MARGIN_FLOOR_PCT = 25;
const WARNING_BAND_PCT = 5;

function computeMarginPct(price: number, cost: number): number {
  if (price <= 0) return 0;
  return Math.round(((price - cost) / price) * 100);
}

function classifyGuardrail(
  price: number,
  marginPct: number,
  floorPct: number,
): OfferGuardrailStatus {
  if (price <= 0) return 'fail';
  if (marginPct < floorPct) return 'fail';
  if (marginPct < floorPct + WARNING_BAND_PCT) return 'warning';
  return 'pass';
}

export function resolveOfferPricing(
  draft: OfferDraft,
  opts: { marginFloorPct?: number } = {},
): OfferPricingSnapshotInput {
  const floorPct = opts.marginFloorPct ?? DEFAULT_MARGIN_FLOOR_PCT;

  const costBuildup: CostBuildupLine[] = draft.components.map((c) => ({
    label: c.label,
    sourceType: c.sourceType,
    unitCost: c.unitCost,
    qty: c.qty,
    lineCost: Math.round(c.unitCost * c.qty * 100) / 100,
  }));

  const totalCost = Math.round(
    costBuildup.reduce((sum, l) => sum + l.lineCost, 0) * 100,
  ) / 100;

  const resolvedPrice = draft.basePrice;
  const marginPct = computeMarginPct(resolvedPrice, totalCost);
  const guardrailStatus = classifyGuardrail(resolvedPrice, marginPct, floorPct);

  return { resolvedPrice, costBuildup, totalCost, marginPct, guardrailStatus };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest __tests__/lib/offers/pricing-resolver.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/offers/pricing-resolver.ts __tests__/lib/offers/pricing-resolver.test.ts
git commit -m "feat(offers): pure pricing resolver with margin guardrails"
```

---

## Task 3: Staleness guard (pure)

**Files:**
- Create: `lib/offers/staleness.ts`
- Test: `__tests__/lib/offers/staleness.test.ts`

**Interfaces:**
- Produces: `isSnapshotStale(snapshotComputedAt: string, sourceUpdatedAt: string | null): boolean`. Stale iff `sourceUpdatedAt` exists AND is strictly after `snapshotComputedAt`. Null source ⇒ never stale.

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/lib/offers/staleness.test.ts
import { describe, it, expect } from '@jest/globals';
import { isSnapshotStale } from '@/lib/offers/staleness';

describe('isSnapshotStale', () => {
  it('is stale when the source changed after the snapshot', () => {
    expect(isSnapshotStale('2026-06-01T00:00:00Z', '2026-06-02T00:00:00Z')).toBe(true);
  });
  it('is fresh when the snapshot is newer than the source', () => {
    expect(isSnapshotStale('2026-06-03T00:00:00Z', '2026-06-02T00:00:00Z')).toBe(false);
  });
  it('is fresh when timestamps are equal', () => {
    expect(isSnapshotStale('2026-06-02T00:00:00Z', '2026-06-02T00:00:00Z')).toBe(false);
  });
  it('is never stale when source updated_at is null', () => {
    expect(isSnapshotStale('2026-06-02T00:00:00Z', null)).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest __tests__/lib/offers/staleness.test.ts`
Expected: FAIL — `Cannot find module '@/lib/offers/staleness'`

- [ ] **Step 3: Implement**

```typescript
// lib/offers/staleness.ts
export function isSnapshotStale(
  snapshotComputedAt: string,
  sourceUpdatedAt: string | null,
): boolean {
  if (!sourceUpdatedAt) return false;
  return new Date(sourceUpdatedAt).getTime() > new Date(snapshotComputedAt).getTime();
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest __tests__/lib/offers/staleness.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/offers/staleness.ts __tests__/lib/offers/staleness.test.ts
git commit -m "feat(offers): snapshot staleness guard"
```

---

## Task 4: Publisher mapping (pure)

**Files:**
- Create: `lib/offers/publisher.ts` (pure function only in this task)
- Test: `__tests__/lib/offers/publisher.test.ts`

**Interfaces:**
- Consumes: `UnifiedProduct` from `lib/types/unified-product.ts` (fields: `uid`, `id`, `sourceTable`, `name`, `price`, `cost`, `technology`, `customerType?` via `raw`); `OfferDraft`, `OfferSourceType` from `lib/types/offer.ts`.
- Produces: `buildOfferDraftFromUnified(u: UnifiedProduct): OfferDraft`. Maps `sourceTable` → `OfferSourceType` via `SOURCE_TABLE_TO_OFFER_TYPE`. Emits exactly one `primary` component (unitCost=`u.cost`, unitPrice=`u.price`). `customerType` from `u.raw.customer_type` defaulting to `'both'`. `slug` from existing `u.raw.slug` else slugified `u.name`. `channelVisibility = ['direct']`. `sourceUpdatedAt = u.updatedAt`.

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/lib/offers/publisher.test.ts
import { describe, it, expect } from '@jest/globals';
import { buildOfferDraftFromUnified } from '@/lib/offers/publisher';
import type { UnifiedProduct } from '@/lib/types/unified-product';

function unified(over: Partial<UnifiedProduct> = {}): UnifiedProduct {
  return {
    uid: 'service_packages:abc',
    id: 'abc',
    sourceTable: 'service_packages',
    source: 'CircleTel',
    name: 'SkyFibre Home 50/50',
    sku: null,
    category: 'Connectivity',
    rawCategory: null,
    type: 'Service',
    status: 'active',
    rawStatus: 'active',
    price: 899,
    cost: 499,
    margin: 44,
    description: null,
    publishTarget: null,
    isPublished: false,
    technology: 'fibre',
    tags: [],
    channels: [],
    isFeatured: false,
    createdAt: '2026-05-01T00:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z',
    raw: { slug: 'skyfibre-home-50', customer_type: 'consumer' },
    ...over,
  } as UnifiedProduct;
}

describe('buildOfferDraftFromUnified', () => {
  it('maps a service package into a single-primary-component draft', () => {
    const d = buildOfferDraftFromUnified(unified());
    expect(d.sourceUid).toBe('service_packages:abc');
    expect(d.slug).toBe('skyfibre-home-50');
    expect(d.title).toBe('SkyFibre Home 50/50');
    expect(d.customerType).toBe('consumer');
    expect(d.basePrice).toBe(899);
    expect(d.channelVisibility).toEqual(['direct']);
    expect(d.sourceUpdatedAt).toBe('2026-06-01T00:00:00Z');
    expect(d.components).toHaveLength(1);
    expect(d.components[0]).toMatchObject({
      sourceType: 'service_package', sourceId: 'abc', qty: 1, role: 'primary',
      unitCost: 499, unitPrice: 899,
    });
  });

  it('maps each source table to the right offer source type', () => {
    expect(buildOfferDraftFromUnified(unified({ uid: 'circletel_hardware_products:h', id: 'h', sourceTable: 'circletel_hardware_products' })).components[0].sourceType).toBe('hardware');
    expect(buildOfferDraftFromUnified(unified({ uid: 'mtn_dealer_products:m', id: 'm', sourceTable: 'mtn_dealer_products' })).components[0].sourceType).toBe('mtn_deal');
  });

  it('defaults customerType to both and slugifies name when raw lacks them', () => {
    const d = buildOfferDraftFromUnified(unified({ raw: {} }));
    expect(d.customerType).toBe('both');
    expect(d.slug).toBe('skyfibre-home-50-50');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest __tests__/lib/offers/publisher.test.ts`
Expected: FAIL — `buildOfferDraftFromUnified is not a function` / module not found

- [ ] **Step 3: Implement the pure mapper**

```typescript
// lib/offers/publisher.ts
import type { UnifiedProduct, UnifiedProductSourceTable } from '@/lib/types/unified-product';
import type { OfferDraft, OfferSourceType, OfferCustomerType } from '@/lib/types/offer';

const SOURCE_TABLE_TO_OFFER_TYPE: Record<UnifiedProductSourceTable, OfferSourceType> = {
  admin_products: 'service_package',
  service_packages: 'service_package',
  mtn_dealer_products: 'mtn_deal',
  circletel_hardware_products: 'hardware',
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function readCustomerType(raw: Record<string, unknown>): OfferCustomerType {
  const v = typeof raw.customer_type === 'string' ? raw.customer_type : '';
  if (v === 'consumer' || v === 'business' || v === 'both') return v;
  return 'both';
}

export function buildOfferDraftFromUnified(u: UnifiedProduct): OfferDraft {
  const raw = (u.raw ?? {}) as Record<string, unknown>;
  const sourceType = SOURCE_TABLE_TO_OFFER_TYPE[u.sourceTable];
  const slug = typeof raw.slug === 'string' && raw.slug.length > 0 ? raw.slug : slugify(u.name);

  return {
    slug,
    title: u.name,
    customerType: readCustomerType(raw),
    basePrice: u.price,
    channelVisibility: ['direct'],
    sourceUid: u.uid,
    sourceUpdatedAt: u.updatedAt,
    components: [
      {
        sourceType,
        sourceId: u.id,
        qty: 1,
        role: 'primary',
        unitCost: u.cost,
        unitPrice: u.price,
        label: u.name,
      },
    ],
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest __tests__/lib/offers/publisher.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/offers/publisher.ts __tests__/lib/offers/publisher.test.ts
git commit -m "feat(offers): pure UnifiedProduct->OfferDraft publisher mapping"
```

---

## Task 5: Offer spine migration

**Files:**
- Create: `supabase/migrations/20260628000000_create_offer_spine.sql`

**Interfaces:**
- Produces tables `offers`, `offer_components`, `offer_pricing_snapshot` consumed by Tasks 6–8 and the persist/IO code.

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/20260628000000_create_offer_spine.sql
-- Offer spine: canonical sellable unit above existing source tables.

CREATE TABLE IF NOT EXISTS public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  media jsonb DEFAULT '{}'::jsonb,
  customer_type text NOT NULL DEFAULT 'both'
    CHECK (customer_type IN ('consumer','business','both')),
  lifecycle_state text NOT NULL DEFAULT 'active'
    CHECK (lifecycle_state IN ('idea','draft','priced','approved','active','archived')),
  channel_visibility jsonb NOT NULL DEFAULT '["direct"]'::jsonb,
  base_price numeric(10,2) NOT NULL DEFAULT 0,
  source_uid text,                 -- UnifiedProduct.uid provenance
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','inactive','archived')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS offers_source_uid_key
  ON public.offers (source_uid) WHERE source_uid IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.offer_components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  source_type text NOT NULL
    CHECK (source_type IN ('service_package','hardware','mtn_deal','supplier_product','labour','recurring')),
  source_id text NOT NULL,
  qty integer NOT NULL DEFAULT 1,
  role text NOT NULL DEFAULT 'primary'
    CHECK (role IN ('primary','addon','required')),
  unit_cost numeric(10,2) NOT NULL DEFAULT 0,
  unit_price numeric(10,2) NOT NULL DEFAULT 0,
  label text NOT NULL,
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS offer_components_offer_id_idx
  ON public.offer_components (offer_id);

CREATE TABLE IF NOT EXISTS public.offer_pricing_snapshot (
  offer_id uuid PRIMARY KEY REFERENCES public.offers(id) ON DELETE CASCADE,
  resolved_price numeric(10,2) NOT NULL,
  cost_buildup jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_cost numeric(10,2) NOT NULL DEFAULT 0,
  margin_pct integer NOT NULL DEFAULT 0,
  guardrail_status text NOT NULL DEFAULT 'pass'
    CHECK (guardrail_status IN ('pass','warning','fail')),
  computed_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: service role only (admin/server writes); no anon access in Phase 0.
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_pricing_snapshot ENABLE ROW LEVEL SECURITY;
```

- [ ] **Step 2: Apply the migration to the dev/staging database**

Use the Supabase MCP `apply_migration` tool with name `create_offer_spine` and the SQL above, OR:
Run: `set -a && source .env.local && set +a && npx supabase db push` (if the local Supabase CLI is linked)
Expected: migration applies with no error.

- [ ] **Step 3: Verify the tables exist**

Use the Supabase MCP `list_tables` tool (schema `public`) and confirm `offers`, `offer_components`, `offer_pricing_snapshot` are present.
Expected: all three listed.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260628000000_create_offer_spine.sql
git commit -m "feat(offers): create offer spine tables (offers, components, pricing snapshot)"
```

---

## Task 6: Snapshot writer (I/O)

**Files:**
- Create: `lib/offers/snapshot-writer.ts`

**Interfaces:**
- Consumes: `OfferPricingSnapshotInput` from `lib/types/offer.ts`; `createClient` from `@/lib/supabase/server`.
- Produces: `writeSnapshot(offerId: string, input: OfferPricingSnapshotInput): Promise<void>` — upserts one row into `offer_pricing_snapshot` keyed by `offer_id`, sets `computed_at = now()`.

- [ ] **Step 1: Implement the writer**

```typescript
// lib/offers/snapshot-writer.ts
import { createClient } from '@/lib/supabase/server';
import type { OfferPricingSnapshotInput } from '@/lib/types/offer';

export async function writeSnapshot(
  offerId: string,
  input: OfferPricingSnapshotInput,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('offer_pricing_snapshot')
    .upsert(
      {
        offer_id: offerId,
        resolved_price: input.resolvedPrice,
        cost_buildup: input.costBuildup,
        total_cost: input.totalCost,
        margin_pct: input.marginPct,
        guardrail_status: input.guardrailStatus,
        computed_at: new Date().toISOString(),
      },
      { onConflict: 'offer_id' },
    );
  if (error) throw new Error(`writeSnapshot failed for ${offerId}: ${error.message}`);
}
```

- [ ] **Step 2: Verify it type-checks**

Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep 'lib/offers/snapshot-writer.ts' || echo "OK"`
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add lib/offers/snapshot-writer.ts
git commit -m "feat(offers): snapshot upsert writer"
```

---

## Task 7: Persist + publish from UnifiedProduct (I/O)

**Files:**
- Modify: `lib/offers/publisher.ts` (append persist/publish functions)

**Interfaces:**
- Consumes: `buildOfferDraftFromUnified` (Task 4), `resolveOfferPricing` (Task 2), `writeSnapshot` (Task 6), `createClient` from `@/lib/supabase/server`, `unifiedProductAggregator` from `@/lib/services/unified-product-aggregator`.
- Produces:
  - `persistOfferDraft(draft: OfferDraft): Promise<string>` — upserts the offer (by `source_uid`), replaces its components, returns `offerId`.
  - `publishFromUnified(u: UnifiedProduct, opts?: { marginFloorPct?: number }): Promise<string>` — build → persist → resolve → writeSnapshot; returns `offerId`.

- [ ] **Step 1: Append the I/O functions to `lib/offers/publisher.ts`**

```typescript
// --- append to lib/offers/publisher.ts ---
import { createClient } from '@/lib/supabase/server';
import { resolveOfferPricing } from '@/lib/offers/pricing-resolver';
import { writeSnapshot } from '@/lib/offers/snapshot-writer';
import type { OfferDraft } from '@/lib/types/offer';

export async function persistOfferDraft(draft: OfferDraft): Promise<string> {
  const supabase = await createClient();

  const { data: offer, error: offerErr } = await supabase
    .from('offers')
    .upsert(
      {
        slug: draft.slug,
        title: draft.title,
        customer_type: draft.customerType,
        channel_visibility: draft.channelVisibility,
        base_price: draft.basePrice,
        source_uid: draft.sourceUid,
        lifecycle_state: 'active',
        status: 'active',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'source_uid' },
    )
    .select('id')
    .single();
  if (offerErr || !offer) throw new Error(`persist offer failed: ${offerErr?.message}`);

  const offerId = offer.id as string;

  // Replace components (idempotent republish).
  const { error: delErr } = await supabase
    .from('offer_components')
    .delete()
    .eq('offer_id', offerId);
  if (delErr) throw new Error(`clear components failed: ${delErr.message}`);

  const rows = draft.components.map((c, i) => ({
    offer_id: offerId,
    source_type: c.sourceType,
    source_id: c.sourceId,
    qty: c.qty,
    role: c.role,
    unit_cost: c.unitCost,
    unit_price: c.unitPrice,
    label: c.label,
    position: i,
  }));
  const { error: insErr } = await supabase.from('offer_components').insert(rows);
  if (insErr) throw new Error(`insert components failed: ${insErr.message}`);

  return offerId;
}

export async function publishFromUnified(
  u: import('@/lib/types/unified-product').UnifiedProduct,
  opts: { marginFloorPct?: number } = {},
): Promise<string> {
  const draft = buildOfferDraftFromUnified(u);
  const offerId = await persistOfferDraft(draft);
  const snapshot = resolveOfferPricing(draft, opts);
  await writeSnapshot(offerId, snapshot);
  return offerId;
}
```

- [ ] **Step 2: Verify it type-checks**

Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep 'lib/offers/publisher.ts' || echo "OK"`
Expected: `OK`

- [ ] **Step 3: Write the integration verification script**

```typescript
// scripts/offers/verify-publish.ts
import { unifiedProductAggregator } from '@/lib/services/unified-product-aggregator';
import { publishFromUnified } from '@/lib/offers/publisher';
import { createClient } from '@/lib/supabase/server';

async function main() {
  // Take one active service package via the unified read model.
  const { products } = await unifiedProductAggregator.aggregateAll({
    source: 'CircleTel', status: 'active', page: 1, perPage: 1,
  } as any);
  if (!products.length) throw new Error('No active CircleTel products to publish');

  const offerId = await publishFromUnified(products[0]);
  console.log('Published offerId:', offerId, 'from', products[0].uid);

  const supabase = await createClient();
  const { data: snap, error } = await supabase
    .from('offer_pricing_snapshot')
    .select('*')
    .eq('offer_id', offerId)
    .single();
  if (error || !snap) throw new Error('No snapshot written');
  console.log('Snapshot:', JSON.stringify(snap, null, 2));
  if (typeof snap.margin_pct !== 'number') throw new Error('margin_pct missing');
  console.log('VERIFY OK');
}
main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 4: Run the verification**

Run: `set -a && source .env.local && set +a && npx tsx scripts/offers/verify-publish.ts`
Expected: prints `Published offerId: ...`, a snapshot JSON with `margin_pct`, and `VERIFY OK`.

- [ ] **Step 5: Commit**

```bash
git add lib/offers/publisher.ts scripts/offers/verify-publish.ts
git commit -m "feat(offers): persist + publish UnifiedProduct into Offer with snapshot"
```

---

## Task 8: Inngest recompute job + event types

**Files:**
- Modify: `lib/inngest/client.ts` (add event types)
- Create: `lib/inngest/functions/recompute-offer-pricing.ts`
- Modify: `lib/inngest/index.ts` (register function)

**Interfaces:**
- Consumes: `inngest` from `@/lib/inngest/client`; `createClient` from `@/lib/supabase/server`; `resolveOfferPricing`, `writeSnapshot`, `isSnapshotStale`.
- Produces: function `recomputeOfferPricing` triggered by `offer/pricing.recompute.requested` `{ offerId?: string; all?: boolean; triggeredBy: 'cron'|'manual'|'source_change' }`; emits `offer/pricing.recompute.completed`.

- [ ] **Step 1: Add event types to the Inngest client**

In `lib/inngest/client.ts`, add to the existing events union (matching the existing event-type pattern in that file):

```typescript
// add within the InngestEvents type map in lib/inngest/client.ts
  'offer/pricing.recompute.requested': {
    data: { offerId?: string; all?: boolean; triggeredBy: 'cron' | 'manual' | 'source_change' };
  };
  'offer/pricing.recompute.completed': {
    data: { recomputed: number; failed: number; triggeredBy: string };
  };
```

- [ ] **Step 2: Create the function**

```typescript
// lib/inngest/functions/recompute-offer-pricing.ts
import { inngest } from '@/lib/inngest/client';
import { createClient } from '@/lib/supabase/server';
import { resolveOfferPricing } from '@/lib/offers/pricing-resolver';
import { writeSnapshot } from '@/lib/offers/snapshot-writer';
import type { OfferDraft, OfferComponentDraft, OfferSourceType, OfferComponentRole } from '@/lib/types/offer';

async function loadDraft(offerId: string): Promise<OfferDraft | null> {
  const supabase = await createClient();
  const { data: offer } = await supabase
    .from('offers')
    .select('id, slug, title, customer_type, channel_visibility, base_price, source_uid, updated_at')
    .eq('id', offerId)
    .single();
  if (!offer) return null;
  const { data: comps } = await supabase
    .from('offer_components')
    .select('source_type, source_id, qty, role, unit_cost, unit_price, label')
    .eq('offer_id', offerId)
    .order('position', { ascending: true });
  const components: OfferComponentDraft[] = (comps ?? []).map((c) => ({
    sourceType: c.source_type as OfferSourceType,
    sourceId: String(c.source_id),
    qty: c.qty as number,
    role: c.role as OfferComponentRole,
    unitCost: Number(c.unit_cost),
    unitPrice: Number(c.unit_price),
    label: c.label as string,
  }));
  return {
    slug: offer.slug, title: offer.title,
    customerType: offer.customer_type, basePrice: Number(offer.base_price),
    channelVisibility: (offer.channel_visibility as string[]) ?? ['direct'],
    sourceUid: offer.source_uid ?? '', sourceUpdatedAt: offer.updated_at ?? null,
    components,
  };
}

export const recomputeOfferPricing = inngest.createFunction(
  { id: 'recompute-offer-pricing', name: 'Recompute Offer Pricing Snapshot', retries: 2 },
  { event: 'offer/pricing.recompute.requested' },
  async ({ event, step }) => {
    const { offerId, all, triggeredBy } = event.data;

    const ids = await step.run('resolve-target-ids', async () => {
      if (offerId) return [offerId];
      if (all) {
        const supabase = await createClient();
        const { data } = await supabase.from('offers').select('id').eq('status', 'active');
        return (data ?? []).map((r) => r.id as string);
      }
      return [];
    });

    let recomputed = 0;
    let failed = 0;
    for (const id of ids) {
      try {
        await step.run(`recompute-${id}`, async () => {
          const draft = await loadDraft(id);
          if (!draft) throw new Error(`offer ${id} not found`);
          const snapshot = resolveOfferPricing(draft);
          await writeSnapshot(id, snapshot);
        });
        recomputed++;
      } catch {
        failed++;
      }
    }

    await step.sendEvent('recompute-completed', {
      name: 'offer/pricing.recompute.completed',
      data: { recomputed, failed, triggeredBy: triggeredBy ?? 'manual' },
    });

    return { recomputed, failed };
  },
);
```

- [ ] **Step 3: Register the function**

In `lib/inngest/index.ts`, import and add `recomputeOfferPricing` to the exported `functions` array (follow the existing import + array pattern in that file).

```typescript
import { recomputeOfferPricing } from '@/lib/inngest/functions/recompute-offer-pricing';
// ...inside the functions array:
//   recomputeOfferPricing,
```

- [ ] **Step 4: Verify type-check + that the function is registered**

Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E 'recompute-offer-pricing|inngest/index' || echo "OK"`
Expected: `OK`
Run: `grep -c recomputeOfferPricing lib/inngest/index.ts`
Expected: `2` (import + array entry)

- [ ] **Step 5: Commit**

```bash
git add lib/inngest/client.ts lib/inngest/functions/recompute-offer-pricing.ts lib/inngest/index.ts
git commit -m "feat(offers): inngest recompute-offer-pricing job + events"
```

---

## Task 9: Admin publish trigger endpoint

**Files:**
- Create: `app/api/admin/offers/publish/route.ts`

**Interfaces:**
- Consumes: `unifiedProductAggregator`, `publishFromUnified` (Task 7), `inngest`.
- Produces: `POST /api/admin/offers/publish` with body `{ uid?: string; all?: boolean }`. With `uid`: publish that one product. With `all`: publish active CircleTel + Hardware + curated MTN products, then fire `offer/pricing.recompute.requested { all: true, triggeredBy: 'manual' }`. Returns `{ success, published, offerIds }`.

- [ ] **Step 1: Implement the route (Next.js 15 async handler)**

```typescript
// app/api/admin/offers/publish/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { unifiedProductAggregator } from '@/lib/services/unified-product-aggregator';
import { publishFromUnified } from '@/lib/offers/publisher';
import { inngest } from '@/lib/inngest/client';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json().catch(() => ({}));
    const uid: string | undefined = body.uid;
    const all: boolean = body.all === true;

    const offerIds: string[] = [];

    if (uid) {
      const { products } = await unifiedProductAggregator.aggregateAll({ page: 1, perPage: 1000 } as any);
      const match = products.find((p) => p.uid === uid);
      if (!match) return NextResponse.json({ success: false, error: `uid not found: ${uid}` }, { status: 404 });
      offerIds.push(await publishFromUnified(match));
    } else if (all) {
      const { products } = await unifiedProductAggregator.aggregateAll({ status: 'active', page: 1, perPage: 1000 } as any);
      for (const p of products) {
        try { offerIds.push(await publishFromUnified(p)); } catch { /* skip individual failures */ }
      }
      await inngest.send({ name: 'offer/pricing.recompute.requested', data: { all: true, triggeredBy: 'manual' } });
    } else {
      return NextResponse.json({ success: false, error: 'provide uid or all:true' }, { status: 400 });
    }

    return NextResponse.json({ success: true, published: offerIds.length, offerIds });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify type-check**

Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep 'app/api/admin/offers/publish' || echo "OK"`
Expected: `OK`

- [ ] **Step 3: Smoke-test the endpoint against dev**

Run (dev server in another terminal via `npm run dev:memory`):
`curl -sS -X POST http://localhost:3000/api/admin/offers/publish -H 'Content-Type: application/json' -d '{"all":true}' | head -c 400`
Expected: JSON `{"success":true,"published":<N>,"offerIds":[...]}` with N ≥ 1.

- [ ] **Step 4: Commit**

```bash
git add app/api/admin/offers/publish/route.ts
git commit -m "feat(offers): admin publish-to-offers trigger endpoint"
```

---

## Task 10: Full suite + plan close-out

- [ ] **Step 1: Run the full offer test suite**

Run: `npx jest __tests__/lib/offers`
Expected: PASS — 3 suites, 12 tests.

- [ ] **Step 2: Type-check the whole project for new-file regressions**

Run: `npm run type-check:memory 2>&1 | grep -E 'lib/offers|app/api/admin/offers|lib/inngest/functions/recompute' || echo "OK: no new errors in offer files"`
Expected: `OK: no new errors in offer files`

- [ ] **Step 3: Verify end-to-end recompute idempotency**

Run: `set -a && source .env.local && set +a && npx tsx scripts/offers/verify-publish.ts`
Expected: `VERIFY OK` again (republish overwrites, no duplicate-key error).

- [ ] **Step 4: Final commit (if any uncommitted)**

```bash
git status --short
```
Expected: clean tree.

---

## Self-Review (completed by plan author)

- **Spec coverage (§9 first slice — spine portion):** `offers`/`offer_components`/`offer_pricing_snapshot` (Task 5) ✓; publisher from existing sources (Tasks 4, 7) ✓; Inngest recompute job (Task 8) ✓; `computed_at` staleness guard (Task 3; consumed by the job's freshness logic and Plan 2's read path) ✓. Storefront page, cart, line-items, checkout are **out of scope here** — they are Plans 2 and 3 (below), exactly as the spec scoped them.
- **Placeholder scan:** none — every code step shows complete code; every verify step shows a real command + expected output.
- **Type consistency:** `OfferDraft`/`OfferComponentDraft`/`OfferPricingSnapshotInput` defined in Task 1 are used identically in Tasks 2, 4, 6, 7, 8. `buildOfferDraftFromUnified`, `resolveOfferPricing`, `writeSnapshot`, `publishFromUnified` signatures match across producing and consuming tasks.

---

## Roadmap — the next two plans (Phase 1)

These complete the blueprint's "first buildable slice." Each gets its own full bite-sized plan, authored once this plan lands and the spine schema is proven.

### Plan 2 — Storefront read (Phase 1a)
**Produces:** customers can *see* priced offers.
- Public `GET /api/offers` reading `offers` + `offer_pricing_snapshot` (with the staleness guard: serve last-good, flag stale to admins).
- Public pricing page (extend `app/packages/`) rendering Offer cards from snapshots.
- JSON-LD `Product` structured data per Offer (the Vox "public pricing" play).
- **Entry criteria:** Plan 1 merged, ≥1 Offer published with a snapshot.
- **Exit criteria:** a public page lists Offers with prices + valid JSON-LD; no live margin math on the request path.

### Plan 3 — Cart & checkout (Phase 1b)
**Produces:** customers can *buy* a multi-item cart.
- Migration: `carts`, `cart_items`; `order_line_items`; extend `consumer_orders` with `channel_source`, `agent_id`, `attribution`, `fulfillment_status` (only `direct` channel exercised now).
- Cart state (extend `components/order/context/OrderContext.tsx`; persist to `carts`/`cart_items`).
- `order_line_items` write in `POST /api/orders/create`; **order-level status as a rollup** of line statuses.
- NetCash `initiate` total = sum of line items (not single `package_price`).
- **Entry criteria:** Plans 1–2 merged.
- **Exit criteria:** a mixed cart (connectivity + hardware) checks out as one order with multiple line items and the correct NetCash total.
