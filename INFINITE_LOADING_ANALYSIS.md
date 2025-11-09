# Infinite Loading Analysis - /dashboard/payment-method

**Date**: 2025-11-09
**Status**: 🔴 Critical Issue - Page stuck on loading spinner
**URL**: https://www.circletel.co.za/dashboard/payment-method

---

## 🎯 Problem Summary

The `/dashboard/payment-method` page displays an infinite loading spinner with no data or error messages appearing. Users cannot proceed to add payment methods or view pending orders.

---

## 🔍 Root Causes Identified

### **Issue #1: useEffect Early Return Without Loading State Update** (CRITICAL)

**File**: `app/dashboard/payment-method/page.tsx:29-78`

**Problem**:
```typescript
useEffect(() => {
  async function fetchPaymentData() {
    if (fetchInProgress.current) {
      console.log('[PaymentMethod] Fetch already in progress, skipping duplicate call');
      return; // ❌ BUG: Returns without setLoading(false)
    }

    if (!session?.access_token) {
      setLoading(false); // ✅ Good
      return;
    }

    // ... rest of fetch logic
  }

  fetchPaymentData();
}, [session?.access_token]);
```

**Root Cause**:
- If the useEffect runs multiple times quickly (e.g., during React Strict Mode or rapid re-renders), the second invocation finds `fetchInProgress.current = true`
- It returns early **without** calling `setLoading(false)`
- Loading spinner stays visible forever

**Impact**: HIGH - Causes infinite loading in rapid re-render scenarios

---

### **Issue #2: Silent API Failures** (HIGH PRIORITY)

**File**: `app/dashboard/payment-method/page.tsx:46-67`

**Problem**:
```typescript
const ordersResponse = await fetch('/api/orders/pending', {
  headers: { 'Authorization': `Bearer ${session.access_token}` }
});

if (ordersResponse.ok) {
  const ordersData = await ordersResponse.json();
  setPendingOrders(ordersData.orders || []);
}
// ❌ NO ERROR HANDLING - Silent failure if response is not ok
```

**Root Cause**:
- If API returns 401, 403, 500, or network error
- The `if (ordersResponse.ok)` block is skipped
- No error state is set
- Component shows loading spinner but with empty data (appears stuck)

**Impact**: HIGH - Users see blank page with no indication of what went wrong

---

### **Issue #3: API Timeout Without Proper Error Handling** (MEDIUM)

**File**: `app/api/orders/pending/route.ts` & `app/api/payment/method/check/route.ts`

**Problem**:
Both API routes use Supabase queries without timeout protection:
```typescript
const { data: orders, error: ordersError } = await supabaseService
  .from('consumer_orders')
  .select('id, order_number, ...')
  .eq('email', user.email)
  .eq('status', 'pending')
  .eq('payment_status', 'pending')
  .order('created_at', { ascending: false });
// ❌ No timeout - Could hang indefinitely
```

**Root Cause**:
- If Supabase database query hangs or times out
- The fetch request on client side waits indefinitely
- Client loading state stays true forever

**Impact**: MEDIUM - Network/DB issues cause infinite loading

---

### **Issue #4: Missing Customer Record Handling**

**File**: `app/dashboard/payment-method/page.tsx:29-78`

**Problem**:
```typescript
useEffect(() => {
  async function fetchPaymentData() {
    if (!session?.access_token) {
      setLoading(false);
      return;
    }
    // ❌ Doesn't wait for customer record to be available
    // API routes check user.email, but customer might be null
  }
}, [session?.access_token]);
```

**Root Cause**:
- `CustomerAuthProvider` takes up to 10 seconds to fetch customer record
- The payment-method page only waits for `session.access_token`
- If customer query times out, APIs might fail with "Unauthorized" even though session exists

**Reference**: `components/providers/CustomerAuthProvider.tsx:93-120`

**Impact**: MEDIUM - Race condition between auth and customer data

---

### **Issue #5: Middleware Not Covering Payment API Routes**

**File**: `middleware.ts:100-113`

**Problem**:
```typescript
export const config = {
  matcher: [
    '/admin/:path*',
    '/api/dashboard/:path*', // ✅ Covered
    // ❌ MISSING: '/api/orders/:path*',
    // ❌ MISSING: '/api/payment/:path*',
  ],
};
```

**Root Cause**:
- Middleware refreshes auth cookies for `/api/dashboard/*` routes
- But `/api/orders/pending` and `/api/payment/method/check` are NOT covered
- Stale cookies might cause auth failures on these endpoints

**Impact**: LOW-MEDIUM - Could cause sporadic 401 errors

---

## 🧪 Debugging Steps to Confirm

### Step 1: Check Browser Console

**Expected Logs**:
```
[PaymentMethod] Fetch already in progress, skipping duplicate call
```

**What to Look For**:
- Multiple rapid console logs → Issue #1 (early return bug)
- No logs at all → Fetch might be hanging
- 401/500 errors → API authentication/database issues

### Step 2: Check Network Tab

**Expected Requests**:
1. `GET /api/orders/pending` → Should complete in <3 seconds
2. `GET /api/payment/method/check` → Should complete in <3 seconds

**What to Look For**:
- Requests stuck in "pending" state → Issue #3 (API timeout)
- 401 Unauthorized responses → Issue #4 or #5 (auth/middleware issues)
- 500 Internal Server Error → Database/Supabase issues

### Step 3: Check CustomerAuthProvider State

**Add Debug Log**:
```typescript
const { user, session, customer, loading: authLoading } = useCustomerAuth();

useEffect(() => {
  console.log('[PaymentMethod] Auth State:', {
    hasUser: !!user,
    hasSession: !!session,
    hasCustomer: !!customer,
    authLoading,
    sessionToken: session?.access_token?.substring(0, 20)
  });
}, [user, session, customer, authLoading]);
```

**What to Look For**:
- `authLoading: true` indefinitely → CustomerAuthProvider stuck
- `hasSession: true, hasCustomer: false` → Issue #4 (customer query failed)

---

## ✅ Recommended Fixes

### Fix #1: Add Loading State Guard to Early Return

**File**: `app/dashboard/payment-method/page.tsx:32-35`

```typescript
// ❌ BEFORE
if (fetchInProgress.current) {
  console.log('[PaymentMethod] Fetch already in progress, skipping duplicate call');
  return;
}

// ✅ AFTER
if (fetchInProgress.current) {
  console.log('[PaymentMethod] Fetch already in progress, skipping duplicate call');
  setLoading(false); // Ensure loading is set to false
  return;
}
```

**Impact**: Fixes infinite loading in rapid re-render scenarios

---

### Fix #2: Add Comprehensive Error Handling

**File**: `app/dashboard/payment-method/page.tsx:44-76`

```typescript
// ❌ BEFORE
const ordersResponse = await fetch('/api/orders/pending', {
  headers: { 'Authorization': `Bearer ${session.access_token}` }
});

if (ordersResponse.ok) {
  const ordersData = await ordersResponse.json();
  setPendingOrders(ordersData.orders || []);
}

// ✅ AFTER
const ordersResponse = await fetch('/api/orders/pending', {
  headers: { 'Authorization': `Bearer ${session.access_token}` }
});

if (ordersResponse.ok) {
  const ordersData = await ordersResponse.json();
  if (ordersData.success) {
    setPendingOrders(ordersData.orders || []);
  } else {
    console.error('[PaymentMethod] API returned success: false', ordersData);
    setPendingOrders([]);
  }
} else {
  const errorData = await ordersResponse.json().catch(() => ({ error: 'Unknown error' }));
  console.error('[PaymentMethod] Orders API error:', {
    status: ordersResponse.status,
    error: errorData
  });
  setPendingOrders([]);
}
```

**Impact**: Prevents silent failures, shows clear error logs

---

### Fix #3: Add Timeout to API Calls

**File**: `app/dashboard/payment-method/page.tsx:44-76`

```typescript
// Create fetch with timeout
const fetchWithTimeout = async (url: string, options: RequestInit, timeoutMs = 10000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout after ' + timeoutMs + 'ms');
    }
    throw error;
  }
};

// Use in useEffect
try {
  const ordersResponse = await fetchWithTimeout('/api/orders/pending', {
    headers: { 'Authorization': `Bearer ${session.access_token}` }
  }, 10000);

  // ... handle response
} catch (error) {
  console.error('[PaymentMethod] Fetch error:', error);
  setPendingOrders([]);
  // Optionally show toast: toast.error('Failed to load orders. Please refresh.');
}
```

**Impact**: Prevents indefinite hangs on network issues

---

### Fix #4: Wait for Customer Record Before Fetching

**File**: `app/dashboard/payment-method/page.tsx:29-78`

```typescript
// ❌ BEFORE
useEffect(() => {
  async function fetchPaymentData() {
    if (!session?.access_token) {
      setLoading(false);
      return;
    }
    // ... fetch data
  }
  fetchPaymentData();
}, [session?.access_token]);

// ✅ AFTER
const { user, session, customer, loading: authLoading } = useCustomerAuth();

useEffect(() => {
  async function fetchPaymentData() {
    // Wait for auth initialization
    if (authLoading) {
      console.log('[PaymentMethod] Auth still loading, waiting...');
      return; // Don't set loading false yet
    }

    if (!session?.access_token) {
      setLoading(false);
      return;
    }

    // Optional: Wait for customer record (if needed by APIs)
    if (!customer) {
      console.log('[PaymentMethod] Customer not loaded yet, waiting...');
      return; // Don't set loading false yet
    }

    // ... proceed with fetch
  }

  fetchPaymentData();
}, [session?.access_token, customer, authLoading]);
```

**Impact**: Eliminates race condition between auth and data fetching

---

### Fix #5: Add API Routes to Middleware

**File**: `middleware.ts:100-113`

```typescript
// ❌ BEFORE
export const config = {
  matcher: [
    '/admin/:path*',
    '/api/dashboard/:path*',
  ],
};

// ✅ AFTER
export const config = {
  matcher: [
    '/admin/:path*',
    '/api/dashboard/:path*',
    '/api/orders/:path*',      // Add this
    '/api/payment/:path*',     // Add this
  ],
};
```

**Impact**: Ensures auth cookies are refreshed for all customer-facing API routes

---

### Fix #6: Add Loading Timeout Fallback

**File**: `app/dashboard/payment-method/page.tsx:80-86`

```typescript
// Add a safety timeout in case all else fails
useEffect(() => {
  const timeoutId = setTimeout(() => {
    if (loading) {
      console.error('[PaymentMethod] Loading timeout after 15 seconds - forcing end');
      setLoading(false);
      // Optionally show error state
    }
  }, 15000); // 15 seconds max loading time

  return () => clearTimeout(timeoutId);
}, [loading]);
```

**Impact**: Guarantees loading spinner never shows longer than 15 seconds

---

## 🚀 Implementation Priority

1. **CRITICAL (Do Immediately)**:
   - Fix #1: Early return loading state
   - Fix #2: Error handling for API calls
   - Fix #3: Add fetch timeout

2. **HIGH (Do Within 24 Hours)**:
   - Fix #4: Wait for customer record
   - Fix #6: Loading timeout fallback

3. **MEDIUM (Do This Week)**:
   - Fix #5: Middleware matcher update

---

## 🧪 Testing Checklist

After implementing fixes:

- [ ] Navigate to `/dashboard/payment-method` with valid session
- [ ] Check browser console for errors
- [ ] Verify loading spinner disappears within 3 seconds
- [ ] Test with network throttling (Slow 3G)
- [ ] Test with Supabase database down (should show error, not infinite loading)
- [ ] Test with invalid auth token (should redirect or show error)
- [ ] Test in React Strict Mode (rapid re-renders)
- [ ] Check mobile responsiveness

---

## 📊 Monitoring Recommendations

Add client-side error tracking:

```typescript
useEffect(() => {
  const startTime = Date.now();

  async function fetchPaymentData() {
    try {
      // ... existing fetch logic
    } catch (error) {
      const duration = Date.now() - startTime;

      // Send to error tracking service (e.g., Sentry)
      console.error('[PaymentMethod] Fetch failed', {
        duration,
        error: error instanceof Error ? error.message : 'Unknown',
        hasSession: !!session,
        hasCustomer: !!customer
      });
    }
  }

  fetchPaymentData();
}, [session?.access_token]);
```

---

## 📚 Related Documentation

- **Infinite Loading Pattern**: `CLAUDE.md:262-295` (Common Debugging Patterns)
- **Auth Provider Exclusions**: `CLAUDE.md:329-345` (Auth Provider Page Exclusions)
- **Authorization Header Pattern**: `CLAUDE.md:404-425` (Fix for 401 errors)
- **CustomerAuthProvider Timeout**: `components/providers/CustomerAuthProvider.tsx:93-120`

---

**Last Updated**: 2025-11-09
**Version**: 1.0
**Maintained By**: Development Team
