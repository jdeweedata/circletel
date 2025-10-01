# Netcash Integration Guide for CircleTel

**Story**: CFC-001-01 Payment Integration
**Payment Gateway**: Netcash Pay Now
**Integration Type**: Direct redirect to Netcash with webhook callbacks

---

## Table of Contents

1. [Overview](#overview)
2. [Your Test Account Configuration](#your-test-account-configuration)
3. [Integration Architecture](#integration-architecture)
4. [Payment Flow Implementation](#payment-flow-implementation)
5. [Service Key vs PCI Vault Key](#service-key-vs-pci-vault-key)
6. [Implementation Steps](#implementation-steps)
7. [Testing with Sandbox](#testing-with-sandbox)
8. [Production Deployment](#production-deployment)

---

## Overview

CircleTel uses **Netcash Pay Now** for payment processing. This is a redirect-based integration where customers are sent to Netcash's hosted payment page to complete their purchase.

**Key Benefits:**
- ✅ PCI DSS compliant (no card data touches our servers)
- ✅ Hosted payment page (Netcash handles card input)
- ✅ Tokenization support via PCI Vault (for future recurring payments)
- ✅ Webhook notifications for payment status
- ✅ ZAR currency support

---

## Your Test Account Configuration

### ✅ Already Configured Credentials

You already have test account credentials in your `.env.local`:

```bash
# Service Key - Main API authentication
NEXT_PUBLIC_NETCASH_SERVICE_KEY=7928c6de-219f-4b75-9408-ea0e53be8c87

# PCI Vault Key - Card tokenization (for future use)
NEXT_PUBLIC_NETCASH_PCI_VAULT_KEY=3143ee79-0c96-4909-968e-5a716fd19a65
```

### Missing Configuration (You Need to Add)

You still need to configure these variables for the payment integration:

```bash
# Merchant ID - Your Netcash account identifier
# Find in: Netcash Dashboard → Account Settings → Merchant Profile
NETCASH_MERCHANT_ID=your_test_merchant_id

# Webhook Secret - For verifying webhook signatures (generate yourself)
# Generate using: openssl rand -hex 32
NETCASH_WEBHOOK_SECRET=your_random_32_char_secret

# Payment URLs (already correct for sandbox)
NETCASH_PAYMENT_URL=https://sandbox.netcash.co.za/paynow/process
```

### How to Find Your Merchant ID

1. Log in to your Netcash test account: https://merchant.netcash.co.za
2. Navigate to **Account Settings** or **Profile**
3. Look for **Merchant ID** or **Account Number** (usually 9-digit number)
4. Copy and paste into `.env.local`

Example:
```bash
NETCASH_MERCHANT_ID=100012345
```

### Generate Webhook Secret

```bash
# Run this command to generate a secure webhook secret:
openssl rand -hex 32

# Copy the output (64 characters) and add to .env.local:
NETCASH_WEBHOOK_SECRET=a1b2c3d4e5f6...
```

---

## Integration Architecture

### Payment Flow Diagram

```
┌─────────────┐
│   Customer  │
│  on Website │
└──────┬──────┘
       │ 1. Selects package, clicks "Proceed to Payment"
       ▼
┌─────────────────────────┐
│  CircleTel Website      │
│  /order/payment         │
│  - Creates order record │
│  - Generates reference  │
└──────┬──────────────────┘
       │ 2. POST /api/payment/netcash/initiate
       ▼
┌─────────────────────────┐
│  CircleTel API          │
│  - Generate payment URL │
│  - Add SERVICE_KEY      │
│  - Add order details    │
└──────┬──────────────────┘
       │ 3. Redirect to Netcash
       ▼
┌─────────────────────────┐
│  Netcash Payment Page   │
│  (Hosted by Netcash)    │
│  - Customer enters card │
│  - Netcash processes    │
└──────┬──────────────────┘
       │ 4a. Payment completed
       ▼
┌─────────────────────────┐      4b. Webhook POST
│  Netcash Webhook        │────────────────────────┐
│  (async notification)   │                        │
└─────────────────────────┘                        │
                                                   ▼
                                          ┌────────────────────┐
                                          │  CircleTel API     │
                                          │  /api/payment/     │
                                          │  netcash/webhook   │
                                          │  - Verify signature│
                                          │  - Update order    │
                                          │  - Send email      │
                                          └─────────┬──────────┘
       │ 5. Redirect to CircleTel               │
       ▼                                         │
┌─────────────────────────┐                     │
│  CircleTel              │◄────────────────────┘
│  /order/confirmation    │   6. Order marked complete
│  - Show success message │      Email sent
└─────────────────────────┘
```

### Key Components

1. **Payment Initiation API** (`/api/payment/netcash/initiate`)
   - Creates order record in database
   - Generates unique payment reference
   - Constructs Netcash payment URL with parameters
   - Returns redirect URL to frontend

2. **Payment Stage Component** (`PaymentStage.tsx`)
   - Displays order summary
   - Shows total amount
   - "Pay with Netcash" button triggers redirect

3. **Webhook Handler** (`/api/payment/netcash/webhook`)
   - Receives payment notifications from Netcash
   - Verifies webhook signature (security)
   - Updates order status in database
   - Sends confirmation email via Resend
   - Logs audit trail

---

## Service Key vs PCI Vault Key

### NEXT_PUBLIC_NETCASH_SERVICE_KEY

**Purpose**: Main API authentication for payment processing

**Used For:**
- Authenticating payment requests to Netcash
- Pay Now transactions (one-time payments)
- Account queries and service calls
- Non-tokenized card processing

**When to Use**: **Every payment transaction** (CFC-001-01 needs this!)

**Example Usage:**
```typescript
// In payment initiation
const paymentUrl = new URL('https://sandbox.netcash.co.za/paynow/process');
paymentUrl.searchParams.append('ServiceKey', process.env.NEXT_PUBLIC_NETCASH_SERVICE_KEY);
paymentUrl.searchParams.append('Amount', totalAmount);
paymentUrl.searchParams.append('Reference', paymentReference);
// ... other params
```

### NEXT_PUBLIC_NETCASH_PCI_VAULT_KEY

**Purpose**: Card tokenization and secure card storage (PCI DSS compliance)

**Used For:**
- Saving cards for later use (recurring payments)
- Storing tokenized card data securely
- Processing future payments without re-entering card details
- Subscription billing with saved cards

**When to Use**: **Optional for CFC-001-01** (future enhancement for subscriptions)

**Not Needed For:**
- One-time payments (current implementation)
- Redirect-based checkout (Netcash hosted page)

**Future Use Cases:**
```typescript
// Example: Saving card for recurring billing (future story)
const saveCard = async () => {
  const response = await fetch('https://api.netcash.co.za/vault/tokenize', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_NETCASH_PCI_VAULT_KEY}`
    },
    body: JSON.stringify({
      cardNumber: '4000000000000002', // Never store this in your app!
      cardholderName: 'John Doe'
    })
  });

  const { token } = await response.json();
  // Store token in database, use for future charges
};
```

### Which Keys Do You Need for CFC-001-01?

| Key | Required? | Purpose |
|-----|-----------|---------|
| `NETCASH_SERVICE_KEY` | ✅ **YES** | Process one-time payments |
| `NETCASH_PCI_VAULT_KEY` | ❌ **NO** (optional) | Future recurring billing |
| `NETCASH_MERCHANT_ID` | ✅ **YES** | Identify your account |
| `NETCASH_WEBHOOK_SECRET` | ✅ **YES** | Verify webhook signatures |

---

## Payment Flow Implementation

### Step 1: Customer Initiates Payment

```typescript
// components/order/stages/PaymentStage.tsx
const handlePayment = async () => {
  try {
    // Call our API to initiate payment
    const response = await fetch('/api/payment/netcash/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: order.id,
        amount: order.totalAmount,
        customerEmail: order.customerEmail,
        customerName: order.customerName
      })
    });

    const { paymentUrl } = await response.json();

    // Redirect to Netcash
    window.location.href = paymentUrl;
  } catch (error) {
    console.error('Payment initiation failed:', error);
    toast.error('Unable to process payment. Please try again.');
  }
};
```

### Step 2: API Creates Payment URL

```typescript
// app/api/payment/netcash/initiate/route.ts
export async function POST(req: Request) {
  const { orderId, amount, customerEmail, customerName } = await req.json();

  // Create order in database
  const { data: order } = await supabase
    .from('orders')
    .insert({
      id: orderId,
      payment_status: 'pending',
      total_amount: amount,
      customer_email: customerEmail,
      payment_reference: `CT-${Date.now()}-${Math.floor(Math.random() * 10000)}`
    })
    .select()
    .single();

  // Build Netcash payment URL
  const paymentUrl = new URL(process.env.NETCASH_PAYMENT_URL!);

  // Add required parameters
  paymentUrl.searchParams.append('ServiceKey', process.env.NEXT_PUBLIC_NETCASH_SERVICE_KEY!);
  paymentUrl.searchParams.append('Amount', (amount * 100).toString()); // Convert to cents
  paymentUrl.searchParams.append('Reference', order.payment_reference);
  paymentUrl.searchParams.append('Email', customerEmail);
  paymentUrl.searchParams.append('CustomerName', customerName);
  paymentUrl.searchParams.append('ReturnUrl', process.env.NEXT_PUBLIC_PAYMENT_SUCCESS_URL!);
  paymentUrl.searchParams.append('CancelUrl', process.env.NEXT_PUBLIC_PAYMENT_CANCEL_URL!);
  paymentUrl.searchParams.append('NotifyUrl', `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/netcash/webhook`);

  return NextResponse.json({ paymentUrl: paymentUrl.toString() });
}
```

### Step 3: Netcash Processes Payment

Customer is redirected to Netcash's hosted payment page:
- Secure HTTPS connection
- Card details entered on Netcash's PCI-compliant form
- 3D Secure authentication (if enabled)
- Payment processed by Netcash

### Step 4: Webhook Notification

```typescript
// app/api/payment/netcash/webhook/route.ts
export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('X-Netcash-Signature');

  // Verify signature (security!)
  if (!verifySignature(body, signature, process.env.NETCASH_WEBHOOK_SECRET!)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const webhookData = JSON.parse(body);

  // Update order status
  const { data: order } = await supabase
    .from('orders')
    .update({
      payment_status: webhookData.status === 'completed' ? 'completed' : 'failed',
      netcash_transaction_id: webhookData.transaction_id,
      payment_date: new Date().toISOString()
    })
    .eq('payment_reference', webhookData.payment_reference)
    .select()
    .single();

  // Send confirmation email
  if (webhookData.status === 'completed') {
    await sendOrderConfirmationEmail(order);
  }

  // Create audit log
  await supabase.from('payment_audit_logs').insert({
    order_id: order.id,
    event_type: 'webhook_received',
    status: webhookData.status,
    netcash_response: webhookData,
    signature_valid: true
  });

  return NextResponse.json({ success: true });
}
```

---

## Implementation Steps

### Phase 1: Environment Setup (5 minutes) ✅

You've already completed:
- ✅ Service Key configured
- ✅ PCI Vault Key configured (for future)
- ✅ Payment URL set to sandbox

Still needed:
- [ ] Get Merchant ID from Netcash dashboard
- [ ] Generate webhook secret
- [ ] Add to `.env.local`

### Phase 2: Database Setup (5 minutes)

```bash
# Apply migration (creates orders table)
supabase db push --project-ref agyjovdugmtopasyvlng
```

### Phase 3: Create Payment Components (2 hours)

1. **PaymentStage.tsx** - Order summary and payment button
2. **OrderSummary.tsx** - Detailed order display
3. **Update OrderContext** - Add payment stage to wizard

### Phase 4: Create API Routes (2 hours)

1. **POST /api/payment/netcash/initiate** - Generate payment URL
2. **POST /api/payment/netcash/webhook** - Handle payment callbacks
3. **POST /api/orders/create** - Create order records

### Phase 5: Testing (1 hour)

1. Complete order flow with test card
2. Verify webhook processing
3. Check email delivery
4. Validate database records

---

## Testing with Sandbox

### Test Credit Cards

| Card Number | CVV | Expiry | Result |
|-------------|-----|--------|--------|
| 4000000000000002 | 123 | 12/25 | Success |
| 5200000000000015 | 456 | 12/25 | Success |
| 4000000000000010 | 123 | 12/25 | Declined |
| 4000000000000028 | 123 | 12/25 | Insufficient funds |

### Test Scenario

```bash
# 1. Start dev server
npm run dev

# 2. Navigate to coverage check
http://localhost:3006/coverage

# 3. Enter test address
"18 Rasmus Erasmus, Centurion, 0157"

# 4. Select a package
Click "Show me my deals" → Select SkyFibre 50Mbps

# 5. Fill contact details
Email: test@example.com
Phone: 0821234567
Name: Test Customer

# 6. Proceed to payment
Click "Proceed to Payment"

# 7. Pay with test card
Use: 4000000000000002
CVV: 123
Expiry: 12/25

# 8. Verify success
- Should redirect to /order/confirmation
- Check email for confirmation
- Query database:
SELECT * FROM orders WHERE customer_email = 'test@example.com';
```

---

## Production Deployment

### Production Environment Variables

```bash
# Production Netcash credentials (get from production account)
NETCASH_MERCHANT_ID=your_production_merchant_id
NETCASH_SECRET_KEY=your_production_secret_key
NETCASH_PAYMENT_URL=https://paynow.netcash.co.za/site/paynow.aspx
NETCASH_WEBHOOK_SECRET=your_production_webhook_secret

# Production Service Keys
NEXT_PUBLIC_NETCASH_SERVICE_KEY=your_production_service_key
NEXT_PUBLIC_NETCASH_PCI_VAULT_KEY=your_production_vault_key

# Production URLs
NEXT_PUBLIC_APP_URL=https://circletel.co.za
NEXT_PUBLIC_PAYMENT_SUCCESS_URL=https://circletel.co.za/order/confirmation
NEXT_PUBLIC_PAYMENT_CANCEL_URL=https://circletel.co.za/order/payment
```

### Production Checklist

- [ ] Get production Netcash account credentials
- [ ] Configure webhook URL in Netcash dashboard: `https://circletel.co.za/api/payment/netcash/webhook`
- [ ] Enable HTTPS for all URLs (Vercel provides this automatically)
- [ ] Generate new webhook secret (different from sandbox)
- [ ] Test with real card in production (small amount)
- [ ] Monitor first 10 transactions closely
- [ ] Set up error alerting (Sentry recommended)

---

## Summary

### ✅ What You Have

- Service Key for payment processing
- PCI Vault Key for future tokenization
- Sandbox environment configured
- Resend email configured

### 📋 What You Need to Add

1. **Merchant ID** - Get from Netcash dashboard
2. **Webhook Secret** - Generate with `openssl rand -hex 32`
3. Add both to `.env.local`

### 🚀 Next Steps

1. Get Merchant ID from Netcash test account
2. Generate webhook secret
3. Update `.env.local`
4. Apply database migration
5. Start implementing PaymentStage component

**Estimated Time to Complete Setup**: 10 minutes
**Ready to Start Development**: After adding Merchant ID + Webhook Secret

---

## Resources

- **Netcash Pay Now Docs**: https://api.netcash.co.za/inbound-payments/pay-now/
- **Service Key Guide**: https://help.netcash.co.za/docs/account-profile-2/netconnector/
- **PCI Vault Docs**: https://api.netcash.co.za/other-documents/card-tokenization-gui/
- **Internal Setup Guide**: [CFC-001-01-DEVELOPMENT-SETUP.md](./CFC-001-01-DEVELOPMENT-SETUP.md)
- **Story Document**: [CFC-001-01-payment-integration.md](../stories/CFC-001-01-payment-integration.md)
