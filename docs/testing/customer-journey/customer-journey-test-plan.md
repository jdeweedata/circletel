# Customer Journey Testing Plan

**Date Created:** 2025-10-03
**Testing Tool:** Chrome DevTools MCP + Manual Testing
**Related:** [Customer Journey Analysis](customer-journey-analysis.md)

## Overview

This document provides a comprehensive testing plan for the customer journey from coverage check to order placement, based on the friction points identified in the customer journey analysis.

---

## Test Environment Setup

### Prerequisites
- ✅ Development server running on http://localhost:3000
- ✅ Chrome with remote debugging enabled (port 9222)
- ✅ Chrome DevTools MCP server configured
- ✅ Supabase database accessible
- ✅ Test coverage API endpoints available

### Test Data
- **Test Address:** "18 Rasmus Erasmus, Centurion, 0157"
- **Test Coordinates:** -25.8601, 28.1872 (Centurion CBD)
- **Expected Services:** SkyFibre, HomeFibreConnect
- **Test Package:** 50Mbps Fibre package

---

## Test Scenarios

### Scenario 1: Consumer Journey - Happy Path

**Objective:** Verify smooth flow from homepage to order placement

#### Test Steps

**Step 1: Homepage Load**
- **URL:** http://localhost:3000
- **Action:** Navigate to homepage
- **Verify:**
  - [ ] Hero section displays "Fast Internet from R359 PM"
  - [ ] Coverage checker is visible and prominent
  - [ ] All three feature cards display correctly
  - [ ] No console errors
- **Screenshot:** `.playwright-mcp/customer-journey/01-homepage-loaded.png`
- **Expected Time:** < 2 seconds

**Step 2: Coverage Check - Enter Address**
- **Action:** Type address in coverage checker
- **Input:** "18 Rasmus Erasmus, Centurion"
- **Verify:**
  - [ ] Address autocomplete appears
  - [ ] Google Places suggestions show
  - [ ] Input is clearly visible
  - [ ] "Show me my deals" button becomes enabled
- **Screenshot:** `.playwright-mcp/customer-journey/02-address-entered.png`
- **Expected Time:** < 500ms response

**Step 3: Coverage Check - Submit**
- **Action:** Click "Show me my deals" button
- **Verify:**
  - [ ] Button shows loading spinner
  - [ ] Loading text: "Checking coverage..."
  - [ ] **FRICTION POINT:** No progress indicator for 3 API calls
  - [ ] No error messages appear
- **Monitor Network:**
  - [ ] POST /api/geocode (Response: 200)
  - [ ] POST /api/coverage/lead (Response: 200, returns leadId)
  - [ ] GET /api/coverage/packages?leadId={id} (Response: 200)
- **Screenshot:** `.playwright-mcp/customer-journey/03-coverage-checking.png`
- **Expected Time:** 2-4 seconds total

**Step 4: Redirect to Packages Page**
- **Action:** Automatic redirect after coverage check
- **Verify:**
  - [ ] Redirect to /packages/{leadId}
  - [ ] **FRICTION POINT:** Check if redirect is smooth (no flash)
  - [ ] URL contains valid leadId
- **Screenshot:** `.playwright-mcp/customer-journey/04-redirect-packages.png`
- **Expected Time:** < 500ms

**Step 5: Package Selection Page Load**
- **URL:** http://localhost:3000/packages/{leadId}
- **Verify:**
  - [ ] Hero shows "Great News! We've Got You Covered"
  - [ ] Address displays correctly
  - [ ] Package cards render with colors
  - [ ] Tab filters work (All, Fibre, Wireless, 5G)
  - [ ] Promotional pricing displays correctly
- **Screenshot:** `.playwright-mcp/customer-journey/05-packages-displayed.png`
- **Expected Time:** < 1 second

**Step 6: Package Selection**
- **Action:** Click on a package card (50Mbps Fibre)
- **Verify:**
  - [ ] Package card highlights or shows selection state
  - [ ] **FRICTION POINT:** Must scroll to find "Sign up now" button
  - [ ] Button appears below package grid
- **Screenshot:** `.playwright-mcp/customer-journey/06-package-selected.png`
- **Improvement Needed:** Floating CTA button

**Step 7: Navigate to Order Page**
- **Action:** Click "Get this deal" on package card
- **Verify:**
  - [ ] Redirect to /order?package={id}&leadId={leadId}
  - [ ] **CRITICAL FRICTION:** Check for redirect loop to /order/coverage
  - [ ] Order form loads
- **Monitor:**
  - [ ] Network tab for unnecessary redirects
  - [ ] Console for errors
- **Screenshot:** `.playwright-mcp/customer-journey/07-order-redirect.png`
- **Expected:** Direct load (no intermediate redirects)

**Step 8: Order Form**
- **URL:** http://localhost:3000/order/coverage (after redirect)
- **Verify:**
  - [ ] Order wizard displays
  - [ ] Progress indicator shows current step
  - [ ] Form fields are accessible
  - [ ] Order summary sidebar is sticky
- **Screenshot:** `.playwright-mcp/customer-journey/08-order-form.png`

---

### Scenario 2: Consumer Journey - Home Internet Variant

**Objective:** Test the better UX flow via /home-internet

#### Test Steps

**Step 1: Navigate to Home Internet**
- **URL:** http://localhost:3000/home-internet
- **Verify:**
  - [ ] Coverage hero displays
  - [ ] Packages display immediately (no coverage check required)
  - [ ] Filtering works

**Step 2: Select Package**
- **Action:** Click package
- **Verify:**
  - [ ] Direct link to /home-internet/order?package={id}
  - [ ] **NO redirect loop** (better than generic flow)
  - [ ] Progress bar shows 3 steps clearly

**Step 3: Order Form**
- **URL:** http://localhost:3000/home-internet/order
- **Verify:**
  - [ ] Single-page form with sidebar
  - [ ] Progress indicator (Step 1 of 3)
  - [ ] Sticky order summary
  - [ ] Better UX than generic /order flow

---

### Scenario 3: Business Customer Journey (Gap Analysis)

**Objective:** Document missing business customer flow

#### Current State Issues

**Step 1: Entry Point Missing**
- **Expected:** /business or /enterprise landing page
- **Actual:** ❌ No dedicated entry point
- **Impact:** Business customers use consumer flow

**Step 2: Coverage Check (Same as Consumer)**
- **Issue:** No company size or business details fields
- **Missing:**
  - [ ] Company name
  - [ ] Number of employees
  - [ ] Business location type
  - [ ] Multi-site indicator

**Step 3: Package Display (Mixed)**
- **Issue:** BizFibreConnect packages mixed with consumer
- **Missing:**
  - [ ] Business-specific filters
  - [ ] SLA information
  - [ ] Uptime guarantees
  - [ ] Dedicated support tiers
  - [ ] ROI messaging

**Step 4: No Quote System**
- **Issue:** "Order Now" CTA inappropriate for B2B
- **Expected:** "Request Quote" or "Contact Sales"
- **Missing:**
  - [ ] PDF quote generation
  - [ ] Multi-location support
  - [ ] Custom pricing options
  - [ ] Account manager assignment

---

## Performance Testing

### Metrics to Track

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Homepage Load | < 2s | TBD | ⏳ |
| Coverage Check (3 API calls) | < 3s | 2-4s | ⚠️ |
| Package Page Load | < 1s | TBD | ⏳ |
| Order Form Load | < 1s | TBD | ⏳ |
| Total Time to Order Form | < 7s | TBD | ⏳ |

### Network Analysis

**Coverage Check API Waterfall:**
```
1. POST /api/geocode           (500-800ms)
   ↓
2. POST /api/coverage/lead     (200-400ms)
   ↓
3. GET /api/coverage/packages  (1000-2000ms)
   ================================
   Total: 2-4 seconds
```

**Optimization Opportunity:** Parallel processing or single endpoint

---

## Friction Points Testing

### Critical Issues to Verify

#### 1. Redirect Loop at /order
- **File:** [app/order/page.tsx:14](../app/order/page.tsx#L14)
- **Test:**
  1. Navigate to /order?package=1&leadId=123
  2. Monitor DevTools Network tab
  3. Count redirects
- **Expected:** 2 redirects (/order → /order/coverage)
- **Desired:** 1 or 0 redirects

#### 2. Missing Floating CTA
- **File:** [components/coverage/CoverageChecker.tsx:287](../components/coverage/CoverageChecker.tsx#L287)
- **Test:**
  1. Select a package on coverage results
  2. Measure distance to "Sign up now" button
  3. Check if button is in viewport
- **Expected:** Must scroll ~500px
- **Desired:** Floating CTA or inline button

#### 3. No Progress Indicator
- **File:** [components/coverage/CoverageChecker.tsx:218](../components/coverage/CoverageChecker.tsx#L218)
- **Test:**
  1. Click "Show me my deals"
  2. Observe loading state
  3. Count visible progress indicators
- **Expected:** Generic spinner only
- **Desired:** Multi-stage progress (Location → Coverage → Packages)

#### 4. Lead Source Not Tracked
- **File:** [app/api/coverage/lead/route.ts](../app/api/coverage/lead/route.ts)
- **Test:**
  1. Navigate from different sources (?utm_source=google)
  2. Check lead record in database
  3. Verify utm_source field
- **Expected:** ❌ No UTM tracking
- **Desired:** Source attribution

---

## Mobile Responsiveness Testing

### Viewports to Test

| Device | Width | Height | Screenshot |
|--------|-------|--------|------------|
| Mobile S | 320px | 568px | `.playwright-mcp/mobile/mobile-small-*.png` |
| Mobile M | 375px | 667px | `.playwright-mcp/mobile/mobile-medium-*.png` |
| Mobile L | 425px | 812px | `.playwright-mcp/mobile/mobile-large-*.png` |
| Tablet | 768px | 1024px | `.playwright-mcp/mobile/tablet-*.png` |
| Laptop | 1024px | 768px | - |
| Desktop | 1920px | 1080px | - |

### Mobile-Specific Tests

**Coverage Checker on Mobile:**
- [ ] Input field is large enough (min 44px height)
- [ ] Button text is readable
- [ ] No horizontal scroll
- [ ] Address autocomplete dropdown fits viewport

**Package Cards on Mobile:**
- [ ] Stack vertically
- [ ] Cards are tappable (min 44px tap target)
- [ ] Price is prominent
- [ ] CTA buttons are accessible

---

## Accessibility Testing

### WCAG 2.1 AA Compliance

**Keyboard Navigation:**
- [ ] Tab through coverage form
- [ ] Select package with keyboard
- [ ] Submit order without mouse

**Screen Reader:**
- [ ] Form labels are associated
- [ ] Loading states announced
- [ ] Error messages readable

**Color Contrast:**
- [ ] Orange (#F5831F) on white meets 4.5:1
- [ ] Button text meets contrast requirements
- [ ] Error messages visible to colorblind users

---

## Error Handling Testing

### No Coverage Available
- **Address:** "123 Rural Road, Middle of Nowhere"
- **Expected:**
  - [ ] "Service coming soon" message
  - [ ] Lead capture form appears
  - [ ] No errors in console

### API Failures
- **Test:** Disable network during coverage check
- **Expected:**
  - [ ] Graceful error message
  - [ ] Fallback to Supabase function
  - [ ] No infinite loading

### Invalid LeadId
- **Test:** Navigate to /packages/invalid-uuid
- **Expected:**
  - [ ] 404 or redirect to homepage
  - [ ] No crash
  - [ ] Clear error message

---

## Chrome DevTools MCP Test Commands

Once MCP tools are available, use these commands:

### Navigation
```javascript
// Navigate to homepage
navigate("http://localhost:3000")

// Take screenshot
screenshot("homepage-initial.png")

// Fill coverage form
fill("input[placeholder*='Enter your address']", "18 Rasmus Erasmus, Centurion")

// Click button
click("button:has-text('Show me my deals')")

// Wait for navigation
waitFor("h1:has-text('Great News')")

// Take screenshot of packages
screenshot("packages-loaded.png")
```

### Network Monitoring
```javascript
// Enable network monitoring
const requests = await getNetworkRequests()

// Filter coverage API calls
const coverageAPIs = requests.filter(r => r.url.includes('/api/coverage'))
console.log(`Coverage API calls: ${coverageAPIs.length}`)
console.log(`Total time: ${coverageAPIs.reduce((sum, r) => sum + r.time, 0)}ms`)
```

### DOM Inspection
```javascript
// Check for redirect loop
const currentUrl = await evaluateScript("window.location.href")
console.log(`Current URL: ${currentUrl}`)

// Count package cards
const packageCount = await evaluateScript("document.querySelectorAll('[data-package-card]').length")
console.log(`Package cards displayed: ${packageCount}`)

// Check if CTA is in viewport
const ctaVisible = await evaluateScript(`
  const btn = document.querySelector('button:has-text("Sign up now")');
  const rect = btn.getBoundingClientRect();
  rect.top >= 0 && rect.bottom <= window.innerHeight;
`)
console.log(`CTA in viewport: ${ctaVisible}`)
```

---

## Test Results Template

### Test Session: [Date]

**Environment:**
- Browser: Chrome [version]
- Viewport: 1920x1080
- Network: Fast 3G / 4G / WiFi

**Results:**

| Test Case | Status | Time | Notes |
|-----------|--------|------|-------|
| Homepage Load | ✅ / ❌ | Xs | |
| Coverage Check | ✅ / ❌ | Xs | |
| Package Load | ✅ / ❌ | Xs | |
| Order Navigation | ✅ / ❌ | Xs | |

**Friction Points Observed:**
1.
2.
3.

**Bugs Found:**
- [ ] Bug #1: Description
- [ ] Bug #2: Description

**Screenshots Captured:**
- [ ] `.playwright-mcp/testing-session-[date]/`

---

## Continuous Testing

### Automated Testing (Future)

Create Playwright test suite:
```typescript
// tests/customer-journey.spec.ts
test('consumer journey happy path', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.fill('input[placeholder*="address"]', '18 Rasmus Erasmus, Centurion');
  await page.click('button:has-text("Show me my deals")');
  await page.waitForURL('**/packages/**');
  await expect(page.locator('h1')).toContainText('Great News');
});
```

### CI/CD Integration
- Run tests on every PR
- Capture screenshots on failure
- Track performance metrics over time
- Alert on conversion funnel drops

---

## Next Steps

1. **Complete manual testing** using this plan
2. **Document results** in test session report
3. **File bugs** for critical friction points
4. **Implement fixes** based on priority
5. **Re-test** after improvements
6. **Automate** with Playwright suite

---

**Document Version:** 1.0
**Last Updated:** 2025-10-03
**Created By:** Claude Code Analysis
**Related:** [Customer Journey Analysis](customer-journey-analysis.md)