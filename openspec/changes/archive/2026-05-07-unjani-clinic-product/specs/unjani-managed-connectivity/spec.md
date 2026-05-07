## ADDED Requirements

### Requirement: Unjani Managed Connectivity product exists in catalogue
The system SHALL have a product in `service_packages` with SKU `UNJ-MC-001` representing the Unjani Clinics managed connectivity service at R450 excl. VAT per site per month.

#### Scenario: Product row exists with correct pricing
- **WHEN** querying `service_packages` WHERE `sku = 'UNJ-MC-001'`
- **THEN** the row SHALL have `price = 450.00`, `base_price_zar = 450.00`, and `pricing.monthly = 450`

#### Scenario: Product includes VAT-inclusive reference
- **WHEN** querying the product's `pricing` JSONB
- **THEN** `pricing.monthly_incl_vat` SHALL equal `517.50` (R450 × 1.15)

### Requirement: Product is technology-agnostic
The product SHALL NOT be tied to a single network technology. It SHALL cover Tarana FWB, MTN LTE 20Mbps, and MTN 5G 60Mbps delivery methods.

#### Scenario: Service type reflects managed delivery
- **WHEN** querying the product row
- **THEN** `service_type` SHALL be `'managed'`

#### Scenario: Compatible providers list all technologies
- **WHEN** querying the product's `compatible_providers` array
- **THEN** it SHALL contain `['tarana-fwb', 'mtn-lte', 'mtn-5g']`

### Requirement: Product is B2B-only and not publicly visible
The product SHALL only be visible to admin users managing B2B accounts. It SHALL NOT appear on the public storefront.

#### Scenario: Customer type is business
- **WHEN** querying the product row
- **THEN** `customer_type` SHALL be `'business'`

#### Scenario: Market segment prevents public display
- **WHEN** querying the product row
- **THEN** `market_segment` SHALL be `'b2b-managed'`

#### Scenario: Not featured or popular
- **WHEN** querying the product row
- **THEN** `is_featured` SHALL be `false` AND `is_popular` SHALL be `false`

#### Scenario: Public storefront excludes product
- **WHEN** the public packages page queries `service_packages`
- **THEN** the Unjani product SHALL NOT appear in results (filtered by `market_segment`)

### Requirement: Product aligns with Unjani MSA commercial terms
The product metadata SHALL reflect the signed MSA terms for auditability and admin reference.

#### Scenario: Contract duration stored
- **WHEN** querying the product's `metadata` JSONB
- **THEN** `metadata.contract_term_months` SHALL be `24`

#### Scenario: Escalation terms stored
- **WHEN** querying the product's `metadata` JSONB
- **THEN** `metadata.escalation` SHALL document Year 1 locked, Year 2 CPI capped at 6%

#### Scenario: Cost breakdown per technology stored
- **WHEN** querying `metadata.cost_breakdown`
- **THEN** it SHALL contain cost entries for `tarana_fwb`, `mtn_lte_excl`, and `mtn_5g_excl` with their respective monthly costs

### Requirement: Product has valid billing dates
The product SHALL have a `valid_from` date matching the Unjani billing commencement.

#### Scenario: Valid from date set
- **WHEN** querying the product row
- **THEN** `valid_from` SHALL be `'2026-05-15'`

#### Scenario: No expiry date
- **WHEN** querying the product row
- **THEN** `valid_to` SHALL be `NULL`
