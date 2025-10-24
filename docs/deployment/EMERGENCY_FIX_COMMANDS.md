# EMERGENCY FIX - Correct Supabase API Keys

**Issue**: Secret key was accidentally set as the anon key (public variable)
**Risk**: SECRET key exposed in client-side code
**Action**: Fix immediately

---

## 🚨 What Happened

You accidentally entered:
```
NEXT_PUBLIC_SUPABASE_ANON_KEY = sb_secret_KZlUVioFZ4r8vbeOK4215g_f3tUgyoG
```

**This is WRONG because:**
- `NEXT_PUBLIC_*` variables are **EXPOSED** in browser JavaScript
- `sb_secret_...` is a **SECRET** key that should NEVER be public
- You just exposed your admin key to the world! 🚨

---

## ✅ Correct Key Mapping

| Variable Name | Should Contain | Format | Public? |
|---------------|----------------|--------|---------|
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Publishable Key** | `sb_publishable_...` | ✅ Yes (safe) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret Key** | `sb_secret_...` | ❌ No (private) |

---

## 🔧 Fix Commands (Run These Now)

### Step 1: Remove the Exposed Secret Key

```bash
# Remove from production
vercel env rm NEXT_PUBLIC_SUPABASE_ANON_KEY production

# Remove from preview
vercel env rm NEXT_PUBLIC_SUPABASE_ANON_KEY preview

# Remove from development
vercel env rm NEXT_PUBLIC_SUPABASE_ANON_KEY development
```

### Step 2: Add CORRECT Publishable Key

```bash
# Add to production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# Paste: sb_publishable_jKBISiYlrRyJEfyYGcjJZw_AQJ8Udc7

# Add to preview
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview
# Paste: sb_publishable_jKBISiYlrRyJEfyYGcjJZw_AQJ8Udc7

# Add to development
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY development
# Paste: sb_publishable_jKBISiYlrRyJEfyYGcjJZw_AQJ8Udc7
```

### Step 3: Rotate the Compromised Secret Key (Important!)

Since the secret key was briefly exposed, you should rotate it:

1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/settings/api
2. Click on **"API Keys"** tab
3. Under **"Secret keys"** section
4. Click **"+ New secret key"**
5. Give it a name (e.g., "Production Key - Jan 2025")
6. Click **"Create"**
7. **Copy the new secret key** (starts with `sb_secret_...`)
8. **Delete the old "default" key** that was compromised

### Step 4: Add NEW Secret Key to Vercel

```bash
# Add to production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
# Paste: <new sb_secret_... from Step 3>

# Add to preview
vercel env add SUPABASE_SERVICE_ROLE_KEY preview
# Paste: <same new secret key>

# Add to development
vercel env add SUPABASE_SERVICE_ROLE_KEY development
# Paste: <same new secret key>
```

### Step 5: Update Local .env.local

```bash
NEXT_PUBLIC_SUPABASE_URL=https://agyjovdugmtopasyvlng.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_jKBISiYlrRyJEfyYGcjJZw_AQJ8Udc7
SUPABASE_SERVICE_ROLE_KEY=<new sb_secret_... from Step 3>
```

### Step 6: Redeploy

```bash
vercel --prod --force
```

---

## 📋 Verification

After fixing, verify with:

```bash
# Check environment variables are correct
vercel env ls

# Test debug endpoint after deployment
curl https://circletel-staging.vercel.app/api/coverage/debug
```

**Expected**:
```json
{
  "env_check": {
    "NEXT_PUBLIC_SUPABASE_URL": true,
    "SUPABASE_SERVICE_ROLE_KEY": true,
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": true
  }
}
```

---

## 🎓 Remember

**NEXT_PUBLIC_*** = **PUBLIC** (safe to expose)
- Publishable key: `sb_publishable_...`

**SERVER-SIDE only** = **SECRET** (never expose)
- Secret key: `sb_secret_...`

---

**Created**: 2025-01-20
**Priority**: CRITICAL - Fix immediately
**Status**: Awaiting fix
