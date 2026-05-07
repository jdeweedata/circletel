## Context

Circle Tel's `service_packages` table is the product catalogue backing the storefront, admin UI, and billing flows. It has 40 columns including JSONB fields for `pricing`, `metadata`, `provider_specific_config`, and `bundle_components`. Existing business products (MTN 5G, BizFibre) each map to a single network technology via `service_type` (e.g., `5g`, `fibre`).

Unjani is different: the R450 excl. VAT fee is fixed regardless of whether the site runs on Tarana FWB, MTN LTE 20Mbps, or MTN 5G 60Mbps. The underlying cost varies (Tarana ~R0 marginal on owned infra, LTE R434 excl., 5G R503 excl.) but the customer price is always R450.

The table schema already supports everything needed — no DDL migration required.

## Goals / Non-Goals

**Goals:**
- Single product SKU (`UNJ-MC-001`) assignable to any Unjani clinic site regardless of technology
- Correct `pricing` and `metadata` JSONB for admin visibility, billing, and margin reporting
- B2B-only visibility — must not appear on public storefront
- Align commercial terms (24-month, CPI-capped escalation) with signed MSA

**Non-Goals:**
- Automated technology-selection logic (site technology is determined during provisioning, not at product level)
- Public storefront display or self-service ordering for this product
- Modifying existing products or creating per-technology Unjani variants
- Building Unjani-specific billing workflows (existing billing handles this)

## Decisions

### 1. `service_type = 'managed'` (not `lte` / `5g` / `fwb`)

**Rationale**: The product is technology-agnostic. Using `managed` avoids tying the product to one delivery method. The actual technology per site is tracked at the provisioning/customer level, not the product level.

**Alternative considered**: Three separate products (one per technology) — rejected because the MSA has a single flat rate and splitting would complicate billing and reporting.

### 2. `market_segment = 'b2b-managed'`

**Rationale**: Distinguishes Unjani (and future managed-service clients) from standard `business` products. Public storefront queries filter on `market_segment` — using a segment not shown publicly ensures this product is admin-only without needing a separate `visibility` column.

### 3. Cost price as blended average

**Rationale**: `cost_price_zar` stores a single value. With 22 sites across mixed technologies, we use the weighted-average cost. Per-technology cost detail goes into `metadata.cost_breakdown` for margin analysis. Current blended cost: ~R450 excl. VAT (varies by technology mix).

### 4. SKU convention: `UNJ-MC-001`

**Rationale**: Follows existing pattern (prefix-category-sequence): `UNJ` = Unjani, `MC` = Managed Connectivity, `001` = first product. Consistent with `MTN-5G-001`, `BIZ-FBR-001`.

### 5. `valid_from = '2026-05-15'` (no `valid_to`)

**Rationale**: Billing commences 15 May 2026 per MSA. No end date — the 24-month term is tracked per-customer contract, not at product level.

## Risks / Trade-offs

- **Blended cost_price becomes stale as technology mix shifts** → Mitigation: Store per-technology costs in `metadata.cost_breakdown`; update `cost_price_zar` quarterly or when significant mix change occurs.
- **`service_type = 'managed'` is a new value** → Mitigation: No code enforces an enum on this column (it's `varchar`). Verify no frontend filter breaks on an unknown type — existing admin filters use `product_category` and `customer_type`, not `service_type`.
- **Product visible in admin but not storefront** → Mitigation: Confirm public package queries filter on `market_segment IN ('residential', 'soho')` or similar — adding `b2b-managed` won't match.

## Migration Plan

1. INSERT single row via Supabase SQL migration
2. Verify row appears in admin product list
3. Verify row does NOT appear on public storefront `/packages` page
4. Assign to one test Unjani site invoice to confirm billing flow
5. **Rollback**: DELETE the single row by SKU (`UNJ-MC-001`)
