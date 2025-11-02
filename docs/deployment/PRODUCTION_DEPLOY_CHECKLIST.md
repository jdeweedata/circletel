# Production Deployment Checklist

**Purpose**: Quick reference checklist for deploying to production
**Use**: Print or keep open during production deployments

---

## Pre-Deployment (Do in Staging)

### Code Quality
- [ ] TypeScript errors resolved: `npm run type-check`
- [ ] Build succeeds: `npm run build:memory`
- [ ] Lint passes: `npm run lint`
- [ ] No console errors in browser
- [ ] All feature branches merged to `main`

### Testing
- [ ] Manual QA completed in staging
- [ ] E2E tests passed (if configured)
- [ ] Payment flow tested (test cards only)
- [ ] Coverage checker tested
- [ ] Customer login/signup tested
- [ ] Admin panel tested
- [ ] B2B workflow tested (if applicable)

### Database
- [ ] Database backup taken
- [ ] All migrations applied in staging
- [ ] Migrations tested successfully
- [ ] No destructive migrations (DROP, DELETE)
- [ ] Rollback plan for migrations documented

### Environment Configuration
- [ ] `NEXT_PUBLIC_APP_ENV=production` set
- [ ] `NEXT_PUBLIC_APP_URL=https://circletel.co.za` set
- [ ] NetCash PRODUCTION credentials configured
- [ ] Didit production API key configured
- [ ] ICASA production credentials configured
- [ ] Zoho production OAuth tokens generated
- [ ] All webhook URLs updated in external services

### Security
- [ ] No secrets committed to code
- [ ] API keys rotated (if needed)
- [ ] HTTPS enforced on all endpoints
- [ ] Security headers configured
- [ ] CORS policies verified
- [ ] RLS policies enabled on Supabase

### Monitoring & Alerts
- [ ] Vercel Analytics enabled
- [ ] Error tracking configured (if applicable)
- [ ] Deployment notifications set up
- [ ] Team alerted to deployment window
- [ ] Monitoring dashboard open and ready

### Documentation
- [ ] CHANGELOG updated
- [ ] API documentation updated (if API changes)
- [ ] Deployment notes prepared
- [ ] Rollback procedure reviewed

---

## Deployment Process

### 1. Create Production PR
- [ ] Create PR from `staging` to `master`
- [ ] Add detailed PR description:
  - What's being deployed
  - What was tested
  - Any risks or concerns
  - Rollback plan

### 2. Get Approvals
- [ ] Minimum 2 team member approvals
- [ ] All CI checks passed
- [ ] All comments resolved
- [ ] Product owner approval (if major release)

### 3. Final Pre-Merge Check
- [ ] Re-verify staging still works
- [ ] Check for any emergency fixes in progress
- [ ] Confirm team is ready
- [ ] Confirm time window is appropriate

### 4. Merge to Master
- [ ] Merge PR to `master` branch
- [ ] Monitor Vercel deployment dashboard
- [ ] DO NOT leave immediately after merge

---

## Post-Deployment (First 5 Minutes)

### Immediate Smoke Tests
- [ ] Homepage loads: https://circletel.co.za
- [ ] Check HTTP status: `curl -I https://circletel.co.za`
- [ ] Coverage checker works
- [ ] Customer login works
- [ ] Admin login works
- [ ] Payment page loads (DO NOT test payment)

### Vercel Dashboard Checks
- [ ] Deployment status: Success
- [ ] No build errors
- [ ] Functions deployed correctly
- [ ] No immediate errors in logs

---

## Extended Monitoring (15 Minutes)

### Monitor Metrics
- [ ] Error rate < 1%
- [ ] Response times normal (< 2s)
- [ ] No 500 errors
- [ ] No Supabase connection errors
- [ ] API calls succeeding

### Watch For
- [ ] Unusual error patterns
- [ ] Performance degradation
- [ ] User reports (Slack, email)
- [ ] Payment failures

---

## If Issues Detected

### Minor Issues (Site functional)
- [ ] Create GitHub issue
- [ ] Plan hotfix for next day
- [ ] Continue monitoring

### Major Issues (Site broken/critical bug)
- [ ] **INITIATE ROLLBACK IMMEDIATELY**
- [ ] Follow rollback procedure
- [ ] Notify team
- [ ] Investigate issue
- [ ] Fix in staging
- [ ] Re-deploy when ready

---

## Post-Deployment Tasks

### Within 1 Hour
- [ ] Confirm no critical errors
- [ ] Verify all smoke tests still passing
- [ ] Check customer-facing features work
- [ ] Update team: "Deployment stable"

### Within 24 Hours
- [ ] Review error logs
- [ ] Check for any new bugs reported
- [ ] Monitor key metrics trends
- [ ] Document any issues encountered

### Within 1 Week
- [ ] Review deployment retrospective
- [ ] Update deployment procedures if needed
- [ ] Plan next release

---

## Rollback Decision Matrix

| Issue Severity | Action | Timeline |
|----------------|--------|----------|
| **Critical** (Site down, data loss, security breach) | Rollback immediately | <2 minutes |
| **High** (Key features broken, payment not working) | Rollback if no quick fix | <5 minutes |
| **Medium** (Non-critical bugs, UI issues) | Fix forward or rollback | <15 minutes |
| **Low** (Minor bugs, cosmetic issues) | Fix forward | Next deploy |

---

## Emergency Contacts

**During Deployment Window:**
- Keep Slack open
- Phone available
- Vercel dashboard open
- GitHub notifications on

**If Escalation Needed:**
- Tag @team in Slack
- Escalate to technical lead
- Follow incident response plan

---

## Quick Rollback Steps

1. Go to Vercel dashboard
2. Select `circletel-production` project
3. Find previous stable deployment
4. Click "Promote to Production"
5. Verify site is working

**OR via Git:**
```bash
git revert -m 1 <merge_commit_hash>
git push origin master
```

---

## Success Criteria

✅ Deployment is successful when:
- [ ] All smoke tests pass
- [ ] Error rate normal
- [ ] Response times normal
- [ ] No critical issues for 15 minutes
- [ ] Team confirms stability

---

## Notes Section

Use this space to document:
- Deployment time:
- Who deployed:
- What was deployed:
- Any issues:
- Resolutions:

---

**Print this checklist or keep it open during deployments!**

---

Last Updated: 2025-11-02
