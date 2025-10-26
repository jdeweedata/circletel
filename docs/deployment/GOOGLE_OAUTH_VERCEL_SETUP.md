# Google OAuth for Vercel Deployment

Complete guide for configuring Google OAuth to work on Vercel production/staging environments.

## 🌐 Your Vercel Domains

**Production Domain**: `https://circletel-staging.vercel.app`

**Preview Deployments**: `https://circletel-staging-[hash]-jdewee-livecoms-projects.vercel.app`

---

## ⚙️ Step-by-Step Configuration

### 1️⃣ Update Google Cloud Console

#### A. Add Production JavaScript Origins

Go to: https://console.cloud.google.com/apis/credentials

Navigate to your OAuth client: **"Circle Tel"**

**Authorized JavaScript origins** → Click **"+ Add URI"**:

```
https://circletel-staging.vercel.app
```

✅ **Your current config already has this!**

#### B. Add Production Redirect URIs

**Authorized redirect URIs** → Click **"+ Add URI"**:

```
https://circletel-staging.vercel.app/auth/callback
https://circletel-staging.vercel.app/auth/v1/callback
```

#### C. Optional: Support Preview Deployments

If you want OAuth to work on Vercel preview deployments (branches), you have two options:

**Option 1: Wildcard Domain (Recommended)**
```
https://*.vercel.app/auth/callback
```
⚠️ Note: Google OAuth supports wildcards, but it's less secure. Only use for staging/testing.

**Option 2: Add Specific Preview URLs** (when testing specific branches)
```
https://circletel-staging-[specific-hash].vercel.app/auth/callback
```

#### Final Google Console Configuration

Your **Authorized redirect URIs** should include:

```
# Supabase callback (REQUIRED)
https://agyjovdugmtopasyvlng.supabase.co/auth/v1/callback

# Production
https://circletel-staging.vercel.app/auth/callback
https://circletel-staging.vercel.app/auth/v1/callback

# Development
http://localhost:3006/auth/callback
http://localhost:3000/auth/callback
http://localhost:3001/auth/callback
```

Click **"Save"** and wait 5-10 minutes for propagation.

---

### 2️⃣ Configure Supabase for Production

#### A. Add Production Redirect URLs

Go to: https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/auth/url-configuration

**Redirect URLs** → Add these (one per line):

```
http://localhost:3006/auth/callback
http://localhost:3000/auth/callback
http://localhost:3001/auth/callback
https://circletel-staging.vercel.app/auth/callback
```

#### B. Set Production Site URL

**Site URL** → Set to:
```
https://circletel-staging.vercel.app
```

⚠️ **Important**: You can only have ONE site URL. For local development, change it back to `http://localhost:3006`.

**Alternative**: Use environment-specific configuration (see Step 3).

Click **"Save"**.

---

### 3️⃣ Configure Vercel Environment Variables

#### A. Access Vercel Dashboard

Go to: https://vercel.com/jdewee-livecoms-projects/circletel-staging/settings/environment-variables

Or via CLI:
```bash
vercel env ls
```

#### B. Add/Verify Environment Variables

Ensure these variables are set for **Production** environment:

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://agyjovdugmtopasyvlng.supabase.co` | Production |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `[Your Anon Key]` | Production |
| `SUPABASE_SERVICE_ROLE_KEY` | `sb_secret_KZlUVioFZ4r8vbeOK4215g_f3tUgyoG` | Production |
| `NEXT_PUBLIC_APP_URL` | `https://circletel-staging.vercel.app` | Production |

#### C. Add Environment Variables via CLI

```bash
# Production environment
vercel env add NEXT_PUBLIC_APP_URL production
# Enter: https://circletel-staging.vercel.app

# Preview environment (for branch deployments)
vercel env add NEXT_PUBLIC_APP_URL preview
# Enter: https://circletel-staging.vercel.app
```

#### D. Verify Variables Are Set

```bash
vercel env ls
```

You should see all Supabase and app variables listed.

---

### 4️⃣ Update Code for Production (Optional)

Your code already handles this correctly! The `signInWithGoogle()` function uses:

```typescript
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
const redirectUrl = `${baseUrl}/auth/callback?next=/order/service-address`;
```

This means:
- ✅ **Production**: Uses `NEXT_PUBLIC_APP_URL` = `https://circletel-staging.vercel.app`
- ✅ **Development**: Falls back to `window.location.origin` = `http://localhost:3006`

**No code changes needed!** ✨

---

### 5️⃣ Deploy to Vercel

#### A. Commit and Push Changes (if any)

```bash
git add .
git commit -m "Configure Google OAuth for Vercel production"
git push origin main
```

#### B. Trigger Deployment

Vercel will auto-deploy on push, or manually trigger:

```bash
vercel --prod
```

#### C. Wait for Deployment

Monitor deployment status:
```bash
vercel ls
```

Or check Vercel dashboard: https://vercel.com/jdewee-livecoms-projects/circletel-staging

---

### 6️⃣ Test Production OAuth Flow

#### A. Navigate to Production Account Page

Visit: **https://circletel-staging.vercel.app/order/account**

#### B. Click "Continue with Google"

Expected flow:
1. ✅ Redirect to Google OAuth consent screen
2. ✅ Sign in with Google account
3. ✅ Grant permissions to CircleTel
4. ✅ Redirect to: `https://circletel-staging.vercel.app/auth/callback`
5. ✅ Customer record created automatically
6. ✅ Final redirect to: `https://circletel-staging.vercel.app/order/service-address`

#### C. Check Browser Console

Open DevTools → Console:

```
[Google OAuth] Redirect URL: https://circletel-staging.vercel.app/auth/callback?next=/order/service-address
[Auth Callback] Checking for hash: #access_token=...
[Auth Callback] Access token found: true
[Auth Callback] Session set successfully: true
[Auth Callback] Creating customer record for OAuth user
[Auth Callback] Create customer result: { success: true, ... }
```

#### D. Verify Customer Record Created

Check Supabase database:
```bash
# Use sql-assistant skill
powershell -File .claude/skills/sql-assistant/run-sql-assistant.ps1 -Query "Show customers created in last hour"
```

Or check Supabase dashboard:
https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/editor

---

## 🔍 Troubleshooting Production Issues

### Issue: "Error 400: redirect_uri_mismatch" on Production

**Cause**: Production callback URL not registered in Google Console.

**Solution**:
1. Go to Google Cloud Console → Credentials
2. Verify this exact URL exists: `https://circletel-staging.vercel.app/auth/callback`
3. Check for typos (https vs http, trailing slash, etc.)
4. Save and wait 5-10 minutes

### Issue: OAuth works locally but not on Vercel

**Cause**: Environment variable `NEXT_PUBLIC_APP_URL` not set on Vercel.

**Solution**:
```bash
vercel env add NEXT_PUBLIC_APP_URL production
# Enter: https://circletel-staging.vercel.app

# Redeploy
vercel --prod
```

### Issue: Redirect loop after OAuth on production

**Cause**: Supabase "Site URL" doesn't match production domain.

**Solution**:
1. Go to: https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/auth/url-configuration
2. Set **Site URL** to: `https://circletel-staging.vercel.app`
3. Save and test again

### Issue: Customer record not created on production

**Cause**: `/api/auth/create-customer` endpoint failing due to missing service role key.

**Solution**:
```bash
# Verify service role key is set on Vercel
vercel env ls | grep SUPABASE_SERVICE_ROLE_KEY

# If not set, add it
vercel env add SUPABASE_SERVICE_ROLE_KEY production
# Enter: sb_secret_KZlUVioFZ4r8vbeOK4215g_f3tUgyoG
```

### Issue: CORS errors on production

**Cause**: JavaScript origin not registered in Google Console.

**Solution**:
1. Go to Google Cloud Console → Credentials
2. Add to **Authorized JavaScript origins**: `https://circletel-staging.vercel.app`
3. Save and wait 5-10 minutes

---

## 🌍 Supporting Multiple Environments

### Strategy 1: Separate OAuth Clients (Recommended)

Create separate Google OAuth clients for each environment:

**Development Client**:
- Name: "CircleTel Development"
- Redirect URIs: `http://localhost:*`
- Use in `.env.local`

**Staging Client**:
- Name: "CircleTel Staging"
- Redirect URIs: `https://circletel-staging.vercel.app/*`
- Use in Vercel staging environment

**Production Client**:
- Name: "CircleTel Production"
- Redirect URIs: `https://circletel.com/*`
- Use in Vercel production environment

Configure in Supabase by environment.

### Strategy 2: Single OAuth Client with All URLs

Use one OAuth client with all redirect URIs:

```
http://localhost:3006/auth/callback
http://localhost:3000/auth/callback
https://circletel-staging.vercel.app/auth/callback
https://circletel.com/auth/callback
https://*.vercel.app/auth/callback  # For preview deployments
```

**Pros**: Simple setup, works everywhere
**Cons**: Less secure (broad redirect permissions)

---

## 📋 Pre-Deployment Checklist

Before deploying to production, verify:

- [ ] Google OAuth client configured with production redirect URIs
- [ ] Supabase redirect URLs include production domain
- [ ] Supabase Site URL set to production domain
- [ ] `NEXT_PUBLIC_APP_URL` environment variable set on Vercel
- [ ] All Supabase environment variables set on Vercel
- [ ] Code uses `process.env.NEXT_PUBLIC_APP_URL || window.location.origin` pattern
- [ ] Customer creation API route (`/api/auth/create-customer`) exists
- [ ] Auth callback page handles OAuth implicit flow
- [ ] Test OAuth flow on staging before promoting to production

---

## 🚀 Quick Setup Commands

### One-Time Setup

```bash
# 1. Set production environment variables
vercel env add NEXT_PUBLIC_APP_URL production
# Value: https://circletel-staging.vercel.app

# 2. Verify all env vars
vercel env ls

# 3. Deploy to production
vercel --prod

# 4. Test OAuth
# Visit: https://circletel-staging.vercel.app/order/account
```

### Environment-Specific URLs

```bash
# Development
http://localhost:3006/order/account

# Staging (Vercel)
https://circletel-staging.vercel.app/order/account

# Production (when ready)
https://circletel.com/order/account
```

---

## 🔐 Security Best Practices

1. **Use HTTPS Only in Production**
   - Never use `http://` for production OAuth
   - Google requires HTTPS for production redirect URIs

2. **Rotate Client Secrets Regularly**
   - Update Google Client Secret every 90 days
   - Update in both Google Console and Supabase

3. **Limit Redirect URIs**
   - Only add necessary redirect URIs
   - Avoid wildcards in production

4. **Environment Separation**
   - Use separate OAuth clients for dev/staging/prod
   - Never use production credentials in development

5. **Monitor OAuth Usage**
   - Check Google Cloud Console quotas
   - Monitor Supabase auth logs
   - Set up alerts for failed auth attempts

6. **Protect Environment Variables**
   - Never commit `.env` files
   - Use Vercel's encrypted environment variables
   - Rotate service role keys if exposed

---

## 📊 Monitoring OAuth in Production

### Vercel Logs

```bash
# View recent logs
vercel logs https://circletel-staging.vercel.app --follow

# Filter for auth errors
vercel logs https://circletel-staging.vercel.app | grep -i "auth"
```

### Supabase Auth Logs

View at: https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/logs/auth-logs

Look for:
- `user_signedup` events
- `token_refreshed` events
- Failed sign-in attempts

### Google Cloud Console

View at: https://console.cloud.google.com/apis/dashboard

Monitor:
- OAuth consent requests
- API quota usage
- Error rates

---

## 📞 Support Resources

- **Vercel Docs**: https://vercel.com/docs/concepts/projects/environment-variables
- **Supabase OAuth Docs**: https://supabase.com/docs/guides/auth/social-login/auth-google
- **Google OAuth Setup**: https://support.google.com/cloud/answer/6158849
- **CircleTel OAuth Setup**: `docs/integrations/GOOGLE_OAUTH_SETUP.md`

---

**Last Updated**: 2025-10-26
**Version**: 1.0
**Status**: ✅ Production Ready
**Your Production Domain**: `https://circletel-staging.vercel.app`
