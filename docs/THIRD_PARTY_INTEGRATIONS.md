# CircleTel - Third-Party Integrations Guide

**Document Version**: 1.0.0
**Created**: 2025-01-22
**Last Updated**: 2025-01-22 14:45 SAST
**Status**: Current
**Maintainer**: Development Team + Claude Code

---

## 📋 Document Change Log

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0.0 | 2025-01-22 | Initial comprehensive integrations documentation | Claude Code |

---

## 📖 Table of Contents

1. [Overview](#overview)
2. [Backend Infrastructure](#backend-infrastructure)
3. [Payment Gateway](#payment-gateway)
4. [CRM & Business Automation](#crm--business-automation)
5. [Identity & Compliance](#identity--compliance)
6. [Communication Services](#communication-services)
7. [Maps & Geolocation](#maps--geolocation)
8. [Content Management](#content-management)
9. [Analytics & Monitoring](#analytics--monitoring)
10. [Development & Testing](#development--testing)
11. [Integration Health Monitoring](#integration-health-monitoring)
12. [Environment Variables](#environment-variables)
13. [Security & Authentication](#security--authentication)
14. [Rate Limiting & Quotas](#rate-limiting--quotas)
15. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

CircleTel integrates with **15+ third-party services** across backend infrastructure, payments, CRM, compliance, communications, and more. This document provides comprehensive details for each integration including:

- **Purpose & Use Cases**
- **Technical Implementation**
- **Authentication Methods**
- **API Endpoints & Rate Limits**
- **Configuration Requirements**
- **Code Examples**
- **Monitoring & Health Checks**

### Integration Categories

| Category | Services | Purpose |
|----------|----------|---------|
| **Backend** | Supabase, Vercel | Database, auth, hosting |
| **Payments** | NetCash Pay Now | Payment processing |
| **CRM** | Zoho CRM, Zoho Billing, Zoho Sign, Zoho Desk | Customer management, invoicing |
| **Compliance** | Didit KYC, ICASA RICA | Identity verification, telecom compliance |
| **Communications** | Resend, Clickatell | Email, SMS |
| **Maps** | Google Maps | Coverage checking, geolocation |
| **CMS** | Sanity, Strapi | Content management |
| **Analytics** | Vercel Analytics | Performance monitoring |
| **Testing** | Playwright | E2E testing |

---

## 🏗️ Backend Infrastructure

### 1. **Supabase** (PostgreSQL + Backend-as-a-Service)

**Version**: Latest
**Purpose**: Primary backend - database, authentication, storage, edge functions
**Status**: ✅ Active (Production)

#### **Features Used**
- PostgreSQL Database (80+ tables)
- Row Level Security (RLS)
- JWT-based authentication
- Storage buckets (partner docs, contracts)
- Realtime subscriptions
- Edge Functions (Deno)

#### **Configuration**
```typescript
// lib/supabase/client.ts (Browser)
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  )
}

// lib/supabase/server.ts (Server)
import { createServerClient } from '@supabase/ssr'

export async function createClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role bypasses RLS
    { cookies }
  )
}
```

#### **Environment Variables**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://agyjovdugmtopasyvlng.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=<anon_key>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
SUPABASE_ACCESS_TOKEN=<access_token>
SUPABASE_PERSONAL_ACCESS_TOKEN=<pat>
SUPABASE_DB_PASSWORD=<db_password>
```

#### **Storage Buckets**
| Bucket | Purpose | Max Size | Access |
|--------|---------|----------|--------|
| `partner-compliance-documents` | FICA/CIPC docs | 20MB | Private (RLS) |
| `contract-documents` | Signed contracts | 10MB | Private (RLS) |
| `product-images` | Product photos | 5MB | Public |

#### **Edge Functions**
| Function | Trigger | Purpose |
|----------|---------|---------|
| `approve-admin-user` | HTTP POST | Admin user approval workflow |
| `send-admin-notification` | HTTP POST | Internal notifications |

#### **Performance**
- **Query Latency**: <50ms (p95)
- **Realtime Latency**: <100ms
- **Storage Upload**: <2s for 20MB files
- **Database Connections**: Connection pooling (max 15 connections)

#### **Monitoring**
- Dashboard: https://app.supabase.com/project/agyjovdugmtopasyvlng
- Health check: `/api/health` endpoint
- Logs: Supabase Dashboard → Logs

---

### 2. **Vercel** (Hosting & Serverless Functions)

**Purpose**: Hosting platform, serverless API routes, edge functions
**Status**: ✅ Active (Production)

#### **Deployments**
- **Production**: https://www.circletel.co.za (main branch)
- **Staging**: https://circletel-staging.vercel.app (staging branch)

#### **Serverless Function Configuration** (`vercel.json`)
```json
{
  "functions": {
    "app/admin/quotes/[id]/page.tsx": {
      "maxDuration": 60,
      "memory": 1024
    },
    "app/api/cron/zoho-sync/route.ts": {
      "maxDuration": 600,
      "memory": 1024
    }
  }
}
```

#### **Cron Jobs** (6 scheduled tasks)
| Path | Schedule | Description | Timeout |
|------|----------|-------------|---------|
| `/api/cron/generate-invoices` | Daily (00:00) | Generate recurring invoices | 300s |
| `/api/cron/expire-deals` | Daily (02:00) | Expire old deals/quotes | 60s |
| `/api/cron/price-changes` | Daily (02:00) | Apply price changes | 60s |
| `/api/cron/zoho-sync` | Daily (00:00) | Sync to Zoho CRM/Billing | 600s |
| `/api/cron/integrations-health-check` | Every 30 min | Check integration health | 60s |
| `/api/cron/cleanup-webhook-logs` | Weekly (Sunday 03:00) | Clean old logs | 60s |

#### **Environment Variables**
Managed via Vercel Dashboard:
- Production: 150+ environment variables
- Preview: Inherits from production
- Development: Uses `.env.local`

#### **Performance**
- **Cold Start**: <500ms
- **Warm Request**: <50ms
- **Function Duration**: 10s default, up to 600s (Zoho sync)
- **Edge Network**: 20+ global regions

---

## 💳 Payment Gateway

### 3. **NetCash Pay Now** (Payment Processing)

**Version**: Pay Now v2 API
**Purpose**: Payment gateway for 20+ payment methods
**Status**: ✅ Active (Production)
**Website**: https://netcash.co.za

#### **Supported Payment Methods** (20+)
- Credit Cards (Visa, Mastercard, Amex)
- Debit Cards
- Instant EFT (Bank transfer)
- EFT Pro
- SnapScan
- Zapper
- Mobicred (Buy now, pay later)
- SCode
- Masterpass
- Samsung Pay
- Apple Pay
- Google Pay
- PayPal
- And 8 more...

#### **Implementation**
**Location**: `lib/payment/netcash-service.ts`

```typescript
export class NetcashPaymentService {
  private pciVaultKey: string
  private serviceKey: string

  /**
   * Tokenize card details using PCI Vault
   */
  async tokenizeCard(cardDetails: TokenizationRequest): Promise<TokenizationResponse> {
    const requestData = {
      PciVaultKey: this.pciVaultKey,
      CardNumber: cardDetails.cardNumber.replace(/\s/g, ''),
      CardHolder: cardDetails.cardHolder,
      ExpiryDate: `${cardDetails.expiryMonth}/${cardDetails.expiryYear}`,
      CVV: cardDetails.cvv,
      Method: 'Tokenize'
    }

    const response = await this.apiCall('/pci-vault/tokenize', requestData)
    return response
  }

  /**
   * Process payment using tokenized card
   */
  async processPayment(paymentData: PaymentRequest): Promise<PaymentResponse> {
    const formData = new FormData()
    formData.append('m1', this.serviceKey)
    formData.append('m2', paymentData.reference)
    formData.append('p4', formatAmountForNetcash(paymentData.amount).toString())
    formData.append('m10', netcashConfig.payNow.notifyUrl) // Webhook

    // Submit to NetCash Pay Now
    const response = await fetch('https://paynow.netcash.co.za/site/paynow.aspx', {
      method: 'POST',
      body: formData
    })

    return response
  }
}
```

#### **Webhook Verification** (HMAC-SHA256)
**Location**: `app/api/webhooks/netcash/route.ts`

```typescript
import crypto from 'crypto'

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  )
}

// In webhook handler
export async function POST(request: Request) {
  const signature = request.headers.get('x-netcash-signature')
  const rawBody = await request.text()

  if (!verifyWebhookSignature(rawBody, signature, WEBHOOK_SECRET)) {
    return new Response('Invalid signature', { status: 401 })
  }

  // Process payment notification
  const data = JSON.parse(rawBody)
  await updateOrderPaymentStatus(data)

  return new Response('OK', { status: 200 })
}
```

#### **Environment Variables**
```bash
# Test Environment (Admin UI configurable)
NEXT_PUBLIC_NETCASH_SERVICE_KEY=7928c6de-219f-4b75-9408-ea0e53be8c87
NEXT_PUBLIC_NETCASH_PCI_VAULT_KEY=3143ee79-0c96-4909-968e-5a716fd19a65
NETCASH_WEBHOOK_SECRET=<generated_secret>

# Production (Admin UI only, never in git)
# Configure via /admin/payments/settings
```

#### **Payment Flow**
1. Customer enters payment details (inline form)
2. Frontend tokenizes card via PCI Vault (client-side)
3. Token sent to backend API
4. Backend creates payment request with token
5. NetCash processes payment
6. Webhook received at `/api/webhooks/netcash`
7. HMAC signature verified
8. Order status updated
9. Confirmation email sent

#### **Features**
- **PCI Compliance**: Tokenization via PCI Vault (customer card data never touches our servers)
- **3D Secure**: Automatic 3D Secure 2.0 for card payments
- **Instant EFT**: Real-time bank transfers
- **Payment Links**: Generate payment links for invoices
- **Recurring Payments**: eMandate support (planned)

#### **Rate Limits**
- **API Requests**: 100 requests/minute
- **Tokenization**: 50 requests/minute
- **Webhooks**: No limit (idempotent handling)

#### **Testing**
- **Test Environment**: Separate service key and PCI vault key
- **Test Cards**: https://netcash.co.za/support/test-cards
- **Demo Page**: `/order/payment/demo`

---

## 🤝 CRM & Business Automation

### 4. **Zoho CRM** (Customer Relationship Management)

**Version**: Zoho CRM v2 API
**Purpose**: Contact management, quotes (estimates), deals, sales pipeline
**Status**: ✅ Active (Production)
**Website**: https://www.zoho.com/crm/

#### **Implementation**
**Location**: `lib/integrations/zoho/crm-service.ts`

```typescript
export class ZohoCRMService {
  private auth = createZohoAuthService()
  private baseUrl = 'https://www.zohoapis.com/crm/v2'

  /**
   * Create Estimate (Quote) in Zoho CRM
   */
  async createEstimate(quoteData: QuoteDataForSync): Promise<string> {
    const accessToken = await this.auth.getAccessToken()

    const estimateData: ZohoEstimateData = {
      Subject: `Quote ${quoteData.quote_number}`,
      Account_Name: { name: quoteData.company_name },
      Grand_Total: quoteData.total_amount,
      Quote_Stage: this.mapQuoteStage(quoteData.status),
      Valid_Till: quoteData.valid_until,
      KYC_Status: this.mapKYCStatus(quoteData.kyc_status),
    }

    const response = await fetch(`${this.baseUrl}/Quotes`, {
      method: 'POST',
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: [estimateData] }),
    })

    const result = await response.json()
    return result.data[0].details.id
  }

  /**
   * Update KYC status in Zoho CRM Deal/Quote
   */
  async updateKYCStatus(recordId: string, kycData: KYCData): Promise<void> {
    const accessToken = await this.auth.getAccessToken()

    const updateData = {
      KYC_Status: kycData.status,
      KYC_Verified_Date: kycData.verifiedDate,
      Risk_Tier: kycData.riskTier,
    }

    await fetch(`${this.baseUrl}/Quotes/${recordId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: [updateData] }),
    })
  }
}
```

#### **Custom Fields** (Must be created in Zoho CRM)
| Field Name | Type | Values | Purpose |
|------------|------|--------|---------|
| `KYC_Status` | Picklist | Not Started, In Progress, Completed, Declined | Track KYC verification |
| `KYC_Verified_Date` | Date | - | KYC completion date |
| `Risk_Tier` | Picklist | Low, Medium, High | Risk assessment |
| `RICA_Status` | Picklist | Pending, Submitted, Approved, Rejected | RICA compliance |
| `Contract_Number` | Text | CT-YYYY-NNN | Contract reference |
| `Contract_Signed_Date` | Date | - | E-signature date |

#### **Modules Used**
| Module | Purpose | Sync Frequency |
|--------|---------|----------------|
| **Contacts** | Customer records | Real-time + Daily batch |
| **Accounts** | Company records | Daily batch |
| **Quotes (Estimates)** | B2B quotes | Real-time |
| **Deals** | Sales pipeline | Daily batch |
| **Products** | Product catalog | Weekly batch |

#### **Authentication** (OAuth 2.0)
```bash
# Environment Variables
ZOHO_CLIENT_ID=<client_id>
ZOHO_CLIENT_SECRET=<client_secret>
ZOHO_REFRESH_TOKEN=<refresh_token>
ZOHO_REGION=US # US, EU, IN, AU, CN
```

**OAuth Flow**:
1. Initial authorization via Zoho OAuth consent screen
2. Exchange authorization code for refresh token (one-time)
3. Store refresh token in environment variables
4. Exchange refresh token for access token (valid 1 hour)
5. Cache access token in memory/Redis
6. Refresh when expired (automatic)

#### **Rate Limits**
- **API Calls**: 5,000 credits/day (Enterprise plan)
- **Concurrent Requests**: 10
- **Bulk Operations**: 100 records per API call
- **Custom Rate Limiter**: Implemented in `lib/integrations/zoho/rate-limiter.ts`

#### **Webhooks**
**Endpoint**: `/api/webhooks/zoho-crm`
**Events**: Contact Created, Deal Updated, Quote Signed

```typescript
// Webhook handler
export async function POST(request: Request) {
  const signature = request.headers.get('x-zoho-signature')
  const payload = await request.json()

  // Verify webhook signature
  if (!verifyZohoSignature(payload, signature)) {
    return new Response('Invalid signature', { status: 401 })
  }

  // Handle event
  switch (payload.event) {
    case 'Contact.create':
      await handleContactCreated(payload.data)
      break
    case 'Deal.update':
      await handleDealUpdated(payload.data)
      break
  }

  return new Response('OK')
}
```

---

### 5. **Zoho Billing** (Subscription & Invoice Management)

**Version**: Zoho Billing v1 API
**Purpose**: Recurring billing, subscriptions, invoices
**Status**: ✅ Active (Production)
**Website**: https://www.zoho.com/billing/

#### **Implementation**
**Location**: `lib/integrations/zoho/billing-client.ts`

```typescript
export class ZohoBillingClient extends ZohoAPIClient {
  private organizationId: string

  /**
   * Create subscription in Zoho Billing
   */
  async createSubscription(subscriptionData: CreateSubscriptionPayload): Promise<string> {
    await rateLimiter.acquireToken('zoho-billing')

    const response = await this.request<ZohoBillingSubscription>(
      '/subscriptions',
      'POST',
      subscriptionData
    )

    return response.subscription.subscription_id
  }

  /**
   * Create invoice in Zoho Billing
   */
  async createInvoice(invoiceData: CreateInvoicePayload): Promise<string> {
    const response = await this.request<ZohoBillingInvoice>(
      '/invoices',
      'POST',
      invoiceData
    )

    return response.invoice.invoice_id
  }

  /**
   * List all plans (product catalog)
   */
  async listPlans(): Promise<ZohoBillingPlan[]> {
    const response = await this.request<ZohoBillingListResponse<ZohoBillingPlan>>(
      '/plans',
      'GET'
    )

    return response.plans
  }
}
```

#### **Sync Services** (Background Jobs)
| Service | File | Purpose | Frequency |
|---------|------|---------|-----------|
| Customer Sync | `customer-sync-service.ts` | Sync customers to Zoho Contacts | Daily |
| Subscription Sync | `subscription-sync-service.ts` | Sync active services to subscriptions | Daily |
| Invoice Sync | `invoice-sync-service.ts` | Sync invoices | Daily |
| Payment Sync | `payment-sync-service.ts` | Sync payments | Real-time |
| Product Sync | `product-sync-service.ts` | Sync product catalog | Weekly |

#### **Sync Architecture** (Supabase-First Pattern)

```
User Action → Supabase (immediate) → User sees success
              ↓ (async)
         zoho_sync_queue table
              ↓ (cron every 30 min)
         Background Sync Job
              ↓
         Zoho Billing API
              ↓
         zoho_sync_logs table (success/failure)
```

**Benefits**:
- User never waits for Zoho API
- Resilient to Zoho API failures
- Automatic retry with exponential backoff
- Supabase is source of truth

#### **Environment Variables**
```bash
ZOHO_CLIENT_ID=<client_id>
ZOHO_CLIENT_SECRET=<client_secret>
ZOHO_REFRESH_TOKEN=<refresh_token>
ZOHO_ORG_ID=882144792
ZOHO_REGION=US
```

#### **Rate Limits**
- **API Calls**: 1,000 requests/hour
- **Bulk Operations**: 100 records per call
- **Webhooks**: No limit

#### **Monitoring**
- Health check: `/api/cron/integrations-health-check`
- Sync logs: `zoho_sync_logs` table
- Failed syncs: Alert via email (daily digest)

---

### 6. **Zoho Sign** (Electronic Signatures)

**Version**: Zoho Sign v1 API
**Purpose**: E-signature for B2B contracts
**Status**: ✅ Active (Production)
**Website**: https://www.zoho.com/sign/

#### **Implementation**
**Location**: `lib/integrations/zoho/sign-service.ts`

```typescript
export class ZohoSignService {
  /**
   * Send contract for signature via Zoho Sign
   */
  async sendForSignature(contractData: ContractDataForSync): Promise<string> {
    const accessToken = await this.auth.getAccessToken()

    const signRequest = {
      requests: {
        request_name: `Contract ${contractData.contract_number}`,
        actions: [
          {
            action_type: 'SIGN',
            recipient_email: contractData.customer_email,
            recipient_name: contractData.customer_name,
            signing_order: 1,
          }
        ],
      },
      templates: {
        field_data: {
          field_text_data: {
            contract_number: contractData.contract_number,
            company_name: contractData.company_name,
            total_amount: contractData.total_amount,
          }
        }
      }
    }

    const response = await fetch('https://sign.zoho.com/api/v1/requests', {
      method: 'POST',
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(signRequest),
    })

    const result = await response.json()
    return result.requests.request_id
  }

  /**
   * Download signed contract
   */
  async downloadSignedContract(requestId: string): Promise<Buffer> {
    const accessToken = await this.auth.getAccessToken()

    const response = await fetch(
      `https://sign.zoho.com/api/v1/requests/${requestId}/pdf`,
      {
        headers: {
          'Authorization': `Zoho-oauthtoken ${accessToken}`,
        },
      }
    )

    return Buffer.from(await response.arrayBuffer())
  }
}
```

#### **Contract Workflow**
1. Quote approved → Contract generated (jsPDF)
2. Contract PDF uploaded to Supabase Storage
3. Contract sent to Zoho Sign API
4. Customer receives email with signature link
5. Customer signs via Zoho Sign portal
6. Webhook received: `/api/webhooks/zoho-sign`
7. Signed PDF downloaded
8. Signed PDF stored in Supabase Storage
9. Contract status updated to 'signed'
10. Invoice generation triggered

#### **Webhook Events**
| Event | Description | Handler |
|-------|-------------|---------|
| `request.signed` | Document fully signed | Update contract status, trigger invoice |
| `request.declined` | Recipient declined | Update status, notify admin |
| `request.expired` | Signature expired | Update status, send reminder |

#### **Environment Variables**
```bash
ZOHO_SIGN_CLIENT_ID=<client_id>
ZOHO_SIGN_CLIENT_SECRET=<client_secret>
ZOHO_SIGN_REFRESH_TOKEN=<refresh_token>
ZOHO_SIGN_WEBHOOK_SECRET=<webhook_secret>
```

#### **Rate Limits**
- **API Calls**: 500 requests/day
- **Document Uploads**: 20MB per document
- **Concurrent Signatures**: 50 requests

---

### 7. **Zoho Desk** (Customer Support)

**Version**: Zoho Desk v1 API
**Purpose**: Support ticket management
**Status**: 🚧 Planned (Q1 2025)
**Website**: https://www.zoho.com/desk/

#### **Planned Implementation**
**Location**: `lib/integrations/zoho/desk-service.ts`

```typescript
export class ZohoDeskService {
  /**
   * Create support ticket from customer dashboard
   */
  async createTicket(ticketData: CreateTicketPayload): Promise<string> {
    const accessToken = await this.auth.getAccessToken()

    const ticket = {
      subject: ticketData.subject,
      description: ticketData.description,
      priority: ticketData.priority,
      email: ticketData.customerEmail,
      departmentId: '1234567890', // Support department
      contactId: ticketData.zohoContactId,
    }

    const response = await fetch('https://desk.zoho.com/api/v1/tickets', {
      method: 'POST',
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json',
        'orgId': process.env.ZOHO_ORG_ID!,
      },
      body: JSON.stringify(ticket),
    })

    const result = await response.json()
    return result.id
  }
}
```

#### **Features** (Planned)
- Create tickets from customer dashboard
- Attach files/screenshots
- Email notifications
- Ticket status tracking
- Admin ticket management

---

## 🔐 Identity & Compliance

### 8. **Didit KYC** (Know Your Customer Verification)

**Version**: Didit v2 API
**Purpose**: B2B identity verification for quote-to-contract workflow
**Status**: ✅ Active (Production)
**Website**: https://www.didit.me/

#### **Implementation**
**Location**: `lib/integrations/didit/client.ts`

```typescript
export const diditClient: AxiosInstance = axios.create({
  baseURL: process.env.DIDIT_API_URL || 'https://verification.didit.me/v2',
  headers: {
    'x-api-key': process.env.DIDIT_API_KEY!,
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

/**
 * Create KYC verification session
 */
export async function createKYCSession(
  quoteId: string,
  flowType: DiditFlowType = 'kyb' // kyb = business, kyc = individual
): Promise<DiditSessionResponse> {
  const response = await diditClient.post<DiditV2CreateSessionResponse>('/sessions', {
    workflow_id: process.env.DIDIT_WORKFLOW_ID,
    vendor_data: quoteId,
    callback: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/didit`,
    flow_type: flowType,
  })

  return {
    sessionId: response.data.session_id,
    sessionToken: response.data.session_token,
    verificationUrl: response.data.url,
    status: mapDiditStatus(response.data.status),
  }
}

/**
 * Get KYC session status
 */
export async function getKYCSessionStatus(sessionId: string): Promise<DiditSessionStatusResponse> {
  const response = await diditClient.get<DiditV2SessionStatusResponse>(
    `/sessions/${sessionId}`
  )

  return {
    sessionId: response.data.session_id,
    status: mapDiditStatus(response.data.status),
    verificationResult: response.data.verification_result,
    riskScore: calculateRiskScore(response.data),
  }
}
```

#### **KYC Flow Types**
| Flow Type | Purpose | Documents Required |
|-----------|---------|-------------------|
| **KYB** (Business) | B2B quote verification | Company registration, directors' IDs, proof of address |
| **KYC** (Individual) | Consumer verification | ID document, selfie, proof of address |

#### **Risk Scoring** (Automatic)
```typescript
function calculateRiskScore(verificationData: DiditVerificationResult): {
  score: number
  tier: 'low' | 'medium' | 'high'
} {
  let score = 100

  // Deduct points for failed checks
  if (!verificationData.identity_verified) score -= 40
  if (!verificationData.address_verified) score -= 20
  if (!verificationData.document_authentic) score -= 30
  if (verificationData.watchlist_match) score -= 50

  // Determine tier
  let tier: 'low' | 'medium' | 'high'
  if (score >= 70) tier = 'low'       // Auto-approve
  else if (score >= 40) tier = 'medium' // Manual review
  else tier = 'high'                    // Auto-decline

  return { score, tier }
}
```

#### **Webhook Handler**
**Location**: `lib/integrations/didit/webhook-handler.ts`

```typescript
export async function handleDiditWebhook(payload: DiditWebhookPayload): Promise<void> {
  const { session_id, status, vendor_data: quoteId } = payload

  // Update KYC session in database
  await supabase
    .from('kyc_sessions')
    .update({
      status: mapDiditStatus(status),
      verification_result: payload.verification_result,
      risk_score: calculateRiskScore(payload.verification_result).score,
      risk_tier: calculateRiskScore(payload.verification_result).tier,
      completed_at: new Date().toISOString(),
    })
    .eq('session_id', session_id)

  // Update quote status
  const { score, tier } = calculateRiskScore(payload.verification_result)

  if (tier === 'low') {
    // Auto-approve
    await approveQuote(quoteId)
    await sendContractForSignature(quoteId)
  } else if (tier === 'medium') {
    // Manual review
    await sendAdminReviewNotification(quoteId)
  } else {
    // Auto-decline
    await declineQuote(quoteId)
    await sendDeclineEmail(quoteId)
  }
}
```

#### **Environment Variables**
```bash
DIDIT_API_KEY=<api_key>
DIDIT_API_SECRET=<api_secret>
DIDIT_WEBHOOK_SECRET=<webhook_secret>
DIDIT_WORKFLOW_ID=<workflow_id>
NEXT_PUBLIC_DIDIT_ENVIRONMENT=sandbox # or production
```

#### **Testing**
- **Sandbox Mode**: Use test documents and mock verification results
- **Test Workflow**: Separate workflow ID for testing
- **Demo**: Pre-filled test data for quick testing

#### **Compliance Thresholds**
```bash
KYC_LOW_RISK_THRESHOLD=70    # Auto-approve if score >= 70
KYC_HIGH_RISK_THRESHOLD=40   # Auto-decline if score < 40
KYC_MANUAL_REVIEW_ENABLED=true
```

---

### 9. **ICASA RICA** (South African Telecom Compliance)

**Version**: RICA API v1
**Purpose**: Regulatory compliance for SIM card activation
**Status**: 🚧 In Development (64% complete)
**Website**: https://www.icasa.org.za/

#### **Planned Implementation**
**Location**: `lib/integrations/rica/client.ts` (to be created)

```typescript
export class RICAService {
  /**
   * Submit RICA documentation for SIM activation
   */
  async submitRICADocuments(ricaData: RICASubmissionData): Promise<string> {
    const response = await fetch(`${RICA_API_BASE}/submissions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.ICASA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscriber_type: ricaData.subscriberType, // individual or business
        id_number: ricaData.idNumber,
        id_document_url: ricaData.idDocumentUrl,
        proof_of_address_url: ricaData.proofOfAddressUrl,
        selfie_url: ricaData.selfieUrl, // For liveness check
        sim_serial_number: ricaData.simSerial,
      }),
    })

    const result = await response.json()
    return result.submission_id
  }

  /**
   * Check RICA submission status
   */
  async checkRICAStatus(submissionId: string): Promise<RICAStatus> {
    const response = await fetch(`${RICA_API_BASE}/submissions/${submissionId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.ICASA_API_KEY}`,
      },
    })

    const result = await response.json()
    return {
      submissionId: result.submission_id,
      status: result.status, // pending, approved, rejected
      approvedAt: result.approved_at,
      rejectionReason: result.rejection_reason,
    }
  }
}
```

#### **Environment Variables** (Planned)
```bash
ICASA_API_KEY=<api_key>
ICASA_API_SECRET=<api_secret>
ICASA_WEBHOOK_SECRET=<webhook_secret>
NEXT_PUBLIC_ICASA_ENVIRONMENT=test # or production
```

#### **Implementation Timeline**
- **Q1 2025**: API integration
- **Q1 2025**: Automatic document upload from KYC session
- **Q1 2025**: Status tracking & notifications
- **Q2 2025**: Batch RICA submissions

---

## 📧 Communication Services

### 10. **Resend** (Transactional Email)

**Version**: Resend v1 API
**Purpose**: Transactional emails (order confirmations, notifications)
**Status**: ✅ Active (Production)
**Website**: https://resend.com/

#### **Implementation**
**Location**: `lib/email/resend-service.ts`

```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmation(order: Order): Promise<void> {
  await resend.emails.send({
    from: 'CircleTel <orders@circletel.co.za>',
    to: order.customer_email,
    subject: `Order Confirmation - ${order.order_id}`,
    react: OrderConfirmationEmail({ order }),
  })
}

/**
 * Send B2B quote email
 */
export async function sendQuoteEmail(quote: BusinessQuote): Promise<void> {
  await resend.emails.send({
    from: 'CircleTel Business <business@circletel.co.za>',
    to: quote.contact_email,
    subject: `Quote ${quote.quote_number} - CircleTel`,
    react: QuoteEmail({ quote }),
    attachments: [
      {
        filename: `Quote-${quote.quote_number}.pdf`,
        content: await generateQuotePDF(quote),
      },
    ],
  })
}
```

#### **Email Templates** (React Email)
**Location**: `emails/*.tsx`

| Template | Purpose | Variables |
|----------|---------|-----------|
| `order-confirmation.tsx` | Consumer order confirmation | Order details, payment info, tracking |
| `quote-email.tsx` | B2B quote | Quote PDF, pricing, validity |
| `kyc-notification.tsx` | KYC status updates | Verification status, next steps |
| `contract-signing.tsx` | E-signature request | Contract link, deadline |
| `invoice-email.tsx` | Invoice delivery | Invoice PDF, payment link |
| `payment-confirmation.tsx` | Payment receipt | Transaction details, invoice |
| `admin-notification.tsx` | Internal notifications | Order alerts, KYC reviews |

#### **Email Categories**
| Category | From Address | Purpose |
|----------|--------------|---------|
| Orders | `orders@circletel.co.za` | Consumer orders |
| Business | `business@circletel.co.za` | B2B quotes & contracts |
| Billing | `billing@circletel.co.za` | Invoices & payments |
| Support | `support@circletel.co.za` | Support tickets |
| Admin | `devadmin@notifications.circletelsa.co.za` | Internal notifications |

#### **Environment Variables**
```bash
RESEND_API_KEY=re_QhMu7F2n_JycLfeqNt8RNA692iWYcT6tM
NEXT_PUBLIC_APP_URL=https://circletel.co.za

# Admin Notification Recipients
SALES_TEAM_EMAIL=sales@circletel.co.za
SERVICE_DELIVERY_EMAIL=servicedelivery@circletel.co.za
MANAGEMENT_EMAIL=management@circletel.co.za
ACCOUNTING_EMAIL=accounting@circletel.co.za
ADMIN_CC_EMAILS=admin@circletel.co.za,operations@circletel.co.za
```

#### **Rate Limits**
- **Free Tier**: 100 emails/day
- **Pro Tier**: 50,000 emails/month
- **Enterprise**: Unlimited

#### **Deliverability**
- **DKIM/SPF**: Automatically configured
- **DMARC**: Configured for circletel.co.za
- **Bounce Handling**: Automatic bounce tracking
- **Spam Score**: Monitored via Resend dashboard

---

### 11. **Clickatell** (SMS Notifications)

**Version**: Clickatell Platform API v1
**Purpose**: SMS notifications for OTPs, alerts
**Status**: 🚧 Planned (Q1 2025)
**Website**: https://www.clickatell.com/

#### **Planned Implementation**
**Location**: `lib/integrations/clickatell/sms-service.ts`

```typescript
export class ClickatellService {
  private config: ClickatellConfig

  /**
   * Send SMS message
   */
  async sendSMS({ to, text }: SendSMSParams): Promise<SMSResponse> {
    const formattedPhone = this.formatPhoneNumber(to) // +27821234567

    const response = await fetch(this.config.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.config.apiKey,
      },
      body: JSON.stringify({
        messages: [
          {
            channel: 'sms',
            to: formattedPhone,
            content: text,
          }
        ]
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(`Clickatell error: ${data.error?.description}`)
    }

    return {
      success: true,
      messageId: data.messages[0].apiMessageId,
    }
  }

  /**
   * Send OTP via SMS
   */
  async sendOTP(phone: string, otp: string): Promise<void> {
    await this.sendSMS({
      to: phone,
      text: `Your CircleTel verification code is: ${otp}. Valid for 10 minutes.`,
    })
  }

  /**
   * Format phone number to international format
   */
  private formatPhoneNumber(phone: string): string {
    // Remove leading 0, add +27 (South Africa)
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.startsWith('0')) {
      return `+27${cleaned.slice(1)}`
    }
    if (cleaned.startsWith('27')) {
      return `+${cleaned}`
    }
    return `+27${cleaned}`
  }
}
```

#### **Use Cases** (Planned)
- OTP verification (login, password reset)
- Order status updates
- Payment confirmations
- Service activation notifications
- Support ticket updates

#### **Environment Variables** (Planned)
```bash
CLICKATELL_API_KEY=<api_key>
CLICKATELL_API_ID=<api_id>
CLICKATELL_BASE_URL=https://platform.clickatell.com/v1/message
```

#### **Rate Limits** (Planned)
- **API Requests**: 100 SMS/minute
- **Monthly Quota**: 10,000 SMS (starter plan)
- **Cost**: ~R0.15 per SMS (South Africa)

---

## 🗺️ Maps & Geolocation

### 12. **Google Maps Platform** (Maps & Geocoding)

**Version**: Google Maps JavaScript API v3
**Purpose**: Coverage checking, address autocomplete, map visualization
**Status**: ✅ Active (Production)
**Website**: https://developers.google.com/maps

#### **Implementation**
**Location**: `services/googleMaps.ts`

```typescript
import { Loader } from '@googlemaps/js-api-loader'

const loader = new Loader({
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  version: 'weekly',
  libraries: ['places', 'geometry'],
})

/**
 * Initialize Google Maps with lazy loading
 */
export async function loadGoogleMaps(): Promise<typeof google.maps> {
  await loader.load()
  return google.maps
}

/**
 * Geocode address to lat/lng coordinates
 */
export async function geocodeAddress(address: string): Promise<{
  lat: number
  lng: number
  formattedAddress: string
}> {
  const maps = await loadGoogleMaps()
  const geocoder = new maps.Geocoder()

  const result = await geocoder.geocode({ address })

  if (result.results.length === 0) {
    throw new Error('Address not found')
  }

  const { lat, lng } = result.results[0].geometry.location
  const formattedAddress = result.results[0].formatted_address

  return {
    lat: lat(),
    lng: lng(),
    formattedAddress,
  }
}

/**
 * Places Autocomplete for address input
 */
export function initAutocomplete(
  inputElement: HTMLInputElement,
  onPlaceSelected: (place: google.maps.places.PlaceResult) => void
): google.maps.places.Autocomplete {
  const autocomplete = new google.maps.places.Autocomplete(inputElement, {
    types: ['address'],
    componentRestrictions: { country: 'za' }, // South Africa only
  })

  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace()
    onPlaceSelected(place)
  })

  return autocomplete
}
```

#### **API Services Used**
| Service | Purpose | Usage |
|---------|---------|-------|
| **JavaScript API** | Map display, coverage visualization | Coverage map on homepage |
| **Places API** | Address autocomplete | Coverage checker, order forms |
| **Geocoding API** | Address → Lat/Lng | Coverage checking backend |
| **Geometry Library** | Distance calculations | Coverage area calculations |

#### **Coverage Checker Workflow**
1. User enters address (Places Autocomplete)
2. Frontend geocodes address (Google Maps Geocoding API)
3. Lat/lng sent to backend: `/api/coverage/lead`
4. Backend queries coverage APIs (MTN, providers)
5. Results displayed on map (Google Maps JavaScript API)

#### **Environment Variables**
```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyC-kOFKZqhhmLXgEjXV7upYs_l1s_h3VzU
GOOGLE_CLIENT_ID=<client_id>
GOOGLE_CLIENT_SECRET=<client_secret>
```

#### **API Restrictions** (Security)
- **HTTP Referrer Restrictions**: `*.circletel.co.za/*`, `localhost:3000/*`
- **API Restrictions**: JavaScript API, Places API, Geocoding API only
- **Daily Quota**: 25,000 requests/day
- **Cost**: $7/1,000 requests (after free tier: $200/month credit)

#### **Performance Optimization**
- Lazy loading (only load when needed)
- Code splitting (separate chunk for Google Maps)
- Map caching (cache geocoding results)
- Debounced autocomplete (reduce API calls)

---

## 📝 Content Management

### 13. **Sanity CMS** (Headless CMS)

**Version**: Sanity v7
**Purpose**: Primary CMS for blog, pages, products
**Status**: ✅ Active (Production)
**Website**: https://www.sanity.io/

#### **Implementation**
**Location**: `lib/sanity/client.ts`

```typescript
import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'

export const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: true, // Use CDN for production
})

/**
 * Image URL builder for Sanity images
 */
const builder = imageUrlBuilder(sanityClient)

export function urlFor(source: any) {
  return builder.image(source)
}

/**
 * Fetch blog posts with pagination
 */
export async function getBlogPosts(page: number = 1, limit: number = 10) {
  const offset = (page - 1) * limit

  const posts = await sanityClient.fetch(
    `*[_type == "post" && !(_id in path("drafts.**"))] | order(publishedAt desc) [${offset}...${offset + limit}] {
      _id,
      title,
      slug,
      publishedAt,
      excerpt,
      "author": author->name,
      "categories": categories[]->title,
      mainImage,
    }`
  )

  return posts
}

/**
 * Fetch single blog post by slug
 */
export async function getBlogPost(slug: string) {
  const post = await sanityClient.fetch(
    `*[_type == "post" && slug.current == $slug][0] {
      _id,
      title,
      slug,
      publishedAt,
      body,
      "author": author->{name, image},
      "categories": categories[]->title,
      mainImage,
    }`,
    { slug }
  )

  return post
}
```

#### **Content Types**
| Type | Purpose | Fields |
|------|---------|--------|
| **Post** | Blog articles | Title, slug, body (portable text), author, categories, image |
| **Page** | Static pages (About, Contact) | Title, slug, sections (flexible content) |
| **Product** | Product pages | Name, description, price, images, specs |
| **Author** | Blog authors | Name, bio, image, social links |
| **Category** | Content categorization | Title, description |

#### **Sanity Studio**
**Location**: `sanity-studio/`
**Access**: https://circletel.sanity.studio
**Deployed**: Vercel (separate deployment)

#### **Environment Variables**
```bash
NEXT_PUBLIC_SANITY_PROJECT_ID=<project_id>
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=<read_token>
SANITY_WEBHOOK_SECRET=<webhook_secret>
```

#### **Content Delivery**
- **CDN**: Sanity CDN (global edge network)
- **Image Optimization**: Automatic (Sanity Image API)
- **Revalidation**: On-demand ISR (Incremental Static Regeneration)
- **Webhooks**: Trigger Next.js revalidation on content updates

#### **Performance**
- **Cache**: CDN cache (1 hour)
- **Query Response**: <50ms (CDN)
- **Image Delivery**: <100ms (CDN)

---

### 14. **Strapi CMS** (Legacy Headless CMS)

**Version**: Strapi v4
**Purpose**: Legacy CMS (being phased out)
**Status**: ⚠️ Deprecated (Migration to Sanity in progress)
**Website**: https://strapi.io/

#### **Implementation**
**Location**: `lib/strapi/client.ts`

```typescript
import { createClient } from '@strapi/client'

export const strapiClient = createClient({
  baseURL: process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337',
  apiToken: process.env.STRAPI_API_TOKEN,
})

/**
 * Fetch products from Strapi
 */
export async function getStrapiProducts() {
  const response = await strapiClient.get('/products', {
    populate: '*',
  })

  return response.data
}
```

#### **Migration Plan**
- **Phase 1 (Q4 2024)**: Setup Sanity CMS ✅ Complete
- **Phase 2 (Q1 2025)**: Migrate blog content ⏳ In Progress
- **Phase 3 (Q1 2025)**: Migrate product content 🔜 Planned
- **Phase 4 (Q2 2025)**: Decommission Strapi 🔜 Planned

---

## 📊 Analytics & Monitoring

### 15. **Vercel Analytics** (Performance Monitoring)

**Version**: Vercel Analytics v1
**Purpose**: Real user monitoring, performance tracking
**Status**: ✅ Active (Production)
**Website**: https://vercel.com/analytics

#### **Implementation**
**Location**: `app/layout.tsx`

```typescript
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

#### **Metrics Tracked**
- **Core Web Vitals**: LCP, FID, CLS, TTFB, FCP
- **Page Views**: Route tracking, referrers
- **Custom Events**: Button clicks, form submissions
- **Performance**: Bundle size, load times

#### **Custom Events** (Optional)
```typescript
import { track } from '@vercel/analytics'

// Track custom events
track('Package Selected', {
  packageId: package.id,
  packageName: package.name,
  price: package.price,
})

track('Quote Requested', {
  quoteId: quote.id,
  companyName: quote.company_name,
})
```

#### **Dashboard**
Access: https://vercel.com/circletel/analytics

---

## 🧪 Development & Testing

### 16. **Playwright** (E2E Testing)

**Version**: Playwright 1.56.1
**Purpose**: End-to-end testing, browser automation
**Status**: ✅ Active (Development)
**Website**: https://playwright.dev/

#### **Implementation**
**Location**: `tests/e2e/*.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test('quote request flow', async ({ page }) => {
  // Navigate to quote page
  await page.goto('/business/quote')

  // Fill quote form
  await page.fill('input[name="company_name"]', 'Test Company')
  await page.fill('input[name="contact_email"]', 'test@example.com')
  await page.click('button[type="submit"]')

  // Verify quote created
  await expect(page).toHaveURL(/\/business\/quote\/QTE-\d{4}-\d{4}/)
  await expect(page.locator('h1')).toContainText('Quote Submitted')
})
```

#### **Test Suites**
| Suite | Files | Tests | Purpose |
|-------|-------|-------|---------|
| **Partner Registration** | `partner-registration.spec.ts` | 7 tests | Partner signup flow |
| **Quote Request** | `quote-request-flow.spec.ts` | 5 tests | B2B quote creation |
| **Coverage Checker** | `coverage-check.spec.ts` | 3 tests | Address coverage check |
| **Checkout** | `checkout-flow.spec.ts` | 8 tests | Order checkout |

#### **Configuration** (`playwright.config.ts`)
```typescript
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  use: {
    baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
})
```

#### **Commands**
```bash
# Run all tests
npx playwright test

# Run specific test file
npx playwright test tests/e2e/quote-request-flow.spec.ts

# Run in UI mode
npx playwright test --ui

# Generate test code (codegen)
npx playwright codegen http://localhost:3000
```

---

## 🏥 Integration Health Monitoring

### **Health Check System**

**Location**: `lib/integrations/health-check-service.ts`
**Cron Job**: `/api/cron/integrations-health-check` (every 30 minutes)

```typescript
export interface IntegrationHealthStatus {
  integration: string
  status: 'healthy' | 'degraded' | 'down'
  lastCheck: string
  responseTime: number
  errorMessage?: string
}

export async function checkIntegrationHealth(): Promise<IntegrationHealthStatus[]> {
  const checks = await Promise.allSettled([
    checkSupabaseHealth(),
    checkNetcashHealth(),
    checkZohoHealth(),
    checkDiditHealth(),
    checkResendHealth(),
    checkGoogleMapsHealth(),
  ])

  return checks.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value
    } else {
      return {
        integration: integrationNames[index],
        status: 'down',
        lastCheck: new Date().toISOString(),
        responseTime: 0,
        errorMessage: result.reason.message,
      }
    }
  })
}

/**
 * Check Supabase health
 */
async function checkSupabaseHealth(): Promise<IntegrationHealthStatus> {
  const startTime = Date.now()

  try {
    const { error } = await supabase
      .from('integration_health')
      .select('*')
      .limit(1)

    if (error) throw error

    return {
      integration: 'Supabase',
      status: 'healthy',
      lastCheck: new Date().toISOString(),
      responseTime: Date.now() - startTime,
    }
  } catch (error) {
    return {
      integration: 'Supabase',
      status: 'down',
      lastCheck: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      errorMessage: error.message,
    }
  }
}
```

### **Health Check Dashboard**
**Location**: `/admin/integrations`

Displays:
- Integration status (🟢 healthy, 🟡 degraded, 🔴 down)
- Last check timestamp
- Response time (ms)
- Error messages
- Historical uptime (7 days, 30 days)

### **Alert System**
- **Email Alerts**: Sent to `MANAGEMENT_EMAIL` when integration goes down
- **Slack Alerts**: (planned) Post to #alerts channel
- **Auto-Retry**: Failed health checks retry 3 times before alerting

---

## 🔐 Security & Authentication

### **OAuth 2.0 Flows**

#### **Zoho OAuth**
```
1. Initial Authorization (one-time)
   ↓
2. User approves CircleTel access
   ↓
3. Zoho returns authorization code
   ↓
4. Exchange code for refresh token
   ↓
5. Store refresh token in env vars
   ↓
6. On each API call:
   - Exchange refresh token for access token
   - Cache access token (1 hour)
   - Use access token in Authorization header
```

**Token Storage**:
- Refresh tokens: Environment variables (never in database)
- Access tokens: In-memory cache or Redis (1 hour TTL)

#### **Google OAuth** (Future)
Similar flow for Google APIs (Maps, Calendar, etc.)

### **API Key Management**

| Integration | Auth Method | Key Rotation |
|-------------|-------------|--------------|
| Supabase | Service role key | Manual (annual) |
| NetCash | Service key + PCI vault key | Manual (quarterly) |
| Zoho | OAuth refresh token | Automatic (no expiry) |
| Didit | API key (x-api-key header) | Manual (annual) |
| Resend | API key (Bearer token) | Manual (bi-annual) |
| Clickatell | API key (Authorization header) | Manual (bi-annual) |
| Google Maps | API key (restricted) | Manual (annual) |

### **Webhook Security** (HMAC-SHA256)

All webhooks use HMAC-SHA256 signature verification:

```typescript
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  )
}
```

**Webhook Secrets**:
```bash
NETCASH_WEBHOOK_SECRET=<secret>
DIDIT_WEBHOOK_SECRET=<secret>
ZOHO_SIGN_WEBHOOK_SECRET=<secret>
ZOHO_CRM_WEBHOOK_SECRET=<secret>
WEBHOOK_MASTER_SECRET=<master_secret>
```

---

## ⏱️ Rate Limiting & Quotas

### **Rate Limiter Implementation**
**Location**: `lib/integrations/zoho/rate-limiter.ts`

```typescript
export class RateLimiter {
  private tokens: Map<string, number> = new Map()
  private lastRefill: Map<string, number> = new Map()

  async acquireToken(service: string): Promise<void> {
    const now = Date.now()
    const limit = this.getLimitForService(service)
    const refillRate = this.getRefillRateForService(service)

    // Refill tokens
    const lastRefillTime = this.lastRefill.get(service) || now
    const timeSinceRefill = now - lastRefillTime
    const tokensToAdd = Math.floor(timeSinceRefill / refillRate)

    let currentTokens = this.tokens.get(service) || limit
    currentTokens = Math.min(currentTokens + tokensToAdd, limit)

    // Check if token available
    if (currentTokens <= 0) {
      const waitTime = refillRate - (timeSinceRefill % refillRate)
      await sleep(waitTime)
      return this.acquireToken(service)
    }

    // Consume token
    this.tokens.set(service, currentTokens - 1)
    this.lastRefill.set(service, now)
  }

  private getLimitForService(service: string): number {
    const limits = {
      'zoho-crm': 100, // 100 requests per hour
      'zoho-billing': 50, // 50 requests per hour
      'netcash': 100, // 100 requests per minute
      'didit': 50, // 50 requests per minute
    }
    return limits[service] || 60
  }
}

export default new RateLimiter()
```

### **Integration Rate Limits**

| Integration | Limit | Period | Burst | Enforcement |
|-------------|-------|--------|-------|-------------|
| **Supabase** | 15 connections | Concurrent | N/A | Connection pool |
| **NetCash** | 100 requests | /minute | 20 | Custom limiter |
| **Zoho CRM** | 5,000 credits | /day | 100 | Token bucket |
| **Zoho Billing** | 1,000 requests | /hour | 50 | Token bucket |
| **Zoho Sign** | 500 requests | /day | 20 | Token bucket |
| **Didit** | 50 requests | /minute | 10 | Custom limiter |
| **Resend** | 50,000 emails | /month | 100/min | Provider |
| **Google Maps** | 25,000 requests | /day | 100/sec | Provider |

### **Quota Monitoring**

```typescript
// Track API usage
await supabase
  .from('api_rate_limits')
  .insert({
    api_key: 'zoho-crm',
    endpoint: '/crm/v2/Quotes',
    request_count: 1,
    reset_at: new Date(Date.now() + 3600000), // 1 hour
  })

// Alert when approaching limit
const usage = await getAPIUsage('zoho-crm')
if (usage.percentage > 80) {
  await sendRateLimitAlert('zoho-crm', usage)
}
```

---

## 🐛 Troubleshooting

### **Common Issues**

#### **1. Supabase Connection Errors**
```
Error: connect ETIMEDOUT
```
**Solution**:
- Check Supabase dashboard for outages
- Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
- Check network/firewall blocking port 5432

#### **2. NetCash Payment Failures**
```
Error: Invalid signature
```
**Solution**:
- Verify `NETCASH_WEBHOOK_SECRET` matches admin UI setting
- Check webhook payload is not modified in transit
- Ensure request body is read as raw text (not parsed)

#### **3. Zoho OAuth Errors**
```
Error: invalid_token
```
**Solution**:
- Refresh token may have expired (check Zoho console)
- Regenerate refresh token via OAuth flow
- Update `ZOHO_REFRESH_TOKEN` in environment

#### **4. Google Maps API Errors**
```
Error: RefererNotAllowedMapError
```
**Solution**:
- Add current domain to API key restrictions in Google Cloud Console
- Verify `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is correct
- Check billing is enabled in Google Cloud Console

#### **5. Didit KYC Session Errors**
```
Error: Workflow not found
```
**Solution**:
- Verify `DIDIT_WORKFLOW_ID` exists in Didit dashboard
- Check workflow is published (not draft)
- Ensure environment (sandbox/production) matches

### **Debug Mode**

Enable debug logging for integrations:

```bash
# .env.local
DEBUG=true
LOG_LEVEL=debug
ZOHO_DEBUG=true
NETCASH_DEBUG=true
```

View logs:
```bash
# Development
npm run dev:memory

# Production
vercel logs --follow
```

### **Support Contacts**

| Integration | Support Channel | Response Time |
|-------------|----------------|---------------|
| Supabase | Dashboard → Support | <24 hours |
| Vercel | support@vercel.com | <24 hours |
| NetCash | support@netcash.co.za | <48 hours |
| Zoho | support@zohocorp.com | <48 hours |
| Didit | support@didit.me | <48 hours |
| Resend | support@resend.com | <24 hours |
| Google Cloud | Cloud Console → Support | <24 hours (paid) |

---

## 📚 Additional Resources

### **API Documentation**
- **Supabase**: https://supabase.com/docs/reference/javascript/introduction
- **NetCash Pay Now**: https://netcash.co.za/developers/paynow
- **Zoho CRM**: https://www.zoho.com/crm/developer/docs/api/v2/
- **Zoho Billing**: https://www.zoho.com/billing/api/v1/
- **Zoho Sign**: https://www.zoho.com/sign/api/
- **Didit**: https://docs.didit.me/
- **Resend**: https://resend.com/docs
- **Google Maps**: https://developers.google.com/maps/documentation

### **Integration Code Examples**
- **Zoho CRM Sync**: `lib/integrations/zoho/customer-sync-service.ts`
- **NetCash Payment**: `lib/payment/netcash-service.ts`
- **Didit KYC**: `lib/integrations/didit/session-manager.ts`
- **Email Templates**: `emails/*.tsx`

---

**End of Document**

---

*This document provides comprehensive details for all third-party integrations used in the CircleTel platform. Keep it updated as new integrations are added or existing ones are modified.*

*For questions or updates to this document, contact the Development Team or Claude Code.*
