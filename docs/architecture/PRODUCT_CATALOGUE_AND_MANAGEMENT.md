# Product Catalogue & Product Management Module

**Project:** CircleTel — B2B/B2C ISP Platform (South Africa)
**Stack:** Next.js 15, TypeScript, Supabase (`agyjovdugmtopasyvlng`), Tailwind
**Document date:** 2026-06-08
**Scope:** How products are modelled, catalogued, priced, sourced, and managed end-to-end.

---

## 1. Overview

CircleTel's product system has **two halves**:

1. **The Product Catalogue** — the data: customer-facing service packages, hardware, add-ons, and the wholesale/supplier inputs that feed them.
2. **The Product Management Module** — the admin UI, APIs, services, and AI skills used to create, price, curate, approve, publish, and retire those products.

The catalogue is sourced from three input layers and surfaced through a publishing pipeline:

```
INPUTS                          INTERNAL CATALOGUE              OUTPUTS
──────                          ─────────────────              ───────
Wholesale providers      ┐
(MTN/Tarana, DFA,        │
 Echo SP, Arlan)         ├──▶  admin_products (specs)   ──▶  service_packages (public)
                         │     admin_product_pricing          /api/catalog/productOffering
Hardware suppliers       │     admin_product_features         (TMF-620 standard)
(Scoop, MiRO, Nology,    ├──▶  circletel_hardware_products
 Rectron)                │     mtn_dealer_products
                         │
Manual / AI-curated      ┘
```

---

## 2. Data Model (Database Schema)

All core tables are defined in `supabase/migrations/20260523000000_baseline_squash.sql` unless noted.

### 2.1 Customer-Facing Catalogue

| Table | Purpose | Key columns |
|-------|---------|-------------|
| **`service_packages`** | Public connectivity plans (the live catalogue) | `name`, `slug`, `sku`, `service_type`, `speed_down/up`, `price`, `product_category`, `customer_type`, `pricing` (jsonb), `features` (text[]), `compatible_providers` (text[]), `bundle_components` (jsonb), `status`, `metadata` (jsonb: contract_months, margin_percent, wholesale_provider) |
| **`product_addons`** | Customer-facing add-ons (Static IP, extra router) | `name`, `price`, `price_type` (monthly/once-off), `compatible_service_types[]`, `compatible_product_categories[]` |

> ⚠️ **`service_packages`** is the public source of truth. `admin_products` is the editorial/approval source that publishes *into* it.

### 2.2 Admin Catalogue (editorial + approval)

| Table | Purpose | Key columns |
|-------|---------|-------------|
| **`admin_products`** | Admin-curated specs (source of truth for publishing) | `name`, `slug`, `category` (enum), `service_type`, `speed_down/up`, `contract_terms` (int[]), `status` (draft/pending/approved/archived), `version`, `is_current`, audit (`created_by`, `approved_by`, `approved_at`) |
| **`admin_product_pricing`** | Versioned pricing with approval workflow | `price_regular`, `price_promo`, `installation_fee`, `hardware_contribution`, `router_rental`, `effective_from/to`, `approval_status` |
| **`admin_product_features`** | Feature matrix | `feature_name`, `feature_value`, `feature_category`, `is_highlighted`, `sort_order` |
| **`admin_product_hardware`** | Bundled hardware specs | `hardware_model`, `hardware_type`, `specifications` (jsonb), `retail_value`, `dealer_cost`, `is_included` |
| **`admin_product_addons`** | Admin add-on modules | `name`, `price`, `is_monthly`, `applicable_categories[]` |

### 2.3 Hardware Catalogue

Defined in `supabase/migrations/20260523000002_create_hardware_catalogue.sql`.

| Table | Purpose | Key columns |
|-------|---------|-------------|
| **`circletel_hardware_products`** | Curated hardware (promoted from supplier feeds) | `name`, `slug`, `retail_price`, `cost_price`, `markup_percentage` (GENERATED), `status` (draft/published/archived), `specifications`, `warranty_months`, `primary_supplier_code` |
| **`hardware_product_suppliers`** | Per-supplier cost tracking (many sources per product) | `hardware_product_id` FK, `supplier_product_id` FK, `supplier_cost`, `is_preferred`, `last_synced_cost` |
| **`hardware_product_terms`** | Versioned warranty / return / refund T&C | `warranty_period`, `return_policy`, `refund_policy`, `is_back_to_back`, `source_supplier_code`, `effective_from` |
| **`hardware_service_links`** | Pair hardware with service packages | `hardware_product_id` FK, `service_package_id` FK, `relationship_type` (bundled_with/recommended_for/required_for) |

### 2.4 Supplier (Hardware) Layer

| Table | Purpose | Key columns |
|-------|---------|-------------|
| **`suppliers`** | Supplier registry + sync config | `name`, `code` (SCOOP/MiRO/Nology/Rectron), `feed_url`, `feed_type` (xml/api/csv/manual), `feed_credentials`, `sync_status`, `last_synced_at` |
| **`supplier_products`** | Raw product feeds from suppliers | `sku`, `name`, `manufacturer`, `cost_price`, `retail_price`, branch stock (`stock_cpt/jhb/dbn/total`), `in_stock` (GENERATED), `specifications`, delta columns (`previous_cost_price`, `previous_stock_total`) |
| **`supplier_sync_logs`** | Sync audit trail | `status`, `products_found/created/updated/deactivated`, `images_cached`, `duration_ms`, `triggered_by` |

### 2.5 Wholesale (Connectivity) Layer

| Table | Purpose | Key columns |
|-------|---------|-------------|
| **`product_wholesale_costs`** | Wholesale cost matrix by provider | `product_name`, `service_package_id` FK, `wholesale_provider` (dfa/mtn/echo/arlan/tarana), `wholesale_mrc`, `wholesale_nrc`, `retail_price`, `gross_margin_pct` (GENERATED) |
| **`mtn_dealer_products`** | MTN/Arlan business deals curated for resale | `deal_id`, `technology` (LTE/5G), `contract_term`, device fields, `mtn_price_incl/excl_vat`, `markup_type/value`, `selling_price_*` (GENERATED), `commission_tier` + `mtn_commission_rate` (GENERATED), `circletel_commission_share` (30% default), `curation_status`, `business_use_case` |

### 2.6 Configure-Price-Quote (CPQ)

| Table | Purpose | Key columns |
|-------|---------|-------------|
| **`cpq_product_eligibility`** | Quote-time eligibility rules | `product_id` FK, `coverage_types[]`, `customer_types[]`, `allowed/excluded_regions[]`, `min/max_quantity` |

### 2.7 Key Relationships

```
admin_products ──publish──▶ service_packages          (spec → public)
supplier_products ──promote──▶ circletel_hardware_products ──link──▶ service_packages
product_wholesale_costs ──feeds──▶ service_packages.provider_specific_config
mtn_dealer_products ──manual curation──▶ public MTN deals
```

---

## 3. TypeScript Types

Located in `lib/types/` and `lib/hardware-catalogue/` / `lib/suppliers/`.

| File | Main types |
|------|-----------|
| `lib/types/products.ts` | `Product`, `ProductCategory`, `ServiceType`, `ProductStatus`, `ProductPricing`, `ProductFilters`, helpers `calculateFinalPrice()`, `formatPrice()`, `formatSpeed()` |
| `lib/types/admin-products.ts` | `AdminProduct`, `AdminProductPricing`, `AdminProductFeature`, `AdminProductHardware`, `AdminProductContext` |
| `lib/types/product-approval.ts` | `ProductApproval`, `ApprovalStatus` |
| `lib/types/product-portfolio.ts` | `ProductUnitEconomics`, `MarginHealthData`, `PortfolioMetrics`, `ProductLifecycleStatus`, `MARGIN_THRESHOLDS` |
| `lib/types/product-relationships.ts` | `ProductRelationship` (TMF-620), `ProductWithRelationships` |
| `lib/types/mtn-dealer-products.ts` | `MTNDealerProduct`, `CommissionTier`, `MARKUP_RULES`, `MTN_COMMISSION_TIERS` |
| `lib/hardware-catalogue/types.ts` | `CircleTelHardwareProduct`, `HardwareProductSupplier`, `HardwareServiceLink`, `PromoteFromSupplierInput`, `PricingSuggestion` |
| `lib/suppliers/types.ts` | `Supplier`, `SupplierProduct`, `SupplierSyncLog`, `SyncResult`, `EnrichmentStatus` |

---

## 4. Admin Product Management UI

Root: `app/admin/products/`

| Page | Route | Purpose |
|------|-------|---------|
| Products Dashboard | `/admin/products` | Portfolio overview, list, filters, bulk actions |
| New Product | `/admin/products/new` | Create product (draft) |
| Product Detail | `/admin/products/[id]` | Lifecycle stepper, cost breakdown, audit history |
| Edit Product | `/admin/products/[id]/edit` | Modify details, pricing, status |
| Preview | `/admin/products/preview` | Customer-facing preview |
| Drafts / Archived | `/admin/products/drafts`, `/archived` | Status-filtered views |
| Approvals | `/admin/products/approvals` | Pending approval queue |
| Relationships | `/admin/products/relationships` | Bundles, add-ons, cross-refs |
| MTN Deals | `/admin/products/mtn-deals` | Curate MTN wholesale deals |
| Hardware Catalog | `/admin/products/hardware`, `/[id]`, `/[id]/terms`, `/promote` | Browse, edit terms, promote supplier hardware |

### Components — `components/admin/products/`

- **Dashboard/list:** `ProductsDashboard.tsx` (tabs: Products / Portfolio / MTN Deals), `ProductsList.tsx`, `ProductsFilters.tsx`, `ProductsViewToggle.tsx`, `ProductsStatCards.tsx`
- **Detail/cards:** `AdminProductCard.tsx`, `ProductStatsWidget.tsx`, `ProductCostBreakdown.tsx`
- **Lifecycle/approval:** `ProductLifecycleStepper.tsx`, `ProductLifecycleActions.tsx`, `AuditHistoryModal.tsx`
- **Editing:** `QuickEditModal.tsx`, `PriceEditModal.tsx`, `FeaturesEditor.tsx`
- **Bulk/filters:** `BulkActionsToolbar.tsx`, `ColumnCustomization.tsx`, `ActiveFiltersChips.tsx`, `FilterPresets.tsx`
- **Portfolio (`portfolio/`):** `ProductPortfolioDashboard.tsx`, `ProductStatusMatrix.tsx`, `MarginHealthSection.tsx`, `UnitEconomicsSection.tsx`, `PortfolioOverviewSection.tsx`

Consumer-facing product components live in `components/products/` (`ProductCard`, `ProductGrid`, `ProductHero`, `PricingBar`, `SpecificationTable`, `ProductComparison`, `PackageCard`).

---

## 5. API Routes

### Admin products — `app/api/admin/products/`
| Endpoint | Methods | Purpose |
|----------|---------|---------|
| `/api/admin/products` | GET, POST | List (filters: `category`, `status`, `service_type`, `search`, `sort_by`, `contract_term`, `technology`…) / create |
| `/api/admin/products/[id]` | GET, PATCH, DELETE | Read / update / archive |
| `/api/admin/products/[id]/publish` | POST | Publish draft → `service_packages` |
| `/api/admin/products/[id]/cost-components[/...]` | GET/POST/PATCH/DELETE | Cost breakdown management (+ `/bulk`) |
| `/api/admin/products/[id]/relationships` | GET, POST | Bundles / add-ons |
| `/api/admin/products/[id]/audit-logs` | GET | Change history |
| `/api/admin/products/integration-status` | GET | External sync status (Zoho, MTN) |

### Suppliers — `app/api/admin/suppliers/`
- `/products` (GET, POST), `/products/[id]` (GET, PATCH, DELETE) — filters: `supplier_id`, `manufacturer`, `category`, `in_stock`, price range
- `/[id]/sync` (POST), `/[id]/enrich` (POST), `/sync` (POST all)

### Approvals — `/api/admin/product-approvals[/[id]/approve|reject]`

### Hardware — `app/api/hardware/`
- `/products`, `/products/[id]`, `/products/[id]/terms[/history]`, `/supplier-products`

### Catalogue (TMF-620 standard) — `app/api/catalog/`
- `/productOffering`, `/productOffering/[id]`, `/productOffering/[id]/price`

### MTN dealer products — `app/api/admin/mtn-dealer-products/`
- `/`, `/[id]`, `/import`, `/auto-curate`, `/apply-markup`, `/commission`, `/stats`

### Public — `app/api/products/`
- `/products`, `/products/[slug]`, `/products/addons`, `/products/mtn-deals[/recommend|/[id]]`, `/coverage/products` (coverage-filtered)

---

## 6. Services / Libraries

### Product logic — `lib/products/`
| File | Purpose |
|------|---------|
| `bundles.ts` | Bundle pricing & composition validation |
| `auto-curation-service.ts` | Auto-curate MTN deals against portfolio fit |
| `markup-rules-service.ts` | Apply category-based markups |
| `deal-recommender.ts` | Recommend products to customers |
| `feature-formatter.ts` | Format feature lists for display |

### Suppliers — `lib/suppliers/`
| File | Purpose |
|------|---------|
| `sync-orchestrator.ts` | Coordinates all supplier syncs (cron) |
| `product-scraper.ts` | Scrape product specs |
| `ai-enrichment.ts` | Gemini AI enrichment (features, specs) |
| `image-cache.ts` | Cache supplier product images |
| `scoop-sync.ts`, `miro/`, `nology/`, `rectron/` | Per-supplier feed parsers + sync |

### Hardware — `lib/hardware-catalogue/`
`pricing.ts` (margin/effective cost), `queries.ts`, `terms.ts`, `types.ts`

### Catalogue publishing — `lib/catalog/`
`publish.ts` (admin → public, TMF-620), `tmf620-mapper.ts`

---

## 7. Product Management AI Skill System

Root: `.claude/skills/product-management/` — `SKILL.md` (v1.1.0) is the master router.

| Skill | Command | Purpose |
|-------|---------|---------|
| Search Suppliers | `/product-search` | Live Firecrawl search of supplier sites (specs, datasheets) |
| Browse Suppliers | `/product-browse` | Filter DB-synced supplier catalogues |
| Wholesale Providers | `/product-wholesale` | View wholesale provider services/contracts |
| Market-Fit Analysis | `/product-analyze` | Competitor comparison, margin calc, GO/NO-GO |
| Generate Docs | `/product-docs` | Generate CPS / BRD / FSD |
| Product Lifecycle | `/product-lifecycle` | Track IDEA → DRAFT → ACTIVE → INACTIVE → ARCHIVED |

- **Templates** (`templates/`): `commercial-spec.md` (CPS), `business-rules.md` (BRD), `functional-spec.md` (FSD), `pricing-matrix.md`, `seed-product.ts.template`
- **References** (`references/`): `mtn-wholesale.md`, `echo-sp.md`, `dfa.md`, `arlan.md`, `competitor-benchmarks.md`, `wholesale-providers.md`

### Governing rules — `.claude/rules/`
- `product-management.md` — skill triggers, wholesale/supplier quick refs, bundle design flow
- `product-economics.md` — unit economics, wholesale costs, commission tiers, LTV/CAC
- `margin-guardrails.md` — minimum margins, discount approval, MSC-aware pricing

---

## 8. Product Lifecycle

```
IDEA → DRAFT → ACTIVE → INACTIVE → ARCHIVED
```

| Transition | Gate |
|------------|------|
| IDEA → DRAFT | Market-fit analysis complete, GO decision documented |
| DRAFT → ACTIVE | Docs (CPS/BRD/FSD) complete, pricing verified/approved, support briefed |
| ACTIVE → INACTIVE | Temporary pause (stock, pricing review, seasonal) |
| INACTIVE → ACTIVE | Issue resolved, verified, stakeholders notified |
| ACTIVE/INACTIVE → ARCHIVED | Sunset decision, migration plan executed |

Status lives on `admin_products.status` (draft/pending/approved/archived) for the editorial record and `service_packages.status` (active/inactive/archived/draft) for the live catalogue. Versioning via `admin_products.version` + `is_current`.

---

## 9. Sourcing: Suppliers vs Wholesale Providers

Two distinct input models:

### Hardware suppliers (DB-synced → `supplier_products`)
| Supplier | Code | Feed |
|----------|------|------|
| Scoop Distribution | `SCOOP` | XML pricelist (`scoop-sync.ts`) |
| MiRO | `MiRO` | `lib/suppliers/miro/` |
| Nology | `Nology` | `lib/suppliers/nology/` |
| Rectron | `Rectron` | migration `20260523000001_add_rectron_supplier.sql` |

Sync loop: `suppliers` registry → orchestrator (manual/scheduled) → `supplier_sync_logs` → upsert `supplier_products` → optional promote to `circletel_hardware_products` → optional Gemini enrichment + image cache.

### Wholesale connectivity providers (config via `compatible_providers` + `product_wholesale_costs`)
| Provider | Code | Products | Model |
|----------|------|----------|-------|
| MTN / Tarana (FWB) | `mtn`/`tarana` | Fixed-wireless broadband | Subscription, 37–46% margin, MSC commitment |
| DFA (Dark Fibre) | `dfa` | BizFibreConnect (25/50/100/200 Mbps) | Subscription, 53–56% margin |
| Echo SP | `echo` | Managed BNG / IP transit | Infrastructure cost layer |
| Arlan (MTN reseller) | `arlan` | Mobility, fleet, IoT, voice | Commission + markup, R0 wholesale |

Commercial docs per provider: `products/wholesale/{dfa,mtn,echo-sp,arlan}/`.

---

## 10. Pricing & Margin Guardrails

From `.claude/rules/margin-guardrails.md` and `product-economics.md`.

### Minimum margins (non-negotiable)
```
Gross Margin % = (Revenue − Cost of Sale) / Revenue × 100
```
| Margin | Approval |
|--------|----------|
| ≥ 35% | Auto-approved |
| 25–35% | Sales Director |
| < 25% | CFO (rarely granted) |
| < 20% | Never permitted |
| Bundles | Combined margin must exceed **30%** |

### All-in Cost of Sale (per subscriber)
`Wholesale + Static IP (R50) + BNG (R30) + Backhaul (R28) + BSS (R11) + Support (R10) + Install amortization (R213/12mo)`

### Arlan markup floor by category (`MARKUP_RULES`)
IoT/M2M 20% · Fleet 18% · Data 15% · Backup 15% · Mobile Workforce 15% · Voice 10% · Device Upgrade 8% · Venue WiFi 20%

### MTN commission tiers (`MTN_COMMISSION_TIERS`)
Tiered 4.75% → 13.75% by MTN price band; CircleTel takes a 30% share of Arlan commission.

### Discount approval matrix
0–5% rep · 5–10% Sales Director · 10–15% MD · 15–20% MD+CFO · >20% never.

### MSC-aware pricing
```
MSC Coverage Ratio = (Tarana Customers × R499) / MSC Commitment
< 0.8x CRITICAL · 0.8–1.0x WARNING · 1.0–1.5x COVERED · > 1.5x SAFE
```

---

## 11. Quick File Reference

| Need | Path |
|------|------|
| Core schema | `supabase/migrations/20260523000000_baseline_squash.sql` |
| Hardware schema | `supabase/migrations/20260523000002_create_hardware_catalogue.sql` |
| DFA products | `supabase/migrations/20260524000001_add_dfa_bizfibreconnect_products.sql` |
| Admin UI | `app/admin/products/` |
| Admin components | `components/admin/products/` |
| Admin API | `app/api/admin/products/route.ts` |
| Publish pipeline | `lib/catalog/publish.ts`, `lib/catalog/tmf620-mapper.ts` |
| Supplier sync | `lib/suppliers/sync-orchestrator.ts` |
| Product types | `lib/types/products.ts`, `lib/types/admin-products.ts` |
| Skill router | `.claude/skills/product-management/SKILL.md` |
| Margin rules | `.claude/rules/margin-guardrails.md` |
| Economics rules | `.claude/rules/product-economics.md` |
| Portfolio reference | `files/skills/circletel-product-manager/references/product_catalogue.json` |
| Wholesale docs | `products/wholesale/{dfa,mtn,echo-sp,arlan}/` |
