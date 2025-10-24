# Phase 2: B2B Journey - Days 6-10
## Business Landing Page, Quote System, Admin Tools

> **Goal**: Enable business customer journey and quote generation workflow
> **Duration**: 5 working days
> **Priority**: P1 - High (Revenue Expansion)
> **Dependencies**: Phase 1 complete

---

## Overview

Phase 2 creates a separate B2B customer journey for SMME and Enterprise customers, distinguishing them from consumer (B2C) customers. Currently, business customers are forced into the consumer order flow, which is inappropriate for B2B sales.

### What Phase 2 Delivers

- ✅ Dedicated business landing page with B2B messaging
- ✅ Quote request form for SMME customers
- ✅ Admin quote builder with PDF export
- ✅ Customer quote view and acceptance workflow
- ✅ Business customer dashboard (multi-service management)

### Success Criteria

- [ ] Business landing page live at `/business`
- [ ] Quote request creates record in `business_quotes` table
- [ ] Admin can build and send quotes with PDF attachment
- [ ] Customer can accept quote, converting to order
- [ ] Business dashboard shows all company quotes and orders

---

## Day 6-7: Business Landing Page & Quote Request

### Task 4.1: Business Landing Page (6 hours)

**File**: `/app/business/page.tsx` (new)

**Description**: Dedicated landing page for SMME and Enterprise customers with B2B messaging, value proposition, and "Request Quote" CTA.

#### Implementation Details

**Page Structure**:

```tsx
// /app/business/page.tsx
import { BusinessHero } from '@/components/business/BusinessHero';
import { BusinessPackages } from '@/components/business/BusinessPackages';
import { BusinessValueProps } from '@/components/business/BusinessValueProps';
import { BusinessCTA } from '@/components/business/BusinessCTA';

export default function BusinessPage() {
  return (
    <div>
      <BusinessHero />
      <BusinessValueProps />
      <BusinessPackages />
      <BusinessCTA />
    </div>
  );
}
```

**Components**:

1. **BusinessHero**:
   - Headline: "Enterprise-Grade Connectivity for Growing Businesses"
   - Subheadline: "Reliable, scalable internet solutions with dedicated support"
   - CTA: "Get a Custom Quote" (links to `/business/quote`)
   - Coverage checker (same as consumer, but captures business details)

2. **BusinessValueProps**:
   - SLA Guarantees (99.9% uptime)
   - Dedicated Support (account manager, priority queue)
   - Scalability (easy upgrades, multi-location support)
   - Cost Savings (bundle discounts, ROI calculator)
   - Business Features (static IP, VPN, VOIP integration)

3. **BusinessPackages**:
   - Filter: `customer_type = 'smme' OR customer_type = 'enterprise'`
   - Display: BizFibreConnect packages only
   - Pricing: Show monthly + installation fees upfront
   - CTA: "Request Quote" (not "Order Now")
   - Features: Emphasize business benefits (SLA, support, static IP)

4. **BusinessCTA**:
   - "Ready to upgrade your business connectivity?"
   - "Speak to a connectivity specialist"
   - Phone: +27 11 123 4567
   - Form: "Request a Callback"

**Key Differences from Consumer Page**:

| Consumer | Business |
|----------|----------|
| "Get Connected" | "Enterprise-Grade Connectivity" |
| Focus on price | Focus on value, reliability, ROI |
| "Order Now" | "Request Quote" |
| Simple packages | Customizable solutions |
| Self-service | Sales-assisted |

**SEO & Marketing**:
- Meta title: "Business Internet Solutions | CircleTel"
- Meta description: "Reliable fibre and wireless connectivity for SMEs and enterprises. 99.9% uptime, dedicated support, scalable solutions."
- Keywords: business internet, enterprise connectivity, SMME fibre, corporate internet

**Acceptance Criteria**:
- [ ] Business landing page displays at `/business`
- [ ] Only SMME/Enterprise packages shown
- [ ] Coverage checker captures business details (company name, size)
- [ ] "Request Quote" CTA links to `/business/quote`
- [ ] Value propositions emphasize business benefits
- [ ] Mobile responsive
- [ ] Page loads in < 2 seconds

---

### Task 4.2: Quote Request Form (6 hours)

**File**: `/app/business/quote/page.tsx` (new)

**Description**: Multi-step form for businesses to request a custom quote, capturing company details, service requirements, and contact information.

#### Implementation Details

**Form Structure** (3 Steps):

```tsx
// /app/business/quote/page.tsx
'use client';

import { useState } from 'react';
import { QuoteStep1Company } from '@/components/business/quote/QuoteStep1Company';
import { QuoteStep2Services } from '@/components/business/quote/QuoteStep2Services';
import { QuoteStep3Contact } from '@/components/business/quote/QuoteStep3Contact';

export default function BusinessQuotePage() {
  const [step, setStep] = useState(1);
  const [quoteData, setQuoteData] = useState<Partial<BusinessQuote>>({});

  const handleSubmit = async () => {
    const response = await fetch('/api/business/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quoteData),
    });

    if (response.ok) {
      const { quoteId } = await response.json();
      router.push(`/business/quote/submitted?id=${quoteId}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1>Request a Business Quote</h1>
        <div className="flex items-center gap-2 mt-4">
          <div className={step >= 1 ? 'text-circleTel-orange' : 'text-gray-400'}>1. Company Details</div>
          <div className={step >= 2 ? 'text-circleTel-orange' : 'text-gray-400'}>2. Service Requirements</div>
          <div className={step >= 3 ? 'text-circleTel-orange' : 'text-gray-400'}>3. Contact Information</div>
        </div>
      </div>

      {step === 1 && <QuoteStep1Company data={quoteData} onNext={(data) => { setQuoteData(data); setStep(2); }} />}
      {step === 2 && <QuoteStep2Services data={quoteData} onNext={(data) => { setQuoteData(data); setStep(3); }} onBack={() => setStep(1)} />}
      {step === 3 && <QuoteStep3Contact data={quoteData} onSubmit={handleSubmit} onBack={() => setStep(2)} />}
    </div>
  );
}
```

**Step 1: Company Details** (`QuoteStep1Company.tsx`):
- Company name (required)
- Company registration number (optional)
- VAT number (optional)
- Industry (dropdown: Technology, Finance, Retail, Healthcare, Other)
- Company size (dropdown: 1-10, 11-50, 51-200, 201-500, 500+)
- Number of locations (single vs. multi-site)
- Business address (Google Places autocomplete)

**Step 2: Service Requirements** (`QuoteStep2Services.tsx`):
- Primary service needed:
  - Internet connectivity (Fibre, Wireless, 5G)
  - VOIP/Telephony
  - IT Support/Managed Services
  - Microsoft 365
  - Cloud Backup
  - Multiple services
- Desired internet speed (10Mbps, 50Mbps, 100Mbps, 200Mbps, 500Mbps, 1Gbps)
- Number of connections (how many sites need connectivity)
- Additional services (checkboxes):
  - Static IP address
  - VPN setup
  - Network security
  - WiFi installation
  - Email hosting
- Budget range (R500-R1000, R1000-R2500, R2500-R5000, R5000+)
- Preferred installation date

**Step 3: Contact Information** (`QuoteStep3Contact.tsx`):
- Contact person first name (required)
- Contact person last name (required)
- Job title (optional)
- Email (required)
- Phone (required)
- Preferred contact method (Email, Phone, WhatsApp)
- Best time to contact (Morning, Afternoon, Anytime)
- Additional notes/requirements (textarea)

**API Route**: `/app/api/business/quotes/route.ts` (new)

```typescript
// /app/api/business/quotes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SalesAlertService } from '@/lib/notifications/sales-alerts';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json();

  // Insert business quote
  const { data: quote, error } = await supabase
    .from('business_quotes')
    .insert({
      company_name: body.companyName,
      company_registration: body.companyRegistration,
      vat_number: body.vatNumber,
      industry: body.industry,
      company_size: body.companySize,
      number_of_locations: body.numberOfLocations,
      business_address: body.businessAddress,

      contact_first_name: body.contactFirstName,
      contact_last_name: body.contactLastName,
      contact_job_title: body.contactJobTitle,
      contact_email: body.contactEmail,
      contact_phone: body.contactPhone,
      contact_preference: body.contactPreference,

      requested_service_types: body.requestedServices, // JSONB array
      requested_speed: body.desiredSpeed,
      number_of_connections: body.numberOfConnections,
      additional_services: body.additionalServices, // JSONB array
      budget_range: body.budgetRange,
      preferred_installation_date: body.preferredDate,
      notes: body.additionalNotes,

      status: 'draft',
      lead_source: body.leadSource || 'website_form',
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Send alert to sales team
  await SalesAlertService.sendBusinessQuoteAlert(quote);

  return NextResponse.json({ quoteId: quote.id, quoteNumber: quote.quote_number });
}
```

**Quote Submission Success Page**: `/app/business/quote/submitted/page.tsx`

```tsx
// /app/business/quote/submitted/page.tsx
export default function QuoteSubmittedPage() {
  return (
    <div className="text-center py-12">
      <CheckCircle className="w-16 h-16 mx-auto text-green-600 mb-4" />
      <h1>Quote Request Received!</h1>
      <p>Thank you for your interest in CircleTel Business Solutions.</p>
      <p>Our sales team will review your requirements and send a custom quote within 24 hours.</p>
      <p>Quote Reference: <strong>{quoteNumber}</strong></p>
      <div className="mt-8">
        <p>Questions? Contact us:</p>
        <p>Email: sales@circletel.co.za</p>
        <p>Phone: +27 11 123 4567</p>
      </div>
    </div>
  );
}
```

**Acceptance Criteria**:
- [ ] Quote form displays at `/business/quote`
- [ ] 3-step wizard with progress indicator
- [ ] All required fields validated
- [ ] Form submission creates `business_quotes` record
- [ ] Sales team receives email alert
- [ ] Success page displays with quote reference number
- [ ] Mobile responsive
- [ ] Form data persists across steps (localStorage)

---

## Day 8-9: Quote Generation & PDF Export

### Task 5.1: Admin Quote Builder (8 hours)

**File**: `/app/admin/quotes/[quoteId]/edit/page.tsx` (new)

**Description**: Admin interface to build custom quotes with pricing, line items, and PDF generation.

#### Implementation Details

**Page Structure**:

```tsx
// /app/admin/quotes/[quoteId]/edit/page.tsx
import { QuoteEditor } from '@/components/admin/quotes/QuoteEditor';
import { QuotePreview } from '@/components/admin/quotes/QuotePreview';

export default async function QuoteEditPage({ params }: { params: Promise<{ quoteId: string }> }) {
  const { quoteId } = await params;

  // Fetch quote from business_quotes table
  const quote = await fetchQuote(quoteId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <h1>Edit Quote: {quote.quote_number}</h1>
        <QuoteEditor quote={quote} />
      </div>
      <div>
        <QuotePreview quote={quote} />
      </div>
    </div>
  );
}
```

**QuoteEditor Component** (`/components/admin/quotes/QuoteEditor.tsx`):

```tsx
// /components/admin/quotes/QuoteEditor.tsx
'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';

export function QuoteEditor({ quote }: { quote: BusinessQuote }) {
  const [quoteData, setQuoteData] = useState(quote);

  const handleSave = async () => {
    await fetch(`/api/admin/quotes/${quote.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quoteData),
    });
  };

  const handleSendQuote = async () => {
    await fetch(`/api/admin/quotes/${quote.id}/send`, {
      method: 'POST',
    });
  };

  return (
    <div className="space-y-6">
      {/* Package Selection */}
      <div>
        <label>Primary Package</label>
        <Select
          value={quoteData.package_name}
          onValueChange={(v) => setQuoteData({ ...quoteData, package_name: v })}
        >
          {packages.map((pkg) => (
            <option key={pkg.id} value={pkg.name}>{pkg.name}</option>
          ))}
        </Select>
      </div>

      {/* Pricing Fields */}
      <div>
        <label>Monthly Recurring (excl. VAT)</label>
        <Input
          type="number"
          value={quoteData.monthly_recurring}
          onChange={(e) => setQuoteData({ ...quoteData, monthly_recurring: parseFloat(e.target.value) })}
        />
      </div>

      <div>
        <label>Installation Fee (excl. VAT)</label>
        <Input
          type="number"
          value={quoteData.installation_fee}
          onChange={(e) => setQuoteData({ ...quoteData, installation_fee: parseFloat(e.target.value) })}
        />
      </div>

      <div>
        <label>Router Cost (excl. VAT)</label>
        <Input
          type="number"
          value={quoteData.router_cost}
          onChange={(e) => setQuoteData({ ...quoteData, router_cost: parseFloat(e.target.value) })}
        />
      </div>

      <div>
        <label>Discount (%)</label>
        <Input
          type="number"
          value={quoteData.discount_percentage || 0}
          onChange={(e) => setQuoteData({ ...quoteData, discount_percentage: parseFloat(e.target.value) })}
        />
      </div>

      {/* Auto-calculated Totals */}
      <div className="border-t pt-4">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>R{quoteData.subtotal}</span>
        </div>
        <div className="flex justify-between">
          <span>VAT (15%):</span>
          <span>R{quoteData.vat_amount}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>Total:</span>
          <span>R{quoteData.total_amount}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={handleSave}>Save Quote</Button>
        <Button onClick={handleSendQuote} variant="default">Send Quote to Customer</Button>
      </div>
    </div>
  );
}
```

**Quote Preview Component** (PDF preview):

```tsx
// /components/admin/quotes/QuotePreview.tsx
import { PDFViewer, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

export function QuotePreview({ quote }: { quote: BusinessQuote }) {
  return (
    <PDFViewer style={{ width: '100%', height: '100vh' }}>
      <QuotePDF quote={quote} />
    </PDFViewer>
  );
}

// PDF Document
function QuotePDF({ quote }: { quote: BusinessQuote }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>CircleTel</Text>
          <Text style={styles.title}>Business Quote</Text>
        </View>

        {/* Quote Details */}
        <View style={styles.section}>
          <Text>Quote Number: {quote.quote_number}</Text>
          <Text>Date: {new Date().toLocaleDateString()}</Text>
          <Text>Valid Until: {new Date(quote.valid_until).toLocaleDateString()}</Text>
        </View>

        {/* Customer Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Details</Text>
          <Text>{quote.company_name}</Text>
          <Text>{quote.business_address}</Text>
          <Text>{quote.contact_email}</Text>
        </View>

        {/* Line Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services</Text>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <Text style={styles.tableHeader}>Description</Text>
              <Text style={styles.tableHeader}>Amount</Text>
            </View>
            <View style={styles.tableRow}>
              <Text>{quote.package_name} - Monthly Recurring</Text>
              <Text>R{quote.monthly_recurring}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text>Installation Fee (Once-off)</Text>
              <Text>R{quote.installation_fee}</Text>
            </View>
            {quote.router_cost > 0 && (
              <View style={styles.tableRow}>
                <Text>Router (Once-off)</Text>
                <Text>R{quote.router_cost}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text>Subtotal:</Text>
            <Text>R{quote.subtotal}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>VAT (15%):</Text>
            <Text>R{quote.vat_amount}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text>Total:</Text>
            <Text>R{quote.total_amount}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Thank you for choosing CircleTel Business Solutions.</Text>
          <Text>Questions? Contact: sales@circletel.co.za | +27 11 123 4567</Text>
        </View>
      </Page>
    </Document>
  );
}

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 12, fontFamily: 'Helvetica' },
  header: { marginBottom: 20, borderBottom: '2pt solid #F5831F' },
  logo: { fontSize: 24, color: '#F5831F', fontWeight: 'bold' },
  title: { fontSize: 18, marginTop: 10 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
  table: { borderTop: '1pt solid #ccc' },
  tableRow: { flexDirection: 'row', borderBottom: '1pt solid #ccc', padding: 5 },
  tableHeader: { fontWeight: 'bold', width: '50%' },
  totals: { marginTop: 20, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', gap: 20, marginBottom: 5 },
  grandTotal: { fontSize: 14, fontWeight: 'bold', borderTop: '2pt solid #000', paddingTop: 5 },
  footer: { marginTop: 40, fontSize: 10, textAlign: 'center', color: '#666' },
});
```

**Send Quote API**: `/app/api/admin/quotes/[quoteId]/send/route.ts`

```typescript
// /app/api/admin/quotes/[quoteId]/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { EmailNotificationService } from '@/lib/notifications/notification-service';
import { renderToBuffer } from '@react-pdf/renderer';
import { QuotePDF } from '@/components/admin/quotes/QuotePreview';

export async function POST(request: NextRequest, { params }: { params: Promise<{ quoteId: string }> }) {
  const { quoteId } = await params;
  const supabase = await createClient();

  // Fetch quote
  const { data: quote } = await supabase
    .from('business_quotes')
    .select('*')
    .eq('id', quoteId)
    .single();

  // Generate PDF
  const pdfBuffer = await renderToBuffer(<QuotePDF quote={quote} />);

  // Send email with PDF attachment
  await EmailNotificationService.send({
    to: quote.contact_email,
    subject: `Your CircleTel Business Quote - ${quote.quote_number}`,
    template: 'quote_sent',
    data: quote,
    attachments: [{
      filename: `CircleTel-Quote-${quote.quote_number}.pdf`,
      content: pdfBuffer,
    }],
  });

  // Update quote status
  await supabase
    .from('business_quotes')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
    })
    .eq('id', quoteId);

  return NextResponse.json({ success: true });
}
```

**Acceptance Criteria**:
- [ ] Admin can edit quote pricing and line items
- [ ] Auto-calculated totals (subtotal, VAT, total) update in real-time
- [ ] PDF preview renders correctly
- [ ] Quote PDF includes CircleTel branding
- [ ] "Send Quote" sends email with PDF attachment
- [ ] Quote status updates to `sent` after sending
- [ ] Quote marked with `sent_at` timestamp

---

### Task 5.2: Customer Quote View (4 hours)

**File**: `/app/quotes/[quoteId]/page.tsx` (new)

**Description**: Customer-facing page to view quote details, accept/reject quote.

#### Implementation Details

```tsx
// /app/quotes/[quoteId]/page.tsx
import { Button } from '@/components/ui/button';
import { QuoteSummary } from '@/components/quotes/QuoteSummary';
import { AcceptQuoteButton } from '@/components/quotes/AcceptQuoteButton';

export default async function QuoteViewPage({ params }: { params: Promise<{ quoteId: string }> }) {
  const { quoteId } = await params;
  const quote = await fetchQuote(quoteId);

  return (
    <div className="max-w-4xl mx-auto py-12">
      <h1>Your CircleTel Business Quote</h1>
      <p>Quote Number: {quote.quote_number}</p>
      <p>Valid Until: {new Date(quote.valid_until).toLocaleDateString()}</p>

      <QuoteSummary quote={quote} />

      {quote.status === 'sent' && (
        <div className="mt-8 flex gap-4">
          <AcceptQuoteButton quoteId={quote.id} />
          <Button variant="outline" onClick={() => rejectQuote(quote.id)}>
            Decline Quote
          </Button>
          <Button variant="ghost" onClick={() => downloadQuotePDF(quote.id)}>
            Download PDF
          </Button>
        </div>
      )}

      {quote.status === 'accepted' && (
        <div className="bg-green-100 p-4 rounded">
          <p>✅ Quote Accepted! Our team will contact you to finalize your order.</p>
        </div>
      )}
    </div>
  );
}
```

**Accept Quote API**: `/app/api/quotes/[quoteId]/accept/route.ts`

```typescript
export async function POST(request: NextRequest, { params }: { params: Promise<{ quoteId: string }> }) {
  const { quoteId } = await params;
  const supabase = await createClient();

  // Update quote status to 'accepted'
  await supabase
    .from('business_quotes')
    .update({
      status: 'accepted',
      accepted_at: new Date().toISOString(),
    })
    .eq('id', quoteId);

  // Notify sales team
  await SalesAlertService.sendQuoteAcceptedAlert(quoteId);

  // TODO: Convert quote to order (Phase 3)

  return NextResponse.json({ success: true });
}
```

**Acceptance Criteria**:
- [ ] Customer can view quote details at `/quotes/[quoteId]`
- [ ] Quote summary displays all line items and totals
- [ ] "Accept Quote" button updates status to `accepted`
- [ ] "Decline Quote" button updates status to `rejected`
- [ ] "Download PDF" button downloads quote PDF
- [ ] Sales team notified when quote accepted
- [ ] Accepted quote displays confirmation message

---

## Day 10: Business Dashboard

### Task 6.1: Business Customer Dashboard (8 hours)

**File**: `/app/account/business/page.tsx` (new)

**Description**: Dashboard for business customers to view all quotes, orders, and services.

#### Implementation Details

```tsx
// /app/account/business/page.tsx
import { QuotesList } from '@/components/account/business/QuotesList';
import { OrdersList } from '@/components/account/business/OrdersList';
import { ServicesList } from '@/components/account/business/ServicesList';

export default async function BusinessDashboardPage() {
  // Fetch all quotes and orders for company

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <h1>Business Dashboard</h1>

        <section className="mt-6">
          <h2>Active Quotes</h2>
          <QuotesList quotes={quotes} />
        </section>

        <section className="mt-6">
          <h2>Orders</h2>
          <OrdersList orders={orders} />
        </section>

        <section className="mt-6">
          <h2>Active Services</h2>
          <ServicesList services={services} />
        </section>
      </div>

      <div>
        <div className="sticky top-4">
          <h3>Account Manager</h3>
          <p>Name: {accountManager.name}</p>
          <p>Email: {accountManager.email}</p>
          <p>Phone: {accountManager.phone}</p>

          <Button className="mt-4">Request Quote</Button>
          <Button variant="outline" className="mt-2">Contact Support</Button>
        </div>
      </div>
    </div>
  );
}
```

**Features**:
- Active quotes list (status: sent, accepted)
- Orders list (all orders for company)
- Active services list (multiple locations supported)
- Account manager contact info
- Quick actions (Request Quote, Contact Support)

**Acceptance Criteria**:
- [ ] Business dashboard displays at `/account/business`
- [ ] Shows all quotes for company
- [ ] Shows all orders for company
- [ ] Shows active services across all locations
- [ ] Account manager contact info displayed
- [ ] Mobile responsive

---

## Phase 2 Completion Checklist

### Business Landing Page (Task 4.1)
- [ ] `/app/business/page.tsx` created
- [ ] Business value propositions displayed
- [ ] Only SMME/Enterprise packages shown
- [ ] "Request Quote" CTA functional
- [ ] Coverage checker captures business details
- [ ] Mobile responsive

### Quote Request Form (Task 4.2)
- [ ] `/app/business/quote/page.tsx` created
- [ ] 3-step wizard functional
- [ ] All fields validated
- [ ] Quote record created in database
- [ ] Sales team receives alert
- [ ] Success page displays

### Admin Quote Builder (Task 5.1)
- [ ] `/app/admin/quotes/[quoteId]/edit/page.tsx` created
- [ ] Pricing fields functional
- [ ] Auto-calculated totals work
- [ ] PDF preview renders
- [ ] Quote PDF sends via email
- [ ] Quote status updates

### Customer Quote View (Task 5.2)
- [ ] `/app/quotes/[quoteId]/page.tsx` created
- [ ] Quote details display
- [ ] Accept/reject buttons functional
- [ ] PDF download works
- [ ] Sales team notified on acceptance

### Business Dashboard (Task 6.1)
- [ ] `/app/account/business/page.tsx` created
- [ ] Quotes list displays
- [ ] Orders list displays
- [ ] Services list displays
- [ ] Account manager info shown

---

## Next Steps

After completing Phase 2:

1. **Test B2B journey** - Full flow from landing to quote acceptance
2. **Train sales team** - Demo quote builder and workflow
3. **Update marketing** - Promote business solutions page
4. **Begin Phase 3** - Subscription management and billing

See `PHASE_3_SUBSCRIPTION_MGMT.md` for next steps.

---

**Last Updated**: 2025-10-21
**Duration**: 5 days
**Dependencies**: Phase 1 complete
**Blocks**: B2B revenue growth
