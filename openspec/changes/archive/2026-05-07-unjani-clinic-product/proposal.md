## Why

Unjani Clinics NPC is Circle Tel's first large-scale B2B client (22 active + 28 Phase 2 = 50 sites). The MSA fixes the service fee at R450 excl. VAT/site/month regardless of whether the underlying connectivity is Tarana FWB, MTN LTE 20Mbps, or MTN 5G 60Mbps. Today there is no product in the `service_packages` catalogue that represents this — billing and order processing need a single, technology-agnostic SKU to assign to Unjani sites. Billing begins 15 May 2026 (pro-rata) with full invoicing from 1 June 2026.

## What Changes

- **New product row** in `service_packages` table: "Unjani Managed Connectivity" at R450 excl. VAT (R517.50 incl.), 24-month contract term
- Technology-agnostic: `service_type` set to `managed` (not tied to a single network type); `compatible_providers` lists all three delivery technologies
- B2B-only: `customer_type = 'business'`, `market_segment = 'b2b-managed'`, not featured/popular, not publicly visible on the storefront
- `metadata` JSONB stores the Unjani-specific cost stack (Tarana/LTE/5G cost prices), MSA reference, contract escalation rules, and TDX recovery context
- `pricing` JSONB stores structured monthly/setup pricing consistent with existing products
- `cost_price_zar` reflects the blended average cost across active site technologies
- `valid_from` set to 2026-05-15 (billing commencement)

## Capabilities

### New Capabilities
- `unjani-managed-connectivity`: A client-specific managed connectivity product with technology-agnostic pricing, B2B visibility controls, and Unjani MSA-aligned commercial terms stored in metadata

### Modified Capabilities
_(none — no existing spec-level requirements change)_

## Impact

- **Database**: Single INSERT into `service_packages` (no schema migration needed — all columns already exist)
- **Admin UI**: Product will appear in admin product management views filtered by `customer_type = 'business'`
- **Storefront**: Not visible — `is_featured = false`, `is_popular = false`, `active = true` but filtered by `market_segment` in public queries
- **Billing**: Can be assigned to Unjani customer invoices via existing billing flows
- **No API changes**: Uses existing `service_packages` table structure; no new endpoints required
