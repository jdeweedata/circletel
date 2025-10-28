# CircleTel Order Tracking System

**Date:** 2025-10-28
**Status:** ✅ Complete (Database Schema & UI)
**Next Step:** Database Migration + API Integration

---

## 📋 **Overview**

Comprehensive order tracking system that provides real-time visibility into order fulfillment for both customers and admins. Supports different workflows for Wireless (5G/LTE) and Fiber installations.

---

## 🎯 **Features**

### **Customer Features**
- ✅ Real-time order timeline with visual progress indicator
- ✅ Detailed order status updates with timestamps
- ✅ Delivery tracking with courier information
- ✅ Installation scheduling visibility
- ✅ Service activation date tracking
- ✅ Responsive mobile-friendly timeline view

### **Admin Features**
- ✅ Comprehensive order status management
- ✅ Update fulfillment status
- ✅ Add delivery tracking information
- ✅ Schedule site surveys (Fiber only)
- ✅ Schedule installations
- ✅ Mark service as activated
- ✅ Add internal notes and customer-visible updates

---

## 🗂️ **Database Schema**

### **New Tables**

#### `order_tracking_events`
Stores detailed timeline events for each order.

```sql
CREATE TABLE order_tracking_events (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  event_type VARCHAR(100) NOT NULL,
  event_status VARCHAR(50) NOT NULL,
  event_title VARCHAR(255) NOT NULL,
  event_description TEXT,
  event_data JSONB,
  scheduled_date TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  visible_to_customer BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Event Types:**
- `order_confirmed`
- `payment_received`
- `equipment_prepared`, `equipment_shipped`
- `delivery_out`, `delivery_completed`, `delivery_failed`
- `site_survey_scheduled`, `site_survey_completed`, `site_survey_failed`
- `installation_scheduled`, `installation_started`, `installation_completed`, `installation_failed`
- `activation_scheduled`, `service_activated`
- `order_completed`, `order_cancelled`
- `status_update`, `note_added`

#### `order_notification_preferences`
Stores customer notification preferences.

```sql
CREATE TABLE order_notification_preferences (
  id UUID PRIMARY KEY,
  customer_email VARCHAR(255) UNIQUE,
  email_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT TRUE,
  notify_order_confirmed BOOLEAN DEFAULT TRUE,
  notify_shipped BOOLEAN DEFAULT TRUE,
  notify_delivered BOOLEAN DEFAULT TRUE,
  notify_survey_scheduled BOOLEAN DEFAULT TRUE,
  notify_installation_scheduled BOOLEAN DEFAULT TRUE,
  notify_service_activated BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### **Orders Table Extensions**

New columns added to `orders` table:

```sql
-- Order Type & Status
order_type VARCHAR(50) DEFAULT 'fiber'
fulfillment_status VARCHAR(50) DEFAULT 'order_confirmed'

-- Delivery Tracking
delivery_status VARCHAR(50)
delivery_tracking_number VARCHAR(255)
delivery_carrier VARCHAR(100)
delivery_date TIMESTAMPTZ

-- Site Survey (Fiber only)
site_survey_scheduled_date TIMESTAMPTZ
site_survey_completed_date TIMESTAMPTZ
site_survey_status VARCHAR(50)
site_survey_notes TEXT

-- Installation
installation_scheduled_date TIMESTAMPTZ
installation_completed_date TIMESTAMPTZ
installation_technician VARCHAR(255)
installation_notes TEXT

-- Activation
activation_date TIMESTAMPTZ
billing_start_date TIMESTAMPTZ
expected_completion_date TIMESTAMPTZ
```

---

## 🔄 **Order Workflows**

### **Wireless/5G/LTE Workflow**
1. ✅ **Order Confirmed** - Payment received
2. 📦 **Equipment Prepared** - Router + SIM card packaged
3. 🚚 **Shipped** - Sent via courier
4. 📍 **Out for Delivery** - En route to customer
5. ✅ **Delivered** - Signed for at address
6. 🔧 **Activation Scheduled** - Activation date set
7. ✅ **Service Activated** - Live connection, billing starts
8. ✅ **Completed** - Order fulfilled

### **Fiber/SkyFibre Workflow**
1. ✅ **Order Confirmed** - Payment received
2. 📋 **Site Survey Scheduled** - Survey date set
3. 🏗️ **Site Survey Completed** - Survey passed/failed
4. 🔧 **Installation Scheduled** - Installation date + technician assigned
5. 🚧 **Installation In Progress** - Technician on site
6. ✅ **Installation Completed** - Equipment installed
7. ✅ **Service Activated** - Live connection, billing starts
8. ✅ **Completed** - Order fulfilled

---

## 📁 **File Structure**

```
circletel-nextjs/
├── supabase/migrations/
│   └── 20251028000001_create_order_tracking_system.sql
├── lib/types/
│   └── order-tracking.ts
├── app/dashboard/orders/
│   └── [id]/
│       └── page.tsx  (Customer order detail with timeline)
├── components/admin/orders/
│   └── OrderTrackingUpdateDialog.tsx  (Admin update interface)
└── docs/features/
    └── ORDER_TRACKING_SYSTEM.md  (This file)
```

---

## 🎨 **UI Components**

### **Customer Order Detail Page**
**Path:** `/dashboard/orders/[id]`

**Features:**
- Visual progress bar (0-100%)
- Current status badge
- Expected completion date
- Interactive timeline with icons
- Order details sidebar
- Package information
- Installation address
- Contact information
- Actions (view billing, download invoice)

**Mock Data Available:** Yes (for testing UI)

### **Admin Tracking Update Dialog**
**Component:** `OrderTrackingUpdateDialog`

**Update Types:**
1. **Fulfillment Status** - Change overall order status
2. **Delivery Information** - Add tracking number, carrier, delivery date
3. **Site Survey** - Schedule/complete site survey (Fiber only)
4. **Installation** - Schedule/complete installation
5. **Service Activation** - Mark service as activated with billing start date

---

## 🔐 **Security (RLS Policies)**

### `order_tracking_events`
- **Service role:** Full access
- **Customers:** Can read own order events (where `visible_to_customer = true`)

### `order_notification_preferences`
- **Service role:** Full access
- **Customers:** Can manage own preferences (by email)

---

## 📊 **Helper Functions**

### Database Functions

#### `add_order_tracking_event()`
```sql
add_order_tracking_event(
  p_order_id UUID,
  p_event_type VARCHAR,
  p_event_status VARCHAR,
  p_event_title VARCHAR,
  p_event_description TEXT,
  p_event_data JSONB,
  p_scheduled_date TIMESTAMPTZ,
  p_visible_to_customer BOOLEAN
) RETURNS UUID
```

#### `update_order_fulfillment_status()`
```sql
update_order_fulfillment_status(
  p_order_id UUID,
  p_fulfillment_status VARCHAR,
  p_event_title VARCHAR,
  p_event_description TEXT
) RETURNS VOID
```

### TypeScript Helper Functions

#### `getFulfillmentStatusInfo(status)`
Returns label, color, and icon for a fulfillment status.

#### `getOrderWorkflow(orderType)`
Returns the expected workflow steps for an order type.

#### `getNextExpectedStatus(orderType, currentStatus)`
Returns the next expected status in the workflow.

---

## 🚀 **Implementation Steps**

### ✅ **Completed**
1. ✅ Database schema designed
2. ✅ TypeScript types created
3. ✅ Customer order detail page with timeline
4. ✅ Admin tracking update dialog
5. ✅ Helper functions and utilities
6. ✅ Documentation

### ⏳ **Pending**
1. ⏳ Apply database migration to Supabase
2. ⏳ Create API routes for order tracking updates
3. ⏳ Integrate admin dialog with real API
4. ⏳ Connect customer page to real order data
5. ⏳ Implement email notifications (optional)
6. ⏳ Add SMS notifications (optional)

---

## 🔌 **API Routes (To Be Created)**

### **Customer Endpoints**

#### `GET /api/orders/[id]`
Fetch order details with tracking events.

**Response:**
```typescript
{
  success: boolean;
  data: OrderWithTracking;
}
```

#### `GET /api/orders/[id]/tracking-events`
Fetch tracking events for an order.

**Response:**
```typescript
{
  success: boolean;
  data: OrderTrackingEvent[];
}
```

### **Admin Endpoints**

#### `POST /api/admin/orders/[id]/tracking`
Add a new tracking event.

**Request:**
```typescript
{
  event_type: TrackingEventType;
  event_status: TrackingEventStatus;
  event_title: string;
  event_description?: string;
  event_data?: Record<string, any>;
  scheduled_date?: string;
  visible_to_customer?: boolean;
}
```

#### `PATCH /api/admin/orders/[id]/fulfillment-status`
Update order fulfillment status.

**Request:**
```typescript
{
  fulfillment_status: FulfillmentStatus;
  event_title: string;
  event_description?: string;
}
```

#### `PATCH /api/admin/orders/[id]/delivery`
Update delivery information.

**Request:**
```typescript
{
  delivery_status: DeliveryStatus;
  tracking_number?: string;
  carrier?: string;
  delivery_date?: string;
  notes?: string;
}
```

#### `PATCH /api/admin/orders/[id]/site-survey`
Schedule or complete site survey.

**Request:**
```typescript
{
  scheduled_date?: string;
  completed_date?: string;
  status?: SiteSurveyStatus;
  notes?: string;
}
```

#### `PATCH /api/admin/orders/[id]/installation`
Schedule or complete installation.

**Request:**
```typescript
{
  scheduled_date?: string;
  completed_date?: string;
  technician?: string;
  notes?: string;
}
```

#### `PATCH /api/admin/orders/[id]/activation`
Activate service.

**Request:**
```typescript
{
  activation_date: string;
  billing_start_date: string;
  notes?: string;
}
```

---

## 📧 **Notification System (Future)**

### Email Notifications
- Order confirmed
- Equipment shipped (with tracking link)
- Delivered
- Site survey scheduled
- Installation scheduled
- Service activated

### SMS Notifications
- Installation reminder (24 hours before)
- Technician on the way (30 minutes before)
- Service activated

### Notification Templates
TBD - Will use existing Resend email infrastructure.

---

## 🧪 **Testing**

### **Manual Testing Steps**

1. **Customer View:**
   ```
   1. Navigate to /dashboard/orders
   2. Click "View" on an order
   3. Verify timeline displays correctly
   4. Verify progress bar shows correct percentage
   5. Verify all order details are displayed
   ```

2. **Admin View:**
   ```
   1. Navigate to admin orders page
   2. Click "Update Tracking" on an order
   3. Test each update type:
      - Fulfillment status change
      - Delivery information
      - Site survey scheduling
      - Installation scheduling
      - Service activation
   4. Verify events appear in customer timeline
   ```

### **Database Testing**
```sql
-- Test add tracking event
SELECT add_order_tracking_event(
  'order-uuid-here',
  'equipment_shipped',
  'completed',
  'Equipment Shipped',
  'Your router and SIM card have been shipped',
  '{"tracking_number": "TPL123456789", "carrier": "The Courier Guy"}',
  NULL,
  TRUE
);

-- Test update fulfillment status
SELECT update_order_fulfillment_status(
  'order-uuid-here',
  'installation_scheduled',
  'Installation Scheduled',
  'Installation scheduled for November 5, 2025 at 2:00 PM'
);
```

---

## 📝 **Notes**

### **Design Decisions**
1. **Separate Events Table:** Allows detailed tracking history without cluttering orders table
2. **Workflow-Based Status:** Different workflows for wireless vs. fiber orders
3. **Customer Visibility Flag:** Some events can be internal-only
4. **JSONB Event Data:** Flexible storage for varying data (tracking numbers, technician info, etc.)
5. **Helper Functions:** Simplify common operations and ensure consistency

### **Future Enhancements**
1. Real-time updates using Supabase Realtime
2. Push notifications for mobile app
3. Customer ability to reschedule appointments
4. Integration with courier tracking APIs
5. Technician mobile app for status updates
6. Automated status updates from CRM (Zoho)

---

## 🐛 **Known Issues**

None currently - system not yet deployed.

---

## 📞 **Support**

For questions or issues:
- **Email:** dev@circletel.co.za
- **Documentation:** `/docs/features/ORDER_TRACKING_SYSTEM.md`

---

**Last Updated:** 2025-10-28
**Migration File:** `20251028000001_create_order_tracking_system.sql`
**Next Step:** Apply migration and create API routes
