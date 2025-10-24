# Phase 3: Subscription Management - Days 11-13
## Service Dashboard, Billing, Payment Methods, Invoices

> **Goal**: Enable customer self-service for post-activation service management
> **Duration**: 3 working days
> **Priority**: P2 - Medium (Customer Retention)
> **Dependencies**: Phase 1 complete (order activation working)

---

## Overview

Phase 3 focuses on post-activation customer self-service, allowing customers to manage their services, payment methods, and billing without contacting support.

### What Phase 3 Delivers

- ✅ Service management dashboard (view all active services)
- ✅ Service modification workflow (upgrade/downgrade packages)
- ✅ Payment methods management (add/remove cards, auto-pay)
- ✅ Invoice history and downloads

### Success Criteria

- [ ] Customers can view all active services in dashboard
- [ ] Service upgrades/downgrades calculate prorated pricing
- [ ] Payment methods stored securely (tokenized)
- [ ] Auto-pay functional for recurring billing
- [ ] Invoice PDFs downloadable

---

## Day 11-12: Service Management Dashboard

### Task 7.1: Customer Account Dashboard (8 hours)

**File**: `/app/account/page.tsx` (enhance existing or create new)

**Description**: Central dashboard for customers to manage all services, view billing, and access account settings.

#### Implementation Details

**Page Structure**:

```tsx
// /app/account/page.tsx
import { ServicesList } from '@/components/account/ServicesList';
import { BillingSummary } from '@/components/account/BillingSummary';
import { UsageStats } from '@/components/account/UsageStats';
import { QuickActions } from '@/components/account/QuickActions';

export default async function AccountDashboardPage() {
  // Fetch customer's active services
  // Fetch upcoming billing info
  // Fetch usage data (if available from provider API)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <h1>My Account</h1>

        <BillingSummary
          nextPaymentDate={billing.nextPaymentDate}
          nextPaymentAmount={billing.nextAmount}
          paymentMethod={billing.paymentMethod}
        />

        <ServicesList services={activeServices} />

        <UsageStats services={activeServices} />
      </div>

      <div>
        <QuickActions />
      </div>
    </div>
  );
}
```

**Components**:

1. **BillingSummary** (`/components/account/BillingSummary.tsx`):
   - Next payment date
   - Next payment amount
   - Payment method on file
   - Auto-pay status
   - Link to billing history

2. **ServicesList** (`/components/account/ServicesList.tsx`):
   - List all active services
   - Service details (package, speed, address)
   - Service status (active, suspended, cancelled)
   - Quick actions (Upgrade, View Details, Manage)

3. **UsageStats** (`/components/account/UsageStats.tsx`) [Optional]:
   - Data usage (if available from provider)
   - Speed tests history
   - Uptime statistics

4. **QuickActions** (`/components/account/QuickActions.tsx`):
   - Upgrade Service
   - Add New Service
   - Manage Payment Methods
   - Download Invoices
   - Contact Support

**Database Queries**:

```sql
-- Fetch active services
SELECT * FROM consumer_orders
WHERE email = $1 AND status = 'active'
ORDER BY activation_date DESC;

-- Fetch next billing info
SELECT
  MIN(next_billing_date) as next_payment_date,
  SUM(monthly_recurring) as next_amount
FROM consumer_orders
WHERE email = $1 AND status = 'active';
```

**Acceptance Criteria**:
- [ ] Dashboard loads in < 2 seconds
- [ ] Shows all active services
- [ ] Displays next payment date and amount
- [ ] Quick actions functional
- [ ] Mobile responsive
- [ ] Handles users with no active services

---

### Task 7.2: Service Modification Wizard (4 hours)

**File**: `/app/account/services/[serviceId]/modify/page.tsx` (new)

**Description**: Workflow for customers to upgrade, downgrade, or modify their service.

#### Implementation Details

**Page Structure**:

```tsx
// /app/account/services/[serviceId]/modify/page.tsx
'use client';

import { useState } from 'react';
import { PackageSelector } from '@/components/account/modify/PackageSelector';
import { ProratedPricingCalculator } from '@/components/account/modify/ProratedPricingCalculator';
import { ScheduleChange } from '@/components/account/modify/ScheduleChange';

export default function ServiceModifyPage({ params }: { params: Promise<{ serviceId: string }> }) {
  const { serviceId } = await params;
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [changeDate, setChangeDate] = useState<'immediate' | 'next_billing'>('next_billing');

  const handleConfirmChange = async () => {
    const response = await fetch(`/api/account/services/${serviceId}/modify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        new_package_id: selectedPackage.id,
        change_date: changeDate,
      }),
    });

    if (response.ok) {
      router.push(`/account/services/${serviceId}?modified=true`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1>Modify Service</h1>
      <p>Current Package: {currentService.package_name} ({currentService.package_speed})</p>

      <PackageSelector
        currentPackage={currentService.package_id}
        onSelect={setSelectedPackage}
      />

      {selectedPackage && (
        <>
          <ProratedPricingCalculator
            currentPackage={currentService}
            newPackage={selectedPackage}
            changeDate={changeDate}
          />

          <ScheduleChange
            selectedDate={changeDate}
            onDateChange={setChangeDate}
          />

          <Button onClick={handleConfirmChange}>
            Confirm Change
          </Button>
        </>
      )}
    </div>
  );
}
```

**PackageSelector Component**:
- Show available packages for upgrade/downgrade
- Filter out current package
- Highlight "Recommended" packages
- Show price difference

**ProratedPricingCalculator Component**:

```tsx
// /components/account/modify/ProratedPricingCalculator.tsx
export function ProratedPricingCalculator({ currentPackage, newPackage, changeDate }) {
  const daysRemaining = calculateDaysRemaining(currentPackage.next_billing_date);
  const daysInMonth = 30;
  const dailyRate = newPackage.price / daysInMonth;

  const proratedCharge = dailyRate * daysRemaining;
  const creditDue = (currentPackage.price / daysInMonth) * daysRemaining;
  const netAmount = proratedCharge - creditDue;

  return (
    <div className="bg-gray-100 p-4 rounded">
      <h3>Pricing Breakdown</h3>
      {changeDate === 'immediate' ? (
        <>
          <div className="flex justify-between">
            <span>New package (prorated for {daysRemaining} days):</span>
            <span>R{proratedCharge.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Credit from current package:</span>
            <span>-R{creditDue.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold border-t pt-2 mt-2">
            <span>{netAmount > 0 ? 'Amount Due Today:' : 'Credit Applied:'}</span>
            <span>{netAmount > 0 ? 'R' : '-R'}{Math.abs(netAmount).toFixed(2)}</span>
          </div>
        </>
      ) : (
        <p>New package will take effect on your next billing date: {currentPackage.next_billing_date}</p>
      )}

      <p className="text-sm text-gray-600 mt-2">
        From {currentPackage.next_billing_date} onwards, you will be billed R{newPackage.price}/month.
      </p>
    </div>
  );
}
```

**API Route**: `/app/api/account/services/[serviceId]/modify/route.ts`

```typescript
// /app/api/account/services/[serviceId]/modify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest, { params }: { params: Promise<{ serviceId: string }> }) {
  const { serviceId } = await params;
  const { new_package_id, change_date } = await request.json();
  const supabase = await createClient();

  // Fetch current service
  const { data: currentService } = await supabase
    .from('consumer_orders')
    .select('*')
    .eq('id', serviceId)
    .single();

  // Fetch new package details
  const { data: newPackage } = await supabase
    .from('packages')
    .select('*')
    .eq('id', new_package_id)
    .single();

  if (change_date === 'immediate') {
    // Calculate prorated pricing
    const proratedAmount = calculateProratedAmount(currentService, newPackage);

    // Create modification record
    await supabase.from('service_modifications').insert({
      consumer_order_id: serviceId,
      old_package_id: currentService.package_id,
      new_package_id: new_package_id,
      change_date: new Date().toISOString(),
      prorated_amount: proratedAmount,
      status: 'pending_payment',
    });

    // If prorated amount > 0, require payment
    if (proratedAmount > 0) {
      // Redirect to payment
      return NextResponse.json({
        success: true,
        requires_payment: true,
        amount: proratedAmount,
      });
    }
  } else {
    // Schedule change for next billing date
    await supabase
      .from('service_modifications')
      .insert({
        consumer_order_id: serviceId,
        old_package_id: currentService.package_id,
        new_package_id: new_package_id,
        change_date: currentService.next_billing_date,
        status: 'scheduled',
      });
  }

  return NextResponse.json({ success: true });
}
```

**Acceptance Criteria**:
- [ ] Service modification page loads with current service details
- [ ] Available packages display (upgrades and downgrades)
- [ ] Prorated pricing calculated correctly
- [ ] User can choose immediate or next billing date
- [ ] Modification request created in database
- [ ] Email confirmation sent to customer
- [ ] Admin notified of modification request

---

## Day 13: Billing & Payment Methods

### Task 8.1: Payment Methods Management (4 hours)

**File**: `/app/account/payment-methods/page.tsx` (new)

**Description**: Secure interface to add, remove, and manage payment methods with auto-pay toggle.

#### Implementation Details

**Page Structure**:

```tsx
// /app/account/payment-methods/page.tsx
import { PaymentMethodsList } from '@/components/account/PaymentMethodsList';
import { AddPaymentMethodForm } from '@/components/account/AddPaymentMethodForm';

export default async function PaymentMethodsPage() {
  // Fetch saved payment methods (tokenized via Netcash)

  return (
    <div className="max-w-4xl mx-auto">
      <h1>Payment Methods</h1>

      <div className="mb-6">
        <h2>Saved Payment Methods</h2>
        <PaymentMethodsList methods={paymentMethods} />
      </div>

      <div>
        <h2>Add Payment Method</h2>
        <AddPaymentMethodForm />
      </div>
    </div>
  );
}
```

**Components**:

1. **PaymentMethodsList**:
   - Display saved cards (last 4 digits, brand, expiry)
   - Default payment method indicator
   - "Set as Default" button
   - "Delete" button
   - Auto-pay toggle

2. **AddPaymentMethodForm**:
   - Card number input (masked)
   - Expiry date input
   - CVV input
   - Cardholder name
   - "Save Card" button
   - Netcash tokenization integration

**Netcash Tokenization**:

```typescript
// /lib/payments/netcash-tokenization.ts
export async function tokenizeCard(cardDetails: CardDetails): Promise<string> {
  // Call Netcash tokenization API
  const response = await fetch('https://api.netcash.co.za/tokenize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.NETCASH_API_KEY}`,
    },
    body: JSON.stringify({
      card_number: cardDetails.number,
      expiry_month: cardDetails.expiryMonth,
      expiry_year: cardDetails.expiryYear,
      cvv: cardDetails.cvv,
    }),
  });

  const { token } = await response.json();
  return token; // Store this token, never store actual card details
}

export async function chargeTokenizedCard(token: string, amount: number): Promise<boolean> {
  // Charge using stored token
  const response = await fetch('https://api.netcash.co.za/charge', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.NETCASH_API_KEY}`,
    },
    body: JSON.stringify({
      token,
      amount,
    }),
  });

  return response.ok;
}
```

**Database Table**: `payment_methods` (new table needed)

```sql
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email TEXT NOT NULL,
  card_token TEXT NOT NULL, -- Tokenized card from Netcash
  card_last_four TEXT NOT NULL,
  card_brand TEXT, -- Visa, Mastercard, etc.
  expiry_month INT,
  expiry_year INT,
  cardholder_name TEXT,
  is_default BOOLEAN DEFAULT false,
  auto_pay_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Acceptance Criteria**:
- [ ] Saved payment methods display
- [ ] Card details tokenized (never stored in plain text)
- [ ] Add card form functional
- [ ] Set default payment method works
- [ ] Delete payment method works (with confirmation)
- [ ] Auto-pay toggle functional
- [ ] PCI DSS compliant (no raw card data stored)

---

### Task 8.2: Invoice History (4 hours)

**File**: `/app/account/invoices/page.tsx` (new)

**Description**: View and download invoice history.

#### Implementation Details

**Page Structure**:

```tsx
// /app/account/invoices/page.tsx
import { InvoicesList } from '@/components/account/InvoicesList';

export default async function InvoicesPage() {
  // Fetch all invoices for customer

  return (
    <div className="max-w-4xl mx-auto">
      <h1>Invoice History</h1>

      <InvoicesList invoices={invoices} />
    </div>
  );
}
```

**InvoicesList Component**:

```tsx
// /components/account/InvoicesList.tsx
import { Button } from '@/components/ui/button';
import { Download, Eye } from 'lucide-react';

export function InvoicesList({ invoices }: { invoices: Invoice[] }) {
  return (
    <div className="space-y-4">
      {invoices.map((invoice) => (
        <div key={invoice.id} className="flex items-center justify-between border rounded p-4">
          <div>
            <p className="font-semibold">{invoice.invoice_number}</p>
            <p className="text-sm text-gray-600">
              {new Date(invoice.invoice_date).toLocaleDateString()} | R{invoice.total_amount}
            </p>
            <p className="text-sm">
              Status: <span className={invoice.paid ? 'text-green-600' : 'text-red-600'}>
                {invoice.paid ? 'Paid' : 'Overdue'}
              </span>
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => viewInvoice(invoice.id)}>
              <Eye className="w-4 h-4 mr-1" /> View
            </Button>
            <Button variant="default" size="sm" onClick={() => downloadInvoice(invoice.id)}>
              <Download className="w-4 h-4 mr-1" /> Download
            </Button>
            {!invoice.paid && (
              <Button variant="destructive" size="sm" onClick={() => payInvoice(invoice.id)}>
                Pay Now
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
```

**Database Table**: `invoices` (new table needed)

```sql
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  consumer_order_id UUID REFERENCES consumer_orders(id),
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  paid BOOLEAN DEFAULT false,
  paid_at TIMESTAMPTZ,
  pdf_path TEXT, -- Path to generated PDF in storage
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Invoice PDF Generation**:

```typescript
// /lib/invoices/invoice-generator.ts
import { renderToBuffer } from '@react-pdf/renderer';
import { InvoicePDF } from '@/components/invoices/InvoicePDF';

export async function generateInvoicePDF(invoice: Invoice): Promise<Buffer> {
  return await renderToBuffer(<InvoicePDF invoice={invoice} />);
}

export async function saveInvoicePDF(invoice: Invoice): Promise<string> {
  const pdfBuffer = await generateInvoicePDF(invoice);

  // Upload to Supabase Storage
  const filePath = `invoices/${invoice.invoice_number}.pdf`;
  const { data, error } = await supabase.storage
    .from('invoices')
    .upload(filePath, pdfBuffer, { contentType: 'application/pdf' });

  if (error) throw error;

  return data.path;
}
```

**Acceptance Criteria**:
- [ ] Invoice history displays all invoices
- [ ] Invoices sorted by date (newest first)
- [ ] Paid/unpaid status visible
- [ ] "View" button displays invoice details
- [ ] "Download" button downloads PDF
- [ ] "Pay Now" button for overdue invoices
- [ ] Invoice PDFs generated correctly

---

## Phase 3 Completion Checklist

### Service Dashboard (Task 7.1)
- [ ] `/app/account/page.tsx` enhanced
- [ ] Active services list displays
- [ ] Billing summary shows next payment
- [ ] Quick actions functional
- [ ] Mobile responsive

### Service Modification (Task 7.2)
- [ ] `/app/account/services/[serviceId]/modify/page.tsx` created
- [ ] Package selector shows upgrade/downgrade options
- [ ] Prorated pricing calculated correctly
- [ ] Schedule change (immediate vs. next billing) works
- [ ] Modification request created in database
- [ ] Email confirmation sent

### Payment Methods (Task 8.1)
- [ ] `/app/account/payment-methods/page.tsx` created
- [ ] Saved payment methods display
- [ ] Add card form tokenizes securely
- [ ] Set default payment method works
- [ ] Auto-pay toggle functional
- [ ] PCI DSS compliant

### Invoice History (Task 8.2)
- [ ] `/app/account/invoices/page.tsx` created
- [ ] Invoice history displays
- [ ] PDF download works
- [ ] Pay overdue invoices functional
- [ ] Invoice generation working

---

## Next Steps

After completing Phase 3:

1. **Test self-service flows** - Service modifications, payment methods
2. **Deploy to production** - Release subscription management features
3. **Begin Phase 4** - UX optimizations and analytics
4. **Monitor adoption** - Track how many customers use self-service

See `PHASE_4_UX_OPTIMIZATIONS.md` for next steps.

---

**Last Updated**: 2025-10-21
**Duration**: 3 days
**Dependencies**: Phase 1 complete
**Blocks**: Customer self-service, support ticket reduction
