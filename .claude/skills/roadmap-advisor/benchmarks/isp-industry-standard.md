# ISP Industry Standard Benchmark

Comprehensive capability checklist for ISP/telecom platforms in South Africa.

**Legend**:
- ✓ Standard - Expected in any production ISP platform
- ○ Optional - Nice-to-have, depends on business model
- ⭐ Emerging - Cutting-edge, competitive differentiator

---

## 1. Billing & Payments (10 Capabilities)

| # | Capability | Priority | Description | CircleTel Status |
|---|------------|----------|-------------|------------------|
| 1.1 | Recurring billing | ✓ Standard | Monthly subscription invoicing | ✅ Complete |
| 1.2 | Usage-based billing | ✓ Standard | Charge per GB, per minute, etc. | ⚠️ Basic |
| 1.3 | Tiered pricing | ✓ Standard | Volume discounts, package tiers | ✅ Complete |
| 1.4 | Overage handling | ✓ Standard | Charges beyond package limits | ❌ Missing |
| 1.5 | Proration | ✓ Standard | Mid-cycle upgrade/downgrade adjustments | ❌ Missing |
| 1.6 | Credit management | ✓ Standard | Refunds, adjustments, credits | ⚠️ Basic |
| 1.7 | Multi-currency | ○ Optional | Support for USD, EUR, etc. | ❌ ZAR only |
| 1.8 | Dunning automation | ✓ Standard | Multi-step collection workflow | ⚠️ Partial |
| 1.9 | Payment reconciliation | ✓ Standard | Bank feed matching | ⚠️ Semi-auto |
| 1.10 | Late payment penalties | ○ Optional | Configurable fee structure | ❌ Missing |

### Payment Methods

| # | Method | Priority | CircleTel Status |
|---|--------|----------|------------------|
| P.1 | Credit/Debit Card | ✓ Standard | ✅ NetCash |
| P.2 | Debit Order (eMandate) | ✓ Standard | ✅ Complete |
| P.3 | EFT | ✓ Standard | ✅ NetCash |
| P.4 | Mobile Money | ○ Optional | ⚠️ Via NetCash |
| P.5 | Buy Now Pay Later | ○ Optional | ✅ Mobicred/Payflex |
| P.6 | Cryptocurrency | ○ Optional | ❌ Not implemented |
| P.7 | Cash at Store | ○ Optional | ❌ Not implemented |

---

## 2. Network & Service (10 Capabilities)

| # | Capability | Priority | Description | CircleTel Status |
|---|------------|----------|-------------|------------------|
| 2.1 | Real-time uptime monitoring | ✓ Standard | Per-customer, per-provider health | ❌ Missing |
| 2.2 | Bandwidth usage graphs | ✓ Standard | Historical and real-time usage | ⚠️ Basic |
| 2.3 | Speed test integration | ✓ Standard | In-portal connection testing | ❌ Missing |
| 2.4 | Outage notifications | ✓ Standard | Proactive alerts for maintenance/issues | ⚠️ Partial |
| 2.5 | SLA tracking | ✓ Standard | Uptime %, response time SLAs | ❌ Missing |
| 2.6 | Auto service credits | ✓ Standard | Credits for SLA breaches | ❌ Missing |
| 2.7 | PPPoE management | ✓ Standard | Credential generation, session tracking | ✅ Complete |
| 2.8 | Router diagnostics | ○ Optional | Remote troubleshooting | ❌ Missing |
| 2.9 | QoS configuration | ○ Optional | Priority traffic settings | ❌ Missing |
| 2.10 | Multi-WAN failover | ⭐ Emerging | Automatic backup connection | ❌ Missing |

### Provider Health

| # | Capability | Priority | CircleTel Status |
|---|------------|----------|------------------|
| PH.1 | MTN coverage status | ✓ Standard | ✅ API integrated |
| PH.2 | Vumatel status | ✓ Standard | ✅ API integrated |
| PH.3 | Openserve status | ✓ Standard | ✅ API integrated |
| PH.4 | Provider health dashboard | ✓ Standard | ❌ Admin dashboard missing |
| PH.5 | Automated failover | ⭐ Emerging | ❌ Missing |

---

## 3. Customer Experience (10 Capabilities)

| # | Capability | Priority | Description | CircleTel Status |
|---|------------|----------|-------------|------------------|
| 3.1 | Self-service portal | ✓ Standard | Customer dashboard | ✅ Complete |
| 3.2 | Package upgrade/downgrade | ✓ Standard | 1-click service changes | ⚠️ Basic flow |
| 3.3 | Service pause/resume | ✓ Standard | Temporary suspension | ❌ Missing |
| 3.4 | Cancellation flow | ✓ Standard | Self-service cancellation | ❌ Must call |
| 3.5 | Knowledge base | ✓ Standard | Searchable FAQ/help articles | ❌ Missing |
| 3.6 | Support ticketing | ✓ Standard | Create, track, resolve | ⚠️ Basic |
| 3.7 | Live chat | ○ Optional | Real-time support | ❌ Missing |
| 3.8 | Chatbot | ○ Optional | Automated FAQ responses | ❌ Missing |
| 3.9 | Mobile app | ○ Optional | Native iOS/Android | ❌ Missing |
| 3.10 | NPS/CSAT tracking | ✓ Standard | Satisfaction measurement | ❌ Missing |

### Communication Channels

| # | Channel | Priority | CircleTel Status |
|---|---------|----------|------------------|
| C.1 | Email transactional | ✓ Standard | ✅ Resend |
| C.2 | SMS transactional | ✓ Standard | ✅ Clickatell |
| C.3 | WhatsApp | ○ Optional | ⚠️ Link only |
| C.4 | In-app notifications | ✓ Standard | ❌ Missing |
| C.5 | Push notifications | ○ Optional | ❌ No mobile app |

---

## 4. Operations (6 Capabilities)

| # | Capability | Priority | Description | CircleTel Status |
|---|------------|----------|-------------|------------------|
| 4.1 | Automated provisioning | ✓ Standard | Service activation workflow | ⚠️ Partial |
| 4.2 | RICA compliance | ✓ Standard | Regulatory ID verification | ✅ Complete |
| 4.3 | Installation scheduling | ✓ Standard | Technician dispatch | ✅ Complete |
| 4.4 | Technician app | ○ Optional | Mobile field service | ❌ Missing |
| 4.5 | Inventory management | ✓ Standard | Equipment tracking | ❌ Missing |
| 4.6 | SIM/router tracking | ✓ Standard | Serial number management | ❌ Missing |

---

## 5. Partner/Reseller (5 Capabilities)

| # | Capability | Priority | Description | CircleTel Status |
|---|------------|----------|-------------|------------------|
| 5.1 | Partner portal | ✓ Standard | Dedicated reseller access | ✅ Complete |
| 5.2 | Commission tracking | ✓ Standard | Sales attribution | ⚠️ Basic |
| 5.3 | Commission automation | ✓ Standard | Auto-calculate, auto-pay | ❌ Missing |
| 5.4 | White-label options | ○ Optional | Branded customer experience | ❌ Missing |
| 5.5 | Partner API | ○ Optional | Programmatic access | ⚠️ Limited |

### Compliance

| # | Capability | Priority | CircleTel Status |
|---|------------|----------|------------------|
| CP.1 | FICA document upload | ✓ Standard | ✅ 13 categories |
| CP.2 | CIPC verification | ✓ Standard | ✅ Complete |
| CP.3 | Compliance status tracking | ✓ Standard | ✅ Complete |
| CP.4 | Document expiry alerts | ○ Optional | ❌ Missing |

---

## 6. Analytics & Reporting (12 Capabilities)

| # | Capability | Priority | Description | CircleTel Status |
|---|------------|----------|-------------|------------------|
| 6.1 | Revenue dashboards | ✓ Standard | MRR, ARR, growth | ⚠️ Basic |
| 6.2 | Customer analytics | ✓ Standard | Acquisition, churn, LTV | ❌ Missing |
| 6.3 | Churn prediction | ⭐ Emerging | ML-based early warning | ❌ Missing |
| 6.4 | Geographic analytics | ✓ Standard | Sales by region | ❌ Missing |
| 6.5 | Provider analytics | ✓ Standard | Performance by provider | ❌ Missing |
| 6.6 | Competitor tracking | ○ Optional | Market intelligence | ⚠️ Planned |
| 6.7 | Custom report builder | ○ Optional | Drag-drop reports | ❌ Missing |
| 6.8 | Scheduled reports | ✓ Standard | Email delivery | ❌ Missing |
| 6.9 | Export functionality | ✓ Standard | CSV, PDF export | ✅ Available |
| 6.10 | Cohort analysis | ⭐ Emerging | Retention by signup cohort | ❌ Missing |
| 6.11 | Predictive forecasting | ⭐ Emerging | Revenue prediction | ❌ Missing |
| 6.12 | Real-time dashboards | ○ Optional | Live metrics | ❌ Missing |

---

## 7. Admin & Security (8 Capabilities)

| # | Capability | Priority | Description | CircleTel Status |
|---|------------|----------|-------------|------------------|
| 7.1 | Role-based access (RBAC) | ✓ Standard | Granular permissions | ✅ 17 roles, 100+ perms |
| 7.2 | Audit logging | ✓ Standard | Action tracking | ✅ Complete |
| 7.3 | Multi-factor auth | ✓ Standard | 2FA for admin | ⚠️ Partial |
| 7.4 | SSO integration | ○ Optional | SAML, OAuth | ❌ Missing |
| 7.5 | IP whitelisting | ○ Optional | Restrict admin access | ❌ Missing |
| 7.6 | Data encryption | ✓ Standard | At rest and in transit | ✅ Supabase |
| 7.7 | POPIA compliance | ✓ Standard | SA privacy law | ✅ Complete |
| 7.8 | Backup & recovery | ✓ Standard | Data protection | ✅ Supabase |

---

## Summary Scorecard

| Category | Total | Implemented | Partial | Missing | Score |
|----------|-------|-------------|---------|---------|-------|
| Billing & Payments | 17 | 8 | 4 | 5 | 59% |
| Network & Service | 15 | 4 | 2 | 9 | 33% |
| Customer Experience | 15 | 3 | 4 | 8 | 33% |
| Operations | 6 | 3 | 1 | 2 | 58% |
| Partner/Reseller | 9 | 4 | 2 | 3 | 56% |
| Analytics & Reporting | 12 | 1 | 2 | 9 | 17% |
| Admin & Security | 8 | 6 | 1 | 1 | 81% |
| **TOTAL** | **82** | **29** | **16** | **37** | **45%** |

---

## Priority Gap Analysis

### Critical Gaps (Must Have - Missing)

| Gap | Business Impact | Customer Impact | Priority Score |
|-----|-----------------|-----------------|----------------|
| Network uptime monitoring | 9 | 10 | 9.3 |
| SLA tracking & credits | 8 | 9 | 8.4 |
| Usage-based billing | 9 | 6 | 7.8 |
| Knowledge base | 5 | 8 | 6.5 |
| Dunning automation | 8 | 4 | 6.4 |
| Churn analytics | 8 | 3 | 6.0 |

### High-Value Gaps (Standard - Partial)

| Gap | Business Impact | Customer Impact | Priority Score |
|-----|-----------------|-----------------|----------------|
| Commission automation | 7 | 2 | 5.2 |
| Service pause/resume | 4 | 7 | 5.2 |
| In-app notifications | 4 | 6 | 4.8 |
| Reconciliation automation | 6 | 2 | 4.4 |

### Strategic Gaps (Emerging/Optional)

| Gap | Business Impact | Customer Impact | Priority Score |
|-----|-----------------|-----------------|----------------|
| Churn prediction (ML) | 9 | 3 | 6.6 |
| Mobile app | 4 | 7 | 5.2 |
| Live chat | 3 | 6 | 4.2 |
| Cohort analytics | 6 | 1 | 4.0 |

---

## Competitive Benchmarks

### South African ISP Landscape

| Provider | Billing | Network | CX | Operations | Analytics |
|----------|---------|---------|-----|------------|-----------|
| Afrihost | 9/10 | 8/10 | 8/10 | 7/10 | 7/10 |
| WebAfrica | 8/10 | 7/10 | 7/10 | 7/10 | 6/10 |
| Supersonic | 8/10 | 8/10 | 8/10 | 7/10 | 6/10 |
| Cool Ideas | 7/10 | 7/10 | 7/10 | 6/10 | 5/10 |
| **CircleTel** | **7/10** | **4/10** | **5/10** | **6/10** | **3/10** |

### Gap to Industry Leader

| Domain | CircleTel | Leader | Gap |
|--------|-----------|--------|-----|
| Billing | 7/10 | 9/10 | -2 |
| Network | 4/10 | 8/10 | -4 |
| CX | 5/10 | 8/10 | -3 |
| Operations | 6/10 | 7/10 | -1 |
| Analytics | 3/10 | 7/10 | -4 |

---

## Implementation Roadmap Suggestion

### Q1 2026 (Critical Foundation)
1. Network uptime monitoring (XL - 6 weeks)
2. SLA tracking (L - 3 weeks)
3. Knowledge base (M - 2 weeks)

### Q2 2026 (Revenue & Retention)
1. Usage-based billing (L - 3 weeks)
2. Dunning automation (M - 2 weeks)
3. Churn analytics (M - 2 weeks)

### Q3 2026 (Customer Experience)
1. Self-service improvements (M - 2 weeks)
2. In-app notifications (S - 1 week)
3. NPS tracking (S - 1 week)

### Q4 2026 (Scale & Differentiate)
1. Churn prediction ML (L - 4 weeks)
2. Mobile app MVP (XL - 8 weeks)
3. Advanced analytics (L - 3 weeks)

---

**Last Updated**: 2026-02-12
**Source**: ISP industry analysis, competitor research, CircleTel codebase audit
