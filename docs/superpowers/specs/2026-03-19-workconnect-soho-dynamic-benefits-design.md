# Design: WorkConnect SOHO Packages & Dynamic Product-Linked Benefits

**Date**: 2026-03-19
**Status**: Reviewed (v2)
**Scope**: Seed WorkConnect SOHO packages, make global benefits dynamic by product category, seed SOHO terms, edit BQ-2026-001

---

## Problem

1. **No SOHO packages in database** — WorkConnect products exist in product specs but not in `service_packages`. Cannot create SOHO quotes.
2. **Global benefits are hardcoded** — `quote-benefits.ts` has a fixed `GLOBAL_BENEFITS` array with SME/enterprise items (24/7 NOC, dedicated account manager, priority support) that don't apply to SOHO products.
3. **BQ-2026-001** is for a small law firm (MTI Attorneys) currently on SkyFibre SME Professional — should be on a SOHO product.

## Solution

### Part 1: Seed WorkConnect SOHO Packages

Three tiers into `service_packages` with full cost data. Cloud Backup is NOT configured yet — excluded from costs and features.

**Cost Breakdown (FWB Delivery — Primary):**

| Component | Starter (50/12.5) | Plus (100/25) | Pro (200/50) |
|---|---|---|---|
| MTN Wholesale FWB | R499.00 | R599.00 | R699.00 |
| Infrastructure (BNG, CGNAT, backhaul) | R33.50 | R38.50 | R55.00 |
| BSS Platform (AgilityGIS) | R10.96 | R10.96 | R10.96 |
| Router amortisation (24mo) | R28.13 | R42.71 | R42.71 |
| Installation amortisation (24mo) | R37.50 | R37.50 | R0.00 |
| Support & Operations | R15.00 | R15.00 | R20.00 |
| Payment Processing (1%) | R7.99 | R10.99 | R14.99 |
| **TOTAL COST** | **R632.08** | **R754.66** | **R842.66** |
| **Retail Price (excl VAT)** | **R799.00** | **R1,099.00** | **R1,499.00** |
| **Contribution** | **R166.92** | **R344.34** | **R656.34** |
| **Margin %** | **20.9%** | **31.3%** | **43.8%** |

**Router Assignments:**

| Tier | Router | Dealer Cost | Amortisation |
|---|---|---|---|
| Starter | Reyee RG-EW1300G (WiFi 5, AC1300) | R675 | R28.13/mo |
| Plus | Reyee RG-EG105GW (Business Gateway, WiFi, VPN) | R1,025 | R42.71/mo |
| Pro | Reyee RG-EG105GW (Business Gateway, WiFi, VPN) | R1,025 | R42.71/mo |

**Installation:**

| Tier | Customer Pays | Amortised Monthly |
|---|---|---|
| Starter | R900 once-off | R37.50 |
| Plus | R900 once-off | R37.50 |
| Pro | FREE (valued R1,500) | R0.00 |

**Post-24-Month Margins (equipment recovered):**

| Tier | FWB Margin |
|---|---|
| Starter | 27.2% |
| Plus | 33.8% |
| Pro | 43.7% |

**Prerequisite: CHECK constraint updates**

Two CHECK constraints on `service_packages` must be updated before seeding:

1. `service_packages_service_type_check` — add `'WorkConnect'` to allowed values
2. `service_packages_customer_type_check` — add `'soho'` to allowed values (current: `consumer`, `business`, `both`)

The `business_quotes.customer_type_check` stays unchanged (`smme`/`enterprise`) — MTI Attorneys remains `customer_type = 'smme'` at the quote level. The `customer_type` field on `service_packages` is package-level classification, not the same as the quote's `customer_type`.

**`speed_up` column is integer** — Starter's 12.5 Mbps (4:1 ratio from 50 Mbps) rounds to 13.

**Database mapping:**

| Column | Starter | Plus | Pro |
|---|---|---|---|
| `name` | WorkConnect Starter | WorkConnect Plus | WorkConnect Pro |
| `service_type` | WorkConnect | WorkConnect | WorkConnect |
| `product_category` | soho | soho | soho |
| `customer_type` | soho | soho | soho |
| `market_segment` | soho | soho | soho |
| `price` | 799.00 | 1099.00 | 1499.00 |
| `base_price_zar` | 799.00 | 1099.00 | 1499.00 |
| `cost_price_zar` | 632.08 | 754.66 | 842.66 |
| `speed_down` | 50 | 100 | 200 |
| `speed_up` | 13 | 25 | 50 |
| `data_cap_gb` | NULL (uncapped) | NULL (uncapped) | NULL (uncapped) |
| `provider` | MTN | MTN | MTN |
| `status` | active | active | active |
| `active` | true | true | true |
| `is_featured` | false | true | false |
| `is_popular` | false | true | false |

**Features per tier:**

Starter:
- Uncapped data, no FUP
- VoIP QoS included
- 2 business email accounts
- Reyee WiFi 5 router (free to use)
- Extended support Mon-Sat 07:00-19:00
- 12 business hour response time
- 99% uptime target
- Month-to-month or 12/24 month contract
- R900 installation fee

Plus:
- Uncapped data, no FUP
- VoIP QoS included
- 5 business email accounts
- Reyee Business Gateway router (free to use)
- 3 concurrent VPN tunnels
- Extended support Mon-Sat 07:00-19:00
- 8 business hour response time
- 99% uptime target
- Month-to-month or 12/24 month contract
- R900 installation fee

Pro:
- Uncapped data, no FUP
- VoIP QoS with full traffic shaping
- 10 business email accounts
- 1 static IP included
- Reyee Business Gateway router (free to use)
- 5 concurrent VPN tunnels
- Remote Desktop optimised (RDP/Citrix)
- WhatsApp priority support
- 4 business hour response time
- 99.5% uptime target with service credits
- Month-to-month or 12/24 month contract
- FREE installation (valued at R1,500)

**Metadata (internal cost breakdown — not shown on quotes):**

```json
{
  "cost_breakdown": {
    "wholesale_fwb": 599.00,
    "infrastructure": 38.50,
    "bss_platform": 10.96,
    "router_amortisation": 42.71,
    "installation_amortisation": 37.50,
    "support_operations": 15.00,
    "payment_processing": 10.99
  },
  "router": { "model": "Reyee RG-EG105GW", "dealer_cost": 1025 },
  "margin_percent": 31.3,
  "margin_post_24mo": 33.8,
  "installation_fee": 900
}
```

---

### Part 2: Dynamic Global Benefits

Replace hardcoded `GLOBAL_BENEFITS` array in `lib/quotes/quote-benefits.ts` with a function that returns benefits based on product category.

**SOHO benefits** (when any item has `product_category === 'soho'` or `service_type === 'WorkConnect'`):
- South African-based customer support
- Professional installation and configuration
- Extended support hours (Mon-Sat 07:00-19:00)
- Month-to-month flexibility available
- VoIP quality of service included
- Free-to-use business router

**Business/Enterprise benefits** (when items are SME/enterprise — `SkyFibre SME`, `BizFibreConnect`, etc.):
- South African-based customer support
- 24/7 Network Operations Centre (NOC) monitoring
- Professional installation and configuration
- Dedicated account manager
- Priority technical support
- Monthly usage reporting and analytics

**Mixed quotes**: If a quote contains both SOHO and business items, show business-level benefits (higher tier wins).

**Implementation**: New function `getGlobalBenefits(items: BusinessQuoteItem[]): string[]` that checks items' `service_type` and `product_category` to determine which set to return.

---

### Part 3: Seed WorkConnect Terms

Add WorkConnect-specific T&Cs to `business_quote_terms` (service_type = 'WorkConnect'):

1. **Installation & Setup** (display_order 10) — Professional installation within 7-10 business days. Reyee router pre-configured with Ruijie Cloud management. Customer must provide suitable power and mounting access.

2. **Service Level Target** (display_order 11) — 99% uptime target (best-effort, not SLA-backed) for Starter and Plus tiers. 99.5% uptime target with service credits for Pro tier. Excludes scheduled maintenance and upstream provider outages.

3. **Support Hours** (display_order 12) — Extended support Mon-Sat 07:00-19:00 via phone, email, and WhatsApp. Pro tier receives WhatsApp priority queue access. Response times: Starter 12 hours, Plus 8 hours, Pro 4 hours.

4. **Contract & Flexibility** (display_order 13) — Month-to-month contracts available on all tiers with 30 days cancellation notice. 12 and 24-month terms available with discounted installation. Router remains CircleTel property and must be returned on cancellation.

---

### Part 4: Edit BQ-2026-001

Update the quote for MTI Attorneys (small law firm) from SkyFibre SME Professional to **WorkConnect Plus** (100/25 Mbps at R1,099):

**Why WorkConnect Plus for a law firm:**
- VPN support (3 tunnels) for legal practice management software
- VoIP QoS for client calls
- 5 business email accounts for staff
- R1,099 vs R1,651 (saves R552/month vs current SME Professional)
- Extended support hours sufficient for a small firm

**Database changes:**
- Update `business_quote_items` to point to new WorkConnect Plus `package_id`
- Update service_name, service_type, product_category, price, speed fields
- Update `benefits_snapshot` with WorkConnect Plus features
- Update `business_quotes` pricing totals
- Update `customer_notes` to reflect SOHO product

---

## Files Affected

| File | Change |
|------|--------|
| `supabase/migrations/YYYYMMDD_alter_service_packages_constraints.sql` | Add 'WorkConnect' to service_type and 'soho' to customer_type CHECK constraints |
| `supabase/migrations/YYYYMMDD_seed_workconnect_soho.sql` | Seed 3 WorkConnect packages into service_packages |
| `supabase/migrations/YYYYMMDD_seed_workconnect_terms.sql` | Seed WorkConnect T&Cs into business_quote_terms |
| `lib/quotes/quote-benefits.ts` | Replace hardcoded GLOBAL_BENEFITS with dynamic function, add WorkConnect to legacy fallback |
| Direct SQL | Edit BQ-2026-001 quote item to WorkConnect Plus |

---

## Out of Scope

- Cloud Backup feature (not configured yet — will be added when available)
- FTTH-specific WorkConnect tiers (same retail price, different wholesale — tracked in metadata only)
- Add-on products (Static IP, LTE Failover, etc.) — separate future work
- Admin UI for product catalogue cost viewing — costs stored in DB, admin catalogue TBD
