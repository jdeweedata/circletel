# Plan 2 — Offer Storefront Read (`/offers`) — Design

**Date:** 2026-06-28
**Status:** Approved (design) — pending implementation plan
**Depends on:** Offer Spine Phase 0 (PR #578 + #585, merged + live-verified)
**Blueprint:** `docs/superpowers/specs/2026-06-27-commerce-product-platform-blueprint-design.md` (Domain 4 — Storefront & Commerce; Phase 1 "ship this week" play)
**Review:** incorporates document-review P0/P1/P2 (2026-06-28) — VAT price contract, media whitelist, ISR/segment resolution, server-only, leakage tests, concrete CTA URLs; staleness fix de-scoped (see §9).

---

## 1. Goal

Ship the public, browseable, data-driven catalogue that the Offer Spine makes possible — a
**snapshot-fed pricing surface with structured data (JSON-LD)**. The blueprint names this the
"#1 ship-this-week play": Vox is the only SA competitor exposing pricing publicly (via JSON-LD),
and CircleTel has priced products with no public way to browse them.

This plan is **read-only**. It adds no write paths, no cart, and no checkout. It reads the
pre-computed `offer_pricing_snapshot` rows produced by Phase 0 and renders them.

### Success criteria
- `/offers` renders every active offer that has a pricing snapshot, with consumer/business tabs.
- `/offers/[slug]` renders a per-offer detail page with `Product`/`Offer` JSON-LD.
- **All public prices are VAT-inclusive and labelled** (§4.1) — no ex-VAT price is ever displayed.
- The public API and pages **never expose cost, margin, or source provenance**.
- Pages serve fast (static + ISR, snapshot-backed) and never block on staleness.
- Tests prove both the **no-cost-leakage** and **VAT-inclusive** guarantees, including in rendered HTML/JSON-LD.

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
   (service-role, RLS)              (sanitize + add VAT)       │
                                                               ▼
                                          /offers (static list, client tabs)
                                          /offers/[slug] (detail + JSON-LD)
                                                               │ CTA
                                                               ▼
                                          existing coverage funnel / contact
```

An offer appears publicly **only if** it has a snapshot row (i.e. a resolved price exists). The
public surface reads snapshots — never resolves pricing per request.

---

## 4. Public read layer — `lib/offers/public-read.ts` (security-critical)

A single, dedicated read module so internal cost data can never leak. The API routes and the pages
use **only** this module; they never query `offers`/`offer_pricing_snapshot` directly.

**First line of the file:** `import 'server-only'` — mechanically prevents this module (and the
service-role client + cost data) from ever being bundled into a client component. Build fails if a
client component imports it.

### 4.1 Price contract (VAT) — P0

`offer_pricing_snapshot.resolved_price` is stored **EX-VAT**. This is the established
`service_packages` convention (`app/packages/page.tsx`: *"service_packages stores prices ex-VAT —
multiply by 1.15 for display"*), and the Phase 0 resolver sets `resolvedPrice = basePrice` directly
from the source, carrying that ex-VAT basis through unchanged.

**The public surface must never display an ex-VAT price.** The read layer computes and exposes:

| Public field | Definition |
|---|---|
| `priceInclVat` | `round(resolved_price * (1 + VAT_RATE) * 100) / 100` — **the only price shown in UI and JSON-LD** |
| `vatRate` | `0.15` |
| `vatLabel` | `"incl. VAT"` (rendered next to every price) |

`VAT_RATE` comes from a new shared constant `lib/billing/vat.ts` (`export const VAT_RATE = 0.15`
+ `addVat(excl: number): number`). There is currently **no** shared VAT constant — `0.15` is
duplicated across `lib/invoices/*`, `lib/contracts/*`, `lib/integrations/zoho/*`. This plan adds the
single shared helper and uses it; it does **not** refactor those existing call sites (out of scope).

#### Mixed-VAT precondition guard (P0)
The spine has **no per-source VAT-basis flag**. For this public surface, only `service_packages`
(uniformly ex-VAT) are eligible, so grossing every exposed `resolved_price` up by 15% is correct.
But Phase 0 can publish other sources into offers, and MTN/hardware/supplier sources may normalize
to **incl-VAT**, which would be **double-taxed** if exposed and grossed again.

Therefore Plan 2 enforces an explicit invariant: **only offers sourced from the `service_packages`
table may be exposed publicly.** The read layer filters to offers whose internal
`offers.source_uid` starts with `service_packages:` **and** whose primary component
`source_type = 'service_package'`. The `source_type` check alone is not enough, because Phase 0 maps
both `admin_products` and `service_packages` to `source_type = 'service_package'`; the `source_uid`
prefix is the source-table proof.

The read layer **logs + excludes** any active+snapshotted offer from another source, rather than
guessing its VAT basis. Tests assert that `admin_products:*`, `mtn_dealer_products:*`, and hardware
offers are excluded, while `service_packages:*` offers pass. When future sources are published, a
per-source VAT-basis flag must be added to the spine **before** they appear here — captured as an
explicit out-of-scope item (§11).

### 4.2 Field policy

| Field | Source | Public? |
|---|---|---|
| `slug` | offers | ✅ exposed |
| `title` | offers | ✅ exposed |
| `description` | `media.description` (string) only | ✅ exposed when present, else omitted |
| `image` | `media.image` (string) only | ✅ exposed when present, else omitted |
| `customer_type` | offers | ✅ exposed (drives tabs) |
| `priceInclVat`, `vatRate`, `vatLabel` | derived (§4.1) | ✅ exposed |
| **raw `media` blob** | offers | ❌ **never exposed whole** — only the two whitelisted keys above are read |
| `resolved_price` / `priceExclVat` | snapshot / derived | ❌ never exposed publicly; used server-side only to compute `priceInclVat` |
| `cost_buildup`, `total_cost`, `margin_pct`, `guardrail_status` | snapshot | ❌ **NEVER** |
| `source_uid`, `source_type`, `source_id` | offers / components | ❌ never (provenance) |
| component `unit_cost`, `unit_price` | offer_components | ❌ never |

> The `media` blob is **whitelisted, not passed through**: the mapper reads only
> `media.description` and `media.image` (and only if they are strings). Any other key — present or
> future — is dropped. A test asserts unknown `media` keys never reach the output.

### 4.3 Behaviour
- Filter: `status = 'active' AND lifecycle_state = 'active'`, a snapshot row must exist (inner join
  on `offer_pricing_snapshot`), and the VAT-basis guard (§4.1) excludes non-`service_packages:*`
  source UIDs.
- Segment filter (used by the API; the page filters client-side, §6): `consumer` →
  `customer_type IN ('consumer','both')`; `business` → `customer_type IN ('business','both')`;
  `all` → no filter.
- Reads via the **service-role server client** (`@/lib/supabase/server`). The Phase 0 tables have
  **no anon RLS policy** by design; `server-only` enforces server-side execution.

### 4.4 Public types
`PublicOffer` (list shape) and `PublicOfferDetail` (detail shape) in `lib/types/offer.ts`,
containing only the exposed fields above. The DB-row → public-type mapper is the single
sanitization + VAT boundary.

---

## 5. API endpoints

App Router route handlers (not bound by the page-ISR concern in §8). Async params where applicable.

- `GET /api/offers?segment=consumer|business|all`
  → `{ offers: PublicOffer[] }`. Default `segment=all`. Invalid segment → 400.
- `GET /api/offers/[slug]`
  → `{ offer: PublicOfferDetail }` or 404 if missing/inactive/no-snapshot/non-ex-VAT-source.
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

### `/offers` (list) — static + client-side tabs (P1)
- **Static** server component (no `searchParams`, preserving ISR — §8). It reads **all** active,
  snapshotted, ex-VAT offers via `public-read` server-side at build/revalidate.
- It passes that single dataset to a small **client** tab component that filters by `customer_type`
  in the browser (consumer default tab; `both` offers appear in both). No server round-trip per tab,
  so the page stays static — this is what resolves the searchParams-vs-ISR conflict.
- Responsive card grid: title, `R{priceInclVat}` + `vatLabel`, optional blurb (`description`), CTA.
- Uses existing `Navbar` + `Footer` and CircleTel design tokens (`circleTel-navy`, `circleTel-orange`).
- `ItemList` JSON-LD covering all offers (built server-side, VAT-inclusive prices).

### `/offers/[slug]` (detail)
- Server component. `generateStaticParams` from active+snapshotted ex-VAT offers.
- Renders title, `R{priceInclVat}` + `vatLabel`, CTA, plus blurb/image from whitelisted `media` when present.
- `Product` + `Offer` JSON-LD (§7).
- 404 via `notFound()` when the slug is missing/inactive/excluded.

### CTA behaviour (interim, pre–Plan 3) — concrete URLs (P2)
Offer intent/attribution is carried on the query string so it survives the hop:
- **Connectivity offers** (primary component `service_package`): CTA "Check availability" →
  **`/coverage-check?offer=<slug>`**. (`app/coverage-check` is the existing standalone entry; the
  `offer` param is read for attribution and to pre-select intent; Plan 2 updates this redirect
  route because it currently only understands `plan`.)
- **Hardware / non-coverage offers**: CTA "Request a quote" → **`/contact?subject=<title>&offer=<slug>`**.
  Plan 2 updates the contact page to read `subject`/`offer` into the form message; it currently only
  pre-fills coverage-related params.
- No "Add to cart" yet — that CTA swap is Plan 3. No disabled/placeholder buttons.

> Note: in Plan 2 only `service_package` offers are exposed (§4.1 guard), so the connectivity CTA is
> the live path; the hardware branch is specified now so the component is complete when hardware
> offers become eligible.

---

## 7. JSON-LD (structured data — the SEO play)

- **List page** (`/offers`): `ItemList` whose items reference each offer's detail URL.
- **Detail page** (`/offers/[slug]`): schema.org `Product` with an `offers` `Offer`. **Price is
  VAT-inclusive** (`priceInclVat`):
  ```json
  {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "<title>",
    "image": "<media.image, omitted if absent>",
    "description": "<media.description, omitted if absent>",
    "offers": {
      "@type": "Offer",
      "price": "<priceInclVat>",
      "priceCurrency": "ZAR",
      "availability": "https://schema.org/InStock",
      "url": "https://www.circletel.co.za/offers/<slug>"
    }
  }
  ```
- Emitted as a `<script type="application/ld+json">` block. No cost/margin/provenance fields ever
  appear, and no ex-VAT price ever appears.

---

## 8. Render & caching

- Both pages are **statically rendered with ISR**: `export const revalidate = 300` (5 minutes).
- The list page takes **no `searchParams`** (tabs are client-side, §6), so it is not forced into
  dynamic rendering — the ISR/static promise holds. (Per Next.js docs, reading `searchParams` opts a
  page into dynamic rendering; we avoid it deliberately.)
- Pages serve static-fast from the latest snapshot; revalidation picks up republished prices.
- **Serves last-good always** — the public surface never blocks on snapshot staleness. Staleness is
  an admin concern, not surfaced here (§9).

---

## 9. Staleness guard — explicitly NOT in Plan 2 (de-scoped per review)

Phase 0 left `recompute-offer-pricing.loadDraft` setting `sourceUpdatedAt` from the offer's own
`updated_at`, so `isSnapshotStale` never fires. The review correctly notes that **`isSnapshotStale`
is currently dead code with no calling path** — fixing `loadDraft` alone produces no working signal,
because nothing consumes it.

A correct admin "stale — recompute" signal requires (a) sourcing the source product's real
`updated_at`, **and** (b) an admin read/display path that calls `isSnapshotStale` and shows it.
That is its own small feature, not a line-fix, and it has **no bearing on the public read surface**
(which serves last-good regardless). It is therefore **removed from Plan 2** and remains a separate
deferred item with this corrected scope.

---

## 10. Testing (TDD)

- `lib/billing/vat.ts`: `addVat` rounds correctly (e.g. `1899 → 2183.85`).
- `public-read` unit tests:
  - **VAT:** output `priceInclVat` equals `resolved_price * 1.15` rounded; public objects contain no
    `priceExclVat`, `resolved_price`, raw/unlabelled price, or ex-VAT price.
  - **No leakage:** cost/margin/provenance fields are absent from returned objects.
  - **Media whitelist:** unknown `media` keys are dropped; only `description`/`image` strings pass.
  - **VAT-basis guard:** `service_packages:*` offers pass; `admin_products:*`, MTN, and hardware
    offers are excluded even if their component `source_type` would otherwise look eligible.
  - **Filtering:** segment membership (`consumer`/`business`/`all`, `both`), active-only, snapshot-required.
- API route tests: response shape, `404` (unknown/excluded slug), `400` (invalid segment).
- **Rendered-output leakage test (P2):** render `/offers` and a detail page (or fetch their HTML) and
  assert the HTML **and** the JSON-LD block contain none of `total_cost`, `margin_pct`, `cost_buildup`,
  `source_uid`, and contain the VAT label — guarding the template layer, not just the data layer.
- Live verify script (`scripts/offers/verify-storefront.ts`): hit `GET /api/offers` and
  `GET /api/offers/[slug]` against the real published offer; assert `priceInclVat` present, equals
  ex-VAT×1.15, and **no cost leakage**.

---

## 11. Out of scope

→ **Plan 3:** cart, `cart_items`, `order_line_items`, status rollup, checkout / NetCash cart total,
`consumer_orders` channel + attribution, "Add to cart" CTA swap, auth-after-cart
(`docs/superpowers/specs/2026-06-28-phase2-auth-after-cart-design.md`).

→ **Deferred, prerequisite for exposing non-service-package offers:** a **per-source VAT-basis flag**
on the spine (so MTN/hardware/supplier offers can be priced correctly and pass the §4.1 guard).

→ **Deferred, separate feature:** the admin snapshot-staleness signal (§9).

→ **Not in this plan:** `media` enrichment by the publisher (offers ship as title + price until then);
refactoring existing duplicated VAT constants.

---

## 12. New / changed files (anticipated)

| File | Change |
|---|---|
| `lib/billing/vat.ts` | NEW — shared `VAT_RATE` + `addVat` |
| `lib/offers/public-read.ts` | NEW — `server-only` sanitized + VAT read layer, VAT-basis guard |
| `lib/types/offer.ts` | EDIT — add `PublicOffer`, `PublicOfferDetail` |
| `app/api/offers/route.ts` | NEW — list endpoint |
| `app/api/offers/[slug]/route.ts` | NEW — detail endpoint |
| `app/offers/page.tsx` | NEW — static list page + ItemList JSON-LD |
| `components/offers/OfferTabs.tsx` | NEW — client tab/filter component |
| `app/offers/[slug]/page.tsx` | NEW — detail page + Product/Offer JSON-LD |
| `app/coverage-check/page.tsx` | EDIT — preserve `offer=<slug>` attribution/preselect intent instead of redirecting home |
| `app/contact/page.tsx` | EDIT — read `subject`/`offer` params into the form message |
| `__tests__/lib/billing/vat.test.ts` | NEW |
| `__tests__/lib/offers/public-read.test.ts` | NEW — VAT, sanitization, whitelist, guard, filtering |
| `__tests__/app/api/offers/*` | NEW — route tests |
| `__tests__/app/offers/*` | NEW — rendered HTML / JSON-LD leakage |
| `scripts/offers/verify-storefront.ts` | NEW — live verification |

*(No edit to `recompute-offer-pricing.ts` — staleness fix de-scoped, §9.)*
