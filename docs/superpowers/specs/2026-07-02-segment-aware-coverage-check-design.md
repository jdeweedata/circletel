# Segment-Aware Coverage Check (Home / Work-from-home / Business)

**Date:** 2026-07-02
**Status:** Approved design, pending implementation plan
**Owner:** Jeffrey

## Problem

The public coverage check currently serves residential products only in practice.
The homepage hero (`components/home/NewHero.tsx`) already offers three segments —
Home, Work from home, Business — but:

1. **SOHO inventory is unreachable.** The "Work from home" segment maps to
   `type=residential`, and `/api/coverage/packages` filters with an exact
   `customer_type = 'consumer' | 'business'` match. The 3 active WorkConnect
   packages (`customer_type='soho'`, R799/R1,099/R1,499) never display anywhere.
   Packages with `customer_type='both'` are equally invisible.
2. **No segment switch after coverage check.** Once on `/packages/[leadId]`,
   the user cannot flip between home and business results without redoing the
   coverage check (compare Vox's My Home / My Business toggle).
3. **Business packages have no correct purchase path.** If shown, business
   packages (BizFibreConnect R1,899+) would flow into consumer self-checkout,
   which skips B2B KYC/contract handling.
4. **Segment is not linked to signup.** The order flow's
   `accountType: 'personal' | 'business'` (`lib/order/types.ts`) is independent
   of the chosen segment, so SOHO's "business or personal depending on how the
   user signs up" logic has no home.

## Current state (verified 2026-07-02)

- `service_packages.customer_type` CHECK constraint allows
  `'consumer' | 'business' | 'both' | 'soho'`. Active counts: consumer 13,
  business 12, soho 3.
- `market_segment` column exists but is inconsistently populated (null, smme,
  residential, enterprise, soho, b2b-managed). **Not used for filtering.**
- `/api/coverage/packages` (route.ts:330) maps
  `coverageType === 'business' ? 'business' : 'consumer'` and uses `.eq()`.
- `/api/coverage/lead` maps business → lead `customer_type='smme'`, else
  `'consumer'` (`coverage_leads.customer_type` enum: consumer/smme/enterprise).
- `/quotes/request` page exists, lets a user select packages
  (`package_id`) and submits to `/api/quotes`. No URL prefill support yet.
- Hero segment config: `SegmentType = 'business' | 'wfh' | 'home'`
  (NewHero.tsx:10–43); `wfh` currently serialises to `residential`.

## Design

### 1. Segment model — one source of truth

The `?type=` URL/API param becomes a 3-value segment. `customer_type` on
`service_packages` is the governing filter field; `market_segment` is ignored.

| Segment (hero + URL) | `?type=` | Package filter (`customer_type IN`) | Ordering |
|---|---|---|---|
| Home | `residential` | `consumer`, `both` | unchanged |
| Work from home | `wfh` (new) | `soho`, `consumer`, `both` | SOHO first, then price |
| Business | `business` | `business`, `both` | unchanged |

`residential` remains the fallback for missing/unknown values (backwards
compatible with existing links and stored sessions).

### 2. API changes

**`/api/coverage/packages`** (`app/api/coverage/packages/route.ts`)
- Replace the binary customer-type mapping with the filter sets above:
  `.in('customer_type', [...])` instead of `.eq(...)`.
- For `type=wfh`, sort results so `customer_type='soho'` packages lead.
- Everything else unchanged: coverage detection (MTN/DFA/PostGIS fallback),
  `service_type_mapping` category resolution, BizFibre fibre-status filtering,
  provider logo enrichment.

**`/api/coverage/lead`** (`app/api/coverage/lead/route.ts`)
- Accept `coverageType='wfh'` and map it to lead `customer_type='consumer'`.
  No enum migration: the segment travels in the URL and order state, not the
  lead row.

### 3. Results page — segment switcher

`app/packages/[leadId]/page.tsx`:
- New small `SegmentToggle` component (Home / Work from home / Business pills,
  reusing the hero's segment config/icons) rendered above the existing
  Fibre/LTE/5G `ServiceToggle`.
- Switching updates `?type=` (router.replace, no scroll reset) and refetches
  `/api/coverage/packages` for the **same leadId/address** — no coverage
  re-check.
- `NewHero.tsx`: the `wfh` segment serialises to `type=wfh` instead of
  `residential`.

### 4. Purchase paths — driven by the package, not the viewed segment

Per-package CTA, keyed on the package's `customer_type`:

- **`consumer` / `soho` / `both`** → existing self-checkout (OrderContext →
  `/order/checkout`). Unchanged.
- **`business`** → CTA becomes **"Request a quote"**, linking to
  `/quotes/request?packageId=<id>&leadId=<leadId>`. The quote page reads these
  params to pre-select the package and prefill address/coverage context from
  the lead. BizFibreConnect never enters consumer checkout.

### 5. SOHO signup: personal vs business

- The chosen segment is written into `OrderContext` coverage state
  (`coverageType` already exists there).
- At the account step, `accountType` is **pre-selected** from the segment:
  - Home → `personal`
  - Business → `business` (only reachable for a hypothetical future
    self-checkout business package of type `both`)
  - WFH → default `personal`, with an explicit, visible personal/business
    choice when the selected package is `customer_type='soho'`.
- `accountType` remains user-changeable; the segment sets the default only.
  Downstream (invoicing/RICA) already keys off `accountType`.

### 6. Out of scope

- `/business/*` marketing pages, B2B KYC pipeline, payments, RICA changes.
- `coverage_leads` enum migration (no `soho` lead type).
- `market_segment` column cleanup.
- Business self-checkout (possible later phase if quote volume justifies it).
- Homepage hero visual redesign (segments already exist there).

## Alternatives considered

- **Full business self-checkout now** — rejected: touches payment amounts,
  RICA, contracts; B2B onboards via quotes/KYC today.
- **Separate `segment` param alongside `type`** — rejected: two overlapping
  params invite drift. Extending `type` keeps one pattern.
- **SOHO-only results for WFH** — rejected: only 3 products, no fallback when
  WorkConnect is unavailable at an address.

## Error handling

- Unknown `?type=` values fall back to `residential` (both API and page).
- Segment switch refetch reuses the existing loading/error states of
  `PackagesContent`; a failed refetch keeps the previous segment's results and
  shows the existing error UI.
- `/quotes/request` with an invalid/expired `packageId` or `leadId` degrades to
  the current blank form (prefill is best-effort).

## Testing

- **API**: unit tests for the type→filter-set mapping, including `both`
  visibility in all three segments, `soho` visible only under `wfh`, and
  fallback for unknown types.
- **UI**: packages page — segment toggle refetch, SOHO-first ordering under
  WFH, business cards render "Request a quote" CTA with correct href.
- **Quote prefill**: `/quotes/request?packageId=&leadId=` pre-selects the
  package.
- **Order flow**: accountType pre-selection per segment; SOHO package shows the
  explicit personal/business choice.
- Manual staging pass across all three segments at a fibre-covered and a
  wireless-only address before PR to main.

## Blast radius (~7 files + tests)

| File | Change |
|---|---|
| `app/api/coverage/packages/route.ts` | filter sets + soho ordering |
| `app/api/coverage/lead/route.ts` | accept `wfh` |
| `components/home/NewHero.tsx` | `wfh` serialises to `type=wfh` |
| `app/packages/[leadId]/page.tsx` | SegmentToggle + refetch + business CTA |
| `components/coverage/SegmentToggle.tsx` (new) | pill toggle |
| `app/quotes/request/page.tsx` | URL prefill (`packageId`, `leadId`) |
| `components/order/*` (account step) | accountType default from segment |
