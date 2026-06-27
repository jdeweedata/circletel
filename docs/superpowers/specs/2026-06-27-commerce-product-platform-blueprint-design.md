# CircleTel Commerce & Product Platform — Target-State Blueprint

**Date:** 2026-06-27
**Status:** Approved blueprint (north star). First buildable slice = Phase 0+1.
**Author:** Brainstormed with Claude Code (Jeffrey)
**Type:** Cross-domain architecture blueprint — NOT a single implementation spec. Each phase
below gets its own spec → plan → build cycle.

---

## 1. Purpose & Scope

Define the comprehensive target-state architecture for managing, administrating, pricing, and
developing products/solutions — for both consumer and business — and for selling them through a
full ecommerce capability, across current and future suppliers (including the MTN/Arlan reseller
catalogue).

This is a **blueprint**, not a buildable spec. It exists so every future slice aligns to one
coherent system instead of accreting point solutions. The first slice we actually build
(Phase 0+1) is called out at the end; everything else is the documented, committed north star.

### Decisions locked during brainstorming

1. **Full target-state blueprint** spanning all six domains (not a single-slice design).
2. **Product-development lifecycle + no-code Solution Builder** are in scope (Domain 1).
3. **Financials = margin intelligence now; full cost-to-cash designed but staged** (Domain 2 /
   Phase 5).
4. **Multi-channel from day one** — direct consumer, direct business, partner/ambassador
   (EarnMore), and admin/CPQ all flow through one order engine. Channel + attribution +
   commission are first-class in the data model immediately.
5. **Architecture spine = canonical "Offer" layer (Approach A)** — existing source tables stay
   as systems-of-record and *publish* into the Offer layer; everything downstream speaks only
   Offer.
6. **Existing pricing engines + Rules Studio are reused, not replaced** — they resolve at the
   Offer layer.
7. **Orders: extend `consumer_orders` + add `order_line_items`** (do not rebuild). Fulfillment
   status moves to the line item; order-level status is a rollup.
8. **Pricing is event-driven** (snapshots recomputed by Inngest on change). Availability/stock
   is a live overlay at request time.

---

## 2. What Already Exists (do not rebuild)

The product-management / pricing / supplier-admin "engine room" is ~70% built. Verified in
codebase 2026-06-27:

- **5 supplier feeds** — Scoop, MiRO, Nology, + Rectron (current branch) — syncing into
  `supplier_products` with `supplier_sync_logs`. Orchestrated via `lib/suppliers/sync-orchestrator.ts`
  and `/api/admin/suppliers/sync`.
- **Hardware catalogue** curated from feeds: `circletel_hardware_products`,
  `hardware_product_suppliers`, `hardware_product_terms`, `hardware_service_links`,
  view `v_hardware_product_detail`.
- **Three pricing models:** hardware markup; connectivity margin (`product_wholesale_costs`
  for Tarana/DFA/Echo SP); MTN/Arlan commission + use-case markup across ~25k
  `mtn_dealer_products` (`MTN_COMMISSION_TIERS` + `calculateCommission()` in
  `lib/types/mtn-dealer-products.ts`).
- **Rules engine + Rules Studio** — `lib/products/rules/`, persisted thresholds in
  `product_rules_config` (marginFloorPct 25, bundleMarginFloorPct 30, mtnDefaultMarkupFloorPct 8).
- **Product Workspace Phase 1** (PR #552) — `components/admin/products/workspace/ProductWorkspace.tsx`
  with Catalogue (unified console + `UnifiedProduct` read model), Suppliers, MTN Tools.
- **Commerce primitives (partial):** 3–5 stage order flow (Zustand store), NetCash Pay Now
  checkout (`components/checkout/`, `app/api/payment/netcash/`), `consumer_orders`,
  `business_quotes`, MITS CPQ, admin fulfillment dashboard (`app/admin/fulfillment/`),
  PPPoE provisioning.

### Known gaps the blueprint closes

No persistent/multi-item cart; no self-serve B2B; promotions are mock-only
(`lib/mock-promotions.ts`); no customer order-tracking portal; no Solution Builder / bundling
beyond a `bundle_components` JSONB column; no channel/attribution on orders.

---

## 3. The Spine — the "Offer" abstraction (Approach A)

An **Offer** is the single canonical *sellable unit*. Source tables remain systems-of-record and
**publish** into the Offer layer. Everything downstream (storefront, cart, promotions, channels,
financials, marketing) speaks only Offer.

```
SYSTEMS OF RECORD (unchanged, keep syncing)        THE SPINE            CONSUMERS OF THE SPINE
 supplier_products (5 feeds) ─┐
 service_packages           ─┤
 mtn_dealer_products (~25k)  ─┤  publish   ┌──────────┐  one API   ┌── Storefront / cart / checkout
 circletel_hardware_products ─┼──────────▶ │  OFFER   │ ─────────▶ ├── Promotions engine
 NEW: solutions (bundles)    ─┤            │ + price  │            ├── Channels (direct/partner/CPQ)
 NEW: dev-pipeline drafts    ─┘            │ + rules  │            ├── Financial intelligence
                                           └──────────┘            └── Marketing / merchandising
```

An Offer carries: identity (name, slug, media, specs); **components** (what it's made of);
**pricing** (resolved by the existing 3 engines); **eligibility/rules** (margin floor, FICA,
coverage, customer-type); **lifecycle state**; **channel visibility**.

The existing pricing engines and Rules Studio are **not replaced** — they resolve at the Offer
layer, so they apply uniformly to bundles and new solutions, not just single SKUs.

**Why Approach A** (over collapsing into one mega product table, or per-domain point solutions):
sources keep working untouched; cart/promotions/channels/financials are built **once** against
one spine instead of N×M against every source; new product types (VoIP, IoT, security) are just
new Offer publishers. Rejected alternatives: mega-table (high-risk migration, breaks 5 sync
pipelines, no revenue for weeks); point solutions (N×M integration mess, contradicts
"comprehensive and easy to use").

---

## 4. The Six Domains (target state)

**Domain 1 — Product Development & Solution Builder.** Lifecycle pipeline
`IDEA → DRAFT → PRICED → APPROVED → ACTIVE → ARCHIVED` (extends existing `product-lifecycle`).
The **Solution Builder** is a no-code composer: staff combine connectivity + a hardware SKU
(from `supplier_products`) + an MTN deal + labour/once-off into a bundle, which becomes an Offer
with components. This is how Managed IT, Power Backup, VoIP, IoT, security packages are created
without engineering tickets. Flagship pre-built bundles = the moat products competitors
structurally lack (Managed IT + Power Backup + connectivity).

**Domain 2 — Pricing, Rules & Margin Intelligence.** The 3 pricing models + Rules Studio,
resolving at the Offer layer. Adds a per-Offer financial panel: full cost build-up (supplier
landed cost + wholesale COS + MTN commission earned + labour) → live margin after all costs →
guardrail status → what-if simulation. **Planning numbers now**; cost-to-cash reconciliation is
modeled but deferred to Phase 5.

**Domain 3 — Promotions Engine.** Replaces `mock-promotions.ts`. Real engine: coupon codes,
time-bound campaigns, volume/bundle/percentage/fixed discounts, eligibility (customer-type,
channel, first-order), stacking rules — evaluated against Offers in-cart and
**margin-guardrail-aware**. Must support competitor-grade promo types: **waive-NRC**,
**free-component**, **intro-pricing** (not just % off) — to match Afrihost "Save R5,000 setup"
and SuperSonic "free install/activation/delivery."

**Domain 4 — Storefront & Commerce.** Persistent, **multi-item cart** mixing Offer types
(connectivity + hardware + MTN deal in one order). Direct self-serve for consumer and business;
business retains a save-as-quote path (a cart saved rather than checked out — same spine, replaces
the isolated `business_quotes` flow over time). Reuses NetCash; extends checkout from
single-package to cart.

**Domain 5 — Order → Delivery → Provisioning Ops.** Extends the fulfillment dashboard with a
**customer-facing order-tracking portal** and ties order **line items** to fulfillment tracks
(ship router + schedule install + activate SIM + onboard managed-IT, independently). One order
fans out to multiple tracks. Narrows the support-window threat (8–5 vs competitor 24/7) via
self-service.

**Domain 6 — Marketing & Sales.** Merchandising of Offers (featured, campaigns); lead→quote→order
attribution by channel; connective tissue to Zoho (CRM/Books/Desk). Thinnest domain — mostly
surfaces spine data.

**Multi-channel is a property of the spine, not a 7th domain:** every Offer has channel
visibility; every Order carries `channel + agent_id + attribution + commission_breakdown`, so
direct, business, partner/ambassador (**EarnMore**), and admin-CPQ flow through one engine.

---

## 5. Shared Data Model

Four new clusters; everything else reused. New tables are *thin* — they point at existing rows,
they do not copy them.

### Cluster 1 — Offer spine
| Table | Purpose | Key columns |
|---|---|---|
| `offers` | Canonical sellable unit | id, slug, title, media, customer_type (consumer/business/both), lifecycle_state, channel_visibility (jsonb), base_price, status |
| `offer_components` | What an Offer is made of | offer_id, source_type (supplier_product/service_package/mtn_deal/hardware/labour/recurring), source_id, qty, role (primary/addon/required) |
| `offer_pricing_snapshot` | Resolved price + cost build-up from the 3 engines | offer_id, resolved_price, cost_buildup (jsonb), margin_pct, guardrail_status, computed_at |

`source_id` is a foreign-key-by-convention into existing tables — this is what keeps sources as
systems-of-record. Pricing engines **write** `offer_pricing_snapshot`; nothing downstream
recomputes price.

### Cluster 2 — Lifecycle & Solution Builder
- `offer_lifecycle_events` — audit of IDEA→ARCHIVED transitions (who/when).
- `solution_drafts` — work-in-progress bundles before they become live Offers. Approval gate
  (margin-floor breach → sign-off) writes here.

### Cluster 3 — Commerce & Channel
- `carts` + `cart_items` — persistent, multi-Offer, survive sessions.
- **Extend `consumer_orders`** (do not rebuild): add `channel`, `agent_id`, `attribution` (jsonb),
  `commission_breakdown` (jsonb). Expose physical table via an `orders` view; treat as the
  universal orders table.
- **`order_line_items`** — one order → many Offers. **Fulfillment status lives on the line item**;
  order-level status is a **rollup** (e.g. "2 of 3 active"). Header fields (customer, channel,
  payment, totals) stay on the order; price + fulfillment + provisioning move to the line.
- B2B quotes become a cart saved-as-quote (same spine), superseding the isolated `business_quotes`
  path incrementally.

### Cluster 4 — Promotions
- `promotions` (type incl. waive_nrc/free_component/intro_pricing/percentage/fixed, value,
  validity, eligibility, stacking_group).
- `promotion_redemptions` (usage tracking, per-customer limits).
- `coupon_codes` (child of promotions).
Evaluated in-cart, guardrail-aware.

### Reused untouched
All 5 supplier/source tables, `product_wholesale_costs`, `product_rules_config`,
`mtn_dealer_products` commission logic, NetCash payment tables, KYC, fulfillment.

### Deferred-by-design (named now, built Phase 5)
Cost-to-cash tables: supplier payables, MTN/Arlan commission **actuals**, NetCash collection
matching, Zoho Books sync. Shaped in the model now so Domain 2's later phase needs no redesign.

---

## 6. Automation & Integration Fabric (cross-cutting)

The part that makes "easy to use" survivable for a 4.5-FTE team — the system does the busywork.

- **Inngest jobs:** supplier sync → auto-republish affected Offers → recompute
  `offer_pricing_snapshot` → flag any Offer below margin floor. MTN monthly import does the same.
  A cost change *finds you*; nobody audits 25k deals by hand.
- **Event-driven pricing (resolution model):** when a source row, rule, or promo changes, a job
  re-resolves affected Offers. Storefront reads pre-computed snapshots → fast pages, no per-request
  margin math. **Hybrid split:** price/margin = snapshot (event-driven); coverage-gated
  availability + real-time stock = **live overlay** at request time. `computed_at` staleness
  guard: if a source changed after the snapshot, admin sees "stale — recompute"; storefront still
  serves last-good. Snapshots feed JSON-LD structured data (enables public pricing pages,
  Vox-style).
- **Integrations at clean boundaries:** NetCash (collections — live); Zoho CRM (lead/attribution,
  Domain 6); Zoho Books (deferred cost-to-cash sync — boundary defined now); Zoho Desk (post-sale
  tickets per order). Use existing webhook/signature patterns.
- **Permissions:** existing lifecycle approval gates + discount-authority tiers
  (`margin-guardrails.md`: rep 0–5%, director 5–10%, MD 10–15%) become the RBAC for Offer
  publishing and promo approval.
- **Admin UX:** the **Product Workspace becomes the single cockpit** — today's Catalogue /
  Suppliers / MTN Tools gain Solution Builder / Promotions / Channels / Financials tabs. One place,
  progressive disclosure, not seven admin apps.

---

## 7. Competitive Context (from second-brain KB, June 2026)

Source: `/root/second-brain/knowledge-base/raw/pages/sa-isp-competitor-landscape-june-2026.md`.

- **Structural moat (no competitor has it):** Managed IT + Power Backup + IT-Assessment-led
  connectivity. → Solution Builder flagship bundles (Phase 2).
- **Vox** is the only competitor showing pricing publicly (via JSON-LD). → snapshot-fed public
  pricing page is the #1 "ship this week" play (Phase 1).
- **SuperSonic** sets a R199–R269 MTN-backed price floor. → event-driven margin-floor flagging
  is how we police it without bleeding.
- **Afrihost** "Save R5,000 setup" / free router; **SuperSonic** free install/activation. →
  promo engine needs waive-NRC / free-component / intro-pricing types (Phase 2/3).
- **EarnMore** (commission-based reseller programme) = the cheapest acquisition lever against
  40–60% rising CAC. → validates multi-channel-from-day-one; it *is* `channel='earnmore'` +
  `agent_id` + `commission_breakdown` (Phase 3).
- **Threats to design around:** trust gap (75K Afrihost reviews vs our 3), support gap
  (8–5 vs Vox 24/7). → order-tracking portal + self-service (Phase 4) partially mitigate support.

---

## 8. Runway-Aware Build Sequence

**Sequencing rule:** every phase is a thin vertical slice through the spine that is *either*
revenue-generating *or* cheap enough to be free. We build the slice of each domain the current
revenue goal needs — never a domain "fully" before the next.

| Phase | Slice | Why now | Revenue | Effort |
|---|---|---|---|---|
| **0 — Thin spine** | `offers` + `offer_components` + `offer_pricing_snapshot` + publisher mapping existing service_packages/hardware/curated MTN deals into Offers. No new UI. | Unblocks everything; reuses `UnifiedProduct`. | Enabler | S |
| **1 — Sell the moat you have** | Public pricing page (snapshots + JSON-LD); persistent multi-item cart; NetCash checkout extended to cart; `order_line_items` + status rollup. | Revenue unlock — priced products with no way to buy a bundle. | Direct | M |
| **2 — Solution Builder + moat bundles + core promos** | No-code Solution Builder; pre-built Managed IT + Power Backup + connectivity bundles; promo types waive-NRC/free-component/intro-pricing. | Products no competitor can copy; competitor-grade offers. | Direct | M–L |
| **3 — EarnMore channel** | Activate channel + agent_id + commission_breakdown; partner order-on-behalf + commission view. | Cheapest acquisition lever; schema already present from P1. | Indirect | M |
| **4 — Order ops & trust** | Customer order-tracking portal; line-item fulfillment tracks wired to provisioning/dispatch/install. | Narrows support-gap threat; deflects load. | Retention/CAC | M |
| **5 — Deferred-by-design** | Cost-to-cash (payables, MTN commission actuals, Books sync); deeper marketing/CRM attribution. | Built when revenue justifies integration weight. | Efficiency | L |

Phases 1–4 map onto the competitor file's ship-this-week / this-month / this-quarter cadence.

### Runway caveat (explicit)

CircleTel has ~13 days of cash and ~R35K/mo revenue. **No 5-phase platform survives that.** Two
consequences:
1. Near-term, **cost-cutting extends runway faster than any build** (~R74K/mo of cuts identified
   in strategy docs). This platform is the *medium-term* revenue engine, not the *this-fortnight*
   survival move. The blueprint is a **12-month north star** — committed directionally, not all
   at once.
2. **The next decision is to spec exactly ONE slice — Phase 0+1 merged — as the first buildable
   unit.** It is the smallest thing that turns the moat into a working checkout, it is
   revenue-positive, and every later phase plugs into its spine without rework.

---

## 9. First Buildable Slice (next spec)

**Phase 0+1 merged:** the thin Offer spine + a sellable storefront slice.

Scope for the follow-on implementation spec:
- `offers`, `offer_components`, `offer_pricing_snapshot` tables + publisher from existing
  service_packages / curated hardware / curated MTN deals.
- Inngest recompute job + `computed_at` staleness guard.
- Public pricing page reading snapshots (+ JSON-LD structured data).
- Persistent multi-item `carts` / `cart_items`.
- `order_line_items` + `consumer_orders` extension (channel/attribution columns present but only
  `direct` channel exercised) + status rollup.
- NetCash checkout extended from single-package to cart.

Out of scope for the first slice (later phases): Solution Builder UI, promotions engine, EarnMore
channel UI, customer order-tracking portal, cost-to-cash/Books sync.

---

## 10. Open Questions / Risks

- **Branch hygiene:** this doc was drafted while on `feat/rectron-catalogue-auto-sync`. The
  Phase 0+1 build should start on its own branch.
- **`business_quotes` migration path:** save-as-quote on the new spine must coexist with existing
  B2B quote/MITS CPQ flows during transition — not a big-bang cutover.
- **Snapshot recompute fan-out:** an MTN monthly import touches ~25k rows; recompute must be
  batched/idempotent to avoid job storms.
- **`consumer_orders` as universal table:** naming is now a misnomer; mitigated by an `orders`
  view, but worth a future rename decision.
