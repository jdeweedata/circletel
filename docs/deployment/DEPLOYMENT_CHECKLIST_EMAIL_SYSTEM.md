# 🚀 Email System Deployment Checklist

**Status:** ✅ System is 100% complete and ready for production deployment

---

## 📋 Pre-Deployment Checklist

### **1. Verify Local Environment** ✅

All these are already configured locally:

```env
RESEND_API_KEY="re_QhMu7F2n_JycLfeqNt8RNA692iWYcT6tM"
RESEND_FROM_EMAIL="noreply@notifications.circletelsa.co.za"
RESEND_REPLY_TO_EMAIL="contactus@circletel.co.za"
RESEND_WEBHOOK_SECRET="whsec_EvifycFX4o58Xa5qV4vtkDqUQHOMbIf8"
```

### **2. Add Environment Variables to Vercel** ⚠️ REQUIRED

Go to: https://vercel.com/jdewee-livecoms-projects/circletel/settings/environment-variables

Add these 4 environment variables:

| Variable | Value | Environment |
|----------|-------|-------------|
| `RESEND_API_KEY` | `re_QhMu7F2n_JycLfeqNt8RNA692iWYcT6tM` | Production, Preview, Development |
| `RESEND_FROM_EMAIL` | `noreply@notifications.circletelsa.co.za` | Production, Preview, Development |
| `RESEND_REPLY_TO_EMAIL` | `contactus@circletel.co.za` | Production, Preview, Development |
| `RESEND_WEBHOOK_SECRET` | `whsec_EvifycFX4o58Xa5qV4vtkDqUQHOMbIf8` | Production, Preview, Development |

**Important:** Select all 3 environments (Production, Preview, Development) for each variable!

### **3. Verify Resend Webhook Configuration** ✅

Already configured at: https://resend.com/webhooks

**Webhook URL:** `https://www.circletel.co.za/api/webhooks/resend`

**Events enabled:**
- ✅ email.sent
- ✅ email.delivered
- ✅ email.opened
- ✅ email.clicked
- ✅ email.bounced
- ✅ email.delivery_delayed

**Webhook secret:** `whsec_EvifycFX4o58Xa5qV4vtkDqUQHOMbIf8`

### **4. Database Migrations** ✅

Already applied to Supabase production database:
- ✅ `20251108060000_create_email_templates_system_fixed.sql`
- ✅ `20251108070000_create_notification_tracking_fixed.sql`

**Tables created:**
- `email_templates` (6 default templates seeded)
- `email_template_versions`
- `notification_tracking` (with 8 indexes, 2 views, 2 functions)
- `cms_pages`

### **5. Verified Domain** ✅

Domain verified in Resend: `notifications.circletelsa.co.za`

---

## 🚀 Deployment Steps

### **Step 1: Add Environment Variables to Vercel**

```bash
# Using Vercel CLI (alternative to web UI)
vercel env add RESEND_API_KEY production
# Paste: re_QhMu7F2n_JycLfeqNt8RNA692iWYcT6tM

vercel env add RESEND_FROM_EMAIL production
# Paste: noreply@notifications.circletelsa.co.za

vercel env add RESEND_REPLY_TO_EMAIL production
# Paste: contactus@circletel.co.za

vercel env add RESEND_WEBHOOK_SECRET production
# Paste: whsec_EvifycFX4o58Xa5qV4vtkDqUQHOMbIf8
```

### **Step 2: Deploy to Production**

```bash
# Option A: Push to main branch (auto-deploys)
git add .
git commit -m "feat: Add complete email notification system with webhook tracking"
git push origin main

# Option B: Deploy directly with Vercel CLI
vercel --prod
```

### **Step 3: Verify Deployment**

After deployment completes:

**Test webhook endpoint:**
```bash
curl https://www.circletel.co.za/api/webhooks/resend
```

Expected response:
```json
{
  "status": "ok",
  "service": "resend-webhook",
  "timestamp": "2025-11-08T..."
}
```

**Test email preview:**
```
https://www.circletel.co.za/api/emails/test?action=preview&template=order_confirmation
```

**Send test email (replace with your email):**
```bash
curl -X POST https://www.circletel.co.za/api/emails/test \
  -H "Content-Type: application/json" \
  -d '{
    "action": "send",
    "to": "jeffrey.de.wee@circletel.co.za",
    "templateId": "order_confirmation",
    "props": {
      "customerName": "Test Customer",
      "orderNumber": "ORD-PROD-001",
      "packageName": "100Mbps Fibre"
    }
  }'
```

### **Step 4: Monitor First Production Email**

After sending test email:

1. **Check Resend Dashboard:** https://resend.com/emails
   - Verify email sent successfully
   - Check delivery status

2. **Check Webhook Events in Supabase:**
```sql
SELECT
  message_id,
  event_type,
  email,
  metadata->>'subject' as subject,
  timestamp
FROM notification_tracking
ORDER BY timestamp DESC
LIMIT 10;
```

Expected events (in order):
- `sent` - Email sent via Resend
- `delivered` - Email delivered to recipient
- `opened` - Recipient opened email (may take a few minutes)
- `clicked` - If recipient clicks a link

3. **Check Your Inbox:**
   - Email should arrive from `CircleTel <noreply@notifications.circletelsa.co.za>`
   - Verify HTML renders correctly
   - Check all links work

---

## 🔍 Post-Deployment Verification

### **Verify Template Stats**

```sql
SELECT
  template_id,
  name,
  send_count,
  last_sent_at
FROM email_templates
ORDER BY last_sent_at DESC;
```

### **Verify Webhook Tracking**

```sql
SELECT
  event_type,
  COUNT(*) as count
FROM notification_tracking
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY event_type
ORDER BY count DESC;
```

Expected results after a few test emails:
- `sent`: 3-5
- `delivered`: 3-5
- `opened`: 1-2 (if you opened the emails)
- `clicked`: 0-1 (if you clicked any links)

---

## ✅ Success Criteria

Before marking deployment as complete:

- [ ] All 4 environment variables added to Vercel
- [ ] Production deployment successful
- [ ] Webhook health check returns 200 OK
- [ ] Test email sent successfully
- [ ] Email received in inbox with correct branding
- [ ] Webhook events recorded in `notification_tracking` table
- [ ] Template send counts incremented

---

## 📧 13 Available Templates

**Consumer (B2C):**
1. `order_confirmation` - Order confirmed with details
2. `payment_received` - Payment successful
3. `installation_scheduled` - Installation date confirmed
4. `installation_reminder` - Reminder 24 hours before installation
5. `service_activated` - Service is now active
6. `kyc_upload_request` - Request to upload KYC documents
7. `kyc_approved` - KYC documents approved
8. `kyc_rejected` - KYC documents need revision

**Business (B2B):**
9. `quote_sent` - Quote sent to business customer
10. `quote_approved` - Quote accepted
11. `invoice_generated` - Invoice created
12. `contract_signed` - Contract digitally signed
13. `kyc_verification_complete` - Business KYC complete

---

## 🎯 Usage in Code

### **Send Order Confirmation**

```typescript
import { EnhancedEmailService } from '@/lib/emails/enhanced-notification-service';

await EnhancedEmailService.sendEmail({
  to: 'customer@example.com',
  templateId: 'order_confirmation',
  props: {
    customerName: 'John Doe',
    orderNumber: 'ORD-20251108-001',
    orderUrl: 'https://www.circletel.co.za/orders/123',
    packageName: '100Mbps Fibre',
    totalAmount: 'R 799.00',
    installationDate: '15 November 2025',
  },
  orderId: 'uuid-here',
  customerId: 'uuid-here',
});
```

### **Send Payment Received**

```typescript
await EnhancedEmailService.sendEmail({
  to: 'customer@example.com',
  templateId: 'payment_received',
  props: {
    customerName: 'John Doe',
    orderNumber: 'ORD-20251108-001',
    paymentAmount: 'R 799.00',
    paymentMethod: 'Credit Card',
    paymentDate: '8 November 2025',
    accountNumber: 'CT-20251108-ABC12',
  },
  orderId: 'uuid-here',
});
```

---

## 🐛 Troubleshooting

### **Webhook not receiving events**

1. Check Resend webhook configuration: https://resend.com/webhooks
2. Verify webhook URL is correct: `https://www.circletel.co.za/api/webhooks/resend`
3. Check webhook secret matches in Vercel environment variables
4. Test webhook endpoint directly: `curl https://www.circletel.co.za/api/webhooks/resend`

### **Emails not sending**

1. Check `RESEND_API_KEY` is set in Vercel
2. Verify domain is verified in Resend: https://resend.com/domains
3. Check Resend dashboard for error messages: https://resend.com/emails
4. Verify `RESEND_FROM_EMAIL` uses verified domain: `noreply@notifications.circletelsa.co.za`

### **Webhook signature verification failing**

1. Check `RESEND_WEBHOOK_SECRET` matches in Vercel and Resend
2. Verify webhook endpoint is using the secret from environment
3. Check server time is accurate (replay attack prevention uses timestamps)

---

## 📚 Documentation

- **Implementation Status:** `EMAIL_SYSTEM_STATUS.md`
- **Testing Guide:** `docs/email-templates/TESTING_GUIDE.md`
- **Webhook Setup:** `docs/notifications/EMAIL_TRACKING_SETUP.md`
- **Quick Reference:** `docs/notifications/QUICK_REFERENCE.md`

---

**Deployment Ready:** ✅ All systems go! 🚀
