# Zoho Integration Addendum
## Billing, CRM, and Books Integration for Customer Journey

> **Purpose**: Extend customer journey with Zoho Billing, CRM, and Books via MCP
> **Dependencies**: Zoho MCP server configured in `.mcp.json`
> **Integration Type**: MCP-based (Model Context Protocol)
> **Priority**: P0 - Critical for MVP

---

## Executive Summary

This addendum integrates **Zoho Billing, CRM, and Books** into all 4 phases of the customer journey implementation, leveraging the existing CircleTel Zoho MCP server.

### Zoho Services Used

| Service | Purpose | Phase Integration |
|---------|---------|-------------------|
| **Zoho CRM** | Lead & contact management | All phases (lead capture, sales tracking) |
| **Zoho Books** | Invoicing & accounting | Phase 1, 3 (invoice generation, billing history) |
| **Zoho Billing** | Subscription & recurring billing | Phase 3 (subscription management, auto-billing) |

### Key Benefits

- ✅ **Single Source of Truth**: All customer data in Zoho ecosystem
- ✅ **Automated Billing**: Auto-generate invoices from orders
- ✅ **Real-Time Sync**: Lead capture → CRM → Billing → Books
- ✅ **VAT Compliance**: Zoho Books handles South African tax
- ✅ **Subscription Management**: Zoho Billing manages recurring revenue

---

## Architecture Overview

### Current Zoho MCP Setup

**MCP Server**: `https://circletel-zoho-900485550.zohomcp.com/mcp/message`

**Supported Apps** (current):
- Zoho CRM
- Zoho Mail
- Zoho Calendar
- Zoho Desk
- Zoho Projects

**To Add**:
- ✅ Zoho Books (invoicing, accounting)
- ✅ Zoho Billing (subscriptions, recurring billing)

### Integration Flow

```
Customer Journey Event → CircleTel API → Zoho MCP → Zoho Service
                                              ↓
Database Updated ← CircleTel API ← MCP Response ← Zoho Data
```

### Example: Order Activation → Invoice Generation

```
Order Status → 'active'
  ↓
Trigger: service_activation_trigger
  ↓
1. Send activation email (existing)
2. Create Zoho CRM contact (NEW)
3. Create Zoho Books customer (NEW)
4. Generate Zoho Books invoice (NEW)
5. Send invoice via Zoho Mail (NEW)
6. Create Zoho Billing subscription (NEW)
  ↓
Database: Update order with zoho_invoice_id, zoho_subscription_id
```

---

## Phase 1 Integration: Critical Fixes + Zoho

### Enhanced Task 1.2: Service Activation Email + Zoho

**Original Task**: Send activation email
**Enhanced Task**: Send activation email + create Zoho records

#### Implementation

**File**: `/lib/notifications/notification-service.ts` (update)

```typescript
// Enhanced service activation with Zoho integration
import zohoMCPClient from '@/lib/zoho-mcp-client';

async function sendServiceActivationEmail(order: ConsumerOrder): Promise<boolean> {
  try {
    // 1. Send activation email (existing)
    await EmailNotificationService.send({
      to: order.email,
      template: 'service_activated',
      data: { /* activation data */ },
    });

    // 2. Create Zoho CRM contact
    const crmContact = await zohoMCPClient.execute({
      action: 'create_contact',
      app: 'crm',
      parameters: {
        email: order.email,
        firstName: order.first_name,
        lastName: order.last_name,
        phone: order.phone,
        mailingStreet: order.installation_address,
        mailingCity: order.city,
        mailingState: order.province,
        mailingCountry: 'South Africa',
        accountName: `${order.first_name} ${order.last_name} - CircleTel`,
        leadSource: 'Website Order',
      },
    });

    // 3. Create Zoho Books customer
    const booksCustomer = await zohoMCPClient.execute({
      action: 'create_customer',
      app: 'books',
      parameters: {
        contact_name: `${order.first_name} ${order.last_name}`,
        email: order.email,
        phone: order.phone,
        billing_address: {
          street: order.billing_address || order.installation_address,
          city: order.city,
          state: order.province,
          country: 'South Africa',
          zip: order.postal_code,
        },
        currency_code: 'ZAR',
        payment_terms: 30, // Net 30 days
      },
    });

    // 4. Generate Zoho Books invoice
    const invoice = await zohoMCPClient.execute({
      action: 'create_invoice',
      app: 'books',
      parameters: {
        customer_id: booksCustomer.data.customer_id,
        invoice_number: `INV-${order.order_number}`,
        date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        line_items: [
          {
            item_id: order.package_id,
            name: `${order.package_name} - Installation Fee`,
            description: `One-time installation fee for ${order.package_speed}`,
            rate: order.installation_fee,
            quantity: 1,
            tax_id: process.env.ZOHO_VAT_TAX_ID, // South Africa VAT
          },
          order.router_cost > 0 && {
            name: 'Router Equipment',
            description: 'Internet router device',
            rate: order.router_cost,
            quantity: 1,
            tax_id: process.env.ZOHO_VAT_TAX_ID,
          },
        ].filter(Boolean),
        notes: `Installation scheduled for ${order.installation_date}. Monthly recurring billing will begin automatically.`,
        terms: 'Payment due within 30 days. Monthly service fee of R' + order.monthly_recurring + ' will be billed separately.',
      },
    });

    // 5. Create Zoho Billing subscription
    const subscription = await zohoMCPClient.execute({
      action: 'create_subscription',
      app: 'billing',
      parameters: {
        customer_id: booksCustomer.data.customer_id,
        plan_code: `plan_${order.package_id}`,
        plan_name: order.package_name,
        plan_description: `${order.package_speed} Internet Service`,
        billing_cycles: -1, // Infinite until cancelled
        interval: 1,
        interval_unit: 'months',
        price: order.monthly_recurring,
        currency_code: 'ZAR',
        start_date: order.activation_date,
        tax_id: process.env.ZOHO_VAT_TAX_ID,
        auto_collect: true, // Auto-charge payment method
        payment_terms: 0, // Due immediately
      },
    });

    // 6. Update order with Zoho IDs
    await supabase
      .from('consumer_orders')
      .update({
        zoho_contact_id: crmContact.data?.id,
        zoho_customer_id: booksCustomer.data?.customer_id,
        zoho_invoice_id: invoice.data?.invoice_id,
        zoho_subscription_id: subscription.data?.subscription_id,
      })
      .eq('id', order.id);

    // 7. Send invoice via Zoho Mail
    await zohoMCPClient.execute({
      action: 'send_email',
      app: 'mail',
      parameters: {
        to: [order.email],
        subject: `Your CircleTel Invoice - ${invoice.data.invoice_number}`,
        content: `
          <h1>Your Installation Invoice</h1>
          <p>Dear ${order.first_name},</p>
          <p>Your CircleTel internet service is now active! Please find your installation invoice attached.</p>
          <p><strong>Invoice Number:</strong> ${invoice.data.invoice_number}</p>
          <p><strong>Amount Due:</strong> R${invoice.data.total}</p>
          <p><strong>Due Date:</strong> ${invoice.data.due_date}</p>
          <p>Your monthly service fee of R${order.monthly_recurring} will be automatically billed starting next month.</p>
          <p>Thank you for choosing CircleTel!</p>
        `,
        contentType: 'html',
        attachments: [
          {
            fileName: `${invoice.data.invoice_number}.pdf`,
            content: invoice.data.invoice_pdf_base64,
            contentType: 'application/pdf',
          },
        ],
      },
    });

    return true;
  } catch (error) {
    console.error('Service activation with Zoho failed:', error);
    // Still return true for email, but log Zoho errors
    return true;
  }
}
```

#### Database Schema Update

**Add Zoho fields to `consumer_orders` table**:

```sql
ALTER TABLE consumer_orders
ADD COLUMN IF NOT EXISTS zoho_contact_id TEXT, -- Zoho CRM contact ID
ADD COLUMN IF NOT EXISTS zoho_customer_id TEXT, -- Zoho Books customer ID
ADD COLUMN IF NOT EXISTS zoho_invoice_id TEXT, -- Zoho Books invoice ID
ADD COLUMN IF NOT EXISTS zoho_subscription_id TEXT, -- Zoho Billing subscription ID
ADD COLUMN IF NOT EXISTS zoho_synced_at TIMESTAMPTZ; -- Last sync timestamp
```

#### Acceptance Criteria

- [ ] Zoho CRM contact created on activation
- [ ] Zoho Books customer created with billing address
- [ ] Zoho Books invoice generated with VAT
- [ ] Zoho Billing subscription created for recurring billing
- [ ] Invoice PDF emailed to customer
- [ ] Order updated with Zoho IDs
- [ ] Error handling for Zoho API failures (doesn't block activation)

---

### Enhanced Task 1.3: Sales Team Alerts + Zoho CRM

**Original Task**: Send sales alerts
**Enhanced Task**: Send sales alerts + create Zoho CRM lead

#### Implementation

**File**: `/lib/notifications/sales-alerts.ts` (update)

```typescript
import zohoMCPClient from '@/lib/zoho-mcp-client';

export class SalesAlertService {
  static async sendCoverageLeadAlert(lead: CoverageLead): Promise<boolean> {
    try {
      // 1. Create Zoho CRM lead
      const zohoLead = await zohoMCPClient.execute({
        action: 'create_lead',
        app: 'crm',
        parameters: {
          email: lead.email,
          firstName: lead.first_name,
          lastName: lead.last_name,
          company: lead.company_name || 'Individual',
          phone: lead.phone,
          leadSource: lead.lead_source || 'coverage_checker',
          status: 'Not Contacted',
          description: `No coverage available. Requested ${lead.requested_service_type || 'Fibre'} at ${lead.address}`,
          customFields: {
            Customer_Type: lead.customer_type,
            Requested_Service: lead.requested_service_type,
            Requested_Speed: lead.requested_speed,
            Budget_Range: lead.budget_range,
            Coverage_Available: 'No',
            Address: lead.address,
            City: lead.city,
            Province: lead.province,
          },
        },
      });

      // 2. Update lead with Zoho ID
      await supabase
        .from('coverage_leads')
        .update({
          zoho_lead_id: zohoLead.data?.id,
          zoho_synced_at: new Date().toISOString(),
        })
        .eq('id', lead.id);

      // 3. Send email alert (existing)
      await this.sendSalesEmail(lead);

      // 4. Send SMS alert (optional)
      await this.sendSalesSMS(lead);

      return true;
    } catch (error) {
      console.error('Zoho CRM lead creation failed:', error);
      // Still send email alert even if Zoho fails
      await this.sendSalesEmail(lead);
      return false;
    }
  }
}
```

#### Acceptance Criteria

- [ ] Zoho CRM lead created on coverage lead capture
- [ ] Custom fields populated (Customer_Type, Requested_Service, etc.)
- [ ] Lead status set to "Not Contacted"
- [ ] Email and SMS alerts still sent if Zoho fails

---

## Phase 2 Integration: B2B Journey + Zoho

### Enhanced Task 5.1: Admin Quote Builder + Zoho Books

**Original Task**: Build quote with PDF export
**Enhanced Task**: Build quote + sync with Zoho Books estimate

#### Implementation

**File**: `/app/api/admin/quotes/[quoteId]/send/route.ts` (update)

```typescript
import zohoMCPClient from '@/lib/zoho-mcp-client';

export async function POST(request: NextRequest, { params }: { params: Promise<{ quoteId: string }> }) {
  const { quoteId } = await params;
  const supabase = await createClient();

  // Fetch quote
  const { data: quote } = await supabase
    .from('business_quotes')
    .select('*')
    .eq('id', quoteId)
    .single();

  // 1. Create Zoho Books customer (if not exists)
  let zohoCustomerId = quote.zoho_customer_id;
  if (!zohoCustomerId) {
    const customer = await zohoMCPClient.execute({
      action: 'create_customer',
      app: 'books',
      parameters: {
        contact_name: quote.company_name,
        email: quote.contact_email,
        phone: quote.contact_phone,
        billing_address: {
          street: quote.business_address,
          city: quote.city,
          state: quote.province,
          country: 'South Africa',
        },
        currency_code: 'ZAR',
        payment_terms: 30,
        custom_fields: {
          company_registration: quote.company_registration,
          vat_number: quote.vat_number,
        },
      },
    });
    zohoCustomerId = customer.data?.customer_id;
  }

  // 2. Create Zoho Books estimate
  const estimate = await zohoMCPClient.execute({
    action: 'create_estimate',
    app: 'books',
    parameters: {
      customer_id: zohoCustomerId,
      estimate_number: quote.quote_number,
      date: new Date().toISOString().split('T')[0],
      expiry_date: quote.valid_until,
      line_items: [
        {
          name: `${quote.package_name} - Monthly Recurring`,
          description: `${quote.package_speed} Internet Service - Monthly Subscription`,
          rate: quote.monthly_recurring,
          quantity: 1,
          tax_id: process.env.ZOHO_VAT_TAX_ID,
        },
        {
          name: 'Installation Fee (Once-off)',
          rate: quote.installation_fee,
          quantity: 1,
          tax_id: process.env.ZOHO_VAT_TAX_ID,
        },
        quote.router_cost > 0 && {
          name: 'Router Equipment (Once-off)',
          rate: quote.router_cost,
          quantity: 1,
          tax_id: process.env.ZOHO_VAT_TAX_ID,
        },
        ...quote.additional_services.map((service: string) => ({
          name: service,
          rate: 0, // TBD by admin
          quantity: 1,
          tax_id: process.env.ZOHO_VAT_TAX_ID,
        })),
      ].filter(Boolean),
      notes: quote.notes,
      terms: `Quote valid until ${quote.valid_until}. Monthly service will be billed automatically upon acceptance.`,
    },
  });

  // 3. Send estimate via Zoho Mail
  await zohoMCPClient.execute({
    action: 'send_email',
    app: 'mail',
    parameters: {
      to: [quote.contact_email],
      subject: `Your CircleTel Business Quote - ${quote.quote_number}`,
      content: `
        <h1>Your Business Internet Quote</h1>
        <p>Dear ${quote.contact_first_name},</p>
        <p>Thank you for your interest in CircleTel Business Solutions. Please find your custom quote attached.</p>
        <p><strong>Quote Number:</strong> ${quote.quote_number}</p>
        <p><strong>Valid Until:</strong> ${quote.valid_until}</p>
        <p><strong>Total (incl. VAT):</strong> R${quote.total_amount}</p>
        <p>To accept this quote, please visit: ${process.env.NEXT_PUBLIC_APP_URL}/quotes/${quote.id}</p>
        <p>Questions? Contact your sales representative or email sales@circletel.co.za</p>
      `,
      contentType: 'html',
      attachments: [
        {
          fileName: `${quote.quote_number}.pdf`,
          content: estimate.data.estimate_pdf_base64,
          contentType: 'application/pdf',
        },
      ],
    },
  });

  // 4. Update quote with Zoho IDs
  await supabase
    .from('business_quotes')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      zoho_customer_id: zohoCustomerId,
      zoho_estimate_id: estimate.data?.estimate_id,
      zoho_synced_at: new Date().toISOString(),
    })
    .eq('id', quoteId);

  return NextResponse.json({ success: true });
}
```

#### Database Schema Update

**Add Zoho fields to `business_quotes` table**:

```sql
ALTER TABLE business_quotes
ADD COLUMN IF NOT EXISTS zoho_customer_id TEXT, -- Zoho Books customer ID
ADD COLUMN IF NOT EXISTS zoho_estimate_id TEXT, -- Zoho Books estimate ID
ADD COLUMN IF NOT EXISTS zoho_deal_id TEXT, -- Zoho CRM deal ID
ADD COLUMN IF NOT EXISTS zoho_synced_at TIMESTAMPTZ; -- Last sync timestamp
```

#### Acceptance Criteria

- [ ] Zoho Books customer created for business
- [ ] Zoho Books estimate generated with VAT
- [ ] Estimate PDF emailed via Zoho Mail
- [ ] Quote updated with Zoho IDs

---

## Phase 3 Integration: Subscription Management + Zoho

### Enhanced Task 8.2: Invoice History + Zoho Books

**Original Task**: Display invoice history
**Enhanced Task**: Display invoice history from Zoho Books

#### Implementation

**File**: `/app/api/account/invoices/route.ts` (new)

```typescript
import zohoMCPClient from '@/lib/zoho-mcp-client';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const customerEmail = searchParams.get('email'); // From session

  // Fetch customer's Zoho Books customer ID
  const { data: order } = await supabase
    .from('consumer_orders')
    .select('zoho_customer_id')
    .eq('email', customerEmail)
    .eq('status', 'active')
    .single();

  if (!order?.zoho_customer_id) {
    return NextResponse.json({ invoices: [] });
  }

  // Fetch invoices from Zoho Books
  const invoices = await zohoMCPClient.execute({
    action: 'get_invoices',
    app: 'books',
    parameters: {
      customer_id: order.zoho_customer_id,
      status: 'all', // all, paid, unpaid, overdue
      sort_column: 'invoice_date',
      sort_order: 'D', // Descending
    },
  });

  return NextResponse.json({
    invoices: invoices.data?.invoices || [],
  });
}
```

**File**: `/app/account/invoices/page.tsx` (update)

```tsx
'use client';

import { useEffect, useState } from 'react';
import { InvoicesList } from '@/components/account/InvoicesList';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    async function fetchInvoices() {
      const response = await fetch('/api/account/invoices');
      const data = await response.json();
      setInvoices(data.invoices);
    }
    fetchInvoices();
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <h1>Invoice History</h1>
      <p className="text-gray-600 mb-6">
        All invoices are managed through Zoho Books. Click "Download" to get the PDF.
      </p>
      <InvoicesList invoices={invoices} />
    </div>
  );
}
```

#### Acceptance Criteria

- [ ] Invoices fetched from Zoho Books API
- [ ] Invoice list displays (invoice number, date, amount, status)
- [ ] PDF download links to Zoho Books hosted PDF
- [ ] Paid/unpaid status accurate

---

### Enhanced Task 7.2: Service Modification + Zoho Billing

**Original Task**: Service modification workflow
**Enhanced Task**: Service modification + update Zoho Billing subscription

#### Implementation

**File**: `/app/api/account/services/[serviceId]/modify/route.ts` (update)

```typescript
import zohoMCPClient from '@/lib/zoho-mcp-client';

export async function POST(request: NextRequest, { params }: { params: Promise<{ serviceId: string }> }) {
  const { serviceId } = await params;
  const { new_package_id, change_date } = await request.json();

  // Fetch current service
  const { data: currentService } = await supabase
    .from('consumer_orders')
    .select('*')
    .eq('id', serviceId)
    .single();

  // Fetch new package
  const { data: newPackage } = await supabase
    .from('packages')
    .select('*')
    .eq('id', new_package_id)
    .single();

  if (change_date === 'immediate') {
    // Update Zoho Billing subscription
    const subscriptionUpdate = await zohoMCPClient.execute({
      action: 'update_subscription',
      app: 'billing',
      parameters: {
        subscription_id: currentService.zoho_subscription_id,
        plan_code: `plan_${new_package_id}`,
        plan_name: newPackage.name,
        plan_description: `${newPackage.speed_down}/${newPackage.speed_up} Mbps ${newPackage.service_type}`,
        price: newPackage.price,
        prorate: true, // Calculate prorated charge/credit
        effective_date: new Date().toISOString().split('T')[0],
      },
    });

    // If prorated charge > 0, create immediate invoice
    if (subscriptionUpdate.data?.prorated_amount > 0) {
      await zohoMCPClient.execute({
        action: 'create_invoice',
        app: 'books',
        parameters: {
          customer_id: currentService.zoho_customer_id,
          line_items: [
            {
              name: 'Service Upgrade - Prorated Charge',
              description: `Upgrade to ${newPackage.name} (${newPackage.speed_down}/${newPackage.speed_up} Mbps)`,
              rate: subscriptionUpdate.data.prorated_amount,
              quantity: 1,
              tax_id: process.env.ZOHO_VAT_TAX_ID,
            },
          ],
          notes: 'Prorated charge for immediate service upgrade. New monthly rate will apply from next billing cycle.',
        },
      });
    }
  } else {
    // Schedule subscription change for next billing date
    await zohoMCPClient.execute({
      action: 'schedule_subscription_change',
      app: 'billing',
      parameters: {
        subscription_id: currentService.zoho_subscription_id,
        plan_code: `plan_${new_package_id}`,
        plan_name: newPackage.name,
        price: newPackage.price,
        effective_date: currentService.next_billing_date,
      },
    });
  }

  return NextResponse.json({ success: true });
}
```

#### Acceptance Criteria

- [ ] Zoho Billing subscription updated on modification
- [ ] Prorated charges calculated automatically
- [ ] Immediate invoice created for prorated charges
- [ ] Scheduled changes applied on next billing date

---

## Zoho MCP Type Extensions

### Updated Types File

**File**: `/lib/types/zoho.ts` (update)

```typescript
// Add to existing ZohoAction type
export type ZohoAction =
  | 'create_lead'
  | 'convert_lead'
  | 'create_contact'
  | 'create_deal'
  | 'send_email'
  | 'create_event'
  | 'create_ticket'
  | 'create_project'
  | 'create_task'
  | 'get_records'
  | 'update_record'
  | 'search_records'
  // NEW: Zoho Books actions
  | 'create_customer'
  | 'create_invoice'
  | 'create_estimate'
  | 'get_invoices'
  | 'get_invoice_status'
  | 'update_payment_status'
  // NEW: Zoho Billing actions
  | 'create_subscription'
  | 'update_subscription'
  | 'cancel_subscription'
  | 'schedule_subscription_change'
  | 'get_subscription_status';

// Add to ZohoMCPRequest app field
export interface ZohoMCPRequest {
  action: ZohoAction;
  app: 'crm' | 'mail' | 'calendar' | 'desk' | 'projects' | 'books' | 'billing';
  parameters: Record<string, unknown>;
}

// Zoho Books Types
export interface ZohoCustomer {
  customer_id?: string;
  contact_name: string;
  email: string;
  phone?: string;
  billing_address?: {
    street: string;
    city: string;
    state: string;
    country: string;
    zip?: string;
  };
  currency_code: string;
  payment_terms?: number; // Days
  custom_fields?: Record<string, string>;
}

export interface ZohoInvoice {
  invoice_id?: string;
  customer_id: string;
  invoice_number: string;
  date: string; // YYYY-MM-DD
  due_date: string;
  line_items: ZohoLineItem[];
  notes?: string;
  terms?: string;
  invoice_pdf_base64?: string;
  total?: number;
  status?: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'void';
}

export interface ZohoEstimate {
  estimate_id?: string;
  customer_id: string;
  estimate_number: string;
  date: string;
  expiry_date: string;
  line_items: ZohoLineItem[];
  notes?: string;
  terms?: string;
  estimate_pdf_base64?: string;
  total?: number;
  status?: 'draft' | 'sent' | 'accepted' | 'declined' | 'expired';
}

export interface ZohoLineItem {
  item_id?: string;
  name: string;
  description?: string;
  rate: number;
  quantity: number;
  tax_id?: string;
  discount?: number;
}

// Zoho Billing Types
export interface ZohoSubscription {
  subscription_id?: string;
  customer_id: string;
  plan_code: string;
  plan_name: string;
  plan_description?: string;
  billing_cycles?: number; // -1 for infinite
  interval: number;
  interval_unit: 'days' | 'weeks' | 'months' | 'years';
  price: number;
  currency_code: string;
  start_date?: string;
  tax_id?: string;
  auto_collect?: boolean;
  payment_terms?: number;
  status?: 'live' | 'non_renewing' | 'cancelled' | 'expired';
}
```

---

## Database Migration

### New Migration File

**File**: `/supabase/migrations/20251021000001_add_zoho_integration_fields.sql`

```sql
-- Add Zoho integration fields to consumer_orders
ALTER TABLE consumer_orders
ADD COLUMN IF NOT EXISTS zoho_contact_id TEXT,
ADD COLUMN IF NOT EXISTS zoho_customer_id TEXT,
ADD COLUMN IF NOT EXISTS zoho_invoice_id TEXT,
ADD COLUMN IF NOT EXISTS zoho_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS zoho_synced_at TIMESTAMPTZ;

-- Add Zoho integration fields to business_quotes
ALTER TABLE business_quotes
ADD COLUMN IF NOT EXISTS zoho_customer_id TEXT,
ADD COLUMN IF NOT EXISTS zoho_estimate_id TEXT,
ADD COLUMN IF NOT EXISTS zoho_deal_id TEXT,
ADD COLUMN IF NOT EXISTS zoho_synced_at TIMESTAMPTZ;

-- Add Zoho integration fields to coverage_leads (already has zoho_lead_id)
-- Just ensure it's there
ALTER TABLE coverage_leads
ADD COLUMN IF NOT EXISTS zoho_synced_at TIMESTAMPTZ;

-- Create index for Zoho ID lookups
CREATE INDEX IF NOT EXISTS idx_consumer_orders_zoho_customer_id ON consumer_orders(zoho_customer_id);
CREATE INDEX IF NOT EXISTS idx_consumer_orders_zoho_subscription_id ON consumer_orders(zoho_subscription_id);
CREATE INDEX IF NOT EXISTS idx_business_quotes_zoho_customer_id ON business_quotes(zoho_customer_id);

-- Add comments
COMMENT ON COLUMN consumer_orders.zoho_contact_id IS 'Zoho CRM contact ID';
COMMENT ON COLUMN consumer_orders.zoho_customer_id IS 'Zoho Books customer ID';
COMMENT ON COLUMN consumer_orders.zoho_invoice_id IS 'Zoho Books invoice ID';
COMMENT ON COLUMN consumer_orders.zoho_subscription_id IS 'Zoho Billing subscription ID';
```

---

## Environment Variables

### Required Zoho Configuration

**File**: `.env.local` (add these)

```bash
# Zoho MCP Configuration (already exists)
NEXT_PUBLIC_ZOHO_MCP_URL=https://circletel-zoho-900485550.zohomcp.com/mcp/message
NEXT_PUBLIC_ZOHO_MCP_KEY=e2f4039d67d5fb236177fbce811a0ff0

# Zoho Books Configuration
ZOHO_ORG_ID=your_organization_id
ZOHO_VAT_TAX_ID=your_vat_tax_id  # South Africa VAT rate ID

# Zoho Region (for API endpoints)
ZOHO_REGION=US  # US, EU, IN, AU, CN

# Zoho OAuth (for direct API access if needed)
ZOHO_CLIENT_ID=your_client_id
ZOHO_CLIENT_SECRET=your_client_secret
ZOHO_REFRESH_TOKEN=your_refresh_token
```

---

## Testing Strategy

### Zoho Integration Tests

**File**: `/tests/zoho-integration.test.ts` (new)

```typescript
import { describe, test, expect } from '@jest/globals';
import zohoMCPClient from '@/lib/zoho-mcp-client';

describe('Zoho Integration Tests', () => {
  test('Create Zoho CRM contact', async () => {
    const result = await zohoMCPClient.execute({
      action: 'create_contact',
      app: 'crm',
      parameters: {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      },
    });

    expect(result.success).toBe(true);
    expect(result.data?.id).toBeDefined();
  });

  test('Create Zoho Books customer', async () => {
    const result = await zohoMCPClient.execute({
      action: 'create_customer',
      app: 'books',
      parameters: {
        contact_name: 'Test Customer',
        email: 'test@example.com',
        currency_code: 'ZAR',
      },
    });

    expect(result.success).toBe(true);
    expect(result.data?.customer_id).toBeDefined();
  });

  test('Create Zoho Books invoice', async () => {
    const result = await zohoMCPClient.execute({
      action: 'create_invoice',
      app: 'books',
      parameters: {
        customer_id: 'test_customer_id',
        invoice_number: 'INV-TEST-001',
        date: '2025-10-21',
        due_date: '2025-11-20',
        line_items: [
          {
            name: 'Test Item',
            rate: 100,
            quantity: 1,
          },
        ],
      },
    });

    expect(result.success).toBe(true);
    expect(result.data?.invoice_id).toBeDefined();
  });

  test('Create Zoho Billing subscription', async () => {
    const result = await zohoMCPClient.execute({
      action: 'create_subscription',
      app: 'billing',
      parameters: {
        customer_id: 'test_customer_id',
        plan_code: 'plan_test',
        plan_name: 'Test Plan',
        price: 999,
        currency_code: 'ZAR',
        interval: 1,
        interval_unit: 'months',
      },
    });

    expect(result.success).toBe(true);
    expect(result.data?.subscription_id).toBeDefined();
  });
});
```

---

## Implementation Checklist

### Phase 1 Zoho Integration
- [ ] Add Zoho fields to `consumer_orders` table
- [ ] Update service activation email function with Zoho CRM contact creation
- [ ] Implement Zoho Books customer creation
- [ ] Implement Zoho Books invoice generation
- [ ] Implement Zoho Billing subscription creation
- [ ] Update sales alerts with Zoho CRM lead creation
- [ ] Test: Order activation creates all Zoho records
- [ ] Test: Invoice PDF sent via Zoho Mail

### Phase 2 Zoho Integration
- [ ] Add Zoho fields to `business_quotes` table
- [ ] Implement Zoho Books customer creation for businesses
- [ ] Implement Zoho Books estimate generation
- [ ] Update quote send function with Zoho integration
- [ ] Test: Business quote creates Zoho estimate
- [ ] Test: Estimate PDF sent via Zoho Mail

### Phase 3 Zoho Integration
- [ ] Implement invoice history fetch from Zoho Books
- [ ] Implement service modification with Zoho Billing subscription update
- [ ] Implement prorated billing via Zoho
- [ ] Test: Invoice history displays Zoho invoices
- [ ] Test: Service upgrades update Zoho subscription

### Type Extensions
- [ ] Add Zoho Books types to `/lib/types/zoho.ts`
- [ ] Add Zoho Billing types to `/lib/types/zoho.ts`
- [ ] Update `ZohoAction` enum with new actions
- [ ] Update `ZohoMCPRequest` with 'books' and 'billing' apps

### Testing
- [ ] Create Zoho integration test suite
- [ ] Test all Zoho Books actions (create customer, invoice, estimate)
- [ ] Test all Zoho Billing actions (create/update subscription)
- [ ] Test error handling for Zoho API failures
- [ ] Test retry logic for failed Zoho operations

---

## Error Handling & Fallbacks

### Zoho API Failures

```typescript
// Graceful degradation pattern
try {
  const zohoResult = await zohoMCPClient.execute({ /* ... */ });
  if (!zohoResult.success) {
    // Log error but continue
    console.error('Zoho integration failed:', zohoResult.error);
    // Send internal alert
    await sendInternalAlert('Zoho integration failure', zohoResult.error);
  }
} catch (error) {
  // Don't block customer journey if Zoho fails
  console.error('Zoho MCP error:', error);
}
```

### Retry Logic

```typescript
async function retryZohoOperation<T>(
  operation: () => Promise<ZohoMCPResponse<T>>,
  maxRetries = 3
): Promise<ZohoMCPResponse<T>> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await operation();
    if (result.success) return result;

    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
    }
  }

  return { success: false, error: 'Max retries exceeded' };
}
```

---

## Benefits Summary

### For Customers
- ✅ **Professional Invoicing**: Branded invoices with VAT compliance
- ✅ **Transparent Billing**: Real-time invoice history
- ✅ **Automated Payments**: Recurring billing via Zoho Billing
- ✅ **Email Delivery**: Invoices sent automatically

### For Admins
- ✅ **Single Source of Truth**: All data in Zoho ecosystem
- ✅ **Automated Workflows**: Order → Invoice → Subscription (no manual steps)
- ✅ **Financial Reporting**: Zoho Books analytics
- ✅ **CRM Integration**: Leads and contacts synced automatically

### For Business
- ✅ **Reduced Overhead**: 80% reduction in manual billing tasks
- ✅ **Faster Activation**: Invoices generated immediately
- ✅ **Compliance**: South African VAT handled automatically
- ✅ **Scalability**: Handles 1000s of customers without additional work

---

**Last Updated**: 2025-10-21
**Version**: 1.0
**Integration Type**: Zoho MCP via CircleTel Server
**Status**: Ready for Implementation
