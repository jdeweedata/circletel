# Offer Storefront Read (`/offers`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a public, snapshot-fed product catalogue at `/offers` (list + per-offer detail) with VAT-inclusive pricing and JSON-LD structured data, reading the Offer Spine produced in Phase 0.

**Architecture:** A single `server-only` read module (`lib/offers/public-read.ts`) is the sole sanitization + VAT boundary: it reads `offers ⋈ offer_pricing_snapshot ⋈ offer_components` via the service-role client, applies a service-package-only VAT-basis guard, and emits VAT-inclusive public DTOs that never carry cost/margin/provenance. API route handlers and statically-rendered (ISR) pages consume only that module; the list page filters consumer/business client-side to stay static.

**Tech Stack:** Next.js 15 (App Router, async params, ISR), TypeScript (strict), Supabase (`@/lib/supabase/server`), Jest + ts-jest, Tailwind, `server-only`.

**Spec:** `docs/superpowers/specs/2026-06-28-offer-storefront-read-design.md`

## Global Constraints

- **Read-only.** No write paths, migrations, cart, or checkout. No new DB columns.
- **VAT:** `offer_pricing_snapshot.resolved_price` is **ex-VAT**. The public surface exposes **only** `priceInclVat` (= `round(resolved_price * 1.15 * 100)/100`), `vatRate` (`0.15`), `vatLabel` (`"incl. VAT"`). Never expose `priceExclVat` / raw `resolved_price`.
- **VAT-basis guard:** Only offers with `offers.source_uid` starting `service_packages:` **and** a primary `offer_components.source_type = 'service_package'` may be exposed. All other sources are logged and excluded (`admin_products:*` also maps to `source_type='service_package'`, so the `source_uid` prefix is the real proof).
- **Never expose:** `cost_buildup`, `total_cost`, `margin_pct`, `guardrail_status`, `source_uid`, `source_type`, `source_id`, component `unit_cost`/`unit_price`, or the raw `media` blob (whitelist `media.description` + `media.image` strings only).
- **`lib/offers/public-read.ts` first line is `import 'server-only'`.** It must never be imported by a client component.
- **Next.js 15 API routes:** `context: { params: Promise<{ slug: string }> }`, `const { slug } = await context.params`.
- **Pages are static + ISR** (`export const revalidate = 300`). The list page takes **no `searchParams`** (tabs are client-side).
- **Run scripts** with `set -a && source .env.local && set +a && npx tsx <script>`.
- Test runner: `npx jest <path>`. Tests use `@jest/globals` + path alias `@/`.

---

### Task 1: VAT helper (`lib/billing/vat.ts`)

**Files:**
- Create: `lib/billing/vat.ts`
- Test: `__tests__/lib/billing/vat.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `export const VAT_RATE = 0.15`; `export function addVat(excl: number): number` (rounds to 2 decimals).

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/lib/billing/vat.test.ts
import { describe, it, expect } from '@jest/globals';
import { VAT_RATE, addVat } from '@/lib/billing/vat';

describe('vat helper', () => {
  it('VAT_RATE is 0.15', () => {
    expect(VAT_RATE).toBe(0.15);
  });
  it('addVat grosses up ex-VAT to incl-VAT, rounded to 2dp', () => {
    expect(addVat(1899)).toBe(2183.85);   // 1899 * 1.15 = 2183.85
    expect(addVat(499)).toBe(573.85);     // 499 * 1.15 = 573.85
    expect(addVat(0)).toBe(0);
  });
  it('rounds half-cent correctly', () => {
    expect(addVat(100.005)).toBe(115.01); // 100.005*1.15=115.00575 -> 115.01
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/lib/billing/vat.test.ts`
Expected: FAIL — `Cannot find module '@/lib/billing/vat'`.

- [ ] **Step 3: Write minimal implementation**

```typescript
// lib/billing/vat.ts
export const VAT_RATE = 0.15;

/** Gross an ex-VAT ZAR amount up to VAT-inclusive, rounded to 2 decimals. */
export function addVat(excl: number): number {
  return Math.round(excl * (1 + VAT_RATE) * 100) / 100;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/lib/billing/vat.test.ts`
Expected: PASS (4 assertions).

- [ ] **Step 5: Commit**

```bash
git add lib/billing/vat.ts __tests__/lib/billing/vat.test.ts
git commit -m "feat(billing): shared VAT_RATE + addVat helper"
```

---

### Task 2: Public-read setup + sanitization mapper (`lib/offers/public-read.ts` core)

This task adds the `server-only` dependency + jest mapping, the public DTO types, and the **pure** `mapOfferRow` function — the single security boundary. No DB access yet.

**Files:**
- Modify: `package.json` (add `server-only` dependency), `jest.config.js` (map `^server-only$`)
- Create: `__mocks__/empty-module.js`
- Modify: `lib/types/offer.ts` (append public DTO types)
- Create: `lib/offers/public-read.ts` (import + types re-export + `mapOfferRow`)
- Test: `__tests__/lib/offers/public-read-map.test.ts`

**Interfaces:**
- Consumes: `addVat`, `VAT_RATE` from Task 1.
- Produces:
  - `interface PublicOffer { slug: string; title: string; customerType: 'consumer'|'business'|'both'; priceInclVat: number; vatRate: number; vatLabel: string; description?: string; image?: string }`
  - `interface PublicOfferDetail extends PublicOffer {}` (same shape in Plan 2)
  - `interface OfferReadRow` (raw row shape from the query — see Step 4)
  - `export function mapOfferRow(row: OfferReadRow): PublicOffer | null` (returns `null` when the VAT-basis guard fails)

- [ ] **Step 1: Add `server-only` dependency and jest mapping**

Run:
```bash
npm install server-only
```
Then create the jest stub and map it.

```javascript
// __mocks__/empty-module.js
module.exports = {};
```

In `jest.config.js`, add the `server-only` mapping inside the existing `moduleNameMapper` (which currently only has `'^@/(.*)$'`):

```javascript
  moduleNameMapper: {
    '^server-only$': '<rootDir>/__mocks__/empty-module.js',
    '^@/(.*)$': '<rootDir>/$1',
  },
```

- [ ] **Step 2: Verify existing tests still pass with the new mapping**

Run: `npx jest __tests__/lib/offers/`
Expected: PASS (the Phase 0 offers tests — pricing-resolver, staleness, publisher — still green; mapping change is inert for them).

- [ ] **Step 3: Append public DTO types to `lib/types/offer.ts`**

Append at the end of `lib/types/offer.ts`:

```typescript
/** Public, sanitized offer for the storefront (no cost/margin/provenance). */
export interface PublicOffer {
  slug: string;
  title: string;
  customerType: OfferCustomerType;
  priceInclVat: number;   // ZAR incl. 15% VAT — the only price ever shown
  vatRate: number;        // 0.15
  vatLabel: string;       // "incl. VAT"
  description?: string;   // from media.description (string) only
  image?: string;         // from media.image (string) only
}

/** Detail-page shape — identical to PublicOffer in Plan 2. */
export type PublicOfferDetail = PublicOffer;
```

- [ ] **Step 4: Write the failing test for the mapper**

```typescript
// __tests__/lib/offers/public-read-map.test.ts
import { describe, it, expect } from '@jest/globals';
import { mapOfferRow, type OfferReadRow } from '@/lib/offers/public-read';

function row(over: Partial<OfferReadRow> = {}): OfferReadRow {
  return {
    slug: 'skyfibre-home-50',
    title: 'SkyFibre Home 50/50',
    customer_type: 'consumer',
    source_uid: 'service_packages:abc',
    media: {},
    offer_pricing_snapshot: { resolved_price: 1899 },
    offer_components: [{ role: 'primary', source_type: 'service_package' }],
    ...over,
  };
}

describe('mapOfferRow — sanitization + VAT + guard', () => {
  it('maps a service-package offer to a VAT-inclusive public DTO', () => {
    const r = mapOfferRow(row());
    expect(r).toEqual({
      slug: 'skyfibre-home-50',
      title: 'SkyFibre Home 50/50',
      customerType: 'consumer',
      priceInclVat: 2183.85,
      vatRate: 0.15,
      vatLabel: 'incl. VAT',
    });
  });

  it('never includes cost/margin/provenance keys', () => {
    const r = mapOfferRow(row()) as Record<string, unknown>;
    for (const k of ['resolved_price', 'priceExclVat', 'total_cost', 'margin_pct',
      'cost_buildup', 'guardrail_status', 'source_uid', 'source_type', 'source_id']) {
      expect(r).not.toHaveProperty(k);
    }
  });

  it('whitelists only media.description and media.image strings', () => {
    const r = mapOfferRow(row({ media: { description: 'Fast fibre', image: 'http://img/x.jpg', secret: 'NO', cost: 123 } }))!;
    expect(r.description).toBe('Fast fibre');
    expect(r.image).toBe('http://img/x.jpg');
    expect(r as Record<string, unknown>).not.toHaveProperty('secret');
    expect(r as Record<string, unknown>).not.toHaveProperty('cost');
  });

  it('omits description/image when media is empty or non-string', () => {
    const r = mapOfferRow(row({ media: { description: 42 as unknown as string } }))!;
    expect(r.description).toBeUndefined();
    expect(r.image).toBeUndefined();
  });

  it('returns null when source_uid is not a service_packages: row (admin_products excluded)', () => {
    expect(mapOfferRow(row({ source_uid: 'admin_products:xyz' }))).toBeNull();
    expect(mapOfferRow(row({ source_uid: 'mtn_dealer_products:1' }))).toBeNull();
  });

  it('returns null when the primary component is not source_type service_package', () => {
    expect(mapOfferRow(row({ offer_components: [{ role: 'primary', source_type: 'hardware' }] }))).toBeNull();
  });

  it('tolerates the snapshot arriving as a single-element array', () => {
    const r = mapOfferRow(row({ offer_pricing_snapshot: [{ resolved_price: 1899 }] as unknown as OfferReadRow['offer_pricing_snapshot'] }))!;
    expect(r.priceInclVat).toBe(2183.85);
  });

  it('returns null when no snapshot price exists', () => {
    expect(mapOfferRow(row({ offer_pricing_snapshot: null as unknown as OfferReadRow['offer_pricing_snapshot'] }))).toBeNull();
  });
});
```

- [ ] **Step 5: Run test to verify it fails**

Run: `npx jest __tests__/lib/offers/public-read-map.test.ts`
Expected: FAIL — `Cannot find module '@/lib/offers/public-read'`.

- [ ] **Step 6: Write the mapper implementation**

```typescript
// lib/offers/public-read.ts
import 'server-only';
import { addVat, VAT_RATE } from '@/lib/billing/vat';
import type { PublicOffer, OfferCustomerType } from '@/lib/types/offer';
import { apiLogger } from '@/lib/logging/logger';

export type { PublicOffer, PublicOfferDetail } from '@/lib/types/offer';

/** Raw row shape returned by the storefront query (see listPublicOffers). */
export interface OfferReadRow {
  slug: string;
  title: string;
  customer_type: OfferCustomerType;
  source_uid: string | null;
  media: Record<string, unknown> | null;
  offer_pricing_snapshot:
    | { resolved_price: number }
    | { resolved_price: number }[]
    | null;
  offer_components: { role: string; source_type: string }[] | null;
}

const VAT_LABEL = 'incl. VAT';

function firstSnapshot(s: OfferReadRow['offer_pricing_snapshot']): { resolved_price: number } | null {
  if (!s) return null;
  return Array.isArray(s) ? (s[0] ?? null) : s;
}

function whitelistedString(media: Record<string, unknown> | null, key: string): string | undefined {
  const v = media?.[key];
  return typeof v === 'string' ? v : undefined;
}

/**
 * Pure sanitization + VAT + VAT-basis guard. Returns null when the offer is not
 * a service_packages-sourced row (the only ex-VAT basis we may expose) or has no price.
 */
export function mapOfferRow(row: OfferReadRow): PublicOffer | null {
  // VAT-basis guard: source_uid prefix is the source-table proof; component type alone
  // is insufficient (admin_products also maps to source_type 'service_package').
  const fromServicePackages = (row.source_uid ?? '').startsWith('service_packages:');
  const primary = (row.offer_components ?? []).find((c) => c.role === 'primary');
  const primaryIsServicePackage = primary?.source_type === 'service_package';
  if (!fromServicePackages || !primaryIsServicePackage) {
    apiLogger.warn('[offers/public-read] excluded non-service_package offer', { slug: row.slug, sourceUid: row.source_uid });
    return null;
  }

  const snap = firstSnapshot(row.offer_pricing_snapshot);
  if (!snap || typeof snap.resolved_price !== 'number') return null;

  const description = whitelistedString(row.media, 'description');
  const image = whitelistedString(row.media, 'image');

  return {
    slug: row.slug,
    title: row.title,
    customerType: row.customer_type,
    priceInclVat: addVat(snap.resolved_price),
    vatRate: VAT_RATE,
    vatLabel: VAT_LABEL,
    ...(description ? { description } : {}),
    ...(image ? { image } : {}),
  };
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npx jest __tests__/lib/offers/public-read-map.test.ts`
Expected: PASS (8 assertions).

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json jest.config.js __mocks__/empty-module.js lib/types/offer.ts lib/offers/public-read.ts __tests__/lib/offers/public-read-map.test.ts
git commit -m "feat(offers): public-read sanitization mapper + server-only + DTO types"
```

---

### Task 3: Public-read DB functions (`listPublicOffers`, `getPublicOfferBySlug`)

**Files:**
- Modify: `lib/offers/public-read.ts` (append DB functions)
- Test: `__tests__/lib/offers/public-read-db.test.ts`

**Interfaces:**
- Consumes: `mapOfferRow`, `OfferReadRow` (Task 2); `createClient` from `@/lib/supabase/server`.
- Produces:
  - `export type OfferSegment = 'consumer' | 'business' | 'all'`
  - `export async function listPublicOffers(segment?: OfferSegment): Promise<PublicOffer[]>`
  - `export async function getPublicOfferBySlug(slug: string): Promise<PublicOfferDetail | null>`
  - `export const OFFER_SELECT` (the PostgREST select string, exported for reuse/tests)

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/lib/offers/public-read-db.test.ts
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }));
import { createClient } from '@/lib/supabase/server';
import { listPublicOffers, getPublicOfferBySlug } from '@/lib/offers/public-read';

function makeClient(result: { data: any; error: any }) {
  const builder: any = {
    select: () => builder,
    eq: () => builder,
    order: () => builder,
    then: (ok: any, err?: any) => Promise.resolve(result).then(ok, err),
  };
  return { from: () => builder };
}

const sp = (over: any = {}) => ({
  slug: 'sky-50', title: 'SkyFibre 50', customer_type: 'consumer',
  source_uid: 'service_packages:a', media: {},
  offer_pricing_snapshot: { resolved_price: 1899 },
  offer_components: [{ role: 'primary', source_type: 'service_package' }],
  ...over,
});

describe('public-read DB functions', () => {
  beforeEach(() => jest.clearAllMocks());

  it('listPublicOffers maps + drops excluded sources', async () => {
    (createClient as jest.Mock).mockResolvedValue(makeClient({
      data: [sp(), sp({ slug: 'admin-1', source_uid: 'admin_products:x' })], error: null,
    }));
    const offers = await listPublicOffers('all');
    expect(offers).toHaveLength(1);
    expect(offers[0]).toMatchObject({ slug: 'sky-50', priceInclVat: 2183.85, vatLabel: 'incl. VAT' });
  });

  it('listPublicOffers filters by segment (business excludes consumer-only)', async () => {
    (createClient as jest.Mock).mockResolvedValue(makeClient({
      data: [sp({ slug: 'c', customer_type: 'consumer' }), sp({ slug: 'b', customer_type: 'business' }), sp({ slug: 'x', customer_type: 'both' })],
      error: null,
    }));
    const slugs = (await listPublicOffers('business')).map((o) => o.slug);
    expect(slugs).toEqual(['b', 'x']);
  });

  it('listPublicOffers returns [] on db error', async () => {
    (createClient as jest.Mock).mockResolvedValue(makeClient({ data: null, error: { message: 'boom' } }));
    expect(await listPublicOffers()).toEqual([]);
  });

  it('getPublicOfferBySlug returns the mapped offer', async () => {
    (createClient as jest.Mock).mockResolvedValue(makeClient({ data: [sp()], error: null }));
    expect(await getPublicOfferBySlug('sky-50')).toMatchObject({ slug: 'sky-50', priceInclVat: 2183.85 });
  });

  it('getPublicOfferBySlug returns null for an excluded source', async () => {
    (createClient as jest.Mock).mockResolvedValue(makeClient({ data: [sp({ source_uid: 'admin_products:x' })], error: null }));
    expect(await getPublicOfferBySlug('admin-1')).toBeNull();
  });

  it('getPublicOfferBySlug returns null when not found', async () => {
    (createClient as jest.Mock).mockResolvedValue(makeClient({ data: [], error: null }));
    expect(await getPublicOfferBySlug('nope')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/lib/offers/public-read-db.test.ts`
Expected: FAIL — `listPublicOffers is not a function`.

- [ ] **Step 3: Append DB functions to `lib/offers/public-read.ts`**

```typescript
// --- append to lib/offers/public-read.ts ---
import { createClient } from '@/lib/supabase/server';
import type { PublicOfferDetail } from '@/lib/types/offer';

export type OfferSegment = 'consumer' | 'business' | 'all';

/** PostgREST select: offer + its snapshot (inner) + components, public-safe columns only. */
export const OFFER_SELECT =
  'slug,title,customer_type,source_uid,media,' +
  'offer_pricing_snapshot!inner(resolved_price),' +
  'offer_components(role,source_type)';

function matchesSegment(customerType: string, segment: OfferSegment): boolean {
  if (segment === 'all') return true;
  if (segment === 'consumer') return customerType === 'consumer' || customerType === 'both';
  return customerType === 'business' || customerType === 'both';
}

export async function listPublicOffers(segment: OfferSegment = 'all'): Promise<PublicOffer[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('offers')
    .select(OFFER_SELECT)
    .eq('status', 'active')
    .eq('lifecycle_state', 'active');

  if (error || !data) {
    if (error) apiLogger.error('[offers/public-read] list failed', { error: error.message });
    return [];
  }

  return (data as unknown as OfferReadRow[])
    .filter((r) => matchesSegment(r.customer_type, segment))
    .map(mapOfferRow)
    .filter((o): o is PublicOffer => o !== null);
}

export async function getPublicOfferBySlug(slug: string): Promise<PublicOfferDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('offers')
    .select(OFFER_SELECT)
    .eq('status', 'active')
    .eq('lifecycle_state', 'active')
    .eq('slug', slug);

  if (error || !data || data.length === 0) {
    if (error) apiLogger.error('[offers/public-read] detail failed', { error: error.message, slug });
    return null;
  }
  return mapOfferRow((data as unknown as OfferReadRow[])[0]);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/lib/offers/public-read-db.test.ts`
Expected: PASS (6 assertions).

- [ ] **Step 5: Commit**

```bash
git add lib/offers/public-read.ts __tests__/lib/offers/public-read-db.test.ts
git commit -m "feat(offers): listPublicOffers + getPublicOfferBySlug (service-role read)"
```

---

### Task 4: List API route (`GET /api/offers`)

**Files:**
- Create: `app/api/offers/route.ts`
- Test: `__tests__/app/api/offers/list-route.test.ts`

**Interfaces:**
- Consumes: `listPublicOffers`, `OfferSegment` (Task 3).
- Produces: `GET` handler → `{ offers: PublicOffer[] }` (200), or `{ error }` (400 on invalid segment).

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/app/api/offers/list-route.test.ts
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

jest.mock('@/lib/offers/public-read', () => ({
  listPublicOffers: jest.fn(),
}));
import { listPublicOffers } from '@/lib/offers/public-read';
import { GET } from '@/app/api/offers/route';
import { NextRequest } from 'next/server';

const req = (url: string) => new NextRequest(new URL(url, 'http://localhost'));

describe('GET /api/offers', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns offers for a valid segment', async () => {
    (listPublicOffers as jest.Mock).mockResolvedValue([{ slug: 's', priceInclVat: 100 }]);
    const res = await GET(req('/api/offers?segment=consumer'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ offers: [{ slug: 's', priceInclVat: 100 }] });
    expect(listPublicOffers).toHaveBeenCalledWith('consumer');
  });

  it('defaults to segment=all when omitted', async () => {
    (listPublicOffers as jest.Mock).mockResolvedValue([]);
    await GET(req('/api/offers'));
    expect(listPublicOffers).toHaveBeenCalledWith('all');
  });

  it('400s on an invalid segment', async () => {
    const res = await GET(req('/api/offers?segment=bogus'));
    expect(res.status).toBe(400);
    expect(listPublicOffers).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/app/api/offers/list-route.test.ts`
Expected: FAIL — `Cannot find module '@/app/api/offers/route'`.

- [ ] **Step 3: Write the route**

```typescript
// app/api/offers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { listPublicOffers, type OfferSegment } from '@/lib/offers/public-read';

const VALID: OfferSegment[] = ['consumer', 'business', 'all'];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get('segment') ?? 'all';
  if (!VALID.includes(raw as OfferSegment)) {
    return NextResponse.json({ error: `invalid segment: ${raw}` }, { status: 400 });
  }
  const offers = await listPublicOffers(raw as OfferSegment);
  return NextResponse.json({ offers });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/app/api/offers/list-route.test.ts`
Expected: PASS (3 assertions).

- [ ] **Step 5: Commit**

```bash
git add app/api/offers/route.ts __tests__/app/api/offers/list-route.test.ts
git commit -m "feat(offers): GET /api/offers list endpoint"
```

---

### Task 5: Detail API route (`GET /api/offers/[slug]`)

**Files:**
- Create: `app/api/offers/[slug]/route.ts`
- Test: `__tests__/app/api/offers/detail-route.test.ts`

**Interfaces:**
- Consumes: `getPublicOfferBySlug` (Task 3).
- Produces: `GET` handler → `{ offer }` (200) or `{ error }` (404).

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/app/api/offers/detail-route.test.ts
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

jest.mock('@/lib/offers/public-read', () => ({ getPublicOfferBySlug: jest.fn() }));
import { getPublicOfferBySlug } from '@/lib/offers/public-read';
import { GET } from '@/app/api/offers/[slug]/route';
import { NextRequest } from 'next/server';

const ctx = (slug: string) => ({ params: Promise.resolve({ slug }) });
const req = new NextRequest(new URL('http://localhost/api/offers/x'));

describe('GET /api/offers/[slug]', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns the offer when found', async () => {
    (getPublicOfferBySlug as jest.Mock).mockResolvedValue({ slug: 'sky-50', priceInclVat: 2183.85 });
    const res = await GET(req, ctx('sky-50'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ offer: { slug: 'sky-50', priceInclVat: 2183.85 } });
  });

  it('404s when not found / excluded', async () => {
    (getPublicOfferBySlug as jest.Mock).mockResolvedValue(null);
    const res = await GET(req, ctx('nope'));
    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/app/api/offers/detail-route.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the route**

```typescript
// app/api/offers/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPublicOfferBySlug } from '@/lib/offers/public-read';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const offer = await getPublicOfferBySlug(slug);
  if (!offer) {
    return NextResponse.json({ error: 'offer not found' }, { status: 404 });
  }
  return NextResponse.json({ offer });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/app/api/offers/detail-route.test.ts`
Expected: PASS (2 assertions).

- [ ] **Step 5: Commit**

```bash
git add app/api/offers/[slug]/route.ts __tests__/app/api/offers/detail-route.test.ts
git commit -m "feat(offers): GET /api/offers/[slug] detail endpoint"
```

---

### Task 6: JSON-LD builders (`lib/offers/offer-jsonld.ts`)

Pure builders so JSON-LD is unit-testable and reused by both pages. Keeps the "no ex-VAT, no leakage in structured data" guarantee in a tested function.

**Files:**
- Create: `lib/offers/offer-jsonld.ts`
- Test: `__tests__/lib/offers/offer-jsonld.test.ts`

**Interfaces:**
- Consumes: `PublicOffer`, `PublicOfferDetail` (Task 2).
- Produces:
  - `export const OFFERS_BASE_URL = 'https://www.circletel.co.za'`
  - `export function offerProductJsonLd(o: PublicOfferDetail): object`
  - `export function offersItemListJsonLd(offers: PublicOffer[]): object`

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/lib/offers/offer-jsonld.test.ts
import { describe, it, expect } from '@jest/globals';
import { offerProductJsonLd, offersItemListJsonLd } from '@/lib/offers/offer-jsonld';

const base = { slug: 'sky-50', title: 'SkyFibre 50', customerType: 'consumer' as const,
  priceInclVat: 2183.85, vatRate: 0.15, vatLabel: 'incl. VAT' };

describe('offer JSON-LD', () => {
  it('Product uses the VAT-inclusive price and ZAR', () => {
    const ld = offerProductJsonLd(base) as any;
    expect(ld['@type']).toBe('Product');
    expect(ld.offers.price).toBe(2183.85);
    expect(ld.offers.priceCurrency).toBe('ZAR');
    expect(ld.offers.url).toBe('https://www.circletel.co.za/offers/sky-50');
  });

  it('omits image/description when absent and includes them when present', () => {
    expect(offerProductJsonLd(base) as any).not.toHaveProperty('image');
    const ld = offerProductJsonLd({ ...base, image: 'http://i/x.jpg', description: 'fast' }) as any;
    expect(ld.image).toBe('http://i/x.jpg');
    expect(ld.description).toBe('fast');
  });

  it('never leaks internal fields', () => {
    const s = JSON.stringify(offerProductJsonLd({ ...base, description: 'fast' }));
    for (const k of ['resolved_price', 'total_cost', 'margin_pct', 'cost_buildup', 'source_uid', 'priceExclVat']) {
      expect(s).not.toContain(k);
    }
  });

  it('ItemList references each detail URL', () => {
    const ld = offersItemListJsonLd([base]) as any;
    expect(ld['@type']).toBe('ItemList');
    expect(ld.itemListElement[0].url).toBe('https://www.circletel.co.za/offers/sky-50');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/lib/offers/offer-jsonld.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the builders**

```typescript
// lib/offers/offer-jsonld.ts
import type { PublicOffer, PublicOfferDetail } from '@/lib/types/offer';

export const OFFERS_BASE_URL = 'https://www.circletel.co.za';

export function offerProductJsonLd(o: PublicOfferDetail): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: o.title,
    ...(o.image ? { image: o.image } : {}),
    ...(o.description ? { description: o.description } : {}),
    offers: {
      '@type': 'Offer',
      price: o.priceInclVat,
      priceCurrency: 'ZAR',
      availability: 'https://schema.org/InStock',
      url: `${OFFERS_BASE_URL}/offers/${o.slug}`,
    },
  };
}

export function offersItemListJsonLd(offers: PublicOffer[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: offers.map((o, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: o.title,
      url: `${OFFERS_BASE_URL}/offers/${o.slug}`,
    })),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/lib/offers/offer-jsonld.test.ts`
Expected: PASS (4 assertions).

- [ ] **Step 5: Commit**

```bash
git add lib/offers/offer-jsonld.ts __tests__/lib/offers/offer-jsonld.test.ts
git commit -m "feat(offers): JSON-LD builders (Product + ItemList, VAT-inclusive)"
```

---

### Task 7: List page + client tabs (`/offers`)

**Files:**
- Create: `components/offers/OfferCard.tsx` (presentational), `components/offers/OfferTabs.tsx` (client filter)
- Create: `app/offers/page.tsx` (static server component, ISR)
- Test: `__tests__/app/offers/list-page.test.tsx`

**Interfaces:**
- Consumes: `listPublicOffers` (Task 3), `offersItemListJsonLd` (Task 6), `PublicOffer`.
- Produces: rendered `/offers` HTML with VAT-labelled prices, tabs, and an ItemList JSON-LD `<script>`.

- [ ] **Step 1: Write the failing rendered-leakage test**

```typescript
// __tests__/app/offers/list-page.test.tsx
import { describe, it, expect, jest } from '@jest/globals';
import { render } from '@testing-library/react';

jest.mock('@/lib/offers/public-read', () => ({
  listPublicOffers: jest.fn().mockResolvedValue([
    { slug: 'sky-50', title: 'SkyFibre 50', customerType: 'consumer', priceInclVat: 2183.85, vatRate: 0.15, vatLabel: 'incl. VAT' },
    { slug: 'biz-100', title: 'Business 100', customerType: 'business', priceInclVat: 5000, vatRate: 0.15, vatLabel: 'incl. VAT' },
  ]),
}));
import OffersPage from '@/app/offers/page';

describe('/offers list page', () => {
  it('renders VAT-labelled prices and no internal fields', async () => {
    const ui = await OffersPage();
    const { container } = render(ui);
    const html = container.innerHTML;
    expect(html).toContain('incl. VAT');
    expect(html).toContain('SkyFibre 50');
    for (const k of ['total_cost', 'margin_pct', 'cost_buildup', 'source_uid', 'resolved_price']) {
      expect(html).not.toContain(k);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/app/offers/list-page.test.tsx`
Expected: FAIL — `Cannot find module '@/app/offers/page'`.

- [ ] **Step 3: Write `OfferCard.tsx`**

```tsx
// components/offers/OfferCard.tsx
import Link from 'next/link';
import type { PublicOffer } from '@/lib/types/offer';

export function OfferCard({ offer }: { offer: PublicOffer }) {
  return (
    <div className="rounded-xl border-2 border-circleTel-lightNeutral p-6 hover:border-circleTel-orange transition-colors">
      <h3 className="text-lg font-bold text-circleTel-navy">{offer.title}</h3>
      {offer.description && (
        <p className="mt-2 text-sm text-circleTel-secondaryNeutral">{offer.description}</p>
      )}
      <div className="mt-4">
        <span className="text-3xl font-bold text-circleTel-orange">
          R{offer.priceInclVat.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
        </span>
        <span className="ml-2 text-xs text-circleTel-secondaryNeutral">{offer.vatLabel}</span>
      </div>
      <Link
        href={`/offers/${offer.slug}`}
        className="mt-6 inline-block rounded-lg bg-circleTel-orange px-5 py-2 text-white hover:bg-circleTel-orange-dark"
      >
        View details
      </Link>
    </div>
  );
}
```

- [ ] **Step 4: Write `OfferTabs.tsx` (client)**

```tsx
// components/offers/OfferTabs.tsx
'use client';
import { useState } from 'react';
import type { PublicOffer } from '@/lib/types/offer';
import { OfferCard } from './OfferCard';

type Segment = 'consumer' | 'business';

export function OfferTabs({ offers }: { offers: PublicOffer[] }) {
  const [segment, setSegment] = useState<Segment>('consumer');
  const visible = offers.filter((o) =>
    segment === 'consumer'
      ? o.customerType === 'consumer' || o.customerType === 'both'
      : o.customerType === 'business' || o.customerType === 'both',
  );

  return (
    <div>
      <div className="mb-8 flex justify-center gap-2">
        {(['consumer', 'business'] as Segment[]).map((s) => (
          <button
            key={s}
            onClick={() => setSegment(s)}
            className={`rounded-full px-6 py-2 text-sm font-semibold capitalize ${
              segment === s ? 'bg-circleTel-navy text-white' : 'bg-circleTel-lightNeutral text-circleTel-navy'
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {visible.map((o) => (
          <OfferCard key={o.slug} offer={o} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Write `app/offers/page.tsx`**

```tsx
// app/offers/page.tsx
import type { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { OfferTabs } from '@/components/offers/OfferTabs';
import { listPublicOffers } from '@/lib/offers/public-read';
import { offersItemListJsonLd } from '@/lib/offers/offer-jsonld';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Plans & Pricing | CircleTel',
  description: 'Browse CircleTel connectivity plans with transparent, VAT-inclusive pricing.',
};

export default async function OffersPage() {
  const offers = await listPublicOffers('all');
  const jsonLd = offersItemListJsonLd(offers);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="container mx-auto px-4 py-16">
        <h1 className="mb-2 text-center text-4xl font-bold text-circleTel-navy">
          Plans &amp; <span className="text-circleTel-orange">Pricing</span>
        </h1>
        <p className="mb-12 text-center text-circleTel-secondaryNeutral">
          Transparent pricing, VAT included. No surprises.
        </p>
        <OfferTabs offers={offers} />
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx jest __tests__/app/offers/list-page.test.tsx`
Expected: PASS. If `Navbar`/`Footer` pull browser-only deps that break jsdom, mock them at the top of the test: `jest.mock('@/components/layout/Navbar', () => ({ Navbar: () => null })); jest.mock('@/components/layout/Footer', () => ({ Footer: () => null }));`

- [ ] **Step 7: Commit**

```bash
git add components/offers/OfferCard.tsx components/offers/OfferTabs.tsx app/offers/page.tsx __tests__/app/offers/list-page.test.tsx
git commit -m "feat(offers): /offers list page with consumer/business tabs + ItemList JSON-LD"
```

---

### Task 8: Detail page (`/offers/[slug]`)

**Files:**
- Create: `app/offers/[slug]/page.tsx`
- Test: `__tests__/app/offers/detail-page.test.tsx`

**Interfaces:**
- Consumes: `getPublicOfferBySlug`, `listPublicOffers` (Task 3), `offerProductJsonLd` (Task 6).
- Produces: rendered detail HTML with VAT-labelled price, CTA, Product JSON-LD; `notFound()` on miss.

- [ ] **Step 1: Write the failing test**

```tsx
// __tests__/app/offers/detail-page.test.tsx
import { describe, it, expect, jest } from '@jest/globals';
import { render } from '@testing-library/react';

jest.mock('@/components/layout/Navbar', () => ({ Navbar: () => null }));
jest.mock('@/components/layout/Footer', () => ({ Footer: () => null }));
// Jest hoists jest.mock() above imports; a factory may only reference `mock`-prefixed vars.
const mockNotFound = jest.fn(() => { throw new Error('NEXT_NOT_FOUND'); });
jest.mock('next/navigation', () => ({ notFound: () => mockNotFound() }));
jest.mock('@/lib/offers/public-read', () => ({
  getPublicOfferBySlug: jest.fn(),
  listPublicOffers: jest.fn().mockResolvedValue([]),
}));
import { getPublicOfferBySlug } from '@/lib/offers/public-read';
import OfferDetailPage from '@/app/offers/[slug]/page';

describe('/offers/[slug] detail page', () => {
  it('renders price + VAT label + CTA, leaks nothing', async () => {
    (getPublicOfferBySlug as jest.Mock).mockResolvedValue({
      slug: 'sky-50', title: 'SkyFibre 50', customerType: 'consumer', priceInclVat: 2183.85, vatRate: 0.15, vatLabel: 'incl. VAT',
    });
    const ui = await OfferDetailPage({ params: Promise.resolve({ slug: 'sky-50' }) });
    const html = render(ui).container.innerHTML;
    expect(html).toContain('incl. VAT');
    expect(html).toContain('/coverage-check?offer=sky-50');
    for (const k of ['total_cost', 'margin_pct', 'cost_buildup', 'source_uid', 'resolved_price']) {
      expect(html).not.toContain(k);
    }
  });

  it('calls notFound() when the offer is missing', async () => {
    (getPublicOfferBySlug as jest.Mock).mockResolvedValue(null);
    await expect(OfferDetailPage({ params: Promise.resolve({ slug: 'nope' }) })).rejects.toThrow('NEXT_NOT_FOUND');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/app/offers/detail-page.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `app/offers/[slug]/page.tsx`**

```tsx
// app/offers/[slug]/page.tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { getPublicOfferBySlug, listPublicOffers } from '@/lib/offers/public-read';
import { offerProductJsonLd } from '@/lib/offers/offer-jsonld';

export const revalidate = 300;

export async function generateStaticParams() {
  const offers = await listPublicOffers('all');
  return offers.map((o) => ({ slug: o.slug }));
}

export default async function OfferDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const offer = await getPublicOfferBySlug(slug);
  if (!offer) notFound();

  const jsonLd = offerProductJsonLd(offer);
  const ctaHref = `/coverage-check?offer=${encodeURIComponent(offer.slug)}`;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-circleTel-navy">{offer.title}</h1>
        {offer.description && (
          <p className="mt-4 max-w-2xl text-circleTel-secondaryNeutral">{offer.description}</p>
        )}
        <div className="mt-6">
          <span className="text-4xl font-bold text-circleTel-orange">
            R{offer.priceInclVat.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
          </span>
          <span className="ml-2 text-sm text-circleTel-secondaryNeutral">{offer.vatLabel}</span>
        </div>
        <Link
          href={ctaHref}
          className="mt-8 inline-block rounded-lg bg-circleTel-orange px-6 py-3 font-semibold text-white hover:bg-circleTel-orange-dark"
        >
          Check availability
        </Link>
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/app/offers/detail-page.test.tsx`
Expected: PASS (2 assertions).

- [ ] **Step 5: Commit**

```bash
git add app/offers/[slug]/page.tsx __tests__/app/offers/detail-page.test.tsx
git commit -m "feat(offers): /offers/[slug] detail page + Product JSON-LD + coverage CTA"
```

---

### Task 9: CTA receivers — `coverage-check` + homepage attribution + `contact` consume `offer`

**Attribution model (decided):** `Plan 2 is read-only` — no new DB column. The offer slug is carried
**client-side via `sessionStorage`**: `/coverage-check?offer=<slug>` redirects to `/?offer=<slug>`; the
homepage reads `?offer=` and persists it to `sessionStorage['circletel_offer_slug']`; `runCoverageCheck`
forwards it in the lead POST body as `offerSlug`. The lead API (`app/api/coverage/lead/route.ts:9`)
destructures only `{ address, coordinates, coverageType }`, so the extra `offerSlug` key is **silently
ignored today** — it is forward-prep that Plan 3 will persist. The durable carry is the `sessionStorage`
value, which any downstream step (packages page, order) can read. DB-level attribution + package
pre-select are deferred to Plan 3.

**Files:**
- Modify: `app/coverage-check/page.tsx` (carry `offer` through the redirect)
- Modify: `app/(marketing)/page.tsx` (read `?offer=`, persist to `sessionStorage`)
- Modify: `components/home/HomeLanding20260607.tsx:216-224` (forward `offerSlug` in the lead POST body)
- Modify: `app/contact/page.tsx:40-74` (read `subject`/`offer` into the prefilled message)
- Test: `__tests__/app/coverage-check-offer.test.ts`, `__tests__/app/home-offer-attribution.test.tsx`, `__tests__/app/contact-offer-prefill.test.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: `/coverage-check?offer=<slug>` → redirect `/?offer=<slug>`; homepage writes
  `sessionStorage['circletel_offer_slug']`; `/contact?subject=&offer=` prefills the message.

- [ ] **Step 1: Write the failing test for coverage-check**

```typescript
// __tests__/app/coverage-check-offer.test.ts
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Jest hoists jest.mock() above imports; a factory may only reference `mock`-prefixed vars.
const mockRedirect = jest.fn((url: string) => { throw new Error(`REDIRECT:${url}`); });
jest.mock('next/navigation', () => ({ redirect: (u: string) => mockRedirect(u) }));
import CoverageCheckPage from '@/app/coverage-check/page';

describe('coverage-check offer attribution', () => {
  beforeEach(() => jest.clearAllMocks());

  it('carries ?offer through to the homepage coverage checker', async () => {
    await expect(
      CoverageCheckPage({ searchParams: Promise.resolve({ offer: 'sky-50' }) }),
    ).rejects.toThrow('REDIRECT:/?offer=sky-50');
  });

  it('still maps a plan alias when present (no regression)', async () => {
    await expect(
      CoverageCheckPage({ searchParams: Promise.resolve({ plan: 'plus' }) }),
    ).rejects.toThrow('REDIRECT:/packages?plan=skyfibre-home-plus');
  });

  it('falls back to homepage with neither param', async () => {
    await expect(
      CoverageCheckPage({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow('REDIRECT:/');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/app/coverage-check-offer.test.ts`
Expected: FAIL — the `offer` case redirects to `/`, not `/?offer=sky-50` (and the `searchParams` type lacks `offer`).

- [ ] **Step 3: Update `app/coverage-check/page.tsx`**

Replace the `CoverageCheckPageProps` interface and component body:

```tsx
interface CoverageCheckPageProps {
  searchParams: Promise<{ plan?: string; offer?: string }>;
}

export default async function CoverageCheckPage({ searchParams }: CoverageCheckPageProps) {
  const { plan, offer } = await searchParams;
  const planId = plan ? PLAN_ALIASES[plan.toLowerCase()] ?? plan : null;

  if (planId) {
    redirect(`/packages?plan=${planId}`);
  }

  // Offer-sourced visitors have no lead yet — send them to the homepage coverage
  // checker, preserving the offer slug for attribution.
  if (offer) {
    redirect(`/?offer=${encodeURIComponent(offer)}`);
  }

  redirect('/');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/app/coverage-check-offer.test.ts`
Expected: PASS (3 assertions).

- [ ] **Step 5: Write the failing homepage attribution test**

`app/(marketing)/page.tsx` currently reads only `?segment`. This test pins that an `?offer=` param is
persisted to `sessionStorage` on mount. `HomeLanding20260607` is mocked to `null` (it pulls Google Maps
and other browser-only deps that are irrelevant here and heavy under jsdom).

```tsx
// __tests__/app/home-offer-attribution.test.tsx
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render } from '@testing-library/react';

const params = new URLSearchParams('offer=skyfibre-home-50');
jest.mock('next/navigation', () => ({ useSearchParams: () => params }));
jest.mock('@/components/home/HomeLanding20260607', () => ({ HomeLanding20260607: () => null }));
import Home from '@/app/(marketing)/page';

describe('homepage offer attribution', () => {
  beforeEach(() => sessionStorage.clear());

  it('persists ?offer= to sessionStorage on mount', () => {
    render(<Home />);
    expect(sessionStorage.getItem('circletel_offer_slug')).toBe('skyfibre-home-50');
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx jest __tests__/app/home-offer-attribution.test.tsx`
Expected: FAIL — `sessionStorage` has no `circletel_offer_slug` (the page ignores `offer`).

- [ ] **Step 7: Persist `offer` on the homepage and forward it in the lead POST**

In `app/(marketing)/page.tsx`, add an effect that reads `?offer=` and stashes it (place it alongside the
existing segment-sync `useEffect`, after line 30):

```typescript
  // Carry offer attribution from /offers CTAs (read-only Plan 2: client-side only, no DB write).
  useEffect(() => {
    const offer = searchParams.get('offer');
    if (offer) sessionStorage.setItem('circletel_offer_slug', offer);
  }, [searchParams]);
```

In `components/home/HomeLanding20260607.tsx`, forward the stored slug in the existing
`runCoverageCheck` POST body (the `fetch('/api/coverage/lead', ...)` call at line 216). Change the body to:

```typescript
        body: JSON.stringify({
          address: nextAddress.trim(),
          coordinates: nextCoordinates,
          coverageType,
          // Forward-prep: lead API ignores this today (Plan 3 persists it). Carry is sessionStorage.
          offerSlug: typeof window !== 'undefined'
            ? sessionStorage.getItem('circletel_offer_slug') ?? undefined
            : undefined,
        }),
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npx jest __tests__/app/home-offer-attribution.test.tsx`
Expected: PASS (1 assertion).

- [ ] **Step 9: Write the failing contact-page prefill test**

The existing prefill `useEffect` (`app/contact/page.tsx:40-74`) **only enters the message block** when
a coverage param is present — its guard is `if (address || coverage || serviceType || speeds || nearest)`.
A `?subject=&offer=` URL therefore prefills nothing today. This test pins the desired behaviour first.

```tsx
// __tests__/app/contact-offer-prefill.test.tsx
import { describe, it, expect, jest } from '@jest/globals';
import { render, waitFor } from '@testing-library/react';

// Drive the page's useSearchParams() from a controllable params object.
const params = new URLSearchParams('subject=SkyFibre%20Home%2050&offer=skyfibre-home-50');
jest.mock('next/navigation', () => ({
  useSearchParams: () => params,
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));
import ContactPage from '@/app/contact/page';

describe('contact page offer prefill', () => {
  it('prefills the message from subject + offer params', async () => {
    const { findByDisplayValue } = render(<ContactPage />);
    const textarea = await findByDisplayValue(/Enquiry about: SkyFibre Home 50/);
    expect((textarea as HTMLTextAreaElement).value).toContain('Offer reference: skyfibre-home-50');
  });
});
```

> If `ContactPage` pulls layout/browser-only modules that break under jsdom, mock them at the top of
> the test the same way Tasks 7/8 mock `Navbar`/`Footer`. The `message` textarea must have `id="message"`
> and `value={formData.message}` (it already does) for `findByDisplayValue` to match.

- [ ] **Step 10: Run test to verify it fails**

Run: `npx jest __tests__/app/contact-offer-prefill.test.tsx`
Expected: FAIL — the textarea value is empty because the guard never lets `subject`/`offer` through.

- [ ] **Step 11: Update `app/contact/page.tsx` (read params + widen the guard)**

In the prefill `useEffect`, add the two reads alongside the existing `searchParams.get(...)` calls
(after the `nearest` line at `app/contact/page.tsx:45`):

```typescript
    const subject = searchParams.get('subject');
    const offer = searchParams.get('offer');
```

Widen the guard at `app/contact/page.tsx:47` so offer-sourced visitors enter the block:

```typescript
    if (address || coverage || serviceType || speeds || nearest || subject || offer) {
```

Prepend the subject/offer lines to `message` — **before** the existing `if (address)` block (so it
leads the prefilled message):

```typescript
      if (subject) {
        message += `Enquiry about: ${subject}\n`;
        if (offer) message += `Offer reference: ${offer}\n`;
        message += '\n';
      }
```

- [ ] **Step 12: Run the contact test to verify it passes**

Run: `npx jest __tests__/app/contact-offer-prefill.test.tsx`
Expected: PASS (1 assertion).

- [ ] **Step 13: Verify the whole `__tests__/app/` suite is green + scoped type-check**

Run: `npx jest __tests__/app/`
Expected: PASS (coverage-check, homepage attribution, contact, offers pages). Then
`npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "contact/page|coverage-check/page|\\(marketing\\)/page|HomeLanding20260607|offers" || echo "no new type errors in changed files"`.

- [ ] **Step 14: Commit**

```bash
git add app/coverage-check/page.tsx "app/(marketing)/page.tsx" \
  components/home/HomeLanding20260607.tsx app/contact/page.tsx \
  __tests__/app/coverage-check-offer.test.ts __tests__/app/home-offer-attribution.test.tsx \
  __tests__/app/contact-offer-prefill.test.tsx
git commit -m "feat(offers): offer attribution — coverage-check redirect, sessionStorage carry, contact prefill"
```

---

### Task 10: Live verification script (via the real HTTP routes)

Manual, run-once against a running server (local `dev:memory`, or prod). Not a unit test.

> **Why HTTP, not a direct import:** `lib/offers/public-read.ts` starts with `import 'server-only'`,
> whose package entry throws unless resolved under Next's `react-server` export condition. A plain
> `npx tsx scripts/...ts` does **not** set that condition, so importing the read layer (directly or
> transitively) crashes the script. Hitting `GET /api/offers` / `GET /api/offers/[slug]` exercises the
> same code path inside the Next runtime (where `server-only` is satisfied) and verifies the real
> public surface end-to-end. No `server-only` import appears in this script.

**Files:**
- Create: `scripts/offers/verify-storefront.ts`

**Interfaces:**
- Consumes: the deployed/local `GET /api/offers` and `GET /api/offers/[slug]` (Tasks 4, 5). No module imports from `lib/offers/*`.

- [ ] **Step 1: Write the script (fetch-based, no `server-only` import)**

```typescript
// scripts/offers/verify-storefront.ts
// Run against a RUNNING server. Override with OFFERS_VERIFY_BASE_URL (e.g. https://www.circletel.co.za).
const BASE = process.env.OFFERS_VERIFY_BASE_URL ?? 'http://localhost:3000';
const FORBIDDEN = ['resolved_price', 'priceExclVat', 'total_cost', 'margin_pct', 'cost_buildup', 'source_uid', 'source_type'];

function assertNoLeak(label: string, payload: string) {
  for (const k of FORBIDDEN) {
    if (payload.includes(k)) throw new Error(`LEAK: forbidden key "${k}" present in ${label}`);
  }
}

async function getJson(path: string): Promise<{ status: number; text: string; json: any }> {
  const res = await fetch(`${BASE}${path}`);
  const text = await res.text();
  return { status: res.status, text, json: text ? JSON.parse(text) : null };
}

async function main() {
  const list = await getJson('/api/offers?segment=all');
  if (list.status !== 200) throw new Error(`GET /api/offers -> ${list.status}`);
  const offers = list.json.offers as Array<{ slug: string; priceInclVat: number; vatLabel: string }>;
  console.log(`GET /api/offers -> 200, ${offers.length} offer(s)`);
  if (offers.length === 0) throw new Error('No public offers — publish at least one active service_packages offer first');
  assertNoLeak('list response', list.text);

  const first = offers[0];
  if (typeof first.priceInclVat !== 'number' || first.vatLabel !== 'incl. VAT') {
    throw new Error('VAT contract violated on list output');
  }

  const detail = await getJson(`/api/offers/${encodeURIComponent(first.slug)}`);
  if (detail.status !== 200) throw new Error(`GET /api/offers/${first.slug} -> ${detail.status}`);
  assertNoLeak('detail response', detail.text);
  console.log('Detail:', JSON.stringify(detail.json.offer, null, 2));

  // Negative check: an unknown slug must 404, not leak.
  const missing = await getJson('/api/offers/__definitely_not_a_real_slug__');
  if (missing.status !== 404) throw new Error(`expected 404 for unknown slug, got ${missing.status}`);

  console.log('VERIFY OK — VAT-inclusive, no leakage, 404 on unknown');
}
main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Run it against a running server**

Start the server in one shell (`npm run dev:memory`), then in another:
```bash
npx tsx scripts/offers/verify-storefront.ts
# or against prod once deployed:
OFFERS_VERIFY_BASE_URL=https://www.circletel.co.za npx tsx scripts/offers/verify-storefront.ts
```
Expected: prints `GET /api/offers -> 200, N offer(s)`, a detail blob with `priceInclVat` and **no** cost
keys, and `VERIFY OK`. (Requires at least one active `service_packages` offer published into the spine —
use the existing admin publish-all path if the table is empty.)

- [ ] **Step 3: Commit**

```bash
git add scripts/offers/verify-storefront.ts
git commit -m "test(offers): live storefront verification via HTTP routes (VAT + no-leakage)"
```

---

## Self-Review

**Spec coverage:**
- §4.1 VAT contract → Task 1 (helper) + Task 2 (mapper applies it, exposes incl-VAT only) ✅
- §4.1 VAT-basis guard (`service_packages:` prefix + primary component) → Task 2 (`mapOfferRow`) + Task 3 (drops excluded) ✅
- §4.2 field policy / media whitelist / no leakage → Task 2 tests ✅
- §4 server-only → Task 2 Step 1 + file header ✅
- §5 API list + detail (400/404, async params) → Tasks 4, 5 ✅
- §6 static list + client tabs, detail page, concrete CTA URLs → Tasks 7, 8 ✅
- §6 CTA receivers / offer attribution → Task 9 — resolved as **sessionStorage carry** (read-only Plan 2: `/coverage-check?offer=` → `/?offer=` → homepage persists `circletel_offer_slug`; lead API ignores the forwarded `offerSlug` until Plan 3). DB persist + package pre-select explicitly deferred to Plan 3 (§11). ✅
- §7 JSON-LD (Product + ItemList, VAT-incl, no leak) → Task 6 + rendered checks in 7, 8 ✅
- §8 ISR (`revalidate=300`, no searchParams) → Tasks 7, 8 ✅
- §9 staleness de-scoped → no task (correct) ✅
- §10 testing incl. rendered HTML/JSON-LD leakage + live verify → Tasks 7, 8, 10 ✅
- §12 file list incl. CTA receivers → Task 9 (now also `app/(marketing)/page.tsx` + `HomeLanding20260607.tsx` for the sessionStorage carry) ✅

**Placeholder scan:** No TBD/TODO; every code step has complete code. ✅

**Type consistency:** `mapOfferRow`/`OfferReadRow` (Task 2) consumed unchanged in Task 3; `listPublicOffers`/`getPublicOfferBySlug`/`OfferSegment` names consistent across Tasks 3–10; `PublicOffer`/`PublicOfferDetail` from `lib/types/offer.ts` used everywhere; JSON-LD builder names (`offerProductJsonLd`, `offersItemListJsonLd`) consistent between Task 6 and Tasks 7/8. ✅

**Note for executor:** Tasks 7/8 render Server Components via `await Page()` in jsdom; if `Navbar`/`Footer` import browser-only modules that break under jsdom, mock them at the top of the test (shown in Task 7 Step 6 / Task 8 Step 1).
