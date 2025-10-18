# Product Element Mapping: Screenshot to Database

## Visual Reference

This document maps each visual element in the package card (as shown in the screenshot) to its corresponding database field.

```
┌─────────────────────────────────────────────────────────────────┐
│                         PACKAGE CARD                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────┐    │
│  │ [HERO DEAL Badge]                      [Get this deal] │←─ UI Only
│  │                                                         │    │
│  │  HOMEFIBRECONNECT                      ←─ service_type │    │
│  │  ↓ Product Portfolio                                   │    │
│  │                                                         │    │
│  │  HomeFibre Premium                     ←─ name         │    │
│  │  ↓ Product Name (Large Header)                         │    │
│  │                                                         │    │
│  │  100Mbps Down / 50Mbps Up             ←─ speed_down    │    │
│  │  ↓ Download / Upload Speeds              & speed_up    │    │
│  │                                                         │    │
│  │  • Month-to-Month                     ←─ features[0]   │    │
│  │  • Free Installation                  ←─ features[1]   │    │
│  │  • Free-to-use Router                 ←─ features[2]   │    │
│  │  ↓ Product Features                                    │    │
│  │                                                         │    │
│  │  R 499.00                             ←─ promotion_price│   │
│  │  ↓ Current Price (Large)                               │    │
│  │                                                         │    │
│  │  R 789 for 3 months                   ←─ price &       │    │
│  │  ↓ Normal Price    ↓ Promo Duration      promotion_months│  │
│  │    (Strikethrough)                                     │    │
│  │                                                         │    │
│  │  per month                            ←─ UI text       │    │
│  │                                                         │    │
│  │  High speed fibre for demanding users ←─ description   │    │
│  │  ↓ Product Copy                                        │    │
│  │                                                         │    │
│  │              [Get this deal Button]                    │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## Field-by-Field Mapping

### 1. Product Portfolio Label
**Visual:** `HOMEFIBRECONNECT` (small uppercase label at top)  
**Database Field:** `service_type`  
**Data Type:** `VARCHAR(50)`  
**Example Values:**
- `HomeFibreConnect`
- `BizFibreConnect`
- `SkyFibre`
- `5g`
- `lte`

**Frontend Transform:**
```typescript
service_type?.toUpperCase() // "HomeFibreConnect" → "HOMEFIBRECONNECT"
```

**Admin Update:**
- Location: `/admin/products` → Edit → "Service Type" field
- Validation: Must match one of the allowed enum values
- Impact: Changes the small label at top of card

---

### 2. Product Name
**Visual:** `HomeFibre Premium` (large bold heading)  
**Database Field:** `name`  
**Data Type:** `VARCHAR(100) NOT NULL`  
**Example Values:**
- `HomeFibre Premium`
- `SkyFibre Pro`
- `BizFibre Essential`

**Frontend Display:**
```typescript
<h3 className="text-2xl md:text-3xl font-bold">
  {pkg.name}
</h3>
```

**Admin Update:**
- Location: `/admin/products` → Edit → "Product Name" field
- Validation: Required, max 100 characters
- Impact: Changes the main heading on package card

---

### 3. Speed Information
**Visual:** `100Mbps Down / 50Mbps Up`  
**Database Fields:** 
- `speed_down` (Download)
- `speed_up` (Upload)

**Data Type:** `INTEGER NOT NULL` (in Mbps)  
**Example Values:**
- `speed_down: 100, speed_up: 50` → "100Mbps Down / 50Mbps Up"
- `speed_down: 200, speed_up: 200` → "200Mbps Down / 200Mbps Up"

**Frontend Display:**
```typescript
<p className="text-sm md:text-base opacity-90">
  {pkg.speed_down}Mbps Down / {pkg.speed_up}Mbps Up
</p>
```

**Admin Update:**
- Location: `/admin/products` → Edit → "Download Speed" and "Upload Speed" fields
- Validation: Must be positive integers
- Impact: Changes the speed display text

---

### 4. Product Features
**Visual:** Bullet list with checkmarks
```
• Month-to-Month
• Free Installation
• Free-to-use Router
```

**Database Field:** `features`  
**Data Type:** `TEXT[]` (PostgreSQL array of strings)  
**Example Value:**
```json
[
  "Month-to-Month",
  "Free Installation",
  "Free-to-use Router",
  "Uncapped Internet"
]
```

**Frontend Display:**
```typescript
{pkg.features?.slice(0, 3).map((feature, idx) => (
  <div key={idx} className="flex items-start gap-2">
    <div className="w-1 h-1 rounded-full bg-current" />
    <span>{feature}</span>
  </div>
))}
```

**Admin Update:**
- Location: `/admin/products` → Edit → "Features" section
- Actions: Add, Remove, Reorder (drag & drop)
- Validation: Array of strings
- Impact: Changes the feature list on package card
- Note: Frontend shows first 3 features on card

---

### 5. Current Price (Promotional)
**Visual:** `R 499.00` (large bold text)  
**Database Field:** `promotion_price`  
**Data Type:** `DECIMAL(10,2)` (nullable)  
**Example Values:**
- `499.00` → "R 499.00"
- `NULL` → Falls back to `price`

**Frontend Logic:**
```typescript
const displayPrice = pkg.promotion_price || pkg.price;
```

**Admin Update:**
- Location: `/admin/products` → "Edit Price" → "Promotional Price" field
- Validation: Must be less than regular price (if set)
- Impact: Changes the large price display
- Note: If NULL, shows regular price instead

---

### 6. Normal Price (Regular)
**Visual:** `R 789` (smaller, strikethrough text)  
**Database Field:** `price`  
**Data Type:** `DECIMAL(10,2) NOT NULL`  
**Example Values:**
- `799.00` → "R 799"
- `1299.00` → "R 1299"

**Frontend Display:**
```typescript
{pkg.promotion_price && (
  <div className="text-sm opacity-70">
    <span className="line-through">R {pkg.price}</span>
  </div>
)}
```

**Admin Update:**
- Location: `/admin/products` → "Edit Price" → "Monthly Price" field
- Validation: Required, must be positive
- Impact: Shows as strikethrough when promo is active
- Note: Only visible when `promotion_price` is set

---

### 7. Promotion Duration
**Visual:** `for 3 months` (small text next to normal price)  
**Database Field:** `promotion_months`  
**Data Type:** `INTEGER DEFAULT 3`  
**Example Values:**
- `3` → "for 3 months"
- `6` → "for 6 months"
- `NULL` or `0` → Not displayed

**Frontend Display:**
```typescript
{pkg.promotion_price && (
  <span className="ml-2">for {pkg.promotion_months} months</span>
)}
```

**Admin Update:**
- Location: `/admin/products` → Edit → "Promotion Months" field
- Validation: Positive integer
- Impact: Shows duration next to regular price
- Note: Only relevant when `promotion_price` is set

---

### 8. Product Description (Copy)
**Visual:** `High speed fibre for demanding users` (small gray text)  
**Database Field:** `description`  
**Data Type:** `TEXT` (nullable)  
**Example Values:**
- `"High-speed fibre for demanding users"`
- `"Affordable Fixed Wireless for small businesses"`

**Frontend Display:**
```typescript
{pkg.description && (
  <p className="text-xs opacity-70 mb-4">
    {pkg.description}
  </p>
)}
```

**Admin Update:**
- Location: `/admin/products` → Edit → "Description" field
- Validation: Optional, recommended under 200 characters
- Impact: Shows as small text at bottom of card
- Note: Keep concise for card display

---

### 9. Active Status (Visibility Toggle)
**Visual:** Not directly visible on card (controls whether card appears)  
**Database Field:** `active`  
**Data Type:** `BOOLEAN DEFAULT true`  
**Values:**
- `true` → Package appears on frontend
- `false` → Package hidden from frontend

**Frontend Filter:**
```typescript
.eq('active', true) // Only fetch active packages
```

**Admin Update:**
- Location: `/admin/products` → Menu (⋮) → "Activate" / "Deactivate"
- Validation: Boolean toggle
- Impact: Shows/hides entire package card
- Note: Soft delete (can be reactivated)

---

### 10. Customer Type Filter
**Visual:** Not visible on card (controls who sees the package)  
**Database Field:** `customer_type`  
**Data Type:** `VARCHAR(20)`  
**Values:**
- `consumer` → Only shown to consumers
- `business` → Only shown to business customers
- `both` → Shown to both customer types
- `NULL` → Treated as "both"

**API Filter:**
```typescript
.in('customer_type', ['consumer', 'both']) // For consumer customers
.in('customer_type', ['business', 'both']) // For business customers
```

**Admin Update:**
- Location: `/admin/products` → Edit → "Customer Type" field
- Validation: Must be one of: consumer, business, both
- Impact: Controls visibility based on customer journey
- Note: Important for B2B vs B2C package separation

---

### 11. Product Category (Tab Filtering)
**Visual:** Controls which tab the package appears under  
**Database Field:** `product_category`  
**Data Type:** `VARCHAR(50)`  
**Values:**
- `wireless` → "Wireless" tab
- `fibre_consumer` → "Fibre" tab (consumer)
- `fibre_business` → "Fibre" tab (business)
- `5g` → "5G" tab
- `lte` → "Wireless" or "Mobile" tab

**Frontend Filter:**
```typescript
// Fibre tab
packages.filter(p => p.service_type?.toLowerCase() === 'fibre')

// Wireless tab
packages.filter(p => p.service_type?.toLowerCase() === 'wireless')
```

**Admin Update:**
- Location: `/admin/products` → Edit → "Product Category" field
- Validation: Should match service type
- Impact: Determines which filter tab shows the package
- Note: Used for frontend tab filtering

---

## Color Scheme Mapping

The package card background color is determined by `service_type`:

| Service Type | Background Color | Text Color | Badge Color |
|-------------|------------------|------------|-------------|
| `HomeFibreConnect` | Orange (#F97316) | White | Pink |
| `BizFibreConnect` | Blue (#60A5FA) | White | Pink |
| `SkyFibre` | Yellow (#FCD34D) | Dark Gray | Pink |
| `5g` | Teal (#14B8A6) | White | Pink |
| `lte` | Purple (#8B5CF6) | White | Pink |
| `wireless` | Green (#10B981) | White | Pink |
| Default | Indigo (#6366F1) | White | Pink |

**Code Location:** `/app/packages/[leadId]/page.tsx` → `colorSchemes` object

---

## Dynamic Pricing Integration

Some fields can be overridden by the dynamic pricing system:

### Pricing Fields with Dynamic Overrides

**1. Effective Price**
```typescript
const displayPrice = pricing?.effectivePrice || (pkg.promotion_price || pkg.price);
```
Priority:
1. Dynamic pricing rule result (`pricing.effectivePrice`)
2. Promotional price (`promotion_price`)
3. Regular price (`price`)

**2. Applied Rules Display**
```typescript
{pricing?.applied_rules && (
  <div className="text-xs text-blue-600">
    Applied: {pricing.applied_rules.join(', ')}
  </div>
)}
```

**3. Discount Badge**
```typescript
{pricing?.hasDiscount && (
  <span className="ml-2 text-green-600">
    ({Math.round(pricing.discountPercentage)}% OFF)
  </span>
)}
```

### Database Fields for Dynamic Pricing

**Table:** `pricing_rules`

**Key Fields:**
- `rule_name` - Rule identifier
- `rule_type` - geographic, time_based, volume, etc.
- `price_adjustment_type` - percentage, fixed_amount, multiplier
- `price_adjustment_value` - Adjustment amount
- `target_provinces` - Geographic targeting
- `priority` - Override priority (higher wins)

**Admin Location:** `/admin/pricing`

---

## Update Flow Summary

```
┌────────────────────────────────────────────────────────────────┐
│ ADMIN UPDATES A PRODUCT                                        │
│ (via /admin/products)                                          │
└──────────────────────┬─────────────────────────────────────────┘
                       │
                       ↓
┌────────────────────────────────────────────────────────────────┐
│ 1. Update service_packages table                               │
│    - name, price, features, etc.                               │
│    - Triggers updated_at timestamp                             │
│    - Creates product_audit_log entry                           │
└──────────────────────┬─────────────────────────────────────────┘
                       │
                       ↓
┌────────────────────────────────────────────────────────────────┐
│ 2. API Route fetches updated data                             │
│    (/api/coverage/packages)                                    │
│    - Applies dynamic pricing rules                             │
│    - Filters by customer_type                                  │
│    - Orders by sort_order                                      │
└──────────────────────┬─────────────────────────────────────────┘
                       │
                       ↓
┌────────────────────────────────────────────────────────────────┐
│ 3. Frontend displays updated card                              │
│    (/app/packages/[leadId]/page.tsx)                          │
│    - Renders with correct color scheme                         │
│    - Shows updated pricing                                     │
│    - Displays new features                                     │
└────────────────────────────────────────────────────────────────┘
```

**Time to Reflect:** Immediate (on next page load)

---

## Quick Reference Table

| Visual Element | Database Field | Type | Example | Admin Page |
|---------------|----------------|------|---------|-----------|
| Product Portfolio | `service_type` | VARCHAR(50) | HomeFibreConnect | Edit |
| Product Name | `name` | VARCHAR(100) | HomeFibre Premium | Edit |
| Download Speed | `speed_down` | INTEGER | 100 | Edit |
| Upload Speed | `speed_up` | INTEGER | 50 | Edit |
| Current Price | `promotion_price` | DECIMAL(10,2) | 499.00 | Edit Price |
| Normal Price | `price` | DECIMAL(10,2) | 799.00 | Edit Price |
| Promo Duration | `promotion_months` | INTEGER | 3 | Edit |
| Features | `features` | TEXT[] | ["Month-to-Month", ...] | Edit |
| Description | `description` | TEXT | High-speed fibre... | Edit |
| Visibility | `active` | BOOLEAN | true | Toggle |
| Customer Filter | `customer_type` | VARCHAR(20) | consumer | Edit |
| Category | `product_category` | VARCHAR(50) | fibre_consumer | Edit |

---

## Testing Checklist

After updating a product, verify these elements display correctly:

- [ ] Product name appears as main heading
- [ ] Service type shows as small uppercase label
- [ ] Speeds display in "XXXMbps Down / XXXMbps Up" format
- [ ] Current price shows as large text (promo or regular)
- [ ] Normal price shows as strikethrough (if promo active)
- [ ] Promotion duration shows next to normal price
- [ ] Features appear as bullet points (first 3 visible)
- [ ] Description shows as small gray text
- [ ] Card color matches service type
- [ ] Package only visible when `active = true`
- [ ] Package appears in correct customer type journey
- [ ] Dynamic pricing rules apply correctly (if any)

---

**Created:** 2025-01-15  
**Last Verified:** 2025-01-15 (via verify-product-pricing.ts)  
**Related Files:**
- Frontend: `/app/packages/[leadId]/page.tsx`
- API: `/app/api/coverage/packages/route.ts`
- Admin: `/app/admin/products/page.tsx`
- Database: `/supabase/migrations/20250101000001_create_coverage_system_tables.sql`
