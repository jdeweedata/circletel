# 🤖 GitHub Actions Setup - MTN Session Auto-Refresh

**Complete Setup Guide** - Follow these steps to enable fully automated session refresh.

---

## 📋 Prerequisites

Your Vercel project details (already configured):
```
Project ID: prj_QfDHiOnpJ5MIEB3NgTBcprBNkhvN
Org ID: team_FTCtPsYMEIizj3T0kT24SQAz
Project Name: circletel-staging
```

---

## 🚀 Step-by-Step Setup

### Step 1: Get Vercel API Token (2 minutes)

1. **Go to Vercel Tokens Page:**
   ```
   https://vercel.com/account/tokens
   ```

2. **Create New Token:**
   - Click **"Create Token"**
   - Name: `GitHub Actions - MTN Refresh`
   - Scope: **Full Access** (or at minimum: `deployments:write`, `env:write`)
   - Expiration: **No Expiration** (recommended) or 1 year
   - Click **"Create"**

3. **Copy the Token:**
   - ⚠️ **IMPORTANT**: Copy it immediately - you won't see it again!
   - Format: `vercel_XXXXXXXXXXXXXXXXXXXXXXXX`
   - Keep it safe for Step 2

---

### Step 2: Add GitHub Secrets (5 minutes)

1. **Go to your GitHub repository:**
   ```
   https://github.com/YOUR_USERNAME/circletel-nextjs/settings/secrets/actions
   ```
   (Replace `YOUR_USERNAME` with your GitHub username or organization)

2. **Click "New repository secret" and add each of these:**

   **Secret 1:**
   ```
   Name: MTN_USERNAME
   Value: Lindokuhle.mdake@circletel.co.za
   ```
   Click **"Add secret"**

   **Secret 2:**
   ```
   Name: MTN_PASSWORD
   Value: Lwandle@1992*
   ```
   Click **"Add secret"**

   **Secret 3:**
   ```
   Name: VERCEL_TOKEN
   Value: <paste-token-from-step-1>
   ```
   Click **"Add secret"**

   **Secret 4:**
   ```
   Name: VERCEL_PROJECT_ID
   Value: prj_QfDHiOnpJ5MIEB3NgTBcprBNkhvN
   ```
   Click **"Add secret"**

   **Secret 5:**
   ```
   Name: VERCEL_ORG_ID
   Value: team_FTCtPsYMEIizj3T0kT24SQAz
   ```
   Click **"Add secret"**

3. **Verify all 5 secrets are added:**
   - MTN_USERNAME
   - MTN_PASSWORD
   - VERCEL_TOKEN
   - VERCEL_PROJECT_ID
   - VERCEL_ORG_ID

---

### Step 3: Commit Workflow File (2 minutes)

The workflow file is already created at `.github/workflows/refresh-mtn-session.yml`.

**Commit and push it:**

```bash
cd /c/Projects/circletel-nextjs

# Check if workflow file exists
ls .github/workflows/refresh-mtn-session.yml

# Stage the workflow file
git add .github/workflows/refresh-mtn-session.yml

# Also add documentation
git add DEPLOYMENT_QUICKSTART.md
git add GITHUB_ACTIONS_SETUP.md
git add docs/integrations/MTN_SESSION_MANAGEMENT.md
git add app/api/mtn-wholesale/refresh/

# Commit
git commit -m "feat: Add automated MTN session refresh with GitHub Actions

- Workflow runs every 50 minutes
- Auto-authenticates with MTN SSO
- Updates Vercel environment variables
- Triggers automatic redeployment
- See GITHUB_ACTIONS_SETUP.md for setup instructions"

# Push to GitHub
git push origin main
```

---

### Step 4: Enable GitHub Actions (1 minute)

1. **Go to GitHub Actions page:**
   ```
   https://github.com/YOUR_USERNAME/circletel-nextjs/actions
   ```

2. **If prompted to enable workflows:**
   - Click **"I understand my workflows, go ahead and enable them"**

3. **Find the workflow:**
   - Look for **"Refresh MTN Session"** in the workflows list
   - It should appear after pushing

---

### Step 5: Test the Workflow (5 minutes)

**Option A: Manual Trigger (Immediate Test)**

1. **Go to the workflow:**
   ```
   https://github.com/YOUR_USERNAME/circletel-nextjs/actions/workflows/refresh-mtn-session.yml
   ```

2. **Click "Run workflow" dropdown** (on the right side)

3. **Click "Run workflow" button** (green button)

4. **Watch it run:**
   - Click on the running workflow
   - Click on the "refresh-session" job
   - Watch each step complete:
     - ✓ Checkout code
     - ✓ Setup Node.js
     - ✓ Install dependencies
     - ✓ Install Playwright browsers
     - ✓ Authenticate with MTN SSO
     - ✓ Export session to base64
     - ✓ Update Vercel environment variables
     - ✓ Trigger Vercel redeployment

5. **Expected Duration:** 3-5 minutes

**Option B: Wait for Scheduled Run**

- First automatic run: Top of the next hour (minute 0 or 50)
- Example: If now is 10:23, next run at 10:50
- Check back at that time

---

### Step 6: Verify Success (2 minutes)

**After the workflow completes:**

1. **Check Vercel Environment Variables:**
   ```
   https://vercel.com/jdewee-livecoms-projects/circletel-staging/settings/environment-variables
   ```
   - Look for `MTN_SESSION`
   - It should have a new value (different from before)
   - Check the "Last Updated" timestamp

2. **Check Vercel Deployments:**
   ```
   https://vercel.com/jdewee-livecoms-projects/circletel-staging/deployments
   ```
   - You should see a new deployment triggered by the workflow
   - Status should be "Ready"

3. **Test the API:**
   ```bash
   curl https://circletel-staging.vercel.app/api/mtn-wholesale/products
   ```
   - Should return product data
   - Should NOT return authentication errors

---

## ✅ Success Checklist

After completing all steps, verify:

- [ ] 5 GitHub Secrets added (MTN_USERNAME, MTN_PASSWORD, VERCEL_TOKEN, VERCEL_PROJECT_ID, VERCEL_ORG_ID)
- [ ] Workflow file committed and pushed to GitHub
- [ ] GitHub Actions enabled for the repository
- [ ] Manual workflow run completed successfully (green checkmark)
- [ ] New deployment visible in Vercel
- [ ] MTN_SESSION environment variable updated in Vercel
- [ ] API test returns product data (not errors)

---

## 🔄 What Happens Next

**Automated Schedule:**
- Workflow runs **every 50 minutes** automatically
- Pattern: `:00` and `:50` of every hour
- Examples:
  - 10:00, 10:50
  - 11:00, 11:50
  - 12:00, 12:50
  - etc.

**Each Run:**
1. Authenticates with MTN SSO (headless browser)
2. Exports session as base64
3. Updates `MTN_SESSION` in Vercel
4. Triggers Vercel redeployment
5. New session is live in production

**Zero Maintenance:**
- No manual intervention needed
- Sessions never expire
- APIs always work
- You can sleep peacefully 😴

---

## 📊 Monitoring

### Check Workflow Status

**All Runs:**
```
https://github.com/YOUR_USERNAME/circletel-nextjs/actions/workflows/refresh-mtn-session.yml
```

**Latest Run:**
- Green checkmark ✓ = Success
- Red X ✗ = Failed (needs attention)

### Email Notifications

**Enable Failure Alerts:**

1. **Go to GitHub Notification Settings:**
   ```
   https://github.com/settings/notifications
   ```

2. **Under "Actions":**
   - ☑ Enable notifications for **"Failed workflows only"**
   - Choose email or GitHub UI notifications

3. **Result:**
   - You'll receive email if workflow fails
   - Silence when everything works (as it should!)

### API Health Check

**Anytime, check session status:**
```bash
curl https://circletel-staging.vercel.app/api/mtn-wholesale/refresh

# Response:
{
  "valid": true,
  "expiresAt": "2025-10-17T11:30:00.000Z",
  "minutesLeft": 45,
  "needsRefresh": false
}
```

---

## 🚨 Troubleshooting

### Workflow Fails: "Authentication failed"

**Possible Causes:**
- Wrong MTN_USERNAME or MTN_PASSWORD
- MTN SSO portal is down
- reCAPTCHA blocking headless browser

**Solution:**
```bash
# Test authentication locally first
npx tsx scripts/test-mtn-sso-auth.ts --manual

# If that works, the issue is with headless mode
# Check GitHub Actions logs for specific error
```

### Workflow Fails: "Failed to update Vercel env vars"

**Possible Causes:**
- VERCEL_TOKEN is invalid or expired
- VERCEL_PROJECT_ID or VERCEL_ORG_ID is wrong
- Token lacks required permissions

**Solution:**
1. Create new Vercel token (Step 1 above)
2. Update VERCEL_TOKEN secret in GitHub
3. Re-run workflow

### Workflow Succeeds but APIs Still Fail

**Possible Cause:** Vercel deployment hasn't finished yet

**Solution:**
```bash
# Wait 2-3 minutes for deployment to complete
# Then check Vercel deployments page:
https://vercel.com/jdewee-livecoms-projects/circletel-staging/deployments

# Look for "Ready" status
# Then test API again
```

### No Workflow Runs Showing

**Possible Causes:**
- Workflow file not committed
- GitHub Actions not enabled
- Branch name mismatch (workflow expects 'main')

**Solution:**
```bash
# Check if file exists in GitHub
https://github.com/YOUR_USERNAME/circletel-nextjs/blob/main/.github/workflows/refresh-mtn-session.yml

# If not found, commit and push again
git add .github/workflows/refresh-mtn-session.yml
git commit -m "Add MTN session refresh workflow"
git push origin main
```

---

## 🎯 Quick Reference

**GitHub Secrets Page:**
```
https://github.com/YOUR_USERNAME/circletel-nextjs/settings/secrets/actions
```

**Workflow Runs:**
```
https://github.com/YOUR_USERNAME/circletel-nextjs/actions/workflows/refresh-mtn-session.yml
```

**Vercel Environment Variables:**
```
https://vercel.com/jdewee-livecoms-projects/circletel-staging/settings/environment-variables
```

**Vercel Deployments:**
```
https://vercel.com/jdewee-livecoms-projects/circletel-staging/deployments
```

**Vercel Token Management:**
```
https://vercel.com/account/tokens
```

---

## 🎉 You're Done!

Once setup is complete:
- ✅ Sessions refresh automatically every 50 minutes
- ✅ Zero manual intervention required
- ✅ APIs work 24/7 without interruption
- ✅ Email alerts if anything goes wrong

**Total Setup Time:** ~15 minutes
**Ongoing Maintenance:** 0 hours/week

Congratulations! Your MTN SSO authentication is now fully automated. 🚀

---

**Questions?** Check `docs/integrations/MTN_SESSION_MANAGEMENT.md` for detailed documentation.
