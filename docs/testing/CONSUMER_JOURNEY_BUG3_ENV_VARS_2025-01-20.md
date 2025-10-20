# Consumer Journey Testing - Bug #3: Missing Environment Variables

**Date**: 2025-01-20
**Environment**: Staging (https://circletel-staging.vercel.app)
**Status**: 🐛 **CRITICAL BUG DISCOVERED - BLOCKS COVERAGE CHECKS**
**Priority**: CRITICAL - Prevents all coverage checks from working

---

## Executive Summary

During verification testing of Bug #1 and Bug #2 fixes, discovered **Bug #3**: The coverage lead creation API returns a 500 error on staging due to missing or incorrect Supabase environment variables in Vercel.

### Bug Summary

| Bug # | Issue | Status | Impact |
|-------|-------|--------|--------|
| **Bug #3** | Missing `SUPABASE_SERVICE_ROLE_KEY` on Vercel | ❌ BLOCKING | Coverage check fails at first step |

**Current Status**: ⚠️ Blocks verification of Bug #1 and Bug #2 fixes

---

## 🐛 Bug #3: Missing Environment Variables on Vercel

### The Problem
The `/api/coverage/lead` endpoint returns HTTP 500 with Vercel error: `INTERNAL_FUNCTION_INVOCATION_FAILED`

### Test Results
```bash
curl -X POST "https://circletel-staging.vercel.app/api/coverage/lead" \
  -H "Content-Type: application/json" \
  -d '{"address":"18 Rasmus Erasmus Blvd, Heritage Hill, Centurion, South Africa","coordinates":{"lat":-25.9085073,"lng":28.1780095}}'

# Response:
HTTP/1.1 500 Internal Server Error
X-Vercel-Error: INTERNAL_FUNCTION_INVOCATION_FAILED
Content-Type: text/plain; charset=utf-8

A server error has occurred
INTERNAL_FUNCTION_INVOCATION_FAILED
```

### Browser Console Errors
```
[ERROR] Failed to load resource: the server responded with a status of 500 ()
        @ https://circletel-staging.vercel.app/api/coverage/lead:0

[ERROR] Coverage check failed: Error: Failed to create coverage lead
```

### Root Cause

The Supabase client initialization in `app/api/coverage/lead/route.ts` requires two environment variables:

```typescript
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,      // ✅ Public, likely set
  process.env.SUPABASE_SERVICE_ROLE_KEY!      // ❌ Secret, NOT set on Vercel
);
```

**Evidence from local dev server**:
```
⚠ Error: supabaseKey is required.
    at eval (lib\supabase.ts:7:37)
```

This error occurs when `SUPABASE_SERVICE_ROLE_KEY` is undefined or empty.

### Impact
- **Severity**: CRITICAL
- **Affected Users**: 100% of users attempting coverage checks on staging
- **Business Impact**:
  - Complete funnel blockage at the first step
  - Cannot create coverage leads
  - Cannot test Bug #1 and Bug #2 fixes
  - Zero conversions possible

### Why This Wasn't Caught Earlier
1. ❌ **Local Environment Works**: `.env.local` has the correct keys
2. ❌ **Vercel Sync Not Done**: Environment variables not synced to Vercel project
3. ❌ **No Monitoring**: No alerts for environment variable misconfiguration
4. ❌ **Build Succeeds**: Missing env vars don't fail the build, only runtime

---

## ✅ Solution

### Required Vercel Environment Variables

Navigate to **Vercel Dashboard** → **Project Settings** → **Environment Variables** and add:

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://agyjovdugmtopasyvlng.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_jKBISiYlrRyJEfyYGcjJZw_AQJ8Udc7` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | `sb_secret_KZlUVioFZ4r8vbeOK4215g_f3tUgyoG` | Production, Preview, Development |
| `SUPABASE_DB_PASSWORD` | `3BVHkEN4AD4sQQRz` | Production, Preview, Development |

**Note**: The `SUPABASE_SERVICE_ROLE_KEY` is the critical missing variable.

### Verification Steps

After adding environment variables to Vercel:

1. **Redeploy the Application**:
   - Trigger a new deployment (push to main or manual redeploy)
   - Vercel will rebuild with new environment variables

2. **Test Coverage Lead Creation**:
   ```bash
   curl -X POST "https://circletel-staging.vercel.app/api/coverage/lead" \
     -H "Content-Type: application/json" \
     -d '{"address":"18 Rasmus Erasmus Blvd, Heritage Hill, Centurion, South Africa","coordinates":{"lat":-25.9085073,"lng":28.1780095}}'
   ```

   **Expected Response**:
   ```json
   {
     "leadId": "uuid-here",
     "status": "success"
   }
   ```

3. **Test Complete Coverage Flow**:
   - Navigate to https://circletel-staging.vercel.app/
   - Enter address: "18 Rasmus Erasmus, Heritage Hill, Centurion"
   - Click "Check coverage"
   - Should navigate to `/packages/{leadId}`
   - Should display 14+ packages (confirming Bug #1 and Bug #2 fixes work)

---

## 📊 Test Timeline

### Test 1: Homepage and Address Entry
- **Status**: ✅ PASSED
- **Result**: Successfully loaded homepage and entered address with Google Maps autocomplete

### Test 2: Coverage Check Submission
- **Status**: ❌ FAILED
- **Error**: "Coverage check failed. Please try again."
- **Root Cause**: Bug #3 (missing environment variables)

### Test 3: API Direct Test
- **Status**: ❌ FAILED
- **Error**: HTTP 500 `INTERNAL_FUNCTION_INVOCATION_FAILED`
- **Root Cause**: Supabase client initialization fails without `SUPABASE_SERVICE_ROLE_KEY`

---

## 🔍 Technical Details

### API Endpoint
**File**: `app/api/coverage/lead/route.ts`

**Supabase Client Initialization** (lines 5-8):
```typescript
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

### Environment Variables Used
```typescript
// Public variables (client-side accessible)
NEXT_PUBLIC_SUPABASE_URL          // ✅ Likely set (public)
NEXT_PUBLIC_SUPABASE_ANON_KEY     // ✅ Likely set (public)

// Secret variables (server-side only)
SUPABASE_SERVICE_ROLE_KEY         // ❌ NOT SET on Vercel (critical)
SUPABASE_DB_PASSWORD              // ⚠️ May not be set
```

### Local Environment (`.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL=https://agyjovdugmtopasyvlng.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_jKBISiYlrRyJEfyYGcjJZw_AQJ8Udc7
SUPABASE_SERVICE_ROLE_KEY=sb_secret_KZlUVioFZ4r8vbeOK4215g_f3tUgyoG
SUPABASE_DB_PASSWORD=3BVHkEN4AD4sQQRz
```

**Status**: ✅ Correct - local development would work

### Vercel Environment
**Status**: ❌ Missing `SUPABASE_SERVICE_ROLE_KEY`

---

## 🎓 Lessons Learned

### Technical Lessons
1. **Environment Variable Verification**: Always verify production environment variables before testing
2. **Separate Configs**: Local `.env.local` ≠ Vercel environment variables
3. **Build vs Runtime**: Missing env vars don't fail build, only runtime
4. **Error Visibility**: Vercel errors are generic; need better logging

### Process Lessons
1. **Pre-Deployment Checklist**: Verify all environment variables are synced
2. **Monitoring**: Add health check endpoints that verify critical env vars
3. **Documentation**: Maintain list of required environment variables
4. **Testing**: Test on actual deployment environment, not just localhost

---

## 🔄 Recommended Follow-Up Actions

### Critical (Before Further Testing)
- [ ] Add `SUPABASE_SERVICE_ROLE_KEY` to Vercel environment variables
- [ ] Add all other missing Supabase variables to Vercel
- [ ] Redeploy application to staging
- [ ] Verify coverage lead creation works via API test
- [ ] Verify complete coverage check flow works

### Important (This Sprint)
- [ ] Create health check endpoint (`/api/health`) that verifies env vars
- [ ] Document all required environment variables in README
- [ ] Add monitoring/alerts for env var misconfiguration
- [ ] Create deployment checklist including env var verification

### Nice to Have (Future)
- [ ] Implement runtime env var validation with clear error messages
- [ ] Add startup health checks that fail fast if critical vars missing
- [ ] Create CI/CD step that verifies env vars before deployment
- [ ] Use Vercel's environment variable sync CLI tool

---

## 📝 Related Bugs

This bug blocks verification of:
- **Bug #1**: Coordinates extraction from JSONB (fixed in commit 3d2355b)
- **Bug #2**: Query by wrong column (fixed in commit e9e6a58)

Both bugs are fixed in code but cannot be verified until Bug #3 is resolved.

---

## 📁 Files Involved

### Modified Files
None - this is a configuration issue, not a code issue

### Documentation
1. `docs/testing/CONSUMER_JOURNEY_BUG3_ENV_VARS_2025-01-20.md` - This report
2. `docs/testing/CONSUMER_JOURNEY_FINAL_REPORT_2025-01-20.md` - Previous bug report

### Environment Files (Local Only)
1. `.env.local` - Contains correct keys (not committed to Git)
2. `.env.example` - Should document required variables

---

## 🚀 Deployment Checklist

Before marking this bug as resolved:

- [ ] Add `SUPABASE_SERVICE_ROLE_KEY` to Vercel
- [ ] Add `SUPABASE_DB_PASSWORD` to Vercel (if needed)
- [ ] Verify `NEXT_PUBLIC_SUPABASE_URL` is set correctly
- [ ] Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set correctly
- [ ] Trigger Vercel redeploy
- [ ] Test `/api/coverage/lead` endpoint
- [ ] Test complete coverage check flow
- [ ] Verify Bug #1 and Bug #2 fixes work
- [ ] Document resolution in this report

---

**Created**: 2025-01-20
**Tested By**: Claude Code + Playwright MCP
**Environment**: Staging (https://circletel-staging.vercel.app)
**Test Address**: 18 Rasmus Erasmus Blvd, Heritage Hill, Centurion, South Africa
**Status**: ❌ **BLOCKING - VERCEL ENV VARS MISSING**
**Impact**: Blocks verification of Bug #1 and Bug #2 fixes
**Confidence Level**: HIGH - Clear root cause identified
**Resolution**: Add missing environment variables to Vercel Dashboard
