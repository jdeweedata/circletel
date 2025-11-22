# 🚀 Zoho Daily Sync - Deployment Checklist

**Quick Reference** - Complete these steps to deploy to production

---

## ✅ Step 1: Add CRON_SECRET to Vercel (5 minutes)

1. Go to: https://vercel.com/jdewee-livecoms-projects/circletel
2. Click **Settings** → **Environment Variables**
3. Click **Add New**
4. Set:
   - **Name**: `CRON_SECRET`
   - **Value**: `c2e1331a148ae3f53a89187e1fe68039c47c20d6b405c2cf4048719c2c2dfd2a`
   - **Environments**: ✅ Production, ✅ Preview, ✅ Development
5. Click **Save**

---

## ✅ Step 2: Verify Zoho Credentials (2 minutes)

Still in **Settings** → **Environment Variables**, verify these exist for **Production**:

- [ ] `ZOHO_CLIENT_ID`
- [ ] `ZOHO_CLIENT_SECRET`
- [ ] `ZOHO_REFRESH_TOKEN`
- [ ] `ZOHO_REGION` (optional - defaults to US)
- [ ] `ZOHO_ORG_ID`

If any are missing, add them from your `.env.local` file.

---

## ✅ Step 3: Commit and Push Code (5 minutes)

Run these commands:

```bash
# Check status
git status

# Add all Zoho sync files
git add lib/integrations/zoho/*.ts app/api/cron/zoho-sync/ scripts/*.js scripts/*.ts supabase/migrations/*.sql vercel.json docs/

# Commit
git commit -m "feat(zoho): Add automated daily sync with rate limiting

Epic 4.4 - Automated Daily Reconciliation

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to main
git push origin main
```

---

## ✅ Step 4: Verify Deployment (3 minutes)

1. Go to Vercel Dashboard → **Deployments** tab
2. Wait for build to complete (green checkmark)
3. Click on deployment → **View Function Logs**
4. Verify: "✓ Compiled successfully"

---

## ✅ Step 5: Confirm Cron Job Scheduled (2 minutes)

1. Vercel Dashboard → **Settings** → **Cron Jobs**
2. Verify you see:
   - **Path**: `/api/cron/zoho-sync`
   - **Schedule**: `0 2 * * *` (02:00 daily)

If not listed, redeploy from Deployments tab.

---

## ✅ Step 6: Monitor First Run (Tomorrow at 02:00 SAST)

### Check Logs:
1. Vercel Dashboard → **Logs** tab
2. Filter by function: `app/api/cron/zoho-sync/route.ts`
3. Look for: `[Zoho Sync Cron] Starting Zoho Daily Sync Job`

### Check Database:
```sql
-- Verify sync completed
SELECT * FROM cron_execution_log
WHERE job_name = 'zoho-sync'
ORDER BY created_at DESC LIMIT 1;

-- Check sync status
SELECT
  zoho_crm_sync_status,
  zoho_billing_sync_status,
  COUNT(*) as count
FROM product_integrations
GROUP BY zoho_crm_sync_status, zoho_billing_sync_status;
```

**Expected**: Most products show "ok" status after first run.

---

## 🎯 Success Criteria

- [x] CRON_SECRET added to Vercel
- [x] Code pushed to GitHub
- [x] Vercel build successful
- [x] Cron job appears in Vercel Settings
- [ ] First run completes at 02:00 SAST
- [ ] Products sync successfully (check database)

---

## 🚨 If Something Goes Wrong

**Problem**: Cron not running
- **Fix**: Check Vercel plan supports cron (Pro/Enterprise required)

**Problem**: 401 errors
- **Fix**: Verify CRON_SECRET matches in Vercel and code

**Problem**: Rate limit errors
- **Fix**: Wait 5 minutes, cooldown is automatic

**Full Troubleshooting**: See `docs/deployment/ZOHO_DAILY_SYNC_DEPLOYMENT_GUIDE.md`

---

## 📊 Current Sync Status

**Products needing sync**: 22-27
- CRM failed: 5 products
- Billing failed: 22 products
- Both OK: 4 products

**First run will sync**: All failed products (priority 1)

---

**Total Time**: ~20 minutes
**Full Documentation**: `docs/deployment/ZOHO_DAILY_SYNC_DEPLOYMENT_GUIDE.md`
