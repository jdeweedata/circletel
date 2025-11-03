# Specification: B2B Quote-to-Contract Workflow with KYC Compliance

## 1. Executive Summary

### Goal

Create a complete automation system from B2B quote generation through service activation with integrated FICA-compliant KYC verification and RICA pairing. This system eliminates manual processes, reduces onboarding time by 86% (7 days to <1 day), and achieves 100% regulatory compliance with zero cost for KYC verification.

### Success Criteria

**Business Metrics (30 days post-launch)**:
- Quote-to-contract conversion: >55% (up from 40% baseline)
- Contract-to-activation time: <1 day (down from 10 days)
- KYC completion rate: >90%
- RICA submission accuracy: >95% (first-time approval)
- Payment collection rate: >95%
- ZOHO sync success rate: >98%

**Technical Metrics**:
- KYC verification time: <3 minutes (SME), <2 minutes (consumer)
- Contract generation: <2 seconds after KYC approval
- RICA paired submission: <5 seconds
- API uptime: 99.9%
- Zero FICA/RICA compliance violations

**Cost Savings**:
- KYC verification: R0 (Didit free tier vs manual screening)
- Manual processing reduction: 80%
- Fraud reduction: 80% via liveness detection
- RICA data entry time: -90% (auto-populated)

---

## 2. User Stories

### Primary Stories

**US-1: Frictionless KYC for SME Customers** (13 pts)
- After accepting quote, customer completes ID/company verification in <3 minutes
- System auto-determines light vs full KYC based on quote value (<R500k = light)
- AI extracts data from ID, company registration (CK1), proof of address
- Low-risk customers (liveness >80%, no AML flags) auto-approved → contract generated
- High-risk customers escalated to admin review queue

**US-2: Automated Contract Generation** (8 pts)
- KYC-approved quotes auto-generate contracts with digital signatures (ZOHO Sign)
- Contract includes "KYC Verified by Didit" badge with verification date
- Customer and CircleTel authorized signatory sign digitally
- Contract status tracked: draft → pending_signature → fully_signed
- ZOHO CRM synced with KYC status fields

**US-3: RICA Auto-Submission Using KYC Data** (13 pts)
- Installation complete triggers RICA submission using Didit-extracted data
- Zero manual data entry (ICCID + KYC data auto-populated)
- RICA approval triggers service activation within 1 hour
- Full audit trail: KYC → Contract → Installation → RICA → Activation

**US-4: Real-Time ZOHO CRM Sync** (8 pts)
- Quote, KYC, contract, RICA data sync to ZOHO CRM in <5 seconds
- Custom fields: KYC_Status, KYC_Verified_Date, Risk_Tier, RICA_Status
- Bidirectional sync for deal stage updates
- Manual "Force Sync" button for admins

**US-5: Admin Compliance Queue** (5 pts)
- Dedicated queue for high-risk or declined KYC sessions
- Detail panel with extracted data, Didit response, risk breakdown
- Actions: Approve, Request More Info, Decline
- SLA tracking with escalation for >5 day pending reviews

### Technical Stories

**TS-1: Didit Webhook Handling** (5 pts)
- HMAC-SHA256 signature verification
- Event routing: verification.completed, verification.failed, session.abandoned
- Idempotency enforcement via payload comparison
- Automatic retry for failed DB operations (3 attempts, 5s delay)

**TS-2: Database Migrations** (3 pts)
- Create kyc_sessions, rica_submissions tables
- Foreign keys with CASCADE delete
- RLS policies: customers SELECT own, admins ALL operations
- Indexes on didit_session_id, quote_id, icasa_tracking_id

---

## 3. System Architecture

### 7-Stage Workflow

```
Stage 1: Quote Generation & Coverage Check
  ↓ Agent creates quote → Manager approves → Quote sent to customer

Stage 2: Light KYC Verification (Didit)
  ↓ Customer accepts quote → KYC session created → Didit verification (<3 min)

Stage 3: Contract Generation & Digital Signature
  ↓ KYC approved → Contract auto-generated → ZOHO Sign → Customer signs

Stage 4: Invoice Generation & Payment
  ↓ Contract signed → Invoice created → NetCash payment → Payment confirmed

Stage 5: Order Fulfillment & Installation
  ↓ Payment received → Order created → Installation scheduled → Technician completes

Stage 6: RICA Paired Submission & Activation
  ↓ Installation complete → RICA auto-submitted (Didit data) → RICA approved → Service activated

Stage 7: Recurring Billing & Lifecycle
  ↓ Monthly invoices → Auto-payment (debit order) → Service renewal
```

### Integration Architecture

**Core Integrations**:
1. **Didit KYC API**: FICA verification, document extraction, liveness detection
2. **ZOHO CRM**: Sales pipeline, deal tracking, KYC status sync
3. **ZOHO Sign**: Digital contract signatures (ECT Act 2002 compliant)
4. **NetCash Pay Now**: Multi-method payment processing
5. **RICA System**: Auto-submission using Didit data
6. **Resend**: Transactional emails with React Email templates
7. **Supabase**: Database, auth, storage, RLS

**Data Flow**:
```
Quote Approval → Didit Session Created
  ↓
Didit Webhook → KYC Data Extracted → Risk Scored
  ↓
Low Risk → Contract Generated → ZOHO Sign
  ↓
Contract Signed → ZOHO CRM Updated → Invoice Created
  ↓
Payment Confirmed → Order Created → Installation Scheduled
  ↓
Installation Complete → RICA Submitted (Didit Data)
  ↓
RICA Approved → Service Activated → Welcome Email
```

---

## 4. Database Schema

### Core Tables

**kyc_sessions**
```sql
CREATE TABLE kyc_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID REFERENCES business_quotes(id) ON DELETE CASCADE,
  didit_session_id TEXT UNIQUE NOT NULL,

  -- Flow Configuration
  flow_type TEXT CHECK (flow_type IN ('sme_light', 'consumer_light', 'full_kyc')) DEFAULT 'sme_light',
  user_type TEXT CHECK (user_type IN ('business', 'consumer')),

  -- Session Status
  status TEXT CHECK (status IN ('not_started', 'in_progress', 'completed', 'abandoned', 'declined')) DEFAULT 'not_started',

  -- Extracted Data (Didit Response - JSONB)
  extracted_data JSONB, -- { id_number, company_reg, directors: [], proof_of_address, liveness_score }
  verification_result TEXT CHECK (verification_result IN ('approved', 'declined', 'pending_review')),
  risk_tier TEXT CHECK (risk_tier IN ('low', 'medium', 'high')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  webhook_received_at TIMESTAMPTZ,
  raw_webhook_payload JSONB
);

CREATE INDEX idx_kyc_didit_session ON kyc_sessions(didit_session_id);
CREATE INDEX idx_kyc_quote ON kyc_sessions(quote_id);
```

**contracts**
```sql
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_number TEXT UNIQUE NOT NULL, -- CT-YYYY-NNN
  quote_id UUID REFERENCES business_quotes(id) ON DELETE RESTRICT,
  customer_id UUID REFERENCES customers(id),
  kyc_session_id UUID REFERENCES kyc_sessions(id), -- Link to KYC

  -- Contract Details
  contract_type TEXT CHECK (contract_type IN ('fibre', 'wireless', 'hybrid')),
  contract_term_months INTEGER CHECK (contract_term_months IN (12, 24, 36)),
  start_date DATE,
  end_date DATE,

  -- Pricing
  monthly_recurring DECIMAL(10,2) NOT NULL,
  once_off_fee DECIMAL(10,2) DEFAULT 0,
  installation_fee DECIMAL(10,2) DEFAULT 0,
  total_contract_value DECIMAL(10,2) NOT NULL,

  -- Digital Signature (ZOHO Sign)
  zoho_sign_request_id TEXT UNIQUE,
  customer_signature_date TIMESTAMPTZ,
  circletel_signature_date TIMESTAMPTZ,
  fully_signed_date TIMESTAMPTZ,
  signed_pdf_url TEXT,

  -- Status
  status TEXT CHECK (status IN ('draft', 'pending_signature', 'partially_signed', 'fully_signed', 'active', 'expired', 'terminated')) DEFAULT 'draft',

  -- ZOHO CRM Integration
  zoho_deal_id TEXT UNIQUE,
  last_synced_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**rica_submissions**
```sql
CREATE TABLE rica_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kyc_session_id UUID REFERENCES kyc_sessions(id),
  order_id UUID REFERENCES consumer_orders(id),

  -- RICA Details
  iccid TEXT[], -- SIM card IDs
  submitted_data JSONB, -- Didit-extracted + service details
  icasa_tracking_id TEXT,

  -- Status
  status TEXT CHECK (status IN ('pending', 'submitted', 'approved', 'rejected')) DEFAULT 'pending',
  icasa_response JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ
);

CREATE INDEX idx_rica_tracking ON rica_submissions(icasa_tracking_id);
```

**invoices**
```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT UNIQUE NOT NULL, -- INV-YYYY-NNN
  contract_id UUID REFERENCES contracts(id) ON DELETE RESTRICT,
  customer_id UUID REFERENCES customers(id),

  invoice_type TEXT CHECK (invoice_type IN ('installation', 'recurring', 'once_off')) DEFAULT 'installation',
  billing_cycle_id UUID REFERENCES billing_cycles(id),

  -- Line Items (JSONB)
  items JSONB NOT NULL, -- [{ description, quantity, unit_price, total }]

  -- Totals
  subtotal DECIMAL(10,2) NOT NULL,
  vat_rate DECIMAL(5,2) DEFAULT 15.00,
  vat_amount DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,

  -- Payment Status
  status TEXT CHECK (status IN ('draft', 'sent', 'unpaid', 'partial', 'paid', 'overdue', 'cancelled')) DEFAULT 'draft',
  payment_method TEXT CHECK (payment_method IN ('eft', 'card', 'debit_order', 'cash', 'capitec_pay', 'instant_eft')),
  payment_reference TEXT,
  amount_paid DECIMAL(10,2) DEFAULT 0,

  -- Dates
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  paid_date DATE,

  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**installation_schedules**
```sql
CREATE TABLE installation_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES consumer_orders(id),

  -- Scheduling
  technician_id UUID REFERENCES admin_users(id),
  scheduled_date DATE NOT NULL,
  time_slot TEXT, -- 'morning' | 'afternoon' | 'full_day'

  -- Completion
  completed_date TIMESTAMPTZ,
  completion_notes TEXT,
  installation_photos JSONB,
  customer_signature TEXT, -- Base64 signature

  -- Equipment
  equipment_serials JSONB, -- { router: 'SN123', ont: 'ONT456' }
  speed_test_results JSONB, -- { download: 98.5, upload: 95.2, latency: 12 }

  status TEXT CHECK (status IN ('scheduled', 'in_progress', 'completed', 'rescheduled', 'cancelled')) DEFAULT 'scheduled',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### RLS Policies

**kyc_sessions**:
- Customers: SELECT own sessions (via auth.uid() matching customer)
- Admins: ALL operations (via user_is_admin() function)
- System: INSERT for webhook handlers (service role key)

**contracts**:
- Customers: SELECT own contracts
- Sales Reps: SELECT contracts for own quotes
- Managers: SELECT all contracts
- Admins: ALL operations

**invoices**:
- Customers: SELECT own invoices
- Admins: ALL operations

---

## 5. API Specifications

### Compliance Endpoints

**POST /api/compliance/create-kyc-session**
```typescript
// Request
{
  quoteId: string;
  type: 'sme' | 'consumer';
}

// Response
{
  success: boolean;
  data: {
    sessionId: string;
    verificationUrl: string;
    flowType: 'sme_light' | 'consumer_light' | 'full_kyc';
  };
}
```

**POST /api/compliance/webhook/didit**
```typescript
// Headers
{
  'X-Didit-Signature': 'HMAC-SHA256-signature'
}

// Payload
{
  event: 'verification.completed' | 'verification.failed' | 'session.abandoned';
  sessionId: string;
  result: {
    status: 'approved' | 'declined';
  };
  data: {
    id_number: string;
    company_reg: string;
    liveness_score: number;
    proof_of_address: {
      type: 'utility_bill' | 'bank_statement';
      address_line_1: string;
      city: string;
      postal_code: string;
    };
    directors?: Array<{ name: string; id_number: string }>;
  };
}

// Response
{ success: boolean }
```

**GET /api/compliance/[quoteId]/status**
```typescript
// Response
{
  success: boolean;
  data: {
    status: 'not_started' | 'in_progress' | 'completed' | 'abandoned' | 'declined';
    verification_result: 'approved' | 'declined' | 'pending_review';
    risk_tier: 'low' | 'medium' | 'high';
    completed_at: string;
  };
}
```

### Contract Endpoints

**POST /api/contracts/create-from-quote**
```typescript
// Request
{
  quoteId: string;
  kycSessionId: string;
}

// Response
{
  success: boolean;
  data: {
    contractId: string;
    contractNumber: string;
    status: 'draft';
    pdfUrl: string;
  };
}
```

**POST /api/contracts/[id]/send-for-signature**
```typescript
// Response
{
  success: boolean;
  data: {
    zohoSignRequestId: string;
    customerSigningUrl: string;
    sentAt: string;
  };
}
```

### RICA Endpoints

**POST /api/activation/rica-submit**
```typescript
// Request
{
  kycSessionId: string;
  orderId: string;
  serviceLines: Array<{ iccid: string; msisdn: string }>;
}

// Response
{
  success: boolean;
  data: {
    ricaSubmissionId: string;
    icasaTrackingId: string;
    status: 'submitted';
  };
}
```

**POST /api/activation/rica-webhook**
```typescript
// Payload
{
  event: 'rica.approved' | 'rica.rejected';
  trackingId: string;
  status: 'approved' | 'rejected';
  reason?: string;
}

// Response
{ success: boolean }
```

### Invoice & Payment Endpoints

**POST /api/invoices/create-from-contract**
```typescript
// Request
{
  contractId: string;
}

// Response
{
  success: boolean;
  data: {
    invoiceId: string;
    invoiceNumber: string;
    totalAmount: number;
    dueDate: string;
    pdfUrl: string;
    paymentUrl: string;
  };
}
```

**POST /api/payments/initiate**
```typescript
// Request
{
  invoiceId: string;
}

// Response
{
  success: boolean;
  data: {
    paymentUrl: string; // NetCash redirect URL
    transactionId: string;
  };
}
```

**POST /api/payments/webhook**
```typescript
// NetCash webhook payload
{
  TransactionID: string;
  Reference: string; // invoice_number
  Amount: string; // cents
  Status: 'Paid' | 'Failed' | 'Cancelled';
}

// Response
{ success: boolean }
```

---

## 6. Integration Details

### Didit KYC Integration

**Features Used** (Free Tier):
- ID Verification (ZA Smart ID, passports)
- Document Scanning (CK1, proof of address)
- Liveness Detection (passive, 1:1 face match)
- Fraud Detection (deepfakes, synthetic IDs)
- AML Screening (basic risk flags)

**Session Creation**:
```typescript
// lib/integrations/didit/session-manager.ts
export async function createKYCSessionForQuote(quoteId: string) {
  const quote = await getQuoteDetails(quoteId);
  const flowType = quote.total_amount > 500000 ? 'full_kyc' : 'sme_light';

  const { data } = await diditClient.post('/sessions', {
    type: 'kyc',
    jurisdiction: 'ZA',
    flow: flowType === 'sme_light' ? 'business_light_kyc' : 'business_full_kyc',
    features: ['id_verification', 'document_extraction', 'liveness', 'aml'],
    metadata: { quote_id: quoteId },
    redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/quote/${quoteId}/kyc-complete`,
    webhook_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/compliance/webhook/didit`
  });

  await supabase.from('kyc_sessions').insert({
    quote_id: quoteId,
    didit_session_id: data.sessionId,
    flow_type: flowType,
    status: 'not_started'
  });

  return { sessionId: data.sessionId, verificationUrl: data.verificationUrl };
}
```

**Risk Scoring**:
```typescript
function calculateRiskTier(extractedData: any): 'low' | 'medium' | 'high' {
  let score = 0;

  if (extractedData.liveness_score > 0.8) score += 40;
  if (extractedData.document_authenticity === 'valid') score += 30;
  if (!extractedData.aml_flags?.length) score += 30;

  if (score >= 80) return 'low';
  if (score >= 50) return 'medium';
  return 'high';
}
```

### ZOHO CRM Integration

**Custom Fields**:
- KYC_Status: Text (approved/declined/pending_review)
- KYC_Verified_Date: DateTime
- Risk_Tier: Picklist (low/medium/high)
- RICA_Status: Text (pending/submitted/approved/rejected)
- RICA_Approved_Date: DateTime
- Contract_Number: Text
- MRR: Currency

**Sync Logic**:
```typescript
// lib/integrations/zoho/sync-service.ts
export async function syncContractToDeal(contractId: string) {
  const contract = await getContractWithKYC(contractId);

  const deal = {
    Deal_Name: `${contract.customer.company_name} - ${contract.contract_number}`,
    Account_Name: await getAccountId(contract.customer_id),
    Amount: contract.total_contract_value,
    Stage: contract.status === 'fully_signed' ? 'Closed Won' : 'Negotiation',
    Closing_Date: contract.end_date,
    MRR: contract.monthly_recurring,

    // KYC & Compliance Fields
    KYC_Verified: contract.kyc_session?.verification_result === 'approved',
    KYC_Verification_Date: contract.kyc_session?.completed_at,
    Risk_Tier: contract.kyc_session?.risk_tier,
    RICA_Status: contract.rica_submission?.status || 'pending',
    Contract_Number: contract.contract_number
  };

  const response = await zohoAPI.post('/Deals', deal);
  return response;
}
```

### NetCash Pay Now Integration

**Payment Initiation**:
```typescript
// lib/payments/netcash-service.ts
export async function initiatePayment(invoiceId: string) {
  const invoice = await getInvoice(invoiceId);

  const paymentRequest = {
    ServiceKey: process.env.NETCASH_SERVICE_KEY!,
    MerchantID: process.env.NETCASH_MERCHANT_ID!,
    Amount: (invoice.total_amount * 100).toFixed(0), // cents
    Reference: invoice.invoice_number,
    Description: `Invoice ${invoice.invoice_number}`,
    ReturnURL: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/return`,
    NotifyURL: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook`
  };

  const response = await fetch('https://paynow.netcash.co.za/site/paynow.aspx', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(paymentRequest)
  });

  return response.json();
}
```

### RICA Integration

**Paired Submission**:
```typescript
// lib/compliance/rica-paired-submission.ts
export async function submitRICAWithDiditData(
  kycSessionId: string,
  orderId: string,
  serviceLines: Array<{ iccid: string; msisdn: string }>
) {
  const { data: kycSession } = await supabase
    .from('kyc_sessions')
    .select('extracted_data')
    .eq('id', kycSessionId)
    .single();

  const extractedData = kycSession.extracted_data;

  const ricaPayload = {
    iccid: serviceLines.map(line => line.iccid),
    msisdn: serviceLines.map(line => line.msisdn),
    id_number: extractedData.id_number,
    company_reg: extractedData.company_reg || null,
    proof_of_address: extractedData.proof_of_address,
    kyc_verification_id: kycSessionId
  };

  const ricaResponse = await submitToRICASystem(ricaPayload);

  await supabase.from('rica_submissions').insert({
    kyc_session_id: kycSessionId,
    order_id: orderId,
    submitted_data: ricaPayload,
    icasa_tracking_id: ricaResponse.trackingId,
    status: 'submitted'
  });

  return ricaResponse;
}
```

---

## 7. Reusable Components

### Existing Code to Leverage

**PDF Generation**:
- `lib/quotes/pdf-generator-v2.ts` (421 lines) - Production-ready quote PDF generator
- Features: CircleTel branding, multi-page support, jsPDF + autoTable
- **Adaptation**: Add KYC badge function, create contract/invoice variants

**PDF Template Base**: `docs/products/contract_docs/Circle Tel SA Head Office - SOS Q6330.pdf`
- **Current State**: Fixed Mobile Telecoms "Schedule of Service" template (2-page)
- **Required Adjustments**:
  1. **Rebrand to CircleTel**:
     - Replace Fixed Mobile Telecoms logo → CircleTel logo
     - Update company details (7 Autumn Road → CircleTel address)
     - Change color scheme: #FF6600 (orange) → #F5831F (CircleTel orange)
     - Update contact: accounts@fixedmobile.com → sales@circletel.co.za

  2. **Reverse Party Roles**:
     - **From**: CircleTel SA (Pty) Ltd (service provider)
     - **To**: Customer business/SME
     - Keep same layout structure (header, tables, signature blocks)

  3. **Document Type Variants** (3 variants from same base template):
     - **Quote (BQ-YYYY-NNN)**: "BUSINESS QUOTE" header, "Valid for 30 days" footer
     - **Contract (CT-YYYY-NNN)**: "SERVICE CONTRACT" header, terms, ZOHO Sign signature fields
     - **Invoice (INV-YYYY-NNN)**: "TAX INVOICE" header, payment instructions, banking details

  4. **Add KYC Compliance Badge** (top-right corner):
     - Position: Near document number (SOS DATE / SOS NUMBER box)
     - Content: "✓ KYC VERIFIED" badge with green checkmark icon
     - Design: 24px height, #10B981 background, white text
     - Conditional: Only display when kyc_status = 'approved'

  5. **Service Line Item Table** (keep existing structure):
     - Columns: Description, Recurring Unit Price, Once-Off Unit Price, Qty, Recurring Price, Once-Off
     - VAT row (15% calculation)
     - Totals summary (excl VAT, VAT, incl VAT)

  6. **Digital Signature Section** (bottom of page 2):
     - Table: "Signed For: CircleTel (duly Authorized) | Customer (duly Authorized)"
     - Fields: Date Signed, Name, Signature, Witness Signature
     - ZOHO Sign compatible (text inputs + signature pads)

  7. **Terms Reference** (bottom of page 2):
     - Quote: "This quote is valid for 30 days from the date above. Pricing subject to change."
     - Contract: "The Services to be provided are subject to this Service Contract and the Master Service Agreement."
     - Invoice: "Payment due within 30 days of invoice date. Banking details: [CircleTel bank account]"

**Implementation Notes**:
- Use existing jsPDF patterns from `quote-generator-v2.ts`
- Create template base class: `BaseDocumentGenerator` with shared header/footer logic
- Extend for variants: `QuoteGenerator`, `ContractGenerator`, `InvoiceGenerator`
- KYC badge function: `addKYCBadge(doc, x, y, verifiedDate)` (reusable)

**Quote System**:
- `lib/quotes/types.ts` (534 lines) - Comprehensive TypeScript types
- `lib/quotes/quote-calculator.ts` - Pricing calculations with VAT
- `lib/quotes/quote-numbering.ts` - Auto-incrementing quote numbers
- **Reuse**: Contract numbering, invoice numbering patterns

**Payment System**:
- `lib/payment/netcash-service.ts` - Existing NetCash integration
- `lib/payment/netcash-webhook-processor.ts` - Webhook validation
- **Extension**: Add recurring billing, payment method tokenization

**Notification Framework**:
- `lib/notifications/quote-notifications.ts` (150+ lines) - Event-driven notifications
- **Extension**: Add KYC reminders, contract notifications, RICA alerts

### New Components Required

**Compliance Layer** (no existing code):
- `lib/integrations/didit/` - Didit KYC API client, session manager, webhook handler
- `lib/compliance/risk-scoring.ts` - Risk tier calculation logic
- `lib/compliance/rica-paired-submission.ts` - RICA auto-submission

**Contract Management** (no existing code):
- `lib/contracts/contract-generator.ts` - Contract creation from quotes
- `lib/contracts/pdf-generator.ts` - Contract PDF with KYC badge
- `lib/integrations/zoho/sign-service.ts` - ZOHO Sign API client

**Invoicing** (no existing code):
- `lib/invoices/invoice-generator.ts` - Invoice creation logic
- `lib/invoices/pdf-generator.ts` - Invoice PDF generation
- `lib/billing/recurring-billing.ts` - Monthly billing automation

**ZOHO Integration** (no existing code):
- `lib/integrations/zoho/auth-service.ts` - OAuth token management
- `lib/integrations/zoho/crm-service.ts` - CRM API client
- `lib/integrations/zoho/sync-service.ts` - Bidirectional sync logic

---

## 8. User Flows

### SME Customer Flow

1. **Receive Quote Email**
   - Professional PDF attachment
   - "Accept Quote" button
   - Notice: "Quick 2-minute verification required"

2. **Accept Quote**
   - Click "Accept Quote" → Redirected to acceptance page
   - Review quote details
   - Click "Accept & Verify"

3. **Complete KYC (Light)**
   - Redirected to Didit embedded session
   - Upload ID (AI scans immediately)
   - Upload company registration CK1
   - Upload proof of address (utility bill)
   - Passive liveness check (background, no action)
   - **Total time: <3 minutes**

4. **KYC Approved**
   - Email: "Verification Complete - Contract Ready"
   - Contract auto-generated
   - ZOHO Sign email received within 1 minute

5. **Sign Contract**
   - Click ZOHO Sign link
   - Review contract (includes KYC badge)
   - Draw/type signature
   - Submit signature

6. **Receive Invoice**
   - Invoice email with PDF + payment link
   - Click "Pay Now"
   - NetCash payment gateway (choose method)
   - Complete payment

7. **Installation Scheduled**
   - Email: "Installation booked for [date]"
   - Technician arrives on scheduled date
   - Installation completed
   - Customer signs off

8. **Service Activated**
   - RICA auto-submitted using KYC data
   - RICA approved
   - Welcome email with account credentials
   - Service live

### Admin Compliance Officer Flow

1. **Monitor Compliance Queue**
   - Navigate to `/admin/compliance`
   - View "Pending Review" tab (high-risk KYC sessions)
   - Filter by risk tier, date range

2. **Review High-Risk KYC**
   - Click on pending session
   - View extracted data: ID number, company reg, PoA details
   - Review Didit response: liveness score, AML flags, document authenticity
   - Check risk score breakdown

3. **Make Decision**
   - **Approve**: Contract generated immediately
   - **Request More Info**: Email sent to customer with specific requests
   - **Decline**: Customer notified with reason

4. **Track RICA Issues**
   - Navigate to `/admin/fulfillment`
   - View orders with RICA status "rejected"
   - Click order to see rejection reason
   - Manually correct data if needed
   - Resubmit RICA

### Sales Representative Flow

1. **Create Quote**
   - Navigate to `/admin/quotes/new`
   - Fill in customer details, select services
   - Submit for manager approval

2. **Track Quote Progress**
   - View quote list with KYC status column
   - See real-time updates: "Quote Sent" → "KYC Completed" → "Contract Signed"

3. **Monitor ZOHO CRM**
   - Open ZOHO CRM
   - View deal with custom fields populated:
     - KYC_Status: approved
     - Risk_Tier: low
     - Contract_Number: CT-2025-001
     - Stage: Closed Won (after contract signed)

---

## 9. RBAC & Security

### Permission Matrix

| Role | kyc:submit | kyc:review | kyc:override | contracts:create | contracts:view_all | rica:submit | rica:override | zoho:sync_manual |
|------|------------|------------|--------------|------------------|-------------------|-------------|---------------|------------------|
| **B2B Customer (SME)** | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **Sales Representative** | ✗ | ✗ | ✗ | ✓ (own quotes) | ✗ | ✗ | ✗ | ✗ |
| **Sales Manager** | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✓ |
| **Admin (Compliance)** | ✗ | ✓ | ✓ | ✗ | ✓ | ✗ | ✓ | ✓ |
| **Operations Manager** | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ (auto) | ✓ | ✗ |
| **Super Admin** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

### RLS Policy Examples

**kyc_sessions**:
```sql
-- Customers view own KYC sessions
CREATE POLICY kyc_customer_select ON kyc_sessions
  FOR SELECT
  USING (
    quote_id IN (
      SELECT id FROM business_quotes WHERE customer_id = auth.uid()
    )
  );

-- Admins have full access
CREATE POLICY kyc_admin_all ON kyc_sessions
  FOR ALL
  USING (user_is_admin());

-- System can insert (for webhooks)
CREATE POLICY kyc_system_insert ON kyc_sessions
  FOR INSERT
  WITH CHECK (true);
```

**contracts**:
```sql
-- Sales reps view contracts for own quotes
CREATE POLICY contracts_sales_rep_select ON contracts
  FOR SELECT
  USING (
    quote_id IN (
      SELECT id FROM business_quotes WHERE created_by = auth.uid()
    )
  );

-- Customers view own contracts
CREATE POLICY contracts_customer_select ON contracts
  FOR SELECT
  USING (customer_id = auth.uid());
```

### Data Protection

**Sensitive Data Storage**:
- KYC extracted data: Stored in JSONB, encrypted at rest (Supabase default)
- ID numbers: Never logged, only in kyc_sessions.extracted_data
- Payment methods: Tokenized via NetCash (no card numbers stored)
- Signatures: Base64 in database, signed PDFs in Supabase Storage (private bucket)

**Audit Trail**:
- All KYC decisions logged with admin user ID, timestamp, reason
- RICA submissions tracked with Didit session ID reference
- Contract signatures tracked with ZOHO Sign request ID
- Full chain: Quote → KYC → Contract → Invoice → Payment → Installation → RICA → Activation

---

## 10. Testing Strategy

### E2E Test Scenarios

**Test 1: Happy Path - Complete Workflow**
- Admin creates quote → Manager approves
- Customer accepts quote → Completes KYC (mock Didit webhook)
- Low-risk KYC → Contract auto-generated → ZOHO Sign sent
- Customer signs contract (mock ZOHO webhook)
- Invoice created → Payment completed (mock NetCash webhook)
- Order created → Installation scheduled → Completed
- RICA submitted (mock approval webhook)
- Service activated → Welcome email sent
- **Assertions**: All statuses updated, ZOHO CRM synced, emails sent

**Test 2: High-Risk KYC - Manual Review**
- Customer completes KYC with liveness score 0.45
- KYC flagged as high-risk → Escalated to admin queue
- Admin reviews → Approves manually
- Contract generated → Workflow continues
- **Assertions**: Admin queue populated, manual approval logged

**Test 3: RICA Rejection - Admin Intervention**
- Installation completed → RICA auto-submitted
- RICA rejected (mock webhook: ID mismatch)
- Admin notified → Views rejection reason
- Admin corrects data → Resubmits RICA
- RICA approved → Service activated
- **Assertions**: Order flagged, admin action logged, audit trail complete

**Test 4: KYC Timeout - Resume Session**
- Customer starts KYC → Closes browser mid-verification
- Returns 6 hours later → Clicks "Resume Verification"
- Existing session reused → Completes verification
- **Assertions**: No duplicate sessions created, progress preserved

### Unit Tests

**Risk Scoring**:
```typescript
describe('calculateRiskTier', () => {
  it('returns low for liveness >0.8, valid docs, no AML flags', () => {
    const data = { liveness_score: 0.95, document_authenticity: 'valid', aml_flags: [] };
    expect(calculateRiskTier(data)).toBe('low');
  });

  it('returns high for liveness <0.5', () => {
    const data = { liveness_score: 0.45, document_authenticity: 'valid', aml_flags: [] };
    expect(calculateRiskTier(data)).toBe('high');
  });
});
```

**Webhook Signature Verification**:
```typescript
describe('verifyDiditWebhook', () => {
  it('returns true for valid HMAC signature', () => {
    const payload = JSON.stringify({ event: 'verification.completed' });
    const signature = createHMAC(payload, process.env.DIDIT_WEBHOOK_SECRET!);
    expect(verifyDiditWebhook(payload, signature)).toBe(true);
  });

  it('returns false for invalid signature', () => {
    const payload = JSON.stringify({ event: 'verification.completed' });
    expect(verifyDiditWebhook(payload, 'invalid-signature')).toBe(false);
  });
});
```

### Performance Tests

- PDF generation: <3 seconds for 5-page contract
- KYC session creation: <2 seconds
- Webhook processing: <1 second
- ZOHO CRM sync: <5 seconds
- RICA submission: <5 seconds
- Invoice generation: <3 seconds

---

## 11. Deployment Plan

### 14-Day Implementation Timeline

**Phase 1: KYC Foundation (Days 1-3)**
- Day 1: Database migrations, Didit API client
- Day 2: Webhook handlers, KYC UI components
- Day 3: Risk scoring, admin compliance queue

**Phase 2: Contracts & Signatures (Days 4-5)**
- Day 4: Contract database, generator logic
- Day 5: Contract PDF, ZOHO Sign integration

**Phase 3: ZOHO CRM Sync (Days 6-7)**
- Day 6: OAuth setup, sync service
- Day 7: Entity sync, bidirectional webhooks

**Phase 4: Invoicing & Payments (Days 8-10)**
- Day 8: Invoice database, generator
- Day 9: NetCash integration
- Day 10: Recurring billing

**Phase 5: Fulfillment & RICA (Days 11-12)**
- Day 11: Fulfillment database, scheduling
- Day 12: RICA pairing, service activation

**Phase 6: Testing & Launch (Days 13-14)**
- Day 13: Email templates, automation
- Day 14: E2E tests, production deployment

### Environment Setup

**Required Environment Variables**:
```env
# Didit KYC
DIDIT_API_KEY=<key>
DIDIT_WEBHOOK_SECRET=<secret>

# ZOHO
ZOHO_CLIENT_ID=<id>
ZOHO_CLIENT_SECRET=<secret>
ZOHO_SIGN_API_KEY=<key>

# NetCash (existing)
NETCASH_SERVICE_KEY=<key>
NETCASH_MERCHANT_ID=<id>

# RICA
RICA_API_URL=<endpoint>
RICA_API_KEY=<key>

# Resend (existing)
RESEND_API_KEY=<key>
```

**Third-Party Setup**:
1. **Didit**: Create account, configure webhook URL, copy API key
2. **ZOHO Developer Console**: Create OAuth app, configure scopes, set redirect URI
3. **ZOHO Sign**: Enable API access, generate API key
4. **NetCash**: Configure webhook URLs (Notify, Return)
5. **RICA Vendor**: Obtain API credentials, configure webhook
6. **Resend**: Verify domain (SPF/DKIM), add sending addresses

**Database Migrations**:
```bash
# Apply migrations in order
supabase db push

# Migrations to create:
# 20251101000001_create_kyc_system.sql
# 20251102000001_create_contracts_system.sql
# 20251103000001_create_zoho_sync_system.sql
# 20251104000001_create_invoicing_system.sql
# 20251105000001_create_fulfillment_system.sql
```

**Webhook Configuration**:
- Didit: `https://circletel.co.za/api/compliance/webhook/didit`
- ZOHO CRM: `https://circletel.co.za/api/integrations/zoho/webhook`
- ZOHO Sign: `https://circletel.co.za/api/contracts/[id]/signature-webhook`
- NetCash: `https://circletel.co.za/api/payments/webhook`
- RICA: `https://circletel.co.za/api/activation/rica-webhook`

**Cron Jobs** (Vercel):
```json
{
  "crons": [
    {
      "path": "/api/billing/process-recurring",
      "schedule": "0 2 * * *"
    }
  ]
}
```

---

## 12. Success Metrics & KPIs

### Business KPIs (30-day tracking)

**Conversion Metrics**:
- Quote-to-contract conversion: Baseline 40% → Target >55%
- KYC completion rate: Target >90%
- Contract signature rate: Target >85% (of sent contracts)
- Payment collection rate: Target >95%

**Speed Metrics**:
- Quote-to-contract time: Baseline 7 days → Target <1 day
- Contract-to-activation time: Baseline 10 days → Target <1 day
- KYC verification time: Target <3 min (SME), <2 min (consumer)

**Compliance Metrics**:
- FICA compliance: 100% (zero audit failures)
- RICA compliance: 100% (all services registered)
- KYC verification accuracy: >95% (AI extraction)
- RICA first-time approval: >90%

**Cost Savings**:
- KYC verification cost: R0 (free tier)
- Manual processing reduction: 80%
- Onboarding time reduction: 86%
- RICA data entry time: -90%
- Fraud reduction: 80%

### Technical KPIs

**Performance**:
- API uptime: 99.9%
- Webhook processing latency: <1 second
- Contract generation: <2 seconds
- RICA submission: <5 seconds
- ZOHO sync latency: <5 seconds

**Reliability**:
- ZOHO sync success rate: >98%
- Payment webhook success: >99%
- Email deliverability: >99%
- Database query performance: <100ms (p95)

**Security**:
- Zero data breaches
- Zero FICA violations
- 100% webhook signature verification
- 100% RLS policy enforcement

### Monitoring Dashboard

**Key Metrics to Display**:
- Total quotes created (current month)
- KYC sessions: Not started / In progress / Completed / Declined
- Contracts: Pending signature / Fully signed
- Invoices: Unpaid / Paid / Overdue
- RICA submissions: Pending / Submitted / Approved / Rejected
- Average time per stage (quote → KYC → contract → payment → activation)

---

## 13. Out of Scope

**Not included in this phase**:
- Multi-language support (English only)
- Mobile app (web-based only)
- Advanced analytics dashboard (basic reporting only)
- Customer self-service portal beyond KYC verification
- Integration with accounting software beyond ZOHO CRM
- AI-powered contract negotiation
- Automated contract renewals (manual process)
- Custom contract templates per customer
- Multi-currency support (ZAR only)

**Future enhancements**:
- Upgrade/downgrade flows for existing customers
- Contract amendments and addendums
- Advanced RICA status tracking
- Customer portal for viewing contracts/invoices
- Automated credit checks
- Dunning management for failed payments

---

## 14. Technical Approach

### Backend Architecture

**API Routes Structure**:
```
app/api/
├── compliance/
│   ├── create-kyc-session/route.ts
│   ├── webhook/didit/route.ts
│   ├── [quoteId]/status/route.ts
│   └── retry-kyc/route.ts
├── contracts/
│   ├── create-from-quote/route.ts
│   └── [id]/
│       ├── route.ts
│       ├── send-for-signature/route.ts
│       ├── signature-webhook/route.ts
│       └── download-pdf/route.ts
├── invoices/
│   ├── create-from-contract/route.ts
│   └── [id]/
│       ├── route.ts
│       └── send/route.ts
├── payments/
│   ├── initiate/route.ts
│   ├── webhook/route.ts
│   └── return/route.ts
├── activation/
│   ├── rica-submit/route.ts
│   ├── rica-webhook/route.ts
│   └── activate-service/route.ts
└── integrations/
    └── zoho/
        ├── auth/route.ts
        ├── sync/route.ts
        └── webhook/route.ts
```

**Service Layer**:
```
lib/
├── integrations/
│   ├── didit/
│   │   ├── client.ts
│   │   ├── session-manager.ts
│   │   └── webhook-handler.ts
│   └── zoho/
│       ├── auth-service.ts
│       ├── crm-service.ts
│       ├── sign-service.ts
│       └── sync-service.ts
├── compliance/
│   ├── risk-scoring.ts
│   └── rica-paired-submission.ts
├── contracts/
│   ├── contract-generator.ts
│   └── pdf-generator.ts
├── invoices/
│   ├── invoice-generator.ts
│   └── pdf-generator.ts
└── payments/
    ├── netcash-service.ts
    └── payment-processor.ts
```

### Frontend Architecture

**Admin Pages**:
```
app/admin/
├── compliance/page.tsx              # KYC review queue
├── contracts/
│   ├── page.tsx                     # Contracts list
│   └── [id]/page.tsx                # Contract detail
├── billing/
│   └── invoices/
│       ├── page.tsx                 # Invoices list
│       └── [id]/page.tsx            # Invoice detail
└── fulfillment/
    ├── page.tsx                     # Fulfillment dashboard
    └── installations/page.tsx       # Installation calendar
```

**Customer-Facing Pages**:
```
app/customer/
└── quote/
    └── [id]/
        └── kyc/page.tsx             # KYC verification session
```

**Components**:
```
components/
├── compliance/
│   ├── LightKYCSession.tsx          # Didit iframe embed
│   └── KYCStatusBadge.tsx           # Status indicator
├── contracts/
│   ├── ContractPreview.tsx          # PDF preview
│   └── SignatureStatus.tsx          # Signature progress
└── invoices/
    ├── InvoicePreview.tsx           # Invoice PDF preview
    └── PaymentButton.tsx            # NetCash trigger
```

### Database Design Principles

- **Normalization**: Separate tables for KYC, contracts, invoices (avoid duplication)
- **Referential Integrity**: Foreign keys with CASCADE/RESTRICT as appropriate
- **JSONB for Flexibility**: Use for extracted_data, submitted_data (schema varies)
- **Indexes**: On foreign keys, unique fields, webhook IDs
- **RLS Enforcement**: All tables have policies, no service role bypasses in UI
- **Audit Trails**: created_at, completed_at, webhook_received_at timestamps

### Error Handling Strategy

**Webhook Failures**:
- Store failed webhooks in `webhook_failures` table
- Retry mechanism: 3 attempts, exponential backoff (5s, 25s, 125s)
- Alert to Slack #engineering-alerts after all retries fail
- Manual retry via admin UI

**API Failures**:
- Didit API down: Queue KYC sessions, retry on recovery
- ZOHO API down: Log sync failures, manual "Force Sync" button
- NetCash down: Show payment pending status, retry webhook processing
- RICA API down: Queue submissions, notify admin

**User-Facing Errors**:
- KYC failed: Show "Retry Verification" button with explanation
- Contract signature timeout: Send reminder email after 48h
- Payment failed: Email with "Retry Payment" link
- RICA rejected: Admin notification, manual review flow

---

## 15. Dependencies & Risks

### External Dependencies

| Dependency | Risk Level | Mitigation |
|------------|-----------|------------|
| Didit API availability | Medium | Webhook retry logic, cache extracted data |
| ZOHO CRM/Sign API limits | Low | Rate limiting, exponential backoff |
| RICA API vendor | High | Identify vendor early, manual fallback process |
| NetCash payment gateway | Low | Already integrated, stable |

### Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| KYC extraction accuracy <95% | High | Medium | Manual review queue, escalation for high-risk |
| RICA API downtime | High | Low | Queue submissions, retry mechanism, manual fallback |
| ZOHO sync failures | Medium | Medium | Retry logic, manual sync button, sync status dashboard |
| Database performance (JSONB queries) | Medium | Low | Index JSONB fields, optimize queries, caching |
| Webhook signature forgery | Critical | Very Low | HMAC-SHA256 verification, timing attack prevention |

### Operational Risks

- **Training Required**: Admin users need training on compliance queue, RICA manual review
- **RICA Vendor Selection**: Must be completed before Phase 5 (Days 11-12)
- **Volume Scalability**: Didit free tier unlimited for basic checks, but paid for premium features
- **Support Load**: Potential increase in support queries during KYC (mitigated by clear instructions)

---

## 16. Appendix

### Related Documentation

- **User Stories**: `docs/journeys/b2b-quote-to-contract/USER_STORIES.md`
- **Technical Workflow**: `docs/journeys/b2b-quote-to-contract/Quote-to-Contract Workflow.md`
- **Existing Quote Types**: `lib/quotes/types.ts`
- **Existing PDF Generator**: `lib/quotes/pdf-generator-v2.ts`
- **NetCash Integration**: `lib/payment/netcash-service.ts`

### Glossary

- **FICA**: Financial Intelligence Centre Act (SA anti-money laundering law)
- **RICA**: Regulation of Interception of Communications Act (SIM registration law)
- **KYC**: Know Your Customer (identity verification)
- **Liveness Detection**: Verify person is real (not photo/video)
- **AML**: Anti-Money Laundering screening
- **Didit**: Third-party KYC verification provider
- **ZOHO Sign**: Digital signature platform
- **NetCash Pay Now**: South African payment gateway
- **RLS**: Row Level Security (Supabase database security)
- **HMAC**: Hash-based Message Authentication Code (webhook security)

### Acronyms

- **CK1**: Company registration certificate (South Africa)
- **PoA**: Proof of Address
- **MRR**: Monthly Recurring Revenue
- **SLA**: Service Level Agreement
- **ICCID**: Integrated Circuit Card Identifier (SIM card ID)
- **MSISDN**: Mobile Station International Subscriber Directory Number (phone number)
- **ECT Act**: Electronic Communications and Transactions Act (SA digital signatures law)

---

**Specification Version**: 1.0
**Created**: 2025-11-01
**Status**: Ready for Development
**Approval**: Pending stakeholder sign-off
**Implementation Owner**: [To be assigned]
**Estimated Duration**: 14 days
**Total Story Points**: 61 (across 4 sprints)
