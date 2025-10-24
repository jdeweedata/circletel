# Netcash Migration Checklist

**Date Started:** 2025-10-22
**Migration Type:** AgilityGIS Gateway → CircleTel Direct Integration

---

## ✅ Step 1: Webhook Secrets Generated

**Staging Secret:**
```
CtLE3LsjW5B76VB74goex++4poBSt/4MVX1tZyQHvEc=
```

**Production Secret:**
```
4cjhM5XyfuCOMrdCXhYP6Hky3/4g1mJ3s+iLLKZG2ec=
```

**⚠️ SECURITY NOTE:** These secrets are saved in:
- `.env.netcash.staging.example`
- `.env.netcash.production.example`

**DO NOT commit these files to git!** (Already in `.gitignore`)

---

## 📋 Step 2: Configure Vercel Staging Environment

### 2.1: Login to Vercel Dashboard

1. Go to: https://vercel.com
2. Select project: **circletel-nextjs**
3. Go to: **Settings** → **Environment Variables**

### 2.2: Add Staging Variables

**Select Environment:** ☑️ Preview (for staging branch)

Add these variables:

| Variable Name | Value |
|---------------|-------|
| `NETCASH_WEBHOOK_SECRET` | `CtLE3LsjW5B76VB74goex++4poBSt/4MVX1tZyQHvEc=` |
| `NETCASH_MERCHANT_ID` | `52340889417` |
| `NETCASH_MERCHANT_KEY` | *(Get from Netcash portal)* |
| `NETCASH_SERVICE_KEY` | *(Get from Netcash portal)* |
| `NODE_ENV` | `staging` |
| `NEXT_PUBLIC_APP_URL` | `https://circletel-nextjs-staging.vercel.app` |

### 2.3: Get Netcash Credentials

1. Login to: https://merchant.netcash.co.za
2. Select account: **Circle Tel SA - Test account (52340889417)**
3. Go to: **Services** → **Account Profile**
4. Find: **Merchant Key** and **Service Key**
5. Copy these values to Vercel environment variables above

### 2.4: Redeploy Staging

After adding variables, trigger a new deployment:
```bash
git push origin staging
# Or manually trigger in Vercel dashboard
```

**Status:** ☐ Not started | ☐ In progress | ☐ Complete

---

## 📋 Step 3: Update Netcash Test Account

### 3.1: Login to Netcash Portal

1. Go to: https://merchant.netcash.co.za
2. Login with your credentials
3. Select account: **Circle Tel SA - Test account (52340889417)**

### 3.2: Navigate to Payment Notifications

1. Top menu: **Services**
2. Submenu: **Account Profile**
3. Section: **Payment Notifications**

### 3.3: Update Webhook URLs

**Current URLs (AgilityGIS):**
```
Accept: https://integration-staging.agilitygis.com/api/paymentgateway/webhook/netcash/paynow/accepted?...
Decline: https://integration-staging.agilitygis.com/api/paymentgateway/webhook/netcash/paynow/rejected?...
Notify: https://integration-staging.agilitygis.com/api/paymentgateway/webhook/netcash/notify?...
```

**New URLs (CircleTel Direct):**

**Pre-defined URL group:** None

**Accept URL:**
```
https://circletel-nextjs-staging.vercel.app/api/payment/netcash/webhook
```

**Decline URL:**
```
https://circletel-nextjs-staging.vercel.app/api/payment/netcash/webhook
```

**Notify URL:**
```
https://circletel-nextjs-staging.vercel.app/api/payment/netcash/webhook
```

**Re-direct URL:** *(leave empty)*

**Notify my customers:** ☐ Unchecked

### 3.4: Save Configuration

1. Click **"Edit"** button at the bottom
2. Confirm changes are saved

**Status:** ☐ Not started | ☐ In progress | ☐ Complete

---

## 📋 Step 4: Run Test Transaction (Staging)

### 4.1: Initiate Test Order

**Option A: Via Application UI**
1. Go to: https://circletel-nextjs-staging.vercel.app
2. Complete coverage check
3. Select a package
4. Fill in customer details
5. Proceed to payment

**Option B: Via API (cURL)**
```bash
# Create test order
curl -X POST https://circletel-nextjs-staging.vercel.app/api/orders/create \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Test User",
    "customerEmail": "test@circletel.co.za",
    "customerPhone": "+27821234567",
    "packageId": "test-package-id",
    "totalAmount": 100.00,
    "installationAddress": "123 Test St, Cape Town"
  }'
```

### 4.2: Complete Test Payment

**Use Netcash Test Card:**
- **Card Number:** `4000000000000002`
- **CVV:** `123`
- **Expiry:** Any future date (e.g., `12/25`)
- **Name:** Test User

**Expected Result:** Payment should succeed

### 4.3: Verify Webhook Delivery

1. Go to admin dashboard: https://circletel-nextjs-staging.vercel.app/admin/payments/webhooks
2. Login with admin credentials
3. Look for recent webhook entry

**Check for:**
- ✅ Webhook appears in list
- ✅ Status: "Success" (green badge)
- ✅ Transaction ID matches Netcash transaction
- ✅ Order status updated to "paid"

### 4.4: Verify Order Status

1. Go to: https://circletel-nextjs-staging.vercel.app/admin/orders
2. Find the test order
3. Check status is **"paid"**

### 4.5: Verify Email Sent

Check for order confirmation email sent to `test@circletel.co.za`

**Status:** ☐ Not started | ☐ In progress | ☐ Complete | ☐ **FAILED** (see troubleshooting)

---

## 📋 Step 5: Configure Vercel Production Environment

**⚠️ ONLY proceed after staging tests pass successfully!**

### 5.1: Add Production Variables

Go to Vercel Dashboard → **circletel-nextjs** → **Settings** → **Environment Variables**

**Select Environment:** ☑️ Production

| Variable Name | Value |
|---------------|-------|
| `NETCASH_WEBHOOK_SECRET` | `4cjhM5XyfuCOMrdCXhYP6Hky3/4g1mJ3s+iLLKZG2ec=` |
| `NETCASH_MERCHANT_ID` | `52552945156` |
| `NETCASH_MERCHANT_KEY` | *(Get from Netcash portal - production account)* |
| `NETCASH_SERVICE_KEY` | *(Get from Netcash portal - production account)* |
| `NODE_ENV` | `production` |
| `NEXT_PUBLIC_APP_URL` | `https://circletel.co.za` |

### 5.2: Get Production Netcash Credentials

1. Login to: https://merchant.netcash.co.za
2. Select account: **Circle Tel SA (52552945156)**
3. Go to: **Services** → **Account Profile**
4. Find: **Merchant Key** and **Service Key**
5. Copy to Vercel environment variables

### 5.3: Deploy to Production

```bash
git push origin main
# Or trigger manual deployment in Vercel
```

**Status:** ☐ Not started | ☐ In progress | ☐ Complete

---

## 📋 Step 6: Update Netcash Production Account

**⚠️ CRITICAL: Only proceed after staging is 100% working!**

### 6.1: Login and Navigate

1. Go to: https://merchant.netcash.co.za
2. Select account: **Circle Tel SA (52552945156)**
3. Go to: **Services** → **Account Profile** → **Payment Notifications**

### 6.2: Update Production URLs

**Current URLs (AgilityGIS):**
```
Accept: https://integration.agilitygis.com/api/paymentgateway/webhook/netcash/paynow/accepted?...
Decline: https://integration.agilitygis.com/api/paymentgateway/webhook/netcash/paynow/rejected?...
Notify: https://integration.agilitygis.com/api/paymentgateway/webhook/netcash/notify?...
```

**New URLs (CircleTel Direct):**

**Pre-defined URL group:** None

**Accept URL:**
```
https://circletel.co.za/api/payment/netcash/webhook
```

**Decline URL:**
```
https://circletel.co.za/api/payment/netcash/webhook
```

**Notify URL:**
```
https://circletel.co.za/api/payment/netcash/webhook
```

**Re-direct URL:** *(leave empty)*

**Notify my customers:** ☐ Unchecked

### 6.3: Save and Confirm

1. Click **"Edit"** button
2. Double-check all URLs are correct
3. Confirm save

**Status:** ☐ Not started | ☐ In progress | ☐ Complete

---

## 📋 Step 7: Production Smoke Test

### 7.1: Small Test Transaction

**Use REAL card for small amount (R10.00 - R50.00)**

1. Go to: https://circletel.co.za
2. Create real order (use your own email for testing)
3. Complete payment with real card
4. Small amount to minimize financial risk

### 7.2: Verify Production Webhook

1. Go to: https://circletel.co.za/admin/payments/webhooks
2. Find webhook for test transaction
3. Verify status: **"Success"**

### 7.3: Verify Order and Email

- ✅ Order status updated
- ✅ Email received
- ✅ No errors in logs

**Status:** ☐ Not started | ☐ In progress | ☐ Complete | ☐ **FAILED** (rollback!)

---

## 📋 Step 8: Monitor for 24 Hours

### 8.1: Set Up Monitoring

**Vercel Dashboard:**
- URL: https://vercel.com/your-team/circletel-nextjs/logs
- Filter: `/api/payment/netcash/webhook`
- Check every 2-4 hours for first 24 hours

**CircleTel Admin Dashboard:**
- URL: https://circletel.co.za/admin/payments/webhooks
- Monitor success rate (target: >95%)
- Check for any failed webhooks

### 8.2: Key Metrics to Track

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Success Rate | >95% | ___% | ☐ |
| Avg Response Time | <2s | ___s | ☐ |
| Failed Webhooks | <5% | ___% | ☐ |
| Duplicate Rate | 0% | ___% | ☐ |

### 8.3: Alert Thresholds

- 🚨 **Critical:** Success rate <90%
- ⚠️ **Warning:** Success rate <95%
- 🔔 **Info:** Any 5xx errors

**Status:** ☐ Not started | ☐ In progress | ☐ Complete

---

## 🆘 Rollback Procedure

### If Any Issues Occur:

**IMMEDIATELY revert Netcash configuration to AgilityGIS gateway!**

### Test Account Rollback:

1. Login to Netcash portal
2. Select: Circle Tel SA - Test account (52340889417)
3. Update URLs:

```
Accept URL:
https://integration-staging.agilitygis.com/api/paymentgateway/webhook/netcash/paynow/accepted?integratorKey=gFExoQEvXrsdu8Fp6a234f8ErfsusF5LTaEDF

Decline URL:
https://integration-staging.agilitygis.com/api/paymentgateway/webhook/netcash/paynow/rejected?integratorKey=gFExoQEvXrsdu8Fp6a234f8ErfsusF5LTaEDF

Notify URL:
https://integration-staging.agilitygis.com/api/paymentgateway/webhook/netcash/notify?integratorKey=gFExoQEvXrsdu8Fp6a234f8ErfsusF5LTaEDF
```

### Production Account Rollback:

1. Login to Netcash portal
2. Select: Circle Tel SA (52552945156)
3. Update URLs:

```
Accept URL:
https://integration.agilitygis.com/api/paymentgateway/webhook/netcash/paynow/accepted?integratorKey=gFExoQEvXrsdu8Fp6a234f8ErfsusF5LTaEDF

Decline URL:
https://integration.agilitygis.com/api/paymentgateway/webhook/netcash/paynow/rejected?integratorKey=gFExoQEvXrsdu8Fp6a234f8ErfsusF5LTaEDF

Notify URL:
https://integration.agilitygis.com/api/paymentgateway/webhook/netcash/notify?integratorKey=gFExoQEvXrsdu8Fp6a234f8ErfsusF5LTaEDF
```

**Rollback Time:** ~5 minutes (no code changes needed)

---

## ✅ Migration Complete Checklist

- [ ] Staging secrets generated
- [ ] Staging environment variables configured in Vercel
- [ ] Netcash test account updated
- [ ] Staging test transaction successful
- [ ] Staging webhook delivery verified
- [ ] Production secrets generated
- [ ] Production environment variables configured in Vercel
- [ ] Netcash production account updated
- [ ] Production smoke test successful
- [ ] Production webhook delivery verified
- [ ] 24-hour monitoring period completed
- [ ] Success rate >95%
- [ ] No critical errors
- [ ] Migration documented in changelog
- [ ] Team notified of successful migration

---

## 📞 Emergency Contacts

**CircleTel Dev Team:**
- Email: dev@circletel.co.za
- Slack: #circletel-dev-ops

**Netcash Support:**
- Email: support@netcash.co.za
- Phone: +27 11 305 0000

---

**Migration Started:** 2025-10-22
**Status:** ☐ In Progress | ☐ Complete | ☐ Rolled Back

🤖 Generated with [Claude Code](https://claude.com/claude-code)
