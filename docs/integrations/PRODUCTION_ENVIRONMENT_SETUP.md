# Production Environment Variables Setup Guide

**Date:** 2025-10-22
**Purpose:** Configure Vercel production environment for Netcash live payments

---

## ⚠️ CRITICAL ISSUE IDENTIFIED

**Current Production Environment Status:** ❌ **MISCONFIGURED**

The production environment is currently using **STAGING/TEST credentials**:

```bash
# CURRENT PRODUCTION VALUES (WRONG):
NETCASH_MERCHANT_ID="52340889417"        # ← Test account
NETCASH_SERVICE_KEY="7928c6de-219f-..."  # ← Test key
NETCASH_WEBHOOK_SECRET="CtLE3LsjW5B7..." # ← Staging secret
NODE_ENV="stagging"                       # ← Typo + wrong value
NEXT_PUBLIC_APP_URL="https://circletel-nextjs-staging.vercel.app" # ← Staging URL
```

**This MUST be corrected before production deployment!**

---

## ✅ Required Production Values

### **1. Netcash Production Account Credentials**

**Production Account:** Circle Tel SA (52552945156)

| Variable | Production Value | Current Value | Status |
|----------|------------------|---------------|--------|
| `NETCASH_MERCHANT_ID` | `52552945156` | `52340889417` | ❌ WRONG (test account) |
| `NETCASH_WEBHOOK_SECRET` | `4cjhM5XyfuCOMrdCXhYP6Hky3/4g1mJ3s+iLLKZG2ec=` | `CtLE3LsjW5B7...` | ❌ WRONG (staging) |
| `NETCASH_SERVICE_KEY` | **GET FROM PORTAL** | `7928c6de-219f-...` | ❌ WRONG (test key) |
| `NETCASH_MERCHANT_KEY` | **GET FROM PORTAL** | `3143ee79-0c96-...` | ❌ WRONG (test key) |
| `NODE_ENV` | `production` | `stagging` | ❌ WRONG |
| `NEXT_PUBLIC_APP_URL` | `https://circletel.co.za` | `https://circletel-nextjs-staging...` | ❌ WRONG |

---

## 📋 Step-by-Step Setup Instructions

### **Step 1: Get Production Credentials from Netcash Portal**

1. **Login to Netcash:**
   - URL: https://merchant.netcash.co.za
   - Use your Netcash credentials

2. **Select Production Account:**
   - Account: **Circle Tel SA (52552945156)**
   - ⚠️ Make sure you select the PRODUCTION account, NOT the test account

3. **Navigate to Service Keys:**
   - Go to: **Services** → **Account Profile**
   - Section: **NetConnector** → **Pay Now**
   - Click: "View Pay Now service key settings"

4. **Copy the Keys:**
   - **Service Key:** Copy this value (UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
   - **Merchant Key (PCI Vault Key):** This might be the same as Service Key or different

5. **Save keys securely** (you'll need them in Step 2)

---

### **Step 2: Update Vercel Environment Variables**

**Option A: Via Vercel Dashboard (Recommended)**

1. Go to: https://vercel.com/jdewee-livecoms-projects/circletel-staging/settings/environment-variables

2. Find and edit each variable for **Production** environment only:

| Variable | New Value | Action |
|----------|-----------|--------|
| `NETCASH_MERCHANT_ID` | `52552945156` | **EDIT** (change from 52340889417) |
| `NETCASH_WEBHOOK_SECRET` | `4cjhM5XyfuCOMrdCXhYP6Hky3/4g1mJ3s+iLLKZG2ec=` | **EDIT** (change from staging secret) |
| `NETCASH_SERVICE_KEY` | `<paste from portal>` | **EDIT** (change from test key) |
| `NETCASH_MERCHANT_KEY` | `<paste from portal>` | **EDIT** (change from test key) |
| `NODE_ENV` | `production` | **EDIT** (fix typo + value) |
| `NEXT_PUBLIC_APP_URL` | `https://circletel.co.za` | **EDIT** (change from staging URL) |

3. **Important:** Only edit **Production** environment
   - Leave **Development** and **Preview** unchanged (they should use test account)

4. **Save** each change

5. **Redeploy** production after all changes:
   - Go to: Deployments tab
   - Find latest production deployment
   - Click "..." menu → "Redeploy"

**Option B: Via Vercel CLI**

```bash
# Remove old production values and add new ones
vercel env rm NETCASH_MERCHANT_ID production
echo "52552945156" | vercel env add NETCASH_MERCHANT_ID production

vercel env rm NETCASH_WEBHOOK_SECRET production
echo "4cjhM5XyfuCOMrdCXhYP6Hky3/4g1mJ3s+iLLKZG2ec=" | vercel env add NETCASH_WEBHOOK_SECRET production

vercel env rm NETCASH_SERVICE_KEY production
echo "<paste-from-portal>" | vercel env add NETCASH_SERVICE_KEY production

vercel env rm NETCASH_MERCHANT_KEY production
echo "<paste-from-portal>" | vercel env add NETCASH_MERCHANT_KEY production

vercel env rm NODE_ENV production
echo "production" | vercel env add NODE_ENV production

vercel env rm NEXT_PUBLIC_APP_URL production
echo "https://circletel.co.za" | vercel env add NEXT_PUBLIC_APP_URL production

# Trigger redeployment
vercel --prod
```

---

### **Step 3: Update Netcash Production Account Webhook URLs**

1. **Login to Netcash Portal:**
   - URL: https://merchant.netcash.co.za

2. **Select Production Account:**
   - Account: **Circle Tel SA (52552945156)**

3. **Navigate to Payment Notifications:**
   - Go to: **Services** → **Account Profile**
   - Section: **Payment Notifications**

4. **Update Webhook URLs:**

**Current URLs (likely AgilityGIS):**
```
Accept: https://integration.agilitygis.com/api/paymentgateway/webhook/netcash/paynow/accepted?...
Decline: https://integration.agilitygis.com/api/paymentgateway/webhook/netcash/paynow/rejected?...
Notify: https://integration.agilitygis.com/api/paymentgateway/webhook/netcash/notify?...
```

**New URLs (CircleTel Direct):**

| Field | Value |
|-------|-------|
| **Pre-defined URL group** | None |
| **Accept URL** | `https://circletel.co.za/api/payment/netcash/webhook` |
| **Decline URL** | `https://circletel.co.za/api/payment/netcash/webhook` |
| **Notify URL** | `https://circletel.co.za/api/payment/netcash/webhook` |
| **Re-direct URL** | *(leave empty)* |
| **Notify my customers** | ☐ Unchecked |

5. **Click "Edit"** at the bottom of the page

6. **Save** the configuration

7. **⚠️ IMPORTANT:** Keep the old AgilityGIS URLs saved somewhere for rollback if needed

---

### **Step 4: Verify Configuration**

**4.1: Check Environment Variables**

```bash
# Pull production variables to verify
vercel env pull .env.production.verify --environment=production

# Check Netcash variables
grep -E "NETCASH|NODE_ENV|NEXT_PUBLIC_APP_URL" .env.production.verify

# Should show:
# NETCASH_MERCHANT_ID="52552945156"
# NETCASH_WEBHOOK_SECRET="4cjhM5XyfuCOMrdCXhYP6Hky3/4g1mJ3s+iLLKZG2ec="
# NETCASH_SERVICE_KEY="<production-key>"
# NODE_ENV="production"
# NEXT_PUBLIC_APP_URL="https://circletel.co.za"
```

**4.2: Test Webhook Endpoint**

```bash
# Test production webhook health
curl -s https://circletel.co.za/api/payment/netcash/webhook

# Should return:
# {"status":"unhealthy","error":"No active payment configuration found"}
# OR
# {"status":"healthy"}
```

**4.3: Verify Deployment**

```bash
# Check latest production deployment
vercel ls --scope jdeweedata-livecoms-projects

# Should show circletel.co.za with "Ready" status
```

---

## 🧪 Production Smoke Test

**After configuration is complete, run a small real transaction:**

### **Test Procedure:**

1. **Navigate to:** https://circletel.co.za

2. **Complete Order Flow:**
   - Enter real address (your address for testing)
   - Select cheapest package (e.g., HomeFibre Basic R379)
   - Fill account details with YOUR email
   - Complete payment with **REAL card**
   - Amount: R50 - R100 (small amount to minimize risk)

3. **Verify Webhook:**
   - Check admin dashboard: https://circletel.co.za/admin/payments/webhooks
   - Verify webhook received with status "Success"
   - Verify order status updated to "payment_received"

4. **Verify Email:**
   - Check your email for order confirmation
   - Should include KYC upload link

5. **If Successful:**
   - ✅ Production configuration is correct
   - Proceed with normal operations

6. **If Failed:**
   - ❌ Rollback Netcash URLs to AgilityGIS immediately
   - Review error logs
   - Fix issues before retrying

---

## ⚠️ Critical Pre-Launch Checklist

Before updating production webhook URLs, verify:

- [ ] **All** environment variables updated in Vercel production
- [ ] Production deployment successful with new variables
- [ ] Webhook endpoint responding at https://circletel.co.za/api/payment/netcash/webhook
- [ ] Netcash production account credentials retrieved
- [ ] Test small transaction in staging first (if possible)
- [ ] Rollback plan ready (old AgilityGIS URLs saved)
- [ ] Team notified of production changes
- [ ] Monitoring dashboard ready (admin/payments/webhooks)

---

## 🔄 Rollback Procedure

**If anything goes wrong, immediately revert Netcash configuration:**

1. **Login to Netcash Portal**
   - Account: Circle Tel SA (52552945156)

2. **Restore AgilityGIS URLs:**
   ```
   Accept URL: https://integration.agilitygis.com/api/paymentgateway/webhook/netcash/paynow/accepted?integratorKey=gFExoQEvXrsdu8Fp6a234f8ErfsusF5LTaEDF

   Decline URL: https://integration.agilitygis.com/api/paymentgateway/webhook/netcash/paynow/rejected?integratorKey=gFExoQEvXrsdu8Fp6a234f8ErfsusF5LTaEDF

   Notify URL: https://integration.agilitygis.com/api/paymentgateway/webhook/netcash/notify?integratorKey=gFExoQEvXrsdu8Fp6a234f8ErfsusF5LTaEDF
   ```

3. **Click "Edit"** and **Save**

4. **Rollback Time:** ~5 minutes (no code changes needed)

---

## 📊 Post-Deployment Monitoring

After production update, monitor for 24 hours:

### **Key Metrics:**

| Metric | Target | Check Frequency |
|--------|--------|-----------------|
| Webhook Success Rate | >95% | Every 2 hours (first 24h) |
| Payment Processing Time | <10s | Continuous |
| Order Status Updates | 100% | Per transaction |
| Email Delivery | 100% | Per transaction |

### **Monitoring Dashboard:**

URL: https://circletel.co.za/admin/payments/webhooks

**Watch for:**
- ✅ All webhooks showing "Success" status
- ❌ Any "Failed" or "Timeout" statuses
- 🔍 Unusual patterns (multiple failures, slow responses)

### **Alert Thresholds:**

- 🚨 **Critical:** >5% webhook failures
- ⚠️ **Warning:** Any 5xx errors from Netcash
- 🔔 **Info:** Response time >5s

---

## 📞 Emergency Contacts

**CircleTel Dev Team:**
- Email: dev@circletel.co.za
- Slack: #circletel-dev-ops

**Netcash Support:**
- Email: support@netcash.co.za
- Phone: +27 11 305 0000
- Hours: 24/7 for production issues

---

## 📝 Configuration Summary

### **Staging (Test Account - 52340889417):**
```env
NETCASH_MERCHANT_ID=52340889417
NETCASH_WEBHOOK_SECRET=CtLE3LsjW5B76VB74goex++4poBSt/4MVX1tZyQHvEc=
NETCASH_SERVICE_KEY=7928c6de-219f-4b75-9408-ea0e53be8c87
NODE_ENV=staging
NEXT_PUBLIC_APP_URL=https://circletel-staging.vercel.app
```

### **Production (Live Account - 52552945156):**
```env
NETCASH_MERCHANT_ID=52552945156
NETCASH_WEBHOOK_SECRET=4cjhM5XyfuCOMrdCXhYP6Hky3/4g1mJ3s+iLLKZG2ec=
NETCASH_SERVICE_KEY=<get-from-portal>
NETCASH_MERCHANT_KEY=<get-from-portal>
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://circletel.co.za
```

**Webhook URLs:**
- **Staging:** `https://circletel-staging.vercel.app/api/payment/netcash/webhook`
- **Production:** `https://circletel.co.za/api/payment/netcash/webhook`

---

**Document Created:** 2025-10-22
**Status:** ⚠️ **PRODUCTION CONFIGURATION REQUIRED**
**Priority:** 🔴 **HIGH - Must fix before live deployment**

🤖 Generated with [Claude Code](https://claude.com/claude-code)
