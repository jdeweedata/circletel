# Admin Login Timeout Workaround - Fast Fail Implementation

**Date**: 2025-11-08  
**Status**: ✅ **IMPLEMENTED** - Ready for deployment  
**Severity**: CRITICAL  
**Impact**: All admin users experiencing 30-second login timeout

---

## Issue Summary

Admin login at `https://www.circletel.co.za/admin/login` times out after 30 seconds with error:
```
socket hang up (ECONNRESET)
```

### Root Cause
**Supabase Auth service is experiencing severe performance degradation** (taking 324+ seconds for token operations). This is a platform-level issue, not a code issue.

Previous fixes implemented:
- ✅ Async audit logging (prevents blocking on database writes)
- ✅ RLS INSERT policies for activity logs
- ❌ **Still failing**: Supabase Auth itself is too slow

---

## Solution: Fast Fail with Timeout

Since we can't fix Supabase's platform issues, we've implemented a **10-second timeout** on the authentication call to:
1. **Fail fast** instead of letting users wait 30+ seconds
2. **Provide clear feedback** about the service degradation
3. **Log timeout incidents** for monitoring
4. **Return proper HTTP status** (503 Service Unavailable)

### Implementation

#### Backend Changes (`app/api/admin/login/route.ts`)

**Before**:
```typescript
// Direct auth call with no timeout
const { data: authData, error: authError } = await supabaseSSR.auth.signInWithPassword({
  email: normalizedEmail,
  password: password,
});
```

**After**:
```typescript
// Add 10-second timeout wrapper
const AUTH_TIMEOUT = 10000; // 10 seconds
const authPromise = supabaseSSR.auth.signInWithPassword({
  email: normalizedEmail,
  password: password,
});

const timeoutPromise = new Promise<never>((_, reject) => {
  setTimeout(() => {
    reject(new Error('Authentication timeout - Supabase Auth service may be experiencing issues'));
  }, AUTH_TIMEOUT);
});

let authData, authError;
try {
  const result = await Promise.race([authPromise, timeoutPromise]);
  authData = result.data;
  authError = result.error;
  console.log('[Login API] ⏱️ Supabase Auth completed:', Date.now() - startTime, 'ms');
} catch (timeoutError) {
  console.error('[Login API] ❌ Supabase Auth timeout:', Date.now() - startTime, 'ms');
  
  // Log timeout issue for monitoring
  await supabaseAdmin.from('admin_audit_logs').insert({
    user_email: normalizedEmail,
    admin_user_id: adminUser.id,
    action: 'login_failed_auth_timeout',
    action_category: 'authentication',
    ip_address: ipAddress,
    user_agent: userAgent,
    metadata: { 
      error: timeoutError instanceof Error ? timeoutError.message : 'Unknown timeout error',
      timeout_ms: AUTH_TIMEOUT,
      elapsed_ms: Date.now() - startTime
    },
    status: 'failure',
    severity: 'critical',
  });
  
  return NextResponse.json(
    { 
      success: false, 
      error: 'Authentication service is currently slow. Please try again in a few moments.',
      technical_error: 'AUTH_TIMEOUT'
    },
    { status: 503 } // Service Unavailable
  );
}
```

#### Frontend Changes (`app/admin/login/page.tsx`)

**Enhanced Error Handling**:
```typescript
// Check for timeout error specifically
if (result.technical_error === 'AUTH_TIMEOUT') {
  throw new Error(result.error || 'Authentication service timeout. Please wait a moment and try again.');
}

// Show longer duration toast for timeout errors
const isTimeout = errorMessage.includes('timeout') || errorMessage.includes('slow');
toast.error(errorMessage, {
  duration: isTimeout ? 8000 : 5000, // 8 seconds for timeouts
  description: isTimeout 
    ? 'The authentication service is experiencing delays. You may need to wait a few minutes.' 
    : undefined
});
```

---

## Benefits

### 1. Better User Experience
- **Before**: Wait 30 seconds → "socket hang up" error
- **After**: Wait 10 seconds → Clear timeout message with guidance

### 2. Faster Failure Detection
- Reduces wait time from 30s to 10s
- Users know immediately there's a service issue
- Can retry without long waits

### 3. Monitoring & Diagnostics
- Timeout events logged to `admin_audit_logs` with severity: `critical`
- Includes elapsed time and error details
- Helps track Supabase Auth performance issues

### 4. Proper HTTP Status Codes
- Returns **503 Service Unavailable** for timeout
- Indicates transient issue (vs 500 Internal Server Error)
- Better for monitoring tools and health checks

---

## User-Facing Messages

### API Response (Timeout)
```json
{
  "success": false,
  "error": "Authentication service is currently slow. Please try again in a few moments.",
  "technical_error": "AUTH_TIMEOUT"
}
```

### Browser Toast (Timeout)
```
❌ Authentication service is currently slow. Please try again in a few moments.

The authentication service is experiencing delays. You may need to wait a few minutes.
```
**Duration**: 8 seconds (longer than normal errors)

---

## Testing

### Test Script
Run the existing performance test:
```bash
node scripts/test-login-performance.js
```

**Before Fix**:
```
⏰ Request timed out after 30 seconds
❌ Request failed after 30265ms
   Error: socket hang up
```

**After Fix (Expected)**:
```
⏱️  Response Time: ~10,000ms
📊 Status Code: 503
❌ Login failed!
   Error: Authentication service is currently slow. Please try again in a few moments.
```

### Manual Testing
1. Navigate to `https://www.circletel.co.za/admin/login`
2. Enter credentials: `devadmin@circletel.co.za` / password
3. Expected behavior:
   - Wait maximum 10 seconds
   - See timeout error message with helpful description
   - Can retry immediately

### Verify Timeout Logs
Check audit logs for timeout tracking:
```sql
SELECT 
  created_at,
  action,
  user_email,
  metadata->>'timeout_ms' as timeout_ms,
  metadata->>'elapsed_ms' as elapsed_ms,
  metadata->>'error' as error_message
FROM admin_audit_logs
WHERE action = 'login_failed_auth_timeout'
ORDER BY created_at DESC
LIMIT 10;
```

---

## Files Modified

1. **app/api/admin/login/route.ts** (49 lines added)
   - Added `AUTH_TIMEOUT` constant (10 seconds)
   - Implemented `Promise.race()` for timeout
   - Added timeout error handling
   - Added `login_failed_auth_timeout` audit logging
   - Returns 503 status with `technical_error` field

2. **app/admin/login/page.tsx** (14 lines added)
   - Added timeout error detection
   - Enhanced toast message with description
   - Longer toast duration for timeout errors (8s vs 5s)

3. **docs/fixes/ADMIN_LOGIN_TIMEOUT_WORKAROUND.md** (This file)
   - Complete documentation of workaround
   - Testing procedures
   - Monitoring queries

---

## Monitoring Recommendations

### 1. Track Timeout Frequency
```sql
-- Count timeouts per hour (last 24 hours)
SELECT 
  date_trunc('hour', created_at) as hour,
  COUNT(*) as timeout_count,
  AVG((metadata->>'elapsed_ms')::int) as avg_elapsed_ms
FROM admin_audit_logs
WHERE action = 'login_failed_auth_timeout'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY date_trunc('hour', created_at)
ORDER BY hour DESC;
```

### 2. Identify Affected Users
```sql
-- Users experiencing timeouts
SELECT 
  user_email,
  COUNT(*) as timeout_attempts,
  MAX(created_at) as last_timeout,
  AVG((metadata->>'elapsed_ms')::int) as avg_wait_ms
FROM admin_audit_logs
WHERE action = 'login_failed_auth_timeout'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY user_email
ORDER BY timeout_attempts DESC;
```

### 3. Compare Success vs Timeout Rates
```sql
-- Login success vs timeout rate (last 24 hours)
SELECT 
  CASE 
    WHEN action = 'login_success' THEN 'Success'
    WHEN action = 'login_failed_auth_timeout' THEN 'Timeout'
    ELSE 'Other Failure'
  END as login_outcome,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM admin_audit_logs
WHERE action_category = 'authentication'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY login_outcome
ORDER BY count DESC;
```

---

## Escalation Path

### When to Contact Supabase Support

If timeout rate exceeds **20%** of login attempts:

1. **Gather Evidence**:
   - Run monitoring queries above
   - Note timestamps of timeout spikes
   - Collect example `admin_audit_logs` entries

2. **Contact Supabase Support**:
   - Dashboard: https://supabase.com/dashboard/support
   - Email: support@supabase.io
   - Subject: "Auth Service Performance Degradation - Project agyjovdugmtopasyvlng"

3. **Include in Report**:
   - Project ID: `agyjovdugmtopasyvlng`
   - Timeout frequency and duration
   - Example audit log entries
   - Impact on business operations

---

## Deployment Checklist

- [x] Code changes implemented
- [x] Frontend error handling updated
- [x] Documentation created
- [ ] Code committed to repository
- [ ] Pushed to main branch
- [ ] Vercel auto-deployment triggered
- [ ] Production deployment verified
- [ ] Test script run on production
- [ ] Monitoring queries run to verify logs
- [ ] Support team notified of workaround

---

## Limitations

### What This Fix Does NOT Solve
1. **Supabase Auth slowness** - This is a platform issue
2. **Successful logins** - Still requires Supabase Auth to respond within 10s
3. **Long-term solution** - This is a **workaround**, not a fix

### When This Workaround Won't Help
- If Supabase Auth is completely down (not just slow)
- If network connectivity is the issue (user's internet)
- If credentials are invalid (normal auth failure)

---

## Next Steps

### Short-term (This Week)
1. Deploy workaround to production
2. Monitor timeout frequency
3. Contact Supabase Support if issue persists

### Medium-term (Next 2 Weeks)
1. Consider caching admin user credentials in memory
2. Implement session token refresh with longer TTL
3. Add health check endpoint for Supabase Auth status

### Long-term (Next Month)
1. Evaluate alternative auth providers (Clerk, Auth0)
2. Implement backup authentication mechanism
3. Design graceful degradation for auth failures

---

## Related Issues

- `docs/fixes/ADMIN_LOGIN_TIMEOUT_FIX.md` - Initial async audit logging fix
- `docs/fixes/ADMIN_LOGIN_RLS_POLICY_FIX.md` - RLS policy additions
- `scripts/test-login-performance.js` - Performance testing tool

---

**Created**: 2025-11-08  
**Author**: Claude Code  
**Issue**: Admin login timeout due to Supabase Auth degradation  
**Solution**: 10-second timeout with fast fail and clear user feedback  
**Status**: ✅ Ready for deployment
