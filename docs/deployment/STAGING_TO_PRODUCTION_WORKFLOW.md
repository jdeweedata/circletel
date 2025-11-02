# CircleTel Staging-to-Production Deployment Workflow

**Last Updated**: 2025-11-02
**Status**: ✅ Active
**Purpose**: Complete guide for deploying CircleTel from development → staging → production

---

## Table of Contents

1. [Overview](#overview)
2. [Branch Strategy](#branch-strategy)
3. [Deployment Pipeline](#deployment-pipeline)
4. [Step-by-Step Guide](#step-by-step-guide)
5. [Pre-Deployment Checklist](#pre-deployment-checklist)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Rollback Procedures](#rollback-procedures)
8. [Troubleshooting](#troubleshooting)

---

## Overview

CircleTel uses a **branch-based deployment pipeline** with three environments:

```
Development (main) → Staging (staging) → Production (master)
```

| Environment | Branch | URL | Vercel Project | Auto-Deploy |
|-------------|--------|-----|----------------|-------------|
| **Development** | `main` | Preview URLs | `circletel-preview` | ✅ Auto |
| **Staging** | `staging` | `circletel-staging.vercel.app` | `circletel-staging` | ✅ Auto |
| **Production** | `master` | `circletel.co.za` | `circletel-production` | ⚠️ Manual Approval Required |

---

## Branch Strategy

### Branch Responsibilities

**`main` (Development)**:
- Active development work
- Feature branches merge here first
- Continuous integration testing
- Deploy to preview URLs for PR reviews

**`staging` (Pre-Production Testing)**:
- Mirrors production environment
- Full integration testing
- Manual QA validation
- Database migration testing
- Last stop before production

**`master` (Production)**:
- Live customer-facing environment
- Only receives well-tested code from staging
- Requires manual approval for all deploys
- Protected by branch rules

---

## Deployment Pipeline

### Visual Pipeline Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     DEVELOPMENT PHASE                        │
└─────────────────────────────────────────────────────────────┘
                           ↓
    Feature Branch → Pull Request → Review → Merge to main
                           ↓
                   Vercel Preview Deploy
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                     STAGING PHASE                            │
└─────────────────────────────────────────────────────────────┘
                           ↓
       Create PR: main → staging
                           ↓
       Run Pre-Deploy Checks:
       - TypeScript validation ✓
       - Build test ✓
       - Lint check ✓
                           ↓
       Merge to staging branch
                           ↓
       Vercel Auto-Deploy to Staging
       (circletel-staging.vercel.app)
                           ↓
       Manual QA Testing:
       - E2E test suite ✓
       - Payment flow testing ✓
       - Coverage checker ✓
       - Database migrations ✓
       - B2B workflow ✓
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                   PRODUCTION PHASE                           │
└─────────────────────────────────────────────────────────────┘
                           ↓
       Create PR: staging → master
                           ↓
       Production Checklist Review:
       - All staging tests passed ✓
       - No breaking changes ✓
       - Database migrations ready ✓
       - Monitoring configured ✓
       - Team notified ✓
                           ↓
       Require 2+ Approvals
                           ↓
       Merge to master branch
                           ↓
       Vercel Auto-Deploy to Production
       (circletel.co.za)
                           ↓
       Post-Deploy Verification:
       - Smoke tests ✓
       - Monitor for 15 minutes ✓
       - Verify critical paths ✓
```

---

## Step-by-Step Guide

### Phase 1: Development to Staging

#### Step 1: Develop Feature in `main` Branch

```bash
# Ensure you're on main branch
git checkout main
git pull origin main

# Create feature branch (optional)
git checkout -b feature/my-new-feature

# Make changes, commit, push
git add .
git commit -m "feat: Add new feature"
git push origin feature/my-new-feature

# Create PR to main, get approval, merge
```

#### Step 2: Promote to Staging

```bash
# Ensure main is up to date
git checkout main
git pull origin main

# Create Pull Request: main → staging
# Via GitHub UI or GitHub CLI:
gh pr create --base staging --head main --title "Deploy to Staging: [Description]"
```

#### Step 3: Pre-Deployment Validation

Before merging to staging, verify:

```bash
# Run TypeScript checks
npm run type-check

# Run build test
npm run build:memory

# Run linter
npm run lint
```

All checks must pass ✅

#### Step 4: Merge and Auto-Deploy

1. **Merge PR** to `staging` branch (via GitHub)
2. **Vercel automatically deploys** to staging
3. **Monitor deployment** in Vercel dashboard
4. **Verify staging URL**: `https://circletel-staging.vercel.app`

---

### Phase 2: Staging to Production

#### Step 1: Staging Testing

Perform comprehensive testing in staging:

**Manual Testing**:
- [ ] Homepage loads correctly
- [ ] Coverage checker works
- [ ] Package selection works
- [ ] Customer login/signup works
- [ ] Admin panel accessible
- [ ] Payment flow completes (use test cards)
- [ ] B2B quote workflow works
- [ ] KYC verification works (sandbox mode)

**Automated Testing** (if configured):
```bash
# Run E2E tests against staging
npm run test:e2e:staging
```

**Database Migration Verification**:
```bash
# Check if any pending migrations
# Review supabase/migrations/ folder
# Ensure all migrations applied in staging
```

#### Step 2: Production Checklist Review

Use the production deployment checklist:

```bash
# Open checklist
code docs/deployment/PRODUCTION_DEPLOY_CHECKLIST.md
```

Key items:
- [ ] All staging tests passed
- [ ] TypeScript errors resolved
- [ ] Build succeeds
- [ ] Environment variables verified
- [ ] Database migrations tested
- [ ] No breaking API changes
- [ ] Monitoring configured
- [ ] Rollback plan ready
- [ ] Team notified

#### Step 3: Create Production PR

```bash
# Create Pull Request: staging → master
gh pr create --base master --head staging --title "Deploy to Production: [Release Version]"

# Add detailed description:
# - What's being deployed
# - What was tested
# - Any risks or concerns
# - Rollback plan
```

#### Step 4: Get Approvals

**Requirements**:
- Minimum 2 approvals from team members
- All CI checks must pass
- No unresolved comments

**Review Checklist for Approvers**:
- [ ] Changes reviewed and understood
- [ ] Testing was thorough
- [ ] No security concerns
- [ ] Database migrations safe
- [ ] Ready for customer traffic

#### Step 5: Merge and Deploy

1. **Merge PR** to `master` branch
2. **Vercel automatically deploys** to production
3. **Monitor deployment** actively
4. **DO NOT** leave immediately after merge

---

### Phase 3: Post-Deployment Monitoring

#### Immediate Verification (First 5 minutes)

```bash
# Check production URL
curl -I https://circletel.co.za

# Expected: HTTP 200 OK
```

**Manual Smoke Tests**:
- [ ] Homepage loads (https://circletel.co.za)
- [ ] Coverage checker works
- [ ] Customer login works
- [ ] Admin login works
- [ ] Payment page loads

#### Extended Monitoring (15 minutes)

**Vercel Dashboard**:
- Monitor function execution logs
- Check error rate
- Watch response times

**Key Metrics to Watch**:
- Error rate < 1%
- 95th percentile response time < 2s
- No 500 errors
- No Supabase connection errors

#### If Issues Detected

**Minor Issues** (non-critical):
- Create hotfix PR
- Fix in staging first
- Deploy to production

**Major Issues** (site down, critical bug):
- **ROLLBACK IMMEDIATELY**
- Follow rollback procedure (see below)
- Fix issue in staging
- Re-deploy when fixed

---

## Pre-Deployment Checklist

### Staging Deployment Checklist

```
Development to Staging
─────────────────────────────────────────────

Pre-Merge Checks:
[ ] All TypeScript errors resolved (npm run type-check)
[ ] Build succeeds (npm run build:memory)
[ ] Lint passes (npm run lint)
[ ] No console errors in dev mode
[ ] Feature branches merged to main

Code Review:
[ ] Pull request reviewed by 1+ team member
[ ] No security vulnerabilities introduced
[ ] No breaking changes to APIs
[ ] Database migrations are safe

Documentation:
[ ] CHANGELOG updated (if applicable)
[ ] API documentation updated (if applicable)
[ ] README updated (if applicable)

Merge:
[ ] Create PR from main to staging
[ ] Merge to staging branch
[ ] Vercel auto-deploys
[ ] Verify deployment succeeded
```

### Production Deployment Checklist

```
Staging to Production
─────────────────────────────────────────────

Pre-Production Testing:
[ ] All staging tests passed
[ ] Manual QA completed
[ ] E2E tests passed (if configured)
[ ] Payment flow tested with test cards
[ ] Coverage checker tested
[ ] Admin panel tested
[ ] Database migrations applied and tested
[ ] B2B workflow tested (if applicable)

Environment Configuration:
[ ] Production environment variables verified
[ ] NEXT_PUBLIC_APP_ENV=production
[ ] NEXT_PUBLIC_APP_URL=https://circletel.co.za
[ ] NetCash PRODUCTION credentials configured
[ ] Didit production API key configured
[ ] ICASA production credentials configured
[ ] Zoho production OAuth tokens generated
[ ] All webhook URLs configured in external services

Security & Compliance:
[ ] No secrets in code
[ ] API keys rotated (if needed)
[ ] HTTPS enforced
[ ] Security headers configured
[ ] CORS policies verified

Monitoring & Alerts:
[ ] Vercel Analytics enabled
[ ] Error tracking configured
[ ] Deployment notifications set up
[ ] Team alerted to deployment

Database:
[ ] Database backup taken
[ ] Migrations tested in staging
[ ] No destructive migrations
[ ] Rollback plan for migrations

Rollback Plan:
[ ] Previous stable deployment identified
[ ] Rollback procedure reviewed
[ ] Team knows how to rollback
[ ] Database rollback plan (if needed)

Approvals:
[ ] 2+ team member approvals
[ ] Product owner approval (if major release)
[ ] All comments resolved

Deployment:
[ ] Create PR from staging to master
[ ] Add detailed PR description
[ ] Merge to master
[ ] Monitor Vercel deployment
[ ] Verify production URL
[ ] Run smoke tests
[ ] Monitor for 15 minutes
[ ] Document deployment in changelog
```

---

## Post-Deployment Verification

### Production Smoke Tests

Run these tests immediately after production deployment:

1. **Homepage Test**
   ```bash
   curl -I https://circletel.co.za
   # Expected: HTTP 200 OK
   ```

2. **Coverage Checker**
   - Navigate to: https://circletel.co.za
   - Enter test address: "18 Rasmus Erasmus Blvd, Heritage Hill, Centurion"
   - Verify coverage results display

3. **Customer Login**
   - Navigate to: https://circletel.co.za/auth/login
   - Test login with test account
   - Verify dashboard loads

4. **Admin Login**
   - Navigate to: https://circletel.co.za/admin/login
   - Test login with admin account
   - Verify admin panel loads

5. **Payment Page**
   - Navigate to payment flow
   - Verify NetCash integration loads
   - DO NOT complete test payment in production

---

## Rollback Procedures

See detailed rollback guide: `docs/deployment/ROLLBACK_PROCEDURE.md`

### Quick Rollback (Via Vercel Dashboard)

**When to use**: Minor issues, site still functional but has bugs

1. Go to Vercel dashboard
2. Select `circletel-production` project
3. Find previous stable deployment
4. Click "Promote to Production"
5. Confirm rollback
6. Verify site is working

**Time to rollback**: <2 minutes

### Git Rollback (Via Revert Commit)

**When to use**: Need to rollback code changes permanently

1. **Identify bad commit**:
   ```bash
   git log master --oneline -5
   ```

2. **Revert the merge commit**:
   ```bash
   git checkout master
   git pull origin master
   git revert -m 1 <merge_commit_hash>
   git push origin master
   ```

3. **Vercel auto-deploys** the reverted code
4. **Verify rollback** succeeded

**Time to rollback**: <5 minutes

---

## Troubleshooting

### Deployment Failed on Vercel

**Symptom**: Build fails, deployment shows error

**Solutions**:
1. Check Vercel build logs for error details
2. Common issues:
   - TypeScript errors (run `npm run type-check` locally)
   - Missing environment variables
   - Build timeout (use `build:memory` script)
   - Dependency issues (update `package-lock.json`)

### Environment Variables Not Loading

**Symptom**: Site loads but features don't work

**Solutions**:
1. Verify variables set in Vercel dashboard
2. Check variable names (case-sensitive)
3. Public variables must start with `NEXT_PUBLIC_`
4. Redeploy after adding variables

### Database Migration Failed

**Symptom**: Site loads but data errors occur

**Solutions**:
1. Check Supabase logs for migration errors
2. Verify migrations ran in staging first
3. Rollback migration if needed
4. Re-run migration with fixes

### Site is Slow

**Symptom**: High response times, timeout errors

**Solutions**:
1. Check Vercel function logs
2. Look for slow database queries
3. Check external API timeouts (MTN, NetCash, etc.)
4. Increase function timeout if needed
5. Consider caching improvements

---

## Best Practices

1. **Always deploy to staging first**
   - No exceptions
   - Even for hotfixes

2. **Test thoroughly in staging**
   - Don't rush to production
   - Staging should mirror production exactly

3. **Deploy during low-traffic hours**
   - Preferably weekdays 9am-5pm
   - Avoid weekends and holidays
   - Have team available during deploy

4. **Monitor after deployment**
   - Stay online for 15 minutes minimum
   - Watch for errors and issues
   - Be ready to rollback

5. **Communicate with team**
   - Notify before deploying
   - Share what's being deployed
   - Report when deploy is complete

6. **Document everything**
   - Update CHANGELOG
   - Note any issues encountered
   - Document workarounds or fixes

---

## Quick Reference

### Branch Commands

```bash
# Update staging from main
git checkout main
git pull origin main
git push origin main:staging

# Update master from staging
git checkout staging
git pull origin staging
git push origin staging:master

# Check branch status
git branch -vv
```

### Vercel CLI Commands

```bash
# Manual deploy to production
vercel --prod

# List deployments
vercel ls

# Get deployment logs
vercel logs <deployment-url>

# Inspect deployment
vercel inspect <deployment-url>
```

### URLs Reference

- **Staging**: https://circletel-staging.vercel.app
- **Production**: https://circletel.co.za
- **Vercel Dashboard**: https://vercel.com/jdewee-livecoms-projects
- **GitHub Repo**: https://github.com/jdeweedata/circletel-nextjs

---

## Related Documentation

- **Environment Variables**: `docs/deployment/ENVIRONMENT_VARIABLES_GUIDE.md`
- **Rollback Procedures**: `docs/deployment/ROLLBACK_PROCEDURE.md`
- **Production Checklist**: `docs/deployment/PRODUCTION_DEPLOY_CHECKLIST.md`
- **Vercel Setup**: `docs/deployment/VERCEL_DEPLOYMENT_GUIDE.md`
- **B2B Workflow Deployment**: `docs/deployment/B2B_WORKFLOW_DEPLOYMENT_CHECKLIST.md`

---

**Maintained By**: Development Team + Claude Code
**Last Reviewed**: 2025-11-02
**Next Review**: 2025-12-02
