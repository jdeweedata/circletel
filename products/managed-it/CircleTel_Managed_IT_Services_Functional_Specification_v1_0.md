# CircleTel Managed IT Services — Functional Specification Document (FSD)

## System Behaviour, Data Logic & Integration Rules

---

| Field | Value |
|---|---|
| **Document Reference** | CT-FSD-MITS-2026-001 |
| **Version** | 1.0 |
| **Effective Date** | 12 March 2026 |
| **Classification** | Confidential — Internal & Development Use |
| **Locale** | en-ZA (South African English) |
| **Prepared By** | CircleTel Product & Technology |
| **Companion Documents** | CT-MITS-OV-2026-001 (Overview), CT-MITS-CPS-2026-002 (Commercial Spec v2.0), CT-MITS-BRD-2026-001 (Business Rules v1.0) |
| **Supersedes** | N/A — First issue |

---

## Version Control

| Version | Date | Author | Changes | Status |
|---|---|---|---|---|
| 1.0 | 12 March 2026 | CircleTel Product & Technology | Initial FSD aligned to CPS v2.0 bundled architecture and BRD v1.0 business rules | **CURRENT** |

---

## Table of Contents

1. Purpose & Scope
2. System Landscape & Integration Map
3. Data Model
4. Product Catalogue Data Logic
5. Order Lifecycle State Machine
6. Service Instance Lifecycle
7. Billing Engine Logic
8. Margin Calculation Engine
9. Microsoft 365 CSP Provisioning Integration
10. Connectivity Integration — SkyFibre FWB
11. Support Tier & Escalation Logic
12. Backup & Disaster Recovery Integration
13. Security Services Integration
14. SLA Monitoring & Service Credit Engine
15. Notification & Event Engine
16. Reporting & Analytics Data Logic
17. API Contract Specifications
18. Validation Rule Register
19. Error Handling & Recovery
20. Non-Functional Requirements

---

## 1. Purpose & Scope

This Functional Specification Document (FSD) defines the system behaviour, data models, calculation logic, integration contracts, and state machines required to operationalise the Managed IT Services product line within CircleTel's technology estate.

It translates the commercial rules in BRD v1.0 and the product parameters in CPS v2.0 into implementable system specifications for the development, integration, and operations teams.

**In scope:** All systems involved in the Managed IT Services order-to-cash and service management lifecycle — AgilityGIS BSS, Supabase backend, Microsoft CSP (via Link-up ICT), SkyFibre connectivity stack, Veeam/Datto backup, security services, and Link-up ICT support overflow.

**Out of scope:** Standalone connectivity products (see SkyFibre FSD), consumer products, hardware-only sales.

---

## 2. System Landscape & Integration Map

### 2.1 Systems of Record

| System | Role | Owner | Type |
|---|---|---|---|
| **AgilityGIS BSS** | Billing, invoicing, customer master, service catalogue | CircleTel | SoR — Customer & Billing |
| **Supabase (PostgreSQL)** | Backend database, API layer, deal catalogue, support tracking | CircleTel | SoR — Product & Analytics |
| **Microsoft CSP Portal** | M365 licence provisioning, tenant management | Link-up ICT (indirect) | External — Licensing |
| **SkyFibre Stack** | MTN Wholesale, Echo SP BNG, Interstellio RADIUS | CircleTel/Partners | External — Connectivity |
| **Veeam/Datto** | Cloud backup for M365 and endpoints | Third-party | External — Backup |
| **Reyee Cloud** | CPE router management, firewall configuration | Reyee/Ruijie | External — CPE/Security |
| **Link-up ICT Helpdesk** | Tier 3 support overflow, complex M365/Azure issues | Link-up ICT | External — Support |
| **CRM (Supabase)** | Lead tracking, pipeline, customer interactions | CircleTel | SoR — Sales |
| **Notification Service** | Email, SMS, WhatsApp via API gateway | CircleTel | Internal |

### 2.2 Integration Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        CUSTOMER TOUCHPOINTS                         │
│  [ Sales Portal ]  [ Customer Portal ]  [ WhatsApp ]  [ Email ]    │
└──────────┬──────────────────┬─────────────────────┬─────────────────┘
           │                  │                     │
           ▼                  ▼                     ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    CIRCLETEL APPLICATION LAYER                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  AgilityGIS  │  │   Supabase   │  │  Notification│              │
│  │     BSS      │◄─┤   Backend    │──►│   Service    │              │
│  │  (Billing)   │  │  (API/DB)    │  │  (SMS/Email) │              │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┘              │
│         │                 │                                         │
└─────────┼─────────────────┼─────────────────────────────────────────┘
          │                 │
          ▼                 ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    EXTERNAL INTEGRATION LAYER                        │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  Microsoft   │  │  SkyFibre    │  │  Veeam/Datto │              │
│  │  CSP Portal  │  │  Stack       │  │  Backup      │              │
│  │  (via Link-up)│  │(Connectivity)│  │  (Cloud)     │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                 │                  │                       │
│  ┌──────┴───────┐  ┌──────┴───────┐  ┌──────┴───────┐              │
│  │  Link-up ICT │  │  Reyee Cloud │  │   Security   │              │
│  │  Support     │  │  CPE/Firewall│  │   Services   │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
          │                 │
          ▼                 ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         SERVICE DELIVERY                             │
│  [ M365 Tenant ] ─── [ Exchange/Teams/SharePoint/OneDrive ]         │
│  [ SkyFibre CPE ] ─── [ Business Internet + Failover ]              │
│  [ Managed Firewall ] ─── [ Endpoint Protection ]                    │
└──────────────────────────────────────────────────────────────────────┘
```

### 2.3 Integration Protocols

| Integration | Protocol | Auth | Direction | Frequency |
|---|---|---|---|---|
| Supabase ↔ AgilityGIS BSS | REST/JSON | API Key + JWT | Bidirectional | Real-time + nightly batch |
| Supabase ↔ Microsoft CSP | Manual/Portal (Phase 1); API (Phase 2) | Portal credentials | Push | Per provisioning |
| Supabase ↔ Link-up ICT | Email/Ticket System | Shared credentials | Bidirectional | Per escalation |
| Supabase ↔ Veeam/Datto | REST API | API Key | Bidirectional | Daily status poll |
| Supabase ↔ Reyee Cloud | REST/JSON | OAuth 2.0 | Bidirectional | Real-time provisioning |
| SkyFibre Stack | See SkyFibre FSD | Per component | Bidirectional | Per SkyFibre FSD |
| Supabase ↔ Notification Service | REST/JSON | API Key | Push | Event-driven |

---

## 3. Data Model

### 3.1 Entity Relationship Summary

```
┌──────────────┐     1:N     ┌──────────────┐     1:N     ┌──────────────┐
│   Customer   │────────────►│  MITS Service│────────────►│   M365       │
│   Account    │             │   Instance   │             │   Licence    │
└──────┬───────┘             └──────┬───────┘             └──────────────┘
       │                            │
       │ 1:N                        │ 1:1
       ▼                            ▼
┌──────────────┐             ┌──────────────┐
│   Contact    │             │  SkyFibre    │
│   Person     │             │  Service     │
└──────────────┘             │  (bundled)   │
                             └──────┬───────┘
                                    │ 1:N
                                    ▼
                             ┌──────────────┐
                             │    Order     │
                             └──────┬───────┘
                                    │ 1:N
                                    ▼
                             ┌──────────────┐
                             │  Order Line  │
                             │    Item      │
                             └──────────────┘

┌──────────────┐     1:1     ┌──────────────┐
│  MITS Service│────────────►│   CPE        │
│   Instance   │             │   Device     │
└──────┬───────┘             └──────────────┘
       │
       │ 1:N
       ▼
┌──────────────┐     1:N     ┌──────────────┐
│   Invoice    │────────────►│ Invoice Line │
└──────────────┘             └──────────────┘

┌──────────────┐     N:1     ┌──────────────┐
│Support Ticket│────────────►│  MITS Service│
└──────────────┘             │   Instance   │
                             └──────────────┘
```

### 3.2 Core Entity Schemas

#### 3.2.1 `mits_customers` (extends base customers)

```sql
CREATE TABLE public.mits_customers (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_number        TEXT NOT NULL UNIQUE,  -- CT-MITS-XXXXXX
    company_name          TEXT NOT NULL,
    trading_name          TEXT,
    registration_number   TEXT NOT NULL,         -- CIPC
    vat_number            TEXT,
    entity_type           TEXT NOT NULL CHECK (
        entity_type IN ('pty_ltd', 'cc', 'sole_proprietor', 'npc', 'trust', 'partnership', 'government')
    ),
    billing_address       JSONB NOT NULL,
    installation_address  JSONB NOT NULL,
    primary_contact       JSONB NOT NULL,        -- {name, email, phone, whatsapp}
    it_contact            JSONB,                 -- designated IT liaison
    credit_score          INTEGER,
    credit_status         TEXT CHECK (
        credit_status IN ('pass', 'marginal', 'fail', 'waived', 'pending')
    ),
    credit_checked_at     TIMESTAMPTZ,
    credit_limit          DECIMAL(10,2),
    contract_type         TEXT NOT NULL DEFAULT 'month_to_month' CHECK (
        contract_type IN ('month_to_month', '12_month', '24_month', '36_month')
    ),
    payment_method        TEXT NOT NULL DEFAULT 'debit_order' CHECK (
        payment_method IN ('debit_order', 'eft', 'credit_card')
    ),
    account_status        TEXT NOT NULL DEFAULT 'pending' CHECK (
        account_status IN ('pending', 'active', 'suspended', 'terminated', 'cancelled')
    ),
    partner_id            UUID REFERENCES public.partners(id),
    source_channel        TEXT CHECK (
        source_channel IN ('direct_sales', 'partner', 'website', 'referral', 'migration')
    ),
    existing_m365_tenant  TEXT,                 -- if migrating existing tenant
    onboarded_at          TIMESTAMPTZ,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mits_customers_account ON public.mits_customers(account_number);
CREATE INDEX idx_mits_customers_status ON public.mits_customers(account_status);
CREATE INDEX idx_mits_customers_partner ON public.mits_customers(partner_id);
```

#### 3.2.2 `mits_service_instances`

```sql
CREATE TABLE public.mits_service_instances (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id           UUID NOT NULL REFERENCES public.mits_customers(id),
    service_number        TEXT NOT NULL UNIQUE,  -- MITS-XXXXXX
    tier_code             TEXT NOT NULL CHECK (
        tier_code IN ('MITS_ESSENTIAL', 'MITS_PROFESSIONAL', 'MITS_PREMIUM', 'MITS_ENTERPRISE', 'MITS_CUSTOM')
    ),
    retail_price          DECIMAL(10,2) NOT NULL,
    total_direct_cost     DECIMAL(10,2) NOT NULL,

    -- Microsoft 365 Configuration
    m365_tenant_id        TEXT,                  -- Azure AD tenant GUID
    m365_domain           TEXT,                  -- customer's primary domain
    m365_licence_type     TEXT NOT NULL CHECK (
        m365_licence_type IN ('business_basic', 'business_standard', 'business_premium', 'e3')
    ),
    m365_included_licences INTEGER NOT NULL,     -- licences included in tier
    m365_additional_licences INTEGER DEFAULT 0,  -- additional purchased licences
    m365_admin_delegated  BOOLEAN DEFAULT true,  -- CircleTel has delegated admin

    -- Connectivity (bundled SkyFibre)
    skyfibre_service_id   UUID REFERENCES public.service_instances(id),
    connectivity_speed_dl INTEGER NOT NULL,      -- Mbps
    connectivity_speed_ul INTEGER NOT NULL,      -- Mbps
    static_ip_count       INTEGER DEFAULT 1,
    lte_failover_enabled  BOOLEAN DEFAULT false,

    -- Support Configuration
    support_tier          TEXT NOT NULL CHECK (
        support_tier IN ('basic', 'extended', 'full', 'priority')
    ),
    support_hours         TEXT NOT NULL,         -- e.g., "mon-fri-8-17", "24x7"
    sla_response_target   INTEGER NOT NULL,      -- hours
    sla_resolution_target INTEGER NOT NULL,      -- hours

    -- Security & Backup
    firewall_enabled      BOOLEAN DEFAULT false,
    endpoint_protection   BOOLEAN DEFAULT false,
    backup_enabled        BOOLEAN DEFAULT false,
    backup_storage_gb     INTEGER DEFAULT 0,
    security_training_enabled BOOLEAN DEFAULT false,

    -- Dates & Status
    installation_date     DATE,
    activation_date       DATE,
    service_status        TEXT NOT NULL DEFAULT 'provisioning' CHECK (
        service_status IN (
            'provisioning', 'active', 'suspended_billing',
            'suspended_technical', 'pending_cancellation',
            'cancelled', 'terminated'
        )
    ),
    contract_start_date   DATE,
    contract_end_date     DATE,
    cancellation_date     DATE,
    cancellation_reason   TEXT,

    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mits_services_customer ON public.mits_service_instances(customer_id);
CREATE INDEX idx_mits_services_status ON public.mits_service_instances(service_status);
CREATE INDEX idx_mits_services_tier ON public.mits_service_instances(tier_code);
```

#### 3.2.3 `mits_m365_licences`

```sql
CREATE TABLE public.mits_m365_licences (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id            UUID NOT NULL REFERENCES public.mits_service_instances(id) ON DELETE CASCADE,
    user_email            TEXT NOT NULL,
    user_display_name     TEXT NOT NULL,
    licence_type          TEXT NOT NULL CHECK (
        licence_type IN ('business_basic', 'business_standard', 'business_premium', 'e3')
    ),
    is_included           BOOLEAN NOT NULL,      -- true if within tier allocation
    retail_price          DECIMAL(10,2) NOT NULL,
    csp_cost              DECIMAL(10,2) NOT NULL,
    status                TEXT NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'active', 'suspended', 'deprovisioned')
    ),
    provisioned_at        TIMESTAMPTZ,
    deprovisioned_at      TIMESTAMPTZ,
    grace_period_ends     DATE,                  -- 30-day grace before reclaim
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_email_per_service UNIQUE (service_id, user_email)
);

CREATE INDEX idx_m365_licences_service ON public.mits_m365_licences(service_id);
CREATE INDEX idx_m365_licences_status ON public.mits_m365_licences(status);
```

#### 3.2.4 `mits_orders`

```sql
CREATE TABLE public.mits_orders (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number          TEXT NOT NULL UNIQUE,   -- ORD-MITS-XXXXXX
    customer_id           UUID NOT NULL REFERENCES public.mits_customers(id),
    order_type            TEXT NOT NULL CHECK (
        order_type IN (
            'new_service', 'tier_upgrade', 'tier_downgrade',
            'add_licences', 'remove_licences', 'add_module',
            'remove_module', 'cancellation', 'migration'
        )
    ),
    order_status          TEXT NOT NULL DEFAULT 'draft' CHECK (
        order_status IN (
            'draft', 'submitted', 'credit_check', 'credit_approved',
            'credit_rejected', 'coverage_check', 'coverage_confirmed',
            'coverage_failed', 'site_survey_pending', 'site_survey_passed',
            'site_survey_failed', 'contract_pending', 'contract_signed',
            'provisioning_connectivity', 'provisioning_m365',
            'provisioning_security', 'provisioning_backup',
            'installation_scheduled', 'installation_in_progress',
            'installation_complete', 'user_onboarding',
            'activation_pending', 'active', 'completed',
            'cancelled', 'rejected', 'on_hold'
        )
    ),
    tier_code             TEXT NOT NULL,
    total_mrc             DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_nrc             DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_percent      DECIMAL(5,2) DEFAULT 0,
    discount_authority    TEXT,
    discount_type         TEXT CHECK (
        discount_type IN ('multi_year', 'multi_site', 'competitive', 'prepay', 'staff', 'partner')
    ),
    sales_agent_id        UUID,
    partner_id            UUID REFERENCES public.partners(id),
    notes                 TEXT,
    submitted_at          TIMESTAMPTZ,
    completed_at          TIMESTAMPTZ,
    cancelled_at          TIMESTAMPTZ,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mits_orders_customer ON public.mits_orders(customer_id);
CREATE INDEX idx_mits_orders_status ON public.mits_orders(order_status);
```

#### 3.2.5 `mits_order_line_items`

```sql
CREATE TABLE public.mits_order_line_items (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id              UUID NOT NULL REFERENCES public.mits_orders(id) ON DELETE CASCADE,
    line_type             TEXT NOT NULL CHECK (
        line_type IN (
            'tier_base', 'm365_additional', 'add_on_module',
            'nrc_installation', 'nrc_setup', 'nrc_migration',
            'discount'
        )
    ),
    product_code          TEXT NOT NULL,
    description           TEXT NOT NULL,
    quantity              INTEGER NOT NULL DEFAULT 1,
    unit_price            DECIMAL(10,2) NOT NULL,
    line_total            DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    recurring             BOOLEAN NOT NULL DEFAULT true,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mits_line_items_order ON public.mits_order_line_items(order_id);
```

#### 3.2.6 `mits_support_tickets`

```sql
CREATE TABLE public.mits_support_tickets (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number         TEXT NOT NULL UNIQUE,   -- TKT-MITS-XXXXXX
    customer_id           UUID NOT NULL REFERENCES public.mits_customers(id),
    service_id            UUID REFERENCES public.mits_service_instances(id),
    category              TEXT NOT NULL CHECK (
        category IN (
            'connectivity', 'm365', 'security', 'backup',
            'hardware', 'billing', 'general', 'change_request',
            'user_onboarding', 'user_offboarding', 'complaint',
            'cancellation'
        )
    ),
    priority              TEXT NOT NULL DEFAULT 'P3' CHECK (
        priority IN ('P1', 'P2', 'P3', 'P4')
    ),
    support_tier          TEXT NOT NULL,          -- inherited from service
    sla_response_deadline TIMESTAMPTZ,
    sla_resolution_deadline TIMESTAMPTZ,
    sla_response_breached BOOLEAN DEFAULT false,
    sla_resolution_breached BOOLEAN DEFAULT false,
    status                TEXT NOT NULL DEFAULT 'open' CHECK (
        status IN (
            'open', 'assigned', 'in_progress', 'awaiting_customer',
            'awaiting_link_up', 'awaiting_microsoft', 'awaiting_vendor',
            'escalated', 'resolved', 'closed'
        )
    ),
    escalation_level      INTEGER DEFAULT 1 CHECK (escalation_level BETWEEN 1 AND 5),
    assigned_to           TEXT,                   -- agent name/email
    link_up_ticket_ref    TEXT,                   -- if escalated to Link-up ICT
    microsoft_ticket_ref  TEXT,                   -- if escalated to Microsoft
    description           TEXT NOT NULL,
    resolution_notes      TEXT,
    opened_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    first_response_at     TIMESTAMPTZ,
    resolved_at           TIMESTAMPTZ,
    closed_at             TIMESTAMPTZ,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mits_tickets_customer ON public.mits_support_tickets(customer_id);
CREATE INDEX idx_mits_tickets_service ON public.mits_support_tickets(service_id);
CREATE INDEX idx_mits_tickets_status ON public.mits_support_tickets(status);
CREATE INDEX idx_mits_tickets_priority ON public.mits_support_tickets(priority);
```

#### 3.2.7 `mits_add_on_modules`

```sql
CREATE TABLE public.mits_add_on_modules (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id            UUID NOT NULL REFERENCES public.mits_service_instances(id) ON DELETE CASCADE,
    module_code           TEXT NOT NULL CHECK (
        module_code IN (
            'MOD_LTE_FAILOVER', 'MOD_STATIC_IP', 'MOD_WEBSITE_MAINT',
            'MOD_WEBSITE_DEV', 'MOD_SECURITY_ADV', 'MOD_BACKUP_EXT',
            'MOD_ACCOUNT_MGR', 'MOD_SECURITY_TRAINING', 'MOD_DR_TESTING',
            'MOD_CUSTOM_DEV', 'MOD_ECOMMERCE'
        )
    ),
    module_name           TEXT NOT NULL,
    retail_price          DECIMAL(10,2) NOT NULL,
    direct_cost           DECIMAL(10,2) NOT NULL,
    billing_type          TEXT NOT NULL CHECK (billing_type IN ('recurring', 'once_off', 'hourly')),
    quantity              INTEGER DEFAULT 1,
    status                TEXT NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'active', 'suspended', 'cancelled')
    ),
    activated_at          TIMESTAMPTZ,
    cancelled_at          TIMESTAMPTZ,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mits_modules_service ON public.mits_add_on_modules(service_id);
CREATE INDEX idx_mits_modules_code ON public.mits_add_on_modules(module_code);
```

---

## 4. Product Catalogue Data Logic

### 4.1 Tier Catalogue Table

```sql
CREATE TABLE public.mits_tier_catalogue (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tier_code             TEXT NOT NULL UNIQUE,
    tier_name             TEXT NOT NULL,
    target_users_min      INTEGER NOT NULL,
    target_users_max      INTEGER NOT NULL,
    retail_price          DECIMAL(10,2) NOT NULL,

    -- Connectivity
    connectivity_speed_dl INTEGER NOT NULL,      -- Mbps
    connectivity_speed_ul INTEGER NOT NULL,      -- Mbps
    static_ip_included    INTEGER NOT NULL,
    lte_failover_included BOOLEAN NOT NULL,

    -- Microsoft 365
    m365_licence_type     TEXT NOT NULL,
    m365_included_licences INTEGER NOT NULL,
    m365_additional_rate  DECIMAL(10,2) NOT NULL,

    -- Support
    support_hours         TEXT NOT NULL,
    sla_response_p1       INTEGER NOT NULL,      -- hours
    sla_response_p2       INTEGER NOT NULL,
    sla_response_p3       INTEGER NOT NULL,
    sla_resolution_p1     INTEGER NOT NULL,      -- hours
    onsite_included       TEXT NOT NULL,         -- 'none', 'quarterly', 'monthly', 'weekly'
    onsite_visit_rate     DECIMAL(10,2),         -- if not included

    -- Security & Backup
    firewall_included     BOOLEAN NOT NULL,
    endpoint_protection   BOOLEAN NOT NULL,
    backup_storage_gb     INTEGER NOT NULL,
    security_training     TEXT,                  -- 'none', 'quarterly', 'monthly'

    -- SLA
    uptime_guarantee      DECIMAL(5,2) NOT NULL, -- percentage
    service_credit_rate   DECIMAL(5,2) NOT NULL, -- % per hour breach

    -- Cost
    estimated_direct_cost DECIMAL(10,2) NOT NULL,
    target_margin_percent DECIMAL(5,2) NOT NULL,

    is_active             BOOLEAN NOT NULL DEFAULT true,
    effective_from        DATE NOT NULL,
    effective_to          DATE,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 4.2 Tier Seed Data

```sql
INSERT INTO public.mits_tier_catalogue (
    tier_code, tier_name, target_users_min, target_users_max, retail_price,
    connectivity_speed_dl, connectivity_speed_ul, static_ip_included, lte_failover_included,
    m365_licence_type, m365_included_licences, m365_additional_rate,
    support_hours, sla_response_p1, sla_response_p2, sla_response_p3, sla_resolution_p1,
    onsite_included, onsite_visit_rate,
    firewall_included, endpoint_protection, backup_storage_gb, security_training,
    uptime_guarantee, service_credit_rate,
    estimated_direct_cost, target_margin_percent,
    effective_from
) VALUES
-- Essential
('MITS_ESSENTIAL', 'Essential', 1, 10, 2999.00,
 50, 12, 1, false,
 'business_basic', 5, 179.00,
 'mon-fri-8-17', 4, 8, 24, 48,
 'none', 850.00,
 false, false, 0, 'none',
 99.0, 5.00,
 1743.00, 41.9,
 '2026-03-01'),

-- Professional
('MITS_PROFESSIONAL', 'Professional', 10, 25, 5999.00,
 100, 25, 1, false,
 'business_standard', 10, 329.00,
 'mon-sat-7-19', 2, 4, 8, 12,
 'quarterly', 850.00,
 true, true, 500, 'none',
 99.5, 5.00,
 4956.00, 17.4,
 '2026-03-01'),

-- Premium
('MITS_PREMIUM', 'Premium', 25, 50, 12999.00,
 200, 50, 2, true,
 'business_premium', 15, 549.00,
 '24x7', 1, 2, 4, 8,
 'monthly', NULL,
 true, true, 1024, 'quarterly',
 99.5, 10.00,
 9448.00, 27.3,
 '2026-03-01'),

-- Enterprise
('MITS_ENTERPRISE', 'Enterprise', 50, 100, 35000.00,
 500, 125, 4, true,
 'e3', 20, 799.00,
 '24x7-priority', 0.5, 1, 2, 4,
 'weekly', NULL,
 true, true, -1, 'monthly',  -- -1 = unlimited
 99.9, 15.00,
 25000.00, 28.6,
 '2026-03-01');
```

### 4.3 Add-on Module Catalogue

```sql
CREATE TABLE public.mits_module_catalogue (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_code           TEXT NOT NULL UNIQUE,
    module_name           TEXT NOT NULL,
    description           TEXT NOT NULL,
    retail_price          DECIMAL(10,2) NOT NULL,
    direct_cost           DECIMAL(10,2) NOT NULL,
    margin_percent        DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE WHEN retail_price > 0
             THEN ((retail_price - direct_cost) / retail_price) * 100
             ELSE 0 END
    ) STORED,
    billing_type          TEXT NOT NULL CHECK (billing_type IN ('recurring', 'once_off', 'hourly')),
    available_from_tier   TEXT NOT NULL,         -- minimum tier required
    is_active             BOOLEAN NOT NULL DEFAULT true,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.mits_module_catalogue VALUES
(gen_random_uuid(), 'MOD_LTE_FAILOVER', 'LTE Failover', 'Automatic LTE backup with 50GB data', 399.00, 220.00, DEFAULT, 'recurring', 'MITS_ESSENTIAL', true, NOW()),
(gen_random_uuid(), 'MOD_STATIC_IP', 'Additional Static IP', 'Extra public IPv4 address', 99.00, 50.00, DEFAULT, 'recurring', 'MITS_ESSENTIAL', true, NOW()),
(gen_random_uuid(), 'MOD_WEBSITE_MAINT', 'Website Maintenance', '4 hours maintenance per month', 999.00, 400.00, DEFAULT, 'recurring', 'MITS_ESSENTIAL', true, NOW()),
(gen_random_uuid(), 'MOD_WEBSITE_DEV', 'Website Development', 'Custom website development', 5000.00, 2500.00, DEFAULT, 'once_off', 'MITS_ESSENTIAL', true, NOW()),
(gen_random_uuid(), 'MOD_SECURITY_ADV', 'Advanced Security Pack', 'Enhanced firewall + SIEM', 1500.00, 600.00, DEFAULT, 'recurring', 'MITS_PROFESSIONAL', true, NOW()),
(gen_random_uuid(), 'MOD_BACKUP_EXT', 'Extended Backup (500GB)', 'Additional cloud backup storage', 249.00, 100.00, DEFAULT, 'recurring', 'MITS_PROFESSIONAL', true, NOW()),
(gen_random_uuid(), 'MOD_ACCOUNT_MGR', 'Dedicated Account Manager', 'Named account manager', 2000.00, 800.00, DEFAULT, 'recurring', 'MITS_PREMIUM', true, NOW()),
(gen_random_uuid(), 'MOD_SECURITY_TRAINING', 'Security Awareness Training', 'Per user per year', 180.00, 80.00, DEFAULT, 'once_off', 'MITS_PROFESSIONAL', true, NOW()),
(gen_random_uuid(), 'MOD_DR_TESTING', 'Disaster Recovery Testing', 'Quarterly DR test exercise', 5000.00, 2000.00, DEFAULT, 'once_off', 'MITS_PREMIUM', true, NOW()),
(gen_random_uuid(), 'MOD_CUSTOM_DEV', 'Custom Development', 'Development work per hour', 550.00, 250.00, DEFAULT, 'hourly', 'MITS_ESSENTIAL', true, NOW()),
(gen_random_uuid(), 'MOD_ECOMMERCE', 'E-commerce Platform', 'WooCommerce or similar setup', 15000.00, 6000.00, DEFAULT, 'once_off', 'MITS_ESSENTIAL', true, NOW());
```

### 4.4 Microsoft 365 Licence Pricing

```sql
CREATE TABLE public.mits_m365_pricing (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    licence_type          TEXT NOT NULL UNIQUE,
    licence_name          TEXT NOT NULL,
    retail_price          DECIMAL(10,2) NOT NULL,
    csp_cost              DECIMAL(10,2) NOT NULL,
    margin_percent        DECIMAL(5,2) GENERATED ALWAYS AS (
        ((retail_price - csp_cost) / retail_price) * 100
    ) STORED,
    features              JSONB NOT NULL,
    effective_from        DATE NOT NULL,
    effective_to          DATE,
    is_active             BOOLEAN NOT NULL DEFAULT true,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.mits_m365_pricing (
    licence_type, licence_name, retail_price, csp_cost, features, effective_from
) VALUES
('business_basic', 'Microsoft 365 Business Basic', 179.00, 149.00,
 '{"exchange": true, "sharepoint": true, "onedrive_tb": 1, "teams": true, "desktop_apps": false, "intune": false, "aad_p1": false}',
 '2026-03-01'),
('business_standard', 'Microsoft 365 Business Standard', 329.00, 270.00,
 '{"exchange": true, "sharepoint": true, "onedrive_tb": 1, "teams": true, "desktop_apps": true, "intune": false, "aad_p1": false}',
 '2026-03-01'),
('business_premium', 'Microsoft 365 Business Premium', 549.00, 450.00,
 '{"exchange": true, "sharepoint": true, "onedrive_tb": 1, "teams": true, "desktop_apps": true, "intune": true, "aad_p1": true, "defender": true}',
 '2026-03-01'),
('e3', 'Microsoft 365 E3', 799.00, 650.00,
 '{"exchange": true, "sharepoint": true, "onedrive_tb": -1, "teams": true, "desktop_apps": true, "intune": true, "aad_p1": true, "aad_p2": true, "defender": true, "compliance": true}',
 '2026-03-01');
```

---

## 5. Order Lifecycle State Machine

### 5.1 Order States

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MITS ORDER STATE MACHINE                            │
└─────────────────────────────────────────────────────────────────────────────┘

                                    ┌─────────┐
                                    │  DRAFT  │
                                    └────┬────┘
                                         │ submit()
                                         ▼
                                  ┌──────────────┐
                                  │  SUBMITTED   │
                                  └──────┬───────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
                    ▼                    ▼                    ▼
            ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
            │CREDIT_CHECK │      │COVERAGE_CHK │      │   ON_HOLD   │
            └──────┬──────┘      └──────┬──────┘      └─────────────┘
                   │                    │
        ┌──────────┴──────────┐   ┌────┴────┐
        ▼                     ▼   ▼         ▼
┌─────────────┐        ┌─────────────┐  ┌─────────────┐
│CREDIT_PASSED│        │CREDIT_FAIL  │  │COVERAGE_OK  │
└──────┬──────┘        └──────┬──────┘  └──────┬──────┘
       │                      │                │
       │         ┌────────────┘                │
       │         ▼                             │
       │   ┌──────────┐                        │
       │   │ REJECTED │                        │
       │   └──────────┘                        │
       │                                       │
       └─────────────────┬─────────────────────┘
                         │
                         ▼
                  ┌─────────────┐
                  │ SITE_SURVEY │ (if required)
                  └──────┬──────┘
                         │
           ┌─────────────┼─────────────┐
           ▼             ▼             ▼
    ┌───────────┐ ┌───────────┐ ┌───────────┐
    │SURVEY_PASS│ │SURVEY_FAIL│ │NOT_REQUIRED│
    └─────┬─────┘ └─────┬─────┘ └─────┬─────┘
          │             │             │
          │    ┌────────┘             │
          │    ▼                      │
          │  ┌──────────┐             │
          │  │ REJECTED │             │
          │  └──────────┘             │
          │                           │
          └───────────┬───────────────┘
                      │
                      ▼
               ┌─────────────┐
               │CONTRACT_PEND│
               └──────┬──────┘
                      │ sign()
                      ▼
               ┌─────────────┐
               │CONTRACT_SIGN│
               └──────┬──────┘
                      │
         ┌────────────┼────────────┐
         ▼            ▼            ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│PROV_CONNECT │ │ PROV_M365   │ │PROV_SECURITY│
└──────┬──────┘ └──────┬──────┘ └──────┬──────┘
       │               │               │
       └───────────────┼───────────────┘
                       │
                       ▼
                ┌─────────────┐
                │ INSTALL_SCH │
                └──────┬──────┘
                       │
                       ▼
                ┌─────────────┐
                │INSTALL_PROG │
                └──────┬──────┘
                       │
                       ▼
                ┌─────────────┐
                │INSTALL_DONE │
                └──────┬──────┘
                       │
                       ▼
                ┌─────────────┐
                │USER_ONBOARD │
                └──────┬──────┘
                       │
                       ▼
                ┌─────────────┐
                │   ACTIVE    │
                └──────┬──────┘
                       │
                       ▼
                ┌─────────────┐
                │  COMPLETED  │
                └─────────────┘
```

### 5.2 State Transition Rules

| From State | To State | Trigger | Validation | Actions |
|---|---|---|---|---|
| `draft` | `submitted` | User submits | All required fields populated | Create audit log, notify sales |
| `submitted` | `credit_check` | Auto | Customer not existing | Trigger TransUnion API |
| `credit_check` | `credit_approved` | Credit score ≥400 | Score verified | Set credit_limit, notify provisioning |
| `credit_check` | `credit_rejected` | Credit score <400 | — | Offer prepaid option, notify sales |
| `submitted` | `coverage_check` | Auto | Address provided | Trigger SkyFibre coverage API |
| `coverage_check` | `coverage_confirmed` | Coverage available | — | Proceed to provisioning |
| `coverage_check` | `coverage_failed` | No coverage | — | Offer alternative (WorkConnect), notify sales |
| `contract_signed` | `provisioning_*` | Contract signed | Document uploaded | Trigger parallel provisioning |
| `provisioning_m365` | `complete` | Tenant created | — | Create licences, set delegated admin |
| `install_complete` | `user_onboarding` | CPE verified | — | Schedule onboarding call |
| `user_onboarding` | `active` | Onboarding done | — | Activate billing, send welcome |
| `active` | `completed` | Order closed | All services active | Archive order |

### 5.3 Order State Functions

```sql
-- Function: Submit Order
CREATE OR REPLACE FUNCTION mits_submit_order(p_order_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE mits_orders
    SET order_status = 'submitted',
        submitted_at = NOW(),
        updated_at = NOW()
    WHERE id = p_order_id
    AND order_status = 'draft';

    -- Trigger credit check if new customer
    -- Trigger coverage check in parallel
END;
$$ LANGUAGE plpgsql;

-- Function: Transition Order State
CREATE OR REPLACE FUNCTION mits_transition_order(
    p_order_id UUID,
    p_new_status TEXT,
    p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_current_status TEXT;
    v_valid_transition BOOLEAN;
BEGIN
    SELECT order_status INTO v_current_status
    FROM mits_orders WHERE id = p_order_id;

    -- Validate transition (implement state machine rules)
    v_valid_transition := mits_validate_transition(v_current_status, p_new_status);

    IF v_valid_transition THEN
        UPDATE mits_orders
        SET order_status = p_new_status,
            notes = COALESCE(p_notes, notes),
            updated_at = NOW()
        WHERE id = p_order_id;

        -- Log transition
        INSERT INTO mits_order_audit (order_id, from_status, to_status, notes)
        VALUES (p_order_id, v_current_status, p_new_status, p_notes);

        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;
```

---

## 6. Service Instance Lifecycle

### 6.1 Service States

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      MITS SERVICE INSTANCE LIFECYCLE                        │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│PROVISIONING │────►│   ACTIVE    │────►│SUSPENDED_BIL│
└─────────────┘     └──────┬──────┘     └──────┬──────┘
                           │                   │
                    ┌──────┴──────┐            │ pay()
                    ▼             ▼            │
            ┌─────────────┐ ┌─────────────┐    │
            │SUSPENDED_TEC│ │PEND_CANCEL  │    │
            └──────┬──────┘ └──────┬──────┘    │
                   │               │           │
                   │ fix()         │ cancel()  │
                   │               │           │
                   ▼               ▼           ▼
            ┌─────────────┐ ┌─────────────┐────┘
            │   ACTIVE    │ │  CANCELLED  │
            └─────────────┘ └─────────────┘
                                   │
                                   ▼
                           ┌─────────────┐
                           │ TERMINATED  │
                           └─────────────┘
```

### 6.2 Service Activation Workflow

```
Day 0: Order Completed
  │
  ├── Create mits_service_instance (status: provisioning)
  │
Day 1: Site Survey (if required)
  │
  ├── Schedule technician visit
  ├── Verify signal/LOS for SkyFibre
  │
Day 2: CPE Allocation
  │
  ├── Allocate Reyee router from inventory
  ├── Ship to customer or technician
  │
Day 3: Installation
  │
  ├── Install SkyFibre CPE (Tarana RN)
  ├── Install router, configure firewall
  ├── Test connectivity
  │
Day 3-4: M365 Provisioning
  │
  ├── Create M365 tenant (or migrate existing)
  ├── Verify domain ownership
  ├── Provision included licences
  ├── Set CircleTel as delegated admin
  │
Day 4-5: Security & Backup
  │
  ├── Configure managed firewall policies
  ├── Deploy endpoint protection (if included)
  ├── Enable backup (if included)
  │
Day 5-7: User Onboarding
  │
  ├── Onboarding call with customer
  ├── User training (basic M365)
  ├── Confirm all services operational
  │
Day 7: Go-Live
  │
  ├── Service status → 'active'
  ├── Billing starts
  └── Send welcome pack
```

---

## 7. Billing Engine Logic

### 7.1 Billing Calculation

```sql
-- Function: Calculate Monthly Bill
CREATE OR REPLACE FUNCTION mits_calculate_monthly_bill(
    p_service_id UUID,
    p_billing_period_start DATE,
    p_billing_period_end DATE
)
RETURNS TABLE (
    line_description TEXT,
    quantity INTEGER,
    unit_price DECIMAL(10,2),
    line_total DECIMAL(10,2)
) AS $$
DECLARE
    v_service RECORD;
    v_tier RECORD;
BEGIN
    -- Get service details
    SELECT * INTO v_service
    FROM mits_service_instances
    WHERE id = p_service_id;

    -- Get tier details
    SELECT * INTO v_tier
    FROM mits_tier_catalogue
    WHERE tier_code = v_service.tier_code;

    -- 1. Base tier charge
    RETURN QUERY SELECT
        v_tier.tier_name || ' - Base Package',
        1,
        v_tier.retail_price,
        v_tier.retail_price;

    -- 2. Additional M365 licences
    RETURN QUERY SELECT
        'Additional ' || v_service.m365_licence_type || ' Licence',
        v_service.m365_additional_licences,
        v_tier.m365_additional_rate,
        v_service.m365_additional_licences * v_tier.m365_additional_rate
    WHERE v_service.m365_additional_licences > 0;

    -- 3. Add-on modules
    RETURN QUERY SELECT
        mc.module_name,
        m.quantity,
        m.retail_price,
        m.quantity * m.retail_price
    FROM mits_add_on_modules m
    JOIN mits_module_catalogue mc ON mc.module_code = m.module_code
    WHERE m.service_id = p_service_id
    AND m.status = 'active'
    AND mc.billing_type = 'recurring';

END;
$$ LANGUAGE plpgsql;
```

### 7.2 Invoice Generation

```sql
-- Function: Generate Invoice
CREATE OR REPLACE FUNCTION mits_generate_invoice(
    p_customer_id UUID,
    p_billing_period_start DATE,
    p_billing_period_end DATE
)
RETURNS UUID AS $$
DECLARE
    v_invoice_id UUID;
    v_invoice_number TEXT;
    v_subtotal DECIMAL(10,2) := 0;
    v_vat DECIMAL(10,2);
    v_total DECIMAL(10,2);
    v_service RECORD;
BEGIN
    -- Generate invoice number
    v_invoice_number := 'INV-MITS-' || TO_CHAR(NOW(), 'YYYYMM') || '-' ||
                        LPAD((SELECT COUNT(*) + 1 FROM invoices WHERE
                        invoice_number LIKE 'INV-MITS-' || TO_CHAR(NOW(), 'YYYYMM') || '%')::TEXT, 6, '0');

    -- Create invoice header
    INSERT INTO invoices (invoice_number, customer_id, billing_period_start, billing_period_end,
                          subtotal_excl_vat, vat_amount, total_incl_vat, due_date, status)
    VALUES (v_invoice_number, p_customer_id, p_billing_period_start, p_billing_period_end,
            0, 0, 0, p_billing_period_start + INTERVAL '7 days', 'generated')
    RETURNING id INTO v_invoice_id;

    -- For each active service, generate lines
    FOR v_service IN
        SELECT * FROM mits_service_instances
        WHERE customer_id = p_customer_id AND service_status = 'active'
    LOOP
        INSERT INTO invoice_lines (invoice_id, service_id, description, quantity,
                                   unit_price_excl_vat, line_type)
        SELECT v_invoice_id, v_service.id, line_description, quantity,
               unit_price, 'base_tier'
        FROM mits_calculate_monthly_bill(v_service.id, p_billing_period_start, p_billing_period_end);
    END LOOP;

    -- Calculate totals
    SELECT SUM(line_total_excl_vat) INTO v_subtotal
    FROM invoice_lines WHERE invoice_id = v_invoice_id;

    v_vat := v_subtotal * 0.15;
    v_total := v_subtotal + v_vat;

    UPDATE invoices
    SET subtotal_excl_vat = v_subtotal,
        vat_amount = v_vat,
        total_incl_vat = v_total
    WHERE id = v_invoice_id;

    RETURN v_invoice_id;
END;
$$ LANGUAGE plpgsql;
```

### 7.3 Pro-Rata Calculation

```sql
-- Function: Calculate Pro-Rata
CREATE OR REPLACE FUNCTION mits_calculate_prorata(
    p_monthly_amount DECIMAL(10,2),
    p_start_date DATE,
    p_end_date DATE
)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    v_days_in_month INTEGER;
    v_billable_days INTEGER;
BEGIN
    v_days_in_month := EXTRACT(DAY FROM (DATE_TRUNC('month', p_start_date) + INTERVAL '1 month - 1 day'));
    v_billable_days := (p_end_date - p_start_date) + 1;

    RETURN ROUND((p_monthly_amount / v_days_in_month) * v_billable_days, 2);
END;
$$ LANGUAGE plpgsql;
```

---

## 8. Margin Calculation Engine

### 8.1 Service Margin Calculation

```sql
-- Function: Calculate Service Margin
CREATE OR REPLACE FUNCTION mits_calculate_service_margin(p_service_id UUID)
RETURNS TABLE (
    component TEXT,
    retail_amount DECIMAL(10,2),
    cost_amount DECIMAL(10,2),
    margin_amount DECIMAL(10,2),
    margin_percent DECIMAL(5,2)
) AS $$
DECLARE
    v_service RECORD;
    v_tier RECORD;
    v_m365_pricing RECORD;
BEGIN
    SELECT * INTO v_service FROM mits_service_instances WHERE id = p_service_id;
    SELECT * INTO v_tier FROM mits_tier_catalogue WHERE tier_code = v_service.tier_code;
    SELECT * INTO v_m365_pricing FROM mits_m365_pricing WHERE licence_type = v_service.m365_licence_type;

    -- 1. Base Tier (simplified - actual cost breakdown in BRD)
    RETURN QUERY SELECT
        'Base Tier'::TEXT,
        v_tier.retail_price,
        v_tier.estimated_direct_cost,
        v_tier.retail_price - v_tier.estimated_direct_cost,
        v_tier.target_margin_percent;

    -- 2. Additional M365 Licences
    IF v_service.m365_additional_licences > 0 THEN
        RETURN QUERY SELECT
            'Additional M365 Licences'::TEXT,
            (v_service.m365_additional_licences * v_tier.m365_additional_rate),
            (v_service.m365_additional_licences * v_m365_pricing.csp_cost),
            (v_service.m365_additional_licences * (v_tier.m365_additional_rate - v_m365_pricing.csp_cost)),
            ((v_tier.m365_additional_rate - v_m365_pricing.csp_cost) / v_tier.m365_additional_rate * 100);
    END IF;

    -- 3. Add-on Modules
    RETURN QUERY SELECT
        'Add-on: ' || mc.module_name,
        (m.quantity * m.retail_price),
        (m.quantity * m.direct_cost),
        (m.quantity * (m.retail_price - m.direct_cost)),
        ((m.retail_price - m.direct_cost) / m.retail_price * 100)
    FROM mits_add_on_modules m
    JOIN mits_module_catalogue mc ON mc.module_code = m.module_code
    WHERE m.service_id = p_service_id AND m.status = 'active';

END;
$$ LANGUAGE plpgsql;

-- Function: Get Blended Margin
CREATE OR REPLACE FUNCTION mits_get_blended_margin(p_service_id UUID)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    v_total_retail DECIMAL(10,2);
    v_total_cost DECIMAL(10,2);
BEGIN
    SELECT SUM(retail_amount), SUM(cost_amount)
    INTO v_total_retail, v_total_cost
    FROM mits_calculate_service_margin(p_service_id);

    IF v_total_retail > 0 THEN
        RETURN ROUND(((v_total_retail - v_total_cost) / v_total_retail) * 100, 2);
    END IF;

    RETURN 0;
END;
$$ LANGUAGE plpgsql;
```

---

## 9. Microsoft 365 CSP Provisioning Integration

### 9.1 M365 Provisioning Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    M365 CSP PROVISIONING WORKFLOW                           │
└─────────────────────────────────────────────────────────────────────────────┘

1. NEW TENANT CREATION
   ├── CircleTel submits request to Link-up ICT
   ├── Link-up ICT creates tenant in Microsoft Partner Center
   ├── CircleTel receives tenant ID and initial admin credentials
   └── CircleTel verifies and configures delegated admin

2. DOMAIN VERIFICATION
   ├── Customer provides primary domain (e.g., company.co.za)
   ├── Add TXT record to DNS: MS=msXXXXXXXX
   ├── Verify domain in M365 Admin Center
   └── Set as primary (optional: add aliases)

3. LICENCE PROVISIONING
   ├── Allocate included licences per tier
   ├── For each user:
   │   ├── Create Azure AD user
   │   ├── Assign licence
   │   ├── Configure mailbox (Exchange)
   │   ├── Set OneDrive quota
   │   └── Add to appropriate security groups
   └── Log all provisioning actions

4. SECURITY CONFIGURATION
   ├── Enable MFA (conditional access policy)
   ├── Configure anti-spam/anti-phishing
   ├── Set password policies
   ├── Enable audit logging
   └── Configure data loss prevention (Premium+)

5. BACKUP ENABLEMENT
   ├── Connect Veeam/Datto to M365 tenant
   ├── Configure backup policies
   │   ├── Exchange: all mailboxes
   │   ├── OneDrive: all users
   │   └── SharePoint: all sites
   └── Run initial backup
```

### 9.2 M365 Licence Management Functions

```sql
-- Function: Provision M365 Licence
CREATE OR REPLACE FUNCTION mits_provision_m365_licence(
    p_service_id UUID,
    p_user_email TEXT,
    p_user_name TEXT,
    p_is_included BOOLEAN
)
RETURNS UUID AS $$
DECLARE
    v_service RECORD;
    v_pricing RECORD;
    v_licence_id UUID;
BEGIN
    SELECT * INTO v_service FROM mits_service_instances WHERE id = p_service_id;
    SELECT * INTO v_pricing FROM mits_m365_pricing WHERE licence_type = v_service.m365_licence_type;

    INSERT INTO mits_m365_licences (
        service_id, user_email, user_display_name, licence_type,
        is_included, retail_price, csp_cost, status
    ) VALUES (
        p_service_id, p_user_email, p_user_name, v_service.m365_licence_type,
        p_is_included,
        CASE WHEN p_is_included THEN 0 ELSE v_pricing.retail_price END,
        v_pricing.csp_cost,
        'pending'
    )
    RETURNING id INTO v_licence_id;

    -- Update additional licence count if not included
    IF NOT p_is_included THEN
        UPDATE mits_service_instances
        SET m365_additional_licences = m365_additional_licences + 1,
            updated_at = NOW()
        WHERE id = p_service_id;
    END IF;

    RETURN v_licence_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Deprovision M365 Licence
CREATE OR REPLACE FUNCTION mits_deprovision_m365_licence(p_licence_id UUID)
RETURNS VOID AS $$
DECLARE
    v_licence RECORD;
BEGIN
    SELECT * INTO v_licence FROM mits_m365_licences WHERE id = p_licence_id;

    -- Set grace period (30 days per Microsoft CSP rules)
    UPDATE mits_m365_licences
    SET status = 'deprovisioned',
        deprovisioned_at = NOW(),
        grace_period_ends = CURRENT_DATE + INTERVAL '30 days',
        updated_at = NOW()
    WHERE id = p_licence_id;

    -- Update additional licence count if was additional
    IF NOT v_licence.is_included THEN
        UPDATE mits_service_instances
        SET m365_additional_licences = m365_additional_licences - 1,
            updated_at = NOW()
        WHERE id = v_licence.service_id;
    END IF;
END;
$$ LANGUAGE plpgsql;
```

### 9.3 Existing Tenant Migration

| Step | Action | Owner | SLA |
|---|---|---|---|
| 1 | Customer signs Microsoft Customer Agreement | Customer | — |
| 2 | CircleTel requests DAP (Delegated Admin Privileges) | CircleTel | 24 hours |
| 3 | Customer approves DAP request | Customer | — |
| 4 | CircleTel verifies current licence state | CircleTel | 4 hours |
| 5 | Transfer billing to CircleTel CSP | Link-up ICT | 48 hours |
| 6 | Verify all services operational | CircleTel | 4 hours |

---

## 10. Connectivity Integration — SkyFibre FWB

### 10.1 Bundled Connectivity

Managed IT Services includes bundled SkyFibre connectivity. The connectivity provisioning follows the SkyFibre FSD (CT-FSD-SKYFIBRE-SMB-2026-001) with the following MITS-specific overrides:

| Parameter | SkyFibre Standalone | MITS Bundled |
|---|---|---|
| Order type | Standalone | Linked to MITS service |
| Billing | Separate invoice | Combined in MITS invoice |
| Support | SkyFibre support queue | MITS support queue (higher priority) |
| SLA | Per SkyFibre tier | Per MITS tier (typically enhanced) |
| Static IP | Optional add-on | Included (varies by tier) |

### 10.2 Connectivity Linking

```sql
-- Function: Link SkyFibre Service to MITS
CREATE OR REPLACE FUNCTION mits_link_connectivity(
    p_mits_service_id UUID,
    p_skyfibre_service_id UUID
)
RETURNS VOID AS $$
BEGIN
    UPDATE mits_service_instances
    SET skyfibre_service_id = p_skyfibre_service_id,
        updated_at = NOW()
    WHERE id = p_mits_service_id;

    -- Tag SkyFibre service as bundled
    UPDATE service_instances
    SET notes = COALESCE(notes, '') || ' [MITS Bundled: ' || p_mits_service_id || ']',
        updated_at = NOW()
    WHERE id = p_skyfibre_service_id;
END;
$$ LANGUAGE plpgsql;
```

---

## 11. Support Tier & Escalation Logic

### 11.1 Support Tier Matrix

| Tier | Support Hours | P1 Response | P2 Response | P3 Response | Escalation Path |
|---|---|---|---|---|---|
| Essential | Mon-Fri 8-17 | 4 hours | 8 hours | NBD | L1 → L2 |
| Professional | Mon-Sat 7-19 | 2 hours | 4 hours | 8 hours | L1 → L2 → Link-up (complex) |
| Premium | 24x7 | 1 hour | 2 hours | 4 hours | L1 → L2 → Link-up → MS |
| Enterprise | 24x7 Priority | 30 min | 1 hour | 2 hours | L1 → L2 → Link-up → MS (priority) |

### 11.2 Escalation State Machine

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MITS SUPPORT ESCALATION FLOW                             │
└─────────────────────────────────────────────────────────────────────────────┘

                    ┌───────────┐
                    │   OPEN    │
                    └─────┬─────┘
                          │ assign()
                          ▼
                    ┌───────────┐
                    │ L1 SUPPORT│ (CircleTel Helpdesk)
                    └─────┬─────┘
                          │
          ┌───────────────┼───────────────┐
          │ resolved      │ complex       │ timeout
          ▼               ▼               ▼
    ┌───────────┐   ┌───────────┐   ┌───────────┐
    │ RESOLVED  │   │ L2 SUPPORT│   │ ESCALATED │
    └───────────┘   └─────┬─────┘   └───────────┘
                          │ (CircleTel IT Team)
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
    ┌───────────┐   ┌───────────┐   ┌───────────┐
    │ RESOLVED  │   │ L3 LINK-UP│   │AWAIT_VENDOR│
    └───────────┘   └─────┬─────┘   └───────────┘
                          │ (Complex M365/Azure)
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
    ┌───────────┐   ┌───────────┐   ┌───────────┐
    │ RESOLVED  │   │L4 MICROSOFT│  │AWAIT_VENDOR│
    └───────────┘   └─────┬─────┘   └───────────┘
                          │
                          ▼
                    ┌───────────┐
                    │ RESOLVED  │
                    └───────────┘
```

### 11.3 Link-up ICT Escalation Rules

| Rule ID | Condition | Action |
|---|---|---|
| ESC-001 | Ticket unresolved >1 hour (P1, Premium+) | Auto-escalate to Link-up ICT |
| ESC-002 | M365 tenant issue | Manual escalate to Link-up ICT |
| ESC-003 | Azure AD/Intune issue | Manual escalate to Link-up ICT |
| ESC-004 | Link-up ICT unresolved >4 hours | Escalate to Microsoft |
| ESC-005 | Enterprise customer P1 | Immediate parallel escalation to L2 + Link-up |

### 11.4 Escalation Function

```sql
-- Function: Escalate Ticket
CREATE OR REPLACE FUNCTION mits_escalate_ticket(
    p_ticket_id UUID,
    p_escalation_level INTEGER,
    p_reason TEXT
)
RETURNS VOID AS $$
DECLARE
    v_ticket RECORD;
BEGIN
    SELECT * INTO v_ticket FROM mits_support_tickets WHERE id = p_ticket_id;

    UPDATE mits_support_tickets
    SET escalation_level = p_escalation_level,
        status = CASE
            WHEN p_escalation_level = 3 THEN 'awaiting_link_up'
            WHEN p_escalation_level = 4 THEN 'awaiting_microsoft'
            ELSE 'escalated'
        END,
        updated_at = NOW()
    WHERE id = p_ticket_id;

    -- Log escalation
    INSERT INTO mits_ticket_history (ticket_id, action, details)
    VALUES (p_ticket_id, 'escalated',
            'Escalated to L' || p_escalation_level || ': ' || p_reason);

    -- Notify escalation target
    PERFORM mits_notify_escalation(p_ticket_id, p_escalation_level);
END;
$$ LANGUAGE plpgsql;
```

---

## 12. Backup & Disaster Recovery Integration

### 12.1 Backup Configuration by Tier

| Tier | Storage | Scope | Retention | RTO | RPO |
|---|---|---|---|---|---|
| Essential | None (add-on) | — | — | — | — |
| Professional | 500 GB | M365, selected endpoints | 30 days | 4 hours | 12 hours |
| Premium | 1 TB | M365, all endpoints | 90 days | 4 hours | 6 hours |
| Enterprise | Unlimited | M365, endpoints, servers | 365 days | 2 hours | 1 hour |

### 12.2 Backup Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       BACKUP WORKFLOW (Veeam/Datto)                         │
└─────────────────────────────────────────────────────────────────────────────┘

1. DAILY BACKUP (02:00 SAST)
   ├── M365 Backup
   │   ├── Exchange Online: All mailboxes
   │   ├── OneDrive: All users
   │   ├── SharePoint: All sites
   │   └── Teams: Channel conversations + files
   │
   └── Endpoint Backup (if applicable)
       ├── Agent on Windows devices
       └── Selected folders + system state

2. BACKUP MONITORING
   ├── Check backup job status (daily 07:00)
   ├── Alert on failure: P2 ticket auto-created
   └── Weekly backup report to customer (Premium+)

3. RESTORE PROCESS
   ├── Customer request via support ticket
   ├── Verify restore point available
   ├── Execute restore (granular or full)
   ├── Verify data integrity
   └── Close ticket, log restore event
```

### 12.3 Backup Monitoring Function

```sql
-- Function: Check Backup Status
CREATE OR REPLACE FUNCTION mits_check_backup_status(p_service_id UUID)
RETURNS TABLE (
    backup_type TEXT,
    last_backup TIMESTAMPTZ,
    status TEXT,
    size_gb DECIMAL(10,2),
    alert_required BOOLEAN
) AS $$
BEGIN
    -- Query Veeam/Datto API (placeholder)
    RETURN QUERY SELECT
        'M365'::TEXT,
        NOW() - INTERVAL '8 hours',
        'success'::TEXT,
        125.5,
        false;
END;
$$ LANGUAGE plpgsql;
```

---

## 13. Security Services Integration

### 13.1 Security Stack by Tier

| Component | Essential | Professional | Premium | Enterprise |
|---|---|---|---|---|
| Email Security (Anti-spam) | Basic | Advanced | Complete | Enterprise |
| Managed Firewall | — | Reyee | Reyee | Fortinet/Reyee |
| Endpoint Protection | — | Defender for Business | Defender for Business | Defender for Endpoint |
| Web Content Filtering | — | DNS-based | DNS-based | Full proxy |
| Security Awareness Training | — | — | Quarterly | Monthly |
| SIEM/SOC | — | — | — | Yes |
| Penetration Testing | — | — | — | Annual |

### 13.2 Firewall Configuration

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MANAGED FIREWALL CONFIGURATION                           │
└─────────────────────────────────────────────────────────────────────────────┘

1. DEFAULT POLICIES (Reyee Cloud)
   ├── Outbound: ALLOW all (log)
   ├── Inbound: DENY all except:
   │   ├── Established connections
   │   ├── ICMP ping (optional)
   │   └── Customer-specific rules
   │
   ├── IPS/IDS: Enabled (detect mode)
   └── Geo-blocking: Optional (Enterprise)

2. STANDARD RULES (Professional+)
   ├── Block known malicious IPs (updated daily)
   ├── Block Tor exit nodes
   ├── Block P2P protocols (optional)
   └── Rate limiting on web traffic

3. WEB FILTERING CATEGORIES (Blocked)
   ├── Malware / Phishing
   ├── Adult content
   ├── Gambling
   ├── Proxy / Anonymiser
   └── Custom categories (per customer request)
```

---

## 14. SLA Monitoring & Service Credit Engine

### 14.1 SLA Parameters by Tier

| Tier | Uptime | P1 Response | P1 Resolution | Credit Rate |
|---|---|---|---|---|
| Essential | 99.0% | 4 hours | 48 hours | None |
| Professional | 99.5% | 2 hours | 12 hours | 5%/hour |
| Premium | 99.5% | 1 hour | 8 hours | 10%/hour |
| Enterprise | 99.9% | 30 min | 4 hours | 15%/hour |

### 14.2 SLA Monitoring Function

```sql
-- Function: Check SLA Compliance
CREATE OR REPLACE FUNCTION mits_check_sla_compliance(
    p_service_id UUID,
    p_period_start DATE,
    p_period_end DATE
)
RETURNS TABLE (
    metric TEXT,
    target_value DECIMAL(10,2),
    actual_value DECIMAL(10,2),
    compliant BOOLEAN,
    credit_amount DECIMAL(10,2)
) AS $$
DECLARE
    v_service RECORD;
    v_tier RECORD;
    v_uptime DECIMAL(10,4);
    v_tickets RECORD;
BEGIN
    SELECT * INTO v_service FROM mits_service_instances WHERE id = p_service_id;
    SELECT * INTO v_tier FROM mits_tier_catalogue WHERE tier_code = v_service.tier_code;

    -- 1. Calculate uptime (from connectivity monitoring)
    v_uptime := mits_calculate_uptime(p_service_id, p_period_start, p_period_end);

    RETURN QUERY SELECT
        'Uptime'::TEXT,
        v_tier.uptime_guarantee,
        v_uptime,
        v_uptime >= v_tier.uptime_guarantee,
        CASE
            WHEN v_uptime >= v_tier.uptime_guarantee THEN 0
            ELSE mits_calculate_uptime_credit(v_service.retail_price, v_tier.uptime_guarantee, v_uptime, v_tier.service_credit_rate)
        END;

    -- 2. Check P1 response SLA
    FOR v_tickets IN
        SELECT * FROM mits_support_tickets
        WHERE service_id = p_service_id
        AND priority = 'P1'
        AND opened_at BETWEEN p_period_start AND p_period_end
    LOOP
        RETURN QUERY SELECT
            'P1 Response (Ticket ' || v_tickets.ticket_number || ')'::TEXT,
            v_tier.sla_response_p1::DECIMAL,
            EXTRACT(EPOCH FROM (v_tickets.first_response_at - v_tickets.opened_at)) / 3600,
            v_tickets.first_response_at <= v_tickets.sla_response_deadline,
            CASE WHEN v_tickets.sla_response_breached THEN v_service.retail_price * 0.05 ELSE 0 END;
    END LOOP;

END;
$$ LANGUAGE plpgsql;

-- Function: Calculate Service Credit
CREATE OR REPLACE FUNCTION mits_calculate_uptime_credit(
    p_mrc DECIMAL(10,2),
    p_target_uptime DECIMAL(10,2),
    p_actual_uptime DECIMAL(10,2),
    p_credit_rate DECIMAL(5,2)
)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    v_breach_hours DECIMAL(10,2);
    v_credit DECIMAL(10,2);
BEGIN
    -- Calculate breach hours (assuming 720 hours/month)
    v_breach_hours := (p_target_uptime - p_actual_uptime) / 100 * 720;

    -- Calculate credit (capped at 50% of MRC)
    v_credit := LEAST(v_breach_hours * (p_mrc * p_credit_rate / 100), p_mrc * 0.5);

    RETURN ROUND(v_credit, 2);
END;
$$ LANGUAGE plpgsql;
```

---

## 15. Notification & Event Engine

### 15.1 Notification Events

| Event | Trigger | Channels | Recipients |
|---|---|---|---|
| Order Submitted | Order status → submitted | Email | Customer, Sales |
| Credit Approved | Order status → credit_approved | Email, SMS | Customer |
| Installation Scheduled | Installation date set | Email, SMS, WhatsApp | Customer, IT Contact |
| Service Activated | Service status → active | Email | Customer, IT Contact |
| Invoice Generated | Invoice created | Email | Billing Contact |
| Payment Received | Payment confirmed | Email | Billing Contact |
| Payment Overdue | 7+ days overdue | Email, SMS | Billing Contact |
| Ticket Created | Support ticket opened | Email | Requester |
| Ticket Updated | Status change | Email | Requester |
| SLA Breach Warning | 80% of SLA time elapsed | Email | Support Team |
| M365 Licence Assigned | User licence provisioned | Email | User, IT Contact |
| Backup Failure | Backup job failed | Email | IT Contact, Support |
| Service Suspended | Billing suspension | Email, SMS | Customer, IT Contact |

### 15.2 Notification Templates

```sql
CREATE TABLE public.mits_notification_templates (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type            TEXT NOT NULL UNIQUE,
    subject_template      TEXT NOT NULL,
    body_template         TEXT NOT NULL,
    sms_template          TEXT,
    whatsapp_template     TEXT,
    is_active             BOOLEAN DEFAULT true,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Example template
INSERT INTO mits_notification_templates (event_type, subject_template, body_template, sms_template)
VALUES (
    'service_activated',
    'Welcome to CircleTel Managed IT Services - {{service_number}}',
    E'Dear {{customer_name}},\n\nYour Managed IT Services account is now active!\n\nService Number: {{service_number}}\nTier: {{tier_name}}\nSupport Line: 082 487 3900 (WhatsApp)\n\nYour M365 tenant: {{m365_domain}}\n\nWelcome to the CircleTel family!\n\nBest regards,\nCircleTel Team',
    'CircleTel: Your Managed IT service {{service_number}} is now active. Support: 082 487 3900'
);
```

---

## 16. Reporting & Analytics Data Logic

### 16.1 Key Metrics Views

```sql
-- View: MITS Revenue Summary
CREATE OR REPLACE VIEW mits_revenue_summary AS
SELECT
    DATE_TRUNC('month', i.billing_period_start) AS period,
    COUNT(DISTINCT s.id) AS active_services,
    SUM(i.total_incl_vat) AS total_revenue,
    AVG(i.total_incl_vat) AS avg_invoice,
    SUM(CASE WHEN i.status = 'paid' THEN i.total_incl_vat ELSE 0 END) AS collected_revenue,
    SUM(CASE WHEN i.status = 'overdue' THEN i.total_incl_vat ELSE 0 END) AS outstanding_revenue
FROM invoices i
JOIN mits_service_instances s ON s.customer_id = i.customer_id
WHERE i.invoice_number LIKE 'INV-MITS-%'
GROUP BY DATE_TRUNC('month', i.billing_period_start);

-- View: MITS Margin Analysis
CREATE OR REPLACE VIEW mits_margin_analysis AS
SELECT
    s.tier_code,
    COUNT(*) AS service_count,
    AVG(s.retail_price) AS avg_retail,
    AVG(s.total_direct_cost) AS avg_cost,
    AVG((s.retail_price - s.total_direct_cost) / s.retail_price * 100) AS avg_margin_percent
FROM mits_service_instances s
WHERE s.service_status = 'active'
GROUP BY s.tier_code;

-- View: Support Ticket Metrics
CREATE OR REPLACE VIEW mits_support_metrics AS
SELECT
    DATE_TRUNC('week', t.opened_at) AS week,
    COUNT(*) AS total_tickets,
    COUNT(*) FILTER (WHERE t.priority = 'P1') AS p1_tickets,
    AVG(EXTRACT(EPOCH FROM (t.first_response_at - t.opened_at)) / 3600) AS avg_response_hours,
    AVG(EXTRACT(EPOCH FROM (t.resolved_at - t.opened_at)) / 3600) AS avg_resolution_hours,
    COUNT(*) FILTER (WHERE t.sla_response_breached) AS sla_breaches,
    COUNT(*) FILTER (WHERE t.escalation_level >= 3) AS escalations_to_linkup
FROM mits_support_tickets t
GROUP BY DATE_TRUNC('week', t.opened_at);

-- View: M365 Licence Utilisation
CREATE OR REPLACE VIEW mits_m365_utilisation AS
SELECT
    s.tier_code,
    s.m365_licence_type,
    SUM(s.m365_included_licences) AS total_included,
    SUM(s.m365_additional_licences) AS total_additional,
    SUM(s.m365_included_licences + s.m365_additional_licences) AS total_licences,
    COUNT(l.id) FILTER (WHERE l.status = 'active') AS active_licences,
    COUNT(l.id) FILTER (WHERE l.status = 'pending') AS pending_licences
FROM mits_service_instances s
LEFT JOIN mits_m365_licences l ON l.service_id = s.id
WHERE s.service_status = 'active'
GROUP BY s.tier_code, s.m365_licence_type;
```

### 16.2 Dashboard KPIs

| KPI | Definition | Target | Query |
|---|---|---|---|
| MRR | Sum of active service monthly revenue | R500k by M12 | `SELECT SUM(retail_price) FROM mits_service_instances WHERE service_status = 'active'` |
| Blended Margin | Average margin across all services | >35% | Use `mits_margin_analysis` view |
| Churn Rate | Services cancelled / starting services | <2%/month | Count cancelled in period / count at start |
| NPS | Net Promoter Score | >50 | Quarterly survey data |
| CSAT | Customer Satisfaction | >4.0/5.0 | Post-ticket survey |
| First Response SLA | % of tickets meeting response SLA | >95% | From `mits_support_metrics` |
| Resolution SLA | % of tickets meeting resolution SLA | >90% | From `mits_support_metrics` |
| Licence Utilisation | Active licences / allocated licences | >80% | From `mits_m365_utilisation` |

---

## 17. API Contract Specifications

### 17.1 Internal APIs

#### Create MITS Order

```yaml
POST /api/mits/orders
Content-Type: application/json
Authorization: Bearer {jwt}

Request:
{
  "customer_id": "uuid",
  "tier_code": "MITS_PROFESSIONAL",
  "additional_m365_users": 5,
  "add_on_modules": ["MOD_LTE_FAILOVER"],
  "contract_type": "12_month",
  "notes": "Referred by Partner XYZ"
}

Response:
{
  "id": "uuid",
  "order_number": "ORD-MITS-000001",
  "status": "draft",
  "total_mrc": 5999.00,
  "total_nrc": 0,
  "created_at": "2026-03-12T10:00:00Z"
}
```

#### Provision M365 User

```yaml
POST /api/mits/m365/users
Content-Type: application/json
Authorization: Bearer {jwt}

Request:
{
  "service_id": "uuid",
  "user_email": "john@company.co.za",
  "user_display_name": "John Smith",
  "is_additional": true
}

Response:
{
  "id": "uuid",
  "user_email": "john@company.co.za",
  "licence_type": "business_standard",
  "status": "pending",
  "provisioned_at": null
}
```

#### Create Support Ticket

```yaml
POST /api/mits/support/tickets
Content-Type: application/json
Authorization: Bearer {jwt}

Request:
{
  "service_id": "uuid",
  "category": "m365",
  "priority": "P2",
  "description": "User unable to access SharePoint"
}

Response:
{
  "id": "uuid",
  "ticket_number": "TKT-MITS-000001",
  "status": "open",
  "sla_response_deadline": "2026-03-12T14:00:00Z",
  "sla_resolution_deadline": "2026-03-12T22:00:00Z"
}
```

### 17.2 External API Integrations

| System | Endpoint | Purpose | Auth |
|---|---|---|---|
| Link-up ICT | Manual/Email (Phase 1) | M365 provisioning, escalation | Credentials |
| Veeam/Datto | REST API | Backup status, restore requests | API Key |
| Reyee Cloud | REST API | CPE/firewall configuration | OAuth 2.0 |
| TransUnion | REST API | Credit check | API Key |
| NetCash | Pay Now API | Payment processing | Service Key |

---

## 18. Validation Rule Register

### 18.1 Order Validation Rules

| Rule ID | Field | Validation | Error Message |
|---|---|---|---|
| VAL-001 | tier_code | Must be valid tier | "Invalid tier code" |
| VAL-002 | customer_id | Must exist and be eligible | "Customer not found or not eligible" |
| VAL-003 | additional_m365_users | Must be >= 0 | "Additional users cannot be negative" |
| VAL-004 | discount_percent | Must be <= max for authority | "Discount exceeds authority limit" |
| VAL-005 | contract_type | Must be valid type | "Invalid contract type" |

### 18.2 M365 Licence Validation Rules

| Rule ID | Field | Validation | Error Message |
|---|---|---|---|
| VAL-010 | user_email | Must be valid email format | "Invalid email format" |
| VAL-011 | user_email | Must not already exist for service | "User already has a licence" |
| VAL-012 | licence_type | Must match service tier | "Licence type mismatch" |
| VAL-013 | included_count | Cannot exceed tier allocation | "Included licence limit reached" |

### 18.3 Support Ticket Validation Rules

| Rule ID | Field | Validation | Error Message |
|---|---|---|---|
| VAL-020 | service_id | Must be active service | "Service not active" |
| VAL-021 | priority | Must be valid priority | "Invalid priority level" |
| VAL-022 | category | Must be valid category | "Invalid category" |
| VAL-023 | description | Must be >= 10 characters | "Description too short" |

---

## 19. Error Handling & Recovery

### 19.1 Error Categories

| Category | Response Code | Retry | Notification |
|---|---|---|---|
| Validation Error | 400 | No | User feedback |
| Authentication Error | 401 | No | User feedback |
| Authorization Error | 403 | No | User feedback |
| Not Found | 404 | No | User feedback |
| Business Rule Violation | 422 | No | User feedback |
| External Service Unavailable | 503 | Yes (3x backoff) | Support team |
| Internal Error | 500 | Yes (3x) | Support team + alert |

### 19.2 Recovery Procedures

| Scenario | Detection | Recovery | Escalation |
|---|---|---|---|
| M365 provisioning failure | API error | Retry, manual intervention | Link-up ICT |
| Backup job failure | Monitoring alert | Retry, investigate | Support team |
| Billing sync failure | Reconciliation | Manual sync, investigate | Finance |
| SkyFibre activation failure | Status timeout | Follow SkyFibre FSD | NOC |

### 19.3 Circuit Breaker Pattern

```sql
-- Table: Track external service health
CREATE TABLE public.mits_service_health (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_name          TEXT NOT NULL UNIQUE,
    status                TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'down')),
    last_success          TIMESTAMPTZ,
    last_failure          TIMESTAMPTZ,
    failure_count         INTEGER DEFAULT 0,
    circuit_open          BOOLEAN DEFAULT false,
    circuit_opened_at     TIMESTAMPTZ,
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO mits_service_health (service_name, status) VALUES
('microsoft_csp', 'healthy'),
('veeam_backup', 'healthy'),
('reyee_cloud', 'healthy'),
('skyfibre_stack', 'healthy');
```

---

## 20. Non-Functional Requirements

### 20.1 Performance Requirements

| Metric | Target | Measurement |
|---|---|---|
| API Response Time (p95) | <500ms | Application monitoring |
| Order Processing Time | <5 seconds | Transaction log |
| Invoice Generation | <30 seconds | Batch job monitoring |
| Dashboard Load Time | <3 seconds | Browser timing |
| Concurrent Users | 100+ | Load testing |

### 20.2 Availability Requirements

| Component | Target Uptime | Maintenance Window |
|---|---|---|
| Customer Portal | 99.5% | Sunday 02:00-06:00 SAST |
| Billing System | 99.9% | Sunday 02:00-04:00 SAST |
| Support System | 99.9% | None (24/7) |
| M365 Integration | 99.5% | Per Microsoft schedule |

### 20.3 Security Requirements

| Requirement | Implementation |
|---|---|
| Data Encryption at Rest | AES-256 (Supabase, Veeam) |
| Data Encryption in Transit | TLS 1.3 |
| Authentication | JWT + MFA for admin |
| Authorization | Row-Level Security (RLS) |
| Audit Logging | All state changes logged |
| Data Residency | Azure South Africa (za-north) |
| POPIA Compliance | Data processing agreements, consent tracking |

### 20.4 Scalability Requirements

| Dimension | Current Capacity | Growth Target |
|---|---|---|
| Customers | 100 | 500 (Year 1) |
| Services | 150 | 750 (Year 1) |
| M365 Licences | 1,500 | 7,500 (Year 1) |
| Support Tickets/Month | 200 | 1,000 (Year 1) |
| MRR | R150k | R500k (Month 12) |

---

## Document Control

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0 | 12 March 2026 | CircleTel Product & Technology | Initial FSD aligned to CPS v2.0 and BRD v1.0 |

---

*This document defines the technical implementation specifications for Managed IT Services. For commercial rules, see CT-MITS-CPS-2026-002. For business rules, see CT-MITS-BRD-2026-001.*

*CircleTel (Pty) Ltd — Reliable Tech Solutions*

*"Connecting Today, Creating Tomorrow"*
