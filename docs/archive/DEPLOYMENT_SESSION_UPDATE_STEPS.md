# MTN Session Deployment Update - Manual Steps

**Date**: 2025-10-17
**Session Expires**: 2025-10-17T11:06:57.049Z (~30 minutes from 10:37 UTC)
**Status**: Session valid and exported

---

## ✅ Completed Steps

1. ✅ **Session validated** - API returns 200 OK
2. ✅ **Session exported to base64**
3. ✅ **Local `.env.local` updated** with MTN_SESSION

---

## 🔧 Manual Steps Required

### Step 1: Update GitHub Secret (for Validation Workflow)

```bash
# Copy this base64 value (already exported):
eyJjb29raWVzIjpbeyJuYW1lIjoiX0dSRUNBUFRDSEEiLCJ2YWx1ZSI6IjA5QUc3Ynp2SGZZc3N5aDI1QTY4M0t3dWJaMTR4QVdNcTlsR0F1dk5WX2w4WFNxV1JHTUxRNTdYS0FLSHdZUlJLSDFKSzhPZm5iSDBPXzB4amF1NEQ5V1FFIiwiZG9tYWluIjoid3d3Lmdvb2dsZS5jb20iLCJwYXRoIjoiL3JlY2FwdGNoYSIsImV4cGlyZXMiOjE3NzYyNDc1OTguMTM2OTg4LCJodHRwT25seSI6dHJ1ZSwic2VjdXJlIjp0cnVlLCJzYW1lU2l0ZSI6Ik5vbmUifSx7Im5hbWUiOiJKU0VTU0lPTklEIiwidmFsdWUiOiJDOTdBNUFDOTlBMzI3NUQ3QkMyMzRFMUM1QTQzMzAzRCIsImRvbWFpbiI6InNzby5tdG5idXNpbmVzcy5jby56YSIsInBhdGgiOiIvIiwiZXhwaXJlcyI6LTEsImh0dHBPbmx5Ijp0cnVlLCJzZWN1cmUiOnRydWUsInNhbWVTaXRlIjoiTGF4In0seyJuYW1lIjoiQ0FTVEdDIiwidmFsdWUiOiJUR1QtNzAwLVdXZkNoRTdBU1IwM1ZGZWN6dUZGNHZjNmh1dGd0Z3ZBTTZvUUtVRDFYZGVEN1gyU0llLXNvaGNoN0FlIiwiZG9tYWluIjoic3NvLm10bmJ1c2luZXNzLmNvLnphIiwicGF0aCI6Ii8iLCJleHBpcmVzIjotMSwiaHR0cE9ubHkiOmZhbHNlLCJzZWN1cmUiOnRydWUsInNhbWVTaXRlIjoiTGF4In0seyJuYW1lIjoiSlNFU1NJT05JRCIsInZhbHVlIjoiODcyOEYwQ0I0MEQxODQzNjhDNDk5NDBGMTY5OTA0QkQiLCJkb21haW4iOiJhc3AtZmVhc2liaWxpdHkubXRuYnVzaW5lc3MuY28uemEiLCJwYXRoIjoiLyIsImV4cGlyZXMiOi0xLCJodHRwT25seSI6dHJ1ZSwic2VjdXJlIjp0cnVlLCJzYW1lU2l0ZSI6IkxheCJ9XSwic2Vzc2lvbklkIjoiQzk3QTVBQzk5QTMyNzVEN0JDMjM0RTFDNUE0MzMwM0QiLCJleHBpcmVzQXQiOiIyMDI1LTEwLTE3VDExOjA2OjU3LjA0OVoifQ==

# Update using GitHub CLI:
gh secret set MTN_SESSION --body "eyJjb29raWVzIjpbeyJuYW1lIjoiX0dSRUNBUFRDSEEiLCJ2YWx1ZSI6IjA5QUc3Ynp2SGZZc3N5aDI1QTY4M0t3dWJaMTR4QVdNcTlsR0F1dk5WX2w4WFNxV1JHTUxRNTdYS0FLSHdZUlJLSDFKSzhPZm5iSDBPXzB4amF1NEQ5V1FFIiwiZG9tYWluIjoid3d3Lmdvb2dsZS5jb20iLCJwYXRoIjoiL3JlY2FwdGNoYSIsImV4cGlyZXMiOjE3NzYyNDc1OTguMTM2OTg4LCJodHRwT25seSI6dHJ1ZSwic2VjdXJlIjp0cnVlLCJzYW1lU2l0ZSI6Ik5vbmUifSx7Im5hbWUiOiJKU0VTU0lPTklEIiwidmFsdWUiOiJDOTdBNUFDOTlBMzI3NUQ3QkMyMzRFMUM1QTQzMzAzRCIsImRvbWFpbiI6InNzby5tdG5idXNpbmVzcy5jby56YSIsInBhdGgiOiIvIiwiZXhwaXJlcyI6LTEsImh0dHBPbmx5Ijp0cnVlLCJzZWN1cmUiOnRydWUsInNhbWVTaXRlIjoiTGF4In0seyJuYW1lIjoiQ0FTVEdDIiwidmFsdWUiOiJUR1QtNzAwLVdXZkNoRTdBU1IwM1ZGZWN6dUZGNHZjNmh1dGd0Z3ZBTTZvUUtVRDFYZGVEN1gyU0llLXNvaGNoN0FlIiwiZG9tYWluIjoic3NvLm10bmJ1c2luZXNzLmNvLnphIiwicGF0aCI6Ii8iLCJleHBpcmVzIjotMSwiaHR0cE9ubHkiOmZhbHNlLCJzZWN1cmUiOnRydWUsInNhbWVTaXRlIjoiTGF4In0seyJuYW1lIjoiSlNFU1NJT05JRCIsInZhbHVlIjoiODcyOEYwQ0I0MEQxODQzNjhDNDk5NDBGMTY5OTA0QkQiLCJkb21haW4iOiJhc3AtZmVhc2liaWxpdHkubXRuYnVzaW5lc3MuY28uemEiLCJwYXRoIjoiLyIsImV4cGlyZXMiOi0xLCJodHRwT25seSI6dHJ1ZSwic2VjdXJlIjp0cnVlLCJzYW1lU2l0ZSI6IkxheCJ9XSwic2Vzc2lvbklkIjoiQzk3QTVBQzk5QTMyNzVEN0JDMjM0RTFDNUE0MzMwM0QiLCJleHBpcmVzQXQiOiIyMDI1LTEwLTE3VDExOjA2OjU3LjA0OVoifQ=="

# Or update manually via GitHub UI:
# https://github.com/jdeweedata/circletel/settings/secrets/actions
```

---

### Step 2: Update Vercel Environment Variables

#### Production Project (circletel)

1. **Go to**: https://vercel.com/jdewee-livecoms-projects/circletel/settings/environment-variables

2. **Find `MTN_SESSION`** (or create new if doesn't exist)

3. **Update value** with:
   ```
   eyJjb29raWVzIjpbeyJuYW1lIjoiX0dSRUNBUFRDSEEiLCJ2YWx1ZSI6IjA5QUc3Ynp2SGZZc3N5aDI1QTY4M0t3dWJaMTR4QVdNcTlsR0F1dk5WX2w4WFNxV1JHTUxRNTdYS0FLSHdZUlJLSDFKSzhPZm5iSDBPXzB4amF1NEQ5V1FFIiwiZG9tYWluIjoid3d3Lmdvb2dsZS5jb20iLCJwYXRoIjoiL3JlY2FwdGNoYSIsImV4cGlyZXMiOjE3NzYyNDc1OTguMTM2OTg4LCJodHRwT25seSI6dHJ1ZSwic2VjdXJlIjp0cnVlLCJzYW1lU2l0ZSI6Ik5vbmUifSx7Im5hbWUiOiJKU0VTU0lPTklEIiwidmFsdWUiOiJDOTdBNUFDOTlBMzI3NUQ3QkMyMzRFMUM1QTQzMzAzRCIsImRvbWFpbiI6InNzby5tdG5idXNpbmVzcy5jby56YSIsInBhdGgiOiIvIiwiZXhwaXJlcyI6LTEsImh0dHBPbmx5Ijp0cnVlLCJzZWN1cmUiOnRydWUsInNhbWVTaXRlIjoiTGF4In0seyJuYW1lIjoiQ0FTVEdDIiwidmFsdWUiOiJUR1QtNzAwLVdXZkNoRTdBU1IwM1ZGZWN6dUZGNHZjNmh1dGd0Z3ZBTTZvUUtVRDFYZGVEN1gyU0llLXNvaGNoN0FlIiwiZG9tYWluIjoic3NvLm10bmJ1c2luZXNzLmNvLnphIiwicGF0aCI6Ii8iLCJleHBpcmVzIjotMSwiaHR0cE9ubHkiOmZhbHNlLCJzZWN1cmUiOnRydWUsInNhbWVTaXRlIjoiTGF4In0seyJuYW1lIjoiSlNFU1NJT05JRCIsInZhbHVlIjoiODcyOEYwQ0I0MEQxODQzNjhDNDk5NDBGMTY5OTA0QkQiLCJkb21haW4iOiJhc3AtZmVhc2liaWxpdHkubXRuYnVzaW5lc3MuY28uemEiLCJwYXRoIjoiLyIsImV4cGlyZXMiOi0xLCJodHRwT25seSI6dHJ1ZSwic2VjdXJlIjp0cnVlLCJzYW1lU2l0ZSI6IkxheCJ9XSwic2Vzc2lvbklkIjoiQzk3QTVBQzk5QTMyNzVEN0JDMjM0RTFDNUE0MzMwM0QiLCJleHBpcmVzQXQiOiIyMDI1LTEwLTE3VDExOjA2OjU3LjA0OVoifQ==
   ```

4. **Select environments**:
   - ☑ Production
   - ☑ Preview
   - ☑ Development

5. **Click "Save"**

---

#### Staging Project (circletel-staging)

1. **Go to**: https://vercel.com/jdewee-livecoms-projects/circletel-staging/settings/environment-variables

2. **Repeat same steps** as production above

---

### Step 3: Trigger Redeployment

After updating environment variables, Vercel requires redeployment to pick up changes.

**Option 1: Automatic (on next commit)**
```bash
git add -A
git commit -m "Update MTN session environment variables"
git push
```

**Option 2: Manual via Vercel CLI**
```bash
# Production
vercel --prod

# Staging (if needed)
vercel
```

**Option 3: Via Vercel Dashboard**
- Go to project → Deployments tab
- Click "Redeploy" on latest deployment

---

## 🧪 Verification Steps

### Test Local Development
```bash
# Restart dev server to pick up new .env.local
# Kill existing dev server (Ctrl+C)
npm run dev

# Test MTN API endpoint
curl http://localhost:3000/api/mtn-wholesale/products
```

### Test Production Deployment
```bash
# Once redeployed, test production URL
curl https://your-production-domain.vercel.app/api/mtn-wholesale/products
```

### Test Validation Workflow
```bash
# Manually trigger GitHub Actions validation
# Go to: https://github.com/jdeweedata/circletel/actions/workflows/validate-mtn-session.yml
# Click "Run workflow"

# Or test locally
npx tsx scripts/validate-mtn-session.ts
```

---

## 📊 Session Information

| Property | Value |
|----------|-------|
| **Session ID** | C97A5AC99A3275D7BC234E1C5A43303D |
| **Tracked Expiry** | 2025-10-17T11:06:57.049Z |
| **Created** | ~2025-10-17T10:07:00Z |
| **Status** | ✅ Valid (as of 10:37 UTC) |
| **API Test** | ✅ Returns 200 OK |

---

## 🎯 Expected Results

After completing all steps:

1. ✅ **Local Dev**: MTN API calls should succeed
2. ✅ **Production**: MTN API calls should succeed
3. ✅ **Staging**: MTN API calls should succeed
4. ✅ **GitHub Actions**: Validation workflow succeeds every 4 hours
5. ✅ **Monitoring**: No expiration alerts (session valid for >2 hours)

---

## ⏰ Next Actions

1. **Monitor actual session expiration** over next 24-48 hours
2. **Document observed lifespan** in `MTN_SESSION_LIFESPAN_FINDINGS.md`
3. **Adjust validation frequency** if needed based on findings
4. **Set calendar reminder** for ~2025-10-17T11:00:00Z to observe if session expires as tracked

---

## 📚 Related Documentation

- **Session Management Guide**: `docs/integrations/MTN_SESSION_MANAGEMENT.md`
- **Validation Implementation**: `docs/integrations/mtn/MTN_SESSION_VALIDATION_IMPLEMENTATION_SUMMARY.md`
- **Quick Reference**: `docs/integrations/mtn/MTN_SESSION_QUICK_REFERENCE.md`
- **Lifespan Findings**: `docs/integrations/mtn/MTN_SESSION_LIFESPAN_FINDINGS.md`

---

**Created**: 2025-10-17T10:40:00Z
**Author**: Claude Code
**Status**: Ready for manual deployment
