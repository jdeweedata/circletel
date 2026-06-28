# Plan 2 — Offer Storefront Read (`/offers`) — Design

**Date:** 2026-06-28
**Status:** Approved (design) — pending implementation plan
**Depends on:** Offer Spine Phase 0 (PR #578 + #585, merged + live-verified)
**Blueprint:** `docs/superpowers/specs/2026-06-27-commerce-product-platform-blueprint-design.md` (Domain 4 — Storefront & Commerce; Phase 1 "ship this week" play)

---

## 1. Goal

Ship the public, browseable, data-driven catalogue that the Offer Spine makes possible — a
**snapshot-fed pricing surface with structured data (JSON-LD)**. The blueprint names this the
"#1 ship-this-week play": Vox is the only SA competitor exposing pricing publicly (via JSON-LD),
and CircleTel has priced products with no public way to browse them.

This plan is **read-only**. It adds no write paths, no cart, and no checkout. It reads the
pre-computed `offer_pricing_snapshot` rows produced by Phase 0 and renders them.

### Success criteria
- `/offers` renders every active offer that has a pricing snapshot, split into consumer/business tabs.
- `/offers/[slug]` renders a per-offer detail page with `Product`/`Offer` JSON-LD.
- The public API and pages **never expose cost, margin, or source provenance**.
- Pages serve fast (ISR, snapshot-backed) and never block on staleness.
- Tests prove the no-cost-leakage guarantee.

---

## 2. Existing surfaces (why a new route)

| Surface | What it is today | Why not reuse |
|---|---|---|
| `app/pricing` | Fully **hardcoded** static marketing page ("Basic IT — From R2,500"); framed as IT services | Not data-driven; content mismatch (IT services, not connectivity) |
| `app/packages` | 432-line **coverage-gated** Supabase read; requires a `planId`/lead, redirects otherwise | Post-coverage funnel, not a browseable catalogue |
| `app/products` | CMS-style product **marketing** pages | Editorial content, not a priced catalogue |

There is **no public, browseable, data-driven catalogue** today. `/offers` fills that gap with
zero blast radius on the above. (A future fold-in of `/offers` content into `/pricing` is possible
once proven, but is out of scope here.)

---

## 3. Architecture & data flow

```
offers + offer_pricing_snapshot ──► public read layer ──► GET /api/offers, /api/offers/[slug]
   (service-role, RLS)              (sanitizes fields)         │
                                                               ▼
                                          /offers (list, consumer/business tabs)
                                          /offers/[slug] (detail + JSON-LD)
                                                               │ CTA
                                                               ▼
                                          existing coverage funnel / contact
```

An offer appears publicly **only if** it has a snapshot row (i.e. a resolved price exists). The
public surface reads snapshots — never resolves pricing per request.

---

## 4. Public read layer — `lib/offers/public-read.ts` (security-critical)

A single, dedicated read module so internal cost data can never leak. The API routes use **only**
this module; they never query `offers`/`offer_pricing_snapshot` directly.

### Field policy

| Field | Source | Public? |
|---|---|---|
| `slug` | offers | ✅ exposed |
| `title` | offers | ✅ exposed |
| `media` | offers | ✅ exposed (jsonb; see note below) |
| `customer_type` | offers | ✅ exposed (drives tabs) |
| `price` | snapshot `resolved_price` | ✅ exposed |

> **Schema note — no `description` column.** The Phase 0 `offers` table has `title` and a `media jsonb`
> blob, but **no `description` column**, and the Phase 0 publisher does not yet populate `media`
> (it defaults to `{}`). So "blurb"/"image" are read **from `media`** when present
> (`media.description`, `media.image`) and **gracefully omitted** when absent. The page degrades to
> **title + price** until a future publisher enrichment fills `media`. Plan 2 adds **no column and no
> migration** for this — enrichment is out of scope.
| `cost_buildup`, `total_cost`, `margin_pct`, `guardrail_status` | snapshot | ❌ **NEVER** |
| `source_uid` | offers | ❌ never (provenance) |
| component `unit_cost`, `unit_price`, `source_id` | offer_components | ❌ never |

### Behaviour
- Filter: `status = 'active' AND lifecycle_state = 'active'`, and a snapshot row must exist
  (inner join on `offer_pricing_snapshot`).
- Segment filter: `consumer` → `customer_type IN ('consumer','both')`; `business` →
  `customer_type IN ('business','both')`; `all` → no filter.
- Reads via the **service-role server client** (`@/lib/supabase/server`). The Phase 0 tables have
  **no anon RLS policy** by design, so this module only ever runs server-side. It must never be
  imported into a client component.

### Public types
A `PublicOffer` type (list shape) and `PublicOfferDetail` (detail shape) defined in
`lib/types/offer.ts` (or a sibling `public-offer.ts`), containing only the exposed fields above.
Mapping from DB row → public type is the sanitization boundary.

---

## 5. API endpoints

Both are Next.js 15 App Router routes with async params where applicable.

- `GET /api/offers?segment=consumer|business|all`
  → `{ offers: PublicOffer[] }`. Default `segment=all`. Invalid segment → 400.
- `GET /api/offers/[slug]`
  → `{ offer: PublicOfferDetail }` or 404 if missing/inactive/no-snapshot.
  ```ts
  export async function GET(
    request: NextRequest,
    context: { params: Promise<{ slug: string }> }
  ) {
    const { slug } = await context.params
    // ...read via public-read layer
  }
  ```

Both routes are public (no auth) and read-only.

---

## 6. Pages

### `/offers` (list)
- Server component. Reads via `public-read` (not the API — direct module call server-side).
- Consumer/business tabs driven by `?segment=`. When the URL has no `segment`, the **page** selects
  the `consumer` tab (B2C front door) and reads with `segment=consumer` — this UI default is distinct
  from the **API's** neutral `all` default (§5). `both` offers appear in both tabs.
- Responsive card grid: title, price (`R{price}`), short blurb (from `media.description` when
  present, else omitted), CTA.
- Uses existing `Navbar` + `Footer` and CircleTel design tokens (`circleTel-navy`, `circleTel-orange`).
- `ItemList` JSON-LD for the visible offers.

### `/offers/[slug]` (detail)
- Server component. `generateStaticParams` from active+snapshotted offers.
- Renders title, price, CTA, plus blurb/image from `media` when present.
- `Product` + `Offer` JSON-LD (see §7).
- 404 via `notFound()` when the slug is missing/inactive.

### CTA behaviour (interim, pre–Plan 3)
- Primary CTA routes into the **existing coverage funnel** ("Check availability" / "Get started").
- Hardware / non-coverage offers route to contact/quote.
- No "Add to cart" yet — that CTA swap is Plan 3. No disabled/placeholder buttons.

---

## 7. JSON-LD (structured data — the SEO play)

- **List page** (`/offers`): `ItemList` whose items reference each offer's detail URL.
- **Detail page** (`/offers/[slug]`): schema.org `Product` with an `offers` `Offer`:
  ```json
  {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "<title>",
    "image": "<media.image, omitted if absent>",
    "description": "<media.description, omitted if absent>",
    "offers": {
      "@type": "Offer",
      "price": "<resolved_price>",
      "priceCurrency": "ZAR",
      "availability": "https://schema.org/InStock",
      "url": "https://www.circletel.co.za/offers/<slug>"
    }
  }
  ```
- Emitted as a `<script type="application/ld+json">` block. No cost/margin fields ever appear.

---

## 8. Render & caching

- ISR: `export const revalidate = 300` (5 minutes) on both pages.
- Pages serve static-fast from the latest snapshot; revalidation picks up republished prices.
- **Serves last-good always** — the public surface never blocks on snapshot staleness. Staleness is
  an **admin-only** signal (per the blueprint); the public page shows the last computed price
  regardless.

---

## 9. Bundled fix — staleness guard (from the deferred ledger)

Phase 0 left a known gap: `recompute-offer-pricing` `loadDraft` sets `sourceUpdatedAt` from the
offer's own `updated_at` (always ≥ `computed_at`), so the `isSnapshotStale` guard never fires.

Fix in this plan: compare against the **source product's** `updated_at` (from the unified
aggregator / source table) rather than the offer's own. This makes the admin "stale — recompute"
signal correct. Scoped and small; included here because this plan owns the snapshot read path.

> If, during implementation, sourcing the source product's timestamp proves to require new
> aggregator plumbing beyond a few lines, this fix is split into its own follow-up rather than
> bloating Plan 2. The public read surface does not depend on it.

---

## 10. Testing (TDD)

- `public-read` unit tests:
  - **Asserts cost/margin/provenance fields are absent** from the returned objects (the security guarantee).
  - Segment filtering (`consumer`/`business`/`all`, `both` membership).
  - Active-only + snapshot-required filtering.
- API route tests: response shape, `404` for unknown slug, `400` for invalid segment.
- Live verify script (`scripts/offers/verify-storefront.ts`): hit `GET /api/offers` and
  `GET /api/offers/[slug]` against the real published offer; assert price present and **no cost
  leakage** in the JSON.

---

## 11. Out of scope (→ Plan 3)

- Cart, `cart_items`, `order_line_items`, status rollup.
- Checkout / NetCash cart total.
- `consumer_orders` channel + attribution.
- "Add to cart" CTA swap.
- Auth-after-cart flow (see `docs/superpowers/specs/2026-06-28-phase2-auth-after-cart-design.md`).

---

## 12. New / changed files (anticipated)

| File | Change |
|---|---|
| `lib/offers/public-read.ts` | NEW — sanitized read layer |
| `lib/types/offer.ts` (or `public-offer.ts`) | NEW types `PublicOffer`, `PublicOfferDetail` |
| `app/api/offers/route.ts` | NEW — list endpoint |
| `app/api/offers/[slug]/route.ts` | NEW — detail endpoint |
| `app/offers/page.tsx` | NEW — list page + tabs + ItemList JSON-LD |
| `app/offers/[slug]/page.tsx` | NEW — detail page + Product/Offer JSON-LD |
| `lib/inngest/functions/recompute-offer-pricing.ts` | EDIT — staleness source timestamp fix (§9) |
| `__tests__/lib/offers/public-read.test.ts` | NEW — sanitization + filtering tests |
| `__tests__/app/api/offers/*` | NEW — route tests |
| `scripts/offers/verify-storefront.ts` | NEW — live verification |
