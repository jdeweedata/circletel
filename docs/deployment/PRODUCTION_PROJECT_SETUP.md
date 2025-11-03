# CircleTel Production Project Setup Guide

**Last Updated**: 2025-11-03
**Purpose**: Configure existing Vercel production project for simplified deployment workflow

---

## Existing Production Setup

**Vercel Project**: `circletel`
**Project ID**: `prj_5ayAVGSieKH0XHTa5gqS3jujEPtp`
**Current URL**: https://circletel.vercel.app

**Configured Domains**:
- ✅ `circletel.co.za` → Redirects to www (307)
- ✅ `www.circletel.co.za` → Production (primary)
- ✅ `circletel.vercel.app` → Production (Vercel default)

⚠️ **DNS Change Recommended** warnings on custom domains

---

## Deployment Workflow (Simplified)

### Branch Strategy

CircleTel uses a **2-branch workflow** - NO configuration changes needed:

```
Feature Branches → Staging (testing) → Main (production via PR)
```

**Benefits**:
- ✅ No Vercel configuration changes required
- ✅ Industry standard workflow
- ✅ Pull Requests provide approval gate
- ✅ Simpler git operations
- ✅ Easy rollbacks

### How It Works

**Current Setup** (already configured):
- `main` branch → Production (circletel.vercel.app, www.circletel.co.za)
- `staging` branch → Staging project (circletel-staging.vercel.app)

**No changes needed** - this is the optimal configuration!

---

## Quick Setup Checklist

### 1. Verify Production Branch (2 minutes)

**Current State**: Project deploys from `main` branch ✅
**Target State**: Keep deploying from `main` branch ✅

**No action required** - main branch is the modern standard for production deployments.

**Why**: This is the industry-standard approach used by most development teams

---

### 2. Verify Environment Variables (10 minutes)

Check that production environment variables are set:

1. Go to https://vercel.com/jdewee-livecoms-projects/circletel/settings/environment-variables

2. **Required Production Variables**:
   ```
   NEXT_PUBLIC_APP_ENV=production
   NEXT_PUBLIC_APP_URL=https://www.circletel.co.za

   # Or if using apex domain:
   NEXT_PUBLIC_APP_URL=https://circletel.co.za
   ```

3. **Verify All Environment Variables** (see `ENVIRONMENT_VARIABLES_GUIDE.md`):
   - [ ] Supabase credentials
   - [ ] NetCash PRODUCTION keys
   - [ ] Google Maps API key
   - [ ] Didit production API key
   - [ ] ICASA production credentials
   - [ ] Zoho production OAuth tokens
   - [ ] Email service credentials

4. **If any missing**, add them and redeploy

---

### 3. Fix DNS Configuration (15 minutes)

**Current Issue**: "DNS Change Recommended" warnings

This means DNS records need to be updated to point to Vercel.

#### Option A: Check Current DNS Records

```bash
# Check what circletel.co.za currently points to
nslookup circletel.co.za

# Check www subdomain
nslookup www.circletel.co.za
```

#### Option B: Update DNS Records

If DNS is not pointing to Vercel, update your DNS provider with:

**For apex domain (circletel.co.za)**:
```
Type: A
Name: @
Values:
  76.76.21.21
  76.76.21.142
  76.76.21.164
  76.76.21.241
TTL: 3600
```

**For www subdomain (www.circletel.co.za)**:
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

**Then in Vercel**:
1. Go to domains settings
2. Click "Refresh" next to each domain
3. Wait for DNS propagation (can take up to 48 hours, usually <1 hour)

---

### 4. Staging Project Configuration (10 minutes)

**Verify staging project**: `circletel-staging`

1. Go to https://vercel.com/jdewee-livecoms-projects/circletel-staging/settings
2. Verify:
   - Production branch: `staging`
   - Auto-deploy: Enabled
   - Environment: Preview/Development
3. Check environment variables:
   ```
   NEXT_PUBLIC_APP_ENV=staging
   NEXT_PUBLIC_APP_URL=https://circletel-staging.vercel.app
   ```

---

### 5. Test the Pipeline (30 minutes)

**Test deployment flow end-to-end**:

#### Step 1: Deploy to Staging

```bash
# Make sure you're on main
git checkout main
git pull origin main

# Create test commit
echo "# Test deployment pipeline" >> test-deploy.md
git add test-deploy.md
git commit -m "test: Verify staging deployment pipeline"

# Push to staging branch
git push origin main:staging
```

**Verify**:
1. Go to https://vercel.com/jdewee-livecoms-projects/circletel-staging/deployments
2. Should see new deployment in progress
3. Wait for deployment to complete
4. Visit https://circletel-staging.vercel.app
5. Verify test file exists

#### Step 2: Deploy to Production

```bash
# Push staging to master
git checkout staging
git pull origin staging
git push origin staging:master
```

**Verify**:
1. Go to https://vercel.com/jdewee-livecoms-projects/circletel/deployments
2. Should see new deployment from `master` branch
3. Wait for deployment to complete
4. Visit https://www.circletel.co.za (or circletel.co.za)
5. Verify test file exists

#### Step 3: Cleanup

```bash
# Remove test file
git checkout main
git rm test-deploy.md
git commit -m "test: Remove deployment test file"
git push origin main:staging
git push origin staging:master
```

---

## Pipeline Configuration Summary

Your simplified pipeline works like this:

```
┌────────────────────────────────────────────────────────┐
│ DEVELOPMENT                                             │
│ Branch: feature/my-feature                              │
│ Vercel: Preview URLs (automatic)                        │
└────────────────────────────────────────────────────────┘
                        ↓
        git push origin feature/my-feature:staging
                        ↓
┌────────────────────────────────────────────────────────┐
│ STAGING                                                 │
│ Branch: staging                                         │
│ Vercel Project: circletel-staging                      │
│ URL: https://circletel-staging.vercel.app              │
│ Auto-deploy: ✅ Yes                                     │
│ Purpose: Testing & QA before production                │
└────────────────────────────────────────────────────────┘
                        ↓
    Create Pull Request: feature → main
    Get approvals → Merge PR
                        ↓
┌────────────────────────────────────────────────────────┐
│ PRODUCTION                                              │
│ Branch: main                                            │
│ Vercel Project: circletel                              │
│ Project ID: prj_5ayAVGSieKH0XHTa5gqS3jujEPtp           │
│ URLs:                                                   │
│   - https://www.circletel.co.za (primary)              │
│   - https://circletel.co.za (redirects to www)         │
│   - https://circletel.vercel.app (Vercel default)      │
│ Auto-deploy: ✅ Yes (from main branch via PR merge)     │
└────────────────────────────────────────────────────────┘
```

---

## Branch Protection Setup

### For main branch (on GitHub) - PRODUCTION

1. Go to https://github.com/jdeweedata/circletel-nextjs/settings/branches
2. Add branch protection rule for `main`:
   - Branch name pattern: `main`
   - ✅ Require pull request reviews before merging
   - Number of approvals: 1-2 (recommended: 2 for production)
   - ✅ Require status checks to pass before merging
   - ✅ Require linear history
   - ✅ Restrict who can push to matching branches (admins only)
   - ✅ Require conversation resolution before merging

### For staging branch (on GitHub) - OPTIONAL

1. Add branch protection rule for `staging` (optional):
   - Branch name pattern: `staging`
   - ✅ Allow force pushes (for quick testing iterations)
   - No approval required (staging is for testing)

---

## Deployment Workflow

### Step 1: Create Feature Branch

```bash
git checkout main
git pull origin main
git checkout -b feature/my-new-feature

# Make changes, commit
git add .
git commit -m "feat: Add new feature"
```

### Step 2: Deploy to Staging for Testing

```bash
# Push feature branch to staging branch
git push origin feature/my-new-feature:staging

# → Auto-deploys to https://circletel-staging.vercel.app
# → Test thoroughly
```

### Step 3: Deploy to Production

```bash
# Push feature branch to remote
git push origin feature/my-new-feature

# Then on GitHub:
# 1. Create Pull Request: feature/my-new-feature → main
# 2. Get required approvals (1-2 reviewers)
# 3. Run pre-deployment checklist
# 4. Merge PR
# → Auto-deploys to production
# 5. Monitor for 15 minutes
```

### Quick Commands Reference

```bash
# Deploy to staging
git push origin <branch>:staging

# Create PR to production (via GitHub UI)
# feature branch → main
```

---

## Verification Commands

### Check current branch deployments

```bash
# Check what branch each project deploys from
# (Requires Vercel CLI: npm i -g vercel)

vercel project ls

# Or check via GitHub
git branch -r
```

### Verify DNS configuration

```bash
# Check apex domain
nslookup circletel.co.za

# Check www subdomain
nslookup www.circletel.co.za

# Check from external DNS
nslookup circletel.co.za 8.8.8.8
```

### Test HTTPS

```bash
# Test apex domain
curl -I https://circletel.co.za

# Test www domain
curl -I https://www.circletel.co.za

# Verify redirect works
curl -I https://circletel.co.za
# Should show: Location: https://www.circletel.co.za
```

---

## Environment Variables Quick Check

### Production Project

**Must have**:
```
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_APP_URL=https://www.circletel.co.za
NEXT_PUBLIC_DIDIT_ENVIRONMENT=production
NEXT_PUBLIC_ICASA_ENVIRONMENT=production

# All other vars from ENVIRONMENT_VARIABLES_GUIDE.md
```

### Staging Project

**Must have**:
```
NEXT_PUBLIC_APP_ENV=staging
NEXT_PUBLIC_APP_URL=https://circletel-staging.vercel.app
NEXT_PUBLIC_DIDIT_ENVIRONMENT=sandbox
NEXT_PUBLIC_ICASA_ENVIRONMENT=test

# All other vars from ENVIRONMENT_VARIABLES_GUIDE.md
```

---

## Troubleshooting

### Issue: Production deploys from wrong branch

**Fix**:
1. Go to Vercel project settings → Git
2. Change "Production Branch" to `master`
3. Redeploy

### Issue: DNS Change Recommended warning

**Fix**:
1. Update DNS records at your DNS provider
2. Wait for DNS propagation (up to 48 hours)
3. Click "Refresh" in Vercel domains settings

### Issue: Both projects deploy the same code

**Fix**:
1. Ensure staging project uses `staging` branch
2. Ensure production project uses `master` branch
3. Verify branches are different:
   ```bash
   git diff staging master
   ```

### Issue: Environment variables not loading

**Fix**:
1. Verify variables are set in correct project
2. Redeploy after adding variables
3. Check variable names (case-sensitive)
4. Public vars must start with `NEXT_PUBLIC_`

---

## Post-Setup Checklist

After completing setup, verify:

- [x] Production project deploys from `main` branch
- [x] Staging project deploys from `staging` branch
- [x] All environment variables configured per environment
- [x] DNS records point to Vercel (no warnings)
- [x] HTTPS works on all domains
- [x] www redirects to apex (or vice versa)
- [x] Vercel "Ignored Build Step" configured to "Only build production"
- [x] GitHub Actions workflows deployed (staging, pr-checks, auto-merge)
- [ ] GitHub Actions enabled in repository settings
- [ ] Supabase secrets added to GitHub repository
- [ ] Branch protection rules set on GitHub
- [ ] Test automated deployment workflow with PR
- [ ] Team trained on deployment workflow
- [ ] Rollback procedure tested

---

## Next Steps

1. **Complete this setup** (follow checklist above)
2. **Read deployment workflow**: `STAGING_TO_PRODUCTION_WORKFLOW.md`
3. **Review environment variables**: `ENVIRONMENT_VARIABLES_GUIDE.md`
4. **Test rollback procedure**: `ROLLBACK_PROCEDURE.md`
5. **Plan first real deployment** using new pipeline

---

## Quick Reference

**Vercel Projects**:
- Staging: https://vercel.com/jdewee-livecoms-projects/circletel-staging
- Production: https://vercel.com/jdewee-livecoms-projects/circletel

**Production Domains**:
- Primary: https://www.circletel.co.za
- Apex: https://circletel.co.za (redirects)
- Vercel: https://circletel.vercel.app

**Git Branches**:
- Feature branches: `feature/*` (development)
- Staging: `staging` (testing)
- Production: `main` (via Pull Request)

**Documentation**:
- Full workflow: `STAGING_TO_PRODUCTION_WORKFLOW.md`
- Environment vars: `ENVIRONMENT_VARIABLES_GUIDE.md`
- Rollback guide: `ROLLBACK_PROCEDURE.md`
- Domain setup: `CUSTOM_DOMAIN_SETUP.md`

---

**Last Updated**: 2025-11-03
**Project ID**: prj_5ayAVGSieKH0XHTa5gqS3jujEPtp
**Workflow**: Simplified 2-branch (feature → staging → main via PR)
