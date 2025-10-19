# Customer Journey System - Phase 1 Implementation Guide

> **Status**: ✅ Phase 1 Complete - Foundation & Shared Components
> **Created**: 2025-10-19
> **Migration**: `20251019000003_create_customer_journey_system.sql`

---

## 📋 Overview

Phase 1 implements the foundational infrastructure for dual customer journeys:
- **B2C Consumer Journey**: Simple checkout flow for residential customers
- **B2B SMME Journey**: Quote generation with KYC/credit checks for businesses

This phase creates:
- ✅ 5 new database tables
- ✅ Zoho CRM lead capture integration
- ✅ TypeScript type definitions
- ✅ Shared UI components (OrderStatusBadge)
- ✅ Notification service (Email/SMS)
- ✅ API routes for coverage leads

---

## 🗄️ Database Tables Created

### 1. `coverage_leads`
**Purpose**: Capture leads from coverage checker when no coverage is available

**Key Fields**:
- Customer information (name, email, phone, company)
- Address details with coordinates
- Coverage check requirements (service type, speed, budget)
- Zoho CRM integration (lead_id, sync_status, sync_error)
- Follow-up tracking (next_follow_up_at, contact_preference)
- Status tracking (new, contacted, interested, converted, lost)

**Indexes**:
- `idx_coverage_leads_customer_type`
- `idx_coverage_leads_status`
- `idx_coverage_leads_zoho_lead_id`
- `idx_coverage_leads_next_follow_up`

**Use Case**: When a user checks coverage and none is available, capture their details for future follow-up when coverage becomes available.

---

### 2. `consumer_orders`
**Purpose**: B2C consumer order tracking for simple checkout flow

**Key Fields**:
- Customer contact information
- Installation & billing addresses
- Product selection (package_id, speed, price, router details)
- Payment tracking (method, status, reference, total_paid)
- Order status (16 states from pending → active)
- Installation details (preferred_date, scheduled_date, technician_notes)
- Activation details (activation_date, account_number, connection_id)
- Marketing preferences (opt_in flags)

**Auto-generated**: `order_number` (format: ORD-YYYYMMDD-XXXX)

**Status Flow**:
```
pending → payment_received → kyc_approved →
installation_scheduled → installation_completed → active
```

**Use Case**: Track consumer orders from checkout through installation to activation.

---

### 3. `business_quotes`
**Purpose**: B2B SMME quote generation and tracking

**Key Fields**:
- Company information (registration number, VAT, industry, size)
- Contact person details
- Service requirements (package, connections, additional services)
- Pricing breakdown (monthly, installation, discounts, VAT, total)
- Quote lifecycle (sent_at, viewed_at, accepted_at, rejected_at)
- Sales tracking (sales_rep_id, lead_source, campaign)
- Conversion tracking (converted_to_order, conversion_date)

**Auto-generated**:
- `quote_number` (format: QTE-YYYYMMDD-XXXX)
- Automatic VAT calculations (15%)
- Automatic total calculations

**Status Flow**:
```
draft → sent → viewed → accepted → converted_to_order
```

**Use Case**: Generate and track business quotes with pricing breakdowns and conversion to orders.

---

### 4. `kyc_documents`
**Purpose**: KYC/FICA document storage and verification

**Key Fields**:
- Document owner (consumer_order_id OR business_quote_id)
- Document details (type, title, file_path, file_size, mime_type)
- Document metadata (number, issue_date, expiry_date)
- Verification status (pending, under_review, approved, rejected)
- Security (is_sensitive, encrypted, access_log)

**Document Types**:
- `id_document` - ID, passport, driver's license
- `proof_of_address` - Utility bill, bank statement
- `company_registration` - CIPC certificate
- `tax_certificate`, `vat_certificate`
- `director_id`, `shareholder_agreement`

**Use Case**: Manage KYC document uploads, verification, and compliance tracking.

---

### 5. `order_status_history`
**Purpose**: Audit trail for all status changes

**Key Fields**:
- Entity reference (consumer_order, business_quote, coverage_lead)
- Status change (old_status, new_status, status_changed_at)
- Change tracking (changed_by, change_reason, automated)
- Customer notification (notified, sent_at, notification_method)

**Auto-populated**: Triggers automatically create history records on status changes.

**Use Case**: Complete audit trail for compliance, customer service, and analytics.

---

## 🔄 Database Triggers

### 1. **Auto-update Timestamps**
All tables have `updated_at` auto-updated on modification.

### 2. **Auto-calculate Quote Totals**
Business quotes automatically calculate:
- Subtotal (monthly + installation + router + extras - discount)
- VAT (15% of subtotal)
- Total (subtotal + VAT)

### 3. **Auto-track Status Changes**
Status changes automatically create history records in `order_status_history`.

---

## 📡 Zoho CRM Integration

### Lead Capture Flow

1. **User submits coverage check** → No coverage available
2. **System creates `coverage_lead`** in database
3. **Zoho integration triggers** → Creates lead in Zoho CRM
4. **Lead data synced**:
   - Contact info → Zoho Lead
   - Custom fields: Customer_Type, Requested_Service, Coverage_Available
   - Campaign tracking: Campaign_Source, Referral_Code
5. **Database updated** with `zoho_lead_id` and sync status

### API Integration

**File**: `/lib/zoho/lead-capture.ts`

**Functions**:
- `createZohoLead(lead, coverageAvailable)` - Create new lead in Zoho
- `updateZohoLead(zohoLeadId, updates)` - Update existing lead
- `convertZohoLead(zohoLeadId, options)` - Convert lead to contact/deal
- `syncCoverageLeadToZoho(leadId)` - Full sync workflow

**Custom Fields Mapped**:
- `Customer_Type` → Consumer, SMME, Enterprise
- `Requested_Service` → Fibre, Wireless, 5G, etc.
- `Requested_Speed` → 10Mbps, 100Mbps, etc.
- `Budget_Range` → User's budget
- `Coverage_Available` → true/false

---

## 📧 Notification Service

### Email Templates

**File**: `/lib/notifications/notification-service.ts`

**Available Templates**:
1. **order_confirmation** - Order received, next steps
2. **payment_received** - Payment confirmed
3. **installation_scheduled** - Date/time confirmation
4. **installation_reminder** - 24h before installation
5. **order_activated** - Connection live
6. **quote_sent** - Business quote details
7. **kyc_upload_request** - Action required: upload docs
8. **kyc_approved** / **kyc_rejected** - Verification results
9. **lead_captured** - Internal admin notification
10. **coverage_available** - Coverage now available notification

### SMS Templates

**Available Templates**:
1. **order_confirmation** - Short order confirmation
2. **payment_reminder** - Payment due reminder
3. **installation_reminder** - Installation date reminder
4. **installation_technician_eta** - Technician arriving soon
5. **order_activated** - Connection active

### Usage Example

```typescript
import { EmailNotificationService, SmsNotificationService } from '@/lib/notifications/notification-service';

// Send order confirmation email
await EmailNotificationService.sendOrderConfirmation(order);

// Send installation SMS
await SmsNotificationService.sendInstallationReminder(
  order.phone,
  '2025-10-25',
  '09:00 - 12:00'
);
```

---

## 🎨 UI Components

### OrderStatusBadge Component

**File**: `/components/customer-journey/OrderStatusBadge.tsx`

**Variants**:
- `<ConsumerOrderStatusBadge status="pending" />`
- `<BusinessQuoteStatusBadge status="sent" />`
- `<LeadStatusBadge status="new" />`
- `<KycStatusBadge status="approved" />`

**Features**:
- Color-coded badges (success, warning, error, info)
- Icons for visual clarity
- Size variants (sm, md, lg)
- Progress indicator component

**Usage Example**:
```tsx
import { ConsumerOrderStatusBadge, OrderStatusProgress } from '@/components/customer-journey/OrderStatusBadge';

// Show status badge
<ConsumerOrderStatusBadge status={order.status} size="md" />

// Show progress indicator
<OrderStatusProgress currentStatus={order.status} />
```

---

## 🔌 API Routes

### Coverage Leads API

**GET `/api/admin/coverage-leads`**
- Query params: `status`, `customer_type`, `lead_source`, `limit`, `offset`
- Returns: Paginated list of coverage leads
- Auth: Admin users only

**POST `/api/admin/coverage-leads`**
- Body: `CreateCoverageLeadInput`
- Returns: Created lead with ID
- Auth: Admin users only

**GET `/api/admin/coverage-leads/[id]`**
- Returns: Single coverage lead
- Auth: Admin users only

**PATCH `/api/admin/coverage-leads/[id]`**
- Body: Partial updates
- Returns: Updated lead
- Auth: Admin users only

**DELETE `/api/admin/coverage-leads/[id]`**
- Returns: Success message
- Auth: Admin users only

---

## 🔒 Row Level Security (RLS)

All tables have RLS enabled with policies:

**Admin Access**:
- View all records
- Manage all records
- Enforced via `admin_users` table check

**Security Features**:
- `kyc_documents.access_log` - Track who viewed sensitive docs
- `kyc_documents.encrypted` - Flag for encrypted storage
- `kyc_documents.is_sensitive` - Extra security layer

---

## 📊 TypeScript Types

**File**: `/lib/types/customer-journey.ts`

**Exports**:
- Enums: `CustomerType`, `LeadSource`, `OrderStatus`, `QuoteStatus`, `KycDocumentType`, `KycVerificationStatus`
- Interfaces: `CoverageLead`, `ConsumerOrder`, `BusinessQuote`, `KycDocument`, `OrderStatusHistory`
- Input Types: `CreateCoverageLeadInput`, `CreateConsumerOrderInput`, `CreateBusinessQuoteInput`, `UploadKycDocumentInput`
- Helper Types: `OrderSummary`, `QuoteSummary`, `LeadSummary`
- Status Configs: `ORDER_STATUS_CONFIG`, `QUOTE_STATUS_CONFIG`, `LEAD_STATUS_CONFIG`, `KYC_STATUS_CONFIG`

---

## 🚀 Applying the Migration

### Method 1: Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**:
   - Go to https://supabase.com/dashboard
   - Select project: `circletel-nextjs` (agyjovdugmtopasyvlng)

2. **Navigate to SQL Editor**:
   - Click "SQL Editor" in left sidebar
   - Click "New Query"

3. **Copy Migration SQL**:
   - Open `supabase/migrations/20251019000003_create_customer_journey_system.sql`
   - Copy entire file contents

4. **Execute Migration**:
   - Paste SQL into editor
   - Click "Run" or press Ctrl+Enter
   - Wait for confirmation: "Success. No rows returned"

5. **Verify Tables Created**:
   ```sql
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name IN (
     'coverage_leads',
     'consumer_orders',
     'business_quotes',
     'kyc_documents',
     'order_status_history'
   );
   ```
   Should return 5 rows.

6. **Test Triggers**:
   ```sql
   -- Test order number generation
   SELECT generate_order_number();

   -- Test quote number generation
   SELECT generate_quote_number();
   ```

---

## ✅ Verification Checklist

After applying migration:

- [ ] All 5 tables exist in database
- [ ] All indexes created successfully
- [ ] RLS policies active on all tables
- [ ] Triggers working (test with sample inserts)
- [ ] Functions created (`generate_order_number`, `generate_quote_number`)
- [ ] TypeScript types imported without errors
- [ ] API routes respond to requests
- [ ] Zoho lead capture function exists
- [ ] Notification service compiles without errors
- [ ] OrderStatusBadge component renders

---

## 🧪 Testing

### 1. Test Coverage Lead Creation

```typescript
// Create test lead
const lead = await fetch('/api/admin/coverage-leads', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customer_type: 'consumer',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    phone: '+27821234567',
    address: '123 Main Road, Sandton',
    city: 'Johannesburg',
    province: 'Gauteng',
    lead_source: 'coverage_checker',
    status: 'new',
  }),
});

const result = await lead.json();
console.log('Lead created:', result.lead.id);
```

### 2. Test Order Number Generation

```sql
-- Should generate format: ORD-20251019-XXXX
SELECT generate_order_number();
```

### 3. Test Quote Total Calculation

```sql
-- Insert quote and check auto-calculated totals
INSERT INTO business_quotes (
  quote_number,
  company_name,
  contact_first_name,
  contact_last_name,
  contact_email,
  contact_phone,
  business_address,
  package_name,
  package_speed,
  monthly_recurring,
  installation_fee,
  router_cost,
  valid_until,
  lead_source
) VALUES (
  'QTE-TEST-0001',
  'Test Company',
  'Jane',
  'Smith',
  'jane@test.com',
  '+27821234567',
  '456 Business Blvd',
  'BizFibre Pro',
  '100/100 Mbps',
  2999.00,
  3500.00,
  1200.00,
  '2025-11-01',
  'website_form'
) RETURNING subtotal, vat_amount, total_amount;

-- Should return auto-calculated values
```

---

## 📝 Next Steps (Phase 2)

With Phase 1 complete, proceed to Phase 2 - Consumer Journey (B2C):

1. **Enhance Coverage Checker** (`/coverage` page)
   - Add "No Coverage" lead capture form
   - Integrate with `coverage_leads` table
   - Trigger Zoho sync on submission

2. **Create Coverage Results Page** (`/coverage/results`)
   - Display available packages
   - Show pricing with installation fees
   - "Order Now" CTA buttons

3. **Build Consumer Order Form** (`/order/consumer`)
   - Simple 3-step checkout
   - Package selection → Details → Confirmation
   - Create consumer_order record

4. **Order Status Tracking** (`/orders/[orderId]`)
   - Real-time status display
   - Progress indicator
   - KYC document upload

5. **Admin Order Management** (`/admin/orders/consumer`)
   - Order list with filtering
   - Status update controls
   - Customer communication

See `CUSTOMER_JOURNEY_IMPLEMENTATION_PLAN.md` for full roadmap.

---

## 🐛 Troubleshooting

### Issue: Migration fails with "relation already exists"

**Solution**: Migration uses `CREATE TABLE IF NOT EXISTS` - this is safe to re-run. If specific tables exist, drop them first:

```sql
DROP TABLE IF EXISTS order_status_history;
DROP TABLE IF EXISTS kyc_documents;
DROP TABLE IF EXISTS business_quotes;
DROP TABLE IF EXISTS consumer_orders;
DROP TABLE IF EXISTS coverage_leads;
```

### Issue: Zoho sync failing

**Check**:
1. `ZOHO_CLIENT_ID` and `ZOHO_CLIENT_SECRET` in environment variables
2. Zoho OAuth token is valid
3. Custom fields exist in Zoho CRM (`Customer_Type`, `Requested_Service`, etc.)

### Issue: Email/SMS not sending

**Check**:
1. `RESEND_API_KEY` configured for emails
2. `SMS_API_ENDPOINT` and `SMS_API_KEY` configured for SMS
3. Logs show "service not configured" warning

---

## 📚 Related Documentation

- **Full Implementation Plan**: `CUSTOMER_JOURNEY_IMPLEMENTATION_PLAN.md`
- **TypeScript Types**: `/lib/types/customer-journey.ts`
- **Zoho Integration**: `/lib/zoho/lead-capture.ts`
- **Notification Service**: `/lib/notifications/notification-service.ts`
- **API Routes**: `/app/api/admin/coverage-leads/`
- **UI Components**: `/components/customer-journey/OrderStatusBadge.tsx`

---

**Last Updated**: 2025-10-19
**Phase**: 1 of 4
**Status**: ✅ Complete
