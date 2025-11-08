# Admin Notification System

## Overview

Automated email notifications to internal teams when new orders are placed, ensuring rapid response and coordination across sales and service delivery teams.

---

## ✅ What's Implemented

### Automatic Notifications

When a customer places an order via `/api/orders/consumer`, the system **automatically sends** email notifications to:

1. **Sales Team** - Order details, customer info, lead source
2. **Service Delivery Team** - Installation request, technical requirements
3. **Optional CC** - Additional team members (configurable)

---

## 📧 Email Templates

### 1. Sales Team Notification

**Subject**: `🔔 New Order: {ORDER_NUMBER} - {CUSTOMER_NAME}`

**Template**: `admin_new_order_sales`

**Contains**:
- ⚠️ Priority indicator (High/Medium/Low based on urgency)
- Order details (number, time, status)
- Customer information (name, email, phone, contact preference)
- Package & pricing (monthly fee, installation, router)
- Installation address with preferred date
- Payment status
- Lead source & campaign tracking
- Quick action buttons (View Order, View Customer Profile)

**Priority Calculation**:
- **HIGH**: Package >R1,000/month OR installation within 24 hours
- **MEDIUM**: Installation within 3 days
- **LOW**: All other orders

---

### 2. Service Delivery Team Notification

**Subject**: `📦 New Installation Required: {ORDER_NUMBER}`

**Template**: `admin_new_order_service_delivery`

**Contains**:
- Installation request details
- Customer contact information (prominent phone number)
- Installation location with Google Maps link
- Preferred installation date & time
- Service package requirements
- Payment status (with warning if not paid)
- Special instructions
- Next steps checklist

**Focus**: Technical requirements, scheduling, customer contact

---

### 3. Additional Admin Templates

#### Urgent Order Alert

**Template**: `admin_urgent_order`

Sent to management for:
- High-value customers (>R1,000/month)
- VIP customers
- Same-day installation requests
- Business/enterprise orders

#### Payment Received

**Template**: `admin_payment_received`

Sent to accounting when payment confirmed:
- Payment amount & method
- Transaction ID
- Order details
- Next steps (KYC, installation scheduling)

#### Installation Scheduled

**Template**: `admin_installation_scheduled`

Sent to service delivery team:
- Confirmed installation date & time
- Assigned technician
- Customer contact details
- Special instructions

---

## 🔧 Configuration

### Environment Variables

Add to `.env.local`:

```env
# Admin Notification Configuration
# NOTE: Admin emails are sent from devadmin@notifications.circletelsa.co.za

# Sales Team Email (receives new order notifications)
SALES_TEAM_EMAIL=sales@circletel.co.za

# Service Delivery Team Email (receives installation requests)
SERVICE_DELIVERY_EMAIL=servicedelivery@circletel.co.za

# Management Team Email (receives urgent order alerts)
MANAGEMENT_EMAIL=management@circletel.co.za

# Accounting/Finance Email (receives payment notifications)
ACCOUNTING_EMAIL=accounting@circletel.co.za

# CC emails for all admin notifications (comma-separated)
ADMIN_CC_EMAILS=admin@circletel.co.za,operations@circletel.co.za

# Email Service (Resend API)
RESEND_API_KEY=your_resend_api_key_here
```

### Sender Email

All admin notifications are sent from:
- **Sender:** `CircleTel Admin <devadmin@notifications.circletelsa.co.za>`
- **Domain:** `notifications.circletelsa.co.za` (verified in Resend)

Customer notifications use a different sender:
- **Sender:** `CircleTel <noreply@notifications.circletelsa.co.za>`

---

## 📋 Usage

### Automatic (Already Configured)

Notifications are sent automatically when:
- New order created via `/api/orders/consumer`
- No manual intervention required

### Manual Notifications (API Available)

You can also trigger notifications programmatically:

```typescript
import { AdminNotificationService } from '@/lib/notifications/admin-notifications';

// Send new order notification
const result = await AdminNotificationService.notifyNewOrder(order);

// Send urgent order alert
await AdminNotificationService.notifyUrgentOrder(
  order,
  'High-value customer - R2,500/month package'
);

// Notify payment received
await AdminNotificationService.notifyPaymentReceived(
  order,
  paymentAmount,
  paymentMethod,
  transactionId
);

// Notify installation scheduled
await AdminNotificationService.notifyInstallationScheduled(
  order,
  '2025-11-15',
  '09:00 - 12:00',
  'John Smith'
);
```

---

## 🎨 Email Design

All admin notification emails feature:

- **Team-specific branding**:
  - Sales Team: Orange gradient header
  - Service Delivery: Blue gradient header
  - Urgent: Red gradient header
  - Payment: Green gradient header

- **Priority indicators**: Color-coded based on urgency
- **Quick action buttons**: Direct links to admin panel
- **Mobile responsive**: Looks great on all devices
- **Professional layout**: CircleTel branded footer

---

## 📊 Notification Flow

```
Customer Places Order
        ↓
Order Created in Database
        ↓
    ┌───┴───┐
    ↓       ↓
Customer   Admin Teams
Email      Notifications
(async)    (async)
    ↓           ↓
Order       ┌───┴────┐
Confirmation ↓        ↓
           Sales   Service
           Team    Delivery
                    Team
```

**Note**: All notifications are sent asynchronously and don't block the order creation response.

---

## 🧪 Testing

### Test New Order Notification

Create a test order via the API:

```bash
curl -X POST http://localhost:3000/api/orders/consumer \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Test",
    "last_name": "Customer",
    "email": "test@example.com",
    "phone": "0821234567",
    "installation_address": "123 Test Street, Johannesburg",
    "package_name": "Premium Fibre 100Mbps",
    "package_speed": "100Mbps",
    "package_price": 799,
    "installation_fee": 0,
    "lead_source": "website"
  }'
```

Check logs:
```bash
[AdminNotifications] Sales team notified (MessageID: abc123)
[AdminNotifications] Service delivery team notified (MessageID: def456)
```

Check team inboxes:
- `sales@circletel.co.za` should receive sales notification
- `servicedelivery@circletel.co.za` should receive installation request

---

## 🚨 Troubleshooting

### Notifications Not Sending

1. **Check environment variables**:
   ```bash
   echo $SALES_TEAM_EMAIL
   echo $SERVICE_DELIVERY_EMAIL
   echo $RESEND_API_KEY
   ```

2. **Check server logs**:
   Look for `[AdminNotifications]` messages

3. **Verify Resend API**:
   - API key is valid
   - Sender email is verified in Resend dashboard
   - No rate limits exceeded

### Emails Going to Spam

1. Verify sender domain in Resend
2. Add SPF/DKIM records
3. Check email content for spam triggers

### Wrong Team Receiving Notifications

1. Check `.env.local` configuration
2. Restart development server after changing env vars
3. Verify email addresses in Resend dashboard

---

## 📈 Analytics & Tracking

All admin notifications include:

- **MessageID**: Unique identifier for tracking in Resend
- **Timestamps**: Logged in server console
- **Delivery status**: Success/failure logged

### View Notification Logs

Server logs show:
```
[AdminNotifications] Sending new order notifications for ORD-20251108-9841
[AdminNotifications] Sales team notified (MessageID: re_abc123def)
[AdminNotifications] Service delivery team notified (MessageID: re_ghi456jkl)
```

### Resend Dashboard

View detailed analytics at https://resend.com/emails:
- Delivery status
- Open rates
- Click rates (for admin panel links)
- Bounce/spam reports

---

## 🔐 Security & Privacy

- Admin emails sent via Resend using **service role** auth
- No customer data exposed in URLs
- Order details accessed via authenticated admin panel links
- Email content follows POPIA compliance (South Africa)

---

## 💡 Best Practices

### Response Time Guidelines

Based on notification priority:

- **HIGH Priority**: Contact customer within 30 minutes
- **MEDIUM Priority**: Contact within 2 hours
- **LOW Priority**: Contact within 24 hours

### Team Coordination

1. **Sales Team**: Initial customer contact, confirm requirements
2. **Service Delivery**: Schedule installation, assign technician
3. **Accounting**: Verify payment, process invoices

### Follow-up Workflow

1. Sales contacts customer (log in CRM)
2. Confirm installation requirements
3. Payment verification (accounting)
4. Schedule installation (service delivery)
5. Assign technician
6. Send installation confirmation to customer
7. Complete installation
8. Activate service
9. Send activation confirmation

---

## 📝 Customization

### Add New Notification Type

1. Add template to `EmailTemplate` type in `notification-service.ts`
2. Add template HTML in `renderTemplate()` method
3. Create service method in `admin-notifications.ts`
4. Call from relevant API route

### Modify Email Content

Edit templates in:
`lib/notifications/notification-service.ts:979-1422`

### Change Team Emails

Update `.env.local`:
```env
SALES_TEAM_EMAIL=newsales@circletel.co.za
SERVICE_DELIVERY_EMAIL=newtech@circletel.co.za
```

---

## 📚 Related Files

**Core Files**:
- `lib/notifications/admin-notifications.ts` - Admin notification service
- `lib/notifications/notification-service.ts` - Email templates
- `app/api/orders/consumer/route.ts` - Order creation with notifications

**Configuration**:
- `.env.example` - Environment variable template
- `.env.local` - Your local configuration

**Documentation**:
- `docs/features/ORDER_NOTIFICATIONS.md` - Customer notifications
- This file - Admin notifications

---

## 🎯 Success Metrics

Track these KPIs:

- **Response Time**: Average time from order → first contact
- **Conversion Rate**: Orders → completed installations
- **Customer Satisfaction**: Post-installation surveys
- **Team Efficiency**: Orders per technician per day

---

**Last Updated**: 2025-11-08
**Status**: Active ✅
**Maintainer**: Development Team

---

## Quick Reference

| Notification Type | Recipient | Trigger | Template |
|---|---|---|---|
| New Order | Sales + Service Delivery | Order created | `admin_new_order_*` |
| Urgent Order | Management + Teams | High-value/urgent | `admin_urgent_order` |
| Payment Received | Accounting + Sales | Payment webhook | `admin_payment_received` |
| Installation Scheduled | Service Delivery | Admin schedules | `admin_installation_scheduled` |

**Total Templates**: 5 admin templates (+ 14 customer templates = 19 total)

**Average Email Delivery**: <5 seconds
**Cost per Notification**: ~R0.01 (Resend pricing)
