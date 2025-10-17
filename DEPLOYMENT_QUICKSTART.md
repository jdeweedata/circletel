# 🚀 MTN SSO - Vercel Deployment Quick Start

**5-Minute Deployment Guide for Production & Staging**

---

## ⚡ Quick Deploy (3 Steps)

### Step 1: Authenticate Locally (2 minutes)

```bash
# Run manual authentication
npx tsx scripts/test-mtn-sso-auth.ts --manual

# Solve reCAPTCHA and login
# Session will be cached automatically
```

### Step 2: Export Session for Vercel (30 seconds)

```bash
# Export session as base64
npx tsx scripts/export-session-env.ts

# Copy the long base64 string that appears
```

### Step 3: Deploy to Vercel (2 minutes)

#### For Production:

1. **Go to**: https://vercel.com/jdewee-livecoms-projects/circletel/settings/environment-variables

2. **Add Variable**:
   - Name: `MTN_SESSION`
   - Value: `<paste-base64-from-step-2>`
   - Environments: ✓ Production, ✓ Preview, ✓ Development
   - Click **Save**

3. **Also add these if not already set**:
   - `MTN_USERNAME` = `Lindokuhle.mdake@circletel.co.za`
   - `MTN_PASSWORD` = `Lwandle@1992*`
   - `CRON_SECRET` = `<generate-random-string>` (for automated refresh)

4. **Deploy**:
   ```bash
   vercel --prod
   ```

#### For Staging:

1. **Go to**: https://vercel.com/jdewee-livecoms-projects/circletel-stagging/settings/environment-variables

2. **Add same variables** as production (copy/paste)

3. **Deploy**:
   ```bash
   vercel
   ```

---

## 🔄 Keeping Session Alive (IMPORTANT!)

MTN sessions expire after ~1 hour. Choose one of these strategies:

### Option 1: GitHub Actions Automated Refresh ⭐ (Recommended)

**Setup Once:**

1. **Add GitHub Secrets** (https://github.com/YOUR_ORG/circletel-nextjs/settings/secrets/actions):
   ```
   MTN_USERNAME = Lindokuhle.mdake@circletel.co.za
   MTN_PASSWORD = Lwandle@1992*
   VERCEL_TOKEN = <your-vercel-token>
   VERCEL_PROJECT_ID = <your-project-id>
   VERCEL_ORG_ID = <your-org-id>
   ```

2. **Get Vercel Token**:
   - Go to: https://vercel.com/account/tokens
   - Create new token → Copy it
   - Add as `VERCEL_TOKEN` secret in GitHub

3. **Get Project/Org IDs**:
   ```bash
   cd /c/Projects/circletel-nextjs
   vercel link
   # IDs will be in .vercel/project.json
   ```

4. **Enable GitHub Actions**:
   - The workflow file `.github/workflows/refresh-mtn-session.yml` is already created
   - It will run automatically every 50 minutes
   - Monitor at: https://github.com/YOUR_ORG/circletel-nextjs/actions

**Benefits**:
- ✅ Fully automated (runs every 50 minutes)
- ✅ No manual intervention needed
- ✅ Auto-updates Vercel env vars
- ✅ Auto-redeploys to apply new session

### Option 2: Manual Refresh (When Expires)

When you see "No valid MTN session" errors:

```bash
# 1. Re-authenticate
npx tsx scripts/test-mtn-sso-auth.ts --manual

# 2. Export new session
npx tsx scripts/export-session-env.ts

# 3. Update MTN_SESSION in Vercel dashboard (same steps as above)

# 4. Optional: Redeploy to apply immediately
vercel --prod
```

### Option 3: External Monitoring Service

Use **UptimeRobot** or **Better Uptime** to ping:
```
POST https://your-domain.vercel.app/api/mtn-wholesale/refresh
Authorization: Bearer YOUR_CRON_SECRET
```

Set interval: Every 50 minutes

---

## ✅ Verify Deployment

### Test Production

```bash
# Check auth status
curl https://circletel.vercel.app/api/mtn-wholesale/auth

# Test products API
curl https://circletel.vercel.app/api/mtn-wholesale/products

# Should return:
# {
#   "error_code": "200",
#   "outputs": ["Wholesale Cloud Connect", "Wholesale Access Connect", ...]
# }

# Check session expiry
curl https://circletel.vercel.app/api/mtn-wholesale/refresh
```

### Test Staging

```bash
# Replace with your staging URL
curl https://circletel-stagging.vercel.app/api/mtn-wholesale/products
```

---

## 📋 Environment Variables Checklist

### Production (https://vercel.com/jdewee-livecoms-projects/circletel)

- [ ] `MTN_USERNAME` = `Lindokuhle.mdake@circletel.co.za`
- [ ] `MTN_PASSWORD` = `Lwandle@1992*`
- [ ] `MTN_SESSION` = `<base64-from-export-script>`
- [ ] `CRON_SECRET` = `<random-string-for-security>`

### Staging (https://vercel.com/jdewee-livecoms-projects/circletel-stagging)

- [ ] `MTN_USERNAME` = `Lindokuhle.mdake@circletel.co.za`
- [ ] `MTN_PASSWORD` = `Lwandle@1992*`
- [ ] `MTN_SESSION` = `<base64-from-export-script>`
- [ ] `CRON_SECRET` = `<random-string-for-security>`

### GitHub Secrets (for automated refresh)

- [ ] `MTN_USERNAME`
- [ ] `MTN_PASSWORD`
- [ ] `VERCEL_TOKEN`
- [ ] `VERCEL_PROJECT_ID`
- [ ] `VERCEL_ORG_ID`

---

## 🎯 What's Happening

1. **Local Authentication**: Playwright logs into MTN SSO, extracts cookies
2. **Session Export**: Converts cookies to base64 for Vercel env var
3. **Vercel Runtime**: Reads `MTN_SESSION`, decodes cookies, uses for API calls
4. **Auto-Refresh** (GitHub Actions): Runs every 50 minutes to keep session alive

---

## 🚨 Troubleshooting

### "No valid MTN session" in Production

**Cause**: Session expired or env var not set

**Solution**:
```bash
# Check if MTN_SESSION is set in Vercel dashboard
# If set but expired, refresh:
npx tsx scripts/test-mtn-sso-auth.ts --manual
npx tsx scripts/export-session-env.ts
# Update MTN_SESSION in Vercel
```

### APIs return 401/403

**Cause**: Invalid session cookies

**Solution**: Same as above - refresh session

### Can't authenticate locally

**Cause**: reCAPTCHA blocking

**Solution**: Use manual mode (already default in commands above)

### GitHub Actions failing

**Cause**: Missing secrets or permissions

**Solution**:
1. Check all GitHub secrets are set
2. Verify Vercel token has correct permissions
3. Check Actions logs for specific error

---

## 📚 Full Documentation

- **Detailed Deployment Guide**: `docs/deployment/VERCEL_MTN_SSO_DEPLOYMENT.md`
- **Implementation Summary**: `docs/integrations/MTN_SSO_IMPLEMENTATION_SUMMARY.md`
- **Success Report**: `docs/testing/MTN_SSO_SUCCESS_REPORT.md`

---

## 🎉 You're Done!

Your MTN SSO authentication is now deployed to Vercel with automated session refresh!

**Monitoring**:
- **GitHub Actions**: https://github.com/YOUR_ORG/circletel-nextjs/actions
- **Vercel Deployments**: https://vercel.com/jdewee-livecoms-projects/circletel
- **API Health**: https://your-domain.vercel.app/api/mtn-wholesale/refresh

---

**Quick Commands Reference**:

```bash
# Authenticate
npx tsx scripts/test-mtn-sso-auth.ts --manual

# Export
npx tsx scripts/export-session-env.ts

# Deploy Production
vercel --prod

# Deploy Staging
vercel

# Check session status
curl https://your-domain.vercel.app/api/mtn-wholesale/refresh
```
