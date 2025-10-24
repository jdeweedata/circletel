# MTN Integration: Bugs & Recommended Fixes
**Date**: 2025-10-21
**Test Report**: MTN_INTEGRATION_TEST_REPORT_2025-10-21.md
**Status**: 1 Critical Bug, 5 Pending Verifications

---

## Critical Bugs (Requires Immediate Fix)

### Bug #1: Ambiguous Column Reference in SQL Function
**Severity**: 🔴 CRITICAL
**Status**: ⚠️ FIX READY (Awaiting Deployment)

**Issue**:
```sql
-- Line 350 in migration 20251019000001_enhance_provider_management_system.sql
health_status = health_status  -- ERROR: Ambiguous reference
```

**Error Message**:
```
column reference "health_status" is ambiguous
```

**Root Cause**: Local variable `health_status` has the same name as table column `fttb_network_providers.health_status`, causing ambiguity in the UPDATE statement.

**Impact**:
- ❌ `update_provider_health_metrics()` function cannot run
- ❌ Provider health monitoring is broken
- ❌ Admin dashboard health metrics will fail
- ❌ Automatic health status updates blocked

**Fix Applied**: Created migration `supabase/migrations/20251021000001_fix_health_metrics_function.sql`

**Changes**:
```sql
-- Before (Ambiguous)
DECLARE
  success_rate DECIMAL(5, 2);
  avg_response_time INTEGER;
  health_status TEXT;  -- Same name as column
BEGIN
  ...
  health_status := 'healthy';  -- Ambiguous
  UPDATE fttb_network_providers SET health_status = health_status;  -- ERROR
END;

-- After (Fixed)
DECLARE
  v_success_rate DECIMAL(5, 2);
  v_avg_response_time INTEGER;
  v_health_status TEXT;  -- Prefixed with v_
BEGIN
  ...
  v_health_status := 'healthy';
  UPDATE fttb_network_providers SET health_status = v_health_status;  -- Unambiguous
END;
```

**Deployment Steps**:
1. Open Supabase Dashboard: https://app.supabase.com/project/agyjovdugmtopasyvlng
2. Navigate to: SQL Editor
3. Paste contents of: `supabase/migrations/20251021000001_fix_health_metrics_function.sql`
4. Click "Run"
5. Verify success message
6. Test function:
   ```sql
   SELECT update_provider_health_metrics(
     (SELECT id FROM fttb_network_providers WHERE name = 'mtn_wholesale')
   );
   ```

**Verification**:
```bash
# Rerun test suite after deployment
powershell -ExecutionPolicy Bypass -File scripts/run-mtn-tests.ps1
# Test 6 should now pass
```

---

## Pending Verifications (Requires Running Server)

### Verification #1: MTN Coverage Check API
**Severity**: 🟡 MEDIUM
**Status**: ⏳ PENDING (Requires Dev Server)

**Test Details**:
- **Endpoint**: `POST /api/coverage/mtn/check`
- **Code Location**: `/app/api/coverage/mtn/check/route.ts`
- **Current Status**: Code reviewed ✅, Runtime testing blocked ⏳

**Code Review Results**: ✅ PASSED
- ✅ Geographic validation implemented
- ✅ Dual-source MTN coverage (Business + Consumer)
- ✅ Response includes location context
- ✅ Caching headers configured (5min TTL)
- ✅ Error handling comprehensive

**To Verify**:
```bash
# Start dev server
npm run dev

# Test endpoint
curl -X POST http://localhost:3006/api/coverage/mtn/check \
  -H "Content-Type: application/json" \
  -d '{
    "coordinates": {"lat": -26.2041, "lng": 28.0473},
    "includeSignalStrength": true
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "services": [...],
    "provider": "MTN",
    "requestId": "mtn_...",
    "location": {
      "province": "Gauteng",
      "nearestCity": "Johannesburg",
      "coverageLikelihood": "high"
    }
  }
}
```

---

### Verification #2: Geographic Validation API
**Severity**: 🟡 MEDIUM
**Status**: ⏳ PENDING (Requires Dev Server)

**Test Details**:
- **Endpoint**: `POST /api/coverage/geo-validate`
- **Code Location**: `/app/api/coverage/geo-validate/route.ts`
- **Current Status**: Code reviewed ✅, Runtime testing blocked ⏳

**Code Review Results**: ✅ PASSED
- ✅ South African bounds validation
- ✅ Province detection
- ✅ Nearest city calculation
- ✅ Coverage likelihood estimation
- ✅ Caching headers (1hr TTL)

**To Verify**:
```bash
curl -X POST http://localhost:3006/api/coverage/geo-validate \
  -H "Content-Type: application/json" \
  -d '{
    "coordinates": {"lat": -33.9249, "lng": 18.4241},
    "includeLocationInfo": true
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "confidence": "high",
    "province": "Western Cape",
    "nearestCity": {...},
    "warnings": [],
    "locationInfo": {...}
  }
}
```

---

### Verification #3: Monitoring API
**Severity**: 🟢 LOW
**Status**: ⏳ PENDING (Requires Dev Server)

**Test Details**:
- **Endpoint**: `GET /api/coverage/mtn/monitoring?action=stats`
- **Code Location**: `/app/api/coverage/mtn/monitoring/route.ts`
- **Current Status**: Code reviewed ✅, Runtime testing blocked ⏳

**Code Review Results**: ✅ PASSED
- ✅ Stats action (performance metrics)
- ✅ Health action (health status)
- ✅ Export action (CSV/JSON)
- ✅ Reset action (dev-only)

**To Verify**:
```bash
# Get stats
curl http://localhost:3006/api/coverage/mtn/monitoring?action=stats&window=3600000

# Get health
curl http://localhost:3006/api/coverage/mtn/monitoring?action=health

# Health check (HEAD)
curl -I http://localhost:3006/api/coverage/mtn/monitoring
```

**Expected Response** (Stats):
```json
{
  "success": true,
  "data": {
    "totalRequests": 0,
    "successfulRequests": 0,
    "failedRequests": 0,
    "cacheHits": 0,
    "averageResponseTime": 0
  }
}
```

---

### Verification #4: Admin Coverage Dashboard
**Severity**: 🟡 MEDIUM
**Status**: ⏳ PENDING (Requires Dev Server + Browser)

**Test Details**:
- **URL**: `http://localhost:3006/admin/coverage`
- **Code Location**: `/app/admin/coverage/page.tsx`
- **Current Status**: Code not reviewed, Runtime testing blocked ⏳

**To Verify**:
1. Start dev server: `npm run dev`
2. Navigate to: `http://localhost:3006/admin/coverage`
3. Log in with admin credentials
4. Verify:
   - ✅ Dashboard loads without errors
   - ✅ Provider health metrics display
   - ✅ API logs table shows recent requests
   - ✅ Charts render correctly
   - ✅ Provider testing tools work

**Expected UI Elements**:
- Real-time monitoring dashboard
- Provider health status cards
- API request logs table
- Performance charts (recharts)
- Manual API testing form

---

### Verification #5: Package Recommendation Integration
**Severity**: 🔴 HIGH
**Status**: ⏳ PENDING (Requires Dev Server)

**Test Details**:
- **Endpoint**: `GET /api/coverage/packages?leadId={id}`
- **Code Location**: `/app/api/coverage/packages/route.ts` (presumed)
- **Current Status**: Not yet reviewed or tested

**To Verify**:
```bash
# Run coverage check
LEAD_ID=$(curl -X POST http://localhost:3006/api/coverage/mtn/check \
  -H "Content-Type: application/json" \
  -d '{"coordinates": {"lat": -26.2041, "lng": 28.0473}}' \
  | jq -r '.data.requestId')

# Get package recommendations
curl http://localhost:3006/api/coverage/packages?leadId=$LEAD_ID
```

**Expected Flow**:
1. Coverage check identifies available services (e.g., fibre, 5G, LTE)
2. Services mapped to product packages in Supabase
3. Recommendation engine scores packages based on:
   - Service availability
   - Signal strength
   - Speed estimates
   - User preferences
4. Sorted package list returned

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "packages": [
      {
        "id": "...",
        "name": "MTN Business Fibre 100Mbps",
        "serviceType": "fibre",
        "speed": 100,
        "price": 899,
        "score": 95,
        "available": true
      },
      ...
    ],
    "recommendations": {
      "best": {...},
      "alternatives": [...]
    }
  }
}
```

---

## Performance Issues (To Monitor)

### Issue #1: API Response Times
**Severity**: 🟡 MEDIUM
**Status**: ⏳ PENDING (Benchmark Required)

**Target Performance**:
- Coverage check: < 5,000ms (EXCELLENT)
- Geo validation: < 1,000ms (cached data)
- Monitoring stats: < 500ms (in-memory)

**Test Method**:
```bash
# Run performance benchmark
powershell -ExecutionPolicy Bypass -File scripts/run-mtn-tests.ps1
# Check Test 10 results
```

**Monitoring Strategy**:
1. Check `provider_api_logs` table for response times
2. Use monitoring API to track averages
3. Set up alerts for degraded performance (>10s avg)
4. Implement caching improvements if needed

---

### Issue #2: Rate Limiting Effectiveness
**Severity**: 🟢 LOW
**Status**: ⏳ PENDING (Load Test Required)

**Current Implementation**:
- 250ms delay between requests (MTN WMS Client)
- 60 RPM limit (provider configuration)
- 1,000 hourly, 10,000 daily (configuration)

**To Verify**:
1. Run concurrent coverage checks (10+ simultaneous)
2. Monitor rate limiting stats via monitoring API
3. Check for 429 errors in API logs
4. Verify requests are properly queued/delayed

**Load Test Script** (To Create):
```typescript
// scripts/load-test-mtn-coverage.ts
// - Send 100 concurrent requests
// - Measure queue behavior
// - Verify no rate limit violations
```

---

## Security Considerations

### Security #1: API Key Exposure
**Severity**: 🟢 LOW (Already Mitigated)
**Status**: ✅ SECURED

**Current Protection**:
- ✅ API keys stored in `provider_configuration` (not hardcoded)
- ✅ Environment variables used for sensitive data
- ✅ `.env.local` in `.gitignore`
- ✅ Row Level Security (RLS) on all tables
- ✅ Admin-only access to provider management

**No Action Required**: Security is properly implemented.

---

### Security #2: Geographic Bounds Validation
**Severity**: 🟡 MEDIUM
**Status**: ✅ IMPLEMENTED

**Current Protection**:
- ✅ Server-side validation for South African coordinates
- ✅ Bounds checking: lat (-35 to -22), lng (16 to 33)
- ✅ Province validation
- ✅ Warning system for edge cases

**To Verify**:
```bash
# Test out-of-bounds coordinates
curl -X POST http://localhost:3006/api/coverage/geo-validate \
  -H "Content-Type: application/json" \
  -d '{"coordinates": {"lat": 0, "lng": 0}}'  # Should reject

curl -X POST http://localhost:3006/api/coverage/geo-validate \
  -H "Content-Type: application/json" \
  -d '{"coordinates": {"lat": -26, "lng": 28}}'  # Should accept
```

---

## Recommendations Summary

### Immediate (This Week)
1. ✅ **Deploy SQL fix** for `update_provider_health_metrics()` function
2. ⏳ **Start dev server** and complete all 5 pending verifications
3. ⏳ **Test admin dashboard** UI and functionality
4. ⏳ **Verify package recommendations** integration

### Short-Term (This Month)
5. ⏳ **Performance benchmark** all API endpoints
6. ⏳ **Load testing** for rate limiting validation
7. ⏳ **End-to-end testing** of full user journey
8. ⏳ **Create monitoring alerts** for degraded health

### Long-Term (Next Quarter)
9. ⏳ **Add additional providers** (Vodacom, Telkom, Cell C)
10. ⏳ **Implement automated testing** in CI/CD pipeline
11. ⏳ **Geographic expansion** (test coverage in all provinces)
12. ⏳ **Performance optimization** based on production metrics

---

## Test Rerun Checklist

Before declaring production-ready:
- [x] Database schema verified
- [x] MTN providers configured
- [ ] SQL function fix deployed
- [ ] MTN Coverage API tested (live)
- [ ] Geographic Validation tested (live)
- [ ] Monitoring API tested (live)
- [ ] Admin dashboard tested (UI)
- [ ] Package recommendations tested
- [ ] Performance benchmark completed
- [ ] Load testing completed

**Current Completion**: 2/10 (20%)
**Target**: 10/10 (100%) before production deployment

---

## Contact & Support

**Issue Tracking**: Create GitHub issue with `[MTN Integration]` prefix
**Test Suite**: `scripts/comprehensive-mtn-integration-test.ts`
**Run Tests**: `powershell -ExecutionPolicy Bypass -File scripts/run-mtn-tests.ps1`
**Documentation**: `/docs/testing/`

---

**Last Updated**: 2025-10-21
**Report Version**: 1.0
**Test Coverage**: 50% (Database ✅, API Endpoints ⏳)
