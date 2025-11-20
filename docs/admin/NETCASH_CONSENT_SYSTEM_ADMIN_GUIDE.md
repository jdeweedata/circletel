# NetCash Consent System - System Administrator Guide

**Version:** 1.0
**Last Updated:** 2025-01-20
**Audience:** System Administrators, DevOps, Site Reliability Engineers

## Table of Contents

1. [System Overview](#system-overview)
2. [Deployment](#deployment)
3. [Configuration](#configuration)
4. [Monitoring](#monitoring)
5. [Maintenance](#maintenance)
6. [Backup & Recovery](#backup--recovery)
7. [Security](#security)
8. [Troubleshooting](#troubleshooting)
9. [Compliance](#compliance)

## System Overview

### What is the NetCash Consent System?

The NetCash Consent System ensures CircleTel complies with POPIA (Protection of Personal Information Act) and NetCash merchant obligations by capturing and logging customer consent for legal policies.

### Key Components

1. **Frontend:** React components for consent capture
2. **Backend:** Next.js API routes for consent logging
3. **Database:** Supabase PostgreSQL table (`payment_consents`)
4. **Storage:** Permanent audit trail with RLS security

### System Requirements

- **Node.js:** v18+ (for Next.js 15)
- **Database:** PostgreSQL 14+ (Supabase)
- **Memory:** 8GB heap for production builds
- **Storage:** ~10MB per 10,000 consent records

## Deployment

### Pre-Deployment Checklist

```bash
# 1. Verify environment variables
✓ NEXT_PUBLIC_SUPABASE_URL
✓ NEXT_PUBLIC_SUPABASE_ANON_KEY
✓ SUPABASE_SERVICE_ROLE_KEY
✓ NEXT_PUBLIC_BASE_URL

# 2. Verify database migration
✓ payment_consents table exists
✓ RLS policies are active
✓ Indexes are created

# 3. Verify policy pages are accessible
✓ /payment-terms returns 200
✓ /refund-policy returns 200
✓ /terms returns 200
✓ /privacy-policy returns 200

# 4. Run automated tests
✓ node scripts/test-consent-system.js passes
```

### Database Migration

**Location:** `supabase/migrations/20250120000001_create_payment_consents.sql`

**Apply via Supabase Dashboard:**

1. Go to: https://supabase.com/dashboard/project/agyjovdugmtopasyvlng
2. Navigate to SQL Editor
3. Paste migration SQL
4. Click "Run"
5. Verify: `SELECT COUNT(*) FROM payment_consents;`

**Apply via Supabase CLI:**

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login
npx supabase login

# Link project
npx supabase link --project-ref agyjovdugmtopasyvlng

# Push migration
npx supabase db push

# Verify
npx supabase db diff
```

**Verification Query:**

```sql
-- Check table exists
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'payment_consents';

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'payment_consents';

-- Check indexes exist
SELECT indexname
FROM pg_indexes
WHERE tablename = 'payment_consents';
```

Expected output:
- Table: `payment_consents` exists
- RLS: `rowsecurity = true`
- Indexes: 7 indexes created

### Application Deployment

**Vercel Deployment:**

```bash
# Deploy to staging
git push origin main:staging

# Verify staging works
curl -I https://circletel-staging.vercel.app/payment-terms

# Deploy to production
git push origin main

# Verify production
curl -I https://www.circletel.co.za/payment-terms
```

**Environment Variables (Vercel Dashboard):**

1. Go to: https://vercel.com/circltel/settings/environment-variables
2. Ensure these are set for Production:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_BASE_URL`

**Post-Deployment Verification:**

```bash
# 1. Check policy pages
curl -I https://www.circletel.co.za/payment-terms
curl -I https://www.circletel.co.za/refund-policy

# 2. Test consent logging (staging first!)
# Create a test payment and verify consent record appears in database

# 3. Check Vercel logs for errors
vercel logs --follow
```

## Configuration

### Policy Version Updates

When updating policy content, you MUST update the version:

**Step 1: Update Policy Page Content**
```bash
# Edit the policy file
code app/payment-terms/page.tsx
# Make your changes, commit
```

**Step 2: Update Policy Version**
```typescript
// File: lib/constants/policy-versions.ts
export const POLICY_VERSIONS = {
  PAYMENT_TERMS: '2025-02-15',  // NEW VERSION (was 2025-01-20)
  // ... other versions
} as const;
```

**Step 3: Deploy**
```bash
git add lib/constants/policy-versions.ts app/payment-terms/page.tsx
git commit -m "feat(legal): Update Payment Terms policy - v2025-02-15"
git push
```

**Step 4: Verify**
```sql
-- Check new consents use new version
SELECT
  payment_terms_version,
  COUNT(*) as count
FROM payment_consents
WHERE consent_timestamp >= NOW() - INTERVAL '1 hour'
GROUP BY payment_terms_version;
```

### RLS Policy Management

**View Current Policies:**
```sql
SELECT
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'payment_consents';
```

**Expected Policies:**
1. `Customers can view own consents` (SELECT)
2. `Service role can insert consents` (INSERT)
3. `Service role can update consents` (UPDATE)
4. `Admin users can view all consents` (SELECT)

**Add New Policy (Example: Allow delete for service role):**
```sql
CREATE POLICY "Service role can delete consents" ON payment_consents
  FOR DELETE
  USING (true);
```

**Disable/Enable RLS (Emergency Only):**
```sql
-- DISABLE (not recommended - only for emergency troubleshooting)
ALTER TABLE payment_consents DISABLE ROW LEVEL SECURITY;

-- RE-ENABLE (always re-enable after troubleshooting)
ALTER TABLE payment_consents ENABLE ROW LEVEL SECURITY;
```

### Index Management

**Check Index Usage:**
```sql
SELECT
  indexrelname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
AND relname = 'payment_consents'
ORDER BY idx_scan DESC;
```

**Add New Index (if needed):**
```sql
-- Example: Add composite index
CREATE INDEX idx_payment_consents_email_timestamp
ON payment_consents(customer_email, consent_timestamp DESC);
```

## Monitoring

### Key Metrics

**1. Consent Logging Success Rate**

Target: >99.5%

```sql
-- Check consent logs in last 24 hours
SELECT
  DATE_TRUNC('hour', consent_timestamp) as hour,
  COUNT(*) as total_consents,
  COUNT(DISTINCT customer_email) as unique_customers
FROM payment_consents
WHERE consent_timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', consent_timestamp)
ORDER BY hour DESC;
```

**2. Missing Consents (Payment Without Consent)**

Target: <0.1% of payments

```sql
-- Find payments without consent logs (created after consent system launch)
SELECT
  pt.transaction_id,
  pt.created_at,
  pt.amount,
  pt.status,
  co.email as customer_email
FROM payment_transactions pt
LEFT JOIN payment_consents pc ON pc.payment_transaction_id = pt.id
LEFT JOIN consumer_orders co ON co.id = pt.order_id
WHERE pt.created_at >= '2025-01-20'  -- Consent system launch date
AND pc.id IS NULL
AND pt.status IN ('pending', 'completed')
ORDER BY pt.created_at DESC
LIMIT 20;
```

**3. Policy Version Currency**

Target: 100% of new consents use current version

```sql
-- Check if all recent consents use current version
SELECT
  terms_version,
  privacy_version,
  payment_terms_version,
  refund_policy_version,
  COUNT(*) as count
FROM payment_consents
WHERE consent_timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY terms_version, privacy_version, payment_terms_version, refund_policy_version;
```

Expected: All rows show current versions (2025-01-20)

**4. B2B Consent Compliance**

Target: 100% of business quotes have B2B consents

```sql
-- Check B2B consents on recent quotes
SELECT
  quote_id,
  customer_email,
  data_processing_consent,
  third_party_disclosure_consent,
  business_verification_consent,
  consent_timestamp
FROM payment_consents
WHERE quote_id IS NOT NULL
AND consent_timestamp >= NOW() - INTERVAL '7 days'
AND (
  data_processing_consent = false
  OR third_party_disclosure_consent = false
  OR business_verification_consent = false
);
```

Expected: 0 rows (all B2B consents should be true)

### Alerting Setup

**Recommended Alerts:**

1. **High Missing Consent Rate**
   - Trigger: >5% of payments missing consent logs
   - Severity: High
   - Action: Check API logs, verify consent logging code

2. **Old Policy Version Usage**
   - Trigger: New consents using old policy version after update
   - Severity: Medium
   - Action: Verify deployment, check policy-versions.ts

3. **Database Connection Failures**
   - Trigger: Consent logging errors spike
   - Severity: Critical
   - Action: Check Supabase status, verify service role key

4. **RLS Policy Violations**
   - Trigger: Unauthorized access attempts
   - Severity: High
   - Action: Review RLS policies, check for security issues

### Log Monitoring

**Application Logs (Vercel):**

```bash
# Real-time logs
vercel logs --follow

# Filter for consent-related logs
vercel logs --follow | grep -i consent

# Check for errors
vercel logs --follow | grep -i error
```

**Look for:**
- ✅ "Payment consents logged successfully"
- ⚠️ "Failed to log payment consents"
- ❌ "Exception in logPaymentConsents"

**Database Logs (Supabase Dashboard):**

1. Go to: https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/logs
2. Select "Database" logs
3. Filter by table: `payment_consents`
4. Look for:
   - INSERT statements
   - RLS policy violations
   - Performance issues

### Performance Monitoring

**Query Performance:**

```sql
-- Check slow queries on payment_consents table
SELECT
  calls,
  total_time,
  mean_time,
  query
FROM pg_stat_statements
WHERE query LIKE '%payment_consents%'
ORDER BY mean_time DESC
LIMIT 10;
```

**Table Size:**

```sql
-- Check table size and growth
SELECT
  pg_size_pretty(pg_total_relation_size('payment_consents')) as total_size,
  pg_size_pretty(pg_relation_size('payment_consents')) as table_size,
  pg_size_pretty(pg_total_relation_size('payment_consents') - pg_relation_size('payment_consents')) as index_size;
```

**Index Usage:**

```sql
-- Verify indexes are being used
SELECT
  indexrelname,
  idx_scan,
  idx_tup_read
FROM pg_stat_user_indexes
WHERE relname = 'payment_consents'
ORDER BY idx_scan DESC;
```

## Maintenance

### Regular Tasks

**Daily:**
- [ ] Check consent logging success rate (should be >99%)
- [ ] Review error logs for consent-related issues
- [ ] Verify policy pages are accessible

**Weekly:**
- [ ] Review missing consent reports
- [ ] Check database growth and performance
- [ ] Verify policy versions are current

**Monthly:**
- [ ] Generate compliance reports
- [ ] Review RLS policies for security
- [ ] Analyze consent data for trends
- [ ] Archive old logs (if needed)

**Quarterly:**
- [ ] Review policy content with legal team
- [ ] Update policy versions if policies changed
- [ ] Performance optimization review
- [ ] Security audit of consent system

### Database Maintenance

**Vacuum (Recommended Monthly):**

```sql
-- Analyze table statistics
ANALYZE payment_consents;

-- Vacuum to reclaim space (if needed)
VACUUM ANALYZE payment_consents;
```

**Re-index (Only if performance issues):**

```sql
-- Re-build all indexes
REINDEX TABLE payment_consents;
```

**Check Table Bloat:**

```sql
-- Check for bloat
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  n_tup_ins,
  n_tup_upd,
  n_tup_del,
  n_live_tup,
  n_dead_tup
FROM pg_stat_user_tables
WHERE tablename = 'payment_consents';
```

### Policy Updates

When policies need updating:

**1. Update Policy Content:**
```bash
# Edit policy file
code app/payment-terms/page.tsx
```

**2. Update Version:**
```typescript
// lib/constants/policy-versions.ts
export const POLICY_VERSIONS = {
  PAYMENT_TERMS: '2025-MM-DD',  // New version
}
```

**3. Deploy:**
```bash
git add .
git commit -m "feat(legal): Update Payment Terms policy"
git push
```

**4. Verify:**
```sql
SELECT payment_terms_version, COUNT(*)
FROM payment_consents
WHERE consent_timestamp >= NOW() - INTERVAL '1 hour'
GROUP BY payment_terms_version;
```

**5. Notify Customers (if required by law):**
- Send email notification of material changes
- Allow opt-out period if required
- Update customer dashboard with policy change notice

## Backup & Recovery

### Database Backup

**Supabase Automatic Backups:**
- Daily backups retained for 7 days (Free tier)
- Point-in-time recovery available (Pro tier)

**Manual Backup:**

```bash
# Export payment_consents table
npx supabase db dump --table payment_consents > backup_payment_consents_$(date +%Y%m%d).sql

# Upload to secure storage
aws s3 cp backup_payment_consents_*.sql s3://circletel-backups/consents/
```

**Backup Schedule:**
- **Daily:** Automatic Supabase backups
- **Weekly:** Manual export to S3
- **Monthly:** Full database dump

### Recovery Procedures

**Scenario 1: Accidental Data Deletion**

```sql
-- Restore from Supabase backup
-- 1. Go to Supabase Dashboard > Database > Backups
-- 2. Select backup before deletion
-- 3. Click "Restore"
```

**Scenario 2: Data Corruption**

```sql
-- Restore from manual backup
psql -h db.agyjovdugmtopasyvlng.supabase.co \
     -U postgres \
     -d postgres \
     < backup_payment_consents_20250120.sql
```

**Scenario 3: Complete Table Loss**

```bash
# 1. Re-run migration
npx supabase db push

# 2. Restore data from backup
psql ... < backup_payment_consents_latest.sql

# 3. Verify data integrity
# 4. Re-enable RLS policies
```

### Disaster Recovery Plan

**RTO (Recovery Time Objective):** 4 hours
**RPO (Recovery Point Objective):** 24 hours

**Steps:**

1. **Assess Damage:**
   - Identify what was lost
   - Determine last good backup

2. **Restore Database:**
   - Use Supabase backup or manual backup
   - Verify table structure and data

3. **Restore Application:**
   - Redeploy from git if needed
   - Verify environment variables

4. **Verify Functionality:**
   - Test payment flow
   - Test consent logging
   - Verify policy pages

5. **Monitor:**
   - Watch logs for 24 hours
   - Verify consent logging resumes

## Security

### Access Control

**Database Access:**
- **Service Role:** Full access (used by API)
- **Anon Key:** RLS-restricted access (used by client)
- **Admin Users:** Read-only via RLS policy
- **Customers:** Read own consents only

**Vercel Access:**
- **Admins:** Full deployment access
- **Developers:** Preview deployments only
- **Support:** Read-only log access

### Audit Logging

**What is Logged:**
- Customer IP address
- User-Agent (browser/device)
- Consent timestamp (UTC)
- Policy versions accepted
- Transaction references

**Audit Trail Queries:**

```sql
-- View recent consent activity
SELECT
  customer_email,
  consent_timestamp,
  ip_address,
  consent_type,
  terms_accepted,
  privacy_accepted
FROM payment_consents
ORDER BY consent_timestamp DESC
LIMIT 50;

-- Find consents from specific IP
SELECT *
FROM payment_consents
WHERE ip_address = '1.2.3.4'
ORDER BY consent_timestamp DESC;

-- Find all consents for customer
SELECT *
FROM payment_consents
WHERE customer_email = 'customer@example.com'
ORDER BY consent_timestamp DESC;
```

### Security Best Practices

**1. Protect Service Role Key:**
```bash
# NEVER commit service role key to git
# NEVER log service role key
# NEVER share service role key
# Store in Vercel environment variables only
```

**2. Monitor RLS Policy Violations:**
```sql
-- Check Supabase logs for RLS violations
-- Dashboard > Logs > Database
-- Filter for "permission denied"
```

**3. Regular Security Audits:**
- Review RLS policies quarterly
- Check for unauthorized access attempts
- Verify environment variables are secure
- Update dependencies regularly

**4. Incident Response:**
- Document security incidents
- Review and update security procedures
- Notify affected customers if required by law

## Troubleshooting

### Common Issues

#### Issue 1: Consents Not Being Logged

**Symptoms:**
- Payments succeed but no consent records
- API logs show "Failed to log payment consents"

**Diagnosis:**
```sql
-- Check if table exists
SELECT * FROM payment_consents LIMIT 1;

-- Check RLS policies
SELECT policyname FROM pg_policies WHERE tablename = 'payment_consents';
```

**Solutions:**
1. Verify service role key is configured in Vercel
2. Check RLS INSERT policy exists
3. Verify API is calling `logPaymentConsents()`
4. Check Supabase logs for detailed error

#### Issue 2: RLS Policy Violations

**Symptoms:**
- "permission denied for table payment_consents"
- Customers cannot view their consents

**Diagnosis:**
```sql
-- Check current user
SELECT current_user;

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'payment_consents';

-- Test policy
SET ROLE authenticated;
SELECT * FROM payment_consents WHERE customer_email = 'test@example.com';
```

**Solutions:**
1. Verify RLS policies are created correctly
2. Check admin_users table has correct email
3. Verify customer auth token is valid
4. Re-create RLS policies if needed

#### Issue 3: Old Policy Versions

**Symptoms:**
- New consents use old policy versions
- Version mismatch warnings

**Diagnosis:**
```typescript
// Check policy-versions.ts
import { POLICY_VERSIONS } from '@/lib/constants/policy-versions';
console.log('Current versions:', POLICY_VERSIONS);
```

**Solutions:**
1. Update POLICY_VERSIONS in code
2. Redeploy application
3. Clear CDN cache if needed
4. Verify new consents use new version

#### Issue 4: Performance Issues

**Symptoms:**
- Slow consent logging
- Database timeout errors

**Diagnosis:**
```sql
-- Check table size
SELECT pg_size_pretty(pg_total_relation_size('payment_consents'));

-- Check slow queries
SELECT * FROM pg_stat_statements WHERE query LIKE '%payment_consents%' ORDER BY mean_time DESC LIMIT 5;

-- Check index usage
SELECT * FROM pg_stat_user_indexes WHERE relname = 'payment_consents';
```

**Solutions:**
1. Run ANALYZE on table
2. Verify indexes exist and are used
3. Consider partitioning if table is huge (>10M rows)
4. Upgrade Supabase plan if needed

### Emergency Procedures

**Procedure 1: Disable Consent Validation (Temporary)**

If consent system is blocking payments:

```typescript
// Temporarily comment out validation
// File: components/checkout/InlinePaymentForm.tsx
const validateForm = (): boolean => {
  // ... other validation ...

  // TEMPORARY: Skip consent validation
  // const consentValidation = validateConsents(formData.consents);
  // setConsentErrors(consentValidation.errors);
  // return formFieldsValid && consentValidation.valid;

  return formFieldsValid;  // Allow payments without consents temporarily
};
```

**⚠️ WARNING:** This must be temporary only. Re-enable ASAP.

**Procedure 2: Bypass Consent Logging**

If consent logging is causing payment failures:

```typescript
// Temporarily wrap in try-catch
try {
  await logPaymentConsents({ ... });
} catch (error) {
  console.error('Consent logging failed, continuing anyway:', error);
  // Continue with payment - don't block customer
}
```

**Procedure 3: Emergency Rollback**

```bash
# Revert to last working version
git revert HEAD
git push

# Or rollback in Vercel Dashboard
# Vercel Dashboard > Deployments > Previous Deployment > Promote
```

## Compliance

### POPIA Compliance Checklist

- [x] Explicit consent captured for all data processing
- [x] Purpose of data processing is clear
- [x] Third-party disclosure is explicitly consented
- [x] Audit trail maintained
- [x] Customer can view their consent history (planned)
- [x] Data retained as required by law
- [x] Security measures in place

### NetCash Compliance Checklist

- [x] Payment terms displayed before payment
- [x] PCI DSS compliance maintained
- [x] Refund policy acknowledged
- [x] Customer data protection measures
- [x] Audit trail for all transactions

### Regulatory Reporting

**Monthly Compliance Report:**

```sql
-- Generate compliance metrics
SELECT
  DATE_TRUNC('month', consent_timestamp) as month,
  COUNT(*) as total_consents,
  COUNT(DISTINCT customer_email) as unique_customers,
  COUNT(*) FILTER (WHERE terms_accepted = true) as terms_accepted_count,
  COUNT(*) FILTER (WHERE privacy_accepted = true) as privacy_accepted_count,
  COUNT(*) FILTER (WHERE marketing_consent = true) as marketing_opt_ins
FROM payment_consents
WHERE consent_timestamp >= NOW() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', consent_timestamp)
ORDER BY month DESC;
```

**Export for Audit:**

```sql
-- Export all consents for audit
COPY (
  SELECT
    customer_email,
    consent_type,
    terms_version,
    privacy_version,
    payment_terms_version,
    terms_accepted,
    privacy_accepted,
    payment_terms_accepted,
    consent_timestamp
  FROM payment_consents
  WHERE consent_timestamp BETWEEN '2025-01-01' AND '2025-12-31'
)
TO '/tmp/consent_audit_2025.csv'
WITH CSV HEADER;
```

## Support Contacts

**Technical Issues:**
- Developer Team: developers@circletel.co.za
- System Admin: admin@circletel.co.za

**Compliance Issues:**
- Legal Team: legal@circletel.co.za
- Compliance Officer: compliance@circletel.co.za

**Vendor Support:**
- Supabase: https://supabase.com/support
- Vercel: https://vercel.com/support
- NetCash: support@netcash.co.za

## Additional Resources

- **Developer Guide:** `/docs/developers/NETCASH_CONSENT_SYSTEM_DEVELOPER_GUIDE.md`
- **Legal Guide:** `/docs/legal/NETCASH_LEGAL_COMPLIANCE.md`
- **Supabase Docs:** https://supabase.com/docs
- **POPIA Guidelines:** https://popia.co.za/

---

**Maintained By:** CircleTel System Administration Team
**Last Updated:** 2025-01-20
**Version:** 1.0
**Review Cycle:** Quarterly
