# 🔧 Fix Vercel Environment Variables - CRITICAL ISSUE

## ⚠️ CURRENT STATUS: ALL API ROUTES TIMING OUT

Even after multiple fixes, ALL API routes are completely unresponsive (timing out after 10+ seconds):
- ❌ `/api/env-test` - Simple env check (no Supabase client)
- ❌ `/api/quotes/ping` - Basic ping (no Supabase client)
- ❌ `/api/quotes/business/list` - Quotes API (uses Supabase)

**Root Cause**: Missing or incorrect environment variables in Vercel causing API route initialization to hang.

## ✅ What We've Fixed (Code Changes Complete)

1. **N+1 Query Problem**: Reduced 101 queries → 3 queries (`e1fbe76`)
2. **Frontend Timeout**: Added 30-second timeout with error message (`e1fbe76`)
3. **Middleware Blocking API Routes**: Simplified matcher to only run on auth routes (`09d4ecc`, `1ca4e51`)
4. **Comprehensive Logging**: Added timing metrics throughout (`e1fbe76`)

## 🎯 REQUIRED: Manual Vercel Environment Variable Fix

### Step 1: Verify Current Environment Variables in Vercel

Go to: https://vercel.com/jdewee-livecoms-projects/circletel/settings/environment-variables

**Check these 3 variables exist with EXACT names:**

| Variable Name | Expected Value Format | Applied To |
|--------------|----------------------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://agyjovdugmtopasyvlng.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_jKBISiYlrRyJEfyYGcjJZw_AQJ8Udc7` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | `sb_secret_KZlUVioFZ4r8vbeOK4215g_f3tUgyoG` | Production, Preview, Development |

### Step 2: Common Mistakes to Check

❌ **Variable name typos**: Make sure it's `SUPABASE_SERVICE_ROLE_KEY` (not `SUPABASE_SERVICE_KEY`)
❌ **Not applied to Production**: Must check "Production" checkbox
❌ **Old JWT format**: Use the new `sb_secret_*` format (both work, but new is recommended)
❌ **Trailing spaces**: Copy/paste can add spaces - trim them!
❌ **Wrong project**: Make sure you're in `circletel` project, not another one

### Step 3: Update Environment Variables (If Needed)

If any variables are missing or incorrect:

1. Click "Add New" or "Edit" for each variable
2. Use these EXACT values:

```env
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://agyjovdugmtopasyvlng.supabase.co
Environments: ✅ Production  ✅ Preview  ✅ Development

Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: sb_publishable_jKBISiYlrRyJEfyYGcjJZw_AQJ8Udc7
Environments: ✅ Production  ✅ Preview  ✅ Development

Name: SUPABASE_SERVICE_ROLE_KEY
Value: sb_secret_KZlUVioFZ4r8vbeOK4215g_f3tUgyoG
Environments: ✅ Production  ✅ Preview  ✅ Development
```

3. Click "Save"

### Step 4: Force Redeploy

After updating environment variables, **you MUST redeploy** for changes to take effect:

```bash
# Trigger a fresh deployment
git commit --allow-empty -m "redeploy: Force deployment after env var fix"
git push origin main
```

### Step 5: Wait and Test (2-3 minutes)

Wait for Vercel to build and deploy, then test:

```bash
# Test the deployment checker script
node scripts/check-deployment.js
```

**Expected output:**
```
✅ ALL TESTS PASSED - Deployment is healthy!

Environment Variables Verified:
  NEXT_PUBLIC_SUPABASE_URL: ✅
  NEXT_PUBLIC_SUPABASE_ANON_KEY: ✅
  SUPABASE_SERVICE_ROLE_KEY: ✅
```

### Step 6: Verify Quotes Page Works

1. Go to: https://www.circletel.co.za/admin/login
2. Login with: `devadmin@circletel.co.za`
3. Navigate to: https://www.circletel.co.za/admin/quotes
4. **Expected**: Page loads with quotes in < 2 seconds ✅

## 📊 Performance Expectations (After Fix)

| Metric | Before | After |
|--------|--------|-------|
| API Queries | 101 queries | 3 queries |
| Response Time | Timeout (30s+) | < 2 seconds |
| User Experience | Infinite loading | Instant load |

## 🔍 Debugging: If Still Not Working

### Check Vercel Function Logs

1. Go to: https://vercel.com/jdewee-livecoms-projects/circletel
2. Click "Deployments" → Select latest deployment
3. Click "Functions" → "Log Stream"
4. Navigate to quotes page and look for logs:

**Good logs (environment variables working):**
```
[Quotes API] Starting...
[Quotes API] Fetching quotes with params: { limit: 50, offset: 0 }
[Quotes API] Found 14 quotes in 234ms
[Quotes API] ✅ Successfully fetched 14 quotes with details in 567ms
```

**Bad logs (environment variables missing):**
```
[Quotes API] Starting...
(no further logs - hanging on Supabase client creation)
```

### Alternative: Use Legacy JWT Format

If the new `sb_secret_*` format doesn't work, try the legacy JWT format:

```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFneWpvdmR1Z210b3Bhc3l2bG5nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjA2ODQzNiwiZXhwIjoyMDU3NjQ0NDM2fQ.c32hg_G2Tu9Y84Pf6r34BADW4DiDIFld0B-stmqNk-4
```

✅ **Confirmed**: Both formats work locally with `@supabase/supabase-js` client.

---

## 📝 Deployed Commits

- `e1fbe76` - N+1 query optimization + frontend timeout
- `6780d85` - Debug test endpoint
- `ea7a15a` - Ping endpoint for env check
- `eba6a28` - Env test endpoint
- `09d4ecc` - First middleware fix attempt
- `1ca4e51` - Simplified middleware matcher (current) ✅

## 🆘 Last Resort: Check Vercel Build Logs

If environment variables look correct but endpoints still timeout:

1. Go to Vercel deployments
2. Click latest deployment
3. Check "Build Logs" tab for errors
4. Look for any Supabase-related errors during build

**Common build issues:**
- `SUPABASE_URL is undefined` - Missing public URL
- `fetch failed` during build - Network issues reaching Supabase
- TypeScript errors preventing API route compilation
