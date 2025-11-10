# 🔧 Fix Vercel Environment Variables

## Problem
The admin quotes page is timing out because Vercel doesn't have the correct `SUPABASE_SERVICE_ROLE_KEY`.

## ✅ Both Key Formats Work (Confirmed Locally)
- ✅ **NEW format**: `sb_secret_KZlUVioFZ4r8vbeOK4215g_f3tUgyoG`
- ✅ **LEGACY format**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## 🎯 Steps to Fix

### 1. Update Vercel Environment Variables

Go to: https://vercel.com/jdewee-livecoms-projects/circletel/settings/environment-variables

**Add/Update these 3 variables:**

```env
NEXT_PUBLIC_SUPABASE_URL
Value: https://agyjovdugmtopasyvlng.supabase.co
Environment: Production, Preview, Development

NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: sb_publishable_jKBISiYlrRyJEfyYGcjJZw_AQJ8Udc7
Environment: Production, Preview, Development

SUPABASE_SERVICE_ROLE_KEY
Value: sb_secret_KZlUVioFZ4r8vbeOK4215g_f3tUgyoG
Environment: Production, Preview, Development
```

**Important:**
- Use the **NEW `sb_secret_*` format** (Supabase's latest key system)
- Make sure to apply to **all environments** (Production, Preview, Development)
- **DO NOT commit these keys to GitHub** - they should only be in Vercel

### 2. Redeploy

After saving the environment variables in Vercel:

```bash
# Trigger a fresh deployment
git commit --allow-empty -m "redeploy: Update Supabase environment variables"
git push origin main
```

### 3. Verify the Fix (2-3 minutes after deploy)

Test the quotes page:
1. Go to: https://www.circletel.co.za/admin/login
2. Login with: `devadmin@circletel.co.za`
3. Navigate to: https://www.circletel.co.za/admin/quotes
4. **Expected result**: Page loads with quotes (no timeout!)

### 4. Test Our Debug Endpoints

```bash
# Test ping endpoint (should return instantly)
curl https://www.circletel.co.za/api/quotes/ping

# Expected response:
{
  "success": true,
  "message": "API is working",
  "environment": {
    "hasSupabaseUrl": true,
    "hasServiceKey": true,
    "hasAnonKey": true
  },
  "elapsed": <5
}

# Test the quotes API (should return in <2 seconds)
curl https://www.circletel.co.za/api/quotes/business/list?limit=5
```

## ✅ What We Fixed

1. **N+1 Query Problem**: Reduced 101 queries → 3 queries
2. **Frontend Timeout**: Added 30-second timeout with clear error message
3. **Comprehensive Logging**: Added timing metrics and error details
4. **Environment Variables**: Identified and documented correct Supabase keys

## 📊 Performance Expectations

**After fix:**
- Quotes API: < 2 seconds for 50 quotes
- Quotes page: Instant load (no spinner)
- Error message: If any issues, shows clear error instead of infinite loading

## 🔍 If Still Not Working

Check Vercel logs:
1. Go to: https://vercel.com/jdewee-livecoms-projects/circletel
2. Click "Functions" → "Log Stream"
3. Look for `[Quotes API]` log messages
4. Check if environment variables are detected:
   - Should see: `✅ Successfully fetched X quotes with details in Yms`
   - NOT: `❌ Error after Xms`

---

**Deployed Commits:**
- `e1fbe76` - N+1 query optimization + timeout protection
- `6780d85` - Debug test endpoint
- `ea7a15a` - Ping endpoint for env var check
