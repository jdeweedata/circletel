# Payment Flow Testing Guide

## Overview

This document describes the test scenarios for CircleTel's payment processing flow using Netcash Pay Now. These tests validate error recovery, retry functionality, and payment persistence.

## Test Environment Setup

### Prerequisites
- Development server running (`npm run dev:memory`)
- Netcash test credentials configured in `.env`
- Playwright installed and configured
- Test order data available

### Test Data
```typescript
const testOrderData = {
  customerName: "John Test",
  customerEmail: "test@circletel.co.za",
  customerPhone: "+27821234567",
  packageId: "test-package-id",
  packageName: "50/10 Mbps Fibre",
  serviceType: "fibre",
  basePrice: 599.00,
  installationFee: 1000.00,
  totalAmount: 1599.00,
  installationAddress: "123 Test Street, Cape Town, 8001",
};
```

### Netcash Test Cards

**Successful Payment:**
- Card: `4000 0000 0000 0002`
- Expiry: Any future date
- CVV: `123`

**Declined Payment:**
- Card: `4000 0000 0000 0010`
- Expiry: Any future date
- CVV: `123`

**Insufficient Funds:**
- Card: `4000 0000 0000 9995`
- Expiry: Any future date
- CVV: `123`

**Invalid CVV:**
- Card: `4000 0000 0000 0002`
- Expiry: Any future date
- CVV: `999`

## Test Scenarios

### Test Case 1: Successful Payment Flow

**Objective:** Verify complete payment flow from order to confirmation

**Steps:**
1. Navigate to coverage checker
2. Enter test address with coverage
3. Select package
4. Fill in account details
5. Fill in contact details
6. Fill in installation preferences
7. Proceed to payment page
8. Verify order summary displayed
9. Click "Pay with Netcash"
10. Verify redirect to Netcash gateway
11. Enter test card (successful)
12. Complete payment
13. Verify redirect back to success page
14. Verify order status updated to `paid`
15. Verify confirmation email sent

**Expected Result:**
- ✅ Order created with `payment_pending` status
- ✅ Redirect to Netcash with correct payment reference
- ✅ Payment processed successfully
- ✅ Order status updated to `paid`
- ✅ Confirmation email received
- ✅ localStorage cleared after success

**Database Verification:**
```sql
SELECT id, status, payment_status, payment_reference, total_amount
FROM orders
WHERE customer_email = 'test@circletel.co.za'
ORDER BY created_at DESC
LIMIT 1;
```

---

### Test Case 2: Declined Payment with Retry

**Objective:** Verify error recovery and retry functionality

**Steps:**
1. Complete order flow to payment page
2. Click "Pay with Netcash"
3. Enter declined test card
4. Submit payment
5. Observe error on Netcash page
6. Return to CircleTel (browser back or redirect)
7. Verify PaymentErrorDisplay shown
8. Verify retry session banner visible
9. Click "Try Payment Again"
10. Verify order data pre-filled
11. Complete payment with valid card
12. Verify success

**Expected Result:**
- ✅ Error detected and saved to localStorage
- ✅ User-friendly error message displayed
- ✅ Retry count = 1
- ✅ Order data persisted in localStorage
- ✅ Retry button functional
- ✅ Second attempt succeeds

**localStorage Verification:**
```javascript
// Check persisted data
const orderData = localStorage.getItem('circletel_order_data');
const retryInfo = localStorage.getItem('circletel_payment_retries');
console.log('Order Data:', JSON.parse(orderData));
console.log('Retry Info:', JSON.parse(retryInfo));
```

---

### Test Case 3: Multiple Retry Attempts with Alternative Suggestions

**Objective:** Verify alternative payment options shown after 3 retries

**Steps:**
1. Complete order flow to payment page
2. Attempt payment with declined card (Attempt 1)
3. Return to payment page
4. Retry with declined card (Attempt 2)
5. Return to payment page
6. Retry with declined card (Attempt 3)
7. Return to payment page
8. Verify alternative payment options card displayed
9. Verify support contact buttons functional

**Expected Result:**
- ✅ Retry count = 3
- ✅ Alternative payment methods card visible
- ✅ Shows: EFT, Assisted Payment, Payment Link, Order Reservation
- ✅ Support phone/email buttons functional
- ✅ Retry button still available (max 5 attempts)

**Error Display Verification:**
- Error severity changes from red → amber after 3 retries
- Warning about multiple attempts displayed
- Alternative payment options prominently shown

---

### Test Case 4: Network Timeout Simulation

**Objective:** Verify handling of network timeouts

**Steps:**
1. Complete order flow to payment page
2. Open browser DevTools → Network tab
3. Set throttling to "Offline" or "Slow 3G"
4. Click "Pay with Netcash"
5. Wait for timeout error
6. Verify error message displayed
7. Restore network connection
8. Click "Try Payment Again"
9. Verify payment succeeds

**Expected Result:**
- ✅ Timeout error detected (error code: `TIMEOUT`)
- ✅ User-friendly message: "Payment request timed out"
- ✅ Suggestion: "Check your internet connection"
- ✅ Retry successful after network restored
- ✅ Order data not lost during timeout

---

### Test Case 5: Invalid Payment Details

**Objective:** Verify error handling for invalid card details

**Steps:**
1. Complete order flow to payment page
2. Click "Pay with Netcash"
3. Enter invalid card number (e.g., `1234 5678 9012 3456`)
4. Attempt payment
5. Observe validation error on Netcash
6. Return to CircleTel
7. Verify error displayed
8. Retry with valid card

**Expected Result:**
- ✅ Error code: `INVALID_CARD`
- ✅ User message: "The card details you entered appear to be invalid"
- ✅ Suggestion: "Double-check your card number, expiry date, and CVV"
- ✅ Retry successful with valid card

---

### Test Case 6: Abandoned Payment (Close Browser)

**Objective:** Verify order persists when user closes browser

**Steps:**
1. Complete order flow to payment page
2. Click "Pay with Netcash"
3. On Netcash page, close browser tab
4. Reopen CircleTel website
5. Navigate to `/order/payment` (or saved URL)
6. Verify retry session banner visible
7. Verify order data restored
8. Complete payment

**Expected Result:**
- ✅ Order saved with `payment_pending` status
- ✅ Order data persisted in localStorage
- ✅ Retry session shows "Order created X minutes ago"
- ✅ User can resume payment without re-entering data
- ✅ Payment completes successfully

**Database Verification:**
```sql
SELECT id, status, payment_status, created_at
FROM orders
WHERE status = 'pending' AND payment_status = 'payment_pending'
ORDER BY created_at DESC;
```

---

### Test Case 7: Clear Retry Session

**Objective:** Verify user can clear retry session and start fresh

**Steps:**
1. Create retry session (failed payment)
2. Return to payment page
3. Verify retry session banner visible
4. Click "Clear Session" button
5. Verify banner disappears
6. Verify localStorage cleared
7. Verify can start new order flow

**Expected Result:**
- ✅ "Clear Session" button functional
- ✅ localStorage keys removed
- ✅ Retry session banner hidden
- ✅ Success toast: "Payment session cleared"
- ✅ Can create new order without interference

---

### Test Case 8: Session Staleness (24-hour check)

**Objective:** Verify old retry sessions are automatically cleared

**Steps:**
1. Create retry session
2. Manually modify localStorage timestamp:
   ```javascript
   const data = JSON.parse(localStorage.getItem('circletel_order_data'));
   data.createdAt = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(); // 25 hours ago
   localStorage.setItem('circletel_order_data', JSON.stringify(data));
   ```
3. Refresh page
4. Verify retry session not loaded
5. Verify localStorage cleared automatically

**Expected Result:**
- ✅ Sessions older than 24 hours are ignored
- ✅ Stale data cleared automatically
- ✅ No retry session banner shown
- ✅ Console log: "Order data is stale, clearing..."

---

## Automated Testing with Playwright

### Test Script: `/tests/e2e/payment-flow.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Payment Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('http://localhost:3006');
    await page.evaluate(() => localStorage.clear());
  });

  test('should complete successful payment', async ({ page }) => {
    // Test implementation in separate file
  });

  test('should handle declined payment with retry', async ({ page }) => {
    // Test implementation in separate file
  });

  test('should show alternatives after 3 retries', async ({ page }) => {
    // Test implementation in separate file
  });

  test('should handle network timeout', async ({ page }) => {
    // Test implementation in separate file
  });

  test('should validate invalid payment details', async ({ page }) => {
    // Test implementation in separate file
  });

  test('should persist abandoned payments', async ({ page }) => {
    // Test implementation in separate file
  });

  test('should clear retry session', async ({ page }) => {
    // Test implementation in separate file
  });

  test('should clear stale sessions', async ({ page }) => {
    // Test implementation in separate file
  });
});
```

---

## Manual Testing Checklist

### Payment Page UI
- [ ] Order summary displays correctly
- [ ] Pricing breakdown matches selected package
- [ ] Security badges visible
- [ ] Accepted payment methods shown
- [ ] Terms and privacy links functional
- [ ] "Back" button returns to previous stage
- [ ] "Pay with Netcash" button disabled during processing
- [ ] Loading spinner shows during payment initiation

### Error Display UI
- [ ] Error alert displays with correct severity color
- [ ] Error message is user-friendly (not technical)
- [ ] Suggestion is actionable
- [ ] Retry count displayed accurately
- [ ] "Try Payment Again" button functional
- [ ] "Back to Order Summary" button functional
- [ ] Support contact buttons open phone/email
- [ ] Alternative payment card shows after 3 retries
- [ ] Debug info only visible in development mode

### Retry Session UI
- [ ] Banner shows when retry session exists
- [ ] Retry count accurate
- [ ] Order age accurate
- [ ] "Clear Session" button functional
- [ ] Banner hidden when error display shown
- [ ] Banner hidden after successful payment

### Mobile Responsive
- [ ] Payment page responsive on mobile
- [ ] Error display readable on small screens
- [ ] Buttons accessible on touch devices
- [ ] No horizontal scroll
- [ ] Support buttons easy to tap

---

## Performance Metrics

### Target Metrics
- **Payment Initiation**: < 2 seconds
- **Error Detection**: Immediate
- **Retry Attempt**: < 1 second (data pre-filled)
- **localStorage Operations**: < 100ms
- **Error Display Render**: < 500ms

### Monitoring
- Track payment success rate by error type
- Monitor retry conversion rate
- Track alternative payment method adoption
- Measure time between attempts

---

## Common Issues & Troubleshooting

### Issue: Order not persisting
**Cause:** localStorage disabled or full
**Solution:** Check browser settings, clear old data

### Issue: Error not displayed after redirect
**Cause:** Error not saved before redirect
**Solution:** Verify `savePaymentError()` called in webhook handler

### Issue: Retry count not incrementing
**Cause:** `recordPaymentAttempt()` not called
**Solution:** Verify error handler includes retry tracking

### Issue: Stale session not clearing
**Cause:** Timestamp comparison logic error
**Solution:** Verify 24-hour calculation (milliseconds)

---

## Test Results Template

```markdown
## Payment Flow Test Results - [Date]

**Tester:** [Name]
**Environment:** [Development/Staging/Production]
**Browser:** [Chrome/Firefox/Safari]
**Version:** [Browser Version]

| Test Case | Status | Notes |
|-----------|--------|-------|
| Successful Payment | ✅ Pass | Order ID: ORD-12345 |
| Declined Payment Retry | ✅ Pass | 2 retries needed |
| Multiple Retries | ✅ Pass | Alternatives shown |
| Network Timeout | ⚠️ Partial | Timeout detection works, retry slow |
| Invalid Details | ✅ Pass | Clear error message |
| Abandoned Payment | ✅ Pass | Session restored after 5 min |
| Clear Session | ✅ Pass | localStorage cleared |
| Stale Session | ✅ Pass | Auto-cleared after 24h |

**Overall:** 7/8 Passed (87.5%)

**Issues Found:**
1. Network timeout retry slightly slow (2.5s instead of <1s)

**Recommendations:**
1. Optimize localStorage read operations
2. Add loading indicator during timeout recovery
```

---

## Next Steps

1. Implement automated Playwright tests
2. Set up CI/CD pipeline to run tests on PRs
3. Create webhook testing scenarios (Task 3.3)
4. Add monitoring and alerting for payment failures
5. Document payment reconciliation process

---

**Last Updated:** 2025-10-22
**Owner:** Development Team
**Status:** Task 3.2 - In Progress
