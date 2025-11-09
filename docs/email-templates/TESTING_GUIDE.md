# Email Template Testing Guide

**Last Updated:** 2025-11-08
**Status:** ⚠️ Routing conflict preventing server start - needs fix first

---

## ⚠️ **Current Issue: Routing Conflict**

The dev server is failing to start with this error:
```
[Error: You cannot use different slug names for the same dynamic path ('id' !== 'orderId').]
```

**This means**: Two routes in the same path are using different parameter names (`[id]` vs `[orderId]`)

**Need to fix** before testing emails.

---

## 🔍 **How to Find the Routing Conflict**

1. Search for conflicting dynamic routes:
   ```bash
   # Find all [id] routes
   Get-ChildItem -Path app -Recurse -Include "*[id]*" | Select-Object FullName

   # Find all [orderId] routes
   Get-ChildItem -Path app -Recurse -Include "*[orderId]*" | Select-Object FullName
   ```

2. Look for routes in the **same directory** with different parameter names
3. Rename one to match the other (or rename both to something else)

**Example conflict:**
```
app/api/orders/[id]/route.ts       ← [id]
app/api/orders/[orderId]/route.ts  ← [orderId]
```

**Fix:** Rename both to use the same parameter name

---

## ✅ **Once Routing is Fixed: Test Emails**

### **Step 1: Start Dev Server**

```bash
npm run dev:memory
```

Should see:
```
✓ Ready in 3.2s
- Local:        http://localhost:3000
```

### **Step 2: Send Test Email**

#### **Option A: Send Single Template**

```bash
node scripts/test-email-templates.js order_confirmation
```

#### **Option B: Send All Templates**

```bash
node scripts/test-email-templates.js all
```

This sends **13 test emails** to `jeffrey.de.wee@circletel.co.za`:

1. order_confirmation
2. payment_received
3. installation_scheduled
4. installation_reminder
5. service_activated
6. kyc_upload_request
7. kyc_approved
8. kyc_rejected
9. quote_sent
10. quote_approved
11. invoice_generated
12. contract_signed
13. kyc_verification_complete

#### **Option C: List Templates**

```bash
node scripts/test-email-templates.js list
```

#### **Option D: Preview in Browser**

```
http://localhost:3000/api/emails/test?action=preview&template=order_confirmation
```

---

## 📊 **What Gets Created**

### **1. Email Sent via Resend**

Each email sent creates:
- ✅ Rendered HTML email (from React Email template)
- ✅ Plain text version (auto-generated)
- ✅ Proper subject line with variable substitution
- ✅ Tracking tags (template, order_id, customer_id)

### **2. Database Tracking Record**

Automatically inserted into `notification_tracking`:

```sql
SELECT * FROM notification_tracking
WHERE email = 'jeffrey.de.wee@circletel.co.za'
ORDER BY timestamp DESC;
```

**Fields:**
- `message_id` - Resend message ID (re_...)
- `event_type` - 'sent'
- `notification_type` - 'email'
- `email` - jeffrey.de.wee@circletel.co.za
- `timestamp` - When sent
- `metadata` - Template ID, subject

### **3. Template Send Count Incremented**

```sql
SELECT template_id, name, send_count, last_sent_at
FROM email_templates
ORDER BY send_count DESC;
```

---

## 🧪 **Manual API Testing (Alternative)**

If the script doesn't work, test via curl:

### **Send Email**

```bash
curl -X POST http://localhost:3000/api/emails/test \
  -H "Content-Type: application/json" \
  -d '{
    "action": "send",
    "to": "jeffrey.de.wee@circletel.co.za",
    "templateId": "order_confirmation",
    "props": {
      "customerName": "Jeffrey de Wee",
      "orderNumber": "ORD-TEST-001",
      "packageName": "100Mbps Fibre"
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message_id": "re_abc123xyz..."
}
```

### **Preview Template**

```bash
curl "http://localhost:3000/api/emails/test?action=preview&template=order_confirmation"
```

Returns full HTML (view in browser).

### **List Templates**

```bash
curl "http://localhost:3000/api/emails/test?action=list"
```

---

## 📧 **Check Your Inbox**

After sending, check `jeffrey.de.wee@circletel.co.za`:

**What to verify:**
1. ✅ Email received (check spam folder too!)
2. ✅ Subject line has proper variable substitution
3. ✅ HTML renders correctly (CircleTel branding)
4. ✅ All content blocks display (header, hero, details, footer)
5. ✅ Buttons work (links are clickable)
6. ✅ Mobile responsive (check on phone)

---

## 🔍 **Verify Tracking**

### **Check Notification Tracking**

```sql
SELECT
  message_id,
  event_type,
  metadata->>'template_id' as template,
  metadata->>'subject' as subject,
  timestamp
FROM notification_tracking
WHERE email = 'jeffrey.de.wee@circletel.co.za'
ORDER BY timestamp DESC
LIMIT 10;
```

**Expected:** One record per email sent with `event_type = 'sent'`

### **Check Template Stats**

```sql
SELECT
  template_id,
  name,
  send_count,
  last_sent_at
FROM email_templates
WHERE send_count > 0
ORDER BY last_sent_at DESC;
```

**Expected:** Send counts incremented for tested templates

---

## 🎯 **Next: Set Up Webhook for Full Tracking**

Once emails are working, set up Resend webhook to track:
- ✅ Delivered
- ✅ Opened
- ✅ Clicked
- ✅ Bounced

See: `docs/notifications/EMAIL_TRACKING_SETUP.md`

---

## 🐛 **Troubleshooting**

### **Issue: RESEND_API_KEY not configured**

```bash
# Add to .env.local
RESEND_API_KEY=re_your_key_here
```

Get key from: https://resend.com/api-keys

### **Issue: Email not sending (no error)**

Check Resend dashboard:
1. Go to https://resend.com/emails
2. Find your email
3. Check status (sent, delivered, bounced)

### **Issue: Email goes to spam**

1. Verify domain in Resend
2. Add SPF/DKIM records
3. Check sender reputation

### **Issue: Template not found**

```bash
# List available templates
node scripts/test-email-templates.js list
```

### **Issue: Tracking not recording**

Check RLS policies:
```sql
-- Service role should be able to insert
SELECT * FROM pg_policies
WHERE tablename = 'notification_tracking';
```

---

## 📚 **Files Created**

1. ✅ **Email Renderer** - `lib/emails/email-renderer.ts`
2. ✅ **Enhanced Service** - `lib/emails/enhanced-notification-service.ts`
3. ✅ **Test API** - `app/api/emails/test/route.ts`
4. ✅ **Test Script** - `scripts/test-email-templates.js`
5. ✅ **React Templates** - `emails/templates/consumer/*.tsx` + `emails/templates/business/*.tsx`

---

## ✅ **Success Checklist**

Before marking as complete:

- [ ] Routing conflict fixed
- [ ] Dev server starts successfully
- [ ] Test script runs without errors
- [ ] Emails received in Jeffrey's inbox
- [ ] Tracking records created in database
- [ ] Template send counts incremented
- [ ] HTML renders correctly
- [ ] All 13 templates tested
- [ ] Resend webhook configured (optional)

---

**Next Steps:** Fix routing conflict → Test emails → Set up webhook → Build admin UI
