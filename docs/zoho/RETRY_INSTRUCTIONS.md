# ZOHO Billing Backfill - Retry Instructions

**Status**: 3 customers pending retry (rate limited)
**Created**: 2025-11-20 21:45
**Retry After**: ~21:55 (10 minutes cooldown)

---

## Quick Start

```bash
# Wait 10 minutes, then:
npm run zoho:retry-failed
```

---

## Failed Customers

| Email | Account | Reason |
|-------|---------|--------|
| circletelsa@gmail.com | CT-2025-00015 | Rate limit |
| mitchadams39@gmail.com | CT-2025-00023 | Rate limit |
| jeffrey.de.wee@circletel.co.za | CT-2025-00024 | Rate limit |

---

## Retry Process

### 1. Wait for Rate Limit Cooldown (10 minutes)

ZOHO API rate limits reset after 10 minutes. Backfill ended at **21:45**, so retry after **21:55**.

### 2. Check Failed Customers (Optional Dry-Run)

```bash
npm run zoho:retry-failed -- --dry-run
```

**Expected Output:**
```
Found 3 failed customer(s):
  1. circletelsa@gmail.com - CT-2025-00015
  2. mitchadams39@gmail.com - CT-2025-00023
  3. jeffrey.de.wee@circletel.co.za - CT-2025-00024

🔍 DRY RUN: Would retry these customers
```

### 3. Execute Retry

```bash
npm run zoho:retry-failed
```

**Expected Output:**
```
🔄 ZOHO Billing Failed Customer Retry
════════════════════════════════════════════════════════════
Mode: ✅ LIVE SYNC
════════════════════════════════════════════════════════════

📊 Fetching failed customers...
Found 3 failed customer(s)

🚀 Starting retry...

[1/3] Retrying: circletelsa@gmail.com
  Account: CT-2025-00015
  Name: Circle Tel
  ✅ Successfully synced: 6179546000000XXXXX
  ⏳ Waiting 2 seconds...

[2/3] Retrying: mitchadams39@gmail.com
  Account: CT-2025-00023
  Name: Mitch User
  ✅ Successfully synced: 6179546000000XXXXX
  ⏳ Waiting 2 seconds...

[3/3] Retrying: jeffrey.de.wee@circletel.co.za
  Account: CT-2025-00024
  Name: Jeffrey De Wee
  ✅ Successfully synced: 6179546000000XXXXX

════════════════════════════════════════════════════════════
📊 Retry Results
════════════════════════════════════════════════════════════
Total Attempted: 3
✅ Successfully Synced: 3
❌ Failed: 0
⏱️  Duration: X.XX seconds

✅ All failed customers successfully synced!
```

---

## Verification

After successful retry, verify:

### Database Check

```sql
-- All customers should have ZOHO IDs
SELECT
  email,
  account_number,
  zoho_billing_customer_id,
  zoho_sync_status
FROM customers
WHERE account_type != 'internal_test'
ORDER BY created_at;
```

**Expected:** 13 rows, all with `zoho_billing_customer_id` populated

### Status Summary

```sql
SELECT
  zoho_sync_status,
  COUNT(*) as count
FROM customers
WHERE account_type != 'internal_test'
GROUP BY zoho_sync_status;
```

**Expected:**
```
zoho_sync_status | count
-----------------|------
synced           | 13
```

### ZOHO Dashboard

**URL:** https://billing.zoho.com/app/6179546000000027001#/customers

**Verify:**
- Total customers: **13**
- All CircleTel account numbers present (CT-2025-XXXXX)
- No duplicate customers

---

## Troubleshooting

### If Retry Still Fails with Rate Limit

**Wait Longer:** Rate limits may take 15-20 minutes in some cases
```bash
# Wait additional 10 minutes, then retry again
npm run zoho:retry-failed
```

### If Individual Customer Fails

Check specific error in output and verify:
1. Customer exists in CircleTel database
2. Customer email is valid
3. ZOHO credentials are correct (`.env.local`)

### If All Retries Fail

**Check ZOHO API Status:**
- https://status.zoho.com/

**Verify Credentials:**
```bash
npx tsx scripts/verify-env-variables.ts
```

**Contact Support:**
- ZOHO Support: https://www.zoho.com/billing/support.html

---

## Post-Retry Cleanup

Once all 13 customers are synced:

1. ✅ Update `INTEGRATION_SUMMARY.md` to reflect 100% completion
2. ✅ Update `BACKFILL_EXECUTION_REPORT.md` with final results
3. ✅ Close any related issues/tickets
4. ✅ Notify team of successful completion

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `npm run zoho:retry-failed` | Retry failed customers |
| `npm run zoho:retry-failed -- --dry-run` | Check failed count without syncing |
| `npm run zoho:backfill:customers` | Re-run full customer backfill |
| `npx tsx scripts/verify-env-variables.ts` | Verify ZOHO credentials |

---

**Next Update:** After successful retry execution
