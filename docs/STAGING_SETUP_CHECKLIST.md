# Staging Setup Checklist

Use this checklist to set up your staging environment and CI/CD pipeline.

## ☐ 1. Vercel Setup

### Staging Project
- [ ] Create Vercel account at [vercel.com](https://vercel.com)
- [ ] Create new project named `circletel-staging`
- [ ] Import `jdeweedata/circletel` repository
- [ ] Set production branch to `staging`
- [ ] Configure build settings:
  - [ ] Build Command: `npm run build:memory`
  - [ ] Output Directory: `.next`
  - [ ] Install Command: `npm ci`
- [ ] Add environment variables (see `.env.staging.example`)
- [ ] Note down Organization ID: `_______________`
- [ ] Note down Staging Project ID: `_______________`

### Production Project
- [ ] Create new project named `circletel-nextjs`
- [ ] Import `jdeweedata/circletel` repository
- [ ] Set production branch to `master`
- [ ] Configure build settings (same as staging)
- [ ] Add environment variables (see `.env.production.example`)
- [ ] Note down Production Project ID: `_______________`

## ☐ 2. Vercel API Token

- [ ] Go to [Vercel Account Tokens](https://vercel.com/account/tokens)
- [ ] Create token named `GitHub Actions CircleTel`
- [ ] Copy token (save securely): `_______________`

## ☐ 3. GitHub Repository

### Secrets
- [ ] Go to `https://github.com/jdeweedata/circletel/settings/secrets/actions`
- [ ] Add secret: `VERCEL_TOKEN`
- [ ] Add secret: `VERCEL_ORG_ID`
- [ ] Add secret: `VERCEL_PROJECT_ID_STAGING`
- [ ] Add secret: `VERCEL_PROJECT_ID_PRODUCTION`
- [ ] Add secret: `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Add secret: `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Environments
- [ ] Go to `https://github.com/jdeweedata/circletel/settings/environments`
- [ ] Create environment: `staging`
- [ ] Create environment: `production`
- [ ] Add required reviewers to `production` (recommended)

## ☐ 4. Git Branches

- [ ] Create `staging` branch:
  ```bash
  git checkout master
  git pull origin master
  git checkout -b staging
  git push -u origin staging
  ```

## ☐ 5. GitHub Actions Workflows

- [ ] Verify `.github/workflows/staging-deploy.yml` exists
- [ ] Verify `.github/workflows/production-deploy.yml` exists
- [ ] Commit and push workflows:
  ```bash
  git add .github/workflows/
  git commit -m "Add CI/CD workflows for staging and production"
  git push origin staging
  ```

## ☐ 6. Environment Variables

### Staging Environment
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- [ ] `NEXT_PUBLIC_SITE_URL` = `https://circletel-staging.vercel.app`
- [ ] `RESEND_API_KEY` (optional)
- [ ] `NETCASH_SERVICE_KEY` (optional, use sandbox)
- [ ] `NEXT_PUBLIC_STRAPI_URL` (optional)

### Production Environment
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- [ ] `NEXT_PUBLIC_SITE_URL` = `https://www.circletel.co.za`
- [ ] `RESEND_API_KEY`
- [ ] `NETCASH_SERVICE_KEY` (production keys)
- [ ] `NEXT_PUBLIC_STRAPI_URL` (if using Strapi)

## ☐ 7. First Staging Deployment

- [ ] Make a test commit to `staging` branch:
  ```bash
  git checkout staging
  echo "# Staging Test" >> README_STAGING.md
  git add README_STAGING.md
  git commit -m "Test staging deployment"
  git push origin staging
  ```
- [ ] Check GitHub Actions: `https://github.com/jdeweedata/circletel/actions`
- [ ] Verify workflow runs successfully
- [ ] Check Vercel deployment completes
- [ ] Visit staging URL: `https://circletel-staging.vercel.app`
- [ ] Test key functionality:
  - [ ] Homepage loads
  - [ ] Coverage checker works
  - [ ] Admin panel accessible
  - [ ] VoIP page displays
  - [ ] Pricing pages work

## ☐ 8. First Production Deployment (After Staging Validation)

- [ ] Merge `staging` to `master`:
  ```bash
  git checkout master
  git merge staging
  git push origin master
  ```
- [ ] Approve deployment (if reviewers configured)
- [ ] Check GitHub Actions workflow
- [ ] Verify production deployment
- [ ] Visit production URL
- [ ] Test production functionality

## ☐ 9. Custom Domains (Optional)

### Staging Domain
- [ ] Add `staging.circletel.co.za` in Vercel staging project
- [ ] Configure DNS records
- [ ] Verify SSL certificate

### Production Domain
- [ ] Add `www.circletel.co.za` in Vercel production project
- [ ] Add `circletel.co.za` in Vercel production project
- [ ] Configure DNS records
- [ ] Verify SSL certificates

## ☐ 10. Monitoring and Alerts

- [ ] Set up Vercel deployment notifications
- [ ] Configure GitHub Actions notifications
- [ ] Set up error tracking (e.g., Sentry)
- [ ] Set up uptime monitoring

## ☐ 11. Documentation

- [ ] Update team on new deployment process
- [ ] Document any custom configurations
- [ ] Create runbook for common issues
- [ ] Schedule training session (if needed)

## ☐ 12. Security

- [ ] Enable Vercel Password Protection for staging (optional)
- [ ] Review and rotate secrets quarterly
- [ ] Set up IP allowlist for admin routes (optional)
- [ ] Enable 2FA on Vercel account
- [ ] Enable 2FA on GitHub account

## Testing Checklist

After deployment to staging, test:

- [ ] Homepage loads without errors
- [ ] Navigation works
- [ ] Coverage checker accepts address input
- [ ] Coverage map displays
- [ ] Admin login works (mock auth currently)
- [ ] Admin sidebar navigation works
- [ ] Product packages display correctly
- [ ] VoIP page shows pricing
- [ ] Devices page loads
- [ ] Fibre packages display
- [ ] Footer links work
- [ ] Mobile responsive design works
- [ ] Forms submit correctly
- [ ] API endpoints respond
- [ ] Service worker installs (production only)

## Troubleshooting

If deployment fails:

1. Check GitHub Actions logs
2. Check Vercel deployment logs
3. Verify environment variables are set
4. Verify project IDs are correct
5. Check `npm run type-check` locally
6. Check `npm run lint` locally
7. Try building locally: `npm run build:memory`

## Support Resources

- [Deployment Guide](./DEPLOYMENT.md)
- [Vercel Documentation](https://vercel.com/docs)
- [GitHub Actions Documentation](https://docs.github.com/actions)
- [Project Documentation](../CLAUDE.md)

---

**Date Completed:** _______________

**Completed By:** _______________

**Staging URL:** _______________

**Production URL:** _______________