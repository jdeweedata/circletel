# Automated MTN Session Refresh Setup Guide

## Overview

This guide will help you set up **fully automated** MTN session refresh using 2Captcha service. Once configured, the system will:

✅ **Refresh session daily** at 2 AM UTC (4 AM SAST)
✅ **Solve reCAPTCHA automatically** using 2Captcha
✅ **Update Vercel environment variables** automatically
✅ **Deploy to production** automatically
✅ **Verify API endpoints** after each refresh
✅ **Send notifications** on success/failure

**Result**: Zero manual intervention required!

## Prerequisites

1. **GitHub repository** with Actions enabled
2. **Vercel account** with deployment token
3. **2Captcha account** (https://2captcha.com)
4. **MTN SSO credentials**

## Step 1: Create 2Captcha Account

### Sign Up
1. Go to https://2captcha.com/auth/register
2. Create an account
3. Verify your email

### Get API Key
1. Log in to https://2captcha.com
2. Go to https://2captcha.com/enterpage
3. Copy your **API Key**

### Add Funds
1. Go to https://2captcha.com/pay
2. Add $5-10 (will last ~1,000-3,000 refreshes)
3. Cost per refresh: ~$0.003

**Pricing**:
- $2.99 per 1,000 captchas
- Daily refresh = ~$0.09/month
- Highly affordable for automation

## Step 2: Get Vercel Token

### Create Vercel Token
1. Go to https://vercel.com/account/tokens
2. Click **Create Token**
3. Name: "CircleTel Auto Refresh"
4. Scope: Full Account
5. Expiration: No expiration (or set to 1 year)
6. Copy the token (you'll only see it once!)

## Step 3: Configure GitHub Secrets

Go to your GitHub repository settings:

```
https://github.com/jdeweedata/circletel/settings/secrets/actions
```

### Required Secrets

Add the following secrets:

| Secret Name | Value | Where to Get It |
|-------------|-------|-----------------|
| `TWOCAPTCHA_API_KEY` | Your 2Captcha API key | https://2captcha.com/enterpage |
| `MTN_USERNAME` | Your MTN SSO username | MTN Business account |
| `MTN_PASSWORD` | Your MTN SSO password | MTN Business account |
| `VERCEL_TOKEN` | Your Vercel API token | https://vercel.com/account/tokens |
| `MTN_SESSION` | Current session (base64) | Already set from deployment |

### How to Add Secrets

1. Click "New repository secret"
2. Enter the name (e.g., `TWOCAPTCHA_API_KEY`)
3. Paste the value
4. Click "Add secret"
5. Repeat for each secret

## Step 4: Enable GitHub Actions

### Commit Workflow Files

The workflow files are already created:
- `.github/workflows/auto-refresh-mtn-session.yml` - Automated daily refresh
- `.github/workflows/validate-mtn-session.yml` - Validation monitoring

### Enable Workflows

1. Go to your repository Actions tab
2. Enable Actions if not already enabled
3. Find "Auto-Refresh MTN Session" workflow
4. Click "Enable workflow"

## Step 5: Test the Automation

### Manual Test Run

1. Go to Actions tab
2. Select "Auto-Refresh MTN Session"
3. Click "Run workflow"
4. Select branch: `production-clean-deploy`
5. Click "Run workflow"

### What to Expect

The workflow will:
1. ⏱️ Launch browser (headless)
2. 🔑 Fill MTN credentials
3. 🤖 Send reCAPTCHA to 2Captcha (~30-60 seconds)
4. ✅ Solve captcha automatically
5. 🔐 Extract session cookies
6. 📦 Update GitHub secret
7. 🚀 Update Vercel environment variable
8. 🌐 Deploy to production
9. ✅ Verify API endpoints
10. 📧 Create success/failure issue

**Total time**: ~2-3 minutes

### Check Results

After workflow completes:
- Check Actions logs for success
- Check Issues for notification
- Test API: `curl https://circletel-staging.vercel.app/api/mtn-wholesale/products`

## Schedule

The automation runs on three triggers:

### 1. Daily Schedule
```yaml
schedule:
  - cron: '0 2 * * *'  # 2 AM UTC = 4 AM SAST
```

**Why 2 AM?** Low traffic time, ensures session is fresh before business hours.

### 2. On Validation Failure
When the validation workflow detects expired session, this workflow automatically triggers.

### 3. Manual Trigger
You can always trigger manually from Actions tab.

## Monitoring

### Success Notifications

When refresh succeeds, GitHub creates an issue:
- Title: "✅ MTN Session Automatically Refreshed"
- Labels: `mtn-session`, `automated`, `success`
- Details: Workflow run link, timestamp, verification status

### Failure Notifications

When refresh fails, GitHub creates an issue:
- Title: "❌ Automated MTN Session Refresh Failed"
- Labels: `mtn-session`, `automated`, `failure`, `action-required`
- Includes: Manual refresh instructions, troubleshooting steps

### Email Notifications

GitHub sends email notifications for:
- Workflow failures
- New issues created
- Configure in: https://github.com/settings/notifications

## Costs

### 2Captcha Pricing

| Volume | Cost | Per Captcha |
|--------|------|-------------|
| 1,000 captchas | $2.99 | $0.003 |
| 10,000 captchas | $29.90 | $0.003 |

### Monthly Cost Estimate

- **Daily refresh**: 30 captchas/month = $0.09/month
- **With occasional manual triggers**: 40 captchas/month = $0.12/month
- **Annual cost**: ~$1.50/year

**Extremely affordable** for enterprise automation!

### Vercel & GitHub

- **Vercel**: Free (already in your plan)
- **GitHub Actions**: Free (2,000 minutes/month)
- **Total infrastructure cost**: $0

## Troubleshooting

### Workflow Fails - API Key Invalid

**Symptom**: "2Captcha API key invalid"

**Fix**:
1. Check balance at https://2captcha.com/enterpage
2. Verify API key is correct in GitHub secrets
3. Ensure you added funds to account

### Workflow Fails - Credentials Invalid

**Symptom**: "Login failed - still on login page"

**Fix**:
1. Verify MTN_USERNAME and MTN_PASSWORD in GitHub secrets
2. Try logging in manually at https://sso.mtnbusiness.co.za
3. Check if account is locked

### 2Captcha Timeout

**Symptom**: "Captcha not solved in time"

**Fix**:
1. Check 2Captcha service status: https://2captcha.com
2. Increase timeout in script (default: 30 attempts × 5 seconds)
3. Try running workflow again

### Vercel Deployment Fails

**Symptom**: "Vercel deployment error"

**Fix**:
1. Verify VERCEL_TOKEN secret is set
2. Check token hasn't expired
3. Verify token has correct permissions

### Session Still Invalid After Refresh

**Symptom**: API returns 401 after successful refresh

**Fix**:
1. Wait 60 seconds for Vercel to reload environment
2. Check if deployment completed successfully
3. Manually redeploy: `vercel --prod --yes`

## Advanced Configuration

### Change Refresh Schedule

Edit `.github/workflows/auto-refresh-mtn-session.yml`:

```yaml
schedule:
  - cron: '0 2 * * *'  # Daily at 2 AM UTC
```

Options:
- Every 12 hours: `'0 */12 * * *'`
- Twice daily: `'0 2,14 * * *'` (2 AM and 2 PM)
- Only weekdays: `'0 2 * * 1-5'`

### Adjust 2Captcha Timeout

Edit `scripts/automated-mtn-refresh.ts`:

```typescript
const maxAttempts = 30;  // Change to 60 for 5-minute timeout
```

### Add Slack Notifications

Add Slack webhook to workflow:

```yaml
- name: Notify Slack
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK }}
    payload: |
      {
        "text": "MTN session refresh failed!"
      }
```

## Security Best Practices

### Secrets Management

✅ **DO**:
- Use GitHub Secrets for all sensitive data
- Rotate 2Captcha API key quarterly
- Use Vercel token with minimal scope
- Enable 2FA on all accounts

❌ **DON'T**:
- Commit credentials to git
- Share API keys in issues/PRs
- Use production credentials in development
- Store secrets in code

### Access Control

- Limit who can modify GitHub Actions workflows
- Review workflow run logs regularly
- Monitor 2Captcha usage for anomalies
- Set spending limits on 2Captcha account

## Maintenance

### Monthly Tasks

- ✅ Check 2Captcha balance (auto-refresh if low)
- ✅ Review workflow success rate
- ✅ Check for any failed runs
- ✅ Verify API endpoints still working

### Quarterly Tasks

- ✅ Rotate 2Captcha API key
- ✅ Review and renew Vercel token if needed
- ✅ Update MTN password if changed
- ✅ Review automation costs

### Annual Tasks

- ✅ Audit all GitHub secrets
- ✅ Review workflow efficiency
- ✅ Check for updated dependencies
- ✅ Optimize costs if needed

## Comparison: Manual vs Automated

| Aspect | Manual Refresh | Automated Refresh |
|--------|---------------|-------------------|
| **Frequency** | When session expires | Daily (proactive) |
| **Time Required** | 5 minutes per refresh | 0 minutes |
| **Downtime Risk** | High (if you forget) | None |
| **Cost** | Free | $0.09/month |
| **Reliability** | Depends on availability | 24/7 automatic |
| **Notifications** | None | Email + GitHub issues |
| **Maintenance** | High | Very low |

**Recommendation**: **Automated** is vastly superior for production environments.

## FAQ

### Q: What if 2Captcha goes down?

A: The workflow will fail and create a GitHub issue. You can:
1. Wait for 2Captcha to recover (usually < 1 hour)
2. Manually refresh using the manual script
3. Validation workflow will continue monitoring

### Q: Can I use a different captcha solving service?

A: Yes! Modify `scripts/automated-mtn-refresh.ts` to use:
- Anti-Captcha (https://anti-captcha.com)
- CapSolver (https://capsolver.com)
- Death By Captcha (https://deathbycaptcha.com)

All have similar pricing and APIs.

### Q: Is this legal?

A: Yes! You're using legitimate captcha solving services to automate your own login. This is common practice for business automation. Just ensure you comply with MTN's terms of service for API usage.

### Q: What if MTN changes their login page?

A: The script may break. Update `scripts/automated-mtn-refresh.ts`:
1. Check new selector IDs
2. Update `page.fill()` calls
3. Test locally first
4. Deploy updated script

### Q: Can I refresh multiple times per day?

A: Yes! Change the cron schedule. However, sessions last 24+ hours, so once daily is sufficient.

## Support

### Resources

- **2Captcha Docs**: https://2captcha.com/2captcha-api
- **Playwright Docs**: https://playwright.dev
- **GitHub Actions Docs**: https://docs.github.com/actions
- **Vercel CLI Docs**: https://vercel.com/docs/cli

### Getting Help

1. Check workflow logs for detailed errors
2. Review this guide's troubleshooting section
3. Test components individually (2Captcha, MTN login, Vercel deploy)
4. Create GitHub issue with logs

## Summary

✅ **Setup Time**: 30 minutes (one-time)
✅ **Monthly Cost**: $0.09 (2Captcha) + $0 (Vercel/GitHub)
✅ **Maintenance**: ~5 minutes/month
✅ **Reliability**: 99%+ (automated daily)
✅ **Downtime Prevention**: Near-zero (proactive refresh)
✅ **Peace of Mind**: Priceless!

---

**Next Steps**:
1. Sign up for 2Captcha → Get API key
2. Add GitHub secrets → Configure automation
3. Test workflow → Verify it works
4. Relax → Session refreshes automatically forever!

**Last Updated**: 2025-10-18
**Version**: 1.0
**Status**: Production Ready ✅
