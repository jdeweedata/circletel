# CircleTel Admin Documentation

## Overview

This directory contains comprehensive documentation for the CircleTel admin panel, specifically focused on product pricing management and database alignment.

## 📚 Documentation Files

### 1. **PRODUCT_PRICING_ADMIN_GUIDE.md**
**Purpose:** Complete guide to managing product pricing through the admin interface

**Contents:**
- Database to frontend data flow
- Field mapping (screenshot to database)
- Admin interface walkthrough (/admin/products and /admin/pricing)
- Common tasks with step-by-step instructions
- Troubleshooting guide
- Best practices

**Use When:** You need detailed information about how the pricing system works

---

### 2. **ADMIN_QUICK_START.md**
**Purpose:** Fast 2-minute guide to update product pricing

**Contents:**
- Quick update tutorial (change price in 2 minutes)
- Alternative full edit walkthrough
- Testing checklist
- Common issues and fixes
- Pro tips

**Use When:** You just want to quickly update a product price

---

### 3. **PRODUCT_ELEMENT_MAPPING.md**
**Purpose:** Visual reference mapping screenshot elements to database fields

**Contents:**
- Visual diagram of package card with field annotations
- Detailed field-by-field breakdown
- Frontend code snippets
- Color scheme mapping
- Dynamic pricing integration
- Quick reference table

**Use When:** You need to know which database field controls which visual element

---

## 🛠️ Tools & Scripts

### Verification Script
**Location:** `/scripts/verify-product-pricing.ts`

**Purpose:** Verify database alignment with frontend display

**Usage:**
```bash
npx tsx scripts/verify-product-pricing.ts
```

**Output:**
- HomeFibre Premium verification (from screenshot)
- All active packages list
- Statistics and summaries
- Discrepancy detection

**When to Run:**
- After making pricing changes
- Before major releases
- During troubleshooting
- For auditing purposes

---

## 🚀 Quick Reference

### Admin Panel URLs

| Page | URL | Purpose |
|------|-----|---------|
| Products List | `/admin/products` | View and manage all products |
| Product Edit | `/admin/products/{id}/edit` | Edit product details |
| Pricing Dashboard | `/admin/pricing` | Manage dynamic pricing rules |
| Price Preview | `/admin/pricing` (tab) | Preview pricing with rules |

### Common Tasks

#### Update Product Price
1. Go to `/admin/products`
2. Find product → Menu (⋮) → "Edit Price"
3. Update price → Add reason → Save

**Time:** 30 seconds  
**Guide:** ADMIN_QUICK_START.md

#### Add Product Feature
1. Go to `/admin/products`
2. Find product → Menu (⋮) → "Edit"
3. Scroll to "Features" → Add/Edit
4. Save changes

**Time:** 1 minute  
**Guide:** PRODUCT_PRICING_ADMIN_GUIDE.md

#### Create Pricing Rule
1. Go to `/admin/pricing`
2. Click "New Pricing Rule"
3. Configure rule parameters
4. Save rule

**Time:** 2 minutes  
**Guide:** PRODUCT_PRICING_ADMIN_GUIDE.md

---

## 📊 Database Schema

### Primary Table: `service_packages`

**Key Fields:**

| Field | Type | Description | Frontend Element |
|-------|------|-------------|------------------|
| `name` | VARCHAR(100) | Product name | Card heading |
| `service_type` | VARCHAR(50) | Service category | Portfolio label |
| `speed_down` | INTEGER | Download speed (Mbps) | Speed display |
| `speed_up` | INTEGER | Upload speed (Mbps) | Speed display |
| `price` | DECIMAL(10,2) | Regular price | Strikethrough price |
| `promotion_price` | DECIMAL(10,2) | Promo price | Large price text |
| `promotion_months` | INTEGER | Promo duration | Duration text |
| `features` | TEXT[] | Feature list | Bullet points |
| `description` | TEXT | Description | Product copy |
| `active` | BOOLEAN | Visibility toggle | Show/hide card |
| `customer_type` | VARCHAR(20) | Customer filter | Journey filter |
| `product_category` | VARCHAR(50) | Category | Tab filter |

**Full Schema:** `supabase/migrations/20250101000001_create_coverage_system_tables.sql`

---

## ✅ Verification Results

**Status:** ✅ **ALIGNED**

Screenshot and database are **100% aligned** based on verification run on 2025-01-15.

### HomeFibre Premium Verification

| Element | Expected | Database | Status |
|---------|----------|----------|--------|
| Product Name | HomeFibre Premium | HomeFibre Premium | ✅ |
| Service Type | HomeFibreConnect | HomeFibreConnect | ✅ |
| Download Speed | 100 Mbps | 100 Mbps | ✅ |
| Upload Speed | 50 Mbps | 50 Mbps | ✅ |
| Promo Price | R 499 | R 499 | ✅ |
| Regular Price | R 799 | R 799 | ✅ |
| Promo Duration | 3 months | 3 months | ✅ |
| Features | 4 items | 4 items | ✅ |

**All fields verified correct!**

---

## 🔄 Data Flow

```
┌──────────────────────┐
│ ADMIN PANEL UPDATE   │
│ /admin/products      │
└──────────┬───────────┘
           │
           ↓
┌──────────────────────┐
│ SUPABASE DATABASE    │
│ service_packages     │
└──────────┬───────────┘
           │
           ↓
┌──────────────────────┐
│ API ROUTE            │
│ /api/coverage/       │
│ packages             │
└──────────┬───────────┘
           │
           ↓
┌──────────────────────┐
│ FRONTEND DISPLAY     │
│ /packages/[leadId]   │
└──────────────────────┘
```

**Update Time:** Immediate (on next page load)  
**Caching:** No server-side caching, browser cache only

---

## 🧪 Testing Workflow

### After Making Changes

1. **Run Verification Script**
   ```bash
   npx tsx scripts/verify-product-pricing.ts
   ```

2. **Check Admin Audit Log**
   - Go to `/admin/products`
   - Find product → Menu (⋮) → "View History"
   - Confirm change was logged

3. **Verify Frontend Display**
   - Open incognito window
   - Visit `/packages/test-lead-id`
   - Confirm visual changes

4. **Test Price Preview (if pricing changed)**
   - Go to `/admin/pricing` → "Price Preview"
   - Enter product ID
   - Verify calculated price

---

## 📋 Best Practices

### Before Making Changes
- [ ] Review current values (use verification script)
- [ ] Test pricing rules (use preview tool)
- [ ] Check for conflicting dynamic rules
- [ ] Note current audit log state

### While Making Changes
- [ ] Add descriptive change reasons
- [ ] Update only necessary fields
- [ ] Verify required fields are filled
- [ ] Check customer type and category

### After Making Changes
- [ ] Run verification script
- [ ] Test in incognito window
- [ ] Review audit log entry
- [ ] Communicate to team (if major change)

---

## 🚨 Troubleshooting

### Common Issues

**Issue:** Changes don't appear on frontend  
**Solution:** See ADMIN_QUICK_START.md → "Common Issues & Fixes"

**Issue:** Wrong price displayed  
**Solution:** Check dynamic pricing rules at `/admin/pricing`

**Issue:** Features missing  
**Solution:** Verify features array in database, add manually if needed

**Issue:** Wrong card color  
**Solution:** Check service_type field matches expected value

### Debug Tools

1. **Verification Script:** `npx tsx scripts/verify-product-pricing.ts`
2. **Audit Logs:** `/admin/products` → Menu (⋮) → "View History"
3. **Price Preview:** `/admin/pricing` → "Price Preview" tab
4. **Browser DevTools:** Check network tab for API responses
5. **Database Direct:** Query via Supabase Studio

---

## 📚 Additional Resources

### Related Documentation
- **CLAUDE.md:** Development guidelines
- **README.md:** Project overview
- **RBAC_SYSTEM_GUIDE.md:** Permissions and roles
- **DEPLOYMENT.md:** Deployment procedures

### External Tools
- **Supabase Studio:** Database management UI
- **Vercel Dashboard:** Deployment and analytics
- **GitHub:** Version control

### Support Channels
- Development Team: [Contact details]
- Documentation Issues: Create GitHub issue
- Feature Requests: Contact product manager

---

## 📝 Document Maintenance

**Last Updated:** 2025-01-15  
**Last Verified:** 2025-01-15 (via verify-product-pricing.ts)  
**Next Review:** Quarterly (April 2025)

### Update Checklist
- [ ] Run verification script
- [ ] Update screenshots if UI changed
- [ ] Verify all URLs still work
- [ ] Test all example commands
- [ ] Update version numbers

### Contributing
To update this documentation:
1. Make changes in relevant .md file
2. Update "Last Updated" date
3. Run verification script to confirm accuracy
4. Test all code examples
5. Submit PR with documentation changes

---

## 🎯 Quick Start for New Admins

**Never used the admin panel before? Start here:**

1. **Read:** ADMIN_QUICK_START.md (5 minutes)
2. **Practice:** Update a test product price
3. **Verify:** Run verification script
4. **Reference:** Keep PRODUCT_ELEMENT_MAPPING.md open while working
5. **Deep Dive:** Read PRODUCT_PRICING_ADMIN_GUIDE.md when needed

**Goal:** Be able to confidently update product pricing in under 2 minutes.

---

**Welcome to CircleTel Admin! 🚀**
