# Product Catalogue & Zoho Integration – Implementation Plan

**Context**

CircleTel uses a Next.js 15 + Supabase architecture with a gradually unified product model:

- `admin_products` (+ related tables) – internal, versioned admin catalogue with approval workflow.
- `service_packages` – main customer-facing operating table for offers.
- `products` – legacy catalogue being phased out.
- `business_quotes` – B2B quote model.

The goal is to:

- Make CircleTel the **canonical product catalogue**, aligned with TM Forum TMFC001 (Core Commerce / Product Catalogue).
- Use a **publish pipeline** from `admin_products` → `service_packages` (ProductSpecification → ProductOffering).
- Integrate this catalogue with **Zoho CRM** and **Zoho Billing**, with CircleTel as the master, and Zoho as downstream systems.

All product creation and editing happens in the CircleTel admin UI; data then syncs to Zoho via API/MCP.

---

## Epic 1 – TMF‑Aligned Catalogue & Publish Pipeline

**Goal:** Establish CircleTel as the canonical product catalogue with a clean `admin_products → service_packages` publish flow, aligned with TMFC001 (spec → offering).

### Key Outcomes

- `admin_products` is the **only** place where product managers define products.
- `service_packages` is the **only** table used by web UX, coverage flows, and quotes.
- The publish pipeline is deterministic, validated, and audited.

### Key Stories

#### Story 1.1 – Data model & mapping definition

*As a solution architect, I want a documented field mapping from `admin_products` (+ related tables) to `service_packages`, so that the publish pipeline is consistent and TMF-aligned.*

- Define mapping for:
  - Identity & classification.
  - Pricing and cost fields.
  - Technical attributes (speeds, contract term, metadata).
  - Bundles and add-ons.
  - Lifecycle & eligibility fields.
- Deliverable: `PRODUCT_CATALOG_MAPPING.md` under `docs/`.

#### Story 1.2 – Add linkage & lifecycle fields

*As a developer, I want `service_packages` to reference its source admin product and support lifecycle dates, so that we can track origins and scheduled launches/retirements.*

- Add/confirm fields on `service_packages`:
  - `source_admin_product_id` (UUID/ FK reference).
  - `valid_from`, `valid_to` (if not present).
- Clarify and document lifecycle semantics:
  - Use `status` as the main lifecycle field (`draft`, `active`, `archived`, etc.).
  - Treat `active` boolean as derived from `status` where possible.

#### Story 1.3 – Implement publish service (admin → service_packages)

*As a product manager, I want a “Publish” action that creates/updates the corresponding `service_packages` row, so that my approved product becomes live in the catalogue.*

- Implement a backend service or Supabase function that:
  - Validates `admin_products.status = 'approved'`.
  - Reads related `admin_product_pricing`, `admin_product_features`, `admin_product_hardware`, `admin_product_addons`.
  - Builds a `service_packages` payload with:
    - Identity & classification.
    - Pricing (`base_price_zar`, `promotion_price`, `cost_price_zar`, `pricing` JSON).
    - Technical characteristics (speeds, metadata, bundle info).
    - Lifecycle (`status`, `valid_from`, `valid_to`, `is_featured`, `is_popular`, `sort_order`).
  - Upserts into `service_packages` by business key (e.g. SKU + contract term + market segment).

#### Story 1.4 – Handle previous versions

*As a product manager, I want older versions of an offer to be archived not destroyed, so that existing contracts remain traceable.*

- On publish, for offerings with the same logical key:
  - Mark previous `service_packages` rows as `archived` or `inactive`.
  - Keep them for audit and for contracts/quotes that reference historical prices.
- Decide whether to:
  - Keep a stable `id` and overwrite fields, or
  - Create new rows for major price changes and link via a `logical_key`.

#### Story 1.5 – Admin UI: publish + status visibility

*As a product manager, I want to see the publish status of each product and trigger publish from the admin UI, so that I don’t need developer involvement.*

- Extend admin catalogue UI to show for each `admin_product`:
  - Approval status (`draft`, `pending`, `approved`).
  - Publish status (`never_published`, `published`, `publish_failed`).
  - Linked `service_packages` record(s).
- Add a **Publish** button that calls the publish service.

#### Story 1.6 – Refactor consumer flows to rely only on `service_packages`

*As an engineer, I want all customer-facing pages and quote flows to read from `service_packages` only, so that the system has a single runtime catalogue.*

- Audit the codebase for remaining usage of `products` or other tables for product data.
- Refactor to use `service_packages` types and queries consistently.
- Mark `products` as legacy and keep read-only until safe to archive.

---

## Epic 2 – Zoho CRM Catalogue Sync (ProductOffering → CRM Product)

**Goal:** Ensure every active `service_packages` offering has a corresponding Zoho CRM Product, with CircleTel as the master.

### Key Outcomes

- One Zoho CRM Product per active `service_packages` offering.
- A stable identifier (e.g. SKU) connects CircleTel and Zoho CRM.
- All catalogue edits originate in CircleTel; Zoho CRM is read-only for product data.

### Key Stories

#### Story 2.1 – Zoho CRM product mapping

*As an architect, I want a documented mapping from `service_packages` to Zoho CRM Product fields, so that the sync is predictable and auditable.*

- Define mapping:
  - Name, SKU, description.
  - Unit price (monthly), installation fee.
  - Tax class, category, segment.
  - Custom fields for service type, speeds, contract term, CircleTel product ID.
- Capture in a small spec document under `docs/integrations/`.

#### Story 2.2 – Integration contract + credentials

*As an engineer, I want a clearly defined integration contract and credential model for Zoho CRM, so that sync is secure and maintainable.*

- Decide whether to use the Zoho MCP server or a direct REST client.
- Define how OAuth tokens/API keys are stored and refreshed.
- Document rate limits and expected retry/backoff behaviour.

#### Story 2.3 – Outbound sync on publish (admin → service_packages → Zoho CRM)

*As a product manager, I want publishing a product to automatically create or update the matching Zoho CRM Product, so that the CRM catalogue is always up to date.*

- Extend the publish pipeline:
  - After successful `service_packages` upsert, call Zoho CRM:
    - Create Product if no mapping exists.
    - Update Product if mapping exists.
  - Store `zoho_crm_product_id` in a mapping table (e.g. `product_integrations`).

#### Story 2.4 – Initial backfill of existing offerings to Zoho CRM

*As an ops engineer, I want existing active `service_packages` backfilled into Zoho CRM, so that there’s no mismatch between the systems.*

- One-off script/job:
  - For each `service_packages.status = 'active'`, create or link Zoho CRM Products.
  - Populate mapping table with IDs.

#### Story 2.5 – Sync failure handling + retries

*As an operator, I want failures in Zoho CRM sync to be logged and retried, so that temporary issues don’t corrupt the catalogue.*

- Implement:
  - Structured error logging with context (product ID, payload, error).
  - A simple retry mechanism / dead-letter queue.
  - Exposed "sync failed / pending" status in the admin UI.

#### Story 2.6 – Guard against direct edits in Zoho CRM

*As a product owner, I want to minimise direct edits to product data in Zoho CRM, so that CircleTel remains the master.*

- Configure Zoho CRM fields as read-only where possible.
- Document the rule that all catalogue changes are made in CircleTel admin, never directly in Zoho.

---

## Epic 3 – Zoho Billing Catalogue & Pricing Sync

**Goal:** Keep Zoho Billing Items/Plans aligned with `service_packages` offerings and pricing, for accurate invoicing and subscriptions.

### Key Outcomes

- One Zoho Billing Item/Plan per CircleTel offering (or a well-documented mapping strategy).
- Monthly and setup charges correctly represented for billing.
- All price changes originate in CircleTel.

### Key Stories

#### Story 3.1 – Zoho Billing mapping design

*As an architect, I want a mapping from `service_packages` to Zoho Billing entities, so that subscription and invoice items are correctly created.*

- Decide how to model:
  - Recurring monthly fee (Plans/Subscriptions).
  - One-time installation fee (Items/Charges).
- Define field mapping:
  - SKU, display name, tax, billing cycle, contract term.

#### Story 3.2 – Integration client for Zoho Billing

*As an engineer, I want a robust client for Zoho Billing APIs, so that product sync is reliable and secure.*

- Implement:
  - Auth handling (ideally shared with Zoho CRM integration).
  - Typed client with request/response validation.
  - Base error handling and logging.

#### Story 3.3 – Outbound sync on publish to Zoho Billing

*As a product manager, I want publishing a product to create or update the associated Zoho Billing item/plan, so that billing is always aligned to the catalogue.*

- Extend publish pipeline:
  - After Zoho CRM sync, call Zoho Billing:
    - Create Item/Plan if not present.
    - Update Item/Plan if mapping exists.
  - Store `zoho_billing_item_id` / `zoho_billing_plan_id` in the mapping table.

#### Story 3.4 – Initial backfill from existing offerings

*As an ops engineer, I want all active offerings pushed into Zoho Billing, so that new subscriptions can be created consistently.*

- Script backfill:
  - For each active `service_packages` row, ensure a corresponding Billing item/plan exists.
  - Populate mapping table; avoid duplicates.

#### Story 3.5 – Invoice/Subscription smoke tests

*As a tester, I want end-to-end tests that create a subscription using the synced Zoho Billing item/plan, so that we know billing will work in production.*

- In staging:
  - Create a test customer.
  - Create a subscription from a synced plan.
  - Verify line items, tax, and amounts.

#### Story 3.6 – Price change handling

*As a product owner, I want clear behaviour when prices change in CircleTel, so that Zoho Billing stays consistent and customers are billed correctly.*

- Decide and implement:
  - Whether to update existing plans or create new plan versions on price change.
  - How this interacts with existing subscriptions (grandfathered vs updated pricing).

---

## Epic 4 – Admin UX, Monitoring & Reconciliation

**Goal:** Give product managers and ops a single, clear view of product status across CircleTel, Zoho CRM and Zoho Billing, with tools to diagnose and fix issues.

### Key Outcomes

- One admin UI to see the full lifecycle and sync state for each product.
- Monitoring & logs for all sync actions.
- Repeatable reconciliation process between CircleTel and Zoho.

### Key Stories

#### Story 4.1 – Product sync status dashboard

*As a product manager, I want to see the Zoho sync status for each product, so that I can trust what’s live in CRM and Billing.*

- For each `admin_product` / `service_package`, display:
  - Local lifecycle status.
  - Zoho CRM sync status + linked `product_id`.
  - Zoho Billing sync status + linked `item_id` / `plan_id`.
  - Last sync time and last error (if any).

#### Story 4.2 – Manual re-sync actions

*As an operator, I want to trigger a re-sync to Zoho CRM/Billing from the admin UI, so that I can fix issues without database access.*

- Add admin actions:
  - "Re-sync CRM".
  - "Re-sync Billing".
- Wire these to the publish/sync pipeline with a "force" option.

#### Story 4.3 – Logging & alerting

*As an ops engineer, I want structured logs and basic alerts for sync failures, so that we catch problems early.*

- Implement:
  - Structured logs for each publish and sync attempt.
  - Basic alerting (email/Slack/etc.) for repeated failures or rate limit issues.

#### Story 4.4 – Reconciliation job

*As an ops engineer, I want a periodic reconciliation job that checks CircleTel vs Zoho CRM/Billing, so that we can detect drift.*

- Scheduled job (nightly/weekly) that:
  - Compares active `service_packages` with Zoho CRM Products and Zoho Billing Items/Plans.
  - Produces a reconciliation report for mismatches and missing records.

#### Story 4.5 – RBAC & audit trail

*As a compliance owner, I want only authorised admins to publish or re-sync products, and I want an audit trail, so that we remain compliant and secure.*

- Integrate with existing RBAC:
  - Define permissions such as `catalogue:publish` and `catalogue:sync`.
- Ensure audit logging captures:
  - Who published.
  - Who re-synced.
  - When and what changed.

---

## Suggested Implementation Order

1. **Epic 1 – Core catalogue & publish pipeline**
   - Establish a TMF-aligned catalogue and a robust publish pipeline.

2. **Epic 2 – Zoho CRM sync**
   - Ensure CRM Products mirror the CircleTel catalogue.

3. **Epic 3 – Zoho Billing sync**
   - Align billing items/plans and validate subscription flows.

4. **Epic 4 – UX, monitoring, reconciliation**
   - Make the whole system operable, observable, and safe for production.

This document should be used by product, architecture, and engineering teams to drive backlog creation, sprint planning, and implementation reviews for the product catalogue and Zoho integration work.
