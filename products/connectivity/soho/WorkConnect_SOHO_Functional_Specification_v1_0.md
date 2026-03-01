# WorkConnect™ SOHO — Functional Specification Document (FSD)

## System Behaviour, Data Logic & Integration Rules

---

| Field | Value |
|---|---|
| **Document Reference** | CT-FSD-WORKCONNECT-2026-001 |
| **Version** | 1.0 |
| **Effective Date** | 01 March 2026 |
| **Classification** | Confidential — Internal & Development Use |
| **Locale** | en-ZA (South African English) |
| **Prepared By** | CircleTel Product & Technology |
| **Companion Documents** | WorkConnect SOHO Portfolio v1.1 (CT-WORK-2026-001), BRD v1.0 (CT-BRD-WORKCONNECT-2026-001) |
| **Supersedes** | N/A — First issue |

---

## Version Control

| Version | Date | Author | Changes | Status |
|---|---|---|---|---|
| 1.0 | 01 March 2026 | CircleTel Product & Technology / Claude AI | Initial FSD aligned to WorkConnect SOHO Portfolio v1.1 and BRD v1.0. Incorporates corrected Tarana G1 4:1 asymmetric speed profiles per CHANGE_LOG_27_Feb_2026. Multi-technology data logic for FWB, FTTH, 5G, and LTE delivery. | **CURRENT** |

---

## Table of Contents

1. Purpose & Scope
2. System Landscape & Integration Map
3. Data Model
4. Product Catalogue Data Logic
5. Order Lifecycle State Machine
6. Service Instance Lifecycle
7. Billing Engine Logic
8. Margin & Cost Calculation Engine
9. Multi-Technology Provisioning Integration
10. Network Integration — BNG, RADIUS & ENNI
11. CPE Management Integration — Ruijie Cloud
12. CRM & Sales Pipeline Logic
13. Support & Fault Management Logic
14. Uptime Monitoring & Service Credit Engine
15. Notification & Event Engine
16. Reporting & Analytics Data Logic
17. API Contract Specifications
18. Validation Rule Register
19. Error Handling & Recovery
20. Non-Functional Requirements

---

## 1. Purpose & Scope

This Functional Specification Document (FSD) defines the system behaviour, data models, calculation logic, integration contracts, and state machines required to operationalise the WorkConnect™ SOHO product line within CircleTel's technology estate.

It translates the commercial rules in the BRD v1.0 (CT-BRD-WORKCONNECT-2026-001) and the product parameters in the WorkConnect Portfolio v1.1 (CT-WORK-2026-001) into implementable system specifications for the development, integration, and operations teams.

**In scope:** All systems involved in the WorkConnect SOHO order-to-cash and service management lifecycle — AgilityGIS BSS, MTN Wholesale portals (FWB, FTTH, 5G/LTE), Echo SP/BNG, Interstellio RADIUS, Ruijie Cloud, Supabase backend, CRM, cloud backup platform, email hosting platform, notification services, and reporting dashboards.

**Key Design Principle:** WorkConnect is a **technology-agnostic** product line. The customer selects a speed tier; the system determines the optimal underlying delivery technology based on coverage at the customer's address. This FSD governs system behaviour across all four supported delivery technologies: MTN Tarana G1 FWB, MTN FTTH (GPON), MTN 5G Fixed Wireless, and MTN LTE-A Fixed Wireless.

**Out of scope:** SkyFibre SMB, SkyFibre Residential, HomeFibreConnect, BizFibreConnect (DFA BIA), UmojaLink, AirLink FWA, ParkConnect DUNE, CircleConnect IoT, EduConnect, and Managed IT Services — each governed by separate FSDs.

---

## 2. System Landscape & Integration Map

### 2.1 Systems of Record

| System | Role | Owner | Type |
|---|---|---|---|
| **AgilityGIS BSS** | Billing, invoicing, customer master, service catalogue | CircleTel | SoR — Customer & Billing |
| **Supabase (PostgreSQL)** | Backend database, API layer, product catalogue, order management, analytics | CircleTel | SoR — Product & Analytics |
| **MTN Wholesale Portal (FWB)** | Tarana G1 FWB order placement, RN device management, coverage check | MTN | External — Upstream |
| **MTN Wholesale Portal (FTTH)** | FTTH order placement, ONT provisioning, fibre coverage check | MTN | External — Upstream |
| **MTN 5G/LTE Portal** | 5G/LTE SIM and CPE provisioning, coverage check | MTN | External — Upstream |
| **Echo SP Managed BNG** | PPPoE session management, CGNAT, IP transit, RADIUS proxy | Echo SP | External — Network |
| **Interstellio RADIUS** | Subscriber authentication (AAA), session attributes, CoA, speed profiles | Interstellio | External — AAA |
| **Ruijie Cloud** | CPE router management, zero-touch provisioning, QoS templates, monitoring | Ruijie Networks | External — CPE |
| **Cloud Backup Platform** | Managed cloud backup service (25/50/100/200 GB tiers) | CircleTel (hosted) | Internal — VAS |
| **Email Hosting Platform** | Business email accounts (name@yourdomain.co.za) | CircleTel (hosted) | Internal — VAS |
| **CRM (Supabase)** | Lead tracking, pipeline, customer interactions, churn flags, persona tagging | CircleTel | SoR — Sales |
| **Notification Service** | Email, SMS, WhatsApp via API gateway | CircleTel | Internal |
| **Credit Bureau API** | TransUnion / Experian credit checks | External | External — Vetting |

### 2.2 Integration Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        CUSTOMER TOUCHPOINTS                         │
│  [ Website ]  [ Sales Portal ]  [ WhatsApp ]  [ Customer Portal ]  │
└──────────┬──────────────────┬──────────────────┬────────────────────┘
           │                  │                  │
           ▼                  ▼                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    CIRCLETEL APPLICATION LAYER                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  AgilityGIS  │  │   Supabase   │  │  Notification│              │
│  │     BSS      │◄─┤   Backend    │──►│   Service    │              │
│  │  (Billing)   │  │  (API/DB)    │  │(Email/SMS/WA)│              │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┘              │
│         │                 │                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ Cloud Backup │  │ Email Hosting│  │ Credit Bureau│              │
│  │   Platform   │  │   Platform   │  │     API      │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
└─────────┼─────────────────┼─────────────────────────────────────────┘
          │                 │
          ▼                 ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    EXTERNAL INTEGRATION LAYER                        │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ MTN Wholesale│  │   Echo SP    │  │  Ruijie Cloud│              │
│  │   Portals    │  │ Managed BNG  │  │  Controller  │              │
│  │(FWB/FTTH/5G) │  │ (PPPoE/CGNAT)│  │  (CPE Mgmt)  │              │
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
│  [ MTN Tarana G1 Base Stations ] ─── [ Tarana RN (FWB CPE) ]        │
│  [ MTN FTTH GPON ] ─── [ ONT (FTTH CPE) ]                          │
│  [ MTN 5G NR ] ─── [ 5G CPE (Fixed Wireless) ]                     │
│  [ MTN LTE-A ] ─── [ LTE CPE (Fixed Wireless) ]                    │
│  [ Huawei BNG NE8000M14 @ JB1 ] ─── [ Echo SP L2 Switching ]      │
└──────────────────────────────────────────────────────────────────────┘
```

### 2.3 Integration Protocols

| Integration | Protocol | Auth | Direction | Frequency |
|---|---|---|---|---|
| Supabase ↔ AgilityGIS BSS | REST/JSON | API Key + JWT | Bidirectional | Real-time events + nightly batch |
| Supabase ↔ Ruijie Cloud | REST/JSON | OAuth 2.0 | Bidirectional | Real-time on provisioning; polling every 5 min for monitoring |
| Supabase ↔ MTN Wholesale (FWB) | Manual / CSV upload (Phase 1); API (Phase 2) | Portal credentials | Push | Per order |
| Supabase ↔ MTN Wholesale (FTTH) | Manual / CSV upload (Phase 1); API (Phase 2) | Portal credentials | Push | Per order |
| Supabase ↔ MTN 5G/LTE Portal | Manual (Phase 1); API (Phase 2) | Portal credentials | Push | Per order |
| Echo SP → Interstellio RADIUS | RADIUS (UDP 1812/1813) | Shared secret | Proxy | Per PPPoE session |
| Supabase ↔ Cloud Backup Platform | REST/JSON | API Key | Push | On provisioning + daily status sync |
| Supabase ↔ Email Hosting | REST/JSON | API Key | Push | On provisioning + account changes |
| Supabase ↔ Credit Bureau | REST/JSON | API Key + Cert | Push/Pull | Per credit check request |
| Supabase ↔ Notification Service | REST/JSON | API Key | Push | Event-driven |
| Supabase → Reporting Dashboard | SQL Views + PostgREST | JWT (RLS) | Pull | On-demand + scheduled |

---

## 3. Data Model

### 3.1 Entity Relationship Summary

```
┌──────────────┐     1:N     ┌──────────────┐     1:N     ┌──────────────┐
│   Customer   │────────────►│    Service   │────────────►│   Add-On     │
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

┌──────────────┐     1:N     ┌──────────────┐
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

┌──────────────┐     1:N     ┌──────────────┐
│   Service    │────────────►│  VAS Account │
│   Instance   │             │ (Backup/Email│
└──────────────┘             └──────────────┘
```

### 3.2 Core Entity Schemas

#### 3.2.1 `wc_customers`

```sql
CREATE TABLE public.wc_customers (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_number        TEXT NOT NULL UNIQUE,  -- CT-WC-XXXXXX
    -- WorkConnect allows individuals (no company registration required)
    entity_type           TEXT NOT NULL CHECK (
        entity_type IN ('individual', 'sole_proprietor', 'pty_ltd', 'cc', 'npc', 'freelancer')
    ),
    -- Personal details (mandatory for all)
    first_name            TEXT NOT NULL,
    last_name             TEXT NOT NULL,
    id_number             TEXT,                   -- SA ID or passport number
    id_type               TEXT NOT NULL CHECK (
        id_type IN ('sa_id', 'passport')
    ),
    -- Optional business details
    company_name          TEXT,                   -- Optional: only if registered business
    trading_name          TEXT,
    registration_number   TEXT,                   -- CIPC: only required for business invoicing
    vat_number            TEXT,                   -- Only required for VAT invoicing
    -- Address
    billing_address       JSONB NOT NULL,
    installation_address  JSONB NOT NULL,
    -- Visa details (foreign nationals)
    visa_type             TEXT CHECK (
        visa_type IN ('work_permit', 'critical_skills', 'digital_nomad', NULL)
    ),
    visa_expiry_date      DATE,
    -- Credit assessment
    credit_score          INTEGER,
    credit_status         TEXT CHECK (
        credit_status IN ('pass', 'marginal', 'fail', 'waived', 'pending')
    ),
    credit_checked_at     TIMESTAMPTZ,
    credit_check_source   TEXT CHECK (
        credit_check_source IN ('transunion', 'experian', 'waived_upfront', 'waived_existing')
    ),
    -- Persona tagging (for segmentation and marketing)
    persona_tag           TEXT CHECK (
        persona_tag IN ('freelancer', 'remote_worker', 'micro_business',
                         'content_creator', 'digital_nomad', 'other')
    ),
    employee_count        INTEGER DEFAULT 1 CHECK (employee_count BETWEEN 1 AND 5),
    -- Contract and payment
    contract_type         TEXT NOT NULL DEFAULT 'month_to_month' CHECK (
        contract_type IN ('month_to_month', '12_month', '24_month')
    ),
    payment_method        TEXT NOT NULL DEFAULT 'debit_order' CHECK (
        payment_method IN ('debit_order', 'credit_card', 'eft', 'upfront_6', 'upfront_12')
    ),
    debit_order_day       INTEGER CHECK (debit_order_day IN (1, 15)),
    -- Account lifecycle
    account_status        TEXT NOT NULL DEFAULT 'pending' CHECK (
        account_status IN ('pending', 'active', 'suspended', 'terminated', 'cancelled')
    ),
    -- Referral tracking
    referral_code         TEXT UNIQUE,             -- This customer's referral code
    referred_by_code      TEXT,                    -- Referral code used at sign-up
    -- Channel tracking
    partner_id            UUID REFERENCES public.wc_partners(id),
    source_channel        TEXT CHECK (
        source_channel IN ('website', 'inside_sales', 'partner', 'referral',
                           'upsell_homefibre', 'upsell_skyfibre_home', 'coworking_partner')
    ),
    -- FICA compliance
    fica_verified         BOOLEAN NOT NULL DEFAULT false,
    fica_verified_at      TIMESTAMPTZ,
    popia_consent         BOOLEAN NOT NULL DEFAULT false,
    popia_consent_at      TIMESTAMPTZ,
    -- Timestamps
    onboarded_at          TIMESTAMPTZ,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wc_customers_account ON public.wc_customers(account_number);
CREATE INDEX idx_wc_customers_status ON public.wc_customers(account_status);
CREATE INDEX idx_wc_customers_partner ON public.wc_customers(partner_id);
CREATE INDEX idx_wc_customers_persona ON public.wc_customers(persona_tag);
CREATE INDEX idx_wc_customers_referral ON public.wc_customers(referral_code);

-- CONSTRAINT: Employee count > 5 must be redirected to SkyFibre SMB (BRD WC-CE-005)
ALTER TABLE public.wc_customers
    ADD CONSTRAINT chk_soho_employee_limit CHECK (employee_count <= 5);
```

#### 3.2.2 `wc_service_instances`

```sql
CREATE TABLE public.wc_service_instances (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id           UUID NOT NULL REFERENCES public.wc_customers(id),
    service_number        TEXT NOT NULL UNIQUE,  -- WC-XXXXXX
    -- Product tier
    product_code          TEXT NOT NULL CHECK (
        product_code IN ('WC_STARTER_50', 'WC_PLUS_100', 'WC_PRO_200')
    ),
    -- Technology-agnostic speed profile
    speed_dl_mbps         INTEGER NOT NULL,
    speed_ul_mbps         INTEGER NOT NULL,       -- Varies by technology
    -- Delivery technology (determined by coverage)
    delivery_technology   TEXT NOT NULL CHECK (
        delivery_technology IN ('ftth', 'fwb_tarana', '5g_fixed', 'lte_fixed')
    ),
    speed_profile_type    TEXT NOT NULL CHECK (
        speed_profile_type IN ('symmetrical', 'asymmetric_4_1', 'variable_best_effort')
    ),
    -- Pricing
    retail_price          DECIMAL(10,2) NOT NULL,
    wholesale_cost        DECIMAL(10,2) NOT NULL,
    -- Network identifiers (technology-dependent)
    pppoe_username        TEXT,                    -- user@circletel.co.za (FWB/FTTH)
    pppoe_realm           TEXT DEFAULT 'circletel.co.za',
    static_ip_address     INET,                    -- NULL unless Pro tier or add-on
    sim_iccid             TEXT,                    -- For 5G/LTE delivery
    -- Installation tracking
    installation_date     DATE,
    installation_status   TEXT DEFAULT 'pending' CHECK (
        installation_status IN ('pending', 'scheduled', 'site_survey_pending',
                                 'site_survey_passed', 'site_survey_failed',
                                 'in_progress', 'completed', 'failed', 'cancelled')
    ),
    installation_fee      DECIMAL(10,2) NOT NULL DEFAULT 900.00,
    installation_waived   BOOLEAN NOT NULL DEFAULT false,
    -- Service lifecycle
    service_status        TEXT NOT NULL DEFAULT 'provisioning' CHECK (
        service_status IN (
            'provisioning', 'active', 'throttled',
            'suspended_billing', 'suspended_technical', 'suspended_aup',
            'pending_cancellation', 'cancelled', 'terminated'
        )
    ),
    -- Uptime and service level
    uptime_target_percent DECIMAL(5,2) NOT NULL DEFAULT 99.0,
    sla_credits_eligible  BOOLEAN NOT NULL DEFAULT false,  -- TRUE only for Pro tier
    -- Contract
    contract_start_date   DATE,
    contract_end_date     DATE,                    -- NULL for month-to-month
    contract_type         TEXT NOT NULL DEFAULT 'month_to_month',
    cooling_off_expiry    DATE,                    -- CPA 5-business-day cooling-off
    -- Cancellation
    cancellation_date     DATE,
    cancellation_reason   TEXT,
    cancellation_type     TEXT CHECK (
        cancellation_type IN ('voluntary', 'non_payment', 'service_failure',
                               'price_increase', 'cooling_off', 'aup_violation')
    ),
    early_termination_fee DECIMAL(10,2),
    -- MTN order tracking
    mtn_order_reference   TEXT,                    -- MTN Wholesale order ID
    mtn_order_type        TEXT CHECK (
        mtn_order_type IN ('fwb', 'ftth', '5g', 'lte')
    ),
    -- Site survey (FWB only)
    site_survey_status    TEXT CHECK (
        site_survey_status IN ('not_required', 'pending', 'scheduled', 'pass',
                                'conditional', 'fail')
    ),
    site_survey_signal_dbm DECIMAL(5,2),
    site_survey_date      DATE,
    site_survey_valid_until DATE,                  -- 30 days from survey date
    -- CPE tracking
    rn_device_serial      TEXT,                    -- Tarana RN serial number (FWB)
    ont_serial            TEXT,                    -- ONT serial number (FTTH)
    ont_ownership         TEXT CHECK (
        ont_ownership IN ('mtn', 'circletel')
    ),
    router_device_id      UUID REFERENCES public.wc_cpe_devices(id),
    five_g_cpe_serial     TEXT,                    -- 5G/LTE CPE serial number
    -- Equipment amortisation
    router_amort_months_remaining INTEGER DEFAULT 24,
    installation_amort_months_remaining INTEGER,
    -- VAS provisioning flags
    cloud_backup_provisioned BOOLEAN DEFAULT false,
    email_accounts_provisioned BOOLEAN DEFAULT false,
    qos_template_applied  BOOLEAN DEFAULT false,
    -- Welcome pack
    welcome_email_sent    BOOLEAN DEFAULT false,
    welcome_whatsapp_sent BOOLEAN DEFAULT false,
    -- Timestamps
    activated_at          TIMESTAMPTZ,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wc_services_customer ON public.wc_service_instances(customer_id);
CREATE INDEX idx_wc_services_status ON public.wc_service_instances(service_status);
CREATE INDEX idx_wc_services_product ON public.wc_service_instances(product_code);
CREATE INDEX idx_wc_services_technology ON public.wc_service_instances(delivery_technology);

-- CONSTRAINT: Pro tier cannot be delivered on LTE (BRD WC-TS-013)
ALTER TABLE public.wc_service_instances
    ADD CONSTRAINT chk_pro_not_on_lte CHECK (
        NOT (product_code = 'WC_PRO_200' AND delivery_technology = 'lte_fixed')
    );

-- CONSTRAINT: Pro tier cannot be delivered on 5G (BRD WC-TS-004 note)
ALTER TABLE public.wc_service_instances
    ADD CONSTRAINT chk_pro_not_on_5g CHECK (
        NOT (product_code = 'WC_PRO_200' AND delivery_technology = '5g_fixed')
    );

-- CONSTRAINT: Plus tier on LTE requires disclaimer flag
-- (enforced at application layer, not DB constraint)
```

#### 3.2.3 `wc_addon_subscriptions`

```sql
CREATE TABLE public.wc_addon_subscriptions (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id            UUID NOT NULL REFERENCES public.wc_service_instances(id) ON DELETE CASCADE,
    addon_code            TEXT NOT NULL CHECK (
        addon_code IN (
            'ADDON_STATIC_IP', 'ADDON_ADDITIONAL_IP',
            'ADDON_BACKUP_BOOST', 'ADDON_LTE_FAILOVER',
            'ADDON_ROUTER_UPGRADE', 'ADDON_EXTRA_EMAIL',
            'ADDON_M365_BASIC'
        )
    ),
    addon_name            TEXT NOT NULL,
    quantity              INTEGER NOT NULL DEFAULT 1,
    unit_price            DECIMAL(10,2) NOT NULL,
    total_price           DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    direct_cost           DECIMAL(10,2) NOT NULL,
    recurring             BOOLEAN NOT NULL DEFAULT true,   -- FALSE for ADDON_ROUTER_UPGRADE (once-off)
    status                TEXT NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'active', 'suspended', 'cancelled')
    ),
    activated_at          TIMESTAMPTZ,
    cancelled_at          TIMESTAMPTZ,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- One Cloud Backup Boost max per service (BRD WC-AO-011)
    CONSTRAINT unique_backup_boost EXCLUDE USING gist (
        service_id WITH =,
        (CASE WHEN addon_code = 'ADDON_BACKUP_BOOST' THEN 'backup_boost'::text
              ELSE addon_code || '_' || id::text END) WITH =
    ) WHERE (status IN ('active', 'pending') AND addon_code = 'ADDON_BACKUP_BOOST')
);

CREATE INDEX idx_wc_addons_service ON public.wc_addon_subscriptions(service_id);
CREATE INDEX idx_wc_addons_code ON public.wc_addon_subscriptions(addon_code);
CREATE INDEX idx_wc_addons_status ON public.wc_addon_subscriptions(status);
```

#### 3.2.4 `wc_orders`

```sql
CREATE TABLE public.wc_orders (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number          TEXT NOT NULL UNIQUE,   -- ORD-WC-XXXXXX
    customer_id           UUID NOT NULL REFERENCES public.wc_customers(id),
    order_type            TEXT NOT NULL CHECK (
        order_type IN ('new_service', 'upgrade', 'downgrade', 'add_addon',
                        'remove_addon', 'technology_change', 'cancellation',
                        'migration_in', 'migration_out')
    ),
    order_status          TEXT NOT NULL DEFAULT 'draft' CHECK (
        order_status IN (
            'draft', 'submitted', 'qualification_check',
            'credit_check', 'credit_approved', 'credit_conditional',
            'credit_rejected',
            'coverage_check', 'coverage_confirmed', 'coverage_failed',
            'site_survey_pending', 'site_survey_passed', 'site_survey_failed',
            'technology_selected',
            'contract_pending', 'contract_signed', 'cooling_off',
            'provisioning', 'mtn_order_placed',
            'installation_scheduled', 'installation_in_progress',
            'installation_complete',
            'activation_pending', 'active', 'completed',
            'cancelled', 'rejected', 'on_hold', 'waitlisted'
        )
    ),
    -- Pricing summary
    total_mrc             DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_nrc             DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_percent      DECIMAL(5,2) DEFAULT 0,
    discount_type         TEXT CHECK (
        discount_type IN ('none', 'multi_service', 'annual_prepay', 'referral', 'promotional')
    ),
    discount_authority    TEXT,
    -- Technology selection
    selected_technology   TEXT CHECK (
        selected_technology IN ('ftth', 'fwb_tarana', '5g_fixed', 'lte_fixed')
    ),
    technology_alternatives JSONB,                 -- Array of other available technologies
    upload_sensitive      BOOLEAN DEFAULT false,   -- Customer flagged as upload-sensitive
    -- Sales tracking
    sales_agent_id        UUID,
    partner_id            UUID REFERENCES public.wc_partners(id),
    source_channel        TEXT,
    qualification_answers JSONB,                   -- Stored answers to WC-CE-010 to WC-CE-014
    -- Notes
    notes                 TEXT,
    -- Timestamps
    submitted_at          TIMESTAMPTZ,
    completed_at          TIMESTAMPTZ,
    cancelled_at          TIMESTAMPTZ,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wc_orders_customer ON public.wc_orders(customer_id);
CREATE INDEX idx_wc_orders_status ON public.wc_orders(order_status);
CREATE INDEX idx_wc_orders_type ON public.wc_orders(order_type);
```

#### 3.2.5 `wc_order_line_items`

```sql
CREATE TABLE public.wc_order_line_items (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id              UUID NOT NULL REFERENCES public.wc_orders(id) ON DELETE CASCADE,
    line_type             TEXT NOT NULL CHECK (
        line_type IN ('base_tier', 'addon', 'nrc_installation', 'nrc_equipment',
                       'discount', 'referral_credit')
    ),
    product_code          TEXT NOT NULL,
    description           TEXT NOT NULL,
    quantity              INTEGER NOT NULL DEFAULT 1,
    unit_price            DECIMAL(10,2) NOT NULL,
    line_total            DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    recurring             BOOLEAN NOT NULL DEFAULT true,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wc_line_items_order ON public.wc_order_line_items(order_id);
```

#### 3.2.6 `wc_cpe_devices`

```sql
CREATE TABLE public.wc_cpe_devices (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_type           TEXT NOT NULL CHECK (
        device_type IN ('tarana_rn', 'reyee_router', 'ont', '5g_cpe', 'lte_cpe')
    ),
    model                 TEXT NOT NULL,            -- e.g. 'RG-EW1300G', 'RG-EG105GW', 'RG-EG105G-P'
    serial_number         TEXT NOT NULL UNIQUE,
    mac_address           MACADDR,
    firmware_version      TEXT,
    ruijie_cloud_id       TEXT,                    -- Ruijie Cloud device ID (routers only)
    ownership             TEXT NOT NULL CHECK (
        ownership IN ('mtn', 'circletel', 'customer')
    ),
    dealer_cost           DECIMAL(10,2),            -- Purchase price from Scoop Distribution
    amortisation_months   INTEGER DEFAULT 24,
    amortisation_monthly  DECIMAL(10,2),            -- dealer_cost / 24
    status                TEXT NOT NULL DEFAULT 'in_stock' CHECK (
        status IN ('in_stock', 'allocated', 'installed', 'faulty',
                    'returned', 'decommissioned', 'pending_return')
    ),
    warehouse_location    TEXT CHECK (
        warehouse_location IN ('cape_town', 'durban', 'johannesburg')
    ),
    assigned_service_id   UUID REFERENCES public.wc_service_instances(id),
    installed_at          TIMESTAMPTZ,
    returned_at           TIMESTAMPTZ,
    last_seen_online      TIMESTAMPTZ,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wc_cpe_serial ON public.wc_cpe_devices(serial_number);
CREATE INDEX idx_wc_cpe_service ON public.wc_cpe_devices(assigned_service_id);
CREATE INDEX idx_wc_cpe_status ON public.wc_cpe_devices(status);
CREATE INDEX idx_wc_cpe_warehouse ON public.wc_cpe_devices(warehouse_location);
```

#### 3.2.7 `wc_invoices` and `wc_invoice_lines`

```sql
CREATE TABLE public.wc_invoices (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number        TEXT NOT NULL UNIQUE,   -- INV-WC-YYYYMM-XXXXXX
    customer_id           UUID NOT NULL REFERENCES public.wc_customers(id),
    billing_period_start  DATE NOT NULL,
    billing_period_end    DATE NOT NULL,
    subtotal_excl_vat     DECIMAL(10,2) NOT NULL,
    vat_amount            DECIMAL(10,2) NOT NULL,
    total_incl_vat        DECIMAL(10,2) NOT NULL,
    credit_applied        DECIMAL(10,2) DEFAULT 0,
    status                TEXT NOT NULL DEFAULT 'generated' CHECK (
        status IN ('generated', 'sent', 'paid', 'partially_paid',
                    'overdue', 'written_off', 'credited')
    ),
    due_date              DATE NOT NULL,
    paid_date             DATE,
    payment_reference     TEXT,
    arrears_interest      DECIMAL(10,2) DEFAULT 0,  -- 2% per month on outstanding > 30 days
    generated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at               TIMESTAMPTZ,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.wc_invoice_lines (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id            UUID NOT NULL REFERENCES public.wc_invoices(id) ON DELETE CASCADE,
    service_id            UUID REFERENCES public.wc_service_instances(id),
    addon_id              UUID REFERENCES public.wc_addon_subscriptions(id),
    description           TEXT NOT NULL,
    quantity              INTEGER NOT NULL DEFAULT 1,
    unit_price_excl_vat   DECIMAL(10,2) NOT NULL,
    vat_rate              DECIMAL(5,4) NOT NULL DEFAULT 0.15,
    line_total_excl_vat   DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price_excl_vat) STORED,
    line_vat              DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price_excl_vat * vat_rate) STORED,
    line_type             TEXT NOT NULL CHECK (
        line_type IN ('base_tier', 'addon', 'nrc', 'credit_note',
                       'service_credit', 'pro_rata', 'penalty',
                       'early_termination', 'router_recovery',
                       'arrears_interest', 'referral_credit')
    ),
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### 3.2.8 `wc_support_tickets`

```sql
CREATE TABLE public.wc_support_tickets (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number         TEXT NOT NULL UNIQUE,   -- TKT-WC-XXXXXX
    customer_id           UUID NOT NULL REFERENCES public.wc_customers(id),
    service_id            UUID REFERENCES public.wc_service_instances(id),
    category              TEXT NOT NULL CHECK (
        category IN ('fault', 'billing', 'general', 'change_request',
                      'complaint', 'cancellation', 'qos_issue',
                      'cloud_backup', 'email_hosting')
    ),
    priority              TEXT NOT NULL DEFAULT 'normal' CHECK (
        priority IN ('critical', 'high', 'normal', 'low')
    ),
    tier_at_creation      TEXT NOT NULL,          -- Service tier at time of ticket creation
    response_deadline_hrs INTEGER NOT NULL,       -- 12 (Starter), 8 (Plus), 4 (Pro)
    sla_response_deadline TIMESTAMPTZ,
    sla_breached          BOOLEAN DEFAULT false,
    status                TEXT NOT NULL DEFAULT 'open' CHECK (
        status IN ('open', 'assigned', 'in_progress', 'awaiting_customer',
                    'awaiting_mtn', 'escalated', 'resolved', 'closed')
    ),
    escalation_level      INTEGER DEFAULT 1 CHECK (escalation_level BETWEEN 1 AND 4),
    assigned_to           UUID,
    description           TEXT NOT NULL,
    resolution_notes      TEXT,
    mtn_fault_reference   TEXT,                    -- MTN fault number if escalated upstream
    opened_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    first_response_at     TIMESTAMPTZ,
    resolved_at           TIMESTAMPTZ,
    closed_at             TIMESTAMPTZ,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wc_tickets_customer ON public.wc_support_tickets(customer_id);
CREATE INDEX idx_wc_tickets_service ON public.wc_support_tickets(service_id);
CREATE INDEX idx_wc_tickets_status ON public.wc_support_tickets(status);
```

#### 3.2.9 `wc_vas_accounts`

```sql
-- Value-Added Service accounts (cloud backup and email hosting)
CREATE TABLE public.wc_vas_accounts (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id            UUID NOT NULL REFERENCES public.wc_service_instances(id) ON DELETE CASCADE,
    vas_type              TEXT NOT NULL CHECK (
        vas_type IN ('cloud_backup', 'email_hosting')
    ),
    -- Cloud backup fields
    backup_quota_gb       INTEGER,                 -- 25, 50, 100, or boosted amount
    backup_used_gb        DECIMAL(10,2) DEFAULT 0,
    backup_schedule       TEXT DEFAULT 'off_peak', -- 'off_peak' (22:00-06:00) or 'continuous'
    -- Email hosting fields
    email_domain          TEXT,                     -- yourdomain.co.za
    email_quota_accounts  INTEGER,                 -- 2, 5, or 10 (+ extra add-ons)
    email_active_accounts INTEGER DEFAULT 0,
    -- Status
    status                TEXT NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'active', 'suspended', 'deprovisioned')
    ),
    provisioned_at        TIMESTAMPTZ,
    deprovisioned_at      TIMESTAMPTZ,
    -- Data retention (POPIA)
    data_retention_expiry DATE,                    -- 30 days post service termination
    data_export_requested BOOLEAN DEFAULT false,
    data_export_completed BOOLEAN DEFAULT false,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wc_vas_service ON public.wc_vas_accounts(service_id);
CREATE INDEX idx_wc_vas_type ON public.wc_vas_accounts(vas_type);
```

#### 3.2.10 `wc_coverage_checks`

```sql
-- Multi-technology coverage check results
CREATE TABLE public.wc_coverage_checks (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id              UUID REFERENCES public.wc_orders(id),
    customer_id           UUID NOT NULL REFERENCES public.wc_customers(id),
    address               JSONB NOT NULL,
    -- Results per technology
    ftth_available        BOOLEAN,
    ftth_provider         TEXT,                     -- 'mtn_ftth', 'dfa'
    ftth_checked_at       TIMESTAMPTZ,
    fwb_available         BOOLEAN,
    fwb_coverage_quality  TEXT CHECK (
        fwb_coverage_quality IN ('confirmed', 'marginal', 'unavailable')
    ),
    fwb_checked_at        TIMESTAMPTZ,
    five_g_available      BOOLEAN,
    five_g_checked_at     TIMESTAMPTZ,
    lte_available         BOOLEAN,
    lte_checked_at        TIMESTAMPTZ,
    -- Recommended technology (per priority matrix WC-TS-001 to WC-TS-004)
    recommended_technology TEXT CHECK (
        recommended_technology IN ('ftth', 'fwb_tarana', '5g_fixed', 'lte_fixed', 'none')
    ),
    upload_sensitive_override BOOLEAN DEFAULT false, -- Overrides FWB preference for FTTH
    -- Waitlist
    waitlisted            BOOLEAN DEFAULT false,
    waitlist_notify_email TEXT,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wc_coverage_order ON public.wc_coverage_checks(order_id);
CREATE INDEX idx_wc_coverage_customer ON public.wc_coverage_checks(customer_id);
```

---

## 4. Product Catalogue Data Logic

### 4.1 Product Catalogue Table

```sql
CREATE TABLE public.wc_product_catalogue (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_code          TEXT NOT NULL UNIQUE,
    product_type          TEXT NOT NULL CHECK (product_type IN ('base_tier', 'addon')),
    product_name          TEXT NOT NULL,
    tier_name             TEXT,                     -- 'Starter', 'Plus', 'Pro'
    -- Speed (base tiers only; NULL for add-ons)
    speed_dl_mbps         INTEGER,
    -- Upload speeds vary by technology — stored per-tech
    speed_ul_ftth         INTEGER,                 -- Symmetrical
    speed_ul_fwb          INTEGER,                 -- 4:1 asymmetric
    speed_ul_5g           INTEGER,                 -- Best-effort estimate
    speed_ul_lte          INTEGER,                 -- Best-effort estimate
    -- Pricing
    retail_price          DECIMAL(10,2) NOT NULL,
    -- Wholesale cost varies by technology — stored per-tech
    wholesale_cost_fwb    DECIMAL(10,2),
    wholesale_cost_ftth   DECIMAL(10,2),
    wholesale_cost_5g     DECIMAL(10,2),
    wholesale_cost_lte    DECIMAL(10,2),
    -- Direct cost (all-in, varies by technology)
    direct_cost_fwb       DECIMAL(10,2),
    direct_cost_ftth      DECIMAL(10,2),
    -- Module categorisation (for add-ons)
    addon_group           TEXT,                     -- for conflict detection: 'static_ip', 'backup', 'failover', etc.
    max_per_service       INTEGER DEFAULT 1,
    requires_base         BOOLEAN NOT NULL DEFAULT true,
    dependency_code       TEXT,                     -- addon_code this depends on
    -- Tier restrictions
    blocked_on_tier       TEXT[],                   -- e.g. {'WC_STARTER_50'} for Premium Router Upgrade
    blocked_on_technology TEXT[],                   -- e.g. {'lte_fixed', '5g_fixed'} for LTE Failover
    -- Router assignment
    default_router_model  TEXT,                     -- 'RG-EW1300G' or 'RG-EG105GW'
    -- Lifecycle
    is_active             BOOLEAN NOT NULL DEFAULT true,
    effective_from        DATE NOT NULL,
    effective_to          DATE,                     -- NULL = no expiry
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 4.2 Seed Data — Base Tiers

| product_code | product_name | tier | speed_dl | ul_ftth | ul_fwb | ul_5g | ul_lte | retail_price | wh_fwb | wh_ftth | direct_fwb | direct_ftth |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `WC_STARTER_50` | WorkConnect Starter | Starter | 50 | 50 | 12.5 | ~10 | ~8 | 799.00 | 499.00 | 542.00 | 647.08 | 720.08 |
| `WC_PLUS_100` | WorkConnect Plus | Plus | 100 | 200* | 25 | ~20 | ~15 | 1099.00 | 599.00 | 737.00 | 779.66 | 959.16 |
| `WC_PRO_200` | WorkConnect Pro | Pro | 200 | 500** | 50 | N/A | N/A | 1499.00 | 699.00 | 837.00 | 887.66 | 1070.66 |

*FTTH Plus: Over-provisioned to 200/200 Mbps (no 100 Mbps wholesale tier).
**FTTH Pro: Over-provisioned to 500/500 Mbps (best available tier above 200 Mbps).

### 4.3 Seed Data — Add-Ons

| product_code | product_name | retail_price | direct_cost | addon_group | recurring | dependency | blocked_on_tier | blocked_on_tech |
|---|---|---|---|---|---|---|---|---|
| `ADDON_STATIC_IP` | Static IP Address | 99.00 | 15.00 | static_ip | true | — | — | — |
| `ADDON_ADDITIONAL_IP` | Additional Static IP | 99.00 | 15.00 | additional_ip | true | ADDON_STATIC_IP (or Pro tier) | — | — |
| `ADDON_BACKUP_BOOST` | Cloud Backup Boost (+100 GB) | 99.00 | 40.00 | backup_boost | true | — | — | — |
| `ADDON_LTE_FAILOVER` | LTE Failover Connection | 299.00 | 150.00 | failover | true | — | — | {lte_fixed, 5g_fixed} |
| `ADDON_ROUTER_UPGRADE` | Premium Router Upgrade | 199.00 | 150.00 | router_upgrade | false (once-off) | — | {WC_STARTER_50} | — |
| `ADDON_EXTRA_EMAIL` | Additional Email Account | 15.00 | 5.00 | extra_email | true | — | — | — |
| `ADDON_M365_BASIC` | Microsoft 365 Basic | 149.00 | 110.00 | m365 | true | — | — | — |

### 4.4 Add-On Validation Function

```sql
CREATE OR REPLACE FUNCTION validate_wc_addon_addition(
    p_service_id UUID,
    p_addon_code TEXT,
    p_quantity INTEGER DEFAULT 1
) RETURNS JSONB AS $$
DECLARE
    v_catalogue RECORD;
    v_service RECORD;
    v_existing_count INTEGER;
    v_result JSONB;
BEGIN
    -- Get catalogue entry for requested add-on
    SELECT * INTO v_catalogue
    FROM public.wc_product_catalogue
    WHERE product_code = p_addon_code AND is_active = true AND product_type = 'addon';

    IF NOT FOUND THEN
        RETURN jsonb_build_object('valid', false, 'reason', 'Add-on not found in catalogue');
    END IF;

    -- Get service instance
    SELECT * INTO v_service
    FROM public.wc_service_instances
    WHERE id = p_service_id AND service_status = 'active';

    IF NOT FOUND THEN
        RETURN jsonb_build_object('valid', false, 'reason', 'No active WorkConnect base tier on this service');
    END IF;

    -- Check: Static IP redundancy on Pro tier (BRD WC-AO-010)
    IF p_addon_code = 'ADDON_STATIC_IP' AND v_service.product_code = 'WC_PRO_200' THEN
        RETURN jsonb_build_object('valid', false, 'reason', 'Static IP already included on Pro tier — use Additional IP add-on instead');
    END IF;

    -- Check: tier restriction (BRD WC-AO-013)
    IF v_catalogue.blocked_on_tier IS NOT NULL AND
       v_service.product_code = ANY(v_catalogue.blocked_on_tier) THEN
        RETURN jsonb_build_object('valid', false, 'reason',
            format('Add-on %s is not available on %s tier', p_addon_code, v_service.product_code));
    END IF;

    -- Check: technology restriction (BRD WC-AO-012)
    IF v_catalogue.blocked_on_technology IS NOT NULL AND
       v_service.delivery_technology = ANY(v_catalogue.blocked_on_technology) THEN
        RETURN jsonb_build_object('valid', false, 'reason',
            format('Add-on %s is not compatible with %s delivery', p_addon_code, v_service.delivery_technology));
    END IF;

    -- Check: max per service (BRD WC-AO-011 — one Backup Boost max)
    SELECT COUNT(*) INTO v_existing_count
    FROM public.wc_addon_subscriptions
    WHERE service_id = p_service_id
      AND addon_code = p_addon_code
      AND status IN ('active', 'pending');

    IF v_existing_count >= v_catalogue.max_per_service THEN
        RETURN jsonb_build_object('valid', false, 'reason',
            format('Maximum %s subscription(s) of %s per service already active',
                v_catalogue.max_per_service, p_addon_code));
    END IF;

    -- Check: Additional IP requires base Static IP or Pro tier
    IF p_addon_code = 'ADDON_ADDITIONAL_IP' THEN
        IF v_service.product_code != 'WC_PRO_200' AND NOT EXISTS (
            SELECT 1 FROM public.wc_addon_subscriptions
            WHERE service_id = p_service_id AND addon_code = 'ADDON_STATIC_IP'
              AND status IN ('active')
        ) THEN
            RETURN jsonb_build_object('valid', false, 'reason',
                'Additional IP requires an active Static IP add-on or Pro tier');
        END IF;
        -- Max 4 additional IPs (BRD WC-AO-002)
        IF v_existing_count >= 4 THEN
            RETURN jsonb_build_object('valid', false, 'reason',
                'Maximum 4 additional static IPs per service');
        END IF;
    END IF;

    -- Check: Additional email max 20 accounts total (BRD WC-AO-006)
    IF p_addon_code = 'ADDON_EXTRA_EMAIL' THEN
        SELECT COALESCE(SUM(quantity), 0) INTO v_existing_count
        FROM public.wc_addon_subscriptions
        WHERE service_id = p_service_id AND addon_code = 'ADDON_EXTRA_EMAIL'
          AND status IN ('active', 'pending');

        IF v_existing_count + p_quantity > 20 THEN
            RETURN jsonb_build_object('valid', false, 'reason',
                format('Maximum 20 additional email accounts per service (currently %s active)',
                    v_existing_count));
        END IF;
    END IF;

    -- Check: LTE Failover requires coverage confirmation
    IF p_addon_code = 'ADDON_LTE_FAILOVER' THEN
        RETURN jsonb_build_object('valid', true,
            'warning', 'MTN LTE coverage at site must be manually confirmed before activation');
    END IF;

    RETURN jsonb_build_object('valid', true);
END;
$$ LANGUAGE plpgsql;
```

### 4.5 Technology-Specific Price Lookup Function

```sql
CREATE OR REPLACE FUNCTION get_wc_cost_by_technology(
    p_product_code TEXT,
    p_technology TEXT
) RETURNS JSONB AS $$
DECLARE
    v_cat RECORD;
BEGIN
    SELECT * INTO v_cat FROM public.wc_product_catalogue
    WHERE product_code = p_product_code AND is_active = true;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'Product not found');
    END IF;

    RETURN jsonb_build_object(
        'product_code', v_cat.product_code,
        'retail_price', v_cat.retail_price,
        'wholesale_cost', CASE p_technology
            WHEN 'fwb_tarana' THEN v_cat.wholesale_cost_fwb
            WHEN 'ftth' THEN v_cat.wholesale_cost_ftth
            WHEN '5g_fixed' THEN v_cat.wholesale_cost_5g
            WHEN 'lte_fixed' THEN v_cat.wholesale_cost_lte
        END,
        'direct_cost', CASE p_technology
            WHEN 'fwb_tarana' THEN v_cat.direct_cost_fwb
            WHEN 'ftth' THEN v_cat.direct_cost_ftth
            ELSE v_cat.direct_cost_fwb  -- Default to FWB cost structure for 5G/LTE
        END,
        'speed_dl', v_cat.speed_dl_mbps,
        'speed_ul', CASE p_technology
            WHEN 'ftth' THEN v_cat.speed_ul_ftth
            WHEN 'fwb_tarana' THEN v_cat.speed_ul_fwb
            WHEN '5g_fixed' THEN v_cat.speed_ul_5g
            WHEN 'lte_fixed' THEN v_cat.speed_ul_lte
        END,
        'speed_profile', CASE p_technology
            WHEN 'ftth' THEN 'symmetrical'
            WHEN 'fwb_tarana' THEN 'asymmetric_4_1'
            ELSE 'variable_best_effort'
        END,
        'contribution_margin', v_cat.retail_price - CASE p_technology
            WHEN 'fwb_tarana' THEN v_cat.direct_cost_fwb
            WHEN 'ftth' THEN v_cat.direct_cost_ftth
            ELSE v_cat.direct_cost_fwb
        END
    );
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
                 ┌──────────────────────┐
                 │ QUALIFICATION_CHECK  │ ← Ask WC-CE-010 to WC-CE-014
                 └──────────┬───────────┘
                     ┌──────┴──────┐
                 qualifies()    disqualifies()
                     │              │
                     │              ▼
                     │      ┌────────────────┐
                     │      │ REDIRECT       │ → HomeFibre / SkyFibre SMB
                     │      └────────────────┘
                     ▼
              ┌──────────────┐
              │ CREDIT_CHECK │
              └──────┬───────┘
                ┌────┴────────────────┐
           pass()   conditional()   reject()
                │        │              │
                ▼        ▼              ▼
    ┌───────────────┐ ┌──────────────┐ ┌───────────┐
    │CREDIT_APPROVED│ │CREDIT_CONDIT.│ │ REJECTED  │
    └───────┬───────┘ └──────┬───────┘ └───────────┘
            │                │ (debit order or 2-month prepay)
            └────────┬───────┘
                     ▼
           ┌──────────────────┐
           │  COVERAGE_CHECK  │ ← Multi-tech: FTTH → FWB → 5G → LTE
           └────────┬─────────┘
               ┌────┴────┐
           confirmed() failed()
               │          │
               ▼          ▼
    ┌────────────────┐ ┌────────────────┐
    │   COVERAGE     │ │COVERAGE_FAILED │ → waitlist
    │   CONFIRMED    │ └────────────────┘
    └────────┬───────┘
             │ fwb_marginal?
             ├── YES → SITE_SURVEY_PENDING → pass / conditional / fail
             └── NO ↓
                  │
                  ▼
        ┌────────────────────┐
        │TECHNOLOGY_SELECTED │ ← Apply WC-TS-001 to WC-TS-014
        └────────┬───────────┘
                 │ generate_contract()
                 ▼
        ┌────────────────────┐
        │ CONTRACT_PENDING   │
        └────────┬───────────┘
                 │ contract_signed()
                 ▼
        ┌────────────────────┐
        │   COOLING_OFF      │ ← 5 business days (CPA Section 16)
        └────────┬───────────┘
                 │ cooling_off_expired() OR customer_confirms()
                 ▼
        ┌────────────────────┐
        │   PROVISIONING     │ → create MTN wholesale order
        └────────┬───────────┘
                 │ mtn_order_confirmed()
                 ▼
        ┌────────────────────┐
        │  MTN_ORDER_PLACED  │
        └────────┬───────────┘
                 │ schedule_installation()
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
    │ ACTIVATION_PENDING │ → RADIUS + IP + QoS + VAS provisioning
    └────────┬───────────┘
             │ all_systems_confirmed()
             ▼
    ┌────────────────┐
    │     ACTIVE     │ → billing starts (WC-BL-002)
    └────────┬───────┘
             │
             ▼
    ┌────────────────┐
    │   COMPLETED    │ → order lifecycle ends; service lifecycle begins
    └────────────────┘
```

### 5.2 State Transition Rules

| From State | Event | To State | System Actions | BRD Ref |
|---|---|---|---|---|
| DRAFT | submit() | QUALIFICATION_CHECK | Persist qualification answers | WC-CE-010–014 |
| QUALIFICATION_CHECK | qualifies() | CREDIT_CHECK | Trigger credit bureau API | WC-CE-030 |
| CREDIT_CHECK | credit_pass(score ≥ 580) | CREDIT_APPROVED | Store score; proceed | WC-CE-031 |
| CREDIT_CHECK | credit_conditional(450–579) | CREDIT_CONDITIONAL | Require debit order mandate or 2-month prepay | WC-CE-032 |
| CREDIT_CHECK | credit_reject(< 450) | REJECTED | Offer 12-month + deposit or redirect | WC-CE-033 |
| CREDIT_CHECK | credit_waived(upfront or existing) | CREDIT_APPROVED | Skip credit check | WC-CE-034/035 |
| CREDIT_APPROVED | trigger_coverage() | COVERAGE_CHECK | Run multi-tech coverage checks | WC-TC-001 |
| COVERAGE_CHECK | all_confirmed() | COVERAGE_CONFIRMED | Store results per tech | WC-TC-002 |
| COVERAGE_CHECK | all_failed() | COVERAGE_FAILED | Add to waitlist; notify | WC-TC-003 |
| COVERAGE_CONFIRMED | select_technology() | TECHNOLOGY_SELECTED | Apply priority matrix + overrides | WC-TS-001–014 |
| TECHNOLOGY_SELECTED | generate_contract() | CONTRACT_PENDING | Generate contract with tech disclosure | WC-CT-010–014 |
| CONTRACT_PENDING | contract_signed() | COOLING_OFF | Start 5 business day cooling-off | WC-CT-012 |
| COOLING_OFF | cooling_off_expired() | PROVISIONING | Create MTN wholesale order | WC-IN-004 |
| PROVISIONING | mtn_confirmed() | MTN_ORDER_PLACED | Store MTN order ref | — |
| MTN_ORDER_PLACED | schedule() | INSTALLATION_SCHEDULED | Book 4-hour window | WC-IN-005 |
| INSTALLATION_SCHEDULED | start() | INSTALLATION_IN_PROGRESS | Installer on site | WC-IN-010 |
| INSTALLATION_IN_PROGRESS | complete() | INSTALLATION_COMPLETE | Speed test passed | WC-IN-015 |
| INSTALLATION_COMPLETE | activate() | ACTIVATION_PENDING | RADIUS + IP + QoS + VAS | WC-IN-040–047 |
| ACTIVATION_PENDING | all_confirmed() | ACTIVE | Start billing; send welcome | WC-BL-002 |
| ACTIVE | — | COMPLETED | Close order; service lifecycle takes over | — |

---

## 6. Service Instance Lifecycle

### 6.1 Service Status State Machine

```
┌──────────────┐
│ PROVISIONING │ ← Order reaches PROVISIONING state
└──────┬───────┘
       │ activation_confirmed()
       ▼
┌──────────────┐
│    ACTIVE    │◄────────────────────────────────────────────┐
└──────┬───────┘                                             │
       │                                                     │
       ├── 14_days_overdue() ──► ┌──────────────┐            │
       │                         │  THROTTLED   │ (2 Mbps)   │
       │                         └──────┬───────┘            │
       │                                │ payment_received()──┘
       │                                │ 30_days_overdue()
       │                                ▼
       ├── 30_days_overdue() ──► ┌────────────────────┐      │
       │                         │ SUSPENDED_BILLING  │      │
       │                         └──────┬─────────────┘      │
       │                                │ payment_received()──┘
       │                                │ 60_days_overdue()
       │                                ▼
       │                         ┌──────────────┐
       │                         │  TERMINATED  │ → router recovery; collections
       │                         └──────────────┘
       │
       ├── technical_fault() ──► ┌────────────────────────┐
       │                         │ SUSPENDED_TECHNICAL    │
       │                         └──────┬─────────────────┘
       │                                │ fault_resolved()──────────────┘
       │
       ├── aup_violation() ────► ┌──────────────────┐
       │                         │  SUSPENDED_AUP   │
       │                         └──────┬───────────┘
       │                                │ review_complete()──────────────┘
       │                                │ confirmed_violation()
       │                                ▼
       │                         ┌──────────────┐
       │                         │  TERMINATED  │
       │                         └──────────────┘
       │
       └── cancellation_request() ► ┌────────────────────────┐
                                    │ PENDING_CANCELLATION   │
                                    └──────┬─────────────────┘
                                           │ 30_day_notice_expired()
                                           ▼
                                    ┌──────────────┐
                                    │  CANCELLED   │ → router recovery; VAS deprov.
                                    └──────────────┘
```

### 6.2 Service Status Transitions

| From | Event | To | Actions | BRD Ref |
|---|---|---|---|---|
| ACTIVE | 14 days overdue | THROTTLED | Throttle to 2 Mbps via RADIUS CoA; SMS + email notification | WC-BL-022 |
| THROTTLED | Payment received | ACTIVE | Remove throttle via RADIUS CoA; confirm to customer | WC-BL-022 |
| THROTTLED | 30 days overdue | SUSPENDED_BILLING | Disable PPPoE session; formal suspension notice | WC-BL-023 |
| SUSPENDED_BILLING | Full arrears paid | ACTIVE | Re-enable PPPoE; confirm to customer | WC-BL-023 |
| SUSPENDED_BILLING | 60 days overdue | TERMINATED | Terminate service; initiate router recovery; hand to collections | WC-BL-024 |
| ACTIVE | AUP violation detected | SUSPENDED_AUP | Disable service; investigate | WC-FU-020–025 |
| ACTIVE | Customer requests cancel | PENDING_CANCELLATION | Start 30-day notice period; trigger churn mitigation | WC-CN-001 |
| PENDING_CANCELLATION | Notice period expires | CANCELLED | Final invoice; deprovision VAS; schedule router collection | WC-CN-020–024 |

### 6.3 Throttling Logic (RADIUS Change-of-Authorisation)

```
TRIGGER: Invoice overdue > 14 calendar days (WC-BL-022)
ACTION:
  1. RADIUS sends CoA to BNG for PPPoE session:
     - Set download speed to 2 Mbps
     - Set upload speed to 0.5 Mbps
     - QoS profile: NONE (all traffic treated equally)
  2. Update service_status = 'throttled'
  3. Send notification:
     - SMS: "Your WorkConnect service has been throttled due to outstanding payment. 
             Please settle R{amount} to restore full speed. Ref: {invoice_number}"
     - Email: Detailed arrears breakdown with payment link
  4. Log event to service_events table

RESTORE TRIGGER: Payment received covering all overdue invoices
RESTORE ACTION:
  1. RADIUS sends CoA to restore original speed profile
  2. Re-apply QoS template via Ruijie Cloud
  3. Update service_status = 'active'
  4. Send confirmation SMS + email
```

---

## 7. Billing Engine Logic

### 7.1 Invoice Generation Rules

| Rule | Logic | BRD Ref |
|---|---|---|
| Billing frequency | Monthly in advance; invoices generated on 1st of each month | WC-BL-001 |
| Billing start | From PPPoE session confirmed UP (FWB/FTTH) or 5G/LTE connection active | WC-BL-002 |
| Pro-rata first invoice | `(days_remaining_in_month / days_in_month) × MRC` | WC-BL-003 |
| VAT | All amounts + 15% VAT; shown separately on invoice | WC-BL-006 |
| Payment due date | Invoice date + 7 calendar days | WC-BL-005 |
| Arrears interest | 2% per month on amounts outstanding > 30 days | WC-BL-025 |

### 7.2 Monthly Invoice Generation Function

```sql
CREATE OR REPLACE FUNCTION generate_wc_monthly_invoices(
    p_billing_month DATE  -- First day of billing month
) RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER := 0;
    v_service RECORD;
    v_invoice_id UUID;
    v_subtotal DECIMAL(10,2);
    v_vat DECIMAL(10,2);
BEGIN
    FOR v_service IN
        SELECT si.*, c.id as cust_id, c.account_number
        FROM public.wc_service_instances si
        JOIN public.wc_customers c ON si.customer_id = c.id
        WHERE si.service_status IN ('active', 'throttled')
          AND si.activated_at IS NOT NULL
          AND si.activated_at < (p_billing_month + INTERVAL '1 month')
    LOOP
        v_subtotal := 0;

        -- Create invoice header
        INSERT INTO public.wc_invoices (
            invoice_number, customer_id,
            billing_period_start, billing_period_end,
            subtotal_excl_vat, vat_amount, total_incl_vat,
            due_date, status
        ) VALUES (
            format('INV-WC-%s-%s',
                to_char(p_billing_month, 'YYYYMM'),
                lpad(nextval('wc_invoice_seq')::text, 6, '0')),
            v_service.cust_id,
            p_billing_month,
            (p_billing_month + INTERVAL '1 month' - INTERVAL '1 day')::date,
            0, 0, 0,  -- Updated below
            (p_billing_month + INTERVAL '7 days')::date,
            'generated'
        ) RETURNING id INTO v_invoice_id;

        -- Line 1: Base tier MRC
        INSERT INTO public.wc_invoice_lines (
            invoice_id, service_id, description,
            unit_price_excl_vat, line_type
        ) VALUES (
            v_invoice_id, v_service.id,
            format('WorkConnect %s — %s Mbps (%s)',
                CASE v_service.product_code
                    WHEN 'WC_STARTER_50' THEN 'Starter'
                    WHEN 'WC_PLUS_100' THEN 'Plus'
                    WHEN 'WC_PRO_200' THEN 'Pro'
                END,
                v_service.speed_dl_mbps,
                v_service.delivery_technology),
            v_service.retail_price,
            'base_tier'
        );
        v_subtotal := v_subtotal + v_service.retail_price;

        -- Line 2+: Active add-ons
        INSERT INTO public.wc_invoice_lines (
            invoice_id, service_id, addon_id, description,
            quantity, unit_price_excl_vat, line_type
        )
        SELECT v_invoice_id, v_service.id, a.id,
               a.addon_name, a.quantity, a.unit_price, 'addon'
        FROM public.wc_addon_subscriptions a
        WHERE a.service_id = v_service.id
          AND a.status = 'active'
          AND a.recurring = true;

        -- Accumulate add-on totals
        SELECT v_subtotal + COALESCE(SUM(quantity * unit_price), 0) INTO v_subtotal
        FROM public.wc_addon_subscriptions
        WHERE service_id = v_service.id AND status = 'active' AND recurring = true;

        -- Apply discount if applicable
        -- (Multi-service or promotional — checked at application layer)

        -- Calculate VAT and update invoice header
        v_vat := ROUND(v_subtotal * 0.15, 2);

        UPDATE public.wc_invoices SET
            subtotal_excl_vat = v_subtotal,
            vat_amount = v_vat,
            total_incl_vat = v_subtotal + v_vat
        WHERE id = v_invoice_id;

        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql;
```

### 7.3 Early Termination Fee Calculation

```sql
CREATE OR REPLACE FUNCTION calculate_wc_etf(
    p_service_id UUID
) RETURNS JSONB AS $$
DECLARE
    v_service RECORD;
    v_months_remaining INTEGER;
    v_etf DECIMAL(10,2);
    v_rate DECIMAL(5,2);
BEGIN
    SELECT * INTO v_service FROM public.wc_service_instances
    WHERE id = p_service_id;

    -- Month-to-month: no ETF (BRD WC-CN-001)
    IF v_service.contract_type = 'month_to_month' THEN
        RETURN jsonb_build_object('etf', 0, 'reason', 'Month-to-month — no early termination fee');
    END IF;

    -- Calculate months remaining
    v_months_remaining := GREATEST(0,
        (EXTRACT(YEAR FROM v_service.contract_end_date) * 12 + EXTRACT(MONTH FROM v_service.contract_end_date))
        - (EXTRACT(YEAR FROM CURRENT_DATE) * 12 + EXTRACT(MONTH FROM CURRENT_DATE))
    );

    -- Final month: no ETF (BRD WC-CN-014)
    IF v_months_remaining <= 1 THEN
        RETURN jsonb_build_object('etf', 0, 'reason', 'Final month of contract — no early termination fee');
    END IF;

    -- Determine rate based on contract type and current month (BRD WC-CN-010 to WC-CN-013)
    IF v_service.contract_type = '12_month' THEN
        IF v_months_remaining > 6 THEN
            v_rate := 0.50;  -- Months 1–6: 50%
        ELSE
            v_rate := 0.25;  -- Months 7–11: 25%
        END IF;
    ELSIF v_service.contract_type = '24_month' THEN
        IF v_months_remaining > 12 THEN
            v_rate := 0.50;  -- Months 1–12: 50%
        ELSE
            v_rate := 0.25;  -- Months 13–23: 25%
        END IF;
    END IF;

    v_etf := ROUND(v_rate * v_service.retail_price * v_months_remaining, 2);

    RETURN jsonb_build_object(
        'etf', v_etf,
        'months_remaining', v_months_remaining,
        'rate_applied', v_rate,
        'contract_type', v_service.contract_type,
        'mrc', v_service.retail_price
    );
END;
$$ LANGUAGE plpgsql;
```

### 7.4 Payment Failure Escalation Logic

```
DAY 0:  Debit order returned unpaid
        → Set invoice status = 'overdue'
        → Retry debit order after 3 business days
        → Send SMS + email payment reminder (WC-BL-020)

DAY 3:  Retry debit order
        → IF succeeds: invoice status = 'paid'; END
        → IF fails: send formal arrears notice; 7-day grace period (WC-BL-021)

DAY 14: Payment still outstanding
        → Throttle service to 2 Mbps via RADIUS CoA (WC-BL-022)
        → Set service_status = 'throttled'
        → Notify: "Service throttled — settle R{amount} to restore"
        → Flag account for churn mitigation (WC-CN-030)

DAY 30: Payment still outstanding
        → Suspend service (no connectivity) (WC-BL-023)
        → Set service_status = 'suspended_billing'
        → Begin arrears interest accrual at 2% per month (WC-BL-025)
        → Notify: "Service suspended — settle R{amount} to restore"

DAY 60: Payment still outstanding
        → Terminate service (WC-BL-024)
        → Set service_status = 'terminated'
        → Initiate router recovery (WC-BL-026)
        → Deprovision all VAS (backup, email)
        → Hand account to collections agency
        → R1,500 router replacement fee if not returned within 30 days (WC-CN-022)
```

---

## 8. Margin & Cost Calculation Engine

### 8.1 Cost Components per Technology

**FWB (Tarana) Delivery:**

| Component | Starter (50/12.5) | Plus (100/25) | Pro (200/50) | Source |
|---|---|---|---|---|
| MTN Wholesale FWB | R499.00 | R599.00 | R699.00 | MTN FWB Commercial Schedule |
| Infrastructure (BNG, CGNAT, backhaul) | R33.50 | R38.50 | R55.00 | Echo SP agreement |
| BSS Platform (AgilityGIS) | R10.96 | R10.96 | R10.96 | AgilityGIS contract |
| Router amortisation (24 months) | R28.13 | R42.71 | R42.71 | Scoop Distribution pricing |
| Installation amortisation (24 months) | R37.50 | R37.50 | R0.00 | Internal calculation |
| Cloud Backup (25/50/100 GB) | R15.00 | R25.00 | R45.00 | Hosting cost |
| Support & Operations | R15.00 | R15.00 | R20.00 | Internal cost |
| Payment Processing (1%) | R7.99 | R10.99 | R14.99 | Payment gateway fee |
| **TOTAL COST** | **R647.08** | **R779.66** | **R887.66** | |
| **Retail Price** | **R799** | **R1,099** | **R1,499** | |
| **Margin %** | **19.0%** | **29.1%** | **40.8%** | |

**FTTH Delivery:**

| Component | Starter (50/50) | Plus (200/200)* | Pro (500/500)** | Source |
|---|---|---|---|---|
| MTN Wholesale FTTH | R542.00 | R737.00 | R837.00 | MTN FTTH Wholesale |
| Infrastructure (BNG, CGNAT, backhaul) | R38.50 | R55.00 | R75.00 | Echo SP agreement |
| BSS Platform | R10.96 | R10.96 | R10.96 | AgilityGIS contract |
| Router amortisation (24 months) | R28.13 | R42.71 | R42.71 | Scoop Distribution |
| ONT amortisation (24 months) | R25.00 | R25.00 | R25.00 | MTN FTTH |
| Installation amortisation (24 months) | R37.50 | R37.50 | R0.00 | Internal |
| Cloud Backup | R15.00 | R25.00 | R45.00 | Hosting |
| Support & Operations | R15.00 | R15.00 | R20.00 | Internal |
| Payment Processing (1%) | R7.99 | R10.99 | R14.99 | Payment gateway |
| **TOTAL COST** | **R720.08** | **R959.16** | **R1,070.66** | |
| **Retail Price** | **R799** | **R1,099** | **R1,499** | |
| **Margin %** | **9.9%** | **12.7%** | **28.6%** | |

### 8.2 Margin Calculation Function

```sql
CREATE OR REPLACE FUNCTION calculate_wc_service_margin(
    p_service_id UUID
) RETURNS JSONB AS $$
DECLARE
    v_service RECORD;
    v_cat RECORD;
    v_addon_revenue DECIMAL(10,2);
    v_addon_cost DECIMAL(10,2);
    v_base_cost DECIMAL(10,2);
    v_total_revenue DECIMAL(10,2);
    v_total_cost DECIMAL(10,2);
    v_margin DECIMAL(10,2);
    v_margin_pct DECIMAL(5,2);
BEGIN
    SELECT * INTO v_service FROM public.wc_service_instances WHERE id = p_service_id;
    SELECT * INTO v_cat FROM public.wc_product_catalogue WHERE product_code = v_service.product_code;

    -- Base cost depends on technology
    v_base_cost := CASE v_service.delivery_technology
        WHEN 'fwb_tarana' THEN v_cat.direct_cost_fwb
        WHEN 'ftth' THEN v_cat.direct_cost_ftth
        ELSE v_cat.direct_cost_fwb
    END;

    -- Add-on revenue and cost
    SELECT COALESCE(SUM(quantity * unit_price), 0),
           COALESCE(SUM(quantity * direct_cost), 0)
    INTO v_addon_revenue, v_addon_cost
    FROM public.wc_addon_subscriptions
    WHERE service_id = p_service_id AND status = 'active' AND recurring = true;

    v_total_revenue := v_service.retail_price + v_addon_revenue;
    v_total_cost := v_base_cost + v_addon_cost;
    v_margin := v_total_revenue - v_total_cost;
    v_margin_pct := ROUND((v_margin / v_total_revenue) * 100, 2);

    RETURN jsonb_build_object(
        'service_id', p_service_id,
        'product_code', v_service.product_code,
        'delivery_technology', v_service.delivery_technology,
        'base_revenue', v_service.retail_price,
        'addon_revenue', v_addon_revenue,
        'total_revenue', v_total_revenue,
        'base_cost', v_base_cost,
        'addon_cost', v_addon_cost,
        'total_cost', v_total_cost,
        'contribution_margin', v_margin,
        'margin_percent', v_margin_pct,
        'equipment_amort_remaining_months', v_service.router_amort_months_remaining
    );
END;
$$ LANGUAGE plpgsql;
```

### 8.3 Blended Margin Dashboard View

```sql
CREATE OR REPLACE VIEW wc_margin_dashboard AS
SELECT
    si.product_code,
    si.delivery_technology,
    COUNT(*) as active_services,
    ROUND(AVG(si.retail_price), 2) as avg_revenue,
    ROUND(AVG(CASE si.delivery_technology
        WHEN 'fwb_tarana' THEN pc.direct_cost_fwb
        WHEN 'ftth' THEN pc.direct_cost_ftth
        ELSE pc.direct_cost_fwb
    END), 2) as avg_cost,
    ROUND(AVG(si.retail_price - CASE si.delivery_technology
        WHEN 'fwb_tarana' THEN pc.direct_cost_fwb
        WHEN 'ftth' THEN pc.direct_cost_ftth
        ELSE pc.direct_cost_fwb
    END), 2) as avg_contribution,
    ROUND(AVG((si.retail_price - CASE si.delivery_technology
        WHEN 'fwb_tarana' THEN pc.direct_cost_fwb
        WHEN 'ftth' THEN pc.direct_cost_ftth
        ELSE pc.direct_cost_fwb
    END) / si.retail_price * 100), 2) as avg_margin_pct
FROM public.wc_service_instances si
JOIN public.wc_product_catalogue pc ON si.product_code = pc.product_code
WHERE si.service_status IN ('active', 'throttled')
GROUP BY si.product_code, si.delivery_technology
ORDER BY si.product_code, si.delivery_technology;
```

### 8.4 Pricing Floor Validation

```sql
-- Ensure no pricing below cost floor (BRD WC-PR-015)
CREATE OR REPLACE FUNCTION validate_wc_price_floor(
    p_product_code TEXT,
    p_discount_percent DECIMAL
) RETURNS JSONB AS $$
DECLARE
    v_cat RECORD;
    v_floor DECIMAL(10,2);
    v_discounted DECIMAL(10,2);
BEGIN
    SELECT * INTO v_cat FROM public.wc_product_catalogue WHERE product_code = p_product_code;

    -- Cost floors per BRD WC-PR-015
    v_floor := CASE p_product_code
        WHEN 'WC_STARTER_50' THEN 720.00
        WHEN 'WC_PLUS_100' THEN 990.00
        WHEN 'WC_PRO_200' THEN 1350.00
    END;

    v_discounted := v_cat.retail_price * (1 - p_discount_percent / 100);

    IF v_discounted < v_floor THEN
        RETURN jsonb_build_object('valid', false,
            'reason', format('Discounted price R%.2f is below cost floor R%.2f — CFO approval required',
                v_discounted, v_floor),
            'requires_authority', 'cfo');
    END IF;

    RETURN jsonb_build_object('valid', true, 'discounted_price', v_discounted);
END;
$$ LANGUAGE plpgsql;
```

---

## 9. Multi-Technology Provisioning Integration

### 9.1 Technology Selection Engine

```sql
CREATE OR REPLACE FUNCTION select_wc_technology(
    p_coverage_check_id UUID,
    p_product_code TEXT,
    p_upload_sensitive BOOLEAN DEFAULT false
) RETURNS JSONB AS $$
DECLARE
    v_check RECORD;
    v_selected TEXT;
    v_reason TEXT;
BEGIN
    SELECT * INTO v_check FROM public.wc_coverage_checks WHERE id = p_coverage_check_id;

    -- Priority 1: FTTH (BRD WC-TS-001) — ALWAYS prefer if available
    IF v_check.ftth_available = true THEN
        v_selected := 'ftth';
        v_reason := 'FTTH available — symmetrical speeds, lowest churn, best experience';
        RETURN jsonb_build_object('technology', v_selected, 'reason', v_reason,
            'speed_profile', 'symmetrical', 'upload_note', 'Equal upload and download speeds');
    END IF;

    -- Upload-sensitive override: if FTTH unavailable, warn (BRD WC-TS-010)
    IF p_upload_sensitive AND NOT v_check.ftth_available THEN
        -- Continue to FWB but flag disclosure requirement
    END IF;

    -- Priority 2: FWB Tarana (BRD WC-TS-002)
    IF v_check.fwb_available = true OR v_check.fwb_coverage_quality = 'confirmed' THEN
        v_selected := 'fwb_tarana';
        v_reason := 'FWB (Tarana) available — 4:1 asymmetric upload (MANDATORY DISCLOSURE)';
        RETURN jsonb_build_object('technology', v_selected, 'reason', v_reason,
            'speed_profile', 'asymmetric_4_1',
            'upload_note', 'Upload speed is 25% of download due to MTN network configuration',
            'upload_sensitive_warning', p_upload_sensitive,
            'site_survey_required', (v_check.fwb_coverage_quality = 'marginal'));
    END IF;

    -- Priority 3: 5G — only for Starter and Plus tiers (BRD WC-TS-003)
    IF v_check.five_g_available = true AND p_product_code != 'WC_PRO_200' THEN
        v_selected := '5g_fixed';
        v_reason := '5G available — variable best-effort upload (MANDATORY DISCLOSURE)';
        RETURN jsonb_build_object('technology', v_selected, 'reason', v_reason,
            'speed_profile', 'variable_best_effort',
            'upload_note', 'Upload speeds are variable and best-effort');
    END IF;

    -- Priority 4: LTE — Starter only (BRD WC-TS-004)
    IF v_check.lte_available = true AND p_product_code = 'WC_STARTER_50' THEN
        v_selected := 'lte_fixed';
        v_reason := 'LTE available — variable speeds, Starter tier only (MANDATORY DISCLAIMER)';
        RETURN jsonb_build_object('technology', v_selected, 'reason', v_reason,
            'speed_profile', 'variable_best_effort',
            'upload_note', 'Typical download 30-50 Mbps, upload variable');
    END IF;

    -- Plus on LTE: restricted with mandatory disclaimer (BRD WC-TS-014)
    IF v_check.lte_available = true AND p_product_code = 'WC_PLUS_100' THEN
        v_selected := 'lte_fixed';
        v_reason := 'LTE restricted — Plus tier requires mandatory speed disclaimer';
        RETURN jsonb_build_object('technology', v_selected, 'reason', v_reason,
            'speed_profile', 'variable_best_effort',
            'mandatory_disclaimer', 'Speeds may vary and are subject to network congestion; typical download 40-80 Mbps on LTE',
            'customer_acknowledgement_required', true);
    END IF;

    -- No coverage available
    RETURN jsonb_build_object('technology', 'none', 'reason', 'No technology available at address',
        'action', 'waitlist');
END;
$$ LANGUAGE plpgsql;
```

### 9.2 MTN Wholesale Order Payloads

**FWB (Tarana) Order:**
```json
{
    "order_type": "new_service",
    "partner_code": "CIRCLETEL",
    "service_type": "fwb_tarana_g1",
    "speed_profile": {
        "download_mbps": 100,
        "upload_mbps": 25,
        "ratio": "4:1"
    },
    "customer_address": {
        "street": "123 Main Road",
        "suburb": "Sandton",
        "city": "Johannesburg",
        "province": "Gauteng",
        "postal_code": "2196",
        "gps_lat": -26.1076,
        "gps_lng": 28.0567
    },
    "installation_contact": {
        "name": "John Smith",
        "phone": "+27821234567",
        "email": "john@example.co.za"
    },
    "preferred_installation_date": "2026-04-15",
    "preferred_slot": "morning",
    "circletel_order_ref": "ORD-WC-000123"
}
```

**FTTH Order:**
```json
{
    "order_type": "new_service",
    "partner_code": "CIRCLETEL",
    "service_type": "ftth_gpon",
    "speed_profile": {
        "download_mbps": 200,
        "upload_mbps": 200,
        "symmetrical": true
    },
    "ftth_site_code": "MTN-JHB-SANDTON-01",
    "ont_required": true,
    "customer_address": { /* ... */ },
    "circletel_order_ref": "ORD-WC-000124"
}
```

### 9.3 Post-Installation Provisioning Sequence

```
INSTALLATION COMPLETE → trigger activate_wc_service()

STEP 1: Create RADIUS subscriber (FWB/FTTH only)
  └─ Username: wc-{service_number}@circletel.co.za
  └─ Realm: circletel.co.za
  └─ Speed profile: per technology and tier
  └─ CGNAT pool assignment
  └─ Static IP assignment (if Pro tier or add-on)

STEP 2: Apply QoS template via Ruijie Cloud
  └─ VoIP traffic: PROTECTED — highest priority
  └─ Video conferencing: PROTECTED — high priority
  └─ VPN traffic: PROTECTED
  └─ RDP/Citrix: PROTECTED (Pro tier) / STANDARD (Starter/Plus)
  └─ P2P/torrent: MANAGED — shaped during peak (07:00–22:00)
  └─ Cloud backup: MANAGED — off-peak schedule (22:00–06:00)

STEP 3: Provision cloud backup account
  └─ Quota: 25 GB (Starter) / 50 GB (Plus) / 100 GB (Pro)
  └─ Default schedule: off-peak (22:00–06:00)
  └─ Encryption: AES-256 at rest

STEP 4: Provision email accounts
  └─ Domain: customer-specified or default @circletel-mail.co.za
  └─ Quota: 2 accounts (Starter) / 5 accounts (Plus) / 10 accounts (Pro)
  └─ Initial password: auto-generated, sent via welcome email

STEP 5: Register router in Ruijie Cloud
  └─ Device serial: from wc_cpe_devices table
  └─ Site tag: WorkConnect — {tier} — {service_number}
  └─ Monitoring: enabled (5-minute polling)

STEP 6: Start billing
  └─ Set billing_start_date = activation date
  └─ Calculate pro-rata for first month
  └─ Generate first invoice

STEP 7: Send welcome pack
  └─ Email: Connection details, support contacts, cloud backup setup guide
  └─ WhatsApp: Welcome message with quick reference
  └─ Set welcome_email_sent = true, welcome_whatsapp_sent = true

STEP 8: Start equipment amortisation clock
  └─ Router: 24-month amortisation from activation date
  └─ Installation fee: 24-month amortisation (if amortised)
```

---

## 10. Network Integration — BNG, RADIUS & ENNI

### 10.1 RADIUS Attribute Mapping

| RADIUS Attribute | Value | Purpose |
|---|---|---|
| `User-Name` | `wc-{service_number}@circletel.co.za` | PPPoE authentication |
| `Framed-IP-Address` | Dynamic (CGNAT pool) or Static | IP assignment |
| `Mikrotik-Rate-Limit` | `{dl}M/{ul}M` (e.g. `100M/25M`) | Speed profile |
| `CircleTel-Product-Code` | `WC_STARTER_50` / `WC_PLUS_100` / `WC_PRO_200` | Product identification |
| `CircleTel-Technology` | `FWB` / `FTTH` / `5G` / `LTE` | Delivery technology |
| `CircleTel-QoS-Profile` | `wc_standard` / `wc_pro` | QoS template reference |
| `Session-Timeout` | 86400 (24 hours) | Force re-authentication daily |
| `Acct-Interim-Interval` | 300 (5 minutes) | Accounting update frequency |

### 10.2 Speed Profile Configuration by Technology and Tier

| Service | Technology | DL Rate Limit | UL Rate Limit | CGNAT Pool | QoS |
|---|---|---|---|---|---|
| WC Starter | FWB | 50M | 12.5M | Pool-WC-FWB | wc_standard |
| WC Starter | FTTH | 50M | 50M | Pool-WC-FTTH | wc_standard |
| WC Plus | FWB | 100M | 25M | Pool-WC-FWB | wc_standard |
| WC Plus | FTTH | 200M | 200M | Pool-WC-FTTH | wc_standard |
| WC Pro | FWB | 200M | 50M | Pool-WC-FWB | wc_pro |
| WC Pro | FTTH | 500M | 500M | Pool-WC-FTTH | wc_pro |
| THROTTLED (any) | any | 2M | 0.5M | Unchanged | none |

### 10.3 Change-of-Authorisation (CoA) Use Cases

| Trigger | CoA Action | RADIUS Attributes Changed |
|---|---|---|
| Tier upgrade | Update speed limits | `Mikrotik-Rate-Limit`, `CircleTel-Product-Code` |
| Tier downgrade | Update speed limits | `Mikrotik-Rate-Limit`, `CircleTel-Product-Code` |
| Payment arrears (14 days) | Throttle to 2 Mbps | `Mikrotik-Rate-Limit` → `2M/0.5M` |
| Payment restored | Restore original speed | `Mikrotik-Rate-Limit` → original |
| AUP violation | Disconnect session | Disconnect-Request |
| Technology change (FWB → FTTH) | Update all attributes | Full attribute reset |

---

## 11. CPE Management Integration — Ruijie Cloud

### 11.1 QoS Template Definitions

**Template: `wc_standard` (Starter and Plus tiers)**

| Traffic Class | DSCP Marking | Priority | Bandwidth Guarantee | Action |
|---|---|---|---|---|
| VoIP (SIP/RTP) | EF (46) | Strict Priority | 2 Mbps reserved | Never throttled |
| Video Conference (Zoom, Teams, Meet) | AF41 (34) | High | 10 Mbps reserved | Never throttled |
| VPN (ESP, IKE, OpenVPN) | AF31 (26) | High | No guarantee | Never throttled |
| Email, Banking | AF21 (18) | Medium | No guarantee | Never throttled |
| Streaming (Netflix, YouTube) | CS0 (0) | Normal | No guarantee | Standard |
| P2P / Torrent | CS1 (8) | Low | No guarantee | Shaped during peak |
| Cloud Backup (included) | CS1 (8) | Low | No guarantee | Off-peak scheduling |

**Template: `wc_pro` (Pro tier — enhanced)**

All `wc_standard` rules plus:

| Traffic Class | DSCP Marking | Priority | Bandwidth Guarantee | Action |
|---|---|---|---|---|
| RDP / Citrix / TeamViewer | AF41 (34) | High | 5 Mbps reserved | Never throttled |
| Large file upload (> 100 MB) | AF21 (18) | Medium | No guarantee | Standard |

### 11.2 Router Provisioning API Calls

**Zero-Touch Provisioning (ZTP) flow:**

```
1. Supabase → Ruijie Cloud: POST /api/v1/devices/register
   Body: { serial_number, mac_address, site_name, config_template }

2. Router powers on → connects to Ruijie Cloud → pulls config
   Config includes: WiFi SSID/password, QoS template, VLAN, DNS

3. Ruijie Cloud → Supabase callback: device_online event
   Supabase updates: wc_cpe_devices.last_seen_online = NOW()
```

### 11.3 Router Monitoring Alerts

| Alert | Condition | Action |
|---|---|---|
| Device offline | No heartbeat for > 15 minutes | Create support ticket (priority: high) |
| High CPU | > 90% for > 5 minutes | Log warning; investigate if persistent |
| High memory | > 85% utilisation | Log warning; consider firmware update |
| WiFi client overload | > 30 connected devices (Starter) / > 50 (Plus/Pro) | Advisory notification to customer |
| Firmware update available | New version in Ruijie Cloud | Schedule auto-update during maintenance window |

---

## 12. CRM & Sales Pipeline Logic

### 12.1 Lead Qualification Pipeline

| Stage | Entry Criteria | Exit Criteria | Automation |
|---|---|---|---|
| NEW_LEAD | Lead received via website, call, referral, partner | Qualification questions answered (WC-CE-010–014) | Auto-assign to inside sales agent |
| QUALIFIED | SOHO profile confirmed; budget ≥ R799 | Coverage check completed | Trigger coverage check API |
| COVERAGE_CONFIRMED | At least 1 technology available | Technology recommended; quote generated | Auto-generate quote |
| PROPOSAL_SENT | Quote sent to prospect | Customer accepts or declines | Follow-up reminder at 48 hours |
| CONTRACT_SIGNED | Customer signs contract | Cooling-off period expires | Trigger provisioning workflow |
| WON | Service activated | — | Close deal; update revenue tracking |
| LOST | Customer declines or no coverage | — | Log reason; schedule 90-day win-back |
| REDIRECTED | Customer redirected to HomeFibre/SMB | — | Create lead in target product CRM |

### 12.2 Cross-Sell Detection Rules

```sql
-- Identify HomeFibreConnect customers eligible for WorkConnect upsell (BRD WC-XS-010)
CREATE OR REPLACE VIEW wc_upsell_candidates AS
SELECT
    c.id as customer_id,
    c.account_number,
    c.first_name || ' ' || c.last_name as customer_name,
    si.product_code as current_product,
    si.service_status,
    -- Trigger indicators
    CASE
        WHEN t.voip_ticket_count > 0 THEN 'Video call quality issues'
        WHEN t.vpn_ticket_count > 0 THEN 'VPN connectivity issues'
        ELSE 'General WFH suitability'
    END as upsell_trigger
FROM public.homefibre_customers c  -- HomeFibreConnect customer table
JOIN public.homefibre_service_instances si ON c.id = si.customer_id
LEFT JOIN (
    SELECT customer_id,
           COUNT(*) FILTER (WHERE category = 'qos_issue') as voip_ticket_count,
           COUNT(*) FILTER (WHERE description ILIKE '%vpn%') as vpn_ticket_count
    FROM public.homefibre_support_tickets
    WHERE opened_at > NOW() - INTERVAL '90 days'
    GROUP BY customer_id
) t ON c.id = t.customer_id
WHERE si.service_status = 'active';
```

---

## 13. Support & Fault Management Logic

### 13.1 Ticket Priority and SLA Calculation

```sql
CREATE OR REPLACE FUNCTION create_wc_support_ticket(
    p_customer_id UUID,
    p_service_id UUID,
    p_category TEXT,
    p_description TEXT,
    p_priority TEXT DEFAULT 'normal'
) RETURNS UUID AS $$
DECLARE
    v_service RECORD;
    v_response_hrs INTEGER;
    v_deadline TIMESTAMPTZ;
    v_ticket_id UUID;
BEGIN
    SELECT * INTO v_service FROM public.wc_service_instances WHERE id = p_service_id;

    -- Response time based on tier (BRD WC-SL-003)
    v_response_hrs := CASE v_service.product_code
        WHEN 'WC_STARTER_50' THEN 12
        WHEN 'WC_PLUS_100' THEN 8
        WHEN 'WC_PRO_200' THEN 4
    END;

    -- Calculate deadline (business hours only: Mon-Sat 07:00-19:00)
    v_deadline := calculate_business_hours_deadline(NOW(), v_response_hrs);

    INSERT INTO public.wc_support_tickets (
        ticket_number, customer_id, service_id,
        category, priority, tier_at_creation,
        response_deadline_hrs, sla_response_deadline,
        description, status
    ) VALUES (
        format('TKT-WC-%s', lpad(nextval('wc_ticket_seq')::text, 6, '0')),
        p_customer_id, p_service_id,
        p_category, p_priority, v_service.product_code,
        v_response_hrs, v_deadline,
        p_description, 'open'
    ) RETURNING id INTO v_ticket_id;

    -- Auto-assign based on category
    PERFORM auto_assign_wc_ticket(v_ticket_id);

    -- Notify customer of ticket creation
    PERFORM send_wc_notification(p_customer_id, 'ticket_created',
        jsonb_build_object('ticket_id', v_ticket_id, 'response_deadline', v_deadline));

    RETURN v_ticket_id;
END;
$$ LANGUAGE plpgsql;
```

### 13.2 Escalation Path Logic

| Escalation Level | Trigger | Auto-Escalation | Owner |
|---|---|---|---|
| Tier 1 | Ticket created | — | Support Agent (WhatsApp/Phone) |
| Tier 2 | Tier 1 cannot resolve within 4 hours OR requires router reconfiguration | Auto after 50% of response deadline | Technical Support |
| Tier 3 | Tier 2 cannot resolve OR requires MTN wholesale escalation | Auto after 100% of response deadline | Network Operations |
| Tier 4 | Tier 3 cannot resolve OR customer requests management intervention | Manual escalation (Pro tier only) | Account Manager / MD |

---

## 14. Uptime Monitoring & Service Credit Engine

### 14.1 Uptime Calculation

```sql
-- Pro tier only (BRD WC-SL-011, WC-SL-012)
CREATE OR REPLACE FUNCTION calculate_wc_service_credit(
    p_service_id UUID,
    p_month DATE
) RETURNS JSONB AS $$
DECLARE
    v_service RECORD;
    v_total_hours DECIMAL;
    v_downtime_hours DECIMAL;
    v_uptime_pct DECIMAL;
    v_target DECIMAL;
    v_credit DECIMAL(10,2);
BEGIN
    SELECT * INTO v_service FROM public.wc_service_instances WHERE id = p_service_id;

    -- Only Pro tier is eligible for service credits (BRD WC-SL-011)
    IF v_service.product_code != 'WC_PRO_200' THEN
        RETURN jsonb_build_object('eligible', false, 'reason', 'Service credits only available on Pro tier');
    END IF;

    v_total_hours := EXTRACT(DAY FROM (p_month + INTERVAL '1 month' - p_month)) * 24;
    v_target := 99.5;  -- Pro tier target (BRD WC-SL-011)

    -- Calculate downtime (excluding planned maintenance and force majeure)
    SELECT COALESCE(SUM(
        EXTRACT(EPOCH FROM (COALESCE(resolved_at, NOW()) - opened_at)) / 3600
    ), 0) INTO v_downtime_hours
    FROM public.wc_support_tickets
    WHERE service_id = p_service_id
      AND category = 'fault'
      AND opened_at >= p_month
      AND opened_at < (p_month + INTERVAL '1 month')
      AND NOT (description ILIKE '%planned maintenance%')
      AND NOT (description ILIKE '%load shedding%')
      AND NOT (description ILIKE '%force majeure%');

    v_uptime_pct := ROUND(((v_total_hours - v_downtime_hours) / v_total_hours) * 100, 4);

    IF v_uptime_pct >= v_target THEN
        RETURN jsonb_build_object('eligible', true, 'uptime_pct', v_uptime_pct,
            'credit', 0, 'reason', 'Uptime target met');
    END IF;

    -- Credit = (downtime beyond target / total hours) × MRC, capped at 50% (BRD WC-SL-012)
    v_credit := ROUND(
        LEAST(
            ((v_downtime_hours - (v_total_hours * (1 - v_target/100))) / v_total_hours) * v_service.retail_price,
            v_service.retail_price * 0.50
        ), 2);

    RETURN jsonb_build_object(
        'eligible', true,
        'uptime_pct', v_uptime_pct,
        'target_pct', v_target,
        'downtime_hours', v_downtime_hours,
        'credit', v_credit,
        'credit_capped_at', v_service.retail_price * 0.50,
        'claim_deadline', (p_month + INTERVAL '2 months')::date
    );
END;
$$ LANGUAGE plpgsql;
```

---

## 15. Notification & Event Engine

### 15.1 Event Catalogue

| Event Code | Trigger | Channels | Template |
|---|---|---|---|
| `WC_WELCOME` | Service activated | Email + WhatsApp | Welcome pack with connection details |
| `WC_INVOICE_GENERATED` | Monthly invoice generated | Email | Invoice PDF attachment |
| `WC_PAYMENT_REMINDER` | Payment due in 2 days | SMS | Payment reminder with amount |
| `WC_PAYMENT_FAILED` | Debit order returned | SMS + Email | Payment failure notice |
| `WC_THROTTLED` | Service throttled (14 days overdue) | SMS + Email | Throttle notification with payment link |
| `WC_SUSPENDED` | Service suspended (30 days overdue) | SMS + Email | Suspension notice |
| `WC_RESTORED` | Service restored after payment | SMS + Email | Restoration confirmation |
| `WC_TICKET_CREATED` | Support ticket opened | Email + WhatsApp | Ticket reference and ETA |
| `WC_TICKET_RESOLVED` | Support ticket resolved | Email + WhatsApp | Resolution summary |
| `WC_CONTRACT_EXPIRY` | 40 business days before contract expiry | Email | Auto-renewal notice (CPA) |
| `WC_PRICE_INCREASE` | 30 days before price increase | Email (formal letter) | Price increase notification |
| `WC_COVERAGE_AVAILABLE` | Technology becomes available at waitlisted address | Email + SMS | Coverage notification |
| `WC_BACKUP_QUOTA_80` | Cloud backup reaches 80% of quota | Email | Quota warning |
| `WC_BACKUP_QUOTA_95` | Cloud backup reaches 95% of quota | Email + SMS | Urgent quota warning |
| `WC_ROUTER_OFFLINE` | Router offline > 15 minutes | Internal alert | NOC notification |
| `WC_WINBACK` | 90 days after cancellation | Email | Win-back offer |

### 15.2 Auto-Renewal Notification Logic (CPA Compliance)

```
TRIGGER: Contract end_date minus 40 business days (BRD WC-RG-015)
ACTION:
  1. Generate auto-renewal notice email:
     - State current contract terms
     - State auto-conversion to month-to-month at standard rate
     - State customer's right to cancel before expiry
  2. Send via registered email address
  3. Log notification with timestamp in service_events
  4. IF customer does not respond by contract_end_date:
     → Auto-convert to month-to-month (WC-CT-004)
     → Update contract_type = 'month_to_month'
     → Set contract_end_date = NULL
```

---

## 16. Reporting & Analytics Data Logic

### 16.1 Operational KPI Views

```sql
-- Active subscriber summary
CREATE OR REPLACE VIEW wc_subscriber_dashboard AS
SELECT
    COUNT(*) as total_active,
    COUNT(*) FILTER (WHERE product_code = 'WC_STARTER_50') as starter_count,
    COUNT(*) FILTER (WHERE product_code = 'WC_PLUS_100') as plus_count,
    COUNT(*) FILTER (WHERE product_code = 'WC_PRO_200') as pro_count,
    COUNT(*) FILTER (WHERE delivery_technology = 'fwb_tarana') as fwb_count,
    COUNT(*) FILTER (WHERE delivery_technology = 'ftth') as ftth_count,
    COUNT(*) FILTER (WHERE delivery_technology = '5g_fixed') as five_g_count,
    COUNT(*) FILTER (WHERE delivery_technology = 'lte_fixed') as lte_count,
    ROUND(AVG(retail_price), 2) as arpu,
    SUM(retail_price) as total_mrr
FROM public.wc_service_instances
WHERE service_status IN ('active', 'throttled');

-- Monthly churn analysis (target < 5%)
CREATE OR REPLACE VIEW wc_monthly_churn AS
SELECT
    DATE_TRUNC('month', cancellation_date) as month,
    product_code,
    delivery_technology,
    cancellation_reason,
    COUNT(*) as churned_count,
    ROUND(COUNT(*)::decimal / NULLIF(
        (SELECT COUNT(*) FROM public.wc_service_instances
         WHERE service_status IN ('active', 'throttled')), 0) * 100, 2
    ) as churn_rate_pct
FROM public.wc_service_instances
WHERE service_status = 'cancelled'
GROUP BY DATE_TRUNC('month', cancellation_date), product_code, delivery_technology, cancellation_reason
ORDER BY month DESC;

-- Revenue projection vs target (R350k MRR Month 12)
CREATE OR REPLACE VIEW wc_revenue_vs_target AS
SELECT
    DATE_TRUNC('month', activated_at) as activation_month,
    COUNT(*) as new_activations,
    SUM(COUNT(*)) OVER (ORDER BY DATE_TRUNC('month', activated_at)) as cumulative_customers,
    SUM(SUM(retail_price)) OVER (ORDER BY DATE_TRUNC('month', activated_at)) as cumulative_mrr,
    350000 as month_12_mrr_target
FROM public.wc_service_instances
WHERE service_status IN ('active', 'throttled', 'cancelled')  -- Include cancelled for historical
GROUP BY DATE_TRUNC('month', activated_at)
ORDER BY activation_month;
```

---

## 17. API Contract Specifications

### 17.1 Coverage Check API

**Endpoint:** `POST /api/v1/workconnect/coverage-check`

**Request:**
```json
{
    "address": {
        "street": "123 Main Road",
        "suburb": "Sandton",
        "city": "Johannesburg",
        "province": "Gauteng",
        "postal_code": "2196",
        "gps_coordinates": { "lat": -26.1076, "lng": 28.0567 }
    },
    "upload_sensitive": false,
    "requested_tier": "WC_PLUS_100"
}
```

**Response:**
```json
{
    "coverage_check_id": "uuid",
    "address": { /* echo */ },
    "results": {
        "ftth": { "available": true, "provider": "mtn_ftth", "site_code": "MTN-JHB-SANDTON-01" },
        "fwb": { "available": true, "quality": "confirmed" },
        "five_g": { "available": true },
        "lte": { "available": true }
    },
    "recommended_technology": "ftth",
    "recommendation_reason": "FTTH available — symmetrical speeds, lowest churn",
    "speed_profile": {
        "download_mbps": 200,
        "upload_mbps": 200,
        "type": "symmetrical",
        "note": "FTTH Plus: over-provisioned to 200/200 Mbps"
    },
    "available_tiers": [
        { "code": "WC_STARTER_50", "price": 799, "speed": "50/50 Mbps" },
        { "code": "WC_PLUS_100", "price": 1099, "speed": "200/200 Mbps" },
        { "code": "WC_PRO_200", "price": 1499, "speed": "500/500 Mbps" }
    ]
}
```

### 17.2 Order Submission API

**Endpoint:** `POST /api/v1/workconnect/orders`

**Request:**
```json
{
    "customer_id": "uuid",
    "coverage_check_id": "uuid",
    "product_code": "WC_PLUS_100",
    "selected_technology": "ftth",
    "contract_type": "24_month",
    "payment_method": "debit_order",
    "debit_order_day": 1,
    "addons": [
        { "addon_code": "ADDON_M365_BASIC", "quantity": 2 }
    ],
    "qualification_answers": {
        "works_from_home": true,
        "employee_count": 2,
        "needs_formal_sla": false,
        "needs_symmetrical_upload": false,
        "budget_above_799": true
    }
}
```

### 17.3 Service Management API

**Endpoint:** `POST /api/v1/workconnect/services/{service_id}/upgrade`

```json
{
    "new_product_code": "WC_PRO_200",
    "effective_date": "next_billing_cycle",
    "router_swap_required": false,
    "acknowledged_feature_changes": true
}
```

**Endpoint:** `POST /api/v1/workconnect/services/{service_id}/cancel`

```json
{
    "cancellation_type": "voluntary",
    "reason": "Moving to a different area",
    "notice_period_start": "2026-05-01",
    "router_return_method": "collection"
}
```

---

## 18. Validation Rule Register

### 18.1 Order Validation Rules

| Rule ID | Validation | Logic | Error Message |
|---|---|---|---|
| VR-WC-001 | SOHO eligibility | `employee_count <= 5` | "Customers with more than 5 employees must use SkyFibre SMB" |
| VR-WC-002 | Minimum age | `customer_age >= 18` | "Applicant must be 18 years or older" |
| VR-WC-003 | Coverage confirmed | `coverage_check.recommended_technology != 'none'` | "No technology available at this address" |
| VR-WC-004 | Pro tier technology | `product_code != 'WC_PRO_200' OR technology NOT IN ('lte_fixed', '5g_fixed')` | "WorkConnect Pro is not available on LTE or 5G delivery" |
| VR-WC-005 | Credit status | `credit_status IN ('pass', 'waived') OR (credit_status = 'marginal' AND conditions_met)` | "Credit check conditions not met" |
| VR-WC-006 | Price floor | `discounted_price >= cost_floor` | "Price cannot be below cost floor — requires CFO approval" |
| VR-WC-007 | FICA compliance | `fica_verified = true` | "Customer identity must be verified before service activation" |
| VR-WC-008 | POPIA consent | `popia_consent = true` | "Customer must provide POPIA consent" |
| VR-WC-009 | Mandatory documentation | All WC-CE-020 to WC-CE-025 documents collected | "Required documentation incomplete" |
| VR-WC-010 | Contract technology disclosure | `contract.technology_disclosed = true` | "Contract must state delivery technology and speed profile" |

### 18.2 Add-On Validation Rules

| Rule ID | Validation | Logic | Error Message |
|---|---|---|---|
| VR-WC-020 | Active base required | `service.status = 'active'` | "Add-ons require an active WorkConnect base tier" |
| VR-WC-021 | Static IP on Pro redundant | `NOT (addon = 'STATIC_IP' AND tier = 'Pro')` | "Static IP already included on Pro tier" |
| VR-WC-022 | Backup Boost limit | `COUNT(active BACKUP_BOOST) < 1` | "Maximum one Cloud Backup Boost per service" |
| VR-WC-023 | LTE Failover technology check | `primary_technology NOT IN ('lte_fixed', '5g_fixed')` | "LTE Failover not available on LTE/5G primary delivery" |
| VR-WC-024 | Router Upgrade tier check | `tier != 'Starter'` | "Premium Router Upgrade not available on Starter tier" |
| VR-WC-025 | Additional IP dependency | `tier = 'Pro' OR active_static_ip_addon = true` | "Additional IPs require Static IP add-on or Pro tier" |
| VR-WC-026 | Additional IP max | `COUNT(active ADDITIONAL_IP) < 4` | "Maximum 4 additional static IPs per service" |
| VR-WC-027 | Additional email max | `total_extra_email_accounts <= 20` | "Maximum 20 additional email accounts per service" |

---

## 19. Error Handling & Recovery

### 19.1 Integration Error Handling

| Integration | Error Type | Recovery Action | Retry | Alert |
|---|---|---|---|---|
| MTN Wholesale API | Timeout | Queue for retry | 3 attempts, 15-min intervals | NOC alert after 3 failures |
| MTN Wholesale API | Rejection | Log error; manual review | No auto-retry | Sales alert |
| RADIUS / BNG | Session create failure | Retry with fresh credentials | 5 attempts, 30-sec intervals | NOC alert after 5 failures |
| RADIUS CoA | Throttle/restore failure | Retry | 3 attempts, 1-min intervals | NOC alert; manual RADIUS update |
| Ruijie Cloud | Device registration failure | Retry with verification | 3 attempts | Technical support alert |
| Cloud Backup | Provisioning failure | Retry | 3 attempts, 5-min intervals | VAS support alert |
| Email Hosting | Account creation failure | Retry | 3 attempts | VAS support alert |
| Credit Bureau | API timeout | Retry | 2 attempts | Allow manual credit assessment |
| Notification | Send failure | Queue for retry | 5 attempts, exponential backoff | Log warning; no customer impact |

### 19.2 Data Consistency Rules

| Scenario | Detection | Recovery |
|---|---|---|
| Service active but no RADIUS account | Nightly reconciliation job | Auto-create RADIUS account; alert NOC |
| RADIUS account exists but service cancelled | Nightly reconciliation | Auto-terminate RADIUS session; deprovision |
| Invoice generated but no payment method | Pre-generation validation | Block invoice; alert finance |
| Router marked 'installed' but service cancelled | Equipment reconciliation (weekly) | Initiate router recovery workflow |
| VAS provisioned but service not active | Nightly reconciliation | Suspend VAS account; alert operations |

---

## 20. Non-Functional Requirements

### 20.1 Performance

| Metric | Target |
|---|---|
| Coverage check response time | < 3 seconds |
| Order submission to confirmation | < 5 seconds |
| Monthly invoice generation batch | < 30 minutes for 500 customers |
| RADIUS authentication | < 100 ms |
| Ruijie Cloud QoS template deployment | < 30 seconds |
| API response time (95th percentile) | < 500 ms |

### 20.2 Availability

| System | Target Uptime |
|---|---|
| Supabase backend | 99.9% |
| AgilityGIS BSS | 99.5% |
| RADIUS / BNG | 99.99% |
| Ruijie Cloud | 99.5% (vendor SLA) |
| Notification service | 99.5% |

### 20.3 Scalability

| Metric | Year 1 Target | Year 2 Target |
|---|---|---|
| Active WorkConnect subscribers | 485 | 950 |
| Monthly invoice volume | 485 | 950 |
| Concurrent RADIUS sessions | 500 | 1,000 |
| Ruijie Cloud managed devices | 500 | 1,000 |
| Support tickets per month | ~150 | ~300 |

### 20.4 Security

| Requirement | Implementation |
|---|---|
| Customer data encryption at rest | AES-256 (Supabase encryption) |
| Cloud backup encryption | AES-256 at rest; TLS 1.3 in transit |
| API authentication | JWT tokens with 1-hour expiry |
| POPIA compliance | Explicit consent; 5-year retention; 72-hour breach notification |
| Credit bureau communication | TLS 1.3; client certificate authentication |
| RADIUS shared secret | Minimum 32-character random string |
| Password policy | Minimum 12 characters; hashed with bcrypt |

### 20.5 Audit & Compliance

| Requirement | Implementation |
|---|---|
| All state transitions logged | `wc_service_events` table with timestamp, actor, old/new state |
| All financial transactions logged | `wc_audit_log` table with full request/response payloads |
| FICA documentation stored | Encrypted document store with 5-year retention |
| Data access logged | Supabase RLS audit trail |
| Contract changes versioned | Contract version history maintained |

---

**END OF DOCUMENT**

*CircleTel SA (Pty) Ltd — A member of the New Generation Group*
*"Connecting Today, Creating Tomorrow"*
