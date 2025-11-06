# MTN Deals Quote Workflow - Complete Test Plan

## 🎯 Test Objective

Verify the end-to-end workflow of creating a business quote with MTN deals, previewing it, and submitting it successfully.

---

## ✅ Prerequisites

### 1. System Requirements
- [x] Development server running (`npm run dev:memory`)
- [x] Database migration applied (mtn_business_deals table)
- [x] 17,364 MTN deals imported
- [x] Admin user logged in

### 2. Test Data Prepared
- Sample company information
- Sample contact details
- Sample service address
- MTN deals available in database

---

## 📋 Test Scenarios

### **Scenario 1: Browse MTN Deals (Standalone)**

**URL**: `http://localhost:3000/admin/products/mtn-deals`

**Steps**:
1. Navigate to admin panel
2. Click Products > MTN Deals
3. Verify dashboard loads with stats cards
4. Check deals grid displays

**Expected Results**:
- ✅ Stats show: Total: 17,464, Active: ~17,364
- ✅ Deal cards show device, price plan, pricing
- ✅ Search bar functional
- ✅ Filters functional (contract term, platform)

**Pass Criteria**:
- All 4 stat cards display correct numbers
- Deals grid shows at least 50 deals
- Search returns filtered results
- Filters work correctly

---

### **Scenario 2: Create Quote WITHOUT MTN Deals**

**URL**: `http://localhost:3000/admin/quotes/new`

**Steps**:
1. Navigate to Create New Quote
2. Fill customer information:
   - Company: Test Company Pty Ltd
   - Registration: 2020/123456/07
   - VAT: 4110302991
   - Contact: John Doe
   - Email: john@testcompany.co.za
   - Phone: 0827225217
   - Address: 123 Main Road, Sandton, 2196
   - Contract: 24 months
3. Click "Add Service" button
4. Select a standard package (e.g., Fibre 100Mbps)
5. Click "Preview" button
6. Verify preview displays correctly
7. Close preview
8. Click "Create Quote"

**Expected Results**:
- ✅ Form validation works
- ✅ Service added to list
- ✅ Pricing calculated correctly
- ✅ Preview shows professional layout
- ✅ Quote created successfully
- ✅ Redirected to quote detail page

---

### **Scenario 3: Create Quote WITH MTN Deal (PRIMARY TEST)**

**URL**: `http://localhost:3000/admin/quotes/new`

**Steps**:

#### Step 1: Fill Customer Information
```
Company Name: Acme Business Solutions
Registration Number: 2021/654321/07
VAT Number: 4220987654
Contact Name: Jane Smith
Contact Email: jane@acmebusiness.co.za
Contact Phone: 0823456789
Service Address: West House, 7 Autumn Road, Rivonia, 2128
Contract Term: 24 months
```

#### Step 2: Add MTN Deal
1. Click **"Add MTN Deal"** button (orange border)
2. MTN Deal Selector dialog opens
3. Verify contract term filter shows "24 months"
4. Search for "Samsung" in search bar
5. Select a deal (e.g., "Samsung Galaxy S25 FE + Made For Business S+")
6. Click "Add to Quote"

**Expected**:
- ✅ Dialog closes
- ✅ Success toast: "Added MTN Deal: Samsung Galaxy S25 FE + Made For Business S+"
- ✅ TWO items added to services list:
  - **Item 1**: Samsung Galaxy S25 FE (Device) - R629/month
  - **Item 2**: Made For Business S+ (Service) - R349/month
- ✅ Pricing updates automatically
- ✅ Total shows R978/month (incl VAT)

#### Step 3: Review Pricing
Check sidebar pricing summary:
- Monthly Subtotal: R850.43 (ex VAT)
- Setup Fees: R0.00
- Subtotal: R850.43
- VAT (15%): R127.57
- **Total (Incl. VAT): R978.00**
- **Monthly Recurring: R978.00**

#### Step 4: Preview Quote
1. Click **"Preview"** button (blue)
2. Quote Preview Dialog opens
3. Verify layout:
   - ✅ Orange gradient header with "CircleTel"
   - ✅ Quote info bar (date, validity, contract term)
   - ✅ Customer information section
   - ✅ **MTN Business Deals section** (orange background)
     - Deal name displayed
     - Data, minutes, SMS shown
     - Contract term badge
   - ✅ Services & Pricing table
     - Device row with monthly device payment
     - Service row with monthly connectivity fee
   - ✅ Quote Summary sidebar
     - Correct totals
     - VAT breakdown
     - Monthly recurring highlighted
   - ✅ Terms & Conditions
   - ✅ Footer with contact details

#### Step 5: Generate PDF (Optional)
1. Click "Generate PDF" button in preview
2. PDF preview dialog opens
3. Verify PDF matches HTML preview

#### Step 6: Submit Quote
1. Close preview
2. Click **"Create Quote"** button
3. Wait for processing
4. Verify success toast
5. Redirected to quote detail page

**Expected on Detail Page**:
- ✅ Quote status: Draft
- ✅ Customer info displayed
- ✅ MTN deal reference stored
- ✅ Two line items shown
- ✅ Pricing correct
- ✅ Edit button available

---

### **Scenario 4: Add Multiple MTN Deals**

**Steps**:
1. Create new quote
2. Fill customer info (24-month contract)
3. Click "Add MTN Deal"
4. Select first deal (e.g., Samsung)
5. Click "Add to Quote"
6. Click "Add MTN Deal" again
7. Select second deal (e.g., iPhone)
8. Click "Add to Quote"
9. Preview quote

**Expected**:
- ✅ 4 items total (2 devices + 2 services)
- ✅ Pricing adds both deals correctly
- ✅ Preview shows 2 MTN deal callouts
- ✅ Services table shows all 4 line items

---

### **Scenario 5: Mix MTN Deal + Standard Service**

**Steps**:
1. Create new quote
2. Fill customer info
3. Add MTN deal
4. Add standard fibre service
5. Preview quote

**Expected**:
- ✅ MTN deal items + standard service item
- ✅ Total pricing includes all items
- ✅ Preview shows MTN section + regular services

---

### **Scenario 6: Use Recommendations Mode**

**Steps**:
1. Create new quote
2. Fill customer info
3. Click "Add MTN Deal"
4. Click "Recommended" button
5. System shows recommended deals
6. Select top recommendation
7. Add to quote

**Expected**:
- ✅ Recommendations appear
- ✅ Deals sorted by relevance
- ✅ Score-based sorting visible
- ✅ Can switch back to "Browse All"

---

### **Scenario 7: Contract Term Filtering**

**Test A: 12-Month Contract**
1. Set contract term to 12 months
2. Click "Add MTN Deal"
3. Verify deals filtered to 12 months only

**Test B: 36-Month Contract**
1. Change contract term to 36 months
2. Click "Add MTN Deal"
3. Verify deals filtered to 36 months

**Expected**:
- ✅ Deal selector auto-filters by contract term
- ✅ Only matching deals shown
- ✅ Count updates in UI

---

### **Scenario 8: Search & Filter Deals**

**Steps**:
1. Open MTN Deal Selector
2. Search for "iPhone"
3. Verify results
4. Clear search
5. Search for "Samsung"
6. Filter by "Helios" platform
7. Filter by "24 months"

**Expected**:
- ✅ Search returns relevant devices
- ✅ Platform filter works
- ✅ Contract filter works
- ✅ Filters combine correctly

---

### **Scenario 9: Empty State Handling**

**Steps**:
1. Create quote with 0 services
2. Try to preview
3. Try to submit

**Expected**:
- ✅ Error toast: "Please add at least one service"
- ✅ Preview button disabled
- ✅ Submit button disabled

---

### **Scenario 10: Edit Quote with MTN Deal**

**Steps**:
1. Create quote with MTN deal
2. Submit quote
3. Go to quote detail page
4. Click "Edit" button
5. Modify customer info
6. Save changes

**Expected**:
- ✅ Edit page loads
- ✅ MTN deal items preserved
- ✅ Can modify customer info
- ✅ Can add more items
- ✅ Quote updates successfully

---

## 🐛 Known Issues to Check

### Check for these potential issues:

1. **MTN Deal Not Showing Data Bundles**
   - Verify `total_data`, `total_minutes`, `sms_bundle` display
   
2. **Pricing Mismatch**
   - Verify monthly_price_incl_vat + device_payment_incl_vat = total

3. **Preview Layout Issues**
   - Check responsive design on different screen sizes
   - Verify print layout

4. **Dialog Not Closing**
   - Click outside dialog to test
   - Press Escape key to test

5. **Search Performance**
   - Test with 1000+ results
   - Verify pagination works

---

## 📊 Test Results Template

### Test Execution Record

**Date**: _____________  
**Tester**: _____________  
**Environment**: Development / Staging / Production  
**Browser**: Chrome / Firefox / Safari / Edge  

| Scenario | Status | Notes |
|----------|--------|-------|
| 1. Browse MTN Deals | ☐ Pass ☐ Fail | |
| 2. Quote Without MTN | ☐ Pass ☐ Fail | |
| 3. Quote With MTN (Primary) | ☐ Pass ☐ Fail | |
| 4. Multiple MTN Deals | ☐ Pass ☐ Fail | |
| 5. Mix MTN + Standard | ☐ Pass ☐ Fail | |
| 6. Recommendations Mode | ☐ Pass ☐ Fail | |
| 7. Contract Filtering | ☐ Pass ☐ Fail | |
| 8. Search & Filter | ☐ Pass ☐ Fail | |
| 9. Empty State | ☐ Pass ☐ Fail | |
| 10. Edit Quote | ☐ Pass ☐ Fail | |

---

## 🎯 Success Criteria

**Overall PASS if**:
- ✅ All primary scenarios (1-3) pass
- ✅ At least 8/10 scenarios pass
- ✅ No critical bugs found
- ✅ Performance acceptable (<3s load time)
- ✅ No data loss or corruption

**Critical Bugs** (MUST FIX):
- Quote creation fails
- Data not saving
- Pricing calculations wrong
- Preview not loading
- MTN deals not adding

**Minor Bugs** (Can defer):
- UI styling issues
- Search performance slow
- Toast notifications timing

---

## 🔧 Troubleshooting

### Issue: MTN Deal Selector Empty

**Check**:
```sql
SELECT COUNT(*) FROM mtn_business_deals WHERE active = true;
```
Should return ~17,364

**Fix**: Re-run import script

---

### Issue: Preview Shows R0.00

**Check**:
- Device payment field populated
- Monthly price field populated
- VAT calculation correct

**Debug**:
```javascript
console.log('Pricing:', pricing);
console.log('Items:', selectedItems);
```

---

### Issue: Dialog Won't Open

**Check**:
- Browser console for errors
- React DevTools for state
- Network tab for API calls

**Try**:
- Refresh page
- Clear browser cache
- Restart dev server

---

## 📝 Additional Test Cases

### Performance Tests
- [ ] Load time with 1000 deals
- [ ] Search response time
- [ ] Preview render time
- [ ] Quote submission time

### Security Tests
- [ ] XSS prevention in search
- [ ] SQL injection in filters
- [ ] Authentication required
- [ ] RLS policies enforced

### Accessibility Tests
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast sufficient
- [ ] Focus indicators visible

---

## 🚀 Next Steps After Testing

1. **Document bugs** in GitHub Issues
2. **Update documentation** with findings
3. **Create bug fix PRs** for critical issues
4. **Deploy to staging** for QA testing
5. **Train sales team** on new features
6. **Deploy to production** when ready

---

**Test Plan Version**: 1.0  
**Last Updated**: 2025-11-04  
**Status**: Ready for Testing  
**Priority**: High

---

## Quick Start Testing

### Fastest Path to Test Primary Feature:

```bash
# 1. Start dev server (already done)
npm run dev:memory

# 2. Login as admin
# URL: http://localhost:3000/admin/login

# 3. Create quote with MTN deal
# URL: http://localhost:3000/admin/quotes/new

# 4. Fill form → Add MTN Deal → Preview → Submit

# 5. Verify quote created successfully
```

**Expected Duration**: 10-15 minutes for complete primary test

---

**Happy Testing!** 🎉
