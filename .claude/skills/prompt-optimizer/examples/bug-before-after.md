# Bug Fix: Before & After Examples

Examples of how the Prompt Optimizer skill transforms vague bug reports into structured debugging tasks.

---

## Example 1: Dashboard Loading Issue

### ❌ BEFORE (Vague)
```
Dashboard not loading
```

### ✅ AFTER (Optimized)
```markdown
## Objective
Fix the customer dashboard infinite loading state that occurs after successful login.

## Context
- **Current behavior**: User logs in successfully but dashboard shows "Loading..." spinner indefinitely
- **Expected behavior**: Dashboard should load within 3 seconds and display customer data (services, billing, orders)
- **Affected systems**: Customer authentication, dashboard data fetching, API routes
- **Related files**:
  - `app/dashboard/page.tsx`
  - `components/providers/CustomerAuthProvider.tsx`
  - `app/api/dashboard/summary/route.ts`

## Error Details
- **Error message**: No console errors visible
- **Stack trace**: N/A
- **Error code**: N/A
- **Frequency**: Happens every time on production, not on local dev
- **Impact**: All customers affected (critical bug)

## Reproduction Steps
1. Navigate to https://www.circletel.co.za/auth/login
2. Enter valid credentials: jeffrey.de.wee@circletel.co.za / password
3. Click "Sign In"
4. After redirect to /dashboard
5. **Expected result**: Dashboard loads with data
6. **Actual result**: Loading spinner shows indefinitely, no data appears

## Environment
- **Browser**: Chrome 120.0.6099.130 (also tested Firefox 119)
- **OS**: Windows 11
- **Device**: Desktop (also tested mobile)
- **Deployment**: Production (www.circletel.co.za)
- **Node version**: 20.x (Vercel deployment)
- **Next.js version**: 15.0.3

## Console Output
```
[Customer Auth Provider] Initializing...
[Customer Auth Provider] Session found for user: abc-123-def
[Dashboard] Component mounted
[Dashboard] Fetching summary data...
(no further logs - stuck here)
```

## Network Tab
- `/api/dashboard/summary` request: **Pending** (never completes)
- Other API calls: Normal (complete successfully)

## Recent Changes
- **Recent deployments**:
  - 2025-11-09: Deployed authentication header fix (commit ac642e8)
  - 2025-11-08: Added middleware privacy link fix (commit 114071e)
- **Recent commits**: Authorization header pattern change
- **Recent PRs**: PR #234 - Fix dashboard 401 errors (merged Nov 9)

## Root Cause Analysis
- **Hypothesis 1**: API route `/api/dashboard/summary` is timing out
  - **Evidence**: Request shows "Pending" and never completes
  - **Likelihood**: High (most likely)

- **Hypothesis 2**: Missing `finally` block causing loading state to stay true
  - **Evidence**: This is a common CircleTel pattern (see CLAUDE.md)
  - **Likelihood**: Medium

- **Hypothesis 3**: Authorization header not being read correctly
  - **Evidence**: Recent changes to auth header pattern
  - **Likelihood**: Medium

## Requirements
1. Identify why `/api/dashboard/summary` request never completes
2. Fix the root cause (timeout, missing finally block, or auth issue)
3. Ensure loading state is properly managed in all code paths
4. Add comprehensive error handling
5. Add timeout protection (max 10 seconds)
6. Add proper logging for debugging

## Constraints
- Must not break existing authentication flow
- Should maintain current UI/UX when working
- Fix should follow CircleTel patterns (CLAUDE.md)
- No database schema changes required
- Must work on both local dev and production

## Acceptance Criteria
- [ ] Dashboard loads successfully after login (within 3 seconds)
- [ ] Loading spinner disappears after data fetch completes
- [ ] Error states display appropriate messages (if API fails)
- [ ] No infinite loops or re-renders
- [ ] Console shows clear debug logs for troubleshooting
- [ ] Network tab shows `/api/dashboard/summary` completing successfully
- [ ] Type check passes: `npm run type-check`
- [ ] Build succeeds: `npm run build:memory`
- [ ] Manual test on production: Login → Dashboard loads
- [ ] Manual test on local dev: Login → Dashboard loads

## CircleTel Patterns to Follow
- **Pattern**: Infinite Loading Fix (CLAUDE.md Common Debugging Patterns)
- **Reference**: `components/providers/CustomerAuthProvider.tsx:64-76`
- **Always use finally block** to set loading=false
- **Add try/catch** for comprehensive error handling
- **Add timeout protection** on all API queries (10 seconds max)

## Debugging Approach
1. **Check API Route** (`app/api/dashboard/summary/route.ts`):
   - Add console.log at function entry
   - Add console.log before each database query
   - Add timeout protection (10 seconds max)
   - Verify authorization header is being read correctly
   - Check if service role client is used correctly

2. **Check Dashboard Page** (`app/dashboard/page.tsx`):
   - Add console.log to track loading state changes
   - Verify finally block exists for setting loading=false
   - Add error handling for failed API calls
   - Add timeout handling (abort after 10 seconds)

3. **Check Customer Auth Provider** (`components/providers/CustomerAuthProvider.tsx`):
   - Verify session is being passed correctly
   - Check that loading state is managed properly
   - Ensure error handling in auth state callback

4. **Test Locally**:
   - Run: `npm run dev:memory`
   - Login with test credentials
   - Observe console logs for API flow
   - Verify dashboard loads within 3 seconds

5. **Deploy to Staging**:
   - Push fix to staging branch
   - Test on https://circletel-staging.vercel.app
   - Verify fix works before production deploy

## Testing Strategy
1. **Reproduce bug** on production (verify bug exists)
2. **Add instrumentation** (console.logs in API route and dashboard page)
3. **Identify root cause** (which query is slow/hanging?)
4. **Apply fix** (timeout protection + proper error handling)
5. **Verify fix locally** (dashboard loads quickly)
6. **Test on staging** (verify in deployed environment)
7. **Deploy to production** (merge to main)
8. **Regression test** (test other dashboard features still work)

## CircleTel-Specific Debugging Checklist

### Check for Infinite Loading Pattern
- [ ] Does `app/dashboard/page.tsx` have finally block?
- [ ] Is `setLoading(false)` in the finally block?
- [ ] Is there try/catch/finally for API call?
- [ ] Reference: `components/providers/CustomerAuthProvider.tsx:64-76`

### Check for Authorization Issue
- [ ] Does API route check both Authorization header AND cookies?
- [ ] Is the pattern: `const authHeader = request.headers.get('authorization')`?
- [ ] Does it fall back to cookies if header missing?
- [ ] Reference: Recent auth fix (commit ac642e8)

### Check for Timeout Issue
- [ ] Is there timeout protection on database queries?
- [ ] Are queries using proper indexes?
- [ ] Could a query be doing a full table scan?
- [ ] Add: `signal: AbortSignal.timeout(10000)` to fetch calls

## Validation Checklist

### Immediate (2 min)
- [ ] Bug no longer reproduces on production
- [ ] Dashboard loads within 3 seconds
- [ ] No console errors
- [ ] Loading spinner disappears

### Code Quality (5 min)
- [ ] Type check passes
- [ ] No linting errors
- [ ] Follows CircleTel patterns
- [ ] Error handling is comprehensive
- [ ] Timeout protection added

### Build & Deploy (10 min)
- [ ] Build succeeds
- [ ] Staging test passes
- [ ] Production deployment successful
- [ ] No performance regression

### Documentation (5 min)
- [ ] Fix documented in commit message
- [ ] Updated CLAUDE.md if new pattern
- [ ] Team notified of fix
- [ ] Post-mortem created (if needed)
```

---

## Example 2: Payment Webhook Error

### ❌ BEFORE (Vague)
```
Payments not working
```

### ✅ AFTER (Optimized)
```markdown
## Objective
Fix NetCash payment webhook errors causing orders to remain in "pending" status even after successful payment.

## Context
- **Current behavior**: Customer completes payment successfully on NetCash, but order status never updates to "paid"
- **Expected behavior**: After successful payment, webhook should update order status to "paid" and trigger order creation
- **Affected systems**: Payment webhooks, order creation, NetCash integration
- **Related files**:
  - `app/api/payments/webhook/route.ts`
  - `lib/payments/payment-processor.ts`
  - `lib/payments/netcash-client.ts`

## Error Details
- **Error message**:
  ```
  [NetCash Webhook] ❌ Invalid webhook signature
  Received: abc123...
  Expected: xyz789...
  ```
- **Stack trace**: N/A (logged error, not exception)
- **Error code**: 401 Unauthorized
- **Frequency**: Happens on every payment (100% of webhooks fail)
- **Impact**: All new orders stuck in pending status (critical)

## Reproduction Steps
1. Create test order on staging: https://circletel-staging.vercel.app/order
2. Complete order flow to payment stage
3. Enter test card details on NetCash Pay Now
4. Complete payment (payment succeeds on NetCash side)
5. **Expected result**: Order status updates to "paid", customer receives confirmation
6. **Actual result**: Order remains in "pending" status, no confirmation sent

## Environment
- **Deployment**: Staging (circletel-staging.vercel.app)
- **NetCash**: Test environment (paygate.paygate.co.za)
- **Node version**: 20.x
- **Next.js version**: 15.0.3

## Console Output (Vercel Logs)
```
[NetCash Webhook] Webhook received
[NetCash Webhook] Payload: {"TransactionId":"123","Amount":"79900","Status":"1"}
[NetCash Webhook] Signature: abc123def456...
[NetCash Webhook] ❌ Invalid webhook signature
[NetCash Webhook] Expected: xyz789ghi012...
[NetCash Webhook] Webhook rejected with 401
```

## Network Tab (NetCash Side)
- NetCash sends webhook to: `POST https://circletel-staging.vercel.app/api/payments/webhook`
- NetCash receives: `401 Unauthorized`
- NetCash retries: 3 times (all fail)

## Recent Changes
- **Recent deployments**:
  - 2025-11-08: Updated webhook signature verification (commit b1c2d3e)
  - 2025-11-07: Added HMAC-SHA256 verification (commit a4b5c6d)
- **Recent commits**: Changed webhook secret from env var
- **Recent PRs**: PR #245 - Enhanced webhook security (merged Nov 8)

## Root Cause Analysis
- **Hypothesis 1**: Webhook secret mismatch between NetCash and our API
  - **Evidence**: Signature verification failing consistently
  - **Likelihood**: Very High (most likely)

- **Hypothesis 2**: Incorrect HMAC algorithm or encoding
  - **Evidence**: Recent changes to signature verification
  - **Likelihood**: High

- **Hypothesis 3**: Webhook payload being modified before signature verification
  - **Evidence**: Body parsing might alter payload
  - **Likelihood**: Medium

## Requirements
1. Identify why webhook signature verification is failing
2. Fix signature verification to match NetCash algorithm
3. Ensure webhook secret is correct in environment variables
4. Add comprehensive logging for debugging
5. Test with NetCash test webhooks
6. Ensure order status updates correctly after fix

## Constraints
- Must follow HMAC-SHA256 standard for signature verification
- Webhook secret must be kept secure (env variable)
- Must validate webhook before processing to prevent fraud
- Should match CircleTel webhook pattern (CLAUDE.md)
- No database schema changes required

## Acceptance Criteria
- [ ] NetCash webhook signature validation passes
- [ ] Order status updates to "paid" after successful payment
- [ ] Customer receives payment confirmation email
- [ ] Order creation triggered automatically
- [ ] Webhook failures logged with helpful error messages
- [ ] Type check passes: `npm run type-check`
- [ ] Test webhook from NetCash test environment succeeds
- [ ] Production webhook verified (after staging test)

## CircleTel Patterns to Follow
- **Pattern**: Webhook Signature Verification (CLAUDE.md TypeScript Patterns)
- **Reference**: `lib/integrations/didit/webhook-handler.ts` (similar HMAC pattern)
- **Use timing-safe comparison**: `crypto.timingSafeEqual()`
- **Read raw body**: Use `request.text()` before JSON.parse()

## Debugging Approach
1. **Verify Webhook Secret**:
   - Check `.env` file: Is `NETCASH_WEBHOOK_SECRET` correct?
   - Compare with NetCash dashboard: Does secret match?
   - Check Vercel env vars: Is secret set in production?

2. **Test Signature Algorithm**:
   - Log received payload (raw text)
   - Log received signature (from header)
   - Log our calculated signature
   - Compare step-by-step

3. **Check Webhook Code** (`app/api/payments/webhook/route.ts`):
   ```typescript
   // Verify this pattern:
   const payload = await request.text()  // Raw body
   const signature = request.headers.get('x-webhook-signature')
   const expectedSig = crypto.createHmac('sha256', secret)
     .update(payload)
     .digest('hex')
   // Use timing-safe comparison
   ```

4. **Test with NetCash Test Webhook**:
   - Use NetCash dashboard to send test webhook
   - Verify signature passes
   - Verify order status updates

## Testing Strategy
1. **Check environment variables** (webhook secret)
2. **Add debug logging** (payload, signature, expected)
3. **Test locally** with mock NetCash webhook
4. **Deploy to staging** and test with real NetCash test webhook
5. **Verify order update** (status changes to "paid")
6. **Test on production** with small test payment

## Environment Variables to Check
```env
# Verify these are set correctly:
NETCASH_WEBHOOK_SECRET=<secret_from_netcash_dashboard>
NETCASH_SERVICE_KEY=<service_key>
NETCASH_MERCHANT_ID=<merchant_id>
```

## Validation Checklist

### Immediate (5 min)
- [ ] Webhook signature validation passes
- [ ] No 401 errors in Vercel logs
- [ ] Order status updates correctly

### Code Quality (5 min)
- [ ] Type check passes
- [ ] Follows HMAC-SHA256 pattern
- [ ] Uses timing-safe comparison
- [ ] Error handling is comprehensive

### Integration Test (15 min)
- [ ] Test webhook from NetCash test environment
- [ ] Verify payload parsing
- [ ] Verify signature validation
- [ ] Verify order status update
- [ ] Verify email notification sent

### Production Test (10 min)
- [ ] Small test payment on production
- [ ] Webhook processed successfully
- [ ] Order status updated
- [ ] Customer confirmation sent
```

---

## Example 3: Type Error

### ❌ BEFORE (Vague)
```
Code won't compile
```

### ✅ AFTER (Optimized)
```markdown
## Objective
Fix TypeScript compilation error in admin orders API route caused by Next.js 15 async params pattern.

## Context
- **Current behavior**: `npm run type-check` fails with type error in orders API route
- **Expected behavior**: Type check should pass without errors
- **Affected systems**: Admin API routes, TypeScript compilation
- **Related files**:
  - `app/api/admin/orders/[id]/route.ts`

## Error Details
- **Error message**:
  ```
  Type 'Promise<{ id: string }>' is not assignable to type '{ id: string }'
  File: app/api/admin/orders/[id]/route.ts:12:15
  ```
- **Full error**:
  ```
  app/api/admin/orders/[id]/route.ts:12:15 - error TS2322: Type 'Promise<{ id: string }>' is not assignable to type '{ id: string }'.

  12   const { id } = params
                      ~~~~~~

  Found 1 error.
  ```
- **Error code**: TS2322
- **Frequency**: Happens every time on type check
- **Impact**: Blocks production build

## Reproduction Steps
1. Run: `npm run type-check:memory`
2. **Expected result**: Type check passes (0 errors)
3. **Actual result**: Type error in `app/api/admin/orders/[id]/route.ts:12`

## Environment
- **TypeScript version**: 5.3.3
- **Next.js version**: 15.0.3
- **Node version**: 20.x

## Recent Changes
- **Recent commits**: None to this file recently
- **Recent PRs**: None affecting this file
- **Next.js upgrade**: Upgraded from 14.2 to 15.0 last week

## Root Cause Analysis
- **Hypothesis 1**: Next.js 15 made params async (breaking change)
  - **Evidence**: Error shows `Promise<{ id: string }>` (params is now a Promise)
  - **Likelihood**: Very High (this is a known Next.js 15 change)

## Requirements
1. Fix the type error by using Next.js 15 async params pattern
2. Ensure type check passes
3. Verify API route still works correctly
4. Apply same fix to other API routes with params (if any)

## Constraints
- Must follow Next.js 15 patterns (CLAUDE.md)
- Should maintain existing functionality
- No breaking changes to API contract
- Must work in both dev and production

## Acceptance Criteria
- [ ] Type check passes: `npm run type-check`
- [ ] API route works correctly: GET /api/admin/orders/[id]
- [ ] No TypeScript errors
- [ ] Build succeeds: `npm run build:memory`
- [ ] Manual test: API returns order data correctly

## CircleTel Patterns to Follow
- **Pattern**: Next.js 15 Async Params (CLAUDE.md TypeScript Patterns)
- **Example**:
  ```typescript
  // ❌ OLD (Next.js 14)
  export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
  ) {
    const { id } = params
  }

  // ✅ NEW (Next.js 15)
  export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
  ) {
    const { id } = await context.params
  }
  ```

## Debugging Approach
1. **Identify pattern issue**:
   - Current code uses synchronous params
   - Next.js 15 requires await context.params

2. **Apply fix**:
   - Change param destructuring
   - Add await before params access
   - Update type annotation

3. **Find other instances**:
   - Search codebase for similar pattern
   - Apply fix to all API routes with params

## Fix Implementation
```typescript
// File: app/api/admin/orders/[id]/route.ts

// BEFORE (causing error):
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params  // ❌ Error: params is Promise
  // ... rest of code
}

// AFTER (fixed):
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params  // ✅ Await the Promise
  // ... rest of code
}
```

## Testing Strategy
1. **Apply fix** to `app/api/admin/orders/[id]/route.ts`
2. **Run type check**: `npm run type-check:memory`
3. **Verify no errors**
4. **Search for similar patterns**:
   ```bash
   grep -r "{ params }" app/api/
   ```
5. **Apply fix to all matching files**
6. **Run type check again**
7. **Test API routes** manually (GET /api/admin/orders/123)

## Validation Checklist
- [ ] Type check passes (0 errors)
- [ ] Build succeeds
- [ ] API route tested manually
- [ ] Other API routes checked for same issue
- [ ] No regression in functionality
```

---

**Example Version**: 1.0.0
**Purpose**: Demonstrate prompt optimization for bug fixes
