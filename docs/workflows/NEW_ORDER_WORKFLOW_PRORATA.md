# New Order Workflow with Pro-rata Billing

**Created:** 2025-11-08
**Status:** ✅ Phase 1 Complete (Database + Core Logic)
**Implementation:** KYC-First Workflow with Pro-rata Billing

---

## 🎯 Overview

CircleTel's new order workflow prioritizes compliance and security by requiring KYC verification before payment processing, followed by pro-rata billing based on activation date.

### **Key Benefits:**
- ✅ **Reduced Fraud** - KYC verification before payment
- ✅ **Better Cash Flow** - Payment method secured before installation
- ✅ **Fair Billing** - Pro-rata for partial months
- ✅ **Improved UX** - Clear step-by-step process

---

## 🔄 New Workflow Sequence

```
1. Order Placed (pending)
        ↓
2. KYC Upload (kyc_pending → kyc_submitted)
        ↓
3. KYC Review & Approval (kyc_approved)
        ↓
4. Payment Method Registration (payment_method_registered)
        ↓
5. Installation Scheduled (installation_scheduled)
        ↓
6. Installation Completed (installation_completed)
        ↓
7. Service Activated (active)
        ↓
8. Pro-rata Billing Calculated & Charged
        ↓
9. Recurring Monthly Billing
```

---

## 📊 Order Status States

| Status | Description | Customer Action | Admin Action |
|--------|-------------|-----------------|--------------|
| `pending` | Order just placed | Wait for email | - |
| `kyc_pending` | Awaiting KYC upload | Upload ID + Proof of Address | - |
| `kyc_submitted` | KYC documents uploaded | Wait for approval | Review documents |
| `kyc_approved` | KYC approved | Add payment method | - |
| `kyc_rejected` | KYC rejected | Re-upload documents | Provide rejection reason |
| `payment_method_pending` | Awaiting payment method | Add debit order/card | - |
| `payment_method_registered` | Payment method added | Wait for installation | Schedule installation |
| `installation_scheduled` | Installation date set | Be available | - |
| `installation_in_progress` | Technician on-site | - | Complete installation |
| `installation_completed` | Installation done | - | Activate service |
| `active` | Service live | Use service | - |
| `suspended` | Service suspended | Pay outstanding | - |
| `cancelled` | Order cancelled | - | - |

---

## 💰 Pro-rata Billing Logic

### **Formula:**

```typescript
// Example: Activated on 15th November, billing on 1st of month
const activationDate = new Date('2025-11-15');
const monthlyPrice = 899.00;
const billingCycleDay = 1;

// Days in November
const daysInMonth = 30;

// Next billing date is Dec 1st
const nextBillingDate = new Date('2025-12-01');

// Days remaining: Nov 15 - Nov 30 (inclusive) = 16 days
const daysRemaining = 16;

// Daily rate
const dailyRate = monthlyPrice / daysInMonth; // 899 / 30 = 29.97

// Pro-rata amount
const prorataAmount = dailyRate * daysRemaining; // 29.97 × 16 = 479.52
```

### **Calculation Examples:**

#### Example 1: Mid-month Activation
- **Activation Date:** 15 November 2025
- **Monthly Price:** R899.00
- **Billing Cycle Day:** 1st of month
- **Days in Month:** 30
- **Days Remaining:** 16 (15th - 30th)
- **Daily Rate:** R29.97
- **Pro-rata Amount:** R479.52
- **First Invoice:** R479.52 (excl VAT) / R551.45 (incl 15% VAT)
- **Next Billing Date:** 1 December 2025
- **Subsequent Invoices:** R899.00 monthly

#### Example 2: Early Month Activation
- **Activation Date:** 3 November 2025
- **Monthly Price:** R899.00
- **Billing Cycle Day:** 1st of month
- **Days in Month:** 30
- **Days Remaining:** 28 (3rd - 30th)
- **Pro-rata Amount:** R838.32
- **First Invoice:** R838.32 (excl VAT) / R964.07 (incl VAT)

#### Example 3: Late Month Activation
- **Activation Date:** 28 November 2025
- **Monthly Price:** R899.00
- **Billing Cycle Day:** 1st of month
- **Days Remaining:** 3 (28th - 30th)
- **Pro-rata Amount:** R89.91
- **First Invoice:** R89.91 (excl VAT) / R103.40 (incl VAT)

---

## 🗄️ Database Changes

### **New Columns Added to `consumer_orders`:**

| Column | Type | Description |
|--------|------|-------------|
| `activation_date` | DATE | Date service was activated |
| `next_billing_date` | DATE | Next billing cycle date |
| `billing_cycle_day` | INTEGER | Day of month (1, 5, 15, 25) |
| `prorata_amount` | DECIMAL | Calculated pro-rata amount |
| `prorata_days` | INTEGER | Number of days in first cycle |
| `payment_method_id` | UUID | Linked payment method |
| `kyc_uploaded_at` | TIMESTAMPTZ | When KYC docs uploaded |
| `kyc_approved_at` | TIMESTAMPTZ | When KYC approved |
| `kyc_approved_by` | UUID | Admin who approved |
| `kyc_rejection_reason` | TEXT | Rejection reason |
| `payment_method_added_at` | TIMESTAMPTZ | When payment method added |

### **New Table: `customer_payment_methods`**

```sql
CREATE TABLE customer_payment_methods (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),

  -- Payment method type
  payment_type TEXT CHECK (payment_type IN ('debit_order', 'credit_card', 'eft')),

  -- Payment provider details
  payment_provider TEXT,
  payment_token TEXT, -- Tokenized reference

  -- Card details (last 4 digits only)
  card_last4 TEXT,
  card_brand TEXT,
  card_expiry_month INTEGER,
  card_expiry_year INTEGER,

  -- Bank details (debit orders)
  bank_name TEXT,
  account_holder_name TEXT,
  account_type TEXT,

  -- Status
  is_default BOOLEAN,
  is_active BOOLEAN,
  verified BOOLEAN,

  -- Mandate
  mandate_reference TEXT,
  mandate_signed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

---

## 🔧 Core Functions

### **1. Pro-rata Calculation (SQL)**

```sql
-- Calculate pro-rata billing
SELECT * FROM calculate_prorata_billing(
  '2025-11-15'::DATE,  -- Activation date
  899.00,              -- Monthly price
  1                    -- Billing cycle day
);

-- Returns:
-- prorata_amount: 479.52
-- prorata_days: 16
-- next_billing_date: 2025-12-01
-- daily_rate: 29.97
```

### **2. Pro-rata Calculation (TypeScript)**

```typescript
import { calculateProrataAmount, formatCurrency } from '@/lib/billing/prorata-calculator';

const prorata = calculateProrataAmount(
  new Date('2025-11-15'),  // Activation date
  899,                      // Monthly price
  1                         // Billing cycle day
);

console.log({
  prorataAmount: formatCurrency(prorata.prorataAmount),  // R479.52
  prorataDays: prorata.prorataDays,                      // 16
  nextBillingDate: prorata.nextBillingDate,             // 2025-12-01
  dailyRate: formatCurrency(prorata.dailyRate)          // R29.97
});
```

### **3. Status Transition Validation**

Automatic validation prevents invalid status transitions:

```sql
-- ✅ Valid transition
UPDATE consumer_orders
SET status = 'kyc_pending'
WHERE order_number = 'ORD-20251108-9841';

-- ✅ Valid transition
UPDATE consumer_orders
SET status = 'kyc_submitted'
WHERE order_number = 'ORD-20251108-9841';

-- ❌ Invalid transition (will throw error)
UPDATE consumer_orders
SET status = 'active'
WHERE order_number = 'ORD-20251108-9841';
-- Error: Cannot jump from kyc_submitted to active
```

### **4. Auto-timestamp Updates**

Timestamps are automatically set when status changes:

```sql
-- When status changes to kyc_submitted
-- kyc_uploaded_at is set automatically

-- When status changes to kyc_approved
-- kyc_approved_at is set automatically

-- When status changes to active
-- Pro-rata calculation runs automatically
```

---

## 📋 Customer Journey Example

### **Shaun Robertson's Order (ORD-20251108-9841)**

#### **Day 1: Order Placed (8 Nov 2025)**
```sql
-- Order created
INSERT INTO consumer_orders (...) VALUES (...);
-- Status: pending

-- System automatically updates status
UPDATE consumer_orders
SET status = 'kyc_pending'
WHERE order_number = 'ORD-20251108-9841';

-- Email sent: "Upload KYC documents to proceed"
```

#### **Day 2: KYC Upload (9 Nov 2025)**
```sql
-- Customer uploads documents
UPDATE consumer_orders
SET status = 'kyc_submitted'
WHERE order_number = 'ORD-20251108-9841';

-- kyc_uploaded_at set automatically
-- Email sent to admin: "New KYC documents for review"
```

#### **Day 3: KYC Approval (10 Nov 2025)**
```sql
-- Admin approves KYC
UPDATE consumer_orders
SET status = 'kyc_approved',
    kyc_approved_by = 'admin-user-id'
WHERE order_number = 'ORD-20251108-9841';

-- kyc_approved_at set automatically
-- Email sent to customer: "KYC approved! Add payment method"
```

#### **Day 3: Payment Method Added (10 Nov 2025)**
```sql
-- Customer adds debit order
INSERT INTO customer_payment_methods (
  customer_id, payment_type, bank_name, ...
) VALUES (...);

-- Order updated
UPDATE consumer_orders
SET status = 'payment_method_registered',
    payment_method_id = 'payment-method-id'
WHERE order_number = 'ORD-20251108-9841';

-- payment_method_added_at set automatically
-- Email sent: "Payment method confirmed. Installation can be scheduled"
```

#### **Day 4: Installation Scheduled (11 Nov 2025)**
```sql
-- Service delivery schedules installation
UPDATE consumer_orders
SET status = 'installation_scheduled',
    installation_scheduled_date = '2025-11-15',
    installation_time_slot = '10:00-12:00'
WHERE order_number = 'ORD-20251108-9841';

-- Email + SMS sent: "Installation scheduled for 15 Nov"
```

#### **Day 8: Service Activated (15 Nov 2025)**
```sql
-- Technician completes installation
UPDATE consumer_orders
SET status = 'installation_completed'
WHERE order_number = 'ORD-20251108-9841';

-- Admin activates service
UPDATE consumer_orders
SET status = 'active',
    activation_date = '2025-11-15',
    billing_cycle_day = 1
WHERE order_number = 'ORD-20251108-9841';

-- Pro-rata calculation runs automatically:
-- prorata_amount = 479.52 (16 days × R29.97)
-- prorata_days = 16
-- next_billing_date = 2025-12-01

-- Email sent with invoice and credentials
```

#### **Day 8: First Invoice Generated (15 Nov 2025)**
```typescript
const invoice = {
  invoiceNumber: 'INV-2025-001',
  customer: 'Shaun Robertson',
  orderNumber: 'ORD-20251108-9841',

  lineItems: [
    {
      description: 'SkyFibre Home Plus (15 Nov - 30 Nov)',
      quantity: 16,
      unitPrice: 29.97,
      amount: 479.52
    }
  ],

  subtotal: 479.52,
  vat: 71.93,
  total: 551.45,

  dueDate: '2025-12-01',
  nextBillingDate: '2025-12-01',
  nextBillingAmount: 899.00
};

// Payment processed via registered debit order
```

#### **1 Dec: Second Invoice (Full Month)**
```sql
-- System generates monthly invoice
-- Amount: R899.00 (full month)
-- VAT: R134.85
-- Total: R1,033.85
```

---

## 🎨 Customer Dashboard UX

### **Order Status Card**

```tsx
// Customer sees step-by-step progress
<OrderStatusCard order={order}>
  <Step completed icon="✅">Order Placed</Step>
  <Step active icon="📄">Upload KYC Documents</Step>
  <Step pending icon="✓">KYC Approval</Step>
  <Step pending icon="💳">Add Payment Method</Step>
  <Step pending icon="📅">Installation</Step>
  <Step pending icon="🚀">Activation</Step>
</OrderStatusCard>
```

### **KYC Upload Interface**

```tsx
<KYCUploadForm orderNumber="ORD-20251108-9841">
  <FileUpload
    label="ID Document"
    accept=".pdf,.jpg,.png"
    required
  />
  <FileUpload
    label="Proof of Address (≤3 months)"
    accept=".pdf,.jpg,.png"
    required
  />
  <Button type="submit">Submit Documents</Button>
</KYCUploadForm>
```

### **Payment Method Registration**

```tsx
<PaymentMethodForm orderNumber="ORD-20251108-9841">
  <Select label="Payment Type">
    <Option value="debit_order">Debit Order (Recommended)</Option>
    <Option value="credit_card">Credit Card</Option>
  </Select>

  {/* Bank details for debit order */}
  <Input label="Bank Name" />
  <Input label="Account Number" />
  <Select label="Account Type">
    <Option value="cheque">Cheque</Option>
    <Option value="savings">Savings</Option>
  </Select>

  <Button type="submit">Register Payment Method</Button>
</PaymentMethodForm>
```

---

## 🔐 Security & Compliance

### **Payment Security:**
- ✅ **Never store raw card details** - Only tokenized references
- ✅ **PCI DSS compliant** - Use payment provider tokenization
- ✅ **Encrypted storage** - Sensitive data encrypted at rest
- ✅ **Mandate signatures** - Digital signature for debit orders

### **KYC Compliance:**
- ✅ **FICA compliant** - ID + Proof of Address required
- ✅ **Admin approval** - Manual review before processing
- ✅ **Audit trail** - Track who approved when
- ✅ **Rejection workflow** - Customer can re-upload

---

## 📊 Reporting Queries

### **Orders Pending KYC**
```sql
SELECT * FROM v_orders_pending_kyc;
```

### **Orders Pending Payment Method**
```sql
SELECT * FROM v_orders_pending_payment_method;
```

### **Pro-rata Billing Summary**
```sql
SELECT
  order_number,
  customer_name,
  activation_date,
  prorata_days,
  prorata_amount,
  next_billing_date
FROM v_prorata_billing_summary
WHERE activation_date >= CURRENT_DATE - INTERVAL '30 days';
```

---

## 🚀 Implementation Status

### ✅ **Phase 1: Database & Core Logic (COMPLETE)**
- ✅ Database migration created
- ✅ New order statuses added
- ✅ Pro-rata calculation function (SQL)
- ✅ Pro-rata calculator utility (TypeScript)
- ✅ Status transition validation
- ✅ Auto-timestamp triggers
- ✅ Payment methods table
- ✅ Reporting views

### ⏳ **Phase 2: Customer Dashboard (IN PROGRESS)**
- ⏳ KYC upload interface
- ⏳ Payment method registration
- ⏳ Order status tracking
- ⏳ Pro-rata invoice preview

### ⏳ **Phase 3: Admin Panel (PENDING)**
- ⏳ KYC review interface
- ⏳ Approval/rejection workflow
- ⏳ Installation scheduling
- ⏳ Service activation

### ⏳ **Phase 4: Automation (PENDING)**
- ⏳ Email notifications for each step
- ⏳ SMS reminders
- ⏳ Auto-invoice generation
- ⏳ Auto-billing via payment method

---

## 📝 Next Steps

1. ✅ **Apply Migration** (Ready to apply)
2. ⏳ **Build Customer KYC Upload Interface**
3. ⏳ **Build Payment Method Registration**
4. ⏳ **Build Admin KYC Review Interface**
5. ⏳ **Implement Email Notifications**
6. ⏳ **Test Complete Workflow with Shaun's Order**

---

**Last Updated:** 2025-11-08
**Version:** 1.0
**Maintained By:** CircleTel Development Team
