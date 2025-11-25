# Real CircleTel Bug Fixes

Examples of actual bugs fixed in the CircleTel codebase, including investigation process, root cause, and solution.

## Bug #1: Dashboard Infinite Loading State

### Symptom
Customer dashboard (`/dashboard`) shows "Loading..." spinner indefinitely. No data appears. No errors in console.

### Impact
- **Severity**: Critical
- **Users affected**: All customers
- **Environment**: Production

### Investigation

**Step 1: Reproduce**
```bash
npm run dev:memory
# Navigate to http://localhost:3000/dashboard
# Observe: Infinite loading spinner
```

**Step 2: Check Console**
- No errors logged
- No warnings
- Network requests complete successfully

**Step 3: Add Debugging**
```typescript
// components/providers/CustomerAuthProvider.tsx
console.log('[DEBUG] Auth callback start')
console.log('[DEBUG] Auth callback end')
console.log('[DEBUG] Loading state:', loading)
```

**Observation**: Callback executes, but `loading` stays `true`

### Root Cause

Missing `finally` block in async auth callback:

```typescript
// ❌ BROKEN CODE
useEffect(() => {
  const callback = async () => {
    const data = await fetchUserData()
    setUser(data)
    setLoading(false) // ⚠️ Only runs if no error!
  }
  onAuthStateChange(callback)
}, [])
```

If `fetchUserData()` throws an error, `setLoading(false)` never executes.

### Solution

```typescript
// ✅ FIXED CODE
useEffect(() => {
  const callback = async () => {
    try {
      const data = await fetchUserData()
      setUser(data)
    } catch (error) {
      console.error('Auth error:', error)
      setUser(null)
    } finally {
      setLoading(false) // ✅ Always executes
    }
  }
  onAuthStateChange(callback)
}, [])
```

### Validation
- [x] Dashboard loads correctly
- [x] User data displays
- [x] No infinite loading
- [x] Error cases handled gracefully

### Commit
`24547cb - fix: Add finally block to CustomerAuthProvider callback`

### Pattern
**Always use try/catch/finally** for async callbacks that control loading states.

---

## Bug #2: RLS Policy Blocking Dashboard Summary API

### Symptom
Dashboard summary API (`/api/dashboard/summary`) returns 403 Forbidden or empty data.

### Impact
- **Severity**: High
- **Users affected**: Customers viewing dashboard
- **Environment**: Production

### Investigation

**Step 1: Check API Response**
```bash
curl https://www.circletel.co.za/api/dashboard/summary \
  -H "Authorization: Bearer [token]"

# Response: 403 Forbidden
```

**Step 2: Check Supabase Logs**
```
Error: new row violates row-level security policy for table "customers"
```

**Step 3: Review RLS Policies**
```sql
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'customers';

-- Result: Only customer_select_own policy exists
-- Missing: service_role policy for API access
```

### Root Cause

API route uses service role client but table has no service role policy:

```typescript
// app/api/dashboard/summary/route.ts
const supabase = await createClient() // Service role

const { data } = await supabase
  .from('customers')
  .select() // ❌ Blocked by RLS!
```

### Solution

Add service role policy to table:

```sql
-- Migration: 20251108010000_add_service_role_policy_customers.sql
CREATE POLICY "service_role_all" ON public.customers
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');
```

### Validation
- [x] API returns 200 OK
- [x] Data returned correctly
- [x] Customer can still only see own data
- [x] Admin can see all data

### Commit
`19890b5 - fix: Change dashboard summary API to use service role for customer queries`

### Pattern
**Always add service role policy** to tables accessed by API routes.

---

## Bug #3: Next.js 15 Async Params Type Error

### Symptom
TypeScript compilation fails after Next.js upgrade to v15:

```
Type 'Promise<{ id: string }>' is not assignable to type '{ id: string }'
```

### Impact
- **Severity**: Critical (blocks build)
- **Users affected**: N/A (build failure)
- **Environment**: All

### Investigation

**Step 1: Run Type Check**
```bash
npm run type-check:memory

# Errors in multiple API routes:
# - app/api/orders/[id]/route.ts
# - app/api/quotes/[id]/route.ts
# - app/api/customers/[id]/route.ts
```

**Step 2: Review Next.js 15 Changes**
- Next.js 15 made `params` asynchronous
- Must await `context.params` before accessing

### Root Cause

Using old synchronous params pattern:

```typescript
// ❌ OLD (breaks in Next.js 15)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params // ❌ params is now a Promise!
}
```

### Solution

Use new async params pattern:

```typescript
// ✅ NEW (Next.js 15 compatible)
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params // ✅ Await the Promise
  // ... rest of handler
}
```

### Validation
- [x] Type check passes
- [x] Build succeeds
- [x] API routes work correctly
- [x] All dynamic routes updated

### Pattern
**Always await context.params** in Next.js 15 API routes.

---

## Bug #4: Payment Amount Format Error (NetCash)

### Symptom
Payment transactions fail with "Invalid amount format" error from NetCash.

### Impact
- **Severity**: Critical
- **Users affected**: All customers attempting payment
- **Environment**: Production

### Investigation

**Step 1: Check NetCash Error Response**
```json
{
  "error": "Amount must be in cents (integer)",
  "received": "799.00"
}
```

**Step 2: Review Payment Code**
```typescript
// lib/payments/netcash-client.ts
const amount = package.price // 799.00 (decimal)
await netcash.initiatePayment({ amount })
```

**Step 3: Check NetCash API Docs**
- Amount must be in cents (integer)
- Example: R799.00 should be sent as 79900

### Root Cause

Sending amount as decimal instead of cents:

```typescript
// ❌ BROKEN
const amount = 799.00 // Should be 79900
```

### Solution

Convert amount to cents before sending:

```typescript
// ✅ FIXED
const amountInCents = Math.round(package.price * 100)
await netcash.initiatePayment({ amount: amountInCents })

// Example: 799.00 * 100 = 79900 cents
```

### Validation
- [x] Payments process successfully
- [x] Correct amount charged
- [x] NetCash accepts format
- [x] Edge cases tested (999.99, 0.01)

### Pattern
**Always convert currency to smallest unit** (cents) for payment APIs.

---

## Bug #5: Broken Quick Action Links (Dashboard)

### Symptom
Clicking "Log a Ticket" or "Get Help" on customer dashboard navigates to 404 pages.

### Impact
- **Severity**: Medium
- **Users affected**: All customers
- **Environment**: Production

### Investigation

**Step 1: Check Link Targets**
```typescript
// components/dashboard/QuickActionCards.tsx
<Link href="/dashboard/tickets">Log a Ticket</Link>
// Navigates to /dashboard/tickets which doesn't exist!
```

**Step 2: Check Routes**
```bash
ls app/dashboard/
# No tickets/ directory exists
# No support/ directory exists
```

### Root Cause

Links point to non-existent routes that haven't been implemented yet.

### Solution

**Option 1**: Remove non-existent routes
**Option 2**: Replace with external links
**Option 3**: Implement the routes

**Chose Option 2** (Quick fix):

```typescript
// ✅ FIXED
<a href="mailto:support@circletel.co.za">Log a Ticket</a>
<Link href="https://circletel.co.za/support">Get Help</Link>
```

### Validation
- [x] Links work correctly
- [x] No 404 errors
- [x] Opens email client or support page
- [x] User experience improved

### Pattern
**Don't link to unimplemented routes** - use placeholder or external links instead.

---

## Bug #6: Memory Heap Overflow on Build

### Symptom
Build fails with "JavaScript heap out of memory" error.

### Impact
- **Severity**: High (blocks deployment)
- **Users affected**: N/A (build issue)
- **Environment**: CI/CD, local builds

### Investigation

**Step 1: Run Build**
```bash
npm run build

# Error:
# FATAL ERROR: Reached heap limit Allocation failed
# - JavaScript heap out of memory
```

**Step 2: Check Package.json**
```json
{
  "scripts": {
    "build": "next build" // No memory limit
  }
}
```

**Step 3: Measure Codebase Size**
- 300+ React components
- 150+ API routes
- 200+ TypeScript files
- Large type definitions from Supabase

### Root Cause

Default Node.js heap size (512MB) too small for large TypeScript compilation.

### Solution

Use increased heap limit for builds:

```json
// package.json
{
  "scripts": {
    "build": "next build",
    "build:memory": "NODE_OPTIONS='--max-old-space-size=8192' next build",
    "build:ci": "NODE_OPTIONS='--max-old-space-size=6144' next build"
  }
}
```

### Validation
- [x] Build succeeds with `npm run build:memory`
- [x] CI/CD updated to use `build:ci`
- [x] Vercel deployment successful
- [x] Development uses `dev:memory`

### Pattern
**Use memory-optimized scripts** for large TypeScript projects.

---

## Common Patterns Learned

### Pattern 1: Async Error Handling
```typescript
// Always use try/catch/finally
try {
  // Operation
} catch (error) {
  // Handle error
} finally {
  // Cleanup (always runs)
}
```

### Pattern 2: RLS Policies
```sql
-- Always add service role policy for API access
CREATE POLICY "service_role_all" ON public.table_name
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');
```

### Pattern 3: Next.js 15 Compatibility
```typescript
// Await async params
const { id } = await context.params
```

### Pattern 4: Payment API Integration
```typescript
// Convert to smallest unit (cents)
const amountInCents = Math.round(amount * 100)
```

### Pattern 5: Memory Management
```bash
# Use memory-optimized commands
npm run dev:memory
npm run build:memory
```

---

**Version**: 1.0.0
**Last Updated**: 2025-11-08
**Bugs Documented**: 6
