# Product Catalogue – Zoho Field Mapping Matrix

This document defines the **field mapping** between CircleTel’s internal product catalogue and Zoho systems:

- CircleTel **admin catalogue**: `admin_products` (+ related tables)
- CircleTel **runtime catalogue**: `service_packages`
- **Zoho CRM**: Product module
- **Zoho Billing**: Items / Plans (exact entities may be refined during implementation)

CircleTel is the **master** for catalogue data. Zoho CRM and Zoho Billing are downstream.

> **Important**: All CircleTel-synced fields should be configured as **read-only** in Zoho CRM to prevent data drift. See [ZOHO_CRM_FIELD_SECURITY_GUIDE.md](./ZOHO_CRM_FIELD_SECURITY_GUIDE.md) for field-level security configuration.

> Note: Exact Zoho API field names may differ slightly by region/edition; adjust names to match your configured CRM/Billing instances.

---

## 1. Identity & Classification

| Domain Concept       | CircleTel (admin / runtime)                                        | Zoho CRM Product                           | Zoho Billing (Item / Plan)                                     | Notes |
|----------------------|---------------------------------------------------------------------|--------------------------------------------|----------------------------------------------------------------|-------|
| Internal Product ID  | `admin_products.id`                                                 | Custom field: `ct_product_id`              | Custom field: `ct_product_id`                                  | Primary link back to admin catalogue. |
| Offering ID          | `service_packages.id`                                               | Custom field: `ct_service_package_id`      | Custom field: `ct_service_package_id`                          | Used by runtime catalogue & quotes. |
| SKU                  | `admin_products.sku` → `service_packages.sku`                       | `Product_Code` / `SKU`                     | `item_code` / `plan_code`                                      | Use as cross-system business key where possible. |
| Name                 | `admin_products.name` → `service_packages.name`                     | `Product_Name`                             | `name` (Item), `name` (Plan)                                   | Customer-facing product/plan name. |
| Slug                 | `admin_products.slug` → `service_packages.slug`                     | Custom field: `ct_slug`                    | Custom field: `ct_slug`                                        | Optional; used for URLs and analytics. |
| Service Type         | `admin_products.service_type` → `service_packages.service_type`     | Custom field: `ct_service_type`            | Custom field: `ct_service_type`                                | Values: SkyFibre, HomeFibreConnect, BizFibreConnect, etc. |
| Product Category     | `admin_products.product_category` → `service_packages.product_category` | `Product_Category` / picklist             | `category` / custom picklist                                  | Align CRM & Billing picklist values with CircleTel enums. |
| Market Segment       | (admin field) → `service_packages.market_segment` (B2B/B2C/Partner) | Custom field: `ct_market_segment`          | Custom field: `ct_market_segment`                              | Used for segmentation & reporting. |
| Provider             | (admin field) → `service_packages.provider`                         | Custom field: `ct_provider`                | Custom field: `ct_provider`                                    | Values: MTN, DFA, Supersonic, CircleTel-wireless, etc. |

---

## 2. Pricing & Cost

### 2.1 Recurring Monthly Charges

| Domain Concept         | CircleTel (runtime)                                         | Zoho CRM Product                         | Zoho Billing (Item / Plan)                                                | Notes |
|------------------------|-------------------------------------------------------------|------------------------------------------|----------------------------------------------------------------------------|-------|
| Monthly List Price     | `service_packages.base_price_zar` or `service_packages.price` | `Unit_Price`                             | `price` (Item), `recurring_price` / `plan_price` (Plan)                   | Primary monthly charge amount. |
| Monthly Promo Price    | `service_packages.promotion_price`                          | Custom field: `ct_promo_monthly_price`   | Custom field: `ct_promo_monthly_price` or separate promo plan/price       | Decide: store as separate field vs separate promo plan. |
| Currency               | `pricing.currency` (inside JSON, optional)                  | `Currency`                               | `currency_code`                                                            | Fix to ZAR for now; keep flexible. |
| VAT Inclusive Flag     | `pricing.vat_inclusive` or `metadata.vat_inclusive`          | Custom field: `ct_vat_inclusive`         | `tax_inclusive`                                                            | Clarify POPIA/finance requirements. |
| Contract Term (months) | `metadata.contract_months`                                  | Custom field: `ct_contract_term_months`  | Custom field: `ct_contract_term_months`                                   | Used for plan duration and quoting rules. |

### 2.2 One-Time / Installation Charges

| Domain Concept          | CircleTel (runtime)                               | Zoho CRM Product                         | Zoho Billing (Item / Plan)                                                | Notes |
|-------------------------|---------------------------------------------------|------------------------------------------|----------------------------------------------------------------------------|-------|
| Setup / Install Fee     | `pricing.setup` (JSON) or `service_packages.cost_price_zar` | Custom field: `ct_installation_fee`      | Separate one-time Item with `price` or addon charge                       | Model as distinct Item/charge in Billing. |
| Discounted Setup Fee    | (if present in metadata/pricing)                 | Custom field: `ct_discounted_setup_fee`  | Custom field or separate promotional Item                                  | Optional; depends on pricing strategy. |
| Bundle Savings Amount   | `service_packages.bundle_savings`                | Custom field: `ct_bundle_savings`        | Custom field: `ct_bundle_savings`                                         | Used for marketing; Billing may not need explicit field. |

### 2.3 Internal Cost / Margin

| Domain Concept   | CircleTel (runtime)                    | Zoho CRM Product                    | Zoho Billing                     | Notes |
|------------------|----------------------------------------|-------------------------------------|----------------------------------|-------|
| Internal Cost    | `service_packages.cost_price_zar`      | Custom field: `ct_internal_cost`    | Custom field: `ct_internal_cost` | For margin reporting; access restricted. |
| Margin % (calc)  | (derived in reporting)                 | Custom field: `ct_margin_percent`   | N/A or custom field              | Calculated in CircleTel or CRM; not required for Billing. |

---

## 3. Technical Characteristics & Features

| Domain Concept         | CircleTel (admin / runtime)                                        | Zoho CRM Product                          | Zoho Billing (Item / Plan)               | Notes |
|------------------------|---------------------------------------------------------------------|-------------------------------------------|-----------------------------------------|-------|
| Download Speed (Mbps)  | `service_packages.download_speed` / `pricing.download_speed`        | Custom field: `ct_download_speed_mbps`    | Custom field: `ct_download_speed_mbps`  | Numeric, used for coverage and quoting. |
| Upload Speed (Mbps)    | `service_packages.upload_speed` / `pricing.upload_speed`            | Custom field: `ct_upload_speed_mbps`      | Custom field: `ct_upload_speed_mbps`    | Numeric, used for coverage and quoting. |
| Technology             | (`service_type` / metadata e.g. fibre, wireless, LTE, 5G)          | Custom field: `ct_technology`             | Custom field: `ct_technology`           | Normalised values (fibre, fixed-LTE, wireless, etc.). |
| Contract Term          | `metadata.contract_months`                                          | Custom field: `ct_contract_term_months`   | Custom field or plan term field         | Should match subscription commitments. |
| Installation SLA       | `metadata.installation_days`                                       | Custom field: `ct_installation_sla_days`  | Custom field: `ct_installation_sla_days` | Optional; useful for B2B sales and ops. |
| Availability Zones     | `metadata.availability_zones`                                      | Custom field: `ct_availability_zones`     | Custom field: `ct_availability_zones`   | Store as string list / picklist. |
| Features               | `service_packages.features` (string array)                         | Custom field: `ct_features` (text/JSON)   | Custom field: `ct_features`             | CRM/Billing may store a concatenated or JSON representation. |
| Hardware Included      | `metadata.hardware.included` / admin_product_hardware              | Custom field: `ct_hardware_included`      | Custom field: `ct_hardware_included`    | Boolean for router/CPE included or not. |
| Hardware Model         | `metadata.hardware.model` / admin_product_hardware                 | Custom field: `ct_hardware_model`         | Custom field: `ct_hardware_model`       | Example: "TP-Link Deco X50". |
| Add-ons Definitions    | admin_product_addons → `metadata.addons`                           | Custom field: `ct_addons_def`             | Custom field: `ct_addons_def`           | High-level addon description; details handled in CircleTel. |

---

## 4. Lifecycle & Status

| Domain Concept       | CircleTel (admin / runtime)                                         | Zoho CRM Product                          | Zoho Billing (Item / Plan)               | Notes |
|----------------------|----------------------------------------------------------------------|-------------------------------------------|-----------------------------------------|-------|
| Admin Status         | `admin_products.status` (`draft`, `pending`, `approved`)            | Custom field: `ct_admin_status`           | Custom field: `ct_admin_status`         | Internal approval state; for reference only. |
| Offering Status      | `service_packages.status` (`draft`, `active`, `archived`, etc.)     | `Product_Active` (boolean) + custom field | `status` / `active` (if available)      | CircleTel drives activation state. |
| Active Flag          | `service_packages.active` (derived from status)                     | `Product_Active`                          | `active`                                | Keep Zoho active flag in sync with CircleTel status. |
| Valid From           | `service_packages.valid_from`                                       | Custom field: `ct_valid_from`             | Custom field: `ct_valid_from`           | For scheduled launches/promos. |
| Valid To             | `service_packages.valid_to`                                         | Custom field: `ct_valid_to`               | Custom field: `ct_valid_to`             | For end-of-promo / retirement. |
| Is Featured          | `service_packages.is_featured`                                      | Custom field: `ct_is_featured`            | N/A or custom field                     | Mainly for CircleTel UX; optional in Zoho. |
| Is Popular           | `service_packages.is_popular`                                       | Custom field: `ct_is_popular`             | N/A or custom field                     | For marketing/UX; optional in Zoho. |

---

## 5. Bundles & Composition

| Domain Concept          | CircleTel (runtime)                               | Zoho CRM Product                         | Zoho Billing (Item / Plan)                     | Notes |
|-------------------------|---------------------------------------------------|------------------------------------------|----------------------------------------------|-------|
| Bundle Flag             | `service_packages.is_bundle`                      | Custom field: `ct_is_bundle`             | Custom field: `ct_is_bundle`                   | Indicates multi-component offer. |
| Bundle Components       | `service_packages.bundle_components` (IDs/SKUs)  | Custom field: `ct_bundle_components`     | Custom field: `ct_bundle_components`           | Store as comma-separated list or JSON. |
| Bundle Savings Amount   | `service_packages.bundle_savings`                | Custom field: `ct_bundle_savings`        | Custom field: `ct_bundle_savings`              | Derived marketing/finance info. |
| Underlying Products     | (resolved via IDs/SKUs in CircleTel)             | Optional: use Zoho Product bundles       | Optional: use add-on items / charges           | Exact bundling support depends on CRM/Billing capabilities. |

---

## 6. Integration & Sync Metadata

| Domain Concept          | CircleTel                                  | Zoho CRM Product              | Zoho Billing (Item / Plan)     | Notes |
|-------------------------|--------------------------------------------|-------------------------------|--------------------------------|-------|
| Zoho CRM Product ID     | `product_integrations.zoho_crm_product_id` | `id` (native)                 | N/A                            | Stored in CircleTel mapping table. |
| Zoho Billing Item/Plan ID | `product_integrations.zoho_billing_item_id` / `zoho_billing_plan_id` | N/A | `id` (native)              | Also stored in mapping table. |
| Last Sync Timestamp     | `product_integrations.last_synced_at`      | Custom field: `ct_last_synced_at` (opt)   | Custom field: `ct_last_synced_at` (opt) | CircleTel is primary source of sync truth. |
| Last Sync Status        | `product_integrations.sync_status`         | Custom field: `ct_sync_status` (opt)      | Custom field: `ct_sync_status` (opt)    | Values: `ok`, `pending`, `failed`. |
| Last Sync Error         | `product_integrations.last_sync_error`     | Custom field: `ct_last_sync_error` (opt)  | Custom field: `ct_last_sync_error` (opt)| For troubleshooting; optional in Zoho. |

---

## 7. Usage Guidelines

- **Source of truth:**
  - All catalogue changes start in CircleTel admin (`admin_products`).
  - `service_packages` is the runtime offering view.
  - Zoho CRM and Zoho Billing are read-only views of this data (no direct edits).

- **Identifiers:**
  - Use **SKU** as the main business key across systems.
  - Always store Zoho IDs in a dedicated `product_integrations` table.

- **Minimalism:**
  - Only create Zoho custom fields that are actually used by sales, billing, or reporting.
  - Avoid duplicating complex metadata; keep detailed logic and configuration in CircleTel where possible.

- **TMF alignment:**
  - `admin_products` (+ related tables) represent **ProductSpecification** and internal product modelling.
  - `service_packages` represent **ProductOffering** and **ProductOfferingPrice**.
  - Zoho CRM/Billing mirror the **offering-level** view for sales and billing operations.
