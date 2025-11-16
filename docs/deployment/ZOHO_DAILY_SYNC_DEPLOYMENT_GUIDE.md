# Zoho Daily Sync - Production Deployment Guide

**Epic 4.4 - Automated Daily Reconciliation**
**Date**: 2025-11-16
**Status**: Ready for Production Deployment

---

## 📋 Pre-Deployment Checklist

### ✅ Completed (Verified)
- [x] Phase 1: Rate limiting implemented (90 calls/min, OAuth mutex, cooldowns)
- [x] Phase 2: Daily sync service created with batch processing
- [x] Phase 3: Database migration applied (separate CRM/Billing tracking)
- [x] `get_sync_candidates()` function working correctly
- [x] Local testing passed (dry-run successful)
- [x] Code changes committed locally

### ⏳ To Complete (This Guide)
- [ ] Add `CRON_SECRET` to Vercel environment variables
- [ ] Verify all Zoho credentials in Vercel
- [ ] Push code to GitHub
- [ ] Verify Vercel deployment
- [ ] Confirm cron job scheduled
- [ ] Monitor first cron run

---

## 🔐 Step 1: Add CRON_SECRET to Vercel

### Get Your CRON_SECRET
Your generated CRON_SECRET (from `.env.local`):
```
c2e1331a148ae3f53a89187e1fe68039c47c20d6b405c2cf4048719c2c2dfd2a
```

### Add to Vercel Dashboard

1. **Go to Vercel Dashboard**:
   - Navigate to: https://vercel.com/jdewee-livecoms-projects/circletel

2. **Open Settings**:
   - Click **Settings** tab
   - Click **Environment Variables** in sidebar

3. **Add CRON_SECRET**:
   - **Name**: `CRON_SECRET`
   - **Value**: `c2e1331a148ae3f53a89187e1fe68039c47c20d6b405c2cf4048719c2c2dfd2a`
   - **Environment**: Select **Production**, **Preview**, and **Development**
   - Click **Save**

4. **Verify it's added**:
   - Should appear in the environment variables list
   - Value should be hidden (shows as `•••••••••`)

---

## 🔍 Step 2: Verify Zoho Credentials in Vercel

Ensure these environment variables are set in Vercel (Production):

### Required Zoho Variables
- `ZOHO_CLIENT_ID` - OAuth Client ID
- `ZOHO_CLIENT_SECRET` - OAuth Client Secret
- `ZOHO_REFRESH_TOKEN` - OAuth Refresh Token
- `ZOHO_REGION` - API Region (US/EU/IN/AU/CN) - Default: US
- `ZOHO_ORG_ID` - Organization ID for Billing API

### How to Verify

1. Go to **Settings** → **Environment Variables** in Vercel
2. Check all 5 Zoho variables are present for **Production** environment
3. If any are missing, add them from your `.env.local` file

### Test Zoho Credentials (Optional but Recommended)

Run this script locally to verify credentials work:
```bash
node scripts/test-zoho-credentials.js
```

If you see "✅ All Zoho credentials valid", you're good to go.

---

## 📦 Step 3: Commit and Push Code Changes

### Files Changed in This Epic

**New Files**:
- `lib/integrations/zoho/rate-limiter.ts` - Global rate limiter
- `lib/integrations/zoho/daily-sync-service.ts` - Daily sync orchestration
- `app/api/cron/zoho-sync/route.ts` - Cron API endpoint
- `scripts/test-zoho-daily-sync.js` - Local testing script
- `supabase/migrations/20251116000001_enhance_product_integrations_tracking.sql` - Database migration
- `supabase/migrations/FIX_get_sync_candidates_function.sql` - Function fix

**Modified Files**:
- `lib/integrations/zoho/auth-service.ts` - Added OAuth mutex + cooldown
- `lib/integrations/zoho/billing-sync-service.ts` - Added rate limiting
- `lib/integrations/zoho/product-sync-service.ts` - Added rate limiting + new CRM columns
- `lib/zoho-api-client.ts` - Removed redirect_uri from refresh
- `scripts/backfill-zoho-billing.ts` - Increased delay 100ms → 700ms
- `scripts/backfill-zoho-products.js` - Added 700ms delays
- `vercel.json` - Added zoho-sync cron schedule + 3-hour timeout

### Commit Commands

```bash
# Check what's changed
git status

# Add all Zoho sync files
git add lib/integrations/zoho/*.ts
git add app/api/cron/zoho-sync/
git add scripts/test-zoho-daily-sync.js
git add scripts/backfill-zoho-*.js
git add scripts/backfill-zoho-*.ts
git add supabase/migrations/20251116000001_*.sql
git add supabase/migrations/FIX_*.sql
git add vercel.json
git add docs/deployment/ZOHO_DAILY_SYNC_DEPLOYMENT_GUIDE.md

# Commit with descriptive message
git commit -m "feat(zoho): Add automated daily sync with rate limiting

Epic 4.4 - Automated Daily Reconciliation

Features:
- Global rate limiter (90 calls/min across CRM/Billing)
- OAuth mutex lock with 5-minute cooldown
- Daily sync cron job (02:00 SAST)
- Separate CRM/Billing status tracking
- Smart sync candidate selection
- Batch processing (20 products/batch)
- Rate limit hit monitoring

Database:
- New columns: zoho_crm_sync_status, zoho_billing_sync_status
- Helper functions: get_sync_candidates(), record_rate_limit_hit()
- Migrated existing data from legacy columns

Fixes:
- OAuth rate limit errors (removed redirect_uri)
- Billing sync exceeding limits (added 700ms delays)
- CRM sync unprotected (added rate limiting)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to main (or your feature branch)
git push origin main
```

### If Using Feature Branch

```bash
# Create feature branch
git checkout -b feature/zoho-daily-sync

# Push to feature branch
git push origin feature/zoho-daily-sync

# Create Pull Request on GitHub
# Go to: https://github.com/your-org/circletel-nextjs/pulls
# Click "New Pull Request"
# Select: feature/zoho-daily-sync → main
# Add description and request review
```

---

## 🚀 Step 4: Verify Vercel Deployment

### Check Deployment Status

1. **Go to Vercel Dashboard**:
   - https://vercel.com/jdewee-livecoms-projects/circletel

2. **Check Deployments Tab**:
   - Look for your latest commit in the deployments list
   - Status should be **Ready** (green checkmark)
   - Click on the deployment to see details

3. **Verify Build Logs**:
   - Click **View Function Logs**
   - Check for any errors in the build
   - Look for: "✓ Compiled successfully"

### Verify Cron Job Configuration

1. **In Vercel Dashboard**:
   - Go to **Settings** → **Cron Jobs**

2. **Verify zoho-sync is listed**:
   - Path: `/api/cron/zoho-sync`
   - Schedule: `0 2 * * *` (02:00 daily)
   - Region: Should match your project region

3. **If not listed**:
   - Redeploy by going to Deployments → Click "..." → Redeploy
   - Check `vercel.json` was included in deployment

### Test the Cron Endpoint (Optional)

From Vercel dashboard, you can manually trigger the cron:

1. Go to **Settings** → **Cron Jobs**
2. Find `zoho-sync` job
3. Click **Run** to trigger immediately
4. Check logs for execution

**Warning**: This will run LIVE sync (not dry-run), so it will actually sync products!

---

## 📊 Step 5: Monitor First Cron Run

### When Will It Run?

- **Schedule**: Every day at **02:00 SAST** (00:00 UTC)
- **First Run**: Tomorrow at 02:00 SAST
- **Duration**: ~15-30 minutes (depends on number of products)

### How to Monitor

#### Option 1: Vercel Logs (Real-time)

1. Go to Vercel Dashboard → **Logs** tab
2. Filter by:
   - **Function**: `app/api/cron/zoho-sync/route.ts`
   - **Time**: Around 02:00 SAST
3. Watch for log output like:
   ```
   [Zoho Sync Cron] Starting Zoho Daily Sync Job
   [DailySync] Found 22 products needing sync
   [DailySync] Batch 1/2 (20 products)
   [DailySync] [1/22] SKY-FBR-010 - SkyFibre SME Essential
   [DailySync]   CRM: ✅ | Billing: ✅
   ```

#### Option 2: Database Query

Check the `cron_execution_log` table:

```sql
-- Most recent cron executions
SELECT
  job_name,
  status,
  execution_time_ms,
  result_summary,
  error_message,
  created_at
FROM cron_execution_log
WHERE job_name = 'zoho-sync'
ORDER BY created_at DESC
LIMIT 5;
```

#### Option 3: Check Sync Status

```sql
-- Current sync status breakdown
SELECT
  zoho_crm_sync_status,
  zoho_billing_sync_status,
  COUNT(*) as count
FROM product_integrations
GROUP BY zoho_crm_sync_status, zoho_billing_sync_status
ORDER BY count DESC;
```

**Expected Result After First Run**:
- Most products should show: CRM ✅ OK, Billing ✅ OK
- Any failures will be retried in next run (24 hours later)

### Check for Errors

```sql
-- Recent sync errors
SELECT
  sp.sku,
  sp.name,
  pi.zoho_crm_sync_status,
  pi.zoho_crm_last_sync_error,
  pi.zoho_billing_sync_status,
  pi.zoho_billing_last_sync_error,
  pi.zoho_crm_last_synced_at,
  pi.zoho_billing_last_synced_at
FROM product_integrations pi
JOIN service_packages sp ON sp.id = pi.service_package_id
WHERE
  pi.zoho_crm_sync_status = 'failed'
  OR pi.zoho_billing_sync_status = 'failed'
ORDER BY pi.updated_at DESC;
```

### Rate Limit Monitoring

```sql
-- Check if we hit any rate limits
SELECT
  sp.sku,
  sp.name,
  pi.last_rate_limit_at,
  pi.rate_limit_hits
FROM product_integrations pi
JOIN service_packages sp ON sp.id = pi.service_package_id
WHERE pi.last_rate_limit_at IS NOT NULL
ORDER BY pi.last_rate_limit_at DESC
LIMIT 10;
```

**If you see rate limit hits**:
- Check `rate_limit_hits` JSONB for details
- Review rate limiter configuration in `lib/integrations/zoho/rate-limiter.ts`
- May need to increase delays or reduce batch size

---

## 🎯 Success Criteria

### ✅ Deployment Successful If:

1. **Vercel Build**: Green checkmark, no errors
2. **Cron Scheduled**: Shows in Vercel Settings → Cron Jobs
3. **First Run Completes**: Check logs around 02:00 SAST
4. **Products Synced**: Most/all products show "ok" status in database
5. **No Rate Limits**: No `last_rate_limit_at` entries in recent logs

### 📈 Expected Metrics (First Run)

Based on current status (22 failed Billing, 5 failed CRM):

- **Total Candidates**: ~22-27 products
- **Processed**: 20-27 (limited to 100 max)
- **CRM Succeeded**: 5-22 (depends on failures)
- **Billing Succeeded**: 22-27 (main priority)
- **Duration**: 15-30 minutes (700ms delay × 27 products + batch delays)

---

## 🚨 Troubleshooting

### Problem: Cron job not running

**Check**:
1. Vercel Settings → Cron Jobs - Is it listed?
2. Vercel plan supports cron jobs (Pro/Enterprise required)
3. `vercel.json` has correct cron configuration

**Fix**:
- Redeploy from Vercel dashboard
- Verify `vercel.json` is in repository root

### Problem: 401 Unauthorized errors

**Check**:
1. `CRON_SECRET` is set in Vercel Production environment
2. Value matches what's in code

**Fix**:
- Add/update `CRON_SECRET` in Vercel Settings → Environment Variables
- Redeploy

### Problem: OAuth rate limit errors

**Symptoms**: Logs show "too many requests continuously"

**Fix**:
1. Wait 5 minutes (automatic cooldown)
2. Check OAuth mutex is working (should prevent concurrent refreshes)
3. Review `auth-service.ts` - mutex lock should be in place

### Problem: CRM/Billing API rate limits

**Symptoms**: Sync stops after N products

**Fix**:
1. Check rate limiter stats in logs
2. Verify delays are working: 700ms between products, 150ms between API calls
3. Reduce `BATCH_SIZE` in `daily-sync-service.ts` if needed (currently 20)

### Problem: Products still showing "failed" after run

**Check**:
1. Look at specific error messages in `zoho_*_last_sync_error` columns
2. Check `zoho_sync_logs` table for details
3. Verify Zoho credentials are correct

**Common Causes**:
- Product doesn't exist in Zoho (SKU mismatch)
- Zoho field validation errors
- Network timeouts (increase timeout in `vercel.json`)

---

## 📝 Post-Deployment Tasks

### Day 1: After First Cron Run

- [ ] Check Vercel logs around 02:00 SAST
- [ ] Run sync status query (see above)
- [ ] Verify no rate limit hits
- [ ] Document any errors in GitHub issue

### Week 1: Daily Monitoring

- [ ] Check `cron_execution_log` daily
- [ ] Monitor for patterns in failures
- [ ] Track rate limiter effectiveness

### Month 1: Optimization

- [ ] Review sync duration trends
- [ ] Identify products that consistently fail
- [ ] Adjust batch sizes/delays if needed
- [ ] Consider removing deprecated columns (sync_status, last_synced_at)

---

## 🔗 Related Documentation

- **Migration Guide**: `supabase/migrations/APPLY_20251116000001.md`
- **Function Fix**: `supabase/migrations/FIX_get_sync_candidates_function.sql`
- **Testing Script**: `scripts/test-zoho-daily-sync.js`
- **Rate Limiter**: `lib/integrations/zoho/rate-limiter.ts`
- **Daily Sync Service**: `lib/integrations/zoho/daily-sync-service.ts`
- **Cron Route**: `app/api/cron/zoho-sync/route.ts`

---

## ✨ Summary

**What You've Built**:
- ✅ Automated daily sync (runs at 02:00 SAST)
- ✅ Smart sync (only syncs failed/stale products)
- ✅ Rate limit protection (90 calls/min)
- ✅ Separate CRM/Billing tracking
- ✅ Comprehensive error logging
- ✅ Production-ready monitoring

**Expected Impact**:
- **Manual Work Reduced**: From 100% manual to 0% (fully automated)
- **Sync Frequency**: From ad-hoc to daily at 02:00 SAST
- **Error Recovery**: Automatic retry of failed syncs
- **Visibility**: Clear status per product (CRM vs Billing)

**Next Steps After Deployment**:
1. Monitor first run tomorrow at 02:00 SAST
2. Verify all 22 Billing packages sync successfully
3. Check for any rate limit issues
4. Consider Phase 4 (Admin UI) for manual re-sync capability

---

**Deployment Owner**: Development Team
**Last Updated**: 2025-11-16
**Status**: 🚀 Ready for Production
