# Consumer Order Journey Test - Staging Environment

**Date**: 2025-01-20
**Environment**: https://circletel-staging.vercel.app/
**Test Type**: End-to-End Consumer Order Flow
**Tester**: Claude Code (Playwright MCP)
**Status**: ⚠️ BLOCKED - Coverage API Failure

---

## Executive Summary

The consumer order journey test on the staging environment was **blocked** at the first step due to a critical API failure in the coverage lead creation endpoint. The homepage and coverage checker UI are functioning correctly, but the backend API is returning a 500 error when attempting to create a coverage lead.

**Critical Issue**: `POST /api/coverage/lead` returns 500 Internal Server Error

---

## Test Results

### ✅ PASSED: Homepage Load
- **URL**: https://circletel-staging.vercel.app/
- **Status**: Success
- **Page Title**: "CircleTel - Reliable Tech Solutions"
- **Load Time**: Fast
- **UI Elements**: All visible and functional
- **Screenshot**: staging-coverage-error.png

**Verified Elements**:
- ✅ Header navigation
- ✅ Hero section with coverage checker
- ✅ Address input field
- ✅ "Check coverage" button
- ✅ Feature highlights (capped/uncapped, free delivery, router savings)
- ✅ Footer with contact information

---

### ✅ PASSED: Address Input & Autocomplete
- **Test Address**: "1 Sandton Drive, Sandton, Johannesburg"
- **Status**: Success
- **Google Maps API**: Loaded and functional
- **Autocomplete**: Working correctly

**Details**:
- Address input accepted user input
- Google Maps autocomplete suggestions appeared
- User selected: "1 Sandton Dr, Sandhurst, Sandton, 2196, South Africa"
- Coordinates should be extracted: lat: -26.10893, lng: 28.05659 (approximate)

**Console Warnings** (non-blocking):
- Google Maps deprecation warning for `google.maps.places.Autocomplete` (March 1st, 2025)
- Manifest icon loading error (PWA-related, not critical)

---

### ❌ FAILED: Coverage Check Submission

**Step**: Click "Check coverage" button
**Expected**: Navigate to `/coverage/results?leadId={id}` with available packages
**Actual**: Alert dialog: "Coverage check failed. Please try again."
**Root Cause**: API failure on lead creation

**Technical Details**:

#### API Request
```
POST https://circletel-staging.vercel.app/api/coverage/lead
```

#### Response
```
Status: 500 Internal Server Error
```

#### Console Error
```
Coverage check failed: Error: Failed to create coverage lead
    at b (https://circletel-staging.vercel.app/_next/static/chunks/app/page-...)
```

#### Database Check
```sql
SELECT id, address, coordinates, created_at
FROM coverage_leads
ORDER BY created_at DESC
LIMIT 5;
```
**Result**: Empty (no leads in database)

This confirms the API is failing to write to the database.

---

### ⏸️ BLOCKED: Remaining Journey Steps

The following steps could not be tested due to the coverage API failure:

1. ⏸️ **Coverage Results Page** - Cannot reach without valid leadId
2. ⏸️ **Package Selection** - Depends on coverage results
3. ⏸️ **Customer Details Form (Step 2)** - Depends on package selection
4. ⏸️ **Order Review (Step 3)** - Depends on previous steps
5. ⏸️ **Order Submission** - Cannot complete full journey

---

## Root Cause Analysis

### Suspected Issues

1. **Database Connection Error**
   - Supabase connection may be misconfigured in production
   - RLS (Row Level Security) policies may be blocking writes
   - Service role key may be missing or invalid

2. **Missing Environment Variables**
   - `SUPABASE_SERVICE_ROLE_KEY` may not be set in Vercel
   - `NEXT_PUBLIC_SUPABASE_URL` may be incorrect
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` may be invalid

3. **API Route Error**
   - `/app/api/coverage/lead/route.ts` may have runtime errors
   - TypeScript errors not caught during build (due to `ignoreBuildErrors: true`)
   - Missing error handling for edge cases

4. **RLS Policy Issues**
   - `coverage_leads` table may require authenticated user
   - Anonymous writes may be blocked by RLS policies

---

## Recommendations

### Immediate Actions (Priority 1)

1. **Check Vercel Environment Variables**
   ```bash
   # Verify these are set in Vercel dashboard:
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   ```

2. **Review Supabase RLS Policies**
   ```sql
   -- Check RLS policies on coverage_leads table
   SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
   FROM pg_policies
   WHERE tablename = 'coverage_leads';
   ```

3. **Check API Route Code**
   - Review `/app/api/coverage/lead/route.ts` for errors
   - Add comprehensive error logging
   - Test API endpoint directly with Postman/curl

4. **Enable Detailed Logging**
   - Add `console.error` statements in API route
   - Check Vercel function logs for stack trace
   - Enable Supabase query logging

### Medium Priority

5. **Add Fallback for Coverage Check**
   - Consider mock data for testing when API fails
   - Add retry logic with exponential backoff
   - Display more helpful error message to users

6. **Improve Error Handling**
   - Catch and log specific error types
   - Return structured error responses
   - Add Sentry or similar error tracking

### Long-term Improvements

7. **Add E2E Monitoring**
   - Set up synthetic monitoring for critical flows
   - Alert on coverage API failures
   - Track success rates in analytics

8. **Create Staging Test Data**
   - Pre-populate test coverage leads
   - Add test packages for Sandton area
   - Document test credentials and data

---

## Vercel Deployment Status

**Latest Deployment**: Successful (as of commit `bb5a3cd`)
**Build Status**: ✅ Passed
**Preview URL**: https://circletel-staging.vercel.app/

**Recent Fixes Applied**:
- ✅ Suspense boundaries added to all pages using `useSearchParams()`
- ✅ GitHub Actions workflow allows ESLint failures
- ✅ TypeScript validation passes

**Known Configuration**:
```javascript
// next.config.js
eslint: {
  ignoreDuringBuilds: true,  // ESLint errors don't block builds
},
typescript: {
  ignoreBuildErrors: true,    // TypeScript errors don't block builds
}
```

⚠️ **Warning**: Type errors may exist in production code due to `ignoreBuildErrors: true`

---

## Test Data Used

### Address Input
- **Original**: "1 Sandton Drive, Sandton, Johannesburg"
- **Autocompleted**: "1 Sandton Dr, Sandhurst, Sandton, 2196, South Africa"
- **Google Place ID**: ChIJcZKgQM0MlR4R9PbP1GsMPpc
- **Coordinates** (approximate): -26.10893, 28.05659

---

## Browser/Environment Details

- **Browser**: Chromium (Playwright)
- **Viewport**: Default desktop viewport
- **Network**: Standard
- **Geographic Location**: South Africa (based on test address)

---

## Next Steps

1. **Fix Coverage Lead API** (CRITICAL)
   - Investigate 500 error in `/api/coverage/lead`
   - Verify Supabase connection and credentials
   - Test with curl/Postman to isolate issue

2. **Re-run Full Journey Test**
   - Once API is fixed, re-test complete flow
   - Verify all steps: Homepage → Coverage → Packages → Details → Confirmation

3. **Add API Health Checks**
   - Create `/api/health` endpoint
   - Monitor coverage API availability
   - Add status page for external dependencies

---

## Files Generated

- `staging-coverage-error.png` - Screenshot of coverage checker with address entered
- `staging-consumer-journey-test-2025-01-20.md` - This test report

---

## Contact

For questions about this test report:
- **GitHub Issues**: https://github.com/jdeweedata/circletel-nextjs/issues
- **Deployment**: https://circletel-staging.vercel.app/
- **Repository**: https://github.com/jdeweedata/circletel-nextjs

---

**Report Generated**: 2025-01-20
**Test Duration**: ~5 minutes
**Result**: BLOCKED at Step 1 (Coverage API Failure)
