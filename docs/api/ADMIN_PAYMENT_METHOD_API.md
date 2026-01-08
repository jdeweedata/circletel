# Admin Payment Method Registration API

**Version:** 1.0
**Last Updated:** 2025-11-29
**Status:** Production Ready

## Overview

The Admin Payment Method Registration API enables CircleTel administrators to initiate eMandate (debit order) registration for customer orders. This system integrates with **NetCash's BatchFileUpload API** to create secure, authenticated mandate requests that customers sign digitally.

### Key Features

- **Admin-initiated workflow**: Admins request payment method setup on behalf of customers
- **NetCash integration**: Uses BatchFileUpload API for secure eMandate creation
- **Dual notification**: Automatic email and SMS delivery (NetCash sends OTP to customer)
- **Database tracking**: Full lifecycle tracking via `payment_methods` and `emandate_requests` tables
- **Customer-facing page**: Branded payment method setup page at `/payments/[orderId]`
- **Pro-rata billing support**: First charge calculated from service activation date (not signup date)

---

## Table of Contents

1. [API Endpoints](#api-endpoints)
2. [Database Schema](#database-schema)
3. [Integration Flow](#integration-flow)
4. [Frontend Components](#frontend-components)
5. [NetCash Integration](#netcash-integration)
6. [Error Handling](#error-handling)
7. [Security](#security)
8. [Testing](#testing)
9. [Common Issues](#common-issues)

---

## API Endpoints

### POST /api/admin/orders/[orderId]/payment-method

Create an eMandate request for an order (admin-initiated).

#### Authentication
- **Required**: Admin session (service role)
- **Method**: Supabase service role client (bypasses RLS)

#### Request

**Path Parameters:**
```typescript
{
  orderId: string; // UUID of the consumer order
}
```

**Request Body:**
```typescript
{
  mandateAmount: number;          // Monthly debit amount (defaults to package price)
  paymentMethodType?: string;     // 'both' | 'bank_account' | 'credit_card' (default: 'both')
  debitFrequency?: string;        // 'Monthly' | 'Bimonthly' | 'ThreeMonthly' | etc. (default: 'Monthly')
  debitDay?: string;              // '01'-'31' or 'LDOM' (default: '01')
  notes?: string;                 // Internal admin notes (not visible to customer)
}
```

**Example:**
```bash
curl -X POST https://www.circletel.co.za/api/admin/orders/f47ac10b-58cc-4372-a567-0e02b2c3d479/payment-method \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=YOUR_SESSION_TOKEN" \
  -d '{
    "mandateAmount": 599.00,
    "paymentMethodType": "both",
    "debitFrequency": "Monthly",
    "debitDay": "01",
    "notes": "Standard fiber package - R599/mo"
  }'
```

#### Response

**Success (200 OK):**
```json
{
  "success": true,
  "data": {
    "mandateUrl": "https://www.circletel.co.za/payments/f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "accountReference": "CT-2025-00123",
    "emandateRequestId": "e8d3b1c9-8f2a-4e3b-9c1d-7a5e4f6b8c9d",
    "paymentMethodId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "fileToken": "ABC123XYZ789",
    "expiresAt": "2025-12-06T12:00:00Z"
  },
  "message": "eMandate request created. Customer will receive email/SMS from NetCash to sign the mandate."
}
```

**Error Responses:**

| Status | Error Code | Description |
|--------|------------|-------------|
| 400 | `Order ID is required` | Missing `orderId` parameter |
| 400 | `Customer account number not yet assigned` | Customer record missing `account_number` |
| 404 | `Order not found` | Order does not exist |
| 404 | `Customer not found for this order` | Customer linked to order not found |
| 500 | `Failed to create payment method` | Database error creating `payment_methods` record |
| 500 | `Failed to create eMandate request` | Database error creating `emandate_requests` record |
| 502 | `Failed to create eMandate with NetCash` | NetCash API error (see `details` field) |

**Error Example:**
```json
{
  "success": false,
  "error": "Customer account number not yet assigned. Please contact support.",
  "details": "Account number generation failed"
}
```

---

### GET /api/admin/orders/[orderId]/payment-method

Retrieve payment method details for an order, including eMandate request status.

#### Authentication
- **Required**: Admin session (service role)

#### Request

**Path Parameters:**
```typescript
{
  orderId: string; // UUID of the consumer order
}
```

**Example:**
```bash
curl -X GET https://www.circletel.co.za/api/admin/orders/f47ac10b-58cc-4372-a567-0e02b2c3d479/payment-method \
  -H "Cookie: sb-access-token=YOUR_SESSION_TOKEN"
```

#### Response

**Success (200 OK):**
```json
{
  "success": true,
  "data": {
    "paymentMethod": {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "method_type": "bank_account",
      "status": "pending",
      "bank_name": "Pending",
      "bank_account_name": "John Doe",
      "bank_account_number_masked": "XXXX-XXXX",
      "bank_account_type": "current",
      "branch_code": null,
      "mandate_amount": 599.00,
      "mandate_frequency": "monthly",
      "mandate_debit_day": 1,
      "mandate_signed_at": null,
      "netcash_mandate_pdf_link": null,
      "created_at": "2025-11-29T10:30:00Z"
    },
    "emandateRequest": {
      "id": "e8d3b1c9-8f2a-4e3b-9c1d-7a5e4f6b8c9d",
      "status": "sent",
      "netcash_short_url": "https://netcash.co.za/mandate/ABC123",
      "expires_at": "2025-12-06T12:00:00Z",
      "postback_reason_for_decline": null,
      "created_at": "2025-11-29T10:30:00Z",
      "sms_provider": "clickatell",
      "sms_message_id": "msg_abc123",
      "sms_sent_at": "2025-11-29T10:30:15Z",
      "sms_delivery_status": "delivered",
      "sms_delivered_at": "2025-11-29T10:30:20Z",
      "sms_error": null
    }
  }
}
```

**No Payment Method Found:**
```json
{
  "success": true,
  "data": {
    "paymentMethod": null,
    "emandateRequest": null
  }
}
```

**Error (404):**
```json
{
  "success": false,
  "error": "Order not found"
}
```

---

## Database Schema

### Table: `payment_methods`

Stores registered payment methods (bank accounts, credit cards) for recurring billing.

```sql
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  order_id UUID REFERENCES consumer_orders(id) ON DELETE SET NULL,

  -- Payment Method Details
  method_type VARCHAR(20) NOT NULL CHECK (method_type IN ('bank_account', 'credit_card')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'suspended', 'cancelled', 'expired', 'failed')),

  -- Bank Account Details
  bank_name VARCHAR(100),                        -- Initially 'Pending', updated after mandate signing
  bank_account_name VARCHAR(100),                -- Customer name
  bank_account_number_masked VARCHAR(20),        -- Initially 'XXXX-XXXX', updated with real masked account
  bank_account_type VARCHAR(20),                 -- 'current', 'savings', 'transmission'
  branch_code VARCHAR(10),

  -- NetCash Integration
  netcash_account_reference VARCHAR(50) UNIQUE,  -- Customer account number (e.g., 'CT-2025-00123')
  netcash_mandate_reference VARCHAR(100),
  netcash_mandate_url TEXT,
  netcash_mandate_pdf_link TEXT,

  -- Mandate Details
  mandate_amount DECIMAL(10, 2),                 -- Monthly debit amount
  mandate_frequency VARCHAR(20),                 -- 'monthly', 'bimonthly', etc.
  mandate_debit_day INTEGER,                     -- 1-31
  mandate_agreement_date DATE,
  mandate_signed_at TIMESTAMPTZ,                 -- When customer signed
  mandate_active BOOLEAN DEFAULT FALSE,

  -- Flags
  is_primary BOOLEAN DEFAULT FALSE,              -- Only one primary per customer
  is_verified BOOLEAN DEFAULT FALSE,
  verification_method VARCHAR(50),               -- 'emandate', 'avs', 'manual'

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  activated_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT valid_bank_account CHECK (
    method_type != 'bank_account' OR (
      bank_name IS NOT NULL AND
      bank_account_name IS NOT NULL AND
      bank_account_number_masked IS NOT NULL
    )
  )
);
```

**Key Constraints:**

1. **`valid_bank_account`**: When `method_type = 'bank_account'`, requires:
   - `bank_name` (initially set to `'Pending'`)
   - `bank_account_name` (customer's full name)
   - `bank_account_number_masked` (initially `'XXXX-XXXX'`)

2. **Placeholder Values**: Used during eMandate creation (before customer signs):
   ```typescript
   {
     bank_name: 'Pending',
     bank_account_name: 'John Doe',
     bank_account_number_masked: 'XXXX-XXXX'
   }
   ```

3. **Updated After Signing**: NetCash postback updates with real bank details.

---

### Table: `emandate_requests`

Tracks NetCash eMandate API requests and customer signature workflow.

```sql
CREATE TABLE emandate_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  payment_method_id UUID REFERENCES payment_methods(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES consumer_orders(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

  -- Request Details
  request_type VARCHAR(20) NOT NULL DEFAULT 'batch',  -- 'synchronous' or 'batch'
  status VARCHAR(30) NOT NULL DEFAULT 'pending'
    CHECK (status IN (
      'pending',          -- Created, not yet sent to NetCash
      'sent',             -- Sent to NetCash, awaiting customer action
      'customer_notified',-- Email/SMS sent to customer
      'signed',           -- Customer signed
      'declined',         -- Customer declined
      'expired',          -- URL expired (7 days)
      'completed',        -- Payment method registered
      'failed'            -- Request failed
    )),

  -- NetCash API Data
  netcash_account_reference VARCHAR(50),         -- Customer account number
  netcash_mandate_url TEXT,
  netcash_short_url TEXT,
  netcash_response_code VARCHAR(10),
  netcash_error_messages TEXT[],

  -- Request Payload (for audit/retry)
  request_payload JSONB,                         -- Full EMandateBatchRequest + billing_day, mandate_amount

  -- Customer Communication
  notification_email VARCHAR(255),
  notification_phone VARCHAR(20),
  email_sent_at TIMESTAMPTZ,
  sms_sent_at TIMESTAMPTZ,
  sms_provider VARCHAR(50),                      -- 'clickatell', 'netcash'
  sms_message_id VARCHAR(100),
  sms_delivery_status VARCHAR(30),
  sms_delivered_at TIMESTAMPTZ,
  sms_error TEXT,

  -- Postback Data (from NetCash after customer signs)
  postback_received_at TIMESTAMPTZ,
  postback_data JSONB,
  postback_mandate_successful BOOLEAN,
  postback_reason_for_decline TEXT,
  postback_mandate_pdf_link TEXT,

  -- Timing
  expires_at TIMESTAMPTZ,                        -- Default: 7 days from creation
  signed_at TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  notes TEXT                                     -- Admin notes
);
```

**Status Lifecycle:**

```
pending → sent → customer_notified → signed → completed
                                  ↓
                               declined
                               expired
                               failed
```

**`request_payload` Structure:**

Since `emandate_requests` doesn't have dedicated `billing_day` or `mandate_amount` columns, these are stored in `request_payload`:

```json
{
  "accountReference": "CT-2025-00123",
  "mandateName": "John Doe",
  "isConsumer": true,
  "firstName": "John",
  "surname": "Doe",
  "mobileNumber": "0821234567",
  "mandateAmount": 599.00,
  "debitFrequency": 1,
  "commencementMonth": 12,
  "commencementDay": "01",
  "agreementDate": "2025-11-29T00:00:00Z",
  "agreementReference": "ORD-2025-00456",
  "field1": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "field2": "ORD-2025-00456",
  "field3": "cust_abc123",
  "emailAddress": "john@example.com",
  "sendMandate": true,
  "publicHolidayOption": 1,
  "billing_day": 1,
  "mandate_amount": 599.00,
  "initiated_by": "admin",
  "admin_notes": "Standard fiber package",
  "file_token": "ABC123XYZ789",
  "submitted_at": "2025-11-29T10:30:00Z"
}
```

---

### Table: `consumer_orders`

Order status updated to `'payment_method_pending'` after eMandate request creation.

**Relevant Status Values:**
- `'payment_method_pending'`: eMandate request sent, awaiting customer signature
- `'payment_method_registered'`: Customer signed mandate, payment method active
- `'payment_method_failed'`: eMandate request failed or customer declined

---

## Integration Flow

### 1. Admin Initiates Request

**Trigger:** Admin clicks "Request Payment Method" button on order details page.

**Action:** `PaymentMethodRegistrationModal` opens with pre-filled form:
- **Mandate Amount**: Defaults to `order.package_price`
- **Payment Method Type**: `'both'` (customer can choose bank account or credit card)
- **Debit Frequency**: `'Monthly'`
- **Debit Day**: `'01'` (1st of each month)
- **Notes**: Optional internal notes

---

### 2. API Creates Database Records

**POST `/api/admin/orders/[orderId]/payment-method`**

#### Steps:

1. **Fetch Order & Customer**:
   ```typescript
   const { data: order } = await supabase
     .from('consumer_orders')
     .select('*')
     .eq('id', orderId)
     .single();

   const { data: customer } = await supabase
     .from('customers')
     .select('id, first_name, last_name, email, phone, account_number')
     .eq('id', order.customer_id)
     .single();
   ```

2. **Validate Account Number**:
   ```typescript
   if (!customer.account_number) {
     return { error: 'Customer account number not yet assigned' };
   }
   ```

3. **Delete Previous Failed Attempts**:
   ```typescript
   await supabase
     .from('payment_methods')
     .delete()
     .eq('netcash_account_reference', customer.account_number)
     .is('mandate_signed_at', null);
   ```

4. **Create `payment_methods` Record** (with placeholder bank details):
   ```typescript
   const { data: paymentMethod } = await supabase
     .from('payment_methods')
     .insert({
       customer_id: customer.id,
       order_id: orderId,
       method_type: 'bank_account',
       status: 'pending',
       bank_name: 'Pending',
       bank_account_name: `${customer.first_name} ${customer.last_name}`,
       bank_account_number_masked: 'XXXX-XXXX',
       bank_account_type: 'current',
       netcash_account_reference: customer.account_number,
       mandate_amount: mandateAmount,
       mandate_frequency: 'monthly',
       mandate_debit_day: parseInt(debitDay),
       mandate_agreement_date: new Date().toISOString().split('T')[0],
       mandate_active: false,
       is_primary: true,
       is_verified: false,
       metadata: {
         initiated_at: new Date().toISOString(),
         initiated_by: 'admin',
         order_number: order.order_number,
         bank_details_pending: true
       }
     })
     .select()
     .single();
   ```

5. **Build eMandate Batch Request**:
   ```typescript
   const nextMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);

   const emandateBatchRequest: EMandateBatchRequest = {
     accountReference: customer.account_number,
     mandateName: `${customer.first_name} ${customer.last_name}`,
     mandateAmount: mandateAmount,
     isConsumer: true,
     firstName: customer.first_name,
     surname: customer.last_name,
     mobileNumber: customer.phone?.replace(/^\+27/, '0').replace(/\D/g, ''),
     debitFrequency: 1, // Monthly
     commencementMonth: nextMonth.getMonth() + 1,
     commencementDay: String(debitDay).padStart(2, '0'),
     agreementDate: new Date(),
     agreementReference: order.order_number,
     field1: orderId,
     field2: order.order_number,
     field3: customer.id,
     emailAddress: customer.email,
     sendMandate: true,
     publicHolidayOption: 1
   };
   ```

6. **Create `emandate_requests` Record**:
   ```typescript
   const { data: emandateRecord } = await supabase
     .from('emandate_requests')
     .insert({
       payment_method_id: paymentMethod.id,
       order_id: orderId,
       customer_id: customer.id,
       request_type: 'batch',
       status: 'pending',
       netcash_account_reference: customer.account_number,
       request_payload: {
         ...emandateBatchRequest,
         billing_day: parseInt(debitDay),
         mandate_amount: mandateAmount,
         initiated_by: 'admin',
         admin_notes: notes
       },
       notification_email: customer.email,
       notification_phone: customer.phone,
       expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
       ip_address: request.headers.get('x-forwarded-for')?.split(',')[0],
       user_agent: request.headers.get('user-agent'),
       notes: notes
     })
     .select()
     .single();
   ```

---

### 3. Call NetCash BatchFileUpload API

**Service:** `NetCashEMandateBatchService`

```typescript
const emandateBatchService = new NetCashEMandateBatchService();
const batchResult = await emandateBatchService.submitMandate(emandateBatchRequest);

if (!batchResult.success) {
  throw new Error(`NetCash API error: ${batchResult.errorCode} - ${batchResult.errorMessage}`);
}

const fileToken = batchResult.fileToken;
```

**NetCash Response:**
- **Success**: Returns `fileToken` (e.g., `"ABC123XYZ789"`)
- **Error**: Returns error code (`'100'` = auth failure, `'102'` = parameter error)

---

### 4. Update Database with NetCash Response

**On Success:**

```typescript
// Update emandate_requests
await supabase
  .from('emandate_requests')
  .update({
    status: 'sent',
    netcash_response_code: 'SUCCESS',
    request_payload: {
      ...emandateRecord.request_payload,
      file_token: fileToken,
      submitted_at: new Date().toISOString()
    }
  })
  .eq('id', emandateRecord.id);

// Update payment_methods
await supabase
  .from('payment_methods')
  .update({
    status: 'pending',
    metadata: {
      ...paymentMethod.metadata,
      file_token: fileToken,
      mandate_sent_at: new Date().toISOString()
    }
  })
  .eq('id', paymentMethod.id);

// Update consumer_orders
await supabase
  .from('consumer_orders')
  .update({ status: 'payment_method_pending' })
  .eq('id', orderId);
```

**On Failure:**

```typescript
await supabase
  .from('emandate_requests')
  .update({
    status: 'failed',
    netcash_response_code: 'ERROR',
    netcash_error_messages: [error.message]
  })
  .eq('id', emandateRecord.id);

await supabase
  .from('payment_methods')
  .update({ status: 'failed' })
  .eq('id', paymentMethod.id);
```

---

### 5. Return Mandate URL to Admin

**Response:**

```json
{
  "success": true,
  "data": {
    "mandateUrl": "https://www.circletel.co.za/payments/f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "accountReference": "CT-2025-00123",
    "emandateRequestId": "e8d3b1c9-8f2a-4e3b-9c1d-7a5e4f6b8c9d",
    "paymentMethodId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "fileToken": "ABC123XYZ789",
    "expiresAt": "2025-12-06T12:00:00Z"
  },
  "message": "eMandate request created. Customer will receive email/SMS from NetCash to sign the mandate."
}
```

---

### 6. Admin Shares Link with Customer

**Modal Success State:**

The `PaymentMethodRegistrationModal` displays:

1. **Account Reference**: `CT-2025-00123` (copy to clipboard)
2. **Customer Registration Link**: `https://www.circletel.co.za/payments/[orderId]` (copy or open in new tab)
3. **Customer Details**: Name, email, phone, monthly amount
4. **Next Steps**:
   - Customer receives OTP from NetCash via SMS
   - Customer accesses mandate form and enters banking details
   - Customer signs digitally
   - Order status auto-updates to "Payment Method Registered"

**Automatic Notification:**

The modal also calls `/api/admin/orders/[orderId]/payment-method/notify` (POST) to automatically send email and SMS to the customer.

---

### 7. Customer Receives Notification

**NetCash Sends:**
- **SMS**: OTP to customer's mobile number (for accessing mandate form)
- **Email**: Link to online mandate form (optional)

**CircleTel Sends (via `/notify` endpoint):**
- **Email**: Branded email with mandate URL and instructions
- **SMS (via Clickatell)**: "Complete your payment setup for CircleTel: [link]"

---

### 8. Customer Completes Mandate

**Customer-Facing Page:** `/payments/[orderId]`

**Component:** `app/payments/[orderId]/page.tsx`

**Features:**

1. **Order Summary**:
   - Customer name, email, phone
   - Package name
   - VAT breakdown (15% South African VAT)
   - Total amount (incl. VAT)

2. **Monthly Amount Card**:
   - Displays `R599.00/month` (or package price)
   - Free installation badge (if `installation_fee = 0`)
   - **Pro-rata billing notice**: "Your first invoice will be calculated based on your actual activation date, not the full month."

3. **Action Button**:
   - **"Set Up Debit Order"**: Calls `/api/payment/emandate/initiate` (customer-facing endpoint)
   - On success, shows success alert with instructions

4. **Important Notices**:
   - **No immediate billing**: "You will NOT be billed today."
   - **First payment**: "Your first payment will only be processed after your service has been installed and activated."
   - **Pro-rata**: "Your first invoice will be calculated pro-rata from your activation date."

5. **What Happens Next**:
   - Step 1: Receive email/SMS with secure link
   - Step 2: Technician schedules installation
   - Step 3: Service activated
   - Step 4: First pro-rata invoice generated

---

### 9. NetCash Postback Updates Database

**Webhook Endpoint:** `/api/webhooks/netcash/emandate` (to be implemented)

**Postback Data:**

```json
{
  "AccountReference": "CT-2025-00123",
  "MandateSuccessful": true,
  "BankName": "FNB",
  "BankAccountName": "John Doe",
  "BankAccountNo": "62123456789",
  "BranchCode": "250655",
  "AccountType": "1",
  "MandatePDFLink": "https://netcash.co.za/mandates/ABC123.pdf",
  "SignedAt": "2025-11-29T14:30:00Z"
}
```

**Action:**

1. Update `emandate_requests`:
   ```typescript
   {
     status: 'completed',
     postback_received_at: new Date(),
     postback_data: postbackData,
     postback_mandate_successful: true,
     postback_mandate_pdf_link: postbackData.MandatePDFLink,
     signed_at: postbackData.SignedAt
   }
   ```

2. Update `payment_methods`:
   ```typescript
   {
     status: 'active',
     bank_name: postbackData.BankName,
     bank_account_number_masked: `****${postbackData.BankAccountNo.slice(-4)}`,
     branch_code: postbackData.BranchCode,
     mandate_signed_at: postbackData.SignedAt,
     mandate_active: true,
     is_verified: true,
     verification_method: 'emandate',
     activated_at: postbackData.SignedAt
   }
   ```

3. Update `consumer_orders`:
   ```typescript
   { status: 'payment_method_registered' }
   ```

---

## Frontend Components

### Component: `PaymentMethodRegistrationModal`

**Location:** `components/admin/orders/PaymentMethodRegistrationModal.tsx`

**Usage:**

```tsx
import { PaymentMethodRegistrationModal } from '@/components/admin/orders/PaymentMethodRegistrationModal';

<PaymentMethodRegistrationModal
  open={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  order={{
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    order_number: 'ORD-2025-00456',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    phone: '+27821234567',
    package_price: 599.00
  }}
  onSuccess={() => {
    // Refresh order data
    fetchOrderDetails();
  }}
/>
```

**Props:**

```typescript
interface PaymentMethodRegistrationModalProps {
  open: boolean;
  onClose: () => void;
  order: {
    id: string;
    order_number: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    package_price: number;
  };
  onSuccess: () => void;
}
```

**States:**

1. **Request Form State** (initial):
   - Form fields: mandateAmount, paymentMethodType, debitFrequency, debitDay, notes
   - Submit button: "Create eMandate Request"

2. **Success State** (after creation):
   - Account Reference (copy to clipboard)
   - Customer Registration Link (copy or open in new tab)
   - Customer Details card
   - Next Steps instructions
   - "Done" button

**Features:**

- **Pre-filled Amount**: Defaults to `order.package_price`
- **Validation**: Checks `mandateAmount > 0`
- **Automatic Notification**: Calls `/notify` endpoint after successful creation
- **Dual Toast Notifications**:
  - "eMandate request created successfully"
  - "Notification sent via email and SMS"

---

### Page: `/payments/[orderId]`

**Location:** `app/payments/[orderId]/page.tsx`

**Purpose:** Customer-facing payment method setup page.

**Features:**

1. **Order Lookup**: Fetches order details via `/api/orders/consumer?id=[orderId]`
2. **VAT Breakdown**:
   ```typescript
   const VAT_RATE = 0.15;
   const exclVat = inclVat / (1 + VAT_RATE);
   const vatAmount = inclVat - exclVat;
   ```
3. **Pro-rata Billing Notice**: Amber alert box explaining first payment calculation
4. **No Immediate Billing Notice**: Blue alert box reassuring customer
5. **Action Buttons**:
   - **"Set Up Debit Order"**: Initiates eMandate (via `/api/payment/emandate/initiate`)
   - **"Resend Mandate Link"**: Resends notification (if already sent)

**Example UI:**

```
┌─────────────────────────────────────────────────────┐
│ 🔐 Set Up Payment Method                            │
│ Order: ORD-2025-00456                               │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ ℹ️ Important: You will NOT be billed today.         │
│ Your first payment will only be processed after    │
│ your service has been installed and activated,     │
│ calculated pro-rata from your activation date.     │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ Order Summary                                       │
│ ─────────────────                                   │
│ Customer: John Doe                                  │
│ Email: john@example.com                             │
│                                                     │
│ Package: 25Mbps Fiber Uncapped                     │
│                                                     │
│ Monthly Subscription (excl. VAT)  R520.87          │
│ VAT (15%)                         R78.13           │
│ ─────────────────────────────────────────          │
│ Total (incl. VAT)                 R599.00          │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ 📅 Monthly Debit Order Amount                       │
│    R599.00                                          │
│                                                     │
│ ✅ Free Installation! No installation fee required. │
│                                                     │
│ ⏰ Pro-rata billing: Your first invoice will be    │
│    calculated based on your actual activation date.│
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ [Set Up Debit Order →]                              │
│                                                     │
│ ✓ Secure mandate via NetCash                       │
│ ✓ No payment taken today                           │
│ ✓ First billing only after service activation      │
│ ✓ Cancel anytime with 30 days notice               │
└─────────────────────────────────────────────────────┘
```

---

## NetCash Integration

### Service: `NetCashEMandateBatchService`

**Location:** `lib/payments/netcash-emandate-batch-service.ts`

**Purpose:** Submit eMandate requests via NetCash BatchFileUpload API.

**API Documentation:** https://api.netcash.co.za/inbound-payments/emandate/

---

### Configuration

**Environment Variables:**

```env
NETCASH_DEBIT_ORDER_SERVICE_KEY=your_service_key
NETCASH_WS_URL=https://ws.netcash.co.za/NIWS/niws_nif.svc
```

**Software Vendor Key** (hardcoded):
```typescript
private softwareVendorKey: string = '24ade73c-98cf-47b3-99be-cc7b867b3080';
```

---

### Batch File Format

**Structure:** Tab-delimited with H/K/T/F records

```
H	{ServiceKey}	1	Mandates	CircleTel-CT-2025-00123	20251129	{SoftwareVendorKey}
K	101	102	110	114	113	121	122	123	202	161	530	531	532	534	535	540	541	201	311	312	313
T	CT-2025-00123	John Doe	1	John	Doe			0821234567	59900	1	12	01	20251129	ORD-2025-00456	1	1	john@example.com	f47ac10b...	ORD-2025-00456	cust_abc123
F	1	59900	9999
```

**Record Types:**

| Type | Description |
|------|-------------|
| **H** | Header: ServiceKey, Version, Instruction, BatchName, ActionDate, SoftwareVendorKey |
| **K** | Key: Field IDs defining transaction record order |
| **T** | Transaction: Customer mandate request data |
| **F** | Footer: TotalCount, TotalAmountCents, Checksum |

**Key Fields:**

| Field ID | Name | Description | Example |
|----------|------|-------------|---------|
| 101 | AccountReference | Customer account number (2-22 chars) | `CT-2025-00123` |
| 102 | MandateName | Customer name on NetCash system | `John Doe` |
| 110 | IsConsumer | `1` = Individual, `0` = Company | `1` |
| 114 | FirstName | Customer first name | `John` |
| 113 | Surname | Customer surname | `Doe` |
| 121 | TradingName | Company trading name (empty for individuals) | `''` |
| 122 | RegistrationNumber | Company reg number (empty for individuals) | `''` |
| 123 | RegisteredName | Company name (empty for individuals) | `''` |
| 202 | MobileNumber | 10 digits (e.g., `0821234567`) | `0821234567` |
| 161 | MandateAmount | Amount in cents | `59900` |
| 530 | DebitFrequency | `1` = Monthly, `2` = Bimonthly, etc. | `1` |
| 531 | CommencementMonth | MM (01-12) | `12` |
| 532 | CommencementDay | Day or `LDOM` for last day | `01` |
| 534 | AgreementDate | CCYYMMDD format | `20251129` |
| 535 | AgreementReference | Agreement reference number | `ORD-2025-00456` |
| 540 | SendMandate | `1` = Auto-send, `0` = Manual | `1` |
| 541 | PublicHolidayOption | `0` = Preceding day, `1` = Next day | `1` |
| 201 | EmailAddress | Customer email (optional) | `john@example.com` |
| 311-313 | Field1-3 | Custom data | `orderId`, `orderNumber`, `customerId` |

---

### SOAP API Call

**Endpoint:** `https://ws.netcash.co.za/NIWS/niws_nif.svc`

**Method:** `BatchFileUpload`

**Request:**

```xml
<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/">
  <soap:Body>
    <tem:BatchFileUpload>
      <tem:ServiceKey>YOUR_SERVICE_KEY</tem:ServiceKey>
      <tem:File>H	...
K	...
T	...
F	...</tem:File>
    </tem:BatchFileUpload>
  </soap:Body>
</soap:Envelope>
```

**Response (Success):**

```xml
<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
  <s:Body>
    <BatchFileUploadResponse xmlns="http://tempuri.org/">
      <BatchFileUploadResult>ABC123XYZ789</BatchFileUploadResult>
    </BatchFileUploadResponse>
  </s:Body>
</s:Envelope>
```

**Response (Error):**

```xml
<BatchFileUploadResult>100</BatchFileUploadResult>  <!-- Authentication failure -->
<BatchFileUploadResult>101</BatchFileUploadResult>  <!-- Date format error -->
<BatchFileUploadResult>102</BatchFileUploadResult>  <!-- Parameter error -->
<BatchFileUploadResult>200</BatchFileUploadResult>  <!-- Code exception -->
```

---

### Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| `100` | Authentication failure | Check `NETCASH_DEBIT_ORDER_SERVICE_KEY` |
| `101` | Date format error | Ensure dates are `CCYYMMDD` format |
| `102` | Parameter error | Validate batch file format (missing required fields) |
| `200` | General code exception | Contact NetCash support |

---

### Usage Example

```typescript
import { NetCashEMandateBatchService, EMandateBatchRequest } from '@/lib/payments/netcash-emandate-batch-service';

const service = new NetCashEMandateBatchService();

const request: EMandateBatchRequest = {
  accountReference: 'CT-2025-00123',
  mandateName: 'John Doe',
  mandateAmount: 599.00,
  isConsumer: true,
  firstName: 'John',
  surname: 'Doe',
  mobileNumber: '0821234567',
  debitFrequency: 1, // Monthly
  commencementMonth: 12,
  commencementDay: '01',
  agreementDate: new Date(),
  agreementReference: 'ORD-2025-00456',
  emailAddress: 'john@example.com',
  sendMandate: true,
  publicHolidayOption: 1
};

const result = await service.submitMandate(request);

if (result.success) {
  console.log('File Token:', result.fileToken);
} else {
  console.error('Error:', result.errorCode, result.errorMessage);
}
```

---

## Error Handling

### Database Constraint Errors

#### Error: `valid_bank_account` constraint violation

**Cause:** `payment_methods` record created without required bank details.

**Solution:** Use placeholder values during eMandate creation:

```typescript
{
  bank_name: 'Pending',
  bank_account_name: `${customer.first_name} ${customer.last_name}`,
  bank_account_number_masked: 'XXXX-XXXX'
}
```

**Why:** The constraint requires these fields when `method_type = 'bank_account'`, but real bank details are only available after the customer signs the mandate.

---

#### Error: Column `billing_day` or `mandate_amount` not found

**Cause:** `emandate_requests` table doesn't have dedicated columns for these fields.

**Solution:** Store in `request_payload` JSONB column:

```typescript
request_payload: {
  ...emandateBatchRequest,
  billing_day: parseInt(debitDay),
  mandate_amount: mandateAmount,
  initiated_by: 'admin',
  admin_notes: notes
}
```

---

### NetCash API Errors

#### Error: `100` - Authentication failure

**Cause:** Invalid `NETCASH_DEBIT_ORDER_SERVICE_KEY`.

**Solution:**
1. Verify environment variable is set correctly
2. Check if service key is active in NetCash portal
3. Ensure you're using the **Debit Order** service key (not Pay Now)

---

#### Error: `102` - Parameter error

**Cause:** Invalid batch file format (missing required fields, incorrect field order).

**Solution:**
1. Ensure fields 121, 122, 123 are included in key record (even if empty for individuals)
2. Verify transaction record fields match key record order exactly
3. Check date format is `CCYYMMDD` (not `YYYY-MM-DD`)
4. Validate mobile number is 10 digits (e.g., `0821234567`, not `+27821234567`)

---

#### Error: `file_token` not stored in database

**Cause:** `emandate_requests` table has no `metadata` column.

**Solution:** Store `file_token` in `request_payload`:

```typescript
await supabase
  .from('emandate_requests')
  .update({
    status: 'sent',
    request_payload: {
      ...emandateRecord.request_payload,
      file_token: fileToken,
      submitted_at: new Date().toISOString()
    }
  })
  .eq('id', emandateRecord.id);
```

---

### API Route Errors

#### Error: 405 Method Not Allowed

**Cause:** Missing POST handler in API route.

**Solution:** Ensure both GET and POST handlers are exported:

```typescript
export async function GET(request: NextRequest, context: { params: Promise<{ orderId: string }> }) { ... }
export async function POST(request: NextRequest, context: { params: Promise<{ orderId: string }> }) { ... }
```

---

#### Error: 401 Unauthorized

**Cause:** Admin not authenticated or session expired.

**Solution:**
1. Verify admin session cookie is present
2. Check `admin_users` table contains user record
3. Ensure RLS policies allow admin access

---

#### Error: 404 Order not found

**Cause:** Invalid `orderId` or order deleted.

**Solution:**
1. Verify `orderId` is a valid UUID
2. Check `consumer_orders` table contains record
3. Ensure order hasn't been soft-deleted

---

## Security

### Admin-Only Endpoint

**Authentication:** Service role client bypasses RLS.

**Authorization:** No explicit RBAC check (assumes admin context).

**Recommendation:** Add RBAC check for `orders:manage` permission:

```typescript
import { checkPermission } from '@/lib/rbac/permissions';

const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

const hasPermission = await checkPermission(user.id, 'orders:manage');
if (!hasPermission) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

---

### Sensitive Data Handling

**Never Expose:**
- Full bank account numbers (use masked version: `****1234`)
- NetCash service key
- Customer passwords or tokens

**Audit Logging:**
- `ip_address`: Request IP (from `x-forwarded-for` header)
- `user_agent`: Client user agent
- `created_by`: Admin user ID who initiated request

**Database Security:**
- **RLS Enabled**: `payment_methods` and `emandate_requests` tables
- **Service Role Access**: API routes use service role to bypass RLS
- **Admin Policy**: `admin_payment_methods_all` allows full access for `admin_users`

---

### Webhook Verification

**⚠️ TO BE IMPLEMENTED:** NetCash postback endpoint must verify signature.

**Pattern:**

```typescript
import crypto from 'crypto';

function verifyNetCashSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get('x-netcash-signature');
  const payload = await request.text();

  if (!signature || !verifyNetCashSignature(payload, signature, NETCASH_WEBHOOK_SECRET)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const data = JSON.parse(payload);
  // Process postback...
}
```

---

## Testing

### Unit Tests

**Test File:** `tests/api/admin-payment-method.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { POST, GET } from '@/app/api/admin/orders/[orderId]/payment-method/route';

describe('POST /api/admin/orders/[orderId]/payment-method', () => {
  it('should return 200 with valid request', async () => {
    const request = new Request('http://localhost:3000/api/admin/orders/test-id/payment-method', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mandateAmount: 599.00,
        paymentMethodType: 'both',
        debitFrequency: 'Monthly',
        debitDay: '01',
        notes: 'Test mandate'
      })
    });

    const response = await POST(request, {
      params: Promise.resolve({ orderId: 'test-id' })
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('mandateUrl');
  });

  it('should return 400 without orderId', async () => {
    const request = new Request('http://localhost:3000/api/admin/orders//payment-method', {
      method: 'POST',
      body: JSON.stringify({ mandateAmount: 599 })
    });

    const response = await POST(request, {
      params: Promise.resolve({ orderId: '' })
    });

    expect(response.status).toBe(400);
  });

  it('should return 404 for non-existent order', async () => {
    const request = new Request('http://localhost:3000/api/admin/orders/invalid-id/payment-method', {
      method: 'POST',
      body: JSON.stringify({ mandateAmount: 599 })
    });

    const response = await POST(request, {
      params: Promise.resolve({ orderId: 'invalid-id' })
    });

    expect(response.status).toBe(404);
  });

  it('should validate mandate amount > 0', async () => {
    const request = new Request('http://localhost:3000/api/admin/orders/test-id/payment-method', {
      method: 'POST',
      body: JSON.stringify({ mandateAmount: -100 })
    });

    const response = await POST(request, {
      params: Promise.resolve({ orderId: 'test-id' })
    });

    expect(response.status).toBe(400);
  });
});

describe('GET /api/admin/orders/[orderId]/payment-method', () => {
  it('should return payment method details', async () => {
    const request = new Request('http://localhost:3000/api/admin/orders/test-id/payment-method');

    const response = await GET(request, {
      params: Promise.resolve({ orderId: 'test-id' })
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('paymentMethod');
    expect(data.data).toHaveProperty('emandateRequest');
  });

  it('should return null for order without payment method', async () => {
    const request = new Request('http://localhost:3000/api/admin/orders/no-pm-id/payment-method');

    const response = await GET(request, {
      params: Promise.resolve({ orderId: 'no-pm-id' })
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data.paymentMethod).toBeNull();
    expect(data.data.emandateRequest).toBeNull();
  });
});
```

---

### Integration Tests

**Test Scenarios:**

1. **Happy Path**:
   - Admin creates eMandate request
   - Customer receives email/SMS
   - Customer signs mandate
   - Postback updates database
   - Order status changes to `'payment_method_registered'`

2. **Failed NetCash API**:
   - Invalid service key → 401 error
   - Missing required fields → 400 error
   - NetCash API down → 502 error

3. **Customer Declines**:
   - Customer views mandate but doesn't sign
   - Mandate expires after 7 days
   - Order status remains `'payment_method_pending'`

4. **Duplicate Requests**:
   - Admin re-requests payment method
   - Old pending record is deleted
   - New record created with fresh expiry

---

### cURL Testing

**Create eMandate Request:**

```bash
curl -X POST https://www.circletel.co.za/api/admin/orders/f47ac10b-58cc-4372-a567-0e02b2c3d479/payment-method \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=YOUR_SESSION_TOKEN" \
  -d '{
    "mandateAmount": 599.00,
    "paymentMethodType": "both",
    "debitFrequency": "Monthly",
    "debitDay": "01",
    "notes": "Standard fiber package - R599/mo"
  }'
```

**Get Payment Method Status:**

```bash
curl -X GET https://www.circletel.co.za/api/admin/orders/f47ac10b-58cc-4372-a567-0e02b2c3d479/payment-method \
  -H "Cookie: sb-access-token=YOUR_SESSION_TOKEN"
```

---

### .http File

```http
### Create eMandate Request
POST https://www.circletel.co.za/api/admin/orders/f47ac10b-58cc-4372-a567-0e02b2c3d479/payment-method
Content-Type: application/json
Cookie: sb-access-token=YOUR_SESSION_TOKEN

{
  "mandateAmount": 599.00,
  "paymentMethodType": "both",
  "debitFrequency": "Monthly",
  "debitDay": "01",
  "notes": "Standard fiber package - R599/mo"
}

### Get Payment Method Status
GET https://www.circletel.co.za/api/admin/orders/f47ac10b-58cc-4372-a567-0e02b2c3d479/payment-method
Cookie: sb-access-token=YOUR_SESSION_TOKEN
```

---

## Common Issues

### Issue: 500 Error - `valid_bank_account` constraint violation

**Symptom:**
```
Error: new row for relation "payment_methods" violates check constraint "valid_bank_account"
```

**Cause:** Creating `payment_methods` record without `bank_name`, `bank_account_name`, or `bank_account_number_masked`.

**Fix:** Use placeholder values:
```typescript
{
  bank_name: 'Pending',
  bank_account_name: `${customer.first_name} ${customer.last_name}`,
  bank_account_number_masked: 'XXXX-XXXX'
}
```

---

### Issue: 500 Error - `billing_day` column not found

**Symptom:**
```
Error: column "billing_day" of relation "emandate_requests" does not exist
```

**Cause:** Attempting to insert `billing_day` as a top-level column instead of in `request_payload`.

**Fix:** Move to `request_payload`:
```typescript
request_payload: {
  ...emandateBatchRequest,
  billing_day: parseInt(debitDay),
  mandate_amount: mandateAmount
}
```

---

### Issue: 405 Method Not Allowed

**Symptom:**
```
Error: 405 Method Not Allowed
```

**Cause:** POST handler not exported from API route.

**Fix:** Ensure both GET and POST are exported:
```typescript
export async function GET(...) { ... }
export async function POST(...) { ... }
```

---

### Issue: NetCash API returns `102` - Parameter error

**Symptom:**
```
NetCash API error: 102 - Parameter error. Check file format.
```

**Cause:** Invalid batch file format (missing required fields, incorrect field order).

**Fix:**
1. Ensure fields 121, 122, 123 are in key record (even if empty)
2. Match transaction record field order to key record exactly
3. Validate date format is `CCYYMMDD`
4. Check mobile number is 10 digits (no country code)

---

### Issue: Customer not receiving email/SMS

**Symptom:** eMandate created but customer doesn't receive notification.

**Cause:**
1. NetCash sends OTP via SMS (ensure `mobileNumber` is correct)
2. CircleTel notification endpoint (`/notify`) failed

**Fix:**
1. Verify `notification_phone` in `emandate_requests` is correct (10 digits)
2. Check `sms_delivery_status` column for delivery confirmation
3. Manually call `/api/admin/orders/[orderId]/payment-method/notify` (POST)

---

### Issue: Order status not updating after mandate signed

**Symptom:** Customer signed mandate but order still shows `'payment_method_pending'`.

**Cause:** NetCash postback not received or webhook endpoint not implemented.

**Fix:**
1. Implement `/api/webhooks/netcash/emandate` endpoint
2. Verify NetCash webhook URL is configured in NetCash portal
3. Check `postback_received_at` column in `emandate_requests`
4. Manually update order status if postback failed

---

### Issue: Multiple primary payment methods per customer

**Symptom:** Customer has multiple records with `is_primary = true`.

**Cause:** Trigger `ensure_single_primary_payment_method` not firing.

**Fix:** Database trigger should auto-fix this, but can manually resolve:
```sql
UPDATE payment_methods
SET is_primary = FALSE
WHERE customer_id = 'CUSTOMER_ID'
  AND id != (
    SELECT id FROM payment_methods
    WHERE customer_id = 'CUSTOMER_ID'
      AND is_primary = TRUE
    ORDER BY created_at DESC
    LIMIT 1
  );
```

---

## Deployment Checklist

### Environment Variables

- [x] `NETCASH_DEBIT_ORDER_SERVICE_KEY` set in production
- [x] `NETCASH_WS_URL` configured (defaults to production URL)
- [x] `NEXT_PUBLIC_APP_URL` set for mandate URL generation

### Database Migrations

- [x] `20251117000002_create_payment_methods.sql` applied
- [x] RLS policies enabled for `payment_methods` and `emandate_requests`
- [x] Triggers created for auto-activation and single primary constraint

### API Routes

- [x] `POST /api/admin/orders/[orderId]/payment-method` - Create eMandate
- [x] `GET /api/admin/orders/[orderId]/payment-method` - Get status
- [ ] `POST /api/admin/orders/[orderId]/payment-method/notify` - Send notification
- [ ] `POST /api/webhooks/netcash/emandate` - Handle postback

### Frontend Components

- [x] `PaymentMethodRegistrationModal` - Admin modal
- [x] `/payments/[orderId]` page - Customer-facing setup page
- [ ] Order details page integration (show "Request Payment Method" button)

### Testing

- [ ] Unit tests for API endpoints
- [ ] Integration tests with NetCash sandbox
- [ ] E2E test: Admin creates → Customer signs → Postback updates
- [ ] Load testing (100+ concurrent eMandate requests)

### Monitoring

- [ ] Log aggregation for NetCash API errors
- [ ] Alert on `emandate_requests.status = 'failed'`
- [ ] Dashboard for payment method registration rate
- [ ] Track mandate expiry (7 days)

---

## Future Enhancements

### Phase 1: Webhook Implementation

**Priority:** High
**Estimated Effort:** 4 hours

- [ ] Implement `/api/webhooks/netcash/emandate` endpoint
- [ ] Verify HMAC signature from NetCash
- [ ] Update `payment_methods` with real bank details
- [ ] Update `emandate_requests` with postback data
- [ ] Change order status to `'payment_method_registered'`
- [ ] Send confirmation email to customer

### Phase 2: Automated Notifications

**Priority:** Medium
**Estimated Effort:** 2 hours

- [ ] Implement `/api/admin/orders/[orderId]/payment-method/notify` endpoint
- [ ] Integrate Clickatell SMS API
- [ ] Template-based email notifications
- [ ] Track delivery status in `emandate_requests` table

### Phase 3: Mandate Expiry Handling

**Priority:** Medium
**Estimated Effort:** 3 hours

- [ ] Cron job to mark expired mandates (7 days)
- [ ] Update `emandate_requests.status = 'expired'`
- [ ] Admin notification for expired mandates
- [ ] One-click re-request functionality

### Phase 4: Credit Card Support

**Priority:** Low
**Estimated Effort:** 8 hours

- [ ] Extend `payment_methods` table for credit card tokenization
- [ ] Integrate NetCash Pay Now for card tokenization
- [ ] Support `paymentMethodType = 'credit_card'`
- [ ] PCI DSS compliance review

### Phase 5: Customer Self-Service

**Priority:** Low
**Estimated Effort:** 6 hours

- [ ] Customer dashboard integration
- [ ] "Update Payment Method" workflow
- [ ] View mandate PDF
- [ ] Cancel debit order

---

## Support

**Questions?** Contact the CircleTel development team:

- **Email:** dev@circletel.co.za
- **Slack:** #circletel-dev
- **Documentation:** https://github.com/circletel/circletel-nextjs/tree/main/docs/api

**NetCash Support:**

- **Documentation:** https://api.netcash.co.za/inbound-payments/emandate/
- **Support Email:** support@netcash.co.za
- **Phone:** +27 11 207 5000

---

**End of Documentation**
