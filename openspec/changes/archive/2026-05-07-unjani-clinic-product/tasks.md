## 1. Pre-flight Checks

- [x] 1.1 Verify public storefront package queries filter by `market_segment` or `customer_type` — confirm `b2b-managed` products won't leak to public pages
- [x] 1.2 Verify no code enforces a hard enum on `service_type` values — confirm `'managed'` won't cause runtime errors

## 2. Create Supabase Migration

- [x] 2.1 Create migration file `supabase/migrations/20260507_add_unjani_managed_connectivity_product.sql` with ALTER constraint + INSERT into `service_packages`
- [x] 2.2 Set core fields: `name = 'Unjani Managed Connectivity'`, `slug = 'unjani-managed-connectivity'`, `sku = 'UNJ-MC-001'`, `service_type = 'managed'`, `customer_type = 'business'`, `market_segment = 'b2b-managed'`
- [x] 2.3 Set pricing fields: `price = 450.00`, `base_price_zar = 450.00`, `speed_down = 10`, `speed_up = 10` (minimum SLA per MSA for LTE/5G)
- [x] 2.4 Set `pricing` JSONB: `{ "setup": 0, "monthly": 450, "upload_speed": 10, "download_speed": 10 }` (note: `monthly_incl_vat` stripped by `sync_service_package_pricing` trigger — VAT calculated at display time)
- [x] 2.5 Set `metadata` JSONB with: `contract_term_months: 24`, `escalation` rules (Y1 locked, Y2 CPI ≤6%), `cost_breakdown` per technology (tarana_fwb, mtn_lte_excl: 434, mtn_5g_excl: 503), `msa_reference`, `client: 'Unjani Clinics NPC'`, `total_sites: 50`
- [x] 2.6 Set visibility/status: `active = true`, `status = 'active'`, `is_featured = false`, `is_popular = false`
- [x] 2.7 Set `compatible_providers = ARRAY['tarana-fwb', 'mtn-lte', 'mtn-5g']`
- [x] 2.8 Set `valid_from = '2026-05-15T00:00:00Z'`, `valid_to = NULL`
- [x] 2.9 Set `description` and `features` array with customer-facing summary text

## 3. Apply and Verify

- [x] 3.1 Apply migration to Supabase via `mcp__supabase__apply_migration` (included ALTER constraint to add `'managed'` to `service_packages_service_type_check`)
- [x] 3.2 Query `service_packages WHERE sku = 'UNJ-MC-001'` and verify all fields match spec
- [x] 3.3 Run the public storefront packages API query and confirm the product does NOT appear
- [x] 3.4 Verify product appears in admin product management queries (filtered by `customer_type = 'business'`)

## 4. Post-Implementation

- [x] 4.1 Run `npm run type-check:memory` — no new TypeScript errors from `service_type = 'managed'` (pre-existing errors only)
- [x] 4.2 Update `docs/clients/unjani-clinics/UNJANI_FINANCIAL_MODEL.md` with product SKU reference
