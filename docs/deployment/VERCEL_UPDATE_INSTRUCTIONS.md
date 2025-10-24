# Vercel Environment Variables Update - CRITICAL FIX

**Date**: 2025-01-20
**Status**: ⚠️ ACTION REQUIRED
**Issue**: Wrong Supabase API key format in Vercel (NEW format instead of LEGACY JWT)

---

## Quick Summary

Your Vercel staging environment is using Supabase's **NEW API keys** (`sb_publishable_`, `sb_secret_`), but the codebase requires **LEGACY JWT format keys**.

This is causing the coverage checker to fail with 500 errors.

---

## Step-by-Step Fix (5 minutes)

### Step 1: Access Vercel Dashboard

1. Go to: https://vercel.com/jdewee-livecoms-projects/circletel-staging
2. Click **Settings** tab (top navigation)
3. Click **Environment Variables** (left sidebar)

### Step 2: Update Environment Variables

You need to update **THREE** environment variables. For each one:

1. Find the variable name in the list
2. Click **Edit** (three dots menu → Edit)
3. Replace the value with the LEGACY JWT key below
4. **Important**: Select all environments (Production, Preview, Development)
5. Click **Save**

### Variables to Update:

#### 1. NEXT_PUBLIC_SUPABASE_URL
```
https://agyjovdugmtopasyvlng.supabase.co
```
*(This one is probably correct already)*

#### 2. NEXT_PUBLIC_SUPABASE_ANON_KEY
**Current (WRONG)**: `sb_publishable_jKBISiYlrRyJEfyYGcjJZw_AQJ8Udc7`

**Replace with (CORRECT)**:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFneWpvdmR1Z210b3Bhc3l2bG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwNjg0MzYsImV4cCI6MjA1NzY0NDQzNn0.tEGMZGJLGJetMDf-0aCL9gfPelj347LMNpWrt4HOLXU
```

#### 3. SUPABASE_SERVICE_ROLE_KEY
**Current**: May be missing or incorrect

**Replace with (CORRECT)**:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFneWpvdmR1Z210b3Bhc3l2bG5nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjA2ODQzNiwiZXhwIjoyMDU3NjQ0NDM2fQ.c32hg_G2Tu9Y84Pf6r34BADW4DiDIFld0B-stmqNk-4
```

### Step 3: Redeploy

After updating all variables:

1. Go to **Deployments** tab (top navigation)
2. Find the most recent deployment
3. Click **⋯** (three dots) → **Redeploy**
4. **IMPORTANT**: Uncheck "Use existing build cache"
5. Click **Redeploy** button

### Step 4: Verify (After 2-3 minutes)

Once deployment completes, test the debug endpoint:

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

### Step 5: Test Coverage Checker

1. Go to: https://circletel-staging.vercel.app/
2. Enter address: **"1 Sandton Drive, Sandton"**
3. Click **"Check coverage"**
4. **Expected**: Navigate to `/coverage/results?leadId={uuid}` ✅
5. **No more 500 error!** 🎉

---

## Why This Matters

### Understanding the Issue

**Supabase API Keys - Two Formats**:

1. **NEW Keys** (2024+):
   - Publishable Key: `sb_publishable_...`
   - Secret Key: `sb_secret_...`
   - Used for new Supabase projects

2. **LEGACY JWT Keys** (Original format):
   - Anon Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - Service Role Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - Required by `@supabase/supabase-js` library

**Your Project**: Uses `@supabase/supabase-js` which requires LEGACY JWT format.

**The Mix-up**: Someone set Vercel to use NEW keys instead of LEGACY keys.

### Impact

- ❌ Coverage checker fails (500 error)
- ❌ Order forms cannot be submitted
- ❌ All Supabase database operations fail
- ❌ Consumer journey completely blocked

### After Fix

- ✅ Coverage checker works
- ✅ Order forms work
- ✅ Database operations work
- ✅ Consumer journey complete

---

## Alternative: Update via Vercel CLI

If you prefer command line:

```bash
# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# Paste: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFneWpvdmR1Z210b3Bhc3l2bG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwNjg0MzYsImV4cCI6MjA1NzY0NDQzNn0.tEGMZGJLGJetMDf-0aCL9gfPelj347LMNpWrt4HOLXU

vercel env add SUPABASE_SERVICE_ROLE_KEY production
# Paste: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFneWpvdmR1Z210b3Bhc3l2bG5nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjA2ODQzNiwiZXhwIjoyMDU3NjQ0NDM2fQ.c32hg_G2Tu9Y84Pf6r34BADW4DiDIFld0B-stmqNk-4

# Repeat for preview and development
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY development
vercel env add SUPABASE_SERVICE_ROLE_KEY preview
vercel env add SUPABASE_SERVICE_ROLE_KEY development

# Redeploy
vercel --prod
```

---

## Verification Checklist

- [ ] Updated `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel
- [ ] Updated `SUPABASE_SERVICE_ROLE_KEY` in Vercel
- [ ] Applied to all environments (Production, Preview, Development)
- [ ] Redeployed with cache cleared
- [ ] Tested debug endpoint - all `true`
- [ ] Tested coverage checker - no 500 error
- [ ] Coverage lead created in database

---

## Security Notes

- ✅ **Anon Key is PUBLIC** - Safe to expose in client-side code
- ⚠️ **Service Role Key is SECRET** - Never expose in client-side code (only use in API routes)
- 🔒 Both keys are already in `.env.local` (gitignored, not committed)

---

## Related Documentation

- **Main Guide**: `docs/deployment/VERCEL_ENV_VARS_FIX.md` - Complete troubleshooting guide
- **API Fix**: `docs/testing/coverage-api-fix-2025-01-20.md` - Coverage lead API fix details
- **Status Report**: `docs/testing/CONSUMER_JOURNEY_STATUS_2025-01-20.md` - Overall status

---

## Need Help?

If you encounter issues:

1. **Check Vercel Function Logs**:
   - Vercel Dashboard → Deployments → Latest → Functions
   - Look for `/api/coverage/lead` errors

2. **Check Database**:
   ```sql
   SELECT * FROM coverage_leads
   WHERE email LIKE 'coverage-%@temp.circletel.co.za'
   ORDER BY created_at DESC LIMIT 5;
   ```

3. **Test Debug Endpoint**:
   ```bash
   curl https://circletel-staging.vercel.app/api/coverage/debug
   ```

---

**Created**: 2025-01-20
**Last Updated**: 2025-01-20
**Status**: Awaiting user action

**Next Step**: Update Vercel environment variables → Redeploy → Test ✅
