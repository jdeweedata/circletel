# CircleTel Automated Deployment Workflows

This directory contains GitHub Actions workflows that automate the deployment pipeline from development to production.

## Workflows

### 1. `staging-deployment.yml` - Auto Deploy to Staging

**Triggers**: When a Pull Request is opened/updated targeting `main` branch

**What it does**:
- Automatically pushes PR branch to `staging` branch
- Triggers Vercel deployment to https://circletel-staging.vercel.app
- Comments on PR with staging deployment link

**Result**: Every PR gets automatically deployed to staging for testing!

---

### 2. `pr-checks.yml` - Quality Checks

**Triggers**: On every Pull Request to `main`

**What it does**:
- Runs TypeScript type checking (`npm run type-check`)
- Runs ESLint (`npm run lint`)
- Runs production build (`npm run build:ci`)
- Comments on PR with check results

**Result**: Ensures code quality before merging!

---

### 3. `auto-merge.yml` - Auto-Merge Approved PRs

**Triggers**: When PR is approved or all checks pass

**What it does**:
- Waits for PR approval
- Waits for all status checks to pass
- Automatically merges PR using squash merge
- Comments on PR with production deployment link

**Result**: Approved PRs merge automatically and deploy to production!

---

## Complete Automated Workflow

```
1. Developer creates PR
   ↓
2. GitHub Actions auto-deploys to staging
   ↓
3. Vercel deploys to circletel-staging.vercel.app
   ↓
4. Quality checks run (type check, lint, build)
   ↓
5. Developer/Reviewer approves PR
   ↓
6. GitHub Actions auto-merges PR
   ↓
7. Vercel auto-deploys to www.circletel.co.za
   ↓
8. Done! 🎉
```

---

## Setup Instructions

### Step 1: Enable GitHub Actions

1. Go to: https://github.com/jdeweedata/circletel-nextjs/settings/actions
2. Under "Actions permissions", select **"Allow all actions and reusable workflows"**
3. Click **Save**

### Step 2: Add Required Secrets

1. Go to: https://github.com/jdeweedata/circletel-nextjs/settings/secrets/actions
2. Add these secrets:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Step 3: Configure Branch Protection (Optional but Recommended)

1. Go to: https://github.com/jdeweedata/circletel-nextjs/settings/branches
2. Add branch protection rule for `main`:
   - ✅ Require pull request reviews before merging (1 approval)
   - ✅ Require status checks to pass before merging
   - Select checks: `type-check`, `lint`, `build`
   - ✅ Require conversation resolution before merging
   - ⚠️ **DO NOT** enable "Require branches to be up to date" (causes merge conflicts)

### Step 4: Test the Workflow

```bash
# Create a test PR
git checkout main
git pull origin main
git checkout -b test/automated-workflow

# Make a small change
echo "# Test automated workflow" >> TEST.md
git add TEST.md
git commit -m "test: Verify automated deployment workflow"

# Push and create PR
git push origin test/automated-workflow

# Create PR on GitHub targeting main branch
# → Watch the magic happen! 🎉
```

---

## What Happens After Setup

### When You Create a PR:

1. ✅ **Instant staging deployment** - No manual push needed!
2. ✅ **Quality checks run** - Type check, lint, build
3. ✅ **PR comment with staging link** - Click to test

### When You Approve a PR:

1. ✅ **Auto-merge** - No manual merge needed!
2. ✅ **Production deployment** - Vercel deploys automatically
3. ✅ **PR comment with production link** - Click to verify

### You Only Need To:

1. Create feature branch
2. Make changes
3. Push branch
4. Create PR
5. **Approve PR** ← Only manual step!
6. Everything else is automated! 🚀

---

## Disabling Auto-Merge (If Needed)

If you want to keep auto-staging but disable auto-merge:

1. Delete or rename `.github/workflows/auto-merge.yml`
2. Manually merge PRs via GitHub UI

---

## Troubleshooting

### Auto-deploy to staging not working?

- Check GitHub Actions tab: https://github.com/jdeweedata/circletel-nextjs/actions
- Verify GitHub Actions is enabled in repository settings
- Check workflow logs for errors

### Auto-merge not working?

- Ensure PR is approved
- Ensure all status checks pass
- Check if branch protection requires more than 1 approval
- Verify GITHUB_TOKEN has merge permissions

### Build checks failing?

- Check if Supabase secrets are added
- Verify secrets are named exactly as shown in setup
- Run `npm run build:ci` locally to reproduce errors

---

## Manual Override

You can always manually:
- Deploy to staging: `git push origin <branch>:staging`
- Merge PRs: Click "Merge pull request" button on GitHub
- Deploy to production: Merge to `main` branch

The automation is there to help, not to restrict! 💪

---

## Cost

GitHub Actions is **free** for public repositories and includes:
- 2,000 minutes/month for private repositories
- These workflows use ~5 minutes per PR

**You're well within the free tier!** ✅

---

**Questions?** Check GitHub Actions logs or ask in #tech-support!
