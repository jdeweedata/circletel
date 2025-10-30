# Vercel Deployment Guide

**Date**: October 30, 2025
**Project**: CircleTel Staging
**Vercel URL**: https://circletel-staging.vercel.app

---

## 🚀 Quick Deploy (Manual)

### **Method 1: Vercel Dashboard (Fastest)**

1. Go to: https://vercel.com/jdewee-livecoms-projects/circletel-staging
2. Click **"Deployments"** tab
3. Click **"Deploy"** button (top right)
4. Select branch: **`main`**
5. Click **"Deploy"**
6. ✅ Done! Wait 2-5 minutes for build

### **Method 2: Vercel CLI**

```bash
# From project root
vercel --prod

# Or deploy specific branch
vercel --prod --branch main

# Deploy without promoting to production
vercel
```

---

## ⚙️ Automatic Deployment Setup

### **Current Status**

✅ **Vercel's Built-in GitHub Integration is ALREADY ENABLED**

Your project is connected to GitHub repository: `jdeweedata/circletel-nextjs`

**How it works**:
- Push to `main` → Automatically deploys to production
- Push to other branches → Creates preview deployments
- Pull requests → Creates preview deployments with unique URLs

### **Why Deployments Are Currently Blocked**

❌ **GitHub Actions is blocking deployments** due to billing/spending limit:
```
The job was not started because recent account payments have failed
or your spending limit needs to be increased.
```

**The issue**: GitHub Actions (not Vercel) is preventing the workflow from running.

### **Solution: Bypass GitHub Actions**

Since Vercel has **built-in GitHub integration**, we don't need GitHub Actions for deployments. Let's disable the problematic workflow:

#### **Step 1: Disable GitHub Actions Deployment Workflow**

```bash
# Option A: Rename workflow to disable it
git mv .github/workflows/deploy.yml .github/workflows/deploy.yml.disabled
git commit -m "chore: Disable GitHub Actions deployment (use Vercel's built-in integration)"
git push

# Option B: Delete workflow completely
rm .github/workflows/deploy.yml
git commit -m "chore: Remove GitHub Actions deployment workflow"
git push
```

#### **Step 2: Verify Vercel GitHub Integration**

1. Go to: https://vercel.com/jdewee-livecoms-projects/circletel-staging/settings/git

2. **Verify**:
   - ✅ **Connected Repository**: `jdeweedata/circletel-nextjs`
   - ✅ **Production Branch**: `main`
   - ✅ **Auto Deploy**: Enabled

3. **Git Configuration** should show:
   ```
   Repository: jdeweedata/circletel-nextjs
   Branch: main (Production)

   Deployment Protection:
   - Vercel Authentication: Enabled
   - Deployment Protection: Disabled

   Deploy Hooks:
   - Automatically deploy when commits are pushed to main
   ```

---

## 🔗 Setting Up Deploy Hooks (Alternative Method)

If you want **manual control** over deployments via webhook:

### **Create Deploy Hook**

1. **Go to Vercel Settings**:
   - https://vercel.com/jdewee-livecoms-projects/circletel-staging/settings/git

2. **Scroll to "Deploy Hooks"** section

3. **Click "Create Hook"**:
   - **Name**: `GitHub Push Hook`
   - **Branch**: `main`
   - Click **"Create Hook"**

4. **Copy the webhook URL** (looks like):
   ```
   https://api.vercel.com/v1/integrations/deploy/[project-id]/[hook-id]
   ```

### **Add Webhook to GitHub**

1. **Go to GitHub Repository Settings**:
   - https://github.com/jdeweedata/circletel-nextjs/settings/hooks

2. **Click "Add webhook"**

3. **Configure**:
   - **Payload URL**: (paste Vercel deploy hook URL)
   - **Content type**: `application/json`
   - **Secret**: (leave empty)
   - **Which events**: Select "Just the push event"
   - ✅ **Active**

4. **Click "Add webhook"**

5. **Test**: Make a commit and push to `main`

---

## 📋 Deployment Configuration

### **Environment Variables**

Make sure all required environment variables are set in Vercel:

1. Go to: https://vercel.com/jdewee-livecoms-projects/circletel-staging/settings/environment-variables

2. **Required Variables**:
   ```env
   # Supabase (REQUIRED)
   NEXT_PUBLIC_SUPABASE_URL=https://agyjovdugmtopasyvlng.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<key>
   SUPABASE_SERVICE_ROLE_KEY=<key>

   # App URL
   NEXT_PUBLIC_APP_URL=https://circletel-staging.vercel.app

   # Google Maps
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<key>

   # NetCash Payment Gateway
   NETCASH_SERVICE_KEY=<key>
   NETCASH_MERCHANT_ID=<id>
   NETCASH_ACCOUNT_SERVICE_KEY=<key>

   # Zoho (Optional)
   ZOHO_CLIENT_ID=<id>
   ZOHO_CLIENT_SECRET=<secret>

   # Email (Optional)
   RESEND_API_KEY=<key>

   # Strapi CMS (Optional)
   NEXT_PUBLIC_STRAPI_URL=<url>
   STRAPI_API_TOKEN=<token>
   ```

3. **Set for**: All environments (Production, Preview, Development)

### **Build Settings**

Vercel should auto-detect Next.js settings. Verify:

1. Go to: https://vercel.com/jdewee-livecoms-projects/circletel-staging/settings

2. **Framework Preset**: Next.js

3. **Build Command**: (leave default)
   ```bash
   npm run build
   ```

4. **Output Directory**: (leave default)
   ```
   .next
   ```

5. **Install Command**: (leave default)
   ```bash
   npm install
   ```

6. **Node.js Version**: `22.x` (current)

---

## 🔍 Monitoring Deployments

### **View Deployment Status**

```bash
# List recent deployments
vercel ls circletel-staging

# View specific deployment
vercel inspect <deployment-url>

# View logs
vercel logs <deployment-url>
```

### **Vercel Dashboard**

- **Deployments**: https://vercel.com/jdewee-livecoms-projects/circletel-staging
- **Logs**: Click any deployment → View Function Logs
- **Analytics**: https://vercel.com/jdewee-livecoms-projects/circletel-staging/analytics

---

## 🚨 Troubleshooting

### **Issue: Deployment Stuck in "Queued"**

**Cause 1**: GitHub Actions is blocking the deployment due to billing issues.

**Solution**:
1. Disable GitHub Actions workflow (see above)
2. Let Vercel's built-in GitHub integration handle deployments
3. Or manually deploy from Vercel Dashboard

**Cause 2**: Concurrent build limit reached (only 1 build at a time on free/hobby plans)

**Symptoms**:
- Multiple deployments stuck in "Queued" status
- New pushes don't trigger builds
- Manual deployments also get queued

**Solutions**:

1. **Cancel Queued Deployments**:
   ```bash
   # Go to Vercel Dashboard
   # Navigate to: Deployments tab
   # Click on each queued deployment → Cancel
   ```

2. **Wait for Current Build**:
   - Check if a build is currently running
   - Wait for it to complete (usually 2-5 minutes)
   - Queue will process automatically

3. **Switch Build Region**:
   - Go to: Project Settings → General → Build & Development Settings
   - Try changing region from `iad1` (default) to `cle1` or `sin1`
   - Redeploy

4. **Check Vercel Status**:
   - Visit: https://www.vercel-status.com/
   - Check for ongoing incidents

5. **Manual Deploy from Dashboard**:
   - Go to: Deployments tab
   - Find the last successful deployment
   - Click "Redeploy" → "Use existing build cache"

6. **Contact Vercel Support**:
   - If issue persists for >30 minutes
   - Go to: https://vercel.com/help
   - Report deployment stuck in queue

### **Issue: "GitHub Actions Billing Error"**

```
The job was not started because recent account payments have failed
```

**Solutions**:
1. **Fix GitHub billing**: https://github.com/settings/billing
2. **Disable GitHub Actions**: Rename/delete `.github/workflows/deploy.yml`
3. **Use Vercel's integration**: Already built-in, no Actions needed

### **Issue: Environment Variables Not Set**

**Symptoms**: Build succeeds but app crashes at runtime

**Solution**:
1. Go to Vercel project settings → Environment Variables
2. Add all required variables from `.env.local`
3. Redeploy

### **Issue: Build Fails with "Module not found"**

**Cause**: Missing dependencies or incorrect import paths

**Solution**:
```bash
# Clear cache and rebuild
vercel --prod --force

# Or from dashboard:
# Settings → General → Clear Build Cache → Redeploy
```

### **Issue: Old Code is Deployed**

**Cause**: Vercel is deploying old commits

**Solution**:
1. Check which commit is deployed: `vercel inspect`
2. Ensure latest commit is pushed: `git log -1`
3. Force redeploy: `vercel --prod --force`

---

## 📊 Deployment Workflow

### **Current Setup (After Fixing)**

```
┌─────────────┐
│ Git Commit  │
│   & Push    │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ GitHub Repo     │
│ (main branch)   │
└──────┬──────────┘
       │
       │ (Vercel Git Integration)
       │
       ▼
┌─────────────────┐
│ Vercel Build    │
│ - npm install   │
│ - npm run build │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Deploy to Prod  │
│ circletel-      │
│ staging.        │
│ vercel.app      │
└─────────────────┘
```

### **What Happens on Push**

1. **You push to GitHub**
2. **Vercel detects push** (via GitHub App integration)
3. **Vercel clones repo** and checks out the commit
4. **Vercel runs build**:
   - `npm install` (or `yarn install`)
   - `npm run build`
   - Generates optimized production build
5. **Vercel deploys**:
   - Uploads assets to CDN
   - Configures serverless functions
   - Updates DNS/routing
6. **Deployment complete** (usually 2-5 minutes)
7. **You get notification** (if enabled in settings)

---

## 🎯 Best Practices

### **For Development**

```bash
# Test build locally before pushing
npm run build

# Preview deployment (without promoting to prod)
vercel

# Get preview URL and test
# Then promote if good: vercel --prod
```

### **For Production**

```bash
# Always run type check before committing
npm run type-check

# Ensure .env.local is NOT committed
git status | grep .env.local  # Should show nothing

# Push to main only after testing
git push origin main

# Monitor deployment
vercel ls circletel-staging
```

### **For Rollbacks**

```bash
# List deployments
vercel ls circletel-staging

# Roll back to previous deployment
vercel rollback <deployment-url>

# Or from dashboard:
# Deployments → Find old deployment → Promote to Production
```

---

## 📝 Summary

**Current Status**:
- ✅ Vercel project connected to GitHub
- ✅ Auto-deployment configured
- ❌ GitHub Actions blocking (billing issue)

**Recommendation**:
1. **Disable GitHub Actions deployment workflow**
2. **Use Vercel's built-in GitHub integration** (already working)
3. **Every push to `main` will auto-deploy**

**Manual Deploy** (if needed):
- Dashboard: https://vercel.com/jdewee-livecoms-projects/circletel-staging
- CLI: `vercel --prod`

---

## 🔗 Quick Links

- **Production URL**: https://circletel-staging.vercel.app
- **Vercel Dashboard**: https://vercel.com/jdewee-livecoms-projects/circletel-staging
- **GitHub Repo**: https://github.com/jdeweedata/circletel-nextjs
- **Deployment Settings**: https://vercel.com/jdewee-livecoms-projects/circletel-staging/settings
- **Environment Variables**: https://vercel.com/jdewee-livecoms-projects/circletel-staging/settings/environment-variables

---

**Last Updated**: October 30, 2025
**Maintained By**: Development Team
