# B2B Quote-to-Contract Workflow - Deployment Checklist
## Production Readiness Verification

**Version**: 1.0  
**Date**: 2025-11-01  
**Spec**: `agent-os/specs/20251101-b2b-quote-to-contract-kyc/`

---

## 📋 Pre-Deployment Checklist

### 1. Database Migrations ✅

- [ ] **Review all migrations** in `supabase/migrations/`:
  ```bash
  # List migrations
  ls -la supabase/migrations/2025110*.sql
  
  # Expected files:
  # - 20251101000001_create_kyc_system.sql
  # - 20251102000001_create_contracts_system.sql
  # - 20251103000001_create_zoho_sync_system.sql
  # - 20251104000001_create_invoicing_system.sql
  # - 20251105000001_create_fulfillment_system.sql
  # - 20251101120000_add_payment_webhooks_idempotency.sql
  ```

- [ ] **Apply migrations** to staging database:
  ```bash
  supabase db push --project-ref <staging-project-ref>
  ```

- [ ] **Verify tables created**:
  ```sql
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN (
    'kyc_sessions',
    'contracts',
    'invoices',
    'payment_transactions',
    'billing_cycles',
    'rica_submissions',
    'installation_schedules',
    'payment_webhooks'
  );
  ```

- [ ] **Verify RLS policies enabled**:
  ```sql
  SELECT tablename, rowsecurity FROM pg_tables 
  WHERE schemaname = 'public' 
  AND tablename LIKE 'kyc%' OR tablename LIKE 'contract%';
  -- All should have rowsecurity = true
  ```

- [ ] **Backup production database** before applying migrations:
  ```bash
  pg_dump -h db.agyjovdugmtopasyvlng.supabase.co \
          -U postgres \
          -d postgres > backup_$(date +%Y%m%d_%H%M%S).sql
  ```

---

### 2. Environment Variables 🔐

**Critical Variables** (Must be set):

#### A. Didit KYC
- [ ] `DIDIT_API_KEY` - API key from Didit dashboard
- [ ] `DIDIT_API_SECRET` - API secret from Didit dashboard
- [ ] `DIDIT_WEBHOOK_SECRET` - Generated with `openssl rand -hex 32`
- [ ] `NEXT_PUBLIC_DIDIT_ENVIRONMENT` - Set to `production`

#### B. Zoho Sign
- [ ] `ZOHO_SIGN_CLIENT_ID` - OAuth client ID
- [ ] `ZOHO_SIGN_CLIENT_SECRET` - OAuth client secret
- [ ] `ZOHO_SIGN_REFRESH_TOKEN` - OAuth refresh token
- [ ] `ZOHO_SIGN_WEBHOOK_SECRET` - Generated with `openssl rand -hex 32`

#### C. Zoho CRM
- [ ] `ZOHO_CRM_CLIENT_ID` - OAuth client ID
- [ ] `ZOHO_CRM_CLIENT_SECRET` - OAuth client secret
- [ ] `ZOHO_CRM_REFRESH_TOKEN` - OAuth refresh token
- [ ] `ZOHO_CRM_ORG_ID` - Organization ID from Zoho
- [ ] `ZOHO_CRM_WEBHOOK_SECRET` - Generated with `openssl rand -hex 32`

#### D. ICASA RICA
- [ ] `ICASA_API_KEY` - API key from ICASA portal
- [ ] `ICASA_API_SECRET` - API secret from ICASA portal
- [ ] `ICASA_WEBHOOK_SECRET` - Generated with `openssl rand -hex 32`
- [ ] `NEXT_PUBLIC_ICASA_ENVIRONMENT` - Set to `production`

#### E. Resend Email
- [ ] `RESEND_API_KEY` - API key from resend.com
- [ ] `NEXT_PUBLIC_APP_URL` - Production URL (e.g., `https://circletel.co.za`)

#### F. NetCash Payments
- [ ] `NETCASH_SERVICE_KEY` - Production service key
- [ ] `NETCASH_MERCHANT_ID` - Merchant ID
- [ ] `NETCASH_WEBHOOK_SECRET` - Generated with `openssl rand -hex 32`

**Verify all secrets set**:
```bash
# Vercel CLI
vercel env ls

# Or check Vercel dashboard
# Settings → Environment Variables
```

---

### 3. External Service Configuration 🔧

#### A. Didit Dashboard
- [ ] Login: https://dashboard.didit.me/
- [ ] Navigate to **Settings** → **Webhooks**
- [ ] Add webhook:
  - URL: `https://circletel.co.za/api/compliance/webhook/didit`
  - Secret: Value from `DIDIT_WEBHOOK_SECRET`
  - Events: All (completed, failed, abandoned, expired)
- [ ] Test webhook connectivity
- [ ] Verify sandbox → production environment switched

#### B. Zoho Sign
- [ ] Login: https://sign.zoho.com/
- [ ] Navigate to **API** → **Settings**
- [ ] Verify OAuth app configured:
  - Redirect URI: `https://circletel.co.za/api/auth/zoho/callback`
  - Scopes: `ZohoSign.documents.ALL`, `ZohoSign.webhooks.CREATE`
- [ ] Generate production refresh token
- [ ] Test signature request creation

#### C. Zoho CRM
- [ ] Login: https://crm.zoho.com/
- [ ] Navigate to **Setup** → **Developer Space** → **APIs** → **API Names**
- [ ] Verify custom fields exist:
  - `KYC_Status` (Picklist: Pending, Approved, Rejected, Under Review)
  - `Risk_Tier` (Picklist: Low, Medium, High)
  - `RICA_Status` (Picklist: Pending, Submitted, Approved, Rejected)
  - `Contract_Number` (Text)
  - `Invoice_Number` (Text)
  - `MRR` (Currency)
- [ ] Test CRM sync with test lead

#### D. NetCash Merchant Portal
- [ ] Login: https://merchant.netcash.co.za/
- [ ] Navigate to **Settings** → **Webhooks**
- [ ] Add webhook:
  - URL: `https://circletel.co.za/api/payments/webhook`
  - Secret: Value from `NETCASH_WEBHOOK_SECRET`
  - Events: Payment Completed, Failed, Pending
- [ ] Configure IP whitelisting:
  - `196.38.180.0/24`
  - `41.185.8.0/24`
- [ ] Test payment processing (R1 test payment)

#### E. ICASA RICA Portal
- [ ] Login: https://www.icasa.org.za/
- [ ] Navigate to **API Settings** → **Webhooks**
- [ ] Add webhook:
  - URL: `https://circletel.co.za/api/activation/rica-webhook`
  - Secret: Value from `ICASA_WEBHOOK_SECRET`
  - Environment: Production
- [ ] Verify operator credentials active
- [ ] Test RICA submission (manual test)

#### F. Resend Email
- [ ] Login: https://resend.com/
- [ ] Navigate to **Domains**
- [ ] Add domain: `circletel.co.za`
- [ ] Add DNS records:
  - SPF: `v=spf1 include:resend.com ~all`
  - DKIM: (provided by Resend)
  - DMARC: `v=DMARC1; p=none; rua=mailto:dmarc@circletel.co.za`
- [ ] Verify domain ownership
- [ ] Test email sending (to team email)

---

### 4. Supabase Storage Buckets 📦

- [ ] **Create storage buckets**:
  ```sql
  -- Contract documents bucket
  INSERT INTO storage.buckets (id, name, public) 
  VALUES ('contract-documents', 'contract-documents', false);
  
  -- KYC documents bucket (if needed)
  INSERT INTO storage.buckets (id, name, public) 
  VALUES ('kyc-documents', 'kyc-documents', false);
  ```

- [ ] **Configure RLS policies** for buckets:
  ```sql
  -- Admins can access all contract documents
  CREATE POLICY "Admin access to contracts" ON storage.objects
  FOR ALL USING (
    bucket_id = 'contract-documents' AND
    (SELECT is_admin FROM admin_users WHERE id = auth.uid())
  );
  
  -- Customers can view their own contracts
  CREATE POLICY "Customer access to own contracts" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'contract-documents' AND
    (SELECT 1 FROM contracts WHERE contracts.id::text = storage.objects.name 
     AND contracts.quote_id IN (
       SELECT id FROM business_quotes WHERE contact_email = (SELECT email FROM auth.users WHERE id = auth.uid())
     ))
  );
  ```

- [ ] **Test file upload/download**:
  ```typescript
  const { data, error } = await supabase.storage
    .from('contract-documents')
    .upload('test.pdf', pdfBuffer);
  ```

---

### 5. Testing 🧪

#### A. Unit Tests
- [ ] **Run all unit tests**:
  ```bash
  npm run test
  
  # Expected passing tests:
  # - Payment webhook tests (19 tests)
  # - RICA submission tests (22 tests)
  # - Activation tests (26 tests)
  # - Payment flow tests (20 tests)
  # Total: 87 tests
  ```

#### B. E2E Tests
- [ ] **Run E2E tests on staging**:
  ```bash
  # Set staging URL
  export PLAYWRIGHT_BASE_URL=https://staging.circletel.co.za
  
  # Run E2E tests
  npm run test:e2e -- tests/e2e/b2b-quote-to-contract-full-flow.spec.ts
  npm run test:e2e -- tests/e2e/high-risk-kyc-manual-review.spec.ts
  ```

- [ ] **Verify all 13 happy path steps pass**
- [ ] **Verify all 11 high-risk KYC steps pass**

#### C. Integration Tests
- [ ] **Test external integrations**:
  - [ ] Didit KYC: Create test session, complete verification
  - [ ] Zoho Sign: Create test signature request, sign document
  - [ ] NetCash: Process test payment (R1.00)
  - [ ] ICASA: Submit test RICA (if test environment available)
  - [ ] Resend: Send test email to team

#### D. Manual Testing
- [ ] **Complete full workflow manually**:
  1. Admin creates quote → Manager approves
  2. Customer completes KYC verification
  3. Contract auto-generated → Customer signs
  4. Invoice created → Payment processed
  5. Order created → RICA submitted
  6. RICA approved → Service activated
  7. Customer receives credentials email

- [ ] **Test high-risk KYC scenario**:
  1. Submit KYC with low liveness score
  2. Verify appears in admin compliance queue
  3. Admin reviews risk breakdown
  4. Admin requests additional info
  5. Admin manually approves with notes
  6. Workflow continues

---

### 6. Monitoring & Alerting 📊

#### A. Vercel Monitoring
- [ ] **Enable Vercel Analytics**:
  - Navigate to project → Analytics
  - Enable Web Analytics
  - Enable Speed Insights

- [ ] **Configure Log Drains**:
  ```bash
  vercel integrations add datadog
  # Or Sentry, LogDNA, etc.
  ```

- [ ] **Setup Error Tracking**:
  ```typescript
  // lib/monitoring/sentry.ts
  import * as Sentry from '@sentry/nextjs';
  
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
  });
  ```

#### B. Supabase Monitoring
- [ ] **Enable Query Performance Insights**:
  - Supabase Dashboard → Performance
  - Enable Query Performance
  - Set alert threshold: queries > 1s

- [ ] **Configure Database Alerts**:
  - Disk usage > 80%
  - Connection count > 90% of limit
  - Replication lag > 1 minute

#### C. Webhook Monitoring
- [ ] **Setup webhook failure alerts**:
  ```typescript
  // lib/monitoring/webhook-alerts.ts
  export async function alertWebhookFailure(
    service: string,
    error: Error,
    payload: any
  ) {
    // Slack alert
    await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      body: JSON.stringify({
        text: `🚨 Webhook failure: ${service}`,
        attachments: [{
          color: 'danger',
          fields: [
            { title: 'Service', value: service, short: true },
            { title: 'Error', value: error.message, short: false }
          ]
        }]
      })
    });
  }
  ```

- [ ] **Monitor webhook success rates**:
  ```sql
  -- Daily webhook stats
  SELECT 
    DATE(processed_at) as date,
    event_type,
    COUNT(*) as total_webhooks,
    COUNT(CASE WHEN error IS NULL THEN 1 END) as successful,
    COUNT(CASE WHEN error IS NOT NULL THEN 1 END) as failed
  FROM payment_webhooks
  WHERE processed_at > NOW() - INTERVAL '7 days'
  GROUP BY DATE(processed_at), event_type
  ORDER BY date DESC;
  ```

#### D. Email Monitoring
- [ ] **Setup Resend webhook** for email events:
  - Webhook URL: `https://circletel.co.za/api/emails/webhook/resend`
  - Events: delivered, bounced, complained, opened, clicked

- [ ] **Monitor email deliverability**:
  - Bounce rate < 2%
  - Complaint rate < 0.1%
  - Open rate > 20%

#### E. Business Metrics
- [ ] **Setup dashboard for key metrics**:
  - Quotes created per day
  - KYC completion rate
  - Contract signature rate
  - Payment success rate
  - RICA approval rate
  - Time-to-activation (average)

---

### 7. Security Hardening 🔒

- [ ] **Verify all API routes use authentication**:
  ```typescript
  // Check all routes have auth
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  ```

- [ ] **Enable rate limiting** (Vercel Pro):
  ```typescript
  // vercel.json
  {
    "functions": {
      "api/**/*.ts": {
        "maxDuration": 30,
        "memory": 1024
      }
    }
  }
  ```

- [ ] **Configure CORS** for API routes:
  ```typescript
  const allowedOrigins = [
    'https://circletel.co.za',
    'https://www.circletel.co.za'
  ];
  ```

- [ ] **Enable CSP headers**:
  ```typescript
  // next.config.js
  headers: [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline';"
        }
      ]
    }
  ]
  ```

- [ ] **Verify secrets not exposed**:
  ```bash
  # Search for accidental secret commits
  git log -p | grep -i "api_key\|secret\|password"
  
  # Should return no results
  ```

---

### 8. Documentation 📚

- [ ] **Update README.md** with B2B workflow section
- [ ] **Create admin user guide**:
  - How to review high-risk KYC
  - How to manually approve/decline
  - How to view audit trail
  - How to handle failed RICA submissions

- [ ] **Create customer FAQ**:
  - What is KYC verification?
  - How long does KYC take?
  - What documents do I need?
  - How do I sign the contract?
  - When will my service activate?

- [ ] **Document rollback procedures**:
  - Database rollback steps
  - How to disable workflow
  - Emergency contacts

---

### 9. Deployment Steps 🚀

#### A. Staging Deployment
- [ ] **Deploy to staging**:
  ```bash
  git checkout main
  git pull origin main
  vercel --prod --env staging
  ```

- [ ] **Run smoke tests on staging**
- [ ] **Verify all integrations working**
- [ ] **Get stakeholder sign-off**

#### B. Production Deployment
- [ ] **Create deployment branch**:
  ```bash
  git checkout -b deploy/b2b-workflow-v1
  git push origin deploy/b2b-workflow-v1
  ```

- [ ] **Tag release**:
  ```bash
  git tag -a v1.0.0-b2b-workflow -m "B2B Quote-to-Contract Workflow v1.0"
  git push origin v1.0.0-b2b-workflow
  ```

- [ ] **Apply database migrations** (with backup):
  ```bash
  # Backup
  pg_dump ... > backup_pre_b2b_workflow.sql
  
  # Apply migrations
  supabase db push --project-ref agyjovdugmtopasyvlng
  ```

- [ ] **Deploy to production**:
  ```bash
  vercel --prod
  ```

- [ ] **Verify deployment**:
  - [ ] Check Vercel deployment logs
  - [ ] Check application loads
  - [ ] Check database connectivity
  - [ ] Check webhook endpoints responding

#### C. Post-Deployment
- [ ] **Monitor for 1 hour** after deployment:
  - Error rates
  - Response times
  - Webhook success rates
  - Database query performance

- [ ] **Send test quote through full workflow**

- [ ] **Notify team of successful deployment**:
  ```
  Subject: B2B Quote-to-Contract Workflow Deployed ✅
  
  The B2B workflow is now live in production!
  
  Key changes:
  - Automated KYC verification with Didit
  - Digital contract signing with Zoho Sign
  - Automated RICA submission to ICASA
  - Email notifications at each stage
  
  Monitoring dashboard: https://vercel.com/circletel/analytics
  Support: devops@circletel.co.za
  ```

---

### 10. Rollback Plan 🔄

**If critical issues detected**:

1. **Immediate rollback**:
   ```bash
   # Revert to previous deployment
   vercel rollback
   ```

2. **Disable B2B workflow** (feature flag):
   ```bash
   vercel env add ENABLE_B2B_WORKFLOW=false production
   ```

3. **Database rollback** (if migrations applied):
   ```bash
   # Restore from backup
   psql -h db.agyjovdugmtopasyvlng.supabase.co \
        -U postgres \
        -d postgres < backup_pre_b2b_workflow.sql
   ```

4. **Disable webhooks** in external services:
   - Didit, Zoho Sign, NetCash, ICASA dashboards
   - Remove or disable webhook URLs

5. **Notify stakeholders**:
   - Sales team
   - Customer support
   - Management

---

## ✅ Sign-Off

**Before deploying to production, get sign-off from**:

- [ ] **Technical Lead**: Code review complete, tests passing
- [ ] **DevOps**: Infrastructure ready, monitoring configured
- [ ] **Product Manager**: Features match requirements
- [ ] **Compliance**: KYC/RICA integration approved
- [ ] **Sales Manager**: Team trained on new workflow

---

## 📞 Support Contacts

**Technical Issues**:
- DevOps Team: devops@circletel.co.za
- On-Call: +27 82 XXX XXXX

**Business Issues**:
- Sales Manager: sales@circletel.co.za
- Compliance: compliance@circletel.co.za

**External Service Support**:
- Didit: support@didit.me
- Zoho: support@zohocorp.com
- NetCash: support@netcash.co.za
- ICASA: rica-support@icasa.org.za

---

**Deployment Checklist Version**: 1.0  
**Last Updated**: 2025-11-01  
**Next Review**: 2025-12-01
