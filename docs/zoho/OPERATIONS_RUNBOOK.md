# ZOHO Billing Integration - Operations Runbook

**Version**: 1.0
**Last Updated**: 2025-11-20
**Status**: Production

---

## 📋 Table of Contents

1. [Daily Operations](#daily-operations)
2. [Weekly Operations](#weekly-operations)
3. [Monthly Operations](#monthly-operations)
4. [Monitoring Dashboard](#monitoring-dashboard)
5. [Health Checks](#health-checks)
6. [Incident Response](#incident-response)
7. [Common Issues](#common-issues)
8. [Escalation Procedures](#escalation-procedures)

---

## 🌅 Daily Operations

### Morning Health Check (10 minutes)

**Time**: Start of business day
**Frequency**: Every business day
**Owner**: Operations/DevOps team

#### 1. Run Automated Health Check

```bash
npm run zoho:health-check
```

**Expected Output**: ✅ HEALTHY (all checks pass)

**Action Items**:
- ✅ HEALTHY → No action required
- ⚠️ DEGRADED → Review warnings, schedule fixes within 24h
- ❌ UNHEALTHY → Immediate action required (see [Incident Response](#incident-response))

#### 2. Review Admin Dashboard

**URL**: `http://localhost:3001/admin/zoho-sync` (or production URL)

**Check**:
- [ ] Overall sync health cards show no failures
- [ ] Recent sync activity shows successful operations
- [ ] No stale "syncing" or "retrying" statuses (>1 hour old)

**Red Flags**:
- Failed syncs > 0
- Pending syncs > 1 hour old
- Syncing status stuck for > 5 minutes

#### 3. Quick Database Query

```sql
-- Check for failed syncs in last 24 hours
SELECT
  entity_type,
  COUNT(*) as failed_count
FROM customers
WHERE zoho_sync_status = 'failed'
  AND updated_at >= NOW() - INTERVAL '24 hours'
  AND account_type != 'internal_test'
GROUP BY entity_type;

UNION ALL

SELECT
  'services' as entity_type,
  COUNT(*) as failed_count
FROM customer_services
WHERE zoho_sync_status = 'failed'
  AND updated_at >= NOW() - INTERVAL '24 hours';

UNION ALL

SELECT
  'invoices' as entity_type,
  COUNT(*) as failed_count
FROM customer_invoices
WHERE zoho_sync_status = 'failed'
  AND updated_at >= NOW() - INTERVAL '24 hours';

UNION ALL

SELECT
  'payments' as entity_type,
  COUNT(*) as failed_count
FROM payment_transactions
WHERE zoho_sync_status = 'failed'
  AND updated_at >= NOW() - INTERVAL '24 hours';
```

**Expected**: 0 rows (no failures)

**Action if failures found**: See [Failed Sync Recovery](#failed-sync-recovery)

---

## 📅 Weekly Operations

### Weekly Review (30 minutes)

**Time**: Monday morning
**Frequency**: Weekly
**Owner**: Development + Operations team

#### 1. Detailed Health Check

```bash
npm run zoho:health-check --detailed
```

Review detailed output for:
- [ ] Sync success rates by entity type
- [ ] Data integrity issues
- [ ] Stale failures (>7 days old)
- [ ] API connectivity trends

#### 2. Sync Log Analysis

```sql
-- Weekly sync statistics
SELECT
  entity_type,
  status,
  COUNT(*) as sync_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY entity_type), 2) as percentage
FROM zoho_sync_logs
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY entity_type, status
ORDER BY entity_type, status;
```

**Target Metrics**:
- Success rate: >98%
- Failed syncs: <5 per week
- Average sync time: <5 seconds

#### 3. ZOHO Dashboard Verification

**URL**: https://billing.zoho.com/app/6179546000000027001

**Verify**:
- [ ] Customer count matches CircleTel database
- [ ] Recent subscriptions created correctly
- [ ] Invoices generated as expected
- [ ] Payments recorded accurately
- [ ] No duplicate customers

#### 4. Clean Up Stale Data

**Identify stale failures**:
```sql
SELECT
  entity_type,
  entity_id,
  error_message,
  created_at,
  AGE(NOW(), created_at) as age
FROM zoho_sync_logs
WHERE status = 'failed'
  AND created_at < NOW() - INTERVAL '7 days'
ORDER BY created_at ASC
LIMIT 20;
```

**Action**: Review and either:
1. Retry sync: `npm run zoho:retry-failed`
2. Investigate root cause
3. Mark as resolved (update status manually if issue fixed)

---

## 📆 Monthly Operations

### Monthly Audit (1-2 hours)

**Time**: First Monday of month
**Frequency**: Monthly
**Owner**: Development team + Finance

#### 1. Data Reconciliation

**Compare CircleTel vs ZOHO totals**:

```sql
-- CircleTel counts
SELECT
  'customers' as entity,
  COUNT(*) as circletel_count
FROM customers
WHERE account_type != 'internal_test'
  AND zoho_billing_customer_id IS NOT NULL

UNION ALL

SELECT
  'active_services',
  COUNT(*)
FROM customer_services
WHERE status = 'active'
  AND zoho_subscription_id IS NOT NULL

UNION ALL

SELECT
  'invoices',
  COUNT(*)
FROM customer_invoices
WHERE zoho_billing_invoice_id IS NOT NULL

UNION ALL

SELECT
  'payments',
  COUNT(*)
FROM payment_transactions
WHERE status = 'completed'
  AND zoho_payment_id IS NOT NULL;
```

**ZOHO counts**: Check via ZOHO Billing dashboard

**Action if mismatch**: Investigate discrepancies

#### 2. Performance Review

**Key Metrics**:
- Total syncs this month
- Success rate percentage
- Average sync time
- Peak sync times (identify bottlenecks)
- Rate limit hits (should be 0)

```sql
-- Monthly performance metrics
SELECT
  DATE_TRUNC('day', created_at) as date,
  entity_type,
  COUNT(*) as total_syncs,
  COUNT(*) FILTER (WHERE status = 'success') as successful,
  ROUND(AVG(EXTRACT(EPOCH FROM (created_at - created_at))) * 1000, 2) as avg_duration_ms
FROM zoho_sync_logs
WHERE created_at >= DATE_TRUNC('month', NOW())
GROUP BY DATE_TRUNC('day', created_at), entity_type
ORDER BY date DESC, entity_type;
```

#### 3. Cost Analysis

**Review ZOHO API usage**:
- API call volume
- Rate limit proximity
- Storage usage in ZOHO

**Optimize if needed**:
- Batch operations
- Reduce unnecessary syncs
- Implement caching

#### 4. Security Review

- [ ] Access tokens rotated (if using manual tokens)
- [ ] No exposed credentials in logs
- [ ] Sync log sensitive data reviewed
- [ ] RLS policies still enforced

---

## 📊 Monitoring Dashboard

### Admin Dashboard Access

**URL**: `http://localhost:3001/admin/zoho-sync` (or production URL)

**Authentication**: Requires active admin user session

### Dashboard Sections

#### 1. Overall Sync Health

**Metrics displayed**:
- Total entities (customers, services, invoices, payments)
- Synced entities (✅ with ZOHO ID)
- Pending syncs (⏳ waiting to sync)
- Failed syncs (❌ errors)

**Healthy Indicators**:
- Synced > 95% of total
- Pending < 5
- Failed = 0

#### 2. Sync Status by Entity Type

**4 cards showing**:
- Customers
- Subscriptions (Services)
- Invoices
- Payments

**Per card metrics**:
- Total count
- Synced count
- Success rate percentage

#### 3. Recent Sync Activity

**Table showing**:
- Timestamp
- Entity type
- Entity details (email, invoice #, etc.)
- Status (success/failed/pending)
- Error message (if failed)
- Retry button (if failed)

**Filters**:
- Entity type
- Status
- Time range

#### 4. Manual Actions

**Retry Failed Syncs**:
- Click retry button on individual failed sync
- Triggers background sync operation
- Shows success/failure notification

**Auto-refresh**: Dashboard refreshes every 30 seconds

---

## 🏥 Health Checks

### Automated Health Check Script

**Location**: `scripts/zoho-health-check.ts`

**Usage**:
```bash
# Standard check
npm run zoho:health-check

# Detailed output
npm run zoho:health-check --detailed

# Email-friendly format (for alerts)
npm run zoho:health-check --email
```

**NPM Script** (add to package.json):
```json
{
  "scripts": {
    "zoho:health-check": "npx tsx scripts/zoho-health-check.ts"
  }
}
```

### Health Check Components

#### 1. Database Sync Status
- Checks all entity types for sync status
- Identifies failed/pending syncs
- Reports total vs synced counts

#### 2. Recent Sync Activity (24h)
- Reviews sync logs from last 24 hours
- Calculates success rate
- Identifies patterns in failures

#### 3. ZOHO API Connectivity
- Tests token refresh
- Verifies organization access
- Confirms API read/write permissions

#### 4. Data Integrity
- Finds customers without ZOHO IDs
- Identifies orphaned subscriptions
- Detects stale failed syncs (>7 days)

### Health Status Levels

**✅ HEALTHY** (Exit code 0)
- All checks pass
- No warnings or failures
- System operating normally

**⚠️ DEGRADED** (Exit code 0)
- Some warnings present
- System functional but needs attention
- Schedule fixes within 24-48 hours

**❌ UNHEALTHY** (Exit code 1)
- Critical failures detected
- Immediate action required
- Follow incident response procedures

---

## 🚨 Incident Response

### Failed Sync Recovery

**Symptom**: Customers/services/invoices showing `zoho_sync_status = 'failed'`

**Quick Fix**:
1. Check error message in database or admin dashboard
2. Common errors and solutions:
   - **Rate limit**: Wait 10-15 minutes, retry
   - **Authentication**: Verify credentials in `.env.local`
   - **Data validation**: Check entity data completeness
   - **ZOHO API error**: Check ZOHO status page

3. Retry failed syncs:
```bash
npm run zoho:retry-failed
```

4. Verify success in admin dashboard

**Escalate if**:
- Retry fails 3+ times
- Error unknown/unclear
- Affects critical business operations

### ZOHO API Outage

**Symptom**: All syncs failing with API connectivity errors

**Immediate Actions**:
1. Check ZOHO status: https://status.zoho.com/
2. Verify credentials: `npx tsx scripts/verify-env-variables.ts`
3. Test API manually: `npm run zoho:health-check`

**Communication**:
- Notify team via Slack/Email
- Update status page if customer-facing
- Document incident timeline

**Recovery**:
- Wait for ZOHO service restoration
- Run health check after restoration
- Retry all failed syncs
- Verify data integrity

### Rate Limit Hit

**Symptom**: "Too many requests" error from ZOHO

**Immediate Actions**:
1. Stop all manual syncs/scripts
2. Wait 10-15 minutes for limit reset
3. Review recent activity for abnormal patterns

**Prevention**:
- Reduce batch sizes in scripts
- Increase delays between requests
- Implement exponential backoff
- Schedule heavy operations off-peak

**Long-term**:
- Request higher rate limits from ZOHO
- Implement local caching
- Optimize sync frequency

### Database Connection Issues

**Symptom**: Health check fails with database errors

**Immediate Actions**:
1. Check Supabase dashboard: https://supabase.com/dashboard
2. Verify database is online
3. Check connection limits
4. Review recent migrations

**Recovery**:
- Restart application if connection pool exhausted
- Check `.env.local` for correct credentials
- Review Supabase logs for errors

### Sync Stuck in "Syncing" State

**Symptom**: Records show `zoho_sync_status = 'syncing'` for >5 minutes

**Cause**: Process crashed during sync

**Fix**:
```sql
-- Reset stuck syncs to pending (will auto-retry)
UPDATE customers
SET zoho_sync_status = 'pending',
    updated_at = NOW()
WHERE zoho_sync_status = 'syncing'
  AND updated_at < NOW() - INTERVAL '5 minutes';

-- Same for other entities
UPDATE customer_services
SET zoho_sync_status = 'pending',
    updated_at = NOW()
WHERE zoho_sync_status = 'syncing'
  AND updated_at < NOW() - INTERVAL '5 minutes';

-- Repeat for invoices and payments
```

**Verify**: Syncs should auto-retry via triggers

---

## 🔧 Common Issues

### Issue 1: Customer Sync Failed - Invalid Email

**Error**: "Invalid email format" or "Email required"

**Solution**:
1. Check customer record in database
2. Verify email is valid format
3. Update email if needed:
```sql
UPDATE customers
SET email = 'valid@email.com',
    zoho_sync_status = 'pending'
WHERE id = 'customer-uuid';
```
4. Sync will auto-retry

### Issue 2: Subscription Sync Failed - Customer Not Synced

**Error**: "Customer not synced to ZOHO"

**Solution**:
1. Sync customer first:
```bash
npm run zoho:backfill:customers
```
2. Subscription will auto-sync after customer syncs

### Issue 3: Payment Sync Failed - Invoice Not Found

**Error**: "Invoice not found in ZOHO"

**Solution**:
1. Verify invoice is synced to ZOHO
2. Check `customer_invoices.zoho_billing_invoice_id`
3. Sync invoice first if missing:
```bash
npm run zoho:backfill:invoices
```
4. Retry payment sync

### Issue 4: Duplicate Customers in ZOHO

**Symptom**: Same customer appears multiple times in ZOHO

**Prevention**: Already handled - upsert logic checks by email

**Fix if occurs**:
1. Identify duplicates in ZOHO dashboard
2. Merge duplicates in ZOHO Billing
3. Update CircleTel records with correct ZOHO ID:
```sql
UPDATE customers
SET zoho_billing_customer_id = 'correct-zoho-id'
WHERE email = 'customer@email.com';
```

### Issue 5: Sync Logs Not Recording

**Symptom**: `zoho_sync_logs` table empty despite syncs

**Cause**: Constraint violation or logging error

**Fix**:
1. Check recent code changes to sync services
2. Verify `zoho_entity_type` values match constraint
3. Review application logs for logging errors
4. Test manually:
```typescript
await logZohoSync({
  entity_type: 'customer',
  entity_id: 'test-id',
  zoho_entity_type: 'Contacts', // Must match constraint
  status: 'success',
  // ...
});
```

---

## 📞 Escalation Procedures

### Level 1: Operations Team

**Handles**:
- Routine failures (<5 per day)
- Rate limit issues
- Retry operations
- Basic troubleshooting

**Contact**: operations@circletel.co.za
**Response Time**: 2 hours during business hours

### Level 2: Development Team

**Handles**:
- Complex sync issues
- API integration problems
- Code bugs
- Data integrity issues

**Contact**: dev@circletel.co.za
**Response Time**: 4 hours during business hours

### Level 3: ZOHO Support

**Handles**:
- ZOHO API issues
- Account/billing problems
- Service outages
- API limit increases

**Contact**: https://www.zoho.com/billing/support.html
**Response Time**: 24-48 hours

### Escalation Criteria

**Escalate to Level 2 if**:
- Issue persists after 3 retry attempts
- Affects >10 customers
- Unknown error messages
- Suspected code bug

**Escalate to Level 3 if**:
- ZOHO API consistently failing
- Rate limits too restrictive
- ZOHO-side data issues
- Account access problems

---

## 📝 Operations Checklist

### Daily (10 min)
- [ ] Run health check script
- [ ] Review admin dashboard
- [ ] Check for failed syncs (should be 0)
- [ ] Verify recent sync activity

### Weekly (30 min)
- [ ] Detailed health check with --detailed flag
- [ ] Review sync success rates
- [ ] Clean up stale failures
- [ ] Verify ZOHO dashboard matches database

### Monthly (1-2 hours)
- [ ] Full data reconciliation
- [ ] Performance metrics review
- [ ] Cost analysis
- [ ] Security audit
- [ ] Update documentation if needed

---

## 🔗 Quick Reference Links

**Dashboards**:
- CircleTel Admin: `http://localhost:3001/admin/zoho-sync`
- ZOHO Billing: https://billing.zoho.com/app/6179546000000027001
- Supabase: https://supabase.com/dashboard/project/agyjovdugmtopasyvlng

**Scripts**:
- Health Check: `npm run zoho:health-check`
- Retry Failed: `npm run zoho:retry-failed`
- Full Backfill: `npm run zoho:backfill`
- Individual Entities: `npm run zoho:backfill:customers/subscriptions/invoices/payments`

**Documentation**:
- Integration Summary: `docs/zoho/INTEGRATION_SUMMARY.md`
- Backfill Guide: `docs/zoho/BACKFILL_GUIDE.md`
- Troubleshooting: `docs/zoho/BACKFILL_GUIDE.md#troubleshooting`

**Support**:
- ZOHO Status: https://status.zoho.com/
- ZOHO Support: https://www.zoho.com/billing/support.html
- CircleTel Dev Team: dev@circletel.co.za

---

**Runbook Version**: 1.0
**Last Review**: 2025-11-20
**Next Review**: 2026-02-20 (quarterly)
**Owner**: Operations + Development Team
