# 🚀 Quick Test: MTN Deals Quote Workflow

## 5-Minute Quick Test

### Prerequisites
- ✅ Dev server running at `http://localhost:3000`
- ✅ Logged in as admin user

---

## Test Steps (Follow Along)

### 1. Browse MTN Deals (1 min)

**URL**: http://localhost:3000/admin/products/mtn-deals

**What to Check**:
- [ ] Stats cards show numbers (Total: 17,464)
- [ ] Deals grid loads with cards
- [ ] Search "Samsung" returns results
- [ ] Filter by "24 months" works

---

### 2. Create Quote with MTN Deal (4 min)

**URL**: http://localhost:3000/admin/quotes/new

#### Fill Form:
```
Company: Acme Business Solutions
Registration: 2021/654321/07
VAT: 4220987654
Contact: Jane Smith
Email: jane@acmebusiness.co.za
Phone: 0823456789
Address: West House, 7 Autumn Road, Rivonia, 2128
Contract: 24 months
```

#### Add MTN Deal:
1. Click **"Add MTN Deal"** button (orange)
2. Search for "Samsung"
3. Click "Add to Quote" on any deal
4. Verify TWO items added:
   - [ ] Device item (e.g., Samsung Galaxy S25 FE)
   - [ ] Service item (e.g., Made For Business S+)

#### Preview Quote:
1. Click **"Preview"** button (blue)
2. Check:
   - [ ] Orange CircleTel header
   - [ ] Customer info displayed
   - [ ] MTN deal section (orange background)
   - [ ] Service items table
   - [ ] Pricing summary correct
   - [ ] Footer with contact details

#### Submit Quote:
1. Close preview
2. Click **"Create Quote"**
3. Wait for redirect
4. Verify:
   - [ ] Quote detail page loads
   - [ ] Quote status: Draft
   - [ ] MTN deal reference shown
   - [ ] Pricing correct

---

## ✅ Pass Criteria

**Test PASSES if**:
- ✅ MTN deals page loads with data
- ✅ MTN deal selector opens
- ✅ Two items added (device + service)
- ✅ Preview shows professional layout
- ✅ Quote created successfully

**Test FAILS if**:
- ❌ Deals page shows no data
- ❌ MTN deal selector empty
- ❌ Items not adding to quote
- ❌ Preview shows errors
- ❌ Quote creation fails

---

## 🐛 Common Issues

### Issue: "No deals found"
**Solution**: Check database has deals imported
```bash
python scripts/import-mtn-deals.py --verify-only
```

### Issue: Dialog won't open
**Solution**: Check browser console for errors, refresh page

### Issue: Preview shows R0.00
**Solution**: Check pricing fields populated in database

---

## 📸 Expected Screenshots

### MTN Deals Page
![Expected: Grid of deal cards with stats at top]

### MTN Deal Selector
![Expected: Modal with search bar and filtered deals]

### Quote Preview
![Expected: Professional layout with orange header]

### Quote Detail
![Expected: Quote information with MTN deal reference]

---

## 🎯 Result

**My Test Result**: ☐ PASS ☐ FAIL

**Issues Found**:
1. _______________________________
2. _______________________________
3. _______________________________

**Notes**:
_______________________________________
_______________________________________

---

**Test Duration**: ~5 minutes  
**Difficulty**: Easy  
**Priority**: High

---

Need help? Check full test plan: `docs/testing/MTN_DEALS_QUOTE_WORKFLOW_TEST.md`
