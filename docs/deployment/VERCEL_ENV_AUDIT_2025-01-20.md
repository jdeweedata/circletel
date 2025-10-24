# Vercel Environment Variables Audit

**Date**: 2025-01-20
**Project**: circletel-staging
**Issue**: Mixed NEW and LEGACY Supabase API keys causing coverage checker failures

---

## Executive Summary

✅ **GOOD NEWS**: Production environment has the correct `SUPABASE_SERVICE_ROLE_KEY` (LEGACY JWT format)

⚠️ **CRITICAL ISSUE**: The `NEXT_PUBLIC_SUPABASE_ANON_KEY` is using the NEW format (`sb_publishable_`) which is **incompatible** with the codebase.

**Impact**: Coverage checker fails with 500 error because the client-side Supabase client cannot connect.

---

## Current Vercel Environment Variables (Production)

### Supabase Variables

| Variable | Current Value | Format | Status |
|----------|---------------|--------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://agyjovdugmtopasyvlng.supabase.co` | URL | ✅ **CORRECT** |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | LEGACY JWT | ✅ **CORRECT** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_jKBISiYlrRyJEfyYGcjJZw_AQJ8Udc7` | NEW format | ❌ **WRONG** |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | `sb_publishable_jKBISiYlrRyJEfyYGcjJZw_AQJ8Udc7` | NEW format | ⚠️ **Unnecessary** |

### Other Supabase-Related Variables

| Variable | Value | Purpose |
|----------|-------|---------|
| `SUPABASE_ACCESS_TOKEN` | `sbp_ae3270d29be1c27eac898e699c1525a93375c0c2` | Supabase Management API token |
| `SUPABASE_DB_PASSWORD` | `3BVHkEN4AD4sQQRz` | Direct database connection password |
| `JWT_DISCOVERY_URL` | `https://agyjovdugmtopasyvlng.supabase.co/auth/v1/.well-known/jwks.json` | JWT validation endpoint |

---

## The Problem

### What's Wrong

The `NEXT_PUBLIC_SUPABASE_ANON_KEY` variable is set to:
```
sb_publishable_jKBISiYlrRyJEfyYGcjJZw_AQJ8Udc7
```

This is Supabase's **NEW API key format** (introduced in 2024). However, the CircleTel codebase uses `@supabase/supabase-js` which requires the **LEGACY JWT format**.

### Why This Breaks

1. **Client-side Supabase client** (`components/providers/SupabaseProvider.tsx`) uses `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. `@supabase/supabase-js` library expects a JWT token starting with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
3. When it receives `sb_publishable_...`, it fails to authenticate
4. All client-side Supabase operations fail
5. Coverage checker API cannot create leads → 500 error

### What Works vs What Doesn't

✅ **Works**:
- Server-side API routes (because `SUPABASE_SERVICE_ROLE_KEY` is correct)
- Admin authentication (server-side)
- Database queries from API routes

❌ **Doesn't Work**:
- Client-side Supabase queries
- Coverage checker (uses client-side API call)
- Any browser-based database operations
- Real-time subscriptions

---

## The Fix (ONE Variable Change)

### Step 1: Get Correct LEGACY JWT Key

The correct LEGACY anon key is already in your local `.env.local`:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFneWpvdmR1Z210b3Bhc3l2bG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwNjg0MzYsImV4cCI6MjA1NzY0NDQzNn0.tEGMZGJLGJetMDf-0aCL9gfPelj347LMNpWrt4HOLXU
```

### Step 2: Update in Vercel Dashboard

**Option A: Via Vercel Dashboard (Recommended)**

1. Go to: https://vercel.com/jdewee-livecoms-projects/circletel-staging/settings/environment-variables
2. Find `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Click **Edit**
4. Replace value with:
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFneWpvdmR1Z210b3Bhc3l2bG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwNjg0MzYsImV4cCI6MjA1NzY0NDQzNn0.tEGMZGJLGJetMDf-0aCL9gfPelj347LMNpWrt4HOLXU
   ```
5. Select **all environments** (Production, Preview, Development)
6. Click **Save**

**Option B: Via Vercel CLI**

```bash
# Remove the wrong key
vercel env rm NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env rm NEXT_PUBLIC_SUPABASE_ANON_KEY preview
vercel env rm NEXT_PUBLIC_SUPABASE_ANON_KEY development

# Add the correct key
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# Paste: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFneWpvdmR1Z210b3Bhc3l2bG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwNjg0MzYsImV4cCI6MjA1NzY0NDQzNn0.tEGMZGJLGJetMDf-0aCL9gfPelj347LMNpWrt4HOLXU

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview
# Paste same value

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY development
# Paste same value
```

### Step 3: Optional - Remove Unnecessary Variable

The `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` variable is not used by the codebase and can be removed:

```bash
vercel env rm NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY production
vercel env rm NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY preview
vercel env rm NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY development
```

### Step 4: Redeploy

After updating variables:

**Via Vercel Dashboard**:
1. Go to **Deployments** tab
2. Click **⋯** on latest deployment → **Redeploy**
3. **Uncheck** "Use existing build cache"
4. Click **Redeploy**

**Via Vercel CLI**:
```bash
vercel --prod --force
```

---

## Verification Steps

### 1. Check Debug Endpoint (After Redeploy)

```bash
curl https://circletel-staging.vercel.app/api/coverage/debug
```

**Expected Response**:
```json
{
  "env_check": {
    "NEXT_PUBLIC_SUPABASE_URL": true,
    "SUPABASE_SERVICE_ROLE_KEY": true,
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": true
  },
  "timestamp": "2025-01-20T..."
}
```

All values should be `true` ✅

### 2. Test Coverage Checker

1. Go to: https://circletel-staging.vercel.app/
2. Enter address: **"1 Sandton Drive, Sandton"**
3. Click **"Check coverage"**
4. **Expected**: Navigate to `/coverage/results?leadId={uuid}` ✅
5. **No 500 error** 🎉

### 3. Verify Database

```sql
SELECT id, email, first_name, last_name, address, coordinates, lead_source
FROM coverage_leads
WHERE email LIKE 'coverage-%@temp.circletel.co.za'
ORDER BY created_at DESC
LIMIT 5;
```

Should see new coverage lead records created ✅

---

## Why This Happened

### Supabase's Two API Key Systems

**LEGACY Keys** (Original, JWT format):
- Anon Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- Service Role Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- Required by `@supabase/supabase-js` library
- Available in Supabase Dashboard → Settings → API → **Legacy API Keys** tab

**NEW Keys** (2024+):
- Publishable Key: `sb_publishable_...`
- Secret Key: `sb_secret_...`
- Used for new Supabase features and direct REST API access
- Shown by default in Supabase Dashboard → Settings → API → **API Keys** tab

### The Mix-Up

Someone likely:
1. Went to Supabase Dashboard → Settings → API
2. Saw the NEW keys (default view)
3. Copied `sb_publishable_...` thinking it was the anon key
4. Set it in Vercel environment variables

But they should have:
1. Clicked the **"Legacy API Keys"** tab
2. Copied the **"anon public"** JWT key
3. Set that in Vercel

---

## Complete Vercel Environment Summary

### Total Environment Variables

Production has **46 environment variables** set:

**Categories**:
- **Supabase**: 6 variables (1 needs fixing)
- **Netcash Payment**: 6 variables
- **Email (Resend)**: 3 variables
- **Zoho CRM**: 4 variables
- **Google**: 2 variables
- **JWT Auth**: 6 variables
- **App Config**: 5 variables
- **Strapi CMS**: 2 variables
- **MTN Integration**: 2 variables
- **Other**: 10 variables

### All Supabase Variables (Complete List)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://agyjovdugmtopasyvlng.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<NEEDS FIXING - Currently sb_publishable_...>
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... ✅
SUPABASE_ACCESS_TOKEN=sbp_ae3270d29be1c27eac898e699c1525a93375c0c2
SUPABASE_DB_PASSWORD=3BVHkEN4AD4sQQRz
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=<Can be removed - Not used>
JWT_DISCOVERY_URL=https://agyjovdugmtopasyvlng.supabase.co/auth/v1/.well-known/jwks.json
```

---

## Security Notes

### Public vs Secret Keys

✅ **Safe to Expose (Public)**:
- `NEXT_PUBLIC_SUPABASE_URL` - Public URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anon key (respects RLS policies)
- `JWT_DISCOVERY_URL` - Public JWT validation endpoint

⚠️ **MUST KEEP SECRET (Server-side only)**:
- `SUPABASE_SERVICE_ROLE_KEY` - Admin privileges, bypasses RLS
- `SUPABASE_ACCESS_TOKEN` - Management API access
- `SUPABASE_DB_PASSWORD` - Direct database access

### Key Characteristics

**Anon Key** (Public):
- Used in browser JavaScript
- Respects Row Level Security (RLS) policies
- Limited to authenticated user's data
- Safe to include in client-side code

**Service Role Key** (Secret):
- Admin access to entire database
- Bypasses all RLS policies
- Should ONLY be used in API routes
- NEVER expose in client-side code

---

## Development vs Production Environments

### Development Environment

Currently has:
```bash
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_jKBISiYlrRyJEfyYGcjJZw_AQJ8Udc7
```

**Missing**:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### Recommendation

Update **all three environments** (Production, Preview, Development) with the correct LEGACY JWT keys to ensure consistency.

---

## Related Documentation

- **Main Fix Guide**: `docs/deployment/VERCEL_ENV_VARS_FIX.md`
- **Update Instructions**: `docs/deployment/VERCEL_UPDATE_INSTRUCTIONS.md`
- **API Fix Details**: `docs/testing/coverage-api-fix-2025-01-20.md`
- **Consumer Journey Status**: `docs/testing/CONSUMER_JOURNEY_STATUS_2025-01-20.md`

---

## Rollback Plan

If the change causes any issues (unlikely), revert by:

1. Setting `NEXT_PUBLIC_SUPABASE_ANON_KEY` back to `sb_publishable_...`
2. Redeploying

However, this is not recommended as it will bring back the coverage checker error.

---

## Summary

**One Line Fix**: Change `NEXT_PUBLIC_SUPABASE_ANON_KEY` from `sb_publishable_...` to the LEGACY JWT format.

**Impact**: Fixes coverage checker 500 error and enables full consumer journey.

**Risk**: None - This is the correct configuration.

**Time to Fix**: 2 minutes (dashboard) or 30 seconds (CLI)

**Time to Deploy**: 2-3 minutes

**Total Time**: ~5 minutes to fully resolve

---

**Audit Date**: 2025-01-20
**Audited By**: Claude Code (via Vercel CLI)
**Status**: Awaiting user action to update environment variable
**Priority**: CRITICAL - Blocks consumer journey

**Next Step**: Update `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Redeploy → Test ✅
