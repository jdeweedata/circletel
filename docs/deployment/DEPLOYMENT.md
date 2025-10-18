# Deployment Guide

This guide explains how to deploy the CircleTel Next.js application to staging and production environments using Vercel and GitHub Actions CI/CD.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Staging Environment Setup](#staging-environment-setup)
4. [Production Environment Setup](#production-environment-setup)
5. [GitHub Actions Configuration](#github-actions-configuration)
6. [Environment Variables](#environment-variables)
7. [Deployment Workflow](#deployment-workflow)
8. [Troubleshooting](#troubleshooting)

## Overview

The deployment strategy uses:
- **Staging Environment**: Deploys from `staging` branch for testing
- **Production Environment**: Deploys from `master` branch for live site
- **CI/CD**: GitHub Actions for automated testing and deployment
- **Hosting**: Vercel for both environments

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Two Vercel Projects**:
   - One for staging: `circletel-staging`
   - One for production: `circletel-nextjs` (or desired name)
3. **GitHub Repository**: `jdeweedata/circletel`
4. **Vercel CLI**: Install with `npm install -g vercel`

## Staging Environment Setup

### Step 1: Create Vercel Staging Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import `jdeweedata/circletel` repository
4. Configure:
   - **Project Name**: `circletel-staging`
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build:memory`
   - **Output Directory**: `.next`
   - **Install Command**: `npm ci`
5. **Important**: Set the production branch to `staging` (not `main`)
6. Add environment variables (see [Environment Variables](#environment-variables))
7. Click "Deploy"

### Step 2: Create `staging` Branch

```bash
# Create staging branch from current master
git checkout master
git pull origin master
git checkout -b staging
git push -u origin staging
```

### Step 3: Get Vercel Project IDs

```bash
# Link to staging project
cd /path/to/circletel-nextjs
vercel link --project=circletel-staging

# View project details
vercel project ls
```

Note the:
- **Organization ID** (ORG_ID)
- **Staging Project ID** (PROJECT_ID)

## Production Environment Setup

### Step 1: Create Vercel Production Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import `jdeweedata/circletel` repository (again)
4. Configure:
   - **Project Name**: `circletel-nextjs` (or `circletel-production`)
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build:memory`
   - **Output Directory**: `.next`
   - **Install Command**: `npm ci`
5. **Important**: Set the production branch to `master`
6. Add environment variables (see [Environment Variables](#environment-variables))
7. Click "Deploy"

### Step 2: Get Production Project ID

```bash
# Link to production project
vercel link --project=circletel-nextjs

# View project details
vercel project ls
```

Note the **Production Project ID**.

## GitHub Actions Configuration

### Step 1: Create Vercel Token

1. Go to [Vercel Account Tokens](https://vercel.com/account/tokens)
2. Click "Create Token"
3. Name it: `GitHub Actions CircleTel`
4. Copy the token (you won't see it again)

### Step 2: Add GitHub Secrets

1. Go to GitHub repository: `https://github.com/jdeweedata/circletel/settings/secrets/actions`
2. Click "New repository secret" for each:

| Secret Name | Value | Description |
|------------|-------|-------------|
| `VERCEL_TOKEN` | `your_vercel_token` | Token from Step 1 |
| `VERCEL_ORG_ID` | `team_xxx` | Organization ID from Vercel |
| `VERCEL_PROJECT_ID_STAGING` | `prj_xxx` | Staging project ID |
| `VERCEL_PROJECT_ID_PRODUCTION` | `prj_xxx` | Production project ID |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJxxx` | Supabase anon key |

### Step 3: Configure GitHub Environments

1. Go to `https://github.com/jdeweedata/circletel/settings/environments`
2. Create two environments:

**Staging Environment:**
- Name: `staging`
- Protection rules: None (or optional reviewers)
- Environment secrets: Add staging-specific secrets

**Production Environment:**
- Name: `production`
- Protection rules: **Required reviewers** (recommended)
- Add yourself as reviewer
- Environment secrets: Add production-specific secrets

## Environment Variables

### Staging Variables (Vercel Staging Project)

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://agyjovdugmtopasyvlng.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_staging_anon_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_staging_google_maps_key
NEXT_PUBLIC_SITE_URL=https://circletel-staging.vercel.app

# Optional
NEXT_PUBLIC_STRAPI_URL=https://staging-cms.circletel.co.za
STRAPI_API_TOKEN=your_staging_strapi_token
RESEND_API_KEY=your_staging_resend_key
NETCASH_SERVICE_KEY=your_staging_netcash_key
NETCASH_MERCHANT_ID=your_staging_merchant_id
```

### Production Variables (Vercel Production Project)

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://agyjovdugmtopasyvlng.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_production_google_maps_key
NEXT_PUBLIC_SITE_URL=https://www.circletel.co.za

# Optional
NEXT_PUBLIC_STRAPI_URL=https://cms.circletel.co.za
STRAPI_API_TOKEN=your_production_strapi_token
RESEND_API_KEY=your_production_resend_key
NETCASH_SERVICE_KEY=your_production_netcash_key
NETCASH_MERCHANT_ID=your_production_merchant_id
```

## Deployment Workflow

### Staging Deployment

**Automated (CI/CD):**

```bash
# Make changes on a feature branch
git checkout -b feature/my-new-feature
# ... make changes ...
git add .
git commit -m "Add new feature"
git push origin feature/my-new-feature

# Create pull request to staging branch
# GitHub Actions will automatically:
# 1. Run type checking
# 2. Run linting
# 3. Build the application
# 4. Deploy to Vercel staging
# 5. Comment PR with deployment URL

# Merge PR to staging branch
# This triggers another deployment
```

**Manual:**

```bash
# Push directly to staging
git checkout staging
git merge feature/my-new-feature
git push origin staging
```

### Production Deployment

**Automated (CI/CD):**

```bash
# After testing on staging, merge to master
git checkout master
git merge staging
git push origin master

# GitHub Actions will automatically:
# 1. Run type checking
# 2. Run linting
# 3. Build the application
# 4. Deploy to Vercel production (with approval if configured)
# 5. Create a GitHub release
```

**Manual:**

```bash
# Deploy manually using Vercel CLI
vercel --prod
```

## CI/CD Pipeline Details

### Staging Pipeline (`.github/workflows/staging-deploy.yml`)

**Trigger:** Push or PR to `staging` branch

**Steps:**
1. **Type Check** - Validates TypeScript types
2. **Lint** - Runs ESLint
3. **Build** - Builds Next.js application
4. **Deploy** - Deploys to Vercel staging (preview environment)
5. **PR Comment** - Adds deployment URL to PR (if applicable)

### Production Pipeline (`.github/workflows/production-deploy.yml`)

**Trigger:** Push to `master` branch or manual dispatch

**Steps:**
1. **Type Check** - Validates TypeScript types
2. **Lint** - Runs ESLint
3. **Build** - Builds Next.js application
4. **Deploy** - Deploys to Vercel production
5. **Release** - Creates GitHub release with deployment details

## Branch Strategy

```
master (production)
  ↑
  └── staging (staging environment)
        ↑
        ├── feature/netcash-webhook-endpoints
        ├── feature/afrihost-pages
        └── feature/your-feature
```

**Workflow:**
1. Create feature branch from `staging`
2. Develop and test locally
3. Push feature branch and create PR to `staging`
4. CI/CD deploys to staging environment
5. Test on staging URL
6. Merge to `staging`
7. After validation, merge `staging` to `master`
8. CI/CD deploys to production

## Vercel Configuration

### `vercel.json` (Optional)

Create this file for custom Vercel configuration:

```json
{
  "version": 2,
  "framework": "nextjs",
  "buildCommand": "npm run build:memory",
  "installCommand": "npm ci",
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Credentials", "value": "true" },
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET,POST,PUT,DELETE,OPTIONS" }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/admin/:path*",
      "destination": "/admin/:path*"
    }
  ]
}
```

## Troubleshooting

### Build Fails with Memory Error

**Error:** "JavaScript heap out of memory"

**Solution:** The workflow already uses `npm run build:memory` which increases Node memory. If still failing:

```yaml
# In GitHub Actions workflow
- name: Build application
  run: NODE_OPTIONS="--max-old-space-size=8192" npm run build
```

### Vercel Deployment Fails

**Check:**
1. Verify `VERCEL_TOKEN` is valid
2. Verify project IDs are correct
3. Check Vercel project settings match branch
4. Review Vercel deployment logs

### Environment Variables Not Working

**Check:**
1. Variables added to Vercel project (not just GitHub)
2. Variables prefixed with `NEXT_PUBLIC_` for client-side use
3. Redeploy after adding variables

### Type Check Fails

**Error:** TypeScript errors in CI/CD

**Solution:**
```bash
# Fix locally first
npm run type-check

# Fix errors, then commit
git add .
git commit -m "Fix type errors"
git push
```

### Lint Fails

**Error:** ESLint errors in CI/CD

**Solution:**
```bash
# Fix locally first
npm run lint

# Auto-fix if possible
npm run lint -- --fix

# Commit fixes
git add .
git commit -m "Fix lint errors"
git push
```

## Monitoring and Logs

### Vercel Logs

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Click "Deployments"
4. Click on a deployment
5. View "Functions" and "Build Logs"

### GitHub Actions Logs

1. Go to `https://github.com/jdeweedata/circletel/actions`
2. Click on a workflow run
3. Expand job steps to view logs

## Rollback Strategy

### Rollback Staging

```bash
# Revert commit on staging
git checkout staging
git revert <commit-hash>
git push origin staging
```

### Rollback Production

**Option 1: Revert in Vercel Dashboard**
1. Go to project → Deployments
2. Find previous good deployment
3. Click "..." → "Promote to Production"

**Option 2: Git Revert**
```bash
git checkout master
git revert <commit-hash>
git push origin master
```

## Custom Domain Setup

### Staging Domain

1. Go to Vercel staging project
2. Settings → Domains
3. Add: `staging.circletel.co.za`
4. Add DNS records as instructed

### Production Domain

1. Go to Vercel production project
2. Settings → Domains
3. Add: `www.circletel.co.za` and `circletel.co.za`
4. Add DNS records as instructed

## Security Best Practices

1. **Never commit** `.env`, `.env.local`, or `.env.production` files
2. **Rotate secrets** periodically (Vercel tokens, API keys)
3. **Use environment-specific** API keys (different for staging/production)
4. **Enable Vercel Protection** for staging URLs (password protect)
5. **Review PR deployments** before merging

## Next Steps

After setting up deployments:

1. ✅ Test staging deployment with a dummy commit
2. ✅ Verify environment variables are working
3. ✅ Test production deployment (after staging validation)
4. ✅ Set up custom domains
5. ✅ Configure monitoring and alerts
6. ✅ Document any project-specific deployment notes

## Support

For issues:
- Check [Vercel Documentation](https://vercel.com/docs)
- Check [GitHub Actions Documentation](https://docs.github.com/actions)
- Review project-specific [CLAUDE.md](../CLAUDE.md)