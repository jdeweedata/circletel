# Consumer Order Journey - Status Report
**Date**: 2025-01-20
**Environment**: Staging (https://circletel-staging.vercel.app/)
**Status**: 🔧 IN PROGRESS - Awaiting Deployment

---

## Executive Summary

The consumer order journey testing revealed a critical API issue that has been **fixed in the codebase** but is awaiting deployment to staging. The coverage lead creation API was failing due to a mismatch between the API payload and database schema requirements.

### Current Status

✅ **Fixed in Code** (Commits: a183c2a, 6349855)
⏳ **Pending Deployment** (Vercel may be building or cached)
❌ **Still Failing in Staging** (as of test at ~04:15 UTC)

---

## What Was Fixed

### Issue: Coverage Lead API Returning 500 Error

**Root Cause**: Database schema requires NOT NULL fields that the API wasn't providing:
- `customer_type` - Required
- `first_name` - Required
- `last_name` - Required
- `email` - Required
- `phone` - Required
- `lead_source` - Required (API was sending `source`)
- `coordinates` - Should be JSONB `{lat, lng}` (API was sending separate `latitude`/`longitude`)

### Solution Applied

**File**: `app/api/coverage/lead/route.ts`

```typescript
// BEFORE (Broken)
const leadData = {
  address,
  latitude: coordinates?.lat,     // ❌ Wrong field
  longitude: coordinates?.lng,    // ❌ Wrong field
  status: 'pending',
  source: 'coverage_check',        // ❌ Wrong field name
  session_id: `session_...`        // ❌ Not in database
};

// AFTER (Fixed)
const leadData = {
  customer_type: 'consumer',
  first_name: 'Coverage',          // ✅ Placeholder
  last_name: 'Check',              // ✅ Placeholder
  email: `coverage-${Date.now()}@temp.circletel.co.za`, // ✅ Unique
  phone: '0000000000',             // ✅ Placeholder
  address,
  coordinates: { lat, lng },       // ✅ JSONB format
  lead_source: 'coverage_check',   // ✅ Correct field
  status: 'new',
  metadata: {                      // ✅ Session in metadata
    session_id: `session_...`,
    is_coverage_check: true
  }
};
```

### Additional Tools Created

1. **Debug Endpoint**: `app/api/coverage/debug/route.ts`
   - Checks if environment variables are set
   - Helps diagnose deployment issues
   - URL: `/api/coverage/debug`

---

## Test Results

### ✅ PASSED
- Homepage loads successfully
- Address autocomplete works
- UI/UX functioning correctly
- Code changes committed and pushed

### ❌ FAILED (Awaiting Deployment)
- Coverage check still returns 500 error
- Deployment may not have updated yet
- Environment variables may not be set in Vercel

### ⏸️ BLOCKED
- Cannot test full consumer journey until API is fixed
- Package selection depends on successful coverage check
- Order form flow cannot be tested

---

## Deployment Status

### GitHub Actions
- **Status**: Failed (expected - ESLint errors)
- **Workflow**: Set to `continue-on-error: true` for lint job
- **Impact**: None - Vercel deploys independently

### Vercel Deployment
- **Expected**: Auto-deploy from main branch
- **Status**: Unknown - may still be building
- **Concern**: Old code may be cached

### Environment Variables to Verify

**Critical** - Must be set in Vercel dashboard:
```
NEXT_PUBLIC_SUPABASE_URL=https://agyjovdugmtopasyvlng.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<key>
SUPABASE_SERVICE_ROLE_KEY=<key>  ⚠️ MOST LIKELY MISSING
```

**Check with debug endpoint**:
```bash
curl https://circletel-staging.vercel.app/api/coverage/debug
```

Expected response:
```json
{
  "env_check": {
    "NEXT_PUBLIC_SUPABASE_URL": true,
    "SUPABASE_SERVICE_ROLE_KEY": true,  // Should be true
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": true
  },
  "timestamp": "..."
}
```

---

## Next Steps (Priority Order)

### 1. ⚠️ CRITICAL: Verify Environment Variables
```
Action: Check Vercel Dashboard
Path: Project Settings → Environment Variables
Required: SUPABASE_SERVICE_ROLE_KEY must be set for all environments
```

If missing, add it from local `.env.local` file.

### 2. 🔄 Wait for Deployment / Force Redeploy
```
Option A: Wait 5-10 minutes for auto-deploy
Option B: Manually trigger redeploy in Vercel dashboard
Option C: Clear Vercel cache and redeploy
```

### 3. ✅ Re-test Consumer Journey
Once deployment completes:
1. Navigate to https://circletel-staging.vercel.app/
2. Enter test address: "1 Sandton Drive, Sandton"
3. Click "Check coverage"
4. **Expected**: Navigate to `/coverage/results?leadId={uuid}`
5. Select a package
6. Fill customer details (Step 2)
7. Review order (Step 3)
8. Submit (mock/test mode)

### 4. 📊 Verify Database
Check that coverage leads are being created:
```sql
SELECT id, email, first_name, last_name, address, coordinates, lead_source, status
FROM coverage_leads
WHERE email LIKE 'coverage-%@temp.circletel.co.za'
ORDER BY created_at DESC
LIMIT 5;
```

### 5. 🧹 Monitor & Clean Up
- Review Vercel function logs for errors
- Clean up test coverage leads after 24 hours
- Remove debug endpoint (or protect it)

---

## Files Changed

### Code Fixes
1. `app/api/coverage/lead/route.ts` - Fixed API to match database schema
2. `app/api/coverage/debug/route.ts` - Added debug endpoint

### Test Documentation
3. `docs/testing/staging-consumer-journey-test-2025-01-20.md` - E2E test report
4. `docs/testing/coverage-api-fix-2025-01-20.md` - Detailed fix documentation
5. `docs/testing/CONSUMER_JOURNEY_STATUS_2025-01-20.md` - This status report

### Screenshots
6. `.playwright-mcp/staging-coverage-error.png` - Coverage check error screenshot

---

## Git Commits

```
a183c2a - fix: update coverage lead API to match database schema
6349855 - feat: add coverage API debug endpoint for environment check
```

---

## Probable Root Cause (Most Likely)

Based on investigation, the most likely issue is:

**Missing `SUPABASE_SERVICE_ROLE_KEY` in Vercel Environment Variables**

Evidence:
- API creates Supabase client with `process.env.SUPABASE_SERVICE_ROLE_KEY`
- If this is missing/undefined, Supabase operations will fail
- RLS policies may block anonymous writes to `coverage_leads` table
- Service role key bypasses RLS

**Resolution**: Add the environment variable in Vercel dashboard, then redeploy.

---

## Contact & Support

- **Repository**: https://github.com/jdeweedata/circletel-nextjs
- **Deployment**: https://vercel.com/jdewee-livecoms-projects/circletel-staging
- **Supabase Project**: agyjovdugmtopasyvlng

---

**Report Generated**: 2025-01-20
**Last Updated**: 2025-01-20 04:20 UTC
**Next Review**: After Vercel deployment completes
