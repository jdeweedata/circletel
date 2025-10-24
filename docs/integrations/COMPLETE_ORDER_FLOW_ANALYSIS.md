# Complete Order Flow Analysis

**Date:** 2025-10-22
**Purpose:** Document the correct order flow for Netcash payment integration testing

---

## 🔍 Order Flow Discovery

After investigating the codebase, I've identified **TWO SEPARATE ORDER SYSTEMS** that are causing confusion:

### ❌ System 1: Old "/order" Flow (Incomplete)
**Entry Point:** `/order` → `/order/coverage` → `/order/account` → `/order/contact`

**Status:** 🚧 **PLACEHOLDER / UNDER DEVELOPMENT**

**Evidence:**
- `app/order/coverage/page.tsx` contains: "🚧 Coverage checking integration coming in OSI-001-02"
- This flow doesn't connect to the packages page
- Appears to be a future refactor/replacement

**Files:**
```
app/order/page.tsx                  → Redirects to /order/coverage
app/order/coverage/page.tsx         → Placeholder page
app/order/account/page.tsx          → Account form (not fully integrated)
app/order/contact/page.tsx          → Contact details
app/order/installation/page.tsx     → Installation details
app/order/payment/page.tsx          → Payment stage
app/order/confirmation/page.tsx     → Order confirmation
```

---

### ✅ System 2: Active "/packages" Flow (Current Production)
**Entry Point:** Homepage → Coverage Check → `/packages/{leadId}` → Package Selection → `/order/account`

**Status:** ✅ **ACTIVE AND FUNCTIONAL**

**Evidence:**
- `app/packages/[leadId]/page.tsx` contains working `handlePackageSelect()` and `handleContinue()` functions
- Integrates with `OrderContext` for state management
- Line 162: `router.push('/order/account')` - navigates to account page after package selection
- Includes sidebar with "Continue" button that triggers order flow

---

## ✅ Correct Order Flow (Step-by-Step)

### **Step 1: Homepage - Address Input**
**URL:** `/`

**User Action:**
1. User enters address in coverage checker input
2. Clicks "Check coverage" button

**What Happens:**
- Coverage check API called
- Lead ID generated
- Redirects to `/packages/{leadId}?type=residential` or `type=business`

**Technical Details:**
- Component: `CoverageChecker.tsx`
- API: `POST /api/coverage/check`
- Response includes: lead ID, coordinates, available providers

---

### **Step 2: Package Selection**
**URL:** `/packages/{leadId}?type=residential`

**What User Sees:**
- Address confirmation at top
- Service type tabs: Fibre (5) | Wireless (6)
- Grid of available packages with:
  - Package name (e.g., "HomeFibre Basic")
  - Speed (Download/Upload Mbps)
  - Price (with promotion pricing if available)
  - Features list
  - **"Order Now" button**

**User Action:**
1. Browse available packages
2. Click "Order Now" on desired package

**What Happens:**
```javascript
// From app/packages/[leadId]/page.tsx:112
handlePackageSelect(pkg) {
  setSelectedPackage(pkg);          // Store in local state
  setIsMobileSidebarOpen(true);     // Show sidebar with package details

  // Save to OrderContext (persisted to localStorage)
  actions.updateOrderData({
    coverage: {
      leadId,
      address,
      selectedPackage,              // Full package details
      pricing: { ... }              // Price breakdown
    }
  });

  // Scroll to top to show sidebar
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
```

**Result:**
- Package details sidebar appears on desktop (right side)
- Mobile overlay appears on mobile devices
- Sidebar shows:
  - Selected package summary
  - Speed details
  - Price breakdown
  - **"Continue to Order" button**

---

### **Step 3: Confirm Package Selection**
**URL:** Still on `/packages/{leadId}`

**User Sees:**
- Sidebar/Overlay with package details
- **"Continue to Order"** button (or similar)

**User Action:**
1. Review package details in sidebar
2. Click "Continue to Order" button

**What Happens:**
```javascript
// From app/packages/[leadId]/page.tsx:157
handleContinue() {
  if (selectedPackage) {
    actions.markStepComplete(1);        // Mark coverage step complete
    actions.setCurrentStage(2);         // Move to account step
    router.push('/order/account');      // Navigate to account page
  }
}
```

**Result:**
- OrderContext state updated (stage 1 complete, stage 2 active)
- Navigation to `/order/account`

---

### **Step 4: Account Creation**
**URL:** `/order/account`

**What User Sees:**
- Progress indicator: "Step 2: Create Account (current)"
- Account type selection (Personal/Business)
- Form fields:
  - First Name
  - Last Name
  - Email Address
  - Phone Number
- Order summary sidebar (showing selected package)
- **"Continue to Installation Details"** button

**User Action:**
1. Fill in all required fields
2. Click "Continue to Installation Details"

**What Happens:**
- Form validation runs
- Account data saved to OrderContext
- Navigation to `/order/contact` or `/order/installation`

---

### **Step 5: Contact & Installation Details**
**URL:** `/order/contact` and/or `/order/installation`

**User Action:**
1. Provide installation address
2. Select installation date/time preferences
3. Additional contact details

**What Happens:**
- Installation data saved to OrderContext
- Navigation to `/order/payment`

---

### **Step 6: Payment**
**URL:** `/order/payment`

**What User Sees:**
- Order summary
- Total amount
- Payment method selection
- **Netcash payment button**

**User Action:**
1. Review order details
2. Click "Pay with Credit Card" or similar

**What Happens:**
```javascript
// Payment initiation
1. Create order in database (status: 'pending')
2. Generate Netcash payment request
3. Redirect to Netcash payment page

// Netcash Payment Page (external)
4. User enters card details
5. Netcash processes payment
6. Netcash sends webhook to:
   POST https://circletel-staging.vercel.app/api/payment/netcash/webhook

// Webhook Processing
7. Verify HMAC signature
8. Update order status (pending → paid)
9. Send confirmation email
10. Return to CircleTel site

// Back to CircleTel
11. Redirect to /order/confirmation
```

---

### **Step 7: Confirmation**
**URL:** `/order/confirmation`

**What User Sees:**
- Order confirmation message
- Order number
- Payment confirmation
- Installation details
- Next steps

---

## 🔑 Key Integration Points for Netcash

### 1. **Order Context State Management**
**File:** `components/order/context/OrderContext.tsx`

**Stored Data:**
```typescript
{
  currentStage: 2,                    // Current step (1-based)
  orderData: {
    coverage: {
      leadId: "038236d0-3ef0-4eb9...",
      address: "1 Jan Smuts Ave...",
      selectedPackage: {
        id: "...",
        name: "HomeFibre Basic",
        price: "379",
        speed_down: 20,
        speed_up: 10,
        // ... full package details
      },
      pricing: {
        monthly: 379,
        onceOff: 0,
        breakdown: [...]
      }
    },
    account: { ... },
    contact: { ... },
    installation: { ... }
  }
}
```

**Persistence:** Saved to `localStorage` automatically

---

### 2. **Payment API Endpoint**
**File:** `app/api/payment/netcash/webhook/route.ts`

**Request Format:**
```json
{
  "TransactionID": "...",
  "Reference": "ORDER_12345",
  "Amount": 379.00,
  "Status": "ACCEPTED" | "DECLINED",
  "Reason": "...",
  "DateTime": "2025-10-22T...",
  "RequestTrace": "...",
  "MerchantID": "52340889417",
  "TransactionType": "PAYNOW"
}
```

**Headers:**
```
Content-Type: application/json
X-Netcash-Signature: {HMAC-SHA256 signature}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment processed successfully"
}
```

---

### 3. **Order Database Schema**
**Tables:**
- `orders` - Main order record
- `order_items` - Line items (package selection)
- `payment_transactions` - Payment records
- `payment_webhooks` - Webhook delivery log

**Order Status Flow:**
```
pending → processing → paid → active → cancelled
```

---

## 🧪 Complete Test Flow

### **Test Scenario: End-to-End Order with Netcash Payment**

**Prerequisites:**
- Staging environment: https://circletel-staging.vercel.app
- Netcash test account configured
- Webhook URLs updated in Netcash portal
- All environment variables set in Vercel

**Test Steps:**

```
1. Navigate to https://circletel-staging.vercel.app

2. Enter test address: "1 Jan Smuts Avenue, Johannesburg"
   → Click "Check coverage"

3. Verify packages page loads:
   URL: /packages/{leadId}?type=residential
   Verify: 11 packages visible (5 Fibre, 6 Wireless)

4. Select package: "HomeFibre Basic" (R379/month)
   → Click "Order Now"

5. Verify sidebar appears with package details
   → Click "Continue to Order"

6. Verify navigation to /order/account
   Fill form:
   - Account Type: Personal
   - First Name: Test
   - Last Name: User
   - Email: test@circletel.co.za
   - Phone: 0821234567
   → Click "Continue to Installation Details"

7. Fill installation details
   → Click "Continue to Payment"

8. Verify payment page loads
   → Click "Pay with Credit Card"

9. Netcash payment page loads
   Enter test card:
   - Card Number: 4000000000000002
   - CVV: 123
   - Expiry: 12/25
   → Submit payment

10. Payment processes
    Netcash sends webhook to:
    POST https://circletel-staging.vercel.app/api/payment/netcash/webhook

11. Verify webhook received:
    - Check admin dashboard: /admin/payments/webhooks
    - Verify status: "Success"
    - Verify order status updated to "paid"

12. Verify redirect to /order/confirmation
    - Order confirmation displayed
    - Email sent to test@circletel.co.za

✅ TEST PASS: Complete order flow with payment
```

---

## ⚠️ Known Issues & Workarounds

### Issue 1: "/order" Direct Access Shows Placeholder

**Problem:**
- Navigating directly to `/order` shows incomplete coverage page
- "Order Now" buttons on packages page don't navigate anywhere

**Root Cause:**
- Two separate order systems exist
- `/order` flow is under development (OSI-001-02)
- Package selection must trigger navigation programmatically

**Solution:**
- Always enter order flow via: Homepage → Coverage → Packages → Order
- Don't navigate directly to `/order`
- The "Order Now" button in package cards should call `handlePackageSelect()`, not navigate directly

**Code Reference:**
```typescript
// CORRECT: app/packages/[leadId]/page.tsx
<EnhancedPackageCard
  pkg={pkg}
  onSelect={() => handlePackageSelect(pkg)}  // ← Opens sidebar
  isSelected={selectedPackage?.id === pkg.id}
/>

// Then sidebar has:
<Button onClick={handleContinue}>         // ← Navigates to /order/account
  Continue to Order
</Button>
```

---

### Issue 2: Package Selection State Not Persisting

**Problem:**
- If user refreshes page after selecting package, selection is lost

**Root Cause:**
- Package selection stored in component state before OrderContext update

**Solution:**
- OrderContext `updateOrderData()` is called (line 134 of packages page)
- Data persists to localStorage
- On page refresh, OrderContext restores state
- Account page should read `state.orderData.coverage.selectedPackage`

**Verification:**
```javascript
// Check localStorage
localStorage.getItem('order-state')

// Should contain:
{
  "orderData": {
    "coverage": {
      "selectedPackage": { ... }
    }
  }
}
```

---

## 📋 Netcash Integration Checklist

### Before Testing:
- [ ] Verify `/packages/{leadId}` page loads correctly
- [ ] Verify package cards have "Order Now" buttons
- [ ] Verify clicking "Order Now" opens sidebar
- [ ] Verify sidebar has "Continue" button
- [ ] Verify "Continue" navigates to `/order/account`
- [ ] Verify OrderContext stores selected package
- [ ] Verify payment page exists at `/order/payment`
- [ ] Verify webhook endpoint at `/api/payment/netcash/webhook`

### During Testing:
- [ ] Complete full order flow (steps 1-7 above)
- [ ] Verify each navigation step
- [ ] Verify data persists between pages
- [ ] Verify payment initiation
- [ ] Verify webhook delivery
- [ ] Verify order status update
- [ ] Verify confirmation page

### After Testing:
- [ ] Check admin dashboard for webhook logs
- [ ] Check database for order record
- [ ] Check email for confirmation
- [ ] Verify payment transaction recorded
- [ ] Document any issues found

---

## 🎯 Next Steps for Full Payment Integration

1. **Test Package Selection Flow:**
   - Use Playwright to click "Order Now"
   - Verify sidebar opens
   - Verify "Continue" button works
   - Verify navigation to `/order/account`

2. **Test Account Form:**
   - Fill all fields
   - Submit form
   - Verify navigation to next step

3. **Test Payment Flow:**
   - Reach payment page
   - Initiate Netcash payment
   - Complete test transaction
   - Verify webhook delivery

4. **Verify Webhook Processing:**
   - Check admin dashboard: `/admin/payments/webhooks`
   - Verify webhook status: "Success"
   - Verify order status: "paid"
   - Verify email sent

---

**Document Created:** 2025-10-22
**Purpose:** Complete order flow documentation for Netcash integration testing
**Status:** ✅ Comprehensive analysis complete

🤖 Generated with [Claude Code](https://claude.com/claude-code)
