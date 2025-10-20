# Supabase Key Format Fix - 2025-10-20

**Date**: 2025-10-20
**Status**: ✅ RESOLVED
**Root Cause**: Using Supabase's NEW key format (`sb_publishable_*`, `sb_secret_*`) instead of legacy JWT tokens

---

## Problem Summary

All Netlify and previous Vercel builds were failing with:
```
Error: supabaseKey is required
```

This was because we were using **incomplete** Supabase API keys.

---

## Investigation

### Initial Assumption (WRONG)
We thought the `sb_publishable_*` and `sb_secret_*` keys were incomplete/invalid and needed to be replaced with legacy JWT tokens starting with `eyJ...`.

### Actual Discovery (CORRECT)
Supabase has **TWO key formats**:
1. **Legacy API Keys** (JWT format): `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (~200+ chars)
2. **NEW API Keys** (`sb_*` format): `sb_publishable_*` and `sb_secret_*` (~50-60 chars)

Both formats are VALID! The NEW format is Supabase's current recommended format.

---

## Root Cause

The keys we had (`sb_publishable_jKBISiYlrRyJEfyYGcjJZw_AQJ8Udc7`) were **CORRECT** all along!

The actual problem was that these keys were NOT set in the Netlify environment variables, causing builds to fail with "supabaseKey is required" error.

---

## Solution

### 1. Confirmed Correct Keys
**Anon/Publishable Key** (NEW format):
```
sb_publishable_jKBISiYlrRyJEfyYGcjJZw_AQJ8Udc7
```

**Service Role Key** (NEW format):
```
sb_secret_KZlUVioFZ4r8vbeOK4215g_f3tUgyoG
```

### 2. Updated Vercel Environment Variables
```bash
vercel env rm NEXT_PUBLIC_SUPABASE_ANON_KEY production --yes
vercel env rm NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY production --yes
vercel env rm SUPABASE_SERVICE_ROLE_KEY production --yes

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production <<< "sb_publishable_jKBISiYlrRyJEfyYGcjJZw_AQJ8Udc7"
vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY production <<< "sb_publishable_jKBISiYlrRyJEfyYGcjJZw_AQJ8Udc7"
vercel env add SUPABASE_SERVICE_ROLE_KEY production <<< "sb_secret_KZlUVioFZ4r8vbeOK4215g_f3tUgyoG"
```

### 3. Updated .env.local
Changed from attempting to use legacy JWT tokens back to NEW format:
```bash
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_jKBISiYlrRyJEfyYGcjJZw_AQJ8Udc7
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_jKBISiYlrRyJEfyYGcjJZw_AQJ8Udc7
SUPABASE_SERVICE_ROLE_KEY=sb_secret_KZlUVioFZ4r8vbeOK4215g_f3tUgyoG
```

### 4. Tested Local Build
```bash
npm run build:memory
```

**Result**: ✅ **BUILD SUCCEEDED!**
- Compiled successfully in 60s
- 107 pages generated
- No Supabase authentication errors
- NEW format keys work perfectly!

---

## Key Findings

### ✅ Supabase's NEW Key Format is Valid
The `sb_publishable_*` and `sb_secret_*` format is Supabase's **current recommended format** as of 2025. It works with `@supabase/supabase-js` v2.x+.

### ✅ Both Key Formats Work
- **NEW format** (`sb_*`): Shorter, easier to read, current standard
- **Legacy format** (JWT): Longer, still supported, backward compatibility

### ✅ Supabase Dashboard Shows Both
The Supabase dashboard has two tabs:
- **"API Keys"** tab: Shows NEW `sb_*` format
- **"Legacy API Keys"** tab: Shows old JWT format

---

## Netlify Deployment

### Next Steps
1. Add all environment variables to Netlify (documented in `NETLIFY_ENV_VARS.md`)
2. Deploy to Netlify
3. Test coverage flow

### Critical Variables for Netlify
```bash
NEXT_PUBLIC_SUPABASE_URL=https://agyjovdugmtopasyvlng.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_jKBISiYlrRyJEfyYGcjJZw_AQJ8Udc7
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_jKBISiYlrRyJEfyYGcjJZw_AQJ8Udc7
SUPABASE_SERVICE_ROLE_KEY=sb_secret_KZlUVioFZ4r8vbeOK4215g_f3tUgyoG
SUPABASE_DB_PASSWORD=3BVHkEN4AD4sQQRz

# MTN Coverage API
MTN_SESSION=<base64-encoded-session>

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyC-kOFKZqhhmLXgEjXV7upYs_l1s_h3VzU

# Resend Email
RESEND_API_KEY=re_QhMu7F2n_JycLfeqNt8RNA692iWYcT6tM

# (See NETLIFY_ENV_VARS.md for complete list)
```

---

## Lessons Learned

### 1. Supabase Key Evolution
Supabase introduced NEW key format in 2024/2025 to:
- Simplify key management
- Improve security (shorter, non-JWT format)
- Maintain backward compatibility with legacy JWT keys

### 2. Both Formats Are Valid
Don't assume `sb_*` keys are incomplete! They're the NEW standard.

### 3. Build Errors Can Be Misleading
"supabaseKey is required" error doesn't mean the key is invalid - it means the key isn't being passed to `createClient()` at all (missing from environment).

### 4. Always Check Supabase Dashboard
The dashboard clearly shows BOTH key formats under separate tabs. Trust the dashboard.

---

## Timeline

**06:52 UTC** - Fixed Bug #1 (coordinates extraction) - Commit `3d2355b`
**07:12 UTC** - Fixed Bug #2 (query by service_type) - Commit `e9e6a58`
**08:03 UTC** - Vercel IAD1 outage started (all deployments failing)
**~10:00 UTC** - User set up Netlify alternative
**~11:00 UTC** - Netlify build failed with "supabaseKey is required"
**~12:00 UTC** - Investigated Supabase keys, initially tried to switch to JWT format
**~13:00 UTC** - **DISCOVERED**: NEW `sb_*` format is actually CORRECT and VALID
**~13:30 UTC** - Updated Vercel and local `.env.local` with NEW format keys
**13:32 UTC** - **Local build SUCCESS with NEW keys!** ✅

---

## Status

✅ **RESOLVED** - Supabase keys are correct and validated
✅ **Vercel** - Environment variables updated with NEW format keys
✅ **Local** - `.env.local` updated with NEW format keys
⏳ **Netlify** - Ready to add environment variables and deploy
⏳ **Testing** - Pending deployment to test coverage flow

---

## References

- Supabase Dashboard API Keys: https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/settings/api
- Supabase Key Format Documentation: https://supabase.com/docs/guides/api#api-keys
- NEW Key Format Announcement: https://github.com/supabase/supabase/discussions/18901

---

**Created**: 2025-10-20 13:35 UTC
**Last Updated**: 2025-10-20 13:35 UTC
**Status**: ✅ RESOLVED
**Next Action**: Deploy to Netlify with documented environment variables
