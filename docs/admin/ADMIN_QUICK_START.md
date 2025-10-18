# Admin Quick Start: Update Product Pricing in 2 Minutes

## 🎯 Objective
Update HomeFibre Premium promotional price from R499 to R449 and verify it displays correctly on the frontend.

## 📋 Prerequisites
- Admin access to http://localhost:3006/admin
- Test credentials: `admin@circletel.co.za` / `admin123` (dev mode)

## 🚀 Step-by-Step Guide

### Step 1: Access Admin Panel (30 seconds)

1. Open browser
2. Navigate to: `http://localhost:3006/admin/products`
3. Login if prompted (dev mode auto-authenticates)

### Step 2: Find the Product (20 seconds)

1. Use search bar at top
2. Type: "HomeFibre Premium"
3. Product appears in filtered list

### Step 3: Update Price (40 seconds)

1. Click the menu icon (⋮) next to "HomeFibre Premium"
2. Select **"Edit Price"** from dropdown
3. Modal opens showing current pricing:
   ```
   Monthly Price: 799.00
   Promotional Price: 499.00
   Setup Fee: 0.00
   ```
4. Change "Promotional Price" to: `449.00`
5. In "Change Reason" field, type: `January special promotion`
6. Click **"Save Changes"**
7. Success toast appears: "Product updated successfully"

### Step 4: Verify Frontend (30 seconds)

1. Open new browser tab (or incognito window)
2. Navigate to: `http://localhost:3006/packages/test-lead-id`
   (Replace `test-lead-id` with actual lead ID from coverage check)
3. Find "HomeFibre Premium" card
4. Verify changes:
   - ✅ Large price now shows: **R 449.00**
   - ✅ Strikethrough price: R 789
   - ✅ Text: "for 3 months per month"

**Done!** ✨

---

## 🔄 Alternative: Full Product Edit

If you need to change more than just pricing:

### Access Full Edit Page

1. From `/admin/products`
2. Click menu (⋮) → **"Edit"** (not "Edit Price")
3. Redirects to: `/admin/products/{product-id}/edit`

### Available Fields

**Basic Information:**
- Product Name
- SKU
- Category
- Service Type
- Customer Type
- Product Category

**Pricing:**
- Monthly Price (regular)
- Promotional Price
- Promotion Months
- Setup Fee
- Cost Price (for margin calculations)

**Specifications:**
- Download Speed (Mbps)
- Upload Speed (Mbps)
- Data Allocation
- Contract Terms

**Features:**
- Add new features (click "+ Add Feature")
- Remove features (click X)
- Reorder features (drag & drop)

**Description:**
- Short Description (for card display)
- Long Description (for product page)

**Display Options:**
- Active/Inactive toggle
- Featured toggle
- Popular toggle
- Sort Order (for list ordering)

**Save Options:**
- "Save Changes" → Updates product
- "Save as Draft" → Saves but keeps inactive
- "Cancel" → Discards changes

---

## 🎨 Update Multiple Elements (Extended Example)

### Scenario: Rebrand HomeFibre Premium for Q1 Campaign

**Changes Needed:**
1. Update name to "HomeFibre Premium Plus"
2. Change promo price to R449
3. Add new feature: "Free Wi-Fi 6 Router"
4. Update description

**Steps:**

1. **Navigate:** `/admin/products` → Find "HomeFibre Premium" → Menu (⋮) → "Edit"

2. **Update Name:**
   - Change "HomeFibre Premium" to "HomeFibre Premium Plus"

3. **Update Pricing:**
   - Scroll to "Pricing" section
   - Change "Promotional Price" to `449.00`
   - Promo Months: Keep at `3`

4. **Add Feature:**
   - Scroll to "Features" section
   - Click "+ Add Feature" button
   - Type: "Free Wi-Fi 6 Router Included"
   - Drag to position 1 (top of list)

5. **Update Description:**
   - Scroll to "Description" section
   - Change to: "Premium ultra-fast fibre with Wi-Fi 6 technology for modern smart homes"

6. **Save:**
   - Add change reason: "Q1 2025 campaign rebrand"
   - Click "Save Changes"

7. **Verify:**
   - Frontend shows:
     - ✅ New name: "HomeFibre Premium Plus"
     - ✅ New price: R 449.00
     - ✅ New feature at top: "Free Wi-Fi 6 Router Included"
     - ✅ New description text

**Time:** ~3 minutes

---

## 🧪 Testing Your Changes

### Quick Frontend Test

**Method 1: Direct URL**
```
http://localhost:3006/packages/[any-lead-id]
```
Replace `[any-lead-id]` with any UUID (can be test value)

**Method 2: Coverage Check Flow**
1. Go to homepage: `http://localhost:3006`
2. Enter address in coverage checker
3. Submit to create lead
4. Redirects to packages page automatically

**Method 3: Incognito/Private Window**
- Ensures no caching issues
- Shows exactly what customers see

### What to Verify

**Visual Elements:**
- [ ] Product name displays correctly
- [ ] Speeds show in correct format
- [ ] Price updates are visible
- [ ] Features list is accurate
- [ ] Description text is correct
- [ ] Card color matches service type

**Functional Elements:**
- [ ] "Get this deal" button works
- [ ] Package can be selected
- [ ] Continue to order flow works
- [ ] Pricing calculations are correct

### Verify in Database (Optional)

```bash
npx tsx scripts/verify-product-pricing.ts
```

Shows:
- Current database values
- All active packages
- Field mappings
- Discrepancy detection

---

## 🔍 Audit Trail

Every change is automatically logged. To view:

1. Go to `/admin/products`
2. Find the product you changed
3. Click menu (⋮) → **"View History"**
4. Modal shows:
   - Who made changes
   - When changes were made
   - What fields changed
   - Before/after values
   - Change reasons

**Example Entry:**
```
2025-01-15 14:32:15
User: admin@circletel.co.za
Action: Updated product pricing
Changes:
  - promotion_price: 499.00 → 449.00
Reason: January special promotion
```

---

## 🚨 Common Issues & Fixes

### Issue: Changes don't appear on frontend

**Causes:**
1. Browser cache
2. Product is inactive
3. Wrong customer type filter
4. Dynamic pricing rule overriding

**Fixes:**
1. Hard refresh: Ctrl + Shift + R (Windows) or Cmd + Shift + R (Mac)
2. Check "Active" status in admin (should be ✅)
3. Verify `customer_type` matches (consumer/business/both)
4. Check `/admin/pricing` for conflicting rules

### Issue: Price shows different value

**Cause:** Dynamic pricing rule is overriding

**Fix:**
1. Go to `/admin/pricing`
2. Check "Pricing Rules" tab
3. Look for rules affecting this product
4. Disable or adjust rule priority
5. Use "Price Preview" tool to test

### Issue: Features not appearing

**Cause:** Features array might be empty or null

**Fix:**
1. Edit product
2. Add features manually
3. Ensure features are saved
4. Verify in database: Run verification script

### Issue: Wrong card color

**Cause:** Service type doesn't match color scheme

**Fix:**
1. Edit product
2. Verify "Service Type" field
3. Must be one of:
   - HomeFibreConnect → Orange
   - BizFibreConnect → Blue
   - SkyFibre → Yellow
   - 5g → Teal
   - lte → Purple
   - wireless → Green

---

## 📊 Advanced: Bulk Updates

For updating multiple products at once:

### Using Dynamic Pricing Rules

**Best for:** Applying percentage discounts across categories

1. Go to `/admin/pricing`
2. Click "New Pricing Rule"
3. Configure:
   - Rule Type: Select based on criteria
   - Adjustment: e.g., "-10" for 10% off
   - Target: Province, customer type, etc.
   - Priority: Set appropriately
4. Save rule
5. Affects all matching products immediately

**Example Use Cases:**
- 10% off all Gauteng packages
- R50 discount for business customers
- 15% Black Friday sale on all consumer packages
- 20% off during off-peak hours

### Future: Bulk Edit Tool (Coming Soon)

Currently in development:
- Select multiple products
- Update prices in batch
- Bulk activate/deactivate
- Mass feature updates

---

## 🎓 Pro Tips

### Tip 1: Preview Before Saving
Always use "Price Preview" tool in `/admin/pricing` to see the final price with all rules applied

### Tip 2: Use Change Reasons
Good change reasons help track decisions:
- ✅ "Q1 2025 promotional campaign"
- ✅ "Competitor price matching"
- ❌ "Updated" (too vague)

### Tip 3: Test in Incognito
Avoid caching issues by testing changes in private/incognito window

### Tip 4: Schedule Off-Peak Updates
For major pricing changes, update during low-traffic hours (late evening)

### Tip 5: Keep Backups
Before bulk changes, run verification script to snapshot current state:
```bash
npx tsx scripts/verify-product-pricing.ts > backup-$(date +%Y%m%d).txt
```

---

## 📚 Related Documentation

- **Full Admin Guide:** `docs/admin/PRODUCT_PRICING_ADMIN_GUIDE.md`
- **Element Mapping:** `docs/admin/PRODUCT_ELEMENT_MAPPING.md`
- **Verification Script:** `scripts/verify-product-pricing.ts`
- **Database Schema:** `supabase/migrations/20250101000001_create_coverage_system_tables.sql`

---

## 🆘 Need Help?

**Quick Checks:**
1. Run verification script: `npx tsx scripts/verify-product-pricing.ts`
2. Check audit logs in admin panel
3. Review pricing rules in `/admin/pricing`
4. Test in incognito window

**Contact:**
- Development Team: [Contact details]
- Documentation: `docs/admin/` folder
- Database Access: Supabase Studio

---

**Last Updated:** 2025-01-15  
**Version:** 1.0  
**Tested On:** CircleTel Next.js v15 Admin Panel
