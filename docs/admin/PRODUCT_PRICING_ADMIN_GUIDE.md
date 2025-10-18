# Product Pricing Admin Guide

## Overview

This guide explains how to manage product pricing in the CircleTel admin panel. All changes made in the admin interface immediately reflect on the customer-facing website.

## Database to Frontend Mapping

### How Product Data Flows

```
┌─────────────────────────────────────────────────────────────┐
│ 1. SUPABASE DATABASE (service_packages table)              │
│    - Source of truth for all product information           │
│    - Located: supabase/migrations/*.sql                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. API ROUTE (/api/coverage/packages/route.ts)             │
│    - Fetches packages by coverage leadId                   │
│    - Applies dynamic pricing rules                         │
│    - Filters by customer type (consumer/business)          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. FRONTEND PAGE (/app/packages/[leadId]/page.tsx)         │
│    - Displays color-coded package cards                    │
│    - Shows promotional pricing                             │
│    - Renders features and descriptions                     │
└─────────────────────────────────────────────────────────────┘
```

## Field Mapping (Screenshot ↔ Database)

### Example: HomeFibre Premium Package

| Screenshot Element        | Database Field          | Value              |
|--------------------------|-------------------------|-------------------|
| Product Portfolio        | `service_type`          | HomeFibreConnect  |
| Product Name             | `name`                  | HomeFibre Premium |
| Download Speed           | `speed_down`            | 100 (Mbps)        |
| Upload Speed             | `speed_up`              | 50 (Mbps)         |
| Current Price (Large)    | `promotion_price`       | 499.00 (ZAR)      |
| Normal Price (Strikethrough) | `price`            | 799.00 (ZAR)      |
| Promotion Duration       | `promotion_months`      | 3 (months)        |
| Product Features         | `features` (array)      | Array of strings  |
| Product Copy             | `description`           | Text description  |

## Admin Interfaces

### 1. Products Page (`/admin/products`)

**Purpose:** Full product catalog management

**Features:**
- ✅ View all products with search and filtering
- ✅ Edit product details (name, description, features)
- ✅ Quick price editing via modal
- ✅ Toggle active/inactive status
- ✅ View complete audit history
- ✅ Bulk operations support

**How to Update a Product:**

1. **Navigate to Admin Products**
   ```
   http://localhost:3006/admin/products
   ```

2. **Find Your Product**
   - Use search bar for quick lookup
   - Filter by category, status, or service type
   - Sort by name, price, or last updated

3. **Edit Product Details**
   - Click the menu icon (⋮) next to the product
   - Select one of these options:

   **Option A: Quick Price Edit**
   - Click "Edit Price"
   - Modal opens with current pricing
   - Update:
     - `Monthly Price` → Updates `price` field
     - `Setup Fee` → Updates `setup_fee` field
   - Add change reason (for audit trail)
   - Click "Save Changes"

   **Option B: Full Edit**
   - Click "Edit"
   - Redirects to `/admin/products/{id}/edit`
   - Update all fields:
     - Product name
     - Description
     - Features (add/remove/reorder)
     - Speeds (download/upload)
     - Pricing (regular + promotional)
     - Service type
     - Customer type
     - Category
   - Save changes

4. **Verify Changes**
   - Changes save immediately to database
   - Frontend updates on next page load
   - Check audit history for confirmation

### 2. Pricing Dashboard (`/admin/pricing`)

**Purpose:** Dynamic pricing rules management

**Features:**
- ✅ Create geographic pricing rules (by province)
- ✅ Time-based pricing (peak/off-peak)
- ✅ Volume-based discounts
- ✅ Seasonal promotions
- ✅ Customer type-specific pricing
- ✅ Live price preview

**How to Create a Pricing Rule:**

1. **Navigate to Pricing Dashboard**
   ```
   http://localhost:3006/admin/pricing
   ```

2. **Click "New Pricing Rule"**

3. **Configure Rule Details**
   ```
   Rule Name: e.g., "Gauteng Premium Pricing"
   Rule Type: Geographic, Time-based, Volume, etc.
   Adjustment Type: Percentage, Fixed Amount, or Multiplier
   Adjustment Value: e.g., 10 (for 10% increase)
   Priority: Higher numbers override lower (1-100)
   ```

4. **Set Conditions (for Geographic rules)**
   - Check provinces where rule applies:
     - Gauteng
     - Western Cape
     - KwaZulu-Natal
     - (etc.)

5. **Add Description**
   - Explain what this rule does
   - Include business justification

6. **Save Rule**
   - Rule applies immediately to matching products
   - View applied rules in "Pricing Rules" tab

### 3. Price Preview Tool

**Location:** `/admin/pricing` → "Price Preview" tab

**Purpose:** See how pricing rules affect specific products

**How to Use:**

1. Enter product UUID (from products page)
2. Select context:
   - Province (e.g., "Gauteng")
   - Customer type (Consumer/Business)
   - Postal code
3. View calculated price with:
   - Base price
   - Applied rules (in order of priority)
   - Final effective price
   - Discount percentage
   - Expiry date (if promotional)

## Product Data Structure

### Service Packages Table Schema

```sql
CREATE TABLE service_packages (
  id                    UUID PRIMARY KEY,
  name                  VARCHAR(100) NOT NULL,
  service_type          VARCHAR(50) NOT NULL,
  speed_down            INTEGER NOT NULL,
  speed_up              INTEGER NOT NULL,
  price                 DECIMAL(10,2) NOT NULL,
  promotion_price       DECIMAL(10,2),
  promotion_months      INTEGER DEFAULT 3,
  description           TEXT,
  features              TEXT[],
  active                BOOLEAN DEFAULT true,
  customer_type         VARCHAR(20),
  product_category      VARCHAR(50),
  requires_fttb_coverage BOOLEAN DEFAULT false,
  sort_order            INTEGER DEFAULT 0,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);
```

### Field Descriptions

| Field | Type | Description | Frontend Display |
|-------|------|-------------|------------------|
| `name` | VARCHAR | Product name | Large heading on package card |
| `service_type` | VARCHAR | Service category | Small label above product name |
| `speed_down` | INTEGER | Download speed in Mbps | "XXX Mbps Down" text |
| `speed_up` | INTEGER | Upload speed in Mbps | "XXX Mbps Up" text |
| `price` | DECIMAL | Regular price in ZAR | Strikethrough price (if promo active) |
| `promotion_price` | DECIMAL | Promotional price | Large price display |
| `promotion_months` | INTEGER | Promo duration | "for X months" text |
| `description` | TEXT | Product description | Small text below features |
| `features` | TEXT[] | Feature list | Bullet points with checkmarks |
| `active` | BOOLEAN | Display toggle | Controls visibility |
| `customer_type` | VARCHAR | Consumer/Business/Both | Filters package visibility |
| `product_category` | VARCHAR | wireless/fibre/etc | Used for tab filtering |

## Common Tasks

### Update Product Pricing

**Scenario:** Change HomeFibre Premium from R499 to R449 promo price

**Steps:**
1. Go to `/admin/products`
2. Search for "HomeFibre Premium"
3. Click menu (⋮) → "Edit Price"
4. Update "Promotional Price" to `449.00`
5. Add reason: "Monthly special promotion"
6. Save changes

**Result:** 
- Database `promotion_price` updates to 449.00
- Frontend immediately shows "R 449.00" on next load
- Audit log records change with timestamp and user

### Add/Remove Features

**Scenario:** Add "Free Wi-Fi Router" to HomeFibre Premium

**Steps:**
1. Go to `/admin/products`
2. Find "HomeFibre Premium"
3. Click menu (⋮) → "Edit"
4. Scroll to "Features" section
5. Click "Add Feature"
6. Enter: "Free Wi-Fi Router Included"
7. Reorder if needed (drag & drop)
8. Save changes

**Result:**
- Database `features` array adds new item
- Frontend displays new bullet point
- Feature appears in card layout

### Create Geographic Pricing Rule

**Scenario:** Increase all Gauteng prices by 5%

**Steps:**
1. Go to `/admin/pricing`
2. Click "New Pricing Rule"
3. Fill in:
   - Name: "Gauteng Premium Zone"
   - Type: Geographic
   - Adjustment Type: Percentage
   - Value: 5
   - Priority: 10
4. Check "Gauteng" province
5. Description: "Premium pricing for Gauteng region"
6. Save rule

**Result:**
- All products get 5% increase in Gauteng
- Pricing API automatically applies rule
- Frontend shows adjusted prices for Gauteng customers

### Deactivate a Package

**Scenario:** Temporarily hide HomeFibre Basic from website

**Steps:**
1. Go to `/admin/products`
2. Find "HomeFibre Basic"
3. Click menu (⋮) → "Deactivate"
4. Confirm action

**Result:**
- Database `active` field set to `false`
- Package no longer appears on frontend
- Can be reactivated later (reversible)

## Verification & Testing

### Verify Database Changes

**Option 1: Run Verification Script**
```bash
npx tsx scripts/verify-product-pricing.ts
```

This script shows:
- All active packages
- Field mappings
- Screenshot comparison (HomeFibre Premium)
- Discrepancy detection
- Summary statistics

**Option 2: Direct Database Query**
```sql
SELECT 
  name,
  service_type,
  speed_down,
  speed_up,
  price,
  promotion_price,
  promotion_months,
  active
FROM service_packages
WHERE name = 'HomeFibre Premium';
```

### Test Frontend Display

1. Make changes in admin panel
2. Open package page in incognito/private window:
   ```
   http://localhost:3006/packages/{some-lead-id}
   ```
3. Verify changes appear correctly:
   - Product name
   - Speeds
   - Pricing
   - Features
   - Description

### Check Audit Trail

1. Go to `/admin/products`
2. Find the product you changed
3. Click menu (⋮) → "View History"
4. Modal shows:
   - All changes made
   - Who made them
   - When they were made
   - What fields changed
   - Before/after values

## Troubleshooting

### Changes Not Appearing on Frontend

**Possible Causes:**
1. **Browser cache** → Hard refresh (Ctrl+Shift+R)
2. **Product inactive** → Check `active` field in admin
3. **Wrong customer type** → Verify `customer_type` filter
4. **Coverage filtering** → Ensure coverage lead has correct service types

**Debug Steps:**
1. Check browser console for errors
2. Verify API response: `/api/coverage/packages?leadId={id}`
3. Check database directly
4. Review audit logs

### Price Not Updating

**Possible Causes:**
1. **Dynamic pricing rule overriding** → Check `/admin/pricing` rules
2. **Promotion expired** → Verify promotion dates
3. **Permission denied** → Check RBAC permissions

**Debug Steps:**
1. Use Price Preview tool to see applied rules
2. Check rule priorities (higher overrides lower)
3. Verify your admin user has `PERMISSIONS.PRODUCTS.EDIT`

### Missing Features

**Possible Causes:**
1. **Empty features array** → Add features in edit page
2. **Frontend filtering** → Check features rendering logic
3. **JSON parsing issue** → Verify array format in database

**Debug Steps:**
1. Check database: `SELECT features FROM service_packages WHERE id = '{id}'`
2. Verify array is not empty: `features IS NOT NULL AND array_length(features, 1) > 0`
3. Check frontend console for render errors

## Best Practices

### Pricing Changes
- ✅ Always add change reason for audit trail
- ✅ Use Price Preview before saving
- ✅ Test on staging environment first
- ✅ Communicate changes to marketing team
- ✅ Set appropriate promotion end dates

### Feature Updates
- ✅ Keep features concise (3-5 words max)
- ✅ Use consistent terminology
- ✅ Order features by importance
- ✅ Highlight unique selling points
- ✅ Match competitor terminology when relevant

### Product Activation
- ✅ Deactivate before major changes
- ✅ Test thoroughly before reactivating
- ✅ Use draft status for new products
- ✅ Schedule activation for off-peak hours

### Dynamic Pricing Rules
- ✅ Document business justification
- ✅ Set clear priority levels
- ✅ Review rules quarterly
- ✅ Monitor impact on sales
- ✅ Test rule conflicts before deploying

## Support & Resources

### Documentation
- Database Schema: `/supabase/migrations/20250101000001_create_coverage_system_tables.sql`
- API Routes: `/app/api/coverage/packages/route.ts`
- Frontend Page: `/app/packages/[leadId]/page.tsx`
- Admin Products: `/app/admin/products/page.tsx`
- Admin Pricing: `/app/admin/pricing/page.tsx`

### Tools
- Verification Script: `scripts/verify-product-pricing.ts`
- Migration Scripts: `scripts/apply-migration.js`
- Database Client: Supabase Studio (via NEXT_PUBLIC_SUPABASE_URL)

### Getting Help
- Check audit logs for recent changes
- Review pricing rules for conflicts
- Run verification script for diagnostics
- Contact development team with error details

---

**Last Updated:** 2025-01-15  
**Version:** 1.0.0  
**Maintained By:** CircleTel Development Team
