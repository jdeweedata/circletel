# MTN Session Refresh Guide

## Overview

This guide explains how to keep the MTN wholesale API session alive and automatically refresh it to ensure continuous API availability.

## Session Lifespan

Based on testing:
- **Tracked Expiry**: 60 minutes (conservative estimate)
- **Actual Lifespan**: Much longer (sessions can last 24+ hours)
- **Server-side Session**: MTN's server maintains session beyond client-side cookie expiry

## Automated Monitoring (Current Setup)

### GitHub Actions Workflow

Location: `.github/workflows/validate-mtn-session.yml`

**Schedule**: Runs every 4 hours
**Purpose**: Validates session health and alerts when refresh needed

```yaml
schedule:
  - cron: '0 */4 * * *'  # Every 4 hours
```

**What it does**:
1. ✅ Checks if session is still valid via API call
2. ⚠️ Warns if approaching tracked expiry (< 60 min)
3. ❌ Creates GitHub issue if session expired
4. 📧 Notifies team of expiration

### Manual Trigger

You can manually trigger the validation workflow:

```bash
gh workflow run validate-mtn-session.yml
```

Or via GitHub UI:
- Go to: `Actions` → `Validate MTN Session` → `Run workflow`

## Session Refresh Methods

### Method 1: Automated Monitoring + Manual Refresh (Recommended)

**How it works**:
1. GitHub Actions monitors session every 4 hours
2. When session expires, GitHub creates an issue
3. Team member manually refreshes session (5 minutes)

**Pros**:
- ✅ Reliable (no automation failures)
- ✅ Handles reCAPTCHA correctly
- ✅ Low maintenance

**Cons**:
- ⏱️ Requires manual intervention when session expires

**Setup**:
Already configured! Just ensure GitHub Actions is enabled.

### Method 2: Proactive Manual Refresh (Daily)

**Schedule**: Refresh session once daily before expiry

**Steps**:
```bash
# 1. Authenticate (opens browser with reCAPTCHA)
npx tsx scripts/test-mtn-sso-auth.ts --manual

# 2. Export session to base64
npx tsx scripts/export-session-env.ts --output-only > session.txt

# 3. Update Vercel
cat session.txt | vercel env rm MTN_SESSION production --yes
cat session.txt | vercel env add MTN_SESSION production

# 4. Update GitHub Secret (for CI/CD)
gh secret set MTN_SESSION < session.txt

# 5. Redeploy to apply new session
vercel --prod --yes
```

**Automation Option** (Windows Task Scheduler):
Create a daily task that runs the above script (requires browser interaction for reCAPTCHA).

### Method 3: Session Extension Strategy

**Observation**: MTN sessions last much longer than tracked expiry

**Strategy**: Update only the `expiresAt` field without re-authenticating

**Steps**:
```bash
# 1. Validate current session
npx tsx scripts/validate-mtn-session.ts

# If valid but expired timestamp:
# 2. Update expiresAt to 24 hours from now
# (This is what we did in the deployment)
```

**When to use**:
- Session validation shows "valid but expired"
- You need immediate fix without browser authentication

## Session Refresh Procedure (Step-by-Step)

### When Session Expires

You'll know the session expired when:
1. GitHub Actions creates an issue
2. API endpoints return authentication errors
3. Validation script shows "invalid"

### Refresh Process

#### Step 1: Local Authentication
```bash
npx tsx scripts/test-mtn-sso-auth.ts --manual
```

**What happens**:
- Opens browser to MTN SSO login
- Pre-fills credentials
- Waits for you to solve reCAPTCHA
- Captures session cookies
- Saves to `.cache/mtn-session.json`

#### Step 2: Export Session
```bash
npx tsx scripts/export-session-env.ts --output-only > session.txt
```

This creates a base64-encoded session file.

#### Step 3: Update Production (Vercel)
```bash
# Remove old session
cat session.txt | vercel env rm MTN_SESSION production --yes

# Add new session
cat session.txt | vercel env add MTN_SESSION production
```

#### Step 4: Update GitHub Secret
```bash
gh secret set MTN_SESSION < session.txt
```

Or manually:
1. Go to: https://github.com/jdeweedata/circletel/settings/secrets/actions
2. Click `MTN_SESSION` → `Update`
3. Paste base64 value from `session.txt`

#### Step 5: Deploy
```bash
vercel --prod --yes
```

Wait for deployment to complete, then test:
```bash
curl https://your-deployment-url.vercel.app/api/mtn-wholesale/products
```

## Testing Session Status

### Quick Check
```bash
npx tsx scripts/validate-mtn-session.ts
```

**Output**:
```
✅ Session Valid
- Session ID: C97A5AC99A3275D7BC234E1C5A43303D
- Expires at: 2025-10-19T20:00:00.000Z
- API Status: 200
```

### Check Production API
```bash
# Auth status
curl https://circletel-staging-qj0n1yd7b-jdewee-livecoms-projects.vercel.app/api/mtn-wholesale/auth

# Products (actual API call)
curl https://circletel-staging-qj0n1yd7b-jdewee-livecoms-projects.vercel.app/api/mtn-wholesale/products
```

## Recommended Strategy

### For Production

1. **Enable GitHub Actions**: Already done ✅
2. **Set up notifications**: GitHub will create issues when session expires
3. **Refresh proactively**: When you see the 4-hour validation warning
4. **Keep credentials safe**: MTN_USERNAME and MTN_PASSWORD in GitHub Secrets

### Maintenance Schedule

| Task | Frequency | Automated? |
|------|-----------|------------|
| Session validation | Every 4 hours | ✅ Yes (GitHub Actions) |
| Session refresh | When expired | ❌ Manual (reCAPTCHA) |
| Monitoring alerts | On failure | ✅ Yes (GitHub Issues) |
| Production testing | After refresh | ⏱️ Semi-automated |

## Troubleshooting

### Session Invalid After Refresh

**Symptom**: API returns 401 even after updating MTN_SESSION

**Solutions**:
1. Verify base64 encoding is correct
2. Check Vercel picked up new environment variable (may need redeploy)
3. Ensure no extra whitespace in session.txt
4. Validate expiresAt is in future (24h+ from now)

### GitHub Actions Not Running

**Check**:
```bash
gh workflow list
gh workflow view "Validate MTN Session"
```

**Enable if disabled**:
```bash
gh workflow enable validate-mtn-session.yml
```

### reCAPTCHA Timeout

**If manual authentication fails**:
1. Ensure you're solving reCAPTCHA within 60 seconds
2. Try closing and reopening browser
3. Check MTN SSO portal is accessible
4. Verify credentials in environment variables

## Advanced: Future Automation

### Option: Playwright in Docker (No reCAPTCHA)

**Status**: Not implemented (requires MTN to remove/bypass reCAPTCHA)

**When MTN updates their API**:
1. Remove reCAPTCHA requirement
2. Enable automated browser refresh in GitHub Actions
3. Schedule daily refresh workflow

### Option: API-based Session Refresh

**Status**: MTN doesn't provide session refresh endpoint

**If MTN adds refresh endpoint**:
- Update `lib/services/mtn-sso-auth.ts` with refresh logic
- Add refresh API route
- Enable automatic refresh before expiry

## Emergency Session Recovery

If production goes down due to expired session:

```bash
# Quick fix (5 minutes)
npx tsx scripts/test-mtn-sso-auth.ts --manual
npx tsx scripts/export-session-env.ts --output-only > session.txt
cat session.txt | vercel env rm MTN_SESSION production --yes && \
cat session.txt | vercel env add MTN_SESSION production && \
vercel --prod --yes
```

## Monitoring Dashboard

Track session health at:
- **GitHub Actions**: https://github.com/jdeweedata/circletel/actions/workflows/validate-mtn-session.yml
- **Vercel Logs**: Check API route logs for authentication errors
- **Vercel Environment Variables**: Verify MTN_SESSION exists

## Best Practices

1. ✅ **Never commit** `.cache/mtn-session.json` to git
2. ✅ **Always validate** session after refresh
3. ✅ **Test production** API after deployment
4. ✅ **Monitor GitHub** Actions for validation failures
5. ✅ **Keep credentials** in GitHub Secrets and Vercel env vars only
6. ❌ **Don't automate** reCAPTCHA bypass (violates MTN terms)
7. ❌ **Don't share** session files or credentials

## Summary

**Current Setup** (Recommended):
- ✅ GitHub Actions monitors every 4 hours
- ✅ Alerts via GitHub Issues when expired
- ✅ Manual refresh takes ~5 minutes
- ✅ Session lasts 24+ hours in practice
- ✅ Low maintenance, high reliability

**Expected Refresh Frequency**: Once every 1-2 days (based on observed session lifespan)

**Time to Recover**: 5 minutes if session expires unexpectedly

---

**Last Updated**: 2025-10-18
**Session Status**: ✅ Valid until 2025-10-19T20:00:00.000Z
**Next Validation**: Automatic (every 4 hours via GitHub Actions)
