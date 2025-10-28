# Quote Notification System

## Overview

The Quote Notification System automatically sends email and SMS notifications to relevant stakeholders when quote events occur. This keeps admins, sales agents, and customers informed throughout the quote lifecycle.

## Architecture

### Database Schema

**Tables:**
- `notification_templates` - Email/SMS templates with variable substitution
- `notifications` - Log of all sent notifications with delivery tracking
- `notification_preferences` - Per-user notification preferences

**Enums:**
- `notification_type` - email, sms, push
- `notification_status` - pending, sent, delivered, failed, bounced
- `notification_event` - quote_created, quote_approved, quote_sent, etc.

### Notification Events

| Event | Triggered When | Recipients |
|-------|---------------|------------|
| `quote_created` | New quote submitted | Admin |
| `quote_approved` | Admin approves quote | Agent + Customer |
| `quote_sent` | Quote sent to customer | Agent |
| `quote_viewed` | Customer views quote | Agent |
| `quote_accepted` | Customer accepts quote | Admin + Agent |
| `quote_rejected` | Customer rejects quote | Admin + Agent |
| `quote_expired` | Quote validity period ends | Agent |

### Notification Flow

```
Quote Event Occurs
       ↓
QuoteNotificationService.sendForQuoteEvent()
       ↓
1. Fetch quote details from database
2. Fetch notification template
3. Substitute {{variables}} in template
4. Create notification record (status: pending)
5. Send email/SMS
6. Update notification status (sent/failed)
       ↓
Notification logged in database
```

## Template System

### Variable Substitution

Templates use `{{variable}}` syntax for dynamic content:

```
Subject: New Quote Request: {{quote_number}}

A new quote request has been submitted.

Quote Number: {{quote_number}}
Company: {{company_name}}
Contact: {{contact_name}} ({{contact_email}})
Total Monthly: R{{total_monthly}}
Agent: {{agent_name}}

View quote: {{admin_url}}
```

### Available Variables

**Quote Details:**
- `{{quote_number}}` - BQ-2025-001
- `{{company_name}}` - Customer company
- `{{contact_name}}` - Primary contact
- `{{contact_email}}` - Contact email
- `{{contact_phone}}` - Contact phone
- `{{service_address}}` - Installation address

**Pricing:**
- `{{total_monthly}}` - Monthly total (incl VAT)
- `{{total_installation}}` - Installation total (incl VAT)
- `{{subtotal_monthly}}` - Subtotal before VAT
- `{{subtotal_installation}}` - Installation before VAT
- `{{vat_amount_monthly}}` - Monthly VAT amount
- `{{vat_amount_installation}}` - Installation VAT amount

**Contract:**
- `{{contract_term}}` - 12, 24, or 36 months
- `{{valid_until}}` - Quote expiry date

**Agent Details:**
- `{{agent_name}}` - Full name
- `{{agent_email}}` - Email address
- `{{agent_company}}` - Agent's company
- `{{commission_rate}}` - 5.0 (percentage)
- `{{commission_amount}}` - R250.00 (calculated)

**Event Details:**
- `{{viewed_at}}` - When quote was viewed
- `{{accepted_at}}` - When quote was accepted
- `{{rejected_at}}` - When quote was rejected
- `{{rejection_reason}}` - Why quote was rejected

**URLs:**
- `{{acceptance_url}}` - Customer acceptance link
- `{{agent_dashboard_url}}` - Agent portal
- `{{admin_url}}` - Admin panel link

### Default Templates

**7 Email Templates:**
1. Quote Created (Admin)
2. Quote Approved (Agent)
3. Quote Approved (Customer)
4. Quote Viewed (Agent)
5. Quote Accepted (Agent)
6. Quote Accepted (Admin)
7. Quote Rejected (Agent)
8. Quote Expired (Agent)

**6 SMS Templates:**
- Shorter versions of email templates
- Character limits respected (~160 chars)
- Disabled by default (can be enabled per agent)

## Usage

### Automatic Notifications

Notifications are triggered automatically when quotes are created:

```typescript
// In app/api/quotes/request/submit/route.ts
QuoteNotificationService.sendForQuoteEvent('quote_created', quote.id);
```

### Manual Notifications

Send notifications via API for testing or admin actions:

```bash
POST /api/notifications/send
Content-Type: application/json

{
  "event": "quote_approved",
  "quote_id": "uuid-here",
  "context": {
    "viewed_at": "2025-10-28 14:30"
  }
}
```

### In Code

```typescript
import { QuoteNotificationService } from '@/lib/notifications/quote-notifications';

// Send notification
const result = await QuoteNotificationService.sendForQuoteEvent(
  'quote_accepted',
  quoteId,
  { accepted_at: new Date().toISOString() }
);

if (result.success) {
  console.log('Notification sent:', result.notification_id);
} else {
  console.error('Failed:', result.error);
}
```

## Notification Preferences

Users can control which notifications they receive:

```typescript
// notification_preferences table
{
  user_type: 'agent',
  user_id: 'agent-uuid',
  event: 'quote_viewed',
  email_enabled: true,
  sms_enabled: false,
  push_enabled: false
}
```

**Default Behavior:**
- All email notifications enabled
- All SMS notifications disabled
- Push notifications not implemented yet

## Email Integration

### Current (Development)

Notifications are logged to console:

```
==================== NOTIFICATION ====================
Type: EMAIL
To: agent@company.com
Subject: Quote Approved: BQ-2025-001

Great news! Your quote has been approved...
======================================================
```

### Production (TODO)

**Resend Integration:**

```typescript
// Set environment variable
RESEND_API_KEY=re_...

// lib/notifications/quote-notifications.ts will use Resend
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
await resend.emails.send({
  from: 'CircleTel <notifications@circletel.co.za>',
  to: recipient_email,
  subject,
  text: body
});
```

**Alternative Providers:**
- SendGrid
- Mailgun
- Amazon SES
- Postmark

## SMS Integration

### Current (Development)

SMS messages are logged to console (not sent).

### Production (TODO)

**Africa's Talking Integration:**

```typescript
// Set environment variables
SMS_API_KEY=your_africastalking_key
SMS_USERNAME=sandbox (or your production username)

// lib/notifications/quote-notifications.ts
import AfricasTalking from 'africastalking';

const africastalking = AfricasTalking({
  apiKey: process.env.SMS_API_KEY!,
  username: process.env.SMS_USERNAME!
});

await africastalking.SMS.send({
  to: [recipient_phone],
  message: body
});
```

**Alternative Providers:**
- Twilio
- Clickatell
- BulkSMS

## Notification Log

All notifications are logged in the `notifications` table:

```sql
SELECT
  id,
  event,
  type,
  recipient_email,
  subject,
  status,
  sent_at,
  delivered_at,
  error_message
FROM notifications
WHERE quote_id = 'uuid-here'
ORDER BY created_at DESC;
```

**Status Tracking:**
- `pending` - Queued, not yet sent
- `sent` - Delivered to email/SMS provider
- `delivered` - Confirmed received (if provider supports)
- `failed` - Sending error occurred
- `bounced` - Invalid recipient address

## Testing

### Test Quote Creation Notification

1. Create a test quote via the form
2. Check console for notification output
3. Query database:

```sql
SELECT * FROM notifications
WHERE quote_id = 'your-quote-id'
ORDER BY created_at DESC LIMIT 1;
```

### Test Manual Notification

```bash
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "event": "quote_approved",
    "quote_id": "your-quote-uuid"
  }'
```

### Test All Events

```bash
# Loop through all events
for event in quote_created quote_approved quote_sent quote_viewed quote_accepted quote_rejected quote_expired
do
  echo "Testing $event..."
  curl -X POST http://localhost:3000/api/notifications/send \
    -H "Content-Type: application/json" \
    -d "{\"event\": \"$event\", \"quote_id\": \"your-quote-uuid\"}"
  echo "\n"
done
```

## Customizing Templates

### Via Database

```sql
UPDATE notification_templates
SET body = 'Your custom template with {{variables}}'
WHERE event = 'quote_approved' AND type = 'email';
```

### Via Admin UI (TODO)

Future admin panel will allow:
- Edit templates in rich text editor
- Preview with sample data
- Test send to specific email
- Enable/disable templates
- Manage SMS character limits

## Security & Privacy

**Row Level Security (RLS):**
- Agents can only view their own notifications
- Admins can view all notifications
- Templates require admin access to modify

**Data Protection:**
- Notification content is not encrypted at rest (use Supabase encryption if needed)
- Personal data (email/phone) is stored with RLS
- Failed notifications store error messages (no sensitive data)

**Rate Limiting:**
- No built-in rate limiting yet
- TODO: Implement per-agent daily limits
- TODO: Add exponential backoff for failed sends

## Troubleshooting

### Notifications Not Sending

**Check:**
1. Database: Is notification record created?
   ```sql
   SELECT * FROM notifications WHERE quote_id = 'uuid' LIMIT 1;
   ```

2. Template: Is template enabled?
   ```sql
   SELECT * FROM notification_templates WHERE event = 'quote_created' AND enabled = true;
   ```

3. Console: Check for error messages

4. Status: Check notification status
   ```sql
   SELECT status, error_message FROM notifications WHERE id = 'uuid';
   ```

### Variables Not Substituting

**Issue:** Template shows `{{variable}}` in output

**Causes:**
- Variable name typo in template
- Variable not provided in context
- Variable value is null/undefined

**Fix:**
- Check spelling: `{{quote_number}}` not `{{quoteNumber}}`
- Ensure variable is in context object
- Use default values: `{{agent_name || 'No agent'}}`

### Wrong Recipients

**Issue:** Notification sent to wrong person

**Check:**
1. Event type: Correct recipients for event?
2. Agent association: Quote has correct agent_id?
3. Email address: Correct email in database?

```sql
SELECT
  bq.quote_number,
  bq.contact_email,
  sa.email as agent_email
FROM business_quotes bq
LEFT JOIN sales_agents sa ON bq.agent_id = sa.id
WHERE bq.id = 'uuid';
```

## Performance Considerations

**Async Sending:**
- Notifications are sent asynchronously (don't block quote creation)
- Failed notifications don't fail the main request
- Consider background job queue for high volume

**Batch Processing:**
- Multiple recipients = multiple notifications
- Each notification logged separately
- Consider batching for same event/time

**Database Impact:**
- Every notification creates 1 row in `notifications` table
- Indexed on quote_id, agent_id, status, created_at
- Consider archiving old notifications (> 90 days)

## Future Enhancements

### Phase 1 (Immediate)
- [ ] Resend email integration
- [ ] Africa's Talking SMS integration
- [ ] Admin UI for managing templates

### Phase 2 (Short-term)
- [ ] Notification preferences UI for agents
- [ ] Email templates with HTML/CSS styling
- [ ] Attachment support (quote PDF)
- [ ] Delivery status webhooks

### Phase 3 (Long-term)
- [ ] Push notifications (web + mobile)
- [ ] WhatsApp Business integration
- [ ] Notification scheduling (send later)
- [ ] A/B testing for templates
- [ ] Analytics dashboard

---

**Last Updated:** 2025-10-28
**Status:** ✅ Core Implementation Complete
**Version:** 1.0
