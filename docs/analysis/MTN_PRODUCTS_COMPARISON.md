# MTN Products Comparison Analysis
**Date**: 2025-11-04  
**Source File**: `Helios and iLula Business Promos - Oct 2025 - Deals.xlsx` → JSON  
**Database**: CircleTel Supabase `service_packages` table

---

## Executive Summary

The JSON file contains **17,464 MTN business deals** which are fundamentally different from the **51 MTN products** currently in the Supabase database.

### Key Finding: 
**These are TWO DIFFERENT product categories and should NOT be merged!**

---

## Detailed Comparison

### JSON File (MTN Business Deals)
**Type**: Device + Connectivity Bundles  
**Total Records**: 17,464 deals  
**Structure**: Device bundled with service package on contract

**Characteristics**:
- **Includes Devices**: Samsung Galaxy, iPhone, Oppo, Huawei, Honor
- **Contract Terms**: 1-36 months (mostly 24 & 36 months)
- **Pricing**: Monthly subscription + Once-off device payment
- **Primary Use**: B2B sales where customer wants device + connectivity
- **Channels**: Helios & iLula platforms

**Top 5 Price Plans** (from 90 unique):
1. Made For Business L - 852 deals
2. Made For Business XL - 851 deals
3. My MTN Sky Bronze - 851 deals
4. My MTN Sky Silver - 851 deals
5. My MTN Sky Gold - 851 deals

**Top 5 Devices** (bundled):
1. Use Your Own - 411 deals
2. Samsung Galaxy A36 5G - 336 deals
3. Samsung Galaxy S25 (256GB) - 304 deals
4. Huawei Nova 13i - 293 deals
5. Samsung Galaxy A56 5G - 290 deals

**Pricing Range**:
- Monthly: R 6.00 - R 6,239.00
- Average: R 1,867.75/month
- Installation/Device: R 0.00 - R 2,500.00

**Data Bundles** (Top 5):
- 30GB - 1,881 deals
- 50GB - 1,852 deals
- 200GB - 1,732 deals
- 100GB - 1,713 deals
- 10GB - 969 deals

---

### Supabase Database (Service Packages)
**Type**: Standalone Connectivity Services  
**Total Records**: 51 MTN products  
**Structure**: Service-only packages (no devices)

**Characteristics**:
- **No Devices**: Pure connectivity services
- **Contract**: Month-to-month or annual (no device lock-in)
- **Pricing**: Monthly recurring only
- **Primary Use**: B2C/B2B connectivity-only sales
- **Types**: LTE, 5G, Uncapped, Capped data

**Sample Products**:
- MTN Business 5G Enterprise - R 1,044.00/mo
- MTN Made For Business SM + Oppo Reno 14 5G - R 849.00/mo
- MTN Business Uncapped 5G 35Mbps - R 494.00/mo
- MTN Home Professional 5G 60Mbps - R 649.00/mo
- MTN Business Broadband LTE 170GB - R 362.00/mo

---

## Analysis: Overlap vs Differences

### Price Plan Names
- **JSON**: 90 unique price plans
- **Database**: 51 products
- **Overlap**: Some price plan names appear in both (e.g., "Made For Business M")

### KEY DIFFERENCE:
```
JSON:    "Made For Business M" + Samsung Galaxy S25
Database: "MTN Made For Business M + Oppo Reno 14 5G"

JSON includes EVERY combination of:
  - Price Plan × Device × Contract Term
  
Database has:
  - Selected combos or standalone services
```

---

## Recommendations

### ❌ DO NOT DO THIS:
- **Do NOT** import JSON deals into `service_packages` table
- **Do NOT** replace existing products with JSON data
- **Do NOT** merge/update based on price plan names

### ✅ RECOMMENDED APPROACH:

### Option 1: Create Separate Table (RECOMMENDED)
```sql
CREATE TABLE mtn_business_deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Deal identification
  deal_id TEXT UNIQUE NOT NULL,              -- e.g., "202508EBU2726"
  deal_name TEXT NOT NULL,                   -- Friendly name
  
  -- Device information
  device_name TEXT,                          -- "Oppo Reno 14 5G"
  device_category TEXT,                      -- "Smartphone", "Router"
  device_status TEXT,                        -- "NEW", "STOCK"
  
  -- Service package
  price_plan TEXT NOT NULL,                  -- "Made For Business SM"
  tariff_code TEXT,                          -- "S_I_24a"
  package_code TEXT,                         -- "8524N"
  
  -- Contract terms
  contract_term INTEGER NOT NULL,            -- 12, 24, 36 months
  
  -- Pricing
  monthly_price_incl_vat DECIMAL(10,2),     -- R 849.00
  monthly_price_ex_vat DECIMAL(10,2),       -- R 738.26
  device_payment_incl_vat DECIMAL(10,2),    -- R 0.00 (once-off)
  
  -- Data & bundles
  total_data TEXT,                           -- "4GB"
  data_bundle TEXT,                          -- "2.5GB"
  total_minutes TEXT,                        -- "200min"
  anytime_minutes TEXT,                      -- "0min"
  onnet_minutes TEXT,                        -- "0min"
  sms_bundle TEXT,                           -- "0sms"
  
  -- Inclusive price plan features
  inclusive_data TEXT,                       -- "1.5GB"
  inclusive_minutes TEXT,                    -- "200min"
  inclusive_sms TEXT,                        -- "200sms"
  
  -- Freebies
  free_sim BOOLEAN DEFAULT false,
  free_cli BOOLEAN DEFAULT false,
  free_itb BOOLEAN DEFAULT false,
  
  -- Availability
  available_helios BOOLEAN DEFAULT true,
  available_ilula BOOLEAN DEFAULT true,
  channel_visibility TEXT,                   -- "EBU All"
  
  -- Dates
  promo_start_date DATE,
  promo_end_date DATE,
  
  -- Status
  active BOOLEAN DEFAULT true,
  inventory_status TEXT,                     -- "Upon request", "In stock"
  
  -- Link to service_packages (optional)
  service_package_id UUID REFERENCES service_packages(id),
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_deals_price_plan ON mtn_business_deals(price_plan);
CREATE INDEX idx_deals_device ON mtn_business_deals(device_name);
CREATE INDEX idx_deals_contract ON mtn_business_deals(contract_term);
CREATE INDEX idx_deals_active ON mtn_business_deals(active, available_helios, available_ilula);
```

### Option 2: Keep JSON File Only
- Don't import to database
- Use JSON file for reference
- Manually create quotes when customers request device bundles
- Pros: No database changes, simple
- Cons: Can't query dynamically, manual work

### Option 3: Create "Product Bundles" Table
- More generic table for any device+service combos
- Not just MTN, but all providers
- Future-proof for Vodacom, Telkom device deals

---

## Use Cases

### When to Use JSON Deals (Device Bundles):
✅ Customer wants device + connectivity package  
✅ B2B contract-based sales (12/24/36 months)  
✅ Customer doesn't have existing device  
✅ Helios/iLula platform sales  
✅ Enterprise device procurement  

### When to Use Database Products (Service Packages):
✅ Customer has own device (BYOD)  
✅ Month-to-month services  
✅ Pure connectivity requirements  
✅ Multi-site deployments (no devices needed)  
✅ Backup/failover lines  

---

## Data Quality Notes

### JSON File Issues:
1. **Device character encoding**: "ALL � BRC and Corp" (should be →)
2. **Inconsistent naming**: Some deals have detailed specs, others don't
3. **Price variations**: Same device+plan combo has different prices based on contract term
4. **Promo dates**: All deals have end dates (Nov 2025) - need refresh process

### Database Issues:
1. **Mixed product types**: Some have devices bundled, others don't
2. **Naming inconsistency**: "MTN Made For Business M+" vs "Made For Business M+"
3. **Limited metadata**: No contract term, device specs in database

---

## Proposed Import Strategy (If Proceeding)

### Phase 1: Schema
1. Create `mtn_business_deals` table
2. Add indexes and constraints
3. Test with sample data (100 records)

### Phase 2: Data Mapping
```python
# Pseudo-code for import
for deal in json_deals:
    mtn_deal = {
        'deal_id': deal['Deal ID'],
        'deal_name': f"{deal['Price Plan']} + {deal['OEM and Device']}",
        'device_name': deal['OEM and Device'],
        'price_plan': deal['Price Plan'],
        'contract_term': deal['Contract Term'],
        'monthly_price_incl_vat': deal['Total Subscription Incl Vat'],
        'monthly_price_ex_vat': deal['Total Subscription Ex Vat'],
        'device_payment_incl_vat': deal['Once-off Pay-in (incl VAT)'],
        'total_data': deal['Total Data'],
        'promo_start_date': parse_date(deal['Promo Start date']),
        'promo_end_date': parse_date(deal['Promo End date']),
        'available_helios': deal['Available on Helios'] == 'Yes',
        'available_ilula': deal['Available on iLula'] == 'Yes',
        # ... etc
    }
    insert_into_db(mtn_deal)
```

### Phase 3: Validation
1. Import 100 test records
2. Verify data integrity
3. Test quote generation with device bundles
4. Get stakeholder approval

### Phase 4: Full Import
1. Import all 17,464 deals
2. Set up refresh process (monthly from MTN)
3. Create admin UI for managing deals
4. Update quote system to support device bundles

---

## Questions for Stakeholders

1. **Do we need device bundles in the quote system?**
   - Are customers asking for device + connectivity packages?
   - Or do most customers bring their own devices?

2. **What's the refresh cadence?**
   - MTN updates deals monthly/quarterly?
   - Who maintains the data?

3. **Which platforms need access?**
   - Admin panel only?
   - Customer-facing package selector?
   - Quote builder?

4. **Pricing strategy**:
   - Use MTN's pricing as-is?
   - Add markup/margin?
   - Negotiated rates?

---

## Conclusion

**Bottom Line**: The JSON file contains **device bundle deals** which are different from **standalone service packages** in the database. 

**Recommendation**: Create separate `mtn_business_deals` table if device bundles are a business priority. Otherwise, keep JSON file for reference only.

**Next Steps**: 
1. Get stakeholder approval on approach
2. If proceeding: Create schema and import script
3. Update quote system to support device bundles
4. Train sales team on when to use deals vs packages

---

## Files Referenced
- **JSON**: `docs/products/01_ACTIVE_PRODUCTS/MTN Deals/Oct-2025/Helios and iLula Business Promos - Oct 2025 - Deals.json`
- **Original Excel**: `docs/products/01_ACTIVE_PRODUCTS/MTN Deals/Oct-2025/Helios and iLula Business Promos - Oct 2025 - Deals.xlsx`
- **Database**: Supabase `service_packages` table
- **Comparison Script**: `scripts/compare-mtn-products.py`
