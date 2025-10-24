# Netcash Webhook Migration to CircleTel Direct Integration

**Date:** 2025-10-22
**Migration Type:** AgilityGIS Gateway → CircleTel Direct
**Status:** Ready for Production

---

## Overview

This guide provides the exact webhook URLs to configure in Netcash for the CircleTel direct integration, replacing the current AgilityGIS gateway.

---

## Webhook URLs to Configure

### Test Account: Circle Tel SA - Test account (52340889417)

**Current (AgilityGIS Gateway):**
```
Accept URL: https://integration-staging.agilitygis.com/api/paymentgateway/webhook/netcash/paynow/accepted
Decline URL: https://integration-staging.agilitygis.com/api/paymentgateway/webhook/netcash/paynow/rejected
Notify URL: https://integration-staging.agilitygis.com/api/paymentgateway/webhook/netcash/notify
```

**New (CircleTel Direct Integration):**

#### For Vercel Staging Environment:
```
Accept URL: https://circletel-nextjs-staging.vercel.app/api/payment/netcash/webhook
Decline URL: https://circletel-nextjs-staging.vercel.app/api/payment/netcash/webhook
Notify URL: https://circletel-nextjs-staging.vercel.app/api/payment/netcash/webhook
```

#### For Local Development:
```
Accept URL: https://your-ngrok-url.ngrok.io/api/payment/netcash/webhook
Decline URL: https://your-ngrok-url.ngrok.io/api/payment/netcash/webhook
Notify URL: https://your-ngrok-url.ngrok.io/api/payment/netcash/webhook
```

**Note:** All three URLs point to the same endpoint. The CircleTel webhook handler processes all payment statuses (approved, declined, cancelled) through a single unified endpoint.

---

### Production Account: Circle Tel SA (52552945156)

**Current (AgilityGIS Gateway):**
```
Accept URL: https://integration.agilitygis.com/api/paymentgateway/webhook/netcash/paynow/accepted
Decline URL: https://integration.agilitygis.com/api/paymentgateway/webhook/netcash/paynow/rejected
Notify URL: https://integration.agilitygis.com/api/paymentgateway/webhook/netcash/notify
```

**New (CircleTel Direct Integration):**
```
Accept URL: https://circletel.co.za/api/payment/netcash/webhook
Decline URL: https://circletel.co.za/api/payment/netcash/webhook
Notify URL: https://circletel.co.za/api/payment/netcash/webhook
```

**Alternative (Vercel Production):**
```
Accept URL: https://circletel-nextjs.vercel.app/api/payment/netcash/webhook
Decline URL: https://circletel-nextjs.vercel.app/api/payment/netcash/webhook
Notify URL: https://circletel-nextjs.vercel.app/api/payment/netcash/webhook
```

---

## Configuration Steps

### Step 1: Update Environment Variables

#### Staging Environment (.env.staging)
```env
# Netcash Configuration
NETCASH_WEBHOOK_SECRET=<generate-strong-32-char-secret>
NETCASH_MERCHANT_ID=52340889417
NETCASH_MERCHANT_KEY=<test-merchant-key>
NETCASH_SERVICE_KEY=<test-service-key>

# Environment
NODE_ENV=staging
NEXT_PUBLIC_APP_URL=https://circletel-nextjs-staging.vercel.app
```

#### Production Environment (.env.production)
```env
# Netcash Configuration
NETCASH_WEBHOOK_SECRET=<generate-different-strong-secret>
NETCASH_MERCHANT_ID=52552945156
NETCASH_MERCHANT_KEY=<production-merchant-key>
NETCASH_SERVICE_KEY=<production-service-key>

# Environment
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://circletel.co.za
```

**Generate Webhook Secrets:**
```bash
# Generate secure random secret (32 characters)
openssl rand -base64 32
```

---

### Step 2: Update Netcash Portal (Test Account)

1. **Login to Netcash Merchant Portal:**
   - URL: https://merchant.netcash.co.za
   - Select account: **Circle Tel SA - Test account (52340889417)**

2. **Navigate to Payment Notifications:**
   - Go to: **Services** → **Account Profile** → **Payment Notifications**

3. **Update URLs:**
   - **Pre-defined URL group:** None
   - **Accept URL:** `https://circletel-nextjs-staging.vercel.app/api/payment/netcash/webhook`
   - **Decline URL:** `https://circletel-nextjs-staging.vercel.app/api/payment/netcash/webhook`
   - **Notify URL:** `https://circletel-nextjs-staging.vercel.app/api/payment/netcash/webhook`
   - **Re-direct URL:** (leave empty)
   - **Notify my customers:** ☐ (unchecked)

4. **Click "Edit" to save**

---

### Step 3: Test Staging Integration

**Run test transaction:**

```bash
# 1. Create test order in staging
curl -X POST https://circletel-nextjs-staging.vercel.app/api/orders/create \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Test User",
    "customerEmail": "test@circletel.co.za",
    "customerPhone": "+27821234567",
    "packageId": "fibre-100mbps",
    "totalAmount": 1599.00
  }'

# 2. Initiate payment (use test card 4000000000000002)

# 3. Monitor webhook delivery
# Check: https://circletel-nextjs-staging.vercel.app/admin/payments/webhooks
```

**Verify:**
- ✅ Webhook appears in admin dashboard
- ✅ Order status updated to "paid"
- ✅ Email confirmation sent
- ✅ No errors in Vercel function logs

---

### Step 4: Update Netcash Portal (Production Account)

**⚠️ ONLY proceed after successful staging tests!**

1. **Login to Netcash Merchant Portal:**
   - URL: https://merchant.netcash.co.za
   - Select account: **Circle Tel SA (52552945156)**

2. **Navigate to Payment Notifications:**
   - Go to: **Services** → **Account Profile** → **Payment Notifications**

3. **Update URLs:**
   - **Pre-defined URL group:** None
   - **Accept URL:** `https://circletel.co.za/api/payment/netcash/webhook`
   - **Decline URL:** `https://circletel.co.za/api/payment/netcash/webhook`
   - **Notify URL:** `https://circletel.co.za/api/payment/netcash/webhook`
   - **Re-direct URL:** (leave empty)
   - **Notify my customers:** ☐ (unchecked)

4. **Click "Edit" to save**

---

### Step 5: Test Production Integration

**Run production smoke test:**

```bash
# Use real card for small test transaction (R10.00)
# Monitor via: https://circletel.co.za/admin/payments/webhooks
```

**Verify:**
- ✅ Webhook received successfully
- ✅ Order status updated correctly
- ✅ Customer receives email
- ✅ Service activation triggered (if applicable)
- ✅ Admin dashboard shows transaction

---

## Local Development Setup (Optional)

### Using ngrok for Local Webhook Testing

1. **Install ngrok:**
   ```bash
   # Download from https://ngrok.com/download
   # Or install via package manager
   npm install -g ngrok
   ```

2. **Start local dev server:**
   ```bash
   npm run dev:memory
   # Server running on http://localhost:3005
   ```

3. **Expose local server:**
   ```bash
   ngrok http 3005
   # Output: Forwarding https://abc123.ngrok.io -> http://localhost:3005
   ```

4. **Update Netcash test account:**
   - Accept URL: `https://abc123.ngrok.io/api/payment/netcash/webhook`
   - Decline URL: `https://abc123.ngrok.io/api/payment/netcash/webhook`
   - Notify URL: `https://abc123.ngrok.io/api/payment/netcash/webhook`

5. **Monitor webhooks:**
   - ngrok dashboard: http://localhost:4040
   - CircleTel logs: Terminal running `npm run dev:memory`

---

## Rollback Plan

If issues occur after migration, immediately revert to AgilityGIS gateway:

### Test Account Rollback:
```
Accept URL: https://integration-staging.agilitygis.com/api/paymentgateway/webhook/netcash/paynow/accepted?integratorKey=gFExoQEvXrsdu8Fp6a234f8ErfsusF5LTaEDF
Decline URL: https://integration-staging.agilitygis.com/api/paymentgateway/webhook/netcash/paynow/rejected?integratorKey=gFExoQEvXrsdu8Fp6a234f8ErfsusF5LTaEDF
Notify URL: https://integration-staging.agilitygis.com/api/paymentgateway/webhook/netcash/notify?integratorKey=gFExoQEvXrsdu8Fp6a234f8ErfsusF5LTaEDF
```

### Production Account Rollback:
```
Accept URL: https://integration.agilitygis.com/api/paymentgateway/webhook/netcash/paynow/accepted?integratorKey=gFExoQEvXrsdu8Fp6a234f8ErfsusF5LTaEDF
Decline URL: https://integration.agilitygis.com/api/paymentgateway/webhook/netcash/paynow/rejected?integratorKey=gFExoQEvXrsdu8Fp6a234f8ErfsusF5LTaEDF
Notify URL: https://integration.agilitygis.com/api/paymentgateway/webhook/netcash/notify?integratorKey=gFExoQEvXrsdu8Fp6a234f8ErfsusF5LTaEDF
```

**Rollback Steps:**
1. Update Netcash portal URLs (5-10 minutes)
2. No code changes needed
3. Monitor for successful webhook delivery
4. Investigate CircleTel direct integration issues

---

## Monitoring After Migration

### Key Metrics (First 24 Hours)

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Webhook Success Rate | >95% | <90% |
| Average Response Time | <2s | >5s |
| Failed Webhooks | <5% | >10% |
| Duplicate Detection Rate | 0% | >1% |

### Monitoring Tools

1. **CircleTel Admin Dashboard:**
   - URL: `/admin/payments/webhooks`
   - Check every hour for first 24 hours
   - Review error logs daily

2. **Vercel Function Logs:**
   - URL: https://vercel.com/your-team/circletel-nextjs/logs
   - Filter by function: `api/payment/netcash/webhook`
   - Look for 5xx errors

3. **Sentry Error Tracking:**
   - Set up Sentry webhook alerts
   - Configure Slack notifications for critical errors

---

## Troubleshooting

### Webhook Not Received

**Check Netcash Configuration:**
```bash
# Verify URLs in Netcash portal
1. Login to merchant.netcash.co.za
2. Check "Payment Notifications" section
3. Confirm URLs match exactly (no typos)
```

**Check Vercel Deployment:**
```bash
# Verify function is deployed
curl https://circletel-nextjs-staging.vercel.app/api/payment/netcash/webhook

# Expected response:
{"status":"unhealthy","error":"No active payment configuration found"}
# (This is normal - GET request returns health check)
```

**Check Environment Variables:**
```bash
# In Vercel Dashboard:
1. Go to Project Settings → Environment Variables
2. Verify NETCASH_WEBHOOK_SECRET is set
3. Verify NETCASH_MERCHANT_ID is set
4. Ensure variables are in correct environment (staging/production)
```

### Webhook Signature Validation Failed

**Verify Webhook Secret:**
```bash
# Check .env file matches Vercel environment variable
# Secret must be exactly the same (no extra spaces)
NETCASH_WEBHOOK_SECRET=your-secret-here
```

**Test Signature Generation:**
```typescript
// Test script
const crypto = require('crypto');
const payload = {/*...*/};
const secret = process.env.NETCASH_WEBHOOK_SECRET;
const signature = crypto.createHmac('sha256', secret)
  .update(JSON.stringify(payload))
  .digest('hex');
console.log('Generated signature:', signature);
```

### High Failure Rate

**Check IP Whitelist:**
```bash
# Netcash IPs should not be blocked
# Verify in Vercel firewall settings (if enabled)
196.33.252.0/24
41.203.154.0/24
102.165.16.0/24
```

**Check Rate Limiting:**
```bash
# If using Redis, verify connection
# If using in-memory, check for memory leaks
# Default: 100 requests/minute per IP
```

---

## Success Criteria

Migration is successful when:

- ✅ Test account webhooks deliver successfully (>95% success rate)
- ✅ Production account webhooks deliver successfully (>95% success rate)
- ✅ Order statuses update correctly
- ✅ Email notifications sent
- ✅ No payment processing delays
- ✅ Admin dashboard shows all webhooks
- ✅ Zero critical errors in logs
- ✅ Customer complaints = 0

---

## Post-Migration Checklist

- [ ] Test account migrated and tested
- [ ] Production account migrated and tested
- [ ] Smoke tests passed (5 transactions minimum)
- [ ] Monitoring dashboards configured
- [ ] Alert thresholds set
- [ ] Support team notified of changes
- [ ] Rollback plan documented
- [ ] AgilityGIS notified (if needed)
- [ ] 24-hour monitoring period completed
- [ ] Migration documented in changelog

---

## Support

**For Migration Issues:**
- **Email:** dev@circletel.co.za
- **Slack:** #circletel-dev-ops
- **Emergency:** Rollback to AgilityGIS gateway immediately

**For Netcash Issues:**
- **Email:** support@netcash.co.za
- **Phone:** +27 11 305 0000
- **Portal:** https://merchant.netcash.co.za

---

## References

- **Webhook Configuration Doc:** `docs/integrations/NETCASH_WEBHOOK_CONFIGURATION.md`
- **Implementation:** `app/api/payment/netcash/webhook/route.ts`
- **Test Results:** `docs/testing/PAYMENT_TEST_RESULTS.md`
- **Phase 1B Summary:** `docs/features/customer-journey/PHASE_1B_COMPLETION_SUMMARY.md`

---

**Last Updated:** 2025-10-22
**Migration Status:** Ready for Execution
**Approved By:** Development Team

🤖 Generated with [Claude Code](https://claude.com/claude-code)
