# MITS CPQ Design Specification

## Managed IT Services Configure, Price, Quote System

---

| Field | Value |
|-------|-------|
| **Document Reference** | SPEC-MITS-CPQ-2026-001 |
| **Created** | 2026-03-12 |
| **Status** | Approved |
| **Author** | CircleTel Product & Technology |
| **Related Documents** | CT-MITS-FSD-2026-001, CT-MITS-BRD-2026-001, CT-MITS-CPS-2026-002 |

---

## 1. Overview

### 1.1 Purpose

Implement a Configure, Price, Quote (CPQ) system for Managed IT Services that enables admin users and partners to create quotes for MITS bundled tiers (Essential, Professional, Premium, Enterprise).

### 1.2 Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Approach** | Hybrid (shared backend, separate UI) | Reuse proven CPQ infrastructure while tailoring UX for MITS workflow |
| **Audience** | Admin/Partner only (Phase 1) | MITS is consultative B2B; customer self-service deferred to Phase 2 |
| **Catalogue** | Hybrid tables | Clean MITS schema + integration with existing product UI |

### 1.3 Scope

**In Scope:**
- MITS tier selection and configuration
- Microsoft 365 licence allocation (included + additional)
- Add-on module selection
- Pricing calculation with discount controls
- Approval workflow for discounts exceeding thresholds
- Quote generation with PDF output
- Admin and Partner portal integration

**Out of Scope:**
- Customer self-service (Phase 2)
- Automated M365 provisioning (manual via Link-up ICT)
- Contract e-signature integration

---

## 2. Architecture

### 2.1 System Architecture

```
PRESENTATION LAYER
┌─────────────────────────────────────────────────────────────────────────────┐
│  /admin/mits-cpq/                    /partners/mits-cpq/                   │
│  ┌─────────────────────────┐         ┌─────────────────────────┐           │
│  │   MITSCPQWizard         │         │   MITSCPQWizard         │           │
│  │   (Admin context)       │         │   (Partner context)     │           │
│  └───────────┬─────────────┘         └───────────┬─────────────┘           │
│              │                                   │                          │
│  ┌───────────┴───────────────────────────────────┴───────────┐             │
│  │                    MITS STEP COMPONENTS                    │             │
│  │  TierSelection │ M365Config │ AddOns │ Pricing │ Review   │             │
│  └───────────────────────────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
SHARED INFRASTRUCTURE (existing)
┌─────────────────────────────────────────────────────────────────────────────┐
│  lib/cpq/hooks/           lib/cpq/rule-engine.ts    components/cpq/        │
│  ├── useCPQSession        ├── evaluateRules()       ├── WorkflowStepper    │
│  ├── useAutoSave          ├── getDiscountLimits()   └── (shared UI)        │
│  └── useCPQNavigation     └── checkApproval()                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
MITS-SPECIFIC LAYER (new)
┌─────────────────────────────────────────────────────────────────────────────┐
│  lib/mits-cpq/                       app/api/mits-cpq/                     │
│  ├── types.ts                        ├── sessions/route.ts                 │
│  ├── hooks.ts                        ├── tiers/route.ts                    │
│  ├── pricing-calculator.ts           ├── m365/route.ts                     │
│  └── validation.ts                   └── quote/route.ts                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
DATA LAYER
┌─────────────────────────────────────────────────────────────────────────────┐
│  SHARED TABLES                       MITS-SPECIFIC TABLES                  │
│  ├── cpq_sessions                    ├── mits_tier_catalogue               │
│  ├── cpq_pricing_rules               ├── mits_m365_pricing                 │
│  ├── cpq_discount_limits             ├── mits_module_catalogue             │
│  ├── cpq_approval_requests           └── service_packages (category=mits)  │
│  └── business_quotes                                                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 File Structure

```
lib/mits-cpq/
├── types.ts                 # MITSStepData, MITSTier, MITSM365Licence
├── hooks.ts                 # useMITSTiers, useMITSPricing
├── pricing-calculator.ts    # calculateMITSQuote(), margin calculations
├── validation.ts            # Step validation rules
└── index.ts

components/mits-cpq/
├── MITSCPQWizard.tsx        # Main wizard container
├── MITSCPQDashboard.tsx     # Dashboard widgets
├── MITSSessionList.tsx      # Sessions table
├── steps/
│   ├── TierSelectionStep.tsx
│   ├── M365ConfigStep.tsx
│   ├── AddOnsStep.tsx
│   ├── PricingStep.tsx
│   ├── CustomerDetailsStep.tsx
│   └── ReviewSubmitStep.tsx
├── shared/
│   ├── TierCard.tsx
│   ├── ModuleCard.tsx
│   ├── PricingBreakdown.tsx
│   └── MarginIndicator.tsx
└── index.ts

app/api/mits-cpq/
├── sessions/route.ts
├── tiers/route.ts
├── modules/route.ts
├── pricing/calculate/route.ts
├── pricing/validate/route.ts
└── quote/route.ts

app/admin/mits-cpq/
├── page.tsx                 # Dashboard
├── new/page.tsx             # New quote wizard
├── sessions/page.tsx        # My sessions
├── all/page.tsx             # All sessions (admin only)
└── quotes/[quoteRef]/page.tsx

supabase/migrations/
├── 20260312_create_mits_catalogue_tables.sql
└── 20260312_seed_mits_catalogue.sql
```

---

## 3. Database Schema

### 3.1 mits_tier_catalogue

Stores MITS tier definitions with operational details (M365 config, support SLAs, margins).

```sql
CREATE TABLE public.mits_tier_catalogue (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tier_code             TEXT NOT NULL UNIQUE,
    tier_name             TEXT NOT NULL,
    description           TEXT,

    -- Target market
    target_users_min      INTEGER NOT NULL,
    target_users_max      INTEGER NOT NULL,

    -- Pricing
    retail_price          DECIMAL(10,2) NOT NULL,

    -- Connectivity
    connectivity_speed_dl INTEGER NOT NULL,
    connectivity_speed_ul INTEGER NOT NULL,
    static_ip_included    INTEGER NOT NULL DEFAULT 1,
    lte_failover_included BOOLEAN NOT NULL DEFAULT false,
    skyfibre_product_code TEXT,

    -- Microsoft 365
    m365_licence_type     TEXT NOT NULL,
    m365_included_licences INTEGER NOT NULL,
    m365_additional_rate  DECIMAL(10,2) NOT NULL,

    -- Support
    support_hours         TEXT NOT NULL,
    sla_response_p1       DECIMAL(4,1) NOT NULL,
    sla_response_p2       DECIMAL(4,1) NOT NULL,
    sla_response_p3       DECIMAL(4,1) NOT NULL,
    sla_resolution_p1     INTEGER NOT NULL,
    onsite_included       TEXT NOT NULL,
    onsite_visit_rate     DECIMAL(10,2),

    -- Security & Backup
    firewall_included     BOOLEAN NOT NULL DEFAULT false,
    endpoint_protection   BOOLEAN NOT NULL DEFAULT false,
    backup_storage_gb     INTEGER NOT NULL DEFAULT 0,
    security_training     TEXT,

    -- SLA
    uptime_guarantee      DECIMAL(5,2) NOT NULL,
    service_credit_rate   DECIMAL(5,2) NOT NULL,

    -- Costs & Margins
    estimated_direct_cost DECIMAL(10,2) NOT NULL,
    target_margin_percent DECIMAL(5,2) NOT NULL,

    -- Status
    is_active             BOOLEAN NOT NULL DEFAULT true,
    sort_order            INTEGER NOT NULL DEFAULT 0,
    effective_from        DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_to          DATE,

    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 3.2 mits_m365_pricing

Microsoft 365 licence types with retail and CSP costs.

```sql
CREATE TABLE public.mits_m365_pricing (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    licence_type          TEXT NOT NULL UNIQUE,
    licence_name          TEXT NOT NULL,
    retail_price          DECIMAL(10,2) NOT NULL,
    csp_cost              DECIMAL(10,2) NOT NULL,
    features              JSONB NOT NULL DEFAULT '{}',
    is_active             BOOLEAN NOT NULL DEFAULT true,
    effective_from        DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_to          DATE,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 3.3 mits_module_catalogue

Add-on modules available for MITS tiers.

```sql
CREATE TABLE public.mits_module_catalogue (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_code           TEXT NOT NULL UNIQUE,
    module_name           TEXT NOT NULL,
    description           TEXT,
    retail_price          DECIMAL(10,2) NOT NULL,
    direct_cost           DECIMAL(10,2) NOT NULL,
    billing_type          TEXT NOT NULL,
    available_from_tier   TEXT NOT NULL,
    is_active             BOOLEAN NOT NULL DEFAULT true,
    sort_order            INTEGER NOT NULL DEFAULT 0,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 3.4 Seed Data

**Tiers:**
| Code | Name | Price | M365 Type | Included | Support |
|------|------|-------|-----------|----------|---------|
| MITS_ESSENTIAL | Essential | R2,999 | Business Basic | 5 | Mon-Fri 8-17 |
| MITS_PROFESSIONAL | Professional | R5,999 | Business Standard | 10 | Mon-Sat 7-19 |
| MITS_PREMIUM | Premium | R12,999 | Business Premium | 15 | 24x7 |
| MITS_ENTERPRISE | Enterprise | R35,000 | E3 | 20 | 24x7 Priority |

**M365 Pricing:**
| Type | Retail | CSP Cost | Margin |
|------|--------|----------|--------|
| business_basic | R179 | R149 | 16.8% |
| business_standard | R329 | R270 | 17.9% |
| business_premium | R549 | R450 | 18.0% |
| e3 | R799 | R650 | 18.6% |

**Modules:** LTE Failover, Static IP, Extended Backup, Advanced Security, Account Manager, Website Maintenance, Website Development, Security Training, DR Testing.

---

## 4. Wizard Flow

### 4.1 Steps

```
Step 1: TIER SELECTION
├── User count input
├── AI-recommended tier
├── Tier comparison cards
└── Output: selected_tier, user_count

Step 2: M365 CONFIGURATION
├── Shows included licences
├── Additional users input
├── Optional user email list
├── Domain input
└── Output: additional_licences, primary_domain

Step 3: ADD-ONS
├── Available modules (filtered by tier)
├── Module cards with pricing
├── Quantity selectors
└── Output: selected_modules[]

Step 4: PRICING
├── Line-by-line breakdown
├── Discount input (role-limited)
├── Margin calculator (admin only)
├── Contract term selector
├── Approval request if needed
└── Output: total_mrc, total_nrc, discount_percent

Step 5: CUSTOMER DETAILS
├── Company information
├── Primary contact
├── Installation address
├── Coverage check
└── Output: customer data, coverage_result

Step 6: REVIEW & SUBMIT
├── Full quote summary
├── PDF preview/download
├── Terms acceptance
├── Submit → business_quotes
└── Output: quote_reference
```

### 4.2 Step Data Types

```typescript
export interface MITSStepData {
  tier_selection?: {
    user_count: number;
    selected_tier: string;
    ai_recommended_tier?: string;
  };
  m365_config?: {
    included_licences: number;
    additional_licences: number;
    licence_type: string;
    user_emails?: string[];
    primary_domain?: string;
    has_existing_tenant: boolean;
  };
  add_ons?: {
    selected_modules: Array<{
      module_code: string;
      quantity: number;
      price: number;
    }>;
  };
  pricing?: {
    base_tier_price: number;
    additional_m365_price: number;
    add_ons_price: number;
    subtotal: number;
    discount_percent: number;
    discount_amount: number;
    total_mrc: number;
    total_nrc: number;
    contract_term_months: number;
    requires_approval: boolean;
    margin_percent?: number;
  };
  customer?: {
    company_name: string;
    registration_number?: string;
    primary_contact: { name: string; email: string; phone: string };
    installation_address: { street: string; city: string; province: string; postal_code: string };
    coverage_checked: boolean;
    coverage_result?: string;
  };
  review?: {
    summary_generated: boolean;
    pdf_url?: string;
    terms_accepted: boolean;
    quote_reference?: string;
  };
}
```

---

## 5. API Routes

### 5.1 Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/mits-cpq/sessions` | Create new CPQ session |
| GET | `/api/mits-cpq/sessions/[id]` | Get session details |
| PATCH | `/api/mits-cpq/sessions/[id]` | Update session |
| GET | `/api/mits-cpq/tiers` | List available tiers |
| GET | `/api/mits-cpq/modules` | List available modules |
| POST | `/api/mits-cpq/pricing/calculate` | Calculate quote pricing |
| POST | `/api/mits-cpq/pricing/validate` | Validate discounts |
| POST | `/api/mits-cpq/coverage/check` | Check SkyFibre coverage |
| POST | `/api/mits-cpq/quote` | Generate final quote |
| GET | `/api/mits-cpq/quote/[ref]/pdf` | Download quote PDF |

### 5.2 Integration Points

| Component | Strategy |
|-----------|----------|
| `cpq_sessions` | Add `metadata.product_type = 'mits'` |
| `cpq_pricing_rules` | Create MITS-specific rules |
| `cpq_discount_limits` | Reuse existing role-based limits |
| `cpq_approval_requests` | Reuse for discount approvals |
| `business_quotes` | Output with `quote_type = 'managed_it'` |

---

## 6. Admin UI

### 6.1 Pages

| Route | Purpose |
|-------|---------|
| `/admin/mits-cpq` | Dashboard with stats and recent sessions |
| `/admin/mits-cpq/new` | New quote wizard |
| `/admin/mits-cpq/sessions` | My sessions list |
| `/admin/mits-cpq/all` | All sessions (admin only) |
| `/admin/mits-cpq/quotes/[ref]` | Quote detail view |

### 6.2 Partner Portal

| Route | Purpose |
|-------|---------|
| `/partners/mits-cpq` | Partner dashboard |
| `/partners/mits-cpq/new` | New quote (partner context) |
| `/partners/mits-cpq/sessions` | Partner's sessions |

### 6.3 Permissions

| Permission | Admin | Partner |
|------------|-------|---------|
| Create quote | Yes | Yes |
| View own quotes | Yes | Yes |
| View all quotes | Yes | No |
| See margins | Yes | No |
| Approve discounts | Role-based | No |

---

## 7. Implementation Notes

### 7.1 Reused Infrastructure

- `useCPQSession` hook for session management
- `useAutoSave` hook for auto-save
- `useCPQNavigation` hook for step navigation
- `WorkflowStepper` component for progress display
- `cpq_pricing_rules` for discount rules
- `cpq_discount_limits` for role-based limits

### 7.2 New MITS Pricing Rules

```sql
INSERT INTO cpq_pricing_rules (name, rule_type, adjustment_type, adjustment_value, conditions) VALUES
('MITS 24-month commitment', 'discount', 'percentage', -10, '{"min_contract_term": 24, "product_type": "mits"}'),
('MITS 36-month commitment', 'discount', 'percentage', -15, '{"min_contract_term": 36, "product_type": "mits"}'),
('MITS Multi-site (2-4)', 'discount', 'percentage', -8, '{"min_sites": 2, "max_sites": 4, "product_type": "mits"}'),
('MITS Multi-site (5+)', 'discount', 'percentage', -12, '{"min_sites": 5, "product_type": "mits"}');
```

### 7.3 Quote Output

Quotes are stored in `business_quotes` with:
- `quote_type = 'managed_it'`
- `quote_reference = 'CT-MITS-YYYY-NNNN'`
- `quote_data` JSONB containing full tier/M365/module configuration

---

## 8. Phase 2 Considerations

Future enhancements (not in scope for Phase 1):

1. **Customer Self-Service** — Simplified tier selector on website
2. **Automated M365 Provisioning** — API integration with Link-up ICT
3. **Contract E-Signature** — DocuSign/HelloSign integration
4. **Multi-Site Wizard** — Configure multiple locations in one quote
5. **Renewal Quotes** — Auto-generate renewal quotes before contract end

---

**END OF SPECIFICATION**
