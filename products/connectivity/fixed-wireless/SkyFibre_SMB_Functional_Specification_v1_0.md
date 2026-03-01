# SkyFibre SMB — Functional Specification Document (FSD)

## System Behaviour, Data Logic & Integration Rules

---

| Field | Value |
|---|---|
| **Document Reference** | CT-FSD-SKYFIBRE-SMB-2026-001 |
| **Version** | 1.0 |
| **Effective Date** | 27 February 2026 |
| **Classification** | Confidential — Internal & Development Use |
| **Locale** | en-ZA (South African English) |
| **Prepared By** | CircleTel Product & Technology |
| **Companion Documents** | CPS v2.0 (CT-CPS-SKYFIBRE-SMB-2026-002), BRD v1.0 (CT-BRD-SKYFIBRE-SMB-2026-001) |
| **Supersedes** | N/A — First issue |

---

## Version Control

| Version | Date | Author | Changes | Status |
|---|---|---|---|---|
| 1.0 | 27 February 2026 | CircleTel Product & Technology | Initial FSD aligned to CPS v2.0 modular architecture and BRD v1.0 business rules | **CURRENT** |

---

## Table of Contents

1. Purpose & Scope
2. System Landscape & Integration Map
3. Data Model
4. Product Catalogue Data Logic
5. Order Lifecycle State Machine
6. Service Instance Lifecycle
7. Billing Engine Logic
8. Margin & MSC Calculation Engine
9. Provisioning Integration — MTN Wholesale FWB
10. Network Integration — BNG, RADIUS & ENNI
11. CPE Management Integration — Ruijie Cloud
12. CRM & Sales Pipeline Logic
13. Support & Fault Management Logic
14. SLA Monitoring & Service Credit Engine
15. Notification & Event Engine
16. Reporting & Analytics Data Logic
17. API Contract Specifications
18. Validation Rule Register
19. Error Handling & Recovery
20. Non-Functional Requirements

---

## 1. Purpose & Scope

This Functional Specification Document (FSD) defines the system behaviour, data models, calculation logic, integration contracts, and state machines required to operationalise the SkyFibre SMB product line within CircleTel's technology estate.

It translates the commercial rules in the BRD v1.0 and the product parameters in CPS v2.0 into implementable system specifications for the development, integration, and operations teams.

**In scope:** All systems involved in the SkyFibre SMB order-to-cash and service management lifecycle — AgilityGIS BSS, MTN Wholesale portal, Echo SP/BNG, Interstellio RADIUS, Ruijie Cloud, Supabase backend, CRM, notification services, and reporting dashboards.

**Out of scope:** SkyFibre Residential, HomeFibreConnect, BizFibreConnect, UmojaLink, and IoT product lines.

---

## 2. System Landscape & Integration Map

### 2.1 Systems of Record

| System | Role | Owner | Type |
|---|---|---|---|
| **AgilityGIS BSS** | Billing, invoicing, customer master, service catalogue | CircleTel | SoR — Customer & Billing |
| **Supabase (PostgreSQL)** | Backend database, API layer, deal catalogue, commission tracking | CircleTel | SoR — Product & Analytics |
| **MTN Wholesale Portal** | FWB order placement, RN device management, coverage check | MTN | External — Upstream |
| **Echo SP Managed BNG** | PPPoE session management, CGNAT, IP transit, RADIUS proxy | Echo SP | External — Network |
| **Interstellio RADIUS** | Subscriber authentication (AAA), session attributes, CoA | Interstellio | External — AAA |
| **Ruijie Cloud** | CPE router management, zero-touch provisioning, monitoring | Ruijie Networks | External — CPE |
| **CRM (Supabase)** | Lead tracking, pipeline, customer interactions, churn flags | CircleTel | SoR — Sales |
| **Notification Service** | Email, SMS, WhatsApp via API gateway | CircleTel | Internal |

### 2.2 Integration Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        CUSTOMER TOUCHPOINTS                         │
│  [ Sales Portal ]  [ Customer Portal ]  [ Mobile App ]  [ WhatsApp ]│
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
│  │ MTN Wholesale│  │   Echo SP    │  │  Ruijie Cloud│              │
│  │   Portal     │  │ Managed BNG  │  │  Controller  │              │
│  │  (FWB Order) │  │ (PPPoE/CGNAT)│  │  (CPE Mgmt)  │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                 │                  │                       │
│         │         ┌───────┴────────┐         │                       │
│         │         │  Interstellio  │         │                       │
│         │         │    RADIUS      │         │                       │
│         │         │    (AAA)       │         │                       │
│         │         └────────────────┘         │                       │
└─────────┼──────────────────────────┼─────────┼───────────────────────┘
          │                          │         │
          ▼                          ▼         ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         NETWORK LAYER                                │
│  [ MTN Tarana G1 Base Stations ] ─── [ Tarana RN (Customer CPE) ]   │
│  [ Huawei BNG NE8000M14 @ JB1 ] ─── [ Huawei S9312 BNG @ CT1 ]    │
│  [ Echo SP Arista L2 Switching ] ─── [ IP Transit / BGP Peering ]   │
└──────────────────────────────────────────────────────────────────────┘
```

### 2.3 Integration Protocols

| Integration | Protocol | Auth | Direction | Frequency |
|---|---|---|---|---|
| Supabase ↔ AgilityGIS BSS | REST/JSON | API Key + JWT | Bidirectional | Real-time events + nightly batch |
| Supabase ↔ Ruijie Cloud | REST/JSON | OAuth 2.0 | Bidirectional | Real-time on provisioning; polling every 5 min for monitoring |
| Supabase ↔ MTN Wholesale | Manual / CSV upload (Phase 1); API (Phase 2) | Portal credentials | Push | Per order |
| Echo SP → Interstellio RADIUS | RADIUS (UDP 1812/1813) | Shared secret | Proxy | Per PPPoE session |
| Supabase ↔ Notification Service | REST/JSON | API Key | Push | Event-driven |
| Supabase → Reporting Dashboard | SQL Views + PostgREST | JWT (RLS) | Pull | On-demand + scheduled |

---

## 3. Data Model

### 3.1 Entity Relationship Summary

```
┌──────────────┐     1:N     ┌──────────────┐     1:N     ┌──────────────┐
│   Customer   │────────────►│    Service   │────────────►│   Module     │
│   Account    │             │   Instance   │             │ Subscription │
└──────┬───────┘             └──────┬───────┘             └──────────────┘
       │                            │
       │ 1:N                        │ 1:N
       ▼                            ▼
┌──────────────┐             ┌──────────────┐
│   Contact    │             │    Order     │
│   Person     │             │              │
└──────────────┘             └──────┬───────┘
                                    │ 1:N
                                    ▼
                             ┌──────────────┐
                             │  Order Line  │
                             │    Item      │
                             └──────────────┘

┌──────────────┐     1:1     ┌──────────────┐
│   Service    │────────────►│    CPE       │
│   Instance   │             │   Device     │
└──────┬───────┘             └──────────────┘
       │
       │ 1:N
       ▼
┌──────────────┐     1:N     ┌──────────────┐
│   Invoice    │────────────►│ Invoice Line │
└──────────────┘             └──────────────┘

┌──────────────┐     N:1     ┌──────────────┐
│Support Ticket│────────────►│   Service    │
└──────────────┘             │   Instance   │
                             └──────────────┘
```

### 3.2 Core Entity Schemas

#### 3.2.1 `customers`

```sql
CREATE TABLE public.customers (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_number        TEXT NOT NULL UNIQUE,  -- CT-SMB-XXXXXX
    company_name          TEXT NOT NULL,
    trading_name          TEXT,
    registration_number   TEXT NOT NULL,         -- CIPC
    vat_number            TEXT,
    entity_type           TEXT NOT NULL CHECK (
        entity_type IN ('pty_ltd', 'cc', 'sole_proprietor', 'npc', 'trust', 'partnership', 'government')
    ),
    billing_address       JSONB NOT NULL,
    installation_address  JSONB NOT NULL,
    credit_score          INTEGER,
    credit_status         TEXT CHECK (
        credit_status IN ('pass', 'marginal', 'fail', 'waived', 'pending')
    ),
    credit_checked_at     TIMESTAMPTZ,
    contract_type         TEXT NOT NULL DEFAULT 'month_to_month' CHECK (
        contract_type IN ('month_to_month', '12_month', '24_month')
    ),
    payment_method        TEXT NOT NULL DEFAULT 'debit_order' CHECK (
        payment_method IN ('debit_order', 'eft')
    ),
    account_status        TEXT NOT NULL DEFAULT 'pending' CHECK (
        account_status IN ('pending', 'active', 'suspended', 'terminated', 'cancelled')
    ),
    partner_id            UUID REFERENCES public.partners(id),
    arlan_channel         BOOLEAN NOT NULL DEFAULT false,
    source_channel        TEXT CHECK (
        source_channel IN ('direct_sales', 'partner', 'website', 'arlan_backstop', 'referral')
    ),
    onboarded_at          TIMESTAMPTZ,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customers_account ON public.customers(account_number);
CREATE INDEX idx_customers_status ON public.customers(account_status);
CREATE INDEX idx_customers_partner ON public.customers(partner_id);
```

#### 3.2.2 `service_instances`

```sql
CREATE TABLE public.service_instances (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id           UUID NOT NULL REFERENCES public.customers(id),
    service_number        TEXT NOT NULL UNIQUE,  -- SF-SMB-XXXXXX
    product_code          TEXT NOT NULL CHECK (
        product_code IN ('SF_BIZ_50', 'SF_BIZ_100', 'SF_BIZ_200')
    ),
    speed_dl_mbps         INTEGER NOT NULL,
    speed_ul_mbps         INTEGER NOT NULL,
    retail_price          DECIMAL(10,2) NOT NULL,
    wholesale_cost        DECIMAL(10,2) NOT NULL,
    static_ip_address     INET,
    pppoe_username        TEXT,                  -- user@circletel.co.za
    pppoe_realm           TEXT DEFAULT 'circletel.co.za',
    installation_date     DATE,
    installation_status   TEXT DEFAULT 'pending' CHECK (
        installation_status IN ('pending', 'scheduled', 'in_progress', 'completed', 'failed', 'cancelled')
    ),
    service_status        TEXT NOT NULL DEFAULT 'provisioning' CHECK (
        service_status IN (
            'provisioning', 'active', 'suspended_billing',
            'suspended_technical', 'suspended_aup',
            'pending_cancellation', 'cancelled', 'terminated'
        )
    ),
    sla_tier              TEXT NOT NULL DEFAULT 'basic' CHECK (
        sla_tier IN ('basic', 'enhanced', 'premium')
    ),
    contract_start_date   DATE,
    contract_end_date     DATE,                  -- NULL for month-to-month
    contract_type         TEXT NOT NULL DEFAULT 'month_to_month',
    cancellation_date     DATE,
    cancellation_reason   TEXT,
    mtn_order_reference   TEXT,                  -- MTN Wholesale order ID
    site_survey_status    TEXT CHECK (
        site_survey_status IN ('not_required', 'pending', 'scheduled', 'pass', 'conditional', 'fail')
    ),
    site_survey_signal_dbm DECIMAL(5,2),
    rn_device_serial      TEXT,                  -- Tarana RN serial number
    router_device_id      UUID REFERENCES public.cpe_devices(id),
    installation_cost_amortisation_remaining INTEGER DEFAULT 12, -- months
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_services_customer ON public.service_instances(customer_id);
CREATE INDEX idx_services_status ON public.service_instances(service_status);
CREATE INDEX idx_services_product ON public.service_instances(product_code);
```

#### 3.2.3 `module_subscriptions`

```sql
CREATE TABLE public.module_subscriptions (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id            UUID NOT NULL REFERENCES public.service_instances(id) ON DELETE CASCADE,
    module_code           TEXT NOT NULL CHECK (
        module_code IN (
            'MOD_ROUTER', 'MOD_SLA_ENHANCED', 'MOD_SLA_PREMIUM',
            'MOD_EMAIL_5', 'MOD_EMAIL_10',
            'MOD_BACKUP_50', 'MOD_BACKUP_100', 'MOD_BACKUP_250',
            'MOD_VPN_5', 'MOD_VPN_10',
            'MOD_FAILOVER_5G', 'MOD_SECURITY'
        )
    ),
    module_name           TEXT NOT NULL,
    retail_price          DECIMAL(10,2) NOT NULL,
    direct_cost           DECIMAL(10,2) NOT NULL,
    status                TEXT NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'active', 'suspended', 'cancelled', 'trial')
    ),
    trial_start_date      DATE,
    trial_end_date        DATE,                  -- 30-day trial max
    activated_at          TIMESTAMPTZ,
    cancelled_at          TIMESTAMPTZ,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Conflict constraint: only one SLA module per service
    CONSTRAINT unique_sla_per_service EXCLUDE USING gist (
        service_id WITH =,
        (CASE WHEN module_code IN ('MOD_SLA_ENHANCED', 'MOD_SLA_PREMIUM')
              THEN 'sla'::text ELSE module_code END) WITH =
    ) WHERE (status IN ('active', 'pending', 'trial'))
);

CREATE INDEX idx_modules_service ON public.module_subscriptions(service_id);
CREATE INDEX idx_modules_code ON public.module_subscriptions(module_code);
CREATE INDEX idx_modules_status ON public.module_subscriptions(status);
```

#### 3.2.4 `orders`

```sql
CREATE TABLE public.orders (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number          TEXT NOT NULL UNIQUE,   -- ORD-SF-XXXXXX
    customer_id           UUID NOT NULL REFERENCES public.customers(id),
    order_type            TEXT NOT NULL CHECK (
        order_type IN ('new_service', 'upgrade', 'downgrade', 'add_module',
                        'remove_module', 'cancellation', 'migration')
    ),
    order_status          TEXT NOT NULL DEFAULT 'draft' CHECK (
        order_status IN (
            'draft', 'submitted', 'credit_check', 'credit_approved',
            'credit_rejected', 'coverage_check', 'coverage_confirmed',
            'coverage_failed', 'site_survey_pending', 'site_survey_passed',
            'site_survey_failed', 'contract_pending', 'contract_signed',
            'provisioning', 'installation_scheduled',
            'installation_in_progress', 'installation_complete',
            'activation_pending', 'active', 'completed',
            'cancelled', 'rejected', 'on_hold'
        )
    ),
    total_mrc             DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_nrc             DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_percent      DECIMAL(5,2) DEFAULT 0,
    discount_authority     TEXT,
    sales_agent_id        UUID,
    partner_id            UUID REFERENCES public.partners(id),
    notes                 TEXT,
    submitted_at          TIMESTAMPTZ,
    completed_at          TIMESTAMPTZ,
    cancelled_at          TIMESTAMPTZ,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_customer ON public.orders(customer_id);
CREATE INDEX idx_orders_status ON public.orders(order_status);
```

#### 3.2.5 `order_line_items`

```sql
CREATE TABLE public.order_line_items (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id              UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    line_type             TEXT NOT NULL CHECK (
        line_type IN ('base_tier', 'module', 'nrc_installation', 'nrc_equipment', 'discount')
    ),
    product_code          TEXT NOT NULL,
    description           TEXT NOT NULL,
    quantity              INTEGER NOT NULL DEFAULT 1,
    unit_price            DECIMAL(10,2) NOT NULL,
    line_total            DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    recurring             BOOLEAN NOT NULL DEFAULT true,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_line_items_order ON public.order_line_items(order_id);
```

#### 3.2.6 `cpe_devices`

```sql
CREATE TABLE public.cpe_devices (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_type           TEXT NOT NULL CHECK (
        device_type IN ('tarana_rn', 'reyee_router', 'tozed_5g_cpe')
    ),
    model                 TEXT NOT NULL,
    serial_number         TEXT NOT NULL UNIQUE,
    mac_address           MACADDR,
    firmware_version      TEXT,
    ruijie_cloud_id       TEXT,                  -- Ruijie Cloud device ID
    ownership             TEXT NOT NULL CHECK (
        ownership IN ('mtn', 'circletel', 'customer')
    ),
    status                TEXT NOT NULL DEFAULT 'in_stock' CHECK (
        status IN ('in_stock', 'allocated', 'installed', 'faulty', 'returned', 'decommissioned')
    ),
    assigned_service_id   UUID REFERENCES public.service_instances(id),
    installed_at          TIMESTAMPTZ,
    last_seen_online      TIMESTAMPTZ,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cpe_serial ON public.cpe_devices(serial_number);
CREATE INDEX idx_cpe_service ON public.cpe_devices(assigned_service_id);
```

#### 3.2.7 `invoices` and `invoice_lines`

```sql
CREATE TABLE public.invoices (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number        TEXT NOT NULL UNIQUE,   -- INV-YYYYMM-XXXXXX
    customer_id           UUID NOT NULL REFERENCES public.customers(id),
    billing_period_start  DATE NOT NULL,
    billing_period_end    DATE NOT NULL,
    subtotal_excl_vat     DECIMAL(10,2) NOT NULL,
    vat_amount            DECIMAL(10,2) NOT NULL,
    total_incl_vat        DECIMAL(10,2) NOT NULL,
    credit_applied        DECIMAL(10,2) DEFAULT 0,
    status                TEXT NOT NULL DEFAULT 'generated' CHECK (
        status IN ('generated', 'sent', 'paid', 'partially_paid', 'overdue', 'written_off', 'credited')
    ),
    due_date              DATE NOT NULL,
    paid_date             DATE,
    payment_reference     TEXT,
    generated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at               TIMESTAMPTZ,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.invoice_lines (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id            UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    service_id            UUID REFERENCES public.service_instances(id),
    module_id             UUID REFERENCES public.module_subscriptions(id),
    description           TEXT NOT NULL,
    quantity              INTEGER NOT NULL DEFAULT 1,
    unit_price_excl_vat   DECIMAL(10,2) NOT NULL,
    vat_rate              DECIMAL(5,4) NOT NULL DEFAULT 0.15,
    line_total_excl_vat   DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price_excl_vat) STORED,
    line_vat              DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price_excl_vat * vat_rate) STORED,
    line_type             TEXT NOT NULL CHECK (
        line_type IN ('base_tier', 'module', 'nrc', 'credit_note', 'sla_credit', 'pro_rata', 'penalty')
    ),
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### 3.2.8 `support_tickets`

```sql
CREATE TABLE public.support_tickets (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number         TEXT NOT NULL UNIQUE,   -- TKT-XXXXXX
    customer_id           UUID NOT NULL REFERENCES public.customers(id),
    service_id            UUID REFERENCES public.service_instances(id),
    category              TEXT NOT NULL CHECK (
        category IN ('fault', 'billing', 'general', 'change_request', 'complaint', 'cancellation')
    ),
    priority              TEXT NOT NULL DEFAULT 'normal' CHECK (
        priority IN ('critical', 'high', 'normal', 'low')
    ),
    sla_tier              TEXT NOT NULL,          -- inherited from service at time of creation
    sla_response_deadline TIMESTAMPTZ,
    sla_resolution_deadline TIMESTAMPTZ,
    sla_breached          BOOLEAN DEFAULT false,
    status                TEXT NOT NULL DEFAULT 'open' CHECK (
        status IN ('open', 'assigned', 'in_progress', 'awaiting_customer',
                    'awaiting_mtn', 'escalated', 'resolved', 'closed')
    ),
    assigned_to           UUID,
    description           TEXT NOT NULL,
    resolution_notes      TEXT,
    opened_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    first_response_at     TIMESTAMPTZ,
    resolved_at           TIMESTAMPTZ,
    closed_at             TIMESTAMPTZ,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tickets_customer ON public.support_tickets(customer_id);
CREATE INDEX idx_tickets_service ON public.support_tickets(service_id);
CREATE INDEX idx_tickets_status ON public.support_tickets(status);
```

---

## 4. Product Catalogue Data Logic

### 4.1 Product Catalogue Table

```sql
CREATE TABLE public.product_catalogue (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_code          TEXT NOT NULL UNIQUE,
    product_type          TEXT NOT NULL CHECK (product_type IN ('base_tier', 'module')),
    product_name          TEXT NOT NULL,
    speed_dl_mbps         INTEGER,               -- NULL for modules
    speed_ul_mbps         INTEGER,               -- NULL for modules
    retail_price          DECIMAL(10,2) NOT NULL,
    wholesale_cost        DECIMAL(10,2) NOT NULL,
    direct_cost           DECIMAL(10,2) NOT NULL, -- all-in cost
    contribution_margin   DECIMAL(10,2) GENERATED ALWAYS AS (retail_price - direct_cost) STORED,
    margin_percent        DECIMAL(5,2),
    module_group          TEXT,                   -- for conflict detection: 'sla', 'email', 'backup', 'vpn'
    max_per_service       INTEGER DEFAULT 1,
    requires_base         BOOLEAN NOT NULL DEFAULT true,
    dependency_code       TEXT,                   -- module_code this depends on
    is_active             BOOLEAN NOT NULL DEFAULT true,
    effective_from        DATE NOT NULL,
    effective_to          DATE,                   -- NULL = no expiry
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 4.2 Seed Data — Base Tiers

| product_code | product_name | speed_dl | speed_ul | retail_price | wholesale_cost | direct_cost | margin_% |
|---|---|---|---|---|---|---|---|
| `SF_BIZ_50` | SkyFibre Business 50 | 50 | 12.5 | 1299.00 | 499.00 | 817.00 | 37.1 |
| `SF_BIZ_100` | SkyFibre Business 100 | 100 | 25 | 1499.00 | 599.00 | 917.00 | 38.8 |
| `SF_BIZ_200` | SkyFibre Business 200 | 200 | 50 | 1899.00 | 699.00 | 1017.00 | 46.4 |

### 4.3 Seed Data — Modules

| product_code | product_name | retail_price | direct_cost | module_group | dependency |
|---|---|---|---|---|---|
| `MOD_ROUTER` | Managed Router (Reyee) | 149.00 | 75.00 | router | — |
| `MOD_SLA_ENHANCED` | Enhanced SLA | 249.00 | 100.00 | sla | — |
| `MOD_SLA_PREMIUM` | Premium SLA | 499.00 | 225.00 | sla | — |
| `MOD_EMAIL_5` | Email Hosting (5 mailboxes) | 79.00 | 35.00 | email | — |
| `MOD_EMAIL_10` | Email Hosting (10 mailboxes) | 129.00 | 55.00 | email | — |
| `MOD_BACKUP_50` | Cloud Backup (50 GB) | 49.00 | 20.00 | backup | — |
| `MOD_BACKUP_100` | Cloud Backup (100 GB) | 99.00 | 40.00 | backup | — |
| `MOD_BACKUP_250` | Cloud Backup (250 GB) | 179.00 | 70.00 | backup | — |
| `MOD_VPN_5` | Business VPN (5 users) | 49.00 | 20.00 | vpn | — |
| `MOD_VPN_10` | Business VPN (10 users) | 89.00 | 35.00 | vpn | — |
| `MOD_FAILOVER_5G` | 5G/LTE Failover | 399.00 | 200.00 | failover | — |
| `MOD_SECURITY` | Security Suite | 129.00 | 50.00 | security | `MOD_ROUTER`* |

*Security Suite has a soft dependency: requires Managed Router module OR confirmed customer DNS redirect capability.

### 4.4 Module Conflict Detection Function

```sql
CREATE OR REPLACE FUNCTION validate_module_addition(
    p_service_id UUID,
    p_module_code TEXT
) RETURNS JSONB AS $$
DECLARE
    v_catalogue RECORD;
    v_existing RECORD;
    v_conflict BOOLEAN := false;
    v_result JSONB;
BEGIN
    -- Get catalogue entry for requested module
    SELECT * INTO v_catalogue
    FROM public.product_catalogue
    WHERE product_code = p_module_code AND is_active = true;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('valid', false, 'reason', 'Module not found in catalogue');
    END IF;

    -- Check: does customer have active base tier?
    IF NOT EXISTS (
        SELECT 1 FROM public.service_instances
        WHERE id = p_service_id AND service_status = 'active'
    ) THEN
        RETURN jsonb_build_object('valid', false, 'reason', 'No active base tier on this service');
    END IF;

    -- Check: module_group conflict (e.g. cannot have two SLA modules)
    IF v_catalogue.module_group IS NOT NULL THEN
        SELECT * INTO v_existing
        FROM public.module_subscriptions ms
        JOIN public.product_catalogue pc ON ms.module_code = pc.product_code
        WHERE ms.service_id = p_service_id
          AND ms.status IN ('active', 'pending', 'trial')
          AND pc.module_group = v_catalogue.module_group
          AND ms.module_code != p_module_code;

        IF FOUND THEN
            RETURN jsonb_build_object(
                'valid', false,
                'reason', format('Conflicts with existing %s module: %s',
                    v_catalogue.module_group, v_existing.module_code),
                'conflicting_module', v_existing.module_code
            );
        END IF;
    END IF;

    -- Check: dependency
    IF v_catalogue.dependency_code IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.module_subscriptions
            WHERE service_id = p_service_id
              AND module_code = v_catalogue.dependency_code
              AND status IN ('active', 'trial')
        ) THEN
            RETURN jsonb_build_object(
                'valid', false,
                'reason', format('Requires %s module', v_catalogue.dependency_code),
                'required_module', v_catalogue.dependency_code
            );
        END IF;
    END IF;

    -- Check: 5G/LTE failover coverage (flagged for manual check)
    IF p_module_code = 'MOD_FAILOVER_5G' THEN
        RETURN jsonb_build_object(
            'valid', true,
            'warning', '5G/LTE coverage at site must be manually confirmed before activation'
        );
    END IF;

    RETURN jsonb_build_object('valid', true);
END;
$$ LANGUAGE plpgsql;
```

---

## 5. Order Lifecycle State Machine

### 5.1 State Diagram — New Service Order

```
                    ┌───────┐
                    │ DRAFT │
                    └───┬───┘
                        │ submit()
                        ▼
                 ┌──────────────┐
                 │  SUBMITTED   │
                 └──────┬───────┘
                        │ trigger_credit_check()
                        ▼
                 ┌──────────────┐
            ┌────│ CREDIT_CHECK │────┐
            │    └──────────────┘    │
     credit_pass()            credit_reject()
            │                        │
            ▼                        ▼
  ┌─────────────────┐        ┌──────────┐
  │ CREDIT_APPROVED │        │ REJECTED │ → offer Arlan / deposit
  └────────┬────────┘        └──────────┘
           │ trigger_coverage_check()
           ▼
  ┌──────────────────┐
  │  COVERAGE_CHECK  │
  └────────┬─────────┘
      ┌────┴────┐
  confirmed()  failed()
      │          │
      ▼          ▼
┌───────────┐ ┌────────────────┐
│ COVERAGE  │ │ COVERAGE_FAILED│ → cross-sell
│ CONFIRMED │ └────────────────┘
└─────┬─────┘
      │ coverage = marginal?
      ├─────── YES → SITE_SURVEY_PENDING → pass/fail
      └─────── NO (confirmed) ↓
               │
               ▼
      ┌─────────────────┐
      │ CONTRACT_PENDING │
      └────────┬────────┘
               │ contract_signed()
               ▼
      ┌─────────────────┐
      │  PROVISIONING   │ → create MTN wholesale order
      └────────┬────────┘
               │ installation_scheduled()
               ▼
      ┌────────────────────────┐
      │ INSTALLATION_SCHEDULED │
      └────────────┬───────────┘
                   │ installation_started()
                   ▼
      ┌────────────────────────────┐
      │ INSTALLATION_IN_PROGRESS   │
      └────────────┬───────────────┘
              ┌────┴────┐
          success()   failure()
              │          │
              ▼          ▼
  ┌────────────────┐  ┌────────┐
  │  INSTALLATION  │  │ FAILED │ → reschedule / cancel
  │   COMPLETE     │  └────────┘
  └───────┬────────┘
          │ activate_service()
          ▼
  ┌────────────────────┐
  │ ACTIVATION_PENDING │ → create RADIUS account, assign IP
  └────────┬───────────┘
           │ confirmed()
           ▼
      ┌──────────┐
      │  ACTIVE  │ → billing starts
      └──────────┘
```

### 5.2 State Transition Rules

| From State | To State | Trigger | System Action |
|---|---|---|---|
| `draft` | `submitted` | Sales submits order | Validate mandatory fields; timestamp |
| `submitted` | `credit_check` | Automatic | Call credit bureau API; IF prepaid → skip to `credit_approved` |
| `credit_check` | `credit_approved` | Score ≥ 600 OR waived | Log score; proceed |
| `credit_check` | `credit_rejected` | Score < 500 AND no deposit | Log score; send rejection notification; flag for Arlan redirect |
| `credit_approved` | `coverage_check` | Automatic | Query MTN FWB coverage API |
| `coverage_check` | `coverage_confirmed` | Positive result | Log result; proceed |
| `coverage_check` | `coverage_failed` | Negative result | Notify sales; trigger cross-sell workflow |
| `coverage_confirmed` | `site_survey_pending` | Marginal coverage result | Schedule site survey; assign installer |
| `coverage_confirmed` | `contract_pending` | Strong coverage result | Generate contract; send to customer |
| `site_survey_pending` | `site_survey_passed` | Signal ≥ −75 dBm | Record dBm reading; proceed to contract |
| `site_survey_pending` | `site_survey_failed` | Signal < −75 dBm | Reject; notify customer; suggest alternatives |
| `contract_pending` | `contract_signed` | e-Signature / physical | Start CPA cooling-off timer (5 business days) |
| `contract_signed` | `provisioning` | Cooling-off expired OR waived | Create MTN wholesale order; allocate CPE |
| `provisioning` | `installation_scheduled` | MTN confirms RN availability | Book installation slot with customer |
| `installation_scheduled` | `installation_in_progress` | Installer checks in | GPS timestamp; update status |
| `installation_in_progress` | `installation_complete` | Speed test PASS | Record test results; proceed |
| `installation_in_progress` | Reschedule/Cancel | Speed test FAIL after optimisation | Log failure reason |
| `installation_complete` | `activation_pending` | Auto-trigger | Create RADIUS account; assign static IP; provision Ruijie router |
| `activation_pending` | `active` | PPPoE session confirmed UP | Start billing; send welcome email; start 12-month amortisation clock |

---

## 6. Service Instance Lifecycle

### 6.1 Service Status State Machine

```
                     ┌──────────────┐
                     │ PROVISIONING │
                     └──────┬───────┘
                            │ activation confirmed
                            ▼
                     ┌──────────┐
              ┌──────│  ACTIVE  │──────────────────────┐
              │      └──────────┘                      │
              │           │           │                │
   suspend_billing()  suspend_aup()  suspend_tech()  request_cancel()
              │           │           │                │
              ▼           ▼           ▼                ▼
   ┌──────────────┐ ┌──────────┐ ┌──────────┐  ┌───────────────────┐
   │  SUSPENDED   │ │SUSPENDED │ │SUSPENDED │  │    PENDING        │
   │  (BILLING)   │ │  (AUP)   │ │(TECHNICAL)│  │  CANCELLATION    │
   └──────┬───────┘ └────┬─────┘ └────┬─────┘  └────────┬──────────┘
          │              │            │                  │
   payment_received() aup_resolved() fault_resolved() notice_expired()
          │              │            │                  │
          └──────────────┴────────────┘                  │
                     │                                   │
                     ▼                                   ▼
              ┌──────────┐                       ┌──────────────┐
              │  ACTIVE  │                       │  CANCELLED   │
              └──────────┘                       └──────┬───────┘
                                                        │ 60 days
                                                        ▼
                                                 ┌──────────────┐
                                                 │  TERMINATED  │
                                                 └──────────────┘
```

### 6.2 Suspension Behaviour

| Suspension Type | Trigger | Bandwidth | Portal Access | Billing Continues | Auto-Resolve |
|---|---|---|---|---|---|
| `suspended_billing` | Invoice unpaid > 28 days | Throttled to 1 Mbps | YES (payment only) | YES | Payment clears → restore within 4 hours |
| `suspended_aup` | AUP violation confirmed | 0 Mbps (blocked) | YES | YES | Investigation complete → manual restore |
| `suspended_technical` | Network fault (CT side) | 0 Mbps | YES | NO (credit applied) | Fault resolved → auto-restore |

### 6.3 Service Status Change — System Actions

```sql
CREATE OR REPLACE FUNCTION handle_service_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Log every status change
    INSERT INTO public.service_audit_log (service_id, old_status, new_status, changed_at, changed_by)
    VALUES (NEW.id, OLD.service_status, NEW.service_status, NOW(), current_setting('app.current_user', true));

    -- ACTIVE → SUSPENDED_BILLING
    IF OLD.service_status = 'active' AND NEW.service_status = 'suspended_billing' THEN
        -- Send RADIUS CoA to throttle to 1 Mbps
        PERFORM send_radius_coa(NEW.pppoe_username, '1048576', '1048576'); -- 1 Mbps in bps
        -- Notify customer
        PERFORM send_notification(NEW.customer_id, 'service_suspended_billing',
            jsonb_build_object('service_number', NEW.service_number));
    END IF;

    -- SUSPENDED_BILLING → ACTIVE (payment received)
    IF OLD.service_status = 'suspended_billing' AND NEW.service_status = 'active' THEN
        -- Send RADIUS CoA to restore full speed
        PERFORM send_radius_coa(NEW.pppoe_username,
            (NEW.speed_dl_mbps * 1048576)::text,
            (NEW.speed_ul_mbps * 1048576)::text);
        PERFORM send_notification(NEW.customer_id, 'service_restored',
            jsonb_build_object('service_number', NEW.service_number));
    END IF;

    -- ANY → CANCELLED
    IF NEW.service_status = 'cancelled' THEN
        -- Send RADIUS POD (Packet of Disconnect)
        PERFORM send_radius_pod(NEW.pppoe_username);
        -- Cancel all active modules
        UPDATE public.module_subscriptions
        SET status = 'cancelled', cancelled_at = NOW()
        WHERE service_id = NEW.id AND status IN ('active', 'trial');
        -- Trigger equipment collection workflow
        PERFORM create_equipment_collection_task(NEW.id);
        -- Final invoice
        PERFORM generate_final_invoice(NEW.id);
    END IF;

    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_service_status_change
BEFORE UPDATE OF service_status ON public.service_instances
FOR EACH ROW
WHEN (OLD.service_status IS DISTINCT FROM NEW.service_status)
EXECUTE FUNCTION handle_service_status_change();
```

---

## 7. Billing Engine Logic

### 7.1 Monthly Billing Run — Pseudocode

```
FUNCTION generate_monthly_invoices(billing_month DATE):

  FOR EACH customer IN active_customers:

    invoice = create_invoice(customer, billing_month)

    FOR EACH service IN customer.active_services:

      -- Base tier line
      IF service.activation_date <= billing_month THEN
        add_invoice_line(invoice, service.product_code, service.retail_price, 'base_tier')
      ELSE
        -- Pro-rata for mid-month activations
        days_active = days_between(service.activation_date, end_of(billing_month))
        pro_rata = (service.retail_price / days_in(billing_month)) * days_active
        add_invoice_line(invoice, service.product_code, ROUND(pro_rata, 2), 'pro_rata')
      END IF

      -- Module lines
      FOR EACH module IN service.active_modules:
        IF module.status = 'trial' AND module.trial_end_date > billing_month THEN
          -- Trial: R0 line with note
          add_invoice_line(invoice, module.module_code, 0, 'module', note='30-day free trial')
        ELSE
          add_invoice_line(invoice, module.module_code, module.retail_price, 'module')
        END IF
      END FOR

      -- SLA credits (if any approved for this period)
      FOR EACH credit IN service.approved_sla_credits WHERE credit.billing_month = billing_month:
        add_invoice_line(invoice, 'SLA_CREDIT', -credit.amount, 'sla_credit')
      END FOR

    END FOR

    -- Apply account-level discounts
    IF customer.discount_percent > 0 THEN
      discount_amount = invoice.subtotal * (customer.discount_percent / 100)
      add_invoice_line(invoice, 'DISCOUNT', -discount_amount, 'discount')
    END IF

    -- Calculate VAT
    invoice.vat_amount = ROUND(invoice.subtotal * 0.15, 2)
    invoice.total_incl_vat = invoice.subtotal + invoice.vat_amount

    -- Set due date
    invoice.due_date = billing_month + INTERVAL '7 days'  -- 7th of month

    -- Persist and send
    save_invoice(invoice)
    send_invoice_notification(customer, invoice)

  END FOR
```

### 7.2 Pro-Rata Calculation Formula

```
pro_rata_amount = (monthly_price / days_in_billing_month) × days_of_service

WHERE:
  days_of_service = (end_of_billing_month - activation_date) + 1
  days_in_billing_month = EXTRACT(DAY FROM (DATE_TRUNC('month', billing_month) + INTERVAL '1 month - 1 day'))
```

### 7.3 Early Termination Penalty Calculation

```sql
CREATE OR REPLACE FUNCTION calculate_termination_penalty(
    p_service_id UUID
) RETURNS DECIMAL(10,2) AS $$
DECLARE
    v_service RECORD;
    v_remaining_months INTEGER;
    v_total_mrc DECIMAL(10,2);
    v_penalty DECIMAL(10,2);
BEGIN
    SELECT * INTO v_service FROM public.service_instances WHERE id = p_service_id;

    IF v_service.contract_type = 'month_to_month' THEN
        RETURN 0;
    END IF;

    IF v_service.contract_end_date IS NULL OR v_service.contract_end_date <= CURRENT_DATE THEN
        RETURN 0;  -- contract already expired
    END IF;

    v_remaining_months := GREATEST(0,
        EXTRACT(MONTH FROM AGE(v_service.contract_end_date, CURRENT_DATE))::INTEGER +
        CASE WHEN EXTRACT(DAY FROM AGE(v_service.contract_end_date, CURRENT_DATE)) > 0 THEN 1 ELSE 0 END
    );

    -- Total MRC = base tier + all active modules
    SELECT v_service.retail_price + COALESCE(SUM(ms.retail_price), 0)
    INTO v_total_mrc
    FROM public.module_subscriptions ms
    WHERE ms.service_id = p_service_id AND ms.status = 'active';

    -- CPA penalty: remaining months × 75% of MRC
    v_penalty := v_remaining_months * v_total_mrc * 0.75;

    RETURN ROUND(v_penalty, 2);
END;
$$ LANGUAGE plpgsql;
```

### 7.4 Annual Price Escalation

```
Executed: 1st February each year (effective 1st March)
Formula: new_price = current_price × (1 + ((CPI + 2) / 100))
Cap: CPI + 2% per annum
Notification: 30 calendar days before effective date
System action: Update product_catalogue effective_from/to; create new price record; bulk update active service instances
```

---

## 8. Margin & MSC Calculation Engine

### 8.1 Per-Subscriber Margin Calculation

```sql
CREATE OR REPLACE FUNCTION calculate_subscriber_margin(
    p_service_id UUID
) RETURNS JSONB AS $$
DECLARE
    v_service RECORD;
    v_base_cost DECIMAL(10,2);
    v_base_price DECIMAL(10,2);
    v_module_revenue DECIMAL(10,2);
    v_module_cost DECIMAL(10,2);
    v_total_revenue DECIMAL(10,2);
    v_total_cost DECIMAL(10,2);
    v_contribution DECIMAL(10,2);
    v_margin_pct DECIMAL(5,2);
    v_amort_active BOOLEAN;
BEGIN
    SELECT * INTO v_service FROM public.service_instances WHERE id = p_service_id;

    -- Base tier costs
    SELECT pc.retail_price, pc.direct_cost
    INTO v_base_price, v_base_cost
    FROM public.product_catalogue pc WHERE pc.product_code = v_service.product_code;

    -- Check if installation amortisation still active
    v_amort_active := v_service.installation_cost_amortisation_remaining > 0;
    IF NOT v_amort_active THEN
        v_base_cost := v_base_cost - 212.50;  -- Remove amortisation component
    END IF;

    -- Module totals
    SELECT COALESCE(SUM(ms.retail_price), 0), COALESCE(SUM(ms.direct_cost), 0)
    INTO v_module_revenue, v_module_cost
    FROM public.module_subscriptions ms
    WHERE ms.service_id = p_service_id AND ms.status = 'active';

    v_total_revenue := v_base_price + v_module_revenue;
    v_total_cost := v_base_cost + v_module_cost;
    v_contribution := v_total_revenue - v_total_cost;
    v_margin_pct := ROUND((v_contribution / v_total_revenue) * 100, 2);

    RETURN jsonb_build_object(
        'service_id', p_service_id,
        'base_revenue', v_base_price,
        'module_revenue', v_module_revenue,
        'total_revenue', v_total_revenue,
        'total_cost', v_total_cost,
        'contribution', v_contribution,
        'margin_percent', v_margin_pct,
        'amortisation_active', v_amort_active,
        'modules_attached', (SELECT COUNT(*) FROM public.module_subscriptions WHERE service_id = p_service_id AND status = 'active')
    );
END;
$$ LANGUAGE plpgsql;
```

### 8.2 MTN Minimum Spend Commitment (MSC) Tracker

```sql
CREATE TABLE public.msc_tracking (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_month        DATE NOT NULL,         -- first of month
    mtn_msc_quarter       INTEGER NOT NULL,      -- 1-8 (each quarter of 24-month commitment)
    msc_threshold         DECIMAL(12,2) NOT NULL, -- required MSC for this quarter's month
    actual_wholesale_spend DECIMAL(12,2) NOT NULL,
    shortfall             DECIMAL(12,2) GENERATED ALWAYS AS (
        GREATEST(0, msc_threshold - actual_wholesale_spend)
    ) STORED,
    total_rn_devices      INTEGER NOT NULL,
    compliance_status     TEXT GENERATED ALWAYS AS (
        CASE WHEN actual_wholesale_spend >= msc_threshold THEN 'compliant'
             ELSE 'shortfall' END
    ) STORED,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- MSC schedule from MTN FWB Commercial Schedule (July 2025)
-- Month 1-3: Actual spend (no MSC floor)
-- Month 4-6: R14,970/month
-- Month 7-9: R29,940/month
-- Month 10-12: R49,900/month
-- Month 13-15: R74,850/month
-- Month 16-18: R104,790/month
-- Month 19-21: R139,720/month
-- Month 22-24: R179,640/month
```

### 8.3 MSC Compliance Check Function

```sql
CREATE OR REPLACE FUNCTION check_msc_compliance(p_month DATE)
RETURNS JSONB AS $$
DECLARE
    v_msc_floor DECIMAL(12,2);
    v_actual_spend DECIMAL(12,2);
    v_month_number INTEGER;
    v_active_subs INTEGER;
    v_subs_needed INTEGER;
BEGIN
    -- Calculate month number from contract start
    v_month_number := EXTRACT(MONTH FROM AGE(p_month, '2025-07-01'::DATE))::INTEGER + 1;

    -- Determine MSC floor based on month
    v_msc_floor := CASE
        WHEN v_month_number <= 3 THEN 0  -- actual spend
        WHEN v_month_number <= 6 THEN 14970
        WHEN v_month_number <= 9 THEN 29940
        WHEN v_month_number <= 12 THEN 49900
        WHEN v_month_number <= 15 THEN 74850
        WHEN v_month_number <= 18 THEN 104790
        WHEN v_month_number <= 21 THEN 139720
        WHEN v_month_number <= 24 THEN 179640
        ELSE 179640  -- post-contract MSC
    END;

    -- Calculate actual wholesale spend (sum of all active subscriber wholesale costs + NNI port)
    SELECT COUNT(*), COALESCE(SUM(si.wholesale_cost), 0) + 2500  -- +R2,500 NNI MRC
    INTO v_active_subs, v_actual_spend
    FROM public.service_instances si
    WHERE si.service_status = 'active'
      AND si.product_code LIKE 'SF_BIZ_%';

    -- Subscribers needed to meet MSC (at average R599 wholesale)
    v_subs_needed := CEIL((v_msc_floor - 2500) / 599.0);

    RETURN jsonb_build_object(
        'month', p_month,
        'month_number', v_month_number,
        'msc_floor', v_msc_floor,
        'actual_spend', v_actual_spend,
        'shortfall', GREATEST(0, v_msc_floor - v_actual_spend),
        'compliant', v_actual_spend >= v_msc_floor,
        'active_subscribers', v_active_subs,
        'subscribers_needed_for_compliance', v_subs_needed
    );
END;
$$ LANGUAGE plpgsql;
```

---

## 9. Provisioning Integration — MTN Wholesale FWB

### 9.1 Order Submission Workflow

| Step | System | Action | Data Exchanged |
|---|---|---|---|
| 1 | Supabase | Order status → `provisioning` | order_id, customer details |
| 2 | Manual (Phase 1) | Log into MTN Wholesale Portal | Credentials |
| 3 | MTN Portal | Submit FWB order | Customer address, speed profile, static IP request |
| 4 | MTN | Allocate Tarana RN device, assign VPDN | RN serial, VPDN ID |
| 5 | MTN | Confirm installation date | Scheduled date, installer details |
| 6 | Manual → Supabase | Update order with MTN reference | mtn_order_reference, rn_device_serial, installation_date |
| 7 | Supabase | Order status → `installation_scheduled` | — |

### 9.2 Phase 2: API Automation (Target)

```
POST /api/mtn-wholesale/fwb-order
{
    "partner_id": "circletel",
    "customer": {
        "company_name": "Delphius (Pty) Ltd",
        "address": { "street": "123 Main Rd", "suburb": "Midrand", "postal_code": "1685" }
    },
    "service": {
        "speed_profile": "100_25",
        "static_ip": true,
        "vpdn_required": true
    }
}

Response:
{
    "mtn_order_id": "FWB-2026-XXXXXX",
    "rn_serial": "TRN-XXXXXXXXXXXX",
    "estimated_install_date": "2026-03-05",
    "status": "scheduled"
}
```

### 9.3 MTN Wholesale Cost Mapping

| Speed Profile | MTN Product Code | Wholesale MRC (excl. VAT) | DL/UL Mbps |
|---|---|---|---|
| 50 Mbps | `FWB_050` | R499 | 50/12.5 |
| 100 Mbps | `FWB_100` | R599 | 100/25 |
| 200 Mbps | `FWB_200` | R699 | 200/50 |

Fixed monthly overheads (regardless of subscriber count): 1G NNI Port MRC = R2 500.

---

## 10. Network Integration — BNG, RADIUS & ENNI

### 10.1 Subscriber Authentication Flow

```
[Customer CPE / Reyee Router]
        │ PPPoE PADI/PADO/PADR/PADS
        ▼
[MTN Tarana G1 Base Station]
        │ Layer 2 transport
        ▼
[MTN BNG: Huawei NE8000M14 (JHB) / S9312 (CPT)]
        │ RADIUS Access-Request
        │   User-Name: user@circletel.co.za
        ▼
[Echo SP RADIUS Proxy]
        │ Routes by realm (@circletel.co.za)
        │   Proxy 1: 13.247.40.35
        │   Proxy 2: 13.244.49.198
        ▼
[Interstellio RADIUS]
        │   Server 1: 102.220.62.161
        │   Server 2: 102.220.62.162
        │   Server 3: 102.220.62.163
        │   Auth Port: 1812 (UDP)
        │   Acct Port: 1813 (UDP)
        │   Shared Secret: uu0fzFR9SbQrZ3
        │
        │ RADIUS Access-Accept
        │   Framed-IP-Address: <assigned static IP>
        │   Session-Timeout: 86400
        │   Acct-Interim-Interval: 600
        ▼
[BNG establishes PPPoE session]
        │ BGP announces CircleTel prefixes
        ▼
[IP Transit via ENNI → Echo SP Arista (L2) → Internet]
```

### 10.2 RADIUS Account Provisioning

```sql
-- Called when order reaches 'activation_pending' state
CREATE OR REPLACE FUNCTION provision_radius_account(
    p_service_id UUID
) RETURNS JSONB AS $$
DECLARE
    v_service RECORD;
    v_customer RECORD;
    v_username TEXT;
    v_ip INET;
BEGIN
    SELECT * INTO v_service FROM public.service_instances WHERE id = p_service_id;
    SELECT * INTO v_customer FROM public.customers WHERE id = v_service.customer_id;

    -- Generate PPPoE username: accountnumber@circletel.co.za
    v_username := LOWER(v_customer.account_number) || '@circletel.co.za';

    -- Allocate static IP from CircleTel pool
    v_ip := allocate_next_static_ip();

    -- Update service instance
    UPDATE public.service_instances
    SET pppoe_username = v_username,
        static_ip_address = v_ip,
        updated_at = NOW()
    WHERE id = p_service_id;

    -- Call Interstellio API to create subscriber
    -- (implemented as async HTTP call to Interstellio provisioning endpoint)
    RETURN jsonb_build_object(
        'username', v_username,
        'realm', 'circletel.co.za',
        'static_ip', v_ip::text,
        'speed_dl_bps', v_service.speed_dl_mbps * 1048576,
        'speed_ul_bps', v_service.speed_ul_mbps * 1048576,
        'session_timeout', 86400,
        'acct_interim_interval', 600
    );
END;
$$ LANGUAGE plpgsql;
```

### 10.3 RADIUS Change of Authorisation (CoA) Specification

| Scenario | CoA Attribute | Value | Trigger |
|---|---|---|---|
| Speed upgrade | `Filter-Id` | New speed profile string | Order type = `upgrade` |
| Billing suspension (throttle) | `Ascend-Data-Rate` / `Ascend-Xmit-Rate` | 1048576 (1 Mbps) | `service_status` → `suspended_billing` |
| Restore full speed | `Ascend-Data-Rate` / `Ascend-Xmit-Rate` | Package speed in bps | `service_status` → `active` (from suspended) |
| AUP suspension (disconnect) | POD (Disconnect-Request) | — | `service_status` → `suspended_aup` |
| Service cancellation | POD (Disconnect-Request) | — | `service_status` → `cancelled` |

CoA/POD target: sent to all three Interstellio RADIUS endpoints (102.220.62.161–163) on port 3799 (UDP).

### 10.4 ENNI and BNG Reference

| Parameter | JHB (Primary) | CPT (Secondary) |
|---|---|---|
| BNG Device | Huawei NE8000M14 (X100033-NE8000M14-02) | Huawei S9312 (E0699-S9312-01) |
| BNG Interface | GigabitEthernet0/6/5 | GE6/0/24 |
| Interface Speed | 1 Gbps | 1 Gbps |
| Cabinet | J_CH5_D16 (Teraco JB1) | C_CH4_L04 (Teraco CT1) |
| L2 Switch | Echo SP Arista (J_CH1_CAR065) | Echo SP Arista (C_DC3_D02) |
| VLANs | AAA VLAN + WWW/IP Transit VLAN | AAA VLAN + WWW/IP Transit VLAN |

---

## 11. CPE Management Integration — Ruijie Cloud

### 11.1 Router Provisioning Workflow

```
TRIGGER: Order status = 'installation_complete' AND module MOD_ROUTER active

1. Installer scans Reyee router QR code
2. Router auto-registers on Ruijie Cloud (cloud.ruijie.com)
3. Supabase calls Ruijie Cloud API:

   POST /api/devices/provision
   {
       "serial_number": "RG-XXXXXXXXXXXX",
       "site_name": "Delphius - Midrand",
       "customer_ref": "CT-SMB-000123",
       "config_template": "skyfibre_smb_100",
       "qos_profile": {
           "wan_dl_limit": 104857600,      // 100 Mbps in bps
           "wan_ul_limit": 26214400,       // 25 Mbps in bps
           "voip_priority": "high",
           "video_priority": "high"
       },
       "wifi_config": {
           "ssid_business": "Delphius-Business",
           "ssid_guest": "Delphius-Guest",
           "encryption": "WPA3",
           "band_steering": true
       }
   }

4. Ruijie Cloud returns device_id → stored in cpe_devices.ruijie_cloud_id
5. Router pulls config via zero-touch provisioning
6. Status verified via GET /api/monitoring/status/{device_id}
```

### 11.2 Monitoring Polling (Every 5 Minutes)

```
GET /api/monitoring/status/{device_id}

Response:
{
    "device_id": "RC-XXXXXXXXX",
    "online": true,
    "uptime_seconds": 2592000,
    "wan_status": "connected",
    "wan_ip": "41.XXX.XXX.XXX",
    "clients_connected": 12,
    "cpu_usage_percent": 15,
    "memory_usage_percent": 42,
    "firmware": "1.252.272",
    "last_config_sync": "2026-02-27T10:30:00Z"
}

System actions:
  IF online = false AND previous_poll = true:
      → Create support_ticket (category='fault', priority='high')
      → Notify account manager
      → IF premium_sla: escalate immediately

  IF online = true AND previous_poll = false:
      → Auto-resolve associated fault ticket
      → Log recovery timestamp
```

### 11.3 Ruijie Cloud API Endpoints Used

| Endpoint | Method | Purpose | Trigger |
|---|---|---|---|
| `/api/devices` | GET | List all managed devices | Dashboard refresh |
| `/api/devices/provision` | POST | Zero-touch provision new router | Installation complete |
| `/api/devices/{id}/config` | PUT | Update QoS/WiFi config | Speed upgrade/downgrade |
| `/api/devices/{id}` | DELETE | Decommission device | Service cancellation |
| `/api/monitoring/status` | GET | Real-time device status | Polling every 5 min |
| `/api/monitoring/traffic` | GET | Bandwidth usage stats | Daily reporting |
| `/api/monitoring/clients` | GET | Connected client list | On-demand |
| `/api/monitoring/alerts` | GET | Active alerts | Polling every 5 min |
| `/api/config/qos` | POST | Apply QoS rules | Provisioning / upgrade |
| `/api/config/firewall` | POST | Firewall rules (Security Suite) | MOD_SECURITY activation |
| `/api/config/vpn` | POST | VPN tunnel config | MOD_VPN activation |

---

## 12. CRM & Sales Pipeline Logic

### 12.1 Lead-to-Customer Pipeline Stages

| Stage | Status | System Action | SLA |
|---|---|---|---|
| 1. New Lead | `new` | Auto-assign to sales agent by territory | — |
| 2. Qualified | `qualified` | Entity type validated; coverage pre-check run | 1 business day |
| 3. Quoted | `quoted` | Quote generated from product configurator | 2 business days |
| 4. Negotiation | `negotiation` | Track objection codes (price, speed, contract term) | — |
| 5. Won | `won` | Convert lead → customer; create order | — |
| 6. Lost | `lost` | Log reason code; IF price → flag for Arlan | — |
| 7. Arlan Redirect | `arlan_redirect` | Create Arlan-channel deal; track commission | — |

### 12.2 Lost Deal Reason Codes

| Code | Reason | Auto-Action |
|---|---|---|
| `PRICE_TOO_HIGH` | Customer rejected on price | Flag for Arlan backstop |
| `COVERAGE_NONE` | No Tarana coverage | Cross-sell alternative products |
| `SPEED_SYMMETRICAL` | Needs symmetrical speeds | Redirect to BizFibreConnect |
| `COMPETITOR_WON` | Chose competitor | 90-day follow-up reminder |
| `BUDGET_FROZEN` | Customer delayed budget | 60-day follow-up reminder |
| `CREDIT_FAILED` | Credit check failure | Offer Arlan OR deposit option |

### 12.3 Module Attach Rate Tracking

```sql
CREATE OR REPLACE VIEW v_module_attach_metrics AS
SELECT
    DATE_TRUNC('month', si.contract_start_date) AS cohort_month,
    COUNT(DISTINCT si.id) AS total_services,
    COUNT(DISTINCT ms.id) AS total_module_subs,
    ROUND(COUNT(DISTINCT ms.id)::DECIMAL / NULLIF(COUNT(DISTINCT si.id), 0), 2) AS attach_rate,
    ROUND(AVG(si.retail_price + COALESCE(module_revenue.total, 0)), 2) AS blended_arpu
FROM public.service_instances si
LEFT JOIN public.module_subscriptions ms
    ON ms.service_id = si.id AND ms.status = 'active'
LEFT JOIN LATERAL (
    SELECT SUM(retail_price) AS total
    FROM public.module_subscriptions
    WHERE service_id = si.id AND status = 'active'
) module_revenue ON true
WHERE si.service_status = 'active'
GROUP BY 1
ORDER BY 1 DESC;
```

Target KPI: ≥ 1.5 modules per customer (BRD KPI from CPS v2.0 Section 19).

---

## 13. Support & Fault Management Logic

### 13.1 SLA-Aware Ticket Routing

```sql
CREATE OR REPLACE FUNCTION calculate_sla_deadlines(
    p_sla_tier TEXT,
    p_category TEXT,
    p_opened_at TIMESTAMPTZ
) RETURNS JSONB AS $$
DECLARE
    v_response_hours INTEGER;
    v_resolution_hours INTEGER;
    v_response_deadline TIMESTAMPTZ;
    v_resolution_deadline TIMESTAMPTZ;
BEGIN
    -- Response time by SLA tier
    v_response_hours := CASE p_sla_tier
        WHEN 'basic'    THEN 24  -- next business day
        WHEN 'enhanced' THEN 4   -- 4 business hours
        WHEN 'premium'  THEN 2   -- 2 hours (24/7)
        ELSE 24
    END;

    -- Resolution target
    v_resolution_hours := CASE p_sla_tier
        WHEN 'basic'    THEN 48
        WHEN 'enhanced' THEN 12
        WHEN 'premium'  THEN 8
        ELSE 48
    END;

    -- For premium: clock runs 24/7
    -- For basic/enhanced: business hours only (08:00-17:00 Mon-Fri / 08:00-20:00 Mon-Sat)
    IF p_sla_tier = 'premium' THEN
        v_response_deadline := p_opened_at + (v_response_hours || ' hours')::INTERVAL;
        v_resolution_deadline := p_opened_at + (v_resolution_hours || ' hours')::INTERVAL;
    ELSE
        v_response_deadline := calculate_business_hours_deadline(p_opened_at, v_response_hours, p_sla_tier);
        v_resolution_deadline := calculate_business_hours_deadline(p_opened_at, v_resolution_hours, p_sla_tier);
    END IF;

    RETURN jsonb_build_object(
        'sla_tier', p_sla_tier,
        'response_hours', v_response_hours,
        'resolution_hours', v_resolution_hours,
        'response_deadline', v_response_deadline,
        'resolution_deadline', v_resolution_deadline
    );
END;
$$ LANGUAGE plpgsql;
```

### 13.2 Ticket Priority Matrix

| Category | Basic SLA | Enhanced SLA | Premium SLA |
|---|---|---|---|
| Total service outage | High | Critical | Critical |
| Intermittent connectivity | Normal | High | High |
| Speed degradation (>20%) | Normal | High | High |
| Router offline | Normal | High | Critical |
| Billing dispute | Normal | Normal | Normal |
| General enquiry | Low | Low | Normal |

### 13.3 Automatic Escalation Rules

| Condition | Action |
|---|---|
| Response deadline breached | Escalate to next tier; notify ops manager |
| Resolution deadline at 80% | Warning notification to assigned agent + supervisor |
| Resolution deadline breached | Escalate to CTO; SLA breach flag set |
| 3+ SLA breaches in 90 days (Enhanced/Premium) | Auto-generate penalty-free cancellation offer to customer |
| Customer contacts support ≥ 3 times in 30 days | Flag for churn risk; notify account manager |

---

## 14. SLA Monitoring & Service Credit Engine

### 14.1 Uptime Monitoring

```
Data source: Ruijie Cloud polling (5-min intervals) + RADIUS accounting (10-min intervals)

Uptime calculation:
  uptime_percent = ((total_minutes_in_period - downtime_minutes) / total_minutes_in_period) × 100

Downtime defined as:
  - Router offline (Ruijie Cloud online=false) for ≥ 15 consecutive minutes, OR
  - PPPoE session down (no RADIUS accounting updates) for ≥ 15 consecutive minutes

Excluded from downtime:
  - Scheduled maintenance (pre-notified 48 hours)
  - Customer-caused outages (power, equipment tampering)
  - Force majeure
  - Upstream MTN network outages
```

### 14.2 Service Credit Calculation

```sql
CREATE OR REPLACE FUNCTION calculate_sla_credit(
    p_service_id UUID,
    p_incident_id UUID,
    p_downtime_minutes INTEGER
) RETURNS JSONB AS $$
DECLARE
    v_service RECORD;
    v_total_mrc DECIMAL(10,2);
    v_credit_rate DECIMAL(5,4);
    v_downtime_hours DECIMAL(5,2);
    v_credit_amount DECIMAL(10,2);
BEGIN
    SELECT * INTO v_service FROM public.service_instances WHERE id = p_service_id;

    -- Only Enhanced and Premium SLA get credits
    IF v_service.sla_tier = 'basic' THEN
        RETURN jsonb_build_object('eligible', false, 'reason', 'Basic SLA: no service credits');
    END IF;

    -- Credit rate per hour
    v_credit_rate := CASE v_service.sla_tier
        WHEN 'enhanced' THEN 0.10  -- 10% per hour
        WHEN 'premium'  THEN 0.15  -- 15% per hour
    END;

    -- Total MRC (base + modules)
    SELECT v_service.retail_price + COALESCE(SUM(ms.retail_price), 0)
    INTO v_total_mrc
    FROM public.module_subscriptions ms
    WHERE ms.service_id = p_service_id AND ms.status = 'active';

    -- Calculate credit
    v_downtime_hours := CEIL(p_downtime_minutes / 60.0);
    v_credit_amount := LEAST(
        v_downtime_hours * v_credit_rate * v_total_mrc,
        v_total_mrc  -- cap at 100% of monthly MRC
    );

    RETURN jsonb_build_object(
        'eligible', true,
        'sla_tier', v_service.sla_tier,
        'downtime_minutes', p_downtime_minutes,
        'downtime_hours_charged', v_downtime_hours,
        'credit_rate', v_credit_rate,
        'monthly_mrc', v_total_mrc,
        'credit_amount', ROUND(v_credit_amount, 2),
        'capped_at_mrc', v_credit_amount >= v_total_mrc
    );
END;
$$ LANGUAGE plpgsql;
```

---

## 15. Notification & Event Engine

### 15.1 Notification Templates

| Event Code | Channel | Recipient | Trigger |
|---|---|---|---|
| `ORDER_CONFIRMED` | Email + SMS | Customer | Order status → `contract_signed` |
| `INSTALLATION_SCHEDULED` | Email + SMS | Customer | Order status → `installation_scheduled` |
| `SERVICE_ACTIVATED` | Email | Customer | Service status → `active` |
| `WELCOME_CALL` | Task queue | Account manager | 24 hours after activation |
| `7_DAY_SATISFACTION` | SMS | Customer | 7 days after activation |
| `30_DAY_REVIEW` | Email | Account manager | 30 days after activation |
| `INVOICE_GENERATED` | Email | Customer | Invoice created |
| `PAYMENT_REMINDER` | Email + SMS | Customer | Invoice unpaid by 7th |
| `ARREARS_NOTICE` | Email | Customer | Invoice unpaid by 15th |
| `SUSPENSION_WARNING` | Email + SMS | Customer | Invoice unpaid by 21st |
| `SERVICE_SUSPENDED` | Email + SMS | Customer | Service status → `suspended_*` |
| `SERVICE_RESTORED` | Email + SMS | Customer | Service status → `active` (from suspended) |
| `SLA_BREACH_ALERT` | Email | Ops manager + Customer | SLA deadline breached |
| `TRIAL_EXPIRING` | Email + SMS | Customer | Module trial ends in 5 days |
| `TRIAL_CONVERTED` | Email | Customer | Module trial → active (billing starts) |
| `CHURN_RISK` | Email | Account manager | Churn trigger detected |
| `CANCELLATION_CONFIRMED` | Email | Customer | Service status → `cancelled` |
| `EQUIPMENT_COLLECTION` | Email + SMS | Customer + Installer | 3 days after cancellation |
| `MSC_WARNING` | Email | Finance + MD | MSC shortfall > 10% |
| `PRICE_ESCALATION_NOTICE` | Email | All active customers | 30 days before price increase |

### 15.2 Event Bus Architecture

```
┌──────────────────┐
│  State Change    │ (service_status, order_status, invoice_status)
│  Trigger         │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  PostgreSQL      │ AFTER UPDATE trigger → insert into events table
│  Event Log       │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Supabase        │ Realtime subscription on events table
│  Edge Function   │
└────────┬─────────┘
         │
    ┌────┴────┬──────────┐
    ▼         ▼          ▼
┌────────┐ ┌────────┐ ┌────────┐
│ Email  │ │  SMS   │ │WhatsApp│
│  API   │ │  API   │ │  API   │
└────────┘ └────────┘ └────────┘
```

---

## 16. Reporting & Analytics Data Logic

### 16.1 Key Dashboard Views

```sql
-- Active subscriber summary
CREATE OR REPLACE VIEW v_subscriber_dashboard AS
SELECT
    COUNT(*) FILTER (WHERE service_status = 'active') AS active_services,
    COUNT(*) FILTER (WHERE service_status LIKE 'suspended%') AS suspended_services,
    COUNT(*) FILTER (WHERE service_status = 'provisioning') AS provisioning,
    SUM(retail_price) FILTER (WHERE service_status = 'active') AS total_base_mrc,
    ROUND(AVG(retail_price) FILTER (WHERE service_status = 'active'), 2) AS avg_base_arpu,
    COUNT(DISTINCT customer_id) FILTER (WHERE service_status = 'active') AS active_customers
FROM public.service_instances
WHERE product_code LIKE 'SF_BIZ_%';

-- Monthly revenue and margin report
CREATE OR REPLACE VIEW v_monthly_revenue AS
SELECT
    DATE_TRUNC('month', i.billing_period_start) AS month,
    COUNT(DISTINCT i.id) AS invoices_generated,
    SUM(i.subtotal_excl_vat) AS total_revenue_excl_vat,
    SUM(i.vat_amount) AS total_vat,
    SUM(i.total_incl_vat) AS total_revenue_incl_vat,
    COUNT(*) FILTER (WHERE i.status = 'paid') AS invoices_paid,
    COUNT(*) FILTER (WHERE i.status = 'overdue') AS invoices_overdue,
    SUM(i.total_incl_vat) FILTER (WHERE i.status = 'overdue') AS overdue_amount
FROM public.invoices i
GROUP BY 1
ORDER BY 1 DESC;

-- Churn tracking
CREATE OR REPLACE VIEW v_churn_analysis AS
SELECT
    DATE_TRUNC('month', cancellation_date) AS churn_month,
    COUNT(*) AS cancellations,
    COUNT(*) FILTER (WHERE cancellation_reason = 'price') AS churn_price,
    COUNT(*) FILTER (WHERE cancellation_reason = 'coverage') AS churn_coverage,
    COUNT(*) FILTER (WHERE cancellation_reason = 'competitor') AS churn_competitor,
    COUNT(*) FILTER (WHERE cancellation_reason = 'service_quality') AS churn_quality
FROM public.service_instances
WHERE service_status IN ('cancelled', 'terminated')
  AND product_code LIKE 'SF_BIZ_%'
GROUP BY 1
ORDER BY 1 DESC;
```

### 16.2 KPI Targets (from CPS v2.0)

| KPI | Target | SQL Metric |
|---|---|---|
| Monthly churn rate | < 2% | `cancellations_this_month / active_start_of_month × 100` |
| Module attach rate | ≥ 1.5 modules/customer | `total_active_modules / total_active_services` |
| Blended ARPU | > R1 700 | `total_monthly_revenue / active_subscribers` |
| Base tier gross margin | > 37% | `(total_base_revenue - total_base_cost) / total_base_revenue × 100` |
| Installation lead time | < 5 business days | `AVG(installation_date - order_submitted_date)` |
| Support resolution time (Enhanced) | < 4 hours | `AVG(resolved_at - opened_at) WHERE sla_tier = 'enhanced'` |
| Network uptime | > 99.5% | `(total_minutes - downtime_minutes) / total_minutes × 100` |
| NPS | > 50 | Quarterly survey (external) |

---

## 17. API Contract Specifications

### 17.1 Supabase PostgREST Endpoints (Internal)

| Endpoint | Method | Purpose | Auth |
|---|---|---|---|
| `/rest/v1/customers` | GET, POST, PATCH | Customer CRUD | JWT (RLS) |
| `/rest/v1/service_instances` | GET, POST, PATCH | Service management | JWT (RLS) |
| `/rest/v1/module_subscriptions` | GET, POST, PATCH | Module management | JWT (RLS) |
| `/rest/v1/orders` | GET, POST, PATCH | Order management | JWT (RLS) |
| `/rest/v1/invoices` | GET | Invoice retrieval | JWT (RLS) |
| `/rest/v1/support_tickets` | GET, POST, PATCH | Ticket management | JWT (RLS) |
| `/rest/v1/rpc/validate_module_addition` | POST | Module conflict check | JWT |
| `/rest/v1/rpc/calculate_subscriber_margin` | POST | Margin calculation | JWT |
| `/rest/v1/rpc/calculate_termination_penalty` | POST | Penalty calculation | JWT |
| `/rest/v1/rpc/check_msc_compliance` | POST | MSC tracker | JWT |
| `/rest/v1/rpc/calculate_sla_credit` | POST | SLA credit calculation | JWT |

### 17.2 External API Dependencies

| System | Base URL | Auth | Rate Limit | Fallback |
|---|---|---|---|---|
| Ruijie Cloud | `https://api.ruijie.com/v1` | OAuth 2.0 | 100 req/min | Cache last-known state; retry with exponential backoff |
| Interstellio RADIUS | UDP 1812/1813 (102.220.62.161–163) | Shared secret | N/A (per-session) | Failover across 3 servers |
| TransUnion Credit Bureau | `https://api.transunion.co.za/v2` | API Key + HMAC | 50 req/min | Queue and retry; manual vetting as fallback |
| SMS Gateway | `https://api.bulksms.com/v1` | API Key | 300 req/min | Queue with 1-hour retry window |
| Email Service | `https://api.sendgrid.com/v3` | API Key | 1000 req/min | Queue with retry |

---

## 18. Validation Rule Register

### 18.1 Customer Validation

| Field | Rule | Error Code | Error Message |
|---|---|---|---|
| `company_name` | NOT NULL, length ≥ 2 | `CUST_001` | Company name is required |
| `registration_number` | NOT NULL, format `YYYY/NNNNNN/NN` | `CUST_002` | Valid CIPC registration number required |
| `entity_type` | Must be in allowed enum | `CUST_003` | Invalid entity type |
| `installation_address.postal_code` | 4-digit South African postal code | `CUST_004` | Valid SA postal code required |
| `payment_method` | Must be `debit_order` or `eft` | `CUST_005` | Valid payment method required |
| `credit_score` | 0–999 range | `CUST_006` | Invalid credit score |

### 18.2 Order Validation

| Rule | Condition | Error Code |
|---|---|---|
| Base tier required | Every new_service order must have exactly one `base_tier` line item | `ORD_001` |
| Module requires base | Module line items only valid if base_tier line exists | `ORD_002` |
| Module conflict | No two modules from same `module_group` (excluding upgrades) | `ORD_003` |
| Minimum MRC | Total MRC ≥ R1 299 for SkyFibre SMB | `ORD_004` |
| Discount limit | Discount cannot reduce margin below 25% | `ORD_005` |
| Contract type valid | Must be `month_to_month`, `12_month`, or `24_month` | `ORD_006` |

### 18.3 Service Validation

| Rule | Condition | Error Code |
|---|---|---|
| Speed profile integrity | `speed_dl_mbps` must be 4× `speed_ul_mbps` | `SVC_001` |
| Static IP assigned | Static IP must be non-null before activation | `SVC_002` |
| PPPoE username format | Must match `*@circletel.co.za` | `SVC_003` |
| Installation signal | `site_survey_signal_dbm` ≥ −75 for installation to proceed | `SVC_004` |

---

## 19. Error Handling & Recovery

### 19.1 Integration Error Handling Matrix

| Integration | Error Type | Retry Policy | Fallback | Alert |
|---|---|---|---|---|
| Ruijie Cloud API | Timeout (>5s) | 3 retries, exponential backoff (2s, 4s, 8s) | Use cached device status | Notify NOC after 3 failures |
| Ruijie Cloud API | 401 Unauthorized | Refresh OAuth token; retry once | Manual intervention | Notify dev team |
| Interstellio RADIUS | No response | Failover to next server (3 available) | If all 3 fail: hold session, retry in 30s | Critical alert to NOC |
| MTN Wholesale Portal | Unavailable | Queue order; retry every 30 min | Manual order placement | Notify provisioning team |
| Credit Bureau API | Timeout | 2 retries; 5s timeout | Flag for manual credit check | Notify finance |
| SMS Gateway | 429 Rate Limit | Backoff 60s; retry | Queue with priority ordering | Monitor queue depth |
| Billing Engine | Invoice generation failure | Retry full batch after 1 hour | Manual generation | Critical alert to finance |

### 19.2 Data Consistency Rules

| Scenario | Detection | Recovery |
|---|---|---|
| Service active but no RADIUS account | Nightly reconciliation job | Auto-provision RADIUS account; alert ops |
| Module active but base tier cancelled | Trigger on base tier cancellation | Auto-cancel all modules (cascade) |
| Invoice generated but service already cancelled | Pre-invoice validation | Skip cancelled services; void if already generated |
| CPE device marked 'installed' but not assigned to service | Weekly orphan device scan | Flag for manual review |
| MTN wholesale cost changed but product catalogue not updated | Monthly price reconciliation | Alert finance; freeze billing until resolved |

### 19.3 Idempotency Rules

| Operation | Idempotency Key | Behaviour on Duplicate |
|---|---|---|
| Create order | `customer_id` + `order_type` + `created_date` | Return existing order; do not create duplicate |
| Generate invoice | `customer_id` + `billing_period_start` | Return existing invoice; do not duplicate |
| RADIUS provisioning | `pppoe_username` | Update existing account; do not create duplicate |
| Router provisioning | `serial_number` | Update existing device config; do not re-provision |
| Send notification | `event_code` + `customer_id` + `DATE(created_at)` | Suppress duplicate within 24-hour window |

---

## 20. Non-Functional Requirements

### 20.1 Performance

| Metric | Target | Measurement |
|---|---|---|
| API response time (p95) | < 500 ms | Application monitoring |
| Billing batch (1 000 invoices) | < 10 minutes | Batch job timing |
| Ruijie Cloud polling cycle | 5 minutes ± 30 seconds | Scheduler accuracy |
| Order state transition | < 2 seconds | Event processing time |
| Dashboard load time | < 3 seconds | Frontend monitoring |

### 20.2 Availability

| System | Target Uptime | Maintenance Window |
|---|---|---|
| Supabase Backend | 99.9% | Sundays 02:00–04:00 SAST |
| AgilityGIS BSS | 99.5% | Per AgilityGIS SLA |
| Customer Portal | 99.5% | Aligned with Supabase |
| Notification Service | 99.0% | N/A (queue-based) |

### 20.3 Security

| Requirement | Implementation |
|---|---|
| Data at rest | AES-256 encryption (Supabase managed) |
| Data in transit | TLS 1.3 for all API calls |
| Authentication | JWT tokens with RLS per user role |
| RADIUS shared secret | Stored in environment variables; never in code |
| PII handling | POPIA-compliant; minimum 5-year retention; right to deletion on request |
| Audit trail | All state changes logged with timestamp, user, and old/new values |

### 20.4 Scalability

| Dimension | Current Design | Scale Trigger |
|---|---|---|
| Subscribers | 0–500 (Phase 1) | At 500: review BNG capacity (Echo SP tier upgrade) |
| Database | Single Supabase instance | At 10 000 rows/table: evaluate read replicas |
| Ruijie Cloud polling | Sequential per device | At 200 devices: switch to webhook-based monitoring |
| NNI capacity | 1 Gbps (2 ports ordered) | At 70% utilisation: order 2 Gbps upgrade |
| RADIUS | 3-server cluster | N/A (Interstellio managed) |

---

**END OF DOCUMENT**

*CircleTel (Pty) Ltd — A member of the New Generation Group*
*"Connecting Today, Creating Tomorrow"*
