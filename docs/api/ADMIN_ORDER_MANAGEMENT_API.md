---
title: Admin Order Management API
description: API documentation for admin order management endpoints including installation, payment methods, billing, and validation workflows
category: api
authContext: admin
date: 2025-12-17
version: 1.0
---

# Admin Order Management API

This document covers the admin-facing API endpoints for managing consumer orders, including installation details, payment methods, customer invoices, and manual validation workflows.

## Overview

The admin order management APIs enable CircleTel administrators to:

- Retrieve installation task details for orders
- View and manage payment method information including eMandate status
- Access customer invoice history
- Manually approve payment method validations when NetCash sends confirmation emails instead of webhooks

### Authentication

All endpoints require admin authentication. The APIs support the **dual authentication pattern**:

1. **Authorization Header** (recommended for admin panel): `Authorization: Bearer <access_token>`
2. **Cookie-based Session**: Fallback for SSR scenarios

Some endpoints use the service role directly (bypassing RLS) for operations that require cross-table access.

### Base URL

```
Production: https://www.circletel.co.za/api/admin
Staging: https://circletel-staging.vercel.app/api/admin
```

---

## Quick Start

### Fetch Order Installation Details (30 seconds)

```typescript
const response = await fetch(`/api/admin/orders/${orderId}/installation`, {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
  },
});

const { success, data } = await response.json();
// data.technician.name = "John Smith"
// data.scheduled_date = "2025-12-20T09:00:00Z"
```

### Fetch Payment Method Status

```typescript
const response = await fetch(`/api/admin/orders/${orderId}/payment-method`, {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
  },
});

const { success, data } = await response.json();
// data.paymentMethod.status = "active"
// data.emandateRequest.status = "signed"
```

---

## Endpoints

### GET /api/admin/orders/[orderId]/installation

Retrieves installation task details for a specific order, including assigned technician information.

**File**: `app/api/admin/orders/[orderId]/installation/route.ts`

#### Authentication

Uses service role to bypass RLS. No additional auth checks required at the route level.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `orderId` | string (UUID) | Yes | The consumer order ID |

#### Request

```typescript
// Using fetch
const response = await fetch('/api/admin/orders/f47ac10b-58cc-4372-a567-0e02b2c3d479/installation', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
  },
});
```

#### Response

##### Success Response (200)

```json
{
  "success": true,
  "data": {
    "id": "task-uuid",
    "order_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "technician_id": "tech-uuid",
    "status": "scheduled",
    "scheduled_date": "2025-12-20T09:00:00Z",
    "scheduled_time_slot": "09:00-12:00",
    "notes": "Customer prefers morning installation",
    "completion_notes": null,
    "completed_at": null,
    "created_at": "2025-12-17T10:30:00Z",
    "updated_at": "2025-12-17T10:30:00Z",
    "technician": {
      "id": "tech-uuid",
      "name": "John Smith",
      "email": "john.smith@circletel.co.za",
      "phone": "0821234567"
    }
  }
}
```

##### No Installation Task Found (404)

```json
{
  "success": false,
  "error": "No installation task found"
}
```

##### Validation Error (400)

```json
{
  "success": false,
  "error": "Order ID is required"
}
```

##### Server Error (500)

```json
{
  "success": false,
  "error": "Failed to fetch installation details",
  "details": "Error message from database"
}
```

#### Implementation Notes

**Why separate queries instead of PostgREST joins?**

The `installation_tasks` table does not have a foreign key relationship defined to the `technicians` table in the database schema. Attempting to use PostgREST syntax like `.select('*, technicians(*)')` results in a 500 error:

```
Could not find a relationship between 'installation_tasks' and 'technicians'
```

**Solution**: The endpoint fetches the installation task first, then performs a separate query to fetch technician details if `technician_id` exists:

```typescript
// Fetch task without join
const { data: task } = await supabase
  .from('installation_tasks')
  .select('*')
  .eq('order_id', orderId)
  .maybeSingle();

// Fetch technician separately
if (task?.technician_id) {
  const { data: techData } = await supabase
    .from('technicians')
    .select('id, first_name, last_name, email, phone')
    .eq('id', task.technician_id)
    .single();

  // Combine first_name + last_name into name field
  technician = {
    id: techData.id,
    name: `${techData.first_name || ''} ${techData.last_name || ''}`.trim(),
    email: techData.email,
    phone: techData.phone,
  };
}
```

#### Related Tables

| Table | Purpose |
|-------|---------|
| `installation_tasks` | Stores installation scheduling and status |
| `technicians` | Technician records (first_name, last_name, email, phone) |
| `consumer_orders` | Parent order records |

---

### GET /api/admin/orders/[orderId]/payment-method

Retrieves payment method details for an order including eMandate request status and signed URLs for mandate PDFs.

**File**: `app/api/admin/orders/[orderId]/payment-method/route.ts`

#### Authentication

Uses service role to bypass RLS.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `orderId` | string (UUID) | Yes | The consumer order ID |

#### Request

```typescript
const response = await fetch('/api/admin/orders/f47ac10b-58cc-4372-a567-0e02b2c3d479/payment-method', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
  },
});
```

#### Response

##### Success Response with eMandate (200)

```json
{
  "success": true,
  "data": {
    "paymentMethod": {
      "id": "pm-uuid",
      "method_type": "bank_account",
      "status": "active",
      "bank_name": "Standard Bank",
      "bank_account_name": "John Doe",
      "bank_account_number_masked": "****1234",
      "bank_account_type": "cheque",
      "branch_code": "051001",
      "mandate_amount": 599.00,
      "mandate_frequency": "monthly",
      "mandate_debit_day": 25,
      "mandate_signed_at": "2025-12-15T14:30:00Z",
      "netcash_mandate_pdf_link": "https://agyjovdugmtopasyvlng.supabase.co/storage/v1/object/sign/mandate-documents/...",
      "created_at": "2025-12-15T10:00:00Z"
    },
    "emandateRequest": {
      "id": "em-uuid",
      "status": "signed",
      "netcash_short_url": "https://paynow.netcash.co.za/...",
      "expires_at": "2025-12-17T10:00:00Z",
      "postback_reason_for_decline": null,
      "created_at": "2025-12-15T10:00:00Z",
      "sms_provider": "clickatell",
      "sms_message_id": "msg-12345",
      "sms_sent_at": "2025-12-15T10:01:00Z",
      "sms_delivery_status": "delivered",
      "sms_delivered_at": "2025-12-15T10:01:05Z",
      "sms_error": null
    }
  }
}
```

##### Success Response without Payment Method (200)

```json
{
  "success": true,
  "data": {
    "paymentMethod": null,
    "emandateRequest": null
  }
}
```

##### Order Not Found (404)

```json
{
  "success": false,
  "error": "Order not found"
}
```

##### Server Error (500)

```json
{
  "success": false,
  "error": "Internal server error",
  "details": "Error message"
}
```

#### Implementation Notes

**Signed URL Generation for Mandate PDFs**

Mandate PDF documents are stored in the private `mandate-documents` Supabase storage bucket. The API generates signed URLs with 1-hour validity:

```typescript
const getSignedPdfUrl = async (pdfLink: string | null): Promise<string | null> => {
  if (!pdfLink) return null;

  // Check if it's a Supabase storage path
  if (pdfLink.startsWith('mandate-documents/')) {
    const storagePath = pdfLink.replace('mandate-documents/', '');
    const { data: urlData, error: urlError } = await supabase.storage
      .from('mandate-documents')
      .createSignedUrl(storagePath, 60 * 60); // 1 hour validity

    if (urlError) {
      console.error('Error creating signed URL:', urlError);
      return null;
    }
    return urlData?.signedUrl || null;
  }

  // Return as-is if it's already a full URL
  return pdfLink;
};
```

**Data Sources Priority**

The endpoint checks multiple tables in order:

1. `emandate_requests` - Primary source for eMandate-based orders
2. `payment_methods` - Linked via `emandate_requests.payment_method_id`
3. `customer_payment_methods` - Fallback for legacy/manually verified payment methods

**Separate Queries Pattern**

Similar to the installation endpoint, this uses separate queries instead of PostgREST joins due to missing FK relationships in the schema.

#### Related Tables

| Table | Purpose |
|-------|---------|
| `consumer_orders` | Parent order with `customer_id` |
| `emandate_requests` | eMandate request tracking (NetCash) |
| `payment_methods` | Verified payment method records |
| `customer_payment_methods` | Legacy payment method storage |

#### Storage Buckets

| Bucket | Access | Purpose |
|--------|--------|---------|
| `mandate-documents` | Private | Stores signed eMandate PDF documents from NetCash |

---

### GET /api/admin/billing/customer-invoices

Retrieves all invoices for a specific customer. Implements the dual authentication pattern.

**File**: `app/api/admin/billing/customer-invoices/route.ts`

#### Authentication

Requires admin authentication. Supports both Authorization header and cookie-based sessions.

```typescript
// Check Authorization header first
const authHeader = request.headers.get('authorization');
if (authHeader?.startsWith('Bearer ')) {
  const token = authHeader.split(' ')[1];
  const { data } = await supabaseAuth.auth.getUser(token);
  user = data.user;
}

// Fallback to cookie-based session
if (!user) {
  const sessionClient = await createClientWithSession();
  const { data } = await sessionClient.auth.getUser();
  user = data.user;
}
```

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `customer_id` | string (UUID) | Yes | The customer ID to fetch invoices for |

#### Request

```typescript
const response = await fetch('/api/admin/billing/customer-invoices?customer_id=cust-uuid', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
  },
});
```

#### Response

##### Success Response (200)

```json
{
  "success": true,
  "invoices": [
    {
      "id": "inv-uuid",
      "customer_id": "cust-uuid",
      "invoice_number": "INV-2025-0001",
      "invoice_date": "2025-12-01",
      "due_date": "2025-12-15",
      "amount": 599.00,
      "tax_amount": 89.85,
      "total_amount": 688.85,
      "status": "paid",
      "payment_date": "2025-12-10",
      "created_at": "2025-12-01T00:00:00Z"
    },
    {
      "id": "inv-uuid-2",
      "customer_id": "cust-uuid",
      "invoice_number": "INV-2025-0002",
      "invoice_date": "2025-12-17",
      "due_date": "2025-12-31",
      "amount": 599.00,
      "tax_amount": 89.85,
      "total_amount": 688.85,
      "status": "pending",
      "payment_date": null,
      "created_at": "2025-12-17T00:00:00Z"
    }
  ],
  "count": 2
}
```

##### Missing Parameter (400)

```json
{
  "success": false,
  "error": "Missing required parameter: customer_id"
}
```

##### Unauthorized (401)

```json
{
  "success": false,
  "error": "Unauthorized"
}
```

##### Admin Access Required (403)

```json
{
  "success": false,
  "error": "Admin access required"
}
```

##### Server Error (500)

```json
{
  "success": false,
  "error": "Failed to fetch invoices"
}
```

#### Implementation Notes

**Dual Authentication Pattern**

This endpoint demonstrates the recommended pattern for admin APIs that need to support both the admin panel (which sends Authorization headers) and potential SSR scenarios (which use cookies):

```typescript
// 1. Check Authorization header first (admin panel uses this)
const authHeader = request.headers.get('authorization');
let user = null;

if (authHeader?.startsWith('Bearer ')) {
  const token = authHeader.split(' ')[1];
  const supabaseAuth = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data } = await supabaseAuth.auth.getUser(token);
  user = data.user;
}

// 2. Fallback to cookie-based session
if (!user) {
  const sessionClient = await createClientWithSession();
  const { data } = await sessionClient.auth.getUser();
  user = data.user;
}

// 3. Verify admin permissions
const { data: adminUser } = await supabase
  .from('admin_users')
  .select('id, role, permissions')
  .eq('email', user.email)
  .single();

if (!adminUser) {
  return NextResponse.json(
    { success: false, error: 'Admin access required' },
    { status: 403 }
  );
}
```

**Why This Fix Was Needed**

The admin panel sends authentication via the `Authorization` header, but the original implementation only checked cookie-based sessions. This caused 401 errors when admins tried to view customer invoices from the order detail page.

#### Related Tables

| Table | Purpose |
|-------|---------|
| `customer_invoices` | Invoice records |
| `admin_users` | Admin user verification |

---

### GET /api/admin/customers/[id]/payment-methods

Retrieves all payment methods for a specific customer with signed URLs for mandate PDFs.

**File**: `app/api/admin/customers/[id]/payment-methods/route.ts`

#### Authentication

Uses service role to bypass RLS.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (UUID) | Yes | The customer ID |

#### Request

```typescript
const response = await fetch('/api/admin/customers/cust-uuid/payment-methods', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
  },
});
```

#### Response

##### Success Response (200)

```json
{
  "success": true,
  "data": [
    {
      "id": "pm-uuid",
      "method_type": "bank_account",
      "status": "active",
      "bank_name": "Standard Bank",
      "bank_account_name": "John Doe",
      "bank_account_number_masked": "****1234",
      "branch_code": "051001",
      "mandate_amount": 599.00,
      "mandate_debit_day": 25,
      "mandate_signed_at": "2025-12-15T14:30:00Z",
      "netcash_mandate_reference": "NC-12345678",
      "netcash_mandate_pdf_link": "https://agyjovdugmtopasyvlng.supabase.co/storage/v1/object/sign/mandate-documents/...",
      "is_primary": true,
      "is_verified": true,
      "created_at": "2025-12-15T10:00:00Z",
      "updated_at": "2025-12-15T14:30:00Z"
    }
  ]
}
```

##### Server Error (500)

```json
{
  "success": false,
  "error": "Failed to fetch payment methods"
}
```

#### Implementation Notes

**Signed URL Generation**

The endpoint generates signed URLs for all mandate PDFs stored in Supabase storage:

```typescript
const paymentMethodsWithUrls = await Promise.all(
  (paymentMethods || []).map(async (pm) => {
    if (pm.netcash_mandate_pdf_link && pm.netcash_mandate_pdf_link.startsWith('mandate-documents/')) {
      const storagePath = pm.netcash_mandate_pdf_link.replace('mandate-documents/', '');
      const { data: urlData } = await supabase.storage
        .from('mandate-documents')
        .createSignedUrl(storagePath, 60 * 60); // 1 hour validity

      return {
        ...pm,
        netcash_mandate_pdf_link: urlData?.signedUrl || pm.netcash_mandate_pdf_link,
      };
    }
    return pm;
  })
);
```

#### Related Tables

| Table | Purpose |
|-------|---------|
| `payment_methods` | Payment method records |
| `customers` | Customer records |

---

### POST /api/admin/orders/[orderId]/approve-validation

Manually approves payment method validation after receiving a NetCash "102 Validation return" email. This is necessary because NetCash sends bank validation confirmations via email instead of webhooks.

**File**: `app/api/admin/orders/[orderId]/approve-validation/route.ts`

#### Authentication

Uses service role to bypass RLS.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `orderId` | string (UUID) | Yes | The consumer order ID |

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `netcashReference` | string | No | Optional NetCash reference from validation email |
| `notes` | string | No | Optional admin notes for audit trail |

#### Request

```typescript
const response = await fetch('/api/admin/orders/f47ac10b-58cc-4372-a567-0e02b2c3d479/approve-validation', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    netcashReference: 'NC-VAL-12345',
    notes: 'Received 102 Validation email on 2025-12-17',
  }),
});
```

#### Response

##### Success Response (200)

```json
{
  "success": true,
  "message": "Payment method validation approved successfully",
  "data": {
    "orderId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "orderNumber": "ORD-2025-0123",
    "paymentMethodId": "pm-uuid",
    "newStatus": "active"
  }
}
```

##### Order Not Found (404)

```json
{
  "success": false,
  "error": "Order not found"
}
```

##### No Payment Method Request (404)

```json
{
  "success": false,
  "error": "No payment method request found for this order"
}
```

##### Server Error (500)

```json
{
  "success": false,
  "error": "Failed to update emandate request"
}
```

#### Implementation Notes

**Why This Endpoint Exists**

NetCash eMandate validation follows this flow:

1. Customer signs eMandate via NetCash URL
2. NetCash sends postback webhook with `status: signed`
3. NetCash performs bank account validation (AVS)
4. **Problem**: Validation results (102 code) are sent via email to merchant, NOT via webhook

Without this endpoint, admins would need to manually update multiple database tables when receiving the validation email.

**Database Updates Performed**

The endpoint updates three tables in sequence:

1. **emandate_requests**: Sets `status` to `signed`, records `signed_at` timestamp

```typescript
await supabase
  .from('emandate_requests')
  .update({
    status: 'signed',
    signed_at: now,
    updated_at: now,
    postback_data: {
      ...emandateRequest.postback_data,
      manual_approval: true,
      manual_approval_at: now,
      manual_approval_notes: body.notes || 'Approved via admin panel after 102 Validation email',
    },
  })
  .eq('id', emandateRequest.id);
```

2. **payment_methods**: Sets `status` to `active`, enables mandate

```typescript
await supabase
  .from('payment_methods')
  .update({
    status: 'active',
    mandate_active: true,
    mandate_signed_at: now,
    is_verified: true,
    verification_method: 'netcash_validation',
    netcash_mandate_reference: body.netcashReference || emandateRequest.netcash_account_reference,
    activated_at: now,
    updated_at: now,
  })
  .eq('id', emandateRequest.payment_method_id);
```

3. **consumer_orders**: Updates status if currently `payment_method_pending`

```typescript
if (order.status === 'payment_method_pending') {
  await supabase
    .from('consumer_orders')
    .update({
      status: 'payment_method_registered',
      payment_method: 'debit_order',
      updated_at: now,
    })
    .eq('id', orderId);
}
```

4. **order_status_history**: Creates audit log entry

```typescript
await supabase.from('order_status_history').insert({
  entity_type: 'consumer_order',
  entity_id: orderId,
  old_status: order.status,
  new_status: 'payment_method_registered',
  change_reason: 'Payment method validation approved manually (NetCash 102 Validation email received)',
  automated: false,
  customer_notified: false,
  status_changed_at: now,
});
```

**Workflow Context**

```
Customer Flow:
Order Created → eMandate Sent → Customer Signs → [NetCash Validates] → Service Activation

Admin Action Required:
NetCash Email "102 Validation return" → Admin clicks "Approve Validation" → Order proceeds
```

#### Related Tables

| Table | Purpose |
|-------|---------|
| `consumer_orders` | Parent order record |
| `emandate_requests` | eMandate request tracking |
| `payment_methods` | Payment method records |
| `order_status_history` | Audit trail for status changes |

---

## Key Patterns

### 1. Dual Authentication Pattern

Admin API routes should check both Authorization headers and cookies:

```typescript
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClientWithSession } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  let user = null;

  // Check Authorization header first (admin panel uses this)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const supabaseAuth = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data } = await supabaseAuth.auth.getUser(token);
    user = data.user;
  }

  // Fallback to cookie-based session
  if (!user) {
    const sessionClient = await createClientWithSession();
    const { data } = await sessionClient.auth.getUser();
    user = data.user;
  }

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Proceed with request...
}
```

### 2. Signed URL Generation for Private Storage

For files in private Supabase storage buckets:

```typescript
const getSignedUrl = async (storagePath: string, bucket: string = 'mandate-documents'): Promise<string | null> => {
  if (!storagePath) return null;

  // Check if it's a storage path (not already a full URL)
  if (storagePath.startsWith(`${bucket}/`)) {
    const path = storagePath.replace(`${bucket}/`, '');
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 60 * 60); // 1 hour validity

    if (error) {
      console.error('Error creating signed URL:', error);
      return null;
    }
    return data?.signedUrl || null;
  }

  // Return as-is if already a full URL
  return storagePath;
};
```

### 3. Separate Queries vs PostgREST Joins

When FK relationships don't exist in Supabase, use separate queries:

```typescript
// DON'T: This will fail if no FK relationship exists
const { data } = await supabase
  .from('installation_tasks')
  .select('*, technicians(*)') // Error: relationship not found
  .eq('order_id', orderId);

// DO: Use separate queries
const { data: task } = await supabase
  .from('installation_tasks')
  .select('*')
  .eq('order_id', orderId)
  .maybeSingle();

if (task?.technician_id) {
  const { data: technician } = await supabase
    .from('technicians')
    .select('*')
    .eq('id', task.technician_id)
    .single();
}
```

---

## Error Handling

### Common Errors and Resolutions

| Error | Status | Cause | Resolution |
|-------|--------|-------|------------|
| `Unauthorized` | 401 | Missing or invalid auth token | Ensure Authorization header or valid session cookie |
| `Admin access required` | 403 | User not in `admin_users` table | Verify user has admin role assigned |
| `Order not found` | 404 | Invalid order ID | Verify order ID exists in `consumer_orders` |
| `No installation task found` | 404 | No task created for order | Installation may not be scheduled yet |
| `No payment method request found` | 404 | No eMandate for this order | Order may use different payment method |
| `Missing required parameter` | 400 | Required query param not provided | Check API documentation for required params |
| `Failed to fetch` | 500 | Database query error | Check Supabase logs for details |

### Error Response Format

All endpoints return errors in consistent format:

```json
{
  "success": false,
  "error": "Human-readable error message",
  "details": "Technical details (optional, for debugging)"
}
```

---

## Related Documentation

- [Customer Authentication API](./CUSTOMER_AUTHENTICATION.md) - Consumer auth patterns
- [Authentication System Overview](../architecture/AUTHENTICATION_SYSTEM.md) - Three-context auth
- [System Overview](../architecture/SYSTEM_OVERVIEW.md) - Database schema and architecture
- [NetCash eMandate Setup](../integrations/NETCASH_EMANDATE_SETUP.md) - eMandate workflow details
- [NetCash Webhook Configuration](../integrations/NETCASH_WEBHOOK_CONFIGURATION.md) - Webhook setup

---

## Changelog

### 2025-12-17 (v1.0)

**Initial Documentation**

- **GET /api/admin/orders/[orderId]/installation**
  - Documented separate query pattern for technician data
  - Fixed 500 error from missing FK relationship

- **GET /api/admin/orders/[orderId]/payment-method**
  - Added signed URL generation for mandate PDFs
  - Fixed 500 error from PostgREST join issues

- **GET /api/admin/billing/customer-invoices**
  - Implemented dual authentication pattern
  - Fixed 401 error when using Authorization header

- **GET /api/admin/customers/[id]/payment-methods**
  - New endpoint for fetching all customer payment methods
  - Includes signed URL generation for mandate PDFs

- **POST /api/admin/orders/[orderId]/approve-validation**
  - New endpoint for manual NetCash validation approval
  - Updates emandate_requests, payment_methods, consumer_orders
  - Creates audit log in order_status_history
