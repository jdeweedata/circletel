# Order Notification System

## Current Status: ✅ ACTIVE

CircleTel automatically sends email and can send SMS communications to customers when they place an order.

---

## 📧 Email Notifications (ACTIVE)

### What's Already Working

When a customer places an order through `/api/orders/consumer`, the system **automatically sends**:

1. **Order Confirmation Email** to the customer
   - Order number & details
   - Package information (name, speed, price)
   - Installation address
   - Next steps guide
   - Link to track order status

### Email Template

The email includes:
- ✅ CircleTel branded header (orange #F5831F)
- ✅ Order summary with pricing
- ✅ "What happens next?" guide (4 steps)
- ✅ CTA button to view order status
- ✅ Professional footer with support contact info

### Service Provider

- **Provider**: Resend (https://resend.com)
- **From Email**: `noreply@circletel.co.za`
- **From Name**: `CircleTel`
- **Configuration**: `RESEND_API_KEY` in `.env.local`

### Implementation

**File**: `app/api/orders/consumer/route.ts:118-128`

```typescript
// Send confirmation email (async, don't block response)
EmailNotificationService.sendOrderConfirmation(order as ConsumerOrder)
  .then((emailResult) => {
    if (emailResult.success) {
      console.log('Order confirmation email sent to:', order.email);
    } else {
      console.error('Failed to send confirmation email:', emailResult.error);
    }
  });
```

---

## 📱 SMS Notifications (AVAILABLE - Not Currently Active)

### SMS Infrastructure

CircleTel has **two SMS service options** ready to use:

#### Option 1: Clickatell SMS Service (Recommended)

**File**: `lib/integrations/clickatell/sms-service.ts`

**Features**:
- ✅ South African phone number auto-formatting (0821234567 → 27821234567)
- ✅ SMS delivery tracking with message IDs
- ✅ Error handling and retry logic
- ✅ OTP/verification code support

**Configuration**:
```env
CLICKATELL_API_KEY=your_api_key_here
CLICKATELL_API_ID=your_api_id_here
CLICKATELL_BASE_URL=https://platform.clickatell.com/v1/message
```

**Usage Example**:
```typescript
import { clickatellService } from '@/lib/integrations/clickatell/sms-service';

// Send order confirmation SMS
await clickatellService.sendSMS({
  to: '0826574256',  // Auto-formatted to 27826574256
  text: 'CircleTel: Thank you! Order ORD-20251108-9841 received. Track at circletel.co.za'
});
```

#### Option 2: Generic SMS Service

**File**: `lib/notifications/notification-service.ts` (SmsNotificationService class)

**Configuration**:
```env
SMS_API_ENDPOINT=your_sms_provider_endpoint
SMS_API_KEY=your_sms_provider_api_key
```

---

## 🚀 How to Enable SMS Notifications for Orders

### Step 1: Configure Clickatell

1. Sign up at https://www.clickatell.com
2. Get your API credentials
3. Add to `.env.local`:
   ```env
   CLICKATELL_API_KEY=your_key_here
   ```

### Step 2: Update Order Creation API

**File**: `app/api/orders/consumer/route.ts`

Add after line 128:

```typescript
// Send confirmation SMS (async, don't block response)
if (order.phone) {
  clickatellService.sendSMS({
    to: order.phone,
    text: `CircleTel: Thank you ${order.first_name}! Your order ${order.order_number} has been received. We'll contact you within 24 hours to schedule installation. Track: circletel.co.za`
  })
    .then((smsResult) => {
      if (smsResult.success) {
        console.log('Order confirmation SMS sent to:', order.phone);
      } else {
        console.error('Failed to send confirmation SMS:', smsResult.error);
      }
    })
    .catch((error) => {
      console.error('SMS send error:', error);
    });
}
```

**Import statement** (add to top of file):
```typescript
import { clickatellService } from '@/lib/integrations/clickatell/sms-service';
```

---

## 📋 Available Email Templates

The notification service includes **14 pre-built email templates**:

### Customer-Facing Templates
1. `order_confirmation` ✅ - Sent automatically on order creation
2. `payment_received` - Payment confirmation
3. `installation_scheduled` - Installation date confirmed
4. `installation_reminder` - Day before installation
5. `order_activated` - Service now live
6. `kyc_upload_request` - Request for FICA documents
7. `kyc_approved` - Documents approved
8. `kyc_rejected` - Documents need resubmission
9. `quote_sent` - Business quote email
10. `quote_reminder` - Follow-up for quotes
11. `coverage_available` - Notification when coverage expands
12. `no_coverage_lead_confirmation` - Captured for future expansion

### Internal/Admin Templates
13. `lead_captured` - New lead notification to sales team
14. `sales_coverage_lead_alert` - High-priority lead alerts
15. `sales_business_quote_alert` - Business quote alerts

---

## 📊 Notification Tracking

### Database Schema

Orders track notification status via:

**Table**: `consumer_orders`

```sql
-- Customer contact preferences
contact_preference TEXT,           -- 'email' | 'sms' | 'whatsapp' | 'phone'
marketing_opt_in BOOLEAN,
whatsapp_opt_in BOOLEAN,

-- Contact details
email TEXT NOT NULL,
phone TEXT NOT NULL,
alternate_phone TEXT,
```

### Future Enhancement: Notification Logs

To track notification delivery, create:

**Table**: `notification_logs`

```sql
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES consumer_orders(id),
  notification_type TEXT,            -- 'order_confirmation', 'installation_scheduled', etc.
  channel TEXT,                      -- 'email', 'sms', 'whatsapp'
  recipient TEXT,                    -- Email address or phone number
  status TEXT,                       -- 'sent', 'delivered', 'failed', 'bounced'
  provider_message_id TEXT,          -- Resend/Clickatell message ID
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🎯 Customer Journey Notifications

### Complete Order Lifecycle

Here's when customers receive notifications:

| Stage | Email | SMS | Trigger |
|-------|-------|-----|---------|
| **1. Order Placed** | ✅ Active | ⚠️ Available | Order created via API |
| **2. Payment Received** | ⚠️ Available | ⚠️ Available | Payment webhook |
| **3. KYC Upload Request** | ⚠️ Available | ⚠️ Available | Admin request |
| **4. KYC Approved** | ⚠️ Available | ⚠️ Available | Admin approval |
| **5. Installation Scheduled** | ⚠️ Available | ⚠️ Available | Admin schedules |
| **6. Installation Reminder** | ⚠️ Available | ✅ Recommended | 24h before |
| **7. Technician En Route** | ❌ | ✅ Recommended | 30 min before |
| **8. Service Activated** | ⚠️ Available | ⚠️ Available | Activation complete |

Legend:
- ✅ = Currently active
- ⚠️ = Template exists, needs trigger hookup
- ❌ = Not recommended for this channel

---

## 🔧 Testing Notifications

### Test Order Confirmation Email

**Script**: `scripts/test-email-notifications.js`

```bash
node scripts/test-email-notifications.js
```

### Test SMS

Create a test script:

**File**: `scripts/test-sms-notification.js`

```javascript
const { clickatellService } = require('../lib/integrations/clickatell/sms-service.ts');

async function testSMS() {
  const result = await clickatellService.sendSMS({
    to: '0821234567',  // Your test number
    text: 'CircleTel: Test message from order notification system'
  });

  console.log('SMS Result:', result);
}

testSMS();
```

Run with:
```bash
node scripts/test-sms-notification.js
```

---

## 📞 Support Contact Info (Used in Templates)

All notification emails include:

- **Email**: support@circletel.co.za
- **Phone**: 0860 CIRCLE (0860 247 253)
- **Business Email**: business@circletel.co.za
- **Website**: circletel.co.za

---

## 💰 Cost Estimates

### Email (Resend)
- **Free Tier**: 3,000 emails/month
- **Paid**: $20/month for 50,000 emails
- **Cost per order**: ~$0.0004 USD

### SMS (Clickatell)
- **Cost**: ~R0.20 - R0.30 per SMS
- **Recommended**: 100-500 SMS credits to start
- **Per order**: R0.20 (if enabled)

### Total per Order
- Email only: ~R0.01
- Email + SMS: ~R0.21

---

## 🎨 Branding

All notifications use CircleTel brand colors:

- **Primary Orange**: `#F5831F`
- **Dark Neutral**: `#1F2937`
- **Light Neutral**: `#E6E9EF`
- **Secondary**: `#4B5563`

Fonts:
- Arial, Helvetica, sans-serif

---

## 📝 Next Steps to Enable Full Notifications

### Immediate (5 minutes)
1. ✅ Email already working!
2. [ ] Add SMS to order creation (copy code above)
3. [ ] Test with real order

### Short-term (1-2 hours)
1. [ ] Add installation scheduled email trigger
2. [ ] Add payment received email trigger
3. [ ] Add SMS for installation reminder (24h before)
4. [ ] Add SMS for technician ETA (30 min before)

### Medium-term (1 day)
1. [ ] Create admin notification when new order placed
2. [ ] Set up notification logs table for tracking
3. [ ] Add WhatsApp Business API integration
4. [ ] Create notification preferences page for customers

---

## 📚 Related Documentation

- **Email Templates**: `lib/notifications/notification-service.ts:307-990`
- **SMS Service**: `lib/integrations/clickatell/sms-service.ts`
- **Order API**: `app/api/orders/consumer/route.ts`
- **Email Setup Guide**: `docs/technical/email/EMAIL_SETUP_GUIDE.md`
- **Customer Journey Types**: `lib/types/customer-journey.ts`

---

**Last Updated**: 2025-11-08
**Status**: Email Active ✅ | SMS Available ⚠️
**Maintainer**: Development Team
