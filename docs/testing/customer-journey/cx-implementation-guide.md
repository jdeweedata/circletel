# Customer Experience (CX) Implementation Guide
**Unified Strategy: Journey Optimization + Zoho Integration**

**Document Version:** 1.0
**Created:** 2025-10-04
**Author:** Claude Code Analysis
**Purpose:** Comprehensive guide combining UX improvements with backend automation via Zoho One

---

## Executive Summary

This document unifies two critical initiatives for CircleTel:

1. **Journey Optimization** - Eliminating friction points in the customer journey from coverage check to order completion
2. **Backend Automation** - Integrating Zoho CRM CPQ + Zoho Billing for quote-to-cash automation

**Combined Impact:**
- **Conversion Rate:** 18% → 33.6% (+87% improvement)
- **Automation:** Manual quote generation → Automated CPQ with hosted checkout
- **Business Scalability:** Enable B2B sales with proper quoting, SLAs, and CRM tracking
- **Revenue Growth:** Better lead nurturing + upsell automation = higher LTV

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Target End-to-End Flow](#2-target-end-to-end-flow)
3. [Implementation Phases](#3-implementation-phases)
4. [Data Model & Mapping](#4-data-model--mapping)
5. [Technical Integration](#5-technical-integration)
6. [Frontend Improvements](#6-frontend-improvements)
7. [Automation & Webhooks](#7-automation--webhooks)
8. [Testing Strategy](#8-testing-strategy)
9. [Success Metrics](#9-success-metrics)
10. [Risk Mitigation](#10-risk-mitigation)

---

## 1. Current State Analysis

### 1.1 Critical Friction Points

**🔴 High Priority Issues:**

1. **Redirect Loop at Order Entry** ([app/order/page.tsx:14](../app/order/page.tsx#L14))
   - Unnecessary redirect from `/order` → `/order/coverage`
   - Impact: Poor perceived performance, SEO issues, confusing analytics

2. **Multiple Duplicated Order Flows**
   - Generic: `/packages/{leadId}` → `/order`
   - Home Internet: `/home-internet/order`
   - Wireless: `/wireless/order`
   - Impact: ~800 lines of duplicated code, inconsistent UX

3. **No Business Customer Differentiation**
   - Business leads use same consumer flow
   - No quote generation capability
   - No SLA/support tier options
   - Impact: Lost enterprise revenue, inappropriate messaging

4. **Manual Quote & Subscription Management**
   - No automated quoting system
   - No CPQ for complex packages/bundles
   - Manual subscription tracking
   - Impact: Sales bottleneck, errors, slow time-to-revenue

### 1.2 Current Conversion Funnel

```
Coverage Check → Package View: 75%
Package View → Order Start: 40% ⚠️ (Low)
Order Start → Order Complete: 60%
Overall Conversion: 18%
```

**Key Bottleneck:** Package selection to order initiation (-35% drop-off)

---

## 2. Target End-to-End Flow

### 2.1 Consumer Journey (Automated)

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Coverage Check (Next.js Frontend)                           │
│    - User enters address                                        │
│    - Geocode + create lead in Supabase                         │
│    - Check MTN coverage via API                                 │
│    - Push lead to Zoho CRM (Lead record)                       │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Package Selection (Next.js Frontend)                        │
│    - Display available packages with filtering                 │
│    - User clicks "Get this deal"                               │
│    - Floating CTA appears: "Continue with {Package} →"         │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. Quote Generation (Zoho CPQ)                                 │
│    POST /api/cpq/quote                                         │
│    - Convert Lead → Contact/Account in Zoho CRM               │
│    - Create Deal (optional) with selected package              │
│    - Create Quote with line items                              │
│    - CPQ auto-adds: router, installation, mandatory add-ons    │
│    - Apply pricing rules, discounts, taxes                     │
│    - Return Quote ID + line items                              │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. Checkout (Zoho Billing Hosted Page)                        │
│    POST /api/billing/hosted-page                               │
│    - Create Hosted Page with quote details                     │
│    - Redirect user to Zoho-hosted PCI-compliant checkout      │
│    - User enters payment details (NOT stored in CircleTel)    │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. Payment & Subscription (Zoho Billing)                      │
│    - User completes payment                                    │
│    - Zoho Billing creates Subscription                         │
│    - Subscription status: "active"                             │
│    - Webhook → POST /api/billing/webhook                       │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. Provisioning (Next.js Backend + Supabase)                  │
│    - Webhook handler:                                          │
│      * Verify webhook signature                                │
│      * Update order status → "Paid"                            │
│      * Update CRM Deal → "Closed Won"                          │
│      * Update CRM Quote → "Accepted"                           │
│      * Create service record in Supabase                       │
│      * Send welcome email (Resend)                             │
│      * Trigger provisioning workflow                           │
└─────────────────────────────────────────────────────────────────┘
```

**Key Benefits:**
- ✅ Zero card data in CircleTel database (PCI compliance)
- ✅ Automated subscription management
- ✅ CPQ handles complex bundling rules
- ✅ Single source of truth (Zoho CRM + Billing)

### 2.2 Business Journey (Sales-Assisted)

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Business Landing Page (/business)                          │
│    - B2B-focused hero (SLA, uptime, scalability)               │
│    - Company size/type qualification                           │
│    - Coverage check with business context                      │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Business Package Selection                                  │
│    - Display business packages (SLA tiers, multi-site)         │
│    - CTA: "Request Quote" (not "Order Now")                    │
│    - Capture requirements: bandwidth, sites, support level     │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. Lead Qualification & Quote Generation                      │
│    POST /api/cpq/quote (business variant)                     │
│    - Create Account + Contact in Zoho CRM                      │
│    - Create Deal with "Qualification" stage                    │
│    - Generate Quote with:                                      │
│      * Base package + add-ons                                  │
│      * Multi-site pricing (if applicable)                      │
│      * Contract terms (12/24-month)                            │
│      * Payment terms (Net 30/60)                               │
│    - Assign to sales rep (CRM assignment rules)                │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. Sales Engagement                                            │
│    - Sales rep receives CRM notification                       │
│    - Refine quote based on discovery call                      │
│    - Send Quote PDF via email (Zoho CRM)                       │
│    - Track engagement (opens, clicks)                          │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. Quote Acceptance & Contract                                │
│    - Customer accepts quote (e-signature via Zoho Sign)        │
│    - CRM updates Deal → "Closed Won"                           │
│    - For immediate start: create Subscription in Billing       │
│    - For custom terms: manual provisioning by ops team         │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. Provisioning & Onboarding                                  │
│    - Account manager assigned (CRM workflow)                   │
│    - Provisioning team creates service records                 │
│    - Technical onboarding call scheduled                       │
│    - SLA monitoring enabled                                    │
└─────────────────────────────────────────────────────────────────┘
```

**Key Benefits:**
- ✅ Proper B2B sales process
- ✅ Quote versioning and approval workflow
- ✅ Contract management
- ✅ Account manager assignment

---

## 3. Implementation Phases

### Phase 1: Immediate Wins (Weeks 1-4)
**Goal:** Fix critical friction points, increase conversion by 20%

#### Frontend Fixes
- [ ] **Remove order page redirect loop**
  - Delete `app/order/page.tsx` or replace with direct form
  - Update all "Get this deal" links to correct destination
  - File: [app/order/page.tsx](../app/order/page.tsx)

- [ ] **Add floating CTA after package selection**
  - Modify `CoverageChecker.tsx` to show sticky bottom bar
  - Label: "Continue with {Package Name} →"
  - File: [components/coverage/CoverageChecker.tsx](../components/coverage/CoverageChecker.tsx)

- [ ] **Add 3-stage progress indicator to coverage check**
  - Step 1: "Finding location..."
  - Step 2: "Checking coverage..."
  - Step 3: "Loading packages..."
  - Reduces perceived load time

#### Backend Setup
- [ ] **Track lead source and customer type**
  - Update `/api/coverage/lead` to include:
    - `customer_type` (residential/business)
    - `utm_source`, `utm_medium`, `utm_campaign`
    - Optional phone number field
  - File: [app/api/coverage/lead/route.ts](../app/api/coverage/lead/route.ts)

**Success Metrics:**
- Package View → Order Start conversion: 40% → 60% (+50%)
- Overall conversion: 18% → 25%

---

### Phase 2: Zoho Foundation (Weeks 5-8)
**Goal:** Establish Zoho integration for automated quoting

#### Platform & Security
- [ ] **Register OAuth clients in Zoho**
  - Create Server-based "Self Client" for backend API
  - Store refresh token securely (Supabase secrets)
  - Reference: [Zoho OAuth Setup](https://www.zoho.com/accounts/protocol/oauth-setup.html)

- [ ] **Implement OAuth 2.0 token service**
  - Create `/lib/zoho/auth.ts`
  - Refresh flow + token cache (Redis or memory)
  - Reference: [Zoho CRM V8 OAuth](https://www.zoho.com/crm/developer/docs/api/v8/oauth-overview.html)

#### CRM CPQ Configuration
- [ ] **Define Products & Price Books in CRM**
  - All CircleTel packages (Home, Business, Enterprise)
  - Add-ons (Static IP, Replify, Support tiers)
  - Reference: [CPQ Price Books](https://www.zoho.com/crm/sales-force-automation/cpq.html)

- [ ] **Configure CPQ rules**
  - Mandatory add-ons (e.g., router with 100 Mbps)
  - Compatibility rules (e.g., Replify requires 20+ Mbps)
  - Auto-bundling (installation fee waiver on 12-month contracts)
  - Speed → router SKU mapping
  - Reference: [CPQ How It Works](https://help.zoho.com/portal/en/kb/crm/cpq/articles/how-it-works)

- [ ] **Create Quote templates**
  - Consumer template (simple, payment link)
  - Business template (detailed, terms & conditions)

#### API Development
- [ ] **Build `/app/api/crm/upsert-customer/route.ts`**
  - Convert Supabase lead → Zoho Lead/Contact/Account
  - Handle duplicates (search by email/phone)
  - Return Zoho record IDs

- [ ] **Build `/app/api/cpq/quote/route.ts`**
  - Create Deal (optional) with selected package
  - Create Quote with line items
  - CPQ auto-adds required products
  - Return Quote ID + line items summary
  - Reference: [Create Quote from Deal](https://www.zoho.com/crm/resources/solutions/create-quotes-with-products-prefilled-from-their-deal.html)

**Success Metrics:**
- Quote generation time: <3 seconds
- CPQ rule accuracy: 100% (no manual corrections)
- Quote-to-order conversion: >70%

---

### Phase 3: Payment Integration (Weeks 9-12)
**Goal:** Enable automated checkout and subscription management

#### Zoho Billing Setup
- [ ] **Configure Zoho Billing**
  - Create Plans (map to CircleTel packages)
  - Add-ons (Static IP, Replify, etc.)
  - Payment gateway integration (Stripe/PayFast/Netcash)
  - Tax configuration (VAT 15%)

- [ ] **Build `/app/api/billing/hosted-page/route.ts`**
  - Create Hosted Page with quote/subscription details
  - Return redirect URL for PCI-compliant checkout
  - Reference: [Hosted Pages API](https://www.zoho.com/billing/api/v1/hosted-pages/)

- [ ] **Build `/app/api/billing/webhook/route.ts`**
  - Receive subscription/payment events:
    - `subscription_created`
    - `payment_success`
    - `payment_failed`
    - `subscription_activated`
    - `subscription_canceled`
  - Verify webhook signature
  - Update Supabase order status
  - Update CRM Deal/Quote stage
  - Trigger provisioning
  - Reference: [Subscriptions API](https://www.zoho.com/billing/api/v1/subscription/)

#### Frontend Integration
- [ ] **Update package selection flow**
  - On "Get this deal" click:
    1. Call `/api/cpq/quote` (creates Quote)
    2. Call `/api/billing/hosted-page` (gets checkout URL)
    3. `router.push(hostedPageUrl)` (redirect to Zoho)
  - File: [components/coverage/CoverageChecker.tsx](../components/coverage/CoverageChecker.tsx)

- [ ] **Add order confirmation page**
  - Return URL after payment: `/order/confirm?subscription={id}`
  - Display subscription details
  - Download invoice/receipt
  - Next steps (provisioning timeline)

**Success Metrics:**
- Checkout abandonment rate: <20%
- Payment success rate: >95%
- Time to subscription activation: <5 minutes

---

### Phase 4: Business Journey (Weeks 13-16)
**Goal:** Enable B2B sales with proper quoting and CRM workflow

#### Frontend Development
- [ ] **Create `/app/business/page.tsx` landing page**
  - B2B hero section (SLA, uptime, scalability messaging)
  - Company size/type qualification form
  - Coverage checker (business context)
  - Business package grid

- [ ] **Implement B2B package filtering**
  - Separate consumer vs business packages
  - Filter by: SLA tier, multi-site support, bandwidth
  - Display: Monthly price + setup fee + contract terms

- [ ] **Replace CTA: "Get this deal" → "Request Quote"**
  - No immediate payment redirect
  - Capture additional requirements:
    - Number of locations
    - Expected bandwidth usage
    - Support level required (business hours/24x7)

#### Backend Development
- [ ] **Build multi-step quote builder API**
  - Step 1: Company details (size, industry)
  - Step 2: Locations (multi-site addresses)
  - Step 3: Requirements (bandwidth, SLA, support)
  - Step 4: Generate comprehensive quote

- [ ] **Implement lead routing**
  - Consumer leads → Auto-provisioning pipeline
  - Small business (<10 employees) → Inside sales queue
  - Enterprise (50+ employees) → Account manager assignment
  - CRM assignment rules based on company size/revenue potential

#### CRM Workflows
- [ ] **Configure Zoho CRM workflows**
  - Business quote request → Notify sales rep
  - Quote sent → Schedule follow-up task (2 days)
  - Quote accepted → Create provisioning ticket
  - Quote declined → Add to nurture campaign

**Success Metrics:**
- Business lead capture rate: >60%
- Quote-to-close rate: >25% (industry standard: 20-30%)
- Average deal size: R5,000+/month

---

### Phase 5: Optimization (Weeks 17-24)
**Goal:** Consolidate flows, A/B test, improve automation

#### Code Consolidation
- [ ] **Create unified order form component**
  - New file: `components/order/UnifiedOrderForm.tsx`
  - Support variants: `home-internet | wireless | business`
  - Single source of truth for order logic
  - Reduces ~800 lines of duplicated code

- [ ] **Add consistent progress indicator UI**
  - Match Home Internet & Wireless progress bars
  - Steps: Info → Verification → Payment → Confirmation

#### Advanced Features
- [ ] **Multi-step quote builder for enterprise**
  - Step 1: Company details
  - Step 2: Locations (CSV upload for multi-site)
  - Step 3: Requirements (bandwidth, SLA, support)
  - Step 4: Quote PDF download

- [ ] **Smart lead routing**
  - ML-based lead scoring (optional)
  - Automatic assignment based on geography, company size
  - Round-robin for equal distribution

- [ ] **Live chat integration**
  - Business pages: trigger chat widget
  - Business hours → sales agent
  - After hours → chatbot + quote request capture

#### A/B Testing
- [ ] **Test package presentation**
  - Grid vs list view
  - Price-first vs feature-first
  - CTA text: "Get this deal" vs "Select package" vs "Order now"
  - Pricing display: "From R399" vs "R399/month"

- [ ] **Test checkout flow**
  - Single-page vs multi-step checkout
  - Guest checkout vs mandatory account creation
  - Add-on presentation timing

**Success Metrics:**
- Code maintainability: -60% duplicate code
- A/B test winners identified and implemented
- Overall conversion: 30%+ sustained

---

## 4. Data Model & Mapping

### 4.1 CircleTel → Zoho Mapping

| CircleTel Layer | Zoho Module | Notes |
|-----------------|-------------|-------|
| `coverage_leads` (Supabase) | CRM **Leads** | Initial capture, push to CRM immediately |
| Customer (consumer) | CRM **Contacts** + optional **Account** | For B2B always create Account |
| Customer (business) | CRM **Accounts** + **Contacts** | Account = company, Contact = decision maker |
| Selected package | CRM **Products** / **Price Books** | Manage pricing tiers here |
| Bundle/kit | Zoho **Inventory Composite Items** (optional) | BOM-style bundles |
| Quote | CRM **Quotes** + **Quoted Line Items** | CPQ auto-adds mandatory items |
| Order | Supabase `orders` + Zoho **Deal** | Deal tracks sales progress |
| Subscription | **Zoho Billing Subscription** | Recurring billing, invoicing |
| Invoice | **Zoho Billing Invoices** | Auto-generated monthly |
| Payment | **Zoho Billing Payments** | Linked to subscriptions |

### 4.2 Database Schema Updates

```sql
-- Extend coverage_leads for better tracking
ALTER TABLE coverage_leads
ADD COLUMN customer_type VARCHAR(20) DEFAULT 'residential', -- residential/business
ADD COLUMN company_name VARCHAR(255),
ADD COLUMN company_size VARCHAR(50), -- 1-10, 11-50, 51-200, 201+
ADD COLUMN property_type VARCHAR(50), -- house, apartment, business, complex
ADD COLUMN phone_number VARCHAR(20),
ADD COLUMN utm_source VARCHAR(100),
ADD COLUMN utm_medium VARCHAR(100),
ADD COLUMN utm_campaign VARCHAR(100),
ADD COLUMN referrer_url TEXT,
ADD COLUMN zoho_lead_id VARCHAR(100), -- Zoho CRM Lead ID
ADD COLUMN zoho_contact_id VARCHAR(100), -- Zoho CRM Contact ID
ADD COLUMN zoho_account_id VARCHAR(100); -- Zoho CRM Account ID (for business)

-- Orders table with Zoho references
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES coverage_leads(id),
  customer_id UUID REFERENCES customers(id),

  -- Package details
  package_id UUID REFERENCES product_packages(id),
  package_name VARCHAR(255),
  package_price DECIMAL(10,2),
  contract_period VARCHAR(20),

  -- Zoho references
  zoho_deal_id VARCHAR(100),
  zoho_quote_id VARCHAR(100),
  zoho_subscription_id VARCHAR(100),

  -- Order status
  status VARCHAR(50) DEFAULT 'pending', -- pending, quote_sent, payment_pending, paid, provisioning, active, canceled
  payment_status VARCHAR(50), -- pending, processing, paid, failed, refunded

  -- Pricing
  subtotal DECIMAL(10,2),
  tax DECIMAL(10,2),
  total DECIMAL(10,2),

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  paid_at TIMESTAMP,
  provisioned_at TIMESTAMP
);

-- Order line items (for add-ons)
CREATE TABLE order_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,

  item_type VARCHAR(50), -- package, addon, fee
  item_name VARCHAR(255),
  item_sku VARCHAR(100),

  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2),
  discount DECIMAL(10,2) DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2),

  -- Zoho reference
  zoho_line_item_id VARCHAR(100),

  created_at TIMESTAMP DEFAULT NOW()
);

-- Subscription tracking
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  customer_id UUID REFERENCES customers(id),

  -- Zoho reference
  zoho_subscription_id VARCHAR(100) UNIQUE NOT NULL,
  zoho_plan_id VARCHAR(100),

  -- Subscription details
  status VARCHAR(50), -- trial, active, non_renewing, paused, canceled, expired
  billing_cycle VARCHAR(20), -- monthly, annually
  next_billing_date DATE,
  current_term_start DATE,
  current_term_end DATE,

  -- Pricing
  mrr DECIMAL(10,2), -- Monthly Recurring Revenue

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  activated_at TIMESTAMP,
  canceled_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Webhook events log
CREATE TABLE zoho_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id VARCHAR(100) UNIQUE, -- Zoho event ID for deduplication
  event_type VARCHAR(100), -- subscription_created, payment_success, etc.
  module VARCHAR(50), -- billing, crm

  payload JSONB,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP,
  error TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 5. Technical Integration

### 5.1 Zoho Authentication Service

**File:** `lib/zoho/auth.ts`

```typescript
import { createClient } from '@supabase/supabase-js'

const ZOHO_ACCOUNTS_URL = process.env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.com'
const ZOHO_API_DOMAIN = process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.com'

interface ZohoTokenResponse {
  access_token: string
  expires_in: number
  api_domain: string
  token_type: string
}

class ZohoAuthService {
  private accessToken: string | null = null
  private tokenExpiry: number = 0

  /**
   * Get a valid access token (refresh if needed)
   */
  async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken
    }

    return this.refreshAccessToken()
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(): Promise<string> {
    const response = await fetch(`${ZOHO_ACCOUNTS_URL}/oauth/v2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: process.env.ZOHO_REFRESH_TOKEN!,
        client_id: process.env.ZOHO_CLIENT_ID!,
        client_secret: process.env.ZOHO_CLIENT_SECRET!,
        grant_type: 'refresh_token'
      })
    })

    if (!response.ok) {
      throw new Error(`Zoho auth failed: ${response.statusText}`)
    }

    const data: ZohoTokenResponse = await response.json()

    this.accessToken = data.access_token
    this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000 // 1 min buffer

    return this.accessToken
  }

  /**
   * Make authenticated API request to Zoho
   */
  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getAccessToken()

    const response = await fetch(`${ZOHO_API_DOMAIN}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Zoho-oauthtoken ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Zoho API error: ${response.status} - ${error}`)
    }

    return response.json()
  }
}

export const zohoAuth = new ZohoAuthService()
```

### 5.2 CPQ Quote Generation

**File:** `app/api/cpq/quote/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { zohoAuth } from '@/lib/zoho/auth'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      leadId,
      packageId,
      addons = [],
      contractPeriod = 'month_to_month'
    } = body

    const supabase = createClient()

    // 1. Get lead details from Supabase
    const { data: lead, error: leadError } = await supabase
      .from('coverage_leads')
      .select('*')
      .eq('id', leadId)
      .single()

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // 2. Create/update Contact in Zoho CRM
    const contactPayload = {
      data: [{
        First_Name: lead.first_name,
        Last_Name: lead.last_name,
        Email: lead.email,
        Phone: lead.phone_number,
        Mailing_Street: lead.address,
        Lead_Source: lead.utm_source || 'Website',
        Customer_Type: lead.customer_type || 'residential'
      }]
    }

    const contactResponse = await zohoAuth.request('/crm/v8/Contacts/upsert', {
      method: 'POST',
      body: JSON.stringify(contactPayload)
    })

    const contactId = contactResponse.data[0].details.id

    // 3. Update Supabase with Zoho Contact ID
    await supabase
      .from('coverage_leads')
      .update({ zoho_contact_id: contactId })
      .eq('id', leadId)

    // 4. Get package details
    const { data: pkg } = await supabase
      .from('product_packages')
      .select('*')
      .eq('id', packageId)
      .single()

    // 5. Create Quote in CRM (CPQ will auto-add required items)
    const quotePayload = {
      data: [{
        Subject: `Quote for ${pkg.package_name}`,
        Contact_Name: contactId,
        Quote_Stage: 'Draft',
        Product_Details: [
          {
            product: { id: pkg.zoho_product_id }, // Map package to Zoho Product
            quantity: 1,
            list_price: pkg.price,
            Contract_Period: contractPeriod
          },
          ...addons.map(addon => ({
            product: { id: addon.zoho_product_id },
            quantity: 1,
            list_price: addon.price
          }))
        ]
      }]
    }

    const quoteResponse = await zohoAuth.request('/crm/v8/Quotes', {
      method: 'POST',
      body: JSON.stringify(quotePayload)
    })

    const quoteId = quoteResponse.data[0].details.id

    // 6. Get full quote details (CPQ may have added items)
    const quoteDetails = await zohoAuth.request(`/crm/v8/Quotes/${quoteId}`)

    // 7. Create order record in Supabase
    const { data: order } = await supabase
      .from('orders')
      .insert({
        lead_id: leadId,
        package_id: packageId,
        package_name: pkg.package_name,
        package_price: pkg.price,
        contract_period: contractPeriod,
        zoho_quote_id: quoteId,
        status: 'quote_sent',
        subtotal: quoteDetails.data[0].Sub_Total,
        tax: quoteDetails.data[0].Tax,
        total: quoteDetails.data[0].Grand_Total
      })
      .select()
      .single()

    return NextResponse.json({
      success: true,
      quoteId,
      orderId: order.id,
      lineItems: quoteDetails.data[0].Product_Details,
      total: quoteDetails.data[0].Grand_Total
    })

  } catch (error) {
    console.error('Quote creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create quote' },
      { status: 500 }
    )
  }
}
```

### 5.3 Hosted Checkout Page

**File:** `app/api/billing/hosted-page/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { zohoAuth } from '@/lib/zoho/auth'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json()

    const supabase = createClient()

    // Get order details
    const { data: order } = await supabase
      .from('orders')
      .select(`
        *,
        coverage_leads (
          first_name,
          last_name,
          email,
          phone_number,
          address
        )
      `)
      .eq('id', orderId)
      .single()

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Get line items
    const { data: lineItems } = await supabase
      .from('order_line_items')
      .select('*')
      .eq('order_id', orderId)

    const lead = order.coverage_leads

    // Create Hosted Page in Zoho Billing
    const hostedPagePayload = {
      customer: {
        display_name: `${lead.first_name} ${lead.last_name}`,
        email: lead.email,
        phone: lead.phone_number,
        billing_address: {
          street: lead.address,
          country: 'South Africa'
        }
      },
      plan: {
        plan_code: order.package_name.toLowerCase().replace(/\s/g, '_'),
        price: order.package_price
      },
      addons: lineItems
        ?.filter(item => item.item_type === 'addon')
        .map(item => ({
          addon_code: item.item_sku,
          quantity: item.quantity
        })) || [],
      redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/order/confirm?order=${orderId}`
    }

    const response = await zohoAuth.request(
      '/billing/v1/hostedpages/newsubscription',
      {
        method: 'POST',
        body: JSON.stringify(hostedPagePayload)
      }
    )

    // Update order status
    await supabase
      .from('orders')
      .update({
        status: 'payment_pending',
        payment_status: 'pending'
      })
      .eq('id', orderId)

    return NextResponse.json({
      success: true,
      hostedPageUrl: response.hostedpage.url,
      hostedPageId: response.hostedpage.hostedpage_id
    })

  } catch (error) {
    console.error('Hosted page creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout page' },
      { status: 500 }
    )
  }
}
```

### 5.4 Webhook Handler

**File:** `app/api/billing/webhook/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const eventType = payload.event_type
    const eventId = payload.event_id

    // Verify webhook signature (recommended for production)
    // const signature = request.headers.get('x-zoho-webhook-signature')
    // if (!verifySignature(signature, payload)) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    // }

    const supabase = createClient()

    // Log webhook event
    await supabase.from('zoho_webhook_events').insert({
      event_id: eventId,
      event_type: eventType,
      module: 'billing',
      payload: payload
    })

    // Check for duplicate event
    const { data: existing } = await supabase
      .from('zoho_webhook_events')
      .select('id')
      .eq('event_id', eventId)
      .eq('processed', true)
      .single()

    if (existing) {
      console.log(`Duplicate event ${eventId}, skipping`)
      return NextResponse.json({ success: true, message: 'Duplicate event' })
    }

    // Handle different event types
    switch (eventType) {
      case 'subscription_created':
      case 'subscription_activated':
        await handleSubscriptionActivated(payload.data.subscription)
        break

      case 'payment_success':
        await handlePaymentSuccess(payload.data.payment)
        break

      case 'payment_failed':
        await handlePaymentFailed(payload.data.payment)
        break

      case 'subscription_canceled':
        await handleSubscriptionCanceled(payload.data.subscription)
        break

      default:
        console.log(`Unhandled event type: ${eventType}`)
    }

    // Mark event as processed
    await supabase
      .from('zoho_webhook_events')
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq('event_id', eventId)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleSubscriptionActivated(subscription: any) {
  const supabase = createClient()

  // Find order by Zoho subscription ID
  const { data: order } = await supabase
    .from('orders')
    .select('*, coverage_leads(email, first_name)')
    .eq('zoho_subscription_id', subscription.subscription_id)
    .single()

  if (!order) {
    console.error(`Order not found for subscription ${subscription.subscription_id}`)
    return
  }

  // Update order status
  await supabase
    .from('orders')
    .update({
      status: 'paid',
      payment_status: 'paid',
      paid_at: new Date().toISOString()
    })
    .eq('id', order.id)

  // Create subscription record
  await supabase.from('subscriptions').insert({
    order_id: order.id,
    customer_id: order.customer_id,
    zoho_subscription_id: subscription.subscription_id,
    zoho_plan_id: subscription.plan.plan_id,
    status: 'active',
    billing_cycle: subscription.interval_unit,
    next_billing_date: subscription.next_billing_at,
    current_term_start: subscription.current_term_starts_at,
    current_term_end: subscription.current_term_ends_at,
    mrr: subscription.amount,
    activated_at: new Date().toISOString()
  })

  // Update CRM Deal to "Closed Won"
  // await zohoAuth.request(`/crm/v8/Deals/${order.zoho_deal_id}`, {
  //   method: 'PUT',
  //   body: JSON.stringify({
  //     data: [{ Stage: 'Closed Won' }]
  //   })
  // })

  // Send welcome email
  await resend.emails.send({
    from: 'CircleTel <noreply@circletel.co.za>',
    to: order.coverage_leads.email,
    subject: 'Welcome to CircleTel! Your service is active',
    html: `
      <h1>Welcome ${order.coverage_leads.first_name}!</h1>
      <p>Your ${order.package_name} service is now active.</p>
      <p>Next billing date: ${subscription.next_billing_at}</p>
    `
  })

  // Trigger provisioning workflow (TODO)
  console.log(`Provisioning triggered for order ${order.id}`)
}

async function handlePaymentSuccess(payment: any) {
  const supabase = createClient()

  await supabase
    .from('subscriptions')
    .update({ updated_at: new Date().toISOString() })
    .eq('zoho_subscription_id', payment.subscription_id)
}

async function handlePaymentFailed(payment: any) {
  const supabase = createClient()

  // Notify customer of failed payment
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*, orders(coverage_leads(email))')
    .eq('zoho_subscription_id', payment.subscription_id)
    .single()

  if (subscription) {
    await resend.emails.send({
      from: 'CircleTel <billing@circletel.co.za>',
      to: subscription.orders.coverage_leads.email,
      subject: 'Payment Failed - Action Required',
      html: `<p>Your payment has failed. Please update your payment method.</p>`
    })
  }
}

async function handleSubscriptionCanceled(subscription: any) {
  const supabase = createClient()

  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString()
    })
    .eq('zoho_subscription_id', subscription.subscription_id)

  // Update order status
  await supabase
    .from('orders')
    .update({ status: 'canceled' })
    .eq('zoho_subscription_id', subscription.subscription_id)
}
```

---

## 6. Frontend Improvements

### 6.1 Enhanced Coverage Checker

**File:** `components/coverage/CoverageChecker.tsx`

Key improvements:
- [ ] Add 3-stage progress indicator
- [ ] Floating CTA when package selected
- [ ] Capture customer type (residential/business toggle)
- [ ] Track UTM parameters from URL
- [ ] Show estimated provisioning time

```typescript
// Add progress state
const [progress, setProgress] = useState({
  stage: 0,
  message: ''
})

const checkCoverage = async () => {
  setProgress({ stage: 1, message: 'Finding your location...' })
  const coords = await geocodeAddress(address)

  setProgress({ stage: 2, message: 'Checking coverage availability...' })
  const lead = await createLead({ ...leadData, coords })

  setProgress({ stage: 3, message: 'Loading your personalized packages...' })
  const packages = await fetchPackages(lead.id)

  setProgress({ stage: 3, message: 'Complete!' })
  router.push(`/packages/${lead.id}`)
}
```

### 6.2 Package Selection Flow

**Update:** [components/coverage/CoverageChecker.tsx](../components/coverage/CoverageChecker.tsx)

```typescript
const [selectedPackage, setSelectedPackage] = useState(null)

// When package is selected
const handlePackageSelect = (pkg) => {
  setSelectedPackage(pkg)
  // Show floating CTA at bottom of screen
}

// Floating CTA component
{selectedPackage && (
  <div className="fixed bottom-0 left-0 right-0 bg-white shadow-2xl p-4 z-50">
    <div className="container mx-auto flex items-center justify-between">
      <div>
        <h3 className="font-bold">{selectedPackage.package_name}</h3>
        <p className="text-sm text-gray-600">R{selectedPackage.price}/month</p>
      </div>
      <button
        onClick={handleContinue}
        className="bg-circleTel-orange text-white px-8 py-3 rounded-lg"
      >
        Continue with this package →
      </button>
    </div>
  </div>
)}
```

### 6.3 Integrated Checkout Flow

```typescript
const handleContinue = async () => {
  setIsLoading(true)

  try {
    // 1. Create quote via CPQ
    const quoteResponse = await fetch('/api/cpq/quote', {
      method: 'POST',
      body: JSON.stringify({
        leadId,
        packageId: selectedPackage.id,
        addons: selectedAddons,
        contractPeriod: selectedContract
      })
    })

    const { quoteId, orderId } = await quoteResponse.json()

    // 2. Get hosted checkout page
    const checkoutResponse = await fetch('/api/billing/hosted-page', {
      method: 'POST',
      body: JSON.stringify({ orderId })
    })

    const { hostedPageUrl } = await checkoutResponse.json()

    // 3. Redirect to Zoho checkout
    router.push(hostedPageUrl)

  } catch (error) {
    toast.error('Failed to proceed to checkout')
  } finally {
    setIsLoading(false)
  }
}
```

---

## 7. Automation & Webhooks

### 7.1 Webhook Event Flow

```
Payment Success (Zoho Billing)
    ↓
POST /api/billing/webhook
    ↓
1. Verify signature
2. Log event (prevent duplicates)
3. Update order status → "Paid"
4. Create subscription record
5. Update CRM Deal → "Closed Won"
6. Send welcome email (Resend)
7. Trigger provisioning
    ↓
Provisioning Workflow
    ↓
1. Create service record in Supabase
2. Assign IP address (if static IP addon)
3. Schedule installation (if required)
4. Send provisioning email with timeline
5. Notify operations team
```

### 7.2 CRM Automation Rules

**Zoho CRM Workflows:**

1. **Lead → Contact Conversion**
   - Trigger: Lead status = "Qualified"
   - Action: Convert to Contact + Account (if business)
   - Assign: Based on geography/company size

2. **Quote Follow-Up**
   - Trigger: Quote created
   - Wait: 2 days
   - Condition: Quote stage = "Sent" (not accepted)
   - Action: Send follow-up email + create task for sales rep

3. **Abandoned Quote**
   - Trigger: Quote created
   - Wait: 7 days
   - Condition: Quote stage = "Sent"
   - Action: Send discount offer email (10% off)

4. **Subscription Renewal Reminder**
   - Trigger: Subscription end date - 30 days
   - Action: Email customer with renewal options
   - Create task for account manager

---

## 8. Testing Strategy

### 8.1 Unit Tests

```typescript
// lib/zoho/__tests__/auth.test.ts
describe('ZohoAuthService', () => {
  it('should refresh access token', async () => {
    const token = await zohoAuth.getAccessToken()
    expect(token).toBeDefined()
  })

  it('should cache token until expiry', async () => {
    const token1 = await zohoAuth.getAccessToken()
    const token2 = await zohoAuth.getAccessToken()
    expect(token1).toBe(token2) // Same token from cache
  })
})

// app/api/cpq/__tests__/quote.test.ts
describe('POST /api/cpq/quote', () => {
  it('should create quote with line items', async () => {
    const response = await POST(mockRequest)
    const data = await response.json()

    expect(data.quoteId).toBeDefined()
    expect(data.lineItems.length).toBeGreaterThan(0)
  })
})
```

### 8.2 Integration Tests

```typescript
// tests/integration/checkout-flow.test.ts
import { test, expect } from '@playwright/test'

test('complete checkout flow', async ({ page }) => {
  // 1. Coverage check
  await page.goto('/')
  await page.fill('input[name="address"]', '123 Main St, Johannesburg')
  await page.click('button:text("Show me my deals")')

  // Wait for packages to load
  await page.waitForSelector('[data-testid="package-card"]')

  // 2. Select package
  await page.click('[data-testid="package-card"]:first-child')

  // 3. Floating CTA appears
  await expect(page.locator('[data-testid="floating-cta"]')).toBeVisible()
  await page.click('button:text("Continue with this package")')

  // 4. Redirected to Zoho hosted page
  await page.waitForURL(/zohoapis\.com/)
  await expect(page).toHaveTitle(/Checkout/)
})
```

### 8.3 End-to-End Testing

**Test Scenarios:**

1. **Consumer Happy Path**
   - Coverage check → Package select → Checkout → Payment → Welcome email

2. **Business Quote Request**
   - Business landing → Quote request → CRM notification → Sales follow-up

3. **Payment Failure Handling**
   - Failed payment → Retry email → Status update

4. **Subscription Cancellation**
   - User cancels → Webhook → Status update → Exit survey

---

## 9. Success Metrics

### 9.1 Phase 1 KPIs (Weeks 1-4)

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Coverage → Package view rate | 75% | 80% | Google Analytics funnel |
| Package view → Order start rate | 40% | 60% | Order initiation events |
| Order completion rate | 60% | 70% | Successful payment % |
| **Overall conversion** | **18%** | **25%** | End-to-end funnel |

### 9.2 Phase 2-3 KPIs (Weeks 5-12)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Quote generation time | <3 seconds | API response time |
| CPQ rule accuracy | 100% | Manual review of quotes |
| Hosted page load time | <2 seconds | Zoho performance |
| Payment success rate | >95% | Webhook success events |
| Checkout abandonment | <20% | Hosted page analytics |

### 9.3 Phase 4-5 KPIs (Weeks 13-24)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Business lead capture rate | >60% | Form submissions |
| Quote-to-close rate | >25% | CRM Deal stages |
| Average deal size (business) | R5,000+/month | CRM Deal value |
| Customer lifetime value (LTV) | R15,000+ | Subscription retention |
| Time to revenue | <7 days | Lead created → Payment |

---

## 10. Risk Mitigation

### 10.1 Technical Risks

**Risk:** Zoho API rate limits
**Mitigation:**
- Implement request throttling
- Cache frequently accessed data
- Use bulk APIs where possible

**Risk:** Webhook delivery failures
**Mitigation:**
- Implement retry logic with exponential backoff
- Log all webhook events
- Monitor unprocessed events dashboard

**Risk:** Payment gateway downtime
**Mitigation:**
- Multiple payment gateways (Stripe + PayFast fallback)
- Status page for service availability
- Queue failed payments for retry

### 10.2 Business Risks

**Risk:** Low CPQ adoption by sales team
**Mitigation:**
- Comprehensive training program
- Sales team can still create manual quotes
- Gradual rollout (pilot with 2-3 reps first)

**Risk:** Customer confusion with Zoho branding
**Mitigation:**
- White-label hosted pages (Zoho Billing supports branding)
- Clear messaging: "Powered by CircleTel"
- Custom domain for checkout (checkout.circletel.co.za)

**Risk:** Subscription churn due to failed payments
**Mitigation:**
- Retry failed payments 3x over 7 days
- Proactive email notifications
- SMS reminders before billing date

### 10.3 Operational Risks

**Risk:** Support team overwhelmed by provisioning requests
**Mitigation:**
- Automated provisioning for standard packages
- Self-service portal for status checks
- Escalation workflow for complex cases

**Risk:** CRM data quality degradation
**Mitigation:**
- Validation rules in CRM (required fields, formats)
- Regular data audits
- Dedupe rules for contacts/accounts

---

## Appendix A: Environment Variables

```bash
# Zoho Authentication
ZOHO_CLIENT_ID=your_client_id
ZOHO_CLIENT_SECRET=your_client_secret
ZOHO_REFRESH_TOKEN=your_refresh_token
ZOHO_ACCOUNTS_URL=https://accounts.zoho.com
ZOHO_API_DOMAIN=https://www.zohoapis.com

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Resend (Email)
RESEND_API_KEY=your_resend_key

# App
NEXT_PUBLIC_APP_URL=https://circletel.co.za
```

---

## Appendix B: Zoho Configuration Checklist

### CRM Setup
- [ ] Create custom fields:
  - Contacts: `Customer_Type` (picklist: residential/business)
  - Deals: `Package_Type` (picklist: home/wireless/business)
  - Quotes: `Contract_Period` (picklist: month-to-month/12-month/24-month)

- [ ] Configure Products & Price Books:
  - Add all CircleTel packages (Home Starter, Connect, Ultra, etc.)
  - Add add-ons (Static IP, Replify, Support tiers)
  - Set list prices, tax rates

- [ ] Configure CPQ rules:
  - Mandatory router with 100+ Mbps packages
  - Installation fee waiver on 12/24-month contracts
  - Replify requires 20+ Mbps minimum

- [ ] Create Quote templates:
  - Consumer: Simple, payment link
  - Business: Detailed, terms & conditions, SLA

### Billing Setup
- [ ] Create Plans (map to packages):
  - CircleTel Home Starter - R249/month
  - CircleTel Home Connect - R399/month
  - etc.

- [ ] Configure Add-ons:
  - Static IP - R99/month
  - Replify Standard - R199/month
  - Premium Support - R199/month

- [ ] Payment Gateway Integration:
  - Stripe or PayFast
  - Test mode first, then production

- [ ] Configure Webhooks:
  - Endpoint: `https://circletel.co.za/api/billing/webhook`
  - Events: subscription_created, payment_success, payment_failed, subscription_canceled

- [ ] Customize Hosted Pages:
  - Branding: CircleTel logo, colors
  - Domain: checkout.circletel.co.za (optional)

---

## Appendix C: Migration Plan

### Existing Customers
For customers currently managed manually or in Supabase only:

1. **Data Export**
   - Export all customers from Supabase
   - Export all active subscriptions

2. **Data Transformation**
   - Map to Zoho schema
   - Add missing fields (company name, SLA tier)

3. **Import to Zoho**
   - Bulk import Contacts/Accounts
   - Create Subscriptions in Billing
   - Link to CRM records

4. **Validation**
   - Verify all data imported correctly
   - Check subscription billing cycles
   - Test webhook events

5. **Cutover**
   - Switch new orders to Zoho flow
   - Existing customers: gradual migration
   - Support team training

---

**Document Version:** 1.0
**Last Updated:** 2025-10-04
**Next Review:** 2025-11-04 (after Phase 1 completion)
**Owner:** CircleTel Engineering Team
