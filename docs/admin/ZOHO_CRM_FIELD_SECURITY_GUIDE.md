# Zoho CRM Field-Level Security Guide

**Epic 2.6 - Guard Against Direct Edits in Zoho CRM**

## Overview

CircleTel is the **canonical product catalogue**. All product data originates in the CircleTel admin panel and syncs downstream to Zoho CRM. To maintain data integrity, Zoho CRM fields should be configured as **read-only** to prevent manual edits that would cause data drift.

## Data Flow Architecture

```
CircleTel Admin (MASTER)
    ↓
service_packages table
    ↓
Zoho CRM Products Module (READ-ONLY)
```

**Rule**: All catalogue changes MUST be made in CircleTel admin panel, NEVER directly in Zoho CRM.

## Zoho CRM Products Module - Field Configuration

### Fields That Should Be READ-ONLY

The following fields are automatically synced from CircleTel and should be configured as read-only in Zoho CRM:

#### Identity & Classification
- `Product_Name` - Synced from `service_packages.name`
- `Product_Code` (SKU) - Synced from `service_packages.sku`
- `Description` - Synced from `service_packages.description`
- `Product_Category` - Synced from `service_packages.category`

#### CircleTel Custom Fields (All Read-Only)
- `ct_product_id` - Links to `admin_products.id`
- `ct_service_package_id` - Links to `service_packages.id` (PRIMARY KEY)
- `ct_service_type` - e.g., "fibre", "lte", "wireless"
- `ct_market_segment` - e.g., "consumer", "business", "enterprise"
- `ct_provider` - e.g., "mtn", "vumatel", "openserve"

#### Pricing Fields
- `Unit_Price` - Monthly recurring charge (from `base_price_zar`)
- `ct_installation_fee` - One-time setup/installation cost

#### Technical Characteristics
- `ct_download_speed_mbps` - Download speed in Mbps
- `ct_upload_speed_mbps` - Upload speed in Mbps
- `ct_contract_term_months` - Contract duration (0 = month-to-month)

#### Lifecycle & Validity
- `Product_Active` - Active status (from `service_packages.status`)
- `ct_valid_from` - Offering launch date
- `ct_valid_to` - Offering retirement date (NULL = no end date)

### Fields That CAN Be Edited in Zoho CRM

The following fields are Zoho-specific and safe to edit directly:

- **Owner** - Zoho CRM user responsible for this product
- **Created By**, **Modified By** - Audit fields (auto-managed by Zoho)
- **Tags** - Zoho organizational tags
- **Notes** - Internal Zoho notes (not synced back to CircleTel)

## How to Configure Read-Only Fields in Zoho CRM

### Method 1: Profile-Level Permissions (Recommended)

1. Navigate to **Setup > Users and Control > Security Control > Profiles**
2. Select the profile you want to restrict (e.g., "Standard")
3. Click **Profile Permissions**
4. Under **Modules**, select **Products**
5. Click **Field Level Security**
6. For each CircleTel-synced field:
   - Set **Read** permission: ✅ Enabled
   - Set **Edit** permission: ❌ Disabled
7. Click **Save**

### Method 2: Field-Level Read-Only Setting

1. Navigate to **Setup > Customization > Modules and Fields**
2. Select **Products** module
3. Click on each CircleTel-synced field
4. Enable **Read Only** checkbox
5. Click **Save**

**Note**: Use Method 1 (Profile-Level) for more granular control. System Administrators can retain edit access for emergency fixes.

## Field Mapping Reference

| CircleTel Source | Zoho CRM Field | Type | Editable |
|------------------|----------------|------|----------|
| `service_packages.id` | `ct_service_package_id` | Text | ❌ No |
| `service_packages.name` | `Product_Name` | Text | ❌ No |
| `service_packages.sku` | `Product_Code` | Text | ❌ No |
| `service_packages.description` | `Description` | Text Area | ❌ No |
| `service_packages.category` | `Product_Category` | Picklist | ❌ No |
| `service_packages.base_price_zar` | `Unit_Price` | Currency | ❌ No |
| `service_packages.cost_price_zar` | `ct_installation_fee` | Currency | ❌ No |
| `service_packages.speed_down` | `ct_download_speed_mbps` | Number | ❌ No |
| `service_packages.speed_up` | `ct_upload_speed_mbps` | Number | ❌ No |
| `service_packages.status` | `Product_Active` | Checkbox | ❌ No |
| `service_packages.source_admin_product_id` | `ct_product_id` | Text | ❌ No |
| `service_packages.service_type` | `ct_service_type` | Text | ❌ No |
| `service_packages.market_segment` | `ct_market_segment` | Text | ❌ No |
| `service_packages.provider` | `ct_provider` | Text | ❌ No |
| `metadata.contract_months` | `ct_contract_term_months` | Number | ❌ No |
| `service_packages.valid_from` | `ct_valid_from` | Date | ❌ No |
| `service_packages.valid_to` | `ct_valid_to` | Date | ❌ No |

Full field mapping details: `docs/admin/PRODUCT_CATALOGUE_ZOHO_FIELD_MAPPING.md`

## Workflow for Product Changes

### ✅ CORRECT Workflow (CircleTel as Master)

1. **Product Manager**: Updates product details in CircleTel Admin Panel
2. **CircleTel**: Validates and saves changes to `admin_products`
3. **Product Manager**: Clicks **Publish** button
4. **CircleTel**: Updates `service_packages` table
5. **CircleTel**: Auto-syncs to Zoho CRM via API
6. **Zoho CRM**: Product updated with new data

### ❌ INCORRECT Workflow (Direct Edit in Zoho)

1. **Sales Rep**: Edits product price directly in Zoho CRM
2. **Problem**: Data drift - Zoho and CircleTel now out of sync
3. **Problem**: Next CircleTel publish overwrites Zoho changes
4. **Problem**: Lost audit trail of who changed what

## Handling Emergency Fixes

If a critical error requires immediate fix in Zoho CRM:

1. **Make the fix in Zoho CRM** (emergency only)
2. **Immediately update CircleTel** with the same change
3. **Re-publish from CircleTel** to ensure sync
4. **Document the incident** in CircleTel audit log

## Monitoring Data Drift

### Detecting Unauthorized Changes

Run this query weekly to detect drift:

```sql
-- Find products synced to Zoho but modified in Zoho after last CircleTel sync
SELECT
  sp.id,
  sp.name,
  sp.sku,
  pi.zoho_crm_product_id,
  pi.last_synced_at,
  pi.sync_status
FROM service_packages sp
JOIN product_integrations pi ON pi.service_package_id = sp.id
WHERE pi.sync_status = 'ok'
  AND pi.last_synced_at < NOW() - INTERVAL '7 days'
ORDER BY pi.last_synced_at ASC;
```

Products not synced in 7+ days may indicate someone is editing Zoho directly to avoid overwrite.

### Re-sync All Products (Overwrite Zoho)

If drift is detected, force re-sync all products:

```bash
node scripts/backfill-zoho-products.js --force
```

This overwrites ALL Zoho CRM Products with CircleTel data.

## Training & Communication

### For Product Managers
- **Rule**: All product changes MUST go through CircleTel admin panel
- **Never**: Edit products directly in Zoho CRM
- **Always**: Use CircleTel's Publish button after making changes

### For Sales Team
- **View Only**: Zoho CRM Products are read-only reference data
- **For Pricing Questions**: Contact Product Management team
- **For Special Pricing**: Use Zoho Deals/Quotes (separate from Products)

### For System Administrators
- **Emergency Access**: Retain edit permissions for emergencies only
- **After Emergency Fix**: Must immediately sync change back to CircleTel
- **Document**: Log all manual Zoho edits in incident tracking system

## Compliance Checklist

- [ ] Configure all CircleTel-synced fields as read-only in Zoho CRM
- [ ] Document field mapping in Confluence/internal wiki
- [ ] Train product managers on CircleTel-first workflow
- [ ] Train sales team that Zoho Products are read-only
- [ ] Set up weekly drift monitoring query
- [ ] Create incident response process for emergency Zoho edits
- [ ] Review Zoho CRM profiles and permissions quarterly

## Related Documentation

- **Field Mapping**: `docs/admin/PRODUCT_CATALOGUE_ZOHO_FIELD_MAPPING.md`
- **Integration Plan**: `docs/admin/PRODUCT_CATALOGUE_ZOHO_INTEGRATION_PLAN.md`
- **Sync Service**: `lib/integrations/zoho/product-sync-service.ts`
- **Retry Logic**: `lib/integrations/zoho/sync-retry-service.ts`

---

**Last Updated**: 2025-01-15
**Owner**: Platform Engineering Team
**Status**: Active - Epic 2.6 Complete
