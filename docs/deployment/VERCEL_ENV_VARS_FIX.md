# Vercel Environment Variables Fix

**Issue**: Coverage API failing with 500 error - Need to use Legacy API Keys
**Date**: 2025-01-20
**Status**: ✅ IDENTIFIED - Awaiting Vercel Update

---

## Problem Identified

Supabase has **TWO types of API keys**:
1. **NEW API Keys** - `sb_publishable_...` and `sb_secret_...` (shown in screenshot)
2. **Legacy API Keys** - JWT format `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

Your Vercel is using the **NEW publishable key**, but the codebase needs the **LEGACY JWT keys**!

### Current in Vercel (NEW format - NOT COMPATIBLE):
```
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_jKBISiYlrRyJEfyYGcjJZw_AQJ8Udc7
```

### Need to switch to LEGACY API Keys

---

## How to Get Legacy API Keys in Supabase

### Step 1: Access Legacy API Keys
1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/agyjovdugmtopasyvlng
2. Click **Settings** (left sidebar)
3. Click **API Keys**
4. Click the **"Legacy API Keys"** tab (next to "API Keys" tab)

### Step 2: Copy the Legacy Keys
You'll see two keys:
- **anon public** - This is the JWT format anon key (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
- **service_role** - This is the JWT format service role key (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

---

## Correct Environment Variables for Vercel

### For Vercel Dashboard (Settings → Environment Variables)

Update these **THREE** environment variables with **LEGACY JWT keys**:

#### 1. Supabase URL
```
NEXT_PUBLIC_SUPABASE_URL=https://agyjovdugmtopasyvlng.supabase.co
```

#### 2. Supabase Anon Key (LEGACY JWT - Client-side)
**IMPORTANT**: Get this from "Legacy API Keys" → "anon public" in Supabase
```
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFneWpvdmR1Z210b3Bhc3l2bG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwNjg0MzYsImV4cCI6MjA1NzY0NDQzNn0.tEGMZGJLGJetMDf-0aCL9gfPelj347LMNpWrt4HOLXU
```

#### 3. Supabase Service Role Key (LEGACY JWT - Server-side)
**IMPORTANT**: Get this from "Legacy API Keys" → "service_role" in Supabase
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFneWpvdmR1Z210b3Bhc3l2bG5nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjA2ODQzNiwiZXhwIjoyMDU3NjQ0NDM2fQ.c32hg_G2Tu9Y84Pf6r34BADW4DiDIFld0B-stmqNk-4
```

---

## How to Update in Vercel

### Step 1: Go to Vercel Dashboard
1. Navigate to https://vercel.com/jdewee-livecoms-projects/circletel-staging
2. Click on **Settings** tab
3. Click on **Environment Variables** in the sidebar

### Step 2: Update/Add Variables
For EACH variable:
1. Click **Edit** (if exists) or **Add New** (if missing)
2. Name: Copy from above (e.g., `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
3. Value: Copy the JWT token from above
4. Environment: Select **Production**, **Preview**, AND **Development**
5. Click **Save**

### Step 3: Redeploy
After updating all variables:
1. Go to **Deployments** tab
2. Find the latest deployment
3. Click **⋯** (three dots) → **Redeploy**
4. Select **Use existing build cache: No**
5. Click **Redeploy**

---

## Verification

### 1. Check Debug Endpoint
Once redeployed, test:
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

All values should be `true`.

### 2. Test Coverage Checker
1. Go to https://circletel-staging.vercel.app/
2. Enter address: "1 Sandton Drive, Sandton"
3. Click "Check coverage"
4. **Expected**: Should navigate to `/coverage/results?leadId={uuid}`
5. **No more 500 error!**

---

## Why This Matters

### Anon Key (Client-side)
- Used in browser JavaScript
- Creates Supabase client for authenticated users
- Respects Row Level Security (RLS) policies
- **Wrong key = Cannot connect to Supabase from browser**

### Service Role Key (Server-side)
- Used in API routes only
- Has admin privileges (bypasses RLS)
- **Wrong/missing key = Server API routes fail**

### The Mix-up
Someone accidentally set the anon key to a Stripe publishable key (`sb_publishable_`), which is completely unrelated to Supabase. This causes:
- ❌ Browser cannot connect to Supabase
- ❌ Coverage checker fails to create leads
- ❌ All client-side Supabase queries fail

---

## Security Notes

⚠️ **Anon Key is PUBLIC** - It's safe to include in client-side code and can be exposed
✅ **Service Role Key is SECRET** - Never expose this in client-side code (only use in API routes)

These keys are already in your local `.env.local` file (which is gitignored), so they won't be committed to the repository.

---

## Local Environment Fixed

The local `.env.local` file has been updated with the correct anon key. Restart your local dev server after this change:

```bash
# Kill existing dev servers
# Then restart with:
npm run dev:memory
```

---

## Related Files

- **API Fix**: `app/api/coverage/lead/route.ts` (already fixed)
- **Debug Tool**: `app/api/coverage/debug/route.ts` (helps verify env vars)
- **Local Env**: `.env.local` (✅ Fixed)
- **Vercel Env**: Settings → Environment Variables (⏳ Needs update)

---

**Next Step**: Update Vercel environment variables as described above, then redeploy and test!

---

**Created**: 2025-01-20
**Updated**: 2025-01-20
**Status**: Awaiting Vercel configuration update
