# Email & SMS Notification Tracking Setup Guide

**Created:** 2025-11-08
**Status:** ✅ Ready for Production
**Estimated Setup Time:** 15 minutes

---

## 📋 Overview

CircleTel now has **complete email tracking** capabilities to monitor:
- ✅ Email delivery status
- ✅ Email open tracking (tracking pixel)
- ✅ Link click tracking
- ✅ Bounce detection
- ✅ SMS delivery tracking (when Clickatell configured)

**Provider:** Resend (email) + Clickatell (SMS - future)

---

## 🎯 What You Get

### Email Tracking Metrics

| Metric | Description | Use Case |
|--------|-------------|----------|
| **Sent** | Email successfully submitted | Confirm message was sent |
| **Delivered** | Email reached recipient's inbox | Verify delivery |
| **Opened** | Recipient opened the email | Measure engagement |
| **Clicked** | Recipient clicked a link | Track CTA performance |
| **Bounced** | Email failed to deliver | Identify invalid addresses |

### Analytics Views

```sql
-- Order notification summary
SELECT * FROM v_order_notifications
WHERE order_number = 'ORD-20251108-9841';

-- Customer engagement score
SELECT * FROM v_customer_notification_engagement
WHERE email = 'shaunr07@gmail.com';

-- Notification timeline
SELECT * FROM get_order_notification_timeline('order-uuid-here');
```

---

## 🚀 Setup Instructions

### Step 1: Apply Database Migration

**⚠️ IMPORTANT:** Apply the migration before configuring webhooks

```bash
# Option A: Apply specific migration (recommended)
psql $DATABASE_URL -f supabase/migrations/20251108070000_create_notification_tracking.sql

# Option B: Apply all pending migrations
npx supabase db push
```

**Verify migration:**
```sql
-- Check table exists
SELECT COUNT(*) FROM notification_tracking;

-- Should return: 0 (empty table, ready to use)
```

---

### Step 2: Configure Resend Webhook

#### A. Get Webhook Secret

1. Go to **[Resend Dashboard](https://resend.com/webhooks)**
2. Click **"Create Webhook"**
3. Enter webhook details:
   - **Endpoint URL:** `https://www.circletel.co.za/api/webhooks/resend`
   - **Name:** CircleTel Email Tracking
   - **Events:** Select all:
     - ✅ `email.sent`
     - ✅ `email.delivered`
     - ✅ `email.delivery_delayed`
     - ✅ `email.bounced`
     - ✅ `email.opened`
     - ✅ `email.clicked`
4. Click **"Create"**
5. Copy the **Webhook Secret** (starts with `whsec_...`)

#### B. Add Secret to Environment Variables

Add to `.env.local` (development) and Vercel Environment Variables (production):

```env
# Resend Webhook Secret (for signature verification)
RESEND_WEBHOOK_SECRET=whsec_abc123xyz...
```

**Deploy to Vercel:**
```bash
# Add environment variable to Vercel
vercel env add RESEND_WEBHOOK_SECRET

# Paste the webhook secret when prompted

# Redeploy to apply changes
vercel --prod
```

---

### Step 3: Test Webhook

#### A. Send Test Notification

```bash
# Send test email to Shaun
node scripts/send-notification-shaun.js
```

**Expected output:**
```
✅ Email notification sent successfully!
   Message ID: re_abc123xyz
   Recipient: shaunr07@gmail.com
```

#### B. Trigger Resend Test Event

1. Go to **Resend Dashboard → Webhooks**
2. Click your webhook
3. Click **"Send Test Event"**
4. Select event type: `email.sent`
5. Click **"Send Test"**

#### C. Verify Tracking Record

```sql
-- Check if webhook was received
SELECT
  event_type,
  email,
  timestamp,
  metadata->>'subject' AS subject
FROM notification_tracking
ORDER BY timestamp DESC
LIMIT 5;
```

**Expected result:**
```
 event_type |        email         |         timestamp          |           subject
------------+----------------------+----------------------------+------------------------------
 opened     | shaunr07@gmail.com   | 2025-11-08 14:23:15+02     | Order Confirmation - ORD-...
 delivered  | shaunr07@gmail.com   | 2025-11-08 14:22:10+02     | Order Confirmation - ORD-...
 sent       | shaunr07@gmail.com   | 2025-11-08 14:22:05+02     | Order Confirmation - ORD-...
```

---

## 📊 Usage Examples

### Send Order Notification

```typescript
// Method 1: Use notification service
import { EmailNotificationService } from '@/lib/notifications/notification-service';

const order = await getOrder('ORD-20251108-9841');
const result = await EmailNotificationService.sendOrderConfirmation(order);

console.log('Message ID:', result.message_id);
```

```bash
# Method 2: Use API endpoint
curl -X POST https://www.circletel.co.za/api/notifications/send-order-confirmation \
  -H "Content-Type: application/json" \
  -d '{"orderNumber": "ORD-20251108-9841"}'
```

### Check Notification Status

```sql
-- Has customer opened the email?
SELECT
  CASE
    WHEN COUNT(*) FILTER (WHERE event_type = 'opened') > 0 THEN 'Yes'
    ELSE 'No'
  END AS email_opened
FROM notification_tracking
WHERE email = 'shaunr07@gmail.com'
  AND order_id = (
    SELECT id FROM consumer_orders
    WHERE order_number = 'ORD-20251108-9841'
  );
```

### Get Engagement Metrics

```sql
-- Order notification summary
SELECT
  order_number,
  customer_name,
  emails_sent,
  emails_delivered,
  emails_opened,
  emails_clicked,
  email_open_rate,
  email_click_rate,
  last_email_opened
FROM v_order_notifications
WHERE order_number = 'ORD-20251108-9841';
```

**Example result:**
```
 order_number      | customer_name    | emails_sent | emails_delivered | emails_opened | emails_clicked | email_open_rate | email_click_rate | last_email_opened
-------------------+------------------+-------------+------------------+---------------+----------------+-----------------+------------------+-------------------
 ORD-20251108-9841 | Shaun Robertson  | 3           | 3                | 2             | 1              | 66.67           | 33.33            | 2025-11-08 14:23:15
```

---

## 🔍 Monitoring & Analytics

### Real-Time Notification Dashboard

Create an admin dashboard to monitor notifications:

```sql
-- Daily notification stats (last 30 days)
SELECT
  DATE(timestamp) AS date,
  notification_type,
  event_type,
  COUNT(*) AS count
FROM notification_tracking
WHERE timestamp >= NOW() - INTERVAL '30 days'
GROUP BY DATE(timestamp), notification_type, event_type
ORDER BY date DESC, notification_type, event_type;
```

### Email Deliverability Report

```sql
-- Email health metrics
SELECT
  COUNT(*) AS total_sent,
  COUNT(*) FILTER (WHERE event_type = 'delivered') AS delivered,
  COUNT(*) FILTER (WHERE event_type = 'bounced') AS bounced,
  ROUND(
    (COUNT(*) FILTER (WHERE event_type = 'delivered')::DECIMAL / COUNT(*)::DECIMAL) * 100,
    2
  ) AS delivery_rate,
  ROUND(
    (COUNT(*) FILTER (WHERE event_type = 'bounced')::DECIMAL / COUNT(*)::DECIMAL) * 100,
    2
  ) AS bounce_rate
FROM notification_tracking
WHERE notification_type = 'email'
  AND timestamp >= NOW() - INTERVAL '7 days';
```

### Find Unengaged Customers

```sql
-- Customers who never opened emails
SELECT
  customer_name,
  email,
  total_emails,
  email_opens,
  last_email_sent
FROM v_customer_notification_engagement
WHERE total_emails > 0
  AND email_opens = 0
ORDER BY last_email_sent DESC;
```

---

## 🎨 Admin Panel Integration

### Add Notification Tracking to Order Details Page

**Location:** `app/admin/orders/[id]/page.tsx`

```typescript
// Fetch notification tracking data
const { data: notifications } = await supabase
  .from('notification_tracking')
  .select('*')
  .eq('order_id', orderId)
  .order('timestamp', { ascending: false });

// Display notification timeline
<div className="notification-timeline">
  <h3>Notification History</h3>
  {notifications.map(notif => (
    <div key={notif.id} className="timeline-item">
      <Badge variant={notif.event_type === 'opened' ? 'success' : 'default'}>
        {notif.event_type}
      </Badge>
      <span>{notif.timestamp}</span>
      {notif.event_type === 'clicked' && (
        <span>Clicked: {notif.metadata.link}</span>
      )}
    </div>
  ))}
</div>
```

---

## 🔐 Security

### Webhook Signature Verification

The webhook endpoint **automatically verifies** Resend signatures using HMAC-SHA256:

```typescript
// Signature format: "t=<timestamp>,v1=<signature>"
// Verification steps:
// 1. Extract timestamp and signature from header
// 2. Check timestamp (reject if >5 minutes old - prevent replay attacks)
// 3. Calculate expected signature: HMAC-SHA256(timestamp + payload, secret)
// 4. Use timing-safe comparison to prevent timing attacks
```

**Security features:**
- ✅ HMAC-SHA256 signature verification
- ✅ Replay attack prevention (5-minute window)
- ✅ Timing-safe comparison
- ✅ Automatic validation before processing

---

## 📱 SMS Tracking (Future)

When Clickatell is configured, SMS tracking will work similarly:

**Environment Variables:**
```env
SMS_API_ENDPOINT=https://api.clickatell.com/rest/message
SMS_API_KEY=your-clickatell-api-key
CLICKATELL_WEBHOOK_SECRET=your-webhook-secret
```

**Webhook endpoint:** `/api/webhooks/clickatell`

**SMS Event Types:**
- `sent` - SMS submitted to provider
- `delivered` - SMS delivered to phone
- `failed` - SMS delivery failed

**⚠️ Note:** SMS does NOT support open/read tracking (protocol limitation)

---

## 🐛 Troubleshooting

### Webhook Not Receiving Events

1. **Check webhook URL is accessible:**
   ```bash
   curl https://www.circletel.co.za/api/webhooks/resend
   ```
   **Expected:** `{"status":"ok","service":"resend-webhook"}`

2. **Verify webhook secret is set:**
   ```bash
   # Check environment variable exists
   echo $RESEND_WEBHOOK_SECRET
   ```

3. **Check Resend webhook logs:**
   - Go to Resend Dashboard → Webhooks
   - Click your webhook
   - View **"Delivery Logs"**
   - Look for failed deliveries (HTTP errors)

### Tracking Not Recording

1. **Check table exists:**
   ```sql
   SELECT COUNT(*) FROM notification_tracking;
   ```

2. **Check webhook logs:**
   ```bash
   # View Next.js logs
   npm run dev:memory

   # Look for:
   # ✅ "📧 Resend webhook received..."
   # ❌ "Invalid webhook signature"
   ```

3. **Test manually:**
   ```bash
   # Send test webhook
   curl -X POST http://localhost:3000/api/webhooks/resend \
     -H "Content-Type: application/json" \
     -H "resend-signature: t=1234567890,v1=test" \
     -d '{"type":"email.sent","data":{"email_id":"test","to":"test@example.com"}}'
   ```

---

## 📈 Performance Optimization

### Database Indexes

The migration creates **8 indexes** for fast querying:

```sql
-- Indexes created automatically:
idx_notification_tracking_message_id    -- Fast lookup by message ID
idx_notification_tracking_order_id      -- Fast lookup by order
idx_notification_tracking_customer_id   -- Fast lookup by customer
idx_notification_tracking_event_type    -- Filter by event type
idx_notification_tracking_notification_type -- Filter by email/sms
idx_notification_tracking_timestamp     -- Time-series queries (DESC)
idx_notification_tracking_email         -- Lookup by email address
idx_notification_tracking_phone         -- Lookup by phone number
```

### Cleanup Old Data (Optional)

To keep table size manageable, archive old tracking data:

```sql
-- Archive tracking data older than 90 days
DELETE FROM notification_tracking
WHERE timestamp < NOW() - INTERVAL '90 days';
```

---

## ✅ Deployment Checklist

Before going to production:

- [ ] Apply database migration (`20251108070000_create_notification_tracking.sql`)
- [ ] Verify table exists: `SELECT COUNT(*) FROM notification_tracking;`
- [ ] Create Resend webhook at https://resend.com/webhooks
- [ ] Copy webhook secret to `.env.local` and Vercel
- [ ] Test webhook with `node scripts/send-notification-shaun.js`
- [ ] Verify tracking record appears in database
- [ ] Deploy webhook endpoint to production
- [ ] Update Resend webhook URL to production domain
- [ ] Send test email and verify tracking
- [ ] Create admin dashboard for notification monitoring

---

## 📚 API Reference

### Webhook Endpoint

**URL:** `POST /api/webhooks/resend`

**Headers:**
- `Content-Type: application/json`
- `resend-signature: t=<timestamp>,v1=<signature>`

**Request Body:**
```json
{
  "type": "email.opened",
  "created_at": "2025-11-08T12:22:15.000Z",
  "data": {
    "email_id": "re_abc123xyz",
    "to": "shaunr07@gmail.com",
    "from": "noreply@notifications.circletelsa.co.za",
    "subject": "Order Confirmation - ORD-20251108-9841",
    "created_at": "2025-11-08T12:22:10.000Z"
  }
}
```

**Response:**
```json
{
  "success": true,
  "event_type": "email.opened",
  "message_id": "re_abc123xyz"
}
```

### Database Schema

**Table:** `notification_tracking`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `message_id` | TEXT | Resend/Clickatell message ID |
| `event_type` | TEXT | sent, delivered, opened, clicked, bounced, failed |
| `notification_type` | TEXT | email or sms |
| `email` | TEXT | Recipient email |
| `phone` | TEXT | Recipient phone |
| `order_id` | UUID | Related order (nullable) |
| `customer_id` | UUID | Related customer (nullable) |
| `timestamp` | TIMESTAMPTZ | Event timestamp |
| `metadata` | JSONB | Additional event data |

---

## 🎉 Success!

You now have **complete email tracking** for CircleTel notifications!

**Next Steps:**
1. Apply migration to database
2. Configure Resend webhook
3. Send test notification to Shaun
4. Build admin dashboard for analytics

**Questions?** Check the webhook logs or contact the dev team.

---

**Last Updated:** 2025-11-08
**Version:** 1.0
**Maintained By:** CircleTel Development Team
