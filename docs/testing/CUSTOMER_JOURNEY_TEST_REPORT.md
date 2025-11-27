# Customer Order Journey Test Report

**Date:** November 27, 2025  
**Test Type:** E2E Playwright Test  
**Environment:** Local Development (localhost:3000)  
**Test User:** jeffrey.de.wee@circletel.co.za

---

## Executive Summary

The customer order journey was tested end-to-end using Playwright with a real registered user account. The test identified several issues related to authentication flow, session handling, and API authorization.

### Test Results

| Test | Status | Duration |
|------|--------|----------|
| Complete customer order journey | ⚠️ Partial | 4.6m |
| Existing customer login and order | ⚠️ Issues | 1.7m |
| Test Supabase Auth directly | ✅ Pass | 21.5s |
| Test Order API directly | ✅ Pass | ~5s |

---

## Latest Test Run (Existing Customer Flow)

**Key Finding:** Login succeeds (shows "Welcome back!" toast) but page doesn't redirect, and subsequent API calls fail with 401 Unauthorized.

### Issues Found

1. **Login Success Without Redirect**
   - Login shows success toast "Welcome back!"
   - Page stays on `/auth/login` instead of redirecting
   - Session cookie may not be set correctly

2. **API 401 Errors After Login**
   - `/api/order-drafts` returns 401 "Not authenticated"
   - Multiple Supabase 401 errors
   - Session not persisting across page navigation

3. **Payment Page Missing Order Data**
   - Order context not populated
   - Package selection not persisting to payment page

### Screenshots

- `existing-customer-login.png` - Form filled with credentials
- `existing-customer-after-login.png` - Shows "Welcome back!" toast but no redirect

---

## Issues Identified

### 🔴 Critical Issues

#### 1. Google OAuth Redirect During Email Signup

**Location:** `/order/account` page  
**Screenshot:** `step3-after-submit.png`

**Problem:**  
When clicking "Create account" button, the form triggers Google OAuth redirect instead of email/password signup. The test filled in all email form fields (First Name, Last Name, Email, Password, Phone) but the submit action redirected to Google Sign-in page.

**Evidence:**
- `step3-account-form.png` shows form correctly filled with test data
- `step3-after-submit.png` shows Google OAuth page instead of expected OTP verification

**Root Cause Analysis:**
The form submit button may be triggering the wrong action, or there's a race condition between the Google button and the submit button.

**Recommended Fix:**
1. Check `app/order/account/page.tsx` for form submission logic
2. Ensure `handleSubmit` is properly bound to the form's `onSubmit` event
3. Verify the Google button has `type="button"` to prevent form submission

---

### 🟡 Warnings

#### 2. Order Context State Not Persisting

**Location:** Payment page  
**Screenshot:** `test-failed-1.png`

**Problem:**  
The service address page shows correctly with package data (HomeFibre Basic - R399.00/month), but the order context may not be properly persisting customer account data through the flow.

**Evidence:**
- Progress bar shows "Account" as complete (checkmark)
- Package selection persisted correctly
- Service address page loaded with package summary

**Recommended Investigation:**
1. Check `OrderContext` provider for state persistence
2. Verify localStorage/sessionStorage backup is working
3. Test if page refresh loses order data

---

#### 3. Coverage Check Page Incomplete

**Location:** `/order/coverage`  
**Screenshot:** Not captured (page shows placeholder)

**Problem:**  
The coverage check page shows a placeholder message: "🚧 Coverage checking integration coming in OSI-001-02"

**Impact:**  
Customers cannot complete the natural flow of checking coverage before selecting packages.

**Workaround:**  
Direct navigation to `/order/packages` works correctly.

---

### 🟢 Working Components

1. **Package Selection Page** - Loads correctly, displays packages with pricing
2. **Account Form UI** - All fields render correctly, validation works
3. **Progress Bar** - Updates correctly through steps
4. **Package Summary** - Displays selected package throughout flow
5. **Service Address Page** - Loads and displays correctly
6. **Supabase Auth API** - Direct authentication works (returns proper error for invalid credentials)
7. **Order Creation API** - Direct API calls work correctly

---

## Supabase-Specific Findings

### Authentication Flow

The Supabase authentication is configured correctly:
- Project: `agyjovdugmtopasyvlng.supabase.co`
- Auth endpoint responds correctly
- Invalid credentials return proper error: "Invalid login credentials"

### Potential Issues

1. **OAuth Configuration:** Google OAuth is configured and working, but may be interfering with email signup flow
2. **Customer Record Creation:** Need to verify if customer record is created in `customers` table after Supabase Auth signup

---

## Screenshots Captured

| Screenshot | Description |
|------------|-------------|
| `step1-landing.png` | Order landing page |
| `step2-packages.png` | Package selection page |
| `step2-after-select.png` | After package selection |
| `step3-account-form.png` | Account creation form (filled) |
| `step3-form-filled.png` | Form with all fields |
| `step3-after-submit.png` | **ISSUE:** Google OAuth redirect |
| `step5-address.png` | Service address page |
| `step5-after-address.png` | After address entry |
| `supabase-auth-login.png` | Direct auth test |
| `supabase-auth-result.png` | Auth test result |
| `test-failed-1.png` | Service address confirmation |

---

## Recommended Actions

### Immediate (P0)

1. **Fix Account Form Submission**
   - File: `app/order/account/page.tsx`
   - Issue: Form submit triggering Google OAuth instead of email signup
   - Action: Review `onSubmit` handler and button types

### Short-term (P1)

2. **Complete Coverage Check Integration**
   - File: `app/order/coverage/page.tsx`
   - Issue: Placeholder content
   - Action: Integrate existing coverage checking components

3. **Add Order Context Persistence**
   - Files: `components/order/context/OrderContext.tsx`
   - Issue: State may not persist through page navigation
   - Action: Add localStorage backup for order data

### Medium-term (P2)

4. **Add E2E Test Coverage**
   - Run tests regularly in CI/CD
   - Add more edge case tests
   - Test payment flow with Netcash sandbox

---

## Test Artifacts

All test artifacts are saved in:
- Screenshots: `test-results/*.png`
- Videos: `test-results/**/video.webm`
- Traces: `test-results/**/trace.zip`

To view the full Playwright report:
```bash
npx playwright show-report
```

---

## Next Steps

1. Fix the account form submission issue (Critical)
2. Re-run E2E tests to verify fix
3. Complete coverage check integration
4. Add automated tests to CI/CD pipeline
