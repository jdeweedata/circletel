# Product Workspace — Design Spec

**Date:** 2026-06-11
**Status:** Approved (Jeffrey, 2026-06-11)
**Scope decisions:** TMF-lite staged approach · hard cutover · Phase 2 prioritizes Solution Builder · Suppliers folded into workspace

## 1. Problem

Admin product management is spread across 8 pages built in 4 different eras, each with its own
filters, tables, cards, and status-badge logic:

| Page | State today |
|------|-------------|
| `/admin/products/unified-console` | Newest (PR #528). Read-only aggregation over 4 tables + rules engine. Cannot create/edit. |
| `/admin/products` + `/drafts` + `/archived` | Wrappers around one 944-line `ProductsDashboard` with its own filter system. |
| `/admin/products/hardware` | Standalone list, inline filter logic, own status-badge rendering. |
| `/admin/products/relationships` | Standalone 537-line page over `product_relationships`. |
| `/admin/mtn-dealer-products` | Full-featured; overlaps with dead legacy `/admin/products/mtn-deals`. |
| `/admin/products/new` | 590-line standalone form. |
| `/admin/suppliers` | Standalone sync dashboard; promote-to-catalogue is a context switch. |

Structural debts:

- **Dual product system**: `admin_products` (editorial) vs `service_packages` (live) — admins
  cannot tell which to edit.
- **Rules engine not enforced**: `POST /api/admin/products/[id]/publish` does not consistently run
  the rules engine; Rules Studio threshold overrides are client-side only (lost on refresh).
- **`admin_products` has no cost column** → margin-floor rule cannot evaluate drafts.
- **MTN deals on 3 pages**, one dead (`/admin/products/mtn-deals`, TODO at line 229).
- **CPQ disconnected from catalogue** — quotes don't pull from a governed offer list.
- 4 filter implementations, 3 card designs, duplicated status-badge logic.

## 2. Reference model (TM Forum TMFC001 / TMF620)

Adopted concepts, mapped onto existing data rather than migrated:

| TMF concept | CircleTel mapping |
|-------------|-------------------|
| ProductSpecification (what it is) | Supplier feed rows, `mtn_dealer_products` |
| ProductOffering (how it's sold) | `service_packages`, `circletel_hardware_products`, `admin_products` (pre-publish) |
| Category tree | New `product_categories` + cross-source assignments (Phase 2) |
| Bundle / composite offering | New `solutions` + `solution_components` (Phase 2) |
| ProductOfferingPrice | Composite one-time + recurring price on solutions (excl-VAT, per billing convention) |
| Lifecycle states | Trimmed to 5: In Design → In Test → Active → Retired → Obsolete |
| Catalog drives CPQ | CPQ picker gains a "Catalogue" source of Active offerings/solutions |

Explicitly NOT adopted: full TMF620 schema migration, ImportJob/ExportJob, multi-currency,
recursive bundles (one level of bundling only, per TMF guidance).

## 3. Phase 1 — Product Workspace (consolidation + governance)

### 3.1 Routing & cutover (hard)

- `/admin/products` becomes the workspace shell.
- Redirects with pre-applied filters/sections:
  - `/admin/products/unified-console` → `/admin/products`
  - `/admin/products/drafts` → `/admin/products?status=draft`
  - `/admin/products/archived` → `/admin/products?status=archived`
  - `/admin/products/hardware` → `/admin/products?source=hardware`
  - `/admin/mtn-dealer-products` → `/admin/products?source=mtn`
  - `/admin/products/relationships` → `/admin/products` (relationships are managed per-product in the detail rail; no standalone section)
  - `/admin/suppliers` → `/admin/products?section=suppliers`
- DELETE: legacy `/admin/products/mtn-deals` page + its orphan `/api/products/mtn-deals` route.
- Old page components deleted once workspace is verified on staging (same PR train, separate
  cleanup commit so it is revertable).
- Sidebar Products group shrinks from 10 entries to: **Products**, **Add Product**, **CPQ Builder**.

### 3.2 Layout

Built entirely on `components/backend/` kit (PageHeader, StatCard, StatusBadge, SectionCard,
InfoRow, EmptyState/ErrorState) — no new visual language.

- **Left rail** — workspace sections with per-section counts:
  *Catalogue* (all sources) · *Solutions* (Phase 2) · *Suppliers* (sync + promote) · *Rules Studio*.
- **Main area** — ONE shared toolbar (search, source, status, category [Phase 2], margin filters)
  over ONE shared product table. Saved-view chips reproduce the old pages: Drafts, Archived,
  Hardware, MTN Deals.
- **Detail rail** — extends `UnifiedProductDetailSidebar`: pricing, cost breakdown, relationships,
  live rule evaluation, audit log, actions (edit / publish / archive / promote).

Replaced (deleted after cutover): `ProductsDashboard` filter system, `ProductsList` (387 lines),
`UnifiedProductGrid`-specific table, `MTNTable`, hardware page inline table, 3 divergent card
designs, duplicated status-badge logic.

### 3.3 Editing from the console (closes the read-only gap)

- Edit drawer per source type: CircleTel editorial fields, hardware fields, MTN curation fields.
- "Add Product" = existing create-form logic restyled into the workspace (drawer or routed panel).
- Publish action lives in the detail rail.
- Relationships management embedded in the detail rail (replaces the standalone page).

### 3.4 Governance fixes (known debts from PR #528)

1. `POST /api/admin/products/[id]/publish` runs `evaluateAdminProductForPublish()` server-side;
   returns 400 with failing rules. Client button reflects blocked state.
2. New table `product_rules_config` persists Rules Studio thresholds (rule_id, config JSONB,
   updated_by, updated_at). Engine loads config server-side; Studio writes through an admin API.
3. Additive column `admin_products.cost_price_zar` so margin-floor evaluates drafts pre-publish.

No other schema changes in Phase 1. Checkout/billing untouched.

## 4. Phase 2 — TMF-lite catalog layer (Solution Builder first)

### 4.1 New additive tables

```sql
product_categories (
  id, name, parent_id /* self-ref tree */, sort_order, created_at
)

product_category_assignments (
  id, category_id, product_uid /* unified "source_table:id" key */, created_at
)

solutions (
  id, name, slug, description, target_segment,
  lifecycle_state, -- in_design | in_test | active | retired | obsolete
  price_once_zar, price_monthly_zar,          -- composite prices, excl VAT
  components_once_sum_zar, components_monthly_sum_zar,  -- snapshot at save
  margin_percent_snapshot,
  sunset_date,                                 -- required when retired
  published_service_package_id,                -- set on publish
  created_by, created_at, updated_at
)

solution_components (
  id, solution_id, product_uid, quantity,
  is_required, price_override_zar, display_order, created_at
)
```

Categories span all 4 sources via the unified `uid` without touching source tables.

### 4.2 Solution Builder (centerpiece)

- Pick components from the catalogue grid (e.g. fibre package + router + installation + support).
- Live component-sum vs composite price; live margin calc with the existing `bundle-margin` (30%)
  rule evaluated as you type.
- Lifecycle controls on the solution.
- **Publish writes a `service_packages` row using the existing `bundle_components` JSONB column**
  → checkout, orders, and billing work unchanged. Zero downstream blast radius.

### 4.3 Lifecycle

5 states: `In Design → In Test → Active → Retired → Obsolete`.
Forward transitions with confirmation dialog; Retire requires a sunset date; all transitions
audit-logged. Existing source statuses are *mapped for display* (e.g. draft→In Design,
active→Active, archived→Retired) — source tables keep their own status columns.

### 4.4 CPQ hook (tail of Phase 2)

CPQ product picker gains a "Catalogue" source listing Active offerings and solutions; selection
snapshots offering+price into `cpq_sessions.step_data`. Existing CPQ flow otherwise untouched.

## 5. Out of scope

- Full TMF620 migration / retiring the `admin_products`–`service_packages` dual system
- Multi-currency
- Customer-facing storefront changes
- Supplier feed-format changes
- CPQ rewrite

## 6. Testing & verification

- Unit tests: rules-config persistence, solution margin math (component sum, overrides, VAT-excl),
  aggregator category filtering, lifecycle transition guards.
- `npm run type-check:memory` (scoped enforcement via `.githooks/pre-push`).
- Browser verification on staging using the established minted-admin-session cookie-injection
  pattern before any prod PR.
- Redirect matrix tested (each old URL lands on the right filtered view).

## 7. Sequencing

Each phase = own branch → staging → PR to main; shippable independently.

**Phase 1:** workspace shell + shared table/filters → edit drawers → publish/rules enforcement
(+ `product_rules_config`, `cost_price_zar`) → redirects + old-page deletion.

**Phase 2:** schema (categories, solutions) → category tree UI → Solution Builder → lifecycle
board → CPQ hook.

## 8. Research references

- TMF620 Product Catalog Management API v5.0.0 — tmforum.org/resources/specifications/tmf620-product-catalog-management-api-user-guide-v5-0-0/
- TMFC001 Product Catalog Management (ODA component) — tmforum.org/oda/directory/components-map/core-commerce-management/TMFC001
- TMFC002 Product Order Capture and Validation — tmforum.org/oda/directory/components-map/core-commerce-management/TMFC002
- TMF620 swagger — github.com/tmforum-apis/TMF620_ProductCatalog
