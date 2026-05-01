# [Product Name] — Functional Specification Document (FSD)

## System Behaviour, Data Logic & Integration Rules

---

| Field | Value |
|-------|-------|
| **Document Reference** | CT-FSD-[PRODUCT-CODE]-[YEAR]-[SEQ] |
| **Version** | 1.0 |
| **Effective Date** | [DD Month YYYY] |
| **Classification** | Confidential — Internal & Development Use |
| **Locale** | en-ZA (South African English) |
| **Prepared By** | [Team] |
| **Companion Documents** | CPS v[X.Y] ([ref]), BRD v[X.Y] ([ref]) |
| **Supersedes** | [N/A or Previous ref] |

---

## Version Control

| Version | Date | Author | Changes | Status |
|---------|------|--------|---------|--------|
| 1.0 | [Date] | [Author] | Initial release | **CURRENT** |

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
9. Provisioning Integration
10. Network Integration
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

This Functional Specification Document (FSD) defines the system behaviour, data logic, state machines, integration rules, and API contracts required to implement [Product Name] across CircleTel's technology stack.

**Scope:** All technical implementation details for [list tiers/modules covered].

**Out of scope:** [List what is NOT covered]

**Audience:** Development team, QA, DevOps, technical architects.

---

## 2. System Landscape & Integration Map

```
┌─────────────────────────────────────────────────────────────────┐
│                     CircleTel System Landscape                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Frontend]           [Backend]            [External]            │
│  ┌──────────┐        ┌──────────┐         ┌──────────┐          │
│  │ Customer │        │ Next.js  │         │ Provider │          │
│  │ Portal   │ ─────▶ │ API      │ ─────▶  │ API      │          │
│  └──────────┘        └──────────┘         └──────────┘          │
│       │                   │                    │                 │
│       │              ┌────┴────┐               │                 │
│       │              │         │               │                 │
│       ▼              ▼         ▼               ▼                 │
│  ┌──────────┐   ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ Admin    │   │ Supabase │ │ Inngest  │ │ [Ext Svc]│          │
│  │ Portal   │   │ Database │ │ Events   │ │          │          │
│  └──────────┘   └──────────┘ └──────────┘ └──────────┘          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.1 Systems Involved

| System | Role | Integration Method |
|--------|------|-------------------|
| [System 1] | [Role] | [REST API / Webhook / etc.] |
| [System 2] | [Role] | [Method] |
| [System 3] | [Role] | [Method] |

---

## 3. Data Model

### 3.1 Core Entities

```
┌─────────────────┐       ┌─────────────────┐
│    customers    │       │    products     │
├─────────────────┤       ├─────────────────┤
│ id              │       │ id              │
│ name            │       │ name            │
│ email           │       │ sku             │
│ ...             │       │ category        │
└────────┬────────┘       │ base_price_zar  │
         │                │ cost_price_zar  │
         │                │ status          │
         │                └────────┬────────┘
         │                         │
         ▼                         ▼
┌─────────────────┐       ┌─────────────────┐
│   subscriptions │◀──────│ service_instances│
├─────────────────┤       ├─────────────────┤
│ id              │       │ id              │
│ customer_id     │       │ subscription_id │
│ product_id      │       │ status          │
│ status          │       │ provisioned_at  │
│ start_date      │       │ ...             │
│ ...             │       └─────────────────┘
└─────────────────┘
```

### 3.2 Table Definitions

**[table_name]**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Primary key |
| [column] | [type] | [Yes/No] | [default] | [description] |
| created_at | TIMESTAMPTZ | No | now() | Creation timestamp |
| updated_at | TIMESTAMPTZ | No | now() | Last update timestamp |

---

## 4. Product Catalogue Data Logic

### 4.1 Product Status Enumeration

```sql
CREATE TYPE product_status AS ENUM (
  'draft',      -- Not visible to customers
  'active',     -- Live in catalogue
  'inactive',   -- Temporarily hidden
  'archived'    -- End of life
);
```

### 4.2 Product Visibility Rules

| Status | Customer Visible | Orderable | Admin Visible |
|--------|------------------|-----------|---------------|
| draft | No | No | Yes |
| active | Yes | Yes | Yes |
| inactive | No | No | Yes |
| archived | No | No | Yes |

---

## 5. Order Lifecycle State Machine

```
DRAFT → SUBMITTED → PAYMENT_PENDING → APPROVED → PROVISIONING → ACTIVE
  │         │              │             │            │           │
  ▼         ▼              ▼             ▼            ▼           ▼
[user    [auto or      [payment     [credit/    [provider   [service
 edit]    manual]      gateway]     manual]      API]       live]
                           │
                           ▼
                       PAYMENT_FAILED
                           │
                           ▼
                       CANCELLED
```

### 5.1 State Definitions

| State | Description | Allowed Transitions |
|-------|-------------|---------------------|
| DRAFT | Order started, not submitted | SUBMITTED, CANCELLED |
| SUBMITTED | Order submitted for processing | PAYMENT_PENDING, APPROVED, CANCELLED |
| PAYMENT_PENDING | Awaiting payment confirmation | APPROVED, PAYMENT_FAILED |
| PAYMENT_FAILED | Payment unsuccessful | PAYMENT_PENDING, CANCELLED |
| APPROVED | Passed all checks | PROVISIONING, CANCELLED |
| PROVISIONING | Service being provisioned | ACTIVE, PROVISIONING_FAILED |
| ACTIVE | Service operational | SUSPENDED, TERMINATED |

---

## 6. Service Instance Lifecycle

```
PENDING → PROVISIONING → ACTIVE → SUSPENDED → TERMINATED
                           ↑          │
                           └──────────┘
                           (reactivate)
```

### 6.1 Service Status Rules

| Status | Billing | Connectivity | Customer Action |
|--------|---------|--------------|-----------------|
| PENDING | Not billed | None | Wait |
| PROVISIONING | Not billed | None | Wait |
| ACTIVE | Billed | Full | Use service |
| SUSPENDED | Billed | Limited/None | Pay arrears |
| TERMINATED | Final invoice | None | None |

---

## 7. Billing Engine Logic

### 7.1 Billing Cycle

| Event | Trigger | Action |
|-------|---------|--------|
| Invoice Generation | 1st of month | Generate invoice for upcoming month |
| Payment Due | 7 days after invoice | Payment expected |
| Reminder 1 | Due date | Send payment reminder |
| Late Fee | Due + 7 days | Apply late fee |
| Suspension Warning | Due + 14 days | Send suspension warning |
| Suspension | Due + 21 days | Suspend service |
| Termination | Due + 30 days | Terminate service |

### 7.2 Pro-Rata Calculation

```
Pro-rata amount = (Monthly MRC / Days in month) × Days remaining
```

---

## 8. Margin & Cost Calculation Engine

### 8.1 Margin Calculation

```typescript
interface MarginCalculation {
  retail_price: number;      // Customer pays
  wholesale_cost: number;    // Provider charges
  infrastructure_cost: number; // BNG, backhaul, etc.
  platform_cost: number;     // BSS, support, etc.
  total_cost: number;        // Sum of all costs
  contribution_margin: number; // Retail - Total cost
  margin_percent: number;    // (Contribution / Retail) × 100
}
```

### 8.2 Cost Components

| Component | Source | Frequency |
|-----------|--------|-----------|
| [Component 1] | [Source] | [Per month / Per customer / etc.] |
| [Component 2] | [Source] | [Frequency] |

---

## 9. Provisioning Integration

### 9.1 Provisioning Workflow

```typescript
// Inngest function structure
export const provisionService = inngest.createFunction(
  {
    id: 'provision-[product]-service',
    name: 'Provision [Product] Service',
    retries: 3,
  },
  { event: '[product]/provision.requested' },
  async ({ event, step }) => {
    // Step 1: Validate order
    const order = await step.run('validate-order', async () => {
      // Validation logic
    });

    // Step 2: Call provider API
    const providerResponse = await step.run('call-provider-api', async () => {
      // Provider API call
    });

    // Step 3: Update service status
    await step.run('update-service-status', async () => {
      // Status update
    });

    // Step 4: Send completion event
    await step.run('send-completion-event', async () => {
      // Notification
    });
  }
);
```

### 9.2 Provider API Integration

| Provider | Endpoint | Auth | Rate Limit |
|----------|----------|------|------------|
| [Provider 1] | [URL] | [Auth type] | [Limit] |
| [Provider 2] | [URL] | [Auth type] | [Limit] |

---

## 10. Network Integration

### 10.1 Network Architecture

[Describe network integration points]

### 10.2 IP Addressing

| Network Segment | CIDR | Purpose |
|-----------------|------|---------|
| [Segment 1] | [CIDR] | [Purpose] |
| [Segment 2] | [CIDR] | [Purpose] |

---

## 11. CPE Management Integration

### 11.1 Device Provisioning

| Device Model | Management Platform | Zero-Touch | Firmware Updates |
|--------------|---------------------|------------|------------------|
| [Model 1] | [Platform] | [Yes/No] | [Auto/Manual] |
| [Model 2] | [Platform] | [Yes/No] | [Auto/Manual] |

---

## 12. CRM & Sales Pipeline Logic

### 12.1 Lead Status Flow

```
NEW → QUALIFIED → PROPOSAL → NEGOTIATION → WON/LOST
```

### 12.2 Pipeline Stage Definitions

| Stage | Probability | Actions |
|-------|-------------|---------|
| NEW | 10% | Initial contact |
| QUALIFIED | 25% | Needs identified |
| PROPOSAL | 50% | Quote sent |
| NEGOTIATION | 75% | Terms discussed |
| WON | 100% | Contract signed |
| LOST | 0% | Opportunity closed |

---

## 13. Support & Fault Management Logic

### 13.1 Ticket Priority Matrix

| Priority | Response SLA | Resolution SLA | Description |
|----------|--------------|----------------|-------------|
| P1 - Critical | 1 hour | 4 hours | Service down |
| P2 - High | 4 hours | 8 hours | Major degradation |
| P3 - Medium | 8 hours | 24 hours | Minor issue |
| P4 - Low | 24 hours | 72 hours | General inquiry |

---

## 14. SLA Monitoring & Service Credit Engine

### 14.1 Uptime Calculation

```typescript
uptime_percent = (
  (total_minutes - downtime_minutes) / total_minutes
) × 100;
```

### 14.2 Service Credit Calculation

```typescript
if (uptime < sla_target) {
  credit_percent = (sla_target - uptime) × credit_rate;
  credit_amount = min(credit_percent × mrc, mrc); // Cap at 100%
}
```

---

## 15. Notification & Event Engine

### 15.1 Event Types

| Event | Trigger | Channels | Recipients |
|-------|---------|----------|------------|
| [Event 1] | [Trigger] | [Email/SMS/Push] | [Recipients] |
| [Event 2] | [Trigger] | [Channels] | [Recipients] |

### 15.2 Email Templates

| Template ID | Subject | Trigger |
|-------------|---------|---------|
| [template_1] | [Subject] | [Trigger] |
| [template_2] | [Subject] | [Trigger] |

---

## 16. Reporting & Analytics Data Logic

### 16.1 Key Metrics

| Metric | Calculation | Refresh |
|--------|-------------|---------|
| MRR | SUM(active subscriptions × MRC) | Daily |
| Churn Rate | (Lost customers / Start customers) × 100 | Monthly |
| ARPU | Total revenue / Active customers | Monthly |

---

## 17. API Contract Specifications

### 17.1 Endpoint: [Name]

| Field | Value |
|-------|-------|
| Path | `[HTTP_METHOD] /api/[path]` |
| Auth | [Required] [Auth type] |
| Rate Limit | [X] requests/[period] |

**Request Body**
```json
{
  "field_name": "type — description"
}
```

**Response (Success 200)**
```json
{
  "data": { }
}
```

**Error Codes**
| Code | Message | Resolution |
|------|---------|------------|
| 400 | Bad Request | [Resolution] |
| 401 | Unauthorized | [Resolution] |
| 404 | Not Found | [Resolution] |

---

## 18. Validation Rule Register

| Rule ID | Field | Validation | Error Message |
|---------|-------|------------|---------------|
| VR-001 | [field] | [validation] | [message] |
| VR-002 | [field] | [validation] | [message] |

---

## 19. Error Handling & Recovery

### 19.1 Error Categories

| Category | Handling | Retry | Alert |
|----------|----------|-------|-------|
| Transient | Retry with backoff | 3× | After 3 failures |
| Validation | Return error | No | No |
| Critical | Fail + alert | No | Immediate |

### 19.2 Recovery Procedures

| Scenario | Recovery Steps |
|----------|----------------|
| [Scenario 1] | [Steps] |
| [Scenario 2] | [Steps] |

---

## 20. Non-Functional Requirements

### 20.1 Performance

| Metric | Target |
|--------|--------|
| API Response Time (p95) | < 500ms |
| Page Load Time | < 3s |
| Database Query Time (p95) | < 100ms |

### 20.2 Scalability

| Resource | Current | Target |
|----------|---------|--------|
| Concurrent Users | [X] | [Y] |
| Monthly Orders | [X] | [Y] |

### 20.3 Security

- All data encrypted in transit (TLS 1.3)
- All data encrypted at rest (AES-256)
- RBAC enforced on all endpoints
- Audit logging enabled

---

**END OF DOCUMENT**

*CircleTel (Pty) Ltd — A member of the New Generation Group*
*"Connecting Today, Creating Tomorrow"*
