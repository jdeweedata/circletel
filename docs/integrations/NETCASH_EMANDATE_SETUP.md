# NetCash eMandate Integration Setup

## Overview

CircleTel uses NetCash's eMandate (DebiCheck) system for recurring debit order payments. This document covers the setup and configuration required.

## Flow Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Customer      │     │   CircleTel     │     │    NetCash      │
│   Checkout      │     │   Backend       │     │    API          │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │ 1. Select Debit Order │                       │
         │──────────────────────>│                       │
         │                       │                       │
         │                       │ 2. BatchFileUpload    │
         │                       │──────────────────────>│
         │                       │                       │
         │                       │ 3. File Token         │
         │                       │<──────────────────────│
         │                       │                       │
         │                       │                       │ 4. Validate Batch
         │                       │                       │    (Email: SUCCESSFUL)
         │                       │                       │
         │ 5. Email/SMS with     │                       │
         │    signing link       │<──────────────────────│
         │                       │                       │
         │ 6. Customer signs     │                       │
         │    mandate            │──────────────────────>│
         │                       │                       │
         │                       │ 7. Postback           │
         │                       │<──────────────────────│
         │                       │                       │
         │ 8. Confirmation       │                       │
         │<──────────────────────│                       │
         │                       │                       │
```

## NetCash Portal Configuration

### Required Settings

1. **Login to NetCash Merchant Portal**: https://merchant.netcash.co.za

2. **Navigate to**: Account Profile → Debit Orders → eMandate Settings

3. **Configure Postback URL**:
   ```
   Production: https://circletel.co.za/api/webhooks/netcash/emandate
   Staging:    https://staging.circletel.co.za/api/webhooks/netcash/emandate
   ```

4. **Enable Postback Fields** (ensure these are checked):
   - Account Reference
   - Mandate Successful
   - Mandate Reference Number
   - Bank Account Details
   - Agreement Date
   - Debit Day
   - Custom Fields (Field1, Field2, Field3)
   - Mandate PDF Link
   - Reason for Decline

### Service Keys Required

| Key | Environment Variable | Purpose |
|-----|---------------------|---------|
| Debit Order Service Key | `NETCASH_DEBIT_ORDER_SERVICE_KEY` | BatchFileUpload API |
| Account Service Key | `NETCASH_ACCOUNT_SERVICE_KEY` | Statement API |

## API Endpoints

### Initiate eMandate
```
POST /api/payment/emandate/initiate
```

**Request Body:**
```json
{
  "order_id": "uuid",
  "billing_day": 25,
  "bank_details": {
    "bank_name": "FNB",
    "account_name": "John Doe",
    "account_number": "62123456789",
    "branch_code": "250655",
    "account_type": "cheque"
  }
}
```

**Response:**
```json
{
  "success": true,
  "emandate_request_id": "uuid",
  "payment_method_id": "uuid",
  "file_token": "2056197.325121015250962.6758.108788.011",
  "account_reference": "CT-2025-00031",
  "expires_at": "2025-12-17T13:25:09.000Z",
  "message": "Mandate request submitted. Customer will receive an email/SMS from NetCash to sign the mandate."
}
```

### Webhook (Postback)
```
POST /api/webhooks/netcash/emandate
```

NetCash sends form-encoded data with mandate result.

## Batch File Format

The BatchFileUpload uses a tab-delimited format:

```
H	{ServiceKey}	1	Mandates	{BatchName}	{ActionDate}	{VendorKey}
K	101	102	110	114	113	121	122	123	202	161	530	531	532	534	535	540	541	201	...
T	{AccountRef}	{Name}	{IsConsumer}	{FirstName}	{Surname}	...
F	{Count}	{TotalCents}	9999
```

### Key Fields

| Code | Field | Description |
|------|-------|-------------|
| 101 | Account Reference | Unique customer reference (CT-YYYY-NNNNN) |
| 102 | Mandate Name | Customer full name |
| 110 | Is Consumer | 1=Individual, 0=Company |
| 161 | Amount | In cents (R549.00 = 54900) |
| 202 | Mobile Number | 10 digits (0737288016) |
| 201 | Email | Customer email |
| 530 | Frequency | 1=Monthly |
| 531 | Commencement Month | MM (01-12) |
| 532 | Commencement Day | DD or "LDOM" |
| 540 | Send Mandate | 1=Auto-send to customer |
| 311-313 | Custom Fields | order_id, order_number, customer_id |

## Database Tables

### `emandate_requests`
Tracks mandate request lifecycle:
- `pending` → `sent` → `signed` / `declined` / `failed`

### `payment_methods`
Stores payment method details:
- `pending` → `active` (after signing)
- Contains bank details, mandate reference, PDF link

### `customer_billing`
Links customer to primary payment method for auto-billing.

## Troubleshooting

### Mandate Not Received by Customer

1. **Check mobile number format**: Must be 10 digits starting with 0
2. **Check email**: Verify email address is correct
3. **Check NetCash portal**: View batch status in Debit Orders → Batch History
4. **Request load report**: Use `requestLoadReport(fileToken)` API

### Postback Not Received

1. **Verify URL in NetCash portal**: Must match exactly
2. **Check Vercel logs**: Look for `/api/webhooks/netcash/emandate` requests
3. **Check firewall**: Ensure NetCash IPs are not blocked
4. **Test endpoint**: `GET /api/webhooks/netcash/emandate` should return health check

### Mandate Declined

Common reasons:
- Bank account validation failed
- Customer declined on banking app
- Timeout (customer didn't respond in time)

Check `emandate_requests.postback_reason_for_decline` for details.

## Testing

### Staging Environment

Use NetCash staging credentials:
- Service Key: (from NetCash staging portal)
- WS URL: `https://ws.netcash.co.za/NIWS/niws_nif.svc` (same for staging)

### Test Flow

1. Create test order in admin panel
2. Initiate eMandate via API
3. Check email for mandate signing link
4. Sign mandate (or decline to test failure flow)
5. Verify postback received and database updated

## Support

- **NetCash Support**: support@netcash.co.za
- **API Documentation**: https://api.netcash.co.za/inbound-payments/emandate/

---

## Admin Support Email API

Send support emails to customers from the admin panel.

### Endpoint
```
POST /api/admin/support/send-email
```

### Request Body
```json
{
  "to": "customer@example.com",
  "cc": "manager@example.com",
  "subject": "RE: Your Account",
  "body": "Hi Customer,\n\nThank you for contacting us...",
  "customerId": "uuid",
  "orderId": "uuid"
}
```

### Response
```json
{
  "success": true,
  "message": "Email sent to customer@example.com",
  "messageId": "resend-message-id"
}
```

### UI Component
Use `<SendEmailDialog />` component in admin pages:

```tsx
import { SendEmailDialog } from '@/components/admin/support/SendEmailDialog';

<SendEmailDialog
  defaultTo="customer@example.com"
  defaultSubject="RE: Account CT-2025-00030"
  customerId="uuid"
  orderId="uuid"
/>
```
