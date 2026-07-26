# Segment-Aware Coverage Check Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the coverage check serve all three customer segments (Home / Work-from-home / Business): surface SOHO and business packages, let users switch segment on the results page, route business packages to the quote flow, and let SOHO buyers sign up as personal or business.

**Architecture:** A new pure module `lib/coverage/customer-segments.ts` owns all segment logic (URL type ⇄ customer_type filter sets, SOHO-first ordering, quote-only detection). The existing `/api/coverage/packages` route swaps its binary `.eq('customer_type', …)` for `.in(…)` using that module and returns `customer_type` per package. UI consumes the module: hero sends `type=wfh`, results page gets a segment toggle, business package CTAs deep-link to `/quotes/request`, checkout shows a personal/business choice for SOHO packages. One data migration adds `service_type_mapping` rows so `product_category='soho'` is reachable from MTN Fixed Wireless coverage.

**Tech Stack:** Next.js 15 App Router, TypeScript, Supabase (shared staging+prod DB, project `agyjovdugmtopasyvlng`), Jest, react-icons/pi, Tailwind.

**Spec:** `docs/superpowers/specs/2026-07-02-segment-aware-coverage-check-design.md`

## Global Constraints

- Branch: create `feat/segment-coverage-check` off `origin/main` in a **fresh worktree** (the main working tree at `/home/circletel` has unrelated uncommitted changes — do NOT build on it). Use the superpowers:using-git-worktrees skill.
- `service_packages.customer_type` values are exactly: `'consumer' | 'business' | 'both' | 'soho'`. `market_segment` must NOT be used for filtering.
- URL segment values are exactly: `'residential' | 'wfh' | 'business'`. Unknown/missing values fall back to `'residential'`.
- No changes to: B2B KYC pipeline, payments, RICA, `/business/*` marketing pages, `coverage_leads` enum.
- Type check before every commit: `npm run type-check:memory` must not introduce NEW errors (repo has ~295 pre-existing errors; only files you touched must be clean — the pre-push hook enforces this).
- Tests run with Jest: `npx jest <path>`.
- DB migrations on this project are applied MANUALLY (no CI migration step). Staging and prod share ONE Supabase database.
- Follow existing file style: 2-space indent, single quotes, `PiXxxBold` icons from `react-icons/pi`, `cn()` from `@/lib/utils`.

---

### Task 0: Branch setup

**Files:** none (git only)

- [ ] **Step 1: Create worktree + branch off origin/main**

```bash
cd /home/circletel
git fetch origin main
git worktree add .worktrees/segment-coverage -b feat/segment-coverage-check origin/main
cd /home/circletel/.worktrees/segment-coverage
npm install
```

Expected: worktree created, `git status` clean, branch `feat/segment-coverage-check`.
All subsequent tasks run inside `/home/circletel/.worktrees/segment-coverage`.

---

### Task 1: Pure segment module (`customer-segments.ts`)

**Files:**
- Create: `lib/coverage/customer-segments.ts`
- Test: `lib/coverage/__tests__/customer-segments.test.ts`

**Interfaces:**
- Consumes: nothing (pure module, no imports).
- Produces (used by Tasks 3–8):
  - `type CoverageSegment = 'residential' | 'wfh' | 'business'`
  - `normalizeSegment(type: string | null | undefined): CoverageSegment`
  - `customerTypesForSegment(segment: CoverageSegment): string[]`
  - `sortPackagesForSegment<T extends { customer_type?: string; price: number }>(segment: CoverageSegment, packages: T[]): T[]`
  - `isQuoteOnlyPackage(pkg: { customer_type?: string }): boolean`
  - `heroSegmentToUrlType(segment: 'home' | 'wfh' | 'business'): CoverageSegment`

- [ ] **Step 1: Write the failing test**

Create `lib/coverage/__tests__/customer-segments.test.ts`:

```typescript
import {
  normalizeSegment,
  customerTypesForSegment,
  sortPackagesForSegment,
  isQuoteOnlyPackage,
  heroSegmentToUrlType,
} from '../customer-segments';

describe('normalizeSegment', () => {
  it('passes through valid segments', () => {
    expect(normalizeSegment('residential')).toBe('residential');
    expect(normalizeSegment('wfh')).toBe('wfh');
    expect(normalizeSegment('business')).toBe('business');
  });

  it('falls back to residential for null, undefined, and unknown values', () => {
    expect(normalizeSegment(null)).toBe('residential');
    expect(normalizeSegment(undefined)).toBe('residential');
    expect(normalizeSegment('')).toBe('residential');
    expect(normalizeSegment('soho')).toBe('residential');
    expect(normalizeSegment('BUSINESS')).toBe('residential');
  });
});

describe('customerTypesForSegment', () => {
  it('residential sees consumer and both', () => {
    expect(customerTypesForSegment('residential')).toEqual(['consumer', 'both']);
  });

  it('wfh sees soho, consumer, and both', () => {
    expect(customerTypesForSegment('wfh')).toEqual(['soho', 'consumer', 'both']);
  });

  it('business sees business and both', () => {
    expect(customerTypesForSegment('business')).toEqual(['business', 'both']);
  });
});

describe('sortPackagesForSegment', () => {
  const pkgs = [
    { id: 'a', customer_type: 'consumer', price: 100 },
    { id: 'b', customer_type: 'soho', price: 900 },
    { id: 'c', customer_type: 'consumer', price: 50 },
    { id: 'd', customer_type: 'soho', price: 700 },
  ];

  it('puts soho packages first (each group price-ascending) for wfh', () => {
    const sorted = sortPackagesForSegment('wfh', pkgs);
    expect(sorted.map((p) => p.id)).toEqual(['d', 'b', 'c', 'a']);
  });

  it('does not mutate the input array', () => {
    const copy = [...pkgs];
    sortPackagesForSegment('wfh', pkgs);
    expect(pkgs).toEqual(copy);
  });

  it('returns packages unchanged for residential and business', () => {
    expect(sortPackagesForSegment('residential', pkgs)).toEqual(pkgs);
    expect(sortPackagesForSegment('business', pkgs)).toEqual(pkgs);
  });
});

describe('isQuoteOnlyPackage', () => {
  it('is true only for business packages', () => {
    expect(isQuoteOnlyPackage({ customer_type: 'business' })).toBe(true);
    expect(isQuoteOnlyPackage({ customer_type: 'soho' })).toBe(false);
    expect(isQuoteOnlyPackage({ customer_type: 'consumer' })).toBe(false);
    expect(isQuoteOnlyPackage({ customer_type: 'both' })).toBe(false);
    expect(isQuoteOnlyPackage({})).toBe(false);
  });
});

describe('heroSegmentToUrlType', () => {
  it('maps hero segments to URL types', () => {
    expect(heroSegmentToUrlType('home')).toBe('residential');
    expect(heroSegmentToUrlType('wfh')).toBe('wfh');
    expect(heroSegmentToUrlType('business')).toBe('business');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest lib/coverage/__tests__/customer-segments.test.ts`
Expected: FAIL — `Cannot find module '../customer-segments'`

- [ ] **Step 3: Write the implementation**

Create `lib/coverage/customer-segments.ts`:

```typescript
/**
 * Customer segment logic for the public coverage check.
 *
 * The `?type=` URL param carries the segment chosen on the homepage hero
 * (Home / Work from home / Business). `service_packages.customer_type`
 * ('consumer' | 'business' | 'both' | 'soho') is the governing filter field
 * — `market_segment` is inconsistently populated and must NOT be used.
 */

export type CoverageSegment = 'residential' | 'wfh' | 'business';

const SEGMENT_CUSTOMER_TYPES: Record<CoverageSegment, string[]> = {
  residential: ['consumer', 'both'],
  wfh: ['soho', 'consumer', 'both'],
  business: ['business', 'both'],
};

export function normalizeSegment(type: string | null | undefined): CoverageSegment {
  return type === 'business' || type === 'wfh' ? type : 'residential';
}

export function customerTypesForSegment(segment: CoverageSegment): string[] {
  return SEGMENT_CUSTOMER_TYPES[segment];
}

/**
 * WFH results lead with SOHO (WorkConnect) packages; within each group the
 * API's price-ascending order is preserved. Other segments are untouched.
 */
export function sortPackagesForSegment<T extends { customer_type?: string; price: number }>(
  segment: CoverageSegment,
  packages: T[]
): T[] {
  if (segment !== 'wfh') return packages;
  return [...packages].sort((a, b) => {
    const aSoho = a.customer_type === 'soho' ? 0 : 1;
    const bSoho = b.customer_type === 'soho' ? 0 : 1;
    return aSoho - bSoho || a.price - b.price;
  });
}

/**
 * Business packages (BizFibreConnect, SkyFibre SME, …) onboard via the B2B
 * quote/KYC pipeline, never consumer self-checkout.
 */
export function isQuoteOnlyPackage(pkg: { customer_type?: string }): boolean {
  return pkg.customer_type === 'business';
}

/** Maps the hero's SegmentType ('home' | 'wfh' | 'business') to the URL type. */
export function heroSegmentToUrlType(segment: 'home' | 'wfh' | 'business'): CoverageSegment {
  return segment === 'home' ? 'residential' : segment;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest lib/coverage/__tests__/customer-segments.test.ts`
Expected: PASS — 5 suites, all green.

- [ ] **Step 5: Commit**

```bash
git add lib/coverage/customer-segments.ts lib/coverage/__tests__/customer-segments.test.ts
git commit -m "feat(coverage): pure customer-segment module (residential/wfh/business)"
```

---

### Task 2: DB migration — make `soho` product category reachable

WorkConnect rides MTN Fixed Wireless Broadband, but `service_type_mapping` has no row producing `product_category='soho'`, so the packages API can never include WorkConnect. Add two mapping rows. Safe to apply immediately: the live prod code filters `customer_type` with `.eq('consumer'|'business')`, which excludes soho packages regardless.

**Files:**
- Create: `supabase/migrations/20260702100000_soho_service_type_mapping.sql`

**Interfaces:**
- Consumes: nothing.
- Produces: `service_type_mapping` rows `('Fixed Wireless Broadband' | 'uncapped_wireless', provider 'mtn') → 'soho'` that Task 3's unchanged mapping query picks up.

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/20260702100000_soho_service_type_mapping.sql`:

```sql
-- WorkConnect (customer_type='soho', product_category='soho') rides MTN Fixed
-- Wireless Broadband. Map FWB technical types to the 'soho' product category so
-- /api/coverage/packages includes WorkConnect wherever FWB coverage exists.
-- Live code filters by customer_type, so these rows only surface packages for
-- the new 'wfh' segment.
INSERT INTO service_type_mapping (technical_type, provider, product_category, priority, active, notes)
SELECT v.technical_type, v.provider, v.product_category, v.priority, v.active, v.notes
FROM (VALUES
  ('Fixed Wireless Broadband', 'mtn', 'soho', 6, true, 'WorkConnect SOHO packages over MTN FWB'),
  ('uncapped_wireless', 'mtn', 'soho', 6, true, 'WorkConnect SOHO packages over MTN FWB')
) AS v(technical_type, provider, product_category, priority, active, notes)
WHERE NOT EXISTS (
  SELECT 1 FROM service_type_mapping m
  WHERE m.technical_type = v.technical_type
    AND m.product_category = v.product_category
);
```

- [ ] **Step 2: Apply manually to the shared DB**

This project has NO CI migration step. Apply via the Supabase MCP `apply_migration` tool (name: `soho_service_type_mapping`) or the SQL editor, running the exact SQL above.

- [ ] **Step 3: Verify**

Run (Supabase MCP `execute_sql`):

```sql
SELECT technical_type, provider, product_category, priority, active
FROM service_type_mapping WHERE product_category = 'soho';
```

Expected: exactly 2 rows, both active, priority 6. Re-running the migration inserts 0 rows (idempotent).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260702100000_soho_service_type_mapping.sql
git commit -m "feat(coverage): map MTN FWB technical types to soho product category"
```

---

### Task 3: Packages API — segment filter sets + `customer_type` in response

**Files:**
- Modify: `app/api/coverage/packages/route.ts` (imports ~line 7, `ServicePackage` interface ~line 39–54, `coverageType` ~line 111, customer-type filter ~lines 327–351, response mapping ~lines 374–410, sort after BizFibre filter ~line 432)

**Interfaces:**
- Consumes: `normalizeSegment`, `customerTypesForSegment`, `sortPackagesForSegment` from `@/lib/coverage/customer-segments` (Task 1).
- Produces: each package in the JSON `packages[]` response now includes `customer_type?: string`. Consumed by Tasks 5, 6, 7, 8.

- [ ] **Step 1: Add import and extend types**

After the existing import block (line 7, `import { apiLogger } from '@/lib/logging';`), add:

```typescript
import { normalizeSegment, customerTypesForSegment, sortPackagesForSegment } from '@/lib/coverage/customer-segments';
```

In `interface ServicePackage` (~line 39), after `service_type: string;` add:

```typescript
  customer_type?: string;
```

(`PackageWithProvider extends Omit<ServicePackage, 'compatible_providers' | 'active'>` picks it up automatically.)

- [ ] **Step 2: Normalize the segment param**

Replace (line 111):

```typescript
    const coverageType = searchParams.get('type') || 'residential'; // Get coverage type from URL
```

with:

```typescript
    const coverageType = normalizeSegment(searchParams.get('type')); // 'residential' | 'wfh' | 'business'
```

- [ ] **Step 3: Replace the binary customer-type filter**

Replace (lines 327–330):

```typescript
      // Filter by customer_type based on coverage type
      // Note: service_packages.customer_type is VARCHAR with values: 'business', 'consumer'
      // coverage_leads.customer_type is ENUM with values: 'consumer', 'smme', 'enterprise'
      const packageCustomerType = coverageType === 'business' ? 'business' : 'consumer';
```

with:

```typescript
      // Filter by customer_type based on segment.
      // service_packages.customer_type: 'consumer' | 'business' | 'both' | 'soho'
      // coverage_leads.customer_type is a separate ENUM: 'consumer' | 'smme' | 'enterprise'
      const packageCustomerTypes = customerTypesForSegment(coverageType);
```

In the `apiLogger.info('[Packages API] Querying packages with', …)` call (~line 332), replace the `packageCustomerType,` field with `packageCustomerTypes,`.

In the packages query (~line 349), replace:

```typescript
        .eq('customer_type', packageCustomerType)
```

with:

```typescript
        .in('customer_type', packageCustomerTypes)
```

- [ ] **Step 4: Return `customer_type` per package and sort for WFH**

In the `availablePackages = packages.map(...)` return object (~line 395, after `service_type: pkg.service_type,`), add:

```typescript
            customer_type: pkg.customer_type,
```

After the BizFibre filter/decorate block closes (~line 432, immediately after the closing `}` of `if (!lat || !lng) { … } else { … }`), add:

```typescript
        // WFH: lead with SOHO (WorkConnect) packages
        availablePackages = sortPackagesForSegment(coverageType, availablePackages);
```

In the final `apiLogger.info('Coverage check', …)` (~line 436), replace `packageCustomerType,` with `packageCustomerTypes,`.

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep "app/api/coverage/packages"`
Expected: no output (no errors in this file). If the full check OOMs, use `npm run type-check:memory`.

- [ ] **Step 6: Commit**

```bash
git add app/api/coverage/packages/route.ts
git commit -m "feat(coverage): filter packages by segment customer-type sets, expose customer_type"
```

---

### Task 4: Hero sends `type=wfh`; lead route comment

**Files:**
- Modify: `components/home/NewHero.tsx` (lines ~105–136)
- Modify: `app/api/coverage/lead/route.ts` (comment, lines 18–21)

**Interfaces:**
- Consumes: `heroSegmentToUrlType` from `@/lib/coverage/customer-segments`.
- Produces: redirects to `/packages/[leadId]?type=residential|wfh|business`; sessionStorage `circletel_coverage_address.type` uses the same values.

- [ ] **Step 1: Update NewHero serialization**

In `components/home/NewHero.tsx`, add to imports (after line 8, `import { cn } from '@/lib/utils';`):

```typescript
import { heroSegmentToUrlType } from '@/lib/coverage/customer-segments';
```

In `handleCheckCoverage` (lines 105–136), replace the three segment serialisations:

```typescript
      const urlType = heroSegmentToUrlType(activeSegment);
      sessionStorage.setItem('circletel_coverage_address', JSON.stringify({
        address: address.trim(),
        coordinates,
        type: urlType,
        addressComponents,
        timestamp: new Date().toISOString(),
      }));

      const response = await fetch('/api/coverage/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: address.trim(),
          coordinates,
          coverageType: urlType,
        }),
      });

      if (!response.ok) throw new Error('Failed to create coverage lead');
      const data = await response.json();
      window.location.href = `/packages/${data.leadId}?type=${urlType}`;
```

(This replaces lines 109–130: the old `type: activeSegment === 'business' ? …` object, the old `coverageType:` ternary, and the old `const packageType = …` + redirect.)

- [ ] **Step 2: Update lead route comment**

In `app/api/coverage/lead/route.ts`, replace lines 18–21:

```typescript
    // Determine customer type from coverageType parameter
    // Database enum has: 'consumer', 'smme', 'enterprise'
    // Map: residential -> consumer, business -> smme (covers both SME and enterprise)
    const customerType = coverageType === 'business' ? 'smme' : 'consumer';
```

with:

```typescript
    // Determine customer type from coverageType parameter.
    // Database enum has: 'consumer', 'smme', 'enterprise' (no soho value).
    // Map: business -> smme; residential AND wfh -> consumer.
    // The wfh segment lives in the URL/order state, not on the lead row.
    const customerType = coverageType === 'business' ? 'smme' : 'consumer';
```

- [ ] **Step 3: Type-check the touched files**

Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "NewHero|coverage/lead"`
Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add components/home/NewHero.tsx app/api/coverage/lead/route.ts
git commit -m "feat(coverage): hero WFH segment sends type=wfh"
```

---

### Task 5: SegmentToggle component + results-page wiring + WorkConnect tab visibility

**Files:**
- Create: `components/coverage/SegmentToggle.tsx`
- Modify: `app/packages/[leadId]/page.tsx` (imports ~line 8–27, `coverageType` line 71, new handler after `handleCheckAnotherAddress` ~line 358, render above `ServiceToggle` ~line 607, wireless filters lines 384–400 and 447–459, badge colors ~line 671–682)

**Interfaces:**
- Consumes: `CoverageSegment`, `normalizeSegment` from `@/lib/coverage/customer-segments`; API `customer_type` field (Task 3).
- Produces: `SegmentToggle({ activeSegment: CoverageSegment, onSegmentChange: (s: CoverageSegment) => void })`; URL `?type=` changes drive refetch via the existing `useEffect([leadId, coverageType])`.

- [ ] **Step 1: Create the SegmentToggle component**

Create `components/coverage/SegmentToggle.tsx`:

```tsx
'use client';
import React from 'react';
import { PiHouseBold, PiBriefcaseBold, PiBuildingsBold } from 'react-icons/pi';
import { cn } from '@/lib/utils';
import type { CoverageSegment } from '@/lib/coverage/customer-segments';

const SEGMENTS: Array<{
  value: CoverageSegment;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
}> = [
  { value: 'residential', label: 'Home', shortLabel: 'Home', icon: PiHouseBold },
  { value: 'wfh', label: 'Work from Home', shortLabel: 'SOHO', icon: PiBriefcaseBold },
  { value: 'business', label: 'Business', shortLabel: 'Business', icon: PiBuildingsBold },
];

interface SegmentToggleProps {
  activeSegment: CoverageSegment;
  onSegmentChange: (segment: CoverageSegment) => void;
}

/**
 * Home / Work-from-home / Business switcher for the package results page.
 * Light-theme sibling of the homepage hero segment pills.
 */
export function SegmentToggle({ activeSegment, onSegmentChange }: SegmentToggleProps) {
  return (
    <div className="inline-flex items-center gap-1 bg-gray-100 rounded-xl p-1">
      {SEGMENTS.map((segment) => {
        const Icon = segment.icon;
        const isActive = activeSegment === segment.value;
        return (
          <button
            key={segment.value}
            type="button"
            onClick={() => onSegmentChange(segment.value)}
            aria-pressed={isActive}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              'focus:outline-none focus:ring-2 focus:ring-circleTel-orange focus:ring-offset-1',
              isActive
                ? 'bg-white text-circleTel-orange shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{segment.label}</span>
            <span className="sm:hidden">{segment.shortLabel}</span>
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Wire it into the packages page**

In `app/packages/[leadId]/page.tsx`:

Add imports (after line 18, `import { NoCoverageOptions } …`):

```typescript
import { SegmentToggle } from '@/components/coverage/SegmentToggle';
import { normalizeSegment, type CoverageSegment } from '@/lib/coverage/customer-segments';
```

Replace line 71:

```typescript
  const coverageType = searchParams.get('type') || 'residential';
```

with:

```typescript
  const coverageType = normalizeSegment(searchParams.get('type'));
```

Add a handler after `handleCheckAnotherAddress` (after its closing `};`, ~line 358):

```typescript
  const handleSegmentChange = (segment: CoverageSegment) => {
    if (segment === coverageType) return;
    setSelectedPackage(null);
    setShowAllPackages(false);
    const params = new URLSearchParams(searchParams.toString());
    params.set('type', segment);
    router.replace(`/packages/${leadId}?${params.toString()}`, { scroll: false });
  };
```

(The existing `useEffect(() => { fetchPackages(); }, [leadId, coverageType])` at line 100 refetches automatically when the URL type changes.)

Render the toggle above the ServiceToggle. Replace (~lines 607–608):

```tsx
            {/* Service Toggle */}
            <div className="mb-8">
```

with:

```tsx
            {/* Segment Toggle: Home / Work from Home / Business */}
            <div className="mb-6">
              <SegmentToggle
                activeSegment={coverageType}
                onSegmentChange={handleSegmentChange}
              />
            </div>

            {/* Service Toggle */}
            <div className="mb-8">
```

- [ ] **Step 3: Make WorkConnect visible on the Wireless tab**

WorkConnect has `service_type='WorkConnect'`, `product_category='soho'` — it matches no tab today. In BOTH the `getFilteredPackages()` wireless branch (~line 390) and the `packageCounts.wireless` filter (~line 450), replace the `isWireless` expression:

```typescript
        const isWireless = serviceType.includes('wireless') || 
                          serviceType.includes('skyfibre') ||
                          productCategory.includes('wireless') ||
                          (serviceType.includes('skyfibre') && productCategory === 'connectivity');
```

with:

```typescript
        const isWireless = serviceType.includes('wireless') ||
                          serviceType.includes('skyfibre') ||
                          serviceType.includes('workconnect') ||
                          productCategory.includes('wireless') ||
                          productCategory === 'soho' ||
                          (serviceType.includes('skyfibre') && productCategory === 'connectivity');
```

(Apply the identical replacement in both locations — they must stay in sync.)

In `getBadgeColor()` (~line 671), add a WorkConnect branch before the final fallback — replace:

```typescript
                          } else if (serviceType.includes('5g')) {
                            return 'yellow';
                          }
                          return 'pink';
```

with:

```typescript
                          } else if (serviceType.includes('5g')) {
                            return 'yellow';
                          } else if (serviceType.includes('workconnect') || serviceType === 'soho') {
                            return 'orange';
                          }
                          return 'pink';
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "SegmentToggle|packages/\[leadId\]"`
Expected: no output.

- [ ] **Step 5: Verify in the running app**

```bash
npm run dev:memory
```

Visit an existing results URL (grab a leadId from a fresh homepage check or `SELECT id FROM coverage_leads ORDER BY created_at DESC LIMIT 1`), e.g. `http://localhost:3000/packages/<leadId>?type=residential`:
- Toggle shows three pills; clicking Business updates the URL to `?type=business` and the package grid changes (BizFibre/SkyFibre SME at a fibre-covered address).
- Clicking Work from Home shows WorkConnect first (Wireless tab) where MTN FWB coverage exists.
- Selected package clears on switch.

- [ ] **Step 6: Commit**

```bash
git add components/coverage/SegmentToggle.tsx "app/packages/[leadId]/page.tsx"
git commit -m "feat(packages): segment toggle on results page + WorkConnect wireless-tab visibility"
```

---

### Task 6: Business packages → "Request a Quote" CTA

**Files:**
- Modify: `app/packages/[leadId]/page.tsx` (`Package` interface ~line 29–56, `handlePackageSelect` ~line 222, `handleContinue` ~line 268, sidebar usage ~line 784, mobile overlay usage ~line 870, continue button ~line 900–904)
- Modify: `components/ui/package-detail-sidebar.tsx` (props ~line 57 & 117, button text ~line 320)
- Modify: `lib/order/types.ts` (`PackageDetails` interface, line 130)

**Interfaces:**
- Consumes: `isQuoteOnlyPackage` from `@/lib/coverage/customer-segments`; `customer_type` on API packages (Task 3).
- Produces: `PackageDetails.customer_type?: string` (consumed by Task 8); quote deep-link `/quotes/request?packageId=<uuid>&leadId=<uuid>` (consumed by Task 7); `PackageDetailSidebar`/`MobilePackageDetailOverlay` accept optional `orderButtonLabel?: string` (default `'Order Now'`).

- [ ] **Step 1: Carry `customer_type` through the types**

In `app/packages/[leadId]/page.tsx`, `interface Package` (~line 32, after `service_type: string;`), add:

```typescript
  customer_type?: string;
```

In `lib/order/types.ts`, `interface PackageDetails` (line 130, after `service_type?: string;`), add:

```typescript
  customer_type?: string;
```

In `app/packages/[leadId]/page.tsx`, BOTH `packageDetails` object literals — in `handlePackageSelect` (~line 228) and `handleContinue` (~line 271) — after `service_type: …,` add:

```typescript
      customer_type: pkg.customer_type,
```

(in `handleContinue` the source variable is `selectedPackage`, so: `customer_type: selectedPackage.customer_type,`)

- [ ] **Step 2: Branch `handleContinue` to the quote flow**

Add to the page's segment imports (Task 5 import line):

```typescript
import { normalizeSegment, isQuoteOnlyPackage, type CoverageSegment } from '@/lib/coverage/customer-segments';
```

At the top of `handleContinue` (line 268), insert before `if (selectedPackage) {`:

```typescript
    if (selectedPackage && isQuoteOnlyPackage(selectedPackage)) {
      // Business packages onboard via the B2B quote pipeline, not self-checkout
      router.push(`/quotes/request?packageId=${selectedPackage.id}&leadId=${leadId}`);
      return;
    }
```

- [ ] **Step 3: Label the CTAs**

In `components/ui/package-detail-sidebar.tsx`:
- Add `orderButtonLabel?: string;` to the props interface next to `onOrderClick?: () => void;` (line 57). If `MobilePackageDetailOverlay` (same file) has its own props interface with `onOrderClick`, add it there too.
- Add `orderButtonLabel = 'Order Now',` to the destructured params next to `onOrderClick,` (line 117; and the overlay's equivalent).
- Replace the hardcoded button text at line 320 (`Order Now`) with `{orderButtonLabel}`. Run `grep -n "Order Now" components/ui/package-detail-sidebar.tsx` and replace every occurrence that renders a CTA; if the overlay delegates to `PackageDetailSidebar`, pass the prop through.

In `app/packages/[leadId]/page.tsx`, define once near `filteredPackages` (~line 405):

```typescript
  const continueLabel = selectedPackage && isQuoteOnlyPackage(selectedPackage)
    ? 'Request a Quote'
    : undefined;
```

- At the `PackageDetailSidebar` usage (~line 784) and `MobilePackageDetailOverlay` usage (~line 870), add: `orderButtonLabel={continueLabel}`.
- At the bottom continue button (~line 900–904), replace the literal `Continue →` with `{continueLabel ? `${continueLabel} →` : 'Continue →'}`.

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "packages/\[leadId\]|package-detail-sidebar|order/types"`
Expected: no output.

- [ ] **Step 5: Verify in the running app**

On `?type=business` at a fibre-connected address: select a BizFibre package → sidebar and bottom CTAs read "Request a Quote"; clicking navigates to `/quotes/request?packageId=…&leadId=…`. On `?type=residential`: CTA still reads "Order Now"/"Continue →" and goes to `/order/checkout`.

- [ ] **Step 6: Commit**

```bash
git add "app/packages/[leadId]/page.tsx" components/ui/package-detail-sidebar.tsx lib/order/types.ts
git commit -m "feat(packages): business packages route to quote request instead of checkout"
```

---

### Task 7: Quote request page — prefill from `packageId` + `leadId`

**Files:**
- Modify: `app/quotes/request/page.tsx` (interface `CoverageResult` ~line 36–42, new params + effect after the token-validation `useEffect` ~line 88–100)

**Interfaces:**
- Consumes: `GET /api/coverage/lead?leadId=` (returns the lead row incl. `address`); `GET /api/coverage/packages?leadId=&type=business` (returns `{ packages, address, coordinates }`); deep-link params from Task 6.
- Produces: pre-populated `coverageResult` + `selectedPackages`, form starting at the `details` step.

- [ ] **Step 1: Allow null coordinates**

Change `interface CoverageResult` (line ~36):

```typescript
  coordinates: { lat: number; lng: number };
```

to:

```typescript
  coordinates: { lat: number; lng: number } | null;
```

(The submit handler already optional-chains `coverageResult?.coordinates`.)

- [ ] **Step 2: Add the prefill effect**

In `QuoteRequestFormContent`, after `const token = searchParams?.get('token');` (~line 54), add:

```typescript
  const prefillPackageId = searchParams?.get('packageId');
  const prefillLeadId = searchParams?.get('leadId');
```

After the token-validation `useEffect` (~line 94), add:

```typescript
  // Prefill from the coverage-check results page (business package deep link)
  useEffect(() => {
    if (!prefillPackageId || !prefillLeadId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [leadRes, pkgRes] = await Promise.all([
          fetch(`/api/coverage/lead?leadId=${prefillLeadId}`),
          fetch(`/api/coverage/packages?leadId=${prefillLeadId}&type=business`),
        ]);
        if (!leadRes.ok || !pkgRes.ok) return; // best-effort: fall back to blank form
        const lead = await leadRes.json();
        const pkgData = await pkgRes.json();
        if (cancelled) return;
        const packages = pkgData.packages || [];
        setCoverageResult({
          lead_id: prefillLeadId,
          address: lead.address || pkgData.address || '',
          coordinates: pkgData.coordinates || null,
          available: true,
          packages,
        });
        setAddress(lead.address || '');
        if (packages.some((p: { id: string }) => p.id === prefillPackageId)) {
          setSelectedPackages([{ package_id: prefillPackageId, item_type: 'primary', quantity: 1 }]);
        }
        setStep('details');
      } catch {
        // best-effort prefill; user can run the in-form coverage check instead
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillPackageId, prefillLeadId]);
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep "quotes/request"`
Expected: no output.

- [ ] **Step 4: Verify in the running app**

Open `/quotes/request?packageId=<business pkg uuid>&leadId=<lead uuid>` (use the deep link from Task 6's verification). Expected: form opens on the **details** step, address shown; on the packages step the deep-linked package is already selected. Opening plain `/quotes/request` still starts at the coverage step.

- [ ] **Step 5: Commit**

```bash
git add app/quotes/request/page.tsx
git commit -m "feat(quotes): prefill quote request from coverage-check deep link"
```

---

### Task 8: Checkout — SOHO personal/business account choice

**Files:**
- Modify: `app/order/checkout/page.tsx` (state near `pkg` line 67, three `accountType` derivations at lines 154, 200, 298, radio UI in the confirm step after `OrderingAsCard` ~line 528)

**Interfaces:**
- Consumes: `PackageDetails.customer_type` (Task 6); existing `pkg = orderState.orderData.package?.selectedPackage` (line 67); `RadioGroup`/`RadioGroupItem` from `@/components/ui/radio-group`, `Label` from `@/components/ui/label` (add imports if not present — check the file's import block first).
- Produces: `consumer_orders.account_type` reflects the user's explicit choice for SOHO packages; segment-derived default otherwise.

- [ ] **Step 1: Add state + derived account type**

After line 67 (`const pkg = orderState.orderData.package?.selectedPackage;`), add:

```typescript
  // SOHO (WorkConnect) can be signed up personally or as a business — user chooses.
  const isSohoPackage = pkg?.customer_type === 'soho';
  const [sohoAccountType, setSohoAccountType] = useState<'personal' | 'business'>('personal');
  const derivedAccountType: 'personal' | 'business' = isSohoPackage
    ? sohoAccountType
    : coverage?.coverageType === 'business' ? 'business' : 'personal';
```

(If `coverage` is declared after line 67, place this block immediately after the `coverage` declaration instead — it must come after both `pkg` and `coverage`.)

- [ ] **Step 2: Use it at all three sites**

Replace at line 154 and line 200:

```typescript
          accountType: coverage?.coverageType === 'business' ? 'business' : 'personal',
```

with:

```typescript
          accountType: derivedAccountType,
```

Replace at line 298:

```typescript
        account_type: coverage?.coverageType === 'business' ? 'business' : 'personal',
```

with:

```typescript
        account_type: derivedAccountType,
```

- [ ] **Step 3: Render the choice in the confirm step**

Inside the confirm step's white card, directly after the `<OrderingAsCard … />` element (~line 528, before the "Collect missing profile details" block), add:

```tsx
                {isSohoPackage && (
                  <div className="mt-5">
                    <p className="text-sm font-bold text-circleTel-navy mb-2">I&apos;m signing up as</p>
                    <RadioGroup
                      value={sohoAccountType}
                      onValueChange={(v) => setSohoAccountType(v as 'personal' | 'business')}
                      className="flex gap-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="personal" id="soho-personal" />
                        <Label htmlFor="soho-personal">Personal</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="business" id="soho-business" />
                        <Label htmlFor="soho-business">Business</Label>
                      </div>
                    </RadioGroup>
                    <p className="text-xs text-gray-500 mt-1">
                      WorkConnect can be billed to you personally or to your business.
                    </p>
                  </div>
                )}
```

Check the import block: `Label` is already imported; add `import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';` if absent.

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep "order/checkout"`
Expected: no output.

- [ ] **Step 5: Verify in the running app**

WFH segment → select a WorkConnect package → checkout confirm step shows the "I'm signing up as" radio (defaults Personal). Select Business, place a test order far enough to inspect the `/api/orders/create` request payload in devtools: `account_type: 'business'`. A consumer package shows no radio and sends `personal`.

- [ ] **Step 6: Commit**

```bash
git add app/order/checkout/page.tsx
git commit -m "feat(checkout): explicit personal/business account choice for SOHO packages"
```

---

### Task 9: Final verification + ship to staging

**Files:** none new.

- [ ] **Step 1: Full test + type-check pass**

```bash
npx jest lib/coverage
npm run type-check:memory
```

Expected: coverage tests green; type-check introduces no NEW errors in touched files (compare against `origin/main` if unsure — the pre-push hook also enforces this).

- [ ] **Step 2: Manual QA sweep (local dev)**

Run through this matrix at (a) a fibre-connected address and (b) a wireless-only address:

| Segment | Expect |
|---|---|
| Home | consumer packages only; checkout CTA; no WorkConnect |
| Work from Home | WorkConnect listed FIRST on Wireless tab; consumer packages after; SOHO radio at checkout |
| Business | BizFibre (fibre-connected only) + SkyFibre SME; CTA = Request a Quote → prefilled quote form |

Plus: segment toggle switches without re-checking coverage; unknown `?type=garbage` behaves as Home; plain `/quotes/request` unaffected.

- [ ] **Step 3: Push to staging**

```bash
git push origin feat/segment-coverage-check:staging
```

Watch the staging deploy (`gh run list --branch staging --limit 3`), then repeat the QA matrix on the staging URL. Staging deploys precede prod for testing AND admin training (project rule).

- [ ] **Step 4: PR to main**

Use the superpowers:finishing-a-development-branch skill. PR body summarises the segment model table from the spec and links `docs/superpowers/specs/2026-07-02-segment-aware-coverage-check-design.md`.
