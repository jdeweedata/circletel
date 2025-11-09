# Notification Tracking - Quick Reference

**Last Updated:** 2025-11-08

---

## 🚀 Send Notifications

### Send to Shaun's Order

```bash
# Send order confirmation email
node scripts/send-notification-shaun.js
```

### Send to Any Order

```bash
# Via API
curl -X POST http://localhost:3000/api/notifications/send-order-confirmation \
  -H "Content-Type: application/json" \
  -d '{"orderNumber": "ORD-20251108-9841"}'
```

```typescript
// Via TypeScript
import { EmailNotificationService } from '@/lib/notifications/notification-service';

const order = await getOrder('ORD-20251108-9841');
await EmailNotificationService.sendOrderConfirmation(order);
```

---

## 📊 Check Tracking Status

### Did Customer Open Email?

```sql
SELECT
  CASE
    WHEN COUNT(*) FILTER (WHERE event_type = 'opened') > 0
    THEN '✅ Yes'
    ELSE '❌ No'
  END AS email_opened,
  MAX(timestamp) FILTER (WHERE event_type = 'opened') AS opened_at
FROM notification_tracking
WHERE email = 'shaunr07@gmail.com'
  AND order_id = (
    SELECT id FROM consumer_orders WHERE order_number = 'ORD-20251108-9841'
  );
```

### Order Notification Summary

```sql
SELECT * FROM v_order_notifications
WHERE email = 'shaunr07@gmail.com';
```

**Returns:**
- emails_sent
- emails_delivered
- emails_opened
- emails_clicked
- email_open_rate
- last_email_opened

### Notification Timeline

```sql
SELECT * FROM get_order_notification_timeline(
  (SELECT id FROM consumer_orders WHERE order_number = 'ORD-20251108-9841')
);
```

**Returns chronological list:**
```
      event_time       | event_type | notification_type |         details
-----------------------+------------+-------------------+-------------------------
 2025-11-08 14:23:15   | opened     | email             | Opened email
 2025-11-08 14:22:10   | delivered  | email             | Successfully delivered
 2025-11-08 14:22:05   | sent       | email             | sent
```

---

## 🔧 Troubleshooting

### Check If Webhook Is Working

```bash
# Health check
curl https://www.circletel.co.za/api/webhooks/resend

# Expected: {"status":"ok","service":"resend-webhook"}
```

### View Recent Tracking Events

```sql
SELECT
  event_type,
  email,
  timestamp,
  metadata->>'subject' AS subject
FROM notification_tracking
ORDER BY timestamp DESC
LIMIT 10;
```

### Check For Bounces

```sql
SELECT
  email,
  COUNT(*) AS bounce_count,
  metadata->>'bounce_reason' AS reason
FROM notification_tracking
WHERE event_type = 'bounced'
  AND timestamp >= NOW() - INTERVAL '7 days'
GROUP BY email, metadata->>'bounce_reason'
ORDER BY bounce_count DESC;
```

---

## 📈 Analytics Queries

### Daily Email Stats (Last 7 Days)

```sql
SELECT
  DATE(timestamp) AS date,
  COUNT(*) FILTER (WHERE event_type = 'sent') AS sent,
  COUNT(*) FILTER (WHERE event_type = 'delivered') AS delivered,
  COUNT(*) FILTER (WHERE event_type = 'opened') AS opened,
  COUNT(*) FILTER (WHERE event_type = 'clicked') AS clicked,
  ROUND(
    (COUNT(*) FILTER (WHERE event_type = 'opened')::DECIMAL /
     COUNT(*) FILTER (WHERE event_type = 'delivered')::DECIMAL) * 100,
    2
  ) AS open_rate
FROM notification_tracking
WHERE notification_type = 'email'
  AND timestamp >= NOW() - INTERVAL '7 days'
GROUP BY DATE(timestamp)
ORDER BY date DESC;
```

### Top Performing Email Templates

```sql
SELECT
  template_id,
  name,
  total_sent,
  avg_open_rate,
  avg_click_rate
FROM v_email_template_performance
ORDER BY avg_open_rate DESC;
```

### Customers Not Engaging

```sql
SELECT
  customer_name,
  email,
  total_emails,
  engagement_score,
  last_notification
FROM v_customer_notification_engagement
WHERE total_emails > 3
  AND engagement_score < 20
ORDER BY last_notification DESC;
```

---

## ⚙️ Setup Commands

### Apply Migration

```bash
# Manual SQL (recommended)
psql $DATABASE_URL -f supabase/migrations/20251108070000_create_notification_tracking.sql

# OR via Supabase CLI
npx supabase db push
```

### Add Webhook Secret

```bash
# Add to Vercel
vercel env add RESEND_WEBHOOK_SECRET

# Paste webhook secret when prompted (from Resend dashboard)
```

### Deploy Changes

```bash
# Deploy to production
git add .
git commit -m "feat: Add email tracking system"
git push origin main

# OR deploy to Vercel directly
vercel --prod
```

---

## 📱 API Endpoints

### Send Order Confirmation

```
POST /api/notifications/send-order-confirmation
```

**Body:**
```json
{
  "orderId": "uuid",
  "orderNumber": "ORD-20251108-9841"
}
```

### Resend Webhook (Internal)

```
POST /api/webhooks/resend
```

**Headers:**
- `resend-signature: t=<timestamp>,v1=<signature>`

---

## 🎯 Common Use Cases

### 1. Send Order Confirmation to Customer

```bash
node scripts/send-notification-shaun.js
```

### 2. Check If Customer Received Email

```sql
SELECT COUNT(*) > 0 AS received
FROM notification_tracking
WHERE email = 'shaunr07@gmail.com'
  AND event_type = 'delivered'
  AND timestamp >= NOW() - INTERVAL '1 hour';
```

### 3. Find Undelivered Emails

```sql
SELECT
  message_id,
  email,
  metadata->>'subject' AS subject,
  timestamp
FROM notification_tracking
WHERE event_type = 'bounced'
  AND timestamp >= NOW() - INTERVAL '24 hours';
```

### 4. Track Email Journey

```sql
SELECT
  event_type,
  timestamp,
  metadata
FROM notification_tracking
WHERE message_id = 're_abc123xyz'
ORDER BY timestamp;
```

---

## 💡 Tips

1. **Always check delivery before open rate**
   - Emails must be delivered before they can be opened
   - Low delivery rate = email configuration issue

2. **Track engagement trends over time**
   - Compare open rates week-over-week
   - Identify seasonal patterns

3. **Monitor bounce rate**
   - Bounce rate >5% indicates data quality issues
   - Clean up invalid email addresses

4. **Use click tracking for CTAs**
   - Track which links get the most clicks
   - Optimize email layout based on data

5. **Segment by order type**
   - Different templates perform differently
   - Track B2B vs B2C engagement separately

---

## 🐛 Quick Fixes

### Webhook Not Working

```bash
# 1. Check endpoint is accessible
curl https://www.circletel.co.za/api/webhooks/resend

# 2. Verify secret is set
echo $RESEND_WEBHOOK_SECRET

# 3. Check Resend webhook logs
# → Go to Resend Dashboard → Webhooks → View Logs
```

### No Tracking Data

```sql
-- 1. Check table exists
SELECT COUNT(*) FROM notification_tracking;

-- 2. Check if any events recorded
SELECT COUNT(*), event_type
FROM notification_tracking
GROUP BY event_type;

-- 3. Check RLS policies (should see data)
SELECT * FROM notification_tracking LIMIT 5;
```

### Email Not Sending

```typescript
// Check Resend API key is set
console.log('Resend API Key:', process.env.RESEND_API_KEY?.substring(0, 10) + '...');

// Test Resend connection
const result = await EmailNotificationService.sendOrderConfirmation(testOrder);
console.log('Result:', result);
```

---

**Need Help?** See full documentation: `docs/notifications/EMAIL_TRACKING_SETUP.md`
