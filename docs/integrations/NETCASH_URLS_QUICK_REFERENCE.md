# Netcash Webhook URLs - Quick Reference Card

**Date:** 2026-08-01  
**Purpose:** Copy-paste URLs for Netcash Pay Now portal configuration  
**Verified:** Production Circle Tel SA (52552945156) portal settings 2026-08-01

---

## Path roles (do not mix)

| Path | Role |
|------|------|
| `/api/payments/netcash/webhook` | **Notify URL** — server-to-server; marks `customer_invoices` paid |
| `/api/payments/netcash/redirect` | **Accept / Decline / Redirect** — browser return only (does not settle invoices) |
| `/api/payment/netcash/webhook` | **Legacy** — consumer-order checkout only; do **not** use as Notify for invoice billing |

---

## Production Account (52552945156)

**Account Name:** Circle Tel SA  
**Live host:** `https://www.circletel.co.za`

```
Accept URL:
https://www.circletel.co.za/api/payments/netcash/redirect

Decline URL:
https://www.circletel.co.za/api/payments/netcash/redirect

Notify URL:
https://www.circletel.co.za/api/payments/netcash/webhook

Re-direct URL:
https://www.circletel.co.za/api/payments/netcash/redirect
```

**Configuration:**
- Pre-defined URL group: **None**
- Notify my customers: as configured in portal (currently enabled)

---

## Staging / Vercel preview

Prefer Coolify/staging host when available. Pattern:

```
Accept URL:
https://<staging-host>/api/payments/netcash/redirect

Decline URL:
https://<staging-host>/api/payments/netcash/redirect

Notify URL:
https://<staging-host>/api/payments/netcash/webhook

Re-direct URL:
https://<staging-host>/api/payments/netcash/redirect
```

Legacy Vercel examples (same path shape):

```
https://circletel-nextjs-staging.vercel.app/api/payments/netcash/redirect
https://circletel-nextjs-staging.vercel.app/api/payments/netcash/webhook
```

---

## Test Account (52340889417)

**Account Name:** Circle Tel SA - Test account

Use the same **payments** (plural) paths as production, pointed at your test/staging host.

---

## Local Development (Optional)

**Using ngrok:**

1. Start ngrok: `ngrok http 3005`
2. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
3. Use these URLs in Netcash test account:

```
Accept URL:
https://abc123.ngrok.io/api/payments/netcash/redirect

Decline URL:
https://abc123.ngrok.io/api/payments/netcash/redirect

Notify URL:
https://abc123.ngrok.io/api/payments/netcash/webhook

Re-direct URL:
https://abc123.ngrok.io/api/payments/netcash/redirect
```

---

## Configuration Steps

### In Netcash Portal:

1. **Login:** https://merchant.netcash.co.za
2. **Select Account:**
   - Test: Circle Tel SA - Test account (52340889417)
   - Production: Circle Tel SA (52552945156)
3. **Navigate:** Services → Pay Now service key → Payment notifications
4. **Update URLs:** Copy-paste from above
5. **Save:** Click "Edit" / save

---

## Verification

**Notify health check (GET):**
- Production: https://www.circletel.co.za/api/payments/netcash/webhook  
  Expect JSON: `"endpoint":"/api/payments/netcash/webhook","status":"active"`

**After a test payment:**
- Webhook log / `payment_webhook_logs` for the Notify POST
- Invoice paid only when `TransactionAccepted=true` and amount &gt; 0 (see `lib/payments/netcash-paynow-notify.ts`)

---

## Rollback URLs (AgilityGIS Gateway) — historical only

Only if intentionally reverting off CircleTel-native notify (not recommended).

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

## Support

**Issues?**
- Email: dev@circletel.co.za

**Netcash Support:**
- Email: support@netcash.co.za
- Phone: +27 11 305 0000

---

**Last Updated:** 2026-08-01
