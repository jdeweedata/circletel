# {{PRODUCT_NAME}} — Functional Specification Document (FSD)

## System Behaviour, Data Logic & Integration Rules

---

| Field | Value |
|-------|-------|
| **Document Reference** | CT-FSD-{{PRODUCT_CODE}}-{{YEAR}}-001 |
| **Version** | 1.0 |
| **Effective Date** | {{EFFECTIVE_DATE}} |
| **Classification** | Confidential — Internal & Development Use |
| **Locale** | en-ZA (South African English) |
| **Prepared By** | CircleTel Product & Technology |
| **Companion Documents** | CPS v1.0 (CT-CPS-{{PRODUCT_CODE}}-{{YEAR}}-001), BRD v1.0 (CT-BRD-{{PRODUCT_CODE}}-{{YEAR}}-001) |
| **Supersedes** | N/A — First issue |

---

## Version Control

| Version | Date | Author | Changes | Status |
|---------|------|--------|---------|--------|
| 1.0 | {{EFFECTIVE_DATE}} | CircleTel Product & Technology | Initial FSD aligned to CPS v1.0 and BRD v1.0 | **CURRENT** |

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
9. Provisioning Integration
10. Network Integration — BNG, RADIUS & ENNI
11. CPE Management Integration
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

This Functional Specification Document (FSD) defines the system behaviour, data models, calculation logic, integration contracts, and state machines required to operationalise the {{PRODUCT_NAME}} product within CircleTel's technology estate.

It translates the commercial rules in BRD v1.0 and the product parameters in CPS v1.0 into implementable system specifications for development, integration, and operations teams.

**In scope:** {{FSD_IN_SCOPE_SYSTEMS}}

**Out of scope:** {{FSD_OUT_OF_SCOPE}}

---

## 2. System Landscape & Integration Map

### 2.1 Systems of Record

| System | Role | Owner | Type |
|--------|------|-------|------|
| **AgilityGIS BSS** | Billing, invoicing, customer master, service catalogue | CircleTel | SoR — Customer & Billing |
| **Supabase (PostgreSQL)** | Backend database, API layer, product catalogue, commission tracking | CircleTel | SoR — Product & Analytics |
| **CRM (Supabase)** | Lead tracking, pipeline, customer interactions, churn flags | CircleTel | SoR — Sales |
| **Notification Service** | Email, SMS, WhatsApp via API gateway | CircleTel | Internal |
{{#ADDITIONAL_SYSTEMS}}
| **{{SYSTEM_NAME}}** | {{SYSTEM_ROLE}} | {{SYSTEM_OWNER}} | {{SYSTEM_TYPE}} |
{{/ADDITIONAL_SYSTEMS}}

<!-- Standard external systems to add based on product type:
CONNECTIVITY: MTN Wholesale Portal, Echo SP Managed BNG, Interstellio RADIUS, Ruijie Cloud CPE
MANAGED IT: Microsoft 365 tenant API, ticketing system, monitoring platform
CLOUD HOSTING: NameHero CloudShield API, DNS management, SSL automation -->

### 2.2 Integration Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                      CUSTOMER TOUCHPOINTS                          │
│  [ Sales Portal ]  [ Customer Portal ]  [ WhatsApp ]  [ Email ]   │
└──────────┬──────────────────┬─────────────────────┬───────────────┘
           │                  │                     │
           ▼                  ▼                     ▼
┌────────────────────────────────────────────────────────────────────┐
│                  CIRCLETEL APPLICATION LAYER                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │  AgilityGIS  │  │   Supabase   │  │  Notification│            │
│  │     BSS      │◄─┤   Backend    │──►│   Service    │            │
│  │  (Billing)   │  │  (API/DB)    │  │  (SMS/Email) │            │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┘            │
│         │                 │                                       │
└─────────┼─────────────────┼───────────────────────────────────────┘
          │                 │
          ▼                 ▼
┌────────────────────────────────────────────────────────────────────┐
│                    EXTERNAL INTEGRATIONS                           │
│  {{EXTERNAL_SYSTEMS_ASCII_REPRESENTATION}}                         │
└────────────────────────────────────────────────────────────────────┘
```

<!-- Replace {{EXTERNAL_SYSTEMS_ASCII_REPRESENTATION}} with the actual external systems.
     Example for connectivity:
     [ MTN Wholesale ]  [ Echo SP BNG ]  [ RADIUS/AAA ]  [ CPE Mgmt ] -->

### 2.3 Integration Protocols

| Integration | Protocol | Auth Method | Frequency |
|-------------|----------|------------|-----------|
{{#INTEGRATIONS}}
| {{INTEGRATION_NAME}} | {{PROTOCOL}} | {{AUTH_METHOD}} | {{FREQUENCY}} |
{{/INTEGRATIONS}}

---

## 3. Data Model

### 3.1 Entity Relationship Summary

```
{{ERD_ASCII_DIAGRAM}}
```

<!-- Key entities typically include:
     customers ── service_instances ── service_packages
     service_instances ── customer_invoices
     service_instances ── {{PRODUCT_SPECIFIC_ENTITIES}}
     
     Draw ASCII ERD showing primary entities and cardinality. -->

### 3.2 Core Entity Schemas

#### `{{PRODUCT_SERVICE_TABLE_NAME}}` — Service Instance Table

```sql
CREATE TABLE {{PRODUCT_SERVICE_TABLE_NAME}} (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id         UUID NOT NULL REFERENCES customers(id),
  package_id          UUID NOT NULL REFERENCES service_packages(id),
  status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','provisioning','active','suspended','cancelled')),
  tier                TEXT NOT NULL CHECK (tier IN ({{TIER_NAMES_SQL_LIST}})),
  mrc_excl_vat        NUMERIC(10,2) NOT NULL,
  contract_term       TEXT NOT NULL DEFAULT '24m' CHECK (contract_term IN ('mtm','12m','24m')),
  contract_start_date DATE,
  contract_end_date   DATE,
  activation_date     DATE,
  cancellation_date   DATE,
  install_address     JSONB,
  cpe_serial_number   TEXT,
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
```

#### `{{PRODUCT_ADDONS_TABLE_NAME}}` — Add-on Subscriptions

```sql
CREATE TABLE {{PRODUCT_ADDONS_TABLE_NAME}} (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_instance_id UUID NOT NULL REFERENCES {{PRODUCT_SERVICE_TABLE_NAME}}(id),
  addon_code          TEXT NOT NULL,
  addon_name          TEXT NOT NULL,
  mrc_excl_vat        NUMERIC(10,2) NOT NULL,
  status              TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','cancelled')),
  start_date          DATE NOT NULL,
  end_date            DATE,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);
```

<!-- Add additional product-specific tables as needed. Examples:
     - commission_records (for Arlan products)
     - site_survey_results (for connectivity products)
     - device_inventory (for managed IT)
     - hosting_instances (for cloud products) -->

---

## 4. Product Catalogue Data Logic

### 4.1 Package Definitions

The product catalogue is maintained in the `service_packages` table with the following records for {{PRODUCT_NAME}}:

```sql
-- {{PRODUCT_NAME}} base tiers
INSERT INTO service_packages (code, name, category, tier, mrc_excl_vat, wholesale_cost, description, is_active) VALUES
{{#TIERS}}
('{{TIER_CODE}}', '{{TIER_FULL_NAME}}', '{{CATEGORY}}', '{{TIER_LEVEL}}', {{TIER_RETAIL_PRICE}}, {{TIER_WHOLESALE_COST}}, '{{TIER_DESCRIPTION}}', true),
{{/TIERS}}
;
```

### 4.2 Add-on Module Catalogue

```sql
INSERT INTO product_addons (code, name, category, mrc_excl_vat, cost, description, is_active) VALUES
{{#ADDONS}}
('{{ADDON_CODE}}', '{{ADDON_NAME}}', '{{CATEGORY}}', {{ADDON_PRICE}}, {{ADDON_COST}}, '{{ADDON_DESCRIPTION}}', true),
{{/ADDONS}}
;
```

### 4.3 Pricing Rules

All pricing enforced at the database layer via constraints:
- `mrc_excl_vat` must be > 0
- VAT-inclusive display is computed: `mrc_excl_vat * 1.15`
- Discounted prices validated against minimum margin floor (25%)

---

## 5. Order Lifecycle State Machine

### 5.1 States

```
DRAFT ──► SUBMITTED ──► PENDING_CREDIT ──► CREDIT_APPROVED ──► SCHEDULED
                                │                                    │
                         CREDIT_DECLINED                         INSTALLING
                                                                     │
                                                                  ACTIVE ──► SUSPENDED ──► CANCELLED
                                                                     │
                                                               UPGRADE_PENDING
                                                               DOWNGRADE_PENDING
```

### 5.2 State Transition Rules

| From State | Event | To State | System Action |
|-----------|-------|----------|---------------|
| DRAFT | Customer submits order | SUBMITTED | Create order record, notify operations |
| SUBMITTED | Credit check passed | CREDIT_APPROVED | Trigger provisioning workflow |
| SUBMITTED | Credit check failed | CREDIT_DECLINED | Notify customer, offer deposit option |
| CREDIT_APPROVED | Installation date set | SCHEDULED | Send confirmation to customer |
| SCHEDULED | Installation complete | INSTALLING | Create service instance record |
| INSTALLING | Activation confirmed | ACTIVE | Send welcome email, trigger first invoice |
| ACTIVE | Non-payment 21 days | SUSPENDED | Disable service, send suspension notice |
| SUSPENDED | Payment received | ACTIVE | Re-enable service, charge reactivation fee |
| ACTIVE | Cancellation notice | CANCELLED (end of notice period) | Send cancellation confirmation, schedule CPE return |
{{#ADDITIONAL_STATE_TRANSITIONS}}
| {{FROM_STATE}} | {{EVENT}} | {{TO_STATE}} | {{SYSTEM_ACTION}} |
{{/ADDITIONAL_STATE_TRANSITIONS}}

---

## 6. Service Instance Lifecycle

### 6.1 Activation Logic

```
1. Installation completed → field tech marks complete in mobile app
2. System creates service_instance record with status = 'active'
3. BSS (AgilityGIS) creates customer account and service record
4. First invoice generated (pro-rata current month + full next month)
5. Welcome email + provisioning details sent to customer
6. Service monitoring started
```

### 6.2 Suspension Logic

```
Day 7  (payment due): Payment due notification
Day 14 (7 days late): First reminder — 7-day notice of suspension
Day 21 (14 days late): Service suspended in BSS + network layer
Day 30 (23 days late): Final notice — 7 days to pay or cancel
Day 37 (30 days late): Contract terminated — ETF invoice issued
```

---

## 7. Billing Engine Logic

### 7.1 Monthly Invoice Calculation

```
Invoice = Σ(active_service_mrcs) + Σ(active_addon_mrcs) + adjustments
VAT     = Invoice × 0.15
Total   = Invoice + VAT
```

### 7.2 Pro-Rata Calculation

```
Daily rate = MRC / days_in_month
Pro-rata   = Daily rate × remaining_days_in_month
```

### 7.3 Early Termination Fee

```
ETF = remaining_months × MRC_excl_vat
    where remaining_months = MAX(0, contract_end_date - cancellation_date) in calendar months
```

### 7.4 Billing System Integration (AgilityGIS BSS)

| Event | AgilityGIS Action | Timing |
|-------|------------------|--------|
| Service activation | Create account + service record | On activation |
| Monthly cycle | Generate and email invoice | 3rd business day of month |
| Payment received | Mark invoice paid, send receipt | On payment confirmation |
| Payment failed | Flag account, trigger retry | On payment failure |
| Cancellation | Close service, issue final invoice | On cancellation date |

---

## 8. Margin & MSC Calculation Engine

### 8.1 Per-Subscriber Margin Calculation

```sql
-- Margin calculation for {{PRODUCT_NAME}}
SELECT
  si.tier,
  si.mrc_excl_vat AS retail_price,
  pw.wholesale_cost,
  (si.mrc_excl_vat - pw.wholesale_cost - pw.infrastructure_cost) AS gross_margin_r,
  ROUND(
    ((si.mrc_excl_vat - pw.wholesale_cost - pw.infrastructure_cost) / si.mrc_excl_vat) * 100,
    1
  ) AS gross_margin_pct
FROM {{PRODUCT_SERVICE_TABLE_NAME}} si
JOIN product_wholesale_costs pw ON pw.package_code = si.tier
WHERE si.status = 'active';
```

### 8.2 MSC Coverage Monitoring

<!-- Include only if product uses MTN wholesale (Tarana/FWB) which counts toward MSC.
     Remove this section for DFA, Managed IT, Cloud Hosting, and Arlan products. -->

```sql
-- MSC coverage ratio for current month
SELECT
  COUNT(*) AS active_tarana_customers,
  COUNT(*) * {{WHOLESALE_COST_PER_UNIT}} AS monthly_tarana_spend,
  {{CURRENT_MSC}} AS msc_commitment,
  ROUND((COUNT(*) * {{WHOLESALE_COST_PER_UNIT}}) / {{CURRENT_MSC}}, 2) AS coverage_ratio
FROM {{PRODUCT_SERVICE_TABLE_NAME}}
WHERE status = 'active'
  AND tier IN ({{MTN_TIER_NAMES_SQL_LIST}});
```

### 8.3 Margin Floor Validation

```sql
-- Alert on any subscription below 25% margin
CREATE OR REPLACE FUNCTION check_margin_floor()
RETURNS TRIGGER AS $$
BEGIN
  IF ((NEW.mrc_excl_vat - (
        SELECT total_cost FROM product_wholesale_costs WHERE package_code = NEW.tier
      )) / NEW.mrc_excl_vat) < 0.25 THEN
    RAISE WARNING 'Margin below 25%% floor for tier %', NEW.tier;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 9. Provisioning Integration

### 9.1 {{PROVISIONING_SYSTEM_NAME}} Integration

**Trigger**: Service instance transitions to CREDIT_APPROVED state

**Endpoint**: `{{PROVISIONING_API_ENDPOINT}}`

**Request payload**:

```json
{
  "{{PROVISIONING_PAYLOAD_STRUCTURE}}"
}
```

<!-- Example for MTN Wholesale FWB:
{
  "customerRef": "{{customer_id}}",
  "serviceType": "FWB",
  "tier": "{{tier}}",
  "installAddress": {
    "streetAddress": "{{install_address.street}}",
    "suburb": "{{install_address.suburb}}",
    "city": "{{install_address.city}}",
    "postalCode": "{{install_address.postal_code}}",
    "latitude": {{install_address.lat}},
    "longitude": {{install_address.lng}}
  },
  "cpeModel": "{{cpe_model}}",
  "contractTerm": "{{contract_term}}"
}
-->

**Response handling**:

| Response Code | Meaning | System Action |
|--------------|---------|---------------|
| 200 / 201 | Order accepted | Update service_instance with provisioning reference |
| 400 | Invalid request | Log error, alert operations, halt workflow |
| 409 | Duplicate order | Check for existing provisioning reference |
| 503 | Service unavailable | Retry with exponential backoff (3 attempts, 5/15/30 min) |

---

## 10. Network Integration — BNG, RADIUS & ENNI

<!-- Include for connectivity products. Remove or adapt for non-connectivity products. -->

### 10.1 Echo SP BNG Session Management

| Operation | Endpoint | Trigger |
|-----------|----------|---------|
| Activate subscriber | POST `/subscribers` | Service activation |
| Suspend subscriber | PATCH `/subscribers/{id}/suspend` | Non-payment suspension |
| Reactivate subscriber | PATCH `/subscribers/{id}/activate` | Payment received |
| Deactivate subscriber | DELETE `/subscribers/{id}` | Cancellation |

### 10.2 RADIUS/AAA (Interstellio)

| Attribute | Value | Notes |
|-----------|-------|-------|
| NAS-Identifier | `circletel-bng-01` | Fixed |
| Framed-IP-Address | Dynamic or static pool | Static IP subscribers get reserved IP |
| Session-Timeout | 86400 seconds | Renew daily |
| WISPr-Bandwidth-Max-Down | `{{TIER_DOWNLOAD_KBPS}}` | Per tier |
| WISPr-Bandwidth-Max-Up | `{{TIER_UPLOAD_KBPS}}` | Per tier |

---

## 11. CPE Management Integration

### 11.1 {{CPE_MANAGEMENT_SYSTEM}} Integration

<!-- Replace with actual CPE management system (e.g. Ruijie Cloud, TR-069, MTN Portal). -->

| Feature | Implementation |
|---------|---------------|
| Zero-touch provisioning | {{ZTP_METHOD}} |
| Remote reboot | {{REMOTE_REBOOT_METHOD}} |
| Firmware update | {{FIRMWARE_UPDATE_METHOD}} |
| Performance monitoring | {{MONITORING_METHOD}} |

### 11.2 CPE Inventory Tracking

```sql
CREATE TABLE cpe_inventory (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  serial_number   TEXT UNIQUE NOT NULL,
  model           TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'in_stock'
                    CHECK (status IN ('in_stock','assigned','installed','faulty','returned')),
  assigned_to     UUID REFERENCES {{PRODUCT_SERVICE_TABLE_NAME}}(id),
  install_date    DATE,
  warranty_expiry DATE,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 12. CRM & Sales Pipeline Logic

### 12.1 Lead Stages

```
NEW_LEAD → QUALIFIED → COVERAGE_CHECKED → PROPOSAL_SENT → CONTRACT_SENT → CLOSED_WON
                                                                        → CLOSED_LOST
```

### 12.2 Automatic CRM Actions

| Trigger | CRM Action |
|---------|-----------|
| Coverage check passed | Move lead to COVERAGE_CHECKED, log result |
| Quote generated | Move to PROPOSAL_SENT, attach quote PDF |
| Contract signed | Move to CLOSED_WON, create service instance |
| Credit declined | Move to CLOSED_LOST (credit), log reason |
| Cancellation | Create churn record, flag for retention |
| Service active for 30 days | Trigger NPS survey request |

### 12.3 Pipeline Reporting

```sql
-- Active pipeline value
SELECT
  stage,
  COUNT(*) AS lead_count,
  SUM(estimated_mrr) AS pipeline_mrr
FROM crm_leads
WHERE product_category = '{{CATEGORY}}'
  AND created_at >= NOW() - INTERVAL '90 days'
GROUP BY stage
ORDER BY ARRAY_POSITION(ARRAY['NEW_LEAD','QUALIFIED','COVERAGE_CHECKED',
  'PROPOSAL_SENT','CONTRACT_SENT'], stage);
```

---

## 13. Support & Fault Management Logic

### 13.1 Ticket Routing Rules

| Fault Type | Priority | Initial Handler | Escalation (SLA breach) |
|-----------|---------|----------------|------------------------|
| Total service outage | P1 — Critical | NOC immediate | Technical Director (30 min) |
| Degraded performance | P2 — High | NOC (2 hours) | Senior Tech (4 hours) |
| Single feature fault | P3 — Medium | Support team (8 hours) | NOC (24 hours) |
| Billing query | P4 — Low | Billing team (24 hours) | Finance Manager (48 hours) |

### 13.2 Fault Classification

| Fault Code | Description | Typical Resolution |
|-----------|-------------|-------------------|
| {{#FAULT_CODES}}
| {{FAULT_CODE}} | {{FAULT_DESCRIPTION}} | {{FAULT_RESOLUTION}} |
{{/FAULT_CODES}}

---

## 14. SLA Monitoring & Service Credit Engine

### 14.1 Uptime Measurement

```sql
-- Monthly uptime calculation
SELECT
  si.id,
  si.tier,
  COUNT(*) FILTER (WHERE sm.status = 'up') AS minutes_up,
  COUNT(*) AS total_minutes_checked,
  ROUND(
    (COUNT(*) FILTER (WHERE sm.status = 'up')::NUMERIC / COUNT(*)) * 100,
    3
  ) AS uptime_pct
FROM {{PRODUCT_SERVICE_TABLE_NAME}} si
JOIN service_monitoring sm ON sm.service_instance_id = si.id
WHERE sm.checked_at >= date_trunc('month', NOW())
GROUP BY si.id, si.tier;
```

### 14.2 Service Credit Calculation

```sql
-- Auto-credit calculation for SLA breach
INSERT INTO service_credits (service_instance_id, month, hours_below_sla, credit_amount, reason)
SELECT
  si.id,
  date_trunc('month', NOW()),
  GREATEST(0, {{SLA_THRESHOLD_HOURS}} - SUM(CASE WHEN sm.status = 'down' THEN 1 ELSE 0 END) / 60.0),
  si.mrc_excl_vat * {{CREDIT_PCT_PER_HOUR}} * GREATEST(0, hours_below_sla),
  'Automatic SLA credit'
FROM {{PRODUCT_SERVICE_TABLE_NAME}} si
JOIN service_monitoring sm ON sm.service_instance_id = si.id
WHERE si.tier IN ({{SLA_ELIGIBLE_TIERS}})
  AND sm.checked_at >= date_trunc('month', NOW())
GROUP BY si.id, si.mrc_excl_vat;
```

---

## 15. Notification & Event Engine

### 15.1 Notification Templates

| Event | Channel | Template | Timing |
|-------|---------|---------|--------|
| Order confirmed | Email | `order_confirmed_{{PRODUCT_CODE}}` | Immediate |
| Installation scheduled | Email + WhatsApp | `install_scheduled_{{PRODUCT_CODE}}` | On scheduling |
| Service activated | Email | `welcome_{{PRODUCT_CODE}}` | On activation |
| Invoice generated | Email | `invoice_monthly` | 3rd business day |
| Payment failed | Email + SMS | `payment_failed` | On failure |
| Service suspended | Email + SMS | `service_suspended` | On suspension |
| Cancellation confirmed | Email | `cancellation_confirmed_{{PRODUCT_CODE}}` | On cancellation |

### 15.2 WhatsApp Integration

All WhatsApp messages use the `CONTACT.WHATSAPP_LINK` constant from `lib/constants/contact.ts`.
Inbound messages routed via webhook to support ticket system.

---

## 16. Reporting & Analytics Data Logic

### 16.1 Key Metrics

| Metric | Calculation | Frequency |
|--------|-------------|-----------|
| MRR | SUM(mrc_excl_vat) WHERE status = 'active' | Daily |
| Churn Rate | cancelled_this_month / active_start_of_month | Monthly |
| ARPU | MRR / active_customers | Monthly |
| Gross Margin | (MRR - total_wholesale_costs) / MRR | Monthly |
| LTV | avg_tenure_months × avg_monthly_margin | Quarterly |

### 16.2 Dashboard Queries

```sql
-- {{PRODUCT_NAME}} performance summary
SELECT
  COUNT(*) FILTER (WHERE status = 'active') AS active_subscribers,
  SUM(mrc_excl_vat) FILTER (WHERE status = 'active') AS mrr_excl_vat,
  COUNT(*) FILTER (WHERE status = 'active' AND activation_date >= date_trunc('month', NOW())) AS new_this_month,
  COUNT(*) FILTER (WHERE status = 'cancelled' AND cancellation_date >= date_trunc('month', NOW())) AS churned_this_month
FROM {{PRODUCT_SERVICE_TABLE_NAME}};
```

---

## 17. API Contract Specifications

### 17.1 Internal API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/{{PRODUCT_API_PREFIX}}/packages` | GET | Anon | List available packages and pricing |
| `/api/{{PRODUCT_API_PREFIX}}/coverage` | POST | Anon | Check service availability at address |
| `/api/{{PRODUCT_API_PREFIX}}/orders` | POST | Auth | Submit new order |
| `/api/{{PRODUCT_API_PREFIX}}/orders/[id]` | GET | Auth | Get order status |
| `/api/admin/{{PRODUCT_API_PREFIX}}/instances` | GET | Admin | List all service instances |
| `/api/admin/{{PRODUCT_API_PREFIX}}/instances/[id]` | PATCH | Admin | Update service instance |

### 17.2 Coverage Check Payload

```typescript
// POST /api/{{PRODUCT_API_PREFIX}}/coverage
interface CoverageCheckRequest {
  address: {
    street: string
    suburb: string
    city: string
    postalCode: string
    latitude?: number
    longitude?: number
  }
}

interface CoverageCheckResponse {
  available: boolean
  technology: string
  availableTiers: Array<{
    code: string
    name: string
    downloadMbps: number
    uploadMbps: number
    mrcExclVat: number
    mrcInclVat: number
  }>
  alternativeOptions?: Array<{
    product: string
    available: boolean
  }>
}
```

### 17.3 Order Submission Payload

```typescript
// POST /api/{{PRODUCT_API_PREFIX}}/orders
interface OrderRequest {
  packageCode: string
  addons?: string[]
  contractTerm: 'mtm' | '12m' | '24m'
  customer: {
    companyName: string
    contactName: string
    contactEmail: string
    contactPhone: string
    vatNumber?: string
  }
  installAddress: {
    street: string
    suburb: string
    city: string
    postalCode: string
    latitude: number
    longitude: number
  }
  billingAddress?: {
    street: string
    suburb: string
    city: string
    postalCode: string
  }
}
```

---

## 18. Validation Rule Register

| Rule ID | Field | Validation | Error Message |
|---------|-------|-----------|---------------|
| VR-001 | Package code | Must exist in service_packages | "Invalid package code" |
| VR-002 | Contract term | Must be 'mtm', '12m', or '24m' | "Invalid contract term" |
| VR-003 | Install address | Latitude/longitude required | "Address coordinates required for coverage check" |
| VR-004 | Customer email | Valid email format | "Invalid email address" |
| VR-005 | Contact phone | SA phone format (+27 or 0xx) | "Invalid phone number" |
| VR-006 | MRC | > 0 | "Price must be positive" |
| VR-007 | Margin | ≥ 25% | "Margin below minimum floor" |
| VR-008 | Addon combination | No conflicting addons | "Cannot combine [addon A] with [addon B]" |
{{#ADDITIONAL_VALIDATION_RULES}}
| {{RULE_ID}} | {{FIELD}} | {{VALIDATION}} | {{ERROR_MESSAGE}} |
{{/ADDITIONAL_VALIDATION_RULES}}

---

## 19. Error Handling & Recovery

### 19.1 External API Failures

| System | Failure Mode | Fallback | Alert |
|--------|-------------|---------|-------|
| {{PROVISIONING_SYSTEM}} | Timeout | Queue for retry (3× with backoff) | Ops team Slack |
| AgilityGIS BSS | 5xx | Queue billing action, retry next cycle | Finance team email |
| Echo SP BNG | Unavailable | Service remains provisioned; log for manual review | NOC team |
| Notification Service | Failure | Log to DB; retry after 15 min | Silent (customer not alerted) |

### 19.2 Data Consistency Guards

```sql
-- Ensure no active service without a customer
ALTER TABLE {{PRODUCT_SERVICE_TABLE_NAME}} 
  ADD CONSTRAINT fk_customer FOREIGN KEY (customer_id) REFERENCES customers(id);

-- Ensure MRC cannot be negative
ALTER TABLE {{PRODUCT_SERVICE_TABLE_NAME}}
  ADD CONSTRAINT chk_mrc_positive CHECK (mrc_excl_vat > 0);
```

---

## 20. Non-Functional Requirements

### 20.1 Performance

| Metric | Target |
|--------|--------|
| Coverage check API response | < 500ms (p95) |
| Order submission response | < 2s (p95) |
| Invoice generation | < 30s for full batch |
| Dashboard load time | < 3s |

### 20.2 Availability

| System | Target Uptime | Maintenance Window |
|--------|-------------|-------------------|
| Customer-facing API | 99.9% | Sundays 02:00-04:00 SAST |
| Admin portal | 99.5% | Sundays 02:00-06:00 SAST |
| Billing engine | 99.9% | Sundays 02:00-04:00 SAST |

### 20.3 Security

| Requirement | Implementation |
|------------|---------------|
| Data encryption at rest | Supabase AES-256 (Johannesburg region) |
| Data encryption in transit | TLS 1.3 minimum |
| Authentication | Supabase Auth (JWT) — httpOnly cookies |
| Admin access | RBAC — 17 predefined roles, 100+ permissions |
| PII handling | POPIA compliant — SA-hosted, DPA in place |
| Audit logging | All admin actions logged with user ID and timestamp |

### 20.4 Scalability

| Component | Current Capacity | Scale Trigger |
|-----------|-----------------|---------------|
| Supabase DB | 500 concurrent connections | >400 connections sustained |
| API layer | 1,000 req/sec | >800 req/sec sustained |
| Billing engine | 10,000 invoices/hour | >8,000 invoices/hour |
| Notification service | 50,000 messages/day | >40,000 messages/day |

---

**END OF DOCUMENT**

*CircleTel (Pty) Ltd — A member of the New Generation Group*
*"Connecting Today, Creating Tomorrow" | www.circletel.co.za*
*Confidential — Internal & Development Use Only*
