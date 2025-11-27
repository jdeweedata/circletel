# Fix: Orders Created with customer_id = NULL

**Date**: 2025-11-27
**Severity**: HIGH
**Status**: RESOLVED
**Affected Files**:
- `app/order/service-address/page.tsx`
- `app/api/orders/create-pending/route.ts`

---

## Problem Description

Orders created by authenticated users were being stored with `customer_id = NULL` in the `consumer_orders` table, even though the user was logged in and had a valid customer record.

### Symptoms
- User logs in successfully
- User completes order flow (coverage check → package selection → service address)
- Order is created but `customer_id` is NULL
- Order doesn't appear in dashboard (or appears without proper association)

### Impact
- Orders not linked to customer accounts
- Dashboard queries fail to show user's orders
- Admin cannot easily associate orders with customers
- Customer cannot see their order history

---

## Root Cause Analysis

### Technical Root Cause

The Supabase auth session was being stored in **localStorage** (not cookies) by the `@supabase/ssr` client. However, the order creation API was only checking for cookies-based authentication.

**Key Discovery**: When checking the browser:
```javascript
document.cookie  // Only showed: "__next_hmr_refresh_hash__"
localStorage.getItem('sb-agyjovdugmtopasyvlng-auth-token')  // 2357 characters of JWT data
```

The session was in localStorage, NOT cookies, so the server couldn't read it.

### Why This Happened

1. **Supabase SSR Client Behavior**: The `createBrowserClient` from `@supabase/ssr` is supposed to use cookies but can fall back to localStorage depending on configuration
2. **API Route Pattern**: The `create-pending` API was using `createClientWithSession()` which reads from cookies
3. **Missing Authorization Header**: The service-address page wasn't sending the access token in the request headers

---

## Solution

### Pattern: Send Authorization Header from Client

When calling authenticated API routes from the client, always send the Authorization header with the access token. This ensures authentication works regardless of whether the session is stored in cookies or localStorage.

### Fix 1: Service Address Page (`app/order/service-address/page.tsx`)

**Line 58**: Add `session` to destructuring:
```typescript
const { isAuthenticated, customer, user, session, loading: authLoading } = useCustomerAuth();
```

**Lines 223-228**: Add Authorization header to fetch call:
```typescript
const orderResponse = await fetch('/api/orders/create-pending', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
  },
  body: JSON.stringify({...}),
});
```

### Fix 2: Create-Pending API (`app/api/orders/create-pending/route.ts`)

**Lines 23-47**: Check BOTH Authorization header AND cookies:
```typescript
// Get authenticated user - check BOTH Authorization header AND cookies
// (session may be in localStorage on client, sent via Authorization header)
let user = null;
let authError = null;

// First, try Authorization header (preferred - works with localStorage sessions)
const authHeader = request.headers.get('authorization');
if (authHeader?.startsWith('Bearer ')) {
  const token = authHeader.split(' ')[1];
  const { data, error } = await supabase.auth.getUser(token);
  user = data?.user || null;
  authError = error;
  console.log('[create-pending] Auth via header:', user ? `Authenticated (${user.email})` : 'Not authenticated');
}

// Fallback to cookie-based session if no header
if (!user) {
  const supabaseWithSession = await createClientWithSession();
  const { data, error } = await supabaseWithSession.auth.getUser();
  user = data?.user || null;
  authError = error;
  console.log('[create-pending] Auth via cookies:', user ? `Authenticated (${user.email})` : 'Not authenticated');
}
```

---

## Standard Pattern for All Authenticated API Calls

### Client-Side Pattern
```typescript
// In React components using CustomerAuthProvider
const { session } = useCustomerAuth();

const response = await fetch('/api/protected-endpoint', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    ...(session?.access_token
      ? { 'Authorization': `Bearer ${session.access_token}` }
      : {})
  },
  body: JSON.stringify(data),
});
```

### Server-Side Pattern
```typescript
// In API routes
export async function POST(request: NextRequest) {
  const supabase = await createClient();  // Service role for DB ops

  let user = null;

  // Try Authorization header first
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const { data } = await supabase.auth.getUser(token);
    user = data?.user || null;
  }

  // Fallback to cookies
  if (!user) {
    const supabaseWithSession = await createClientWithSession();
    const { data } = await supabaseWithSession.auth.getUser();
    user = data?.user || null;
  }

  // Now use `user` for authorization checks
}
```

---

## Verification

### Before Fix
```sql
SELECT customer_id FROM consumer_orders WHERE order_number = 'ORD-XXXXXXXX-XXXX';
-- Result: customer_id = NULL
```

### After Fix
```sql
SELECT customer_id FROM consumer_orders WHERE order_number = 'ORD-20251127-6628';
-- Result: customer_id = '801aaa00-04e1-4330-810b-54c554ca9934'
```

---

## Related Files

### Files Using This Pattern (Reference)
- `app/dashboard/page.tsx` - Already uses Authorization header correctly
- `app/api/dashboard/summary/route.ts` - Already checks Authorization header

### Files That May Need Similar Fix
- Any API route that:
  1. Requires authentication
  2. Is called from client-side components
  3. Currently only uses `createClientWithSession()` for auth

---

## Debugging Tips

### Check Where Session is Stored
```javascript
// In browser console
console.log('Cookies:', document.cookie);
console.log('localStorage:', localStorage.getItem('sb-agyjovdugmtopasyvlng-auth-token'));
```

### Check API Request Headers
```javascript
// In browser Network tab, check if Authorization header is being sent
Request Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Server-Side Logging
```typescript
console.log('[API] Auth header:', request.headers.get('authorization')?.substring(0, 50));
console.log('[API] User from header:', user?.email || 'none');
console.log('[API] User from cookies:', user?.email || 'none');
```

---

## Prevention

1. **Always send Authorization header** when calling authenticated APIs from client
2. **Always check both header and cookies** in API routes
3. **Add integration tests** that verify customer_id is set on orders
4. **Monitor logs** for "Auth via header" vs "Auth via cookies" patterns

---

## References

- CLAUDE.md: Authorization Header Pattern section
- `docs/architecture/AUTHENTICATION_SYSTEM.md`
- Supabase SSR documentation: https://supabase.com/docs/guides/auth/server-side
