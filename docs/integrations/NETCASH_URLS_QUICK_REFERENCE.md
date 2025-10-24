# Netcash Webhook URLs - Quick Reference Card

**Date:** 2025-10-22
**Purpose:** Copy-paste URLs for Netcash portal configuration

---

## 📋 Test Account (52340889417)

**Account Name:** Circle Tel SA - Test account

### Staging Environment URLs

```
Accept URL:
https://circletel-nextjs-staging.vercel.app/api/payment/netcash/webhook

Decline URL:
https://circletel-nextjs-staging.vercel.app/api/payment/netcash/webhook

Notify URL:
https://circletel-nextjs-staging.vercel.app/api/payment/netcash/webhook
```

**Configuration:**
- Pre-defined URL group: **None**
- Re-direct URL: **(leave empty)**
- Notify my customers: **☐ Unchecked**

---

## 🚀 Production Account (52552945156)

**Account Name:** Circle Tel SA

### Production URLs

```
Accept URL:
https://circletel.co.za/api/payment/netcash/webhook

Decline URL:
https://circletel.co.za/api/payment/netcash/webhook

Notify URL:
https://circletel.co.za/api/payment/netcash/webhook
```

**Alternative (Vercel Production):**
```
Accept URL:
https://circletel-nextjs.vercel.app/api/payment/netcash/webhook

Decline URL:
https://circletel-nextjs.vercel.app/api/payment/netcash/webhook

Notify URL:
https://circletel-nextjs.vercel.app/api/payment/netcash/webhook
```

**Configuration:**
- Pre-defined URL group: **None**
- Re-direct URL: **(leave empty)**
- Notify my customers: **☐ Unchecked**

---

## 🔧 Local Development (Optional)

**Using ngrok:**

1. Start ngrok: `ngrok http 3005`
2. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
3. Use these URLs in Netcash test account:

```
Accept URL:
https://abc123.ngrok.io/api/payment/netcash/webhook

Decline URL:
https://abc123.ngrok.io/api/payment/netcash/webhook

Notify URL:
https://abc123.ngrok.io/api/payment/netcash/webhook
```

---

## 📝 Configuration Steps

### In Netcash Portal:

1. **Login:** https://merchant.netcash.co.za
2. **Select Account:**
   - Test: Circle Tel SA - Test account (52340889417)
   - Production: Circle Tel SA (52552945156)
3. **Navigate:** Services → Account Profile → Payment Notifications
4. **Update URLs:** Copy-paste from above
5. **Save:** Click "Edit" button

---

## ⚠️ Migration Order

**DO NOT skip steps!**

1. ✅ **First:** Update TEST account → Test thoroughly
2. ✅ **Then:** Update PRODUCTION account → Monitor closely

---

## 🔍 Verification

### After updating each account:

**Test Transaction:**
- Use Netcash test card: `4000000000000002`
- CVV: `123`, Expiry: Any future date

**Check Webhook Delivery:**
- Staging: https://circletel-nextjs-staging.vercel.app/admin/payments/webhooks
- Production: https://circletel.co.za/admin/payments/webhooks

**Success Indicators:**
- ✅ Webhook appears in dashboard
- ✅ Status: "Success"
- ✅ Order status updated
- ✅ Email sent

---

## 🆘 Rollback URLs (AgilityGIS Gateway)

### Test Account Rollback:
```
Accept URL:
https://integration-staging.agilitygis.com/api/paymentgateway/webhook/netcash/paynow/accepted?integratorKey=gFExoQEvXrsdu8Fp6a234f8ErfsusF5LTaEDF

Decline URL:
https://integration-staging.agilitygis.com/api/paymentgateway/webhook/netcash/paynow/rejected?integratorKey=gFExoQEvXrsdu8Fp6a234f8ErfsusF5LTaEDF

Notify URL:
https://integration-staging.agilitygis.com/api/paymentgateway/webhook/netcash/notify?integratorKey=gFExoQEvXrsdu8Fp6a234f8ErfsusF5LTaEDF
```

### Production Account Rollback:
```
Accept URL:
https://integration.agilitygis.com/api/paymentgateway/webhook/netcash/paynow/accepted?integratorKey=gFExoQEvXrsdu8Fp6a234f8ErfsusF5LTaEDF

Decline URL:
https://integration.agilitygis.com/api/paymentgateway/webhook/netcash/paynow/rejected?integratorKey=gFExoQEvXrsdu8Fp6a234f8ErfsusF5LTaEDF

Notify URL:
https://integration.agilitygis.com/api/paymentgateway/webhook/netcash/notify?integratorKey=gFExoQEvXrsdu8Fp6a234f8ErfsusF5LTaEDF
```

---

## 📞 Support

**Issues?**
- Email: dev@circletel.co.za
- Slack: #circletel-dev-ops
- Emergency: Rollback immediately using URLs above

**Netcash Support:**
- Email: support@netcash.co.za
- Phone: +27 11 305 0000

---

**Last Updated:** 2025-10-22
**Print this page for easy reference during migration**

🤖 Generated with [Claude Code](https://claude.com/claude-code)
