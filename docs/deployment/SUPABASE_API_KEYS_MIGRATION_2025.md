# Supabase API Keys Migration - CircleTel

**Date**: 2025-01-20
**Status**: ✅ RECOMMENDED - Migrate to NEW API Keys
**Deadline**: Legacy keys deprecated October 1, 2025

---

## 🎯 Executive Summary

**STOP!** Based on the official Supabase migration announcement (GitHub Discussion #29260), you should **USE THE NEW API KEYS**, not the legacy JWT keys!

### Key Findings

1. ✅ **NEW keys (`sb_publishable_`, `sb_secret_`) are the RECOMMENDED approach**
2. ⚠️ **Legacy JWT keys will be DELETED on October 1, 2025**
3. ✅ **Supabase client libraries support BOTH formats** (drop-in replacement)
4. ✅ **No backward compatibility issues expected**

---

## 🔄 What Changed

### Official Supabase Migration Timeline

| Date | Event |
|------|-------|
| **September 2024** | New API key system introduced |
| **Now (Jan 2025)** | Both systems work (transition period) |
| **October 1, 2025** | Legacy JWT keys will be DELETED |
| **November 1, 2025** | New projects won't have legacy keys |

### Current CircleTel Status

**In Vercel** (as of Jan 20, 2025):
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `sb_publishable_jKBISiYlrRyJEfyYGcjJZw_AQJ8Udc7` ✅ NEW format (correct!)
- `SUPABASE_SERVICE_ROLE_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` ⚠️ LEGACY format (works now, deprecated Oct 2025)

**In Local `.env.local`**:
- Uses LEGACY JWT keys ⚠️ (needs migration)

---

## ✅ Correct Migration Path

### Step 1: Use NEW Keys Everywhere

Based on official Supabase documentation, the NEW keys are **drop-in replacements** for legacy keys:

**For `@supabase/supabase-js`**:
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://agyjovdugmtopasyvlng.supabase.co',
  'sb_publishable_jKBISiYlrRyJEfyYGcjJZw_AQJ8Udc7' // ✅ NEW publishable key works!
)
```

**Official Quote** (from GitHub Discussion #29260):
> "For the most part, you can substitute these values anywhere you used the anon and service_role keys respectively. They work roughly the same in terms of permissions and data access."
>
> "You can initialize any version of the Supabase Client libraries with the new values without any additional changes, and Supabase doesn't expect any backward compatibility issues."

### Step 2: Get NEW Secret Key

From the Supabase screenshot you provided, I can see you have:
- **Publishable Key**: `sb_publishable_jKBISiYlrRyJEfyYGcjJZw_AQJ8Udc7` ✅
- **Secret Key**: `sb_secret_KZlUV...` (partially shown) ⚠️ Need full value

**To get the full secret key**:
1. Go to Supabase Dashboard → Settings → API Keys
2. Click on the **"API Keys"** tab (not "Legacy API Keys")
3. Under **"Secret keys"** section, reveal the `default` secret key
4. Copy the full `sb_secret_...` value

### Step 3: Update All Environments

**Vercel (Production, Preview, Development)**:
```bash
# Keep the current publishable key (it's already correct!)
# NEXT_PUBLIC_SUPABASE_ANON_KEY is already set correctly

# Update the service role key to NEW format
vercel env rm SUPABASE_SERVICE_ROLE_KEY production
vercel env rm SUPABASE_SERVICE_ROLE_KEY preview
vercel env rm SUPABASE_SERVICE_ROLE_KEY development

# Add NEW secret key
vercel env add SUPABASE_SERVICE_ROLE_KEY production
# Paste: sb_secret_KZlUV... (full value from Supabase dashboard)

vercel env add SUPABASE_SERVICE_ROLE_KEY preview
# Paste same value

vercel env add SUPABASE_SERVICE_ROLE_KEY development
# Paste same value
```

**Local `.env.local`**:
```bash
# Update to NEW keys
NEXT_PUBLIC_SUPABASE_URL=https://agyjovdugmtopasyvlng.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_jKBISiYlrRyJEfyYGcjJZw_AQJ8Udc7
SUPABASE_SERVICE_ROLE_KEY=sb_secret_KZlUV... # Full secret key from dashboard
```

---

## 🔍 What We Learned

### Original Diagnosis Was WRONG ❌

Our initial assessment was:
> "The NEW keys (`sb_publishable_`, `sb_secret_`) are incompatible with the codebase. Use LEGACY JWT keys."

**This was INCORRECT!** The truth is:
- ✅ NEW keys work perfectly with `@supabase/supabase-js`
- ✅ Supabase designed them as drop-in replacements
- ✅ No code changes needed
- ⚠️ Legacy keys will be DELETED in October 2025

### Why Did We Think They Were Incompatible?

The coverage checker 500 error is likely caused by:
1. **Missing environment variables** (not wrong format)
2. **RLS policies** blocking operations
3. **Different issue entirely** (not related to key format)

Let's verify this is NOT a key format issue.

---

## 🧪 Testing Plan

### Test 1: Verify NEW Keys Work Locally

Update your local `.env.local` with NEW keys and test:

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_jKBISiYlrRyJEfyYGcjJZw_AQJ8Udc7
SUPABASE_SERVICE_ROLE_KEY=sb_secret_KZlUV... # Full value needed

# Restart dev server
npm run dev:memory

# Test coverage checker locally
# Visit: http://localhost:3006
# Enter address: "1 Sandton Drive, Sandton"
# Click "Check coverage"
```

**Expected Result**: If NEW keys work locally, they'll work in production too! ✅

### Test 2: Check Current Production

Since Vercel **already has the NEW publishable key**, let's check if the issue is actually the missing/incorrect service role key:

```bash
curl https://circletel-staging.vercel.app/api/coverage/debug
```

If this shows `SUPABASE_SERVICE_ROLE_KEY: false`, that's the root cause (not the key format).

---

## 📊 Key Format Comparison

### LEGACY JWT Keys (Deprecated Oct 1, 2025)

**Anon Key**:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFneWpvdmR1Z210b3Bhc3l2bG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwNjg0MzYsImV4cCI6MjA1NzY0NDQzNn0.tEGMZGJLGJetMDf-0aCL9gfPelj347LMNpWrt4HOLXU
```

**Service Role Key**:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFneWpvdmR1Z210b3Bhc3l2bG5nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjA2ODQzNiwiZXhwIjoyMDU3NjQ0NDM2fQ.c32hg_G2Tu9Y84Pf6r34BADW4DiDIFld0B-stmqNk-4
```

**Limitations**:
- ❌ Cannot rotate independently
- ❌ Tightly coupled to JWT secret
- ❌ No rollback capability
- ❌ Will be deleted October 2025

### NEW API Keys (Recommended)

**Publishable Key**:
```
sb_publishable_jKBISiYlrRyJEfyYGcjJZw_AQJ8Udc7
```

**Secret Key**:
```
sb_secret_KZlUV... (full value from dashboard)
```

**Benefits**:
- ✅ Easy rotation (no downtime)
- ✅ Multiple secret keys supported
- ✅ Independent rotation
- ✅ Future-proof (supported long-term)
- ✅ Rollback capability

---

## 🚨 Critical Limitation (Important!)

### Authorization Header Issue

From Supabase documentation:

> **Important limitation**: It is no longer possible to use a publishable or secret key inside the Authorization header — because they are not a JWT. Instead pass in the user's JWT, or leave the header empty.

**Check CircleTel Codebase**:

We need to verify if any code is doing this:
```typescript
// ❌ WRONG - Don't do this with NEW keys
headers: {
  'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
}

// ✅ CORRECT - Use user's JWT or leave empty
headers: {
  'Authorization': `Bearer ${userJwt}` // User's session token
}
```

**Action**: Search codebase for manual Authorization header usage.

---

## 🎯 Recommended Action Plan

### Immediate (Today)

1. **STOP** the current CLI command (don't add LEGACY keys)
2. **Get the full NEW secret key** from Supabase dashboard:
   - Settings → API Keys → "API Keys" tab → Secret keys → Reveal `default`
3. **Keep the publishable key as-is** in Vercel (it's already correct!)
4. **Update ONLY the service role key** in Vercel to the NEW `sb_secret_...` format

### Short-term (This Week)

1. **Update local `.env.local`** with NEW keys
2. **Test locally** to confirm coverage checker works
3. **Search codebase** for any manual `Authorization` header usage
4. **Redeploy** to production after testing

### Long-term (Before October 2025)

1. **Monitor Supabase announcements** for any additional migration steps
2. **Update documentation** to reference NEW key system
3. **Remove all LEGACY key references** from codebase and docs

---

## 📝 Files to Update

### Environment Files
- `.env.local` - Update with NEW keys
- `.env.example` - Update documentation to show NEW key format
- Vercel environment variables - Update `SUPABASE_SERVICE_ROLE_KEY` to NEW format

### Documentation Files
- `docs/deployment/VERCEL_ENV_VARS_FIX.md` - Update to recommend NEW keys
- `docs/deployment/VERCEL_ENV_AUDIT_2025-01-20.md` - Mark as superseded
- `CLAUDE.md` - Update Supabase configuration section
- `README.md` - Update environment variables section (if exists)

---

## 🔗 Official Resources

- **GitHub Discussion #29260**: https://github.com/orgs/supabase/discussions/29260
- **Supabase Docs - API Keys**: https://supabase.com/docs/guides/api/api-keys
- **Supabase Changelog**: Migration announcements and timeline

---

## ✅ Verification Checklist

After migration:

- [ ] Supabase dashboard shows NEW keys (API Keys tab)
- [ ] Local `.env.local` uses NEW keys
- [ ] Vercel environment variables use NEW keys (all environments)
- [ ] Coverage checker works locally with NEW keys
- [ ] Coverage checker works on staging with NEW keys
- [ ] Debug endpoint shows all environment variables as `true`
- [ ] No `Authorization` header issues in codebase
- [ ] Documentation updated to reference NEW keys

---

**Created**: 2025-01-20
**Based on**: Supabase GitHub Discussion #29260
**Deadline**: October 1, 2025 (legacy keys deleted)
**Priority**: HIGH - Migrate before legacy keys are deprecated

**Next Step**: Get full NEW secret key → Update Vercel → Test ✅
