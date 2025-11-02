# CircleTel Production Rollback Procedure

**Last Updated**: 2025-11-02
**Purpose**: Quick reference guide for rolling back failed production deployments

---

## Table of Contents

1. [When to Rollback](#when-to-rollback)
2. [Rollback Decision Matrix](#rollback-decision-matrix)
3. [Quick Rollback Methods](#quick-rollback-methods)
4. [Detailed Rollback Procedures](#detailed-rollback-procedures)
5. [Post-Rollback Steps](#post-rollback-steps)
6. [Database Rollback](#database-rollback)
7. [Communication Templates](#communication-templates)

---

## When to Rollback

### Rollback Immediately If:

- ⛔ **Site is completely down** (500 errors, white screen)
- ⛔ **Critical security vulnerability exposed**
- ⛔ **Data corruption or loss occurring**
- ⛔ **Payment processing broken**
- ⛔ **Database connection failures**
- ⛔ **Authentication system broken** (customers can't login)

### Consider Rollback If:

- ⚠️ **Major features broken** (coverage checker, package selection)
- ⚠️ **High error rate** (>5% of requests failing)
- ⚠️ **Severe performance degradation** (pages taking >10s to load)
- ⚠️ **Admin panel inaccessible**

### Fix Forward Instead of Rollback If:

- ✅ **Minor UI bugs** (cosmetic issues, typos)
- ✅ **Non-critical feature issues** (analytics, tracking)
- ✅ **Low error rate** (<1% of requests)
- ✅ **Quick fix available** (can be deployed in <10 minutes)

---

## Rollback Decision Matrix

| Issue Severity | User Impact | Action | Timeline |
|----------------|-------------|--------|----------|
| **Critical** | All users affected, site down | Rollback immediately | <2 minutes |
| **High** | Key features broken, payment not working | Rollback if no quick fix available | <5 minutes |
| **Medium** | Some features broken, workarounds exist | Evaluate fix forward vs rollback | <15 minutes |
| **Low** | Minor bugs, limited impact | Fix forward in next deploy | Next day |

---

## Quick Rollback Methods

### Method 1: Vercel Dashboard Rollback (FASTEST)

**Time**: <2 minutes
**Best for**: Any production issue
**Requires**: Vercel dashboard access

**Steps**:
1. Go to https://vercel.com/jdewee-livecoms-projects/circletel-production
2. Click "Deployments" tab
3. Find the last stable deployment (before the bad one)
4. Click the "..." menu next to that deployment
5. Click "Promote to Production"
6. Confirm promotion
7. Wait for deployment to complete (~30 seconds)
8. Verify site is working: https://circletel.co.za

**Verification**:
```bash
curl -I https://circletel.co.za
# Expected: HTTP 200 OK

# Check deployment ID matches rolled-back version
```

---

### Method 2: Git Revert (PERMANENT)

**Time**: <5 minutes
**Best for**: When you want to permanently undo changes
**Requires**: Git access

**Steps**:

1. **Identify the bad merge commit**:
   ```bash
   git log master --oneline -10
   ```

   Look for the merge commit that caused the issue.

2. **Revert the merge commit**:
   ```bash
   # Make sure you're on master and up to date
   git checkout master
   git pull origin master

   # Revert the merge (use -m 1 for merge commits)
   git revert -m 1 <merge_commit_hash>

   # This creates a new revert commit
   git push origin master
   ```

3. **Vercel auto-deploys** the reverted code

4. **Verify rollback**:
   ```bash
   curl -I https://circletel.co.za
   ```

**Example**:
```bash
# Find bad commit
git log master --oneline -5
# Output:
# abc123 Merge pull request #42 from staging
# def456 Previous commit

# Revert the merge
git revert -m 1 abc123

# Push to trigger deploy
git push origin master
```

---

### Method 3: Git Reset (DESTRUCTIVE - Use with Caution)

**Time**: <5 minutes
**Best for**: Emergency situations, when revert doesn't work
**⚠️ WARNING**: This rewrites history. Only use if absolutely necessary.

**Steps**:

1. **Backup current state**:
   ```bash
   git checkout master
   git branch backup-before-reset
   ```

2. **Reset to previous commit**:
   ```bash
   git reset --hard <last_good_commit>
   ```

3. **Force push** (requires admin permissions):
   ```bash
   git push --force origin master
   ```

4. **Vercel auto-deploys** the old code

⚠️ **Warning**: Force push will overwrite history. Make sure team is aware.

---

## Detailed Rollback Procedures

### Full Production Rollback Checklist

```
EMERGENCY ROLLBACK
══════════════════════════════════════════════════════════

1. IDENTIFY ISSUE
   [ ] Confirm issue is severe enough for rollback
   [ ] Document what's broken
   [ ] Note time issue was discovered

2. NOTIFY TEAM
   [ ] Post in Slack: "ROLLING BACK PRODUCTION - [reason]"
   [ ] Tag @team for awareness
   [ ] Assign someone to monitor

3. PERFORM ROLLBACK
   Method used: [ ] Vercel Dashboard  [ ] Git Revert  [ ] Git Reset

   [ ] Execute rollback (see methods above)
   [ ] Monitor Vercel deployment
   [ ] Wait for deployment to complete

4. VERIFY ROLLBACK
   [ ] Site loads: https://circletel.co.za
   [ ] Coverage checker works
   [ ] Customer login works
   [ ] Admin panel works
   [ ] No errors in logs

5. POST-ROLLBACK
   [ ] Announce rollback complete
   [ ] Monitor for 15 minutes
   [ ] Document what happened
   [ ] Plan fix in staging

6. ROOT CAUSE ANALYSIS
   [ ] Identify what caused the issue
   [ ] Document lessons learned
   [ ] Update deployment procedures
   [ ] Test fix in staging before re-deploying
```

---

## Post-Rollback Steps

### Immediate (First 15 Minutes)

1. **Verify Site Stability**
   ```bash
   # Run smoke tests
   curl -I https://circletel.co.za

   # Check key pages
   # - Homepage
   # - Coverage checker
   # - Login pages
   ```

2. **Monitor Error Logs**
   - Check Vercel function logs
   - Watch for any new errors
   - Verify error rate has dropped

3. **Update Team**
   - Slack: "Rollback complete, site is stable"
   - Document time of rollback
   - Share what was rolled back

### Within 1 Hour

1. **Document the Incident**
   - What went wrong?
   - What was the impact?
   - How was it discovered?
   - How was it resolved?

2. **Plan the Fix**
   - Identify root cause
   - Create fix in feature branch
   - Test thoroughly in staging
   - Schedule re-deployment

3. **Review Deployment Process**
   - What went wrong in testing?
   - What could prevent this in future?
   - Update checklists if needed

---

## Database Rollback

### If Database Migrations Were Applied

**⚠️ Database rollbacks are complex and risky. Proceed with caution.**

#### Option 1: Revert Migration (If Safe)

```sql
-- Connect to Supabase database
-- Run the "down" migration if available

-- Example: If migration added a column
ALTER TABLE tablename DROP COLUMN columnname;

-- Or restore from backup
-- See Supabase dashboard for backup restore
```

#### Option 2: Keep Database, Rollback Code Only

If the database migration is backwards-compatible:
1. Roll back the code deployment
2. Leave database as-is
3. Old code should still work with new database

**When this works**:
- Migration only added columns (with defaults)
- Migration only added tables (not used by old code)
- Migration only added indexes

**When this doesn't work**:
- Migration renamed columns
- Migration changed data types
- Migration deleted columns/tables
- Old code depends on old schema

#### Option 3: Database Backup Restore

**Last resort only - causes data loss**

1. Go to Supabase dashboard
2. Find latest backup before deployment
3. Restore backup
4. **WARNING**: Any data after backup is lost

---

## Communication Templates

### Slack: Initiating Rollback

```
🚨 ROLLING BACK PRODUCTION

Issue: [Brief description of what's broken]
Impact: [Who/what is affected]
Action: Rolling back to [deployment/commit]
ETA: 2-5 minutes

Please stand by, will update when complete.
@channel
```

### Slack: Rollback Complete

```
✅ ROLLBACK COMPLETE

Rollback finished at [time]
Site is stable: https://circletel.co.za
Monitoring for next 15 minutes

What happened: [Brief explanation]
Next steps: [Plan for fix]

Thanks for your patience.
```

### Slack: Post-Mortem Summary

```
📋 DEPLOYMENT ROLLBACK POST-MORTEM

Date: [date]
Time: [time]
Duration: [how long site was affected]

What happened:
- [Description of issue]

Impact:
- [What was broken]
- [Who was affected]

Resolution:
- Rolled back to [version]
- Site restored at [time]

Root cause:
- [What caused the issue]

Prevention:
- [What we'll do differently]
- [Process improvements]

Fix plan:
- [How we'll fix properly]
- [When we'll redeploy]
```

---

## Rollback Testing

### Staging Rollback Practice

It's good to practice rollback procedures in staging:

1. **Deploy something to staging**:
   ```bash
   git push origin main:staging
   ```

2. **Practice Vercel rollback**:
   - Go to staging project
   - Promote previous deployment

3. **Practice git revert**:
   ```bash
   git checkout staging
   git revert -m 1 <last_commit>
   git push origin staging
   ```

**Do this quarterly** to keep skills sharp.

---

## Rollback Prevention

### How to Avoid Needing Rollbacks

1. **Test Thoroughly in Staging**
   - Run full test suite
   - Manual QA of critical paths
   - Load testing if needed

2. **Use Feature Flags**
   - Deploy code disabled
   - Enable gradually
   - Easy to disable if issues

3. **Monitor Deployments Actively**
   - Watch for 15 minutes post-deploy
   - Don't walk away immediately
   - Be ready to rollback quickly

4. **Deploy During Low Traffic**
   - Business hours (9am-5pm) when team available
   - Not late at night when no support
   - Not during holidays

5. **Have Rollback Plan Ready**
   - Before every deploy, know how to rollback
   - Keep rollback docs open
   - Practice rollback procedures

---

## Quick Reference Card

**FASTEST ROLLBACK - VERCEL DASHBOARD**:
1. https://vercel.com/jdewee-livecoms-projects/circletel-production
2. Deployments tab
3. Find last good deployment
4. "..." → "Promote to Production"

**GIT REVERT**:
```bash
git revert -m 1 <merge_commit>
git push origin master
```

**VERIFY**:
```bash
curl -I https://circletel.co.za
```

**TEAM**:
- Slack: @channel in #deployments
- Escalate if needed

---

## Related Documentation

- **Deployment Workflow**: `STAGING_TO_PRODUCTION_WORKFLOW.md`
- **Production Checklist**: `PRODUCTION_DEPLOY_CHECKLIST.md`
- **Environment Variables**: `ENVIRONMENT_VARIABLES_GUIDE.md`

---

**Last Updated**: 2025-11-02
**Next Review**: 2025-12-02
**Emergency Contact**: @team in Slack
