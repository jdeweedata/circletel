# Customer Experience Rubric

Evaluate customer-facing experience and self-service capabilities.

## Scoring Criteria

| Criterion | Weight | 10 | 5 | 1 |
|-----------|--------|----|----|---|
| **Self-Service Coverage** | 30% | 90% issues resolvable without support | 50% self-resolvable | Must call for everything |
| **Information Access** | 25% | Real-time, complete info | Delayed or partial | Must call for info |
| **Communication** | 20% | Proactive multi-channel | Reactive only | Minimal communication |
| **Support Channels** | 15% | Phone, chat, email, portal | 2 channels | Email only |
| **Feedback Loop** | 10% | NPS, surveys, action tracking | Basic feedback form | No mechanism |

## CircleTel Thresholds

| Score | Status | Action |
|-------|--------|--------|
| 8-10 | Delightful | Maintain and innovate |
| 6-7 | Acceptable | Enhance based on feedback |
| 4-5 | Frustrating | Prioritize CX improvements |
| 1-3 | Broken | Emergency intervention |

## Self-Service Capabilities

### Account Management
| Capability | Status | Location |
|------------|--------|----------|
| View account details | ✅ | `/dashboard` |
| Update contact info | ✅ | `/dashboard/settings` |
| Change password | ✅ | Auth flow |
| View service status | ✅ | `/dashboard` |
| Manage payment methods | ✅ | `/dashboard/billing` |

### Billing & Payments
| Capability | Status | Location |
|------------|--------|----------|
| View invoices | ✅ | `/dashboard/billing` |
| Pay outstanding balance | ✅ | Pay Now integration |
| Download invoice PDF | ⚠️ | Partial implementation |
| View payment history | ✅ | `/dashboard/billing` |
| Update billing address | ⚠️ | Limited |
| Set up debit order | ✅ | eMandate flow |

### Service Management
| Capability | Status | Location |
|------------|--------|----------|
| View service details | ✅ | `/dashboard` |
| Request upgrade | ⚠️ | Basic flow |
| Request downgrade | ⚠️ | Basic flow |
| Pause service | ❌ | Not implemented |
| Cancel service | ❌ | Must call |
| View usage | ⚠️ | Basic usage_history |

### Support & Troubleshooting
| Capability | Status | Location |
|------------|--------|----------|
| Create support ticket | ⚠️ | Basic |
| View ticket status | ⚠️ | Basic |
| Knowledge base | ❌ | Not implemented |
| Self-service diagnostics | ❌ | Not implemented |
| Speed test | ❌ | Not implemented |
| Outage notifications | ⚠️ | Partial |

## Communication Channels

### Implemented
| Channel | Type | Trigger |
|---------|------|---------|
| Email (Resend) | Transactional | Invoices, confirmations |
| SMS (Clickatell) | Transactional | OTP, billing reminders |
| WhatsApp link | Support | Contact page |

### Missing
| Channel | Priority | Use Case |
|---------|----------|----------|
| In-app notifications | Medium | Real-time updates |
| Push notifications | Low | Mobile app required |
| Live chat | Medium | Instant support |
| Chatbot | Low | FAQ automation |

## Customer Journey Touchpoints

```
┌─────────────────────────────────────────────────────────────────┐
│                 CUSTOMER JOURNEY ANALYSIS                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   DISCOVER ──► EVALUATE ──► PURCHASE ──► ONBOARD ──► USE         │
│      ✅           ✅           ✅           ⚠️          ⚠️        │
│                                                                  │
│   USE ──► SUPPORT ──► BILLING ──► RENEW/CHURN                    │
│    ⚠️        ⚠️          ✅           ❌                          │
│                                                                  │
│   ✅ = Strong  |  ⚠️ = Needs Work  |  ❌ = Gap                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Evaluation Prompt

When scoring customer experience:

1. Check dashboard features: `app/(dashboard)/`
2. Review self-service flows: upgrade, payment, support
3. Check communication templates: `lib/notifications/`
4. Look for feedback mechanisms: NPS, surveys
5. Review support ticketing: `app/dashboard/support/`
6. Check for proactive alerts: outage, billing, usage

## Quick Assessment

```
CX Area: [Overall/Self-Service/Communication/Support/Feedback]

Self-Service:        _/10 × 0.30 = _
Information Access:  _/10 × 0.25 = _
Communication:       _/10 × 0.20 = _
Support Channels:    _/10 × 0.15 = _
Feedback Loop:       _/10 × 0.10 = _
──────────────────────────────────
Total Score:         _/10
Status:              [Delightful/Acceptable/Frustrating/Broken]
```

## Industry Comparison

### CircleTel vs Industry Average

| Capability | CircleTel | Industry | Gap |
|------------|-----------|----------|-----|
| Account self-service | 8/10 | 8/10 | ✅ Match |
| Billing self-service | 8/10 | 8/10 | ✅ Match |
| Service management | 5/10 | 7/10 | ⚠️ Below |
| Support/troubleshooting | 4/10 | 7/10 | ❌ Below |
| Knowledge base | 1/10 | 7/10 | ❌ Missing |
| Mobile app | 1/10 | 5/10 | ❌ Missing |
| Proactive communication | 5/10 | 7/10 | ⚠️ Below |
| NPS/feedback | 2/10 | 6/10 | ❌ Below |

**Overall**: Good billing self-service, significant gaps in support and proactive communication.

## Priority Recommendations

1. **Knowledge Base** - Reduce support load, improve self-service
2. **Service Management** - Pause/cancel without calling
3. **NPS Tracking** - Measure and improve satisfaction
4. **Proactive Alerts** - Usage warnings, outage notifications
5. **Self-Service Diagnostics** - Speed tests, connection checks
